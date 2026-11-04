/* A sequence encoding, not a molecular structure diagram. See nucleotide_bar.md. */
(function (scope) {
  const MIN_BASES = 30, MAX_BASES = 50;
  const DEFAULT_SEQUENCE = 'ATGGCCCTGTGGATGCGCCTCCTGCCCCTGCTGGCGCTGCTGGCCCTCTG';
  const presets = Object.freeze([
    { label: 'Insulin · human INS', sequence: DEFAULT_SEQUENCE, accession: 'NM_000207.3', range: '60–109' },
    { label: 'Beta-globin · human HBB', sequence: 'ATGGTGCATCTGACTCCTGAGGAGAAGTCTGCCGTTACTGCCCTGTGGGG', accession: 'NM_000518.5', range: '51–100' },
    { label: 'Insulin · RNA letters', sequence: DEFAULT_SEQUENCE.replace(/T/g, 'U'), accession: 'NM_000207.3', range: '60–109' }
  ]);
  function letters(value) { return String(value ?? '').toUpperCase().replace(/[^ATCGU]/g, ''); }
  function normalize(value) { return letters(value).slice(0, MAX_BASES); }
  function svg({ sequence = DEFAULT_SEQUENCE, variant = 'separate', x = 0, y = 0, width = 250, height = 18, fill = 'currentColor', preview = false } = {}) {
    const bases = normalize(sequence);
    const slots = Math.max(MIN_BASES, bases.length);
    if (!bases && !preview) return '';
    // Size teeth from the visible slots, including missing minimum positions.
    // Leave only a 4% gap through 30 bases; ease to the 10% gap at 50.
    const pitch = width / slots;
    const extra = Math.max(0, bases.length - MIN_BASES) / (MAX_BASES - MIN_BASES);
    const w = pitch * (.9 + .06 * (1 - extra)), radius = Math.min(w / 2, height * .175);
    const left = x;
    const bottom = y + height, shoulder = bottom - radius;
    let result = variant === 'backbone' ? `<rect x="${left}" y="${y}" width="${pitch * bases.length}" height="${height / 3}" fill="${fill}"/>` : '';
    for (let i = 0; i < bases.length; i++) {
      const a = left + pitch * i + (pitch - w) / 2, b = a + w, mid = (a + b) / 2;
      let end;
      if (bases[i] === 'A') end = `L${b} ${shoulder} Q${b} ${bottom} ${mid} ${bottom} Q${a} ${bottom} ${a} ${shoulder}`;
      else if (bases[i] === 'T' || bases[i] === 'U') end = `L${b} ${bottom} Q${mid} ${bottom - radius * 2} ${a} ${bottom}`;
      else if (bases[i] === 'G') end = `L${b} ${shoulder} L${mid} ${bottom} L${a} ${shoulder}`;
      else end = `L${b} ${bottom} L${mid} ${shoulder} L${a} ${bottom}`;
      result += `<path data-base="${bases[i]}" d="M${a} ${y} H${b} ${end} Z" fill="${fill}"/>`;
    }
    if (preview) {
      for (let i = bases.length; i < slots; i++) {
        const a = left + pitch * i + (pitch - w) / 2;
        result += `<rect data-placeholder="true" x="${a + .2}" y="${y + .2}" width="${Math.max(0, w - .4)}" height="${Math.max(0, height - .4)}" fill="none" stroke="${fill}" stroke-width="0.4" stroke-dasharray="1.4 1.2" opacity="0.65"/>`;
      }
    }
    return result;
  }
  function exportBlocker(root) {
    if (root?.querySelector('#style-select')?.value !== 'nucleotide') return '';
    const remaining = MIN_BASES - normalize(root.querySelector('#nucleotide-input')?.value).length;
    return remaining > 0 ? `Add ${remaining} ${remaining === 1 ? 'base' : 'bases'} to export. 30 bases minimum; 50 maximum.` : '';
  }
  function syncControls(root, edited = false) {
    const model = { normalize, presets };
    const input = root.querySelector('#nucleotide-input');
    if (!input) return;
    clearLimit(root);
    const original = input.value;
    const start = input.selectionStart, end = input.selectionEnd;
    const normalized = model.normalize(original);
    if (normalized !== original) {
      input.value = normalized;
      if (start !== null && end !== null) input.setSelectionRange?.(normalize(original.slice(0,start)).length, normalize(original.slice(0,end)).length);
    }
    input.maxLength = MAX_BASES;
    const count = input.value.length;
    const index = count >= MIN_BASES ? model.presets.findIndex(preset => preset.sequence.slice(0,count) === input.value) : -1;
    root.querySelector('#nucleotide-preset').value = index < 0 ? 'custom' : String(index);
    const source = root.querySelector('#nucleotide-source');
    source.replaceChildren();
    if (index >= 0) {
      const preset = model.presets[index];
      const link = (root.ownerDocument || root).createElement('a');
      link.className = 'nucleotide_source-link';
      link.href = `https://www.ncbi.nlm.nih.gov/nuccore/${preset.accession}`;
      const start = Number(preset.range.split('–')[0]);
      link.textContent = `${preset.accession}, bases ${start}–${start + count - 1} (${count} bases)`;
      link.target = '_blank'; link.rel = 'noopener noreferrer';
      source.append(link);
      if (index === 2) source.append(' · T replaced by U for RNA notation.');
    } else source.textContent = 'Custom sequence; no gene identity is inferred.';
    const status = root.querySelector('#nucleotide-status');
    const remaining = Math.max(0, MIN_BASES - count);
    const notice = /T/.test(input.value) && /U/.test(input.value) ? ' Mixed DNA/RNA letters.'
      : edited && original.toUpperCase() !== input.value ? ' Only A, T, C, G and U are kept.' : '';
    status.textContent = `${count}/50 bases. ${remaining ? `Add ${remaining} to export.` : 'Ready to export.'}${notice}`;
    const progress = root.querySelector('#nucleotide-progress');
    if (progress) {
      progress.max = MAX_BASES; progress.value = count;
      progress.setAttribute('aria-valuetext', `${count} bases entered; ${remaining ? `${remaining} more needed` : 'ready to export'}`);
    }
    const control = root.querySelector('#nucleotide-sequence-control');
    if (control) {
      const wasReady = control.getAttribute('data-ready');
      const ready = remaining === 0;
      control.setAttribute('data-ready', String(ready));
      if (!ready) control.classList.remove('is-newly-ready');
      else if (wasReady === 'false' && !scope.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches) {
        control.classList.add('is-newly-ready');
        control.addEventListener('animationend', () => control.classList.remove('is-newly-ready'), { once: true });
      }
    }
  }
  const inputStates = new WeakMap();
  function clearLimit(root) {
    const input = root.querySelector('#nucleotide-input');
    const state = inputStates.get(input);
    if (state?.timer) { clearTimeout(state.timer); state.timer = null; }
    root.querySelector('#nucleotide-sequence-control')?.classList.remove('is-limit-error');
    const error = root.querySelector('#nucleotide-limit-error');
    if (error) { error.hidden = true; error.textContent = ''; }
  }
  function signalLimit(root) {
    const input = root.querySelector('#nucleotide-input');
    const state = inputStates.get(input);
    const control = root.querySelector('#nucleotide-sequence-control');
    const error = root.querySelector('#nucleotide-limit-error');
    if (error) { error.textContent = '50-base limit. Remove a base before adding another.'; error.hidden = false; }
    if (!control || !state) return;
    clearTimeout(state.timer);
    control.classList.remove('is-limit-error');
    // Restart feedback only after an explicit rejected edit, never during idle.
    void control.offsetWidth;
    control.classList.add('is-limit-error');
    state.timer = setTimeout(() => { control.classList.remove('is-limit-error'); state.timer = null; }, 650);
  }
  function bindInput(root, onEdit) {
    const input = root.querySelector('#nucleotide-input');
    if (!input) return;
    if (inputStates.has(input)) { inputStates.get(input).onEdit = onEdit; return; }
    const state = { onEdit, composing: false, compositionValue: null, timer: null };
    inputStates.set(input, state);
    const handleInput = () => {
      const overflow = letters(input.value).length > MAX_BASES;
      state.onEdit();
      if (overflow) signalLimit(root);
    };
    const insert = raw => {
      const text = letters(raw);
      const start = input.selectionStart ?? input.value.length, end = input.selectionEnd ?? start;
      const available = Math.max(0, MAX_BASES - (input.value.length - (end - start)));
      const accepted = text.slice(0,available);
      if (accepted || end > start) {
        input.setRangeText(accepted, start, end, 'end');
        input.dispatchEvent(new Event('input', { bubbles: true }));
      }
      if (text.length > available) signalLimit(root);
    };
    input.addEventListener('beforeinput', event => {
      if (state.composing || event.isComposing || !event.inputType?.startsWith('insert') || event.data == null) return;
      const selected = (input.selectionEnd ?? 0) - (input.selectionStart ?? 0);
      if (letters(input.value).length - selected + letters(event.data).length > MAX_BASES && event.cancelable) {
        event.preventDefault(); insert(event.data);
      }
    });
    // WebKit can enforce maxlength before emitting beforeinput. Keep the same
    // feedback for an ordinary key attempt, while allowing shortcuts and edits.
    input.addEventListener('keydown', event => {
      if (state.composing || event.isComposing || event.ctrlKey || event.metaKey || event.altKey || !/^[ATCGU]$/i.test(event.key)) return;
      const selected = (input.selectionEnd ?? 0) - (input.selectionStart ?? 0);
      if (letters(input.value).length - selected >= MAX_BASES) {
        event.preventDefault(); signalLimit(root);
      }
    });
    input.addEventListener('paste', event => {
      if (!event.clipboardData) return;
      event.preventDefault(); insert(event.clipboardData.getData('text/plain'));
    });
    input.addEventListener('compositionstart', () => { state.composing = true; });
    input.addEventListener('compositionend', () => { state.composing = false; handleInput(); state.compositionValue = input.value; });
    input.addEventListener('input', event => {
      if (state.composing || event.isComposing) return;
      const duplicateCommit = state.compositionValue !== null && state.compositionValue === input.value;
      state.compositionValue = null;
      if (!duplicateCommit) handleInput();
    });
  }
  const api = { MIN_BASES, MAX_BASES, DEFAULT_SEQUENCE, presets, normalize, svg, syncControls, exportBlocker, bindInput };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  scope.NucleotidePattern = api;
})(typeof window !== 'undefined' ? window : globalThis);
