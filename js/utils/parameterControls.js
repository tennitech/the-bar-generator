/* Prepare stable parameter chrome before renderer setup; bind runtime actions once. */
(function (scope) {
  let callbacks = {};
  let runtimeReady = false;
  const preparedFeedback = new WeakSet();
  const pendingActions = [];
  const fieldFeedback = new WeakMap();
  let transitionBound = false;
  // Every available family is intentional: fixed artwork has no parameter actions.
  const capabilities = Object.freeze({
    graph: 'graph', music: 'music', nucleotide: 'nucleotide', solid: null, ruler: 'ruler', binary: 'binary', morse: 'morse', ticker: 'ticker',
    waveform: 'waveform', 'wave-quantum': 'quantum', 'well-modes': 'well-modes', rabi: 'rabi', circles: 'circles', numeric: 'numeric',
    'circles-gradient': 'circles-gradient', gradient: 'gradient', grid: 'grid', lines: 'lines',
    'point-connect': 'point-connect', 'neural-network': 'neural-network',
    'triangle-grid': 'triangle-grid', triangles: 'triangles',
    'fibonacci-sequence': null, union: null, runway: null, lunar: null
  });
  const feedbackAnimations = new Map();
  let feedbackMotion;
  function cancelFeedback() {
    feedbackAnimations.forEach(animation => animation.cancel());
    feedbackAnimations.clear();
  }
  function feedback(button, action) {
    if (!button || !scope.matchMedia) return;
    if (!feedbackMotion) {
      feedbackMotion = scope.matchMedia('(prefers-reduced-motion: reduce)');
      feedbackMotion.addEventListener('change', event => { if (event.matches) cancelFeedback(); });
      scope.addEventListener('pagehide', cancelFeedback);
      document.addEventListener('visibilitychange', () => { if (document.hidden) cancelFeedback(); });
    }
    if (feedbackMotion.matches || document.hidden) { cancelFeedback(); return; }
    // Decoration only: each die rolls once, with bounded independent variation.
    const roll = (face, side) => {
      const direction = Math.random() < 0.5 ? -1 : 1;
      const travel = 0.6 + Math.random() * 0.6;
      const overshoot = 3 + Math.random() * 4;
      const duration = (face === 'back' ? 560 : 600) + Math.random() * 100;
      const smooth = value => value * value * (3 - 2 * value);
      const frames = Array.from({ length: 25 }, (_, index) => {
        const t = index / 24;
        const spread = index === 24 ? 0 : travel * Math.sin(Math.PI * t) ** 2;
        const angle = t <= 0.84
          ? (360 + overshoot) * smooth(t / 0.84)
          : 360 + overshoot * (1 - smooth((t - 0.84) / 0.16));
        return { offset: t, transform: `translate(${side * spread}px, ${-side * spread * 0.55}px) rotate(${direction * angle}deg)` };
      });
      return { target: button.querySelector(`[data-die-face="${face}"]`), duration, frames };
    };
    const responses = action === 'randomize' ? [
      roll('back', 1), roll('front', -1)
    ] : [{ target: button.querySelector('.parameter_action-label'), duration: 160,
      frames: action === 'undo'
        ? [{ transform: 'translateX(-2px)', opacity: 0.7 }, { transform: 'translateX(0)', opacity: 1 }]
        : [{ opacity: 0.6 }, { opacity: 1 }] }];
    for (const { target, duration, frames } of responses) {
      if (typeof target?.animate !== 'function') continue;
      const previous = feedbackAnimations.get(target);
      // A repeated activation continues from each die's current displayed pose.
      const current = action === 'randomize' && previous ? scope.getComputedStyle?.(target)?.transform : null;
      previous?.cancel();
      const poses = current && current !== 'none' ? [{ ...frames[0], transform: current }, ...frames.slice(1)] : frames;
      // Sampled smooth acceleration and a small recoil settle into a full turn.
      const animation = target.animate(poses, { duration, easing: action === 'randomize' ? 'linear' : 'ease-out' });
      feedbackAnimations.set(target, animation);
      const done = () => { if (feedbackAnimations.get(target) === animation) feedbackAnimations.delete(target); };
      animation.finished.then(done, done);
    }
  }

  function supportsActions(style) {
    return Object.prototype.hasOwnProperty.call(capabilities, style) && Boolean(capabilities[style]);
  }
  function fieldsFor(style, root = document) {
    const group = root.querySelector(`[data-parameter-actions="${style}"]`);
    return group ? Array.from(group.querySelectorAll('[data-url-parameter], #quantum-phase, #quantum-speed-slider, #quantum-reverse-toggle')) : [];
  }
  function isDefaultField(field) {
    if (field.type === 'checkbox') return field.checked === field.defaultChecked;
    // A full Quantum recurrence is the same model state as phase zero.
    if (field.id === 'quantum-phase' && scope.quantumModel) {
      const phase = scope.quantumControls?.settingPhase?.() ?? field.value;
      return scope.quantumModel.normalizePhase(phase) === scope.quantumModel.normalizePhase(field.defaultValue);
    }
    if (['well-phase', 'rabi-phase'].includes(field.id) && scope.quantumStudyControls) {
      return Math.abs(scope.quantumStudyControls.settingPhase(field.id.split('-')[0]) - Number(field.defaultValue)) < 1e-12;
    }
    if (field.type === 'range') return Number(field.value) === Number(field.defaultValue);
    if (field.tagName === 'SELECT') {
      const initial = Array.from(field.options).find(option => option.defaultSelected) || field.options[0];
      return field.value === initial.value;
    }
    return field.value === field.defaultValue;
  }
  function defaultValueLabel(field) {
    if (field.type === 'checkbox') return field.defaultChecked ? 'On' : 'Off';
    if (field.tagName === 'SELECT') {
      const option = Array.from(field.options).find(item => item.defaultSelected) || field.options[0];
      return option?.textContent?.trim() || option?.value || '';
    }
    const value = field.defaultValue;
    if (field.id === 'waveform-note-slider') return window.WaveformNotes.get(value).name;
    if (field.id === 'waveform-type-slider') return ['Sine', 'Sawtooth', 'Square', 'Pulse'][Math.round(Number(value))];
    if (field.id === 'lines-variant-slider') return Number(value) === 1 ? 'LG' : 'MD';
    if (field.id === 'quantum-phase') return `${(Number(value) * 100).toFixed(1)}%`;
    if (field.id === 'ticker-ratio-slider') return `${value}:1`;
    if (field.id === 'ticker-width-ratio-slider') return `1:${value}`;
    if (['neural-network-input-slider', 'circles-density-slider', 'circles-size-variation-slider'].includes(field.id)) return `${value}%`;
    return value === '' ? 'Empty' : String(value);
  }
  function prepareFieldFeedback(field, group) {
    if (fieldFeedback.has(field) || !field.labels) return;
    const label = Array.from(field.labels).find(item => item.classList.contains('control-label'));
    if (!label) return;
    const marker = document.createElement('span');
    marker.className = 'parameter_marker';
    marker.setAttribute('aria-hidden', 'true');
    (label.querySelector('.slider_label-text') || label).appendChild(marker);
    const note = document.createElement('span');
    note.id = `${field.id}-default-note`;
    note.className = 'u-sr-only';
    group.appendChild(note);
    const targets = [field, label.querySelector('[data-slider-value]'),
      field.closest('.select-wrapper, .control')?.querySelector('.custom-select-trigger')].filter(Boolean);
    for (const target of targets) {
      const ids = new Set((target.getAttribute('aria-describedby') || '').split(/\s+/).filter(Boolean));
      ids.add(note.id);
      target.setAttribute('aria-describedby', [...ids].join(' '));
    }
    fieldFeedback.set(field, { marker, note, label });
  }
  function isDefaultSeed() {
    return callbacks.isDefaultSeed ? callbacks.isDefaultSeed()
      : (scope.GeneratorInitialState?.getInitialSeed?.() ?? 1) === 1;
  }
  function refreshFeedback(style, fields, root) {
    const group = root.querySelector(`[data-parameter-actions="${style}"]`);
    if (!group) return;
    let changed = 0;
    for (const field of fields) {
      const pristine = isDefaultField(field);
      if (!pristine) changed++;
      const feedback = fieldFeedback.get(field);
      if (!feedback) continue;
      const text = `${pristine ? 'Default setting.' : 'Changed.'} Default: ${defaultValueLabel(field)}.`;
      if (feedback.note.textContent !== text) feedback.note.textContent = text;
      feedback.label.classList.toggle('has-parameter-change', !pristine);
      feedback.marker.title = text;
      // The title also makes the default discoverable without opening an editor.
      feedback.label.title = text;
    }
    const seedChanged = style === 'circles' && !isDefaultSeed();
    if (seedChanged) changed++;
    const summary = group.querySelector('[data-parameter-summary]');
    if (summary) {
      const text = changed ? `${changed} changed from defaults` : 'Default settings';
      if (summary.textContent !== text) summary.textContent = text;
      summary.title = seedChanged ? 'Includes the circle arrangement.' : '';
    }
  }
  function refreshButton(button, root) {
    // First-paint controls already contain the validated saved state. Renderer
    // setup temporarily reapplies query defaults before restoring that snapshot.
    // Keep its truthful initial feedback until the complete runtime is bound.
    if (!runtimeReady && preparedFeedback.has(button)) return;
    preparedFeedback.add(button);
    const style = button.dataset.parameterStyle;
    const fields = fieldsFor(style, root);
    const pristine = fields.every(isDefaultField)
      && (style !== 'circles' || isDefaultSeed());
    if (button.disabled !== pristine) button.disabled = pristine;
    const title = pristine ? 'Parameters are at their defaults' : 'Restore default parameters';
    if (button.title !== title) button.title = title;
    refreshFeedback(style, fields, root);
  }
  function refresh(root = document) {
    root.querySelectorAll('[data-parameter-action="reset"]').forEach(button => refreshButton(button, root));
  }
  function refreshStyle(style, root = document) {
    if (!supportsActions(style)) return;
    const button = root.querySelector(`[data-parameter-action="reset"][data-parameter-style="${style}"]`);
    if (button) refreshButton(button, root);
  }
  function prepareSliderValueLabel(display) {
    if (!display) return;
    display.classList.add(display.hasAttribute('data-slider-label') ? 'slider_value-text' : 'slider_value-display');

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
    root.querySelectorAll('[data-slider-value], [data-slider-label]').forEach(prepareSliderValueLabel);
    root.querySelectorAll('[data-parameter-actions]').forEach(group => {
      const style = group.dataset.parameterActions;
      if (!supportsActions(style)) return;
      const header = group.querySelector('.control-header');
      if (!header || header.querySelector('.control-header-actions')) return;
      const label = document.createElement('span');
      label.className = 'control-header-label';
      label.textContent = header.textContent.trim();
      const actions = document.createElement('div');
      actions.className = 'control-header-actions';
      for (const [action, text, className] of [
        ['randomize', 'Randomize', 'control-surprise-btn'],
        ['undo', 'Undo', 'control-reset-btn control_undo-button'],
        ['reset', 'Reset', 'control-reset-btn']
      ]) {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = className;
        const actionLabel = document.createElement('span');
        actionLabel.className = 'parameter_action-label';
        actionLabel.textContent = text;
        if (action === 'randomize') {
          const glyph = document.createElement('span');
          glyph.className = 'parameter_action-glyph';
          glyph.setAttribute('aria-hidden', 'true');
          // Separate complete faces remain recognizable while each rolls independently.
          glyph.innerHTML = '<svg class="parameter_action-icon" data-control-icon="dice" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><g data-die-face="back"><g transform="rotate(12 18 6)"><rect x="13" y="1" width="10" height="10" rx="1.6"/><circle cx="15.5" cy="3.5" r="1.1" fill="currentColor" stroke="none"/><circle cx="20.5" cy="3.5" r="1.1" fill="currentColor" stroke="none"/><circle cx="15.5" cy="8.5" r="1.1" fill="currentColor" stroke="none"/><circle cx="20.5" cy="8.5" r="1.1" fill="currentColor" stroke="none"/></g></g><g data-die-face="front"><rect x="1" y="13" width="10" height="10" rx="1.6"/><circle cx="3.5" cy="20.5" r="1.1" fill="currentColor" stroke="none"/><circle cx="6" cy="18" r="1.1" fill="currentColor" stroke="none"/><circle cx="8.5" cy="15.5" r="1.1" fill="currentColor" stroke="none"/></g></svg>';
          button.appendChild(glyph);
        }
        button.appendChild(actionLabel);
        if (action === 'undo') {
          // Reserve the real button in the initial chrome. History setup only
          // binds it later, so Randomize never moves when the renderer is ready.
          const option = Array.from(root.querySelector('#style-select')?.options || [])
            .find(item => item.value === style);
          const styleLabel = option?.textContent.trim() || style;
          button.dataset.randomizeUndo = style;
          button.disabled = true;
          button.title = 'Available after Randomize, until your next edit';
          button.setAttribute('aria-label', `Undo last ${styleLabel} randomization`);
        } else {
          button.dataset.parameterAction = action;
          button.dataset.parameterStyle = style;
          button.setAttribute('aria-label', `${text} ${style} parameters`);
          button.addEventListener('click', event => {
            event.preventDefault();
            if (callbacks[action]) {
              callbacks[action](style);
              feedback(button, action);
            } else pendingActions.push({ action, style, button });
          });
        }
        actions.appendChild(button);
      }
      header.replaceChildren(label, actions);
      const summary = document.createElement('p');
      summary.className = 'parameter_summary';
      summary.dataset.parameterSummary = '';
      header.after(summary);
      fieldsFor(style, root).forEach(field => prepareFieldFeedback(field, group));
    });
    scope.SidebarSections?.prepare(root);
    prepareGroupTransition(root);
    refresh(root);
  }
  function prepareGroupTransition(root) {
    const select = root.querySelector('#style-select');
    if (transitionBound || !select?.addEventListener || !scope.matchMedia) return;
    transitionBound = true;
    let lastStyle = select.value;
    let animation;
    let frame;
    const reduced = scope.matchMedia('(prefers-reduced-motion: reduce)');
    const cancel = () => { animation?.cancel(); scope.cancelAnimationFrame(frame); };
    reduced.addEventListener('change', event => { if (event.matches) cancel(); });
    select.addEventListener('change', () => {
      if (select.value === lastStyle) return;
      lastStyle = select.value;
      cancel();
      if (reduced.matches) return;
      // Reveal the whole group together after its controls synchronize. Values,
      // layout and input remain immediate; no stagger or movement is introduced.
      frame = scope.requestAnimationFrame(() => {
        const group = root.querySelector(`[data-parameter-actions="${select.value}"]`);
        if (group?.animate && group.getClientRects().length) {
          animation = group.animate([{ opacity: 0.8 }, { opacity: 1 }], { duration: 120, easing: 'ease-out' });
        }
      });
    });
  }
  function bindActions(nextCallbacks) {
    callbacks = nextCallbacks;
    runtimeReady = true;
    refresh();
    // Apply an intentional early click once setup finishes; never install duplicate handlers.
    while (pendingActions.length) {
      const { action, style, button } = pendingActions.shift();
      if (callbacks[action]) { callbacks[action](style); feedback(button, action); }
    }
  }
  scope.ParameterControls = { prepareSliderValueLabel, prepare, bindActions, capabilities, supportsActions, fieldsFor,
    isDefaultField, defaultValueLabel, refresh, refreshStyle, feedback, cancelFeedback };
})(typeof window !== 'undefined' ? window : globalThis);
