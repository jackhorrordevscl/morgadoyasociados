(() => {
  const form = document.getElementById('contact-form');
  if (!form) return;

  const btn = document.getElementById('submit-btn');
  const label = document.getElementById('btn-label');
  const checkSvg = document.getElementById('check-svg');
  const checkPath = document.getElementById('check-path');
  const successMsg = document.getElementById('success-msg');
  const errorMsg = document.getElementById('error-msg');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let done = false;

  const setBusy = (isBusy) => {
    form.setAttribute('aria-busy', isBusy ? 'true' : 'false');
    btn.disabled = isBusy;
    label.textContent = isBusy ? 'Enviando...' : 'Enviar consulta';
  };

  const showMessage = (messageEl, text) => {
    messageEl.textContent = text;
    messageEl.setAttribute('aria-hidden', 'false');
    if (reduceMotion || !window.gsap) messageEl.style.opacity = '1';
    else gsap.to(messageEl, { opacity: 1, duration: 0.3 });
  };

  const hideMessage = (messageEl) => {
    messageEl.setAttribute('aria-hidden', 'true');
    if (reduceMotion || !window.gsap) messageEl.style.opacity = '0';
    else gsap.to(messageEl, { opacity: 0, duration: 0.2 });
  };

  const showError = (text) => {
    showMessage(errorMsg, text);
    errorMsg.focus({ preventScroll: true });
  };

  const playSuccess = () => {
    if (reduceMotion || !window.gsap) {
      label.style.opacity = '0';
      checkSvg.style.opacity = '1';
      showMessage(successMsg, 'Gracias. Recibimos su consulta y le responderemos dentro de 24 horas hábiles.');
      successMsg.focus({ preventScroll: true });
      return;
    }
    const pathLength = checkPath.getTotalLength();
    gsap.set(checkPath, { strokeDasharray: pathLength, strokeDashoffset: pathLength });
    gsap.set(successMsg, { y: 8 });
    const timeline = gsap.timeline();
    timeline.to(label, { opacity: 0, duration: 0.15, ease: 'power2.out' }, 0);
    timeline.to(btn, { width: 52, borderRadius: '50%', backgroundColor: '#B5713D', duration: 0.35, ease: 'power2.inOut' }, 0);
    timeline.to(checkSvg, { opacity: 1, duration: 0.1 }, 0.35);
    timeline.to(checkPath, { strokeDashoffset: 0, duration: 0.4, ease: 'power2.out' }, 0.4);
    timeline.to(successMsg, { opacity: 1, y: 0, duration: 0.4 }, 0.7);
    timeline.call(() => {
      successMsg.setAttribute('aria-hidden', 'false');
      successMsg.textContent = 'Gracias. Recibimos su consulta y le responderemos dentro de 24 horas hábiles.';
      successMsg.focus({ preventScroll: true });
    }, undefined, 0.7);
  };

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (done) return;
    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }
    hideMessage(errorMsg);
    hideMessage(successMsg);
    setBusy(true);
    try {
      const response = await fetch('send-mail.php', { method: 'POST', body: new FormData(form) });
      const data = await response.json();
      if (!response.ok || !data.success) {
        showError(data.message || 'No se pudo enviar su consulta. Verifique los campos e intente nuevamente.');
        setBusy(false);
        return;
      }
      done = true;
      form.setAttribute('aria-busy', 'false');
      playSuccess();
    } catch {
      showError('No se pudo conectar. Verifique su conexión a internet e intente nuevamente.');
      setBusy(false);
    }
  });
})();
