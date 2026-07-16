const assert = require('node:assert/strict');
const fs = require('node:fs');
const http = require('node:http');
const path = require('node:path');
const { chromium } = require('playwright');
const { pages } = require('../src/data/pages');
const pageLayout = require('../src/layouts/page');

const webRoot = path.resolve(__dirname, '..', 'web');
const servicesPage = pages.find((page) => page.filename === 'services.html');
const servicesFragment = JSON.parse(fs.readFileSync(path.resolve(__dirname, '..', 'src', 'pages', 'services.json'), 'utf8'));
const contactPage = pages.find((page) => page.filename === 'contact.html');
const renderedPages = new Map([
  ['/services.html', pageLayout(servicesPage, servicesFragment)],
  ['/contact.html', pageLayout(contactPage, JSON.parse(fs.readFileSync(path.resolve(__dirname, '..', 'src', 'pages', 'contact.json'), 'utf8')))],
]);

function startServer() {
  const server = http.createServer((request, response) => {
    const requested = request.url === '/' ? '/index.html' : request.url;
    const pathname = requested.split('?')[0];
    if (renderedPages.has(pathname)) {
      response.writeHead(200).end(renderedPages.get(pathname));
      return;
    }
    const filename = path.resolve(webRoot, `.${requested.split('?')[0]}`);
    if (!filename.startsWith(webRoot) || !fs.existsSync(filename)) {
      response.writeHead(404).end();
      return;
    }
    response.writeHead(200).end(fs.readFileSync(filename));
  });
  return new Promise((resolve) => server.listen(0, '127.0.0.1', () => resolve(server)));
}

(async () => {
  const server = await startServer();
  const port = server.address().port;
  const browser = await chromium.launch();

  try {
    const page = await browser.newPage({ viewport: { width: 390, height: 720 } });
    const toggle = page.locator('[data-mobile-toggle]');
    await page.goto(`http://127.0.0.1:${port}/services.html`);
    assert.match(await page.locator('header > nav > ul').getAttribute('class'), /\bxl:flex\b/, 'Desktop navigation starts at the xl breakpoint');
    assert.match(await toggle.getAttribute('class'), /\bxl:hidden\b/, 'Mobile toggle remains available below the xl breakpoint');
    await toggle.click();
    assert.equal(await toggle.getAttribute('aria-expanded'), 'true', 'Opening the mobile menu updates the toggle state');
    assert.equal(await toggle.getAttribute('aria-label'), 'Cerrar menú', 'Opening the mobile menu updates the toggle label');
    assert.equal(await toggle.locator(':scope > svg').isHidden(), true, 'Opening the mobile menu hides the menu icon');
    assert.equal(await toggle.locator('[data-mobile-close-icon]').isVisible(), true, 'Opening the mobile menu shows the close icon');
    assert.equal(await page.locator('[data-mobile-menu] a').first().evaluate((link) => document.activeElement === link), true, 'Opening the mobile menu moves focus to its first link');

    const focusable = page.locator('[data-mobile-menu] a');
    await focusable.last().focus();
    await page.keyboard.press('Tab');
    assert.equal(await focusable.first().evaluate((element) => document.activeElement === element), true, 'Tab wraps within the mobile menu');

    await page.keyboard.press('Escape');
    assert.equal(await toggle.evaluate((button) => document.activeElement === button), true, 'Escape returns focus to the mobile toggle');
    assert.equal(await toggle.getAttribute('aria-expanded'), 'false', 'Closing the mobile menu resets the toggle state');
    assert.equal(await toggle.getAttribute('aria-label'), 'Abrir menú', 'Closing the mobile menu resets the toggle label');
    assert.equal(await toggle.locator(':scope > svg').isVisible(), true, 'Closing the mobile menu shows the menu icon');
    assert.equal(await toggle.locator('[data-mobile-close-icon]').isHidden(), true, 'Closing the mobile menu hides the close icon');

    await page.evaluate(() => {
      const button = document.querySelector('[data-mobile-toggle]');
      button.click();
      button.click();
    });
    await page.evaluate(() => new Promise(window.requestAnimationFrame));
    assert.equal(await toggle.evaluate((button) => document.activeElement === button), true, 'Closing before the next frame does not focus hidden menu content');

    await toggle.click();
    const currentPageLink = page.locator('[data-mobile-menu] a[aria-current="page"]');
    await currentPageLink.evaluate((link) => link.addEventListener('click', (event) => event.preventDefault(), { once: true }));
    await currentPageLink.click();
    assert.equal(await toggle.getAttribute('aria-expanded'), 'false', 'Selecting the current page closes the mobile menu');
    assert.equal(await toggle.evaluate((button) => document.activeElement === button), true, 'Selecting the current page returns focus to the mobile toggle');

    await page.goto(`http://127.0.0.1:${port}/contact.html`);
    await toggle.click();
    await page.locator('[data-mobile-menu] a[href="#contact-form"]').focus();
    await page.keyboard.press('Enter');
    await page.waitForFunction(() => window.location.hash === '#contact-form' && document.activeElement.id === 'f-name');
    assert.equal(await toggle.getAttribute('aria-expanded'), 'false', 'Selecting the contact fragment closes the mobile menu');
    assert.equal(await page.locator('#f-name').evaluate((input) => document.activeElement === input), true, "Selecting the contact fragment moves focus to the form's first visible field");
    await page.close();
  } finally {
    await browser.close();
    await new Promise((resolve) => server.close(resolve));
  }

  console.log('Responsive navigation contract verified.');
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
