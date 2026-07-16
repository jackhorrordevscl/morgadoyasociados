const mobileToggle = document.querySelector("[data-mobile-toggle]");
const mobileMenu = document.querySelector("[data-mobile-menu]");

if (mobileToggle && mobileMenu) {
  let focusFrame;
  const focusableItems = () => [...mobileMenu.querySelectorAll('a, button, summary, [tabindex]:not([tabindex="-1"])')]
    .filter((element) => !element.hasAttribute('disabled'));
  const setMobileMenu = (open, returnFocus = false) => {
    if (focusFrame !== undefined) {
      window.cancelAnimationFrame(focusFrame);
      focusFrame = undefined;
    }
    mobileMenu.classList.toggle("is-open", open);
    mobileMenu.inert = !open;
    mobileMenu.setAttribute("aria-hidden", String(!open));
    mobileToggle.setAttribute("aria-expanded", String(open));
    mobileToggle.setAttribute("aria-label", open ? "Cerrar menú" : "Abrir menú");
    mobileToggle.querySelector("svg")?.toggleAttribute("hidden", open);
    mobileToggle.querySelector("[data-mobile-close-icon]")?.toggleAttribute("hidden", !open);
    if (open) {
      focusFrame = window.requestAnimationFrame(() => {
        focusFrame = undefined;
        if (mobileMenu.classList.contains("is-open")) focusableItems()[0]?.focus();
      });
    }
    if (!open && returnFocus) mobileToggle.focus();
  };
  const fragmentFocusTarget = (link) => {
    const destination = new URL(link.href);
    if (destination.origin !== window.location.origin || destination.pathname !== window.location.pathname || !destination.hash) return null;
    const target = document.getElementById(decodeURIComponent(destination.hash.slice(1)));
    if (!target) return null;
    const focusTarget = target.querySelector('input[id]:not([type="hidden"]):not([disabled]), select[id]:not([disabled]), textarea[id]:not([disabled]), button[id]:not([disabled]), a[href]') || target;
    if (focusTarget === target) focusTarget.setAttribute("tabindex", "-1");
    return { destination, focusTarget };
  };

  mobileToggle.addEventListener("click", () => {
    const open = !mobileMenu.classList.contains("is-open");
    setMobileMenu(open, !open);
  });

  mobileMenu.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", (event) => {
      const fragment = fragmentFocusTarget(link);
      setMobileMenu(false, link.href === window.location.href);
      if (fragment && event.button === 0 && !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey) {
        event.preventDefault();
        window.location.hash = fragment.destination.hash;
        const focusWhenVisible = () => {
          if (mobileMenu.classList.contains("is-open") || !fragment.focusTarget.isConnected) return;
          if (getComputedStyle(fragment.focusTarget).visibility === "hidden") {
            window.requestAnimationFrame(focusWhenVisible);
            return;
          }
          fragment.focusTarget.focus({ preventScroll: true });
        };
        window.requestAnimationFrame(focusWhenVisible);
      }
    });
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && mobileMenu.classList.contains("is-open")) {
      setMobileMenu(false, true);
    }
  });

  mobileMenu.addEventListener("keydown", (event) => {
    if (event.key !== "Tab") return;
    const items = focusableItems();
    if (!items.length) return;
    const first = items[0];
    const last = items.at(-1);
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  });

  setMobileMenu(false);

  window.addEventListener("resize", () => {
    if (window.innerWidth >= 1280) setMobileMenu(false);
  });
}
