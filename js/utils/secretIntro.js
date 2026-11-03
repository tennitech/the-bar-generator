/* RPI, 1824: hold the title for the founding-year duration, release, then
   tap twice. Keyboard explorers can type rpi1824 outside editable controls.
   No click/keyboard behavior is attached to the Home link. */
(function (scope) {
  const HOLD_MS = 1824;
  const WINDOW_MS = 2400;
  function bind({ target, pointerTargets = [target], documentRef = document, windowRef = window, open }) {
    if (!target || typeof open !== 'function') return;
    const targets = [...new Set(pointerTargets.filter(Boolean))];
    const now = () => windowRef.performance.now();
    let press = null;
    let armedUntil = 0;
    let taps = 0;
    let sequence = '';
    let lastKey = 0;
    let armedTarget = null;
    function reset() { press = null; armedUntil = 0; armedTarget = null; taps = 0; sequence = ''; }
    function available() { return !documentRef.hidden && !documentRef.body.classList.contains('has-logo-animation'); }
    function reveal() { reset(); if (available()) void open(); }
    targets.forEach(pointerTarget => {
      pointerTarget.addEventListener('pointerdown', event => {
        if (!available() || event.button !== 0 || !event.isPrimary) return reset();
        if (armedTarget && armedTarget !== pointerTarget) reset();
        press = { id: event.pointerId, x: event.clientX, y: event.clientY, time: now() };
        // A cancelled/inactive pointer must not make the optional secret throw.
        try { pointerTarget.setPointerCapture(event.pointerId); } catch (_) { reset(); }
      });
      pointerTarget.addEventListener('pointermove', event => {
        if (press && (Math.hypot(event.clientX - press.x, event.clientY - press.y) > 12)) reset();
      });
      pointerTarget.addEventListener('pointerup', event => {
        if (!press || press.id !== event.pointerId) return;
        const elapsed = now() - press.time;
        const moved = Math.hypot(event.clientX - press.x, event.clientY - press.y) > 12;
        press = null;
        if (!available() || moved || event.button !== 0) return reset();
        const time = now();
        if (elapsed >= HOLD_MS && elapsed <= 6000) {
          armedUntil = time + WINDOW_MS;
          armedTarget = pointerTarget;
          taps = 0;
        } else if (elapsed < 500 && armedTarget === pointerTarget && time <= armedUntil) {
          if (++taps === 2) reveal();
        } else reset();
      });
      pointerTarget.addEventListener('pointercancel', reset);
      // Browsers implicitly release capture after pointerup. Only a loss during
      // an unfinished press cancels; an ordinary release must retain the arm.
      pointerTarget.addEventListener('lostpointercapture', () => { if (press) reset(); });
      // Suppress the mobile long-press callout only on this non-link title.
      pointerTarget.addEventListener('contextmenu', event => event.preventDefault());
    });
    documentRef.addEventListener('pointerdown', event => {
      sequence = '';
      if (!targets.some(element => element.contains(event.target))) reset();
    }, true);
    documentRef.addEventListener('keydown', event => {
      // Pointer and keyboard routes are independent deliberate sequences.
      press = null; armedUntil = 0; armedTarget = null; taps = 0;
      const editing = event.target.closest?.('input, textarea, select, button, a, [contenteditable]:not([contenteditable="false"]), [role="combobox"], [role="dialog"], [role="textbox"], [role="searchbox"], [role="slider"], [role="spinbutton"], [role="button"], [role="link"], [role="menuitem"]');
      if (!available() || editing || event.repeat || event.isComposing
        || event.ctrlKey || event.metaKey || event.altKey || event.shiftKey) return reset();
      const time = now();
      if (time - lastKey > WINDOW_MS) sequence = '';
      lastKey = time;
      const candidate = sequence + event.key.toLowerCase();
      sequence = 'rpi1824'.startsWith(candidate) ? candidate : (event.key === 'r' ? 'r' : '');
      if (sequence === 'rpi1824') reveal();
    });
    documentRef.addEventListener('focusin', event => {
      if (!press || !targets.some(element => element.contains(event.target))) reset();
    });
    documentRef.addEventListener('visibilitychange', reset);
    windowRef.addEventListener('blur', reset);
    windowRef.addEventListener('pagehide', reset);
  }
  const api = { bind };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  scope.SecretIntro = api;
})(typeof window !== 'undefined' ? window : globalThis);
