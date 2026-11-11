const { descriptions, sync } = require('../js/utils/barInformation');

test('the card can prepare a detached routed shell before insertion', () => {
  const elements = {
    '#style-select': { value: 'wave-quantum' }, '#bar-information': {},
    '#bar-information-title': { textContent: 'Solid' }, '#bar-information-description': { textContent: '' }
  };
  sync({ querySelector: selector => elements[selector] });
  expect(elements['#bar-information-title'].textContent).toBe('Ring Wavefunction');
  expect(elements['#bar-information-description'].textContent).toBe(descriptions['wave-quantum'].text);
});


test('Artemis details follow the selected bar and close when leaving it', () => {
  const elements = {
    '#style-select': { value: 'lunar' }, '#bar-information': {},
    '#bar-information-title': {}, '#bar-information-description': {},
    '#artemis-information': { hidden: true, open: false }
  };
  const root = { querySelector: selector => elements[selector] };
  sync(root);
  expect(elements['#artemis-information'].hidden).toBe(false);
  elements['#artemis-information'].open = true;
  elements['#style-select'].value = 'solid';
  sync(root);
  expect(elements['#artemis-information']).toEqual({ hidden: true, open: false });
});


test.each([false, true])('style changes preserve the native About disclosure state (%s)', open => {
  const elements = {
    '#style-select': { value: 'solid' }, '#bar-information': { open },
    '#bar-information-title': {}, '#bar-information-description': {},
    '#artemis-information': { hidden: true, open: false }
  };
  const root = { querySelector: selector => elements[selector] };
  for (const style of [...Object.keys(descriptions), 'unknown', 'lunar', 'solid']) {
    elements['#style-select'].value = style;
    sync(root);
    expect(elements['#bar-information'].open).toBe(open);
    expect(elements['#bar-information-title'].textContent).toBe((descriptions[style] || descriptions.solid).title);
    expect(elements['#bar-information-description'].textContent).toBe((descriptions[style] || descriptions.solid).text);
  }
});


test('new style starts its explanation at the top without resetting ordinary synchronization', () => {
  const elements = {
    '#style-select': { value: 'lunar' }, '#bar-information': { open: true },
    '#bar-information-title': {}, '#bar-information-description': {},
    '#bar-information-content': { dataset: { style: 'lunar' }, scrollTop: 50 }
  };
  const root = { querySelector: selector => elements[selector] };
  sync(root);
  expect(elements['#bar-information-content'].scrollTop).toBe(50);
  elements['#style-select'].value = 'wave-quantum';
  sync(root);
  expect(elements['#bar-information-content'].scrollTop).toBe(0);
  expect(elements['#bar-information'].open).toBe(true);
});

test('every selectable style has an explanation and disabled prototypes stay excluded', () => {
  const fs = require('node:fs');
  const html = fs.readFileSync(require.resolve('../generator/index.html'), 'utf8');
  const select = html.match(/<select id="style-select"[\s\S]*?<\/select>/)[0];
  const selectable = Array.from(select.matchAll(/<option\b([^>]*)>/g))
    .filter(([, attrs]) => !/\bdisabled\b/.test(attrs))
    .map(([, attrs]) => attrs.match(/value="([^"]+)"/)[1]);
  expect(Object.keys(descriptions).sort()).toEqual(selectable.sort());
  for (const { title, text } of Object.values(descriptions)) {
    expect(title.trim()).not.toBe('');
    expect(text.trim()).not.toBe('');
  }
});

test('concise explanations retain scientific and approval qualifications', () => {
  const essentialMeaning = {
    binary: [/UTF-8/, /most-significant bit first/, /Rejected text/],
    morse: [/International Morse/, /relative timing/, /unsupported characters/, /Rejected text/],
    nucleotide: [/30–50 bases/, /not standard molecular symbols/, /not complete genes/],
    numeric: [/approximation/, /sign is omitted/, /zero cells stay empty/],
    'neural-network': [/untrained/, /weighted sums/, /negative weights/],
    'wave-quantum': [/normalized/, /ideal periodic ring/, /−4, 3 and 7/, /0°, 60° and 120°/, /scrolling coordinate/, /4.28 seconds at 1×/, /not particle paths, probability density or measured data/],
    runway: [/not a navigation aid/, /does not establish an approved/],
    lunar: [/April 10, 2026/, /8:07 p.m. EDT/, /not telemetry/]
  };
  for (const [style, qualifications] of Object.entries(essentialMeaning)) {
    for (const qualification of qualifications) expect(descriptions[style].text).toMatch(qualification);
  }
});
