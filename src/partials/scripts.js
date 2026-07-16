module.exports = function scripts(page) {
  const animationScripts = page.usesAnimations
    ? '<script defer src="https://cdn.jsdelivr.net/npm/gsap@3/dist/gsap.min.js" integrity="sha384-XmJ9SoHtVOHoQUcKvFAzVXwdkKo1Ie3bhmSoIAkcdsHGaIrVJIkmozyq0FJeb/Ly" crossorigin="anonymous"></script>\n<script defer src="https://cdn.jsdelivr.net/npm/gsap@3/dist/ScrollTrigger.min.js" integrity="sha384-wl5TeDVvOWt30Pbf8aSo2ZrzsOjddu3avOBvHe+p+OhJt9gP6w9YXmDkN5DK2/dF" crossorigin="anonymous"></script>\n'
    : '';
  return `${animationScripts}<script defer src="assets/nav.js"></script>${page.usesAnimations ? '\n<script defer src="assets/animations.js"></script>' : ''}${page.optionalScript ? `\n<script defer src="${page.optionalScript}"></script>` : ''}`;
};
