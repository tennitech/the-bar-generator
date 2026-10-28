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
