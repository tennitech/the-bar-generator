const THEMES = {
  measure: {
    summary: 'Theme 01: the bar as survey, coordinate, tolerance, and scientific measure.',
    fragments: [
      "surveyor's rod",
      '500 x 36 px',
      '42.7284 n',
      '73.6788 w',
      'troy new york',
      'kelvin 273.15',
      'joules 42.6',
      'lumens 880',
      'watts 1200',
      'aperture',
      'nanometers',
      'vector field',
      'calibration',
      'signal strength',
      'molecular mass',
      'torque',
      'altitude',
      'load path',
      'measurement bar',
      'technical excellence',
      'bar law',
      'precision',
      'tolerance',
      'coordinates',
      'acoustics'
    ],
    color: [214, 0, 28],
    accent: [162, 18, 37],
    drift: 0.08
  },
  experiment: {
    summary: 'Theme 02: build, test, break, rebuild, and keep asking what if we tried this.',
    fragments: [
      'what if we tried this',
      'why not change the world',
      'build',
      'test',
      'break',
      'rebuild',
      'rigorous inquiry',
      'hands-on application',
      'curious',
      'humble',
      'genuine',
      'resilient',
      'offbeat',
      'relatable',
      'set your own bar',
      'experiment',
      'encode meaning',
      'iterate',
      'prototype',
      'discipline and imagination',
      'failure becomes learning',
      'question first',
      'explore alongside'
    ],
    color: [214, 0, 28],
    accent: [148, 22, 39],
    drift: -0.04
  },
  build: {
    summary: 'Theme 03: research domains, campus systems, and the work of building the new.',
    fragments: [
      'building the new',
      'materials science',
      'architecture',
      'computing',
      'data visualization',
      'energy systems',
      'robotics',
      'human-centered design',
      'advanced manufacturing',
      'simulation',
      'signal processing',
      'performance',
      'empac',
      'fabrication',
      'studio',
      'lab',
      'civic infrastructure',
      'climate systems',
      'campus as test bed',
      'rpi forward',
      'sustainability',
      'biotechnology',
      'quantum'
    ],
    color: [214, 0, 28],
    accent: [174, 24, 43],
    drift: 0.04
  }
};

const canvas = document.getElementById('animation-canvas');
const summary = document.getElementById('animation-summary');
const buttons = Array.from(document.querySelectorAll('.animation_mode_button'));
const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

const state = {
  ctx: canvas.getContext('2d'),
  width: 0,
  height: 0,
  dpr: 1,
  frameId: 0,
  glyphs: [],
  activeTheme: 'measure',
  lastTime: 0,
  lineHeight: 10
};

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function lerp(start, end, amount) {
  return start + (end - start) * amount;
}

function rand(min, max) {
  return Math.random() * (max - min) + min;
}

function hash2d(x, y) {
  const value = Math.sin((x * 127.1) + (y * 311.7)) * 43758.5453123;
  return value - Math.floor(value);
}

function smoothstep(value) {
  return value * value * (3 - (2 * value));
}

function noise2d(x, y) {
  const x0 = Math.floor(x);
  const y0 = Math.floor(y);
  const xf = x - x0;
  const yf = y - y0;
  const u = smoothstep(xf);
  const v = smoothstep(yf);

  const topLeft = hash2d(x0, y0);
  const topRight = hash2d(x0 + 1, y0);
  const bottomLeft = hash2d(x0, y0 + 1);
  const bottomRight = hash2d(x0 + 1, y0 + 1);

  const top = lerp(topLeft, topRight, u);
  const bottom = lerp(bottomLeft, bottomRight, u);
  return lerp(top, bottom, v);
}

