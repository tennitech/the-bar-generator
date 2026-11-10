/* Editor-only sizing. This preference never enters shared artwork/export state. */
(function (scope) {
  const STORAGE_KEY = 'rpi-editor-larger-controls';

  function readPreference(windowRef) {
    try { return windowRef.localStorage.getItem(STORAGE_KEY) === 'true'; }
    catch (_) { return false; }
  }

  function start(documentRef, windowRef) {
    let enabled = readPreference(windowRef);
    let boundButton = null;
    function apply(value) {
      enabled = value;
      documentRef.documentElement.dataset.editorSize = enabled ? 'large' : 'standard';
      const button = documentRef.getElementById('editor-size-toggle');
      button?.setAttribute('aria-checked', String(enabled));
      const state = documentRef.getElementById('editor-size-state');
      if (state) state.textContent = enabled ? 'On' : 'Off';
    }
    function bind() {
      const button = documentRef.getElementById('editor-size-toggle');
      if (!button) return false;
      apply(enabled);
      if (boundButton === button) return true;
      boundButton = button;
      button.addEventListener('click', () => {
        apply(!enabled);
        try { windowRef.localStorage.setItem(STORAGE_KEY, String(enabled)); }
        catch (_) { /* Restricted storage still permits a session-only setting. */ }
        // Keep the same visible keyboard target as the controls reflow. Safari
        // pointer activation does not always focus a native button by itself.
        button.focus({ preventScroll: true });
        windowRef.requestAnimationFrame(() => {
          if (documentRef.activeElement === button) {
            button.scrollIntoView({ block: 'nearest', inline: 'nearest' });
          }
        });
      });
      return true;
    }
    function ready() {
      if (bind() || typeof windowRef.MutationObserver !== 'function') return;
      // Routed pages fetch and replace the shell after DOMContentLoaded. Watch
      // only for that insertion, then stop observing as soon as it is bound.
      const observer = new windowRef.MutationObserver(() => {
        if (bind()) observer.disconnect();
      });
      observer.observe(documentRef.body, { childList: true });
    }
    apply(enabled); // Head-loaded so a restored preference precedes first paint.
    windowRef.addEventListener('storage', event => {
      let localStorage;
      try { localStorage = windowRef.localStorage; } catch (_) { return; }
      if (event.storageArea !== localStorage || (event.key !== STORAGE_KEY && event.key !== null)) return;
      apply(event.key === null ? false : event.newValue === 'true');
    });
    if (documentRef.readyState === 'loading') {
      documentRef.addEventListener('DOMContentLoaded', ready, { once: true });
    } else ready();
    return { bind };
  }

  const api = { STORAGE_KEY, readPreference, start };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  scope.EditorAccessibility = api;
  if (typeof document !== 'undefined') start(document, scope);
})(typeof window !== 'undefined' ? window : globalThis);
