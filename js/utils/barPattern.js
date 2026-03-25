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
  const thickness = Math.max(1.5, parseFloat(options.thickness || 2));
  const segments = Math.max(2, parseInt(options.segments || 15, 10));
  const mirrorSegments = options.mirrorSegments === true || options.mirrorSegments === 'true';
  const family = normalizeTrussFamily(options.family);

  const halfThick = thickness / 2;
  const xLeft = barStartX + halfThick;
  const yTop = barY + halfThick;
  const xRight = barStartX + exactBarWidth - halfThick;
  const yBottom = barY + barHeight - halfThick;
  const innerWidth = Math.max(0.1, xRight - xLeft);
  const innerHeight = Math.max(0.1, yBottom - yTop);

  const strokes = [];
  const lines = [];
  const toAbsolute = (point) => ({
    x: xLeft + point.x * innerWidth,
    y: yTop + point.y * innerHeight
  });
  const addStroke = (points, closed = false) => {
    strokes.push({
      closed,
      points: points.map(toAbsolute)
    });
  };
  const addLine = (pointA, pointB) => {
    const a = toAbsolute(pointA);
    const b = toAbsolute(pointB);
    lines.push({ x1: a.x, y1: a.y, x2: b.x, y2: b.y });
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

  const leftBase = point(0.0, 1.0);
  const ridge = point(0.5, 0.0);
  const rightBase = point(1.0, 1.0);
  const bottomCenter = point(0.5, 1.0);

  if (family === 'flat') {
    const panels = clamp(Math.round(segments / 4), 4, 6);
    addStroke([
      point(0, 0),
      point(1, 0),
      point(1, 1),
      point(0, 1)
    ], true);

    for (let i = 1; i < panels; i++) {
      const x = i / panels;
      addLine(point(x, 0), point(x, 1));
    }

    for (let i = 0; i < panels; i++) {
      const x0 = i / panels;
      const x1 = (i + 1) / panels;
      if (mirrorSegments) {
        const middleIndex = Math.floor(panels / 2);
        const hasCenterPanel = panels % 2 === 1;
        if (hasCenterPanel && i === middleIndex) {
          addLine(point(x0, 0), point(x1, 1));
          addLine(point(x0, 1), point(x1, 0));
        } else if (i < middleIndex) {
          addLine(point(x0, 0), point(x1, 1));
        } else {
          addLine(point(x0, 1), point(x1, 0));
        }
      } else if (i % 2 === 0) {
        addLine(point(x0, 0), point(x1, 1));
      } else {
        addLine(point(x0, 1), point(x1, 0));
      }
    }
  } else if (family === 'king-post') {
    addStroke([leftBase, ridge, rightBase]);
    addLine(leftBase, rightBase);
    addLine(ridge, bottomCenter);
  } else if (family === 'queen-post') {
    const leftWeb = roofPointAt(0.28, leftBase, ridge, rightBase);
    const rightWeb = roofPointAt(0.72, leftBase, ridge, rightBase);
    addStroke([leftBase, ridge, rightBase]);
    addLine(leftBase, rightBase);
    addLine(ridge, bottomCenter);
    addLine(leftWeb, bottomCenter);
    addLine(bottomCenter, rightWeb);
  } else if (family === 'howe') {
    const leftTop = roofPointAt(0.24, leftBase, ridge, rightBase);
    const rightTop = roofPointAt(0.76, leftBase, ridge, rightBase);
    addStroke([leftBase, ridge, rightBase]);
    addLine(leftBase, rightBase);
    addLine(leftTop, point(0.26, 1));
    addLine(ridge, bottomCenter);
    addLine(rightTop, point(0.74, 1));
    addLine(leftTop, bottomCenter);
    addLine(bottomCenter, rightTop);
  } else if (family === 'scissor') {
    const lowerApex = point(0.5, 0.46);
    const leftLower = point(0.26, lineYAtX(leftBase, lowerApex, 0.26));
    const rightLower = point(0.74, lineYAtX(lowerApex, rightBase, 0.74));
    addStroke([leftBase, ridge, rightBase]);
    addStroke([leftBase, lowerApex, rightBase]);
    addLine(ridge, lowerApex);
    addLine(leftLower, roofPointAt(leftLower.x, leftBase, ridge, rightBase));
    addLine(rightLower, roofPointAt(rightLower.x, leftBase, ridge, rightBase));
  } else if (family === 'fink') {
    const bottomLeft = point(0.3, 1);
    const bottomRight = point(0.7, 1);
    const roofLeft = roofPointAt(0.18, leftBase, ridge, rightBase);
    const roofRight = roofPointAt(0.82, leftBase, ridge, rightBase);
    addStroke([leftBase, ridge, rightBase]);
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
    const atticLeft = point(0.38, 0.26);
    const atticRight = point(0.62, 0.26);
    const atticMid = point(0.5, 0.26);
    addStroke([leftBase, ridge, rightBase]);
    addLine(leftBase, rightBase);
    addLine(leftWallTop, leftWallBottom);
    addLine(rightWallTop, rightWallBottom);
    addLine(atticLeft, atticRight);
    addStroke([atticLeft, ridge, atticRight]);
    addLine(ridge, atticMid);
    addLine(point(0.1, 1), leftWallTop);
    addLine(rightWallTop, point(0.9, 1));
  } else if (family === 'mono') {
    const monoLeft = point(0.0, 1);
    const monoTop = point(1.0, 0.0);
    const monoRight = point(1.0, 1);
    const centerTop = lerpPoint(monoLeft, monoTop, 0.6);
    addStroke([monoLeft, monoTop, monoRight]);
    addLine(monoLeft, monoRight);
    addLine(centerTop, point(centerTop.x, 1));
    addLine(centerTop, monoRight);
  } else if (family === 'hip') {
    const leftKnee = point(0.28, 0.22);
    const rightKnee = point(0.72, 0.22);
    const centerTop = point(0.5, 0.22);
    addStroke([leftBase, leftKnee, rightKnee, rightBase]);
    addLine(leftBase, rightBase);
    addLine(leftKnee, point(leftKnee.x, 1));
    addLine(centerTop, bottomCenter);
    addLine(rightKnee, point(rightKnee.x, 1));
    addLine(leftKnee, bottomCenter);
    addLine(bottomCenter, rightKnee);
    addLine(point(0.12, 1), point(0.2, 0.62));
    addLine(point(0.8, 0.62), point(0.88, 1));
  } else if (family === 'gable') {
    const postCount = clamp(Math.round(segments / 1.8), 8, 14);
    addStroke([leftBase, ridge, rightBase]);
    addLine(leftBase, rightBase);
    for (let i = 1; i < postCount; i++) {
      const x = i / postCount;
      addLine(point(x, 1), roofPointAt(x, leftBase, ridge, rightBase));
    }
  } else if (family === 'cathedral') {
    const cathedralRidge = point(0.48, 0.0);
    const valley = point(0.56, 1.0);
    const wingPeak = point(0.74, 0.44);
    const wingEnd = point(1.0, 1.0);
    const leftBraceX = 0.22;
    const leftBraceTop = roofPointAt(leftBraceX, leftBase, cathedralRidge, valley);
    const rightHub = point(0.72, 0.58);
    addStroke([leftBase, cathedralRidge, valley]);
    addLine(leftBase, valley);
    addStroke([valley, wingPeak, wingEnd]);
    addLine(cathedralRidge, valley);
    addLine(leftBraceTop, point(leftBraceX, 1));
    addLine(leftBraceTop, valley);
    addLine(valley, rightHub);
    addLine(rightHub, wingPeak);
    addLine(rightHub, point(0.88, 0.72));
  } else if (family === 'fan') {
    const rayCount = clamp(Math.round(segments / 4), 2, 4);
    addStroke([leftBase, ridge, rightBase]);
    addLine(leftBase, rightBase);
    addLine(bottomCenter, ridge);
    addLine(point(0.24, 1), roofPointAt(0.24, leftBase, ridge, rightBase));
    addLine(point(0.76, 1), roofPointAt(0.76, leftBase, ridge, rightBase));
    for (let i = 1; i <= rayCount; i++) {
      const x = 0.12 + (0.32 * i) / (rayCount + 1);
      addLine(bottomCenter, roofPointAt(x, leftBase, ridge, rightBase));
      if (mirrorSegments) {
        addLine(bottomCenter, roofPointAt(1 - x, leftBase, ridge, rightBase));
      } else {
        const rightX = 0.56 + (0.28 * i) / (rayCount + 1);
        addLine(bottomCenter, roofPointAt(rightX, leftBase, ridge, rightBase));
      }
    }
  } else if (family === 'raised-tie') {
    const tieLeft = point(0.24, 0.58);
    const tieRight = point(0.76, 0.58);
    const tieMid = point(0.5, 0.58);
    const roofLeft = roofPointAt(0.34, leftBase, ridge, rightBase);
    const roofRight = roofPointAt(0.66, leftBase, ridge, rightBase);
    addStroke([leftBase, ridge, rightBase]);
    addLine(tieLeft, tieRight);
    addLine(ridge, tieMid);
    addLine(roofLeft, tieMid);
    addLine(tieMid, roofRight);
  }

  return {
    family,
    thickness,
    segments,
    mirrorSegments,
    strokes,
    lines
  };
}

