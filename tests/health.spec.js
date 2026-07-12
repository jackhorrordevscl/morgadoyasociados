const assert = require('node:assert/strict');
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

function createTestWebRoot(tempRoot, name) {
  const destination = path.join(tempRoot, name);
  fs.cpSync(webRoot, destination, {
    recursive: true,
    filter: (source) => source !== path.join(webRoot, 'mail-config.php'),
  });
  return destination;
}

function writeValidConfig(documentRoot) {
  fs.writeFileSync(path.join(documentRoot, 'mail-config.php'), `<?php
return [
    'smtp_host' => '127.0.0.1',
    'smtp_port' => 2525,
    'smtp_user' => 'health-test-sender@example.test',
    'smtp_pass' => 'health-test-password',
    'smtp_secure' => 'tls',
    'to_email' => 'health-test-recipient@example.test',
    'to_name' => 'Health test recipient',
];
`);
}

async function startPhpServer(documentRoot, extraArgs = []) {
  const maxAttempts = 5;
  let lastError;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    const port = await reservePort();
    const child = spawn(phpBinary, [...extraArgs, '-d', 'display_errors=0', '-S', `127.0.0.1:${port}`, '-t', documentRoot], {
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    let startupOutput = '';

    try {
      await new Promise((resolve, reject) => {
        const timer = setTimeout(() => reject(new Error(`PHP server did not start: ${phpBinary}`)), 5000);
        const finish = (callback, value) => {
          clearTimeout(timer);
          child.stdout.off('data', onData);
          child.stderr.off('data', onData);
          child.off('error', onError);
          child.off('exit', onExit);
          callback(value);
        };
        const onData = (data) => {
          startupOutput += data.toString();
          if (startupOutput.includes('Development Server')) {
            finish(resolve);
          }
        };
        const onError = (error) => finish(reject, error);
        const onExit = (code) => finish(reject, new Error(`PHP server exited before startup with code ${code}: ${startupOutput}`));
        child.stdout.on('data', onData);
        child.stderr.on('data', onData);
        child.once('error', onError);
        child.once('exit', onExit);
      });

      return {
        baseUrl: `http://127.0.0.1:${port}`,
        stop: () => new Promise((resolve) => {
          child.once('exit', resolve);
          child.kill();
        }),
      };
    } catch (error) {
      lastError = error;
      child.kill();
      const collision = /\bEADDRINUSE\b|address already in use|only one usage of each socket address.*normally permitted/i.test(`${error.message}\n${startupOutput}`);
      if (!collision || attempt === maxAttempts) {
        throw error;
      }
    }
  }

  throw lastError;
}

function request(baseUrl, method) {
  return new Promise((resolve, reject) => {
    const client = http.request(`${baseUrl}/health.php`, { method }, (response) => {
      let body = '';
      response.setEncoding('utf8');
      response.on('data', (chunk) => { body += chunk; });
      response.on('end', () => resolve({ status: response.statusCode, headers: response.headers, body }));
    });
    client.once('error', reject);
    client.end();
  });
}

async function run() {
  const unavailablePayloadLength = Buffer.byteLength('{"status":"unavailable"}').toString();
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'morgado-health-test-'));
  try {
    const healthyRoot = createTestWebRoot(tempRoot, 'healthy');
    writeValidConfig(healthyRoot);
    const server = await startPhpServer(healthyRoot);
    const getResponse = await request(server.baseUrl, 'GET');
    assert.equal(getResponse.status, 200);
    assert.equal(getResponse.body, '{"status":"ok"}');
    assert.match(getResponse.headers['content-type'] || '', /^application\/json; charset=UTF-8$/i);
    assert.equal(getResponse.headers['cache-control'], 'no-store, no-cache, must-revalidate, max-age=0');
    assert.equal(getResponse.headers.pragma, 'no-cache');
    assert.equal(getResponse.headers.expires, '0');
    assert.equal(getResponse.headers['x-powered-by'], undefined);

    const headResponse = await request(server.baseUrl, 'HEAD');
    assert.equal(headResponse.status, 200);
    assert.equal(headResponse.body, '');
    assert.equal(headResponse.headers['content-length'], '15');

    const postResponse = await request(server.baseUrl, 'POST');
    assert.equal(postResponse.status, 405);
    assert.equal(postResponse.body, '');
    assert.equal(postResponse.headers.allow, 'GET, HEAD');
    await server.stop();

    const missingConfigServer = await startPhpServer(createTestWebRoot(tempRoot, 'missing-config'));
    const missingConfigResponse = await request(missingConfigServer.baseUrl, 'GET');
    assert.equal(missingConfigResponse.status, 503);
    assert.equal(missingConfigResponse.body, '{"status":"unavailable"}');
    const missingConfigHeadResponse = await request(missingConfigServer.baseUrl, 'HEAD');
    assert.equal(missingConfigHeadResponse.status, 503);
    assert.equal(missingConfigHeadResponse.body, '');
    assert.equal(missingConfigHeadResponse.headers['content-length'], unavailablePayloadLength);
    await missingConfigServer.stop();

    const invalidConfigRoot = createTestWebRoot(tempRoot, 'invalid-config');
    fs.writeFileSync(path.join(invalidConfigRoot, 'mail-config.php'), '<?php return [];');
    const invalidConfigServer = await startPhpServer(invalidConfigRoot);
    const invalidConfigResponse = await request(invalidConfigServer.baseUrl, 'GET');
    assert.equal(invalidConfigResponse.status, 503);
    assert.equal(invalidConfigResponse.body, '{"status":"unavailable"}');
    const invalidConfigHeadResponse = await request(invalidConfigServer.baseUrl, 'HEAD');
    assert.equal(invalidConfigHeadResponse.status, 503);
    assert.equal(invalidConfigHeadResponse.body, '');
    assert.equal(invalidConfigHeadResponse.headers['content-length'], unavailablePayloadLength);
    await invalidConfigServer.stop();

    const noExtensionsRoot = createTestWebRoot(tempRoot, 'no-extensions');
    writeValidConfig(noExtensionsRoot);
    const noExtensionsServer = await startPhpServer(noExtensionsRoot, ['-n']);
    const noExtensionsResponse = await request(noExtensionsServer.baseUrl, 'GET');
    assert.equal(noExtensionsResponse.status, 503);
    assert.equal(noExtensionsResponse.body, '{"status":"unavailable"}');
    const noExtensionsHeadResponse = await request(noExtensionsServer.baseUrl, 'HEAD');
    assert.equal(noExtensionsHeadResponse.status, 503);
    assert.equal(noExtensionsHeadResponse.body, '');
    assert.equal(noExtensionsHeadResponse.headers['content-length'], unavailablePayloadLength);
    await noExtensionsServer.stop();
  } finally {
    fs.rmSync(tempRoot, { recursive: true, force: true });
  }
}

run()
  .then(() => console.log('Health endpoint contract verified.'))
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
