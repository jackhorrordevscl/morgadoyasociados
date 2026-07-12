const fs = require('node:fs');
const http = require('node:http');
const path = require('node:path');
const assert = require('node:assert/strict');
const { chromium } = require('playwright');

const siteRoot = path.resolve(__dirname, '..', 'web');

function startServer() {
  const server = http.createServer((request, response) => {
    const pathname = new URL(request.url, 'http://127.0.0.1').pathname;
    const relativePath = pathname === '/' ? 'index.html' : pathname.slice(1);
    const filePath = path.resolve(siteRoot, relativePath);

    if (!filePath.startsWith(`${siteRoot}${path.sep}`)) {
      response.writeHead(403).end();
      return;
    }

    fs.readFile(filePath, (error, content) => {
      if (error) {
        response.writeHead(error.code === 'ENOENT' ? 404 : 500).end();
        return;
      }

      response.writeHead(200).end(content);
    });
  });

  return new Promise((resolve) => {
    server.listen(0, '127.0.0.1', () => resolve(server));
  });
}

async function verifyServiceLinks() {
  const server = await startServer();
  const baseUrl = `http://127.0.0.1:${server.address().port}`;
  let browser;

  try {
    browser = await chromium.launch();
    const page = await browser.newPage();
    await page.route('**/*', (route) => {
      if (new URL(route.request().url()).origin === baseUrl) {
        return route.continue();
      }

      return route.abort();
    });

    await page.goto(`${baseUrl}/index.html`);
    const penal = page.locator('a.area-row', {
      has: page.locator('.area-title', { hasText: /^Penal$/ }),
    });
    assert.equal(await penal.getAttribute('href'), 'services.html');
    await Promise.all([page.waitForURL(`${baseUrl}/services.html`), penal.click()]);

    await page.goto(`${baseUrl}/index.html`);
    const familia = page.locator('a.area-row', {
      has: page.locator('.area-title', { hasText: /^Familia$/ }),
    });
    assert.equal(await familia.getAttribute('href'), 'derecho-familia.html');
    await Promise.all([page.waitForURL(`${baseUrl}/derecho-familia.html`), familia.click()]);
  } finally {
    if (browser) {
      await browser.close();
    }
    await new Promise((resolve) => server.close(resolve));
  }
}

verifyServiceLinks()
  .then(() => console.log('Service links verified.'))
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
