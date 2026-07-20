const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { pages } = require('../src/data/pages');
const { serviceAreas } = require('../src/data/navigation');
const { site, escapeHtmlAttribute } = require('../src/data/site');
const pageLayout = require('../src/layouts/page');
const { icon, replaceFontAwesomeIcons } = require('../src/partials/icon');

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
const animationScripts = [
  'https://cdn.jsdelivr.net/npm/gsap@3/dist/gsap.min.js',
  'https://cdn.jsdelivr.net/npm/gsap@3/dist/ScrollTrigger.min.js',
  'assets/animations.js',
];
const animatedPageFilenames = ['index.html', 'about.html', 'services.html', 'results.html', 'blog.html', 'contact.html', 'legal.html'];
const scaledIcon = replaceFontAwesomeIcons('<i class="fa-solid fa-scale-balanced fa-2x text-(--copper)" aria-hidden="true"></i>');
assert.match(scaledIcon, /<svg class="text-\(--copper\)" width="2em" height="2em"/, 'Font Awesome scale classes become controlled SVG dimensions');
assert.doesNotMatch(scaledIcon, /fa-2x/, 'Converted icons exclude obsolete Font Awesome classes');
assert.match(icon('bars', 'h-4 w-4'), /class="h-4 w-4" width="1em" height="1em"/, 'Helper icons retain their supplied utility classes over the fallback dimensions');

