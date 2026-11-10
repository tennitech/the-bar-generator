/* Shared progressive enhancement; usable before p5 or canvas initialization. */
// --- Custom Dropdown Logic ---
function setupCustomDropdowns() {
  const selects = document.querySelectorAll('.control-select');
  const dismissals = new Map();
  const dismissOthers = target => dismissals.forEach((dismiss, wrapper) => {
    if (!target || !wrapper.contains(target)) dismiss();
  });

  selects.forEach(select => {
    // Check if already initialized to avoid duplicates
    if (select.parentNode.classList.contains('custom-select-wrapper')) return;

    // Create wrapper
    const wrapper = document.createElement('div');
    wrapper.className = 'custom-select-wrapper';
    if (['style-select', 'triangles-direction-select', 'color-mode-select'].includes(select.id)) wrapper.classList.add('select_visual');
    select.parentNode.insertBefore(wrapper, select);
    wrapper.appendChild(select);

    const isColorTheme = select.id === 'color-mode-select';
    if (isColorTheme) wrapper.classList.add('color_theme-select');
    function addColorLabel(element) {
      const label = document.createElement('span');
      label.className = 'color_theme-label';
      label.dataset.selectLabel = '';
      label.textContent = element.textContent;
      element.textContent = '';
      element.appendChild(label);
    }

    // Create trigger
    const trigger = document.createElement('button');
    trigger.type = 'button';
    trigger.className = 'custom-select-trigger';
    trigger.setAttribute('role', 'combobox');
    trigger.setAttribute('aria-haspopup', 'listbox');
    trigger.setAttribute('aria-expanded', 'false');
    const selectLabel = document.querySelector(`label[for="${select.id}"]`);
    const accessibleLabel = selectLabel ? selectLabel.textContent.trim() : (select.getAttribute('aria-label') || 'Choose an option');
    trigger.dataset.label = accessibleLabel;
    const selectedOption = select.options[select.selectedIndex];
    trigger.textContent = selectedOption ? selectedOption.textContent : 'Select...';
    trigger.setAttribute('aria-label', `${accessibleLabel}: ${trigger.textContent}`);
    if (isColorTheme) addColorLabel(trigger);
    wrapper.appendChild(trigger);

    // Create options list
    const optionsList = document.createElement('div');
    optionsList.className = 'custom-select-options';
    optionsList.id = `${select.id}-options`;
    optionsList.setAttribute('role', 'listbox');
    optionsList.setAttribute('aria-hidden', 'true');
    optionsList.setAttribute('aria-label', accessibleLabel);
    trigger.setAttribute('aria-controls', optionsList.id);
    wrapper.appendChild(optionsList);

    const fadeTop = document.createElement('div');
    fadeTop.className = 'custom-select-scroll-fade custom-select-scroll-fade-top';
    optionsList.appendChild(fadeTop);

    const optionsViewport = document.createElement('div');
    optionsViewport.className = 'custom-select-options-scroll';
    optionsList.appendChild(optionsViewport);

    const fadeBottom = document.createElement('div');
    fadeBottom.className = 'custom-select-scroll-fade custom-select-scroll-fade-bottom';
    optionsList.appendChild(fadeBottom);

    const updateScrollFades = () => {
      const canScroll = optionsViewport.scrollHeight > optionsViewport.clientHeight + 1;
      const hasScrollTop = canScroll && optionsViewport.scrollTop > 1;
      const hasScrollBottom = canScroll &&
        optionsViewport.scrollTop + optionsViewport.clientHeight < optionsViewport.scrollHeight - 1;

      optionsList.classList.toggle('has-scroll-top', hasScrollTop);
      optionsList.classList.toggle('has-scroll-bottom', hasScrollBottom);
    };

    let previewsReady = false;
    function preparePreviews() {
      if (previewsReady || !window.SelectorPreviews || typeof window.generateStaticPackedCircles !== 'function') return;
      Array.from(select.options).forEach(option => {
        const row = Array.from(optionsViewport.querySelectorAll('.custom-option')).find(row => row.dataset.value === option.value);
        if (row) window.SelectorPreviews.decorate(row, select, option);
      });
      previewsReady = true;
    }
    function fitMenu() {
      const bounds = trigger.getBoundingClientRect();
      const scrollRegion = select.closest('#sidebar-scroll')?.getBoundingClientRect();
      const bottom = Math.min(window.innerHeight, window.visualViewport?.height || window.innerHeight, scrollRegion?.bottom || Infinity) - 12;
      const top = Math.max(12, scrollRegion?.top || 0);
      const below = bottom - bounds.bottom;
      const above = bounds.top - top;
      const flip = below < 176 && above > below;
      optionsList.style.top = flip ? 'auto' : '100%';
      optionsList.style.bottom = flip ? '100%' : 'auto';
      const preferred = select.id === 'style-select' ? 560 : 256;
      optionsList.style.setProperty('--dropdown-menu-max-height', `${Math.max(44, Math.min(preferred, flip ? above : below))}px`);
      updateScrollFades();
    }
    let optionIndex = 0;
    const appendCustomOption = (option, parent = optionsViewport) => {
      const customOption = document.createElement('div');
      customOption.className = 'custom-option';
      customOption.id = `${select.id}-option-${optionIndex++}`;
      customOption.setAttribute('role', 'option');
      customOption.setAttribute('aria-selected', String(option.selected));
      customOption.textContent = option.textContent;
      customOption.dataset.value = option.value;
      if (isColorTheme) {
        customOption.classList.add('color_theme-option');
        addColorLabel(customOption);
        window.themeModeUtils.styleColorThemeOption(customOption, option.value);
        const inkMark = document.createElement('span');
        inkMark.className = 'color_theme-ink';
        inkMark.setAttribute('aria-hidden', 'true');
        customOption.appendChild(inkMark);
      }
      if (option.hasAttribute('data-coming-soon')) {
        // Native touch pickers cannot expose hover hints: include availability
        // in their label, while preserving the original label for restored URLs.
        option.label = `${option.textContent} — Coming soon`;
        const hint = document.createElement('span');
        hint.className = 'select_availability-hint';
        hint.id = `${customOption.id}-hint`;
        hint.textContent = 'Coming soon';
        customOption.appendChild(hint);
        customOption.setAttribute('aria-describedby', hint.id);
      }
      customOption.setAttribute('aria-disabled', String(option.disabled));

      if (option.selected) {
        customOption.classList.add('selected');
      }

      if (option.hidden) {
        customOption.classList.add('is-hidden');
        customOption.setAttribute('aria-hidden', 'true');
      }

      if (option.disabled) {
        customOption.classList.add('is-disabled');
      }

      customOption.addEventListener('click', (e) => {
        e.stopPropagation();
        if (customOption.classList.contains('is-hidden') || customOption.classList.contains('is-disabled')) {
          return;
        }

        commitOption(customOption);
      });

      parent.appendChild(customOption);
    };

    // Populate options, preserving optgroup headings where present.
    Array.from(select.children).forEach(child => {
      if (child.tagName === 'OPTGROUP') {
        const groupLabel = document.createElement('div');
        groupLabel.className = 'custom-option-group-label';
        groupLabel.textContent = child.label;
        // Section bounds let the next heading naturally push this one away.
        optionsList.classList.add('select_grouped');
        const group = document.createElement('div');
        group.className = 'select_option-group';
        group.setAttribute('role', 'group');
        groupLabel.id = `${select.id}-group-${optionIndex}`;
        group.setAttribute('aria-labelledby', groupLabel.id);
        optionsViewport.appendChild(group);
        group.appendChild(groupLabel);

        Array.from(child.children).forEach(option => appendCustomOption(option, group));
        return;
      }

      if (child.tagName === 'OPTION') {
        appendCustomOption(child);
      }
    });

    // Disabled rows with availability hints remain discoverable with arrow keys.
    // Selection is guarded separately so neither Enter nor pointer can commit them.
    const getNavigableOptions = () => Array.from(optionsViewport.querySelectorAll('.custom-option:not(.is-hidden)'))
      .filter(option => !option.classList.contains('is-disabled') || option.querySelector('.select_availability-hint'));
    let activeOption = null;

    function setActiveOption(option) {
      if (!option) return;
      activeOption?.classList.remove('is-active');
      activeOption = option;
      activeOption.classList.add('is-active');
      trigger.setAttribute('aria-activedescendant', option.id);
      option.scrollIntoView({ block: 'nearest' });
    }

    function setOpen(open) {
      wrapper.classList.toggle('open', open);
      trigger.setAttribute('aria-expanded', String(open));
      optionsList.setAttribute('aria-hidden', String(!open));
      if (open) {
        preparePreviews();
        fitMenu();
        const options = getNavigableOptions();
        setActiveOption(options.find(option => option.dataset.value === select.value) || options[0]);
        requestAnimationFrame(updateScrollFades);
      } else {
        trigger.removeAttribute('aria-activedescendant');
        activeOption?.classList.remove('is-active');
        activeOption = null;
      }
    }

    dismissals.set(wrapper, () => setOpen(false));

    function commitOption(option) {
      if (option.classList.contains('is-hidden') || option.classList.contains('is-disabled')) return;
      select.value = option.dataset.value;
      select.dispatchEvent(new Event('change', { bubbles: true }));
      setOpen(false);
      trigger.focus({ preventScroll: true });
    }

    // Toggle dropdown
    trigger.addEventListener('click', (e) => {
      e.stopPropagation();
      trigger.focus({ preventScroll: true });
      dismissOthers(trigger);
      setOpen(!wrapper.classList.contains('open'));
    });

    trigger.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') {
        if (wrapper.classList.contains('open')) {
          event.preventDefault();
          event.stopPropagation();
          setOpen(false);
        }
        return;
      }
      if (event.key === 'Tab') {
        setOpen(false);
        return;
      }
      if (!['ArrowDown', 'ArrowUp', 'Home', 'End', 'Enter', ' '].includes(event.key)) return;
      event.preventDefault();
      event.stopPropagation();
      if (!wrapper.classList.contains('open')) {
        setOpen(true);
        const options = getNavigableOptions();
        if (event.key === 'Home') setActiveOption(options[0]);
        if (event.key === 'End') setActiveOption(options[options.length - 1]);
        return;
      }
      if (event.key === 'Enter' || event.key === ' ') {
        if (activeOption) commitOption(activeOption);
        return;
      }
      const options = getNavigableOptions();
      if (!options.length) return;
      const currentIndex = Math.max(0, options.indexOf(activeOption));
      const nextIndex = event.key === 'Home' ? 0
        : event.key === 'End' ? options.length - 1
          : event.key === 'ArrowDown' ? Math.min(options.length - 1, currentIndex + 1)
            : Math.max(0, currentIndex - 1);
      setActiveOption(options[nextIndex]);
    });

    // Listen for external updates to the select (e.g. from keyboard shortcuts)
    select.addEventListener('change', () => {
      const newSelected = select.options[select.selectedIndex];
      window.themeModeUtils.syncCustomSelectState(select, wrapper, select.value, newSelected ? newSelected.textContent : select.value);
      wrapper.querySelectorAll('.custom-option').forEach(option => {
        option.setAttribute('aria-selected', String(option.dataset.value === select.value));
      });
      requestAnimationFrame(updateScrollFades);
    });
    select.addEventListener('input', () => {
      const newSelected = select.options[select.selectedIndex];
      window.themeModeUtils.syncCustomSelectState(select, wrapper, select.value, newSelected ? newSelected.textContent : select.value);
    });

    window.addEventListener('resize', () => { if (wrapper.classList.contains('open')) fitMenu(); });
    optionsViewport.addEventListener('scroll', updateScrollFades);
    requestAnimationFrame(updateScrollFades);
  });

  window.SecondaryColorGuidance?.setup(document);

  // Dismiss before another control handles the pointer, even when its click
  // stops propagation. Synthetic clicks and programmatic focus get the same
  // cleanup, without returning focus away from the user's new target.
  document.addEventListener('pointerdown', event => dismissOthers(event.target), true);
  document.addEventListener('click', event => dismissOthers(event.target));
  document.addEventListener('focusin', event => dismissOthers(event.target));
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) dismissOthers();
  });
  window.addEventListener('blur', () => dismissOthers());
  window.addEventListener('pagehide', () => dismissOthers());
}
