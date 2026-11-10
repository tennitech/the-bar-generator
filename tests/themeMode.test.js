const {
  DEFAULT_COLOR_MODE,
  LEGACY_COLOR_MODE_ALIASES,
  normalizeColorModeValue,
  syncCustomSelectOptionState,
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
  test('normalizes legacy aliases while retaining explicit composition names', () => {
    expect(normalizeColorModeValue('LUNAR')).toBe('lunar');
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

  test('syncs custom option hidden and disabled state when availability changes', () => {
    const lunarOption = {
      classList: createClassList(['is-hidden', 'is-disabled']),
      setAttribute(name, value) {
        this[name] = value;
      }
    };
    const wrapper = {
      querySelector(selector) {
        return selector === '.custom-option[data-value="lunar"]' ? lunarOption : null;
      }
    };

    syncCustomSelectOptionState(wrapper, 'lunar', {
      hidden: false,
      disabled: false
    });

    expect(lunarOption.classList.contains('is-hidden')).toBe(false);
    expect(lunarOption.classList.contains('is-disabled')).toBe(false);
    expect(lunarOption['aria-hidden']).toBe('false');
    expect(lunarOption['aria-disabled']).toBe('false');
  });
});

test('brand compositions apply the supplied foreground/background pair without altering palette values', () => {
  const { COLOR_SCHEMES, applyColorScheme, AVAILABLE_COLOR_MODES } = require('../js/utils/themeMode');
  const pairs = [
    ['black', '#000000', '#ffffff'], ['white', '#ffffff', '#000000'],
    ['white-on-red', '#ffffff', '#d6001c'], ['red', '#d6001c', '#ffffff'],
    ['gray-on-red', '#b9ccd8', '#d6001c'], ['blue', '#e1edf5', '#0081ce'],
    ['gold', '#000000', '#cdac38'], ['gray', '#d6001c', '#b9ccd8'],
    ['silver', '#0081ce', '#e1edf5'], ['gray-on-black', '#b9ccd8', '#000000']
  ];
  const fs = require('node:fs'), vm = require('node:vm');
  const geometry = require('../js/utils/logoGeometry').RPI_LOGO_GEOMETRY;
  const renderer = { RPI_LOGO_GEOMETRY: geometry, colors: COLOR_SCHEMES,
    currentShader: 0, REFERENCE_WIDTH: geometry.width, document: {},
    getCurrentBarPatternValues: () => ({}), getLoopRuntimeValues: () => ({}),
    normalizeStyleValue: value => value, styleSelect: { value: 'solid' },
    buildCurrentBarPatternSVGFragment: ({ fgColor }) => '<rect fill="' + fgColor + '"/>',
    logoExportOptions: require('../js/utils/exportOptions'), logoExportUI: { size: () => 'standard' } };
  renderer.window = renderer;
  vm.createContext(renderer);
  vm.runInContext(fs.readFileSync(require.resolve('../js/drawing.js'), 'utf8'), renderer);
  const inkNames = { '#000000': 'black', '#ffffff': 'white', '#d6001c': 'red',
    '#b9ccd8': 'gray', '#e1edf5': 'silver', '#0081ce': 'blue' };
  const chrome = ['--bg-app', '--bg-header', '--header-artwork-ink', '--text-on-header'];
  const properties = Object.fromEntries(chrome.map(key => [key, '#d6001c']));
  const target = { style: {
    setProperty: (key, value) => { properties[key] = value; },
    removeProperty: key => { delete properties[key]; }
  } };
  for (const [mode, foreground, background] of pairs) {
    expect(AVAILABLE_COLOR_MODES).toContain(mode);
    expect(normalizeColorModeValue(mode)).toBe(mode);
    applyColorScheme(target, mode);
    renderer.currentColorMode = mode;
    const exported = renderer.captureLogoExportSnapshot();
    expect(exported.foreground).toBe(foreground);
    expect(exported.svgSource).toContain('fill="' + foreground + '"');
    expect(exported.inkName).toBe(inkNames[foreground]);
    expect(exported.dimensions.width).toBe(1160);
    expect(exported.svgSource).not.toContain('<rect width="100%"');
    expect(COLOR_SCHEMES[mode].fg).toBe(foreground);
    expect(properties['--preview-foreground']).toBe(foreground);
    expect(properties['--bg-canvas']).toBe(background);
    for (const key of chrome) expect(properties[key]).toBeUndefined();
  }
  applyColorScheme(target, 'lunar');
  expect(properties['--preview-foreground']).toBe('#f4f7fb');
  expect(properties['--bg-canvas']).toBeUndefined();
  expect(properties['--bg-header']).toBeUndefined();
  applyColorScheme(target, 'unknown');
  expect(properties['--bg-canvas']).toBe('#ffffff');
  expect(properties['--preview-foreground']).toBe('#000000');
});
