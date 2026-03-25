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
      trussFamily: 'flat',
      trussMirror: false,
      githubContributionGrid: [
        [0, 1, 2, 3, 4, 2, 0],
        [1, 0, 0, 2, 3, 1, 0],
        [4, 3, 2, 1, 0, 1, 2]
      ],
      githubShowEmpty: true,
      githubShowGuides: true
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

  test('creates GitHub contribution bar output', () => {
    const result = createBarPatternSVG(makeBaseConfig({
      currentShader: 13,
      values: makeBaseConfig().values
    }));

    expect(result).toContain('<rect');
    expect((result.match(/<rect/g) || []).length).toBeGreaterThan(3);
    expect(result).toContain('fill="#000000"');
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
      expect(geometry.strokes.length + geometry.lines.length).toBeGreaterThan(0);
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

    expect(result).toContain('<polyline');
    expect((result.match(/<line /g) || []).length).toBe(4);
  });

  test('defaults segmented trusses to non-mirrored geometry unless enabled', () => {
    const base = {
      barStartX: 0,
      barY: 0,
      exactBarWidth: 250,
      barHeight: 18,
      segments: 16,
      thickness: 2,
      family: 'flat'
    };
    const normal = createTrussPatternGeometry(base);
    const mirrored = createTrussPatternGeometry({ ...base, mirrorSegments: true });

    expect(normal.lines).not.toEqual(mirrored.lines);
  });
});
