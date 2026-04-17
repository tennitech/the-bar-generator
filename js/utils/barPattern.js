function mapDigitToHeightPercent(digit) {
  switch (digit) {
    case 0: return 0.1;
    case 1: return 0.2;
    case 2: return 0.3;
    case 3: return 0.4;
    case 4: return 0.5;
    case 5: return 0.6;
    case 6: return 0.7;
    case 7: return 0.8;
    case 8: return 0.9;
    case 9: return 1.0;
    default: return 0;
  }
}

function generateWaveValue(phase, type) {
  const normalizedPhase = phase - Math.floor(phase);
  const wrappedPhase = normalizedPhase < 0 ? normalizedPhase + 1 : normalizedPhase;

  const sine = (Math.sin(phase * 2 * Math.PI) + 1) * 0.5;
  const saw = wrappedPhase;
  const square = wrappedPhase > 0.5 ? 1.0 : 0.0;
  const pulse = wrappedPhase > 0.8 ? 1.0 : 0.0;

  if (type < 1.0) {
    return sine + (saw - sine) * type;
  }
  if (type < 2.0) {
    const t = type - 1.0;
    return saw + (square - saw) * t;
  }

  const t = type - 2.0;
  return square + (pulse - square) * t;
}

function clampWaveformValue(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function normalizeWaveformEnvelopeWaves(value) {
  const parsedValue = Math.round(parseFloat(value));
  if (!Number.isFinite(parsedValue)) {
    return 1;
  }

  return clampWaveformValue(parsedValue, 1, 10);
}

function normalizeWaveformEnvelopeCenter(value) {
  const parsedValue = parseFloat(value);
  if (!Number.isFinite(parsedValue)) {
    return 0;
  }

  return clampWaveformValue(parsedValue, -0.5, 0.5);
}

function applyWaveformEnvelope(wave, options = {}) {
  const applyEnvelope = !!options.applyEnvelope;
  if (!applyEnvelope) {
    return clampWaveformValue(wave, 0, 1);
  }

  const envType = options.envType || 'sine';
  const envWaves = normalizeWaveformEnvelopeWaves(options.envWaves);
  const bipolar = !!options.bipolar;
  const xPortion = clampWaveformValue(Number(options.xPortion) || 0, 0, 1);
  const envelopePhase = xPortion * envWaves;
  let envelope = 1;

  if (envType === 'sine') {
    envelope = Math.sin(Math.PI * envelopePhase);
  } else if (envType === 'cosine') {
    envelope = Math.cos(Math.PI * envelopePhase);
  } else if (envType === 'linear') {
    envelope = 1.0 - Math.abs((envelopePhase % 1) * 2 - 1);
  } else if (envType === 'inverse') {
    envelope = 1.0 - Math.sin(Math.PI * envelopePhase);
  }

  if (!bipolar) {
    envelope = Math.abs(envelope);
    return clampWaveformValue(wave * envelope, 0, 1);
  }

  const centeredWave = (wave * 2) - 1;
  return clampWaveformValue(((centeredWave * envelope) + 1) * 0.5, 0, 1);
}

function mapWaveformToBarYFraction(wave, centerOffset = 0) {
  const clampedWave = clampWaveformValue(wave, 0, 1);
  const clampedCenterOffset = normalizeWaveformEnvelopeCenter(centerOffset);
  const centerFraction = 0.5 - clampedCenterOffset * 0.5;
  const amplitudeLimit = Math.max(0, Math.min(centerFraction, 1 - centerFraction));
  const amplitudeScale = amplitudeLimit * 2;
  const centeredWave = clampedWave - 0.5;

  return clampWaveformValue(centerFraction - centeredWave * amplitudeScale, 0, 1);
}

function createMusicHeadSVG(shape, x, y, rx, ry, filled, fgColor, lineThickness) {
  const normalizedShape = normalizeMusicNoteShape(shape);
  const fill = filled ? fgColor : 'none';
  const strokeAttr = filled ? '' : ` stroke="${fgColor}" stroke-width="${lineThickness}"`;

  if (normalizedShape === 'circle') {
    return `<circle cx="${x}" cy="${y}" r="${rx}" fill="${fill}"${strokeAttr}/>`;
  }

  if (normalizedShape === 'square') {
    return `<rect x="${x - rx}" y="${y - ry}" width="${rx * 2}" height="${ry * 2}" fill="${fill}"${strokeAttr}/>`;
  }

  const points = normalizedShape === 'diamond'
    ? `${x},${y - ry} ${x + rx},${y} ${x},${y + ry} ${x - rx},${y}`
    : `${x},${y - ry} ${x + rx},${y + ry} ${x - rx},${y + ry}`;
  return `<polygon points="${points}" fill="${fill}"${strokeAttr}/>`;
}

function clampPatternVariant(value, max) {
  const parsed = parseInt(value, 10);
  if (!Number.isFinite(parsed)) return 1;
  return Math.max(1, Math.min(max, parsed));
}

function createLinesPatternGeometry(options = {}) {
  const barStartX = Number(options.barStartX || 0);
  const barY = Number(options.barY || 0);
  const exactBarWidth = Math.max(1, Number(options.exactBarWidth || 250));
  const barHeight = Math.max(1, Number(options.barHeight || 18));
  const variant = clampPatternVariant(options.variant || 2, 2);
  const fullBarCount = variant === 1 ? 20 : 24;
  const barWidth = exactBarWidth / (2 * fullBarCount - 1);
  const halfHeight = barHeight / 2;
  const rects = [];

  for (let i = 0; i < fullBarCount; i++) {
    rects.push({
      x: barStartX + i * barWidth * 2,
      y: barY,
      width: barWidth,
      height: barHeight
    });
  }

  for (let i = 0; i < fullBarCount - 1; i++) {
    rects.push({
      x: barStartX + ((i * 2) + 1) * barWidth,
      y: barY + halfHeight,
      width: barWidth,
      height: halfHeight
    });
  }

  return { rects };
}

function createPointConnectPatternGeometry(options = {}) {
  const barStartX = Number(options.barStartX || 0);
  const barY = Number(options.barY || 0);
  const exactBarWidth = Math.max(1, Number(options.exactBarWidth || 250));
  const barHeight = Math.max(1, Number(options.barHeight || 18));
  const variant = clampPatternVariant(options.variant || 1, 2);
  const thickness = Math.max(0.75, parseFloat(options.thickness || Math.max(1, barHeight * 0.075)));
  const cellCount = variant === 1 ? 8 : 14;
  const halfThickness = thickness / 2;
  const left = barStartX + halfThickness;
  const right = barStartX + exactBarWidth - halfThickness;
  const top = barY + halfThickness;
  const bottom = barY + barHeight - halfThickness;
  const cellWidth = (right - left) / cellCount;
  const lines = [];
  const addLine = (x1, y1, x2, y2) => {
    lines.push({ x1, y1, x2, y2 });
  };

  addLine(left, top, right, top);
  addLine(left, bottom, right, bottom);

  for (let i = 0; i <= cellCount; i++) {
    const x = left + i * cellWidth;
    addLine(x, top, x, bottom);
  }

  for (let i = 0; i < cellCount; i++) {
    const x0 = left + i * cellWidth;
    const xMid = x0 + cellWidth / 2;
    const x1 = x0 + cellWidth;

    addLine(xMid, top, xMid, bottom);
    addLine(x0, top, xMid, bottom);
    addLine(x0, bottom, xMid, top);
    addLine(xMid, top, x1, bottom);
    addLine(xMid, bottom, x1, top);
  }

  return { lines, thickness };
}

function createNeuralNetworkPatternGeometry(options = {}) {
  const barStartX = Number(options.barStartX || 0);
  const barY = Number(options.barY || 0);
  const exactBarWidth = Math.max(1, Number(options.exactBarWidth || 250));
  const barHeight = Math.max(1, Number(options.barHeight || 18));
  const hiddenLayers = Math.max(1, Math.min(5, parseInt(options.hiddenLayers || 1, 10) || 1));
  const thickness = Math.max(0.65, parseFloat(options.thickness || Math.max(0.8, barHeight * 0.045)));
  const endpointNodeCount = 2;
  const hiddenNodeCount = 3;
  const layerNodeCounts = [endpointNodeCount];
  for (let i = 0; i < hiddenLayers; i++) {
    layerNodeCounts.push(hiddenNodeCount);
  }
  layerNodeCounts.push(endpointNodeCount);
  const layerCount = layerNodeCounts.length;
  const maxNodes = Math.max(...layerNodeCounts);
  const coreRadius = Math.max(thickness * 1.35, Math.min(barHeight * 0.12, (barHeight * 0.92) / (maxNodes * 1.8)));
  const sideInset = Math.max(coreRadius * 0.9, exactBarWidth * 0.012);
  const verticalInset = Math.max(coreRadius * 0.7, barHeight * 0.015);
  const left = barStartX + sideInset;
  const right = barStartX + exactBarWidth - sideInset;
  const top = barY + verticalInset;
  const bottom = barY + barHeight - verticalInset;
  const layers = [];
  const lines = [];
  const nodes = [];
  const lerp = (a, b, t) => a + (b - a) * t;

  for (let layerIndex = 0; layerIndex < layerCount; layerIndex++) {
    const nodeCount = layerNodeCounts[layerIndex];
    const layerNodes = [];
    const x = layerCount === 1 ? barStartX + exactBarWidth / 2 : lerp(left, right, layerIndex / (layerCount - 1));
    const stepY = nodeCount === 1 ? 0 : (bottom - top) / (nodeCount - 1);

    for (let nodeIndex = 0; nodeIndex < nodeCount; nodeIndex++) {
      const yBase = nodeCount === 1 ? (top + bottom) / 2 : top + stepY * nodeIndex;
      const layerParityOffset = layerIndex > 0 && layerIndex < layerCount - 1
        ? (layerIndex % 2 === 0 ? -1 : 1) * stepY * 0.04
        : 0;
      const y = Math.max(top, Math.min(bottom, yBase + layerParityOffset));
      const node = { x, y, r: coreRadius, layerIndex, nodeIndex };

      layerNodes.push(node);
      nodes.push(node);
    }

    layers.push(layerNodes);
  }

  const addTrimmedLine = (a, b) => {
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    if (distance < 0.001) return;

    const trimStart = a.r + thickness * 0.35;
    const trimEnd = b.r + thickness * 0.35;
    if (distance <= trimStart + trimEnd) return;

    const unitX = dx / distance;
    const unitY = dy / distance;
    lines.push({
      x1: a.x + unitX * trimStart,
      y1: a.y + unitY * trimStart,
      x2: b.x - unitX * trimEnd,
      y2: b.y - unitY * trimEnd
    });
  };

  const normalizeNodePosition = (index, count) => (count <= 1 ? 0.5 : index / (count - 1));
  const targetNeighborSpan = endpointNodeCount === hiddenNodeCount ? 1 : 2;

  for (let layerIndex = 0; layerIndex < layers.length - 1; layerIndex++) {
    const currentLayer = layers[layerIndex];
    const nextLayer = layers[layerIndex + 1];

    for (let i = 0; i < currentLayer.length; i++) {
      const currentPosition = normalizeNodePosition(i, currentLayer.length);
      let connectionCount = 0;

      for (let j = 0; j < nextLayer.length; j++) {
        const nextPosition = normalizeNodePosition(j, nextLayer.length);
        const positionDelta = Math.abs(currentPosition - nextPosition);
        const isPrimaryNeighbor = positionDelta <= 0.01;
        const isDiagonalNeighbor = positionDelta > 0.01 && positionDelta <= 0.51;

        if (isPrimaryNeighbor || (isDiagonalNeighbor && connectionCount < targetNeighborSpan)) {
          addTrimmedLine(currentLayer[i], nextLayer[j]);
          connectionCount++;
        }
      }
    }
  }

  return { lines, nodes, thickness, hiddenLayers };
}

function createTriangleGridPatternGeometry(options = {}) {
  const barStartX = Number(options.barStartX || 0);
  const barY = Number(options.barY || 0);
  const exactBarWidth = Math.max(1, Number(options.exactBarWidth || 250));
  const barHeight = Math.max(1, Number(options.barHeight || 18));
  const variant = clampPatternVariant(options.variant || 2, 3);
  const thickness = Math.max(0.75, parseFloat(options.thickness || Math.max(1, barHeight * 0.075)));
  const rowCount = variant + 1;
  const halfThickness = thickness / 2;
  const left = barStartX + halfThickness;
  const right = barStartX + exactBarWidth - halfThickness;
  const top = barY + halfThickness;
  const bottom = barY + barHeight - halfThickness;
  const innerWidth = Math.max(0.1, right - left);
  const innerHeight = Math.max(0.1, bottom - top);
  const rowHeight = innerHeight / rowCount;
  const targetCellWidth = (2 * rowHeight) / Math.sqrt(3);
  const columnCount = Math.max(8, Math.round(innerWidth / Math.max(1, targetCellWidth)));
  const cellWidth = innerWidth / columnCount;
  const lines = [];
  const addLine = (x1, y1, x2, y2) => {
    lines.push({ x1, y1, x2, y2 });
  };
  const rowPoints = [];

  addLine(left, top, right, top);
  addLine(left, bottom, right, bottom);
  addLine(left, top, left, bottom);
  addLine(right, top, right, bottom);

  for (let row = 0; row <= rowCount; row++) {
    const y = top + row * rowHeight;
    const offset = row % 2 === 0 ? 0 : cellWidth / 2;
    const points = [];
    const pointCount = row % 2 === 0 ? columnCount + 1 : columnCount;

    for (let i = 0; i < pointCount; i++) {
      points.push({ x: left + offset + i * cellWidth, y });
    }
    rowPoints.push(points);

    if (row > 0 && row < rowCount) {
      addLine(left, y, right, y);
    }
  }

  for (let row = 0; row < rowCount; row++) {
    const upper = rowPoints[row];
    const lower = rowPoints[row + 1];
    const targetOffset = cellWidth / 2;

    for (let i = 0; i < upper.length; i++) {
      for (let j = 0; j < lower.length; j++) {
        const delta = lower[j].x - upper[i].x;
        if (Math.abs(Math.abs(delta) - targetOffset) < 0.001) {
          addLine(upper[i].x, upper[i].y, lower[j].x, lower[j].y);
        }
      }
    }
  }

  return { lines, thickness };
}

function createGradientPatternGeometry(options = {}) {
  const barStartX = Number(options.barStartX || 0);
  const barY = Number(options.barY || 0);
  const exactBarWidth = Math.max(1, Number(options.exactBarWidth || 250));
  const barHeight = Math.max(1, Number(options.barHeight || 18));
  const variant = clampPatternVariant(options.variant || 1, 2);
  const rects = [];
  const addRect = (x, y, width, height) => {
    rects.push({
      x,
      y,
      width,
      height,
      radius: height / 2
    });
  };

  if (variant === 1) {
    const rowCount = 7;
    const colCount = 8;
    const gapY = barHeight * 0.05;
    const rowHeight = (barHeight - gapY * (rowCount - 1)) / rowCount;
    const cellWidth = exactBarWidth / colCount;

    for (let row = 0; row < rowCount; row++) {
      const y = barY + row * (rowHeight + gapY);
      for (let col = 0; col < colCount; col++) {
        const widthFactor = Math.max(0.25, 0.96 - col * 0.11);
        const width = Math.max(rowHeight * 2.2, cellWidth * widthFactor);
        addRect(barStartX + col * cellWidth, y, width, rowHeight);
      }
    }
  } else {
    const rowCount = 5;
    const gapY = barHeight * 0.08;
    const rowHeight = (barHeight - gapY * (rowCount - 1)) / rowCount;
    const segments = [
      { x: 0, width: exactBarWidth * 0.2 },
      { x: exactBarWidth * 0.2, width: exactBarWidth * 0.4 },
      { x: exactBarWidth * 0.6, width: exactBarWidth * 0.4 }
    ];

    for (let row = 0; row < rowCount; row++) {
      const y = barY + row * (rowHeight + gapY);
      for (let i = 0; i < segments.length; i++) {
        const segment = segments[i];
        addRect(barStartX + segment.x, y, segment.width, rowHeight);
      }
    }
  }

  return { rects };
}

function createCirclesGradientPatternGeometry(options = {}) {
  const barStartX = Number(options.barStartX || 0);
  const barY = Number(options.barY || 0);
  const exactBarWidth = Math.max(1, Number(options.exactBarWidth || 250));
  const barHeight = Math.max(1, Number(options.barHeight || 18));
  const variant = clampPatternVariant(options.variant || 1, 3);
  const circles = [];
  const rects = [];
  const addCircleRow = (count, y, radius, offset = 0) => {
    const spacing = exactBarWidth / Math.max(1, count - 1);
    for (let i = 0; i < count; i++) {
      circles.push({
        cx: barStartX + i * spacing + offset,
        cy: y,
        r: radius
      });
    }
  };

  if (variant === 1) {
    addCircleRow(30, barY + barHeight * 0.2, barHeight * 0.19);
    addCircleRow(31, barY + barHeight * 0.55, barHeight * 0.12, exactBarWidth / 60);
    addCircleRow(30, barY + barHeight * 0.82, barHeight * 0.085);
  } else if (variant === 2) {
    rects.push({
      x: barStartX,
      y: barY + barHeight * 0.52,
      width: exactBarWidth,
      height: barHeight * 0.34
    });
    addCircleRow(30, barY + barHeight * 0.52, barHeight * 0.15);
    addCircleRow(32, barY + barHeight * 0.28, barHeight * 0.1, exactBarWidth / 64);
    addCircleRow(34, barY + barHeight * 0.06, barHeight * 0.055, exactBarWidth / 68);
  } else {
    const rows = 4;
    const cols = 52;
    for (let row = 0; row < rows; row++) {
      const y = barY + barHeight * (0.08 + row * 0.24);
      for (let col = 0; col < cols; col++) {
        const xFraction = col / (cols - 1);
        const sizeFactor = Math.pow(xFraction, 1.55);
        const radius = barHeight * (0.015 + sizeFactor * (0.06 + row * 0.02));
        const offset = row % 2 === 0 ? 0 : exactBarWidth / (cols * 2);
        circles.push({
          cx: barStartX + xFraction * exactBarWidth + offset,
          cy: y,
          r: radius
        });
      }
    }
  }

  return { rects, circles };
}

function createGridPatternGeometry(options = {}) {
  const barStartX = Number(options.barStartX || 0);
  const barY = Number(options.barY || 0);
  const exactBarWidth = Math.max(1, Number(options.exactBarWidth || 250));
  const barHeight = Math.max(1, Number(options.barHeight || 18));
  const variant = clampPatternVariant(options.variant || 1, 3);
  const rowCount = variant + 1;
  const colCount = Math.max(8, Math.round(exactBarWidth / (barHeight / rowCount)));
  const thickness = Math.max(0.75, barHeight * 0.08);
  const lines = [];
  const left = barStartX + thickness / 2;
  const right = barStartX + exactBarWidth - thickness / 2;
  const top = barY + thickness / 2;
  const bottom = barY + barHeight - thickness / 2;
  const cellWidth = (right - left) / colCount;
  const cellHeight = (bottom - top) / rowCount;
  const addLine = (x1, y1, x2, y2) => lines.push({ x1, y1, x2, y2 });

  for (let row = 0; row <= rowCount; row++) {
    const y = top + row * cellHeight;
    addLine(left, y, right, y);
  }
  for (let col = 0; col <= colCount; col++) {
    const x = left + col * cellWidth;
    addLine(x, top, x, bottom);
  }

  return { lines, thickness };
}

function createTrianglesPatternGeometry(options = {}) {
  const barStartX = Number(options.barStartX || 0);
  const barY = Number(options.barY || 0);
  const exactBarWidth = Math.max(1, Number(options.exactBarWidth || 250));
  const barHeight = Math.max(1, Number(options.barHeight || 18));
  const variant = clampPatternVariant(options.variant || 1, 2);
  const polygons = [];

  const addRow = (count, y, height) => {
    const cellWidth = exactBarWidth / count;
    for (let i = 0; i < count; i++) {
      const x = barStartX + i * cellWidth;
      polygons.push([
        { x, y },
        { x: x + cellWidth, y: y + height },
        { x, y: y + height }
      ]);
    }
  };

  if (variant === 1) {
    addRow(14, barY, barHeight);
  } else {
    addRow(15, barY, barHeight * 0.48);
    addRow(30, barY + barHeight * 0.48, barHeight * 0.2);
    addRow(60, barY + barHeight * 0.68, barHeight * 0.12);
    addRow(120, barY + barHeight * 0.8, barHeight * 0.08);
  }

  return { polygons };
}

function createFibonacciPatternGeometry(options = {}) {
  const barStartX = Number(options.barStartX || 0);
  const barY = Number(options.barY || 0);
  const exactBarWidth = Math.max(1, Number(options.exactBarWidth || 250));
  const barHeight = Math.max(1, Number(options.barHeight || 18));
  const weights = [34, 21, 13, 8, 5, 3, 1];
  const total = weights.reduce((sum, weight) => sum + weight, 0);
  const gapWidth = Math.max(0.9, exactBarWidth * 0.004442);
  const totalGapWidth = gapWidth * (weights.length - 1);
  const usableWidth = Math.max(0, exactBarWidth - totalGapWidth);
  const rects = [];
  let x = barStartX;

  for (let i = 0; i < weights.length; i++) {
    const width = i === weights.length - 1
      ? barStartX + exactBarWidth - x
      : (usableWidth * weights[i]) / total;
    rects.push({ x, y: barY, width, height: barHeight });
    x += width + (i < weights.length - 1 ? gapWidth : 0);
  }

  return { rects, gapWidth };
}

function createUnionPatternGeometry(options = {}) {
  const barStartX = Number(options.barStartX || 0);
  const barY = Number(options.barY || 0);
  const exactBarWidth = Math.max(1, Number(options.exactBarWidth || 250));
  const barHeight = Math.max(1, Number(options.barHeight || 18));
  const moduleCount = 5;
  const moduleGap = Math.max(0.9, exactBarWidth * 0.003978);
  const moduleWidth = (exactBarWidth - moduleGap * (moduleCount - 1)) / moduleCount;
  const topBandHeight = barHeight * (8.35254 / 36);
  const lowerTop = barY + barHeight * (10.9414 / 36);
  const lowerBottom = barY + barHeight;
  const lowerSpanTemplate = [6.71289, 24.44241, 5.8232, 24.4502, 5.8242, 24.4463, 6.7139];
  const templateTotal = lowerSpanTemplate.reduce((sum, span) => sum + span, 0);
  const topRects = [];
  const lowerPaths = [];

  function buildLowerPath(moduleX) {
    const spans = lowerSpanTemplate.map((span) => (span / templateTotal) * moduleWidth);
    const bottomPoints = [];
    let cursorX = moduleX;

    bottomPoints.push({ x: moduleX, y: lowerBottom });
    cursorX += spans[0];
    bottomPoints.push({ x: cursorX, y: lowerBottom });

    for (let archIndex = 0; archIndex < 3; archIndex++) {
      const archWidth = spans[archIndex * 2 + 1];
      const flatWidth = spans[archIndex * 2 + 2] || 0;
      const radius = archWidth * 0.5;
      const centerX = cursorX + radius;
      const steps = 20;

      for (let step = 1; step <= steps; step++) {
        const t = step / steps;
        const x = cursorX + archWidth * t;
        const dx = x - centerX;
        bottomPoints.push({
          x,
          y: lowerBottom - Math.sqrt(Math.max(0, radius * radius - dx * dx))
        });
      }

      cursorX += archWidth;
      if (flatWidth > 0) {
        cursorX += flatWidth;
        bottomPoints.push({ x: cursorX, y: lowerBottom });
      }
    }

    bottomPoints[bottomPoints.length - 1] = { x: moduleX + moduleWidth, y: lowerBottom };

    return [
      { x: moduleX, y: lowerTop },
      { x: moduleX + moduleWidth, y: lowerTop },
      { x: moduleX + moduleWidth, y: lowerBottom },
      ...bottomPoints.slice(0, -1).reverse()
    ];
  }

  for (let i = 0; i < moduleCount; i++) {
    const moduleX = barStartX + i * (moduleWidth + moduleGap);
    topRects.push({
      x: moduleX,
      y: barY,
      width: moduleWidth,
      height: topBandHeight
    });
    lowerPaths.push(buildLowerPath(moduleX));
  }

  return {
    topRects,
    lowerPaths,
    moduleGap,
    moduleWidth,
    topBandHeight,
    lowerTop
  };
}

function createWaveQuantumPatternGeometry(options = {}) {
  const barStartX = Number(options.barStartX || 0);
  const barY = Number(options.barY || 0);
  const exactBarWidth = Math.max(1, Number(options.exactBarWidth || 250));
  const barHeight = Math.max(1, Number(options.barHeight || 18));
  const thickness = Math.max(1.2, barHeight * 0.1);
  const centerY = barY + barHeight / 2;
  const amplitude = barHeight * 0.48;
  const cycles = 11;
  const points = Math.max(220, Math.round(exactBarWidth * 1.2));
  const phases = [0, Math.PI / 3, (2 * Math.PI) / 3];
  const paths = phases.map((phase) => {
    const pointsList = [];
    for (let i = 0; i <= points; i++) {
      const portion = i / points;
      const x = barStartX + portion * exactBarWidth;
      const y = centerY - Math.sin(portion * cycles * 2 * Math.PI + phase) * amplitude;
      pointsList.push({ x, y });
    }
    return pointsList;
  });

  return { paths, thickness };
}

function normalizeTrussFamily(family) {
  const normalized = String(family || 'flat').toLowerCase();
  switch (normalized) {
    case 'flat':
    case 'king-post':
    case 'queen-post':
    case 'howe':
    case 'scissor':
    case 'fink':
    case 'attic':
    case 'mono':
    case 'hip':
    case 'gable':
    case 'cathedral':
    case 'fan':
    case 'raised-tie':
      return normalized;
    case 'cross':
    case 'warren':
    case 'vierendeel':
      return 'flat';
    case 'pratt':
      return 'queen-post';
    default:
      return 'flat';
  }
}

function createTrussPatternGeometry(options = {}) {
  const barStartX = Number(options.barStartX || 0);
  const barY = Number(options.barY || 0);
  const exactBarWidth = Math.max(1, Number(options.exactBarWidth || 250));
  const barHeight = Math.max(1, Number(options.barHeight || 18));
  const thickness = Math.max(0.5, parseFloat(options.thickness || 2));
  const segments = Math.max(2, parseInt(options.segments || 15, 10));
  const family = normalizeTrussFamily(options.family);

  const halfThick = thickness / 2;
  const xLeft = barStartX + halfThick;
  const yTop = barY + halfThick;
  const xRight = barStartX + exactBarWidth - halfThick;
  const yBottom = barY + barHeight - halfThick;
  const innerWidth = Math.max(0.1, xRight - xLeft);
  const innerHeight = Math.max(0.1, yBottom - yTop);

  const lines = [];
  const toAbsolute = (point) => ({
    x: xLeft + point.x * innerWidth,
    y: yTop + point.y * innerHeight
  });
  const addLine = (pointA, pointB) => {
    const a = toAbsolute(pointA);
    const b = toAbsolute(pointB);
    lines.push({ x1: a.x, y1: a.y, x2: b.x, y2: b.y });
  };
  const addPolyline = (points, closed = false) => {
    for (let i = 0; i < points.length - 1; i++) {
      addLine(points[i], points[i + 1]);
    }
    if (closed && points.length > 2) {
      addLine(points[points.length - 1], points[0]);
    }
  };
  const point = (x, y) => ({ x, y });
  const lerp = (a, b, t) => a + (b - a) * t;
  const lerpPoint = (a, b, t) => point(lerp(a.x, b.x, t), lerp(a.y, b.y, t));
  const lineYAtX = (a, b, x) => {
    if (Math.abs(b.x - a.x) < 1e-6) return a.y;
    const t = (x - a.x) / (b.x - a.x);
    return lerp(a.y, b.y, t);
  };
  const roofPointAt = (x, leftBase, ridge, rightBase) => {
    if (x <= ridge.x) {
      return point(x, lineYAtX(leftBase, ridge, x));
    }
    return point(x, lineYAtX(ridge, rightBase, x));
  };
  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

  const leftBase = point(0.04, 1.0);
  const ridge = point(0.5, 0.04);
  const rightBase = point(0.96, 1.0);
  const bottomCenter = point(0.5, 1.0);

  if (family === 'flat') {
    const panels = clamp(segments, 4, 16);
    const corners = [
      point(0, 0),
      point(1, 0),
      point(1, 1),
      point(0, 1)
    ];
    addPolyline(corners, true);

    for (let i = 1; i < panels; i++) {
      const x = i / panels;
      addLine(point(x, 0), point(x, 1));
    }

    const middleIndex = Math.floor(panels / 2);
    const hasCenterPanel = panels % 2 === 1;
    for (let i = 0; i < panels; i++) {
      const x0 = i / panels;
      const x1 = (i + 1) / panels;
      if (hasCenterPanel && i === middleIndex) {
        addLine(point(x0, 0), point(x1, 1));
        addLine(point(x0, 1), point(x1, 0));
      } else if (i < middleIndex) {
        addLine(point(x0, 0), point(x1, 1));
      } else {
        addLine(point(x0, 1), point(x1, 0));
      }
    }
  } else if (family === 'king-post') {
    addPolyline([leftBase, ridge, rightBase]);
    addLine(leftBase, rightBase);
    addLine(ridge, bottomCenter);
  } else if (family === 'queen-post') {
    const leftWeb = roofPointAt(0.32, leftBase, ridge, rightBase);
    const rightWeb = roofPointAt(0.68, leftBase, ridge, rightBase);
    addPolyline([leftBase, ridge, rightBase]);
    addLine(leftBase, rightBase);
    addLine(ridge, bottomCenter);
    addLine(leftWeb, bottomCenter);
    addLine(bottomCenter, rightWeb);
  } else if (family === 'howe') {
    const leftTop = roofPointAt(0.26, leftBase, ridge, rightBase);
    const rightTop = roofPointAt(0.74, leftBase, ridge, rightBase);
    addPolyline([leftBase, ridge, rightBase]);
    addLine(leftBase, rightBase);
    addLine(leftTop, point(0.26, 1));
    addLine(ridge, bottomCenter);
    addLine(rightTop, point(0.74, 1));
    addLine(leftTop, bottomCenter);
    addLine(bottomCenter, rightTop);
  } else if (family === 'scissor') {
    const lowerApex = point(0.5, 0.5);
    const leftLower = point(0.28, lineYAtX(leftBase, lowerApex, 0.28));
    const rightLower = point(0.72, lineYAtX(lowerApex, rightBase, 0.72));
    addPolyline([leftBase, ridge, rightBase]);
    addPolyline([leftBase, lowerApex, rightBase]);
    addLine(ridge, lowerApex);
    addLine(leftLower, roofPointAt(leftLower.x, leftBase, ridge, rightBase));
    addLine(rightLower, roofPointAt(rightLower.x, leftBase, ridge, rightBase));
  } else if (family === 'fink') {
    const bottomLeft = point(0.3, 1);
    const bottomRight = point(0.7, 1);
    const roofLeft = roofPointAt(0.18, leftBase, ridge, rightBase);
    const roofRight = roofPointAt(0.82, leftBase, ridge, rightBase);
    addPolyline([leftBase, ridge, rightBase]);
    addLine(leftBase, rightBase);
    addLine(bottomCenter, ridge);
    addLine(ridge, bottomLeft);
    addLine(ridge, bottomRight);
    addLine(roofLeft, bottomCenter);
    addLine(bottomCenter, roofRight);
  } else if (family === 'attic') {
    const leftWallTop = roofPointAt(0.24, leftBase, ridge, rightBase);
    const rightWallTop = roofPointAt(0.76, leftBase, ridge, rightBase);
    const leftWallBottom = point(0.24, 1);
    const rightWallBottom = point(0.76, 1);
    const atticLeft = point(0.39, 0.28);
    const atticRight = point(0.61, 0.28);
    const atticMid = point(0.5, 0.28);
    addPolyline([leftBase, ridge, rightBase]);
    addLine(leftBase, rightBase);
    addLine(leftWallTop, leftWallBottom);
    addLine(rightWallTop, rightWallBottom);
    addLine(atticLeft, atticRight);
    addLine(atticLeft, ridge);
    addLine(ridge, atticRight);
    addLine(ridge, atticMid);
    addLine(point(0.12, 1), leftWallTop);
    addLine(rightWallTop, point(0.88, 1));
  } else if (family === 'mono') {
    const monoLeft = point(0.04, 1);
    const monoTop = point(0.92, 0.08);
    const monoRight = point(0.92, 1);
    const centerTop = lerpPoint(monoLeft, monoTop, 0.64);
    addPolyline([monoLeft, monoTop, monoRight]);
    addLine(monoLeft, monoRight);
    addLine(centerTop, point(centerTop.x, 1));
    addLine(centerTop, monoRight);
  } else if (family === 'hip') {
    const leftKnee = point(0.28, 0.22);
    const rightKnee = point(0.72, 0.22);
    const centerTop = point(0.5, 0.22);
    addPolyline([leftBase, leftKnee, rightKnee, rightBase]);
    addLine(leftBase, rightBase);
    addLine(leftKnee, point(leftKnee.x, 1));
    addLine(centerTop, bottomCenter);
    addLine(rightKnee, point(rightKnee.x, 1));
    addLine(leftKnee, bottomCenter);
    addLine(bottomCenter, rightKnee);
    addLine(point(0.14, 1), point(0.2, 0.62));
    addLine(point(0.8, 0.62), point(0.86, 1));
  } else if (family === 'gable') {
    const postCount = clamp(segments, 6, 18);
    addPolyline([leftBase, ridge, rightBase]);
    addLine(leftBase, rightBase);
    for (let i = 1; i < postCount; i++) {
      const x = i / postCount;
      addLine(point(x, 1), roofPointAt(x, leftBase, ridge, rightBase));
    }
  } else if (family === 'cathedral') {
    const cathedralRidge = point(0.48, 0.04);
    const valley = point(0.56, 1.0);
    const wingPeak = point(0.74, 0.44);
    const wingEnd = point(0.96, 0.78);
    const leftBraceX = 0.24;
    const leftBraceTop = roofPointAt(leftBraceX, leftBase, cathedralRidge, valley);
    const rightBraceStart = lerpPoint(valley, wingPeak, 0.62);
    const rightBraceEnd = lerpPoint(wingPeak, wingEnd, 0.38);
    addPolyline([leftBase, cathedralRidge, valley]);
    addLine(leftBase, valley);
    addPolyline([valley, wingPeak, wingEnd]);
    addLine(cathedralRidge, valley);
    addLine(leftBraceTop, point(leftBraceX, 1));
    addLine(leftBraceTop, valley);
    addLine(rightBraceStart, rightBraceEnd);
  } else if (family === 'fan') {
    const rayCount = clamp(Math.round(segments / 2), 3, 7);
    addPolyline([leftBase, ridge, rightBase]);
    addLine(leftBase, rightBase);
    addLine(bottomCenter, ridge);
    for (let i = 1; i <= rayCount; i++) {
      const x = 0.5 - (0.38 * i) / (rayCount + 1);
      addLine(bottomCenter, roofPointAt(x, leftBase, ridge, rightBase));
      addLine(bottomCenter, roofPointAt(1 - x, leftBase, ridge, rightBase));
    }
  } else if (family === 'raised-tie') {
    const tieLeft = point(0.28, 0.62);
    const tieRight = point(0.72, 0.62);
    const tieMid = point(0.5, 0.62);
    const roofLeft = roofPointAt(0.34, leftBase, ridge, rightBase);
    const roofRight = roofPointAt(0.66, leftBase, ridge, rightBase);
    addPolyline([leftBase, ridge, rightBase]);
    addLine(tieLeft, tieRight);
    addLine(ridge, tieMid);
    addLine(roofLeft, tieMid);
    addLine(tieMid, roofRight);
  }

  return {
    family,
    thickness,
    segments,
    lines
  };
}

const RUNWAY_BAR_REFERENCE_WIDTH = 500;
const RUNWAY_BAR_REFERENCE_HEIGHT = 36;
const RUNWAY_BAR_RECTS = [
  [0, 0, 500, 1],
  [0, 0, 1, 36],
  [2, 2, 60, 2],
  [162, 8, 20, 3],
  [162, 12, 20, 3],
  [162, 4, 20, 3],
  [92, 2.5, 40, 2.5],
  [92, 7.5, 40, 2.5],
  [92, 12.5, 40, 2.5],
  [92, 26, 40, 2.5],
  [92, 21, 40, 2.5],
  [92, 31, 40, 2.5],
  [368, 2.5, 40, 2.5],
  [368, 7.5, 40, 2.5],
  [368, 12.5, 40, 2.5],
  [368, 26, 40, 2.5],
  [368, 21, 40, 2.5],
  [368, 31, 40, 2.5],
  [212, 7, 20, 8],
  [212, 21, 20, 8],
  [268, 7, 20, 8],
  [268, 21, 20, 8],
  [162, 25, 20, 3],
  [162, 29, 20, 3],
  [162, 21, 20, 3],
  [2, 5, 60, 2],
  [2, 8, 60, 2],
  [2, 11, 60, 2],
  [2, 14, 60, 2],
  [253, 17.5, 17, 1],
  [230, 17.5, 17, 1],
  [207, 17.5, 17, 1],
  [184, 17.5, 17, 1],
  [161, 17.5, 17, 1],
  [138, 17.5, 17, 1],
  [115, 17.5, 17, 1],
  [92, 17.5, 17, 1],
  [69, 17.5, 17, 1],
  [276, 17.5, 17, 1],
  [299, 17.5, 17, 1],
  [322, 17.5, 17, 1],
  [345, 17.5, 17, 1],
  [368, 17.5, 17, 1],
  [391, 17.5, 17, 1],
  [414, 17.5, 17, 1],
  [2, 29, 60, 2],
  [2, 26, 60, 2],
  [2, 23, 60, 2],
  [2, 20, 60, 2],
  [2, 32, 60, 2],
  [0, 35, 500, 1],
  [499, 0, 1, 36],
  [438, 2, 60, 2],
  [438, 5, 60, 2],
  [438, 8, 60, 2],
  [438, 11, 60, 2],
  [438, 14, 60, 2],
  [438, 29, 60, 2],
  [438, 26, 60, 2],
  [438, 23, 60, 2],
  [438, 20, 60, 2],
  [438, 32, 60, 2],
  [318, 8, 20, 3],
  [318, 12, 20, 3],
  [318, 4, 20, 3],
  [318, 25, 20, 3],
  [318, 29, 20, 3],
  [318, 21, 20, 3]
];

function forEachRunwayBarRect(barStartX, barY, exactBarWidth, barHeight, callback) {
  const scaleX = exactBarWidth / RUNWAY_BAR_REFERENCE_WIDTH;
  const scaleY = barHeight / RUNWAY_BAR_REFERENCE_HEIGHT;

  for (let i = 0; i < RUNWAY_BAR_RECTS.length; i++) {
    const [x, y, width, height] = RUNWAY_BAR_RECTS[i];
    callback(
      barStartX + x * scaleX,
      barY + y * scaleY,
      width * scaleX,
      height * scaleY
    );
  }
}

function drawRunwayBarPattern(target, barStartX, barY, exactBarWidth, barHeight, fgColor) {
  const surface = target || window;

  surface.noStroke();
  surface.fill(fgColor);
  if (typeof surface.rectMode === 'function') {
    surface.rectMode(surface.CORNER);
  }

  forEachRunwayBarRect(barStartX, barY, exactBarWidth, barHeight, (x, y, width, height) => {
    surface.rect(x, y, width, height);
  });
}

function createRunwayBarPatternSVG(barStartX, barY, exactBarWidth, barHeight, fgColor) {
  let pattern = '';

  forEachRunwayBarRect(barStartX, barY, exactBarWidth, barHeight, (x, y, width, height) => {
    pattern += `\n    <rect x="${x}" y="${y}" width="${width}" height="${height}" fill="${fgColor}"/>`;
  });

  return pattern;
}

function createBarPatternSVG(config) {
  const {
    currentShader,
    barStartX,
    barY,
    exactBarWidth,
    barHeight,
    fgColor,
    textToBinary,
    textToMorse,
    parseNumericString,
    generateGridCircles,
    generateStaticPackedCircles,
    values
  } = config;

  let pattern = '';

  if (currentShader === 1) {
    const rulerRepeats = parseInt(values.rulerRepeats, 10);
    const rulerUnits = parseInt(values.rulerUnits, 10);
    const rulerTotalTicks = rulerRepeats * rulerUnits + 1;
    const rulerTickWidth = exactBarWidth / (2 * rulerTotalTicks - 1);
    const rulerTickSpacing = rulerTickWidth * 2;

    for (let i = 0; i < rulerTotalTicks; i++) {
      const tickX = barStartX + i * rulerTickSpacing;
      let tickHeight;

      if (i === 0 || i === rulerTotalTicks - 1 || i % rulerUnits === 0) {
        tickHeight = barHeight;
      } else {
        const positionInUnit = i % rulerUnits;
        if (rulerUnits === 10) {
          if (positionInUnit === 5) {
            tickHeight = barHeight * 0.75;
          } else if (positionInUnit % 2 === 0) {
            tickHeight = barHeight * 0.5;
          } else {
            tickHeight = barHeight * 0.25;
          }
        } else if (positionInUnit === Math.floor(rulerUnits / 2)) {
          tickHeight = barHeight * 0.75;
        } else {
          tickHeight = barHeight * 0.5;
        }
      }

      const tickY = barY + barHeight - tickHeight;
      pattern += `\n    <rect x="${tickX}" y="${tickY}" width="${rulerTickWidth}" height="${tickHeight}" fill="${fgColor}"/>`;
    }
    return pattern;
  }

  if (currentShader === 2) {
    const tickerRatio = parseInt(values.tickerRatio, 10);
    const tickerWidthRatio = parseInt(values.tickerWidthRatio, 10);
    const tickerBottomTicks = parseInt(values.tickerRepeats, 10);
    const tickerTopTicks = tickerBottomTicks * tickerRatio;
    const tickerHalfHeight = barHeight / 2;
    const tickerSpacing = exactBarWidth / tickerTopTicks;
    const tickerTopWidth = tickerSpacing / 2;
    const tickerBottomWidth = tickerTopWidth * tickerWidthRatio;

    for (let i = 0; i < tickerTopTicks; i++) {
      const x = barStartX + i * tickerSpacing;
      pattern += `\n    <rect x="${x}" y="${barY}" width="${tickerTopWidth}" height="${tickerHalfHeight}" fill="${fgColor}"/>`;
    }

    for (let i = 0; i < tickerBottomTicks; i++) {
      const topIndex = i * tickerRatio;
      const x = barStartX + topIndex * tickerSpacing;
      pattern += `\n    <rect x="${x}" y="${barY + tickerHalfHeight}" width="${tickerBottomWidth}" height="${tickerHalfHeight}" fill="${fgColor}"/>`;
    }
    return pattern;
  }

  if (currentShader === 3) {
    const binaryText = values.binaryText || 'RPI';
    const binaryDataArray = textToBinary(binaryText);
    if (binaryDataArray.length === 0) {
      return pattern;
    }

    const bitWidth = exactBarWidth / binaryDataArray.length;
    const rowHeight = barHeight / 3;

    for (let i = 0; i < binaryDataArray.length; i++) {
      const x = barStartX + i * bitWidth;
      if (binaryDataArray[i] === 1) {
        pattern += `\n    <rect x="${x}" y="${barY}" width="${bitWidth}" height="${rowHeight}" fill="${fgColor}"/>`;
        pattern += `\n    <rect x="${x}" y="${barY + rowHeight * 2}" width="${bitWidth}" height="${rowHeight}" fill="${fgColor}"/>`;
      } else {
        pattern += `\n    <rect x="${x}" y="${barY + rowHeight}" width="${bitWidth}" height="${rowHeight}" fill="${fgColor}"/>`;
      }
    }
    return pattern;
  }

  if (currentShader === 4) {
    const frequency = parseInt(values.waveformFrequency, 10);
    const waveType = parseFloat(values.waveformType);
    const speed = parseFloat(values.waveformSpeed);
    const time = parseFloat(values.timeSeconds || 0);
    const applyEnvelope = values.waveformEnvelope === true || values.waveformEnvelope === 'true';
    const envType = values.waveformEnvelopeType || 'sine';
    const envWaves = normalizeWaveformEnvelopeWaves(values.waveformEnvelopeWaves);
    const envCenter = parseFloat(values.waveformEnvelopeCenter || 0);
    const bipolar = values.waveformEnvelopeBipolar === true || values.waveformEnvelopeBipolar === 'true';

    const basePoints = Math.max(300, exactBarWidth * 3);
    const frequencyMultiplier = Math.max(1, frequency / 10);
    const points = Math.ceil(basePoints * frequencyMultiplier);

    let pathData = `M ${barStartX} ${barY + barHeight}`;
    for (let i = 0; i <= points; i++) {
      const xPortion = i / points;
      const x = xPortion * exactBarWidth;
      const phase = (xPortion * frequency) - (time * speed);
      let wave = generateWaveValue(phase, waveType);
      wave = applyWaveformEnvelope(wave, {
        applyEnvelope,
        envType,
        envWaves,
        bipolar,
        xPortion
      });
      const y = barY + barHeight * mapWaveformToBarYFraction(wave, envCenter);
      pathData += ` L ${barStartX + x} ${y}`;
    }
    pathData += ` L ${barStartX + exactBarWidth} ${barY + barHeight} Z`;
    pattern += `\n    <path d="${pathData}" fill="${fgColor}"/>`;
    return pattern;
  }

  if (currentShader === 5) {
    const circlesMode = values.circlesMode || 'packing';
    const circlesFill = values.circlesFill || 'stroke';
    let circleData = [];

    if (circlesMode === 'grid') {
      circleData = generateGridCircles(
        exactBarWidth,
        barHeight,
        parseInt(values.circlesRows, 10),
        parseInt(values.circlesGridDensity, 10),
        parseInt(values.circlesSizeVariationY, 10),
        parseInt(values.circlesSizeVariationX, 10),
        parseInt(values.circlesGridOverlap, 10),
        values.circlesLayout
      );
    } else {
      circleData = generateStaticPackedCircles(
        exactBarWidth,
        barHeight,
        parseInt(values.circlesDensity, 10),
        parseInt(values.circlesSizeVariation, 10),
        parseInt(values.circlesOverlap, 10)
      );
    }

    for (let i = 0; i < circleData.length; i++) {
      const circle = circleData[i];
      if (circlesFill === 'fill') {
        pattern += `\n    <circle cx="${barStartX + circle.x}" cy="${barY + circle.y}" r="${circle.r}" fill="${fgColor}"/>`;
      } else {
        pattern += `\n    <circle cx="${barStartX + circle.x}" cy="${barY + circle.y}" r="${circle.r}" fill="none" stroke="${fgColor}" stroke-width="1"/>`;
      }
    }
    return pattern;
  }

  if (currentShader === 6) {
    const numericString = values.numericValue || '3.1415926535897932384626433832795028841971693993751058209749445923078164062862089986280348253421170679';
    const mode = values.numericMode || 'height';
    const digits = parseNumericString(numericString);
    if (digits.length === 0) {
      return pattern;
    }

    const digitWidth = exactBarWidth / digits.length;
    const horizontalGap = 1;
    const dotHeight = 1.5;

    if (mode === 'height') {
      for (let i = 0; i < digits.length; i++) {
        const digit = digits[i];
        if (digit === 10) {
          continue;
        }
        const x = barStartX + i * digitWidth;
        const digitBarHeight = barHeight * mapDigitToHeightPercent(digit);
        const barBottomY = barY + barHeight - digitBarHeight;
        pattern += `\n    <rect x="${x}" y="${barBottomY}" width="${digitWidth}" height="${digitBarHeight}" fill="${fgColor}"/>`;
      }
      return pattern;
    }

    for (let i = 0; i < digits.length; i++) {
      const digit = digits[i];
      const x = barStartX + i * digitWidth;
      const dotWidth = digitWidth - horizontalGap;
      const dotX = x + horizontalGap / 2;

      if (digit === 10) {
        const dotY = barY + barHeight - dotHeight;
        pattern += `\n    <rect x="${dotX}" y="${dotY}" width="${dotWidth}" height="${dotHeight}" rx="${dotHeight / 2}" fill="${fgColor}"/>`;
        continue;
      }
      if (digit <= 0) {
        continue;
      }

      const availableHeight = barHeight - dotHeight;
      for (let dotIndex = 0; dotIndex < digit; dotIndex++) {
        let dotY;
        if (digit === 1) {
          dotY = barY + (barHeight - dotHeight) / 2;
        } else {
          const spacing = availableHeight / (digit - 1);
          dotY = barY + dotIndex * spacing;
        }
        pattern += `\n    <rect x="${dotX}" y="${dotY}" width="${dotWidth}" height="${dotHeight}" rx="${dotHeight / 2}" fill="${fgColor}"/>`;
      }
    }
    return pattern;
  }

  if (currentShader === 7) {
    const text = Object.prototype.hasOwnProperty.call(values, 'morseText') ? values.morseText : 'RPI';
    const validMorseData = typeof textToMorse !== 'undefined' ? textToMorse(text) : [];

    if (validMorseData.length > 0) {
      const bitWidth = exactBarWidth / validMorseData.length;

      let currentRunLength = 0;
      let runStartX = 0;

      for (let i = 0; i < validMorseData.length; i++) {
        if (validMorseData[i] === 1) {
          if (currentRunLength === 0) {
            runStartX = barStartX + i * bitWidth;
          }
          currentRunLength++;
        } else {
          if (currentRunLength > 0) {
            pattern += `\n    <rect x="${runStartX}" y="${barY}" width="${currentRunLength * bitWidth}" height="${barHeight}" fill="${fgColor}"/>`;
            currentRunLength = 0;
          }
        }
      }
      if (currentRunLength > 0) {
        pattern += `\n    <rect x="${runStartX}" y="${barY}" width="${currentRunLength * bitWidth}" height="${barHeight}" fill="${fgColor}"/>`;
      }
    }
    return pattern;
  }

  if (currentShader === 8) {
    return createRunwayBarPatternSVG(barStartX, barY, exactBarWidth, barHeight, fgColor);
  }

  if (currentShader === 9) {
    const trussGeometry = createTrussPatternGeometry({
      barStartX,
      barY,
      exactBarWidth,
      barHeight,
      segments: values.trussSegments,
      thickness: values.trussThickness,
      family: values.trussFamily
    });

    let pathData = '';
    for (let i = 0; i < trussGeometry.lines.length; i++) {
      const line = trussGeometry.lines[i];
      pathData += ` M ${line.x1} ${line.y1} L ${line.x2} ${line.y2}`;
    }

    if (pathData) {
      pattern += `\n    <path d="${pathData}" fill="none" stroke="${fgColor}" stroke-width="${trussGeometry.thickness}" stroke-linecap="square" stroke-linejoin="miter"/>`;
    }

    return pattern;
  }

  if (currentShader === 10) {
    const notesData = values.staffNotes || [];
    const renderData = buildMusicBarRenderData(notesData, {
      barStartX,
      exactBarWidth,
      rectTop: barY,
      rectHeight: barHeight,
      thickness: parseFloat(values.staffThickness || 1),
      noteShape: values.staffNoteShape || 'circle'
    });

    renderData.staffLines.forEach(segment => {
      pattern += `\n    <line x1="${segment.x1}" y1="${segment.y1}" x2="${segment.x2}" y2="${segment.y2}" stroke="${fgColor}" stroke-width="${renderData.lineThickness}"/>`;
    });
    renderData.notes.forEach(noteRender => {
      pattern += `\n    ${createMusicHeadSVG('circle', noteRender.noteX, noteRender.noteY, noteRender.rx, noteRender.ry, true, fgColor, renderData.lineThickness)}`;
    });
    return pattern;
  }

  if (currentShader === 13) {
    const geometry = createLinesPatternGeometry({
      barStartX,
      barY,
      exactBarWidth,
      barHeight,
      variant: values.linesVariant
    });

    for (let i = 0; i < geometry.rects.length; i++) {
      const rect = geometry.rects[i];
      pattern += `\n    <rect x="${rect.x}" y="${rect.y}" width="${rect.width}" height="${rect.height}" fill="${fgColor}"/>`;
    }
    return pattern;
  }

  if (currentShader === 14) {
    const geometry = createPointConnectPatternGeometry({
      barStartX,
      barY,
      exactBarWidth,
      barHeight,
      variant: values.pointConnectVariant
    });

    let pathData = '';
    for (let i = 0; i < geometry.lines.length; i++) {
      const line = geometry.lines[i];
      pathData += ` M ${line.x1} ${line.y1} L ${line.x2} ${line.y2}`;
    }
    if (pathData) {
      pattern += `\n    <path d="${pathData}" fill="none" stroke="${fgColor}" stroke-width="${geometry.thickness}" stroke-linecap="square" stroke-linejoin="miter"/>`;
    }
    return pattern;
  }

  if (currentShader === 23) {
    const geometry = createNeuralNetworkPatternGeometry({
      barStartX,
      barY,
      exactBarWidth,
      barHeight,
      hiddenLayers: values.neuralNetworkHiddenLayers
    });

    let pathData = '';
    for (let i = 0; i < geometry.lines.length; i++) {
      const line = geometry.lines[i];
      pathData += ` M ${line.x1} ${line.y1} L ${line.x2} ${line.y2}`;
    }
    if (pathData) {
      pattern += `\n    <path d="${pathData}" fill="none" stroke="${fgColor}" stroke-width="${geometry.thickness}" stroke-linecap="round" stroke-linejoin="round"/>`;
    }

    for (let i = 0; i < geometry.nodes.length; i++) {
      const node = geometry.nodes[i];
      pattern += `\n    <circle cx="${node.x}" cy="${node.y}" r="${node.r}" fill="${fgColor}"/>`;
    }
    return pattern;
  }

  if (currentShader === 15) {
    const geometry = createTriangleGridPatternGeometry({
      barStartX,
      barY,
      exactBarWidth,
      barHeight,
      variant: values.triangleGridVariant
    });

    let pathData = '';
    for (let i = 0; i < geometry.lines.length; i++) {
      const line = geometry.lines[i];
      pathData += ` M ${line.x1} ${line.y1} L ${line.x2} ${line.y2}`;
    }
    if (pathData) {
      pattern += `\n    <path d="${pathData}" fill="none" stroke="${fgColor}" stroke-width="${geometry.thickness}" stroke-linecap="square" stroke-linejoin="miter"/>`;
    }
    return pattern;
  }

  if (currentShader === 16) {
    const geometry = createCirclesGradientPatternGeometry({
      barStartX,
      barY,
      exactBarWidth,
      barHeight,
      variant: values.circlesGradientVariant
    });

    for (let i = 0; i < geometry.rects.length; i++) {
      const rect = geometry.rects[i];
      pattern += `\n    <rect x="${rect.x}" y="${rect.y}" width="${rect.width}" height="${rect.height}" fill="${fgColor}"/>`;
    }
    for (let i = 0; i < geometry.circles.length; i++) {
      const circle = geometry.circles[i];
      pattern += `\n    <circle cx="${circle.cx}" cy="${circle.cy}" r="${circle.r}" fill="${fgColor}"/>`;
    }
    return pattern;
  }

  if (currentShader === 17) {
    const geometry = createGradientPatternGeometry({
      barStartX,
      barY,
      exactBarWidth,
      barHeight,
      variant: values.gradientVariant
    });

    for (let i = 0; i < geometry.rects.length; i++) {
      const rect = geometry.rects[i];
      pattern += `\n    <rect x="${rect.x}" y="${rect.y}" width="${rect.width}" height="${rect.height}" rx="${rect.radius}" fill="${fgColor}"/>`;
    }
    return pattern;
  }

  if (currentShader === 18) {
    const geometry = createGridPatternGeometry({
      barStartX,
      barY,
      exactBarWidth,
      barHeight,
      variant: values.gridVariant
    });

    let pathData = '';
    for (let i = 0; i < geometry.lines.length; i++) {
      const line = geometry.lines[i];
      pathData += ` M ${line.x1} ${line.y1} L ${line.x2} ${line.y2}`;
    }
    if (pathData) {
      pattern += `\n    <path d="${pathData}" fill="none" stroke="${fgColor}" stroke-width="${geometry.thickness}" stroke-linecap="square" stroke-linejoin="miter"/>`;
    }
    return pattern;
  }

  if (currentShader === 19) {
    const geometry = createTrianglesPatternGeometry({
      barStartX,
      barY,
      exactBarWidth,
      barHeight,
      variant: values.trianglesVariant
    });

    for (let i = 0; i < geometry.polygons.length; i++) {
      const points = geometry.polygons[i].map(point => `${point.x},${point.y}`).join(' ');
      pattern += `\n    <polygon points="${points}" fill="${fgColor}"/>`;
    }
    return pattern;
  }

  if (currentShader === 20) {
    const geometry = createFibonacciPatternGeometry({
      barStartX,
      barY,
      exactBarWidth,
      barHeight
    });

    for (let i = 0; i < geometry.rects.length; i++) {
      const rect = geometry.rects[i];
      pattern += `\n    <rect x="${rect.x}" y="${rect.y}" width="${rect.width}" height="${rect.height}" fill="${fgColor}"/>`;
    }
    return pattern;
  }

  if (currentShader === 21) {
    const geometry = createUnionPatternGeometry({
      barStartX,
      barY,
      exactBarWidth,
      barHeight
    });

    for (let i = 0; i < geometry.topRects.length; i++) {
      const rect = geometry.topRects[i];
      pattern += `\n    <rect x="${rect.x}" y="${rect.y}" width="${rect.width}" height="${rect.height}" fill="${fgColor}"/>`;
    }

    for (let i = 0; i < geometry.lowerPaths.length; i++) {
      const points = geometry.lowerPaths[i].map(point => `${point.x},${point.y}`).join(' ');
      pattern += `\n    <polygon points="${points}" fill="${fgColor}"/>`;
    }
    return pattern;
  }

  if (currentShader === 22) {
    const geometry = createWaveQuantumPatternGeometry({
      barStartX,
      barY,
      exactBarWidth,
      barHeight
    });

    for (let i = 0; i < geometry.paths.length; i++) {
      const points = geometry.paths[i];
      let pathData = '';
      for (let j = 0; j < points.length; j++) {
        pathData += `${j === 0 ? 'M' : ' L'} ${points[j].x} ${points[j].y}`;
      }
      pattern += `\n    <path d="${pathData}" fill="none" stroke="${fgColor}" stroke-width="${geometry.thickness}" stroke-linecap="round" stroke-linejoin="round"/>`;
    }
    return pattern;
  }

  if (currentShader === 11) {
    const text = values.pulseText || 'RPI';
    const intensity = parseFloat(values.pulseIntensity || 5) / 10.0;

    const centerY = barY + barHeight / 2;
    pattern += `\n    <rect x="${barStartX}" y="${centerY - 0.5}" width="${exactBarWidth}" height="1" fill="${fgColor}"/>`;

    if (text.length > 0) {
      const spacing = exactBarWidth / text.length;
      const pulseWidth = Math.max(1, spacing * 0.5);

      for (let i = 0; i < text.length; i++) {
        const charCode = text.charCodeAt(i);
        const normalizedHeight = 0.1 + ((charCode % 15) / 14.0) * 0.9;
        const h = barHeight * normalizedHeight * intensity;

        const x = barStartX + i * spacing + (spacing - pulseWidth) / 2;
        const y = centerY - h / 2;

        pattern += `\n    <rect x="${x}" y="${y}" width="${pulseWidth}" height="${h}" fill="${fgColor}"/>`;
      }
    }
    return pattern;
  }

  if (currentShader === 12) {
    const streamTexts = [];
    const primaryText = (values.graphText || 'RPI').trim() || 'RPI';
    const multiEnabled = values.graphMulti === true || values.graphMulti === 'true';
    if (!multiEnabled) {
      streamTexts.push(primaryText);
    } else {
      const candidateStreams = [
        values.graphText,
        values.graphText2,
        values.graphText3,
        values.graphText4,
        values.graphText5
      ];
      for (let i = 0; i < candidateStreams.length; i++) {
        const value = (candidateStreams[i] || '').trim();
        if (value.length > 0) {
          streamTexts.push(value);
        }
      }
      if (streamTexts.length === 0) {
        streamTexts.push(primaryText);
      }
    }

    const scaleFactor = Math.max(0.4, parseInt(values.graphScale || 10, 10) / 10.0);
    const seriesList = streamTexts.map(text => {
      const source = (text || 'RPI').slice(0, 200);
      const valuesList = [];
      for (let i = 0; i < source.length; i++) {
        valuesList.push(source.charCodeAt(i));
      }
      if (valuesList.length === 1) {
        valuesList.push(valuesList[0]);
      }
      return valuesList;
    });

    let minValue = Infinity;
    let maxValue = -Infinity;
    for (let i = 0; i < seriesList.length; i++) {
      for (let j = 0; j < seriesList[i].length; j++) {
        minValue = Math.min(minValue, seriesList[i][j]);
        maxValue = Math.max(maxValue, seriesList[i][j]);
      }
    }
    if (!isFinite(minValue) || !isFinite(maxValue) || minValue === maxValue) {
      minValue = 0;
      maxValue = 1;
    }

    for (let streamIndex = 0; streamIndex < seriesList.length; streamIndex++) {
      const series = seriesList[streamIndex];
      if (!series || series.length < 2) continue;

      const opacity = seriesList.length > 1 ? Math.max(0.35, 1 - streamIndex * 0.14) : 1;
      const steps = series.length - 1;
      let pathData = '';
      for (let i = 0; i < series.length; i++) {
        const normalized = (series[i] - minValue) / (maxValue - minValue);
        const x = barStartX + (steps === 0 ? 0 : (i / steps) * exactBarWidth);
        const y = barY + barHeight - normalized * barHeight * scaleFactor;
        pathData += `${i === 0 ? 'M' : ' L'} ${x} ${y}`;
      }
      pattern += `\n    <path d="${pathData}" fill="none" stroke="${fgColor}" stroke-width="${seriesList.length > 1 ? 1.6 : 2.2}" stroke-linecap="round" stroke-linejoin="round" stroke-opacity="${opacity}"/>`;
    }
    return pattern;
  }

  return pattern;
}

if (typeof window !== 'undefined') {
  window.applyWaveformEnvelope = applyWaveformEnvelope;
  window.createCirclesGradientPatternGeometry = createCirclesGradientPatternGeometry;
  window.createFibonacciPatternGeometry = createFibonacciPatternGeometry;
  window.createGradientPatternGeometry = createGradientPatternGeometry;
  window.createGridPatternGeometry = createGridPatternGeometry;
  window.createLinesPatternGeometry = createLinesPatternGeometry;
  window.createNeuralNetworkPatternGeometry = createNeuralNetworkPatternGeometry;
  window.createPointConnectPatternGeometry = createPointConnectPatternGeometry;
  window.createTriangleGridPatternGeometry = createTriangleGridPatternGeometry;
  window.createTrussPatternGeometry = createTrussPatternGeometry;
  window.createTrianglesPatternGeometry = createTrianglesPatternGeometry;
  window.createUnionPatternGeometry = createUnionPatternGeometry;
  window.createBarPatternSVG = createBarPatternSVG;
  window.createWaveQuantumPatternGeometry = createWaveQuantumPatternGeometry;
  window.mapWaveformToBarYFraction = mapWaveformToBarYFraction;
  window.normalizeWaveformEnvelopeCenter = normalizeWaveformEnvelopeCenter;
  window.normalizeWaveformEnvelopeWaves = normalizeWaveformEnvelopeWaves;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    applyWaveformEnvelope,
    createBarPatternSVG,
    createCirclesGradientPatternGeometry,
    createFibonacciPatternGeometry,
    createGradientPatternGeometry,
    createGridPatternGeometry,
    createLinesPatternGeometry,
    createNeuralNetworkPatternGeometry,
    createPointConnectPatternGeometry,
    createTriangleGridPatternGeometry,
    createTrussPatternGeometry,
    createTrianglesPatternGeometry,
    createUnionPatternGeometry,
    createWaveQuantumPatternGeometry,
    mapWaveformToBarYFraction,
    normalizeWaveformEnvelopeCenter,
    normalizeWaveformEnvelopeWaves,
    normalizeTrussFamily
  };
}
