const { site } = require('../data/site');

module.exports = function brand(variant = 'short', surface = 'dark') {
  const isLong = variant === 'long';
  const isLightSurface = surface === 'light';
  const chipClasses = isLightSurface
    ? 'grid place-items-center h-9 w-9 rounded-full border border-(--rose-dark)/15 bg-white/88 shadow-[0_6px_16px_-10px_rgba(58,50,53,0.35)]'
    : 'grid place-items-center h-9 w-9 rounded-full border border-(--rose-light)/70 bg-white/10';
  const markClasses = 'brand-mark h-6 w-6 rounded-full object-cover';
  const textClasses = isLightSurface
    ? 'font-serif text-(--rose-dark) text-[15.5px] leading-tight'
    : 'font-serif text-white text-[15.5px] leading-tight';

  return `<a href="index.html" class="brand-link flex items-center gap-3.5"><span class="brand-chip ${chipClasses}"><img src="${site.brandMark}" alt="" aria-hidden="true" class="${markClasses}"></span><span class="${textClasses}">${isLong ? site.brandLongHtml : site.brandShortHtml}</span></a>`;
};
