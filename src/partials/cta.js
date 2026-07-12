const { site } = require('../data/site');

module.exports = function consultationCta(href, className) {
  return `<a href="${href}" class="btn-rose ${className}"><span class="h-1.5 w-1.5 rounded-full bg-(--rose-light)"></span>${site.ctaInitial}</a>`;
};
