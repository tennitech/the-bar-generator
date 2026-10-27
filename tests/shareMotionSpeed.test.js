const { normalizeState } = require('../js/utils/shareState');
const previous = global.loopingGifUtils;
afterEach(() => { if (previous === undefined) delete global.loopingGifUtils; else global.loopingGifUtils = previous; });
const manifest = { 'ruler-speed-slider': {type:'range',min:0.2,max:0.6,step:0.1},
  'ticker-speed-slider': {type:'range',min:0.2,max:0.8,step:0.1},
  'waveform-speed-slider': {type:'range',min:0.2,max:1,step:0.1},
  'quantum-speed-slider': {type:'range',min:0.2,max:1,step:0.1},
  'custom-text': {type:'text',maxLength:100} };
test('delegates legacy speed migration to policy owner before strict native validation', () => {
  const controls = {'ruler-speed-slider':'5','ticker-speed-slider':'999','waveform-speed-slider':'0.35','quantum-speed-slider':'0.8','custom-text':'My study α'};
  const normalizeMotionSpeedControls = jest.fn(input => ({...input,'ruler-speed-slider':'0.6','ticker-speed-slider':'0.8','waveform-speed-slider':'0.4'}));
  global.loopingGifUtils = {normalizeMotionSpeedControls};
  const result = normalizeState({v:1,controls}, manifest);
  expect(normalizeMotionSpeedControls).toHaveBeenCalledWith(controls);
  expect(result.controls).toEqual({...controls,'ruler-speed-slider':'0.6','ticker-speed-slider':'0.8','waveform-speed-slider':'0.4'});
  expect(controls['ruler-speed-slider']).toBe('5');
});
test('guarded fallback remains strict when policy helper is not integrated', () => {
  delete global.loopingGifUtils;
  expect(() => normalizeState({v:1,controls:{'ruler-speed-slider':'5'}},manifest)).toThrow(/out-of-range/);
});
test('speed adapter does not bypass validation of unrelated controls or change quantum rates', () => {
  global.loopingGifUtils = {normalizeMotionSpeedControls: input => ({...input,'ruler-speed-slider':'0.6'})};
  expect(() => normalizeState({v:1,controls:{'ruler-speed-slider':'5','quantum-speed-slider':'2'}},manifest)).toThrow(/out-of-range/);
  expect(() => normalizeState({v:1,controls:{'custom-text':'x'.repeat(101)}},manifest)).toThrow(/too long/);
});
