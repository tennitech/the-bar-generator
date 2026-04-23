const {
  applyWaveformEnvelope,
  createBarPatternSVG,
  createCirclesGradientPatternGeometry,
  createFibonacciPatternGeometry,
  createGradientPatternGeometry,
  createGridPatternGeometry,
  createLinesPatternGeometry,
  createNeuralNetworkPatternGeometry,
  createPointConnectPatternGeometry,
  createTickerPatternGeometry,
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
      circlesFill: 'stroke',
      circlesDensity: 50,
      circlesSizeVariation: 10,
      numericValue: '3.14159',
      numericMode: 'dotmatrix',
      circlesGradientVariant: 1,
      gradientVariant: 1,
      gridVariant: 1,
      linesVariant: 2,
      pointConnectVariant: 1,
      neuralNetworkHiddenLayers: 1,
      triangleGridVariant: 2,
      trianglesVariant: 1,
      trussFamily: 'flat'
    },
    ...overrides
  };
}

function expectTickerRectsInsideBar(rects, barStartX = 0, barY = 0, exactBarWidth = 500, barHeight = 36) {
  const violations = getTickerRectBoundsViolations(rects, barStartX, barY, exactBarWidth, barHeight);
  expect(violations).toEqual([]);
}

function getTickerRectBoundsViolations(rects, barStartX = 0, barY = 0, exactBarWidth = 500, barHeight = 36, context = '') {
  const epsilon = 0.000001;
  const violations = [];

  if (rects.length === 0) {
    violations.push(`${context} produced no ticker rectangles`);
  }

  rects.forEach((rect, index) => {
    const label = context ? `${context} rect ${index}` : `rect ${index}`;
    if (rect.x < barStartX - epsilon) {
      violations.push(`${label} x ${rect.x} is left of ${barStartX}`);
    }
    if (rect.y < barY - epsilon) {
      violations.push(`${label} y ${rect.y} is above ${barY}`);
    }
    if (rect.x + rect.width > barStartX + exactBarWidth + epsilon) {
      violations.push(`${label} right ${rect.x + rect.width} exceeds ${barStartX + exactBarWidth}`);
    }
    if (rect.y + rect.height > barY + barHeight + epsilon) {
      violations.push(`${label} bottom ${rect.y + rect.height} exceeds ${barY + barHeight}`);
    }
    if (rect.width <= 0) {
      violations.push(`${label} width ${rect.width} is not positive`);
    }
    if (rect.height <= 0) {
      violations.push(`${label} height ${rect.height} is not positive`);
    }
  });

  return violations;
}

