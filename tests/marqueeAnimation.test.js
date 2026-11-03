const { STYLES, createSettings, advancePhase, createGeometry } = require('../js/utils/marqueeAnimation');
const { entries } = require('../js/utils/marqueeCatalog');
const geometry = require('../js/utils/barPattern');
const looping = require('../js/utils/loopingGif');
const quantum = require('../js/utils/quantumModel');

test('only the three genuinely animated styles get motion settings', () => {
  expect(entries.filter(entry => createSettings(entry)).map(entry => entry.value)).toEqual(STYLES);
});
test.each(STYLES)('%s randomized controls stay in real generator ranges and preserve its sample', style => {
  const entry = entries.find(entry => entry.value === style).variants[1];
  const before = JSON.stringify(entry);
  for (const random of [() => 0, () => 0.37, () => 0.999999]) {
    const settings = createSettings(entry, random);
    const prefix = style === 'wave-quantum' ? 'quantum' : style;
    const speed = Number(settings.values[`${prefix}Speed`]);
    expect(style === 'wave-quantum' ? quantum.normalizeSpeed(speed) : looping.normalizeLoopSpeed(style, speed)).toBe(speed);
    expect(Number.isInteger(Math.round(speed * 10))).toBe(true);
    expect(settings.values[`${prefix}Reverse`]).toBe('false');
    for (const [key, value] of new URLSearchParams(entry.query)) expect(settings.values[key]).toBe(value);
    expect(settings.phase).toBeGreaterThanOrEqual(0); expect(settings.phase).toBeLessThan(1);
  }
  expect(createSettings(entry, () => 0).query).not.toBe(createSettings(entry, () => 0.999999).query);
  expect(JSON.stringify(entry)).toBe(before);
});
test.each(STYLES)('%s transport uses the same speed and reverse behavior as the generator', style => {
  const entry = entries.find(entry => entry.value === style);
  for (const random of [() => 0, () => 0.999999]) {
    const state = createSettings(entry, random);
    state.values[`${state.prefix}Reverse`] = String(random() < 0.5);
    for (const deltaMs of [0, 8.33, 16.67, 33.33, 1000]) {
      const expected = style === 'wave-quantum'
        ? quantum.advancePhase(state.phase, deltaMs, { speed: state.values.quantumSpeed, reverse: state.values.quantumReverse === 'true' })
        : looping.advanceLiveLoopPhase(state.phase, style, state.values, deltaMs);
      expect(advancePhase(state, deltaMs)).toBe(expected);
    }
  }
});
test.each(STYLES)('%s geometry exactly preserve canonical geometry across configurations and phases', style => {
  for (const entry of entries.find(entry => entry.value === style).variants) {
    for (const phase of [0, 0.125, 0.5, 0.9999]) {
      const state = { ...createSettings(entry, () => 0.37), phase };
      const options = { ...state.values, barStartX: 0, barY: 0, exactBarWidth: 250, barHeight: 18 };
      let expected;
      if (style === 'wave-quantum') expected = { polygons: geometry.createWaveQuantumPatternGeometry({ ...options, quantumPhase: phase }).polygons };
      else {
        Object.assign(options, looping.getLoopingAnimationState(style, state.values, { phase }));
        if (style === 'waveform') expected = { polygons: [geometry.createWaveformPatternGeometry(options).polygon] };
        else {
          const rects = geometry.createTickerPatternGeometry(options).rects;
          expected = { rects };
        }
      }
      expect(createGeometry(state)).toEqual(expected);
      expect(JSON.stringify(createGeometry(state))).not.toMatch(/NaN|undefined|null/);
    }
  }
});

test('raster surfaces preserve exact aspect ratio with a bounded DPR budget', () => {
  const { rasterWidth } = require('../js/utils/marqueeAnimation');
  for (const cssWidth of [0, 448, 1000, 2000, 10000]) for (const dpr of [1, 1.25, 2, 4]) {
    const width = rasterWidth(cssWidth, dpr);
    expect(width).toBeGreaterThanOrEqual(500); expect(width).toBeLessThanOrEqual(2000);
    expect(Number.isInteger(width * 18 / 250)).toBe(true);
    expect(width % 125).toBe(0);
  }
});

test('throttling consumes elapsed time once and keeps dense tick patterns below a quarter tick per painted frame', () => {
  const { consumeFrameTime } = require('../js/utils/marqueeAnimation');
  for (const hz of [30, 60, 120, 144]) {
    const clock = {elapsed:0,remainder:0}; let updates=0, elapsed=0;
    const state = createSettings(entries.find(entry=>entry.value==='ticker'));
    state.values = {tickerRepeats:40,tickerRatio:5,tickerSpeed:0.8,tickerReverse:false}; state.phase=0;
    for(let i=0;i<hz;i++) {
      const step=consumeFrameTime(clock,1000/hz);
      if (!step) continue;
      elapsed+=step; updates++;
      const next=advancePhase(state,step);
      const wrapped=((next-state.phase)%1+1)%1;
      const distance=Math.min(wrapped,1-wrapped);
      expect(distance).toBeLessThanOrEqual(0.25/5+1e-10); state.phase=next;
    }
    expect(updates).toBe(30); expect(elapsed+clock.elapsed).toBeCloseTo(1000,7);
  }
});

test('Ruler always stays a genuine static sample without motion query settings', () => {
  for (const entry of entries.find(entry => entry.value === 'ruler').variants) expect(createSettings(entry)).toBeNull();
});

test('marquee defaults use the generator left-to-right transport and reverse flips the same phase', () => {
  for (const style of ['ticker', 'waveform']) {
    const state = createSettings(entries.find(entry => entry.value === style), () => 0.37);
    state.phase = 0.5;
    const forward = advancePhase(state, 16) - state.phase;
    // Tick rectangles subtract offset; waveform curves subtract temporal phase.
    expect(style === 'ticker' ? forward < 0 : forward > 0).toBe(true);
    state.values[`${style}Reverse`] = 'true';
    expect(advancePhase(state, 16) - state.phase).toBeCloseTo(-forward, 10);
  }
});
