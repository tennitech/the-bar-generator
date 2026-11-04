/* A sequence encoding, not a molecular structure diagram. See nucleotide_bar.md. */
(function (scope) {
  const DEFAULT_SEQUENCE = 'ATGGCCCTGTGGATGCGCCTCCTGCCCCTG';
  const presets = Object.freeze([
    { label: 'Insulin · human INS', sequence: DEFAULT_SEQUENCE, accession: 'NM_000207.3', range: '60–89' },
    { label: 'Beta-globin · human HBB', sequence: 'ATGGTGCATCTGACTCCTGAGGAGAAGTCT', accession: 'NM_000518.5', range: '51–80' },
    { label: 'Insulin · RNA letters', sequence: DEFAULT_SEQUENCE.replace(/T/g, 'U'), accession: 'NM_000207.3', range: '60–89' }
  ]);
  function normalize(value) { return String(value ?? '').toUpperCase().replace(/[^ATCGU]/g, '').slice(0, 60); }
  function svg({ sequence = DEFAULT_SEQUENCE, variant = 'separate', x = 0, y = 0, width = 250, height = 18, fill = 'currentColor' } = {}) {
    const bases = normalize(sequence);
    if (!bases) return '';
    // Maintain the supplied tooth proportions; short sequences remain centered,
    // rather than stretching a handful of bases into broad blocks.
    const pitch = Math.min(width / bases.length, height * .49);
    const w = pitch * .714, radius = Math.min(w / 2, height * .175);
    const left = x + (width - pitch * bases.length) / 2;
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
    return result;
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
      link.textContent = `${preset.accession}, bases ${preset.range} (30 bases)`;
      link.target = '_blank'; link.rel = 'noopener noreferrer';
      source.append(link);
      if (index === 2) source.append(' · T replaced by U for RNA notation.');
    } else source.textContent = 'Custom sequence; no gene identity is inferred.';
    const status = root.querySelector('#nucleotide-status');
    status.textContent = !input.value ? 'Enter a sequence to draw a bar.'
      : /T/.test(input.value) && /U/.test(input.value) ? 'Mixed DNA/RNA letters: shown as entered.'
      : edited && original.toUpperCase() !== input.value ? 'Only A, T, C, G and U are kept (maximum 60).'
      : `${input.value.length} bases`;
  }
  const api = { DEFAULT_SEQUENCE, presets, normalize, svg, syncControls };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  scope.NucleotidePattern = api;
})(typeof window !== 'undefined' ? window : globalThis);
