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
  const document = { createElement: () => node(),
    querySelectorAll: selector => selector === '[data-parameter-actions]' ? [group] : [],
    querySelector: selector => selector.startsWith('[data-parameter-actions=') ? group : null };
  const scope = {};
  vm.runInNewContext(source, { window: scope, document });
  scope.ParameterControls.prepare(document);
  return { button: header.children[1].children[0], api: scope.ParameterControls };
}
// Derive the full set from the real controller rather than a hand-maintained list.
const capabilities = fixture('ticker').api;
const styles = Object.keys(capabilities.capabilities).filter(style => capabilities.supportsActions(style));
test.each(styles)('%s Randomize uses a decorative outlined die with its accessible action label', style => {
  const { button } = fixture(style);
  expect(button.type).toBe('button');
  expect(button.attrs['aria-label']).toBe(`Randomize ${style} parameters`);
  expect(button.children[1].textContent).toBe('Randomize');
  const glyph = button.children[0];
  expect(glyph.attrs['aria-hidden']).toBe('true');
  expect(glyph.innerHTML).toContain('data-control-icon="dice"');
  expect(glyph.innerHTML).toContain('class="parameter_action-icon"');
  expect(glyph.innerHTML).toContain('stroke="currentColor" stroke-width="2"');
  expect(glyph.innerHTML).toContain('aria-hidden="true" focusable="false"');
  expect(glyph.innerHTML).toContain('<rect x="3" y="3" width="18" height="18" rx="2"/>');
  expect((glyph.innerHTML.match(/<circle /g) || []).length).toBe(5);
  expect(glyph.innerHTML).not.toMatch(/polyline|rotate-ccw|shuffle/);
});
