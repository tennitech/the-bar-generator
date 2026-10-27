const fs = require('node:fs');
const vm = require('node:vm');

function fixture() {
  const document = { readyState: 'complete', addEventListener() {}, activeElement: null };
  const ids = ['save-menu', 'save-button', 'save-png', 'save-svg', 'save-loop-gif', 'export-size-select',
    'export-progress', 'export-message', 'export-meter', 'export-cancel', 'copy-png', 'copy-svg'];
  const elements = Object.fromEntries(ids.map(id => [id, {
    id, textContent: '', value: 0, listeners: {},
    addEventListener(type, callback) { this.listeners[type] = callback; },
    set disabled(value) {
      this.isDisabled = value;
      if (value && document.activeElement === this) document.activeElement = null;
    },
    get disabled() { return this.isDisabled; },
    focus() { document.activeElement = this; },
    setAttribute() {}, removeAttribute() {}, classList: { add() {} },
    set hidden(value) {
      this.isHidden = value;
      if (value && document.activeElement === this) document.activeElement = null;
    }
  }]));
  elements['save-menu'].contains = element => element && !['save-menu', 'save-button'].includes(element.id);
  document.getElementById = id => elements[id];
  const context = { document, AbortController, performance };
  vm.runInNewContext(fs.readFileSync(require.resolve('../js/utils/exportUi'), 'utf8'), context);
  return { ui: context.logoExportUI, elements, document };
}

test.each(['error', 'started', 'cancelled'])('finishing %s restores focus even when hiding Cancel blurs it', outcome => {
  const { ui, elements, document } = fixture();
  elements['save-loop-gif'].focus();
  const job = ui.begin('gif');
  expect(document.activeElement.id).toBe('export-cancel');
  ui.finish(job, outcome, 'Result');
  expect(document.activeElement.id).toBe(outcome === 'error' ? 'save-loop-gif' : 'save-button');
  expect(elements['save-loop-gif'].disabled).toBe(false);
  expect(elements['export-meter'].value).toBe(outcome === 'started' ? 1 : 0);
  expect(ui.isBusy()).toBe(false);
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
