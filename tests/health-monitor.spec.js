const assert = require('node:assert/strict');
const http = require('node:http');
const net = require('node:net');
const fs = require('node:fs');
const path = require('node:path');
const { spawn } = require('node:child_process');

const projectRoot = path.resolve(__dirname, '..');
const monitorPath = path.join(projectRoot, 'scripts', 'health-monitor.php');
const fixturesRoot = path.join(__dirname, 'fixtures');
const localWindowsPhp = 'C:\\tools\\php85\\php.exe';
const phpBinary = process.env.PHP_BINARY
  || (process.platform === 'win32' && fs.existsSync(localWindowsPhp) ? localWindowsPhp : 'php');

function startServer(handler) {
  return new Promise((resolve, reject) => {
    const server = http.createServer(handler);
    server.once('error', reject);
    server.listen(0, '127.0.0.1', () => {
      const { port } = server.address();
      resolve({
        url: `http://127.0.0.1:${port}/health.php`,
        stop: () => new Promise((done) => server.close(done)),
      });
    });
  });
}

function runMonitor(url, phpArgs = [], extraEnv = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(phpBinary, [...phpArgs, monitorPath], {
      env: { ...process.env, HEALTH_MONITOR_URL: url, ...extraEnv },
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    let stdout = '';
    let stderr = '';
    child.stdout.setEncoding('utf8');
    child.stderr.setEncoding('utf8');
    child.stdout.on('data', (chunk) => { stdout += chunk; });
    child.stderr.on('data', (chunk) => { stderr += chunk; });
    child.once('error', reject);
    child.once('exit', (code, signal) => resolve({ code, signal, stdout, stderr }));
  });
}

function assertFailure(result, message, forbidden = []) {
  assert.equal(result.code, 1);
  assert.equal(result.signal, null);
  assert.equal(result.stdout, '');
  assert.equal(result.stderr, `health monitor failed: ${message}\n`);
  for (const value of forbidden) {
    assert.doesNotMatch(result.stderr, value);
  }
}

function reserveClosedPort() {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.once('error', reject);
    server.listen(0, '127.0.0.1', () => {
      const { port } = server.address();
      server.close((error) => (error ? reject(error) : resolve(port)));
    });
  });
}

async function withResponse(status, body, verify) {
  const server = await startServer((_request, response) => {
    response.writeHead(status, { 'Content-Type': 'application/json' });
    response.end(body);
  });
  try {
    await verify(server.url);
  } finally {
    await server.stop();
  }
}

async function run() {
  const publicPageServer = await startServer((_request, response) => {
    response.writeHead(200, { 'Content-Type': 'text/html' });
    response.end('<body data-page="home"><main>ok</main></body>');
  });
  const publicAssetServer = await startServer((_request, response) => {
    response.writeHead(200, { 'Content-Type': 'text/css' });
    response.end('body{color:#000}');
  });
  try {
    await withResponse(200, '{"status":"ok"}', async (url) => {
      const result = await runMonitor(url, ['-n'], {
        PUBLIC_PAGE_MONITOR_URL: publicPageServer.url,
        PUBLIC_ASSET_MONITOR_URL: publicAssetServer.url,
      });
      assert.equal(result.code, 0);
      assert.equal(result.signal, null);
      assert.equal(result.stdout, '');
      assert.equal(result.stderr, '');
    });
  } finally {
    await publicPageServer.stop();
    await publicAssetServer.stop();
  }

  await withResponse(503, '<html>maintenance</html>', async (url) => {
    const result = await runMonitor(url);
    assertFailure(result, 'health unexpected HTTP status 503', [/html|maintenance/i]);
  });

  await withResponse(200, '<html>not healthy</html>', async (url) => {
    const result = await runMonitor(url);
    assertFailure(result, 'unexpected response payload', [/html|not healthy/i]);
  });

  const invalidUrlResult = await runMonitor('file:///private/health.php');
  assertFailure(invalidUrlResult, 'invalid health URL', [/private|file/i]);

  const closedPort = await reserveClosedPort();
  const connectionFailureResult = await runMonitor(`http://127.0.0.1:${closedPort}/health.php`);
    assertFailure(connectionFailureResult, 'health request unavailable', [/127\.0\.0\.1|refused/i]);

  const unavailableServer = await startServer((request, socket) => {
    request.destroy();
    socket.destroy();
  });
  try {
    const unavailableResult = await runMonitor(unavailableServer.url);
    assertFailure(unavailableResult, 'health request unavailable', [/socket|reset|127\.0\.0\.1/i]);
  } finally {
    await unavailableServer.stop();
  }

  const plainHttpServer = await startServer((_request, response) => {
    response.end('not TLS');
  });
  try {
    const tlsFailureUrl = plainHttpServer.url.replace('http://', 'https://');
    const tlsFailureResult = await runMonitor(tlsFailureUrl);
    assertFailure(tlsFailureResult, 'health request unavailable', [/tls|ssl|certificate|127\.0\.0\.1/i]);
  } finally {
    await plainHttpServer.stop();
  }

  const timeoutServer = await startServer(() => {});
  try {
    const timeoutResult = await runMonitor(timeoutServer.url, [
      '-d',
      `auto_prepend_file=${path.join(fixturesRoot, 'health-monitor-short-timeout.php')}`,
    ]);
    assertFailure(timeoutResult, 'health request unavailable', [/timeout|127\.0\.0\.1/i]);
  } finally {
    await timeoutServer.stop();
  }

  const nonCliResult = await runMonitor('http://127.0.0.1:1/health.php', [
    '-d',
    `auto_prepend_file=${path.join(fixturesRoot, 'health-monitor-non-cli.php')}`,
  ]);
  assertFailure(nonCliResult, 'CLI execution required', [/127\.0\.0\.1|health\.php/i]);

  let redirectTargetRequests = 0;
  const redirectServer = await startServer((request, response) => {
    if (request.url === '/healthy') {
      redirectTargetRequests += 1;
      response.end('{"status":"ok"}');
      return;
    }
    response.writeHead(302, { Location: '/healthy' });
    response.end();
  });
  try {
    const redirectResult = await runMonitor(redirectServer.url);
    assertFailure(redirectResult, 'health unexpected HTTP status 302', [/healthy/i]);
    assert.equal(redirectTargetRequests, 0, 'the monitor must not follow redirects');
  } finally {
    await redirectServer.stop();
  }
}

run()
  .then(() => console.log('Health monitor contract verified.'))
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
