/* The quiet 1824 footer button opens the ASCII intro. Native button semantics
   provide Enter/Space access; rpi1824 remains a bonus keyboard shortcut.
   The product title and official mark are both ordinary Home links. */
(function (scope) {
  const WINDOW_MS = 2400;
  function bind({ target, documentRef = document, windowRef = window, open }) {
    if (!target || typeof open !== 'function') return;
    const now = () => windowRef.performance.now();
    let sequence = '';
    let lastKey = 0;
    function reset() { sequence = ''; }
    function available() { return !documentRef.hidden && !documentRef.body.classList.contains('has-logo-animation'); }
    function reveal() { reset(); if (available()) void open(); }
    target.addEventListener('click', () => {
      if (!available()) return;
      // Touch/Safari button activation need not move focus automatically.
      target.focus?.({ preventScroll: true });
      reveal();
    });
    documentRef.addEventListener('pointerdown', reset, true);
    documentRef.addEventListener('keydown', event => {
      const editing = event.target.closest?.('input, textarea, select, button, a, [contenteditable]:not([contenteditable="false"]), [role="combobox"], [role="dialog"], [role="textbox"], [role="searchbox"], [role="slider"], [role="spinbutton"], [role="button"], [role="link"], [role="menuitem"]');
      // The intro button also accepts the old shortcut. Other controls keep
      // their native keyboard behavior and never accidentally launch it.
      if (!available() || (editing && editing !== target) || event.repeat || event.isComposing
        || event.ctrlKey || event.metaKey || event.altKey || event.shiftKey) return reset();
      const time = now();
      if (time - lastKey > WINDOW_MS) sequence = '';
      lastKey = time;
      const candidate = sequence + event.key.toLowerCase();
      sequence = 'rpi1824'.startsWith(candidate) ? candidate : (event.key === 'r' ? 'r' : '');
      if (sequence === 'rpi1824') reveal();
    });
    documentRef.addEventListener('focusin', reset);
    documentRef.addEventListener('visibilitychange', reset);
    windowRef.addEventListener('blur', reset);
    windowRef.addEventListener('pagehide', reset);
  }
  const api = { bind };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  scope.SecretIntro = api;
})(typeof window !== 'undefined' ? window : globalThis);