function normalizeGithubContributionLevel(value) {
  const parsed = parseInt(value, 10);
  if (!isFinite(parsed)) {
    return 0;
  }
  return Math.max(0, Math.min(4, parsed));
}

function createSeededGithubContributionGrid(seed = 'RPI', weekCount = 53, rows = 7) {
  const normalizedWeekCount = Math.max(1, parseInt(weekCount || 53, 10));
  const normalizedRows = Math.max(1, parseInt(rows || 7, 10));
  const source = String(seed || 'RPI');
  let state = 0;

  for (let i = 0; i < source.length; i++) {
    state = ((state * 31) + source.charCodeAt(i)) >>> 0;
  }
  if (state === 0) {
    state = 1;
  }

  const columns = [];
  for (let week = 0; week < normalizedWeekCount; week++) {
    const column = [];
    const seasonalBias = (Math.sin((week / Math.max(1, normalizedWeekCount - 1)) * Math.PI * 2 - (Math.PI / 2)) + 1) * 0.5;

    for (let day = 0; day < normalizedRows; day++) {
      state = (state * 1664525 + 1013904223 + week * 17 + day * 29) >>> 0;
      const randomValue = ((state >>> 8) % 1000) / 999;
      const weekendPenalty = day === 0 || day === normalizedRows - 1 ? 0.78 : 1.0;
      const score = randomValue * 0.76 + seasonalBias * 0.48;
      let level = 0;

      if (score > 0.9 * weekendPenalty) {
        level = 4;
      } else if (score > 0.74 * weekendPenalty) {
        level = 3;
      } else if (score > 0.56 * weekendPenalty) {
        level = 2;
      } else if (score > 0.42 * weekendPenalty) {
        level = 1;
      }

      column.push(level);
    }

    columns.push(column);
  }

  return columns;
}

