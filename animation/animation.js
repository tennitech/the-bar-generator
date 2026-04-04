const PATTERN_PATH = '/animation/data/rpi-pattern-1.svg';
const LOGO_PATH = '/animation/data/rpi-logo-5.svg';
const projection = document.getElementById('animation-projection');
const DENSITY_RAMP = ' .,:-=+*#%@';

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
  cols: 320,
  rows: 96,
  sourceCells: [],
  sourceGrid: [],
  sourceText: '',
  patternCells: [],
  logoCells: [],
  patternText: '',
  finalGrid: [],
  finalText: '',
  particles: [],
  frameHandle: 0,
  startTime: 0
};

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function easeInOutCubic(value) {
  if (value < 0.5) {
    return 4 * value * value * value;
  }

  return 1 - Math.pow(-2 * value + 2, 3) / 2;
}

function updateProjectionScale() {
  const widthFactor = 0.6;
  const heightFactor = 0.82;
  const fontSizeFromWidth = (window.innerWidth - 12) / (state.cols * widthFactor);
  const fontSizeFromHeight = (window.innerHeight - 12) / (state.rows * heightFactor);
  const fontSize = Math.max(3, Math.floor(Math.min(fontSizeFromWidth, fontSizeFromHeight, 6)));

  projection.style.fontSize = `${fontSize}px`;
  projection.style.lineHeight = `${Math.max(4, Math.round(fontSize * 0.8))}px`;
}

function measureCellMetrics() {
  const probe = document.createElement('span');
  probe.textContent = 'M';
  probe.style.position = 'absolute';
  probe.style.visibility = 'hidden';
  probe.style.fontFamily = 'RPIGeistMono, monospace';
  probe.style.fontSize = projection.style.fontSize;
  probe.style.lineHeight = projection.style.lineHeight;
  document.body.appendChild(probe);
  const rect = probe.getBoundingClientRect();
  probe.remove();
  return {
    width: rect.width || 4,
    height: rect.height || 6
  };
}

