const fs = require('node:fs');
const vm = require('node:vm');

function fixture() {
  function node(tagName = 'div', className = '') {
    const attrs = new Map(), listeners = new Map();
    const element = {
      tagName: tagName.toUpperCase(), className, children: [], dataset: {}, textContent: '',
      style: { setProperty() {} }, scrollTop: 0, scrollHeight: 100, clientHeight: 100,
      addEventListener(type, listener, capture) {
        const handlers = listeners.get(type) || [];
        handlers.push({ listener, capture }); listeners.set(type, handlers);
      },
      emit(type, event = {}) { for (const { listener } of listeners.get(type) || []) listener({ target: element, ...event }); },
      listeners,
      dispatchEvent(event) { element.emit(event.type, event); },
      appendChild(child) { child.parentNode = element; element.children.push(child); return child; },
      insertBefore(child, before) {
        child.parentNode = element; element.children.splice(element.children.indexOf(before), 0, child);
      },
      setAttribute(name, value) { attrs.set(name, String(value)); },
      getAttribute(name) { return attrs.get(name) ?? null; },
      hasAttribute(name) { return attrs.has(name); },
      removeAttribute(name) { attrs.delete(name); },
      contains(target) { return target === element || element.children.some(child => child.contains(target)); },
      closest(selector) { return selector === '#sidebar-scroll' ? null : element.classList.contains(selector.slice(1)) ? element : element.parentNode?.closest(selector); },
      querySelectorAll(selector) {
        const match = candidate => selector === '.custom-option:not(.is-hidden)'
          ? candidate.classList.contains('custom-option') && !candidate.classList.contains('is-hidden')
          : candidate.classList.contains(selector.slice(1));
        return element.children.flatMap(child => [...(match(child) ? [child] : []), ...child.querySelectorAll(selector)]);
      },
      querySelector(selector) { return element.querySelectorAll(selector)[0] || null; },
      getBoundingClientRect: () => ({ top: 20, bottom: 60 }),
      scrollIntoView: jest.fn(),
      focus: jest.fn()
    };
    element.classList = {
      contains: value => element.className.split(' ').includes(value),
      add(value) { if (!this.contains(value)) element.className += ` ${value}`; },
      remove(value) { element.className = element.className.split(' ').filter(item => item !== value).join(' '); },
      toggle(value, force) { const next = force ?? !this.contains(value); this[next ? 'add' : 'remove'](value); return next; }
    };
    return element;
  }
  const document = node(), window = node();
  const selects = ['first', 'second'].map(id => {
    const select = node('select', 'control-select'); select.id = id; select.value = 'one';
    select.options = ['one', 'two'].map(value => {
      const option = node('option'); Object.assign(option, { value, textContent: value, selected: value === 'one' });
      select.appendChild(option); return option;
    });
    select.selectedIndex = 0;
    const parent = node(); parent.appendChild(select); document.appendChild(parent);
    return select;
  });
  document.createElement = node;
  // Native selects are static; the rest of the fake DOM exercises actual
  // controller listeners and ARIA state, without copying its lifecycle logic.
  const queryAll = document.querySelectorAll;
  document.querySelectorAll = selector => selector === '.control-select' ? selects : queryAll(selector);
  document.querySelector = () => null;
  window.innerHeight = 800;
  window.themeModeUtils = { syncCustomSelectState: jest.fn() };
  const context = vm.createContext({ document, window, requestAnimationFrame: callback => callback(), Event });
  vm.runInContext(fs.readFileSync(require.resolve('../js/utils/customDropdowns'), 'utf8'), context);
  context.setupCustomDropdowns();
  const pickers = selects.map(select => ({
    select, wrapper: select.parentNode,
    trigger: select.parentNode.querySelector('.custom-select-trigger'),
    list: select.parentNode.querySelector('.custom-select-options')
  }));
  const click = picker => picker.trigger.emit('click', { stopPropagation() {} });
  return { document, window, pickers, click, node };
}

function expectClosed(picker) {
  expect(picker.wrapper.classList.contains('open')).toBe(false);
  expect(picker.trigger.getAttribute('aria-expanded')).toBe('false');
  expect(picker.trigger.getAttribute('aria-activedescendant')).toBeNull();
  expect(picker.list.getAttribute('aria-hidden')).toBe('true');
  expect(picker.list.inert).toBe(true);
  expect(picker.wrapper.querySelectorAll('.is-active')).toHaveLength(0);
}