function transposeGithubContributionRows(rowsData, rows) {
  const columnCount = rowsData.reduce((max, row) => Math.max(max, Array.isArray(row) ? row.length : 0), 0);
  const columns = [];

  for (let columnIndex = 0; columnIndex < columnCount; columnIndex++) {
    const column = [];
    for (let rowIndex = 0; rowIndex < rows; rowIndex++) {
      const row = Array.isArray(rowsData[rowIndex]) ? rowsData[rowIndex] : [];
      column.push(normalizeGithubContributionLevel(row[columnIndex]));
    }
    columns.push(column);
  }

  return columns;
}

function compressGithubContributionColumns(columns, targetWeeks, rows) {
  if (columns.length <= targetWeeks) {
    return columns;
  }

  const compressed = [];
  for (let week = 0; week < targetWeeks; week++) {
    const start = Math.floor((week / targetWeeks) * columns.length);
    const end = Math.max(start + 1, Math.floor(((week + 1) / targetWeeks) * columns.length));
    const sourceColumns = columns.slice(start, end);
    const compressedColumn = [];

    for (let day = 0; day < rows; day++) {
      let maxLevel = 0;
      let total = 0;

      for (let index = 0; index < sourceColumns.length; index++) {
        const level = normalizeGithubContributionLevel(sourceColumns[index][day]);
        total += level;
        maxLevel = Math.max(maxLevel, level);
      }

      compressedColumn.push(Math.max(maxLevel, Math.round(total / Math.max(1, sourceColumns.length))));
    }

    compressed.push(compressedColumn);
  }

  return compressed;
}

function normalizeGithubContributionGrid(rawGrid, options = {}) {
  const rows = Math.max(1, parseInt(options.rows || 7, 10));
  const maxWeeks = Math.max(1, parseInt(options.maxWeeks || 53, 10));
  let columns = [];

  if (Array.isArray(rawGrid) && rawGrid.length > 0) {
    const looksRowMajor = rawGrid.length === rows && rawGrid.some(entry => Array.isArray(entry) && entry.length > rows);

    if (looksRowMajor) {
      columns = transposeGithubContributionRows(rawGrid, rows);
    } else {
      columns = rawGrid.map(entry => {
        const source = Array.isArray(entry) ? entry : [];
        return Array.from({ length: rows }, (_, day) => normalizeGithubContributionLevel(source[day]));
      });
    }
  }

  if (columns.length === 0) {
    columns = createSeededGithubContributionGrid('RPI', maxWeeks, rows);
  }

  if (columns.length > maxWeeks) {
    columns = compressGithubContributionColumns(columns, maxWeeks, rows);
  }

  return columns.map(column => Array.from({ length: rows }, (_, day) => normalizeGithubContributionLevel(column[day])));
}

