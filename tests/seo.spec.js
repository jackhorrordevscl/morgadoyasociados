const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { pages } = require('../src/data/pages');
const { site } = require('../src/data/site');

const webRoot = path.resolve(__dirname, '..', 'web');
const socialImage = site.socialImage;

function escapeHtmlAttribute(value) {
  return value.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function readHtml(file) {
  return fs.readFileSync(path.join(webRoot, file), 'utf8');
}

for (const page of pages) {
  const html = readHtml(page.filename);
  assert.match(html, new RegExp(`<link rel="canonical" href="${page.canonical.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}">`));
  assert.match(html, new RegExp(`<meta property="og:title" content="${escapeHtmlAttribute(page.title).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}">`));
  assert.match(html, new RegExp(`<meta property="og:description" content="${escapeHtmlAttribute(page.description).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}">`));
  assert.match(html, new RegExp(`<meta property="og:url" content="${page.canonical.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}">`));
  assert.match(html, new RegExp(`<meta property="og:image" content="${escapeHtmlAttribute(socialImage).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}">`));
  assert.match(html, new RegExp(`<meta property="og:image:secure_url" content="${escapeHtmlAttribute(socialImage).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}">`));
  assert.match(html, /<meta name="twitter:card" content="summary_large_image">/);
  assert.match(html, /<meta name="twitter:domain" content="morgadoyasociados\.cl">/);
  assert.match(html, new RegExp(`<meta name="twitter:title" content="${escapeHtmlAttribute(page.title).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}">`));
  assert.match(html, new RegExp(`<meta name="twitter:description" content="${escapeHtmlAttribute(page.description).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}">`));
  assert.match(html, new RegExp(`<meta name="twitter:image" content="${escapeHtmlAttribute(socialImage).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}">`));
  assert.match(html, new RegExp(`<meta name="author" content="${escapeHtmlAttribute('Asesoría Legal Morgado, Cía. & Asociados').replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}">`));
  assert.match(html, new RegExp(`<meta name="robots" content="${page.robots}">`));

  if (page.jsonLd) {
    const scriptMatch = html.match(/<script type="application\/ld\+json">\s*([\s\S]*?)\s*<\/script>/);
    assert.ok(scriptMatch, `${page.filename} is missing JSON-LD`);
    const structuredData = JSON.parse(scriptMatch[1]);
    assert.equal(structuredData['@context'], 'https://schema.org');
    assert.ok(Array.isArray(structuredData['@graph']));
    const graphTypes = structuredData['@graph'].map((entry) => entry['@type']);
    assert.ok(graphTypes.includes('LegalService'));
    assert.ok(graphTypes.includes('LocalBusiness'));
    for (const entry of structuredData['@graph']) {
      assert.equal(entry.name, 'Asesoría Legal Morgado, Cía. & Asociados');
      assert.match(entry.url, /^https:\/\/morgadoyasociados\.cl\/(?:contact\.html)?$/);
      assert.equal(entry.telephone, '+56 2 2638 1456');
      assert.equal(entry.email, 'contacto@morgadoyasociados.cl');
      assert.equal(entry.areaServed, 'Chile');
      assert.equal(entry.openingHours, 'Mo-Fr 09:00-18:00');
      assert.deepEqual(entry.address, {
        '@type': 'PostalAddress',
        streetAddress: 'Santa Lucía 270, Piso 6, Of. 601',
        addressLocality: 'Santiago',
        addressRegion: 'Región Metropolitana',
        addressCountry: 'CL',
      });
    }
  }
}

const robots = fs.readFileSync(path.join(webRoot, 'robots.txt'), 'utf8');
for (const disallow of [
  'Disallow: /send-mail.php',
  'Disallow: /health.php',
  'Disallow: /mail-config.php',
  'Disallow: /mail-config.example.php',
  'Disallow: /lib/',
  'Disallow: /scripts/',
  'Disallow: /tests/',
]) {
  assert.match(robots, new RegExp(disallow.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
}
assert.match(robots, /Sitemap: https:\/\/morgadoyasociados\.cl\/sitemap\.xml/);

const sitemap = fs.readFileSync(path.join(webRoot, 'sitemap.xml'), 'utf8');
const urls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]);
assert.deepEqual(urls, pages.filter((page) => page.sitemap).map((page) => page.canonical));
const noindexPages = pages.filter((page) => page.robots.startsWith('noindex'));
assert.deepEqual(noindexPages.map((page) => page.filename), ['legal.html', 'etica-legal.html']);
assert.ok(noindexPages.every((page) => !page.sitemap));
assert.doesNotMatch(sitemap, /legal\.html|etica-legal\.html/);

const htaccess = fs.readFileSync(path.join(webRoot, '.htaccess'), 'utf8');
assert.match(htaccess, /Header always set X-Robots-Tag "noindex, nofollow, noarchive"/);

console.log('SEO technical configuration verified.');