function buildToken(themeKey) {
  const phrase = THEMES[themeKey].fragments[Math.floor(Math.random() * THEMES[themeKey].fragments.length)].toUpperCase();
  const parts = phrase.split(/\s+/).filter(Boolean);
  const mode = Math.random();

  if (mode < 0.3 && phrase.length > 4) {
    const length = Math.floor(rand(2, Math.min(10, phrase.length)));
    const start = Math.floor(rand(0, Math.max(1, phrase.length - length)));
    return phrase.slice(start, start + length).trim();
  }

  if (mode < 0.7 && parts.length > 1) {
    const first = parts[Math.floor(Math.random() * parts.length)];
    const second = parts[Math.floor(Math.random() * parts.length)];
    return `${first} ${second}`.slice(0, 14);
  }

  return parts[Math.floor(Math.random() * parts.length)] || phrase;
}

function createGlyph(index) {
  return {
    index,
    x: rand(0, state.width),
    y: rand(0, state.height),
    vx: rand(-0.3, 0.3),
    vy: rand(-0.3, 0.3),
    token: buildToken(state.activeTheme),
    size: rand(8, 14),
    opacity: rand(0.2, 0.82),
    speed: rand(0.35, 1),
    phase: rand(0, Math.PI * 2),
    life: rand(90, 260)
  };
}

function resetGlyph(glyph, edgeMode = false) {
  glyph.token = buildToken(state.activeTheme);
  glyph.size = rand(8, 14);
  glyph.opacity = rand(0.2, 0.82);
  glyph.speed = rand(0.35, 1);
  glyph.phase = rand(0, Math.PI * 2);
  glyph.life = rand(90, 260);

  if (edgeMode) {
    const edge = Math.floor(rand(0, 4));

    if (edge === 0) {
      glyph.x = -160;
      glyph.y = rand(0, state.height);
    } else if (edge === 1) {
      glyph.x = state.width + 160;
      glyph.y = rand(0, state.height);
    } else if (edge === 2) {
      glyph.x = rand(0, state.width);
      glyph.y = -40;
    } else {
      glyph.x = rand(0, state.width);
      glyph.y = state.height + 40;
    }
  } else {
    glyph.x = rand(0, state.width);
    glyph.y = rand(0, state.height);
  }

  glyph.vx = rand(-0.3, 0.3);
  glyph.vy = rand(-0.3, 0.3);
}

function resizeCanvas() {
  state.dpr = window.devicePixelRatio || 1;
  state.width = window.innerWidth;
  state.height = window.innerHeight;
  canvas.width = Math.round(state.width * state.dpr);
  canvas.height = Math.round(state.height * state.dpr);
  state.ctx.setTransform(1, 0, 0, 1, 0, 0);
  state.ctx.scale(state.dpr, state.dpr);
  state.ctx.textBaseline = 'middle';
  state.lineHeight = state.width < 640 ? 8 : 10;

  const targetCount = clamp(Math.floor((state.width * state.height) / 2100), 360, 1100);
  state.glyphs = Array.from({ length: targetCount }, (_, index) => createGlyph(index));
}

function updateGlyph(glyph, dt, elapsed) {
  const theme = THEMES[state.activeTheme];
  const centerX = state.width * 0.5;
  const centerY = state.height * 0.5;
  const dx = glyph.x - centerX;
  const dy = glyph.y - centerY;
  const distance = Math.hypot(dx, dy) || 1;
  const distanceRatio = distance / Math.max(state.width, state.height);
  const swirlAngle = Math.atan2(dy, dx) + (Math.PI * 0.5);
  const noiseA = noise2d((glyph.x * 0.0026) + (elapsed * 0.05), (glyph.y * 0.003) - (elapsed * 0.04));
  const noiseB = noise2d((glyph.y * 0.0023) - (elapsed * 0.02), (glyph.x * 0.0028) + (elapsed * 0.05));
  const flowAngle = swirlAngle + ((noiseA - 0.5) * 1.8) + ((noiseB - 0.5) * 0.6);
  const swirlStrength = 0.03 + ((1 - clamp(distanceRatio, 0, 1)) * 0.07);
  const flowX = Math.cos(flowAngle) * swirlStrength + theme.drift;
  const flowY = Math.sin(flowAngle) * swirlStrength;

  glyph.vx = (glyph.vx * 0.95) + (flowX * glyph.speed * dt * 60);
  glyph.vy = (glyph.vy * 0.95) + (flowY * glyph.speed * dt * 60);

  glyph.x += glyph.vx;
  glyph.y += glyph.vy;
  glyph.life -= dt * 60;

  if (Math.random() < 0.007) {
    glyph.token = buildToken(state.activeTheme);
  }

  if (
    glyph.x < -220 ||
    glyph.x > state.width + 220 ||
    glyph.y < -80 ||
    glyph.y > state.height + 80 ||
    glyph.life <= 0
  ) {
    resetGlyph(glyph, true);
  }
}

