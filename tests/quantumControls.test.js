const fs = require('node:fs');
const vm = require('node:vm');
const model = require('../js/utils/quantumModel');

function harness(search = '', reduced = false) {
  const target = (value = '') => ({ value, checked: false, style: {}, listeners: {},
    addEventListener(type, listener) { (this.listeners[type] ||= []).push(listener); },
    emit(type, event = {}) { for (const listener of this.listeners[type] || []) listener(event); },
    setAttribute() {} });
  const elements = Object.fromEntries(['quantum-group', 'quantum-phase', 'quantum-phase-display',
    'quantum-speed-slider', 'quantum-speed-display', 'quantum-motion-toggle', 'quantum-reverse-toggle',
    'style-select'].map(id => [id, target()]));
  elements['style-select'].value = 'wave-quantum';
  const media = target(), document = target();
  media.matches = reduced;
  document.getElementById = id => elements[id];
  const editors = [];
  const window = Object.assign(target(), { quantumModel: model, location: { search },
    matchMedia: () => media, registerSliderValueEditor: config => editors.push(config),
    ParameterControls: { refreshStyle: jest.fn() },
    updateUrlParameters: jest.fn(), requestUpdate: jest.fn(), parseSliderNumericInput: Number });
  vm.runInNewContext(fs.readFileSync(require.resolve('../js/utils/quantumControls'), 'utf8'), { window, document, URLSearchParams });
  window.quantumControls.setup();
  return { window, elements, media, document, controls: window.quantumControls,
    editor: editors.find(editor => editor.slider === elements['quantum-phase']),
    seek(value) { elements['quantum-phase'].value = value; elements['quantum-phase'].emit('input'); },
    loop(value) { elements['quantum-motion-toggle'].checked = value; elements['quantum-motion-toggle'].emit('change'); },
    phase: () => window.quantumControls.values().quantumPhase };
}

test('repeated phase seeks retain LOOP and advance from the new phase without stale elapsed time', () => {
  const h = harness(); h.loop(true); h.controls.tick(0);
  for (const [index, phase] of [.17, .37, .62].entries()) {
    h.seek(phase);
    expect(h.elements['quantum-motion-toggle'].checked).toBe(true);
    h.controls.tick(1000 + index * 1000);
    expect(h.phase()).toBeCloseTo(phase, 12);
    h.controls.tick(1020 + index * 1000);
    expect(h.phase()).toBeCloseTo(phase + .02 / 120, 12);
  }
  expect(h.window.updateUrlParameters).toHaveBeenCalledTimes(4);
  expect(h.window.requestUpdate).toHaveBeenCalledTimes(4);
});

test('paused seeks stay paused; explicit resume retains speed and reverse', () => {
  const h = harness('?quantumSpeed=0.2&quantumReverse=true'); h.loop(false);
  h.seek(.371); h.controls.tick(1000); h.controls.tick(1050);
  expect(h.phase()).toBeCloseTo(.371, 12);
  expect(h.elements['quantum-motion-toggle'].checked).toBe(false);
  h.loop(true); h.controls.tick(2000); h.controls.tick(2050);
  expect(h.phase()).toBeCloseTo(.371 - .2 * .05 / 120, 12);
});

test.each(['pointerup', 'pointercancel'])('pointer seek holds phase and resumes without catch-up after %s', end => {
  const h = harness(); h.loop(true); h.controls.tick(0);
  h.elements['quantum-phase'].emit('pointerdown', { pointerId: 7 }); h.seek(.4);
  h.controls.tick(50); h.controls.tick(5000);
  expect(h.phase()).toBeCloseTo(.4, 12);
  expect(h.elements['quantum-motion-toggle'].checked).toBe(true);
  h.window.emit(end, { pointerId: 7 }); h.controls.tick(6000); h.controls.tick(6020);
  expect(h.phase()).toBeCloseTo(.4 + .02 / 120, 12);
});

