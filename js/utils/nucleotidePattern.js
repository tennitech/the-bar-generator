/* A sequence encoding, not a molecular structure diagram. See nucleotide_bar.md. */
(function (scope) {
  const MIN_BASES = 30, MAX_BASES = 50;
  const DEFAULT_SEQUENCE = 'ATGGCCCTGTGGATGCGCCTCCTGCCCCTGCTGGCGCTGCTGGCCCTCTG';
  const presets = Object.freeze([
    { label: 'Insulin · human INS', sequence: DEFAULT_SEQUENCE, accession: 'NM_000207.3', range: '60–109' },
    { label: 'Beta-globin · human HBB', sequence: 'ATGGTGCATCTGACTCCTGAGGAGAAGTCTGCCGTTACTGCCCTGTGGGG', accession: 'NM_000518.5', range: '51–100' },
    { label: 'Insulin · RNA letters', sequence: DEFAULT_SEQUENCE.replace(/T/g, 'U'), accession: 'NM_000207.3', range: '60–109' }
  ]);
  function normalize(value) { return String(value ?? '').toUpperCase().replace(/[^ATCGU]/g, '').slice(0, MAX_BASES); }
  function svg({ sequence = DEFAULT_SEQUENCE, variant = 'separate', x = 0, y = 0, width = 250, height = 18, fill = 'currentColor', preview = false } = {}) {
    const bases = normalize(sequence);
    if (!bases && !preview) return '';
    // Build toward the 30-base minimum. Ready sequences fill the full bar,
    // including every entered base up to 50. Empty slots never enter exports.
    const slots = Math.max(MIN_BASES, bases.length);
    const pitch = width / slots;
    const w = pitch * .714, radius = Math.min(w / 2, height * .175);
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
    return remaining > 0 ? `Add ${remaining} ${remaining === 1 ? 'base' : 'bases'} to export. Enter 30–50 bases; dashed outlines are empty slots.` : '';
  }
  function syncControls(root, edited = false) {
    const model = { normalize, presets };
    const input = root.querySelector('#nucleotide-input');
    if (!input) return;
    const original = input.value;
    input.value = model.normalize(original);
    const index = model.presets.findIndex(preset => preset.sequence === input.value);
    root.querySelector('#nucleotide-preset').value = index < 0 ? 'custom' : String(index);
    const source = root.querySelector('#nucleotide-source');
    source.replaceChildren();
    if (index >= 0) {
      const preset = model.presets[index];
      const link = (root.ownerDocument || root).createElement('a');
      link.className = 'nucleotide_source-link';
      link.href = `https://www.ncbi.nlm.nih.gov/nuccore/${preset.accession}`;
      link.textContent = `${preset.accession}, bases ${preset.range} (${preset.sequence.length} bases)`;
      link.target = '_blank'; link.rel = 'noopener noreferrer';
      source.append(link);
      if (index === 2) source.append(' · T replaced by U for RNA notation.');
    } else source.textContent = 'Custom sequence; no gene identity is inferred.';
    const status = root.querySelector('#nucleotide-status');
    const count = input.value.length;
    const remaining = Math.max(0, MIN_BASES - count);
    const notice = /T/.test(input.value) && /U/.test(input.value) ? ' Mixed DNA/RNA letters.'
      : edited && original.toUpperCase() !== input.value ? ' Only A, T, C, G and U are kept.' : '';
    status.textContent = `${count}/50 bases. ${remaining ? `Add ${remaining} to export, or choose a gene snippet.` : 'Ready to export.'}${notice}`;
    const progress = root.querySelector('#nucleotide-progress');
    if (progress) {
      progress.max = MIN_BASES; progress.value = Math.min(count, MIN_BASES);
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
  const api = { MIN_BASES, MAX_BASES, DEFAULT_SEQUENCE, presets, normalize, svg, syncControls, exportBlocker };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  scope.NucleotidePattern = api;
})(typeof window !== 'undefined' ? window : globalThis);
