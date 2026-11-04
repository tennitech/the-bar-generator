/* A sequence encoding, not a molecular structure diagram. See nucleotide_bar.md. */
(function (scope) {
  const MIN_BASES = 30, MAX_BASES = 50;
  const DEFAULT_SEQUENCE = 'ATGGCCCTGTGGATGCGCCTCCTGCCCCTGCTGGCGCTGCTGGCCCTCTG';
  const presets = Object.freeze([
    { label: 'Insulin · human INS', sequence: DEFAULT_SEQUENCE, accession: 'NM_000207.3', range: '60–109' },
    { label: 'Beta-globin · human HBB', sequence: 'ATGGTGCATCTGACTCCTGAGGAGAAGTCTGCCGTTACTGCCCTGTGGGG', accession: 'NM_000518.5', range: '51–100' },
    { label: 'Insulin · RNA letters', sequence: DEFAULT_SEQUENCE.replace(/T/g, 'U'), accession: 'NM_000207.3', range: '60–109' }
  ]);
  function normalizeLength(value) {
    const number = value === null || value === '' ? NaN : Number(value);
    return Number.isFinite(number) ? Math.max(MIN_BASES, Math.min(MAX_BASES, Math.round(number))) : MAX_BASES;
  }
  function normalize(value, length = MAX_BASES) { return String(value ?? '').toUpperCase().replace(/[^ATCGU]/g, '').slice(0, normalizeLength(length)); }
  function targetLength(root) { return normalizeLength(root.querySelector('#nucleotide-length')?.value); }
  function svg({ sequence = DEFAULT_SEQUENCE, targetLength = MAX_BASES, variant = 'separate', x = 0, y = 0, width = 250, height = 18, fill = 'currentColor', preview = false } = {}) {
    const slots = normalizeLength(targetLength);
    const bases = normalize(sequence, slots);
    if (!bases && !preview) return '';
    // The chosen length stays fixed while typing. Empty slots never enter files.
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
    const target = targetLength(root);
    const remaining = target - normalize(root.querySelector('#nucleotide-input')?.value).length;
    if (remaining < 0) return `Remove ${-remaining} bases to match the chosen ${target}-base length.`;
    return remaining ? `Add ${remaining} ${remaining === 1 ? 'base' : 'bases'} to export. Fill all ${target} slots, or change Sequence length.` : '';
  }
  function syncControls(root, edited = false) {
    const model = { normalize, presets };
    const input = root.querySelector('#nucleotide-input');
    if (!input) return;
    const target = targetLength(root);
    const original = input.value;
    input.maxLength = target;
    input.value = model.normalize(original, target);
    const index = model.presets.findIndex(preset => preset.sequence.slice(0,target) === input.value);
    root.querySelector('#nucleotide-preset').value = index < 0 ? 'custom' : String(index);
    const source = root.querySelector('#nucleotide-source');
    source.replaceChildren();
    if (index >= 0) {
      const preset = model.presets[index];
      const link = (root.ownerDocument || root).createElement('a');
      link.className = 'nucleotide_source-link';
      link.href = `https://www.ncbi.nlm.nih.gov/nuccore/${preset.accession}`;
      const start = Number(preset.range.split('–')[0]);
      link.textContent = `${preset.accession}, bases ${start}–${start + target - 1} (${target} bases)`;
      link.target = '_blank'; link.rel = 'noopener noreferrer';
      source.append(link);
      if (index === 2) source.append(' · T replaced by U for RNA notation.');
    } else source.textContent = 'Custom sequence; no gene identity is inferred.';
    const status = root.querySelector('#nucleotide-status');
    const count = input.value.length;
    const remaining = target - count;
    const notice = edited === 'length' && normalize(original).length > target ? ` Kept the first ${target} bases.`
      : /T/.test(input.value) && /U/.test(input.value) ? ' Mixed DNA/RNA letters.'
      : edited && original.toUpperCase() !== input.value ? ' Only A, T, C, G and U are kept.' : '';
    status.textContent = `${count}/${target} bases. ${remaining ? `Add ${remaining} to export, or choose a gene snippet.` : 'Ready to export.'}${notice}`;
    const progress = root.querySelector('#nucleotide-progress');
    if (progress) {
      progress.max = target; progress.value = count;
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
  const api = { MIN_BASES, MAX_BASES, DEFAULT_SEQUENCE, presets, normalizeLength, targetLength, normalize, svg, syncControls, exportBlocker };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  scope.NucleotidePattern = api;
})(typeof window !== 'undefined' ? window : globalThis);
