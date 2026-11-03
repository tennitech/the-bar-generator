const { descriptions, sync } = require('../js/utils/barInformation');

test('the card can prepare a detached routed shell before insertion', () => {
  const elements = {
    '#style-select': { value: 'wave-quantum' }, '#bar-information': {},
    '#bar-information-title': { textContent: 'Solid' }, '#bar-information-description': { textContent: '' }
  };
  sync({ querySelector: selector => elements[selector] });
  expect(elements['#bar-information-title'].textContent).toBe('Quantum');
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
