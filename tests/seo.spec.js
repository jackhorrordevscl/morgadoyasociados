const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const webRoot = path.resolve(__dirname, '..', 'web');
const socialImage = 'https://images.unsplash.com/photo-1627518788331-b3b7fdaa382f?auto=format&fit=crop&w=1200&h=630&q=80';

function escapeHtmlAttribute(value) {
  return value.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

const pages = [
  {
    file: 'index.html',
    canonical: 'https://morgadoyasociados.cl/',
    title: 'Asesoría Legal Morgado, Cía. & Asociados | Inicio',
    description: 'Defensa y asesoría legal de excelencia en Chile. Más de 20 años protegiendo la tranquilidad de personas y empresas con estrategias jurídicas a la medida.',
    noindex: false,
    schema: true,
  },
  {
    file: 'about.html',
    canonical: 'https://morgadoyasociados.cl/about.html',
    title: 'Asesoría Legal Morgado, Cía. & Asociados | Sobre Nosotros',
    description: 'Conozca la trayectoria, el equipo y los principios de Asesoría Legal Morgado, Cía. & Asociados.',
    noindex: false,
  },
  {
    file: 'services.html',
    canonical: 'https://morgadoyasociados.cl/services.html',
    title: 'Asesoría Legal Morgado, Cía. & Asociados | Servicios',
    description: 'Áreas de práctica y servicios legales de Asesoría Legal Morgado, Cía. & Asociados en Chile.',
    noindex: false,
  },
  {
    file: 'results.html',
    canonical: 'https://morgadoyasociados.cl/results.html',
    title: 'Asesoría Legal Morgado, Cía. & Asociados | Casos & Resultados',
    description: 'Resultados medibles y testimonios reales de clientes de Asesoría Legal Morgado, Cía. & Asociados en Chile.',
    noindex: false,
  },
  {
    file: 'blog.html',
    canonical: 'https://morgadoyasociados.cl/blog.html',
    title: 'Asesoría Legal Morgado, Cía. & Asociados | Blog & Publicaciones Legales',
    description: 'Artículos legales sobre Ley Karin y normativa educacional, defensa penal, divorcios y pensión de alimentos, derecho laboral e inmobiliario, escritos por abogados de Asesoría Legal Morgado, Cía. & Asociados en Chile.',
    noindex: false,
  },
  {
    file: 'contact.html',
    canonical: 'https://morgadoyasociados.cl/contact.html',
    title: 'Asesoría Legal Morgado, Cía. & Asociados | Contacto',
    description: 'Agende una consulta inicial con Asesoría Legal Morgado, Cía. & Asociados.',
    noindex: false,
    schema: true,
  },
  {
    file: 'derecho-familia.html',
    canonical: 'https://morgadoyasociados.cl/derecho-familia.html',
    title: 'Asesoría Legal Morgado, Cía. & Asociados | Derecho de Familia',
    description: 'Orientación y representación en divorcio, alimentos, cuidado personal, relación directa y regular, y materias de familia en Chile.',
    noindex: false,
  },
  {
    file: 'legal.html',
    canonical: 'https://morgadoyasociados.cl/legal.html',
    title: 'Asesoría Legal Morgado, Cía. & Asociados | Legal',
    description: 'Términos de uso, política de privacidad conforme a la Ley N° 19.628 y política de datos de Asesoría Legal Morgado, Cía. & Asociados.',
    noindex: true,
  },
  {
    file: 'etica-legal.html',
    canonical: 'https://morgadoyasociados.cl/etica-legal.html',
    title: 'Asesoría Legal Morgado, Cía. & Asociados | Ética Profesional',
    description: 'Principios de ética profesional, confidencialidad, independencia y transparencia de Asesoría Legal Morgado, Cía. & Asociados.',
    noindex: true,
  },
];

function readHtml(file) {
  return fs.readFileSync(path.join(webRoot, file), 'utf8');
}

for (const page of pages) {
  const html = readHtml(page.file);
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

  if (page.noindex) {
    assert.match(html, /<meta name="robots" content="noindex,follow">/);
  } else {
    assert.match(html, /<meta name="robots" content="index,follow,max-image-preview:large">/);
  }

  if (page.schema) {
    const scriptMatch = html.match(/<script type="application\/ld\+json">\s*([\s\S]*?)\s*<\/script>/);
    assert.ok(scriptMatch, `${page.file} is missing JSON-LD`);
    const structuredData = JSON.parse(scriptMatch[1]);
    assert.equal(structuredData['@context'], 'https://schema.org');
    assert.ok(Array.isArray(structuredData['@graph']));
    const graphTypes = structuredData['@graph'].map((entry) => entry['@type']);
    assert.ok(graphTypes.includes('LegalService'));
    assert.ok(graphTypes.includes('LocalBusiness'));
    for (const entry of structuredData['@graph']) {
      assert.equal(entry.name, 'Asesoría Legal Morgado, Cía. & Asociados');
      assert.match(entry.url, /^https:\/\/morgadoyasociados\.cl\/(?:contact\.html)?$/);
      assert.equal(entry.telephone, '+56 2 2345 6789');
      assert.equal(entry.email, 'contacto@morgadoyasociados.cl');
      assert.equal(entry.areaServed, 'Chile');
      assert.equal(entry.openingHours, 'Mo-Fr 09:00-18:00');
      assert.deepEqual(entry.address, {
        '@type': 'PostalAddress',
        streetAddress: 'Av. Providencia 1234, Of. 802',
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
assert.deepEqual(urls, [
  'https://morgadoyasociados.cl/',
  'https://morgadoyasociados.cl/about.html',
  'https://morgadoyasociados.cl/services.html',
  'https://morgadoyasociados.cl/results.html',
  'https://morgadoyasociados.cl/blog.html',
  'https://morgadoyasociados.cl/contact.html',
  'https://morgadoyasociados.cl/derecho-familia.html',
]);
assert.doesNotMatch(sitemap, /legal\.html|etica-legal\.html/);

const htaccess = fs.readFileSync(path.join(webRoot, '.htaccess'), 'utf8');
assert.match(htaccess, /Header always set X-Robots-Tag "noindex, nofollow, noarchive"/);

console.log('SEO technical configuration verified.');
