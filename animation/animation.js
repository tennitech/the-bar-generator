const FINAL_LOGO_PATH = './data/rpi-logo-5.svg';
const projection = document.getElementById('animation-projection');
const DENSITY_RAMP = ' .,:-=+*#%@';
const TITLE_LINES = ['THE BAR', 'GENERATOR'];

const PATTERN_DEFS = [
  { path: './data/style-circles-2.svg', widthRatio: 0.84, heightRatio: 0.72, fitMode: 'contain', motionAmplitude: 1.25, motionSpeed: 1.75 },
  { path: './data/style-circles-gradient-1.svg', widthRatio: 0.84, heightRatio: 0.72, fitMode: 'contain', motionAmplitude: 1.3, motionSpeed: 1.62 },
  { path: './data/style-fibonacci-sequence.svg', widthRatio: 0.84, heightRatio: 0.72, fitMode: 'contain', motionAmplitude: 1.15, motionSpeed: 1.42 },
  { path: './data/style-ruler-in.svg', widthRatio: 0.88, heightRatio: 0.58, fitMode: 'contain', motionAmplitude: 0.95, motionSpeed: 1.92 },
  { path: './data/style-ticker-sm.svg', widthRatio: 0.88, heightRatio: 0.44, fitMode: 'contain', motionAmplitude: 0.9, motionSpeed: 2.05 }
];

const TIMING = {
  intro: 2.2,
  hold: 0.72,
  morph: 0.98,
  titleHold: 0.82,
  titleMorph: 1.18,
  finalMorph: 1.48,
  finalSettle: 0.96
};

const TEXT_BLOCK = `
/dream BUILDING THE NEW THROUGH PRECISE ITERATION AND CODE.
/dream WHAT IF WE TRIED THIS AGAIN WITH MORE RIGOR.
/dream RPI LOGO GENERATOR INITIALIZING IN RED PIXEL SPACE.
/dream TROY COORDINATES TOLERANCES LAB NOTES AND SYSTEMS.
/dream TEST BREAK REBUILD REPEAT UNTIL THE SHAPE HOLDS.
/dream MEASUREMENT DATA MOTION BAR SIGNAL AND STRUCTURE.
/dream ROBOTICS ARCHITECTURE COMPUTING ENERGY MATERIALS.
/dream WHY NOT CHANGE THE WORLD ONE PASS AT A TIME.
`;

const stream = TEXT_BLOCK.replace(/\s+/g, ' ').trim();

const state = {
  cols: 0,
  rows: 0,
  fontSize: 4,
  lineHeight: 4,
  masks: [],
  titleMask: null,
  finalMask: null,
  introParticles: [],
  morphSets: [],
  titleMorphParticles: [],
  finalMorphParticles: [],
  frameHandle: 0,
  startTime: 0
};

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function lerp(start, end, progress) {
  return start + ((end - start) * progress);
}

function easeInOutCubic(value) {
  if (value < 0.5) {
    return 4 * value * value * value;
  }

  return 1 - (Math.pow(-2 * value + 2, 3) / 2);
}

function easeOutQuint(value) {
  return 1 - Math.pow(1 - value, 5);
}

function easeOutBack(value) {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + (c3 * Math.pow(value - 1, 3)) + (c1 * Math.pow(value - 1, 2));
}

function cellNoise(x, y, seed) {
  const value = Math.sin((x * 12.9898) + (y * 78.233) + (seed * 37.719)) * 43758.5453;
  return value - Math.floor(value);
}

function getStreamChar(index) {
  return stream[index % stream.length];
}

function densityToChar(density) {
  if (density < 0.06) {
    return ' ';
  }

  const normalized = clamp((density - 0.06) / 0.94, 0, 1);
  const eased = Math.pow(normalized, 0.85);
  const index = Math.min(DENSITY_RAMP.length - 1, Math.floor(eased * (DENSITY_RAMP.length - 1)));
  return DENSITY_RAMP[index];
}

