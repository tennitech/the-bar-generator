/* Observe rejected limits without changing validation, drafts, focus or exports. */
(function (scope) {
  const states = new WeakMap();
  let nextId = 0;
  function stateFor(field) {
    if (!states.has(field)) states.set(field, {});
    return states.get(field);
  }
  function clear(field) {
    const state = states.get(field);
    if (!state) return;
    clearTimeout(state.flash); clearTimeout(state.notice);
    field.classList.remove('is-input-limit');
    if (state.message) state.message.textContent = '';
  }
  function signal(field, message) {
    if (!field) return;
    const state = stateFor(field);
    if (!state.message) {
      const note = field.ownerDocument.createElement('span');
      note.id = `input-limit-${++nextId}`;
      note.className = 'control_limit-message';
      note.setAttribute('role', 'status');
      note.setAttribute('aria-live', 'polite');
      (field.closest('.control') || field.closest('.zoom_controls') || field.parentElement).appendChild(note);
      field.setAttribute('aria-describedby', [field.getAttribute('aria-describedby'), note.id].filter(Boolean).join(' '));
      state.message = note;
    }
    // Renew the visual cue, but don't re-announce the same held-key attempt.
    if (state.message.textContent !== message) state.message.textContent = message;
    clearTimeout(state.flash); clearTimeout(state.notice);
    field.classList.remove('is-input-limit');
    void field.offsetWidth;
    field.classList.add('is-input-limit');
    state.flash = setTimeout(() => field.classList.remove('is-input-limit'), 650);
    state.notice = setTimeout(() => { state.message.textContent = ''; }, 4000);
  }
  function dispose(field) {
    clear(field);
    states.get(field)?.message?.remove();
    states.delete(field);
  }
  function rangeMessage(value, min, max) {
    return Number.isFinite(value) && (value < min || value > max) ? `Use a value from ${min} to ${max}.` : '';
  }
  function bindLength(field) {
    // Nucleotide owns its normalized-base counting and rejected-edit lifecycle.
    if (field.id === 'nucleotide-input') return;
    const codePoints = Number(field.dataset.maxCodePoints);
    const max = codePoints || field.maxLength;
    if (!(max > 0)) return;
    const count = text => codePoints ? Array.from(text.replace(/[\u0000-\u001f\u007f]/g, '')).length : text.length;
    const check = text => {
      if (text == null) return;
      const start = field.selectionStart ?? field.value.length;
      const end = field.selectionEnd ?? start;
      if (count(field.value.slice(0, start) + text + field.value.slice(end)) > max) {
        signal(field, `${max}-character limit. Remove text before adding more.`);
      }
    };
    field.addEventListener('beforeinput', event => {
      if (!event.isComposing && event.inputType?.startsWith('insert')) check(event.data);
    });
    field.addEventListener('keydown', event => {
      if (!event.isComposing && !event.ctrlKey && !event.metaKey && !event.altKey && Array.from(event.key).length === 1) check(event.key);
    });
    field.addEventListener('paste', event => check(event.clipboardData?.getData('text/plain')));
    field.addEventListener('input', event => {
      if (!event.isComposing && count(field.value) > max) signal(field, `${max}-character limit. Remove text before adding more.`);
    }, true);
    field.addEventListener('blur', () => clear(field));
  }
  function install(root) { root.querySelectorAll('input[maxlength], textarea[maxlength]').forEach(bindLength); }
  const api = { signal, clear, dispose, rangeMessage, bindLength, install };
  scope.InputLimitFeedback = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (typeof document !== 'undefined') install(document);
})(typeof window !== 'undefined' ? window : globalThis);
