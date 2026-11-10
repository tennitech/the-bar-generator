const fs = require('node:fs');
const { disclosure, help, prepare } = require('../js/utils/sidebarSections');

function element(text = '') {
  const listeners = {}, attrs = {};
  return { textContent: text, dataset: {}, children: [], hidden: false, listeners, attrs,
    addEventListener: (name, callback) => { listeners[name] = callback; },
    setAttribute: (name, value) => { attrs[name] = value; },
    appendChild(node) { this.children.push(node); },
    contains(node) { return node === this; }, dispatchEvent: jest.fn() };
}

test('section disclosure keeps values, actions and nodes mounted, with state and a scroll-cue signal', () => {
  const header = element('PARAMETERS'), label = element('PARAMETERS');
  const input = { value: '1.037' }, field = { nodeType: 1, matches: () => false, input },
    motion = { nodeType: 1, matches: () => true };
  field.nextSibling = motion; header.nextSibling = field;
  const group = { id: 'waveform-group', querySelectorAll: () => [header] };
  header.closest = () => group;
  header.querySelector = selector => selector === '.control-header-label' ? label : header.button;
  label.replaceWith = button => { header.button = button; };
  header.after = body => { header.body = body; };
  const doc = { createElement: () => element() };
  disclosure(header, doc);
  expect(header.body.children).toEqual([field]);
  expect(header.button.attrs).toMatchObject({ 'aria-expanded': 'true', 'aria-controls': header.body.id });
  expect(header.button.attrs['aria-label']).toBe('Parameters section');
  doc.activeElement = input;
  header.body.contains = node => node === input;
  header.button.focus = jest.fn(() => { doc.activeElement = header.button; });
  header.button.listeners.click();
  expect(header.button.focus).toHaveBeenCalledWith({ preventScroll: true });
  expect(doc.activeElement).toBe(header.button);
  expect(header.body.hidden).toBe(true);
  expect(header.button.attrs['aria-expanded']).toBe('false');
  expect(header.button.dispatchEvent).toHaveBeenCalledWith(expect.objectContaining({ type: 'change', bubbles: true }));
  input.value = '1.041';
  header.button.listeners.click();
  expect(header.body.hidden).toBe(false);
  expect(input.value).toBe('1.041');
  const body = header.body;
  disclosure(header, doc);
  expect(header.body).toBe(body);
});

test('help opens on focus or touch click, dismisses with Escape, outside press, second click or blur', () => {
  const button = element(), tooltip = element(), doc = element();
  help(button, tooltip, doc);
  button.listeners.focus();
  expect(tooltip.hidden).toBe(false);
  expect(button.attrs['aria-expanded']).toBe('true');
  doc.listeners.keydown({ key: 'Escape' }); expect(tooltip.hidden).toBe(true);
  button.listeners.click(); expect(tooltip.hidden).toBe(false);
  button.listeners.click(); expect(tooltip.hidden).toBe(true);
  button.listeners.click(); doc.listeners.pointerdown({ target: {} }); expect(tooltip.hidden).toBe(true);
  button.listeners.focus(); button.listeners.blur(); expect(tooltip.hidden).toBe(true);
});

test('preparation stays within control groups, leaving the separate About footer alone', () => {
  const root = { querySelectorAll: jest.fn(() => []) };
  prepare(root);
  expect(root.querySelectorAll.mock.calls.map(([selector]) => selector))
    .toEqual(['.control-group .control-header', '[data-control-help]']);
});

test('LFO is above Motion and Preview with independent physical Hz and folding controls', () => {
  const html = fs.readFileSync(require.resolve('../generator/index.html'), 'utf8');
  const waveform = html.slice(html.indexOf('id="waveform-group"'), html.indexOf('id="circles-group"'));
  expect(waveform.indexOf('class="control waveform_lfo"')).toBeLessThan(waveform.indexOf('motion_section'));
  expect(waveform.indexOf('class="control waveform_lfo"')).toBeLessThan(waveform.indexOf('audio_section'));
  expect(waveform).toMatch(/id="waveform-lfo-hint"[^>]*role="tooltip" hidden/);
  expect(waveform).toContain('data-control-help="waveform-lfo-hint"');
  expect(waveform).toMatch(/id="waveform-lfo-rate"[^>]*min="0.07" max="1300" step="0.01"/);
  expect(waveform).toMatch(/id="waveform-lfo-type"[^>]*step="0.01"/);
});