function measureCellMetrics() {
  const probe = document.createElement('span');
  probe.textContent = 'M';
  probe.style.position = 'absolute';
  probe.style.visibility = 'hidden';
  probe.style.fontFamily = 'RPIGeistMono, monospace';
  probe.style.fontSize = `${state.fontSize}px`;
  probe.style.lineHeight = `${state.lineHeight}px`;
  document.body.appendChild(probe);
  const rect = probe.getBoundingClientRect();
  probe.remove();
  return {
    width: rect.width || 4,
    height: rect.height || 4
  };
}

function updateProjectionScale() {
  const targetFontSize = clamp(
    Math.floor(Math.min(window.innerWidth / 225, window.innerHeight / 130)),
    4,
    6
  );

  state.fontSize = targetFontSize;
  state.lineHeight = Math.max(4, Math.round(targetFontSize * 0.9));
  projection.style.fontSize = `${state.fontSize}px`;
  projection.style.lineHeight = `${state.lineHeight}px`;

  const metrics = measureCellMetrics();
  state.cols = Math.max(80, Math.ceil(window.innerWidth / Math.max(metrics.width, 1)));
  state.rows = Math.max(48, Math.ceil(window.innerHeight / Math.max(metrics.height, 1)));
}

function sampleDensity(data, width, left, right, top, bottom) {
  let coverage = 0;
  let samples = 0;

  for (let sy = top; sy < bottom; sy += 1) {
    for (let sx = left; sx < right; sx += 1) {
      const index = ((sy * width) + sx) * 4;
      coverage += data[index + 3] / 255;
      samples += 1;
    }
  }

  return samples > 0 ? coverage / samples : 0;
}

async function rasterizeMask(path, widthRatio, heightRatio, fitMode = 'contain') {
  const image = new Image();
  image.src = path;
  await image.decode();

  const metrics = measureCellMetrics();
  const oversample = 6;
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  canvas.width = Math.max(1, Math.round(state.cols * metrics.width * oversample));
  canvas.height = Math.max(1, Math.round(state.rows * metrics.height * oversample));
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.imageSmoothingEnabled = true;

  const imageWidth = image.naturalWidth || image.width;
  const imageHeight = image.naturalHeight || image.height;
  const aspect = imageWidth / imageHeight;
  const maxWidth = canvas.width * widthRatio;
  const maxHeight = canvas.height * heightRatio;
  let drawWidth = maxWidth;
  let drawHeight = drawWidth / aspect;

  if (fitMode === 'cover') {
    if (drawHeight < maxHeight) {
      drawHeight = maxHeight;
      drawWidth = drawHeight * aspect;
    }
  } else if (drawHeight > maxHeight) {
    drawHeight = maxHeight;
    drawWidth = drawHeight * aspect;
  }

  const offsetX = (canvas.width - drawWidth) * 0.5;
  const offsetY = (canvas.height - drawHeight) * 0.5;
  ctx.drawImage(image, offsetX, offsetY, drawWidth, drawHeight);

  const { data } = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const cells = [];
  const grid = Array.from({ length: state.rows }, () => Array(state.cols).fill(' '));

  for (let row = 0; row < state.rows; row += 1) {
    for (let col = 0; col < state.cols; col += 1) {
      const cellLeft = Math.floor((col / state.cols) * canvas.width);
      const cellRight = Math.floor(((col + 1) / state.cols) * canvas.width);
      const cellTop = Math.floor((row / state.rows) * canvas.height);
      const cellBottom = Math.floor(((row + 1) / state.rows) * canvas.height);
      const density = sampleDensity(data, canvas.width, cellLeft, cellRight, cellTop, cellBottom);
      const char = densityToChar(density);

      grid[row][col] = char;

      if (char !== ' ') {
        cells.push({ x: col, y: row, char });
      }
    }
  }

  return { cells, grid };
}

