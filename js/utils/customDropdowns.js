/* Shared progressive enhancement; usable before p5 or canvas initialization. */
// --- Custom Dropdown Logic ---
function setupCustomDropdowns() {
  const selects = document.querySelectorAll('.control-select');

  selects.forEach(select => {
    // Check if already initialized to avoid duplicates
    if (select.parentNode.classList.contains('custom-select-wrapper')) return;

    // Create wrapper
    const wrapper = document.createElement('div');
    wrapper.className = 'custom-select-wrapper';
    select.parentNode.insertBefore(wrapper, select);
    wrapper.appendChild(select);

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
    wrapper.appendChild(trigger);

    // Create options list
    const optionsList = document.createElement('div');
    optionsList.className = 'custom-select-options';
    optionsList.id = `${select.id}-options`;
    optionsList.setAttribute('role', 'listbox');
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

    let optionIndex = 0;
    const appendCustomOption = (option) => {
      const customOption = document.createElement('div');
      customOption.className = 'custom-option';
      customOption.id = `${select.id}-option-${optionIndex++}`;
      customOption.setAttribute('role', 'option');
      customOption.setAttribute('aria-selected', String(option.selected));
      customOption.textContent = option.textContent;
      customOption.dataset.value = option.value;
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

      optionsViewport.appendChild(customOption);
    };

    // Populate options, preserving optgroup headings where present.
    Array.from(select.children).forEach(child => {
      if (child.tagName === 'OPTGROUP') {
        const groupLabel = document.createElement('div');
        groupLabel.className = 'custom-option-group-label';
        groupLabel.textContent = child.label;
        optionsViewport.appendChild(groupLabel);

        Array.from(child.children).forEach(option => appendCustomOption(option));
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
      if (open) {
        const options = getNavigableOptions();
        setActiveOption(options.find(option => option.dataset.value === select.value) || options[0]);
        requestAnimationFrame(updateScrollFades);
      } else {
        trigger.removeAttribute('aria-activedescendant');
        activeOption?.classList.remove('is-active');
        activeOption = null;
      }
    }

    function commitOption(option) {
      if (option.classList.contains('is-hidden') || option.classList.contains('is-disabled')) return;
      select.value = option.dataset.value;
      select.dispatchEvent(new Event('change', { bubbles: true }));
      setOpen(false);
      trigger.focus();
    }

    // Toggle dropdown
    trigger.addEventListener('click', (e) => {
      e.stopPropagation();
      const guidance = document.getElementById('color-guidance');
      if (guidance) guidance.open = false;
      document.querySelectorAll('.custom-select-wrapper').forEach(w => {
        if (w !== wrapper) {
          w.classList.remove('open');
          w.querySelectorAll('.is-active').forEach(option => option.classList.remove('is-active'));
          const otherTrigger = w.querySelector('.custom-select-trigger');
          if (otherTrigger) otherTrigger.setAttribute('aria-expanded', 'false');
        }
      });
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

    optionsViewport.addEventListener('scroll', updateScrollFades);
    requestAnimationFrame(updateScrollFades);
  });

  const guidance = document.getElementById('color-guidance');
  if (guidance && !guidance.dataset.initialized) {
    guidance.dataset.initialized = 'true';
    guidance.addEventListener('keydown', event => {
      if (event.key === 'Escape' && guidance.open) {
        event.preventDefault();
        event.stopPropagation();
        guidance.open = false;
        guidance.querySelector('summary').focus();
      }
    });
    document.addEventListener('click', event => {
      if (!guidance.contains(event.target)) guidance.open = false;
    });
  }

  // click outside to close dropdowns
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.custom-select-wrapper')) {
      document.querySelectorAll('.custom-select-wrapper').forEach(w => {
        w.classList.remove('open');
        w.querySelectorAll('.is-active').forEach(option => option.classList.remove('is-active'));
        const trigger = w.querySelector('.custom-select-trigger');
        if (trigger) {
          trigger.setAttribute('aria-expanded', 'false');
          trigger.removeAttribute('aria-activedescendant');
        }
      });
    }
  });
}
