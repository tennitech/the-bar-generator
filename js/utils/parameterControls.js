/* Prepare stable parameter chrome before renderer setup; bind runtime actions once. */
(function (scope) {
  let callbacks = {};
  const pendingActions = [];
  // Every available family is intentional: fixed artwork has no parameter actions.
  const capabilities = Object.freeze({
    solid: null, ruler: 'ruler', binary: 'binary', morse: 'morse', ticker: 'ticker',
    waveform: 'waveform', 'wave-quantum': 'quantum', circles: 'circles', numeric: 'numeric',
    'circles-gradient': 'circles-gradient', gradient: 'gradient', grid: 'grid', lines: 'lines',
    'point-connect': 'point-connect', 'neural-network': 'neural-network',
    'triangle-grid': 'triangle-grid', triangles: 'triangles',
    'fibonacci-sequence': null, union: null, runway: null, lunar: null
  });
  function fieldsFor(style, root = document) {
    const group = root.querySelector(`[data-parameter-actions="${style}"]`);
    return group ? Array.from(group.querySelectorAll('[data-url-parameter], #quantum-phase, #quantum-speed-slider, #quantum-reverse-toggle')) : [];
  }
  function isDefaultField(field) {
    if (field.type === 'checkbox') return field.checked === field.defaultChecked;
    if (field.tagName === 'SELECT') {
      const initial = Array.from(field.options).find(option => option.defaultSelected) || field.options[0];
      return field.value === initial.value;
    }
    return field.value === field.defaultValue;
  }
  function refresh(root = document) {
    root.querySelectorAll('[data-parameter-action="reset"]').forEach(button => {
      const style = button.dataset.parameterStyle;
      const pristine = fieldsFor(style, root).every(isDefaultField)
        && (style !== 'circles' || !callbacks.isDefaultSeed || callbacks.isDefaultSeed());
      button.disabled = pristine;
      button.title = pristine ? 'Parameters are at their defaults' : 'Restore default parameters';
    });
  }
  function prepareSliderValueLabel(display) {
    if (!display) return;
    display.classList.add('slider_value-display');

    const label = display.closest('label.control-label');
    if (!label || label.dataset.sliderValueLayout === 'ready') {
      return;
    }

    const nodes = Array.from(label.childNodes);
    const displayIndex = nodes.indexOf(display);
    if (displayIndex === -1) {
      return;
    }

    const labelText = document.createElement('span');
    labelText.className = 'slider_label-text';

    const valueGroup = document.createElement('span');
    valueGroup.className = 'slider_value-group';

    nodes.forEach((node, index) => {
      if (index < displayIndex) {
        labelText.appendChild(node);
        return;
      }

      if (node.nodeType === 3) {
        if (node.textContent.trim().length === 0) {
          return;
        }

        const affix = document.createElement('span');
        affix.className = 'slider_value-affix';
        affix.textContent = node.textContent;
        valueGroup.appendChild(affix);
        return;
      }

      valueGroup.appendChild(node);
    });

    label.replaceChildren(labelText, valueGroup);
    label.classList.add('slider_label-row');
    label.dataset.sliderValueLayout = 'ready';
  }

  function prepare(root = document) {
    root.querySelectorAll('[data-slider-value]').forEach(prepareSliderValueLabel);
    root.querySelectorAll('[data-parameter-actions]').forEach(group => {
      const style = group.dataset.parameterActions;
      if (!Object.prototype.hasOwnProperty.call(capabilities, style) || !capabilities[style]) return;
      const header = group.querySelector('.control-header');
      if (!header || header.querySelector('.control-header-actions')) return;
      const label = document.createElement('span');
      label.className = 'control-header-label';
      label.textContent = header.textContent.trim();
      const actions = document.createElement('div');
      actions.className = 'control-header-actions';
      for (const [action, text, className] of [
        ['randomize', 'Randomize', 'control-surprise-btn'], ['reset', 'Reset', 'control-reset-btn']
      ]) {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = className;
        button.textContent = text;
        button.dataset.parameterAction = action;
        button.dataset.parameterStyle = style;
        button.setAttribute('aria-label', `${text} ${style} parameters`);
        button.addEventListener('click', event => {
          event.preventDefault();
          if (callbacks[action]) callbacks[action](style);
          else pendingActions.push({ action, style });
        });
        actions.appendChild(button);
      }
      header.replaceChildren(label, actions);
    });
  }
  function bindActions(nextCallbacks) {
    callbacks = nextCallbacks;
    refresh();
    // Apply an intentional early click once setup finishes; never install duplicate handlers.
    while (pendingActions.length) {
      const { action, style } = pendingActions.shift();
      if (callbacks[action]) callbacks[action](style);
    }
  }
  scope.ParameterControls = { prepareSliderValueLabel, prepare, bindActions, capabilities, fieldsFor, refresh };
})(typeof window !== 'undefined' ? window : globalThis);
