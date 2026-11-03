/* The hidden Why not... footer option opens the ASCII intro. Native semantics
   provide Enter/Space access; rpi1824 remains a bonus keyboard shortcut.
   The product title and official mark are both ordinary Home links. */
(function (scope) {
  const WINDOW_MS = 2400;
  function bind({ target, disclosure = null, documentRef = document, windowRef = window, open }) {
    if (!target || typeof open !== 'function') return;
    const now = () => windowRef.performance.now();
    let sequence = '';
    let lastKey = 0;
    function reset() { sequence = ''; }
    function available() { return !documentRef.hidden && !documentRef.body.classList.contains('has-logo-animation'); }
    function closeDisclosure(returnFocus = false) {
      if (!disclosure?.open) return;
      disclosure.open = false;
      if (returnFocus) disclosure.querySelector('summary')?.focus({ preventScroll: true });
    }
    function reveal() {
      reset();
      if (!available()) return;
      closeDisclosure(disclosure?.contains(documentRef.activeElement));
      void open();
    }
    disclosure?.addEventListener('keydown', event => {
      if (event.key !== 'Escape' || !disclosure.open) return;
      event.preventDefault();
      event.stopPropagation();
      closeDisclosure(true);
    });
    target.addEventListener('click', () => {
      if (!available()) return;
      // Touch/Safari button activation need not move focus automatically.
      target.focus?.({ preventScroll: true });
      reveal();
    });
    documentRef.addEventListener('pointerdown', event => {
      reset();
      if (disclosure?.open && !disclosure.contains(event.target)) closeDisclosure();
    }, true);
    documentRef.addEventListener('keydown', event => {
      const editing = event.target.closest?.('input, textarea, select, button, summary, a, [contenteditable]:not([contenteditable="false"]), [role="combobox"], [role="dialog"], [role="textbox"], [role="searchbox"], [role="slider"], [role="spinbutton"], [role="button"], [role="link"], [role="menuitem"]');
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
    documentRef.addEventListener('focusin', event => {
      reset();
      if (disclosure?.open && !disclosure.contains(event.target)) closeDisclosure();
    });
    const dismiss = () => { reset(); closeDisclosure(); };
    documentRef.addEventListener('visibilitychange', dismiss);
    windowRef.addEventListener('blur', dismiss);
    windowRef.addEventListener('pagehide', dismiss);
  }
  const api = { bind };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  scope.SecretIntro = api;
})(typeof window !== 'undefined' ? window : globalThis);
