(() => {
  if (!window.gsap || !window.ScrollTrigger || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  gsap.registerPlugin(ScrollTrigger);
  const page = document.body.dataset.page;

  const batchReveal = (selector, y, options = {}) => {
    gsap.set(selector, { autoAlpha: 0, y });
    ScrollTrigger.batch(selector, {
      start: options.start || 'top 88%',
      batchMax: options.batchMax,
      interval: options.interval,
      onEnter: (elements) => gsap.to(elements, {
        autoAlpha: 1, y: 0,
        duration: options.duration || 0.7,
        stagger: options.stagger || 0.1,
        ease: options.ease || 'power2.out',
        overwrite: true
      })
    });
  };

  const animateHero = ({ cta = false, line = true, subDelay = 0.9 } = {}) => {
    gsap.from('.hero-eyebrow', { y: 20, autoAlpha: 0, duration: 0.8, delay: 0.2, ease: 'power2.out' });
    if (line) gsap.from('.hero-line', { y: 40, autoAlpha: 0, duration: 0.9, delay: 0.35, stagger: 0.12, ease: 'power3.out' });
    gsap.from('.hero-sub', { y: 20, autoAlpha: 0, duration: 0.8, delay: subDelay, stagger: line ? 0 : 0.1, ease: 'power2.out' });
    if (cta) gsap.from('.hero-cta', { y: 20, autoAlpha: 0, duration: 0.8, delay: 1.05, ease: 'power2.out' });
  };

  const animateCta = () => gsap.from('.cta-head', {
    autoAlpha: 0, y: 30, duration: 0.9, ease: 'power3.out',
    scrollTrigger: { trigger: '.cta-head', start: 'top 85%' }
  });

  if (page === 'home') {
    animateHero({ cta: true });
    gsap.to('.hero-img-wrap', { yPercent: -8, ease: 'none', scrollTrigger: { trigger: '#inicio', start: 'top top', end: 'bottom top', scrub: true } });
    batchReveal('.value-item', 32, { stagger: 0.12 });
    gsap.from('.area-row', { autoAlpha: 0, x: -20, duration: 0.6, stagger: 0.06, ease: 'power2.out', scrollTrigger: { trigger: '#servicios', start: 'top 70%' } });
    animateCta();
  } else if (page === 'about') {
    gsap.from('#estudio-about .line-inner', { yPercent: 110, duration: 0.85, delay: 0.2, stagger: 0.11, ease: 'power4.out' });
    batchReveal('#estudio-about .team-card', 40, { duration: 0.7, stagger: 0.12, ease: 'power3.out' });
    batchReveal('#estudio-about .diff-block', 24, { start: 'top 90%', duration: 0.65, ease: 'power3.out' });
  } else if (page === 'blog') {
    animateHero({ cta: true });
    batchReveal('.trust-item', 32, { stagger: 0.12 });
    batchReveal('.post-card', 34, { start: 'top 90%', batchMax: 6, interval: 0.08, duration: 0.55, stagger: 0.07 });
    animateCta();
  } else if (page === 'contact') {
    gsap.from('.reveal-content', { y: 40, autoAlpha: 0, duration: 0.9, ease: 'power3.out', stagger: 0.18, scrollTrigger: { trigger: '.reveal-content', start: 'top 82%' } });
  } else if (page === 'legal') {
    animateHero({ line: false, subDelay: 0.4 });
    animateCta();
    const tocLinks = document.querySelectorAll('.toc-link');
    const setActiveToc = (id) => tocLinks.forEach((link) => link.classList.toggle('is-active', link.getAttribute('href') === `#${id}`));
    ScrollTrigger.batch(document.querySelectorAll('.legal-section'), {
      start: 'top 40%', end: 'bottom 40%',
      onEnter: (elements) => elements.forEach((element) => setActiveToc(element.id)),
      onEnterBack: (elements) => elements.forEach((element) => setActiveToc(element.id))
    });
  } else if (page === 'results') {
    animateHero();
    batchReveal('.stat-item', 32, { stagger: 0.12 });
    batchReveal('.case-card', 32, { start: 'top 90%', duration: 0.6 });
    batchReveal('.quote-card', 28, { start: 'top 90%', duration: 0.6 });
    animateCta();
  } else if (page === 'services') {
    batchReveal('.svc', 34, { batchMax: 6, interval: 0.08, duration: 0.55, stagger: 0.07 });
    batchReveal('.proc-step', 28, { start: 'top 90%', duration: 0.5 });
  }
})();
