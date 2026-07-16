const brand = require('./brand');
const consultationCta = require('./cta');
const { navigation, serviceAreas } = require('../data/navigation');
const { icon } = require('./icon');

function navLink([key, href, label], page, mobile) {
  const active = page.activeNav === key;
  const current = active && page.navAriaCurrent !== false ? ' aria-current="page"' : '';
  const classes = mobile
    ? active ? 'rounded-xl px-4 py-3 font-medium text-(--rose-dark) bg-(--beige-light)' : 'rounded-xl px-4 py-3 hover:bg-(--beige-light) transition-colors'
    : active ? 'link-underline text-(--rose-dark) font-medium' : 'link-underline';
  return `<a href="${href}"${current} class="${classes}">${label}</a>`;
}

function serviceLinks(classes) {
  return serviceAreas.map(([, href, label]) => `<li><a href="${href}" class="${classes}">${label}</a></li>`).join('');
}

function desktopNavItem(item, page) {
  if (item[0] !== 'services') return `<li>${navLink(item, page, false)}</li>`;

  const active = page.activeNav === 'services';
  const current = active && page.navAriaCurrent !== false ? ' aria-current="page"' : '';
  const classes = active ? 'link-underline text-(--rose-dark) font-medium' : 'link-underline';
  return `<li class="relative" data-services-menu><div class="flex items-center gap-1"><a href="services.html"${current} class="${classes}">Servicios</a><button type="button" class="grid h-6 w-6 place-items-center rounded-full text-(--rose-dark) transition-colors hover:bg-(--beige-light)" aria-label="Abrir áreas de práctica" aria-expanded="false" aria-controls="services-menu" data-services-toggle><svg class="h-3 w-3" width="1em" height="1em" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="m5 7 5 5 5-5"/></svg></button></div><div id="services-menu" class="services-menu-panel absolute left-1/2 top-full z-10 mt-4 w-72 -translate-x-1/2 rounded-2xl border border-white/70 bg-white/95 p-3 shadow-[0_18px_44px_-24px_rgba(58,50,53,0.5)] backdrop-blur-md" hidden data-services-panel><p class="px-3 pb-2 pt-1 text-[10px] font-medium uppercase tracking-[0.2em] text-(--copper)">Áreas de práctica</p><ul class="grid gap-1">${serviceLinks('block rounded-xl px-3 py-2 text-[13px] text-(--charcoal) transition-colors hover:bg-(--beige-light) focus-visible:bg-(--beige-light)')}</ul></div></li>`;
}

function mobileServices(page) {
  const active = page.activeNav === 'services';
  const current = active && page.navAriaCurrent !== false ? ' aria-current="page"' : '';
  return `<details class="rounded-xl ${active ? 'bg-(--beige-light)' : ''}" data-mobile-services><summary class="flex cursor-pointer list-none items-center justify-between px-4 py-3 font-medium ${active ? 'text-(--rose-dark)' : ''}">Servicios<svg class="h-3 w-3" width="1em" height="1em" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="m5 7 5 5 5-5"/></svg></summary><div class="grid gap-1 border-t border-(--beige-main) px-2 pb-2 pt-2"><a href="services.html"${current} class="rounded-lg px-3 py-2 text-sm font-medium text-(--rose-dark) hover:bg-white">Ver todas las áreas</a><ul class="grid gap-1">${serviceLinks('block rounded-lg px-3 py-2 text-sm hover:bg-white')}</ul></div></details>`;
}

module.exports = function header(page) {
  const cta = page.contactCta || 'contact.html';
  return `<header class="fixed top-0 inset-x-0 z-50 px-4 sm:px-6 lg:px-10 pt-4 sm:pt-5">
  <nav class="mx-auto max-w-340 flex items-center justify-between rounded-full border border-white/40 bg-white/70 backdrop-blur-md px-4 sm:px-6 lg:px-8 py-3 shadow-[0_10px_40px_-18px_rgba(58,50,53,0.35)]">
    <div class="shrink-0">${brand('short', 'light')}</div>
    <ul class="hidden xl:flex items-center gap-9 text-[13px] tracking-wide text-(--charcoal)/85">${navigation.map((item) => desktopNavItem(item, page)).join('')}</ul>
    <div class="hidden xl:flex items-center">${consultationCta(cta, 'shrink-0 inline-flex items-center gap-2 rounded-full bg-(--rose-dark) px-5 py-2.5 text-[13px] font-medium text-white transition-colors')}</div>
    <button type="button" class="xl:hidden grid h-10 w-10 place-items-center rounded-full border border-(--beige-dark)/40 text-(--rose-dark)" aria-label="Abrir menú" aria-expanded="false" aria-controls="mobile-menu" data-mobile-toggle>${icon('bars', 'h-4 w-4')}<span hidden data-mobile-close-icon>${icon('xmark', 'h-4 w-4')}</span></button>
  </nav>
</header>
<div id="mobile-menu" class="mobile-menu fixed inset-x-4 top-20 z-40 mx-auto max-h-[calc(100dvh-6rem)] max-w-340 overflow-y-auto rounded-lg border border-white/50 bg-white/90 p-4 shadow-[0_18px_44px_-24px_rgba(58,50,53,0.5)] backdrop-blur-md sm:inset-x-6 sm:top-24 xl:hidden" data-mobile-menu><div class="grid gap-1 text-[15px] text-(--charcoal)">${navigation.map((item) => item[0] === 'services' ? mobileServices(page) : navLink(item, page, true)).join('')}</div>${consultationCta(cta, 'mt-3 flex items-center justify-center gap-2 rounded-full bg-(--rose-dark) px-5 py-3 text-sm font-medium text-white transition-colors')}</div>`;
};
