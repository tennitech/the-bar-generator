const fs = require('node:fs');
const vm = require('node:vm');

function fixture(clipboard, nucleotide, withOptions = false) {
  const document = { readyState: 'complete', listeners: {}, addEventListener(type, callback) { (this.listeners[type] ||= []).push(callback); }, activeElement: null };
  const ids = ['save-menu', 'save-button', 'save-png', 'save-svg', 'save-loop-gif', 'export-size-select', 'export-size-large', 'export-size-standard',
    'export-progress', 'export-message', 'export-meter', 'export-cancel', 'copy-png', 'copy-svg',
    'export-composition-logo', 'export-composition-bar', 'export-composition-preview-logo', 'export-composition-preview-bar', 'export-dimensions', 'export-settings',
    'export-track', 'export-fill', 'export-percent', 'export-detail', 'export-blocked-note', 'export-input-note', 'style-select', 'color-mode-select', 'quantum-speed-slider'];
  const elements = Object.fromEntries(ids.map(id => [id, {
    id, textContent: '', value: 0, listeners: {}, style: {}, attributes: {},
    children: {}, querySelector(selector) { return this.children[selector] || (this.children[selector] = {}); },
    addEventListener(type, callback) { this.listeners[type] = callback; },
    set disabled(value) {
      this.isDisabled = value;
      if (value && document.activeElement === this) document.activeElement = null;
    },
    get disabled() { return this.isDisabled; },
    focus() { document.activeElement = this; }, contains: () => false,
    setAttribute(name, value) { this.attributes[name] = value; }, removeAttribute(name) { delete this.attributes[name]; }, classList: { add() {}, contains: () => false },
    set hidden(value) {
      this.isHidden = value;
      if (value && document.activeElement === this) document.activeElement = null;
    }, get hidden() { return this.isHidden; }
  }]));
  elements['export-blocked-note'].hidden = true;
  elements['save-menu'].contains = element => element && !['save-menu', 'save-button'].includes(element.id);
  document.getElementById = id => elements[id];
  const context = { document, AbortController, performance, logoClipboard: clipboard, NucleotidePattern: nucleotide, hideSaveMenu: jest.fn() };
  if (withOptions) Object.assign(context, { logoExportOptions: require('../js/utils/exportOptions'),
    RPI_LOGO_GEOMETRY: require('../js/utils/logoGeometry').RPI_LOGO_GEOMETRY });
  vm.runInNewContext(fs.readFileSync(require.resolve('../js/utils/exportUi'), 'utf8'), context);
  return { ui: context.logoExportUI, elements, document, context, hideSaveMenu: context.hideSaveMenu };
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


test('incomplete nucleotide blocks exports, then becomes ready without stale disabled state', () => {
  let reason = 'Add 1 base to export.';
  const {ui,elements}=fixture(null,{exportBlocker:()=>reason});
  expect(elements['save-svg'].disabled).toBe(true);
  expect(elements['save-button'].attributes['aria-disabled']).toBe('true');
  expect(ui.explainBlocked()).toBe(true);
  expect(elements['export-blocked-note'].hidden).toBe(false);
  elements['save-button'].listeners.keydown({key:'Escape',preventDefault(){},stopPropagation(){}});
  expect(elements['export-blocked-note'].hidden).toBe(true);
  expect(ui.begin('svg')).toBe(null);
  reason='';ui.sync();
  expect(elements['save-button'].attributes['aria-disabled']).toBe('false');
  expect(ui.explainBlocked()).toBe(false);
  expect(elements['save-svg'].disabled).toBe(false);
  const job=ui.begin('svg');expect(job).not.toBe(null);
  reason='Add 1 base to export.';ui.finish(job,'started','Done');
  expect(elements['save-svg'].disabled).toBe(true);
});


test('composition cards repeatedly switch, preserve size and survive menu/style synchronization', () => {
  const clipboard = { sync: jest.fn() };
  const { ui, elements } = fixture(clipboard, null, true);
  expect(ui.composition()).toBe('logo');
  expect(elements['export-composition-logo'].checked).toBe(true);
  expect(elements['export-composition-preview-logo'].innerHTML.match(/<path /g)).toHaveLength(4);
  expect(elements['export-composition-preview-bar'].innerHTML.match(/<path /g)).toHaveLength(1);
  for (let cycle = 0; cycle < 5; cycle++) for (const value of ['bar', 'logo']) {
    elements[`export-composition-${value}`].listeners.change({ target: { checked: true } });
    expect(ui.composition()).toBe(value);
    expect(elements[`export-composition-${value}`].checked).toBe(true);
    expect(elements[`export-composition-${value === 'bar' ? 'logo' : 'bar'}`].checked).toBe(false);
    expect(elements['export-dimensions'].textContent).toBe(value === 'bar' ? '2320 × 464 px' : '2320 × 1524 px');
    expect(elements['save-png'].attributes['aria-label']).toContain(value === 'bar' ? 'Bar only' : 'Bar + RPI');
    ui.sync(true); ui.sync(false);
    expect(ui.composition()).toBe(value);
  }
  elements['export-size-standard'].listeners.change({ target: { checked: true } });
  elements['export-composition-bar'].listeners.change({ target: { checked: true } });
  expect(elements['export-dimensions'].textContent).toBe('1160 × 232 px');
  expect(clipboard.sync).toHaveBeenCalled();
});

test.each(['error', 'cancelled', 'requested', 'copied'])('composition is locked during work and released after %s', outcome => {
  const { ui, elements } = fixture(null, null, true);
  elements['export-composition-bar'].listeners.change({ target: { checked: true } });
  const job = ui.begin('png');
  expect(elements['export-composition-bar'].disabled).toBe(true);
  expect(elements['export-composition-logo'].disabled).toBe(true);
  elements['export-composition-logo'].listeners.change({ target: { checked: true } });
  expect(ui.composition()).toBe('bar');
  ui.describe(job, { composition: 'bar', dimensions: { width: 2320, height: 464 } });
  expect(elements['export-detail'].textContent).toBe('Bar only · 2320 × 464 px · transparent background');
  ui.ready(job, { size: 100 });
  ui.finish(job, outcome, 'Result');
  expect(elements['export-composition-bar'].disabled).toBe(false);
  expect(elements['export-composition-bar'].checked).toBe(true);
  elements['export-composition-logo'].listeners.change({ target: { checked: true } });
  expect(ui.composition()).toBe('logo');
});


test('ring GIF discloses actual default resolution and updates with speed/composition without changing selectors', () => {
  const { ui, elements, context } = fixture(undefined, undefined, true);
  context.loopingGifUtils = require('../js/utils/loopingGif');
  elements['style-select'].value = 'wave-quantum';
  elements['quantum-speed-slider'].value = '1'; elements['export-size-select'].value = 'large';
  ui.sync();
  const action = elements['save-loop-gif'];
  expect(action.querySelector('.option-desc').textContent).toContain('4.3 s loop · up to 50 fps');
  expect(action.attributes['aria-label']).toContain('2320 × 1524 px');
  expect(elements['save-png'].attributes['aria-label']).toContain('2320 × 1524 px');
  expect(elements['export-size-select'].value).toBe('large');
  elements['export-composition-bar'].listeners.change({ target: { checked: true } });
  expect(action.attributes['aria-label']).toContain('Bar only');
  expect(action.attributes['aria-label']).toContain('2320 × 464 px');
  expect(action.querySelector('.option-desc').textContent).not.toContain('Standard');
  elements['quantum-speed-slider'].value = '.5'; elements['quantum-speed-slider'].listeners.input();
  expect(action.querySelector('.option-desc').textContent).toBe('8.6 s loop · up to 50 fps');
  expect(elements['quantum-speed-slider'].value).toBe('.5');
});


function completedGradient(f = fixture(undefined, undefined, true)) {
  f.elements['style-select'].value = 'gradient'; f.ui.sync();
  const job = f.ui.begin('gif');
  f.ui.describe(job, { family: 'gradient', composition: 'logo', dimensions: { width: 2320, height: 1524 } });
  f.ui.ready(job, { size: 5032238 });
  f.ui.finish(job, 'requested', 'GIF download requested.');
  expect(f.elements['export-detail'].textContent).toContain('5.0 MB');
  return f;
}

test('switching from exported Gradient to ring clears stale status/statistics without reopening or stealing focus', () => {
  const f = completedGradient();
  f.elements['style-select'].focus(); f.elements['style-select'].value = 'wave-quantum'; f.ui.sync();
  expect(f.elements['export-progress'].hidden).toBe(true);
  for (const id of ['export-message', 'export-detail', 'export-percent']) expect(f.elements[id].textContent).toBe('');
  expect(f.elements['export-meter'].value).toBe(0);
  expect(f.document.activeElement.id).toBe('style-select');
  expect(f.ui.isBusy()).toBe(false); expect(f.hideSaveMenu).not.toHaveBeenCalled();
});

test.each(['size', 'composition', 'theme', 'parameters', 'credits'])('changing %s clears a completed export result', change => {
  const f = completedGradient();
  if (change === 'size') f.elements['export-size-standard'].listeners.change({ target: { checked: true } });
  if (change === 'composition') f.elements['export-composition-bar'].listeners.change({ target: { checked: true } });
  if (change === 'theme') { f.elements['color-mode-select'].value = 'white'; f.ui.sync(); }
  if (change === 'credits') f.ui.sync(true);
  if (change === 'parameters') for (const callback of f.document.listeners.input) callback({ target: { closest: () => ({}) } });
  expect(f.elements['export-progress'].hidden).toBe(true);
  expect(f.elements['export-message'].textContent).toBe(''); expect(f.elements['export-detail'].textContent).toBe('');
});

test.each(['requested', 'cancelled'])('style changes preserve captured in-flight source and cancellation, then discard its late %s status', outcome => {
  const f = fixture(undefined, undefined, true); f.elements['style-select'].value = 'gradient'; f.ui.sync();
  const job = f.ui.begin('gif');
  f.ui.describe(job, { family: 'gradient', composition: 'logo', dimensions: { width: 2320, height: 1524 } });
  f.elements['style-select'].value = 'wave-quantum'; f.ui.sync();
  expect(f.ui.isBusy()).toBe(true); expect(f.elements['export-cancel'].hidden).toBe(false);
  expect(f.elements['export-message'].textContent).toContain('gradient GIF');
  f.ui.report(job, { prepared: 8, encoded: 8, total: 8 });
  expect(f.elements['export-detail'].textContent).toContain('gradient GIF');
  expect(job.dimensions).toBe('2320 × 1524 px');
  if (outcome === 'cancelled') { f.elements['export-cancel'].listeners.click(); expect(job.controller.signal.aborted).toBe(true); }
  else { expect(job.controller.signal.aborted).toBe(false); f.ui.ready(job, { size: 5032238 }); }
  f.ui.finish(job, outcome, 'Old operation finished.');
  expect(f.ui.isBusy()).toBe(false); expect(f.elements['export-progress'].hidden).toBe(true);
  expect(f.elements['export-detail'].textContent).toBe(''); expect(f.elements['export-message'].textContent).toBe('');
  expect(f.elements['save-loop-gif'].disabled).toBe(false);
});