function rasterizeTextMask(lines, widthRatio, heightRatio, fontFamily) {
  const metrics = measureCellMetrics();
  const oversample = 6;
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  canvas.width = Math.max(1, Math.round(state.cols * metrics.width * oversample));
  canvas.height = Math.max(1, Math.round(state.rows * metrics.height * oversample));
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const maxWidth = canvas.width * widthRatio;
  const maxHeight = canvas.height * heightRatio;
  let fontSize = maxHeight / Math.max(lines.length * 0.92, 1);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#000000';

  for (let attempt = 0; attempt < 12; attempt += 1) {
    ctx.font = `${fontSize}px ${fontFamily}`;
    const widest = Math.max(...lines.map((line) => ctx.measureText(line).width), 1);
    const blockHeight = lines.length * fontSize * 0.92;

    if (widest <= maxWidth && blockHeight <= maxHeight) {
      break;
    }

    const widthScale = maxWidth / widest;
    const heightScale = maxHeight / blockHeight;
    fontSize *= Math.min(widthScale, heightScale) * 0.98;
  }

  ctx.font = `${fontSize}px ${fontFamily}`;
  const lineHeight = fontSize * 0.92;
  const blockHeight = lines.length * lineHeight;
  const startY = (canvas.height * 0.5) - (blockHeight * 0.5) + (lineHeight * 0.5);

  for (let index = 0; index < lines.length; index += 1) {
    ctx.fillText(lines[index], canvas.width * 0.5, startY + (index * lineHeight));
  }

  const { data } = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const cells = [];
  const grid = Array.from({ length: state.rows }, () => Array(state.cols).fill(' '));

  for (let row = 0; row < state.rows; row += 1) {
    for (let col = 0; col < state.cols; col += 1) {
      const cellLeft = Math.floor((col / state.cols) * canvas.width);
      const cellRight = Math.floor(((col + 1) / state.cols) * canvas.width);
      const cellTop = Math.floor((row / state.rows) * canvas.height);
      const cellBottom = Math.floor(((row + 1) / state.rows) * canvas.height);
      const density = sampleDensity(data, canvas.width, cellLeft, cellRight, cellTop, cellBottom);
      const char = densityToChar(density);

      grid[row][col] = char;

      if (char !== ' ') {
        cells.push({ x: col, y: row, char });
      }
    }
  }

  return { cells, grid };
}

function finalizeMask(mask, index, motionAmplitude, motionSpeed) {
  const auraCells = [];
  const seen = new Set();
  const offsets = [
    [2, 0], [-2, 0], [0, 1], [0, -1],
    [3, 1], [-3, -1], [1, 2], [-1, -2],
    [4, 0], [-4, 0], [2, 2], [-2, -2]
  ];

  for (let cellIndex = 0; cellIndex < mask.cells.length; cellIndex += 1) {
    const cell = mask.cells[cellIndex];

    if (cellNoise(cell.x, cell.y, 61 + index) < 0.62) {
      continue;
    }

    const offset = offsets[Math.floor(cellNoise(cell.x, cell.y, 67 + index) * offsets.length)] || offsets[0];
    const ax = cell.x + offset[0];
    const ay = cell.y + offset[1];
    const key = `${ax}:${ay}`;

    if (
      ax < 0 ||
      ay < 0 ||
      ax >= state.cols ||
      ay >= state.rows ||
      mask.grid[ay][ax] !== ' ' ||
      seen.has(key)
    ) {
      continue;
    }

    seen.add(key);
    auraCells.push({
      anchorX: cell.x,
      anchorY: cell.y,
      offsetX: offset[0],
      offsetY: offset[1],
      char: getStreamChar((cellIndex * 17) + (index * 29)),
      radius: 1 + Math.round(cellNoise(cell.x, cell.y, 73 + index) * 2),
      phase: cellNoise(cell.x, cell.y, 79 + index) * Math.PI * 2
    });
  }

  return {
    cells: mask.cells,
    grid: mask.grid,
    text: mask.grid.map((row) => row.join('')).join('\n'),
    auraCells,
    motionAmplitude: motionAmplitude + 0.45,
    motionSpeed,
    motionPhase: index * 0.71
  };
}

function createOffscreenPoint(index) {
  const side = index % 4;
  const band = cellNoise(index, side, 3);

  if (side === 0) {
    return { x: -12, y: Math.round(band * (state.rows - 1)) };
  }

  if (side === 1) {
    return { x: state.cols + 12, y: Math.round(band * (state.rows - 1)) };
  }

  if (side === 2) {
    return { x: Math.round(band * (state.cols - 1)), y: -8 };
  }

  return { x: Math.round(band * (state.cols - 1)), y: state.rows + 8 };
}

