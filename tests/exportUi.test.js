const fs = require('node:fs');
const vm = require('node:vm');

function fixture(clipboard) {
  const document = { readyState: 'complete', addEventListener() {}, activeElement: null };
  const ids = ['save-menu', 'save-button', 'save-png', 'save-svg', 'save-loop-gif', 'export-size-select', 'export-size-large', 'export-size-standard',
    'export-progress', 'export-message', 'export-meter', 'export-cancel', 'copy-png', 'copy-svg',
    'export-track', 'export-fill', 'export-percent', 'export-detail'];
  const elements = Object.fromEntries(ids.map(id => [id, {
    id, textContent: '', value: 0, listeners: {}, style: {}, attributes: {},
    addEventListener(type, callback) { this.listeners[type] = callback; },
    set disabled(value) {
      this.isDisabled = value;
      if (value && document.activeElement === this) document.activeElement = null;
    },
    get disabled() { return this.isDisabled; },
    focus() { document.activeElement = this; },
    setAttribute(name, value) { this.attributes[name] = value; }, removeAttribute(name) { delete this.attributes[name]; }, classList: { add() {}, contains: () => false },
    set hidden(value) {
      this.isHidden = value;
      if (value && document.activeElement === this) document.activeElement = null;
    }
  }]));
  elements['save-menu'].contains = element => element && !['save-menu', 'save-button'].includes(element.id);
  document.getElementById = id => elements[id];
  const context = { document, AbortController, performance, logoClipboard: clipboard, hideSaveMenu: jest.fn() };
  vm.runInNewContext(fs.readFileSync(require.resolve('../js/utils/exportUi'), 'utf8'), context);
  return { ui: context.logoExportUI, elements, document, hideSaveMenu: context.hideSaveMenu };
}

test.each(['error', 'started', 'cancelled'])('finishing %s restores focus even when hiding Cancel blurs it', outcome => {
  const { ui, elements, document } = fixture();
  elements['save-loop-gif'].focus();
  const job = ui.begin('gif');
  expect(document.activeElement.id).toBe('export-cancel');
  ui.finish(job, outcome, 'Result');
  expect(document.activeElement.id).toBe(outcome === 'error' ? 'save-loop-gif' : outcome === 'cancelled' ? 'save-button' : 'export-message');
  expect(elements['save-loop-gif'].disabled).toBe(false);
  expect(elements['export-meter'].value).toBe(outcome === 'started' ? 1 : 0);
  expect(ui.isBusy()).toBe(false);
});

test.each(['save-button', 'save-menu'])('Escape dismisses the visible export dialog from %s and restores trigger focus', target => {
  const { elements, document, hideSaveMenu } = fixture();
  const event = { key: 'Escape', preventDefault: jest.fn(), stopPropagation: jest.fn() };
  elements[target].listeners.keydown(event);
  expect(hideSaveMenu).toHaveBeenCalledTimes(1);
  expect(event.preventDefault).toHaveBeenCalled();
  expect(document.activeElement.id).toBe('save-button');
  elements['save-menu'].classList.contains = () => true;
  elements[target].listeners.keydown(event);
  expect(hideSaveMenu).toHaveBeenCalledTimes(1);
});

test('Cancel activation retains focus while abort propagates and ignores repeated activation', () => {
  const { ui, elements, document } = fixture();
  elements['save-loop-gif'].focus();
  const job = ui.begin('gif');
  elements['export-cancel'].listeners.click();
  expect(job.controller.signal.aborted).toBe(true);
  expect(document.activeElement.id).toBe('export-cancel');
  elements['export-cancel'].listeners.click();
  ui.finish(job, 'cancelled', 'Export cancelled.');
  expect(document.activeElement.id).toBe('save-button');
});


test('pointer Cancel restores the trigger when native activation does not focus buttons', () => {
  const { ui, elements, document } = fixture();
  const job = ui.begin('gif');
  document.activeElement = null;
  elements['export-cancel'].listeners.click();
  expect(document.activeElement.id).toBe('export-cancel');
  ui.finish(job, 'cancelled', 'Export cancelled.');
  expect(document.activeElement.id).toBe('save-button');
});


test('copies exclude concurrent downloads and restore the actual retry control', () => {
  const { ui, elements, document } = fixture();
  elements['copy-png'].focus();
  const job = ui.begin('png'); job.triggerId = 'copy-png';
  expect(elements['save-svg'].disabled).toBe(true);
  expect(elements['copy-svg'].disabled).toBe(true);
  expect(ui.begin('svg')).toBe(null);
  ui.finish(job, 'error', 'Copy was blocked.');
  expect(document.activeElement.id).toBe('copy-png');
  expect(elements['copy-svg'].disabled).toBe(false);
  expect(elements['save-png'].disabled).toBe(false);
});


