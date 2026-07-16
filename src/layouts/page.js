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
  let rendered = content;
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

function renderServiceLinks(content, serviceLinks = {}) {
  return renderServiceCards(rewriteServiceAnchors(content, serviceLinks), serviceLinks);
}

module.exports = function pageLayout(page, fragment) {
  const linkedContent = renderServiceLinks(fragment.pageContentBetweenShell, page.serviceLinks);
  const iconContent = replaceFontAwesomeIcons(linkedContent);
  const content = iconContent.includes('<main')
    ? iconContent.replace('<main', '<main id="main-content" tabindex="-1"')
    : `<main id="main-content" tabindex="-1">\n${iconContent}\n</main>`;
  const renderedContent = page.formFallbackAction
    ? content.replace(
      '<form id="contact-form"',
      `<form id="contact-form" action="${page.formFallbackAction}" method="post"`,
    ).replace(' novalidate', '')
    : content;

  return `<!DOCTYPE html>\n<html lang="es">\n${head(page)}\n<body data-page="${page.bodyData}">\n${fragment.shellOpenBeforeHeader}\n<a href="#main-content" class="skip-link">Saltar al contenido principal</a>\n${header(page)}\n${renderedContent}\n${footer(page)}\n${fragment.shellCloseAfterFooter}\n${scripts(page)}\n</body>\n</html>\n`;
};
