const site = {
  baseUrl: 'https://morgadoyasociados.cl',
  domain: 'morgadoyasociados.cl',
  brandLongHtml: 'Asesoría Legal Morgado, Cía. &amp; Asociados',
  brandShortHtml: 'Morgado, Cía. &amp; Asociados',
  brandLongText: 'Asesoría Legal Morgado, Cía. & Asociados',
  brandMark: 'img/logo.png',
  ctaInitial: 'Agende su consulta',
  defaultRobots: 'index,follow,max-image-preview:large',
  email: 'contacto@morgadoyasociados.cl',
  phone: '+56 2 2638 1456',
  address: {
    '@type': 'PostalAddress',
    streetAddress: 'Santa Lucía 270, Piso 6, Of. 601',
    addressLocality: 'Santiago',
    addressRegion: 'Región Metropolitana',
    postalCode: '8320190',
    addressCountry: 'CL',
  },
  // NOTE (issue #39): og:image/twitter:image is intentionally a single shared
  // Unsplash URL across all 17 pages. Per-practice-area social images would be
  // the better fix, but the repo has no real photography for each legal area
  // (web/img only has the firm logo and two generic silhouette placeholders,
  // neither of which reads as "per category"). Faking distinct images from
  // those assets, or inventing new external URLs, would trade one unverified
  // dependency for another. This is deferred until the client supplies actual
  // per-area photography; tests/seo.spec.js now fetches this URL for real
  // (not just string-matches the HTML) so a broken image is caught in CI.
  socialImage: 'https://images.unsplash.com/photo-1627518788331-b3b7fdaa382f?auto=format&fit=crop&w=1200&h=630&q=80',
  socialImageAlt: 'Persona firmando un documento',
};

function titleFor(suffix, keywordFirst = false) {
  return keywordFirst ? `${suffix} | ${site.brandLongText}` : `${site.brandLongText} | ${suffix}`;
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
    image: `${site.baseUrl}/${site.brandMark}`,
    logo: `${site.baseUrl}/${site.brandMark}`,
    areaServed: 'Chile',
    openingHours: 'Mo-Fr 09:00-18:00',
  };
}

function serviceJsonLd(canonical, serviceType, description) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Service',
    serviceType,
    name: `${serviceType} | ${site.brandLongText}`,
    description,
    url: canonical,
    areaServed: 'Chile',
    provider: {
      '@type': 'LegalService',
      '@id': `${site.baseUrl}/#legalservice`,
      name: site.brandLongText,
      telephone: site.phone,
      email: site.email,
      address: site.address,
      image: `${site.baseUrl}/${site.brandMark}`,
      logo: `${site.baseUrl}/${site.brandMark}`,
    },
  };
}

function breadcrumbJsonLd(canonical, label) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Servicios', item: `${site.baseUrl}/services.html` },
      { '@type': 'ListItem', position: 2, name: label, item: canonical },
    ],
  };
}

function escapeHtmlAttribute(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

module.exports = { site, titleFor, canonicalFor, organizationJsonLd, serviceJsonLd, breadcrumbJsonLd, escapeHtmlAttribute };
