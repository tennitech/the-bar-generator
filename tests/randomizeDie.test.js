const fs = require('node:fs');
const vm = require('node:vm');
const source = fs.readFileSync(require.resolve('../js/utils/parameterControls'), 'utf8');
function node(textContent = '') {
  return { textContent, dataset: {}, attrs: {}, children: [], listeners: {},
    setAttribute(name, value) { this.attrs[name] = value; },
    addEventListener(name, callback) { this.listeners[name] = callback; },
    appendChild(child) { this.children.push(child); } };
}
function fixture(style) {
  const header = { textContent: 'PARAMETERS', querySelector: () => null,
    replaceChildren(...children) { this.children = children; }, after() {} };
  const group = { dataset: { parameterActions: style }, querySelector: () => header, querySelectorAll: () => [] };
  const document = { hidden: false, addEventListener: jest.fn(), createElement: () => node(),
    querySelectorAll: selector => selector === '[data-parameter-actions]' ? [group] : [],
    querySelector: selector => selector.startsWith('[data-parameter-actions=') ? group : null };
  const scope = { matchMedia: () => ({ matches: false, addEventListener: jest.fn() }), addEventListener: jest.fn() };
  vm.runInNewContext(source, { window: scope, document });
  scope.ParameterControls.prepare(document);
  return { button: header.children[1].children[0], api: scope.ParameterControls };
}
// Derive the full set from the real controller rather than a hand-maintained list.
const capabilities = fixture('ticker').api;
const styles = Object.keys(capabilities.capabilities).filter(style => capabilities.supportsActions(style));
test.each(styles)('%s Randomize uses the decorative reference-matched dice with its accessible action label', style => {
  const { button } = fixture(style);
  expect(button.type).toBe('button');
  expect(button.attrs['aria-label']).toBe(`Randomize ${style} parameters`);
  expect(button.children[1].textContent).toBe('Randomize');
  const glyph = button.children[0];
  expect(glyph.attrs['aria-hidden']).toBe('true');
  expect(glyph.innerHTML).toContain('data-control-icon="dice"');
  expect(glyph.innerHTML).toContain('class="parameter_action-icon"');
  expect(glyph.innerHTML).toContain('stroke="currentColor" stroke-width="1.5"');
  expect(glyph.innerHTML).toContain('aria-hidden="true" focusable="false"');
  // Two outlined faces read as dice, with three diagonal pips on the front.
  expect(glyph.innerHTML).toContain('data-die-face="back"');
  expect(glyph.innerHTML).toContain('data-die-face="front"');
  expect((glyph.innerHTML.match(/<circle /g) || []).length).toBe(6);
  expect(glyph.innerHTML).toContain('cx="5.5" cy="18.5" r="1.35"');
  expect(glyph.innerHTML).toContain('cx="8.5" cy="15.5" r="1.35"');
  expect(glyph.innerHTML).toContain('cx="11.5" cy="12.5" r="1.35"');
  expect(glyph.innerHTML).toContain('<rect x="2" y="9" width="13" height="13" rx="2"/>');
  expect(glyph.innerHTML).not.toMatch(/rotate-ccw|shuffle|<image|<mask|fill="(?:white|black|#)/);
});


test.each([0, 1])('native click activation (detail=%s) randomizes once and animates both faces without delaying the action', detail => {
  const { button, api } = fixture('ticker');
  const animate = () => jest.fn(() => ({ cancel: jest.fn(), finished: new Promise(() => {}) }));
  const back = { animate: animate() }, front = { animate: animate() };
  button.querySelector = selector => selector.includes('back') ? back : front;
  const randomize = jest.fn(); api.bindActions({ randomize });
  button.listeners.click({ detail, preventDefault() {} });
  expect(randomize).toHaveBeenCalledTimes(1); expect(randomize).toHaveBeenCalledWith('ticker');
  expect(back.animate).toHaveBeenCalledTimes(1); expect(front.animate).toHaveBeenCalledTimes(1);
  expect(randomize.mock.invocationCallOrder[0]).toBeLessThan(back.animate.mock.invocationCallOrder[0]);
  expect(button.attrs['aria-label']).toBe('Randomize ticker parameters');
});
