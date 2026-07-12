const site = {
  baseUrl: 'https://morgadoyasociados.cl',
  domain: 'morgadoyasociados.cl',
  brandLongHtml: 'Asesoría Legal Morgado, Cía. &amp; Asociados',
  brandShortHtml: 'Morgado, Cía. &amp; Asociados',
  brandLongText: 'Asesoría Legal Morgado, Cía. & Asociados',
  brandMarkSvg: 'img/2.svg',
  ctaInitial: 'Agende su consulta',
  defaultRobots: 'index,follow,max-image-preview:large',
  email: 'contacto@morgadoyasociados.cl',
  phone: '+56 2 2345 6789',
  address: {
    '@type': 'PostalAddress',
    streetAddress: 'Av. Providencia 1234, Of. 802',
    addressLocality: 'Santiago',
    addressRegion: 'Región Metropolitana',
    addressCountry: 'CL',
  },
  socialImage: 'https://images.unsplash.com/photo-1627518788331-b3b7fdaa382f?auto=format&fit=crop&w=1200&h=630&q=80',
  socialImageAlt: 'Persona firmando un documento',
};

function titleFor(suffix) {
  return `${site.brandLongText} | ${suffix}`;
}

function canonicalFor(filename) {
  return filename === 'index.html' ? `${site.baseUrl}/` : `${site.baseUrl}/${filename}`;
}

function organizationJsonLd(canonical, type, id) {
  return {
    '@type': type,
    '@id': `${site.baseUrl}/#${id}`,
    name: site.brandLongText,
    url: canonical,
    telephone: site.phone,
    email: site.email,
    address: site.address,
    areaServed: 'Chile',
    openingHours: 'Mo-Fr 09:00-18:00',
  };
}

function escapeHtmlAttribute(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

module.exports = { site, titleFor, canonicalFor, organizationJsonLd, escapeHtmlAttribute };
