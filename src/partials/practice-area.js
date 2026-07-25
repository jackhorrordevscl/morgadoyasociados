module.exports = function practiceAreaIntro({ breadcrumbLabel, titlePrefix, titleHighlight, description }) {
  return `<nav aria-label="Ubicación actual" class="absolute inset-x-0 top-24 z-10">
  <ol class="mx-auto flex max-w-360 items-center gap-2 px-6 sm:px-14 lg:px-24 text-[11px] uppercase tracking-[0.22em] text-(--beige-dark)">
    <li><a href="services.html" class="link-underline hover:text-(--rose-dark)">Servicios</a></li>
    <li aria-hidden="true">/</li>
    <li aria-current="page" class="font-medium text-(--copper)">${breadcrumbLabel}</li>
  </ol>
</nav>
<section class="relative">
  <div class="mx-auto max-w-360 px-6 sm:px-14 lg:px-24 pt-32 sm:pt-40 pb-14 sm:pb-20">
    <div class="hero-eyebrow flex items-center gap-4 mb-6 sm:mb-8">
      <span class="mt-2 h-px w-8 sm:w-10 bg-(--copper)"></span>
      <span class="text-[11px] uppercase tracking-[0.32em] text-(--copper) font-medium">Área de práctica</span>
    </div>
    <h1 class="font-serif text-(--rose-dark) leading-[1.05] text-[clamp(2.4rem,6vw,4.6rem)] max-w-4xl">${titlePrefix} <span class="italic">${titleHighlight}</span></h1>
    <p class="mt-6 sm:mt-8 max-w-2xl text-[15px] sm:text-[15.5px] leading-relaxed text-(--gray-text)">${description}</p>
    <div class="mt-8"><a href="contact.html" class="btn-rose inline-flex items-center gap-2.5 rounded-full bg-(--rose-dark) px-7 py-3.5 text-sm font-medium text-white transition-colors">Solicitar una consulta <i class="fa-solid fa-arrow-right-long" aria-hidden="true"></i></a></div>
  </div>
</section>`;
};
