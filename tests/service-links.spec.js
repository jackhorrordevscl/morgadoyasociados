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
    assert.equal(await penal.getAttribute('href'), 'penal.html');
    await Promise.all([page.waitForURL(`${baseUrl}/penal.html`), penal.click()]);

    await page.goto(`${baseUrl}/index.html`);
    const civil = page.locator('a.area-row', {
      has: page.locator('.area-title', { hasText: /^Civil$/ }),
    });
    assert.equal(await civil.getAttribute('href'), 'civil.html');
    await Promise.all([page.waitForURL(`${baseUrl}/civil.html`), civil.click()]);

    await page.goto(`${baseUrl}/index.html`);
    const familia = page.locator('a.area-row', {
      has: page.locator('.area-title', { hasText: /^Familia$/ }),
    });
    assert.equal(await familia.getAttribute('href'), 'derecho-familia.html');
    await Promise.all([page.waitForURL(`${baseUrl}/derecho-familia.html`), familia.click()]);

    await page.goto(`${baseUrl}/index.html`);
    const educacional = page.locator('a.area-row', {
      has: page.locator('.area-title', { hasText: /^Educacional$/ }),
    });
    assert.equal(await educacional.getAttribute('href'), 'educacional.html');
    await Promise.all([page.waitForURL(`${baseUrl}/educacional.html`), educacional.click()]);

    await page.goto(`${baseUrl}/index.html`);
    const inmobiliaria = page.locator('a.area-row', {
      has: page.locator('.area-title', { hasText: /^Inmobiliaria$/ }),
    });
    assert.equal(await inmobiliaria.getAttribute('href'), 'inmobiliaria.html');
    await Promise.all([page.waitForURL(`${baseUrl}/inmobiliaria.html`), inmobiliaria.click()]);

    await page.goto(`${baseUrl}/index.html`);
    const laboral = page.locator('a.area-row', {
      has: page.locator('.area-title', { hasText: /^Laboral$/ }),
    });
    assert.equal(await laboral.getAttribute('href'), 'laboral.html');
    await Promise.all([page.waitForURL(`${baseUrl}/laboral.html`), laboral.click()]);

    await page.goto(`${baseUrl}/index.html`);
    const decretoLey2695 = page.locator('a.area-row', {
      has: page.locator('.area-title', { hasText: /^Decreto ley 2\.695$/ }),
    });
    assert.equal(await decretoLey2695.getAttribute('href'), 'decreto-ley-2695.html');
    await Promise.all([page.waitForURL(`${baseUrl}/decreto-ley-2695.html`), decretoLey2695.click()]);

    await page.goto(`${baseUrl}/index.html`);
    const administrativo = page.locator('a.area-row', {
      has: page.locator('.area-title', { hasText: /^Administrativo$/ }),
    });
    assert.equal(await administrativo.getAttribute('href'), 'administrativo.html');
    await Promise.all([page.waitForURL(`${baseUrl}/administrativo.html`), administrativo.click()]);

    await page.goto(`${baseUrl}/index.html`);
    const aeronautico = page.locator('a.area-row', {
      has: page.locator('.area-title', { hasText: /^Aeronáutico$/ }),
    });
    assert.equal(await aeronautico.getAttribute('href'), 'aeronautico.html');
    await Promise.all([page.waitForURL(`${baseUrl}/aeronautico.html`), aeronautico.click()]);

    await page.goto(`${baseUrl}/services.html`);
    const inmobiliariaService = page.locator('a.svc', {
      has: page.locator('h3', { hasText: /^Inmobiliaria$/ }),
    });
    assert.equal(await inmobiliariaService.getAttribute('href'), 'inmobiliaria.html');
    await Promise.all([page.waitForURL(`${baseUrl}/inmobiliaria.html`), inmobiliariaService.click()]);

    await page.goto(`${baseUrl}/services.html`);
    const penalService = page.locator('a.svc', {
      has: page.locator('h3', { hasText: /^Penal$/ }),
    });
    assert.equal(await penalService.getAttribute('href'), 'penal.html');
    await Promise.all([page.waitForURL(`${baseUrl}/penal.html`), penalService.click()]);

    await page.goto(`${baseUrl}/services.html`);
    const civilService = page.locator('a.svc', {
      has: page.locator('h3', { hasText: /^Civil$/ }),
    });
    assert.equal(await civilService.getAttribute('href'), 'civil.html');
    await Promise.all([page.waitForURL(`${baseUrl}/civil.html`), civilService.click()]);

    await page.goto(`${baseUrl}/services.html`);
    const educacionalService = page.locator('a.svc', {
      has: page.locator('h3', { hasText: /^Educacional$/ }),
    });
    assert.equal(await educacionalService.getAttribute('href'), 'educacional.html');
    await Promise.all([page.waitForURL(`${baseUrl}/educacional.html`), educacionalService.click()]);

    await page.goto(`${baseUrl}/services.html`);
    const laboralService = page.locator('a.svc', {
      has: page.locator('h3', { hasText: /^Laboral$/ }),
    });
    assert.equal(await laboralService.getAttribute('href'), 'laboral.html');
    await Promise.all([page.waitForURL(`${baseUrl}/laboral.html`), laboralService.click()]);

    await page.goto(`${baseUrl}/services.html`);
    const decretoLey2695Service = page.locator('a.svc', {
      has: page.locator('h3', { hasText: /^Decreto Ley 2\.695$/ }),
    });
    assert.equal(await decretoLey2695Service.getAttribute('href'), 'decreto-ley-2695.html');
    await Promise.all([page.waitForURL(`${baseUrl}/decreto-ley-2695.html`), decretoLey2695Service.click()]);

    await page.goto(`${baseUrl}/services.html`);
    const administrativoService = page.locator('a.svc', {
      has: page.locator('h3', { hasText: /^Administrativo$/ }),
    });
    assert.equal(await administrativoService.getAttribute('href'), 'administrativo.html');
    await Promise.all([page.waitForURL(`${baseUrl}/administrativo.html`), administrativoService.click()]);

    await page.goto(`${baseUrl}/services.html`);
    const aeronauticoService = page.locator('a.svc', {
      has: page.locator('h3', { hasText: /^Aeronáutico$/ }),
    });
    assert.equal(await aeronauticoService.getAttribute('href'), 'aeronautico.html');
    await Promise.all([page.waitForURL(`${baseUrl}/aeronautico.html`), aeronauticoService.click()]);
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