test('switching pickers clears the previous active descendant and preserves the new picker', () => {
  const { pickers: [first, second], click } = fixture();
  expect(first.trigger.getAttribute('aria-expanded')).toBe('false');
  click(first);
  expect(first.trigger.getAttribute('aria-activedescendant')).toBe('first-option-0');
  expect(first.list.getAttribute('aria-hidden')).toBe('false');
  click(second);
  expectClosed(first);
  expect(second.wrapper.classList.contains('open')).toBe(true);
  expect(second.trigger.getAttribute('aria-activedescendant')).toBe('second-option-0');
  click(first); // reverse an in-flight CSS fade without a delayed JS cleanup
  expectClosed(second);
  expect(first.list.getAttribute('aria-hidden')).toBe('false');
});

test('outside pointer dismissal runs in capture phase and never takes focus from the destination', () => {
  const { document, pickers: [picker], click, node } = fixture();
  click(picker);
  expect(document.listeners.get('pointerdown')[0].capture).toBe(true);
  document.emit('pointerdown', { target: picker.list });
  expect(picker.wrapper.classList.contains('open')).toBe(true);
  const calls = picker.trigger.focus.mock.calls.length;
  document.emit('pointerdown', { target: node('button') });
  expectClosed(picker);
  expect(picker.trigger.focus).toHaveBeenCalledTimes(calls);
});

test.each(['focusin', 'click'])('%s outside the picker dismisses without committing an arrow-key draft', type => {
  const { document, pickers: [picker], click, node } = fixture();
  click(picker);
  picker.trigger.emit('keydown', { key: 'ArrowDown', preventDefault() {}, stopPropagation() {} });
  document.emit(type, { target: node('button') });
  expectClosed(picker);
  expect(picker.select.value).toBe('one');
});

test('window blur, pagehide and hidden-document interruptions dismiss; returning never reopens', () => {
  const { document, window, pickers: [picker], click } = fixture();
  for (const event of ['blur', 'pagehide']) {
    click(picker); window.emit(event); expectClosed(picker);
  }
  click(picker);
  document.hidden = false; document.emit('visibilitychange');
  expect(picker.wrapper.classList.contains('open')).toBe(true);
  document.hidden = true; document.emit('visibilitychange'); expectClosed(picker);
  document.hidden = false; document.emit('visibilitychange'); expectClosed(picker);
});

test.each(['Escape', 'Tab'])('%s keeps native keyboard dismissal and never prevents Tab navigation', key => {
  const { pickers: [picker], click } = fixture();
  click(picker);
  const preventDefault = jest.fn(), stopPropagation = jest.fn();
  picker.trigger.emit('keydown', { key, preventDefault, stopPropagation });
  expectClosed(picker);
  expect(preventDefault).toHaveBeenCalledTimes(key === 'Escape' ? 1 : 0);
});


test('committing a pointer selection still changes the native select and returns focus without scrolling', () => {
  const { pickers: [picker], click } = fixture();
  const changed = jest.fn();
  picker.select.addEventListener('change', changed);
  click(picker);
  picker.wrapper.querySelectorAll('.custom-option')[1].emit('click', { stopPropagation() {} });
  expect(picker.select.value).toBe('two');
  expect(changed).toHaveBeenCalledTimes(1);
  expectClosed(picker);
  expect(picker.trigger.focus).toHaveBeenLastCalledWith({ preventScroll: true });
});


test('a pointer press on a nonfocusable row survives native focus moving to its scroll container', () => {
  const { document, pickers: [picker], click, node } = fixture();
  click(picker);
  const row = picker.wrapper.querySelectorAll('.custom-option')[1];
  document.emit('pointerdown', { target: row });
  document.emit('focusin', { target: node('div') });
  expect(picker.wrapper.classList.contains('open')).toBe(true);
  document.emit('pointerup', { target: row });
  row.emit('click', { stopPropagation() {} });
  expect(picker.select.value).toBe('two');
  expectClosed(picker);
  expect(picker.trigger.focus).toHaveBeenLastCalledWith({ preventScroll: true });
});

test.each(['pointerup', 'pointercancel'])('%s releases pointer protection before subsequent outside focus', type => {
  const { document, pickers: [picker], click, node } = fixture();
  click(picker);
  document.emit('pointerdown', { target: picker.list });
  document.emit(type, { target: picker.list });
  document.emit('focusin', { target: node('button') });
  expectClosed(picker);
  expect(picker.select.value).toBe('one');
});


test('Tab makes the fading popup inert before native focus navigation', () => {
  const { pickers: [picker], click } = fixture();
  click(picker);
  expect(picker.list.inert).not.toBe(true);
  const preventDefault = jest.fn();
  picker.trigger.emit('keydown', { key: 'Tab', preventDefault });
  expect(picker.list.inert).toBe(true);
  expect(preventDefault).not.toHaveBeenCalled();
  expectClosed(picker);
});
