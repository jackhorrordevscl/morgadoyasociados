const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
const http = require('node:http');
const net = require('node:net');
const os = require('node:os');
const path = require('node:path');
const { spawn } = require('node:child_process');

const projectRoot = path.resolve(__dirname, '..');
const webRoot = path.join(projectRoot, 'web');
const localWindowsPhp = 'C:\\tools\\php85\\php.exe';
const phpBinary = process.env.PHP_BINARY
  || (process.platform === 'win32' && fs.existsSync(localWindowsPhp) ? localWindowsPhp : 'php');
const rateLimitFile = path.join(
  os.tmpdir(),
  'morgado-contact-ratelimit',
  `${crypto.createHash('sha256').update('127.0.0.1').digest('hex')}.json`,
);

function clearRateLimit() {
  fs.rmSync(rateLimitFile, { force: true });
}

function createTestWebRoot(tempRoot, name) {
  const destination = path.join(tempRoot, name);
  fs.cpSync(webRoot, destination, {
    recursive: true,
    filter: (source) => source !== path.join(webRoot, 'mail-config.php'),
  });
  return destination;
}

function reservePort() {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.once('error', reject);
    server.listen(0, '127.0.0.1', () => {
      const { port } = server.address();
      server.close((error) => (error ? reject(error) : resolve(port)));
    });
  });
}

async function startPhpServer(documentRoot, extraArgs = []) {
  const port = await reservePort();
  const child = spawn(phpBinary, [...extraArgs, '-d', 'display_errors=0', '-S', `127.0.0.1:${port}`, '-t', documentRoot], {
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  const startup = await new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`PHP server did not start: ${phpBinary}`)), 5000);
    const onData = (data) => {
      if (data.toString().includes('Development Server')) {
        clearTimeout(timer);
        resolve();
      }
    };
    child.stdout.on('data', onData);
    child.stderr.on('data', onData);
    child.once('error', (error) => {
      clearTimeout(timer);
      reject(error);
    });
    child.once('exit', (code) => {
      clearTimeout(timer);
      reject(new Error(`PHP server exited before startup with code ${code}`));
    });
  });
  void startup;

  return {
    baseUrl: `http://127.0.0.1:${port}`,
    stop: () => new Promise((resolve) => {
      child.once('exit', resolve);
      child.kill();
    }),
  };
}

function post(baseUrl, fields) {
  const body = new URLSearchParams(fields).toString();
  return new Promise((resolve, reject) => {
    const request = http.request(`${baseUrl}/send-mail.php`, {
      method: 'POST',
      headers: {
        'content-type': 'application/x-www-form-urlencoded',
        'content-length': Buffer.byteLength(body),
      },
    }, (response) => {
      let raw = '';
      response.setEncoding('utf8');
      response.on('data', (chunk) => { raw += chunk; });
      response.on('end', () => resolve({ status: response.statusCode, raw, headers: response.headers }));
    });
    request.once('error', reject);
    request.end(body);
  });
}

async function assertJsonResponse(server, fields, expectedStatus, expectedMessage) {
  clearRateLimit();
  const response = await post(server.baseUrl, fields);
  assert.equal(response.status, expectedStatus);
  assert.match(response.headers['content-type'] || '', /^application\/json/);
  assert.deepEqual(JSON.parse(response.raw), {
    success: false,
    message: expectedMessage || (expectedStatus === 422
      ? expectedStatus === 422 && fields.privacy_consent !== 'accepted'
        ? 'Debe aceptar la Política de Privacidad para enviar su consulta.'
        : 'Por favor ingrese un correo electrónico válido.'
      : 'El servicio de contacto no está disponible. Intente nuevamente más tarde.'),
  });
}

async function assertLengthBoundary(server, fields, field, maxLength) {
  await assertJsonResponse(server, { ...fields, [field]: 'a'.repeat(maxLength) }, 503);
  await assertJsonResponse(
    server,
    { ...fields, [field]: 'a'.repeat(maxLength + 1) },
    422,
    'Uno de los campos supera la longitud permitida.',
  );
}

