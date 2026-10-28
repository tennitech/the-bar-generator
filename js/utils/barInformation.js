// Descriptions explain the implemented pattern; source records live in references/bar_information_cards.md.
(function (globalScope) {
  const descriptions = {
  "solid": {
    "title": "Solid",
    "text": "One continuous shape fills the bar, keeping the focus on the official mark’s proportions. Use it as a quiet starting point, or compare it with the other styles to see how a small design area can carry very different systems."
  },
  "ruler": {
    "title": "Ruler",
    "text": "Evenly spaced ticks build a visual scale, with longer marks at each selected division. Explore the rhythm by changing repeats, units, or motion; the scale is illustrative, so its ticks do not measure a physical length on your screen."
  },
  "ticker": {
    "title": "Ticker",
    "text": "Two rows of repeating ticks use adjustable spacing and width ratios to create a shifting rhythm. Change those relationships to explore how patterns line up; the ticks are a visual system rather than a calibrated measure of time or distance."
  },
  "binary": {
    "title": "Binary",
    "text": "Your text becomes UTF-8 bytes, drawn as a sequence of binary bits from most significant to least significant. Try a different word or character to compare the resulting pattern; the content filter masks offensive text before the bar encodes it."
  },
  "morse": {
    "title": "Morse Code",
    "text": "Your text becomes International Morse code, with dots, dashes, and gaps following their relative timing units. Compare short and long messages to explore their rhythm; accented letters are simplified, unsupported characters are omitted, and offensive text is masked before encoding."
  },
  "waveform": {
    "title": "Waveform",
    "text": "A synthetic signal traces a repeating shape across the bar, using the waveform and frequency you choose. Explore its motion and envelope to see how the shape changes; this is a generated signal rather than an audio recording or measured observation."
  },
  "circles": {
    "title": "Circles",
    "text": "A packing process places circles of different sizes within the bar, building a pattern from their spatial relationships. Adjust density, size variation, or fill to explore the balance of circles and open space; the arrangement does not encode an external dataset."
  },
  "numeric": {
    "title": "Numeric",
    "text": "Enter a decimal value or select a formula to turn its digits into a pattern. Compare dot matrix and height encoding to explore the same digits; the bar encodes the displayed decimal approximation, without a sign, rather than measuring an external quantity."
  },
  "neural-network": {
    "title": "Neural Network",
    "text": "What changes when a network gets wider or deeper? Explore an untrained feedforward model: nodes apply tanh or sigmoid to weighted sums, filled centers encode activation, and dashed links mark negative weights; changing the input recomputes every layer, without training."
  },
  "circles-gradient": {
    "title": "Circles Gradient",
    "text": "Rows of circles change size to create an apparent shift in tone using a single foreground color. Switch variants to compare directional and centered arrangements; the effect comes from circle area and spacing rather than a measured quantity or color blending."
  },
  "gradient": {
    "title": "Gradient",
    "text": "Stripe widths vary across the bar to create an apparent shift in tone using a single foreground color. Compare the tapered and centered variants to explore how area coverage changes the result; the design uses geometric spacing rather than interpolated colors."
  },
  "lines": {
    "title": "Lines",
    "text": "Evenly spaced vertical strokes follow a fixed, repeating height envelope across the bar. Change the variant to compare line densities and the spaces between them; the wave-like silhouette is a geometric construction rather than a recording of sound or motion."
  },
  "point-connect": {
    "title": "Point Connect",
    "text": "Repeated cells connect corners and midpoints with crossing lines, forming a continuous geometric framework. Compare the variants to explore how a denser set of connections changes the bar; the structure is a visual motif rather than a tested engineering model."
  },
  "grid": {
    "title": "Grid",
    "text": "A repeating geometric grid divides the bar into a structured arrangement of cells and open spaces. Switch variants to compare how the pattern changes within the same boundary; the grid organizes the artwork rather than representing geographic coordinates or measured data."
  },
  "triangle-grid": {
    "title": "Triangle Grid",
    "text": "Repeating triangular geometry builds a grid across the bar, creating different balances of edges and open space. Compare the variants to explore those arrangements; the pattern is a geometric study rather than a diagram of a physical material or structure."
  },
  "triangles": {
    "title": "Triangles",
    "text": "Each equal-width cell is split along a diagonal, with one half filled to create a repeated triangular pattern. Change the count or direction to explore its rhythm and orientation; those controls reshape the geometry rather than encode a measured quantity."
  },
  "fibonacci-sequence": {
    "title": "Fibonacci Sequence",
    "text": "Segment widths follow the consecutive Fibonacci values 34, 21, 13, 8, 5, 3, 2, and 1 in descending order. Gaps make the proportions easier to compare; this is a chosen arrangement of the sequence rather than a measurement from nature."
  },
  "union": {
    "title": "Union",
    "text": "Five repeated modules pair a horizontal band with a lower shape formed by arches. Look at how repetition connects the separate pieces across the bar; the name describes this visual motif, without assigning it an organizational affiliation or a measured meaning."
  },
  "wave-quantum": {
    "title": "Quantum",
    "text": "Three projections show one normalized free-particle wavefunction on an ideal ring, combining modes −4, 3, and 7. Explore phase and motion to compare the changing amplitude; the curves depend on a chosen phase convention and are not particle paths or probabilities."
  },
  "runway": {
    "title": "Runway",
    "text": "Runway markings form a supplied geometric motif listed here for the RPI Flying Club. Explore how the repeated blocks occupy the bar; this artwork is not a navigation aid, and its presence in the tool does not establish an approved organizational lockup."
  },
  "lunar": {
    "title": "Artemis II",
    "text": "Supplied artwork marks Artemis II, whose crew splashed down on April 10, 2026, at 8:07 p.m. EDT. Explore the bar alongside the mission audio or Mission Control theme; the illustration is a visual tribute rather than a display of mission telemetry."
  }
};

  function sync(root = document) {
    const style = root.querySelector('#style-select');
    const card = root.querySelector('#bar-information');
    if (!style || !card) return;
    const description = descriptions[style.value] || descriptions.solid;
    root.querySelector('#bar-information-title').textContent = description.title;
    root.querySelector('#bar-information-description').textContent = description.text;
  }

  globalScope.BarInformation = { descriptions, sync };
  if (typeof module !== 'undefined' && module.exports) module.exports = { descriptions, sync };
})(typeof window !== 'undefined' ? window : globalThis);
