const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { pages } = require('../src/data/pages');
const { site, escapeHtmlAttribute } = require('../src/data/site');

const webRoot = path.resolve(__dirname, '..', 'web');
const navLabels = {
  index: 'Inicio',
  about: 'Sobre Nosotros',
  services: 'Servicios',
  results: 'Resultados',
  blog: 'Blog',
  contact: 'Contacto',
};
const navHrefs = {
  index: 'index.html',
  about: 'about.html',
  services: 'services.html',
  results: 'results.html',
  blog: 'blog.html',
  contact: 'contact.html',
};
const commonScripts = [
  'https://cdn.jsdelivr.net/npm/gsap@3/dist/gsap.min.js',
  'https://cdn.jsdelivr.net/npm/gsap@3/dist/ScrollTrigger.min.js',
  'assets/nav.js',
  'assets/animations.js',
];

assert.deepEqual(
  fs.readdirSync(webRoot).filter((file) => file.endsWith('.html')).sort(),
  pages.map((page) => page.filename).sort(),
  'The generator owns exactly the nine public HTML outputs',
);

for (const page of pages) {
  const output = path.join(webRoot, page.filename);
  assert.ok(fs.existsSync(output), `${page.filename} must be generated`);
  const html = fs.readFileSync(output, 'utf8');
  assert.match(html, new RegExp(`<body data-page="${page.bodyData}">`));
  assert.match(html, new RegExp(`<title>${escapeHtmlAttribute(page.title).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}</title>`));
  assert.match(html, new RegExp(`<meta name="description" content="${escapeHtmlAttribute(page.description).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}">`));
  assert.match(html, new RegExp(`<link rel="canonical" href="${page.canonical.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}">`));
  assert.match(html, new RegExp(`<meta name="robots" content="${page.robots}">`));
  assert.match(html, new RegExp(`<meta property="og:title" content="${escapeHtmlAttribute(page.title).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}">`));
  assert.match(html, /<meta name="twitter:card" content="summary_large_image">/);
  assert.match(html, /data-mobile-toggle/);
  assert.match(html, /aria-label="Abrir menú" aria-expanded="false" aria-controls="mobile-menu"/);
  assert.match(html, /id="mobile-menu"[^>]*data-mobile-menu/);
  assert.match(html, /<ul class="hidden lg:flex items-center/);
  assert.match(html, /Agende su consulta/);
  assert.match(html, /<a href="index\.html" class="[^"]*\bbrand-link\b[^"]*">/, `${page.filename} keeps the shared brand link`);
  assert.ok(html.includes(`src="${site.brandMarkSvg}"`), `${page.filename} uses the configured brand mark`);
  assert.ok(html.includes(`<a href="${page.contactCta || 'contact.html'}" class="btn-rose`), `${page.filename} keeps the shared consultation CTA`);
  assert.match(html, new RegExp(site.brandShortHtml.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  assert.match(html, new RegExp(page.footer === 'extended' ? site.brandShortHtml : site.brandLongHtml));
  if (page.activeNav && page.navAriaCurrent !== false) {
    assert.match(html, new RegExp(`<a href="${navHrefs[page.activeNav]}" aria-current="page" class="[^"]*">${navLabels[page.activeNav]}<\/a>`));
  }
  if (page.filename === 'derecho-familia.html') {
    assert.match(html, /<li aria-current="page" class="font-medium text-\(--copper\)">Derecho de Familia<\/li>/);
  }
  if (page.footerCurrent === 'ethics') {
    assert.match(html, /<a href="etica-legal\.html" aria-current="page" class="hover:text-white transition-colors">Ética Profesional<\/a>/);
  }
  const positions = commonScripts.map((script) => html.indexOf(`src="${script}"`));
  assert.ok(positions.every((position) => position >= 0), `${page.filename} keeps common scripts`);
  assert.deepEqual([...positions].sort((a, b) => a - b), positions, `${page.filename} preserves script order`);
  assert.equal(html.includes('assets/contact.js'), page.optionalScript === 'assets/contact.js', `${page.filename} contact script contract`);
  assert.equal(html.includes('application/ld+json'), Boolean(page.jsonLd), `${page.filename} JSON-LD contract`);
  assert.equal(html.includes('https://images.unsplash.com" crossorigin'), Boolean(page.preconnectUnsplash), `${page.filename} Unsplash preconnect contract`);
}

const contact = fs.readFileSync(path.join(webRoot, 'contact.html'), 'utf8');
assert.match(
  contact,
  /<form id="contact-form" action="send-mail\.php" method="post" class="space-y-5" aria-labelledby="contact-form-title" aria-describedby="contact-form-help" aria-busy="false">/,
  'The contact form provides a native POST fallback when JavaScript is unavailable',
);
assert.doesNotMatch(contact, /<form id="contact-form"[^>]*\bnovalidate\b/, 'The native fallback retains browser validation');
for (const value of ['id="contact-form"', 'id="f-name"', 'id="f-email"', 'id="f-phone"', 'id="f-area"', 'id="f-msg"', 'id="privacy-consent"', 'name="privacy_consent"', 'value="accepted"', 'required']) {
  assert.ok(contact.includes(value), `Contact form preserves ${value}`);
}
assert.match(contact, /legal\.html#privacidad/);

const contactScript = fs.readFileSync(path.join(webRoot, 'assets', 'contact.js'), 'utf8');
assert.match(contactScript, /event\.preventDefault\(\)/, 'The enhanced form prevents native navigation');
assert.match(contactScript, /fetch\('send-mail\.php', \{ method: 'POST', body: new FormData\(form\) \}\)/, 'The enhanced form keeps its JSON POST request');
console.log('Generated page layout contract verified.');
