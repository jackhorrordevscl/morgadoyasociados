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

function writeMailConfig(documentRoot, smtpPort, secure = 'tls') {
  fs.writeFileSync(path.join(documentRoot, 'mail-config.php'), `<?php
return [
    'smtp_host' => '127.0.0.1',
    'smtp_port' => ${smtpPort},
    'smtp_user' => 'test-sender@example.test',
    'smtp_pass' => 'not-a-secret',
    'smtp_secure' => '${secure}',
    'to_email' => 'test-recipient@example.test',
    'to_name' => 'Local test recipient',
];
`);
}

function useFixtureRateLimitDirectory(documentRoot) {
  const endpoint = path.join(documentRoot, 'rate-limiter.php');
  const source = fs.readFileSync(endpoint, 'utf8');
  const updated = source.replace(
    "$dir = sys_get_temp_dir() . '/' . $namespace;",
    "$dir = __DIR__ . '/' . $namespace;",
  );
  assert.notEqual(updated, source, 'The fixture must redirect rate-limit storage.');
  fs.writeFileSync(endpoint, updated);
}

function writeFixtureRateLimitState(documentRoot, state) {
  const directory = path.join(documentRoot, 'morgado-contact-ratelimit');
  fs.mkdirSync(directory, { recursive: true, mode: 0o700 });
  fs.writeFileSync(
    path.join(directory, `${crypto.createHash('sha256').update('127.0.0.1').digest('hex')}.json`),
    state,
  );
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

async function startSmtpProbe() {
  let connections = 0;
  const server = net.createServer((socket) => {
    connections += 1;
    socket.destroy();
  });
  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', resolve);
  });
  const { port } = server.address();
  return {
    port,
    connections: () => connections,
    stop: () => new Promise((resolve, reject) => server.close((error) => (error ? reject(error) : resolve()))),
  };
}

/**
 * Minimal SMTP server that completes the full protocol handshake PHPMailer
 * drives (EHLO, AUTH LOGIN, MAIL FROM, RCPT TO, DATA, QUIT) so tests can
 * exercise a genuinely successful delivery instead of only opening a TCP
 * socket. It deliberately does not advertise a STARTTLS extension, and the
 * caller must configure `smtp_secure` to a value other than 'tls'/'ssl' so
 * PHPMailer's SMTPAutoTLS does not attempt an encrypted handshake this mock
 * cannot serve.
 */
function startSuccessfulSmtpServer() {
  const deliveries = [];
  let connectionCount = 0;

  const server = net.createServer((socket) => {
    connectionCount += 1;
    const ctx = { authStage: null, mode: 'command', dataBuffer: '', mailFrom: null, rcptTo: null };
    let buffer = '';

    function handleCommandLine(line) {
      if (ctx.authStage === 'username') {
        ctx.authStage = 'password';
        socket.write('334 UGFzc3dvcmQ6\r\n');
        return;
      }
      if (ctx.authStage === 'password') {
        ctx.authStage = null;
        socket.write('235 2.7.0 Authentication successful\r\n');
        return;
      }

      const command = line.split(' ')[0].toUpperCase();
      switch (command) {
        case 'EHLO':
        case 'HELO':
          socket.write('250-localhost greets you\r\n250 AUTH LOGIN PLAIN\r\n');
          break;
        case 'AUTH':
          ctx.authStage = 'username';
          socket.write('334 VXNlcm5hbWU6\r\n');
          break;
        case 'MAIL':
          ctx.mailFrom = line;
          socket.write('250 2.1.0 OK\r\n');
          break;
        case 'RCPT':
          ctx.rcptTo = line;
          socket.write('250 2.1.5 OK\r\n');
          break;
        case 'DATA':
          ctx.mode = 'data';
          ctx.dataBuffer = '';
          socket.write('354 End data with <CR><LF>.<CR><LF>\r\n');
          break;
        case 'QUIT':
          socket.write('221 2.0.0 Bye\r\n');
          socket.end();
          break;
        default:
          socket.write('502 5.5.1 Command not implemented\r\n');
      }
    }

    socket.write('220 localhost ESMTP test mock\r\n');

    socket.on('data', (chunk) => {
      buffer += chunk.toString('utf8');

      if (ctx.mode === 'data') {
        const terminator = '\r\n.\r\n';
        const terminatorIndex = buffer.indexOf(terminator);
        if (terminatorIndex === -1) {
          return;
        }
        ctx.dataBuffer += buffer.slice(0, terminatorIndex);
        buffer = buffer.slice(terminatorIndex + terminator.length);
        ctx.mode = 'command';
        deliveries.push({ mailFrom: ctx.mailFrom, rcptTo: ctx.rcptTo, body: ctx.dataBuffer });
        socket.write('250 2.0.0 OK: queued as test-mock\r\n');
      }

      let newlineIndex;
      while (ctx.mode === 'command' && (newlineIndex = buffer.indexOf('\r\n')) !== -1) {
        const line = buffer.slice(0, newlineIndex);
        buffer = buffer.slice(newlineIndex + 2);
        handleCommandLine(line);
      }
    });
  });

  return new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', () => {
      const { port } = server.address();
      resolve({
        port,
        deliveries: () => deliveries,
        connections: () => connectionCount,
        stop: () => new Promise((res, rej) => server.close((error) => (error ? rej(error) : res()))),
      });
    });
  });
}