test.each([true, false])('numeric phase editor commit preserves loop=%s and cancel leaves transport intact', looping => {
  const h = harness(); h.loop(looping); h.controls.tick(0);
  h.editor.editorInput = {}; h.controls.tick(50); h.controls.tick(5000);
  expect(h.phase()).toBe(0);
  h.elements['quantum-phase'].value = h.editor.parseValue('37.1');
  h.editor.editorInput = null; h.editor.commit(); h.controls.tick(6000); h.controls.tick(6020);
  expect(h.phase()).toBeCloseTo(.371 + (looping ? .02 / 120 : 0), 12);
  h.editor.editorInput = {}; h.controls.tick(7000);
  h.editor.editorInput = null; h.controls.tick(8000);
  expect(h.elements['quantum-motion-toggle'].checked).toBe(looping);
});

test('fresh route loops and reduced-motion changes still pause an explicitly started loop', () => {
  const h = harness('?quantumPhase=0.371&quantumMotion=true');
  expect(h.phase()).toBeCloseTo(.371, 12);
  expect(h.elements['quantum-motion-toggle'].checked).toBe(true);
  h.loop(true); h.seek(.6); h.media.emit('change', { matches: true });
  h.controls.tick(10); h.controls.tick(50);
  expect(h.elements['quantum-motion-toggle'].checked).toBe(false);
  expect(h.phase()).toBeCloseTo(.6, 12);
});

test('running phase refreshes retain the chosen setting instead of counting automatic time as an edit', () => {
  const h = harness();
  h.loop(true); h.controls.tick(0);
  const writes = h.window.updateUrlParameters.mock.calls.length;
  h.window.ParameterControls.refreshStyle.mockClear();
  h.controls.tick(50);
  expect(h.phase()).toBeGreaterThan(0);
  expect(h.controls.settingPhase()).toBe(0);
  expect(h.window.ParameterControls.refreshStyle).toHaveBeenCalledWith('wave-quantum');
  expect(h.window.updateUrlParameters).toHaveBeenCalledTimes(writes);
  h.seek(0);
  expect(h.elements['quantum-motion-toggle'].checked).toBe(true);
  expect(h.phase()).toBe(0);
  expect(h.window.ParameterControls.refreshStyle.mock.calls).toEqual([['wave-quantum'], ['wave-quantum']]);
});


test.each([false, true])('menu selection defaults LOOP while respecting reduced motion=%s', reduced => {
  const h = harness('', reduced);
  expect(h.elements['quantum-motion-toggle'].checked).toBe(!reduced);
  h.loop(false);
  h.elements['style-select'].value = 'solid'; h.elements['style-select'].emit('change');
  h.elements['style-select'].value = 'wave-quantum'; h.elements['style-select'].emit('change');
  expect(h.elements['quantum-motion-toggle'].checked).toBe(!reduced);
  h.controls.pause();
  expect(h.elements['quantum-motion-toggle'].checked).toBe(false);
});

 test('disabling Loop returns Quantum to phase zero without resetting other controls', () => {
 const h = harness('?quantumSpeed=.2&quantumReverse=true');
 h.seek(.6); h.loop(false); expect(h.phase()).toBe(0);
 expect(h.elements['quantum-speed-slider'].value).toBe(.2);
 expect(h.elements['quantum-reverse-toggle'].checked).toBe(true);
 h.controls.tick(0); h.controls.tick(50); expect(h.phase()).toBe(0);
 });


test('phase feedback follows saved state, explicit seeks and reset without following automatic ticks', () => {
  const h = harness('?quantumPhase=.4');
  h.controls.tick(0); h.controls.tick(50);
  expect(h.controls.settingPhase()).toBeCloseTo(.4, 12);
  h.seek(.2); h.controls.tick(100); h.controls.tick(150);
  expect(h.controls.settingPhase()).toBeCloseTo(.2, 12);
  // A same-page saved snapshot writes the field before syncing controls.
  h.elements['quantum-phase'].value = .6;
  h.controls.sync();
  expect(h.controls.settingPhase()).toBeCloseTo(.6, 12);
  h.controls.tick(200); h.controls.tick(250);
  expect(h.controls.settingPhase()).toBeCloseTo(.6, 12);
  h.loop(false);
  expect(h.controls.settingPhase()).toBe(0);
});


test('restoring the current animated phase still records it as an intentional saved setting', () => {
  const h = harness();
  h.controls.tick(0); h.controls.tick(50);
  expect(h.controls.settingPhase()).toBe(0);
  const snapshotPhase = h.phase();
  h.controls.restoreSettingPhase();
  h.controls.pause();
  expect(h.controls.settingPhase()).toBe(snapshotPhase);
});
