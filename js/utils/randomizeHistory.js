/* One reversible randomization, held only in this page's memory. */
(function (scope) {
  const clone = value => JSON.parse(JSON.stringify(value));

  function createController({ capture, restore, onChange = () => {}, isRestoring = () => false }) {
    let previous = null;
    let previousStyle = null;
    let transaction = 0;
    const canUndo = style => previous !== null && previousStyle === style;
    function clear() {
      if (transaction || isRestoring() || previous === null) return;
      previous = null;
      previousStyle = null;
      onChange();
    }
    function randomize(style, action) {
      const snapshot = clone(capture());
      transaction++;
      try {
        const result = action();
        previous = snapshot;
        previousStyle = style;
        return result;
      } catch (error) {
        previous = null;
        previousStyle = null;
        throw error;
      } finally {
        transaction--;
        onChange();
      }
    }
    function undo(style) {
      if (!canUndo(style)) return false;
      transaction++;
      try {
        restore(clone(previous));
        previous = null;
        previousStyle = null;
        return true;
      } finally {
        transaction--;
        onChange();
      }
    }
    return { canUndo, clear, randomize, undo };
  }

  function initialize({ snapshots, afterRestore = () => {}, announce = () => {} }) {
    if (!snapshots || !snapshots.restoreLocal) return null;
    const buttons = [];
    const controller = createController({
      capture: snapshots.capture,
      restore: snapshot => { snapshots.restoreLocal(snapshot); afterRestore(); },
      isRestoring: snapshots.isRestoring,
      onChange() {
        for (const { button, style } of buttons) {
          const available = controller.canUndo(style);
          button.disabled = !available;
          button.title = available ? 'Restore the previous variation' : 'Available after Randomize, until your next edit';
        }
      }
    });
    document.querySelectorAll('[data-parameter-action="randomize"]').forEach(randomizeButton => {
      const style = randomizeButton.dataset.parameterStyle;
      const button = randomizeButton.parentElement.querySelector(`[data-randomize-undo="${style}"]`);
      if (!button) return;
      button.disabled = true;
      button.addEventListener('click', () => {
        try {
          if (controller.undo(style)) {
            randomizeButton.focus({ preventScroll: true });
            announce('Previous variation restored.');
          }
        } catch (error) {
          announce('The previous variation could not be restored. Try Undo again.', 'error');
          console.error('Unable to undo randomization.', error);
        }
      });
      buttons.push({ button, style });
    });
    const sidebar = document.getElementById('app-sidebar');
    const onEdit = event => {
      // Numeric editor drafts have no id: canceling an editor is not an edit.
      if (event.target.matches('input[id], select[id]')) controller.clear();
    };
    sidebar.addEventListener('input', onEdit);
    sidebar.addEventListener('change', onEdit);
    scope.addEventListener('popstate', controller.clear);
    scope.addEventListener('hashchange', controller.clear);
    return controller;
  }

  const api = { createController, initialize };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  scope.RandomizeHistory = api;
})(typeof window !== 'undefined' ? window : globalThis);
