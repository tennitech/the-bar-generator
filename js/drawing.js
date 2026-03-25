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

function drawBarPatternOnGraphics(pg, barStartX, barY, exactBarWidth, rectHeight) {
  // Get current foreground color
  const colorScheme = colors[currentColorMode];
  const fgColor = colorScheme ? colorScheme.fg : '#000000';

  pg.fill(fgColor);
  pg.noStroke();
  pg.rectMode(CORNER);

  if (currentShader === 0) {
    // Solid bar
    pg.rect(barStartX, barY, exactBarWidth, rectHeight);
  } else if (currentShader === 1) {
    // Ruler pattern
    const rulerRepeats = parseInt(rulerRepeatsSlider.value);
    const rulerUnits = parseInt(rulerUnitsSlider.value);
    const rulerTotalTicks = rulerRepeats * rulerUnits + 1;
    const rulerTickWidth = exactBarWidth / (2 * rulerTotalTicks - 1);
    const rulerTickSpacing = rulerTickWidth * 2;

    for (let i = 0; i < rulerTotalTicks; i++) {
      const tickX = barStartX + i * rulerTickSpacing;
      let tickHeight;

      if (i === 0 || i === rulerTotalTicks - 1) {
        tickHeight = rectHeight;
      } else if (i % rulerUnits === 0) {
        tickHeight = rectHeight;
      } else {
        const positionInUnit = i % rulerUnits;
        if (rulerUnits === 10) {
          if (positionInUnit === 5) {
            tickHeight = rectHeight * 0.75;
          } else if (positionInUnit % 2 === 0) {
            tickHeight = rectHeight * 0.5;
          } else {
            tickHeight = rectHeight * 0.25;
          }
        } else {
          if (positionInUnit === Math.floor(rulerUnits / 2)) {
            tickHeight = rectHeight * 0.75;
          } else {
            tickHeight = rectHeight * 0.5;
          }
        }
      }

      const tickY = barY + rectHeight - tickHeight;
      pg.rect(tickX, tickY, rulerTickWidth, tickHeight);
    }
  } else if (currentShader === 2) {
    // Ticker pattern
    const tickerRatio = parseInt(tickerRatioSlider.value);
    const tickerWidthRatio = parseInt(tickerWidthRatioSlider.value);
    const tickerBottomTicks = parseInt(tickerSlider.value);
    const tickerTopTicks = tickerBottomTicks * tickerRatio;
    const tickerHalfHeight = rectHeight / 2;
    const tickerSpacing = exactBarWidth / tickerTopTicks;
    const tickerTopWidth = tickerSpacing / 2;
    const tickerBottomWidth = tickerTopWidth * tickerWidthRatio;

    // Top row
    for (let i = 0; i < tickerTopTicks; i++) {
      const x = barStartX + i * tickerSpacing;
      pg.rect(x, barY, tickerTopWidth, tickerHalfHeight);
    }

    // Bottom row
    for (let i = 0; i < tickerBottomTicks; i++) {
      const topIndex = i * tickerRatio;
      const x = barStartX + topIndex * tickerSpacing;
      pg.rect(x, barY + tickerHalfHeight, tickerBottomWidth, tickerHalfHeight);
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
    const time = typeof window.animationTime !== 'undefined' ? window.animationTime : millis() / 1000.0;

    // Helper function for smooth waveform generation (restored from original working version)
    function generateWaveValue(phase, type) {
      const normalizedPhase = phase - Math.floor(phase);
      const wrappedPhase = normalizedPhase < 0 ? normalizedPhase + 1 : normalizedPhase;

      // Define all wave types such that they align at 0
      const sine = (Math.sin(wrappedPhase * 2 * Math.PI - Math.PI / 2) + 1) * 0.5;
      const saw = wrappedPhase;
      const square = wrappedPhase > 0.5 ? 1.0 : 0.0;
      const pulse = wrappedPhase > 0.8 ? 1.0 : 0.0;

      if (type < 1.0) {
        // Sine to sawtooth interpolation
        return sine + (saw - sine) * type;
      } else if (type < 2.0) {
        // Sawtooth to square interpolation
        const t = type - 1.0;
        return saw + (square - saw) * t;
      } else {
        // Square to pulse interpolation
        const t = type - 2.0;
        return square + (pulse - square) * t;
      }
    }

    // Calculate optimal number of points
    const basePoints = Math.max(300, exactBarWidth * 3);
    const frequencyMultiplier = Math.max(1, frequency / 10);
    const points = Math.ceil(basePoints * frequencyMultiplier);

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

      let wave = generateWaveValue(rawPhase, waveType);

      // Apply amplitude envelope to pin the edges to zero
      const envelope = Math.sin(Math.PI * xPortion);
      wave *= envelope;

      const y = barY + rectHeight * (1.0 - Math.max(0, Math.min(1, wave)));

      pg.vertex(barStartX + x, y);
    }

    // Complete the polygon by going to bottom-right corner
    pg.vertex(barStartX + exactBarWidth, barY + rectHeight);

    pg.endShape(pg.CLOSE);
  } else if (currentShader === 5) {
    // Circles pattern
    const density = parseInt(circlesDensitySlider.value);
    const sizeVariation = parseInt(circlesSizeVariationSlider.value);
    const overlapAmount = parseInt(circlesOverlapSlider.value);
    const fillStyle = circlesFillSelect.value;

    pg.fill(fillStyle === 'fill' ? fgColor : 'transparent');
    pg.stroke(fillStyle === 'stroke' ? fgColor : 'transparent');
    pg.strokeWeight(1);

    drawCirclePattern(pg, barStartX, barY, exactBarWidth, rectHeight, density, sizeVariation, overlapAmount);
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
    const text = typeof morseInput !== 'undefined' && morseInput ? morseInput.value || "RPI" : "RPI";
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
    // Matrix / Punch Card pattern
    const text = matrixInput ? matrixInput.value || "RPI" : "RPI";
    const rows = parseInt(matrixRowsSlider ? matrixRowsSlider.value : 3);
    const gap = parseInt(matrixGapSlider ? matrixGapSlider.value : 1);

    const binaryDataArray = textToBinary(text);

    if (binaryDataArray.length > 0) {
      // Calculate sizes to fit perfectly within the rectHeight
      const totalGapHeight = Math.max(0, rows - 1) * gap;
      const squareSize = Math.max(1, (rectHeight - totalGapHeight) / rows);

      // Calculate how many columns we can fit
      const columns = Math.floor((exactBarWidth + gap) / (squareSize + gap));

      // Center horizontally
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
            pg.noStroke();
            pg.fill(fgColor);
            pg.rect(x, y, squareSize, squareSize);
          } else {
            pg.noFill();
            pg.stroke(fgColor);
            pg.strokeWeight(0.5); // Thin stroke for unfilled
            pg.rect(x, y, squareSize, squareSize);
          }
        }
      }
    }
  } else if (currentShader === 9) {
    // Truss / Geometric pattern
    const trussGeometry = createTrussPatternGeometry({
      barStartX,
      barY,
      exactBarWidth,
      barHeight: rectHeight,
      segments: trussSegmentsSlider ? trussSegmentsSlider.value : 15,
      mirrorSegments: trussMirrorToggle ? trussMirrorToggle.checked : false,
      thickness: trussThicknessSlider ? trussThicknessSlider.value : 2,
      family: trussFamilySelect ? trussFamilySelect.value : 'flat'
    });

    pg.noFill();
    pg.stroke(fgColor);
    pg.strokeWeight(trussGeometry.thickness);
    pg.drawingContext.lineCap = 'butt';
    pg.drawingContext.lineJoin = 'miter';

    for (let i = 0; i < trussGeometry.strokes.length; i++) {
      const strokeShape = trussGeometry.strokes[i];
      pg.beginShape();
      for (let j = 0; j < strokeShape.points.length; j++) {
        const point = strokeShape.points[j];
        pg.vertex(point.x, point.y);
      }
      if (strokeShape.closed) {
        pg.endShape(pg.CLOSE);
      } else {
        pg.endShape();
      }
    }

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
  } else if (currentShader === 13) {
    // GitHub contribution graph
    const renderData = buildGithubContributionRenderData({
      barStartX,
      barY,
      exactBarWidth,
      barHeight: rectHeight,
      grid: githubContributionGrid
    });

    pg.stroke(fgColor);
    pg.strokeWeight(0.85);
    for (let i = 0; i < renderData.cells.length; i++) {
      const cell = renderData.cells[i];
      if (cell.filled) {
        pg.fill(fgColor);
      } else {
        pg.noFill();
      }
      pg.rect(cell.x, cell.y, cell.size, cell.size);
    }
  }
}

