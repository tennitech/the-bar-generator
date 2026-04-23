// Extracted drawing and export functions

function drawSVGPath(pathData) {
  const commands = pathData.match(/[MLHVCSQTAZ][^MLHVCSQTAZ]*/gi);
  if (!commands) return;

  beginShape();
  let currentX = 0, currentY = 0;
  let startX = 0, startY = 0;

  for (let cmd of commands) {
    const type = cmd[0];
    const coords = cmd.slice(1).trim().match(/[+-]?\d*\.?\d+/g);

    if (!coords && type.toUpperCase() !== 'Z') continue;

    switch (type.toUpperCase()) {
      case 'M':
        if (coords && coords.length >= 2) {
          currentX = parseFloat(coords[0]);
          currentY = parseFloat(coords[1]);
          startX = currentX;
          startY = currentY;
          vertex(currentX, currentY);
        }
        break;
      case 'L':
        if (coords && coords.length >= 2) {
          currentX = parseFloat(coords[0]);
          currentY = parseFloat(coords[1]);
          vertex(currentX, currentY);
        }
        break;
      case 'H':
        if (coords && coords.length >= 1) {
          currentX = parseFloat(coords[0]);
          vertex(currentX, currentY);
        }
        break;
      case 'V':
        if (coords && coords.length >= 1) {
          currentY = parseFloat(coords[0]);
          vertex(currentX, currentY);
        }
        break;
      case 'C':
        if (coords && coords.length >= 6) {
          bezierVertex(
            parseFloat(coords[0]), parseFloat(coords[1]),
            parseFloat(coords[2]), parseFloat(coords[3]),
            parseFloat(coords[4]), parseFloat(coords[5])
          );
          currentX = parseFloat(coords[4]);
          currentY = parseFloat(coords[5]);
        }
        break;
      case 'Z':
        vertex(startX, startY);
        break;
    }
  }
  endShape(CLOSE);
}

function drawSVGPathOnGraphics(pg, pathData) {
  const commands = pathData.match(/[MLHVCSQTAZ][^MLHVCSQTAZ]*/gi);
  if (!commands) return;

  pg.beginShape();
  let currentX = 0, currentY = 0;
  let startX = 0, startY = 0;

  for (let cmd of commands) {
    const type = cmd[0];
    const coords = cmd.slice(1).trim().match(/[+-]?\d*\.?\d+/g);

    if (!coords && type.toUpperCase() !== 'Z') continue;

    switch (type.toUpperCase()) {
      case 'M':
        if (coords && coords.length >= 2) {
          currentX = parseFloat(coords[0]);
          currentY = parseFloat(coords[1]);
          startX = currentX;
          startY = currentY;
          pg.vertex(currentX, currentY);
        }
        break;
      case 'L':
        if (coords && coords.length >= 2) {
          currentX = parseFloat(coords[0]);
          currentY = parseFloat(coords[1]);
          pg.vertex(currentX, currentY);
        }
        break;
      case 'H':
        if (coords && coords.length >= 1) {
          currentX = parseFloat(coords[0]);
          pg.vertex(currentX, currentY);
        }
        break;
      case 'V':
        if (coords && coords.length >= 1) {
          currentY = parseFloat(coords[0]);
          pg.vertex(currentX, currentY);
        }
        break;
      case 'C':
        if (coords && coords.length >= 6) {
          pg.bezierVertex(
            parseFloat(coords[0]), parseFloat(coords[1]),
            parseFloat(coords[2]), parseFloat(coords[3]),
            parseFloat(coords[4]), parseFloat(coords[5])
          );
          currentX = parseFloat(coords[4]);
          currentY = parseFloat(coords[5]);
        }
        break;
      case 'Z':
        pg.vertex(startX, startY);
        break;
    }
  }
  pg.endShape(CLOSE);
}

const lunarBarImageCache = new Map();
const lunarBarPendingColors = new Set();

function normalizeLunarBarColor(value) {
  if (typeof value === 'string' && value.trim()) {
    return value.trim();
  }

  return '#000000';
}