function drawFieldBackground(ctx) {
  ctx.clearRect(0, 0, state.width, state.height);
  ctx.fillStyle = 'rgba(255, 251, 252, 0.92)';
  ctx.fillRect(0, 0, state.width, state.height);

  ctx.save();
  ctx.strokeStyle = 'rgba(214, 0, 28, 0.06)';
  ctx.lineWidth = 1;
  for (let y = 0; y <= state.height; y += state.lineHeight) {
    ctx.beginPath();
    ctx.moveTo(0, y + 0.5);
    ctx.lineTo(state.width, y + 0.5);
    ctx.stroke();
  }
  ctx.restore();
}

function drawGlyph(ctx, glyph) {
  const theme = THEMES[state.activeTheme];
  const alpha = glyph.opacity * 0.72;
  const useAccent = noise2d(glyph.x * 0.002, glyph.y * 0.002) > 0.78;
  const color = useAccent ? theme.accent : theme.color;
  const drawY = Math.round(glyph.y / state.lineHeight) * state.lineHeight;

  ctx.font = `${glyph.size}px RPIGeistMono, monospace`;
  ctx.fillStyle = `rgba(${color[0]}, ${color[1]}, ${color[2]}, ${alpha})`;
  ctx.fillText(glyph.token, glyph.x, drawY);
}

function drawFrame(timestamp) {
  if (!state.lastTime) {
    state.lastTime = timestamp;
  }

  const dt = Math.min(0.033, (timestamp - state.lastTime) / 1000);
  state.lastTime = timestamp;

  drawFieldBackground(state.ctx);

  for (const glyph of state.glyphs) {
    updateGlyph(glyph, dt, timestamp * 0.001);
    drawGlyph(state.ctx, glyph);
  }

  state.frameId = window.requestAnimationFrame(drawFrame);
}

function drawStaticFrame() {
  drawFieldBackground(state.ctx);

  for (const glyph of state.glyphs) {
    drawGlyph(state.ctx, glyph);
  }
}

function setTheme(themeKey) {
  state.activeTheme = themeKey;
  summary.textContent = THEMES[themeKey].summary;

  for (const button of buttons) {
    const isActive = button.dataset.theme === themeKey;
    button.classList.toggle('is-active', isActive);
    button.setAttribute('aria-pressed', String(isActive));
  }

  for (const glyph of state.glyphs) {
    glyph.token = buildToken(themeKey);
  }

  if (reducedMotionQuery.matches) {
    drawStaticFrame();
  }
}

function startAnimation() {
  window.cancelAnimationFrame(state.frameId);
  state.frameId = 0;
  state.lastTime = 0;

  if (reducedMotionQuery.matches) {
    drawStaticFrame();
    return;
  }

  state.frameId = window.requestAnimationFrame(drawFrame);
}

for (const button of buttons) {
  button.addEventListener('click', () => {
    if (button.dataset.theme) {
      setTheme(button.dataset.theme);
    }
  });
}

window.addEventListener('resize', () => {
  resizeCanvas();
  startAnimation();
});

reducedMotionQuery.addEventListener('change', () => {
  startAnimation();
});

resizeCanvas();
setTheme(state.activeTheme);
startAnimation();