function buildParticleSet(sourceCells, targetCells, seed, startFromOffscreen = false) {
  const count = Math.max(sourceCells.length, targetCells.length);

  return Array.from({ length: count }, (_, index) => {
    const target = targetCells[Math.floor((index / count) * targetCells.length)] || targetCells[index % targetCells.length];
    const source = startFromOffscreen
      ? createOffscreenPoint(index)
      : (sourceCells[Math.floor((index / count) * sourceCells.length)] || sourceCells[index % sourceCells.length]);

    const sourceChar = startFromOffscreen
      ? getStreamChar(index * 13)
      : (source.char || getStreamChar(index * 17));
    const targetChar = target.char;
    const dx = target.x - source.x;
    const dy = target.y - source.y;
    const distance = Math.sqrt((dx * dx) + (dy * dy));
    const norm = Math.max(distance, 1);
    const perpX = dy / norm;
    const perpY = -dx / norm;

    return {
      sourceX: source.x,
      sourceY: source.y,
      targetX: target.x,
      targetY: target.y,
      sourceChar,
      targetChar,
      delay: cellNoise(target.x, target.y, seed) * 0.28,
      arc: ((cellNoise(source.x || index, source.y || index, seed + 3) * 2) - 1) * clamp(distance * 0.12, 2, 20),
      swirlRadius: clamp(distance * 0.05, 2, 10),
      swirlPhase: cellNoise(target.x, target.y, seed + 7) * Math.PI * 2,
      perpX,
      perpY
    };
  });
}

async function rebuildScene() {
  const masks = [];

  for (let index = 0; index < PATTERN_DEFS.length; index += 1) {
    const def = PATTERN_DEFS[index];
    const rawMask = await rasterizeMask(def.path, def.widthRatio, def.heightRatio, def.fitMode);
    masks.push(finalizeMask(rawMask, index, def.motionAmplitude, def.motionSpeed));
  }

  const titleRaw = rasterizeTextMask(TITLE_LINES, 0.84, 0.22, 'RPIGeistMono');
  const finalLogoRaw = await rasterizeMask(FINAL_LOGO_PATH, 0.68, 0.34, 'contain');

  state.masks = masks;
  state.titleMask = finalizeMask(titleRaw, 91, 0.72, 1.18);
  state.finalMask = {
    cells: finalLogoRaw.cells,
    grid: finalLogoRaw.grid,
    text: finalLogoRaw.grid.map((row) => row.join('')).join('\n')
  };
  state.introParticles = buildParticleSet([], masks[0].cells, 51, true);
  state.morphSets = masks.slice(0, -1).map((mask, index) =>
    buildParticleSet(mask.cells, masks[index + 1].cells, 71 + index, false)
  );
  state.titleMorphParticles = buildParticleSet(masks[masks.length - 1].cells, state.titleMask.cells, 161, false);
  state.finalMorphParticles = buildParticleSet(state.titleMask.cells, state.finalMask.cells, 191, false);
}

function createEmptyBuffer() {
  return Array.from({ length: state.rows }, () => Array(state.cols).fill(' '));
}

function paintAura(buffer, mask, elapsed, strength) {
  if (!mask?.auraCells?.length || strength <= 0) {
    return;
  }

  for (let index = 0; index < mask.auraCells.length; index += 1) {
    const aura = mask.auraCells[index];

    if (cellNoise(aura.anchorX, aura.anchorY, 463 + index) > strength) {
      continue;
    }

    const swing = Math.sin((elapsed * (mask.motionSpeed * 1.35)) + aura.phase) * aura.radius;
    const drift = Math.cos((elapsed * (mask.motionSpeed * 0.9)) + aura.phase) * 0.8;
    const x = clamp(aura.anchorX + aura.offsetX + Math.round(swing), 0, state.cols - 1);
    const y = clamp(aura.anchorY + aura.offsetY + Math.round(drift), 0, state.rows - 1);

    if (buffer[y][x] === ' ') {
      buffer[y][x] = aura.char;
    }
  }
}