async function rasterizeMask(path, maxWidthRatio, maxHeightRatio, fitMode = 'contain') {
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

  const logoWidth = image.naturalWidth || image.width;
  const logoHeight = image.naturalHeight || image.height;
  const logoAspect = logoWidth / logoHeight;
  const maxWidth = canvas.width * maxWidthRatio;
  const maxHeight = canvas.height * maxHeightRatio;
  let drawWidth = maxWidth;
  let drawHeight = drawWidth / logoAspect;

  if (fitMode === 'cover') {
    if (drawHeight < maxHeight) {
      drawHeight = maxHeight;
      drawWidth = drawHeight * logoAspect;
    }
  } else if (drawHeight > maxHeight) {
    drawHeight = maxHeight;
    drawWidth = drawHeight * logoAspect;
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

  return {
    cells,
    grid,
    text: grid
      .map((row) => row.join(''))
      .join('\n')
  };
}

function getStreamChar(index) {
  return stream[index % stream.length];
}

function buildSourceField(patternGrid) {
  state.sourceGrid = Array.from({ length: state.rows }, () => Array(state.cols).fill(' '));
  state.sourceCells = [];

  for (let row = 0; row < state.rows; row += 1) {
    for (let col = 0; col < state.cols; col += 1) {
      const patternChar = patternGrid[row]?.[col] || ' ';
      const fallbackChar = getStreamChar((row * state.cols) + col);
      const sparseBackground = cellNoise(col, row, 5) > 0.88 ? fallbackChar : ' ';
      const char = patternChar === ' ' ? sparseBackground : patternChar;

      state.sourceGrid[row][col] = char;
      state.sourceCells.push({ x: col, y: row, char });
    }
  }

  state.sourceText = state.sourceGrid
    .map((row) => row.join(''))
    .join('\n');
}

function buildParticles() {
  const sourceCount = state.sourceCells.length;
  const targetCount = state.logoCells.length;

  state.particles = Array.from({ length: targetCount }, (_, index) => {
    const source = state.sourceCells[(index * 7919) % sourceCount];
    const target = state.logoCells[index];

    return {
      sourceX: source.x,
      sourceY: source.y,
      targetX: target.x,
      targetY: target.y,
      sourceChar: source.char,
      targetChar: target.char
    };
  });
}

async function loadMasks() {
  const patternMask = await rasterizeMask(PATTERN_PATH, 1, 1, 'cover');
  const logoMask = await rasterizeMask(LOGO_PATH, 0.72, 0.38, 'contain');

  state.patternCells = patternMask.cells;
  state.patternText = patternMask.text;
  buildSourceField(patternMask.grid);
  state.logoCells = logoMask.cells;
  state.finalGrid = logoMask.grid;
  state.finalText = logoMask.text;
  buildParticles();
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

function densityToChar(density) {
  if (density < 0.06) {
    return ' ';
  }

  const normalized = clamp((density - 0.06) / 0.94, 0, 1);
  const eased = Math.pow(normalized, 0.85);
  const index = Math.min(DENSITY_RAMP.length - 1, Math.floor(eased * (DENSITY_RAMP.length - 1)));
  return DENSITY_RAMP[index];
}

function cellNoise(x, y, seed) {
  const value = Math.sin((x * 12.9898) + (y * 78.233) + (seed * 37.719)) * 43758.5453;
  return value - Math.floor(value);
}

function dissolveOrder(x, y, seed) {
  const centeredX = (x / Math.max(1, state.cols - 1)) - 0.5;
  const centeredY = (y / Math.max(1, state.rows - 1)) - 0.5;
  const radial = Math.sqrt((centeredX * centeredX) + (centeredY * centeredY));
  const noise = cellNoise(x, y, seed);

  return clamp((noise * 0.7) + (radial * 0.35), 0, 1);
}

function renderCollapse(progress) {
  const buffer = Array.from({ length: state.rows }, () => Array(state.cols).fill(' '));
  const backgroundFade = clamp(progress * 1.5, 0, 1);
  const motionProgress = 1 - Math.pow(1 - progress, 4);

  for (const cell of state.sourceCells) {
    if (dissolveOrder(cell.x, cell.y, 1) > backgroundFade) {
      buffer[cell.y][cell.x] = cell.char;
    }
  }

  for (const particle of state.particles) {
    const x = Math.round(particle.sourceX + ((particle.targetX - particle.sourceX) * motionProgress));
    const y = Math.round(particle.sourceY + ((particle.targetY - particle.sourceY) * motionProgress));
    const char = progress < 0.72 ? particle.sourceChar : particle.targetChar;

    if (x >= 0 && y >= 0 && x < state.cols && y < state.rows) {
      buffer[y][x] = char;
    }
  }

  return buffer.map((row) => row.join('')).join('\n');
}

function renderFrame(timestamp) {
  if (!state.startTime) {
    state.startTime = timestamp;
  }

  const elapsed = (timestamp - state.startTime) / 1000;
  const holdDuration = 0.08;
  const collapseDuration = 0.58;
  const collapseProgress = clamp((elapsed - holdDuration) / collapseDuration, 0, 1);
  const collapseEase = easeInOutCubic(collapseProgress);

  if (elapsed <= holdDuration) {
    projection.textContent = state.sourceText;
    state.frameHandle = window.requestAnimationFrame(renderFrame);
    return;
  }

  projection.textContent = renderCollapse(collapseEase);

  if (collapseProgress < 1) {
    state.frameHandle = window.requestAnimationFrame(renderFrame);
  }
}

async function prepare() {
  if (document.fonts && document.fonts.load) {
    await document.fonts.load('32px RPIGeistMono');
    await document.fonts.ready;
  }

  updateProjectionScale();
  await loadMasks();
  projection.textContent = state.sourceText;
  window.cancelAnimationFrame(state.frameHandle);
  state.frameHandle = 0;
  state.startTime = 0;
  state.frameHandle = window.requestAnimationFrame(renderFrame);
}

window.addEventListener('resize', async () => {
  updateProjectionScale();
  await loadMasks();
  state.startTime = 0;
  window.cancelAnimationFrame(state.frameHandle);
  state.frameHandle = window.requestAnimationFrame(renderFrame);
});

prepare().catch((error) => {
  projection.textContent = error.message;
});
