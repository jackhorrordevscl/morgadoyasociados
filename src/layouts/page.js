const head = require('../partials/head');
const header = require('../partials/header');
const footer = require('../partials/footer');
const scripts = require('../partials/scripts');
const { replaceFontAwesomeIcons } = require('../partials/icon');

function rewriteServiceAnchors(content, serviceLinks) {
  return content.replace(/<a\b([^>]*\bhref=")[^"]*("[^>]*)>([\s\S]*?)<\/a>/g, (match, beforeHref, afterHref, body) => {
    const label = Object.keys(serviceLinks).find((service) => body.replace(/<[^>]+>/g, ' ').includes(service));
    return label ? `<a${beforeHref}${serviceLinks[label]}${afterHref}>${body}</a>` : match;
  });
}

function findMatchingDiv(content, start) {
  let depth = 0;
  let position = start;

  while (position >= 0) {
    const opening = content.indexOf('<div', position);
    const closing = content.indexOf('</div>', position);
    if (closing < 0) return -1;

    if (opening >= 0 && opening < closing) {
      const openingEnd = content.indexOf('>', opening);
      if (openingEnd < 0) return -1;
      depth += 1;
      position = openingEnd + 1;
    } else {
      depth -= 1;
      if (depth === 0) return closing + '</div>'.length;
      position = closing + '</div>'.length;
    }
  }

  return -1;
}

function cardLabel(card) {
  const headingStart = card.indexOf('<h3');
  if (headingStart < 0) return null;

  const headingOpenEnd = card.indexOf('>', headingStart);
  if (headingOpenEnd < 0) return null;

  const headingEnd = card.indexOf('</h3>', headingOpenEnd);
  if (headingEnd < 0) return null;
  return card.slice(headingOpenEnd + 1, headingEnd).trim();
}

function renderServiceCards(content, serviceLinks) {
  let rendered = content
    .replace('columns-1 md:columns-2 lg:columns-3 gap-6', 'service-grid grid grid-cols-1 md:grid-cols-2 gap-6')
    .replace(/\bbreak-inside-avoid mb-6\s*/g, '');
  let cardStart = rendered.indexOf('<div class="svc');

  while (cardStart >= 0) {
    const cardEnd = findMatchingDiv(rendered, cardStart);
    if (cardEnd < 0) return rendered;

    const card = rendered.slice(cardStart, cardEnd);
    const href = serviceLinks[cardLabel(card)];
    if (href) {
      const attributes = card.slice('<div'.length, -'</div>'.length).replace(
        /\bclass="([^"]*)"/,
        (match, classes) => (/(^|\s)block(\s|$)/.test(classes) ? match : `class="${classes} block"`),
      );
      const linkedCard = `<a href="${href}"${attributes}</a>`;
      rendered = `${rendered.slice(0, cardStart)}${linkedCard}${rendered.slice(cardEnd)}`;
      cardStart += linkedCard.length;
    } else {
      cardStart = cardEnd;
    }
    cardStart = rendered.indexOf('<div class="svc', cardStart);
  }

  return rendered;
}

function normalizeServiceCardIcons(content) {
  return content.replace(/<svg class="text-3xl"/g, '<svg class="svc-icon text-3xl"');
}

function renderServiceLinks(content, serviceLinks = {}) {
  return renderServiceCards(rewriteServiceAnchors(content, serviceLinks), serviceLinks);
}

function addClass(classes, className) {
  return classes.split(/\s+/).includes(className) ? classes : `${classes} ${className}`;
}

function normalizeActionIcons(content) {
  return content.replace(/(<a\b[^>]*\bclass="[^"]*\bbtn-rose\b[^"]*"[^>]*>[\s\S]*?<\/a>)/g, (cta) => cta.replace(/<svg\b([^>]*)>/g, (svg, attributes) => {
    const stroked = /\bstroke-width="[^"]*"/.test(attributes)
      ? attributes.replace(/\bstroke-width="[^"]*"/, 'stroke-width="2"')
      : `${attributes} stroke-width="2"`;
    return `<svg${stroked} data-icon-role="action">`;
  }));
}

function renderServicePage(content, page) {
  if (page.activeNav !== 'services' || page.navAriaCurrent !== false) return content;

  return content.replace(/\bclass="([^"]*\bbtn-rose\b[^"]*)"/g, (match, classes) => {
    return `class="${addClass(classes, 'shadow-[0_16px_34px_-16px_rgba(140,75,92,0.9)]')}"`;
  });
}

const responsiveImageSettings = {
  index: {
    'https://images.unsplash.com/photo-1627518788331-b3b7fdaa382f?auto=format&w=1000&q=80&fit=crop': {
      sizes: '(min-width: 1440px) 684px, (min-width: 1024px) 47.5vw, 100vw',
      widths: [480, 768, 1000, 1440],
    },
  },
  about: {
    'https://images.unsplash.com/photo-1518556336318-c8de4355ccab?auto=format&w=400&q=80&fit=crop': { sizes: '176px', widths: [176, 352] },
    'https://images.unsplash.com/photo-1585240975735-4826abe53080?auto=format&w=400&q=80&fit=crop': { sizes: '176px', widths: [176, 352] },
    'https://images.unsplash.com/photo-1645990543673-53d612fee13e?auto=format&w=400&q=80&fit=crop': { sizes: '176px', widths: [176, 352] },
    'https://images.unsplash.com/photo-1612283061725-f22721e5a3cd?auto=format&w=400&q=80&fit=crop': { sizes: '176px', widths: [176, 352] },
  },
};

function renderResponsiveImages(content, slug) {
  const settings = responsiveImageSettings[slug];
  if (!settings) return content;

  return content.replace(/<img\b[^>]*\bsrc="([^"]+)"[^>]*>/g, (image, src) => {
    const setting = settings[src];
    if (!setting) return image;

    const srcset = setting.widths
      .map((width) => `${src.replace(/([?&])w=\d+/, `$1w=${width}`)} ${width}w`)
      .join(', ');
    return image.replace(`src="${src}"`, `src="${src}" srcset="${srcset}" sizes="${setting.sizes}"`);
  });
}

module.exports = function pageLayout(page, fragment) {
  const linkedContent = renderServiceLinks(fragment.pageContentBetweenShell, page.serviceLinks);
  const serviceContent = renderServicePage(linkedContent, page);
  const responsiveContent = renderResponsiveImages(serviceContent, page.slug);
  const iconContent = normalizeServiceCardIcons(replaceFontAwesomeIcons(responsiveContent));
  const normalizedContent = normalizeActionIcons(iconContent);
  const content = normalizedContent.includes('<main')
    ? normalizedContent.replace('<main', '<main id="main-content" tabindex="-1"')
    : `<main id="main-content" tabindex="-1">\n${normalizedContent}\n</main>`;
  const renderedContent = page.formFallbackAction
    ? content.replace(
      '<form id="contact-form"',
      `<form id="contact-form" action="${page.formFallbackAction}" method="post"`,
    ).replace(' novalidate', '')
    : content;

  return `<!DOCTYPE html>\n<html lang="es">\n${head(page)}\n<body data-page="${page.bodyData}">\n${fragment.shellOpenBeforeHeader}\n<a href="#main-content" class="skip-link">Saltar al contenido principal</a>\n${header(page)}\n${renderedContent}\n${footer(page)}\n${fragment.shellCloseAfterFooter}\n${scripts(page)}\n</body>\n</html>\n`;
};
