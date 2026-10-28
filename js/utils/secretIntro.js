/* RPI, 1824: hold the title for the founding-year duration, release, then
   tap twice. Keyboard explorers can type rpi1824 outside editable controls.
   No click/keyboard behavior is attached to the Home link. */
(function (scope) {
  const HOLD_MS = 1824;
  const WINDOW_MS = 2400;
  function bind({ target, documentRef = document, windowRef = window, open }) {
    if (!target || typeof open !== 'function') return;
    let press = null;
    let armedUntil = 0;
    let taps = 0;
    let sequence = '';
    let lastKey = 0;
    function reset() { press = null; armedUntil = 0; taps = 0; sequence = ''; }
    function available() { return !documentRef.hidden && !documentRef.body.classList.contains('has-logo-animation'); }
    function reveal() { reset(); if (available()) void open(); }
    target.addEventListener('pointerdown', event => {
      if (!available() || event.button !== 0 || !event.isPrimary) return reset();
      press = { id: event.pointerId, x: event.clientX, y: event.clientY, time: performance.now() };
      target.setPointerCapture(event.pointerId);
    });
    target.addEventListener('pointermove', event => {
      if (press && (Math.hypot(event.clientX - press.x, event.clientY - press.y) > 12)) reset();
    });
    target.addEventListener('pointerup', event => {
      if (!press || press.id !== event.pointerId) return;
      const elapsed = performance.now() - press.time;
      press = null;
      if (target.hasPointerCapture(event.pointerId)) target.releasePointerCapture(event.pointerId);
      const now = performance.now();
      if (elapsed >= HOLD_MS && elapsed <= 6000) {
        armedUntil = now + WINDOW_MS;
        taps = 0;
      } else if (elapsed < 500 && now <= armedUntil) {
        if (++taps === 2) reveal();
      } else reset();
    });
    target.addEventListener('pointercancel', reset);
    // Suppress the mobile long-press callout only on this non-link title.
    target.addEventListener('contextmenu', event => event.preventDefault());
    documentRef.addEventListener('pointerdown', event => {
      sequence = '';
      if (!target.contains(event.target)) reset();
    }, true);
    documentRef.addEventListener('keydown', event => {
      const editing = event.target.closest?.('input, textarea, select, button, a, [contenteditable]:not([contenteditable="false"]), [role="combobox"], [role="dialog"]');
      if (!available() || editing || event.repeat || event.isComposing
        || event.ctrlKey || event.metaKey || event.altKey || event.shiftKey) return reset();
      const now = performance.now();
      if (now - lastKey > WINDOW_MS) sequence = '';
      lastKey = now;
      const candidate = sequence + event.key.toLowerCase();
      sequence = 'rpi1824'.startsWith(candidate) ? candidate : (event.key === 'r' ? 'r' : '');
      if (sequence === 'rpi1824') reveal();
    });
    documentRef.addEventListener('visibilitychange', reset);
    windowRef.addEventListener('blur', reset);
    windowRef.addEventListener('pagehide', reset);
  }
  scope.SecretIntro = { bind };
})(window);