function renderMask(mask, elapsed) {
  const buffer = createEmptyBuffer();
  paintAura(buffer, mask, elapsed, 0.74);

  for (const cell of mask.cells) {
    const slide = Math.sin((elapsed * mask.motionSpeed) + (cell.y * 0.16) + mask.motionPhase) * mask.motionAmplitude;
    const micro = Math.sin((elapsed * (mask.motionSpeed * 0.78)) + (cell.x * 0.03) + mask.motionPhase) * 0.9;
    const lift = Math.cos((elapsed * (mask.motionSpeed * 0.45)) + (cell.x * 0.025)) * 0.35;
    const x = clamp(cell.x + Math.round(slide + micro), 0, state.cols - 1);
    const y = clamp(cell.y + Math.round(lift), 0, state.rows - 1);

    if (buffer[y][x] === ' ') {
      buffer[y][x] = cell.char;
    }
  }

  return buffer.map((row) => row.join('')).join('\n');
}

function renderParticleTransition(particles, progress, elapsed, sourceMask = null, targetMask = null) {
  const buffer = createEmptyBuffer();

  if (sourceMask) {
    const fade = easeOutQuint(progress);
    paintAura(buffer, sourceMask, elapsed, Math.max(0, 0.7 - progress));

    for (const cell of sourceMask.cells) {
      if (cellNoise(cell.x, cell.y, 251) > fade) {
        buffer[cell.y][cell.x] = cell.char;
      }
    }
  }

  for (let index = 0; index < particles.length; index += 1) {
    const particle = particles[index];
    const local = clamp((progress - particle.delay) / (1 - particle.delay), 0, 1);
    const travel = local < 0.82
      ? easeInOutCubic(local / 0.82) * 0.94
      : 0.94 + (easeOutBack((local - 0.82) / 0.18) * 0.06);
    const magnet = clamp((local - 0.68) / 0.32, 0, 1);
    const arc = Math.sin(local * Math.PI) * particle.arc * (1 - magnet);
    const swirl = Math.pow(1 - local, 1.25) * particle.swirlRadius;
    const angle = particle.swirlPhase + (local * 6.2);
    const rawX = lerp(particle.sourceX, particle.targetX, travel) +
      (particle.perpX * arc) +
      (Math.cos(angle) * swirl);
    const rawY = lerp(particle.sourceY, particle.targetY, travel) +
      (particle.perpY * arc) +
      (Math.sin(angle) * swirl * 0.65);
    const x = Math.round(lerp(rawX, particle.targetX, magnet * magnet));
    const y = Math.round(lerp(rawY, particle.targetY, magnet * magnet));

    if (x < 0 || y < 0 || x >= state.cols || y >= state.rows) {
      continue;
    }

    buffer[y][x] = local > 0.72 ? particle.targetChar : particle.sourceChar;
  }

  if (targetMask) {
    const reveal = clamp((progress - 0.54) / 0.46, 0, 1);
    paintAura(buffer, targetMask, elapsed, reveal * 0.7);

    for (const cell of targetMask.cells) {
      if (cellNoise(cell.x, cell.y, 307) < reveal) {
        buffer[cell.y][cell.x] = cell.char;
      }
    }
  }

  return buffer.map((row) => row.join('')).join('\n');
}

function renderSettle(progress) {
  const buffer = state.finalMask.grid.map((row) => [...row]);

  for (const cell of state.finalMask.cells) {
    if (cellNoise(cell.x, cell.y, Math.floor(progress * 24) + 401) > (0.94 + (progress * 0.04))) {
      buffer[cell.y][cell.x] = getStreamChar((cell.y * state.cols) + cell.x);
    }
  }

  return buffer.map((row) => row.join('')).join('\n');
}