function lockFixtureRateLimitFile(documentRoot) {
  const scriptPath = path.join(documentRoot, 'lock-rate-limit.php');
  fs.writeFileSync(scriptPath, `<?php
$directory = __DIR__ . '/morgado-contact-ratelimit';
if (!is_dir($directory) && !mkdir($directory, 0700, true) && !is_dir($directory)) {
    exit(1);
}
$file = $directory . '/' . hash('sha256', '127.0.0.1') . '.json';
$handle = fopen($file, 'c+');
if ($handle === false || !flock($handle, LOCK_EX)) {
    exit(1);
}
echo "locked\\n";
sleep(30);
`);
  const child = spawn(phpBinary, [scriptPath], { stdio: ['ignore', 'pipe', 'pipe'] });
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('Rate-limit lock helper did not acquire the lock.')), 5000);
    child.stdout.once('data', (data) => {
      clearTimeout(timer);
      if (data.toString() === 'locked\n') {
        resolve(child);
      } else {
        reject(new Error(`Rate-limit lock helper failed: ${data}`));
      }
    });
    child.once('error', (error) => {
      clearTimeout(timer);
      reject(error);
    });
    child.once('exit', (code) => {
      clearTimeout(timer);
      reject(new Error(`Rate-limit lock helper exited with code ${code}`));
    });
  });
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

    const smtpProbe = await startSmtpProbe();
    try {
      const storageFailureRoot = createTestWebRoot(tempRoot, 'storage-failure');
      writeMailConfig(storageFailureRoot, smtpProbe.port);
      useFixtureRateLimitDirectory(storageFailureRoot);
      fs.writeFileSync(path.join(storageFailureRoot, 'morgado-contact-ratelimit'), 'blocked');
      const storageFailureServer = await startPhpServer(storageFailureRoot);
      try {
        await assertJsonResponse(storageFailureServer, validFields, 503);
        assert.equal(smtpProbe.connections(), 0, 'Unavailable rate-limit storage must prevent SMTP delivery.');
      } finally {
        await storageFailureServer.stop();
      }

      const lockFailureRoot = createTestWebRoot(tempRoot, 'lock-failure');
      writeMailConfig(lockFailureRoot, smtpProbe.port);
      useFixtureRateLimitDirectory(lockFailureRoot);
      const lockHelper = await lockFixtureRateLimitFile(lockFailureRoot);
      const lockFailureServer = await startPhpServer(lockFailureRoot);
      try {
        await assertJsonResponse(lockFailureServer, validFields, 503);
        assert.equal(smtpProbe.connections(), 0, 'Unavailable rate-limit locking must prevent SMTP delivery.');
      } finally {
        await lockFailureServer.stop();
        lockHelper.kill();
      }

      const malformedStateRoot = createTestWebRoot(tempRoot, 'malformed-rate-limit-state');
      writeMailConfig(malformedStateRoot, smtpProbe.port);
      useFixtureRateLimitDirectory(malformedStateRoot);
      writeFixtureRateLimitState(malformedStateRoot, '{invalid json');
      const malformedStateServer = await startPhpServer(malformedStateRoot);
      try {
        await assertJsonResponse(malformedStateServer, validFields, 503);
        assert.equal(smtpProbe.connections(), 0, 'Malformed rate-limit state must prevent SMTP delivery.');
      } finally {
        await malformedStateServer.stop();
      }

      const invalidStateRoot = createTestWebRoot(tempRoot, 'invalid-rate-limit-state');
      writeMailConfig(invalidStateRoot, smtpProbe.port);
      useFixtureRateLimitDirectory(invalidStateRoot);
      writeFixtureRateLimitState(invalidStateRoot, '{"timestamps":"invalid"}');
      const invalidStateServer = await startPhpServer(invalidStateRoot);
      try {
        await assertJsonResponse(invalidStateServer, validFields, 503);
        assert.equal(smtpProbe.connections(), 0, 'Invalid rate-limit state must prevent SMTP delivery.');
      } finally {
        await invalidStateServer.stop();
      }
    } finally {
      await smtpProbe.stop();
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

    const successSmtp = await startSuccessfulSmtpServer();
    try {
      const successRoot = createTestWebRoot(tempRoot, 'smtp-success');
      writeMailConfig(successRoot, successSmtp.port, 'none');
      const successServer = await startPhpServer(successRoot);
      try {
        clearRateLimit();
        const response = await post(successServer.baseUrl, validFields);
        assert.equal(response.status, 200);
        assert.match(response.headers['content-type'] || '', /^application\/json/);
        assert.deepEqual(JSON.parse(response.raw), { success: true, message: '' });
        assert.equal(successSmtp.connections(), 1, 'A successful send must complete exactly one SMTP handshake.');

        const [delivery] = successSmtp.deliveries();
        assert.ok(delivery, 'The mock SMTP server must record a fully delivered message.');
        assert.match(delivery.mailFrom, /MAIL FROM:<test-sender@example\.test>/);
        assert.match(delivery.rcptTo, /RCPT TO:<test-recipient@example\.test>/);
        assert.match(delivery.body, /Nombre: Prueba local/);
      } finally {
        await successServer.stop();
      }
    } finally {
      await successSmtp.stop();
    }

    const rateLimitSmtp = await startSuccessfulSmtpServer();
    try {
      const rateLimitRoot = createTestWebRoot(tempRoot, 'rate-limit-exhaustion');
      writeMailConfig(rateLimitRoot, rateLimitSmtp.port, 'none');
      useFixtureRateLimitDirectory(rateLimitRoot);

      // send-mail.php enforces maxRequests: 5 within a 900s window. Seed 4
      // prior, well-spaced timestamps (each far older than the 15s
      // minSecondsBetween gate) so the very next real request is the 5th
      // valid send allowed by the count limit, and the one right after it
      // is the 6th, which must be rejected purely because the count has
      // been exhausted. Driving 5 real requests 15s apart would make this
      // test correct but ~75s slower without exercising a different code
      // path, so the first 4 "requests" are seeded state instead of live
      // traffic.
      const now = Math.floor(Date.now() / 1000);
      writeFixtureRateLimitState(
        rateLimitRoot,
        JSON.stringify({ timestamps: [now - 500, now - 400, now - 300, now - 200] }),
      );

      const rateLimitServer = await startPhpServer(rateLimitRoot);
      try {
        const fifthResponse = await post(rateLimitServer.baseUrl, validFields);
        assert.equal(fifthResponse.status, 200, 'The 5th valid send within the window must still succeed.');
        assert.deepEqual(JSON.parse(fifthResponse.raw), { success: true, message: '' });

        const sixthResponse = await post(rateLimitServer.baseUrl, validFields);
        assert.equal(sixthResponse.status, 429, 'The 6th send must be rejected once the request count is exhausted.');
        assert.deepEqual(JSON.parse(sixthResponse.raw), {
          success: false,
          message: 'Ha enviado demasiadas solicitudes. Por favor intente nuevamente en unos minutos.',
        });

        assert.equal(
          rateLimitSmtp.connections(),
          1,
          'A rate-limited request must never reach the SMTP server.',
        );
      } finally {
        await rateLimitServer.stop();
      }
    } finally {
      await rateLimitSmtp.stop();
    }

    const floodSmtp = await startSuccessfulSmtpServer();
    try {
      const floodRoot = createTestWebRoot(tempRoot, 'rate-limit-flood-gate');
      writeMailConfig(floodRoot, floodSmtp.port, 'none');
      useFixtureRateLimitDirectory(floodRoot);

      // Seed a single timestamp 5s ago: far below the maxRequests: 5 count
      // limit, but inside the minSecondsBetween: 15 anti-flood window. The
      // next real request must be rejected purely by that gate, not by the
      // count-based one exercised above.
      const recentNow = Math.floor(Date.now() / 1000);
      writeFixtureRateLimitState(floodRoot, JSON.stringify({ timestamps: [recentNow - 5] }));

      const floodServer = await startPhpServer(floodRoot);
      try {
        const floodResponse = await post(floodServer.baseUrl, validFields);
        assert.equal(floodResponse.status, 429, 'A request within minSecondsBetween must be rejected by the anti-flood gate.');
        assert.deepEqual(JSON.parse(floodResponse.raw), {
          success: false,
          message: 'Ha enviado demasiadas solicitudes. Por favor intente nuevamente en unos minutos.',
        });

        assert.equal(
          floodSmtp.connections(),
          0,
          'A request rejected by the anti-flood gate must never reach the SMTP server.',
        );
      } finally {
        await floodServer.stop();
      }
    } finally {
      await floodSmtp.stop();
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
