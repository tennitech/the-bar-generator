const {
  DEFAULT_COLOR_MODE,
  LEGACY_COLOR_MODE_ALIASES,
  normalizeColorModeValue,
  syncCustomSelectState
} = require('../js/utils/themeMode');

function createClassList(initialClasses = []) {
  const classes = new Set(initialClasses);

  return {
    toggle(className, force) {
      if (typeof force === 'undefined') {
        if (classes.has(className)) {
          classes.delete(className);
          return false;
        }

        classes.add(className);
        return true;
      }

      if (force) {
        classes.add(className);
      } else {
        classes.delete(className);
      }

      return force;
    },
    contains(className) {
      return classes.has(className);
    }
  };
}

describe('theme mode utils', () => {
  test('normalizes legacy aliases onto the exported-mark-first theme names', () => {
    expect(normalizeColorModeValue('LIGHT')).toBe(LEGACY_COLOR_MODE_ALIASES.light);
    expect(normalizeColorModeValue('dark')).toBe(LEGACY_COLOR_MODE_ALIASES.dark);
    expect(normalizeColorModeValue('black-on-white')).toBe('black');
    expect(normalizeColorModeValue('white-on-black')).toBe('white');
  });

  test('falls back to the default color mode for unknown values', () => {
    expect(normalizeColorModeValue('unknown-theme')).toBe(DEFAULT_COLOR_MODE);
    expect(normalizeColorModeValue('link-blue')).toBe(DEFAULT_COLOR_MODE);
    expect(normalizeColorModeValue('')).toBe(DEFAULT_COLOR_MODE);
    expect(normalizeColorModeValue(null)).toBe(DEFAULT_COLOR_MODE);
  });

  test('keeps the native select value, custom trigger text, and selected option in sync', () => {
    const trigger = { textContent: 'BLACK' };
    const customOptions = [
      { dataset: { value: 'black' }, classList: createClassList(['selected']) },
      { dataset: { value: 'white' }, classList: createClassList() },
      { dataset: { value: 'blue' }, classList: createClassList() }
    ];
    const wrapper = {
      querySelector(selector) {
        return selector === '.custom-select-trigger' ? trigger : null;
      },
      querySelectorAll(selector) {
        return selector === '.custom-option' ? customOptions : [];
      }
    };
    const select = {
      value: 'black',
      selectedIndex: 1,
      options: [
        { textContent: 'BLACK' },
        { textContent: 'WHITE' },
        { textContent: 'BLUE' }
      ]
    };

    const resolvedLabel = syncCustomSelectState(select, wrapper, 'white', 'WHITE');

    expect(select.value).toBe('white');
    expect(resolvedLabel).toBe('WHITE');
    expect(trigger.textContent).toBe('WHITE');
    expect(customOptions[0].classList.contains('selected')).toBe(false);
    expect(customOptions[1].classList.contains('selected')).toBe(true);
    expect(customOptions[2].classList.contains('selected')).toBe(false);
  });
});