function getAllowedTickerWidthRatioMax(countRatio) {
  return {
    1: 2,
    2: 3,
    3: 5,
    4: 7,
    5: 10
  }[countRatio];
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
        ...makeBaseConfig().values
      }
    }));
    expect(result).toContain('<circle');
    expect(result).toContain('stroke=');
  });

  test('normalizes circles output to the full bar bounds', () => {
    const result = createBarPatternSVG(makeBaseConfig({
      currentShader: 5,
      generateStaticPackedCircles: () => [
        { x: 48, y: 5, r: 3 },
        { x: 172, y: 15, r: 4 }
      ],
      values: {
        ...makeBaseConfig().values
      }
    }));
    const circleBounds = [...result.matchAll(/<circle cx="([^"]+)" cy="[^"]+" r="([^"]+)"/g)]
      .map((match) => ({
        left: parseFloat(match[1]) - parseFloat(match[2]),
        right: parseFloat(match[1]) + parseFloat(match[2])
      }));

    expect(result).toContain('<clipPath');
    expect(circleBounds.length).toBeGreaterThan(8);
    expect(Math.min(...circleBounds.map((circle) => circle.left))).toBeLessThanOrEqual(0.1);
    expect(Math.max(...circleBounds.map((circle) => circle.right))).toBeGreaterThanOrEqual(249.9);
  });

  test('uses a scattered fallback instead of aligned circle rows', () => {
    const result = createBarPatternSVG(makeBaseConfig({
      currentShader: 5,
      generateStaticPackedCircles: () => [],
      values: {
        ...makeBaseConfig().values,
        circlesFill: 'fill'
      }
    }));

    const circleYValues = [...result.matchAll(/<circle cx="[^"]+" cy="([^"]+)"/g)]
      .map((match) => Math.round(parseFloat(match[1]) * 10) / 10);
    const uniqueYValues = new Set(circleYValues);

    expect(circleYValues.length).toBeGreaterThan(20);
    expect(uniqueYValues.size).toBeGreaterThan(8);
  });

  test('does not pass legacy overlap arguments into packing circles generation', () => {
    let capturedArgs = null;

    createBarPatternSVG(makeBaseConfig({
      currentShader: 5,
      generateStaticPackedCircles: (...args) => {
        capturedArgs = args;
        return [{ x: 20, y: 9, r: 4 }];
      },
      values: {
        ...makeBaseConfig().values,
        circlesFill: 'stroke'
      }
    }));

    expect(capturedArgs).toHaveLength(4);
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

  test('clips ticker SVG rectangles to the visible ticker pattern bounds for wide bottom ticks', () => {
    const geometry = createTickerPatternGeometry({
      exactBarWidth: 500,
      barHeight: 36,
      tickerRepeats: 34,
      tickerRatio: 1,
      tickerWidthRatio: 5
    });
    const result = createBarPatternSVG(makeBaseConfig({
      currentShader: 2,
      exactBarWidth: 500,
      barHeight: 36,
      values: {
        ...makeBaseConfig().values,
        tickerRepeats: 34,
        tickerRatio: 1,
        tickerWidthRatio: 5
      }
    }));
    const rects = [...result.matchAll(/<rect x="([^"]+)" y="([^"]+)" width="([^"]+)" height="([^"]+)"/g)]
      .map((match) => ({
        x: parseFloat(match[1]),
        y: parseFloat(match[2]),
        width: parseFloat(match[3]),
        height: parseFloat(match[4])
    }));

    expectTickerRectsInsideBar(rects);
    expect(Math.max(...rects.map((rect) => rect.x + rect.width))).toBeCloseTo(geometry.patternEndX);
    expect(geometry.patternEndX).toBe(500);
  });

  test('keeps all allowed ticker parameter combinations inside the bar and repeat bounds', () => {
    const violations = [];

    for (let repeats = 5; repeats <= 40; repeats++) {
      for (let ratio = 1; ratio <= 5; ratio++) {
        for (let widthRatio = 1; widthRatio <= getAllowedTickerWidthRatioMax(ratio); widthRatio++) {
          const staticGeometry = createTickerPatternGeometry({
            barStartX: 10,
            barY: 4,
            exactBarWidth: 500,
            barHeight: 36,
            tickerRepeats: repeats,
            tickerRatio: ratio,
            tickerWidthRatio: widthRatio
          });
          violations.push(...getTickerRectBoundsViolations(
            staticGeometry.rects,
            10,
            4,
            500,
            36,
            `static repeats=${repeats} ratio=${ratio} widthRatio=${widthRatio}`
          ));
          if (Math.min(...staticGeometry.rects.map((rect) => rect.x)) > 10 + 0.000001) {
            violations.push(
              `static repeats=${repeats} ratio=${ratio} widthRatio=${widthRatio} does not start at the left bar edge`
            );
          }
          if (Math.max(...staticGeometry.rects.map((rect) => rect.x + rect.width)) < 510 - 0.000001) {
            violations.push(
              `static repeats=${repeats} ratio=${ratio} widthRatio=${widthRatio} does not reach the right bar edge`
            );
          }
          staticGeometry.rects
            .filter((rect) => rect.row === 'bottom')
            .forEach((rect, index) => {
              const cellRight = 10 + (index + 1) * staticGeometry.repeatWidth;
              if (rect.x + rect.width > cellRight + 0.000001) {
                violations.push(
                  `static repeats=${repeats} ratio=${ratio} widthRatio=${widthRatio} bottom rect ${index} exceeds repeat cell`
                );
              }
            });
          staticGeometry.rects.forEach((rect, index) => {
            if (rect.x + rect.width > staticGeometry.patternEndX + 0.000001) {
              violations.push(
                `static repeats=${repeats} ratio=${ratio} widthRatio=${widthRatio} rect ${index} exceeds visible pattern end`
              );
            }
          });

          [0, staticGeometry.repeatWidth * 0.35, staticGeometry.repeatWidth * 0.95].forEach((loopOffsetX) => {
            const loopingGeometry = createTickerPatternGeometry({
              barStartX: 10,
              barY: 4,
              exactBarWidth: 500,
              barHeight: 36,
              tickerRepeats: repeats,
              tickerRatio: ratio,
              tickerWidthRatio: widthRatio,
              loopOffsetX
            });
            violations.push(...getTickerRectBoundsViolations(
              loopingGeometry.rects,
              10,
              4,
              500,
              36,
              `loop repeats=${repeats} ratio=${ratio} widthRatio=${widthRatio} offset=${loopOffsetX}`
            ));
            if (loopingGeometry.bottomTickWidth > loopingGeometry.repeatWidth + 0.000001) {
              violations.push(
                `loop repeats=${repeats} ratio=${ratio} widthRatio=${widthRatio} bottom width exceeds repeat width`
              );
            }
          });
        }
      }
    }

    expect(violations).toEqual([]);
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

  test('builds and serializes a neural-network bar layout', () => {
    const geometry = createNeuralNetworkPatternGeometry({
      barStartX: 0,
      barY: 0,
      exactBarWidth: 250,
      barHeight: 18,
      hiddenLayers: 1
    });
    const svg = createBarPatternSVG(makeBaseConfig({ currentShader: 23 }));

    expect(geometry.nodes.length).toBe(7);
    expect(geometry.lines.length).toBe(8);
    expect(svg).toContain('<path d="');
    expect(svg).toContain('<circle');
  });

  test('changes neural-network density when hidden layers increase', () => {
    const shallow = createNeuralNetworkPatternGeometry({
      barStartX: 0,
      barY: 0,
      exactBarWidth: 250,
      barHeight: 18,
      hiddenLayers: 1
    });
    const deep = createNeuralNetworkPatternGeometry({
      barStartX: 0,
      barY: 0,
      exactBarWidth: 250,
      barHeight: 18,
      hiddenLayers: 4
    });

    expect(deep.hiddenLayers).toBe(4);
    expect(deep.nodes.length).toBeGreaterThan(shallow.nodes.length);
    expect(deep.lines.length).toBeGreaterThan(shallow.lines.length);
    expect(deep.nodes.length).toBe(16);
    expect(deep.lines.length).toBe(26);
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
    const neuralNetwork = createBarPatternSVG(makeBaseConfig({ currentShader: 23 }));
    const fibonacci = createBarPatternSVG(makeBaseConfig({ currentShader: 20 }));
    const union = createBarPatternSVG(makeBaseConfig({ currentShader: 21 }));
    const waveQuantum = createBarPatternSVG(makeBaseConfig({ currentShader: 22 }));
    const lunar = createBarPatternSVG(makeBaseConfig({ currentShader: 24 }));

    expect(circlesGradient).toContain('<circle');
    expect(gradient).toContain('<rect');
    expect(grid).toContain('<path d="');
    expect(triangles).toContain('<polygon');
    expect(neuralNetwork).toContain('<circle');
    expect(fibonacci).toContain('<rect');
    expect(union).toContain('<polygon');
    expect(waveQuantum).toContain('<path d="');
    expect(lunar).toContain('<g fill="#000000"');
    expect(lunar).toContain('<path');
    expect(lunar).not.toContain('<image href=');
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
