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

const html = fs.readFileSync(require.resolve('../generator/index.html'), 'utf8');
const sectionTitles = [...new Set(Array.from(html.matchAll(/<div class="control-header">([^<]+)<\/div>/g), match => match[1]))];
test.each(sectionTitles)('%s disclosure preserves mounted values, focus and accessible state in both directions', title => {
  const header = element(title), label = element(title);
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
  expect(header.button.attrs['aria-label']).toBe(`${title.charAt(0)}${title.slice(1).toLowerCase()} section`);
  expect(header.button.type).toBe('button');
  const icon = header.button.children[0];
  expect(icon.className).toBe('sidebar_section-icon');
  expect(icon.attrs['aria-hidden']).toBe('true');
  expect(icon.innerHTML).toContain('focusable="false"');
  expect(icon.innerHTML).toContain('stroke-width="1.5"');
  // The drawn chevron is centered at 12,12 within the 24-unit viewBox.
  expect(icon.innerHTML).toContain('points="9 6 15 12 9 18"');
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
  expect(header.button.attrs['aria-expanded']).toBe('true');
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

test('Waveform keeps carrier, scope, Motion and Audio without the retired modulation controls', () => {
  const waveform = html.slice(html.indexOf('id="waveform-group"'), html.indexOf('id="circles-group"'));
  expect(waveform).not.toMatch(/waveform[-_]lfo|LFO/);
  for(const id of ['waveform-type-slider','waveform-note-slider','waveform-scope-status','waveform-motion-toggle','waveform-reverse-toggle','waveform-speed-slider','waveform-audio-btn']) expect(waveform).toContain(`id="${id}"`);
});


test('speed range descriptions stay accessible without visible helper spacing in every dynamic style', () => {
  for (const style of ['ticker', 'quantum', 'waveform', 'gradient']) {
    expect(html).toMatch(new RegExp(`aria-describedby="${style}-speed-unit"`));
    expect(html).toMatch(new RegExp(`<p id="${style}-speed-unit" class="u-sr-only">0.2–4× default speed`));
  }
  const css = fs.readFileSync(require.resolve('../css/style.css'), 'utf8');
  expect(css).toMatch(/\.sidebar_section-toggle\s*\{[^}]*align-items: center/s);
  expect(css).toMatch(/\.sidebar_section-icon\s*\{[^}]*flex: 0 0 1rem;[^}]*transform: rotate\(90deg\)/s);
  expect(css).toMatch(/\.sidebar_section-toggle\[aria-expanded="false"\] \.sidebar_section-icon,\s*\.bar_information:not\(\[open\]\) > \.bar_information-toggle \.sidebar_section-icon\s*\{ transform: rotate\(0deg\)/);
  expect(css).not.toMatch(/\.sidebar_section-toggle(?:::after|\[aria-expanded="false"\]::after)/);
  // Orientation is immediate, with no new motion to override for reduced motion.
  const rule = css.match(/\.sidebar_section-icon\s*\{([^}]+)\}/)[1];
  expect(rule).not.toMatch(/transition|animation/);
});
