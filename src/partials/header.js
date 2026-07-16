const brand = require('./brand');
const consultationCta = require('./cta');
const { navigation } = require('../data/navigation');
const { icon } = require('./icon');

function navLink([key, href, label], page, mobile) {
  const active = page.activeNav === key;
  const current = active && page.navAriaCurrent !== false ? ' aria-current="page"' : '';
  const classes = mobile
    ? active ? 'rounded-xl px-4 py-3 font-medium text-(--rose-dark) bg-(--beige-light)' : 'rounded-xl px-4 py-3 hover:bg-(--beige-light) transition-colors'
    : active ? 'link-underline text-(--rose-dark) font-medium' : 'link-underline';
  return `<a href="${href}"${current} class="${classes}">${label}</a>`;
}

module.exports = function header(page) {
  const cta = page.contactCta || 'contact.html';
  return `<header class="fixed top-0 inset-x-0 z-50 px-4 sm:px-6 lg:px-10 pt-4 sm:pt-5">
  <nav class="mx-auto max-w-340 flex items-center justify-between rounded-full border border-white/40 bg-white/70 backdrop-blur-md px-4 sm:px-6 lg:px-8 py-3 shadow-[0_10px_40px_-18px_rgba(58,50,53,0.35)]">
    <div class="shrink-0">${brand('short', 'light')}</div>
    <ul class="hidden lg:flex items-center gap-9 text-[13px] tracking-wide text-(--charcoal)/85">${navigation.map((item) => `<li>${navLink(item, page, false)}</li>`).join('')}</ul>
    <div class="hidden sm:flex lg:flex items-center">${consultationCta(cta, 'shrink-0 inline-flex items-center gap-2 rounded-full bg-(--rose-dark) px-5 py-2.5 text-[13px] font-medium text-white transition-colors')}</div>
    <button type="button" class="lg:hidden grid h-10 w-10 place-items-center rounded-full border border-(--beige-dark)/40 text-(--rose-dark)" aria-label="Abrir menú" aria-expanded="false" aria-controls="mobile-menu" data-mobile-toggle>${icon('bars', 'h-4 w-4')}</button>
  </nav>
  <div id="mobile-menu" class="mobile-menu lg:hidden mx-auto mt-3 max-w-340 rounded-lg border border-white/50 bg-white/90 backdrop-blur-md p-4 shadow-[0_18px_44px_-24px_rgba(58,50,53,0.5)]" data-mobile-menu><div class="grid gap-1 text-[15px] text-(--charcoal)">${navigation.map((item) => navLink(item, page, true)).join('')}</div>${consultationCta(cta, 'mt-3 flex items-center justify-center gap-2 rounded-full bg-(--rose-dark) px-5 py-3 text-sm font-medium text-white transition-colors')}</div>
</header>`;
};
