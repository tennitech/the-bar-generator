const {
  applyWaveformEnvelope,
  createBarPatternSVG,
  createCirclesGradientPatternGeometry,
  createFibonacciPatternGeometry,
  createGradientPatternGeometry,
  createGridPatternGeometry,
  createLinesPatternGeometry,
  createPointConnectPatternGeometry,
  createTriangleGridPatternGeometry,
  createTrianglesPatternGeometry,
  createTrussPatternGeometry,
  createUnionPatternGeometry,
  createWaveQuantumPatternGeometry,
  mapWaveformToBarYFraction,
  normalizeWaveformEnvelopeCenter,
  normalizeWaveformEnvelopeWaves
} = require('../js/utils/barPattern');

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
      circlesGradientVariant: 1,
      gradientVariant: 1,
      gridVariant: 1,
      linesVariant: 2,
      pointConnectVariant: 1,
      triangleGridVariant: 2,
      trianglesVariant: 1,
      trussFamily: 'flat'
    },
    ...overrides
  };
}

describe('createBarPatternSVG', () => {
  test('normalizes waveform envelope waves to whole-number steps', () => {
    expect(normalizeWaveformEnvelopeWaves('0.5')).toBe(1);
    expect(normalizeWaveformEnvelopeWaves('3.9')).toBe(4);
    expect(normalizeWaveformEnvelopeWaves('11')).toBe(10);
  });

  test('keeps waveform center offset mapping inside the bar bounds', () => {
    expect(normalizeWaveformEnvelopeCenter('1')).toBe(0.5);
    expect(normalizeWaveformEnvelopeCenter('-1')).toBe(-0.5);
    expect(mapWaveformToBarYFraction(0, 0.5)).toBeGreaterThanOrEqual(0);
    expect(mapWaveformToBarYFraction(0, 0.5)).toBeLessThanOrEqual(1);
    expect(mapWaveformToBarYFraction(1, -0.5)).toBeGreaterThanOrEqual(0);
    expect(mapWaveformToBarYFraction(1, -0.5)).toBeLessThanOrEqual(1);
  });

  test('applies waveform envelopes without leaving normalized range', () => {
    const enveloped = applyWaveformEnvelope(0.9, {
      applyEnvelope: true,
      envType: 'sine',
      envWaves: 4,
      bipolar: true,
      xPortion: 0.33
    });

    expect(enveloped).toBeGreaterThanOrEqual(0);
    expect(enveloped).toBeLessThanOrEqual(1);
  });

  test('creates waveform path content', () => {
    const result = createBarPatternSVG(makeBaseConfig({ currentShader: 4 }));
    expect(result).toContain('<path d="');
  });

  test('serializes waveform envelope settings in SVG output', () => {
    const result = createBarPatternSVG(makeBaseConfig({
      currentShader: 4,
      values: {
        ...makeBaseConfig().values,
        waveformEnvelope: true,
        waveformEnvelopeType: 'linear',
        waveformEnvelopeWaves: '4',
        waveformEnvelopeCenter: '0.5',
        waveformEnvelopeBipolar: true
      }
    }));

    expect(result).toContain('<path d="');
    expect(result).not.toContain('NaN');
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

  test('builds lines geometry for both density variants', () => {
    const large = createLinesPatternGeometry({
      barStartX: 0,
      barY: 0,
      exactBarWidth: 250,
      barHeight: 18,
      variant: 1
    });
    const medium = createLinesPatternGeometry({
      barStartX: 0,
      barY: 0,
      exactBarWidth: 250,
      barHeight: 18,
      variant: 2
    });

    expect(large.rects.length).toBeGreaterThan(0);
    expect(medium.rects.length).toBeGreaterThan(large.rects.length);
  });

  test('serializes point connect and triangle grid outputs', () => {
    const pointConnect = createBarPatternSVG(makeBaseConfig({
      currentShader: 14,
      values: {
        ...makeBaseConfig().values,
        pointConnectVariant: 2
      }
    }));
    const triangleGrid = createBarPatternSVG(makeBaseConfig({
      currentShader: 15,
      values: {
        ...makeBaseConfig().values,
        triangleGridVariant: 3
      }
    }));

    expect(pointConnect).toContain('<path d="');
    expect(triangleGrid).toContain('<path d="');
  });

  test('builds dense line geometry for point connect and triangle grid styles', () => {
    const pointConnect = createPointConnectPatternGeometry({
      barStartX: 0,
      barY: 0,
      exactBarWidth: 250,
      barHeight: 18,
      variant: 2
    });
    const triangleGrid = createTriangleGridPatternGeometry({
      barStartX: 0,
      barY: 0,
      exactBarWidth: 250,
      barHeight: 18,
      variant: 3
    });

    expect(pointConnect.lines.length).toBeGreaterThan(20);
    expect(triangleGrid.lines.length).toBeGreaterThan(20);
  });

  test('serializes the remaining reference bar styles', () => {
    const circlesGradient = createBarPatternSVG(makeBaseConfig({
      currentShader: 16,
      values: {
        ...makeBaseConfig().values,
        circlesGradientVariant: 2
      }
    }));
    const gradient = createBarPatternSVG(makeBaseConfig({
      currentShader: 17,
      values: {
        ...makeBaseConfig().values,
        gradientVariant: 2
      }
    }));
    const grid = createBarPatternSVG(makeBaseConfig({
      currentShader: 18,
      values: {
        ...makeBaseConfig().values,
        gridVariant: 3
      }
    }));
    const triangles = createBarPatternSVG(makeBaseConfig({
      currentShader: 19,
      values: {
        ...makeBaseConfig().values,
        trianglesVariant: 2
      }
    }));
    const fibonacci = createBarPatternSVG(makeBaseConfig({ currentShader: 20 }));
    const union = createBarPatternSVG(makeBaseConfig({ currentShader: 21 }));
    const waveQuantum = createBarPatternSVG(makeBaseConfig({ currentShader: 22 }));

    expect(circlesGradient).toContain('<circle');
    expect(gradient).toContain('<rect');
    expect(grid).toContain('<path d="');
    expect(triangles).toContain('<polygon');
    expect(fibonacci).toContain('<rect');
    expect(union).toContain('<polygon');
    expect(waveQuantum).toContain('<path d="');
  });

  test('builds geometry for the remaining reference-style helpers', () => {
    const circlesGradient = createCirclesGradientPatternGeometry({
      barStartX: 0,
      barY: 0,
      exactBarWidth: 250,
      barHeight: 18,
      variant: 3
    });
    const gradient = createGradientPatternGeometry({
      barStartX: 0,
      barY: 0,
      exactBarWidth: 250,
      barHeight: 18,
      variant: 2
    });
    const grid = createGridPatternGeometry({
      barStartX: 0,
      barY: 0,
      exactBarWidth: 250,
      barHeight: 18,
      variant: 3
    });
    const triangles = createTrianglesPatternGeometry({
      barStartX: 0,
      barY: 0,
      exactBarWidth: 250,
      barHeight: 18,
      variant: 2
    });
    const fibonacci = createFibonacciPatternGeometry({
      barStartX: 0,
      barY: 0,
      exactBarWidth: 250,
      barHeight: 18
    });
    const union = createUnionPatternGeometry({
      barStartX: 0,
      barY: 0,
      exactBarWidth: 250,
      barHeight: 18
    });
    const waveQuantum = createWaveQuantumPatternGeometry({
      barStartX: 0,
      barY: 0,
      exactBarWidth: 250,
      barHeight: 18
    });

    expect(circlesGradient.circles.length + circlesGradient.rects.length).toBeGreaterThan(0);
    expect(gradient.rects.length).toBeGreaterThan(0);
    expect(grid.lines.length).toBeGreaterThan(0);
    expect(triangles.polygons.length).toBeGreaterThan(0);
    expect(fibonacci.rects.length).toBeGreaterThan(2);
    expect(fibonacci.rects[1].x).toBeGreaterThan(fibonacci.rects[0].x + fibonacci.rects[0].width);
    expect(union.topRects.length).toBe(5);
    expect(union.lowerPaths.length).toBe(5);
    expect(union.lowerPaths[0].length).toBeGreaterThan(20);
    const unionTemplateTotal = 6.71289 + 24.44241 + 5.8232 + 24.4502 + 5.8242 + 24.4463 + 6.7139;
    const firstScallopWidth = union.moduleWidth * (24.44241 / unionTemplateTotal);
    const firstScallopApex = Math.min(...union.lowerPaths[0].slice(3).map((point) => point.y));
    expect(firstScallopApex).toBeCloseTo(18 - firstScallopWidth / 2, 1);
    expect(waveQuantum.paths.length).toBe(3);
  });
});
