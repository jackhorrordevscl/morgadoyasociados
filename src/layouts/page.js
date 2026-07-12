const head = require('../partials/head');
const header = require('../partials/header');
const footer = require('../partials/footer');
const scripts = require('../partials/scripts');

module.exports = function pageLayout(page, fragment) {
  const content = fragment.pageContentBetweenShell.includes('<main')
    ? fragment.pageContentBetweenShell.replace('<main', '<main id="main-content" tabindex="-1"')
    : `<main id="main-content" tabindex="-1">\n${fragment.pageContentBetweenShell}\n</main>`;
  const renderedContent = page.formFallbackAction
    ? content.replace(
      '<form id="contact-form"',
      `<form id="contact-form" action="${page.formFallbackAction}" method="post"`,
    ).replace(' novalidate', '')
    : content;

  return `<!DOCTYPE html>\n<html lang="es">\n${head(page)}\n<body data-page="${page.bodyData}">\n${fragment.shellOpenBeforeHeader}\n<a href="#main-content" class="skip-link">Saltar al contenido principal</a>\n${header(page)}\n${renderedContent}\n${footer(page)}\n${fragment.shellCloseAfterFooter}\n${scripts(page)}\n</body>\n</html>\n`;
};