assert.deepEqual(
  pages.filter((page) => page.usesAnimations).map((page) => page.filename),
  animatedPageFilenames,
  'Only pages with animation branches request animation assets',
);

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
  assert.match(html, /<ul class="hidden xl:flex items-center/);
  assert.match(html, /data-services-menu/);
  assert.match(html, /data-services-toggle/);
  assert.match(html, /id="services-menu"[^>]*hidden[^>]*data-services-panel/);
  assert.match(html, /<details class="rounded-xl[^>]*data-mobile-services>/);
  assert.match(html, /Agende su consulta/);
  assert.match(html, /<a href="index\.html" class="[^"]*\bbrand-link\b[^"]*">/, `${page.filename} keeps the shared brand link`);
  assert.ok(html.includes(`src="${site.brandMark}"`), `${page.filename} uses the configured brand mark`);
  assert.match(html, new RegExp(`<img src="${site.brandMark.replace(/[.*+?^${}()|[\\]\\\\]/g, '\\\\$&')}" alt="" aria-hidden="true" class="brand-mark h-6 w-6 rounded-full object-cover">`), `${page.filename} uses the scaled brand mark`);
  assert.ok(html.includes(`<a href="${page.contactCta || 'contact.html'}" class="btn-rose`), `${page.filename} keeps the shared consultation CTA`);
  assert.match(html, new RegExp(site.brandShortHtml.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  assert.match(html, new RegExp(page.footer === 'extended' ? site.brandShortHtml : site.brandLongHtml));
  if (page.activeNav && page.navAriaCurrent !== false) {
    assert.match(html, new RegExp(`<a href="${navHrefs[page.activeNav]}" aria-current="page" class="[^"]*">${navLabels[page.activeNav]}<\/a>`));
  }
  if (['derecho-familia.html', 'educacional.html', 'inmobiliaria.html', 'penal.html', 'civil.html', 'laboral.html', 'decreto-ley-2695.html', 'administrativo.html', 'aeronautico.html'].includes(page.filename)) {
    const labels = {
      'derecho-familia.html': 'Derecho de Familia',
      'educacional.html': 'Derecho Educacional',
      'inmobiliaria.html': 'Inmobiliaria',
      'penal.html': 'Derecho Penal',
      'civil.html': 'Derecho Civil',
      'laboral.html': 'Derecho Laboral',
      'decreto-ley-2695.html': 'Decreto Ley 2.695',
      'administrativo.html': 'Derecho Administrativo',
      'aeronautico.html': 'Derecho Aeronáutico',
    };
    const label = labels[page.filename];
    assert.match(html, new RegExp(`<li aria-current="page" class="font-medium text-\\(--copper\\)">${label}<\\/li>`));
  }
  if (page.footerCurrent === 'ethics') {
    assert.match(html, /<a href="etica-legal\.html" aria-current="page" class="hover:text-white transition-colors">Ética Profesional<\/a>/);
  }
  assert.ok(html.includes('defer src="assets/nav.js"'), `${page.filename} defers shared navigation behavior`);
  const positions = animationScripts.map((script) => html.indexOf(`src="${script}"`));
  if (page.usesAnimations) {
    assert.ok(positions.every((position) => position >= 0), `${page.filename} keeps animation assets`);
    assert.deepEqual([...positions].sort((a, b) => a - b), positions, `${page.filename} preserves animation dependency order`);
  } else {
    assert.ok(positions.every((position) => position < 0), `${page.filename} omits unused animation assets`);
  }
  const pageScripts = [
    ...(page.usesAnimations ? animationScripts.slice(0, 2) : []),
    'assets/nav.js',
    ...(page.usesAnimations ? animationScripts.slice(2) : []),
    ...(page.optionalScript ? [page.optionalScript] : []),
  ];
  const pageScriptPositions = pageScripts.map((script) => html.indexOf(`src="${script}"`));
  assert.ok(pageScriptPositions.every((position) => position >= 0), `${page.filename} keeps its required scripts`);
  assert.deepEqual([...pageScriptPositions].sort((a, b) => a - b), pageScriptPositions, `${page.filename} preserves script order`);
  for (const script of pageScripts) {
    assert.ok(html.includes(`defer src="${script}"`), `${page.filename} defers ${script}`);
  }
  assert.equal(html.includes('defer src="assets/contact.js"'), page.optionalScript === 'assets/contact.js', `${page.filename} deferred contact script contract`);
  assert.equal(html.includes('application/ld+json'), Boolean(page.jsonLd), `${page.filename} JSON-LD contract`);
  assert.equal(html.includes('https://images.unsplash.com" crossorigin'), Boolean(page.preconnectUnsplash), `${page.filename} Unsplash preconnect contract`);
  assert.equal(html.includes('https://cdn.jsdelivr.net" crossorigin'), Boolean(page.usesAnimations), `${page.filename} animation CDN preconnect contract`);
  assert.match(html, /https:\/\/fonts\.googleapis\.com\/css2\?family=Playfair\+Display:ital,wght@0,400;0,600;1,400;1,600&amp;family=Inter:wght@400;500;600&amp;display=swap/, `${page.filename} only loads used font variants`);
  assert.doesNotMatch(html, /cdnjs\.cloudflare\.com|font-awesome|fa-(?:solid|regular|brands)/, `${page.filename} excludes Font Awesome assets and classes`);
}

const index = fs.readFileSync(path.join(webRoot, 'index.html'), 'utf8');
for (const [, href, label] of serviceAreas) {
  const escapedHref = href.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const escapedLabel = label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  assert.match(index, new RegExp(`<a href="${escapedHref}"[^>]*>${escapedLabel}<\\/a>`), `${label} is available from the service navigation`);
}

const navigationScript = fs.readFileSync(path.join(webRoot, 'assets', 'nav.js'), 'utf8');
for (const behavior of ['data-services-toggle', 'ArrowDown', 'ArrowUp', 'Home', 'End', 'pointerdown', 'data-mobile-services']) {
  assert.ok(navigationScript.includes(behavior), `Service navigation retains ${behavior} behavior`);
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
assert.match(contact, /<svg class="[^"]*"[^>]*aria-hidden="true"[^>]*><(?:circle|path)/, 'Contact icons remain decorative for assistive technology');

const home = fs.readFileSync(path.join(webRoot, 'index.html'), 'utf8');
assert.match(home, /srcset="https:\/\/images\.unsplash\.com\/photo-1627518788331-b3b7fdaa382f\?auto=format&w=480&q=80&fit=crop 480w, https:\/\/images\.unsplash\.com\/photo-1627518788331-b3b7fdaa382f\?auto=format&w=768&q=80&fit=crop 768w, https:\/\/images\.unsplash\.com\/photo-1627518788331-b3b7fdaa382f\?auto=format&w=1000&q=80&fit=crop 1000w, https:\/\/images\.unsplash\.com\/photo-1627518788331-b3b7fdaa382f\?auto=format&w=1440&q=80&fit=crop 1440w" sizes="\(min-width: 1440px\) 684px, \(min-width: 1024px\) 47\.5vw, 100vw"/, 'The hero has responsive image candidates');

const about = fs.readFileSync(path.join(webRoot, 'about.html'), 'utf8');
for (const imageId of ['photo-1518556336318-c8de4355ccab', 'photo-1585240975735-4826abe53080', 'photo-1645990543673-53d612fee13e', 'photo-1612283061725-f22721e5a3cd']) {
  assert.match(about, new RegExp(`${imageId}\\?auto=format&w=176&q=80&fit=crop 176w, https://images\\.unsplash\\.com/${imageId}\\?auto=format&w=352&q=80&fit=crop 352w" sizes="176px"`), `${imageId} has responsive portrait candidates`);
}

const servicePage = pages.find((page) => page.filename === 'services.html');
const serviceCardMarkup = pageLayout(servicePage, {
  shellOpenBeforeHeader: '',
  pageContentBetweenShell: '<div class="svc"><div><h3 class="title">Penal</h3></div></div><a href="#areas">Civil</a><div class="svc"><h3>Familia</h3></div>',
  shellCloseAfterFooter: '',
});
assert.match(serviceCardMarkup, /<a href="penal\.html" class="svc block"><div><h3 class="title">Penal<\/h3><\/div><\/a>/, 'A mapped service card remains a block-level link without changing its contents');
assert.match(serviceCardMarkup, /<a href="civil\.html">Civil<\/a>/, 'Existing service anchors keep their destination rewrite');
assert.match(serviceCardMarkup, /<div class="svc"><h3>Familia<\/h3><\/div>/, 'Unmapped service cards remain unchanged');

const services = fs.readFileSync(path.join(webRoot, 'services.html'), 'utf8');
assert.match(services, /service-grid grid grid-cols-1 md:grid-cols-2 gap-6/, 'Services uses a one, two, then three-column grid');
assert.doesNotMatch(services, /columns-1 md:columns-2 lg:columns-3/, 'Services does not use CSS columns');
assert.match(fs.readFileSync(path.join(webRoot, 'assets', 'site.css'), 'utf8'), /body\[data-page="services"\] \.svc-icon/, 'Service icons use a shared rendering box');
assert.match(fs.readFileSync(path.join(webRoot, 'assets', 'site.css'), 'utf8'), /body\[data-page="services"\] \.service-grid \{ grid-template-columns: repeat\(3, minmax\(0, 1fr\)\); \}/, 'Service cards use three columns at the desktop breakpoint');
for (const [label, href] of Object.entries(servicePage.serviceLinks)) {
  const escapedLabel = label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const escapedHref = href.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  assert.match(
    services,
    new RegExp(`<a href="${escapedHref}" class="(?=[^"]*\\bsvc\\b)(?=[^"]*\\bblock\\b)[^"]*"[^>]*>[\\s\\S]*?<h3[^>]*>${escapedLabel}<\\/h3>`),
    `${label} service card remains a block-level link to ${href}`,
  );
}

for (const page of pages.filter((entry) => entry.activeNav === 'services' && entry.navAriaCurrent === false)) {
  const html = fs.readFileSync(path.join(webRoot, page.filename), 'utf8');
  assert.match(html, /shadow-\[0_16px_34px_-16px_rgba\(140,75,92,0\.9\)\]/, `${page.filename} uses the aligned service CTA elevation`);
  assert.match(html, /<svg[^>]*stroke-width="2"[^>]*data-icon-role="action"/, `${page.filename} normalizes action icon strokes`);
}

const contactScript = fs.readFileSync(path.join(webRoot, 'assets', 'contact.js'), 'utf8');
assert.match(contactScript, /event\.preventDefault\(\)/, 'The enhanced form prevents native navigation');
assert.match(contactScript, /fetch\('send-mail\.php', \{ method: 'POST', body: new FormData\(form\) \}\)/, 'The enhanced form keeps its JSON POST request');
console.log('Generated page layout contract verified.');
