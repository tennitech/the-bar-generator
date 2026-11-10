(function (root, factory) {
  const api = factory();

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }

  root.themeModeUtils = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  const DEFAULT_COLOR_MODE = 'black';
  // Exact logo/background examples in the official Secondary Colors section (audited Nov 10).
  // These keys remain shareable; existing one-color keys now describe full compositions.
  const COLOR_SCHEMES = Object.freeze({
    black: Object.freeze({ label: 'Black on White', bg: '#ffffff', fg: '#000000', secondary: false }),
    white: Object.freeze({ label: 'White on Black', bg: '#000000', fg: '#ffffff', secondary: false }),
    'white-on-red': Object.freeze({ label: 'White on Red', bg: '#d6001c', fg: '#ffffff', secondary: false }),
    'gray-on-red': Object.freeze({ label: 'Gray on Red', bg: '#d6001c', fg: '#b9ccd8', secondary: true }),
    blue: Object.freeze({ label: 'Silver on Blue', bg: '#0081ce', fg: '#e1edf5', secondary: true }),
    gold: Object.freeze({ label: 'Black on Gold', bg: '#cdac38', fg: '#000000', secondary: true }),
    gray: Object.freeze({ label: 'Red on Gray', bg: '#b9ccd8', fg: '#d6001c', secondary: true }),
    silver: Object.freeze({ label: 'Blue on Silver', bg: '#e1edf5', fg: '#0081ce', secondary: true }),
    'gray-on-black': Object.freeze({ label: 'Gray on Black', bg: '#000000', fg: '#b9ccd8', secondary: true }),
    lunar: Object.freeze({ label: 'Mission Control', bg: '#05070a', fg: '#f4f7fb', secondary: false })
  });
  const AVAILABLE_COLOR_MODES = Object.keys(COLOR_SCHEMES);
  const AVAILABLE_COLOR_MODE_SET = new Set(AVAILABLE_COLOR_MODES);
  const LEGACY_COLOR_MODE_ALIASES = {
    'black-on-white': 'black',
    'white-on-black': 'white',
    red: 'black',
    'red-on-white': 'black',
    light: 'black',
    dark: 'white'
  };

  function normalizeColorModeValue(colorMode, options = {}) {
    const defaultColorMode = typeof options.defaultColorMode === 'string'
      ? options.defaultColorMode
      : DEFAULT_COLOR_MODE;
    const availableModes = Array.isArray(options.availableModes) && options.availableModes.length
      ? options.availableModes
      : AVAILABLE_COLOR_MODES;
    const availableModeSet = options.availableModeSet instanceof Set
      ? options.availableModeSet
      : new Set(availableModes);
    const legacyAliases = options.legacyAliases && typeof options.legacyAliases === 'object'
      ? options.legacyAliases
      : LEGACY_COLOR_MODE_ALIASES;

    const normalized = String(colorMode || defaultColorMode).trim().toLowerCase();
    if (availableModeSet.has(normalized)) {
      return normalized;
    }

    return Object.hasOwn(legacyAliases, normalized) ? legacyAliases[normalized] : defaultColorMode;
  }

  function getColorThemePair(colorMode) {
    const mode = normalizeColorModeValue(colorMode);
    const scheme = COLOR_SCHEMES[mode];
    return { mode, bg: mode === 'lunar' ? '#03060d' : scheme.bg, fg: scheme.fg };
  }

  // Keep the non-color focus cue visible independently of the exact brand text ink.
  function getThemeFocusForeground(background) {
    const channels = background.slice(1).match(/../g).map(value => parseInt(value, 16) / 255);
    const luminance = channels.map(value => value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4)
      .reduce((sum, value, index) => sum + value * [0.2126, 0.7152, 0.0722][index], 0);
    return (luminance + 0.05) / 0.05 >= 1.05 / (luminance + 0.05) ? '#000000' : '#ffffff';
  }

  function styleColorThemeOption(option, colorMode) {
    const pair = getColorThemePair(colorMode);
    option.dataset.colorTheme = pair.mode;
    option.style.setProperty('--theme-option-background', pair.bg);
    option.style.setProperty('--theme-option-foreground', pair.fg);
    option.style.setProperty('--theme-option-focus-foreground', getThemeFocusForeground(pair.bg));
  }

  function applyColorScheme(target, colorMode) {
    const mode = normalizeColorModeValue(colorMode);
    const scheme = COLOR_SCHEMES[mode];
    // Brand pairing belongs to the preview. Header/sidebar chrome stays neutral;
    // clear inline chrome overrides left by earlier applications of this helper.
    const values = {
      '--preview-foreground': scheme.fg,
      '--preview-background': scheme.bg,
      '--bg-app': null,
      '--bg-canvas': mode === 'lunar' ? null : scheme.bg,
      '--bg-header': null,
      '--header-artwork-ink': null,
      '--text-on-header': null
    };
    Object.entries(values).forEach(([name, value]) => {
      if (value === null) target.style.removeProperty(name);
      else target.style.setProperty(name, value);
    });
  }

  function syncCustomSelectState(selectElement, wrapperElement, selectedValue, fallbackLabel) {
    if (!selectElement || !wrapperElement) {
      return null;
    }

    if (selectedValue != null && selectElement.value !== selectedValue) {
      selectElement.value = selectedValue;
    }

    const selectedIndex = typeof selectElement.selectedIndex === 'number'
      ? selectElement.selectedIndex
      : -1;
    const selectedOption = selectElement.options && selectedIndex >= 0
      ? selectElement.options[selectedIndex]
      : null;
    const resolvedLabel = selectedOption && typeof selectedOption.textContent === 'string'
      ? selectedOption.textContent
      : String(fallbackLabel || selectedValue || '');

    const triggerLabel = typeof wrapperElement.querySelector === 'function'
      ? wrapperElement.querySelector('.custom-select-trigger')
      : null;
    if (triggerLabel) {
      const label = triggerLabel.querySelector?.('[data-select-label]');
      (label || triggerLabel).textContent = resolvedLabel;
      if (triggerLabel.dataset && triggerLabel.dataset.label && typeof triggerLabel.setAttribute === 'function') {
        triggerLabel.setAttribute('aria-label', `${triggerLabel.dataset.label}: ${resolvedLabel}`);
      }
    }

    const customOptions = typeof wrapperElement.querySelectorAll === 'function'
      ? wrapperElement.querySelectorAll('.custom-option')
      : [];
    if (customOptions && typeof customOptions.forEach === 'function') {
      customOptions.forEach(option => {
        const isSelected = Boolean(option && option.dataset && option.dataset.value === selectElement.value);
        if (option && option.classList && typeof option.classList.toggle === 'function') {
          option.classList.toggle('selected', isSelected);
        }
        if (option && typeof option.setAttribute === 'function') {
          option.setAttribute('aria-selected', String(isSelected));
        }
      });
    }

    return resolvedLabel;
  }

  function syncCustomSelectOptionState(wrapperElement, optionValue, options = {}) {
    if (!wrapperElement || typeof wrapperElement.querySelector !== 'function') {
      return null;
    }

    const customOption = wrapperElement.querySelector(`.custom-option[data-value="${optionValue}"]`);
    if (!customOption) {
      return null;
    }

    const hidden = Boolean(options.hidden);
    const disabled = Boolean(options.disabled);

    if (customOption.classList && typeof customOption.classList.toggle === 'function') {
      customOption.classList.toggle('is-hidden', hidden);
      customOption.classList.toggle('is-disabled', disabled);
    }

    if (typeof customOption.setAttribute === 'function') {
      customOption.setAttribute('aria-hidden', String(hidden));
      customOption.setAttribute('aria-disabled', String(disabled));
    }

    return customOption;
  }

  return {
    getColorThemePair,
    styleColorThemeOption,
    COLOR_SCHEMES,
    applyColorScheme,
    DEFAULT_COLOR_MODE,
    AVAILABLE_COLOR_MODES,
    AVAILABLE_COLOR_MODE_SET,
    LEGACY_COLOR_MODE_ALIASES,
    normalizeColorModeValue,
    syncCustomSelectState,
    syncCustomSelectOptionState
  };
});
