require('../js/utils/themeMode');
const { resolveTheme, isCompactLayoutViewport } = require('../js/utils/generatorInitialState');

describe('generator first-paint theme', () => {
  test.each(['black', 'white', 'red', 'blue', 'gold', 'silver', 'gray'])('resolves %s without renderer initialization', theme => {
    expect(resolveTheme(`?colorMode=${theme}`, 'solid')).toBe(theme);
  });
  test.each([['dark', 'white'], ['light', 'black'], ['white-on-red', 'white'], ['invalid', 'black'], ['', 'black']])('normalizes %s through the runtime alias map', (theme, expected) => {
    expect(resolveTheme(`?colorMode=${theme}`, 'ruler')).toBe(expected);
  });
  test('restricts mission control to Artemis and leaves missing query at the existing default', () => {
    expect(resolveTheme('?colorMode=lunar', 'lunar')).toBe('lunar');
    expect(resolveTheme('?colorMode=lunar', 'solid')).toBe('black');
    expect(resolveTheme('', 'lunar')).toBe('black');
  });
});

// Startup and runtime must agree before the compact sidebar receives focus state.
test.each([
  [900, false, true], [901, false, false], [1024, false, false],
  [1024, true, true], [1100, true, true], [1101, true, false],
  [844, true, true], [1440, true, false]
])('compact layout at %ipx with coarse=%s is %s', (width, coarse, expected) => {
  expect(isCompactLayoutViewport(width, coarse)).toBe(expected);
});
