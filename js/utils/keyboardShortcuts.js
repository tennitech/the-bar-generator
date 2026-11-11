/* Optional generator shortcuts. All actions reuse the existing controls/runtime. */
(function (scope) {
  const preferenceKey = 'rpi-generator-keyboard-shortcuts';
  const interactive = 'input, textarea, select, button, summary, a[href], [contenteditable]:not([contenteditable="false"]), [role="textbox"], [role="searchbox"], [role="link"], [role="tree"], [role="grid"], [role="tab"], [role="combobox"], [role="listbox"], [role="slider"], [role="spinbutton"], [role="button"], [role="menu"], [role="menuitem"]';
  function shouldIgnore(event, doc, composing = false) {
    if (event.defaultPrevented || event.repeat || event.isComposing || composing || event.keyCode === 229
      || event.metaKey || event.ctrlKey || event.altKey || event.getModifierState?.('AltGraph')) return true;
    const path = event.composedPath?.() || [event.target];
    if (path.some(target => target?.isContentEditable || target?.closest?.(interactive))) return true;
    return Boolean(doc.querySelector('dialog[open], [aria-modal="true"]:not([hidden]):not([aria-hidden="true"]), details.sidebar_more[open], .custom-select-trigger[aria-expanded="true"], #save-menu:not(.hidden)'));
  }
  function actionFor(event) {
    if (event.shiftKey) {
      if (event.key === '?') return 'help';
      if (event.key === '+') return 'zoomIn';
      if (event.code === 'Space') return 'nextStyle';
      if (event.key === 'ArrowUp') return 'previousColor';
      if (event.key === 'ArrowDown') return 'nextColor';
      return null;
    }
    return ({ '?': 'help', n: 'randomize', u: 'undo', e: 'export', ' ': 'playback',
      '+': 'zoomIn', '=': 'zoomIn', '-': 'zoomOut', '0': 'fit' })[event.key] || null;
  }
  function initialize({ document: doc = scope.document, actions = {}, storage } = {}) {
    const trigger = doc.getElementById('keyboard-shortcuts-trigger');
    const dialog = doc.getElementById('keyboard-shortcuts-dialog');
    const close = doc.getElementById('keyboard-shortcuts-close');
    const preference = doc.getElementById('keyboard-shortcuts-enabled');
    if (!trigger || !dialog || !close || !preference) return null;
    let enabled = true;
    let composing = false;
    let returnFocus;
    let backdropPress = false;
    const isOutside = event => {
      const box = dialog.getBoundingClientRect();
      return event.clientX < box.left || event.clientX > box.right
        || event.clientY < box.top || event.clientY > box.bottom;
    };
    try { storage ??= scope.localStorage; enabled = storage?.getItem(preferenceKey) !== 'off'; } catch (_) { /* Storage is optional in embeds. */ }
    const zoomIds = ['zoom-in-btn', 'zoom-out-btn', 'zoom-reset-btn'];
    const hints = zoomIds.map(id => {
      const button = doc.getElementById(id);
      return { button, shortcut: button?.getAttribute('aria-keyshortcuts') };
    });
    function syncPreference() {
      preference.checked = enabled;
      for (const { button, shortcut } of hints) {
        if (!button || !shortcut) continue;
        if (enabled) button.setAttribute('aria-keyshortcuts', shortcut);
        else button.removeAttribute('aria-keyshortcuts');
      }
    }
    function openGuide() {
      if (dialog.open) return false;
      const menu = trigger.closest('details');
      returnFocus = doc.activeElement;
      if (menu?.open) {
        menu.open = false;
        returnFocus = menu.querySelector('summary');
      }
      backdropPress = false;
      dialog.showModal();
      const panel = dialog.querySelector?.('.report_dialog-panel');
      if (panel) panel.scrollTop = 0;
      trigger.setAttribute('aria-expanded', 'true');
      (doc.getElementById('keyboard-shortcuts-title') || close).focus({ preventScroll: true });
      return true;
    }
    trigger.addEventListener('click', openGuide);
    close.addEventListener('click', () => dialog.close());
    dialog.addEventListener('close', () => {
      if (dialog.open) return; // A queued close must not steal focus after reopening.
      backdropPress = false;
      trigger.setAttribute('aria-expanded', 'false');
      const target = [returnFocus, doc.getElementById('mobile-menu-toggle'), doc.getElementById('brand-title')]
        .find(element => element?.isConnected && !element.disabled
          && element.checkVisibility?.({ visibilityProperty: true }) !== false);
      target?.focus({ preventScroll: true });
    });
    // Native modal semantics retain Tab containment and Escape. A drag from the
    // content onto the backdrop is not an intentional dismissal.
    dialog.addEventListener('keydown', event => event.stopPropagation());
    dialog.addEventListener('cancel', event => {
      event.preventDefault();
      dialog.close();
    });
    dialog.addEventListener('pointerdown', event => {
      backdropPress = event.target === dialog && isOutside(event);
    });
    dialog.addEventListener('click', event => {
      if (backdropPress && event.target === dialog && isOutside(event)) dialog.close();
      backdropPress = false;
    });
    preference.addEventListener('change', () => {
      enabled = preference.checked;
      try { storage?.setItem(preferenceKey, enabled ? 'on' : 'off'); } catch (_) { /* Keep the choice for this page. */ }
      syncPreference();
    });
    doc.addEventListener('compositionstart', () => { composing = true; });
    doc.addEventListener('compositionend', () => { composing = false; });
    doc.addEventListener('keydown', event => {
      if (!enabled || shouldIgnore(event, doc, composing)) return;
      const action = actionFor(event);
      if (!action) return;
      const run = action === 'help' ? openGuide : actions[action];
      if (run && run() !== false) event.preventDefault();
    });
    syncPreference();
    return { openGuide, isEnabled: () => enabled };
  }
  const api = { shouldIgnore, actionFor, initialize };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  scope.KeyboardShortcuts = api;
})(typeof window !== 'undefined' ? window : globalThis);
