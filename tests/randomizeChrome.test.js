const fs = require('node:fs');
const vm = require('node:vm');

function fixture() {
  const nodes = [];
  function element(tag = 'div') {
    const node = { tag, dataset: {}, attributes: {}, children: [], listeners: {},
      className: '', _text: '', disabled: false,
      get textContent() { return this._text + this.children.map(child => child.textContent).join(''); },
      set textContent(value) { this._text = String(value); this.children = []; },
      appendChild(child) { this.children.push(child); child.parentElement = this; },
      replaceChildren(...children) { this.children = []; children.forEach(child => this.appendChild(child)); },
      setAttribute(name, value) { this.attributes[name] = value; },
      addEventListener(name, handler) { this.listeners[name] = handler; },
      focus: jest.fn(),
      querySelector(selector) {
        const style = /data-randomize-undo="([^"]+)"/.exec(selector)?.[1];
        if (style) return this.children.find(child => child.dataset.randomizeUndo === style);
        if (selector === '.control-header-actions') return this.children.find(child => child.className === 'control-header-actions');
        if (selector === '.control-header') return this.header;
        if (selector === '[data-parameter-summary]') return this.summary;
        return null;
      },
      querySelectorAll() { return []; }
    };
    nodes.push(node);
    return node;
  }
  const groups = ['circles', 'solid'].map(style => {
    const group = element(); group.dataset.parameterActions = style;
    group.header = element(); group.header.textContent = 'PARAMETERS';
    group.header.after = summary => { group.summary = summary; };
    return group;
  });
  const sidebar = element();
  const document = {
    createElement: jest.fn(element),
    getElementById: id => id === 'app-sidebar' ? sidebar : null,
    querySelectorAll(selector) {
      if (selector === '[data-parameter-actions]') return groups;
      const action = /data-parameter-action="([^"]+)"/.exec(selector)?.[1];
      return action ? nodes.filter(node => node.dataset.parameterAction === action) : [];
    },
    querySelector(selector) {
      if (selector === '#style-select') return { options: [{ value: 'circles', textContent: 'Circles' }] };
      const groupStyle = /data-parameter-actions="([^"]+)"/.exec(selector)?.[1];
      if (groupStyle) return groups.find(group => group.dataset.parameterActions === groupStyle);
      const style = /data-parameter-style="([^"]+)"/.exec(selector)?.[1];
      return nodes.find(node => node.dataset.parameterStyle === style && node.dataset.parameterAction === 'reset');
    }
  };
  const scope = { document, addEventListener: jest.fn() }; scope.window = scope;
  vm.createContext(scope);
  for (const source of ['parameterControls', 'randomizeHistory']) {
    vm.runInContext(fs.readFileSync(require.resolve(`../js/utils/${source}`), 'utf8'), scope);
  }
  return { scope, document, groups };
}

test('initial chrome includes one disabled Undo between Randomize and Reset, before history exists', () => {
  const { scope, groups } = fixture();
  scope.ParameterControls.prepare();
  const actions = groups[0].header.querySelector('.control-header-actions');
  expect(actions.children.map(button => button.textContent)).toEqual(['Randomize', 'Undo', 'Reset']);
  const undo = actions.children[1];
  expect(undo.disabled).toBe(true);
  expect(undo.dataset.randomizeUndo).toBe('circles');
  expect(undo.attributes['aria-label']).toBe('Undo last Circles randomization');
  expect(groups[1].header.querySelector('.control-header-actions')).toBeUndefined();
  scope.ParameterControls.prepare();
  expect(groups[0].header.querySelector('.control-header-actions')).toBe(actions);
  expect(actions.children).toHaveLength(3);
});

test('history wires the same early button without inserting chrome, and restores its availability and focus', () => {
  const { scope, document, groups } = fixture();
  scope.ParameterControls.prepare();
  const actions = groups[0].header.querySelector('.control-header-actions');
  const [randomize, undo] = actions.children;
  let current = { controls: { count: '8' }, runtime: { seed: 1 } };
  const announce = jest.fn();
  document.createElement.mockClear();
  const history = scope.RandomizeHistory.initialize({ snapshots: {
    capture: () => current, restoreLocal: value => { current = value; }, isRestoring: () => false
  }, announce });
  expect(document.createElement).not.toHaveBeenCalled();
  expect(actions.children[1]).toBe(undo);
  expect(undo.disabled).toBe(true);
  history.randomize('circles', () => { current = { controls: { count: '12' }, runtime: { seed: 2 } }; });
  expect(undo.disabled).toBe(false);
  undo.listeners.click();
  expect(current).toEqual({ controls: { count: '8' }, runtime: { seed: 1 } });
  expect(undo.disabled).toBe(true);
  expect(randomize.focus).toHaveBeenCalledWith({ preventScroll: true });
  expect(announce).toHaveBeenCalledWith('Previous variation restored.');
  expect(actions.children).toHaveLength(3);
});

test.each([1, 87])('startup feedback includes saved seed %i and ignores intermediate renderer defaults', seed => {
  const { scope, groups } = fixture();
  scope.GeneratorInitialState = { getInitialSeed: () => seed };
  const field = { type: 'range', value: '75', defaultValue: '50' };
  groups[0].querySelectorAll = () => [field];
  scope.ParameterControls.prepare();
  const reset = groups[0].header.querySelector('.control-header-actions').children[2];
  const summary = groups[0].summary;
  const expected = `${seed === 1 ? 1 : 2} changed from defaults`;
  expect(summary.textContent).toBe(expected);
  expect(reset.disabled).toBe(false);
  // setup applies legacy query defaults before the complete shared snapshot.
  field.value = '50';
  scope.ParameterControls.refresh();
  scope.ParameterControls.refreshStyle('circles');
  scope.ParameterControls.prepare();
  expect(summary.textContent).toBe(expected);
  expect(reset.disabled).toBe(false);
  field.value = '75';
  let runtimeSeed = seed;
  scope.ParameterControls.bindActions({ isDefaultSeed: () => runtimeSeed === 1 });
  expect(summary.textContent).toBe(expected);
  // Real edits and same-page restoration stay live once setup is complete.
  field.value = '50'; runtimeSeed = 1;
  scope.ParameterControls.refresh();
  expect(summary.textContent).toBe('Default settings');
  expect(reset.disabled).toBe(true);
  field.value = '60';
  scope.ParameterControls.refreshStyle('circles');
  expect(summary.textContent).toBe('1 changed from defaults');
  expect(reset.disabled).toBe(false);
});

test('plain default startup stays pristine through setup and enables feedback for queued actions', () => {
  const { scope, groups } = fixture();
  const field = { type: 'range', value: '50', defaultValue: '50' };
  groups[0].querySelectorAll = () => [field];
  scope.ParameterControls.prepare();
  expect(groups[0].summary.textContent).toBe('Default settings');
  const randomize = groups[0].header.querySelector('.control-header-actions').children[0];
  randomize.listeners.click({ preventDefault() {} });
  scope.ParameterControls.bindActions({ randomize() { field.value = '75'; scope.ParameterControls.refresh(); } });
  expect(groups[0].summary.textContent).toBe('1 changed from defaults');
});
