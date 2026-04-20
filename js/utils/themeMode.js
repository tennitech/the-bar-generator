(function (root, factory) {
  const api = factory();

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }

  root.themeModeUtils = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  const DEFAULT_COLOR_MODE = 'black';
  const AVAILABLE_COLOR_MODES = ['black', 'white', 'red', 'blue', 'gold', 'silver', 'gray', 'lunar'];
  const AVAILABLE_COLOR_MODE_SET = new Set(AVAILABLE_COLOR_MODES);
  const LEGACY_COLOR_MODE_ALIASES = {
    'black-on-white': 'black',
    'white-on-black': 'white',
    'red-on-white': 'red',
    'white-on-red': 'white',
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

    return legacyAliases[normalized] || defaultColorMode;
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
      triggerLabel.textContent = resolvedLabel;
    }

    const customOptions = typeof wrapperElement.querySelectorAll === 'function'
      ? wrapperElement.querySelectorAll('.custom-option')
      : [];
    if (customOptions && typeof customOptions.forEach === 'function') {
      customOptions.forEach(option => {
        if (option && option.classList && typeof option.classList.toggle === 'function') {
          option.classList.toggle('selected', option.dataset && option.dataset.value === selectElement.value);
        }
      });
    }

    return resolvedLabel;
  }

  return {
    DEFAULT_COLOR_MODE,
    AVAILABLE_COLOR_MODES,
    AVAILABLE_COLOR_MODE_SET,
    LEGACY_COLOR_MODE_ALIASES,
    normalizeColorModeValue,
    syncCustomSelectState
  };
});
