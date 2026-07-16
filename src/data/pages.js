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
  definePage({ slug: 'index', filename: 'index.html', bodyData: 'home', activeNav: 'index', titleSuffix: 'Inicio', description: 'Defensa y asesoría legal de excelencia en Chile. Más de 20 años protegiendo la tranquilidad de personas y empresas con estrategias jurídicas a la medida.', preconnectUnsplash: true, jsonLd: true, serviceLinks: { Penal: 'penal.html', Civil: 'civil.html', Educacional: 'educacional.html', Inmobiliaria: 'inmobiliaria.html', Laboral: 'laboral.html', 'Decreto ley 2.695': 'decreto-ley-2695.html', Aeronáutico: 'aeronautico.html', Administrativo: 'administrativo.html' } }),
  definePage({ slug: 'about', filename: 'about.html', bodyData: 'about', activeNav: 'about', titleSuffix: 'Sobre Nosotros', description: 'Conozca la trayectoria, el equipo y los principios de Asesoría Legal Morgado, Cía. & Asociados.', preconnectUnsplash: true, footer: 'extended' }),
  definePage({ slug: 'services', filename: 'services.html', bodyData: 'services', activeNav: 'services', titleSuffix: 'Servicios', description: 'Áreas de práctica y servicios legales de Asesoría Legal Morgado, Cía. & Asociados en Chile.', serviceLinks: { Penal: 'penal.html', Civil: 'civil.html', Educacional: 'educacional.html', Inmobiliaria: 'inmobiliaria.html', Laboral: 'laboral.html', 'Decreto Ley 2.695': 'decreto-ley-2695.html', Aeronáutico: 'aeronautico.html', Administrativo: 'administrativo.html' } }),
  definePage({ slug: 'results', filename: 'results.html', bodyData: 'results', activeNav: 'results', titleSuffix: 'Casos & Resultados', description: 'Resultados medibles y testimonios reales de clientes de Asesoría Legal Morgado, Cía. & Asociados en Chile.' }),
  definePage({ slug: 'blog', filename: 'blog.html', bodyData: 'blog', activeNav: 'blog', titleSuffix: 'Blog & Publicaciones Legales', description: 'Artículos legales sobre Ley Karin y normativa educacional, defensa penal, divorcios y pensión de alimentos, derecho laboral e inmobiliario, escritos por abogados de Asesoría Legal Morgado, Cía. & Asociados en Chile.' }),
  definePage({ slug: 'contact', filename: 'contact.html', bodyData: 'contact', activeNav: 'contact', contactCta: '#contact-form', formFallbackAction: 'send-mail.php', titleSuffix: 'Contacto', description: 'Agende una consulta inicial con Asesoría Legal Morgado, Cía. & Asociados.', jsonLd: true, optionalScript: 'assets/contact.js' }),
  definePage({ slug: 'derecho-familia', filename: 'derecho-familia.html', bodyData: 'family-law', activeNav: 'services', navAriaCurrent: false, titleSuffix: 'Derecho de Familia', description: 'Orientación y representación en divorcio, alimentos, cuidado personal, relación directa y regular, y materias de familia en Chile.' }),
  definePage({ slug: 'educacional', filename: 'educacional.html', bodyData: 'education-law', activeNav: 'services', navAriaCurrent: false, titleSuffix: 'Derecho Educacional', description: 'Orientación jurídica en derecho educacional en Chile sobre convivencia escolar, reglamentos, procedimientos, inclusión y gestiones ante la Superintendencia de Educación.' }),
  definePage({ slug: 'inmobiliaria', filename: 'inmobiliaria.html', bodyData: 'real-estate', activeNav: 'services', navAriaCurrent: false, titleSuffix: 'Inmobiliaria', description: 'Asesoría legal inmobiliaria en Chile para revisión de títulos, compraventas, arriendos, copropiedad, regularización y prevención de controversias.' }),
  definePage({ slug: 'penal', filename: 'penal.html', bodyData: 'criminal-law', activeNav: 'services', navAriaCurrent: false, titleSuffix: 'Derecho Penal', description: 'Defensa penal y asesoría en Chile durante investigaciones, audiencias y juicio oral, junto con representación de víctimas y prevención de riesgos penales.' }),
  definePage({ slug: 'civil', filename: 'civil.html', bodyData: 'civil-law', activeNav: 'services', navAriaCurrent: false, titleSuffix: 'Derecho Civil', description: 'Asesoría y representación en derecho civil en Chile: contratos, responsabilidad civil, herencias, posesión, cobranzas, consumo y prevención de controversias.' }),
  definePage({ slug: 'laboral', filename: 'laboral.html', bodyData: 'labor-law', activeNav: 'services', navAriaCurrent: false, titleSuffix: 'Derecho Laboral', description: 'Asesoría y representación en derecho laboral en Chile para personas y empleadores: contratos, despidos, Ley Karin, negociaciones colectivas, accidentes y procesos administrativos.' }),
  definePage({ slug: 'decreto-ley-2695', filename: 'decreto-ley-2695.html', bodyData: 'decree-law-2695', activeNav: 'services', navAriaCurrent: false, titleSuffix: 'Decreto Ley 2.695', description: 'Orientación jurídica en Chile para la regularización de pequeña propiedad raíz conforme al Decreto Ley N° 2.695, con revisión de antecedentes, posesión y procedimiento administrativo.' }),
  definePage({ slug: 'administrativo', filename: 'administrativo.html', bodyData: 'administrative-law', activeNav: 'services', navAriaCurrent: false, titleSuffix: 'Derecho Administrativo', description: 'Asesoría jurídica en derecho administrativo en Chile para procedimientos, recursos, actos administrativos, fiscalizaciones y gestiones ante organismos públicos.' }),
  definePage({ slug: 'aeronautico', filename: 'aeronautico.html', bodyData: 'aeronautical-law', activeNav: 'services', navAriaCurrent: false, titleSuffix: 'Derecho Aeronáutico', description: 'Orientación jurídica en derecho aeronáutico en Chile para operaciones, autorizaciones, contratos, cumplimiento normativo y procedimientos ante la autoridad competente.' }),
  definePage({ slug: 'legal', filename: 'legal.html', bodyData: 'legal', titleSuffix: 'Legal', description: 'Términos de uso, política de privacidad conforme a la Ley N° 19.628 y política de datos de Asesoría Legal Morgado, Cía. & Asociados.', robots: 'noindex,follow', sitemap: false }),
  definePage({ slug: 'etica-legal', filename: 'etica-legal.html', bodyData: 'ethics', titleSuffix: 'Ética Profesional', description: 'Principios de ética profesional, confidencialidad, independencia y transparencia de Asesoría Legal Morgado, Cía. & Asociados.', robots: 'noindex,follow', sitemap: false, footerCurrent: 'ethics' }),
];

module.exports = { pages };