function timelineState(elapsed) {
  let remaining = elapsed;

  if (remaining < TIMING.intro) {
    return { type: 'intro', progress: remaining / TIMING.intro };
  }

  remaining -= TIMING.intro;

  if (remaining < TIMING.hold) {
    return { type: 'hold', maskIndex: 0, elapsed: remaining };
  }

  remaining -= TIMING.hold;

  for (let index = 0; index < state.masks.length - 1; index += 1) {
    if (remaining < TIMING.morph) {
      return { type: 'morph', from: index, to: index + 1, progress: remaining / TIMING.morph };
    }

    remaining -= TIMING.morph;

    if (remaining < TIMING.hold) {
      return { type: 'hold', maskIndex: index + 1, elapsed: remaining };
    }

    remaining -= TIMING.hold;
  }

  if (remaining < TIMING.titleMorph) {
    return {
      type: 'titleMorph',
      from: state.masks.length - 1,
      progress: remaining / TIMING.titleMorph
    };
  }

  remaining -= TIMING.titleMorph;

  if (remaining < TIMING.titleHold) {
    return { type: 'titleHold', elapsed: remaining };
  }

  remaining -= TIMING.titleHold;

  if (remaining < TIMING.finalMorph) {
    return {
      type: 'finalMorph',
      progress: remaining / TIMING.finalMorph
    };
  }

  remaining -= TIMING.finalMorph;

  if (remaining < TIMING.finalSettle) {
    return { type: 'settle', progress: remaining / TIMING.finalSettle };
  }

  return { type: 'done' };
}

function renderFrame(timestamp) {
  if (!state.startTime) {
    state.startTime = timestamp;
  }

  const elapsed = (timestamp - state.startTime) / 1000;
  const stage = timelineState(elapsed);

  if (stage.type === 'intro') {
    projection.textContent = renderParticleTransition(state.introParticles, stage.progress, elapsed, null, state.masks[0]);
    state.frameHandle = window.requestAnimationFrame(renderFrame);
    return;
  }

  if (stage.type === 'hold') {
    projection.textContent = renderMask(state.masks[stage.maskIndex], stage.elapsed);
    state.frameHandle = window.requestAnimationFrame(renderFrame);
    return;
  }

  if (stage.type === 'morph') {
    projection.textContent = renderParticleTransition(
      state.morphSets[stage.from],
      stage.progress,
      elapsed,
      state.masks[stage.from],
      state.masks[stage.to]
    );
    state.frameHandle = window.requestAnimationFrame(renderFrame);
    return;
  }

  if (stage.type === 'titleMorph') {
    projection.textContent = renderParticleTransition(
      state.titleMorphParticles,
      stage.progress,
      elapsed,
      state.masks[stage.from],
      state.titleMask
    );
    state.frameHandle = window.requestAnimationFrame(renderFrame);
    return;
  }

  if (stage.type === 'titleHold') {
    projection.textContent = renderMask(state.titleMask, stage.elapsed);
    state.frameHandle = window.requestAnimationFrame(renderFrame);
    return;
  }

  if (stage.type === 'finalMorph') {
    projection.textContent = renderParticleTransition(
      state.finalMorphParticles,
      stage.progress,
      elapsed,
      state.titleMask,
      state.finalMask
    );
    state.frameHandle = window.requestAnimationFrame(renderFrame);
    return;
  }

  if (stage.type === 'settle') {
    projection.textContent = renderSettle(stage.progress);
    state.frameHandle = window.requestAnimationFrame(renderFrame);
    return;
  }

  projection.textContent = state.finalMask.text;
}

async function prepare() {
  if (document.fonts && document.fonts.load) {
    await document.fonts.load('32px RPIGeistMono');
    await document.fonts.ready;
  }

  updateProjectionScale();
  await rebuildScene();
  projection.textContent = '';
  window.cancelAnimationFrame(state.frameHandle);
  state.frameHandle = 0;
  state.startTime = 0;
  state.frameHandle = window.requestAnimationFrame(renderFrame);
}

window.addEventListener('resize', async () => {
  updateProjectionScale();
  await rebuildScene();
  state.startTime = 0;
  window.cancelAnimationFrame(state.frameHandle);
  state.frameHandle = window.requestAnimationFrame(renderFrame);
});

prepare().catch((error) => {
  projection.textContent = error.message;
});
