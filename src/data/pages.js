const { site, titleFor, canonicalFor } = require('./site');

function definePage({ titleSuffix, robots = site.defaultRobots, sitemap = true, ...page }) {
  return {
    ...page,
    title: titleFor(titleSuffix),
    canonical: canonicalFor(page.filename),
    robots,
    sitemap,
  };
}

const pages = [
  definePage({ slug: 'index', filename: 'index.html', bodyData: 'home', activeNav: 'index', titleSuffix: 'Inicio', description: 'Defensa y asesoría legal de excelencia en Chile. Más de 20 años protegiendo la tranquilidad de personas y empresas con estrategias jurídicas a la medida.', preconnectUnsplash: true, jsonLd: true }),
  definePage({ slug: 'about', filename: 'about.html', bodyData: 'about', activeNav: 'about', titleSuffix: 'Sobre Nosotros', description: 'Conozca la trayectoria, el equipo y los principios de Asesoría Legal Morgado, Cía. & Asociados.', preconnectUnsplash: true, footer: 'extended' }),
  definePage({ slug: 'services', filename: 'services.html', bodyData: 'services', activeNav: 'services', titleSuffix: 'Servicios', description: 'Áreas de práctica y servicios legales de Asesoría Legal Morgado, Cía. & Asociados en Chile.' }),
  definePage({ slug: 'results', filename: 'results.html', bodyData: 'results', activeNav: 'results', titleSuffix: 'Casos & Resultados', description: 'Resultados medibles y testimonios reales de clientes de Asesoría Legal Morgado, Cía. & Asociados en Chile.' }),
  definePage({ slug: 'blog', filename: 'blog.html', bodyData: 'blog', activeNav: 'blog', titleSuffix: 'Blog & Publicaciones Legales', description: 'Artículos legales sobre Ley Karin y normativa educacional, defensa penal, divorcios y pensión de alimentos, derecho laboral e inmobiliario, escritos por abogados de Asesoría Legal Morgado, Cía. & Asociados en Chile.' }),
  definePage({ slug: 'contact', filename: 'contact.html', bodyData: 'contact', activeNav: 'contact', contactCta: '#contact-form', formFallbackAction: 'send-mail.php', titleSuffix: 'Contacto', description: 'Agende una consulta inicial con Asesoría Legal Morgado, Cía. & Asociados.', jsonLd: true, optionalScript: 'assets/contact.js' }),
  definePage({ slug: 'derecho-familia', filename: 'derecho-familia.html', bodyData: 'family-law', activeNav: 'services', navAriaCurrent: false, titleSuffix: 'Derecho de Familia', description: 'Orientación y representación en divorcio, alimentos, cuidado personal, relación directa y regular, y materias de familia en Chile.' }),
  definePage({ slug: 'legal', filename: 'legal.html', bodyData: 'legal', titleSuffix: 'Legal', description: 'Términos de uso, política de privacidad conforme a la Ley N° 19.628 y política de datos de Asesoría Legal Morgado, Cía. & Asociados.', robots: 'noindex,follow', sitemap: false }),
  definePage({ slug: 'etica-legal', filename: 'etica-legal.html', bodyData: 'ethics', titleSuffix: 'Ética Profesional', description: 'Principios de ética profesional, confidencialidad, independencia y transparencia de Asesoría Legal Morgado, Cía. & Asociados.', robots: 'noindex,follow', sitemap: false, footerCurrent: 'ethics' }),
];

module.exports = { pages };
