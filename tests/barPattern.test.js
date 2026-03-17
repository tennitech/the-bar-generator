const { createBarPatternSVG, createTrussPatternGeometry } = require('../js/utils/barPattern');

function makeBaseConfig(overrides = {}) {
  return {
    currentShader: 1,
    barStartX: 0,
    barY: 0,
    exactBarWidth: 250,
    barHeight: 18,
    fgColor: '#000000',
    textToBinary: (text) => text.split('').flatMap(() => [1, 0, 1, 0, 1, 0, 1, 0]),
    parseNumericString: () => [1, 2, 3, 4, 10, 5],
    generateGridCircles: () => [{ x: 10, y: 9, r: 3 }],
    generateStaticPackedCircles: () => [{ x: 20, y: 9, r: 4 }],
    values: {
      rulerRepeats: 10,
      rulerUnits: 4,
      tickerRepeats: 34,
      tickerRatio: 2,
      tickerWidthRatio: 2,
      binaryText: 'RPI',
      waveformType: 0.5,
      waveformFrequency: 24,
      waveformSpeed: 1.0,
      timeSeconds: 0.3,
      circlesMode: 'packing',
      circlesFill: 'stroke',
      circlesDensity: 50,
      circlesSizeVariation: 10,
      circlesOverlap: 0,
      circlesRows: 2,
      circlesGridDensity: 100,
      circlesSizeVariationY: 0,
      circlesSizeVariationX: 0,
      circlesGridOverlap: 0,
      circlesLayout: 'straight',
      numericValue: '3.14159',
      numericMode: 'dotmatrix',
      trussFamily: 'flat'
    },
    ...overrides
  };
}

describe('createBarPatternSVG', () => {
  test('creates waveform path content', () => {
    const result = createBarPatternSVG(makeBaseConfig({ currentShader: 4 }));
    expect(result).toContain('<path d="');
  });

  test('creates circles content in packing mode', () => {
    const result = createBarPatternSVG(makeBaseConfig({
      currentShader: 5,
      values: {
        ...makeBaseConfig().values,
        circlesMode: 'packing'
      }
    }));
    expect(result).toContain('<circle');
    expect(result).toContain('stroke=');
  });

  test('creates circles content in grid mode', () => {
    const result = createBarPatternSVG(makeBaseConfig({
      currentShader: 5,
      values: {
        ...makeBaseConfig().values,
        circlesMode: 'grid',
        circlesLayout: 'stagger',
        circlesFill: 'fill'
      }
    }));
    expect(result).toContain('<circle');
    expect(result).toContain('fill="#000000"');
  });

  test('keeps ruler, ticker, binary, and numeric outputs non-empty', () => {
    const ruler = createBarPatternSVG(makeBaseConfig({ currentShader: 1 }));
    const ticker = createBarPatternSVG(makeBaseConfig({ currentShader: 2 }));
    const binary = createBarPatternSVG(makeBaseConfig({ currentShader: 3 }));
    const numeric = createBarPatternSVG(makeBaseConfig({
      currentShader: 6,
      values: {
        ...makeBaseConfig().values,
        numericMode: 'height'
      }
    }));

    expect(ruler).toContain('<rect');
    expect(ticker).toContain('<rect');
    expect(binary).toContain('<rect');
    expect(numeric).toContain('<rect');
  });

  test('builds geometry for every truss option in the selector', () => {
    const families = [
      'flat',
      'king-post',
      'queen-post',
      'howe',
      'scissor',
      'fink',
      'attic',
      'mono',
      'hip',
      'gable',
      'cathedral',
      'fan',
      'raised-tie'
    ];

    families.forEach((family) => {
      const geometry = createTrussPatternGeometry({
        barStartX: 0,
        barY: 0,
        exactBarWidth: 250,
        barHeight: 18,
        segments: 8,
        thickness: 2,
        family
      });

      expect(geometry.family).toBe(family);
      expect(geometry.lines.length).toBeGreaterThan(0);
    });
  });

  test('serializes selected truss family into SVG output', () => {
    const result = createBarPatternSVG(makeBaseConfig({
      currentShader: 9,
      values: {
        ...makeBaseConfig().values,
        trussFamily: 'raised-tie',
        trussSegments: 5,
        trussThickness: 2
      }
    }));

    expect(result).toContain('<path d="');
    expect((result.match(/ M /g) || []).length).toBe(6);
  });
});