test('completion preserves unsupported copy state and focuses an enabled recovery control', () => {
  let elements;
  const clipboard = { sync: jest.fn(() => { if (elements) elements['copy-svg'].disabled = true; }) };
  const state = fixture(clipboard); elements = state.elements;
  elements['copy-svg'].focus();
  const job = state.ui.begin('svg'); job.triggerId = 'copy-svg';
  state.ui.finish(job, 'error', 'SVG copy unavailable');
  expect(clipboard.sync).toHaveBeenCalled();
  expect(elements['copy-svg'].disabled).toBe(true);
  expect(elements['save-svg'].disabled).toBe(false);
  expect(state.document.activeElement.id).toBe('save-button');
});

test('an embedded download request keeps recovery visible without claiming download completion', () => {
  const { ui, elements, document, hideSaveMenu } = fixture();
  elements['save-svg'].focus();
  const job = ui.begin('svg');
  ui.finish(job, 'requested', 'SVG download requested.');
  expect(hideSaveMenu).not.toHaveBeenCalled();
  expect(document.activeElement.id).toBe('export-message');
  expect(elements['save-svg'].disabled).toBe(false);
  expect(ui.isBusy()).toBe(false);
});


test('Large is the default without a valid selector value', () => {
  const { ui, elements } = fixture();
  expect(ui.size()).toBe('large');
  elements['export-size-select'].value = 'standard';
  expect(ui.size()).toBe('standard');
});

test('progress follows actual frames and ignores stale or aborted jobs', () => {
  const { ui, elements } = fixture();
  const job = ui.begin('gif');
  ui.report(job, { prepared: 10, encoded: 4, total: 20 });
  expect(elements['export-meter'].value).toBe(0.35);
  expect(elements['export-percent'].textContent).toBe('35%');
  expect(elements['export-detail'].textContent).toBe('10/20 frames rendered · 4/20 encoded');
  ui.report({ ...job }, { prepared: 20, encoded: 20, total: 20 });
  expect(elements['export-meter'].value).toBe(0.35);
  job.controller.abort();
  ui.report(job, { prepared: 20, encoded: 20, total: 20 });
  expect(elements['export-meter'].value).toBe(0.35);
});

test('a completed copy keeps its frozen dimensions and byte size visible', () => {
  const { ui, elements, hideSaveMenu } = fixture();
  const job = ui.begin('png');
  ui.describe(job, { dimensions: { width: 2320, height: 1524 } });
  ui.ready(job, { size: 123456 });
  elements['export-size-select'].value = 'standard';
  ui.finish(job, 'copied', 'PNG copied.');
  expect(elements['export-detail'].textContent).toBe('2320 × 1524 px · 123 KB · Ready to paste.');
  expect(elements['export-meter'].value).toBe(1);
  expect(hideSaveMenu).not.toHaveBeenCalled();
});

test('a duplicate request leaves the active operation and its message intact', () => {
  const { ui, elements } = fixture();
  const job = ui.begin('png');
  ui.message(job, 'Encoding PNG…');
  expect(ui.begin('svg')).toBe(null);
  expect(elements['export-message'].textContent).toBe('Encoding PNG…');
});

test('finishing after dismissal does not steal focus or reopen the menu', () => {
  const { ui, elements, document, hideSaveMenu } = fixture();
  const job = ui.begin('png');
  elements['save-button'].focus();
  ui.finish(job, 'requested', 'PNG download requested.');
  expect(document.activeElement.id).toBe('save-button');
  expect(hideSaveMenu).not.toHaveBeenCalled();
});


test('custom size choices synchronize the export size and lock during export', () => {
  const { ui, elements } = fixture();
  elements['export-size-standard'].listeners.change({ target: { checked: true } });
  expect(ui.size()).toBe('standard');
  expect(elements['export-size-standard'].checked).toBe(true);
  expect(elements['export-size-large'].checked).toBe(false);
  const job = ui.begin('png');
  expect(elements['export-size-standard'].disabled).toBe(true);
  expect(elements['export-size-large'].disabled).toBe(true);
  elements['export-size-large'].listeners.change({ target: { checked: true } });
  expect(ui.size()).toBe('standard');
  ui.finish(job, 'error', 'Try again.');
  expect(elements['export-size-standard'].disabled).toBe(false);
  elements['export-size-large'].listeners.change({ target: { checked: true } });
  expect(ui.size()).toBe('large');
});