function buildGithubContributionRenderData(options = {}) {
  const barStartX = Number(options.barStartX || 0);
  const barY = Number(options.barY || 0);
  const exactBarWidth = Math.max(1, Number(options.exactBarWidth || 250));
  const barHeight = Math.max(1, Number(options.barHeight || 18));
  const rowCount = 3;
  const grid = normalizeGithubContributionGrid(options.grid, { rows: 7, maxWeeks: 53 });
  const weekCount = Math.max(1, grid.length);
  const gapX = Math.max(0.7, Math.min(1.15, exactBarWidth / Math.max(weekCount * 5.5, 1)));
  const gapY = Math.max(1.1, Math.min(1.7, barHeight / 10.5));
  const totalGapWidth = gapX * Math.max(0, weekCount - 1);
  const maxCellSize = Math.max(2.2, Math.min(4.2, barHeight / 3.9));
  const cellSize = Math.max(1, Math.min(
    (exactBarWidth - totalGapWidth) / weekCount,
    (barHeight - gapY * (rowCount - 1)) / rowCount,
    maxCellSize
  ));
  const totalWidth = weekCount * cellSize + Math.max(0, weekCount - 1) * gapX;
  const totalHeight = rowCount * cellSize + Math.max(0, rowCount - 1) * gapY;
  const startX = barStartX + (exactBarWidth - totalWidth) / 2;
  const startY = barY + (barHeight - totalHeight) / 2;
  const cells = [];

  for (let week = 0; week < weekCount; week++) {
    const levels = Array.isArray(grid[week]) ? grid[week] : [];
    const activeDays = levels.filter(level => normalizeGithubContributionLevel(level) > 0).length;
    const weightedScore = levels.reduce((sum, level) => sum + normalizeGithubContributionLevel(level), 0);
    const level2Plus = levels.filter(level => normalizeGithubContributionLevel(level) >= 2).length;
    const level3Plus = levels.filter(level => normalizeGithubContributionLevel(level) >= 3).length;

    const rowStates = [
      level3Plus >= 1 || weightedScore >= 10,
      activeDays >= 3 || level2Plus >= 2 || weightedScore >= 6,
      activeDays >= 1
    ];

    for (let row = 0; row < rowCount; row++) {
      cells.push({
        x: Math.round((startX + week * (cellSize + gapX)) * 10) / 10,
        y: Math.round((startY + row * (cellSize + gapY)) * 10) / 10,
        size: cellSize,
        filled: rowStates[row]
      });
    }
  }

  return {
    grid,
    weekCount,
    rowCount,
    cellSize,
    cells
  };
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

    const basePoints = Math.max(300, exactBarWidth * 3);
    const frequencyMultiplier = Math.max(1, frequency / 10);
    const points = Math.ceil(basePoints * frequencyMultiplier);

    let pathData = `M ${barStartX} ${barY + barHeight}`;
    for (let i = 0; i <= points; i++) {
      const x = (i / points) * exactBarWidth;
      const phase = ((x / exactBarWidth) * frequency) - (time * speed);
      const wave = generateWaveValue(phase, waveType);
      const y = barY + barHeight * (1.0 - Math.max(0, Math.min(1, wave)));
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

  if (currentShader === 8) {
    const text = values.matrixText || 'RPI';
    const rows = parseInt(values.matrixRows || 3, 10);
    const gap = parseInt(values.matrixGap || 1, 10);
    const binaryDataArray = textToBinary(text);

    if (binaryDataArray.length > 0) {
      const totalGapHeight = Math.max(0, rows - 1) * gap;
      const squareSize = Math.max(1, (barHeight - totalGapHeight) / rows);
      const columns = Math.floor((exactBarWidth + gap) / (squareSize + gap));
      const totalMatrixWidth = columns * squareSize + Math.max(0, columns - 1) * gap;
      const startXOffset = barStartX + (exactBarWidth - totalMatrixWidth) / 2;

      let bitIndex = 0;
      for (let c = 0; c < columns; c++) {
        for (let r = 0; r < rows; r++) {
          const x = startXOffset + c * (squareSize + gap);
          const y = barY + r * (squareSize + gap);
          const bit = binaryDataArray[bitIndex % binaryDataArray.length];
          bitIndex++;

          if (bit === 1) {
            pattern += `\n    <rect x="${x}" y="${y}" width="${squareSize}" height="${squareSize}" fill="${fgColor}"/>`;
          } else {
            pattern += `\n    <rect x="${x}" y="${y}" width="${squareSize}" height="${squareSize}" fill="none" stroke="${fgColor}" stroke-width="0.5"/>`;
          }
        }
      }
    }
    return pattern;
  }

  if (currentShader === 7) {
    const text = values.morseText || 'RPI';
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

  if (currentShader === 9) {
    const trussGeometry = createTrussPatternGeometry({
      barStartX,
      barY,
      exactBarWidth,
      barHeight,
      segments: values.trussSegments,
      mirrorSegments: values.trussMirror,
      thickness: values.trussThickness,
      family: values.trussFamily
    });

    for (let i = 0; i < trussGeometry.strokes.length; i++) {
      const stroke = trussGeometry.strokes[i];
      const points = stroke.points.map(point => `${point.x},${point.y}`).join(' ');
      const tag = stroke.closed ? 'polygon' : 'polyline';
      pattern += `\n    <${tag} points="${points}" fill="none" stroke="${fgColor}" stroke-width="${trussGeometry.thickness}" stroke-linecap="butt" stroke-linejoin="miter"/>`;
    }

    for (let i = 0; i < trussGeometry.lines.length; i++) {
      const line = trussGeometry.lines[i];
      pattern += `\n    <line x1="${line.x1}" y1="${line.y1}" x2="${line.x2}" y2="${line.y2}" fill="none" stroke="${fgColor}" stroke-width="${trussGeometry.thickness}" stroke-linecap="butt" stroke-linejoin="miter"/>`;
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
    renderData.barLines.forEach(segment => {
      pattern += `\n    <line x1="${segment.x1}" y1="${segment.y1}" x2="${segment.x2}" y2="${segment.y2}" stroke="${fgColor}" stroke-width="${renderData.lineThickness}"/>`;
    });
    renderData.notes.forEach(noteRender => {
      noteRender.ledgerLines.forEach(segment => {
        pattern += `\n    <line x1="${segment.x1}" y1="${segment.y1}" x2="${segment.x2}" y2="${segment.y2}" stroke="${fgColor}" stroke-width="${renderData.lineThickness}"/>`;
      });
      noteRender.accidentalLines.forEach(segment => {
        pattern += `\n    <line x1="${segment.x1}" y1="${segment.y1}" x2="${segment.x2}" y2="${segment.y2}" stroke="${fgColor}" stroke-width="${renderData.lineThickness}"/>`;
      });
      pattern += `\n    ${createMusicHeadSVG(noteRender.noteShape, noteRender.noteX, noteRender.noteY, noteRender.rx, noteRender.ry, noteRender.headFill, fgColor, renderData.lineThickness)}`;
      if (noteRender.stem) {
        pattern += `\n    <line x1="${noteRender.stem.x1}" y1="${noteRender.stem.y1}" x2="${noteRender.stem.x2}" y2="${noteRender.stem.y2}" stroke="${fgColor}" stroke-width="${renderData.lineThickness}"/>`;
      }
      noteRender.flags.forEach(segment => {
        pattern += `\n    <line x1="${segment.x1}" y1="${segment.y1}" x2="${segment.x2}" y2="${segment.y2}" stroke="${fgColor}" stroke-width="${renderData.lineThickness}"/>`;
      });
    });
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

  if (currentShader === 13) {
    const renderData = buildGithubContributionRenderData({
      barStartX,
      barY,
      exactBarWidth,
      barHeight,
      grid: values.githubContributionGrid
    });

    renderData.cells.forEach(cell => {
      if (cell.filled) {
        pattern += `\n    <rect x="${cell.x}" y="${cell.y}" width="${cell.size}" height="${cell.size}" fill="${fgColor}"/>`;
      } else {
        pattern += `\n    <rect x="${cell.x}" y="${cell.y}" width="${cell.size}" height="${cell.size}" fill="none" stroke="${fgColor}" stroke-width="0.85"/>`;
      }
    });

    return pattern;
  }

  return pattern;
}

if (typeof window !== 'undefined') {
  window.createTrussPatternGeometry = createTrussPatternGeometry;
  window.normalizeGithubContributionGrid = normalizeGithubContributionGrid;
  window.createSeededGithubContributionGrid = createSeededGithubContributionGrid;
  window.buildGithubContributionRenderData = buildGithubContributionRenderData;
  window.createBarPatternSVG = createBarPatternSVG;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    createBarPatternSVG,
    createTrussPatternGeometry,
    normalizeTrussFamily,
    normalizeGithubContributionGrid,
    createSeededGithubContributionGrid,
    buildGithubContributionRenderData
  };
}
