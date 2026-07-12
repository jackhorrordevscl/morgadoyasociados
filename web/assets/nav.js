const mobileToggle = document.querySelector("[data-mobile-toggle]");
const mobileMenu = document.querySelector("[data-mobile-menu]");

if (mobileToggle && mobileMenu) {
  const setMobileMenu = (open) => {
    mobileMenu.classList.toggle("is-open", open);
    mobileMenu.inert = !open;
    mobileMenu.setAttribute("aria-hidden", String(!open));
    mobileToggle.setAttribute("aria-expanded", String(open));
    mobileToggle.setAttribute("aria-label", open ? "Cerrar menú" : "Abrir menú");
    mobileToggle.querySelector("i")?.classList.toggle("fa-xmark", open);
    mobileToggle.querySelector("i")?.classList.toggle("fa-bars", !open);
  };

  mobileToggle.addEventListener("click", () => {
    setMobileMenu(!mobileMenu.classList.contains("is-open"));
  });

  mobileMenu.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => setMobileMenu(false));
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && mobileMenu.classList.contains("is-open")) {
      setMobileMenu(false);
      mobileToggle.focus();
    }
  });

  setMobileMenu(false);

  window.addEventListener("resize", () => {
    if (window.innerWidth >= 1024) setMobileMenu(false);
  });
}