function createColorizedLunarBarDataURI(fgColor) {
  const source = typeof window !== 'undefined' ? window.LUNAR_BAR_SVG_SOURCE : '';
  if (!source) {
    return '';
  }

  const color = normalizeLunarBarColor(fgColor);
  const colorizedSource = source.replace(
    /<svg\b([^>]*)>/i,
    `<svg$1 fill="${color}" color="${color}">`
  );

  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(colorizedSource)}`;
}

function getLunarBarImage(fgColor) {
  const color = normalizeLunarBarColor(fgColor);

  if (lunarBarImageCache.has(color)) {
    return lunarBarImageCache.get(color);
  }

  if (lunarBarPendingColors.has(color) || typeof loadImage !== 'function') {
    return null;
  }

  const dataURI = createColorizedLunarBarDataURI(color);
  if (!dataURI) {
    return null;
  }

  lunarBarPendingColors.add(color);
  loadImage(
    dataURI,
    (imageAsset) => {
      lunarBarPendingColors.delete(color);
      lunarBarImageCache.set(color, imageAsset);
      if (typeof requestUpdate === 'function') {
        requestUpdate();
      }
    },
    (error) => {
      lunarBarPendingColors.delete(color);
      console.warn('Unable to load Lunar bar SVG:', error);
    }
  );

  return null;
}

function drawLunarBarPattern(target, barStartX, barY, exactBarWidth, barHeight, fgColor = '#000000') {
  const surface = target || window;
  const imageAsset = getLunarBarImage(fgColor);

  if (!imageAsset || !imageAsset.width || typeof surface.image !== 'function') {
    return;
  }

  if (typeof surface.push === 'function') surface.push();
  if (typeof surface.imageMode === 'function') {
    const cornerMode = surface.CORNER || (typeof CORNER !== 'undefined' ? CORNER : undefined);
    if (cornerMode !== undefined) surface.imageMode(cornerMode);
  }
  surface.image(imageAsset, barStartX, barY, exactBarWidth, barHeight);
  if (typeof surface.pop === 'function') surface.pop();
}

function drawMusicHeadOnGraphics(pg, shape, x, y, rx, ry, filled, fgColor) {
  const normalizedShape = normalizeMusicNoteShape(shape);

  if (filled) {
    pg.fill(fgColor);
    pg.noStroke();
  } else {
    pg.noFill();
    pg.stroke(fgColor);
  }

  if (normalizedShape === 'circle') {
    pg.circle(x, y, rx * 2);
    return;
  }

  if (normalizedShape === 'square') {
    pg.rectMode(CENTER);
    pg.rect(x, y, rx * 2, ry * 2);
    pg.rectMode(CORNER);
    return;
  }

  pg.beginShape();
  if (normalizedShape === 'diamond') {
    pg.vertex(x, y - ry);
    pg.vertex(x + rx, y);
    pg.vertex(x, y + ry);
    pg.vertex(x - rx, y);
  } else {
    pg.vertex(x, y - ry);
    pg.vertex(x + rx, y + ry);
    pg.vertex(x - rx, y + ry);
  }
  pg.endShape(CLOSE);
}

const EXPORT_REFERENCE_WIDTH = 250;
const EXPORT_REFERENCE_HEIGHT = 151;
const EXPORT_BAR_Y = 134;
const EXPORT_BAR_HEIGHT = 18;
const EXPORT_PADDING = 20;
const PNG_EXPORT_SCALE = 4;
const LOOP_GIF_EXPORT_SCALE = 1.25;
const LOOP_GIF_WORKER_PATH = 'third_party/gif.js/gif.worker.js';
const SVG_EXPORT_WIDTH = typeof REFERENCE_WIDTH === 'number' ? REFERENCE_WIDTH : 250;
const SVG_EXPORT_BAR_Y = typeof REFERENCE_BAR_Y === 'number' ? REFERENCE_BAR_Y : 132.911;
const SVG_EXPORT_BAR_HEIGHT = typeof REFERENCE_BAR_HEIGHT === 'number' ? REFERENCE_BAR_HEIGHT : 18;
const SVG_EXPORT_TOTAL_HEIGHT = typeof REFERENCE_TOTAL_HEIGHT === 'number'
  ? REFERENCE_TOTAL_HEIGHT
  : SVG_EXPORT_BAR_Y + SVG_EXPORT_BAR_HEIGHT;

function createExportGraphicsBuffer(scale) {
  const graphics = createGraphics(
    Math.ceil(EXPORT_REFERENCE_WIDTH * scale) + EXPORT_PADDING * 2,
    Math.ceil(EXPORT_REFERENCE_HEIGHT * scale) + EXPORT_PADDING * 2
  );

  if (typeof graphics.pixelDensity === 'function') {
    graphics.pixelDensity(1);
  }

  return graphics;
}

function drawLoopingRulerPatternOnGraphics(pg, barStartX, barY, exactBarWidth, rectHeight, loopOffsetX) {
  const rulerGeometry = createRulerPatternGeometry({
    barStartX,
    barY,
    exactBarWidth,
    barHeight: rectHeight,
    rulerRepeats: rulerRepeatsSlider ? rulerRepeatsSlider.value : 10,
    rulerUnits: rulerUnitsSlider ? rulerUnitsSlider.value : 4,
    loopOffsetX
  });

  for (let i = 0; i < rulerGeometry.rects.length; i++) {
    const rect = rulerGeometry.rects[i];
    pg.rect(rect.x, rect.y, rect.width, rect.height);
  }
}

function drawLoopingTickerPatternOnGraphics(pg, barStartX, barY, exactBarWidth, rectHeight, loopOffsetX) {
  const tickerGeometry = createTickerPatternGeometry({
    barStartX,
    barY,
    exactBarWidth,
    barHeight: rectHeight,
    tickerRepeats: tickerSlider ? tickerSlider.value : 34,
    tickerRatio: tickerRatioSlider ? tickerRatioSlider.value : 2,
    tickerWidthRatio: tickerWidthRatioSlider ? tickerWidthRatioSlider.value : 2,
    loopOffsetX
  });

  for (let i = 0; i < tickerGeometry.rects.length; i++) {
    const rect = tickerGeometry.rects[i];
    pg.rect(rect.x, rect.y, rect.width, rect.height);
  }
}

function drawExportLogoFrame(pg, options = {}) {
  const scale = typeof options.scale === 'number' ? options.scale : PNG_EXPORT_SCALE;
  const backgroundColor = typeof options.backgroundColor === 'string' ? options.backgroundColor : null;
  const patternOptions = options.patternOptions || {};
  const colorScheme = colors[currentColorMode];
  const fgColor = colorScheme ? colorScheme.fg : '#000000';

  if (backgroundColor) {
    pg.background(backgroundColor);
  } else {
    pg.clear();
  }

  pg.push();
  pg.translate(EXPORT_PADDING, EXPORT_PADDING);
  pg.scale(scale);
  pg.fill(fgColor);
  pg.noStroke();
  drawSVGPathOnGraphics(pg, paths.r);
  drawSVGPathOnGraphics(pg, paths.p);
  drawSVGPathOnGraphics(pg, paths.i);

  if (currentShader === 0) {
    const cornerSize = 1.5;
    pg.beginShape();
    pg.vertex(cornerSize, EXPORT_BAR_Y);
    pg.vertex(EXPORT_REFERENCE_WIDTH - cornerSize, EXPORT_BAR_Y);
    pg.vertex(EXPORT_REFERENCE_WIDTH, EXPORT_BAR_Y + cornerSize);
    pg.vertex(EXPORT_REFERENCE_WIDTH, EXPORT_BAR_Y + EXPORT_BAR_HEIGHT - cornerSize);
    pg.vertex(EXPORT_REFERENCE_WIDTH - cornerSize, EXPORT_BAR_Y + EXPORT_BAR_HEIGHT);
    pg.vertex(cornerSize, EXPORT_BAR_Y + EXPORT_BAR_HEIGHT);
    pg.vertex(0, EXPORT_BAR_Y + EXPORT_BAR_HEIGHT - cornerSize);
    pg.vertex(0, EXPORT_BAR_Y + cornerSize);
    pg.endShape(pg.CLOSE);
  } else {
    drawBarPatternOnGraphics(
      pg,
      0,
      EXPORT_BAR_Y,
      EXPORT_REFERENCE_WIDTH,
      EXPORT_BAR_HEIGHT,
      patternOptions
    );
  }

  pg.pop();
}

function drawBarPatternOnGraphics(pg, barStartX, barY, exactBarWidth, rectHeight, options = {}) {
  // Get current foreground color
  const colorScheme = colors[currentColorMode];
  const fgColor = colorScheme ? colorScheme.fg : '#000000';
  const currentMotionStyle = typeof getCurrentMotionStyle === 'function' ? getCurrentMotionStyle() : null;
  const fallbackLoopState = typeof getLoopAnimationStateForStyle === 'function'
    ? getLoopAnimationStateForStyle(currentMotionStyle, exactBarWidth)
    : null;
  const loopOffsetX = typeof options.loopOffsetX === 'number'
    ? options.loopOffsetX
    : ((currentShader === 1 || currentShader === 2) && fallbackLoopState ? fallbackLoopState.loopOffsetX : null);
  const timeSeconds = typeof options.timeSeconds === 'number'
    ? options.timeSeconds
    : (currentShader === 4 && fallbackLoopState ? fallbackLoopState.timeSeconds : null);

  pg.fill(fgColor);
  pg.noStroke();
  pg.rectMode(CORNER);

  if (currentShader === 0) {
    // Solid bar
    pg.rect(barStartX, barY, exactBarWidth, rectHeight);
  } else if (currentShader === 1) {
    const rulerGeometry = createRulerPatternGeometry({
      barStartX,
      barY,
      exactBarWidth,
      barHeight: rectHeight,
      rulerRepeats: rulerRepeatsSlider ? rulerRepeatsSlider.value : 10,
      rulerUnits: rulerUnitsSlider ? rulerUnitsSlider.value : 4,
      loopOffsetX
    });

    for (let i = 0; i < rulerGeometry.rects.length; i++) {
      const rect = rulerGeometry.rects[i];
      pg.rect(rect.x, rect.y, rect.width, rect.height);
    }
  } else if (currentShader === 2) {
    const tickerGeometry = createTickerPatternGeometry({
      barStartX,
      barY,
      exactBarWidth,
      barHeight: rectHeight,
      tickerRepeats: tickerSlider ? tickerSlider.value : 34,
      tickerRatio: tickerRatioSlider ? tickerRatioSlider.value : 2,
      tickerWidthRatio: tickerWidthRatioSlider ? tickerWidthRatioSlider.value : 2,
      loopOffsetX
    });

    for (let i = 0; i < tickerGeometry.rects.length; i++) {
      const rect = tickerGeometry.rects[i];
      pg.rect(rect.x, rect.y, rect.width, rect.height);
    }
  } else if (currentShader === 3) {
    // Binary pattern
    const binaryText = binaryInput.value || "RPI";
    const binaryDataArray = textToBinary(binaryText);

    if (binaryDataArray.length > 0) {
      const bitWidth = exactBarWidth / binaryDataArray.length;
      const binaryRowHeight = rectHeight / 3;
      const binaryTopRowY = barY;
      const binaryMiddleRowY = barY + binaryRowHeight;
      const binaryBottomRowY = barY + binaryRowHeight * 2;

      for (let i = 0; i < binaryDataArray.length; i++) {
        const x = barStartX + i * bitWidth;

        if (binaryDataArray[i] === 1) {
          pg.rect(x, binaryTopRowY, bitWidth, binaryRowHeight);
          pg.rect(x, binaryBottomRowY, bitWidth, binaryRowHeight);
        } else {
          // 0 = single bar in middle row
          pg.rect(x, binaryMiddleRowY, bitWidth, binaryRowHeight);
        }
      }
    }
  } else if (currentShader === 4) {
    // Waveform pattern
    const frequency = parseInt(waveformFrequencySlider.value);
    const waveType = parseFloat(waveformTypeSlider.value);
    const speed = parseFloat(waveformSpeedSlider.value);
    const time = timeSeconds !== null
      ? timeSeconds
      : (typeof window.animationTime !== 'undefined' ? window.animationTime : millis() / 1000.0);
    const points = typeof getWaveformRenderPointCount === 'function'
      ? getWaveformRenderPointCount(exactBarWidth, frequency)
      : Math.max(240, Math.min(1200, Math.max(Math.ceil(exactBarWidth * 2), frequency * 12)));
    const envelopeSettings = typeof getWaveformEnvelopeSettings === 'function'
      ? getWaveformEnvelopeSettings()
      : {
        applyEnvelope: !!(waveformEnvelopeToggle && waveformEnvelopeToggle.checked),
        envType: waveformEnvelopeType ? waveformEnvelopeType.value : 'sine',
        envWaves: waveformEnvelopeWavesSlider ? Math.max(1, Math.min(10, Math.round(parseFloat(waveformEnvelopeWavesSlider.value)) || 1)) : 1,
        envCenter: waveformEnvelopeCenterSlider ? parseFloat(waveformEnvelopeCenterSlider.value) : 0,
        bipolar: !!(waveformEnvelopeBipolarToggle && waveformEnvelopeBipolarToggle.checked)
      };

    pg.fill(fgColor);
    pg.noStroke();

    // Draw as a filled polygon
    pg.beginShape();

    // Start from bottom-left corner
    pg.vertex(barStartX, barY + rectHeight);

    // Generate the waveform curve
    for (let i = 0; i <= points; i++) {
      const xPortion = i / points;
      const x = xPortion * exactBarWidth;

      // Standard rolling phase calculation (horizontal movement only)
      let rawPhase = (xPortion * frequency) - (time * speed);

      // Fix tiny floating point inaccuracies
      rawPhase = Math.round(rawPhase * 1000000) / 1000000;

      let wave = typeof generateWaveformValue === 'function'
        ? generateWaveformValue(rawPhase, waveType)
        : (() => {
          const wrappedPhase = ((rawPhase % 1) + 1) % 1;
          const sine = (Math.sin(wrappedPhase * 2 * Math.PI - Math.PI / 2) + 1) * 0.5;
          const saw = wrappedPhase;
          const square = wrappedPhase > 0.5 ? 1.0 : 0.0;
          const pulse = wrappedPhase > 0.8 ? 1.0 : 0.0;
          if (waveType < 1.0) return sine + (saw - sine) * waveType;
          if (waveType < 2.0) return saw + (square - saw) * (waveType - 1.0);
          return square + (pulse - square) * (waveType - 2.0);
        })();

      if (typeof applyWaveformEnvelope === 'function') {
        wave = applyWaveformEnvelope(wave, {
          applyEnvelope: envelopeSettings.applyEnvelope,
          envType: envelopeSettings.envType,
          envWaves: envelopeSettings.envWaves,
          bipolar: envelopeSettings.bipolar,
          xPortion
        });
      }

      const normalizedY = typeof mapWaveformToBarYFraction === 'function'
        ? mapWaveformToBarYFraction(wave, envelopeSettings.envCenter)
        : (1.0 - Math.max(0, Math.min(1, wave)));
      const y = barY + rectHeight * normalizedY;

      pg.vertex(barStartX + x, y);
    }

    // Complete the polygon by going to bottom-right corner
    pg.vertex(barStartX + exactBarWidth, barY + rectHeight);

    pg.endShape(pg.CLOSE);
  } else if (currentShader === 5) {
    // Circles pattern
    const density = parseInt(circlesDensitySlider.value);
    const sizeVariation = parseInt(circlesSizeVariationSlider.value);
    const fillStyle = circlesFillSelect.value;

    pg.fill(fillStyle === 'fill' ? fgColor : 'transparent');
    pg.stroke(fillStyle === 'stroke' ? fgColor : 'transparent');
    pg.strokeWeight(1);

    drawCirclePattern(pg, barStartX, barY, exactBarWidth, rectHeight, density, sizeVariation);
  } else if (currentShader === 6) {
    // Numeric pattern - get visualization mode
    const numericString = numericInput.value || "3.1415926535897932384626433832795028841971693993751058209749445923078164062862089986280348253421170679";
    const digits = parseNumericString(numericString);
    const mode = numericModeSelect ? numericModeSelect.value : 'height';

    if (digits.length > 0) {
      const digitWidth = exactBarWidth / digits.length;

      if (mode === 'height') {
        // Height Encoding mode - digit height bars with inner stroke
        for (let i = 0; i < digits.length; i++) {
          const digit = digits[i];
          const x = barStartX + i * digitWidth;

          // Skip decimal points (value 10) - they create spacing
          if (digit === 10) {
            continue;
          }

          // Map digits 0-9 to height percentages
          let heightPercent = 0.0;
          switch (digit) {
            case 0: heightPercent = 0.1; break;  // 10%
            case 1: heightPercent = 0.2; break;  // 20%
            case 2: heightPercent = 0.3; break;  // 30%
            case 3: heightPercent = 0.4; break;  // 40%
            case 4: heightPercent = 0.5; break;  // 50%
            case 5: heightPercent = 0.6; break;  // 60%
            case 6: heightPercent = 0.7; break;  // 70%
            case 7: heightPercent = 0.8; break;  // 80%
            case 8: heightPercent = 0.9; break;  // 90%
            case 9: heightPercent = 1.0; break;  // 100%
          }

          const barHeight = rectHeight * heightPercent;
          const barBottomY = barY + rectHeight - barHeight; // Position from bottom

          pg.rect(x, barBottomY, digitWidth, barHeight);
        }
      } else if (mode === 'dotmatrix') {
        // Dot Matrix mode - dots distributed evenly across the full height of the bar
        const horizontalGap = 1; // Minimum gap between digit columns
        const dotHeight = 1.5; // Height of each dot

        for (let i = 0; i < digits.length; i++) {
          const digit = digits[i];
          const x = barStartX + i * digitWidth;

          // Handle decimal points (value 10) - render as bottom-aligned rounded rectangle
          if (digit === 10) {
            const dotWidth = digitWidth - horizontalGap;
            const dotX = x + horizontalGap / 2;
            const dotY = barY + rectHeight - dotHeight; // Position at bottom

            pg.rect(dotX, dotY, dotWidth, dotHeight, dotHeight / 2);
            continue;
          }

          // Calculate dot width to stretch across most of the digit column width
          // Leave half the horizontal gap on each side
          const dotWidth = digitWidth - horizontalGap;
          const dotX = x + horizontalGap / 2;

          // For digits > 0, distribute dots evenly across the full bar height
          if (digit > 0) {
            // Calculate the available space for dots
            const availableHeight = rectHeight - dotHeight; // Reserve space for dot height

            // Distribute dots evenly across the available height
            for (let dotIndex = 0; dotIndex < digit; dotIndex++) {
              let dotY;

              if (digit === 1) {
                // Single dot: center it vertically
                dotY = barY + (rectHeight - dotHeight) / 2;
              } else {
                // Multiple dots: distribute evenly from top to bottom
                const spacing = availableHeight / (digit - 1);
                dotY = barY + dotIndex * spacing;
              }

              // Use rounded rectangle that stretches across the digit width
              pg.rect(dotX, dotY, dotWidth, dotHeight, dotHeight / 2);
            }
          }
        }
      }
    }
  } else if (currentShader === 7) {
    // Morse code mode
    const text = typeof morseInput !== 'undefined' && morseInput ? morseInput.value : "RPI";
    const validMorseData = typeof textToMorse !== 'undefined' ? textToMorse(text) : [];

    if (validMorseData && validMorseData.length > 0) {
      const actualBitWidth = exactBarWidth / validMorseData.length;
      let currentRunLength = 0;
      let runStartX = 0;

      for (let i = 0; i < validMorseData.length; i++) {
        if (validMorseData[i] === 1) {
          if (currentRunLength === 0) {
            runStartX = barStartX + i * actualBitWidth;
          }
          currentRunLength++;
        } else {
          if (currentRunLength > 0) {
            pg.rect(runStartX, barY, currentRunLength * actualBitWidth, rectHeight);
            currentRunLength = 0;
          }
        }
      }
      if (currentRunLength > 0) {
        pg.rect(runStartX, barY, currentRunLength * actualBitWidth, rectHeight);
      }
    }
  } else if (currentShader === 8) {
    // Runway pattern sourced from the Flying Club bar asset.
    drawRunwayBarPattern(pg, barStartX, barY, exactBarWidth, rectHeight, fgColor);
  } else if (currentShader === 24) {
    // Lunar pattern sourced from the Artemis bar asset.
    drawLunarBarPattern(pg, barStartX, barY, exactBarWidth, rectHeight, fgColor);
  } else if (currentShader === 9) {
    // Truss / Geometric pattern
    const trussGeometry = createTrussPatternGeometry({
      barStartX,
      barY,
      exactBarWidth,
      barHeight: rectHeight,
      segments: trussSegmentsSlider ? trussSegmentsSlider.value : 15,
      thickness: trussThicknessSlider ? trussThicknessSlider.value : 2,
      family: trussFamilySelect ? trussFamilySelect.value : 'flat'
    });

    pg.noFill();
    pg.stroke(fgColor);
    pg.strokeWeight(trussGeometry.thickness);
    pg.strokeCap(pg.SQUARE);
    pg.strokeJoin(pg.MITER);

    for (let i = 0; i < trussGeometry.lines.length; i++) {
      const lineSegment = trussGeometry.lines[i];
      pg.line(lineSegment.x1, lineSegment.y1, lineSegment.x2, lineSegment.y2);
    }
  } else if (currentShader === 10) {
    // Staff Notation pattern
    const notesData = typeof currentStaffNotes !== 'undefined' ? currentStaffNotes : [];
    const renderData = buildMusicBarRenderData(notesData, {
      barStartX,
      exactBarWidth,
      rectTop: barY,
      rectHeight,
      thickness: 1,
      noteShape: typeof getSelectedMusicNoteShape === 'function' ? getSelectedMusicNoteShape() : 'circle'
    });

    pg.stroke(fgColor);
    pg.strokeWeight(renderData.lineThickness);
    renderData.staffLines.forEach(segment => pg.line(segment.x1, segment.y1, segment.x2, segment.y2));
    renderData.barLines.forEach(segment => pg.line(segment.x1, segment.y1, segment.x2, segment.y2));
    renderData.notes.forEach(noteRender => {
      pg.stroke(fgColor);
      pg.strokeWeight(renderData.lineThickness);
      noteRender.ledgerLines.forEach(segment => pg.line(segment.x1, segment.y1, segment.x2, segment.y2));
      noteRender.accidentalLines.forEach(segment => pg.line(segment.x1, segment.y1, segment.x2, segment.y2));
      drawMusicHeadOnGraphics(pg, noteRender.noteShape, noteRender.noteX, noteRender.noteY, noteRender.rx, noteRender.ry, noteRender.headFill, fgColor);
      pg.stroke(fgColor);
      pg.strokeWeight(renderData.lineThickness);
      if (noteRender.stem) {
        pg.line(noteRender.stem.x1, noteRender.stem.y1, noteRender.stem.x2, noteRender.stem.y2);
      }
      noteRender.flags.forEach(segment => pg.line(segment.x1, segment.y1, segment.x2, segment.y2));
    });
  } else if (currentShader === 11) {
    // Pulse / Centerline pattern
    const text = pulseInput ? pulseInput.value || "RPI" : "RPI";
    const intensity = parseFloat(pulseIntensitySlider ? pulseIntensitySlider.value : 5) / 10.0;

    pg.noStroke();
    pg.fill(fgColor);

    const centerY = barY + rectHeight / 2;
    pg.rect(barStartX, centerY - 0.5, exactBarWidth, 1);

    if (text.length > 0) {
      const spacing = exactBarWidth / text.length;
      const pulseWidth = Math.max(1, spacing * 0.5);

      for (let i = 0; i < text.length; i++) {
        const charCode = text.charCodeAt(i);
        const normalizedHeight = 0.1 + ((charCode % 15) / 14.0) * 0.9;
        const h = rectHeight * normalizedHeight * intensity;

        const x = barStartX + i * spacing + (spacing - pulseWidth) / 2;
        const y = centerY - h / 2;

        pg.rect(x, y, pulseWidth, h);
      }
    }
  } else if (currentShader === 12) {
    // Data Graph / Continuous line graph
    const inputElements = [graphInput, graphInput2, graphInput3, graphInput4, graphInput5].filter(Boolean);
    const multiEnabled = graphMultiToggle && graphMultiToggle.checked;
    const streamTexts = [];
    if (inputElements.length > 0) {
      const primaryText = (inputElements[0].value || 'RPI').trim() || 'RPI';
      if (!multiEnabled) {
        streamTexts.push(primaryText);
      } else {
        for (let i = 0; i < inputElements.length; i++) {
          const value = (inputElements[i].value || '').trim();
          if (value.length > 0) streamTexts.push(value);
        }
        if (streamTexts.length === 0) streamTexts.push(primaryText);
      }
    } else {
      streamTexts.push('RPI');
    }

    const scaleFactor = Math.max(0.4, parseInt(graphScaleSlider ? graphScaleSlider.value : 10, 10) / 10.0);
    const seriesList = streamTexts.map(text => {
      const chars = (text || 'RPI').slice(0, 200);
      const values = [];
      for (let i = 0; i < chars.length; i++) values.push(chars.charCodeAt(i));
      if (values.length === 1) values.push(values[0]);
      return values;
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

    pg.noFill();
    const baseColor = color(fgColor);
    for (let streamIndex = 0; streamIndex < seriesList.length; streamIndex++) {
      const series = seriesList[streamIndex];
      if (!series || series.length < 2) continue;

      const alpha = seriesList.length > 1 ? Math.max(80, 255 - streamIndex * 30) : 255;
      baseColor.setAlpha(alpha);
      pg.stroke(baseColor);
      pg.strokeWeight(seriesList.length > 1 ? 1.6 : 2.2);
      pg.strokeJoin(ROUND);

      const steps = series.length - 1;
      pg.beginShape();
      for (let i = 0; i < series.length; i++) {
        const normalized = (series[i] - minValue) / (maxValue - minValue);
        const x = barStartX + (steps === 0 ? 0 : (i / steps) * exactBarWidth);
        const y = barY + rectHeight - normalized * rectHeight * scaleFactor;
        pg.vertex(x, y);
      }
      pg.endShape();
    }
  } else if (currentShader === 23) {
    // Neural network pattern
    const geometry = createNeuralNetworkPatternGeometry({
      barStartX,
      barY,
      exactBarWidth,
      barHeight: rectHeight,
      hiddenLayers: neuralNetworkHiddenLayersSlider ? neuralNetworkHiddenLayersSlider.value : 1
    });

    pg.noFill();
    pg.stroke(fgColor);
    pg.strokeWeight(geometry.thickness);
    pg.strokeCap(pg.ROUND);
    pg.strokeJoin(pg.ROUND);

    for (let i = 0; i < geometry.lines.length; i++) {
      const lineSegment = geometry.lines[i];
      pg.line(lineSegment.x1, lineSegment.y1, lineSegment.x2, lineSegment.y2);
    }

    pg.noStroke();
    pg.fill(fgColor);
    for (let i = 0; i < geometry.nodes.length; i++) {
      const node = geometry.nodes[i];
      pg.circle(node.x, node.y, node.r * 2);
    }
  }
}

function drawCirclePattern(pg, barStartX, barY, barWidth, barHeight, density, sizeVariation) {
  try {
    const circlesFill = circlesFillSelect ? circlesFillSelect.value : 'stroke';

    const params = `packing-${circlesFill}-${density}-${sizeVariation}-${barWidth}-${barHeight}`;

    // Only regenerate if parameters changed
    if (!staticCircleData || lastCircleParams !== params) {
      staticCircleData = ensureStaticCirclePatternCoverage(
        generateStaticPackedCircles(barWidth, barHeight, density, sizeVariation),
        barWidth,
        barHeight
      );
      lastCircleParams = params;
    }

    // Safety check for data validity
    if (!staticCircleData || staticCircleData.length === 0) {
      console.warn('No valid circle data generated');
      return;
    }

    const ctx = pg ? pg.drawingContext : (typeof drawingContext !== 'undefined' ? drawingContext : null);
    const canUseNativeClip = Boolean(
      ctx &&
      typeof ctx.save === 'function' &&
      typeof ctx.beginPath === 'function' &&
      typeof ctx.rect === 'function' &&
      typeof ctx.clip === 'function' &&
      typeof ctx.restore === 'function'
    );

    if (canUseNativeClip) {
      ctx.save();
      ctx.beginPath();
      ctx.rect(barStartX, barY, barWidth, barHeight);
      ctx.clip();
    }

    try {
      // Draw circles using the cached static data
      for (let i = 0; i < staticCircleData.length; i++) {
        const circle = staticCircleData[i];

        // Safety check for valid circle data
        if (!circle || typeof circle.x !== 'number' || typeof circle.y !== 'number' || typeof circle.r !== 'number') {
          continue;
        }

        const drawableCircle = canUseNativeClip
          ? circle
          : fitCircleWithinBar(circle, barWidth, barHeight);
        if (!drawableCircle) {
          continue;
        }

        if (pg) {
          pg.ellipse(
            barStartX + drawableCircle.x,
            barY + drawableCircle.y,
            drawableCircle.r * 2,
            drawableCircle.r * 2
          );
        } else {
          ellipse(
            barStartX + drawableCircle.x,
            barY + drawableCircle.y,
            drawableCircle.r * 2,
            drawableCircle.r * 2
          );
        }
      }
    } finally {
      if (canUseNativeClip) {
        ctx.restore();
      }
    }
  } catch (error) {
    console.error('Error in drawCirclePattern:', error);
    // Draw a simple fallback pattern
    if (pg) {
      pg.ellipse(barStartX + barWidth / 2, barY + barHeight / 2, Math.min(barWidth, barHeight) * 0.8, Math.min(barWidth, barHeight) * 0.8);
    } else {
      ellipse(barStartX + barWidth / 2, barY + barHeight / 2, Math.min(barWidth, barHeight) * 0.8, Math.min(barWidth, barHeight) * 0.8);
    }
  }
}

function fitCircleWithinBar(circle, barWidth, barHeight) {
  if (!circle || !Number.isFinite(circle.x) || !Number.isFinite(circle.y) || !Number.isFinite(circle.r)) {
    return null;
  }

  const initialRadius = Math.max(0.5, circle.r);
  const safeX = Math.max(initialRadius, Math.min(barWidth - initialRadius, circle.x));
  const safeY = Math.max(initialRadius, Math.min(barHeight - initialRadius, circle.y));
  const safeRadius = Math.min(initialRadius, safeX, barWidth - safeX, safeY, barHeight - safeY);

  if (!Number.isFinite(safeRadius) || safeRadius < 0.5) {
    return null;
  }

  return {
    x: safeX,
    y: safeY,
    r: safeRadius
  };
}

function ensureStaticCirclePatternCoverage(circles, barWidth, barHeight) {
  if (!Array.isArray(circles) || barWidth <= 0 || barHeight <= 0) {
    return [];
  }

  const validCircles = circles
    .filter((circle) => circle &&
      Number.isFinite(circle.x) &&
      Number.isFinite(circle.y) &&
      Number.isFinite(circle.r) &&
      circle.r > 0)
    .map((circle) => ({
      x: Math.max(0, Math.min(barWidth, circle.x)),
      y: Math.max(0, Math.min(barHeight, circle.y)),
      r: Math.max(0.5, Math.min(circle.r, Math.max(barWidth, barHeight)))
    }));

  if (validCircles.length === 0) {
    return createFullBleedCircleFallback(barWidth, barHeight, barHeight * 0.25);
  }

  const radius = getRepresentativeCircleRadius(validCircles, barHeight);
  const minCircleCount = Math.max(8, Math.ceil(barWidth / Math.max(6, radius * 3.2)));

  if (validCircles.length < minCircleCount * 0.35) {
    return createFullBleedCircleFallback(barWidth, barHeight, radius);
  }

  const coveredCircles = validCircles.slice();
  addMissingCircleEdgeCoverage(coveredCircles, barWidth, barHeight, radius);
  return coveredCircles;
}

function getRepresentativeCircleRadius(circles, barHeight) {
  const radii = circles
    .map((circle) => circle.r)
    .filter((radius) => Number.isFinite(radius) && radius > 0)
    .sort((a, b) => a - b);
  const medianRadius = radii.length > 0 ? radii[Math.floor(radii.length / 2)] : barHeight * 0.25;
  return Math.max(1.25, Math.min(barHeight * 0.36, medianRadius));
}

function getDeterministicCircleNoise(index, seed) {
  const value = Math.sin((index + 1) * 12.9898 + seed * 78.233) * 43758.5453123;
  return value - Math.floor(value);
}

function clampCircleValue(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function fitCircleToBounds(x, y, r, barWidth, barHeight) {
  const maxRadius = Math.max(0.6, Math.min(barWidth, barHeight) * 0.5);
  const safeRadius = clampCircleValue(r, 0.6, maxRadius);
  const safeX = clampCircleValue(x, safeRadius, Math.max(safeRadius, barWidth - safeRadius));
  const safeY = clampCircleValue(y, safeRadius, Math.max(safeRadius, barHeight - safeRadius));
  const fittedRadius = Math.min(safeRadius, safeX, barWidth - safeX, safeY, barHeight - safeY);

  if (!Number.isFinite(fittedRadius) || fittedRadius < 0.5) {
    return null;
  }

  return {
    x: safeX,
    y: safeY,
    r: fittedRadius
  };
}

function createFullBleedCircleFallback(barWidth, barHeight, radius) {
  const circles = [];
  const safeRadius = Math.max(1.15, Math.min(barHeight * 0.32, radius));
  const count = Math.max(28, Math.ceil(barWidth / Math.max(3, safeRadius * 1.35)) * 2);

  for (let i = 0; i < count; i++) {
    const progress = (i + 0.5) / count;
    const sizeNoise = getDeterministicCircleNoise(i, 1);
    const accentNoise = getDeterministicCircleNoise(i, 2);
    const jitterNoise = getDeterministicCircleNoise(i, 3);
    const yNoise = getDeterministicCircleNoise(i, 4);
    let circleRadius = safeRadius * (0.2 + sizeNoise * 0.95);

    if (accentNoise > 0.82) {
      circleRadius *= 1.35;
    }

    circleRadius = clampCircleValue(circleRadius, 0.6, barHeight * 0.34);
    const jitterX = (jitterNoise - 0.5) * (barWidth / count) * 1.8;
    const circle = fitCircleToBounds(
      progress * barWidth + jitterX,
      circleRadius + yNoise * Math.max(0, barHeight - circleRadius * 2),
      circleRadius,
      barWidth,
      barHeight
    );

    if (circle) {
      circles.push(circle);
    }
  }

  return circles;
}

function addMissingCircleEdgeCoverage(circles, barWidth, barHeight, radius) {
  const bounds = circles.reduce((acc, circle) => ({
    left: Math.min(acc.left, circle.x - circle.r),
    right: Math.max(acc.right, circle.x + circle.r),
    top: Math.min(acc.top, circle.y - circle.r),
    bottom: Math.max(acc.bottom, circle.y + circle.r)
  }), {
    left: Infinity,
    right: -Infinity,
    top: Infinity,
    bottom: -Infinity
  });

  const edgeGap = Math.max(0.5, radius * 0.35);
  const addHorizontalEdgeScatter = (isTopEdge) => {
    const count = Math.max(6, Math.ceil(barWidth / Math.max(8, radius * 2.7)));
    for (let i = 0; i < count; i++) {
      const xNoise = getDeterministicCircleNoise(i, isTopEdge ? 11 : 17);
      const yNoise = getDeterministicCircleNoise(i, isTopEdge ? 12 : 18);
      const rNoise = getDeterministicCircleNoise(i, isTopEdge ? 13 : 19);
      const circleRadius = clampCircleValue(radius * (0.45 + rNoise * 0.65), 0.6, barHeight * 0.32);
      const circle = fitCircleToBounds(
        ((i + xNoise) / count) * barWidth,
        isTopEdge
          ? circleRadius + yNoise * radius * 0.85
          : barHeight - circleRadius - yNoise * radius * 0.85,
        circleRadius,
        barWidth,
        barHeight
      );

      if (circle) {
        circles.push(circle);
      }
    }
  };
  const addVerticalEdgeScatter = (isLeftEdge) => {
    const count = Math.max(2, Math.ceil(barHeight / Math.max(4, radius * 3)));
    for (let i = 0; i < count; i++) {
      const xNoise = getDeterministicCircleNoise(i, isLeftEdge ? 23 : 29);
      const yNoise = getDeterministicCircleNoise(i, isLeftEdge ? 24 : 30);
      const rNoise = getDeterministicCircleNoise(i, isLeftEdge ? 25 : 31);
      const circleRadius = clampCircleValue(radius * (0.45 + rNoise * 0.6), 0.6, barHeight * 0.32);
      const circle = fitCircleToBounds(
        isLeftEdge
          ? circleRadius + xNoise * radius * 0.8
          : barWidth - circleRadius - xNoise * radius * 0.8,
        ((i + yNoise) / count) * barHeight,
        circleRadius,
        barWidth,
        barHeight
      );

      if (circle) {
        circles.push(circle);
      }
    }
  };

  if (bounds.left > edgeGap) {
    addVerticalEdgeScatter(true);
  }
  if (bounds.right < barWidth - edgeGap) {
    addVerticalEdgeScatter(false);
  }
  if (bounds.top > edgeGap) {
    addHorizontalEdgeScatter(true);
  }
  if (bounds.bottom < barHeight - edgeGap) {
    addHorizontalEdgeScatter(false);
  }
}

function generateStaticPackedCircles(barWidth, barHeight, density, sizeVariation) {
  // Safety guards
  if (barWidth <= 0 || barHeight <= 0) return [];
  if (density < 10) density = 10;
  if (density > 100) density = 100;
  if (sizeVariation < 0) sizeVariation = 0;
  if (sizeVariation > 100) sizeVariation = 100;

  const area = barWidth * barHeight;
  let circles = [];

  // Multi-phase packing approach
  const phases = calculatePhaseParameters(density, sizeVariation, area, barHeight);

  for (let phaseIndex = 0; phaseIndex < phases.length; phaseIndex++) {
    const phase = phases[phaseIndex];
    const phaseCircles = executePackingPhase(
      barWidth, barHeight, circles, phase
    );
    circles = circles.concat(phaseCircles);

    // Early termination if we've achieved good density
    const currentCoverage = calculateCoverage(circles, area);
    if (currentCoverage >= (density / 100) * 0.95) {
      break;
    }
  }

  // Gap-filling phase using spatial analysis
  const gapFillingCircles = executeGapFillingPhase(
    barWidth, barHeight, circles, density, sizeVariation
  );
  circles = circles.concat(gapFillingCircles);

  console.log(`Generated ${circles.length} circles with ${Math.round(calculateCoverage(circles, area) * 100)}% coverage`);
  return circles;
}

function savePNG() {
  console.log('Save PNG called');

  try {
    Toast.show('Generating PNG...', 'info', 2000);

    setTimeout(() => {
      const exportGraphics = createExportGraphicsBuffer(PNG_EXPORT_SCALE);
      drawExportLogoFrame(exportGraphics);

      // Get the graphics buffer canvas and export it
      const exportCanvas = exportGraphics.canvas;

      // Create download link
      const link = document.createElement('a');
      link.download = 'RPI-logo.png';
      link.href = exportCanvas.toDataURL('image/png');

      // Trigger download
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      console.log('Transparent PNG save completed successfully');
      Toast.show('PNG download started', 'success');

      // Clean up graphics buffer to prevent memory leaks
      exportGraphics.remove();

      // Hide save menu
      if (saveMenu) saveMenu.classList.add('hidden');

    }, 100);

  } catch (error) {
    console.error('PNG save error:', error);
    console.error('Error stack:', error.stack);
    Toast.show('Save failed: ' + error.message, 'error');
  }
}

function saveLoopingGIF() {
  let exportGraphics = null;

  try {
    const selectedStyle = typeof normalizeStyleValue === 'function'
      ? normalizeStyleValue(styleSelect ? styleSelect.value : 'solid')
      : (styleSelect ? styleSelect.value : 'solid');

    if (!window.loopingGifUtils || !window.loopingGifUtils.isLoopingGifEligibleStyle(selectedStyle)) {
      Toast.show('Looping GIF is only available for ruler, ticker, and waveform.', 'warning');
      return;
    }

    if (typeof GIF === 'undefined') {
      Toast.show('GIF export is not available right now.', 'error');
      return;
    }

    if (saveLoopGifButton && saveLoopGifButton.disabled) {
      Toast.show('GIF export already in progress.', 'info');
      return;
    }

    const framePlan = window.loopingGifUtils.getLoopingGifFramePlan(selectedStyle, {
      rulerRepeats: rulerRepeatsSlider ? rulerRepeatsSlider.value : 10,
      rulerUnits: rulerUnitsSlider ? rulerUnitsSlider.value : 4,
      rulerSpeed: rulerSpeedSlider ? rulerSpeedSlider.value : 1,
      rulerReverse: rulerReverseToggle ? rulerReverseToggle.checked : false,
      tickerRepeats: tickerSlider ? tickerSlider.value : 34,
      tickerSpeed: tickerSpeedSlider ? tickerSpeedSlider.value : 1,
      tickerReverse: tickerReverseToggle ? tickerReverseToggle.checked : false,
      waveformSpeed: waveformSpeedSlider ? waveformSpeedSlider.value : 0.7,
      waveformReverse: waveformReverseToggle ? waveformReverseToggle.checked : false
    }, {
      barWidth: EXPORT_REFERENCE_WIDTH
    });

    if (!framePlan) {
      Toast.show('Could not build a looping GIF for this style.', 'error');
      return;
    }

    exportGraphics = createExportGraphicsBuffer(LOOP_GIF_EXPORT_SCALE);
    const colorScheme = colors[currentColorMode];
    const bgColor = colorScheme ? colorScheme.bg : '#ffffff';
    const gif = new GIF({
      workers: 2,
      quality: 10,
      repeat: 0,
      width: exportGraphics.width,
      height: exportGraphics.height,
      background: bgColor,
      workerScript: LOOP_GIF_WORKER_PATH
    });

    if (saveLoopGifButton) {
      saveLoopGifButton.disabled = true;
    }
    if (saveMenu) {
      saveMenu.classList.add('hidden');
    }
    Toast.show('Rendering looping GIF...', 'info', 2500);

    const finalizeExport = () => {
      if (saveLoopGifButton) {
        saveLoopGifButton.disabled = false;
      }
      if (exportGraphics) {
        exportGraphics.remove();
        exportGraphics = null;
      }
    };

    gif.on('finished', (blob) => {
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `RPI-logo-${selectedStyle}-loop.gif`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      finalizeExport();
      Toast.show('Looping GIF download started', 'success');
    });

    gif.on('abort', () => {
      finalizeExport();
      Toast.show('GIF export was cancelled.', 'warning');
    });

    for (let frameIndex = 0; frameIndex < framePlan.frameCount; frameIndex++) {
      const progress = frameIndex / framePlan.frameCount;
      const patternOptions = selectedStyle === 'waveform'
        ? { timeSeconds: framePlan.getTimeSeconds(progress) }
        : { loopOffsetX: framePlan.getLoopOffsetX(progress) };

      drawExportLogoFrame(exportGraphics, {
        scale: LOOP_GIF_EXPORT_SCALE,
        backgroundColor: bgColor,
        patternOptions
      });

      gif.addFrame(exportGraphics.canvas, {
        copy: true,
        delay: framePlan.frameDelayMs
      });
    }

    gif.render();
  } catch (error) {
    console.error('Loop GIF save error:', error);
    if (saveLoopGifButton) {
      saveLoopGifButton.disabled = false;
    }
    if (exportGraphics) {
      exportGraphics.remove();
    }
    Toast.show('GIF export failed: ' + error.message, 'error');
  }
}

function saveSVG() {
  try {
    Toast.show('Generating SVG...', 'info', 2000);

    const currentWidth = SVG_EXPORT_WIDTH;
    const logoHeight = SVG_EXPORT_TOTAL_HEIGHT;

    // Get current colors
    const colorScheme = colors[currentColorMode];
    const fgColor = colorScheme ? colorScheme.fg : '#000000';

    let svgContent = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${currentWidth}" height="${logoHeight}" viewBox="0 0 ${currentWidth} ${logoHeight}" xmlns="http://www.w3.org/2000/svg">
  <path d="${paths.r}" fill="${fgColor}"/>
  <path d="${paths.p}" fill="${fgColor}"/>
  <path d="${paths.i}" fill="${fgColor}"/>`;

    // Add the bar using exact 250px reference calculations
    const barY = SVG_EXPORT_BAR_Y;
    const barHeight = SVG_EXPORT_BAR_HEIGHT;
    const exactBarWidth = SVG_EXPORT_WIDTH;
    const barStartX = 0; // Exact X position from 250px reference
    const currentMotionStyle = typeof getCurrentMotionStyle === 'function' ? getCurrentMotionStyle() : null;
    const loopAnimationState = typeof getLoopAnimationStateForStyle === 'function'
      ? getLoopAnimationStateForStyle(currentMotionStyle, exactBarWidth)
      : null;

    if (currentShader === 0) {
      // Solid bar with corner details on all four corners
      const cornerSize = 1.5;
      const pathData = `M ${barStartX + cornerSize} ${barY} L ${barStartX + exactBarWidth - cornerSize} ${barY} L ${barStartX + exactBarWidth} ${barY + cornerSize} L ${barStartX + exactBarWidth} ${barY + barHeight - cornerSize} L ${barStartX + exactBarWidth - cornerSize} ${barY + barHeight} L ${barStartX + cornerSize} ${barY + barHeight} L ${barStartX} ${barY + barHeight - cornerSize} L ${barStartX} ${barY + cornerSize} Z`;
      svgContent += `\n  <path d="${pathData}" fill="${fgColor}"/>`;
    } else {
      svgContent += createBarPatternSVG({
        currentShader,
        barStartX,
        barY,
        exactBarWidth,
        barHeight,
        fgColor,
        textToBinary,
        textToMorse,
        parseNumericString,
        generateStaticPackedCircles,
        values: {
          rulerRepeats: rulerRepeatsSlider.value,
          rulerUnits: rulerUnitsSlider.value,
          rulerSpeed: rulerSpeedSlider ? rulerSpeedSlider.value : 1,
          tickerRepeats: tickerSlider.value,
          tickerRatio: tickerRatioSlider.value,
          tickerWidthRatio: tickerWidthRatioSlider.value,
          tickerSpeed: tickerSpeedSlider ? tickerSpeedSlider.value : 1,
          loopOffsetX: loopAnimationState ? loopAnimationState.loopOffsetX : 0,
          binaryText: binaryInput.value || 'RPI',
          waveformType: waveformTypeSlider.value,
          waveformFrequency: waveformFrequencySlider.value,
          waveformSpeed: waveformSpeedSlider.value,
          waveformEnvelope: waveformEnvelopeToggle ? waveformEnvelopeToggle.checked : false,
          waveformEnvelopeType: waveformEnvelopeType ? waveformEnvelopeType.value : 'sine',
          waveformEnvelopeWaves: waveformEnvelopeWavesSlider
            ? (typeof normalizeWaveformEnvelopeWaves === 'function'
              ? normalizeWaveformEnvelopeWaves(waveformEnvelopeWavesSlider.value)
              : Math.max(1, Math.min(10, Math.round(parseFloat(waveformEnvelopeWavesSlider.value)) || 1)))
            : 1,
          waveformEnvelopeCenter: waveformEnvelopeCenterSlider ? waveformEnvelopeCenterSlider.value : 0,
          waveformEnvelopeBipolar: waveformEnvelopeBipolarToggle ? waveformEnvelopeBipolarToggle.checked : false,
          timeSeconds: loopAnimationState
            ? loopAnimationState.timeSeconds
            : (typeof window.animationTime !== 'undefined' ? window.animationTime : millis() / 1000.0),
          circlesFill: circlesFillSelect ? circlesFillSelect.value : 'stroke',
          circlesDensity: circlesDensitySlider.value,
          circlesSizeVariation: circlesSizeVariationSlider.value,
          numericValue: numericInput ? numericInput.value : '',
          numericMode: numericModeSelect ? numericModeSelect.value : 'dotmatrix',
          neuralNetworkHiddenLayers: neuralNetworkHiddenLayersSlider ? neuralNetworkHiddenLayersSlider.value : 1,
          morseText: typeof morseInput !== 'undefined' && morseInput ? morseInput.value : 'RPI',
          trussFamily: trussFamilySelect ? trussFamilySelect.value : 'flat',
          trussSegments: trussSegmentsSlider ? trussSegmentsSlider.value : 15,
          trussThickness: trussThicknessSlider ? trussThicknessSlider.value : 2,
          staffText: 'RPI',
          staffThickness: 1,
          staffNotes: typeof currentStaffNotes !== 'undefined' ? currentStaffNotes : [],
          staffNoteShape: typeof getSelectedMusicNoteShape === 'function' ? getSelectedMusicNoteShape() : 'circle',
          pulseText: pulseInput ? pulseInput.value : 'RPI',
          pulseIntensity: pulseIntensitySlider ? pulseIntensitySlider.value : 5,
          graphText: graphInput ? graphInput.value : 'RPI',
          graphText2: graphInput2 ? graphInput2.value : '',
          graphText3: graphInput3 ? graphInput3.value : '',
          graphText4: graphInput4 ? graphInput4.value : '',
          graphText5: graphInput5 ? graphInput5.value : '',
          graphMulti: graphMultiToggle ? graphMultiToggle.checked : false,
          graphScale: graphScaleSlider ? graphScaleSlider.value : 10
        }
      });
    }

    svgContent += `\n</svg>`;

    // Download SVG
    const blob = new Blob([svgContent], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'RPI-logo.svg';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    // Hide save menu
    if (saveMenu) saveMenu.classList.add('hidden');

    Toast.show('SVG download started', 'success');

  } catch (error) {
    console.error('SVG save error:', error);
    Toast.show('Save failed: ' + error.message, 'error');
  }
}

function createNumericTexture(digits) {
  if (!digits || digits.length === 0) return null;

  // Create a 1D texture with the digit values
  const width = Math.min(digits.length, 200);
  const height = 1;
  const data = new Float32Array(width * height * 4); // RGBA

  for (let i = 0; i < width; i++) {
    const index = i * 4;
    data[index] = digits[i] / 10.0; // Normalize to 0-1 range
    data[index + 1] = 0.0;
    data[index + 2] = 0.0;
    data[index + 3] = 1.0;
  }

  // Create p5.js graphics buffer for the texture
  const textureGraphics = createGraphics(width, height);
  textureGraphics.loadPixels();

  for (let i = 0; i < width; i++) {
    const pixelIndex = i * 4;
    textureGraphics.pixels[pixelIndex] = data[i * 4] * 255;     // R
    textureGraphics.pixels[pixelIndex + 1] = 0;                 // G
    textureGraphics.pixels[pixelIndex + 2] = 0;                 // B
    textureGraphics.pixels[pixelIndex + 3] = 255;               // A
  }

  textureGraphics.updatePixels();
  return textureGraphics;
}
