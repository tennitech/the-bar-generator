// Descriptions explain the implemented pattern; source records live in references/bar_information_cards.md.
(function (globalScope) {
  const descriptions = {
  "nucleotide": {
    "title": "Nucleotide",
    "text": "Encode 30–50 bases to export. Dashed outlines show missing bases. Shapes represent A–T/U and C–G pairing, not standard molecular symbols. Presets are transcript excerpts, not complete genes."
  },
  "solid": {
    "title": "Solid",
    "text": "One continuous shape fills the bar. A quiet starting point for the official mark."
  },
  "ruler": {
    "title": "Ruler",
    "text": "Whole units have the longest marks; divisions split them equally. Adjust units, divisions and thickness. This stationary, dimensionless scale does not measure physical screen length."
  },
  "ticker": {
    "title": "Ticker",
    "text": "Two rows of repeating ticks shift against each other. Adjust spacing and width ratios to change their alignment. The pattern does not measure time or distance."
  },
  "binary": {
    "title": "Binary",
    "text": "Encode up to 10 characters as UTF-8 bytes, most-significant bit first. Rejected text hides the bar until corrected."
  },
  "morse": {
    "title": "Morse Code",
    "text": "Encode up to 10 characters as International Morse code with standard relative timing. Accents are simplified; unsupported characters are omitted. Rejected text hides the bar until corrected."
  },
  "waveform": {
    "title": "Waveform",
    "text": "Choose a note from C1 to C6. The scope shows whole periods of the synthesized signal with an adaptive time window. Notes use equal temperament at A4 = 440 Hz."
  },
  "circles": {
    "title": "Circles",
    "text": "A packing process arranges circles within the bar. Adjust density, size variation and fill to change the balance of circles and open space. No external data is encoded."
  },
  "numeric": {
    "title": "Numeric",
    "text": "Encode a decimal value or formula approximation as dots or heights. The sign is omitted; zero cells stay empty in Dot Matrix. This encodes digits, not an external measurement."
  },
  "neural-network": {
    "title": "Neural Network",
    "text": "What changes when a network gets wider or deeper? Three inputs feed an untrained feedforward model with two outputs. Nodes apply tanh or sigmoid to weighted sums; filled centers show activation and dashed links mark negative weights. Changing inputs recomputes each layer."
  },
  "circles-gradient": {
    "title": "Circles Gradient",
    "text": "Circle area and spacing create an apparent shift in tone in one color. Choose reference rows, a ramp or a center peak, then adjust the geometry. No color blending or measured data is used."
  },
  "gradient": {
    "title": "Gradient",
    "text": "Stripe widths create an apparent shift in tone in one color. Choose a tapered or centered pattern, then animate its coverage. No color blending or measured data is used."
  },
  "lines": {
    "title": "Lines",
    "text": "Evenly spaced strokes follow a repeating height envelope. Switch variants to change line density. The wave-like silhouette is geometry, not recorded sound or motion."
  },
  "point-connect": {
    "title": "Point Connect",
    "text": "Crossing lines connect the corners and midpoints of repeated cells. Variants change connection density. This geometric motif is not a tested engineering model."
  },
  "grid": {
    "title": "Grid",
    "text": "A repeating grid divides the bar into cells and open spaces. Variants change the geometry; the grid represents no geographic coordinates or measured data."
  },
  "triangle-grid": {
    "title": "Triangle Grid",
    "text": "A triangular lattice fills the bar. Choose a wide, balanced or fine preset, then adjust rows, density, stroke and offset. This is geometry, not a measured material or structure."
  },
  "triangles": {
    "title": "Triangles",
    "text": "Each equal-width cell has one filled triangular half. Change the count or direction to vary the geometry. No measured quantity is encoded."
  },
  "fibonacci-sequence": {
    "title": "Fibonacci Sequence",
    "text": "Segment widths follow Fibonacci values 34, 21, 13, 8, 5, 3, 2 and 1, separated by gaps. This arrangement illustrates the sequence, not a measurement from nature."
  },
  "union": {
    "title": "Union",
    "text": "Five repeated modules pair a horizontal band with arches below. The name describes the motif, not an organizational affiliation or measurement."
  },
  "well-modes": {
    "title": "Well Modes",
    "text": "Under construction, ready to explore. Two distinct stationary modes of an ideal infinite square well interfere as their relative phase changes. Mode B weight is its population; 0% and 100% give stationary eigenstates. Mirrored thickness encodes probability density at a fixed scale across the entire well. Empty endpoints and nodes are real zeros, not missing data. The mirror and 8-second beat are drawing choices, not a second spatial dimension or laboratory time."
  },
  "rabi": {
    "title": "Rabi",
    "text": "Under construction, ready to explore. An ideal driven two-level system starts in its ground state. Solid height shows excited-state probability; the hatched complement shows ground-state probability. Horizontal position represents pulse duration, not physical space. Motion slides that duration window across repeated experiments, not one particle traveling. Detuning changes both peak transfer and oscillation rate. The model uses the rotating-wave approximation and excludes relaxation and decoherence; the 8-second scan is a drawing choice."
  },
  "wave-quantum": {
    "title": "Ring Wavefunction",
    "text": "One normalized free-particle wavefunction on an ideal periodic ring combines equal-weight modes −4, 3 and 7. Three phase projections use 0°, 60° and 120°. A scrolling coordinate view unwraps one circumference and repeats in 4.28 seconds at 1×. These phase-convention-dependent amplitudes are not particle paths, probability density or measured data. Ribbon thickness and display time are drawing choices."
  },
  "runway": {
    "title": "Runway",
    "text": "Supplied runway artwork for the RPI Flying Club. This geometric motif is not a navigation aid; inclusion here does not establish an approved organizational lockup."
  },
  "lunar": {
    "title": "Artemis II",
    "text": "Supplied artwork marks Artemis II’s splashdown on April 10, 2026, at 8:07 p.m. EDT. Pair it with mission audio or the Mission Control theme. The illustration is not telemetry."
  }
};

  function sync(root = document) {
    const style = root.querySelector('#style-select');
    const card = root.querySelector('#bar-information');
    if (!style || !card) return;
    const description = descriptions[style.value] || descriptions.solid;
    root.querySelector('#bar-information-title').textContent = description.title;
    root.querySelector('#bar-information-description').textContent = description.text;
    const content = root.querySelector('#bar-information-content');
    if (content && content.dataset.style !== style.value) {
      content.scrollTop = 0;
      content.dataset.style = style.value;
    }
    const artemis = root.querySelector('#artemis-information');
    if (artemis) {
      artemis.hidden = style.value !== 'lunar';
      if (artemis.hidden) artemis.open = false;
    }
  }

  globalScope.BarInformation = { descriptions, sync };
  if (typeof module !== 'undefined' && module.exports) module.exports = { descriptions, sync };
})(typeof window !== 'undefined' ? window : globalThis);