async function run() {
  const endpointSource = fs.readFileSync(path.join(webRoot, 'send-mail.php'), 'utf8');
  assert.match(
    endpointSource,
    /\$smtpConnectionTimeout\s*=\s*20\s*;\s*\$mail->Timeout\s*=\s*\$smtpConnectionTimeout\s*;/,
    'The SMTP connection timeout must remain bounded at 20 seconds.',
  );

  const validFields = {
    privacy_consent: 'accepted',
    nombre: 'Prueba local',
    email: 'prueba@example.test',
    mensaje: 'Mensaje de prueba local.',
  };
  const normalServer = await startPhpServer(webRoot);
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'morgado-mail-test-'));

  try {
    await assertJsonResponse(normalServer, { nombre: 'Prueba', email: 'prueba@example.test', mensaje: 'Mensaje' }, 422);
    await assertJsonResponse(normalServer, { ...validFields, email: 'invalido' }, 422);

    const noConfigServer = await startPhpServer(createTestWebRoot(tempRoot, 'no-config'));
    try {
      await assertJsonResponse(noConfigServer, validFields, 503);
      await assertLengthBoundary(noConfigServer, validFields, 'nombre', 150);
      await assertLengthBoundary(noConfigServer, validFields, 'telefono', 40);
      await assertLengthBoundary(noConfigServer, validFields, 'area', 100);
      await assertLengthBoundary(noConfigServer, validFields, 'mensaje', 5000);

      const maxEmail = `${'a'.repeat(64)}@${'b'.repeat(63)}.${'c'.repeat(63)}.${'d'.repeat(61)}`;
      assert.equal(maxEmail.length, 254);
      await assertJsonResponse(noConfigServer, { ...validFields, email: maxEmail }, 503);
      await assertJsonResponse(
        noConfigServer,
        { ...validFields, email: `${maxEmail}a` },
        422,
        'Uno de los campos supera la longitud permitida.',
      );
    } finally {
      await noConfigServer.stop();
    }

    const invalidConfigRoot = createTestWebRoot(tempRoot, 'invalid-config');
    fs.writeFileSync(path.join(invalidConfigRoot, 'mail-config.php'), '<?php return [];');
    const invalidConfigServer = await startPhpServer(invalidConfigRoot);
    try {
      await assertJsonResponse(invalidConfigServer, validFields, 503);
    } finally {
      await invalidConfigServer.stop();
    }

    const unloadableConfigRoot = createTestWebRoot(tempRoot, 'unloadable-config');
    fs.writeFileSync(path.join(unloadableConfigRoot, 'mail-config.php'), "<?php throw new RuntimeException('local test');");
    const unloadableConfigServer = await startPhpServer(unloadableConfigRoot);
    try {
      await assertJsonResponse(unloadableConfigServer, validFields, 503);
    } finally {
      await unloadableConfigServer.stop();
    }

    const noExtensionsServer = await startPhpServer(webRoot, ['-n']);
    try {
      await assertJsonResponse(noExtensionsServer, validFields, 503);
    } finally {
      await noExtensionsServer.stop();
    }

    const smtpFailureRoot = path.join(tempRoot, 'smtp-failure');
    createTestWebRoot(tempRoot, 'smtp-failure');
    fs.writeFileSync(path.join(smtpFailureRoot, 'mail-config.php'), `<?php
return [
    'smtp_host' => '127.0.0.1',
    'smtp_port' => 1,
    'smtp_user' => 'test-sender@example.test',
    'smtp_pass' => 'not-a-secret',
    'smtp_secure' => 'tls',
    'to_email' => 'test-recipient@example.test',
    'to_name' => 'Local test recipient',
];
`);
    const smtpFailureServer = await startPhpServer(smtpFailureRoot);
    try {
      await assertJsonResponse(
        smtpFailureServer,
        validFields,
        503,
        'No se pudo enviar su consulta. Intente nuevamente más tarde.',
      );
    } finally {
      await smtpFailureServer.stop();
    }
  } finally {
    clearRateLimit();
    await normalServer.stop();
    fs.rmSync(tempRoot, { recursive: true, force: true });
  }
}

run()
  .then(() => console.log('Mail endpoint contract verified.'))
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
