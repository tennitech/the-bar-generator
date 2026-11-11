const fs = require('node:fs');
const path = require('node:path');
const read = name => fs.readFileSync(path.join(__dirname, '..', name), 'utf8');
const html = read('generator/index.html');
const css = read('css/style.css');
const rule = selector => {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const match = css.match(new RegExp(`^${escaped} \\{([^}]+)\\}`, 'm'));
  if (!match) throw new Error(`Missing rule: ${selector}`);
  return match[1];
};
const choices = [...html.matchAll(/<label class="([^"]*export_choice[^"]*)">([\s\S]*?)<\/label>/g)];

test('all four export choices share native radios and one visual-state class', () => {
  expect(choices).toHaveLength(4);
  expect(choices.map(([, , body]) => body.match(/id="([^"]+)"/)[1])).toEqual([
    'export-composition-logo', 'export-composition-bar', 'export-size-large', 'export-size-standard'
  ]);
  for (const [, , body] of choices) {
    expect(body).toMatch(/<input [^>]*type="radio" name="export-(composition|size)"/);
    expect(body).not.toMatch(/tabindex=|role="(button|radio)"|aria-checked=/);
  }
});

test('bold-footprint copies are inaccessible and exactly match the visible labels', () => {
  const labels = [];
  for (const [, , body] of choices) {
    const visible = body.match(/<span class="export_choice-text">([^<]+)<\/span>/)[1];
    const reserve = body.match(/<span class="export_choice-reserve" aria-hidden="true">([^<]+)<\/span>/)[1];
    expect(reserve).toBe(visible);
    labels.push(visible);
  }
  expect(labels).toEqual(['Bar + RPI', 'Bar only', 'High resolution', 'Smaller file']);
  expect(rule('.export_choice-label > span')).toContain('grid-area: 1 / 1');
  expect(rule('.export_choice-reserve')).toContain('visibility: hidden');
  expect(rule('.export_choice-reserve')).toContain('font-weight: 700');
  expect(rule('.export_choice:has(input:checked) .export_choice-text')).toContain('font-weight: 700');
});

test('selection cannot change box dimensions or replace the shared menu selection colors', () => {
  const selected = rule('.export_choice:has(input:checked)');
  expect(selected).toContain('background: var(--menu-option-selected-bg)');
  expect(selected).toContain('color: var(--menu-option-selected-text)');
  expect(selected).not.toMatch(/border-width|padding|margin|box-shadow|font-size|transform/);
  expect(rule('.export_choice')).toContain('border: 1px solid var(--control-border)');
  expect(rule('.export_choice:has(input:checked):hover')).toContain('background: var(--menu-option-selected-bg)');
});

test('radio glyphs and outside focus rings share the same rules across choice types and actions', () => {
  expect(rule('.export_choice input')).toMatch(/width: 1rem; height: 1rem/);
  expect(rule('.export_choice input::before')).toContain('background: currentColor');
  expect(rule('.export_choice input:checked::before')).toContain('visibility: visible');
  const focus = rule('.export_choice:has(input:focus-visible), .export_menu :is(.save-option, .export_cancel):focus-visible');
  expect(focus).toContain('outline: 2px solid var(--text-primary)');
  expect(focus).toContain('outline-offset: 2px');
  expect(css).not.toMatch(/\.export_(composition|size)-option:has\(input:(?:checked|focus-visible)\)/);
  expect(css).toContain('.export_choice input { appearance: auto; accent-color: auto; }');
});

test('disabled controls cannot acquire enabled hover or pressed colors', () => {
  expect(css).toContain('.export_choice:not(:has(input:disabled)):hover');
  for (const selector of ['.export_menu .save-option', '.export_cancel']) {
    expect(rule(`${selector}:not(:disabled):hover`)).toContain('var(--control-surface-hover)');
    expect(rule(`${selector}:not(:disabled):active`)).toContain('var(--menu-option-selected-bg)');
  }
  expect(rule('.export_menu .save-option:disabled')).toContain('border-style: dashed');
});

function contrast(a, b) {
  const luminance = hex => hex.slice(1).match(/../g).map(value => parseInt(value, 16) / 255)
    .map(value => value <= .04045 ? value / 12.92 : ((value + .055) / 1.055) ** 2.4)
    .reduce((sum, value, index) => sum + value * [.2126, .7152, .0722][index], 0);
  const [x, y] = [luminance(a), luminance(b)];
  return (Math.max(x, y) + .05) / (Math.min(x, y) + .05);
}

test('selected text and radio retain WCAG contrast in every export theme', () => {
  const red = css.match(/--rpi-red:\s*(#[\da-f]+)/i)[1];
  const states = [...css.matchAll(/--menu-option-selected-bg:\s*([^;]+);\s*--menu-option-selected-text:\s*([^;]+);/g)];
  expect(states.length).toBeGreaterThanOrEqual(3);
  for (const [, bg, fg] of states) expect(contrast(bg.trim() === 'var(--rpi-red)' ? red : bg.trim(), fg.trim())).toBeGreaterThanOrEqual(4.5);
});
