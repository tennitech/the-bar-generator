/* Prepare stable parameter chrome before renderer setup; bind runtime actions once. */
(function (scope) {
  let callbacks = {};
  const pendingActions = [];
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
      // Reactive triangle controls have no Randomize/Reset actions.
      if (!style || style === 'triangles') return;
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
    // Apply an intentional early click once setup finishes; never install duplicate handlers.
    while (pendingActions.length) {
      const { action, style } = pendingActions.shift();
      if (callbacks[action]) callbacks[action](style);
    }
  }
  scope.ParameterControls = { prepareSliderValueLabel, prepare, bindActions };
})(typeof window !== 'undefined' ? window : globalThis);