function drawCirclePattern(pg, barStartX, barY, barWidth, barHeight, density, sizeVariation, overlapAmount) {
  try {
    const selectedMode = circlesModeSelect ? circlesModeSelect.value : 'packing';

    if (selectedMode === 'grid') {
      // Grid mode
      const rows = parseInt(circlesRowsSlider.value);
      const gridDensity = parseInt(circlesGridDensitySlider.value);
      const sizeVariationY = parseInt(circlesSizeVariationYSlider.value);
      const sizeVariationX = parseInt(circlesSizeVariationXSlider.value);
      const gridOverlap = parseInt(circlesGridOverlapSlider.value);
      const layout = circlesLayoutSelect.value;

      // Create parameter string for caching
      const params = `grid-${rows}-${gridDensity}-${sizeVariationY}-${sizeVariationX}-${gridOverlap}-${layout}-${barWidth}-${barHeight}`;

      // Only regenerate if parameters changed
      if (!staticCircleData || lastCircleParams !== params) {
        staticCircleData = generateGridCircles(barWidth, barHeight, rows, gridDensity, sizeVariationY, sizeVariationX, gridOverlap, layout);
        lastCircleParams = params;
      }
    } else {
      // Packing mode (existing functionality)
      const params = `packing-${density}-${sizeVariation}-${overlapAmount}-${barWidth}-${barHeight}`;

      // Only regenerate if parameters changed
      if (!staticCircleData || lastCircleParams !== params) {
        staticCircleData = generateStaticPackedCircles(barWidth, barHeight, density, sizeVariation, overlapAmount);
        lastCircleParams = params;
      }
    }

    // Safety check for data validity
    if (!staticCircleData || staticCircleData.length === 0) {
      console.warn('No valid circle data generated');
      return;
    }

    // Draw circles using the cached static data
    for (let i = 0; i < staticCircleData.length; i++) {
      const circle = staticCircleData[i];

      // Safety check for valid circle data
      if (!circle || typeof circle.x !== 'number' || typeof circle.y !== 'number' || typeof circle.r !== 'number') {
        continue;
      }

      if (pg) {
        pg.ellipse(barStartX + circle.x, barY + circle.y, circle.r * 2, circle.r * 2);
      } else {
        ellipse(barStartX + circle.x, barY + circle.y, circle.r * 2, circle.r * 2);
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

function generateStaticPackedCircles(barWidth, barHeight, density, sizeVariation, overlapAmount) {
  // Safety guards
  if (barWidth <= 0 || barHeight <= 0) return [];
  if (density < 10) density = 10;
  if (density > 100) density = 100;
  if (sizeVariation < 0) sizeVariation = 0;
  if (sizeVariation > 100) sizeVariation = 100;
  if (overlapAmount < 0) overlapAmount = 0;
  if (overlapAmount > 100) overlapAmount = 100;

  const area = barWidth * barHeight;
  let circles = [];

  // Multi-phase packing approach
  const phases = calculatePhaseParameters(density, sizeVariation, area, barHeight);

  for (let phaseIndex = 0; phaseIndex < phases.length; phaseIndex++) {
    const phase = phases[phaseIndex];
    const phaseCircles = executePackingPhase(
      barWidth, barHeight, circles, phase, overlapAmount
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
    barWidth, barHeight, circles, density, sizeVariation, overlapAmount
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
      // Create a temporary graphics buffer with transparent background
      const currentWidth = 250; // Exact width from 250px reference
      const logoHeight = 151; // 112px letters + 20.5px spacing + 18px bar = 150.5px, rounded to 151

      // Create off-screen graphics buffer with transparent background
      const exportGraphics = createGraphics(Math.ceil(currentWidth * 1.5) + 40, Math.ceil(logoHeight * 1.5) + 40);

      // Don't set a background - leave it transparent
      exportGraphics.clear();

      // Draw the logo on the graphics buffer
      exportGraphics.push();
      exportGraphics.translate(20, 20); // Add some padding
      exportGraphics.scale(1.5);

      // Get current foreground color
      const colorScheme = colors[currentColorMode];
      const fgColor = colorScheme ? colorScheme.fg : '#000000';

      // Draw letter paths
      exportGraphics.fill(fgColor);
      exportGraphics.noStroke();
      drawSVGPathOnGraphics(exportGraphics, paths.r);
      drawSVGPathOnGraphics(exportGraphics, paths.p);
      drawSVGPathOnGraphics(exportGraphics, paths.i);

      // Draw the bar pattern - position exactly 20.5px below letters
      const barY = 134; // 112px letters + 20.5px spacing
      const barHeight = 18; // Exact height from specification
      const exactBarWidth = 250; // Exact width from 250px reference
      const barStartX = 0; // Exact X position from 250px reference

      // Always draw the bar - solid, ruler, binary, or ticker
      if (currentShader === 0) {
        // Solid bar with corner details
        const cornerSize = 1.5;

        exportGraphics.beginShape();
        // Start from top-left corner (cut)
        exportGraphics.vertex(barStartX + cornerSize, barY);
        exportGraphics.vertex(barStartX + exactBarWidth - cornerSize, barY); // Top edge
        exportGraphics.vertex(barStartX + exactBarWidth, barY + cornerSize); // Top-right corner cut
        exportGraphics.vertex(barStartX + exactBarWidth, barY + barHeight - cornerSize); // Right edge
        exportGraphics.vertex(barStartX + exactBarWidth - cornerSize, barY + barHeight); // Bottom-right corner cut
        exportGraphics.vertex(barStartX + cornerSize, barY + barHeight); // Bottom edge
        exportGraphics.vertex(barStartX, barY + barHeight - cornerSize); // Bottom-left corner cut
        exportGraphics.vertex(barStartX, barY + cornerSize); // Left edge to top-left corner cut
        exportGraphics.endShape(exportGraphics.CLOSE);
      } else {
        drawBarPatternOnGraphics(exportGraphics, barStartX, barY, exactBarWidth, barHeight);
      }

      exportGraphics.pop();

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

function saveSVG() {
  try {
    Toast.show('Generating SVG...', 'info', 2000);

    const currentWidth = 250; // Exact width from 250px reference
    const logoHeight = 149.411; // Exact height including bar from 250px reference

    // Get current colors
    const colorScheme = colors[currentColorMode];
    const fgColor = colorScheme ? colorScheme.fg : '#000000';

    let svgContent = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${currentWidth}" height="${logoHeight}" viewBox="0 0 ${currentWidth} ${logoHeight}" xmlns="http://www.w3.org/2000/svg">
  <path d="${paths.r}" fill="${fgColor}"/>
  <path d="${paths.p}" fill="${fgColor}"/>
  <path d="${paths.i}" fill="${fgColor}"/>`;

    // Add the bar using exact 250px reference calculations
    const barY = 132.911; // Exact Y position from 250px reference
    const barHeight = 18; // Exact height from specification
    const exactBarWidth = 250; // Exact width from 250px reference
    const barStartX = 0; // Exact X position from 250px reference

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
        generateGridCircles,
        generateStaticPackedCircles,
        values: {
          rulerRepeats: rulerRepeatsSlider.value,
          rulerUnits: rulerUnitsSlider.value,
          tickerRepeats: tickerSlider.value,
          tickerRatio: tickerRatioSlider.value,
          tickerWidthRatio: tickerWidthRatioSlider.value,
          binaryText: binaryInput.value || 'RPI',
          waveformType: waveformTypeSlider.value,
          waveformFrequency: waveformFrequencySlider.value,
          waveformSpeed: waveformSpeedSlider.value,
          timeSeconds: typeof window.animationTime !== 'undefined' ? window.animationTime : millis() / 1000.0,
          circlesMode: circlesModeSelect ? circlesModeSelect.value : 'packing',
          circlesFill: circlesFillSelect ? circlesFillSelect.value : 'stroke',
          circlesDensity: circlesDensitySlider.value,
          circlesSizeVariation: circlesSizeVariationSlider.value,
          circlesOverlap: circlesOverlapSlider.value,
          circlesRows: circlesRowsSlider.value,
          circlesGridDensity: circlesGridDensitySlider.value,
          circlesSizeVariationY: circlesSizeVariationYSlider.value,
          circlesSizeVariationX: circlesSizeVariationXSlider.value,
          circlesGridOverlap: circlesGridOverlapSlider.value,
          circlesLayout: circlesLayoutSelect ? circlesLayoutSelect.value : 'straight',
          numericValue: numericInput ? numericInput.value : '',
          numericMode: numericModeSelect ? numericModeSelect.value : 'dotmatrix',
          morseText: typeof morseInput !== 'undefined' && morseInput ? morseInput.value : 'RPI',
          matrixText: matrixInput ? matrixInput.value : 'RPI',
          matrixRows: matrixRowsSlider ? matrixRowsSlider.value : 3,
          matrixGap: matrixGapSlider ? matrixGapSlider.value : 1,
          trussFamily: trussFamilySelect ? trussFamilySelect.value : 'flat',
          trussSegments: trussSegmentsSlider ? trussSegmentsSlider.value : 15,
          trussMirror: trussMirrorToggle ? trussMirrorToggle.checked : false,
          trussThickness: trussThicknessSlider ? trussThicknessSlider.value : 2,
          staffText: staffInput ? staffInput.value : 'RPI',
          staffThickness: staffThicknessSlider ? staffThicknessSlider.value : 1,
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
          graphScale: graphScaleSlider ? graphScaleSlider.value : 10,
          githubContributionGrid
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
