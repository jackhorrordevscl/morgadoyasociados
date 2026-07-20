const { site, organizationJsonLd, serviceJsonLd, escapeHtmlAttribute } = require('../data/site');

function jsonLd(canonical) {
  return `<script type="application/ld+json">\n${JSON.stringify({ '@context': 'https://schema.org', '@graph': [organizationJsonLd(canonical, 'LegalService', 'legalservice'), organizationJsonLd(canonical, 'LocalBusiness', 'localbusiness')] }, null, 2)}\n</script>`;
}

function serviceSchema(page) {
  return `<script type="application/ld+json">\n${JSON.stringify(serviceJsonLd(page.canonical, page.practiceArea, page.description), null, 2)}\n</script>`;
}

module.exports = function head(page) {
  const unsplash = page.preconnectUnsplash ? '\n<link rel="preconnect" href="https://images.unsplash.com" crossorigin>' : '';
  const animationCdn = page.usesAnimations ? '\n<link rel="preconnect" href="https://cdn.jsdelivr.net" crossorigin>' : '';
  return `<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${escapeHtmlAttribute(page.title)}</title>
<meta name="description" content="${escapeHtmlAttribute(page.description)}">
<meta name="author" content="${escapeHtmlAttribute(site.brandLongText)}">
<meta name="robots" content="${escapeHtmlAttribute(page.robots)}">
<link rel="canonical" href="${escapeHtmlAttribute(page.canonical)}">
<link rel="icon" href="${escapeHtmlAttribute(site.brandMark)}" type="image/png">
<meta property="og:locale" content="es_CL">
<meta property="og:type" content="website">
<meta property="og:site_name" content="${escapeHtmlAttribute(site.brandLongText)}">
<meta property="og:title" content="${escapeHtmlAttribute(page.title)}">
<meta property="og:description" content="${escapeHtmlAttribute(page.description)}">
<meta property="og:url" content="${escapeHtmlAttribute(page.canonical)}">
<meta property="og:image" content="${escapeHtmlAttribute(site.socialImage)}">
<meta property="og:image:secure_url" content="${escapeHtmlAttribute(site.socialImage)}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="${escapeHtmlAttribute(site.socialImageAlt)}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:domain" content="${escapeHtmlAttribute(site.domain)}">
<meta name="twitter:title" content="${escapeHtmlAttribute(page.title)}">
<meta name="twitter:description" content="${escapeHtmlAttribute(page.description)}">
<meta name="twitter:image" content="${escapeHtmlAttribute(site.socialImage)}">
<meta name="twitter:image:alt" content="${escapeHtmlAttribute(site.socialImageAlt)}">${page.jsonLd ? `\n${jsonLd(page.canonical)}` : ''}${page.practiceArea ? `\n${serviceSchema(page)}` : ''}
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>${animationCdn}${unsplash}
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;1,400;1,600&amp;family=Inter:wght@400;500;600&amp;display=swap">
<link rel="stylesheet" href="assets/tailwind.css">
<link rel="stylesheet" href="assets/site.css">
</head>`;
};
