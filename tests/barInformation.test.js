const { descriptions, sync } = require('../js/utils/barInformation');

test('the card can prepare a detached routed shell before insertion', () => {
  const elements = {
    '#style-select': { value: 'wave-quantum' }, '#bar-information': {},
    '#bar-information-title': { textContent: 'Solid' }, '#bar-information-description': { textContent: '' }
  };
  sync({ querySelector: selector => elements[selector] });
  expect(elements['#bar-information-title'].textContent).toBe('Particle on a Ring');
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
