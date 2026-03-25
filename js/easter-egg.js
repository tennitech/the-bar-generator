(function (globalScope, factory) {
  const api = factory();
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }
  if (globalScope) {
    globalScope.RPIRinkRush = api;
  }
})(typeof window !== 'undefined' ? window : globalThis, function () {
  const STORAGE_KEY = 'rpi-rink-rush-profile';
  const DEFAULT_PROFILE = {
    highScore: 0,
    bestCombo: 0,
    runs: 0,
    totalPickups: 0
  };

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function lerp(start, end, amount) {
    return start + (end - start) * amount;
  }

  function easeOutCubic(value) {
    return 1 - Math.pow(1 - value, 3);
  }

  function easeOutExpo(value) {
    if (value <= 0) return 0;
    if (value >= 1) return 1;
    return 1 - Math.pow(2, -10 * value);
  }

  function isFiniteNumber(value) {
    return typeof value === 'number' && Number.isFinite(value);
  }

  function readProfile() {
    if (typeof window === 'undefined' || !window.localStorage) {
      return { ...DEFAULT_PROFILE };
    }

    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return { ...DEFAULT_PROFILE };
      const parsed = JSON.parse(raw);
      return {
        highScore: Math.max(0, parseInt(parsed.highScore, 10) || 0),
        bestCombo: Math.max(0, parseInt(parsed.bestCombo, 10) || 0),
        runs: Math.max(0, parseInt(parsed.runs, 10) || 0),
        totalPickups: Math.max(0, parseInt(parsed.totalPickups, 10) || 0)
      };
    } catch (error) {
      return { ...DEFAULT_PROFILE };
    }
  }

  function writeProfile(profile) {
    if (typeof window === 'undefined' || !window.localStorage) {
      return profile;
    }

    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
    } catch (error) {
      // Ignore storage failures; the game still works without persistence.
    }
    return profile;
  }

  function computeDifficulty(score) {
    const safeScore = Math.max(0, parseInt(score, 10) || 0);
    const ramp = clamp(safeScore / 1400, 0, 1.6);

    return {
      ramp,
      speed: 540 + ramp * 280,
      spawnEvery: clamp(1.2 - ramp * 0.34, 0.58, 1.2),
      spawnJitter: clamp(0.48 - ramp * 0.14, 0.18, 0.48),
      pickupEvery: clamp(2.45 - ramp * 0.48, 1.1, 2.45),
      bulletDrain: 22 + ramp * 6,
      obstacleWeights: {
        puck: 1.25,
        check: 0.7 + ramp * 0.65,
        stick: 0.55 + ramp * 0.85,
        split: safeScore < 260 ? 0 : 0.18 + ramp * 0.55
      }
    };
  }

  function formatArcadeScore(score, minimumDigits) {
    const safeScore = Math.max(0, parseInt(score, 10) || 0);
    const digits = Math.max(1, parseInt(minimumDigits, 10) || 3);
    const raw = String(safeScore);
    return raw.length >= digits ? raw : raw.padStart(digits, '0');
  }

  function getScoreboardExtension(score) {
    const safeScore = Math.max(0, parseInt(score, 10) || 0);
    if (safeScore <= 999) return 0;
    return clamp((safeScore - 999) / 450, 0, 1);
  }

  function pickObstacleType(score, recentTypes, rng) {
    const randomValue = typeof rng === 'function' ? rng() : Math.random();
    const recent = Array.isArray(recentTypes) ? recentTypes.slice(-2) : [];
    const weights = computeDifficulty(score).obstacleWeights;

    const candidates = Object.keys(weights)
      .map((type) => {
        let weight = weights[type];
        if (recent[recent.length - 1] === type) weight *= 0.4;
        if (recent[recent.length - 2] === type) weight *= 0.75;
        return { type, weight };
      })
      .filter((entry) => entry.weight > 0);

    const total = candidates.reduce((sum, entry) => sum + entry.weight, 0);
    if (total <= 0 || candidates.length === 0) {
      return 'puck';
    }

    let threshold = clamp(randomValue, 0, 0.999999) * total;
    for (let index = 0; index < candidates.length; index += 1) {
      threshold -= candidates[index].weight;
      if (threshold <= 0) {
        return candidates[index].type;
      }
    }

    return candidates[candidates.length - 1].type;
  }

  function scoreToRank(score, combo) {
    const safeScore = Math.max(0, parseInt(score, 10) || 0);
    const safeCombo = Math.max(0, parseInt(combo, 10) || 0);

    if (safeScore >= 1400 || safeCombo >= 12) return 'PUCKMAN LEGEND';
    if (safeScore >= 1000 || safeCombo >= 9) return 'OVERTIME HERO';
    if (safeScore >= 650 || safeCombo >= 6) return 'GLASS BREAKER';
    if (safeScore >= 350 || safeCombo >= 4) return 'RINK SCHOLAR';
    return 'FRESH ICE';
  }

  function roundedRect(ctx, x, y, width, height, radius) {
    const actualRadius = Math.min(radius, width / 2, height / 2);
    ctx.beginPath();
    ctx.moveTo(x + actualRadius, y);
    ctx.lineTo(x + width - actualRadius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + actualRadius);
    ctx.lineTo(x + width, y + height - actualRadius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - actualRadius, y + height);
    ctx.lineTo(x + actualRadius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - actualRadius);
    ctx.lineTo(x, y + actualRadius);
    ctx.quadraticCurveTo(x, y, x + actualRadius, y);
    ctx.closePath();
  }

  function drawRoundedPanel(ctx, x, y, width, height, radius, fill, stroke) {
    roundedRect(ctx, x, y, width, height, radius);
    if (fill) {
      ctx.fillStyle = fill;
      ctx.fill();
    }
    if (stroke) {
      ctx.strokeStyle = stroke;
      ctx.lineWidth = 1;
      ctx.stroke();
    }
  }

  function drawSegmentDigit(ctx, character, x, y, width, height, color, offColor) {
    const segmentThickness = Math.max(2, Math.round(width * 0.16));
    const segmentPadding = Math.round(segmentThickness * 0.6);
    const segmentLengthHorizontal = width - segmentPadding * 2;
    const segmentLengthVertical = height / 2 - segmentPadding * 1.75;

    const segmentsByCharacter = {
      '0': ['a', 'b', 'c', 'd', 'e', 'f'],
      '1': ['b', 'c'],
      '2': ['a', 'b', 'g', 'e', 'd'],
      '3': ['a', 'b', 'g', 'c', 'd'],
      '4': ['f', 'g', 'b', 'c'],
      '5': ['a', 'f', 'g', 'c', 'd'],
      '6': ['a', 'f', 'g', 'e', 'c', 'd'],
      '7': ['a', 'b', 'c'],
      '8': ['a', 'b', 'c', 'd', 'e', 'f', 'g'],
      '9': ['a', 'b', 'c', 'd', 'f', 'g'],
      'A': ['a', 'b', 'c', 'e', 'f', 'g'],
      'B': ['c', 'd', 'e', 'f', 'g'],
      'C': ['a', 'd', 'e', 'f'],
      'D': ['b', 'c', 'd', 'e', 'g'],
      'E': ['a', 'd', 'e', 'f', 'g'],
      'F': ['a', 'e', 'f', 'g'],
      '-': ['g']
    };

    const activeSegments = new Set(segmentsByCharacter[String(character).toUpperCase()] || []);
    const segments = {
      a: { x: x + segmentPadding, y, w: segmentLengthHorizontal, h: segmentThickness },
      b: { x: x + width - segmentThickness, y: y + segmentPadding, w: segmentThickness, h: segmentLengthVertical },
      c: { x: x + width - segmentThickness, y: y + height / 2 + segmentPadding * 0.5, w: segmentThickness, h: segmentLengthVertical },
      d: { x: x + segmentPadding, y: y + height - segmentThickness, w: segmentLengthHorizontal, h: segmentThickness },
      e: { x, y: y + height / 2 + segmentPadding * 0.5, w: segmentThickness, h: segmentLengthVertical },
      f: { x, y: y + segmentPadding, w: segmentThickness, h: segmentLengthVertical },
      g: { x: x + segmentPadding, y: y + height / 2 - segmentThickness / 2, w: segmentLengthHorizontal, h: segmentThickness }
    };

    Object.keys(segments).forEach((segmentName) => {
      const segment = segments[segmentName];
      ctx.fillStyle = activeSegments.has(segmentName) ? color : offColor;
      drawRoundedPanel(ctx, segment.x, segment.y, segment.w, segment.h, segmentThickness / 2, ctx.fillStyle, null);
    });
  }

  function drawSegmentNumber(ctx, text, x, y, width, height, color, offColor, spacing) {
    const characters = String(text).split('');
    let currentX = x;
    characters.forEach((character) => {
      drawSegmentDigit(ctx, character, currentX, y, width, height, color, offColor);
      currentX += width + spacing;
    });
  }

  function createHitbox(obstacle) {
    if (obstacle.type === 'split') {
      return [
        { x: obstacle.x, y: obstacle.gapY + obstacle.gapHeight + obstacle.gapPadding, width: obstacle.width, height: obstacle.lowerHeight },
        { x: obstacle.x + obstacle.width * 0.18, y: obstacle.gapY - obstacle.upperHeight - obstacle.gapPadding, width: obstacle.width * 0.72, height: obstacle.upperHeight }
      ];
    }
    return [{ x: obstacle.x, y: obstacle.y, width: obstacle.width, height: obstacle.height }];
  }

  function boxesIntersect(boxA, boxB) {
    return boxA.x < boxB.x + boxB.width &&
      boxA.x + boxA.width > boxB.x &&
      boxA.y < boxB.y + boxB.height &&
      boxA.y + boxA.height > boxB.y;
  }

  class RinkRushGame {
    constructor(canvas, options) {
      this.canvas = canvas;
      this.ctx = canvas ? canvas.getContext('2d') : null;
      this.options = options || {};
      this.onExit = this.options.onExit || null;
      this.onStateChange = this.options.onStateChange || null;
      this.audioEnabled = this.options.audio !== false;
      this.loopHandle = 0;
      this.active = false;
      this.phase = 'idle';
      this.phaseTimer = 0;
      this.profile = readProfile();
      this.audioContext = null;
      this.motion = 0;
      this.controls = {
        duck: false,
        bullet: false
      };
      this.loop = this.loop.bind(this);
      this.lastFrame = 0;
      this.pixelRatio = 1;
      this.width = canvas ? (canvas.clientWidth || 1280) : 1280;
      this.height = canvas ? (canvas.clientHeight || 720) : 720;
      this.bootPulse = 0;
      this.flash = 0;
      this.shake = 0;
      this.glow = 0;
      this.scorePop = 0;
      this.countdown = 3;
      this.message = '';
      this.worldTime = 0;
      this.resetRun();
      this.resize(this.width, this.height);
    }

    emitState() {
      if (typeof this.onStateChange === 'function') {
        this.onStateChange(this.getState());
      }
    }

    getState() {
      return {
        active: this.active,
        phase: this.phase,
        score: this.score,
        displayScore: Math.round(this.displayScore),
        combo: this.combo,
        meter: this.meter,
        highScore: this.profile.highScore,
        rank: scoreToRank(this.score, this.combo),
        gameOver: this.phase === 'gameover'
      };
    }

    ensureAudio() {
      if (!this.audioEnabled || typeof window === 'undefined') {
        return null;
      }
      const AudioCtor = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtor) {
        return null;
      }
      if (!this.audioContext) {
        try {
          this.audioContext = new AudioCtor();
        } catch (error) {
          this.audioContext = null;
        }
      }
      if (this.audioContext && this.audioContext.state === 'suspended') {
        this.audioContext.resume().catch(() => {});
      }
      return this.audioContext;
    }

    playSound(type) {
      const audioContext = this.ensureAudio();
      if (!audioContext) return;

      const now = audioContext.currentTime;
      const master = audioContext.createGain();
      master.connect(audioContext.destination);
      master.gain.setValueAtTime(0.0001, now);
      master.gain.exponentialRampToValueAtTime(0.12, now + 0.01);
      master.gain.exponentialRampToValueAtTime(0.0001, now + 0.18);

      const oscillator = audioContext.createOscillator();
      oscillator.connect(master);
      oscillator.type = type === 'collect' ? 'triangle' : 'square';

      let from = 220;
      let to = 110;
      let duration = 0.18;

      if (type === 'jump') {
        from = 420;
        to = 220;
      } else if (type === 'bullet') {
        from = 180;
        to = 260;
        duration = 0.12;
      } else if (type === 'collect') {
        from = 520;
        to = 860;
        duration = 0.16;
      } else if (type === 'hit') {
        from = 160;
        to = 48;
        duration = 0.22;
      } else if (type === 'boot') {
        from = 330;
        to = 660;
        duration = 0.2;
      }

      oscillator.frequency.setValueAtTime(from, now);
      oscillator.frequency.exponentialRampToValueAtTime(Math.max(30, to), now + duration);
      oscillator.start(now);
      oscillator.stop(now + duration);
    }

    resize(width, height) {
      this.width = Math.max(320, width || (this.canvas ? this.canvas.clientWidth : 1280));
      this.height = Math.max(240, height || (this.canvas ? this.canvas.clientHeight : 720));
      this.pixelRatio = typeof window !== 'undefined' ? Math.min(window.devicePixelRatio || 1, 2) : 1;

      if (this.canvas) {
        this.canvas.width = Math.round(this.width * this.pixelRatio);
        this.canvas.height = Math.round(this.height * this.pixelRatio);
        this.canvas.style.width = this.width + 'px';
        this.canvas.style.height = this.height + 'px';
      }

      if (this.ctx) {
        this.ctx.setTransform(this.pixelRatio, 0, 0, this.pixelRatio, 0, 0);
        this.ctx.imageSmoothingEnabled = false;
      }

      this.unit = Math.min(this.width, this.height);
      this.trackY = this.height * 0.77;
      this.trackHeight = Math.max(18, this.unit * 0.045);
      this.trackGlowY = this.trackY - this.trackHeight * 1.9;
      this.wordmarkY = this.height * 0.26;
      this.wordmarkWidth = Math.min(this.width * 0.42, this.unit * 0.75);
      this.panelWidth = Math.max(88, this.unit * 0.135);
      this.panelBaseHeight = Math.max(182, this.unit * 0.36);
      this.leftPanelX = this.width * 0.5 - this.wordmarkWidth * 0.48 - this.panelWidth * 0.55;
      this.rightPanelX = this.width * 0.5 + this.wordmarkWidth * 0.35;
      this.panelY = this.wordmarkY - 24;
      this.playerX = this.width * 0.24;
      this.playerFloorY = this.trackY - this.trackHeight * 0.45;
      this.playerRadius = this.unit * 0.05;
      this.playerStandingHeight = this.unit * 0.165;
      this.playerDuckingHeight = this.unit * 0.1;
      this.playerWidth = this.unit * 0.112;
      this.jumpVelocity = this.unit * 1.02;
      this.gravity = this.unit * 2.9;
      this.spawnPadding = this.unit * 0.12;
    }

    resetRun() {
      this.phase = 'boot';
      this.phaseTimer = 0;
      this.countdown = 3;
      this.score = 0;
      this.displayScore = 0;
      this.combo = 0;
      this.bestComboRun = 0;
      this.distance = 0;
      this.elapsed = 0;
      this.message = 'THAWING SECRET RINK';
      this.meter = 66;
      this.flash = 0;
      this.shake = 0;
      this.glow = 0;
      this.scorePop = 0;
      this.worldTime = 0;
      this.recentTypes = [];
      this.obstacles = [];
      this.pickups = [];
      this.particles = [];
      this.spawnTimer = 0.8;
      this.pickupTimer = 1.4;
      this.displaySlow = 0;
      this.player = {
        lift: 0,
        velocity: 0,
        duckBlend: 0,
        coyote: 0,
        jumpBuffer: 0,
        landed: true
      };
      this.controls.duck = false;
      this.controls.bullet = false;
    }

    open(triggerSource) {
      this.profile = readProfile();
      this.triggerSource = triggerSource || 'secret';
      this.resetRun();
      this.active = true;
      this.lastFrame = 0;
      this.playSound('boot');
      this.emitState();
      if (!this.loopHandle && typeof requestAnimationFrame === 'function') {
        this.loopHandle = requestAnimationFrame(this.loop);
      }
    }

    close() {
      this.active = false;
      this.phase = 'idle';
      this.controls.duck = false;
      this.controls.bullet = false;
      if (this.loopHandle && typeof cancelAnimationFrame === 'function') {
        cancelAnimationFrame(this.loopHandle);
      }
      this.loopHandle = 0;
      this.emitState();
      if (typeof this.onExit === 'function') {
        this.onExit(this.getState());
      }
    }

    restart() {
      if (!this.active) {
        this.open('restart');
        return;
      }
      this.resetRun();
      this.playSound('boot');
      this.emitState();
    }

    isGameOver() {
      return this.phase === 'gameover';
    }

    queueJump() {
      this.player.jumpBuffer = 0.16;
      if (this.phase === 'gameover') {
        this.restart();
      }
    }

    setControl(controlName, active) {
      if (controlName === 'jump') {
        if (active) {
          this.queueJump();
        }
        return;
      }

      if (controlName === 'duck') {
        this.controls.duck = !!active;
      }

      if (controlName === 'bullet') {
        if (active && !this.controls.bullet && this.meter > 8) {
          this.playSound('bullet');
        }
        this.controls.bullet = !!active;
      }
    }

    spawnObstacle(type) {
      const obstacleType = type || pickObstacleType(this.score, this.recentTypes);
      const speed = computeDifficulty(this.score).speed;
      const baseX = this.width + this.spawnPadding;

      let obstacle;
      if (obstacleType === 'stick') {
        const height = this.unit * 0.028;
        const width = this.unit * 0.17;
        obstacle = {
          type: 'stick',
          x: baseX,
          y: this.playerFloorY - this.playerStandingHeight * 0.8,
          width,
          height,
          speed: speed * 1.03,
          closest: Infinity,
          passed: false
        };
      } else if (obstacleType === 'check') {
        const width = this.unit * 0.082;
        const height = this.unit * 0.15;
        obstacle = {
          type: 'check',
          x: baseX,
          y: this.playerFloorY - height,
          width,
          height,
          speed: speed * 0.96,
          closest: Infinity,
          passed: false
        };
      } else if (obstacleType === 'split') {
        const gapHeight = this.unit * 0.085;
        obstacle = {
          type: 'split',
          x: baseX,
          width: this.unit * 0.12,
          gapY: this.playerFloorY - this.playerStandingHeight * 0.52,
          gapHeight,
          gapPadding: this.unit * 0.014,
          lowerHeight: this.unit * 0.064,
          upperHeight: this.unit * 0.05,
          speed: speed * 1.08,
          closest: Infinity,
          passed: false
        };
      } else {
        const width = this.unit * 0.072;
        const height = this.unit * 0.04;
        obstacle = {
          type: 'puck',
          x: baseX,
          y: this.playerFloorY - height,
          width,
          height,
          speed: speed,
          closest: Infinity,
          passed: false
        };
      }

      this.obstacles.push(obstacle);
      this.recentTypes.push(obstacle.type);
      this.recentTypes = this.recentTypes.slice(-4);
    }

    spawnPickup() {
      const highArc = Math.random() > 0.55;
      const y = highArc
        ? this.playerFloorY - this.playerStandingHeight * (0.85 + Math.random() * 0.35)
        : this.playerFloorY - this.playerStandingHeight * (0.45 + Math.random() * 0.15);

      this.pickups.push({
        type: Math.random() > 0.75 ? 'clock' : 'spark',
        x: this.width + this.spawnPadding * 0.8,
        y,
        width: this.unit * 0.04,
        height: this.unit * 0.04,
        speed: computeDifficulty(this.score).speed * 0.98,
        drift: (Math.random() - 0.5) * this.unit * 0.06,
        life: 1
      });
    }

    addParticles(config) {
      const count = config.count || 8;
      const spread = config.spread || 1;
      for (let index = 0; index < count; index += 1) {
        const angle = (Math.random() - 0.5) * Math.PI * spread;
        const speed = (config.speedMin || 40) + Math.random() * ((config.speedMax || 160) - (config.speedMin || 40));
        this.particles.push({
          x: config.x,
          y: config.y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed - Math.random() * speed * 0.3,
          size: (config.sizeMin || 2) + Math.random() * ((config.sizeMax || 6) - (config.sizeMin || 2)),
          life: (config.lifeMin || 0.15) + Math.random() * ((config.lifeMax || 0.45) - (config.lifeMin || 0.15)),
          maxLife: (config.lifeMin || 0.15) + Math.random() * ((config.lifeMax || 0.45) - (config.lifeMin || 0.15)),
          color: config.color || '#d6001c'
        });
      }
    }

    collectPickup(pickup) {
      this.score += pickup.type === 'clock' ? 45 : 28;
      this.combo += 1;
      this.bestComboRun = Math.max(this.bestComboRun, this.combo);
      this.meter = clamp(this.meter + (pickup.type === 'clock' ? 24 : 14), 0, 100);
      this.profile.totalPickups += 1;
      this.scorePop = 1;
      this.glow = 1;
      this.playSound('collect');
      this.addParticles({
        x: pickup.x + pickup.width * 0.5,
        y: pickup.y + pickup.height * 0.5,
        color: pickup.type === 'clock' ? '#9fe7ff' : '#ff4264',
        count: pickup.type === 'clock' ? 16 : 10,
        spread: 1.8,
        speedMin: 40,
        speedMax: 180,
        sizeMin: 2,
        sizeMax: 7,
        lifeMin: 0.2,
        lifeMax: 0.6
      });
    }

    registerNearMiss(obstacle) {
      if (obstacle.nearMissed) return;
      obstacle.nearMissed = true;
      this.combo += 1;
      this.bestComboRun = Math.max(this.bestComboRun, this.combo);
      this.score += 18;
      this.meter = clamp(this.meter + 8, 0, 100);
      this.glow = Math.max(this.glow, 0.45);
      this.addParticles({
        x: obstacle.x,
        y: this.playerFloorY - this.playerStandingHeight * 0.2,
        color: '#9fe7ff',
        count: 6,
        spread: 1.4,
        speedMin: 30,
        speedMax: 90,
        sizeMin: 1,
        sizeMax: 4,
        lifeMin: 0.16,
        lifeMax: 0.35
      });
    }

    getPlayerHitbox() {
      const height = lerp(this.playerStandingHeight, this.playerDuckingHeight, this.player.duckBlend);
      return {
        x: this.playerX - this.playerWidth * 0.3,
        y: this.playerFloorY - this.player.lift - height,
        width: this.playerWidth * 0.66,
        height: height * 0.84
      };
    }

    crash() {
      if (this.phase === 'gameover') return;
      this.phase = 'gameover';
      this.phaseTimer = 0;
      this.controls.bullet = false;
      this.controls.duck = false;
      this.flash = 1;
      this.shake = 1;
      this.combo = 0;
      this.message = 'ICE LOST';
      this.profile.highScore = Math.max(this.profile.highScore, this.score);
      this.profile.bestCombo = Math.max(this.profile.bestCombo, this.bestComboRun);
      this.profile.runs += 1;
      writeProfile(this.profile);
      this.playSound('hit');
      this.addParticles({
        x: this.playerX + this.playerWidth * 0.2,
        y: this.playerFloorY - this.playerStandingHeight * 0.35,
        color: '#ffffff',
        count: 18,
        spread: 1.9,
        speedMin: 60,
        speedMax: 220,
        sizeMin: 2,
        sizeMax: 8,
        lifeMin: 0.3,
        lifeMax: 0.9
      });
      this.emitState();
    }

    updateBoot(delta) {
      this.phaseTimer += delta;
      this.bootPulse += delta;
      if (this.phaseTimer < 0.9) {
        this.message = 'THAWING SECRET RINK';
      } else if (this.phaseTimer < 1.6) {
        this.message = 'CALIBRATING BULLET TIME';
      } else {
        this.phase = 'running';
        this.phaseTimer = 0;
        this.message = 'GO';
      }
    }

    updateRunning(delta) {
      const difficulty = computeDifficulty(this.score);
      const wantsBullet = this.controls.bullet && this.meter > 0;
      const worldFactor = wantsBullet ? 0.42 : 1;
      const playerFactor = wantsBullet ? 0.8 : 1;

      this.displaySlow = lerp(this.displaySlow, wantsBullet ? 1 : 0, 0.12);
      this.worldTime += delta;
      this.elapsed += delta;
      this.distance += difficulty.speed * delta * worldFactor;
      this.score += Math.round(delta * 22 * (1 + this.combo * 0.08));
      this.displayScore = lerp(this.displayScore, this.score, 0.2);
      this.scorePop = Math.max(0, this.scorePop - delta * 2.2);
      this.glow = Math.max(0, this.glow - delta * 1.1);
      this.flash = Math.max(0, this.flash - delta * 3.5);
      this.shake = Math.max(0, this.shake - delta * 2.8);

      if (wantsBullet) {
        this.meter = Math.max(0, this.meter - difficulty.bulletDrain * delta);
      }

      this.spawnTimer -= delta * worldFactor;
      this.pickupTimer -= delta * (wantsBullet ? 0.65 : 1);

      if (this.spawnTimer <= 0) {
        this.spawnObstacle();
        this.spawnTimer = difficulty.spawnEvery + Math.random() * difficulty.spawnJitter;
      }

      if (this.pickupTimer <= 0) {
        this.spawnPickup();
        this.pickupTimer = difficulty.pickupEvery + Math.random() * 0.9;
      }

      this.player.jumpBuffer = Math.max(0, this.player.jumpBuffer - delta);
      this.player.coyote = Math.max(0, this.player.coyote - delta);
      this.player.duckBlend = lerp(this.player.duckBlend, this.controls.duck ? 1 : 0, 0.24);

      const isGrounded = this.player.lift <= 0.001;
      if (isGrounded) {
        this.player.coyote = 0.08;
        this.player.lift = 0;
        if (this.player.jumpBuffer > 0) {
          this.player.velocity = this.jumpVelocity;
          this.player.jumpBuffer = 0;
          this.player.coyote = 0;
          this.player.landed = false;
          this.playSound('jump');
          this.addParticles({
            x: this.playerX - this.playerWidth * 0.1,
            y: this.playerFloorY,
            color: '#ffffff',
            count: 8,
            spread: 0.7,
            speedMin: 40,
            speedMax: 120,
            sizeMin: 2,
            sizeMax: 5,
            lifeMin: 0.12,
            lifeMax: 0.28
          });
        }
      }

      this.player.velocity -= this.gravity * delta * playerFactor;
      this.player.lift += this.player.velocity * delta * playerFactor;

      if (this.player.lift <= 0) {
        if (!this.player.landed && this.player.velocity < -120) {
          this.addParticles({
            x: this.playerX,
            y: this.playerFloorY,
            color: '#9fe7ff',
            count: 10,
            spread: 1.3,
            speedMin: 40,
            speedMax: 130,
            sizeMin: 1,
            sizeMax: 4,
            lifeMin: 0.15,
            lifeMax: 0.35
          });
        }
        this.player.velocity = 0;
        this.player.lift = 0;
        this.player.landed = true;
      }

      const playerHitbox = this.getPlayerHitbox();

      this.obstacles = this.obstacles.filter((obstacle) => {
        obstacle.x -= obstacle.speed * delta * worldFactor;
        const hitboxes = createHitbox(obstacle);
        const distanceToPlayer = Math.abs(obstacle.x - playerHitbox.x);
        obstacle.closest = Math.min(obstacle.closest, distanceToPlayer + Math.abs((obstacle.y || obstacle.gapY) - playerHitbox.y));

        for (let index = 0; index < hitboxes.length; index += 1) {
          if (boxesIntersect(playerHitbox, hitboxes[index])) {
            this.crash();
            return false;
          }
        }

        if (!obstacle.passed && obstacle.x + obstacle.width < playerHitbox.x) {
          obstacle.passed = true;
          if (obstacle.closest < this.unit * 0.18) {
            this.registerNearMiss(obstacle);
          } else {
            this.combo = 0;
          }
        }

        return obstacle.x + obstacle.width > -this.spawnPadding;
      });

      this.pickups = this.pickups.filter((pickup) => {
        pickup.x -= pickup.speed * delta * worldFactor;
        pickup.y += Math.sin(this.elapsed * 8 + pickup.drift) * delta * this.unit * 0.06;
        pickup.life -= delta * 0.05;
        const pickupHitbox = { x: pickup.x, y: pickup.y, width: pickup.width, height: pickup.height };
        if (boxesIntersect(playerHitbox, pickupHitbox)) {
          this.collectPickup(pickup);
          return false;
        }
        return pickup.x + pickup.width > -this.spawnPadding;
      });

      this.particles = this.particles.filter((particle) => {
        particle.life -= delta;
        if (particle.life <= 0) return false;
        particle.x += particle.vx * delta * (wantsBullet ? 0.58 : 1);
        particle.y += particle.vy * delta * (wantsBullet ? 0.58 : 1);
        particle.vy += this.gravity * 0.28 * delta;
        particle.vx *= 0.985;
        return true;
      });

      if (this.phase === 'running' && this.worldTime > 0.12) {
        this.emitState();
      }
    }

    updateGameOver(delta) {
      this.phaseTimer += delta;
      this.displayScore = lerp(this.displayScore, this.score, 0.14);
      this.displaySlow = lerp(this.displaySlow, 0, 0.1);
      this.flash = Math.max(0, this.flash - delta * 2);
      this.shake = Math.max(0, this.shake - delta * 1.6);
      this.glow = Math.max(0, this.glow - delta * 1.2);

      this.particles = this.particles.filter((particle) => {
        particle.life -= delta;
        if (particle.life <= 0) return false;
        particle.x += particle.vx * delta * 0.4;
        particle.y += particle.vy * delta * 0.4;
        particle.vy += this.gravity * 0.16 * delta;
        return true;
      });
    }

    update(delta) {
      if (!this.active) return;
      const safeDelta = clamp(delta, 0.001, 0.033);

      if (this.phase === 'boot') {
        this.updateBoot(safeDelta);
      } else if (this.phase === 'running') {
        this.updateRunning(safeDelta);
      } else if (this.phase === 'gameover') {
        this.updateGameOver(safeDelta);
      }
    }

    loop(timestamp) {
      if (!this.active) {
        this.loopHandle = 0;
        return;
      }

      if (!isFiniteNumber(this.lastFrame) || this.lastFrame === 0) {
        this.lastFrame = timestamp;
      }
      const delta = (timestamp - this.lastFrame) / 1000;
      this.lastFrame = timestamp;
      this.update(delta);
      this.render();
      this.loopHandle = requestAnimationFrame(this.loop);
    }

    renderBackground(ctx) {
      const bgGradient = ctx.createLinearGradient(0, 0, 0, this.height);
      bgGradient.addColorStop(0, '#04070d');
      bgGradient.addColorStop(0.6, '#11141b');
      bgGradient.addColorStop(1, '#16070b');
      ctx.fillStyle = bgGradient;
      ctx.fillRect(0, 0, this.width, this.height);

      const glowGradient = ctx.createRadialGradient(this.width * 0.5, this.trackGlowY, this.unit * 0.08, this.width * 0.5, this.trackGlowY, this.unit * 0.55);
      glowGradient.addColorStop(0, 'rgba(214, 0, 28, 0.22)');
      glowGradient.addColorStop(1, 'rgba(214, 0, 28, 0)');
      ctx.fillStyle = glowGradient;
      ctx.fillRect(0, 0, this.width, this.height);

      ctx.save();
      ctx.globalAlpha = 0.12 + this.displaySlow * 0.16;
      ctx.strokeStyle = '#1d2632';
      ctx.lineWidth = 1;
      for (let x = 0; x <= this.width; x += Math.max(24, this.unit * 0.045)) {
        ctx.beginPath();
        ctx.moveTo(x + (this.elapsed * 18) % 24, 0);
        ctx.lineTo(x, this.height);
        ctx.stroke();
      }
      ctx.restore();

      ctx.save();
      ctx.globalAlpha = 0.18;
      for (let y = 0; y < this.height; y += 3) {
        ctx.fillStyle = y % 6 === 0 ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)';
        ctx.fillRect(0, y, this.width, 1);
      }
      ctx.restore();
    }

    renderWordmark(ctx) {
      const extension = getScoreboardExtension(this.displayScore);
      const panelHeight = this.panelBaseHeight + extension * this.unit * 0.18;
      const panelGlow = 0.12 + this.glow * 0.22;
      const letterFontSize = Math.min(this.unit * 0.22, this.width * 0.16);

      ctx.save();
      ctx.font = '700 ' + letterFontSize + 'px RPIGeist, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = 'rgba(255,255,255,0.12)';
      ctx.fillText('RPI', this.width * 0.5, this.wordmarkY + letterFontSize * 0.12);
      ctx.restore();

      const connectorTop = this.wordmarkY + letterFontSize * 0.1;
      const panelRadius = Math.max(10, this.unit * 0.022);
      const panelFill = 'rgba(8, 11, 18, 0.94)';
      const panelStroke = 'rgba(255, 255, 255, 0.08)';

      [
        { x: this.leftPanelX, title: 'SCORE', accent: '#ff4264', align: 'left' },
        { x: this.rightPanelX, title: 'FOCUS', accent: '#9fe7ff', align: 'right' }
      ].forEach((panel) => {
        ctx.save();
        ctx.strokeStyle = 'rgba(255,255,255,0.12)';
        ctx.lineWidth = 2;
        const connectorX = panel.align === 'left' ? panel.x + this.panelWidth * 0.52 : panel.x + this.panelWidth * 0.48;
        ctx.beginPath();
        ctx.moveTo(connectorX, connectorTop - this.unit * 0.09);
        ctx.lineTo(connectorX, this.panelY);
        ctx.stroke();
        ctx.restore();

        drawRoundedPanel(ctx, panel.x, this.panelY, this.panelWidth, panelHeight, panelRadius, panelFill, panelStroke);

        ctx.save();
        ctx.globalAlpha = panelGlow;
        drawRoundedPanel(ctx, panel.x + 4, this.panelY + 4, this.panelWidth - 8, panelHeight - 8, panelRadius - 4, panel.accent, null);
        ctx.restore();

        ctx.fillStyle = 'rgba(255,255,255,0.62)';
        ctx.font = '600 ' + Math.max(10, this.unit * 0.018) + 'px RPIGeistMono, monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.fillText(panel.title, panel.x + this.panelWidth / 2, this.panelY + 16);
      });

      const scoreDigits = formatArcadeScore(Math.round(this.displayScore), this.displayScore > 999 ? 4 : 3);
      drawSegmentNumber(
        ctx,
        scoreDigits,
        this.leftPanelX + this.panelWidth * 0.14,
        this.panelY + this.unit * 0.09,
        this.panelWidth * 0.16,
        this.unit * 0.1,
        '#ff5c78',
        'rgba(255, 92, 120, 0.1)',
        this.panelWidth * 0.02
      );

      ctx.fillStyle = 'rgba(255,255,255,0.48)';
      ctx.font = '500 ' + Math.max(10, this.unit * 0.018) + 'px RPIGeistMono, monospace';
      ctx.textAlign = 'left';
      ctx.fillText('COMBO', this.leftPanelX + this.panelWidth * 0.14, this.panelY + this.unit * 0.25);
      ctx.fillStyle = '#ffffff';
      ctx.font = '700 ' + Math.max(15, this.unit * 0.04) + 'px RPIGeistMono, monospace';
      ctx.fillText(formatArcadeScore(this.combo, 2), this.leftPanelX + this.panelWidth * 0.14, this.panelY + this.unit * 0.285);

      const meterHeight = panelHeight - this.unit * 0.22;
      const meterX = this.rightPanelX + this.panelWidth * 0.39;
      const meterY = this.panelY + this.unit * 0.1;
      const meterWidth = this.panelWidth * 0.22;
      drawRoundedPanel(ctx, meterX, meterY, meterWidth, meterHeight, meterWidth / 2, 'rgba(255,255,255,0.06)', 'rgba(255,255,255,0.08)');

      const fillHeight = meterHeight * (this.meter / 100);
      const meterGradient = ctx.createLinearGradient(0, meterY + meterHeight, 0, meterY);
      meterGradient.addColorStop(0, '#58c4ff');
      meterGradient.addColorStop(1, '#d7fbff');
      drawRoundedPanel(ctx, meterX + 3, meterY + meterHeight - fillHeight + 3, meterWidth - 6, Math.max(0, fillHeight - 6), Math.max(4, meterWidth / 2 - 3), meterGradient, null);

      ctx.fillStyle = 'rgba(255,255,255,0.48)';
      ctx.font = '500 ' + Math.max(10, this.unit * 0.018) + 'px RPIGeistMono, monospace';
      ctx.textAlign = 'center';
      ctx.fillText('BEST ' + formatArcadeScore(this.profile.highScore, 3), this.rightPanelX + this.panelWidth / 2, this.panelY + panelHeight - this.unit * 0.075);

      if (extension > 0.02) {
        const badgeY = this.panelY + panelHeight - this.unit * 0.16;
        const badgeWidth = this.panelWidth * 0.72;
        drawRoundedPanel(ctx, this.leftPanelX + this.panelWidth * 0.14, badgeY, badgeWidth, this.unit * 0.05, this.unit * 0.014, 'rgba(255, 66, 100, 0.14)', 'rgba(255, 66, 100, 0.5)');
        drawRoundedPanel(ctx, this.rightPanelX + this.panelWidth * 0.14, badgeY, badgeWidth, this.unit * 0.05, this.unit * 0.014, 'rgba(159, 231, 255, 0.14)', 'rgba(159, 231, 255, 0.45)');
        ctx.fillStyle = '#ffffff';
        ctx.font = '600 ' + Math.max(10, this.unit * 0.018) + 'px RPIGeistMono, monospace';
        ctx.textAlign = 'center';
        ctx.fillText('PUCKMAN', this.leftPanelX + this.panelWidth * 0.5, badgeY + this.unit * 0.017);
        ctx.fillText('OVERTIME', this.rightPanelX + this.panelWidth * 0.5, badgeY + this.unit * 0.017);
      }

      ctx.fillStyle = 'rgba(255,255,255,0.68)';
      ctx.font = '600 ' + Math.max(12, this.unit * 0.022) + 'px RPIGeistMono, monospace';
      ctx.textAlign = 'center';
      ctx.fillText('RINK RUSH // BULLET TIME', this.width * 0.5, this.wordmarkY - this.unit * 0.085);
    }

    renderTrack(ctx) {
      const trackGradient = ctx.createLinearGradient(0, this.trackY - this.trackHeight, 0, this.trackY + this.trackHeight);
      trackGradient.addColorStop(0, 'rgba(228, 248, 255, 0.96)');
      trackGradient.addColorStop(0.5, 'rgba(185, 229, 244, 0.88)');
      trackGradient.addColorStop(1, 'rgba(121, 188, 214, 0.88)');
      drawRoundedPanel(ctx, this.width * 0.14, this.trackY - this.trackHeight, this.width * 0.72, this.trackHeight * 1.35, this.trackHeight * 0.56, trackGradient, 'rgba(255,255,255,0.18)');

      ctx.save();
      ctx.globalAlpha = 0.8;
      ctx.fillStyle = '#101722';
      for (let index = 0; index < 20; index += 1) {
        const x = this.width * 0.16 + ((index * this.width * 0.038 - this.distance * 0.25) % (this.width * 0.76));
        drawRoundedPanel(ctx, x, this.trackY - this.trackHeight * 0.2, this.width * 0.02, this.trackHeight * 0.08, this.trackHeight * 0.04, ctx.fillStyle, null);
      }
      ctx.restore();

      const slowBandWidth = this.width * (0.12 + this.displaySlow * 0.08);
      const slowBandX = this.width * 0.5 + Math.sin(this.elapsed * 1.8) * this.width * 0.08 - slowBandWidth * 0.5;
      ctx.fillStyle = 'rgba(255,255,255,0.12)';
      drawRoundedPanel(ctx, slowBandX, this.trackY - this.trackHeight * 0.92, slowBandWidth, this.trackHeight * 0.28, this.trackHeight * 0.12, ctx.fillStyle, null);
    }

    renderObstacle(ctx, obstacle) {
      ctx.save();
      if (obstacle.type === 'puck') {
        drawRoundedPanel(ctx, obstacle.x, obstacle.y, obstacle.width, obstacle.height, obstacle.height * 0.5, '#05070d', '#f7fbff');
        ctx.fillStyle = 'rgba(255,255,255,0.18)';
        ctx.fillRect(obstacle.x + obstacle.width * 0.18, obstacle.y + obstacle.height * 0.16, obstacle.width * 0.24, obstacle.height * 0.22);
      } else if (obstacle.type === 'check') {
        const gradient = ctx.createLinearGradient(0, obstacle.y, 0, obstacle.y + obstacle.height);
        gradient.addColorStop(0, '#ff637c');
        gradient.addColorStop(1, '#6f0f1f');
        drawRoundedPanel(ctx, obstacle.x, obstacle.y, obstacle.width, obstacle.height, obstacle.width * 0.16, gradient, 'rgba(255,255,255,0.24)');
        ctx.fillStyle = '#f6fbff';
        ctx.fillRect(obstacle.x + obstacle.width * 0.18, obstacle.y + obstacle.height * 0.16, obstacle.width * 0.18, obstacle.height * 0.68);
      } else if (obstacle.type === 'stick') {
        drawRoundedPanel(ctx, obstacle.x, obstacle.y, obstacle.width, obstacle.height, obstacle.height * 0.5, '#0b1019', 'rgba(255,255,255,0.24)');
        ctx.fillStyle = '#ff4264';
        ctx.fillRect(obstacle.x + obstacle.width * 0.68, obstacle.y - obstacle.height * 1.6, obstacle.width * 0.08, obstacle.height * 2.6);
      } else if (obstacle.type === 'split') {
        const boxes = createHitbox(obstacle);
        boxes.forEach((box, index) => {
          drawRoundedPanel(ctx, box.x, box.y, box.width, box.height, box.height * 0.4, index === 0 ? '#0a1018' : '#ff4264', 'rgba(255,255,255,0.22)');
        });
        ctx.strokeStyle = 'rgba(159, 231, 255, 0.55)';
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.rect(obstacle.x + obstacle.width * 0.12, obstacle.gapY, obstacle.width * 0.76, obstacle.gapHeight);
        ctx.stroke();
      }
      ctx.restore();
    }

    renderPickup(ctx, pickup) {
      ctx.save();
      ctx.translate(pickup.x + pickup.width / 2, pickup.y + pickup.height / 2);
      ctx.rotate(this.elapsed * 2.2);
      const fill = pickup.type === 'clock' ? '#9fe7ff' : '#ff4264';
      ctx.fillStyle = fill;
      ctx.beginPath();
      ctx.moveTo(0, -pickup.height * 0.6);
      ctx.lineTo(pickup.width * 0.55, 0);
      ctx.lineTo(0, pickup.height * 0.6);
      ctx.lineTo(-pickup.width * 0.55, 0);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.82)';
      ctx.fillRect(-pickup.width * 0.08, -pickup.height * 0.32, pickup.width * 0.16, pickup.height * 0.64);
      ctx.restore();
    }

    renderPlayer(ctx) {
      const bodyY = this.playerFloorY - this.player.lift;
      const duckBlend = this.player.duckBlend;
      const bodyRadius = this.playerRadius * (1 - duckBlend * 0.12);
      const bodyScaleY = 1 - duckBlend * 0.28;
      const tilt = clamp(this.player.velocity / this.jumpVelocity, -0.45, 0.45) * 0.2 - this.displaySlow * 0.04;

      ctx.save();
      ctx.translate(this.playerX, bodyY - this.playerStandingHeight * 0.55);
      ctx.rotate(tilt);

      if (this.displaySlow > 0.05) {
        ctx.save();
        ctx.globalAlpha = 0.16 + this.displaySlow * 0.12;
        ctx.fillStyle = '#9fe7ff';
        for (let ghost = 1; ghost <= 3; ghost += 1) {
          ctx.beginPath();
          ctx.ellipse(-ghost * this.unit * 0.02, ghost * this.unit * 0.006, bodyRadius, bodyRadius * bodyScaleY, 0, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      }

      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = '#d6001c';
      ctx.lineWidth = Math.max(2, this.unit * 0.009);
      ctx.beginPath();
      ctx.ellipse(0, 0, bodyRadius, bodyRadius * bodyScaleY, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#d6001c';
      ctx.beginPath();
      ctx.ellipse(0, -bodyRadius * 0.82, bodyRadius * 0.78, bodyRadius * 0.42, 0, Math.PI, 0);
      ctx.fill();
      ctx.fillRect(-bodyRadius * 0.7, -bodyRadius * 0.86, bodyRadius * 1.4, bodyRadius * 0.2);

      ctx.fillStyle = '#0a1018';
      ctx.fillRect(-bodyRadius * 0.34, -bodyRadius * 0.22, bodyRadius * 0.68, bodyRadius * 0.16);

      ctx.fillStyle = '#d6001c';
      ctx.font = '700 ' + Math.max(11, this.unit * 0.024) + 'px RPIGeistMono, monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('RPI', 0, bodyRadius * 0.02);

      ctx.strokeStyle = '#0b1018';
      ctx.lineWidth = Math.max(3, this.unit * 0.01);
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(-bodyRadius * 0.96, bodyRadius * 0.18);
      ctx.lineTo(-bodyRadius * 1.78, bodyRadius * (0.58 + duckBlend * 0.1));
      ctx.lineTo(-bodyRadius * 2.08, bodyRadius * (0.74 + duckBlend * 0.12));
      ctx.stroke();

      ctx.strokeStyle = '#ff4264';
      ctx.lineWidth = Math.max(3, this.unit * 0.012);
      ctx.beginPath();
      ctx.moveTo(bodyRadius * 0.82, -bodyRadius * 0.02);
      ctx.lineTo(bodyRadius * 1.18, bodyRadius * 0.22);
      ctx.stroke();

      ctx.strokeStyle = '#0b1018';
      ctx.lineWidth = Math.max(4, this.unit * 0.01);
      ctx.beginPath();
      ctx.moveTo(-bodyRadius * 0.4, bodyRadius * 0.9);
      ctx.lineTo(-bodyRadius * 0.78, bodyRadius * 1.54);
      ctx.moveTo(bodyRadius * 0.32, bodyRadius * 0.88);
      ctx.lineTo(bodyRadius * 0.84, bodyRadius * 1.54);
      ctx.stroke();

      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = Math.max(2, this.unit * 0.007);
      ctx.beginPath();
      ctx.moveTo(-bodyRadius * 1.02, bodyRadius * 1.57);
      ctx.lineTo(-bodyRadius * 0.46, bodyRadius * 1.57);
      ctx.moveTo(bodyRadius * 0.46, bodyRadius * 1.57);
      ctx.lineTo(bodyRadius * 1.02, bodyRadius * 1.57);
      ctx.stroke();

      ctx.restore();
    }

    renderParticles(ctx) {
      this.particles.forEach((particle) => {
        const alpha = particle.maxLife > 0 ? particle.life / particle.maxLife : 0;
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.fillStyle = particle.color;
        ctx.fillRect(particle.x, particle.y, particle.size, particle.size);
        ctx.restore();
      });
    }

    renderHud(ctx) {
      ctx.fillStyle = 'rgba(255,255,255,0.5)';
      ctx.font = '500 ' + Math.max(11, this.unit * 0.018) + 'px RPIGeistMono, monospace';
      ctx.textAlign = 'left';
      ctx.fillText('UP / W / SPACE JUMP', this.width * 0.07, this.height * 0.92);
      ctx.fillText('DOWN / S TUCK', this.width * 0.33, this.height * 0.92);
      ctx.fillText('SHIFT BULLET TIME', this.width * 0.54, this.height * 0.92);
      ctx.textAlign = 'right';
      ctx.fillText('ESC EXIT', this.width * 0.93, this.height * 0.92);

      if (this.message) {
        ctx.save();
        ctx.globalAlpha = this.phase === 'running' ? clamp(1 - this.phaseTimer * 0.6, 0, 1) : 1;
        ctx.fillStyle = this.phase === 'gameover' ? '#ff4264' : '#d7fbff';
        ctx.font = '700 ' + Math.max(12, this.unit * 0.022) + 'px RPIGeistMono, monospace';
        ctx.textAlign = 'center';
        ctx.fillText(this.message, this.width * 0.5, this.trackY - this.trackHeight * 2.5);
        ctx.restore();
      }
    }

    renderOverlay(ctx) {
      if (this.phase === 'boot') {
        const reveal = easeOutExpo(clamp(this.phaseTimer / 1.6, 0, 1));
        ctx.save();
        ctx.globalAlpha = 0.16 + (1 - reveal) * 0.7;
        ctx.fillStyle = '#05070d';
        ctx.fillRect(0, 0, this.width, this.height);
        ctx.restore();

        ctx.save();
        ctx.globalAlpha = reveal;
        ctx.textAlign = 'center';
        ctx.fillStyle = '#ffffff';
        ctx.font = '700 ' + Math.max(24, this.unit * 0.06) + 'px RPIGeist, sans-serif';
        ctx.fillText('PUCKMAN // AFTER HOURS', this.width * 0.5, this.height * 0.5 - this.unit * 0.04);
        ctx.fillStyle = 'rgba(255,255,255,0.62)';
        ctx.font = '500 ' + Math.max(12, this.unit * 0.022) + 'px RPIGeistMono, monospace';
        ctx.fillText(this.message, this.width * 0.5, this.height * 0.5 + this.unit * 0.02);
        ctx.restore();
      }

      if (this.phase === 'gameover') {
        const alpha = clamp(this.phaseTimer / 0.28, 0, 1);
        ctx.save();
        ctx.globalAlpha = alpha * 0.74;
        ctx.fillStyle = '#05070d';
        ctx.fillRect(0, 0, this.width, this.height);
        ctx.restore();

        const cardWidth = this.width * 0.38;
        const cardHeight = this.height * 0.34;
        const cardX = this.width * 0.5 - cardWidth / 2;
        const cardY = this.height * 0.5 - cardHeight / 2;
        drawRoundedPanel(ctx, cardX, cardY, cardWidth, cardHeight, this.unit * 0.025, 'rgba(8, 11, 18, 0.96)', 'rgba(255,255,255,0.12)');

        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'center';
        ctx.font = '700 ' + Math.max(18, this.unit * 0.046) + 'px RPIGeist, sans-serif';
        ctx.fillText('RINK RESET', this.width * 0.5, cardY + this.unit * 0.075);
        ctx.fillStyle = 'rgba(255,255,255,0.62)';
        ctx.font = '500 ' + Math.max(11, this.unit * 0.02) + 'px RPIGeistMono, monospace';
        ctx.fillText('FINAL SCORE', this.width * 0.5, cardY + this.unit * 0.13);

        drawSegmentNumber(
          ctx,
          formatArcadeScore(this.score, this.score > 999 ? 4 : 3),
          this.width * 0.5 - this.unit * 0.13,
          cardY + this.unit * 0.155,
          this.unit * 0.05,
          this.unit * 0.095,
          '#ff5c78',
          'rgba(255, 92, 120, 0.12)',
          this.unit * 0.01
        );

        ctx.fillStyle = '#d7fbff';
        ctx.font = '600 ' + Math.max(11, this.unit * 0.02) + 'px RPIGeistMono, monospace';
        ctx.fillText(scoreToRank(this.score, this.bestComboRun), this.width * 0.5, cardY + this.unit * 0.29);
        ctx.fillStyle = 'rgba(255,255,255,0.62)';
        ctx.fillText('BEST ' + formatArcadeScore(this.profile.highScore, 3) + '   COMBO ' + formatArcadeScore(this.bestComboRun, 2), this.width * 0.5, cardY + this.unit * 0.335);
        ctx.fillText('SPACE / ENTER TO RUN AGAIN   ESC TO EXIT', this.width * 0.5, cardY + this.unit * 0.39);
      }
    }

    render() {
      if (!this.ctx) return;
      const ctx = this.ctx;
      const shakeAmount = this.shake * this.unit * 0.012;
      const offsetX = shakeAmount > 0 ? (Math.random() - 0.5) * shakeAmount : 0;
      const offsetY = shakeAmount > 0 ? (Math.random() - 0.5) * shakeAmount : 0;

      ctx.save();
      ctx.clearRect(0, 0, this.width, this.height);
      ctx.translate(offsetX, offsetY);

      this.renderBackground(ctx);
      this.renderWordmark(ctx);
      this.renderTrack(ctx);
      this.renderParticles(ctx);
      this.pickups.forEach((pickup) => this.renderPickup(ctx, pickup));
      this.obstacles.forEach((obstacle) => this.renderObstacle(ctx, obstacle));
      this.renderPlayer(ctx);
      this.renderHud(ctx);
      this.renderOverlay(ctx);

      if (this.flash > 0) {
        ctx.save();
        ctx.globalAlpha = this.flash * 0.24;
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, this.width, this.height);
        ctx.restore();
      }

      ctx.restore();
    }
  }

  class TrexBarGame {
    constructor(hostElement, options) {
      this.hostElement = hostElement || null;
      this.stageElement = this.hostElement ? this.hostElement.querySelector('#easter-egg-runner-stage') : null;
      this.options = options || {};
      this.onExit = this.options.onExit || null;
      this.onStateChange = this.options.onStateChange || null;
      this.runner = null;
      this.profile = readProfile();
      this.active = false;
      this.phase = 'idle';
      this.score = 0;
      this.displayScore = 0;
      this.syncHandle = 0;
      this.gameOverRecorded = false;
      this.lastStateSignature = '';
      this.sync = this.sync.bind(this);
    }

    ensureRunner() {
      if (this.runner) return this.runner;
      if (typeof window === 'undefined' || typeof window.Runner !== 'function' || !this.stageElement) {
        return null;
      }

      if (window.Runner.instance_ && typeof window.Runner.instance_.destroy === 'function') {
        window.Runner.instance_.destroy();
      }

      this.runner = new window.Runner(this.stageElement, {
        BIND_EVENTS: false,
        DISABLE_SOUND: true,
        CLASS_TARGET: this.hostElement,
        MAX_SPEED: 8.2,
        INVERT_DISTANCE: 999999,
        CLEAR_TIME: 600
      });

      const storedHighScore = Math.max(0, parseInt(this.profile.highScore, 10) || 0);
      if (this.runner.distanceMeter) {
        this.runner.highestScore = storedHighScore / this.runner.distanceMeter.config.COEFFICIENT;
        this.runner.distanceMeter.setHighScore(this.runner.highestScore);
        this.runner.distanceMeter.draw = function () { };
        this.runner.distanceMeter.drawHighScore = function () { };
      }

      if (this.runner.containerEl) {
        this.runner.containerEl.style.width = this.runner.dimensions.WIDTH + 'px';
        this.runner.containerEl.style.height = this.runner.dimensions.HEIGHT + 'px';
      }
      this.runner.activated = true;
      if (this.runner.tRex) {
        this.runner.tRex.xPos = this.runner.tRex.config.START_X_POS;
        this.runner.tRex.update(0);
      }

      return this.runner;
    }

    teardownRunner() {
      if (!this.runner) return;
      if (typeof this.runner.destroy === 'function') {
        this.runner.destroy();
      } else if (typeof this.runner.stop === 'function') {
        this.runner.stop();
      }
      this.runner = null;
    }

    emitState(force) {
      if (typeof this.onStateChange !== 'function') return;
      const state = this.getState();
      const signature = JSON.stringify(state);
      if (!force && signature === this.lastStateSignature) return;
      this.lastStateSignature = signature;
      this.onStateChange(state);
    }

    getState() {
      const highScore = Math.max(
        Math.max(0, parseInt(this.profile.highScore, 10) || 0),
        this.runner && typeof this.runner.getHighScore === 'function' ? this.runner.getHighScore() : 0
      );

      return {
        active: this.active,
        phase: this.phase,
        score: this.score,
        displayScore: Math.round(this.displayScore),
        round: Math.max(1, Math.floor(this.score / 150) + 1),
        combo: 0,
        meter: 0,
        highScore,
        rank: scoreToRank(this.score, 0),
        message: this.phase === 'gameover' ? 'Press jump to retry' : 'Press jump to start',
        gameOver: !!(this.runner && this.runner.crashed)
      };
    }

    resize() {
      if (this.runner && typeof this.runner.adjustDimensions === 'function') {
        this.runner.adjustDimensions();
      }
    }

    open(triggerSource) {
      this.triggerSource = triggerSource || 'secret';
      this.profile = readProfile();
      this.score = 0;
      this.displayScore = 0;
      this.phase = 'boot';
      this.active = true;
      this.gameOverRecorded = false;
      this.lastStateSignature = '';
      this.teardownRunner();
      this.ensureRunner();
      this.startSync();
      this.emitState(true);
    }

    close() {
      this.active = false;
      this.phase = 'idle';
      this.stopSync();
      this.teardownRunner();
      this.emitState(true);
      if (typeof this.onExit === 'function') {
        this.onExit(this.getState());
      }
    }

    restart() {
      if (!this.active) {
        this.open('restart');
        return;
      }
      this.open('restart');
    }

    isGameOver() {
      return !!(this.runner && this.runner.crashed);
    }

    setControl(controlName, active) {
      if (controlName !== 'jump' || !active) {
        return;
      }

      const runner = this.ensureRunner();
      if (!runner) return;

      if (runner.crashed) {
        runner.restart();
        this.phase = 'run';
        this.gameOverRecorded = false;
        this.emitState(true);
        return;
      }

      runner.pressJump();
      runner.releaseJump();
      if (this.phase === 'boot') {
        this.phase = 'run';
      }
      this.emitState(true);
    }

    startSync() {
      this.stopSync();
      if (typeof requestAnimationFrame === 'function') {
        this.syncHandle = requestAnimationFrame(this.sync);
      }
    }

    stopSync() {
      if (this.syncHandle && typeof cancelAnimationFrame === 'function') {
        cancelAnimationFrame(this.syncHandle);
      }
      this.syncHandle = 0;
    }

    sync() {
      if (!this.active) return;

      const runner = this.ensureRunner();
      if (!runner) {
        this.emitState();
        return;
      }

      const nextScore = typeof runner.getScore === 'function' ? runner.getScore() : 0;
      const nextHighScore = typeof runner.getHighScore === 'function' ? runner.getHighScore() : 0;

      this.score = nextScore;
      this.displayScore += (nextScore - this.displayScore) * 0.32;

      if (nextHighScore > (this.profile.highScore || 0)) {
        this.profile.highScore = nextHighScore;
        writeProfile(this.profile);
      }

      if (runner.crashed) {
        this.phase = 'gameover';
        if (!this.gameOverRecorded) {
          this.profile.runs = Math.max(0, parseInt(this.profile.runs, 10) || 0) + 1;
          writeProfile(this.profile);
          this.gameOverRecorded = true;
        }
      } else if (runner.playing || runner.activated) {
        this.phase = 'run';
      } else {
        this.phase = 'boot';
      }

      this.emitState();
      this.syncHandle = requestAnimationFrame(this.sync);
    }
  }

  return {
    STORAGE_KEY,
    DEFAULT_PROFILE,
    computeDifficulty,
    formatArcadeScore,
    getScoreboardExtension,
    pickObstacleType,
    scoreToRank,
    RinkRushGame: TrexBarGame
  };
});
