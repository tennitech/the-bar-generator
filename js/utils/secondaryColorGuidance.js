/* Contextual brand guidance. Native showModal supplies top-layer focus containment
   and makes the editor inert; the controller owns dismissal and focus return. */
(function (scope, factory) {
  const api = factory(scope);
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  scope.SecondaryColorGuidance = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function (scope) {
  let activeController;
  const controllers = new WeakMap();

  function setup(root = scope.document) {
    if (controllers.has(root)) return controllers.get(root);
    const trigger = root.getElementById('secondary-color-help');
    const dialog = root.getElementById('secondary-color-dialog');
    const select = root.getElementById('color-mode-select');
    const close = root.getElementById('secondary-color-close');
    const title = root.getElementById('secondary-color-title');
    if (!trigger || !dialog || !select || !close || !title) return null;
    const panel = dialog.querySelector('.report_dialog-panel');
    let backdropPress = false;
    const isOutside = event => {
      const rect = dialog.getBoundingClientRect();
      return event.clientX < rect.left || event.clientX > rect.right
        || event.clientY < rect.top || event.clientY > rect.bottom;
    };
    function dismiss() {
      if (dialog.open) dialog.close();
    }
    function sync(mode = select.value) {
      const scheme = scope.themeModeUtils.COLOR_SCHEMES[scope.themeModeUtils.normalizeColorModeValue(mode)];
      trigger.hidden = !scheme.secondary;
      if (trigger.hidden) dismiss();
    }
    trigger.addEventListener('click', () => {
      if (trigger.hidden || dialog.open) return;
      backdropPress = false;
      dialog.showModal();
      if (panel) panel.scrollTop = 0;
      title.focus({ preventScroll: true });
    });
    close.addEventListener('click', dismiss);
    // Keep generator shortcuts out of the modal while retaining native Tab/Escape.
    dialog.addEventListener('keydown', event => event.stopPropagation());
    dialog.addEventListener('cancel', event => {
      event.preventDefault();
      dismiss();
    });
    dialog.addEventListener('pointerdown', event => {
      backdropPress = event.target === dialog && isOutside(event);
    });
    dialog.addEventListener('click', event => {
      if (backdropPress && event.target === dialog && isOutside(event)) dismiss();
      backdropPress = false;
    });
    dialog.addEventListener('close', () => {
      backdropPress = false;
      // A queued close event must not steal focus from an already reopened dialog.
      if (dialog.open) return;
      const target = trigger.hidden
        ? (select.parentElement.querySelector('.custom-select-trigger') || select)
        : trigger;
      target.focus({ preventScroll: true });
    });
    select.addEventListener('change', () => sync());
    const controller = { sync };
    controllers.set(root, controller);
    activeController = controller;
    sync();
    return controller;
  }

  return { setup, sync: mode => activeController?.sync(mode) };
});
