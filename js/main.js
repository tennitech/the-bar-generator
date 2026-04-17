// Shader loading utility
async function loadShaderFile(path) {
  try {
    const response = await fetch(path);
    return await response.text();
  } catch (error) {
    console.error(`Error loading shader file ${path}:`, error);
    return null;
  }
}

// Load shader from files
async function loadShader(vertPath, fragPath) {
  try {
    const vertSource = await loadShaderFile(vertPath);
    const fragSource = await loadShaderFile(fragPath);
    if (vertSource && fragSource) {
      return createShader(vertSource, fragSource);
    }
  } catch (error) {
    console.error('Error loading shader:', error);
  }
  return null;
}

// Fixed logo paths (updated to match new 250px reference SVG exactly)
const paths = {
  r: "M213.54 30.4413C213.535 30.3153 213.529 30.1893 213.524 30.0688C213.025 19.6551 209.147 12.0188 202.644 7.0447C202.491 6.92966 202.338 6.81462 202.184 6.71054C196.032 2.20215 187.629 0 177.583 0H117.692L116.125 1.5667V110.185L117.692 111.751H132.406L133.972 110.185V66.3605L135.533 64.7938H177.583C186.775 64.7938 194.948 62.6902 201.182 58.39C201.472 58.1928 201.751 57.9956 202.031 57.7874C207.942 53.3941 211.946 46.9136 213.179 38.2584C213.222 37.9516 213.261 37.6393 213.299 37.3216C213.337 37.0094 213.37 36.6917 213.398 36.3739C213.42 36.1493 213.441 35.9247 213.452 35.7001C213.54 34.6264 213.578 33.5254 213.578 32.3969C213.578 31.7341 213.567 31.0822 213.54 30.4413ZM135.533 48.5186L133.972 46.9519V17.8419L135.539 16.2752H176.487C190.522 16.2752 195.737 20.6466 195.737 32.3969C195.737 44.1472 190.522 48.5186 176.487 48.5186H135.533Z",
  p: "M250.042 110.185L248.475 111.751H233.761L232.195 110.185V1.5667L233.767 0H248.481L250.047 1.5667V110.185H250.042Z",
  i: "M86.2053 111.751L83.2307 110.102L55.0903 66.3276L52.0335 64.7992H19.4559L17.8892 66.366V110.19L16.328 111.757H1.61407L0.0473633 110.19V1.5667L1.61407 0H60.4094C84.6769 0 97.5009 11.2025 97.5009 32.3969C97.5009 48.5186 89.6126 59.02 74.6631 62.8491V64.3993L95.9342 97.8151V110.091L94.2743 111.751H86.2053ZM60.4094 48.5186C74.444 48.5186 79.6591 44.1472 79.6591 32.3969C79.6591 20.6466 74.444 16.2752 60.4094 16.2752H19.4614L17.8892 17.8419V46.9519L19.4559 48.5186H60.4094Z",
  bar: "M247.851 129.855L249.406 131.411V146.018L247.851 147.573H2.00064L0.445312 146.018V131.411L2.00064 129.855H247.856H247.851Z"
};

// Layout constants
const REFERENCE_WIDTH = 250;
const LOGO_SCALE = 1.5;
const LOGO_VERTICAL_OFFSET = -72; // Vertical offset for centering

// Global variables
let styleSelect;
let colorModeSelect;
let headerLogoPreview;
let binaryInput;
let binaryGroup;
let binaryAudioBtn;
let morseInput;
let morseGroup;
let morseAudioBtn;
let staffAudioBtn;
let rulerGroup;
let rulerRepeatsSlider;
let rulerRepeatsDisplay;
let rulerUnitsSlider;
let rulerUnitsDisplay;
let tickerSlider;
let tickerDisplay;
let tickerGroup;
let tickerRatioSlider;
let tickerRatioDisplay;
let tickerWidthRatioSlider;
let tickerWidthRatioDisplay;
let tickerAudioBtn;
let tickerMotionBtn;
let waveformGroup;
let waveformTypeSlider;
let waveformTypeDisplay;
let waveformFrequencySlider;
let waveformFrequencyDisplay;
let waveformSpeedSlider;
let waveformSpeedDisplay;
let waveformAudioBtn;
let waveformEnvelopeToggle;
let envelopeSettingsGroup;
let waveformEnvelopeType;
let waveformEnvelopeWavesSlider;
let waveformEnvelopeWavesDisplay;
let waveformEnvelopeCenterSlider;
let waveformEnvelopeCenterDisplay;
let waveformEnvelopeBipolarToggle;
let waveformMotionBtn;
let circlesGroup;
let circlesDensitySlider;
let circlesDensityDisplay;
let circlesSizeVariationSlider;
let circlesSizeVariationDisplay;
let circlesOverlapSlider;
let circlesOverlapDisplay;
let circlesFillSelect;
let circlesModeSelect;
let circlesPackingControls;
let circlesGridControls;
let circlesRowsSlider;
let circlesRowsDisplay;
let circlesGridDensitySlider;
let circlesGridDensityDisplay;
let circlesSizeVariationYSlider;
let circlesSizeVariationYDisplay;
let circlesSizeVariationXSlider;
let circlesSizeVariationXDisplay;
let circlesGridOverlapSlider;
let circlesGridOverlapDisplay;
let circlesLayoutSelect;
let numericGroup;
let numericInput;
let numericModeSelect;
let circlesGradientGroup;
let circlesGradientVariantSlider;
let circlesGradientVariantDisplay;
let gradientGroup;
let gradientVariantSlider;
let gradientVariantDisplay;
let gridGroup;
let gridVariantSlider;
let gridVariantDisplay;
let linesGroup;
let linesVariantSlider;
let linesVariantDisplay;
let pointConnectGroup;
let pointConnectVariantSlider;
let pointConnectVariantDisplay;
let neuralNetworkGroup;
let neuralNetworkHiddenLayersSlider;
let neuralNetworkHiddenLayersDisplay;
let triangleGridGroup;
let triangleGridVariantSlider;
let triangleGridVariantDisplay;
let trianglesGroup;
let trianglesVariantSlider;
let trianglesVariantDisplay;
let trussGroup;
let trussFamilySelect;
let trussSegmentsSlider;
let trussSegmentsDisplay;
let trussThicknessSlider;
let trussThicknessDisplay;
let staffGroup;
let staffInstrumentSelect;
let staffNoteShapeSelect;
let staffClearBtn;
let staffReverbToggle;
let staffTremoloToggle;
let staffTempoSlider;
let staffTempoDisplay;
let currentStaffNotes = [];
let currentNoteDuration = 1; // quarter note by default
let pulseGroup;
let pulseInput;
let pulseIntensitySlider;
let pulseIntensityDisplay;
let graphGroup;
let graphInput;
let graphInput2;
let graphInput3;
let graphInput4;
let graphInput5;
let graphMultiToggle;
let graphMultiInputs;
let graphScaleSlider;
let graphScaleDisplay;

const TRUSS_FAMILY_OPTIONS = [
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
const TRUSS_FAMILY_ALIASES = {
  cross: 'flat',
  warren: 'flat',
  pratt: 'queen-post',
  vierendeel: 'flat'
};

function normalizeTrussFamilyValue(value) {
  const normalized = String(value || 'flat').toLowerCase();
  if (TRUSS_FAMILY_OPTIONS.includes(normalized)) {
    return normalized;
  }
  return TRUSS_FAMILY_ALIASES[normalized] || 'flat';
}

// Static circle data cache
let staticCircleData = null;
let lastCircleParams = null;
let appSidebar;
let sidebarScroll;
let mobileMenuToggle;
let saveButton;
let saveMenu;
let saveLoopGifButton;
let reportProblemBtn;
let bugReportDialog;
let bugReportForm;
let bugReportContext;
let bugReportCloseBtn;
let bugReportCancelBtn;
let bugReportSubjectInput;
let bugReportDetailsInput;
let bugReportStepsInput;
let bugReportEmailInput;
let appMain;
let canvasViewport;
let easterEggHint;
let easterEggHintLabel;
let easterEggOverlay;
let easterEggCanvas;
let easterEggLiveStatus;
let easterEggCloseButton;
let easterEggTouchButtons = [];
let easterEggGame = null;
let easterEggHotspotBounds = null;
let easterEggHoldRaf = 0;
let easterEggHoldState = {
  pointerId: null,
  startedAt: 0,
  progress: 0,
  active: false
};
let easterEggKeyBuffer = '';
let easterEggKeyBufferTimer = null;
let easterEggPreviousPlaybackState = true;
let easterEggResumeAudio = false;
let easterEggLastFocusedElement = null;
let easterEggProfile = null;
let easterEggRunState = null;
let tickerShader1, tickerShader2, binaryShader;
let currentShader = 1;
let barBuffer;
let binaryData = [];
let binaryLength = 0;
let morseData = [];
let morseLength = 0;
let numericData = [];
let numericLength = 0;
let numericTexture = null;
window.animationTime = 0;



// Audio variables
let audioContext;
let gainNode;
let isAudioPlaying = false;
let hasShownAudioHintToast = false;

// Crossfader audio system - multiple simultaneous oscillators
let oscillators = {
  sine: null,
  sawtooth: null,
  square: null,
  pulse: null  // Custom pulse wave using AudioWorklet
};
let oscillatorGains = {
  sine: null,
  sawtooth: null,
  square: null,
  pulse: null
};
let pulseWorkletNode = null;
let lastFocusedElement = null; // For accessibility focus management
let bugReportLastFocusedElement = null;

// Color scheme management
const themeModeUtils = typeof window !== 'undefined' ? window.themeModeUtils || null : null;
const DEFAULT_COLOR_MODE = themeModeUtils && typeof themeModeUtils.DEFAULT_COLOR_MODE === 'string'
  ? themeModeUtils.DEFAULT_COLOR_MODE
  : 'black';
const AVAILABLE_COLOR_MODES = themeModeUtils && Array.isArray(themeModeUtils.AVAILABLE_COLOR_MODES)
  ? themeModeUtils.AVAILABLE_COLOR_MODES.slice()
  : ['black', 'white', 'red', 'blue', 'link-blue', 'gold', 'silver', 'gray'];
const AVAILABLE_COLOR_MODE_SET = themeModeUtils && themeModeUtils.AVAILABLE_COLOR_MODE_SET instanceof Set
  ? themeModeUtils.AVAILABLE_COLOR_MODE_SET
  : new Set(AVAILABLE_COLOR_MODES);
const LEGACY_COLOR_MODE_ALIASES = themeModeUtils && themeModeUtils.LEGACY_COLOR_MODE_ALIASES
  ? { ...themeModeUtils.LEGACY_COLOR_MODE_ALIASES }
  : {
    'black-on-white': 'black',
    'white-on-black': 'white',
    'red-on-white': 'red',
    'white-on-red': 'white',
    'light': 'black',
    'dark': 'white'
  };
const previewControlUtils = typeof window !== 'undefined' ? window.previewControlUtils || null : null;
const getPreviewButtonMarkup = previewControlUtils && typeof previewControlUtils.getPreviewButtonMarkup === 'function'
  ? previewControlUtils.getPreviewButtonMarkup
  : function fallbackGetPreviewButtonMarkup(kind) {
    return kind === 'restart' ? 'RESTART' : 'PLAY';
  };
const getPreviewButtonState = previewControlUtils && typeof previewControlUtils.getPreviewButtonState === 'function'
  ? previewControlUtils.getPreviewButtonState
  : function fallbackGetPreviewButtonState(kind, options = {}) {
    if (kind === 'restart') {
      return {
        icon: 'restart',
        actionText: 'Restart',
        statusText: 'From start',
        ariaLabel: 'Restart preview',
        active: false,
        animated: false,
        disabled: !!options.disabled
      };
    }

    const active = !!options.active;
    return {
      icon: active ? 'pause' : 'play',
      actionText: active ? 'Pause' : 'Play',
      statusText: kind === 'motion' ? 'Motion preview' : 'Audio preview',
      ariaLabel: `${active ? 'Pause' : 'Play'} ${kind === 'motion' ? 'motion' : 'audio'} preview`,
      active,
      animated: active,
      disabled: !!options.disabled
    };
  };

let currentColorMode = DEFAULT_COLOR_MODE;
const colors = {
  black: { bg: '#ffffff', fg: '#000000' },
  white: { bg: '#000000', fg: '#ffffff' },
  red: { bg: '#ffffff', fg: '#d6001c' },
  blue: { bg: '#ffffff', fg: '#0081CE' },
  'link-blue': { bg: '#ffffff', fg: '#006EB0' },
  gold: { bg: '#fffaf0', fg: '#CDAC38' },
  silver: { bg: '#11161d', fg: '#E1EDF5' },
  gray: { bg: '#151b21', fg: '#B9CCD8' }
};

const themeClassByColorMode = {
  black: 'theme-black',
  white: 'theme-white',
  red: 'theme-red',
  blue: 'theme-blue',
  'link-blue': 'theme-link-blue',
  gold: 'theme-gold',
  silver: 'theme-silver',
  gray: 'theme-gray'
};

// Set this to a deployed Google Apps Script web app URL to send reports directly into a Google Sheet.
const BUG_REPORT_APPS_SCRIPT_URL = '';
const SURPRISE_TEXT_OPTIONS = [
  'RPI',
  'BUILD',
  'TRY THIS',
  'WHY NOT',
  'TROY',
  'SIGNAL',
  'VECTOR',
  'FLIGHT',
  'LAB',
  'DEBUG'
];
const SURPRISE_NUMERIC_OPTIONS = [
  'PI',
  'E',
  'sqrt(2)',
  '(1+sqrt(5))/2',
  'sin(1)+cos(1)',
  'pow(3,5)',
  'exp(1)',
  'log(64)',
  'round(PI*1000)',
  'sqrt(5)*PI'
];
const SURPRISE_GRAPH_STREAM_SETS = [
  ['RPI', 'BUILD', 'TEST', 'REBUILD'],
  ['LIFT', 'DRAG', 'THRUST', 'WING'],
  ['SIGNAL', 'NOISE', 'SYNC', 'PHASE'],
  ['DATA', 'MODEL', 'TRAIN', 'DEPLOY'],
  ['TROY', 'STACK', 'SHIFT', 'SCALE']
];
const STAFF_SURPRISE_PATTERNS = [
  [
    { note: 'C4', duration: 1 },
    { note: 'E4', duration: 1 },
    { note: 'G4', duration: 1 },
    { note: 'C5', duration: 1 }
  ],
  [
    { note: 'A4', duration: 0.5 },
    { note: 'G4', duration: 0.5 },
    { note: 'E4', duration: 1 },
    { note: 'D4', duration: 1 },
    { note: 'C4', duration: 1 }
  ],
  [
    { note: 'C4', duration: 0.5 },
    { note: 'D4', duration: 0.5 },
    { note: 'E4', duration: 0.5 },
    { note: 'G4', duration: 0.5 },
    { note: 'A4', duration: 1 },
    { note: 'G4', duration: 1 }
  ],
  [
    { note: 'E4', duration: 1 },
    { note: 'G4', duration: 0.5 },
    { note: 'A4', duration: 0.5 },
    { note: 'G4', duration: 1 },
    { note: 'D4', duration: 1 }
  ]
];

const MORSE_DICT = {
  'A': '.-', 'B': '-...', 'C': '-.-.', 'D': '-..', 'E': '.', 'F': '..-.',
  'G': '--.', 'H': '....', 'I': '..', 'J': '.---', 'K': '-.-', 'L': '.-..',
  'M': '--', 'N': '-.', 'O': '---', 'P': '.--.', 'Q': '--.-', 'R': '.-.',
  'S': '...', 'T': '-', 'U': '..-', 'V': '...-', 'W': '.--', 'X': '-..-',
  'Y': '-.--', 'Z': '--..', '1': '.----', '2': '..---', '3': '...--',
  '4': '....-', '5': '.....', '6': '-....', '7': '--...', '8': '---..',
  '9': '----.', '0': '-----', ', ': '--..--', '.': '.-.-.-', '?': '..--..',
  '/': '-..-.', '-': '-....-', '(': '-.--.', ')': '-.--.-'
};

function textToMorse(text) {
  if (!text || typeof text !== 'string') text = "RPI";

  text = text.trim().toUpperCase().substring(0, 100);

  let morseArray = [];
  const words = text.split(' ');

  for (let w = 0; w < words.length; w++) {
    const word = words[w];
    for (let l = 0; l < word.length; l++) {
      const char = word[l];
      const code = MORSE_DICT[char];

      if (code) {
        for (let c = 0; c < code.length; c++) {
          const symbol = code[c];
          if (symbol === '.') {
            morseArray.push(1); // Dot is 1 unit
          } else if (symbol === '-') {
            morseArray.push(1, 1, 1); // Dash is 3 units
          }

          if (c < code.length - 1) {
            morseArray.push(0); // Inter-element gap is 1 unit
          }
        }

        if (l < word.length - 1) {
          morseArray.push(0, 0, 0); // Inter-letter gap is 3 units
        }
      }
    }

    if (w < words.length - 1) {
      morseArray.push(0, 0, 0, 0, 0, 0, 0); // Inter-word gap is 7 units
    }
  }

  return morseArray;
}


// Viewport & Playback State
let isPlaying = true;
const DEFAULT_ZOOM_LEVEL = 1.2;
const MIN_DISPLAY_ZOOM_PERCENT = 50;
const MAX_DISPLAY_ZOOM_PERCENT = 250;
const MIN_ZOOM_LEVEL = DEFAULT_ZOOM_LEVEL * (MIN_DISPLAY_ZOOM_PERCENT / 100);
const MAX_ZOOM_LEVEL = DEFAULT_ZOOM_LEVEL * (MAX_DISPLAY_ZOOM_PERCENT / 100);

let zoomLevel = DEFAULT_ZOOM_LEVEL;
let panOffset = { x: 0, y: 0 };
let isPanningMode = false;
let isAnimated = false;
let lastHeaderPreviewMarkup = '';
let lastHeaderPreviewUpdateTime = 0;

// Zoom/Pan/Playback UI references
let zoomInBtn, zoomOutBtn, zoomResetBtn, panBtn, zoomLevelDisplay;

const AVAILABLE_STYLE_VALUES = new Set([
  'solid', 'ruler', 'ticker', 'binary', 'waveform', 'circles',
  'numeric', 'morse', 'circles-gradient', 'gradient', 'grid',
  'lines', 'point-connect', 'neural-network', 'triangle-grid', 'triangles',
  'fibonacci-sequence', 'union', 'wave-quantum',
  'runway', 'truss', 'music', 'graph'
]);

function normalizeStyleValue(style) {
  if (style === 'staff') return 'music';
  if (style === 'matrix') return 'solid';
  return AVAILABLE_STYLE_VALUES.has(style) ? style : 'solid';
}

const RESETTABLE_GROUP_STYLE_MAP = {
  'ruler-group': 'ruler',
  'binary-group': 'binary',
  'morse-group': 'morse',
  'ticker-group': 'ticker',
  'waveform-group': 'waveform',
  'circles-group': 'circles',
  'numeric-group': 'numeric',
  'circles-gradient-group': 'circles-gradient',
  'gradient-group': 'gradient',
  'grid-group': 'grid',
  'truss-group': 'truss',
  'staff-group': 'music',
  'graph-group': 'graph',
  'lines-group': 'lines',
  'point-connect-group': 'point-connect',
  'neural-network-group': 'neural-network',
  'triangle-grid-group': 'triangle-grid',
  'triangles-group': 'triangles'
};
const SURPRISEABLE_STYLE_SET = new Set(Object.values(RESETTABLE_GROUP_STYLE_MAP));

function ensurePreviewButtonMarkup(button, kind) {
  if (!button) return;

  const resolvedKind = kind || button.dataset.previewKind || 'audio';
  button.dataset.previewKind = resolvedKind;

  if (button.dataset.previewHydrated === 'true') {
    return;
  }

  button.innerHTML = getPreviewButtonMarkup(resolvedKind);
  button.dataset.previewHydrated = 'true';
}

function renderPreviewButton(button, kind, options = {}) {
  if (!button) return;

  ensurePreviewButtonMarkup(button, kind);

  const state = getPreviewButtonState(kind, {
    ...options,
    target: options.target || button.dataset.previewTarget || kind
  });

  button.dataset.previewIcon = state.icon;
  button.dataset.previewAnimated = state.animated ? 'true' : 'false';
  button.classList.toggle('is-active', !!state.active);
  button.disabled = !!state.disabled;
  button.setAttribute('aria-label', state.ariaLabel);
  button.title = state.disabled && state.statusText ? state.statusText : state.ariaLabel;

  const srLabel = button.querySelector('.preview-control-btn_sr');
  if (srLabel) {
    srLabel.textContent = state.ariaLabel;
  } else {
    button.textContent = state.actionText;
  }
}

function initializePreviewButtons() {
  [
    [binaryAudioBtn, 'audio'],
    [morseAudioBtn, 'audio'],
    [tickerMotionBtn, 'motion'],
    [tickerAudioBtn, 'audio'],
    [waveformMotionBtn, 'motion'],
    [waveformAudioBtn, 'audio'],
    [staffAudioBtn, 'audio']
  ].forEach(([button, kind]) => ensurePreviewButtonMarkup(button, kind));
}

function syncMotionToggleState() {
  renderPreviewButton(tickerMotionBtn, 'motion', {
    active: currentShader === 2 && isPlaying
  });
  renderPreviewButton(waveformMotionBtn, 'motion', {
    active: currentShader === 4 && isPlaying
  });
}

function setPlaybackState(shouldPlay) {
  if (shouldPlay !== isPlaying) {
    togglePlayback();
  } else {
    syncMotionToggleState();
  }
}

function updateSidebarScrollFadeState() {
  if (!appSidebar || !sidebarScroll) return;
  appSidebar.classList.toggle('has-scroll-top', sidebarScroll.scrollTop > 1);
}

function resetSequencePreviewState() {
  sequenceContext.currentNote = 0;
  if (audioContext) {
    sequenceContext.nextNoteTime = audioContext.currentTime + 0.1;
  }
  stopAudio();
}

function pickRandom(array) {
  return array[Math.floor(Math.random() * array.length)];
}

function randomChance(probability) {
  return Math.random() < probability;
}

function getStepPrecision(step) {
  const stepString = String(step);
  return stepString.includes('.') ? stepString.split('.')[1].length : 0;
}

function randomStepValue(min, max, step = 1) {
  const precision = getStepPrecision(step);
  const steps = Math.round((max - min) / step);
  const value = min + (Math.floor(Math.random() * (steps + 1)) * step);
  return precision > 0 ? value.toFixed(precision) : String(Math.round(value));
}

function randomSample(array, count) {
  const copy = Array.from(array);
  const sample = [];
  while (copy.length && sample.length < count) {
    const index = Math.floor(Math.random() * copy.length);
    sample.push(copy.splice(index, 1)[0]);
  }
  return sample;
}

function setStaffDurationSelection(duration) {
  currentNoteDuration = duration;
  document.querySelectorAll('#staff-duration-selector .duration-btn').forEach(btn => {
    btn.classList.toggle('active', parseFloat(btn.getAttribute('data-duration')) === duration);
  });
}

function getStyleDisplayName(style) {
  const normalizedStyle = normalizeStyleValue(style);
  const option = styleSelect ? styleSelect.querySelector(`option[value="${normalizedStyle}"]`) : null;
  return option ? option.textContent.trim() : normalizedStyle.toUpperCase();
}

function generateRandomStaffPattern() {
  const basePattern = pickRandom(STAFF_SURPRISE_PATTERNS);
  return basePattern.map(note => ({ ...note }));
}

function getCurrentAudioPreviewType() {
  switch (currentShader) {
    case 2:
      return 'ticker';
    case 3:
      return 'binary';
    case 4:
      return 'waveform';
    case 7:
      return 'morse';
    case 10:
      return 'staff';
    default:
      return null;
  }
}

function getAudioButtonConfig() {
  return [
    { type: 'binary', button: binaryAudioBtn, currentShader: 3 },
    { type: 'morse', button: morseAudioBtn, currentShader: 7 },
    { type: 'ticker', button: tickerAudioBtn, currentShader: 2 },
    { type: 'waveform', button: waveformAudioBtn, currentShader: 4 },
    { type: 'staff', button: staffAudioBtn, currentShader: 10 }
  ];
}

function resetAudioSequencePosition(type) {
  const currentType = type || getCurrentAudioPreviewType();
  if (!currentType) return;

  sequenceContext.currentNote = 0;
  if (audioContext) {
    sequenceContext.nextNoteTime = audioContext.currentTime + 0.1;
  }

  if (currentType === 'waveform') {
    return;
  }

  if (currentType === 'staff' && (!currentStaffNotes || currentStaffNotes.length === 0)) {
    showAudioToast('Add notes to the keyboard before previewing music audio.', 'info');
    return;
  }

  if (sequenceContext.type === currentType && sequenceContext.active) {
    stopAudio();
  }
}

function togglePreviewAudio(type) {
  const currentType = getCurrentAudioPreviewType();
  if (!currentType || currentType !== type) return;

  if (type === 'staff' && (!currentStaffNotes || currentStaffNotes.length === 0)) {
    showAudioToast('Add notes to the keyboard before previewing music audio.', 'info');
    return;
  }

  if (isAudioPlaying) {
    stopAudio();
    return;
  }

  if (type !== 'waveform') {
    resetAudioSequencePosition(type);
  }
  startAudio();
}

function resetStyleParameters(style) {
  stopAudio();

  switch (style) {
    case 'ruler':
      if (rulerRepeatsSlider) rulerRepeatsSlider.value = 10;
      if (rulerUnitsSlider) rulerUnitsSlider.value = 4;
      updateRulerRepeatsDisplay();
      updateRulerUnitsDisplay();
      break;
    case 'binary':
      if (binaryInput) binaryInput.value = 'RPI';
      handleBinaryInput();
      break;
    case 'morse':
      if (morseInput) {
        morseInput.value = 'RPI';
        updateMorseData('RPI');
      }
      resetSequencePreviewState();
      break;
    case 'ticker':
      if (tickerSlider) tickerSlider.value = 34;
      if (tickerRatioSlider) tickerRatioSlider.value = 2;
      if (tickerWidthRatioSlider) tickerWidthRatioSlider.value = 2;
      updateTickerDisplay();
      updateTickerRatioDisplay();
      updateTickerWidthRatioDisplay();
      setPlaybackState(true);
      break;
    case 'waveform':
      if (waveformTypeSlider) waveformTypeSlider.value = 0;
      if (waveformFrequencySlider) waveformFrequencySlider.value = 24;
      if (waveformSpeedSlider) waveformSpeedSlider.value = 0.7;
      if (waveformEnvelopeToggle) waveformEnvelopeToggle.checked = false;
      if (waveformEnvelopeType) waveformEnvelopeType.value = 'sine';
      if (waveformEnvelopeWavesSlider) waveformEnvelopeWavesSlider.value = 1;
      if (waveformEnvelopeCenterSlider) waveformEnvelopeCenterSlider.value = 0;
      if (waveformEnvelopeBipolarToggle) waveformEnvelopeBipolarToggle.checked = false;
      if (envelopeSettingsGroup) envelopeSettingsGroup.style.display = 'none';
      updateWaveformTypeDisplay();
      updateWaveformFrequencyDisplay();
      updateWaveformSpeedDisplay();
      if (waveformEnvelopeWavesDisplay) waveformEnvelopeWavesDisplay.textContent = '1';
      if (waveformEnvelopeCenterDisplay) waveformEnvelopeCenterDisplay.textContent = '0';
      updateAudioParameters();
      setPlaybackState(true);
      break;
    case 'circles':
      if (circlesModeSelect) circlesModeSelect.value = 'packing';
      if (circlesFillSelect) circlesFillSelect.value = 'stroke';
      if (circlesDensitySlider) circlesDensitySlider.value = 50;
      if (circlesSizeVariationSlider) circlesSizeVariationSlider.value = 0;
      if (circlesOverlapSlider) circlesOverlapSlider.value = 0;
      if (circlesRowsSlider) circlesRowsSlider.value = 2;
      if (circlesGridDensitySlider) circlesGridDensitySlider.value = 100;
      if (circlesSizeVariationYSlider) circlesSizeVariationYSlider.value = 0;
      if (circlesSizeVariationXSlider) circlesSizeVariationXSlider.value = 0;
      if (circlesGridOverlapSlider) circlesGridOverlapSlider.value = 0;
      if (circlesLayoutSelect) circlesLayoutSelect.value = 'straight';
      handleCirclesModeChange();
      updateCirclesDensityDisplay();
      updateCirclesSizeVariationDisplay();
      updateCirclesOverlapDisplay();
      updateCirclesRowsDisplay();
      updateCirclesGridDensityDisplay();
      updateCirclesSizeVariationYDisplay();
      updateCirclesSizeVariationXDisplay();
      updateCirclesGridOverlapDisplay();
      break;
    case 'numeric':
      if (numericInput) numericInput.value = '3.1415926535897932384626433832795028841971693993751058209749445923078164062862089986280348253421170679';
      if (numericModeSelect) numericModeSelect.value = 'dotmatrix';
      updateNumericData(numericInput ? numericInput.value : '');
      break;
    case 'circles-gradient':
      if (circlesGradientVariantSlider) circlesGradientVariantSlider.value = 1;
      updateCirclesGradientVariantDisplay();
      break;
    case 'gradient':
      if (gradientVariantSlider) gradientVariantSlider.value = 1;
      updateGradientVariantDisplay();
      break;
    case 'grid':
      if (gridVariantSlider) gridVariantSlider.value = 1;
      updateGridVariantDisplay();
      break;
    case 'truss':
      if (trussFamilySelect) trussFamilySelect.value = 'flat';
      if (trussSegmentsSlider) trussSegmentsSlider.value = 15;
      if (trussThicknessSlider) trussThicknessSlider.value = 2;
      if (trussSegmentsDisplay) trussSegmentsDisplay.textContent = '15';
      if (trussThicknessDisplay) trussThicknessDisplay.textContent = '2';
      break;
    case 'music':
      if (staffInstrumentSelect) staffInstrumentSelect.value = 'piano';
      if (staffNoteShapeSelect) staffNoteShapeSelect.value = 'circle';
      if (staffReverbToggle) staffReverbToggle.checked = false;
      if (staffTremoloToggle) staffTremoloToggle.checked = false;
      if (staffTempoSlider) staffTempoSlider.value = 120;
      if (staffTempoDisplay) staffTempoDisplay.textContent = '120';
      currentNoteDuration = 1;
      currentStaffNotes = [];
      document.querySelectorAll('#staff-duration-selector .duration-btn').forEach(btn => {
        btn.classList.toggle('active', btn.getAttribute('data-duration') === '1');
      });
      break;
    case 'graph':
      if (graphInput) graphInput.value = 'RPI';
      if (graphInput2) graphInput2.value = '';
      if (graphInput3) graphInput3.value = '';
      if (graphInput4) graphInput4.value = '';
      if (graphInput5) graphInput5.value = '';
      if (graphMultiToggle) graphMultiToggle.checked = false;
      if (graphMultiInputs) graphMultiInputs.style.display = 'none';
      if (graphScaleSlider) graphScaleSlider.value = GRAPH_SCALE_DEFAULT;
      if (graphScaleDisplay) graphScaleDisplay.textContent = String(GRAPH_SCALE_DEFAULT);
      break;
    case 'lines':
      if (linesVariantSlider) linesVariantSlider.value = 2;
      updateLinesVariantDisplay();
      break;
    case 'point-connect':
      if (pointConnectVariantSlider) pointConnectVariantSlider.value = 1;
      updatePointConnectVariantDisplay();
      break;
    case 'neural-network':
      if (neuralNetworkHiddenLayersSlider) neuralNetworkHiddenLayersSlider.value = 1;
      updateNeuralNetworkHiddenLayersDisplay();
      break;
    case 'triangle-grid':
      if (triangleGridVariantSlider) triangleGridVariantSlider.value = 2;
      updateTriangleGridVariantDisplay();
      break;
    case 'triangles':
      if (trianglesVariantSlider) trianglesVariantSlider.value = 1;
      updateTrianglesVariantDisplay();
      break;
  }

  syncMotionToggleState();
  updateStaffEffects();
  updateUrlParameters();
  updateAudioControlsUI();
  requestUpdate();
}

function setupControlGroupResetButtons() {
  Object.entries(RESETTABLE_GROUP_STYLE_MAP).forEach(([groupId, style]) => {
    const group = document.getElementById(groupId);
    const header = group?.querySelector('.control-header');
    if (!header || header.querySelector('.control-reset-btn')) return;

    const label = document.createElement('span');
    label.className = 'control-header-label';
    label.textContent = header.textContent.trim();
    header.textContent = '';
    header.appendChild(label);

    const actions = document.createElement('div');
    actions.className = 'control-header-actions';

    if (SURPRISEABLE_STYLE_SET.has(style)) {
      const surpriseBtn = document.createElement('button');
      surpriseBtn.type = 'button';
      surpriseBtn.className = 'control-surprise-btn';
      surpriseBtn.textContent = 'Surprise';
      surpriseBtn.setAttribute('aria-label', `Randomize ${style} parameters`);
      surpriseBtn.addEventListener('click', (event) => {
        event.preventDefault();
        randomizeStyleParameters(style);
      });
      actions.appendChild(surpriseBtn);
    }

    const resetBtn = document.createElement('button');
    resetBtn.type = 'button';
    resetBtn.className = 'control-reset-btn';
    resetBtn.textContent = 'Reset';
    resetBtn.setAttribute('aria-label', `Reset ${style} parameters`);
    resetBtn.addEventListener('click', (event) => {
      event.preventDefault();
      resetStyleParameters(style);
    });
    actions.appendChild(resetBtn);
    header.appendChild(actions);
  });
}

function randomizeStyleParameters(style) {
  stopAudio();

  switch (style) {
    case 'ruler':
      if (rulerRepeatsSlider) rulerRepeatsSlider.value = randomStepValue(4, 20, 1);
      if (rulerUnitsSlider) rulerUnitsSlider.value = pickRandom(['2', '4', '6', '8', '10']);
      updateRulerRepeatsDisplay();
      updateRulerUnitsDisplay();
      break;
    case 'binary':
      if (binaryInput) {
        binaryInput.value = pickRandom(SURPRISE_TEXT_OPTIONS);
        handleBinaryInput();
      }
      break;
    case 'morse':
      if (morseInput) {
        morseInput.value = pickRandom(SURPRISE_TEXT_OPTIONS);
        updateMorseData(morseInput.value);
      }
      resetSequencePreviewState();
      break;
    case 'ticker':
      if (tickerSlider) tickerSlider.value = randomStepValue(8, 40, 1);
      if (tickerRatioSlider) tickerRatioSlider.value = randomStepValue(1, 5, 1);
      if (tickerWidthRatioSlider) tickerWidthRatioSlider.value = randomStepValue(1, 5, 1);
      updateTickerDisplay();
      updateTickerRatioDisplay();
      updateTickerWidthRatioDisplay();
      break;
    case 'waveform':
      if (waveformTypeSlider) waveformTypeSlider.value = pickRandom(['0', '1', '2', '3']);
      if (waveformFrequencySlider) waveformFrequencySlider.value = randomStepValue(12, 88, 1);
      if (waveformSpeedSlider) waveformSpeedSlider.value = randomStepValue(0.3, 3.6, 0.1);
      if (waveformEnvelopeToggle) waveformEnvelopeToggle.checked = randomChance(0.65);
      if (waveformEnvelopeType) waveformEnvelopeType.value = pickRandom(['sine', 'cosine', 'linear', 'inverse']);
      if (waveformEnvelopeWavesSlider) waveformEnvelopeWavesSlider.value = randomStepValue(1, 10, 1);
      if (waveformEnvelopeCenterSlider) waveformEnvelopeCenterSlider.value = randomStepValue(-0.5, 0.5, 0.1);
      if (waveformEnvelopeBipolarToggle) waveformEnvelopeBipolarToggle.checked = randomChance(0.35);
      if (envelopeSettingsGroup) {
        envelopeSettingsGroup.style.display = waveformEnvelopeToggle && waveformEnvelopeToggle.checked ? 'block' : 'none';
      }
      updateWaveformTypeDisplay();
      updateWaveformFrequencyDisplay();
      updateWaveformSpeedDisplay();
      if (waveformEnvelopeWavesDisplay && waveformEnvelopeWavesSlider) {
        waveformEnvelopeWavesDisplay.textContent = String(Math.round(parseFloat(waveformEnvelopeWavesSlider.value)));
      }
      if (waveformEnvelopeCenterDisplay && waveformEnvelopeCenterSlider) {
        waveformEnvelopeCenterDisplay.textContent = String(parseFloat(waveformEnvelopeCenterSlider.value));
      }
      updateAudioParameters();
      break;
    case 'circles':
      if (circlesModeSelect) circlesModeSelect.value = pickRandom(['packing', 'grid']);
      if (circlesFillSelect) circlesFillSelect.value = pickRandom(['stroke', 'fill']);
      handleCirclesModeChange();
      if (circlesModeSelect && circlesModeSelect.value === 'grid') {
        if (circlesRowsSlider) circlesRowsSlider.value = randomStepValue(1, 6, 1);
        if (circlesGridDensitySlider) circlesGridDensitySlider.value = randomStepValue(30, 100, 1);
        if (circlesSizeVariationYSlider) circlesSizeVariationYSlider.value = randomStepValue(-80, 80, 1);
        if (circlesSizeVariationXSlider) circlesSizeVariationXSlider.value = randomStepValue(-80, 80, 1);
        if (circlesGridOverlapSlider) circlesGridOverlapSlider.value = randomStepValue(0, 220, 1);
        if (circlesLayoutSelect) circlesLayoutSelect.value = pickRandom(['straight', 'stagger']);
        updateCirclesRowsDisplay();
        updateCirclesGridDensityDisplay();
        updateCirclesSizeVariationYDisplay();
        updateCirclesSizeVariationXDisplay();
        updateCirclesGridOverlapDisplay();
      } else {
        if (circlesDensitySlider) circlesDensitySlider.value = randomStepValue(20, 95, 1);
        if (circlesSizeVariationSlider) circlesSizeVariationSlider.value = randomStepValue(0, 85, 1);
        if (circlesOverlapSlider) circlesOverlapSlider.value = randomStepValue(0, 70, 1);
        updateCirclesDensityDisplay();
        updateCirclesSizeVariationDisplay();
        updateCirclesOverlapDisplay();
      }
      break;
    case 'numeric':
      if (numericInput) numericInput.value = pickRandom(SURPRISE_NUMERIC_OPTIONS);
      if (numericModeSelect) numericModeSelect.value = pickRandom(['dotmatrix', 'height']);
      updateNumericData(numericInput ? numericInput.value : '');
      break;
    case 'circles-gradient':
      if (circlesGradientVariantSlider) circlesGradientVariantSlider.value = randomStepValue(1, 3, 1);
      updateCirclesGradientVariantDisplay();
      break;
    case 'gradient':
      if (gradientVariantSlider) gradientVariantSlider.value = randomStepValue(1, 2, 1);
      updateGradientVariantDisplay();
      break;
    case 'grid':
      if (gridVariantSlider) gridVariantSlider.value = randomStepValue(1, 3, 1);
      updateGridVariantDisplay();
      break;
    case 'truss':
      if (trussFamilySelect) trussFamilySelect.value = pickRandom(TRUSS_FAMILY_OPTIONS);
      if (trussSegmentsSlider) trussSegmentsSlider.value = randomStepValue(8, 32, 1);
      if (trussThicknessSlider) trussThicknessSlider.value = randomStepValue(1, 4.5, 0.5);
      if (trussSegmentsDisplay && trussSegmentsSlider) trussSegmentsDisplay.textContent = trussSegmentsSlider.value;
      if (trussThicknessDisplay && trussThicknessSlider) trussThicknessDisplay.textContent = trussThicknessSlider.value;
      break;
    case 'music':
      if (staffInstrumentSelect) staffInstrumentSelect.value = pickRandom(['piano', 'synth', 'marimba']);
      if (staffNoteShapeSelect) staffNoteShapeSelect.value = pickRandom(['circle', 'square', 'diamond', 'triangle']);
      if (staffReverbToggle) staffReverbToggle.checked = randomChance(0.45);
      if (staffTremoloToggle) staffTremoloToggle.checked = randomChance(0.35);
      if (staffTempoSlider) staffTempoSlider.value = randomStepValue(76, 176, 1);
      if (staffTempoDisplay && staffTempoSlider) staffTempoDisplay.textContent = staffTempoSlider.value;
      currentStaffNotes = generateRandomStaffPattern();
      setStaffDurationSelection(pickRandom([0.5, 1, 2]));
      updateStaffEffects();
      break;
    case 'graph': {
      const streamSet = pickRandom(SURPRISE_GRAPH_STREAM_SETS);
      const multiStreamEnabled = randomChance(0.55);
      const streamCount = multiStreamEnabled ? randomStepValue(2, Math.min(5, streamSet.length), 1) : '1';
      if (graphInput) graphInput.value = streamSet[0];
      if (graphMultiToggle) graphMultiToggle.checked = multiStreamEnabled;
      if (graphInput2) graphInput2.value = multiStreamEnabled && parseInt(streamCount, 10) > 1 ? streamSet[1] || '' : '';
      if (graphInput3) graphInput3.value = multiStreamEnabled && parseInt(streamCount, 10) > 2 ? streamSet[2] || '' : '';
      if (graphInput4) graphInput4.value = multiStreamEnabled && parseInt(streamCount, 10) > 3 ? streamSet[3] || '' : '';
      if (graphInput5) graphInput5.value = multiStreamEnabled && parseInt(streamCount, 10) > 4 ? streamSet[4] || '' : '';
      if (graphMultiInputs) graphMultiInputs.style.display = multiStreamEnabled ? 'block' : 'none';
      if (graphScaleSlider) graphScaleSlider.value = randomStepValue(6, 14, 1);
      if (graphScaleDisplay && graphScaleSlider) graphScaleDisplay.textContent = graphScaleSlider.value;
      break;
    }
    case 'lines':
      if (linesVariantSlider) linesVariantSlider.value = randomStepValue(1, 2, 1);
      updateLinesVariantDisplay();
      break;
    case 'point-connect':
      if (pointConnectVariantSlider) pointConnectVariantSlider.value = randomStepValue(1, 2, 1);
      updatePointConnectVariantDisplay();
      break;
    case 'neural-network':
      if (neuralNetworkHiddenLayersSlider) neuralNetworkHiddenLayersSlider.value = randomStepValue(1, 5, 1);
      updateNeuralNetworkHiddenLayersDisplay();
      break;
    case 'triangle-grid':
      if (triangleGridVariantSlider) triangleGridVariantSlider.value = randomStepValue(1, 3, 1);
      updateTriangleGridVariantDisplay();
      break;
    case 'triangles':
      if (trianglesVariantSlider) trianglesVariantSlider.value = randomStepValue(1, 2, 1);
      updateTrianglesVariantDisplay();
      break;
  }

  syncMotionToggleState();
  updateStaffEffects();
  updateUrlParameters();
  updateAudioControlsUI();
  requestUpdate();
}

function getBugReportContextLabel() {
  const styleLabel = getStyleDisplayName(styleSelect ? styleSelect.value : 'solid');
  const colorLabel = String(colorModeSelect ? colorModeSelect.value : DEFAULT_COLOR_MODE).replace(/-/g, ' ').toUpperCase();
  return `${styleLabel}  •  ${colorLabel}  •  ${window.innerWidth}×${window.innerHeight}`;
}

function buildBugReportPayload() {
  updateUrlParameters();
  return {
    title: bugReportSubjectInput ? bugReportSubjectInput.value.trim() : '',
    details: bugReportDetailsInput ? bugReportDetailsInput.value.trim() : '',
    steps: bugReportStepsInput ? bugReportStepsInput.value.trim() : '',
    email: bugReportEmailInput ? bugReportEmailInput.value.trim() : '',
    style: normalizeStyleValue(styleSelect ? styleSelect.value : 'solid'),
    styleLabel: getStyleDisplayName(styleSelect ? styleSelect.value : 'solid'),
    colorMode: normalizeColorModeValue(colorModeSelect ? colorModeSelect.value : DEFAULT_COLOR_MODE),
    stateUrl: window.location.href,
    viewport: `${window.innerWidth}x${window.innerHeight}`,
    userAgent: navigator.userAgent,
    timestamp: new Date().toISOString()
  };
}

function populateBugReportContext() {
  if (bugReportContext) {
    bugReportContext.textContent = getBugReportContextLabel();
  }
  if (bugReportSubjectInput && !bugReportSubjectInput.value.trim()) {
    bugReportSubjectInput.value = `${getStyleDisplayName(styleSelect ? styleSelect.value : 'solid')} issue`;
  }
}

function openBugReportDialog() {
  if (!bugReportDialog) return;
  bugReportLastFocusedElement = document.activeElement;
  populateBugReportContext();
  if (typeof bugReportDialog.showModal === 'function') {
    bugReportDialog.showModal();
  } else {
    bugReportDialog.setAttribute('open', '');
  }
  window.requestAnimationFrame(() => {
    if (bugReportSubjectInput) bugReportSubjectInput.focus();
  });
}

function closeBugReportDialog(shouldReset = false) {
  if (!bugReportDialog) return;
  if (shouldReset && bugReportForm) {
    bugReportForm.reset();
  }
  if (bugReportDialog.open && typeof bugReportDialog.close === 'function') {
    bugReportDialog.close();
  } else {
    bugReportDialog.removeAttribute('open');
  }
  if (bugReportContext) bugReportContext.textContent = '';
  if (bugReportLastFocusedElement && document.body.contains(bugReportLastFocusedElement)) {
    bugReportLastFocusedElement.focus();
  }
}

async function submitBugReport(event) {
  event.preventDefault();
  const payload = buildBugReportPayload();

  if (!payload.title || !payload.details) {
    showAudioToast('Please include a short title and a description of the issue.', 'error');
    return;
  }

  try {
    if (BUG_REPORT_APPS_SCRIPT_URL) {
      await fetch(BUG_REPORT_APPS_SCRIPT_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: {
          'Content-Type': 'text/plain;charset=utf-8'
        },
        body: JSON.stringify(payload)
      });
      showAudioToast('Report sent. Thank you.', 'success');
    } else {
      await navigator.clipboard.writeText(JSON.stringify(payload, null, 2));
      showAudioToast('Report details copied. Add your Google Apps Script URL in js/main.js to send reports to Sheets.', 'info');
    }
    closeBugReportDialog(true);
  } catch (error) {
    console.error('Failed to submit bug report:', error);
    showAudioToast('Could not send the report. Please try again.', 'error');
  }
}

function normalizeColorModeValue(colorMode) {
  if (themeModeUtils && typeof themeModeUtils.normalizeColorModeValue === 'function') {
    return themeModeUtils.normalizeColorModeValue(colorMode, {
      defaultColorMode: DEFAULT_COLOR_MODE,
      availableModes: AVAILABLE_COLOR_MODES,
      availableModeSet: AVAILABLE_COLOR_MODE_SET,
      legacyAliases: LEGACY_COLOR_MODE_ALIASES
    });
  }

  const normalized = String(colorMode || DEFAULT_COLOR_MODE).trim().toLowerCase();
  if (AVAILABLE_COLOR_MODE_SET.has(normalized)) return normalized;
  return LEGACY_COLOR_MODE_ALIASES[normalized] || DEFAULT_COLOR_MODE;
}

function syncCustomSelectUI(selectElement, wrapperElement, selectedValue, fallbackLabel) {
  if (themeModeUtils && typeof themeModeUtils.syncCustomSelectState === 'function') {
    return themeModeUtils.syncCustomSelectState(selectElement, wrapperElement, selectedValue, fallbackLabel);
  }

  if (!selectElement || !wrapperElement) {
    return null;
  }

  if (selectedValue != null && selectElement.value !== selectedValue) {
    selectElement.value = selectedValue;
  }

  const selectedOption = selectElement.options[selectElement.selectedIndex];
  const triggerLabel = wrapperElement.querySelector('.custom-select-trigger');
  if (triggerLabel) {
    triggerLabel.textContent = selectedOption ? selectedOption.textContent : String(fallbackLabel || selectedValue || '');
  }

  wrapperElement.querySelectorAll('.custom-option').forEach(option => {
    option.classList.toggle('selected', option.dataset.value === selectElement.value);
  });

  return triggerLabel ? triggerLabel.textContent : null;
}

function syncAllCustomSelects() {
  document.querySelectorAll('.control-select').forEach(selectElement => {
    const wrapperElement = selectElement.parentElement;
    if (!wrapperElement || !wrapperElement.classList.contains('custom-select-wrapper')) {
      return;
    }

    const selectedOption = selectElement.options[selectElement.selectedIndex];
    syncCustomSelectUI(
      selectElement,
      wrapperElement,
      selectElement.value,
      selectedOption ? selectedOption.textContent : selectElement.value
    );
  });
}

function zoomLevelToDisplayPercent(level) {
  return Math.round((level / DEFAULT_ZOOM_LEVEL) * 100);
}

function displayPercentToZoomLevel(percent) {
  const constrainedPercent = constrain(percent, MIN_DISPLAY_ZOOM_PERCENT, MAX_DISPLAY_ZOOM_PERCENT);
  return DEFAULT_ZOOM_LEVEL * (constrainedPercent / 100);
}

// Convert text to binary
function textToBinary(text) {
  if (!text || typeof text !== 'string') text = "RPI"; // Default text

  // Remove only tabs and newlines, keep regular spaces and limit length to prevent crashes
  text = text.replace(/[\t\n\r]/g, '').substring(0, 100); // Limit to 100 characters max

  let binary = [];
  for (let i = 0; i < text.length; i++) {
    let charCode = text.charCodeAt(i);
    // Ensure valid character code
    if (isNaN(charCode) || charCode < 0 || charCode > 127) {
      charCode = 65; // Default to 'A' for invalid characters
    }
    for (let j = 7; j >= 0; j--) {
      binary.push((charCode >> j) & 1);
    }
  }
  return binary;
}

// Evaluate mathematical formulas safely
function evaluateFormula(formula) {
  if (!formula || typeof formula !== 'string') {
    return "3.1415926535897932384626433832795028841971693993751058209749445923078164062862089986280348253421170679";
  }

  // Clean the input
  const cleanFormula = formula.trim();

  // If it's already a number, return it
  if (!isNaN(cleanFormula) && !isNaN(parseFloat(cleanFormula))) {
    return cleanFormula;
  }

  try {
    // Create a safe evaluation context with allowed mathematical functions
    const safeContext = {
      Math: Math,
      PI: Math.PI,
      E: Math.E,
      sqrt: Math.sqrt,
      pow: Math.pow,
      sin: Math.sin,
      cos: Math.cos,
      tan: Math.tan,
      log: Math.log,
      exp: Math.exp,
      abs: Math.abs,
      floor: Math.floor,
      ceil: Math.ceil,
      round: Math.round,
      min: Math.min,
      max: Math.max
    };

    // Replace ^ with ** for exponentiation (JavaScript syntax)
    let processedFormula = cleanFormula.replace(/\^/g, '**');

    // Replace common mathematical constants if used without Math prefix
    processedFormula = processedFormula.replace(/\bPI\b/g, 'Math.PI');
    processedFormula = processedFormula.replace(/\bE\b/g, 'Math.E');

    // Basic security check - only allow numbers, operators, parentheses, dots, and Math functions
    const allowedPattern = /^[0-9+\-*/().^Math\s_a-zA-Z]*$/;
    if (!allowedPattern.test(processedFormula)) {
      throw new Error('Invalid characters in formula');
    }

    // Evaluate the formula using Function constructor (safer than eval)
    const evalFunction = new Function('Math', `return ${processedFormula}`);
    const result = evalFunction(Math);

    // Check if result is a valid number
    if (isNaN(result) || !isFinite(result)) {
      throw new Error('Formula result is not a valid number');
    }

    // Convert to string with appropriate precision
    return result.toString();

  } catch (error) {
    console.warn('Formula evaluation failed:', error);
    // Return the original input if evaluation fails
    return cleanFormula;
  }
}

function getSelectedMusicNoteShape() {
  return normalizeMusicNoteShape(staffNoteShapeSelect ? staffNoteShapeSelect.value : 'circle');
}

function drawMusicHeadP5(shape, x, y, rx, ry, filled, noteColor) {
  const normalizedShape = normalizeMusicNoteShape(shape);

  if (filled) {
    fill(noteColor);
    noStroke();
  } else {
    noFill();
    stroke(noteColor);
  }

  if (normalizedShape === 'circle') {
    circle(x, y, rx * 2);
    return;
  }

  if (normalizedShape === 'square') {
    rectMode(CENTER);
    rect(x, y, rx * 2, ry * 2);
    rectMode(CORNER);
    return;
  }

  beginShape();
  if (normalizedShape === 'diamond') {
    vertex(x, y - ry);
    vertex(x + rx, y);
    vertex(x, y + ry);
    vertex(x - rx, y);
  } else {
    vertex(x, y - ry);
    vertex(x + rx, y + ry);
    vertex(x - rx, y + ry);
  }
  endShape(CLOSE);
}

// Convert numeric string to digit array
function parseNumericString(numericString) {
  if (!numericString || typeof numericString !== 'string') {
    numericString = "3.1415926535897932384626433832795028841971693993751058209749445923078164062862089986280348253421170679";
  }

  // First, try to evaluate as a formula
  const evaluatedString = evaluateFormula(numericString);

  let digits = [];
  for (let i = 0; i < evaluatedString.length; i++) {
    const char = evaluatedString[i];
    if (char === '.') {
      digits.push(10); // Use 10 to represent decimal point
    } else if (char >= '0' && char <= '9') {
      digits.push(parseInt(char));
    }
    // Skip any other characters
  }

  // Limit to reasonable length to prevent performance issues
  return digits.slice(0, 200);
}

const GRAPH_MAX_STREAMS = 5;
const GRAPH_SCALE_MIN = 4;
const GRAPH_SCALE_DEFAULT = 10;

function getGraphScaleFactor() {
  const sliderValue = parseInt(graphScaleSlider ? graphScaleSlider.value : GRAPH_SCALE_DEFAULT, 10);
  const clampedValue = Math.max(GRAPH_SCALE_MIN, isNaN(sliderValue) ? GRAPH_SCALE_DEFAULT : sliderValue);
  return clampedValue / 10.0;
}

function getGraphInputElements() {
  return [graphInput, graphInput2, graphInput3, graphInput4, graphInput5].filter(Boolean).slice(0, GRAPH_MAX_STREAMS);
}

function getGraphStreamTexts() {
  const inputs = getGraphInputElements();
  if (inputs.length === 0) return ['RPI'];

  const primaryText = (inputs[0].value || 'RPI').trim();
  const multiEnabled = graphMultiToggle && graphMultiToggle.checked;
  if (!multiEnabled) {
    return [primaryText || 'RPI'];
  }

  const streams = [];
  for (let i = 0; i < inputs.length; i++) {
    const value = (inputs[i].value || '').trim();
    if (value.length > 0) {
      streams.push(value);
    }
  }

  return streams.length > 0 ? streams : [primaryText || 'RPI'];
}

function graphTextToSeries(text) {
  const source = (text && text.length > 0 ? text : 'RPI').slice(0, 200);
  const values = [];
  for (let i = 0; i < source.length; i++) {
    values.push(source.charCodeAt(i));
  }
  if (values.length === 1) {
    values.push(values[0]);
  }
  return values;
}

function buildGraphSeriesData(streamTexts) {
  const seriesList = streamTexts.map(graphTextToSeries);
  let minValue = Infinity;
  let maxValue = -Infinity;

  for (let i = 0; i < seriesList.length; i++) {
    const series = seriesList[i];
    for (let j = 0; j < series.length; j++) {
      minValue = Math.min(minValue, series[j]);
      maxValue = Math.max(maxValue, series[j]);
    }
  }

  if (!isFinite(minValue) || !isFinite(maxValue)) {
    minValue = 0;
    maxValue = 1;
  }
  if (maxValue === minValue) {
    maxValue = minValue + 1;
  }

  return { seriesList, minValue, maxValue };
}

// Create texture from numeric data


// Shader storage
let shaders = {
  binary: null,
  ticker: null,
  ruler: null,
  waveform: null,
  circles: null,
  numeric: null
};



// Convert SVG path to p5.js shape


// Helper function to draw SVG paths on a graphics buffer


// Helper function to draw bar patterns on graphics buffer


async function setup() {
  // Create canvas that fills the container
  const container = document.getElementById('p5-container');
  const width = container ? container.offsetWidth : windowWidth;
  const height = container ? container.offsetHeight : windowHeight;

  let canvas = createCanvas(width, height, WEBGL);
  canvas.parent('p5-container');

  // Handle WebGL context loss to prevent crashes
  canvas.elt.addEventListener('webglcontextlost', (event) => {
    event.preventDefault();
    console.warn('WebGL core context lost. Suspending animation loop.');
    noLoop();
  });

  canvas.elt.addEventListener('webglcontextrestored', () => {
    console.log('WebGL core context restored. Resuming animation loop.');
    loop();
  });



  // Initialize binary data first
  updateBinaryData("RPI");

  // Initialize morse data
  updateMorseData("RPI");

  // Initialize numeric data
  updateNumericData("3.1415926535897932384626433832795028841971693993751058209749445923078164062862089986280348253421170679");

  // Load shaders from files
  try {
    shaders.binary = await loadShader('assets/shaders/vertex.glsl', 'assets/shaders/binary.frag');
    shaders.ticker = await loadShader('assets/shaders/vertex.glsl', 'assets/shaders/ticker.frag');
    shaders.ruler = await loadShader('assets/shaders/vertex.glsl', 'assets/shaders/ruler.frag');
    shaders.waveform = await loadShader('assets/shaders/vertex.glsl', 'assets/shaders/waveform.frag');
    shaders.circles = await loadShader('assets/shaders/vertex.glsl', 'assets/shaders/circles.frag');
    shaders.numeric = await loadShader('assets/shaders/vertex.glsl', 'assets/shaders/numeric.frag');
    console.log('Shaders loaded successfully');
  } catch (error) {
    console.error('Error loading shaders:', error);
  }

  // Get control references
  styleSelect = document.getElementById('style-select');
  colorModeSelect = document.getElementById('color-mode-select');
  binaryInput = document.getElementById('binary-input');
  binaryGroup = document.getElementById('binary-group');
  binaryAudioBtn = document.getElementById('binary-audio-btn');
  morseInput = document.getElementById('morse-input');
  morseGroup = document.getElementById('morse-group');
  morseAudioBtn = document.getElementById('morse-audio-btn');
  rulerGroup = document.getElementById('ruler-group');
  rulerRepeatsSlider = document.getElementById('ruler-repeats-slider');
  rulerRepeatsDisplay = document.getElementById('ruler-repeats-display');
  rulerUnitsSlider = document.getElementById('ruler-units-slider');
  rulerUnitsDisplay = document.getElementById('ruler-units-display');
  tickerSlider = document.getElementById('ticker-slider');
  tickerDisplay = document.getElementById('ticker-display');
  tickerGroup = document.getElementById('ticker-group');
  tickerRatioSlider = document.getElementById('ticker-ratio-slider');
  tickerRatioDisplay = document.getElementById('ticker-ratio-display');
  tickerWidthRatioSlider = document.getElementById('ticker-width-ratio-slider');
  tickerWidthRatioDisplay = document.getElementById('ticker-width-ratio-display');
  tickerAudioBtn = document.getElementById('ticker-audio-btn');
  tickerMotionBtn = document.getElementById('ticker-motion-btn');
  waveformGroup = document.getElementById('waveform-group');
  waveformTypeSlider = document.getElementById('waveform-type-slider');
  waveformTypeDisplay = document.getElementById('waveform-type-display');
  waveformFrequencySlider = document.getElementById('waveform-frequency-slider');
  waveformFrequencyDisplay = document.getElementById('waveform-frequency-display');
  waveformSpeedSlider = document.getElementById('waveform-speed-slider');
  waveformSpeedDisplay = document.getElementById('waveform-speed-display');
  waveformAudioBtn = document.getElementById('waveform-audio-btn');
  waveformEnvelopeToggle = document.getElementById('waveform-envelope-toggle');
  envelopeSettingsGroup = document.getElementById('envelope-settings-group');
  waveformEnvelopeType = document.getElementById('waveform-envelope-type');
  waveformEnvelopeWavesSlider = document.getElementById('waveform-envelope-waves-slider');
  waveformEnvelopeWavesDisplay = document.getElementById('waveform-envelope-waves-display');
  waveformEnvelopeCenterSlider = document.getElementById('waveform-envelope-center-slider');
  waveformEnvelopeCenterDisplay = document.getElementById('waveform-envelope-center-display');
  waveformEnvelopeBipolarToggle = document.getElementById('waveform-envelope-bipolar-toggle');
  waveformMotionBtn = document.getElementById('waveform-motion-btn');
  circlesGroup = document.getElementById('circles-group');
  circlesDensitySlider = document.getElementById('circles-density-slider');
  circlesDensityDisplay = document.getElementById('circles-density-display');

  zoomInBtn = document.getElementById('zoom-in-btn');
  zoomOutBtn = document.getElementById('zoom-out-btn');
  zoomResetBtn = document.getElementById('zoom-reset-btn');
  panBtn = document.getElementById('pan-btn');
  zoomLevelDisplay = document.getElementById('zoom-level');

  // Setup Zoom Listeners and Input
  let zoomInterval = null;
  const startZoom = (amount) => {
    zoomCanvas(amount);
    if (!zoomInterval) {
      zoomInterval = setInterval(() => zoomCanvas(amount * 0.5), 50);
    }
  };
  const stopZoom = () => {
    if (zoomInterval) {
      clearInterval(zoomInterval);
      zoomInterval = null;
    }
  };

  if (zoomInBtn) {
    zoomInBtn.addEventListener('mousedown', () => startZoom(0.1));
    zoomInBtn.addEventListener('touchstart', (e) => { e.preventDefault(); startZoom(0.1); });
    zoomInBtn.addEventListener('mouseup', stopZoom);
    zoomInBtn.addEventListener('mouseleave', stopZoom);
    zoomInBtn.addEventListener('touchend', stopZoom);
  }
  if (zoomOutBtn) {
    zoomOutBtn.addEventListener('mousedown', () => startZoom(-0.1));
    zoomOutBtn.addEventListener('touchstart', (e) => { e.preventDefault(); startZoom(-0.1); });
    zoomOutBtn.addEventListener('mouseup', stopZoom);
    zoomOutBtn.addEventListener('mouseleave', stopZoom);
    zoomOutBtn.addEventListener('touchend', stopZoom);
  }
  if (zoomResetBtn) {
    zoomResetBtn.addEventListener('click', () => {
      zoomLevel = DEFAULT_ZOOM_LEVEL;
      panOffset = { x: 0, y: 0 };
      if (zoomLevelDisplay) {
        zoomLevelDisplay.value = '100%';
      }
      if (!isPlaying) redraw();
    });
  }

  // Zoom Input Handling
  if (zoomLevelDisplay) {
    const handleZoomInput = () => {
      let val = zoomLevelDisplay.value.replace('%', '');
      let num = parseFloat(val);
      if (!isNaN(num)) {
        zoomLevel = displayPercentToZoomLevel(num);
        clampPanOffset();
        if (!isPlaying) redraw();
      }
      zoomLevelDisplay.value = zoomLevelToDisplayPercent(zoomLevel) + '%';
    };
    zoomLevelDisplay.addEventListener('change', handleZoomInput);
    zoomLevelDisplay.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        handleZoomInput();
        zoomLevelDisplay.blur();
      }
    });
    // On focus, select the number for easy editing
    zoomLevelDisplay.addEventListener('focus', () => {
      zoomLevelDisplay.value = zoomLevelToDisplayPercent(zoomLevel);
      zoomLevelDisplay.select();
    });
    // On blur, revert to % format if unchanged
    zoomLevelDisplay.addEventListener('blur', () => {
      zoomLevelDisplay.value = zoomLevelToDisplayPercent(zoomLevel) + '%';
    });
  }

  // Setup Pan Listener
  if (panBtn) {
    panBtn.addEventListener('click', togglePanMode);
  }
  document.addEventListener('pointerdown', handlePanModeOutsidePointerDown, true);
  circlesSizeVariationSlider = document.getElementById('circles-size-variation-slider');
  circlesSizeVariationDisplay = document.getElementById('circles-size-variation-display');
  circlesOverlapSlider = document.getElementById('circles-overlap-slider');
  circlesOverlapDisplay = document.getElementById('circles-overlap-display');
  circlesFillSelect = document.getElementById('circles-fill-select');
  circlesModeSelect = document.getElementById('circles-mode-select');
  circlesPackingControls = document.getElementById('circles-packing-controls');
  circlesGridControls = document.getElementById('circles-grid-controls');
  circlesRowsSlider = document.getElementById('circles-rows-slider');
  circlesRowsDisplay = document.getElementById('circles-rows-display');
  circlesGridDensitySlider = document.getElementById('circles-grid-density-slider');
  circlesGridDensityDisplay = document.getElementById('circles-grid-density-display');
  circlesSizeVariationYSlider = document.getElementById('circles-size-variation-y-slider');
  circlesSizeVariationYDisplay = document.getElementById('circles-size-variation-y-display');
  circlesSizeVariationXSlider = document.getElementById('circles-size-variation-x-slider');
  circlesSizeVariationXDisplay = document.getElementById('circles-size-variation-x-display');
  circlesGridOverlapSlider = document.getElementById('circles-grid-overlap-slider');
  circlesGridOverlapDisplay = document.getElementById('circles-grid-overlap-display');
  circlesLayoutSelect = document.getElementById('circles-layout-select');
  numericGroup = document.getElementById('numeric-group');
  numericInput = document.getElementById('numeric-input');
  numericModeSelect = document.getElementById('numeric-mode-select');
  circlesGradientGroup = document.getElementById('circles-gradient-group');
  circlesGradientVariantSlider = document.getElementById('circles-gradient-variant-slider');
  circlesGradientVariantDisplay = document.getElementById('circles-gradient-variant-display');
  gradientGroup = document.getElementById('gradient-group');
  gradientVariantSlider = document.getElementById('gradient-variant-slider');
  gradientVariantDisplay = document.getElementById('gradient-variant-display');
  gridGroup = document.getElementById('grid-group');
  gridVariantSlider = document.getElementById('grid-variant-slider');
  gridVariantDisplay = document.getElementById('grid-variant-display');
  linesGroup = document.getElementById('lines-group');
  linesVariantSlider = document.getElementById('lines-variant-slider');
  linesVariantDisplay = document.getElementById('lines-variant-display');
  pointConnectGroup = document.getElementById('point-connect-group');
  pointConnectVariantSlider = document.getElementById('point-connect-variant-slider');
  pointConnectVariantDisplay = document.getElementById('point-connect-variant-display');
  neuralNetworkGroup = document.getElementById('neural-network-group');
  neuralNetworkHiddenLayersSlider = document.getElementById('neural-network-hidden-layers-slider');
  neuralNetworkHiddenLayersDisplay = document.getElementById('neural-network-hidden-layers-display');
  triangleGridGroup = document.getElementById('triangle-grid-group');
  triangleGridVariantSlider = document.getElementById('triangle-grid-variant-slider');
  triangleGridVariantDisplay = document.getElementById('triangle-grid-variant-display');
  trianglesGroup = document.getElementById('triangles-group');
  trianglesVariantSlider = document.getElementById('triangles-variant-slider');
  trianglesVariantDisplay = document.getElementById('triangles-variant-display');
  trussGroup = document.getElementById('truss-group');
  trussFamilySelect = document.getElementById('truss-family-select');
  trussSegmentsSlider = document.getElementById('truss-segments-slider');
  trussSegmentsDisplay = document.getElementById('truss-segments-display');
  trussThicknessSlider = document.getElementById('truss-thickness-slider');
  trussThicknessDisplay = document.getElementById('truss-thickness-display');
  staffGroup = document.getElementById('staff-group');
  staffAudioBtn = document.getElementById('staff-audio-btn');
  staffInstrumentSelect = document.getElementById('staff-instrument-select');
  staffNoteShapeSelect = document.getElementById('staff-note-shape-select');
  staffClearBtn = document.getElementById('staff-clear-btn');
  staffReverbToggle = document.getElementById('staff-reverb-toggle');
  staffTremoloToggle = document.getElementById('staff-tremolo-toggle');
  staffTempoSlider = document.getElementById('staff-tempo-slider');
  staffTempoDisplay = document.getElementById('staff-tempo-display');
  pulseGroup = document.getElementById('pulse-group');
  pulseInput = document.getElementById('pulse-input');
  pulseIntensitySlider = document.getElementById('pulse-intensity-slider');
  pulseIntensityDisplay = document.getElementById('pulse-intensity-display');
  graphGroup = document.getElementById('graph-group');
  graphInput = document.getElementById('graph-input');
  graphInput2 = document.getElementById('graph-input-2');
  graphInput3 = document.getElementById('graph-input-3');
  graphInput4 = document.getElementById('graph-input-4');
  graphInput5 = document.getElementById('graph-input-5');
  graphMultiToggle = document.getElementById('graph-multi-toggle');
  graphMultiInputs = document.getElementById('graph-multi-inputs');
  graphScaleSlider = document.getElementById('graph-scale-slider');
  graphScaleDisplay = document.getElementById('graph-scale-display');
  appMain = document.querySelector('.app-main');
  canvasViewport = document.querySelector('.canvas-viewport');
  appSidebar = document.getElementById('app-sidebar');
  sidebarScroll = document.getElementById('sidebar-scroll');
  headerLogoPreview = document.getElementById('header-logo-preview');
  mobileMenuToggle = document.getElementById('mobile-menu-toggle');
  reportProblemBtn = document.getElementById('report-problem-btn');
  bugReportDialog = document.getElementById('bug-report-dialog');
  bugReportForm = document.getElementById('bug-report-form');
  bugReportContext = document.getElementById('bug-report-context');
  bugReportCloseBtn = document.getElementById('bug-report-close');
  bugReportCancelBtn = document.getElementById('bug-report-cancel');
  bugReportSubjectInput = document.getElementById('bug-report-subject');
  bugReportDetailsInput = document.getElementById('bug-report-details');
  bugReportStepsInput = document.getElementById('bug-report-steps');
  bugReportEmailInput = document.getElementById('bug-report-email');
  easterEggHint = document.getElementById('easter-egg-hint');
  easterEggHintLabel = document.getElementById('easter-egg-hint-label');
  easterEggOverlay = document.getElementById('easter-egg-overlay');
  easterEggCanvas = document.getElementById('easter-egg-canvas');
  easterEggLiveStatus = document.getElementById('easter-egg-live-status');
  easterEggCloseButton = document.getElementById('easter-egg-close');
  easterEggTouchButtons = Array.from(document.querySelectorAll('.easter-egg-touch-btn'));

  // Get save control references (globals declared at top so toggleSaveMenu can access them)
  saveButton = document.getElementById('save-button');
  saveMenu = document.getElementById('save-menu');
  const savePngButton = document.getElementById('save-png');
  const saveSvgButton = document.getElementById('save-svg');
  saveLoopGifButton = document.getElementById('save-loop-gif');

  initializePreviewButtons();

  updateSidebarScrollFadeState();
  if (sidebarScroll) {
    sidebarScroll.addEventListener('scroll', updateSidebarScrollFadeState, { passive: true });
  }

  // Setup ruler sliders with display updates
  rulerRepeatsSlider.addEventListener('input', function () {
    updateRulerRepeatsDisplay();
    updateUrlParameters();
    requestUpdate();
  });
  rulerUnitsSlider.addEventListener('input', function () {
    updateRulerUnitsDisplay();
    updateUrlParameters();
    requestUpdate();
  });
  updateRulerRepeatsDisplay(); // Set initial value
  updateRulerUnitsDisplay(); // Set initial value

  // Setup ticker slider with display update
  tickerSlider.addEventListener('input', function () {
    updateTickerDisplay();
    updateUrlParameters();
    requestUpdate();
  });
  updateTickerDisplay(); // Set initial value

  // Setup ticker ratio slider with display update
  tickerRatioSlider.addEventListener('input', function () {
    updateTickerRatioDisplay();
    updateUrlParameters();
    requestUpdate();
  });
  updateTickerRatioDisplay(); // Set initial value

  // Setup ticker width ratio slider with display update
  tickerWidthRatioSlider.addEventListener('input', function () {
    updateTickerWidthRatioDisplay();
    updateUrlParameters();
    requestUpdate();
  });
  updateTickerWidthRatioDisplay(); // Set initial value

  // Setup waveform sliders with display updates and audio parameter updates
  waveformTypeSlider.addEventListener('input', function () {
    updateWaveformTypeDisplay();
    updateAudioParameters();
    updateUrlParameters();
    requestUpdate();
  });
  waveformFrequencySlider.addEventListener('input', function () {
    updateWaveformFrequencyDisplay();
    updateAudioParameters();
    updateUrlParameters();
    requestUpdate();
  });
  waveformSpeedSlider.addEventListener('input', function () {
    updateWaveformSpeedDisplay();
    updateUrlParameters();
    requestUpdate();
  });

  if (waveformEnvelopeToggle) {
    waveformEnvelopeToggle.addEventListener('change', function () {
      if (envelopeSettingsGroup) envelopeSettingsGroup.style.display = this.checked ? 'block' : 'none';
      updateUrlParameters();
      requestUpdate();
    });
  }
  if (waveformEnvelopeType) {
    waveformEnvelopeType.addEventListener('change', function () {
      updateUrlParameters();
      requestUpdate();
    });
  }
  if (waveformEnvelopeWavesSlider) {
    waveformEnvelopeWavesSlider.addEventListener('input', function () {
      const normalizedValue = typeof normalizeWaveformEnvelopeWaves === 'function'
        ? normalizeWaveformEnvelopeWaves(this.value)
        : Math.max(1, Math.min(10, Math.round(parseFloat(this.value)) || 1));
      this.value = normalizedValue;
      if (waveformEnvelopeWavesDisplay) waveformEnvelopeWavesDisplay.textContent = normalizedValue;
      updateUrlParameters();
      requestUpdate();
    });
  }
  if (waveformEnvelopeCenterSlider) {
    waveformEnvelopeCenterSlider.addEventListener('input', function () {
      const normalizedValue = typeof normalizeWaveformEnvelopeCenter === 'function'
        ? normalizeWaveformEnvelopeCenter(this.value)
        : Math.max(-0.5, Math.min(0.5, parseFloat(this.value) || 0));
      this.value = normalizedValue;
      if (waveformEnvelopeCenterDisplay) waveformEnvelopeCenterDisplay.textContent = normalizedValue;
      updateUrlParameters();
      requestUpdate();
    });
  }
  if (waveformEnvelopeBipolarToggle) {
    waveformEnvelopeBipolarToggle.addEventListener('change', function () {
      updateUrlParameters();
      requestUpdate();
    });
  }

  if (waveformAudioBtn) {
    waveformAudioBtn.addEventListener('click', function (e) {
      e.preventDefault();
      togglePreviewAudio('waveform');
    });
  }

  if (waveformMotionBtn) {
    waveformMotionBtn.addEventListener('click', function (e) {
      e.preventDefault();
      if (currentShader === 4) {
        togglePlayback();
      }
    });
  }

  if (tickerMotionBtn) {
    tickerMotionBtn.addEventListener('click', function (e) {
      e.preventDefault();
      if (currentShader === 2) {
        togglePlayback();
      }
    });
  }

  if (tickerAudioBtn) {
    tickerAudioBtn.addEventListener('click', function (e) {
      e.preventDefault();
      togglePreviewAudio('ticker');
    });
  }

  // Set default values only if no URL parameters
  if (!window.location.search) {
    waveformTypeSlider.value = "0"; // SINE
    waveformFrequencySlider.value = "24"; // Frequency 24
    waveformSpeedSlider.value = "0.7"; // Speed 0.7
  }

  updateWaveformTypeDisplay(); // Set initial value
  updateWaveformFrequencyDisplay(); // Set initial value
  updateWaveformSpeedDisplay(); // Set initial value

  // Setup circles sliders with display updates and debouncing
  let circleUpdateTimeout;

  function debouncedCircleUpdate() {
    clearTimeout(circleUpdateTimeout);
    circleUpdateTimeout = setTimeout(() => {
      // Force redraw after parameter changes
      redraw();
      updateUrlParameters();
    }, 50); // 50ms debounce
  }

  circlesDensitySlider.addEventListener('input', () => {
    updateCirclesDensityDisplay();
    debouncedCircleUpdate();
  });
  circlesSizeVariationSlider.addEventListener('input', () => {
    updateCirclesSizeVariationDisplay();
    debouncedCircleUpdate();
  });
  circlesOverlapSlider.addEventListener('input', () => {
    updateCirclesOverlapDisplay();
    debouncedCircleUpdate();
  });

  updateCirclesDensityDisplay(); // Set initial value
  updateCirclesSizeVariationDisplay(); // Set initial value
  updateCirclesOverlapDisplay(); // Set initial value

  // Setup circles mode selector
  circlesModeSelect.addEventListener('change', function () {
    handleCirclesModeChange();
    updateUrlParameters();
  });

  // Setup circles fill selector
  circlesFillSelect.addEventListener('change', function () {
    updateUrlParameters();
  });

  // Setup grid mode sliders with display updates and debouncing
  circlesRowsSlider.addEventListener('input', () => {
    updateCirclesRowsDisplay();
    debouncedCircleUpdate();
  });
  circlesGridDensitySlider.addEventListener('input', () => {
    updateCirclesGridDensityDisplay();
    debouncedCircleUpdate();
  });
  circlesSizeVariationYSlider.addEventListener('input', () => {
    updateCirclesSizeVariationYDisplay();
    debouncedCircleUpdate();
  });
  circlesSizeVariationXSlider.addEventListener('input', () => {
    updateCirclesSizeVariationXDisplay();
    debouncedCircleUpdate();
  });
  circlesGridOverlapSlider.addEventListener('input', () => {
    updateCirclesGridOverlapDisplay();
    debouncedCircleUpdate();
  });
  circlesLayoutSelect.addEventListener('change', function () {
    debouncedCircleUpdate();
  });

  updateCirclesRowsDisplay(); // Set initial value
  updateCirclesGridDensityDisplay(); // Set initial value
  updateCirclesSizeVariationYDisplay(); // Set initial value
  updateCirclesSizeVariationXDisplay(); // Set initial value
  updateCirclesGridOverlapDisplay(); // Set initial value

  // Setup mobile menu toggle
  if (mobileMenuToggle) {
    mobileMenuToggle.addEventListener('click', function (e) {
      e.preventDefault();
      toggleMobileMenu();
    });
  }

  syncSidebarToggleState();
  setupControlGroupResetButtons();

  if (reportProblemBtn) {
    reportProblemBtn.addEventListener('click', function (e) {
      e.preventDefault();
      openBugReportDialog();
    });
  }

  if (bugReportCloseBtn) {
    bugReportCloseBtn.addEventListener('click', function (e) {
      e.preventDefault();
      closeBugReportDialog();
    });
  }

  if (bugReportCancelBtn) {
    bugReportCancelBtn.addEventListener('click', function (e) {
      e.preventDefault();
      closeBugReportDialog();
    });
  }

  if (bugReportForm) {
    bugReportForm.addEventListener('submit', submitBugReport);
  }

  if (bugReportDialog) {
    bugReportDialog.addEventListener('click', function (event) {
      const dialogBounds = bugReportDialog.getBoundingClientRect();
      const clickedBackdrop = event.clientX < dialogBounds.left ||
        event.clientX > dialogBounds.right ||
        event.clientY < dialogBounds.top ||
        event.clientY > dialogBounds.bottom;

      if (clickedBackdrop) {
        closeBugReportDialog();
      }
    });
    bugReportDialog.addEventListener('close', function () {
      if (bugReportContext) bugReportContext.textContent = '';
      if (bugReportLastFocusedElement && document.body.contains(bugReportLastFocusedElement)) {
        bugReportLastFocusedElement.focus();
      }
    });
  }

  // Add click/touch outside to close functionality with improved mobile handling
  document.addEventListener('click', handleClickOutside);
  document.addEventListener('touchend', handleClickOutside);

  // Focus trap and Escape key support for sidebar
  appSidebar.addEventListener('keydown', function (e) {
    // Only trap focus on mobile when sidebar is active
    if (window.innerWidth <= 768 && !appSidebar.classList.contains('active')) return;

    // Handle Escape to close (mobile only)
    if (e.key === 'Escape' && window.innerWidth <= 768) {
      e.stopPropagation();
      toggleMobileMenu();
      return;
    }

    // Handle Tab to trap focus
    if (e.key === 'Tab') {
      const focusableContent = appSidebar.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');

      if (focusableContent.length === 0) return;

      const first = focusableContent[0];
      const last = focusableContent[focusableContent.length - 1];

      if (e.shiftKey) { // Shift + Tab
        if (document.activeElement === first) {
          last.focus();
          e.preventDefault();
        }
      } else { // Tab
        if (document.activeElement === last) {
          first.focus();
          e.preventDefault();
        }
      }
    }
  });

  // Setup save functionality - use delegation for robustness
  document.addEventListener('click', function (e) {
    const btn = e.target.closest('#save-button');
    if (btn) {
      toggleSaveMenu(e);
    }
  });

  if (savePngButton) {
    savePngButton.addEventListener('click', savePNG);
  }
  if (saveSvgButton) {
    saveSvgButton.addEventListener('click', saveSVG);
  }
  if (saveLoopGifButton) {
    saveLoopGifButton.addEventListener('click', saveLoopingGIF);
  }

  const copyEmbedButton = document.getElementById('copy-embed');
  if (copyEmbedButton) {
    copyEmbedButton.addEventListener('click', (e) => {
      e.stopPropagation();

      // Get current URL which includes all active parameters
      const embedUrl = window.location.href;
      const embedCode = `<iframe src="${embedUrl}" width="100%" height="600" frameborder="0" allowfullscreen style="border: none; overflow: hidden; background: transparent;"></iframe>`;

      navigator.clipboard.writeText(embedCode).then(() => {
        Toast.show('Embed code copied to clipboard!', 'success');
      }).catch(err => {
        console.error('Failed to copy:', err);
        Toast.show('Failed to copy embed code: ' + err.message, 'error');
      });

      // Hide menu
      if (saveMenu) saveMenu.classList.add('hidden');
    });
  }

  // Close save menu when clicking outside
  document.addEventListener('click', function (event) {
    const btn = document.getElementById('save-button');
    const menu = document.getElementById('save-menu');

    if (btn && menu && !btn.contains(event.target) && !menu.contains(event.target)) {
      if (!menu.classList.contains('hidden')) {
        menu.classList.add('hidden');
        btn.setAttribute('aria-expanded', 'false');
      }
    }
  });

  // Setup style selector
  styleSelect.addEventListener('change', function () {
    handleStyleChange();
    updateUrlParameters();
  });

  // Setup color mode selector
  colorModeSelect.addEventListener('change', function () {
    handleColorModeChange();
    updateUrlParameters();
  });

  // Setup binary input with real-time updates
  binaryInput.addEventListener('input', function () {
    handleBinaryInput();
    updateUrlParameters();
    requestUpdate();
  });
  binaryInput.addEventListener('keyup', function () {
    handleBinaryInput();
    updateUrlParameters();
    requestUpdate();
  });
  binaryInput.addEventListener('paste', function () {
    handleBinaryInput();
    updateUrlParameters();
    requestUpdate();
  });
  if (!window.location.search) {
    binaryInput.value = "RPI"; // Set default value only if no URL params
  }

  // Setup morse input with real-time updates
  if (morseInput) {
    const handleMorseInput = function () {
      updateMorseData(morseInput.value);
      updateUrlParameters();
      requestUpdate();
    };
    morseInput.addEventListener('input', handleMorseInput);
    morseInput.addEventListener('keyup', handleMorseInput);
    morseInput.addEventListener('paste', handleMorseInput);
    if (!window.location.search) {
      morseInput.value = "RPI"; // Set default value
    }
  }

  if (morseAudioBtn) {
    morseAudioBtn.addEventListener('click', function (e) {
      e.preventDefault();
      togglePreviewAudio('morse');
    });
  }

  if (binaryAudioBtn) {
    binaryAudioBtn.addEventListener('click', function (e) {
      e.preventDefault();
      togglePreviewAudio('binary');
    });
  }

  if (staffAudioBtn) {
    staffAudioBtn.addEventListener('click', function (e) {
      e.preventDefault();
      togglePreviewAudio('staff');
    });
  }

  // Setup numeric input with real-time updates
  numericInput.addEventListener('input', function () {
    updateNumericData(numericInput.value);
    updateUrlParameters();
    requestUpdate();
  });
  numericInput.addEventListener('keyup', function () {
    updateNumericData(numericInput.value);
    updateUrlParameters();
    requestUpdate();
  });
  numericInput.addEventListener('paste', function () {
    setTimeout(() => {
      updateNumericData(numericInput.value);
      updateUrlParameters();
      requestUpdate();
    }, 10);
  });
  numericInput.addEventListener('blur', function () {
    // When user leaves the field, show the evaluated result
    const evaluated = evaluateFormula(numericInput.value);
    if (evaluated !== numericInput.value && !isNaN(parseFloat(evaluated))) {
      // Only update display if it's a valid number and different from input
      console.log('Formula evaluated:', numericInput.value, '->', evaluated);
    }
  });

  // Setup numeric mode selector
  numericModeSelect.addEventListener('change', function () {
    updateUrlParameters();
    requestUpdate();
  });

  if (circlesGradientVariantSlider) {
    circlesGradientVariantSlider.addEventListener('input', function () {
      updateCirclesGradientVariantDisplay();
      updateUrlParameters();
      requestUpdate();
    });
    updateCirclesGradientVariantDisplay();
  }

  if (gradientVariantSlider) {
    gradientVariantSlider.addEventListener('input', function () {
      updateGradientVariantDisplay();
      updateUrlParameters();
      requestUpdate();
    });
    updateGradientVariantDisplay();
  }

  if (gridVariantSlider) {
    gridVariantSlider.addEventListener('input', function () {
      updateGridVariantDisplay();
      updateUrlParameters();
      requestUpdate();
    });
    updateGridVariantDisplay();
  }

  if (linesVariantSlider) {
    linesVariantSlider.addEventListener('input', function () {
      updateLinesVariantDisplay();
      updateUrlParameters();
      requestUpdate();
    });
    updateLinesVariantDisplay();
  }

  if (pointConnectVariantSlider) {
    pointConnectVariantSlider.addEventListener('input', function () {
      updatePointConnectVariantDisplay();
      updateUrlParameters();
      requestUpdate();
    });
    updatePointConnectVariantDisplay();
  }

  if (neuralNetworkHiddenLayersSlider) {
    neuralNetworkHiddenLayersSlider.addEventListener('input', function () {
      updateNeuralNetworkHiddenLayersDisplay();
      updateUrlParameters();
      requestUpdate();
    });
    updateNeuralNetworkHiddenLayersDisplay();
  }

  if (triangleGridVariantSlider) {
    triangleGridVariantSlider.addEventListener('input', function () {
      updateTriangleGridVariantDisplay();
      updateUrlParameters();
      requestUpdate();
    });
    updateTriangleGridVariantDisplay();
  }

  if (trianglesVariantSlider) {
    trianglesVariantSlider.addEventListener('input', function () {
      updateTrianglesVariantDisplay();
      updateUrlParameters();
      requestUpdate();
    });
    updateTrianglesVariantDisplay();
  }

  // Setup truss sliders
  if (trussFamilySelect) {
    trussFamilySelect.addEventListener('change', function () {
      updateUrlParameters(); requestUpdate();
    });
  }
  if (trussSegmentsSlider) {
    trussSegmentsSlider.addEventListener('input', function () {
      if (trussSegmentsDisplay) trussSegmentsDisplay.textContent = this.value;
      updateUrlParameters(); requestUpdate();
    });
    if (trussSegmentsDisplay && trussSegmentsSlider) trussSegmentsDisplay.textContent = trussSegmentsSlider.value;
  }
  if (trussThicknessSlider) {
    trussThicknessSlider.addEventListener('input', function () {
      if (trussThicknessDisplay) trussThicknessDisplay.textContent = this.value;
      updateUrlParameters(); requestUpdate();
    });
    if (trussThicknessDisplay && trussThicknessSlider) trussThicknessDisplay.textContent = trussThicknessSlider.value;
  }

  // Setup staff controls
  if (staffTempoSlider) {
    staffTempoSlider.addEventListener('input', function () {
      if (staffTempoDisplay) staffTempoDisplay.textContent = this.value;
      updateUrlParameters(); requestUpdate();
    });
    if (staffTempoDisplay && staffTempoSlider) staffTempoDisplay.textContent = staffTempoSlider.value;
  }

  if (staffInstrumentSelect) {
    staffInstrumentSelect.addEventListener('change', function () {
      updateUrlParameters(); requestUpdate();
    });
  }

  if (staffNoteShapeSelect) {
    staffNoteShapeSelect.addEventListener('change', function () {
      updateUrlParameters(); requestUpdate();
    });
  }

  if (staffReverbToggle) {
    staffReverbToggle.addEventListener('change', function () {
      updateStaffEffects();
      updateUrlParameters();
    });
  }

  if (staffTremoloToggle) {
    staffTremoloToggle.addEventListener('change', function () {
      updateStaffEffects();
      updateUrlParameters();
    });
  }

  // Setup note duration buttons
  const durationBtns = document.querySelectorAll('#staff-duration-selector .duration-btn');
  durationBtns.forEach(btn => {
    btn.addEventListener('click', function (e) {
      e.preventDefault();
      durationBtns.forEach(b => b.classList.remove('active'));
      this.classList.add('active');
      currentNoteDuration = parseFloat(this.getAttribute('data-duration'));
    });
  });

  // Setup keyboard
  const pianoKeys = document.querySelectorAll('.piano-keyboard .key');
  pianoKeys.forEach(key => {
    key.addEventListener('mousedown', function (e) {
      e.preventDefault();
      this.classList.add('active');
      const noteName = this.getAttribute('data-note');
      const totalDuration = currentStaffNotes.reduce((sum, n) => sum + n.duration, 0);
      if (totalDuration + currentNoteDuration <= 16) {
        currentStaffNotes.push({ note: noteName, duration: currentNoteDuration });
        updateAudioControlsUI();
        updateUrlParameters();
        requestUpdate();
      } else {
        if (typeof Toast !== 'undefined') {
          Toast.show('Maximum of 4 measures reached.', 'warning');
        }
      }
    });
    key.addEventListener('mouseup', function () { this.classList.remove('active'); });
    key.addEventListener('mouseleave', function () { this.classList.remove('active'); });
  });

  if (staffClearBtn) {
    staffClearBtn.addEventListener('click', function (e) {
      e.preventDefault();
      currentStaffNotes = [];
      updateAudioControlsUI();
      updateUrlParameters();
      requestUpdate();
    });
  }

  // Setup pulse controls
  if (pulseInput) {
    pulseInput.addEventListener('input', function () { updateUrlParameters(); requestUpdate(); });
    pulseInput.addEventListener('keyup', function () { updateUrlParameters(); requestUpdate(); });
    if (!window.location.search) pulseInput.value = "RPI";
  }
  if (pulseIntensitySlider) {
    pulseIntensitySlider.addEventListener('input', function () {
      if (pulseIntensityDisplay) pulseIntensityDisplay.textContent = this.value;
      updateUrlParameters(); requestUpdate();
    });
    if (pulseIntensityDisplay && pulseIntensitySlider) pulseIntensityDisplay.textContent = pulseIntensitySlider.value;
  }

  // Setup graph controls
  if (graphInput) {
    graphInput.addEventListener('input', function () { updateUrlParameters(); requestUpdate(); });
    graphInput.addEventListener('keyup', function () { updateUrlParameters(); requestUpdate(); });
    if (!window.location.search) graphInput.value = "RPI";
  }
  const graphAdditionalInputs = [graphInput2, graphInput3, graphInput4, graphInput5].filter(Boolean);
  graphAdditionalInputs.forEach(input => {
    input.addEventListener('input', function () { updateUrlParameters(); requestUpdate(); });
    input.addEventListener('keyup', function () { updateUrlParameters(); requestUpdate(); });
  });
  if (graphMultiToggle) {
    graphMultiToggle.addEventListener('change', function () {
      if (graphMultiInputs) graphMultiInputs.style.display = this.checked ? 'block' : 'none';
      updateUrlParameters();
      requestUpdate();
    });
    if (graphMultiInputs) graphMultiInputs.style.display = graphMultiToggle.checked ? 'block' : 'none';
  }
  if (graphScaleSlider) {
    graphScaleSlider.addEventListener('input', function () {
      const value = Math.max(GRAPH_SCALE_MIN, parseInt(this.value, 10) || GRAPH_SCALE_DEFAULT);
      this.value = value;
      if (graphScaleDisplay) graphScaleDisplay.textContent = value;
      updateUrlParameters(); requestUpdate();
    });
    if (graphScaleSlider) {
      graphScaleSlider.value = Math.max(GRAPH_SCALE_MIN, parseInt(graphScaleSlider.value, 10) || GRAPH_SCALE_DEFAULT);
    }
    if (graphScaleDisplay && graphScaleSlider) graphScaleDisplay.textContent = graphScaleSlider.value;
  }

  // Apply URL parameters if present, otherwise use defaults
  applyUrlParameters();

  // If no URL parameters were present, set defaults
  if (!window.location.search) {
    styleSelect.value = "solid";
    currentShader = 0;
    applyColorMode(DEFAULT_COLOR_MODE);
  }

  // Initialize Web Audio API
  initializeAudio();

  // Initialize custom dropdowns
  setupCustomDropdowns();
  updateHeaderBrandPreview(true);

  // Initialize the hidden retro rink experience.
  setupEasterEggExperience();

  // Add global keyboard event listener for more reliable shift detection
  document.addEventListener('keydown', function (event) {
    if (handleEasterEggGameKeydown(event)) {
      return;
    }

    // Only handle keyboard events on non-mobile devices
    if ('ontouchstart' in window || navigator.maxTouchPoints > 0) {
      return; // Skip keyboard shortcuts on mobile
    }

    if (handleEasterEggShortcut(event)) {
      return;
    }

    const targetTag = event.target && event.target.tagName ? event.target.tagName : '';
    const isTypingContext = (
      event.target &&
      (
        event.target.isContentEditable ||
        targetTag === 'INPUT' ||
        targetTag === 'TEXTAREA' ||
        targetTag === 'SELECT' ||
        targetTag === 'BUTTON'
      )
    );

    if (isTypingContext) {
      return;
    }

    // Handle spacebar for motion and audio preview shortcuts.
    if (event.code === 'Space' && !event.shiftKey) {
      // Morse and music use spacebar for audio transport.
      if (currentShader === 7 || currentShader === 10) {
        event.preventDefault();
        if (isAudioPlaying) {
          stopAudio();
        } else {
          startAudio();
        }
        return;
      }

      // Ticker and waveform use spacebar to pause or resume motion.
      if (isAnimated) {
        event.preventDefault();
        togglePlayback();
      }
      return;
    }

    if (event.code === 'Space' && event.shiftKey) {
      event.preventDefault();

      // Cycle through all seven modes: solid -> ruler -> ticker -> binary -> waveform -> circles -> numeric -> solid
      // Get current style from dropdown to ensure sync
      const currentStyle = styleSelect ? styleSelect.value : 'solid';
      const styleValues = ['solid', 'ruler', 'ticker', 'binary', 'waveform', 'circles', 'numeric'];
      const currentIndex = styleValues.indexOf(currentStyle);
      const nextIndex = (currentIndex + 1) % 7;
      const nextStyle = styleValues[nextIndex];

      // Safely update the dropdown if it exists
      if (styleSelect) {
        styleSelect.value = nextStyle;
        // Dispatch change event to update UI elements and trigger handleStyleChange
        styleSelect.dispatchEvent(new Event('change'));
      }

      console.log('Keyboard toggle - style:', nextStyle);
    }

    // Handle color mode shortcuts: Shift + Up/Down arrows
    if (event.shiftKey && (event.code === 'ArrowUp' || event.code === 'ArrowDown')) {
      event.preventDefault();

      const colorModes = AVAILABLE_COLOR_MODES;
      const currentIndex = colorModes.indexOf(currentColorMode);

      let nextIndex;
      if (event.code === 'ArrowUp') {
        nextIndex = (currentIndex - 1 + colorModes.length) % colorModes.length;
      } else {
        nextIndex = (currentIndex + 1) % colorModes.length;
      }

      const nextColorMode = colorModes[nextIndex];

      // Update dropdown and trigger change event for UI sync
      if (colorModeSelect) {
        colorModeSelect.value = nextColorMode;
        colorModeSelect.dispatchEvent(new Event('change'));
      }

      console.log('Keyboard toggle - color mode:', nextColorMode);
    }
  });

  document.addEventListener('keyup', function (event) {
    handleEasterEggGameKeyup(event);
  });

  document.addEventListener('visibilitychange', function () {
    if (document.hidden && isAudioPlaying) {
      stopAudio();
    }

    if (document.hidden) {
      releaseEasterEggControls();
    }
  });

  window.addEventListener('blur', function () {
    if (isAudioPlaying) {
      stopAudio();
    }

    releaseEasterEggControls();
  });
}

function handleBinaryInput() {
  const text = binaryInput.value || "RPI";
  updateBinaryData(text);
}

function updateBinaryData(text) {
  // Use profanity filter if available
  let cleanText = text;
  if (window.ProfanityFilter && typeof window.ProfanityFilter.sanitizeText === 'function') {
    cleanText = window.ProfanityFilter.sanitizeText(text);
    if (cleanText !== text) {
      console.log('Profanity filtered from binary input');
      // Update input field if it matches current text to show user the filtered version
      if (binaryInput && binaryInput.value === text) {
        binaryInput.value = cleanText;
      }
    }
  }

  binaryData = {
    text: cleanText,
    binary: textToBinary(cleanText)
  };
  binaryLength = binaryData.binary.length;
}

function updateMorseData(text) {
  let cleanText = text || "RPI";
  if (window.ProfanityFilter && typeof window.ProfanityFilter.sanitizeText === 'function') {
    cleanText = window.ProfanityFilter.sanitizeText(cleanText);
    if (cleanText !== text) {
      console.log('Profanity filtered from morse input');
      if (morseInput && morseInput.value === text) {
        morseInput.value = cleanText;
      }
    }
  }

  morseData = {
    text: cleanText,
    morse: textToMorse(cleanText)
  };
  morseLength = morseData.morse.length;
}

function updateNumericData(numericString) {
  numericData = parseNumericString(numericString);
  numericLength = numericData.length;

  // Create texture for shader
  if (numericTexture) {
    numericTexture.remove();
  }
  numericTexture = createNumericTexture(numericData);
}



function updateRulerRepeatsDisplay() {
  // Display the current ruler repeats slider value
  const sliderValue = parseInt(rulerRepeatsSlider.value);
  rulerRepeatsDisplay.textContent = sliderValue;
}

function updateRulerUnitsDisplay() {
  // Display the current ruler units slider value
  const sliderValue = parseInt(rulerUnitsSlider.value);
  rulerUnitsDisplay.textContent = sliderValue;
}

function updateTickerDisplay() {
  // Display the current ticker slider value
  const sliderValue = parseInt(tickerSlider.value);
  tickerDisplay.textContent = sliderValue;
}

function updateTickerRatioDisplay() {
  // Display the current ticker ratio slider value as ratio
  const sliderValue = parseInt(tickerRatioSlider.value);
  tickerRatioDisplay.textContent = sliderValue + ':1';
}

function updateTickerWidthRatioDisplay() {
  setTickerWidthRatioDisplayValue(tickerWidthRatioSlider, tickerWidthRatioDisplay);
}

function updateCirclesGradientVariantDisplay() {
  if (!circlesGradientVariantSlider || !circlesGradientVariantDisplay) return;
  circlesGradientVariantDisplay.textContent = circlesGradientVariantSlider.value;
}

function updateGradientVariantDisplay() {
  if (!gradientVariantSlider || !gradientVariantDisplay) return;
  gradientVariantDisplay.textContent = gradientVariantSlider.value;
}

function updateGridVariantDisplay() {
  if (!gridVariantSlider || !gridVariantDisplay) return;
  gridVariantDisplay.textContent = gridVariantSlider.value;
}

function updateLinesVariantDisplay() {
  if (!linesVariantSlider || !linesVariantDisplay) return;
  linesVariantDisplay.textContent = parseInt(linesVariantSlider.value, 10) === 1 ? 'LG' : 'MD';
}

function updatePointConnectVariantDisplay() {
  if (!pointConnectVariantSlider || !pointConnectVariantDisplay) return;
  pointConnectVariantDisplay.textContent = pointConnectVariantSlider.value;
}

function updateNeuralNetworkHiddenLayersDisplay() {
  if (!neuralNetworkHiddenLayersSlider || !neuralNetworkHiddenLayersDisplay) return;
  neuralNetworkHiddenLayersDisplay.textContent = neuralNetworkHiddenLayersSlider.value;
}

function updateTriangleGridVariantDisplay() {
  if (!triangleGridVariantSlider || !triangleGridVariantDisplay) return;
  triangleGridVariantDisplay.textContent = triangleGridVariantSlider.value;
}

function updateTrianglesVariantDisplay() {
  if (!trianglesVariantSlider || !trianglesVariantDisplay) return;
  trianglesVariantDisplay.textContent = trianglesVariantSlider.value;
}

function updateWaveformTypeDisplay() {
  const sliderValue = parseFloat(waveformTypeSlider.value);
  let displayText = '';

  if (sliderValue < 0.5) {
    displayText = 'SINE';
  } else if (sliderValue < 1.5) {
    displayText = 'SAWTOOTH';
  } else if (sliderValue < 2.5) {
    displayText = 'SQUARE';
  } else {
    displayText = 'PULSE';
  }

  waveformTypeDisplay.textContent = displayText;
}

function updateWaveformFrequencyDisplay() {
  const sliderValue = parseInt(waveformFrequencySlider.value);
  waveformFrequencyDisplay.textContent = sliderValue;
}

function updateWaveformSpeedDisplay() {
  const sliderValue = parseFloat(waveformSpeedSlider.value);
  waveformSpeedDisplay.textContent = sliderValue.toFixed(1);
}

function updateCirclesDensityDisplay() {
  const sliderValue = parseInt(circlesDensitySlider.value);
  circlesDensityDisplay.textContent = sliderValue;
  // Invalidate cache when density changes
  staticCircleData = null;
}

function updateCirclesSizeVariationDisplay() {
  const sliderValue = parseInt(circlesSizeVariationSlider.value);
  circlesSizeVariationDisplay.textContent = sliderValue;
  // Invalidate cache when size variation changes
  staticCircleData = null;
}

function updateCirclesOverlapDisplay() {
  const sliderValue = parseInt(circlesOverlapSlider.value);
  circlesOverlapDisplay.textContent = sliderValue;
  // Invalidate cache when overlap changes
  staticCircleData = null;
}

function handleCirclesModeChange() {
  const selectedMode = circlesModeSelect.value;

  if (selectedMode === 'grid') {
    circlesPackingControls.style.display = 'none';
    circlesGridControls.style.display = 'block';
  } else {
    circlesPackingControls.style.display = 'block';
    circlesGridControls.style.display = 'none';
  }

  // Invalidate cache when mode changes
  staticCircleData = null;
  redraw();
}

function updateCirclesRowsDisplay() {
  const sliderValue = parseInt(circlesRowsSlider.value);
  circlesRowsDisplay.textContent = sliderValue;
  // Invalidate cache when rows change
  staticCircleData = null;
}

function updateCirclesGridDensityDisplay() {
  const sliderValue = parseInt(circlesGridDensitySlider.value);
  circlesGridDensityDisplay.textContent = sliderValue;
  // Invalidate cache when grid density changes
  staticCircleData = null;
}

function updateCirclesSizeVariationYDisplay() {
  const sliderValue = parseInt(circlesSizeVariationYSlider.value);
  circlesSizeVariationYDisplay.textContent = sliderValue;
  // Invalidate cache when Y variation changes
  staticCircleData = null;
}

function updateCirclesSizeVariationXDisplay() {
  const sliderValue = parseInt(circlesSizeVariationXSlider.value);
  circlesSizeVariationXDisplay.textContent = sliderValue;
  // Invalidate cache when X variation changes
  staticCircleData = null;
}

function updateCirclesGridOverlapDisplay() {
  const sliderValue = parseInt(circlesGridOverlapSlider.value);
  circlesGridOverlapDisplay.textContent = sliderValue;
  // Invalidate cache when grid overlap changes
  staticCircleData = null;
}

function toggleMobileMenu() {
  const isMobile = window.innerWidth <= 768;

  if (isMobile) {
    const isActive = appSidebar.classList.contains('active');
    if (!isActive) {
      // Opening sidebar on mobile
      lastFocusedElement = document.activeElement;
      appSidebar.classList.add('active');
      if (mobileMenuToggle) mobileMenuToggle.setAttribute('aria-expanded', 'true');

      setTimeout(() => {
        const firstFocusable = appSidebar.querySelector('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
        if (firstFocusable) firstFocusable.focus();
      }, 100);
    } else {
      // Closing sidebar on mobile
      appSidebar.classList.remove('active');

      if (lastFocusedElement && document.body.contains(lastFocusedElement)) {
        lastFocusedElement.focus();
      } else if (mobileMenuToggle) {
        mobileMenuToggle.focus();
      }
    }
  } else {
    // Desktop behavior (collapsible)
    appSidebar.classList.toggle('sidebar-collapsed');

    // Resize the canvas gracefully to fill the newfound space
    setTimeout(() => {
      windowResized();
    }, 450); // Slightly longer than transition to ensure layout is done
  }

  syncSidebarToggleState();
}

function handleClickOutside(event) {
  // Only apply on mobile where sidebar overlays content
  if (window.innerWidth > 768) return;
  if (isEasterEggActive()) return;

  // Prevent duplicate events on mobile
  if (event.type === 'touchend' && event.cancelable) {
    event.preventDefault();
  }

  // Don't close if clicking on the toggle button or inside the sidebar
  if (mobileMenuToggle && mobileMenuToggle.contains(event.target) ||
    appSidebar && appSidebar.contains(event.target)) {
    return;
  }

  // Close the sidebar if it's open
  if (appSidebar && appSidebar.classList.contains('active')) {
    toggleMobileMenu();
  }
}

function toggleSaveMenu(e) {
  if (e) e.stopPropagation();

  if (saveMenu) {
    updateLoopingGifSaveOption();
    saveMenu.classList.toggle('hidden');
    const isExpanded = !saveMenu.classList.contains('hidden');
    if (saveButton) saveButton.setAttribute('aria-expanded', isExpanded);
  }
}

function updateLoopingGifSaveOption() {
  if (!saveLoopGifButton) return;

  const selectedStyle = normalizeStyleValue(styleSelect ? styleSelect.value : 'solid');
  const canExportLoopGif = Boolean(
    typeof GIF !== 'undefined' &&
    window.loopingGifUtils &&
    typeof window.loopingGifUtils.isLoopingGifEligibleStyle === 'function' &&
    window.loopingGifUtils.isLoopingGifEligibleStyle(selectedStyle)
  );

  saveLoopGifButton.hidden = !canExportLoopGif;
}

function syncSidebarToggleState() {
  if (!mobileMenuToggle || !appSidebar) return;

  const isMobile = window.innerWidth <= 768;
  const isExpanded = isMobile
    ? appSidebar.classList.contains('active')
    : !appSidebar.classList.contains('sidebar-collapsed');

  mobileMenuToggle.setAttribute('aria-expanded', isExpanded ? 'true' : 'false');
  mobileMenuToggle.setAttribute('aria-label', isExpanded ? 'Close design controls' : 'Open design controls');
}

function handleStyleChange() {
  // Get the selected style from dropdown
  const selectedStyle = normalizeStyleValue(styleSelect ? styleSelect.value : 'solid');
  if (styleSelect && styleSelect.value !== selectedStyle) {
    styleSelect.value = selectedStyle;
  }

  // Set currentShader based on selected style
  switch (selectedStyle) {
    case 'solid':
      currentShader = 0;
      break;
    case 'ruler':
      currentShader = 1;
      break;
    case 'ticker':
      currentShader = 2;
      break;
    case 'binary':
      currentShader = 3;
      break;
    case 'waveform':
      currentShader = 4;
      break;
    case 'circles':
      currentShader = 5;
      break;
    case 'numeric':
      currentShader = 6;
      break;
    case 'morse':
      currentShader = 7;
      break;
    case 'circles-gradient':
      currentShader = 16;
      break;
    case 'gradient':
      currentShader = 17;
      break;
    case 'grid':
      currentShader = 18;
      break;
    case 'lines':
      currentShader = 13;
      break;
    case 'point-connect':
      currentShader = 14;
      break;
    case 'neural-network':
      currentShader = 23;
      break;
    case 'triangle-grid':
      currentShader = 15;
      break;
    case 'triangles':
      currentShader = 19;
      break;
    case 'fibonacci-sequence':
      currentShader = 20;
      break;
    case 'union':
      currentShader = 21;
      break;
    case 'wave-quantum':
      currentShader = 22;
      break;
    case 'runway':
      currentShader = 8;
      break;
    case 'truss':
      currentShader = 9;
      break;
    case 'music':
      currentShader = 10;
      break;
    case 'graph':
      currentShader = 12;
      break;
    default:
      currentShader = 0;
      break;
  }

  // Safely update UI elements only if they exist
  if (binaryGroup && rulerGroup && tickerGroup && waveformGroup && circlesGroup && numericGroup && morseGroup) {
    // Hide all groups first
    binaryGroup.style.display = 'none';
    rulerGroup.style.display = 'none';
    tickerGroup.style.display = 'none';
    waveformGroup.style.display = 'none';
    circlesGroup.style.display = 'none';
    numericGroup.style.display = 'none';
    morseGroup.style.display = 'none';
    if (circlesGradientGroup) circlesGradientGroup.style.display = 'none';
    if (gradientGroup) gradientGroup.style.display = 'none';
    if (gridGroup) gridGroup.style.display = 'none';
    if (linesGroup) linesGroup.style.display = 'none';
    if (pointConnectGroup) pointConnectGroup.style.display = 'none';
    if (neuralNetworkGroup) neuralNetworkGroup.style.display = 'none';
    if (triangleGridGroup) triangleGridGroup.style.display = 'none';
    if (trianglesGroup) trianglesGroup.style.display = 'none';
    if (trussGroup) trussGroup.style.display = 'none';
    if (staffGroup) staffGroup.style.display = 'none';
    if (pulseGroup) pulseGroup.style.display = 'none';
    if (graphGroup) graphGroup.style.display = 'none';

    // Show the appropriate group
    // Show the appropriate group and handle playback controls
    isAnimated = false;

    switch (selectedStyle) {
      case 'ruler':
        rulerGroup.style.display = 'block';
        break;
      case 'ticker':
        tickerGroup.style.display = 'block';
        isAnimated = true;
        break;
      case 'binary':
        binaryGroup.style.display = 'block';
        break;
      case 'waveform':
        waveformGroup.style.display = 'block';
        isAnimated = true;
        break;
      case 'circles':
        circlesGroup.style.display = 'block';
        break;
      case 'numeric':
        numericGroup.style.display = 'block';
        break;
      case 'morse':
        morseGroup.style.display = 'block';
        break;
      case 'circles-gradient':
        if (circlesGradientGroup) circlesGradientGroup.style.display = 'block';
        break;
      case 'gradient':
        if (gradientGroup) gradientGroup.style.display = 'block';
        break;
      case 'grid':
        if (gridGroup) gridGroup.style.display = 'block';
        break;
      case 'lines':
        if (linesGroup) linesGroup.style.display = 'block';
        break;
      case 'point-connect':
        if (pointConnectGroup) pointConnectGroup.style.display = 'block';
        break;
      case 'neural-network':
        if (neuralNetworkGroup) neuralNetworkGroup.style.display = 'block';
        break;
      case 'triangle-grid':
        if (triangleGridGroup) triangleGridGroup.style.display = 'block';
        break;
      case 'triangles':
        if (trianglesGroup) trianglesGroup.style.display = 'block';
        break;
      case 'truss':
        if (trussGroup) trussGroup.style.display = 'block';
        break;
      case 'music':
        if (staffGroup) staffGroup.style.display = 'block';
        break;
      case 'graph':
        if (graphGroup) graphGroup.style.display = 'block';
        break;
    }

    // Motion pause/resume is only exposed on ticker and waveform.
    // Other styles should keep the render loop active so their previews remain responsive.
    if (!isAnimated && !isPlaying) {
      togglePlayback();
    } else {
      syncMotionToggleState();
    }

    stopAudio();
  }

  console.log('Style changed to:', selectedStyle, 'currentShader:', currentShader);
  updateLoopingGifSaveOption();
  updateSidebarScrollFadeState();
  updateAudioControlsUI();
  requestUpdate();
}

function handleColorModeChange() {
  const selectedColorMode = colorModeSelect ? colorModeSelect.value : DEFAULT_COLOR_MODE;
  applyColorMode(selectedColorMode);
}

function applyColorMode(colorMode) {
  currentColorMode = normalizeColorModeValue(colorMode);

  // Remove all theme classes first
  document.body.classList.remove(...new Set(Object.values(themeClassByColorMode)));

  // Add appropriate theme class
  const themeClass = themeClassByColorMode[currentColorMode] || themeClassByColorMode[DEFAULT_COLOR_MODE];
  if (themeClass) {
    document.body.classList.add(themeClass);
  }

  if (colorModeSelect) {
    const customSelectWrapper = colorModeSelect.parentElement;
    syncCustomSelectUI(colorModeSelect, customSelectWrapper, currentColorMode, currentColorMode);
  }

  console.log('Color mode applied:', currentColorMode);
  requestUpdate();
}

function buildHeaderPreviewSVG() {
  const currentWidth = 250;
  const logoHeight = 149.411;
  const fgColor = 'currentColor';
  const barY = 132.911;
  const barHeight = 18;
  const exactBarWidth = 250;
  const barStartX = 0;
  const timeSeconds = typeof window.animationTime !== 'undefined'
    ? window.animationTime
    : (typeof millis === 'function' ? millis() / 1000.0 : 0);

  let svgContent = `
<svg viewBox="0 0 ${currentWidth} ${logoHeight}" xmlns="http://www.w3.org/2000/svg" role="presentation" focusable="false" aria-hidden="true">
  <path d="${paths.r}" fill="${fgColor}"/>
  <path d="${paths.p}" fill="${fgColor}"/>
  <path d="${paths.i}" fill="${fgColor}"/>`;

  if (currentShader === 0) {
    const cornerSize = 1.5;
    const pathData = `M ${barStartX + cornerSize} ${barY} L ${barStartX + exactBarWidth - cornerSize} ${barY} L ${barStartX + exactBarWidth} ${barY + cornerSize} L ${barStartX + exactBarWidth} ${barY + barHeight - cornerSize} L ${barStartX + exactBarWidth - cornerSize} ${barY + barHeight} L ${barStartX + cornerSize} ${barY + barHeight} L ${barStartX} ${barY + barHeight - cornerSize} L ${barStartX} ${barY + cornerSize} Z`;
    svgContent += `\n  <path d="${pathData}" fill="${fgColor}"/>`;
  } else if (typeof createBarPatternSVG === 'function') {
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
        rulerRepeats: rulerRepeatsSlider ? rulerRepeatsSlider.value : 10,
        rulerUnits: rulerUnitsSlider ? rulerUnitsSlider.value : 4,
        tickerRepeats: tickerSlider ? tickerSlider.value : 34,
        tickerRatio: tickerRatioSlider ? tickerRatioSlider.value : 2,
        tickerWidthRatio: tickerWidthRatioSlider ? tickerWidthRatioSlider.value : 2,
        binaryText: binaryInput ? (binaryInput.value || 'RPI') : 'RPI',
        waveformType: waveformTypeSlider ? waveformTypeSlider.value : 0,
        waveformFrequency: waveformFrequencySlider ? waveformFrequencySlider.value : 24,
        waveformSpeed: waveformSpeedSlider ? waveformSpeedSlider.value : 0.7,
        waveformEnvelope: waveformEnvelopeToggle ? waveformEnvelopeToggle.checked : false,
        waveformEnvelopeType: waveformEnvelopeType ? waveformEnvelopeType.value : 'sine',
        waveformEnvelopeWaves: waveformEnvelopeWavesSlider
          ? (typeof normalizeWaveformEnvelopeWaves === 'function'
            ? normalizeWaveformEnvelopeWaves(waveformEnvelopeWavesSlider.value)
            : Math.max(1, Math.min(10, Math.round(parseFloat(waveformEnvelopeWavesSlider.value)) || 1)))
          : 1,
        waveformEnvelopeCenter: waveformEnvelopeCenterSlider ? waveformEnvelopeCenterSlider.value : 0,
        waveformEnvelopeBipolar: waveformEnvelopeBipolarToggle ? waveformEnvelopeBipolarToggle.checked : false,
        timeSeconds,
        circlesMode: circlesModeSelect ? circlesModeSelect.value : 'packing',
        circlesFill: circlesFillSelect ? circlesFillSelect.value : 'stroke',
        circlesDensity: circlesDensitySlider ? circlesDensitySlider.value : 50,
        circlesSizeVariation: circlesSizeVariationSlider ? circlesSizeVariationSlider.value : 0,
        circlesOverlap: circlesOverlapSlider ? circlesOverlapSlider.value : 0,
        circlesRows: circlesRowsSlider ? circlesRowsSlider.value : 2,
        circlesGridDensity: circlesGridDensitySlider ? circlesGridDensitySlider.value : 100,
        circlesSizeVariationY: circlesSizeVariationYSlider ? circlesSizeVariationYSlider.value : 0,
        circlesSizeVariationX: circlesSizeVariationXSlider ? circlesSizeVariationXSlider.value : 0,
        circlesGridOverlap: circlesGridOverlapSlider ? circlesGridOverlapSlider.value : 0,
        circlesLayout: circlesLayoutSelect ? circlesLayoutSelect.value : 'straight',
        numericValue: numericInput ? numericInput.value : '',
        numericMode: numericModeSelect ? numericModeSelect.value : 'dotmatrix',
        circlesGradientVariant: circlesGradientVariantSlider ? circlesGradientVariantSlider.value : 1,
        gradientVariant: gradientVariantSlider ? gradientVariantSlider.value : 1,
        gridVariant: gridVariantSlider ? gridVariantSlider.value : 1,
        linesVariant: linesVariantSlider ? linesVariantSlider.value : 2,
        pointConnectVariant: pointConnectVariantSlider ? pointConnectVariantSlider.value : 1,
        neuralNetworkHiddenLayers: neuralNetworkHiddenLayersSlider ? neuralNetworkHiddenLayersSlider.value : 1,
        triangleGridVariant: triangleGridVariantSlider ? triangleGridVariantSlider.value : 2,
        trianglesVariant: trianglesVariantSlider ? trianglesVariantSlider.value : 1,
        morseText: morseInput ? morseInput.value : 'RPI',
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
  return svgContent.trim();
}

function updateHeaderBrandPreview(force = false) {
  if (!headerLogoPreview) return;

  const markup = buildHeaderPreviewSVG();
  if (!force && markup === lastHeaderPreviewMarkup) return;

  headerLogoPreview.innerHTML = markup;
  lastHeaderPreviewMarkup = markup;
  lastHeaderPreviewUpdateTime = typeof millis === 'function' ? millis() : Date.now();
}

function requestUpdate() {
  updateHeaderBrandPreview();

  if (!isPlaying) {
    redraw();
  }
}

function getEasterEggHelpers() {
  return window.RPIRinkRush || {};
}

function formatEasterEggScore(value, digits = 3) {
  const helpers = getEasterEggHelpers();
  if (typeof helpers.formatArcadeScore === 'function') {
    return helpers.formatArcadeScore(value, digits);
  }
  return String(Math.max(0, Math.round(value || 0))).padStart(digits, '0');
}

function getEasterEggDifficulty(score) {
  const helpers = getEasterEggHelpers();
  if (typeof helpers.computeDifficulty === 'function') {
    return helpers.computeDifficulty(score);
  }
  return { speed: 560, spawnEvery: 1.1, spawnJitter: 0.35, pickupEvery: 2.2, bulletDrain: 24 };
}

function getEasterEggRank(score, combo) {
  const helpers = getEasterEggHelpers();
  if (typeof helpers.scoreToRank === 'function') {
    return helpers.scoreToRank(score, combo);
  }
  return combo >= 10 ? 'PUCKMAN LEGEND' : 'FRESH ICE';
}

function getEasterEggScoreboardExtension(score) {
  const helpers = getEasterEggHelpers();
  if (typeof helpers.getScoreboardExtension === 'function') {
    return helpers.getScoreboardExtension(score);
  }
  return score > 999 ? 1 : 0;
}

function loadEasterEggProfile() {
  const helpers = getEasterEggHelpers();
  const defaults = helpers.DEFAULT_PROFILE || {
    highScore: 0,
    bestCombo: 0,
    runs: 0,
    totalPickups: 0
  };
  const key = helpers.STORAGE_KEY || 'rpi-rink-rush-profile';

  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return { ...defaults };
    const parsed = JSON.parse(raw);
    return {
      highScore: Math.max(0, parseInt(parsed.highScore, 10) || 0),
      bestCombo: Math.max(0, parseInt(parsed.bestCombo, 10) || 0),
      runs: Math.max(0, parseInt(parsed.runs, 10) || 0),
      totalPickups: Math.max(0, parseInt(parsed.totalPickups, 10) || 0)
    };
  } catch (error) {
    return { ...defaults };
  }
}

function saveEasterEggProfile() {
  const helpers = getEasterEggHelpers();
  const key = helpers.STORAGE_KEY || 'rpi-rink-rush-profile';

  try {
    window.localStorage.setItem(key, JSON.stringify(easterEggProfile));
  } catch (error) {
    // Ignore local storage failures.
  }
}

function createEasterEggRunState() {
  return {
    active: false,
    phase: 'idle',
    lastTime: 0,
    score: 0,
    displayScore: 0,
    combo: 0,
    bestCombo: 0,
    meter: 66,
    slowBlend: 0,
    message: '',
    spawnTimer: 0.8,
    pickupTimer: 1.3,
    worldTime: 0,
    player: {
      lift: 0,
      velocity: 0,
      jumpBuffer: 0,
      duckBlend: 0
    },
    controls: {
      duck: false,
      bullet: false
    },
    obstacles: [],
    pickups: [],
    particles: []
  };
}

function resetEasterEggRun() {
  easterEggRunState = createEasterEggRunState();
  easterEggRunState.active = true;
  easterEggRunState.phase = 'boot';
  easterEggRunState.message = 'READY';
}

function getEasterEggPlayerBox() {
  const floorY = 15.5;
  const standHeight = 11;
  const duckHeight = 7;
  const width = 10;
  const x = 22;
  const height = standHeight + (duckHeight - standHeight) * easterEggRunState.player.duckBlend;
  return {
    x,
    y: floorY - easterEggRunState.player.lift - height,
    width,
    height
  };
}

function spawnEasterEggObstacle() {
  const roll = Math.random();
  let type = 'puck';

  if (roll > 0.82) {
    type = 'beam';
  } else if (roll > 0.56) {
    type = 'post';
  }

  if (easterEggRunState.score > 420 && roll > 0.9) {
    type = 'double';
  }

  let obstacle;
  if (type === 'beam') {
    obstacle = { type, x: 256, y: 2, width: 14, height: 3, speed: 0, closest: 999, passed: false };
  } else if (type === 'post') {
    obstacle = { type, x: 256, y: 4, width: 6, height: 11, speed: 0, closest: 999, passed: false };
  } else if (type === 'double') {
    obstacle = { type, x: 256, y: 0, width: 11, height: 15, speed: 0, closest: 999, passed: false, boxes: [{ x: 0, y: 0, width: 11, height: 4 }, { x: 0, y: 10, width: 11, height: 5 }] };
  } else {
    obstacle = { type, x: 256, y: 11, width: 7, height: 4, speed: 0, closest: 999, passed: false };
  }

  easterEggRunState.obstacles.push(obstacle);
}

function spawnEasterEggPickup() {
  easterEggRunState.pickups.push({
    x: 256,
    y: Math.random() > 0.55 ? 5 : 9,
    width: 4,
    height: 4,
    drift: Math.random() * Math.PI * 2
  });
}

function addEasterEggParticles(x, y, color, count = 6) {
  for (let index = 0; index < count; index += 1) {
    easterEggRunState.particles.push({
      x,
      y,
      vx: (Math.random() - 0.5) * 28,
      vy: -Math.random() * 28,
      life: 0.2 + Math.random() * 0.25,
      size: 1 + Math.random() * 1.8,
      color
    });
  }
}

function boxesOverlap(boxA, boxB) {
  return boxA.x < boxB.x + boxB.width &&
    boxA.x + boxA.width > boxB.x &&
    boxA.y < boxB.y + boxB.height &&
    boxA.y + boxA.height > boxB.y;
}

function updateEasterEggRun() {
  if (!easterEggRunState || !easterEggRunState.active) return;

  const now = millis() / 1000;
  if (!easterEggRunState.lastTime) {
    easterEggRunState.lastTime = now;
    return;
  }

  const delta = Math.min(0.033, Math.max(0.001, now - easterEggRunState.lastTime));
  easterEggRunState.lastTime = now;

  if (easterEggRunState.phase === 'boot') {
    easterEggRunState.worldTime += delta;
    if (easterEggRunState.worldTime > 0.9) {
      easterEggRunState.phase = 'running';
      easterEggRunState.worldTime = 0;
      easterEggRunState.message = 'GO';
    }
    return;
  }

  if (easterEggRunState.phase === 'gameover') {
    easterEggRunState.displayScore += (easterEggRunState.score - easterEggRunState.displayScore) * 0.15;
    easterEggRunState.slowBlend += (0 - easterEggRunState.slowBlend) * 0.15;
    easterEggRunState.particles = easterEggRunState.particles.filter((particle) => {
      particle.life -= delta;
      particle.x += particle.vx * delta * 0.4;
      particle.y += particle.vy * delta * 0.4;
      particle.vy += 24 * delta;
      return particle.life > 0;
    });
    return;
  }

  const difficulty = getEasterEggDifficulty(easterEggRunState.score);
  const wantsBullet = easterEggRunState.controls.bullet && easterEggRunState.meter > 0;
  const worldFactor = wantsBullet ? 0.42 : 1;
  const playerFactor = wantsBullet ? 0.82 : 1;
  const speed = difficulty.speed / 10.5;

  easterEggRunState.slowBlend += ((wantsBullet ? 1 : 0) - easterEggRunState.slowBlend) * 0.14;
  easterEggRunState.score += delta * 18 * (1 + easterEggRunState.combo * 0.05);
  easterEggRunState.displayScore += (easterEggRunState.score - easterEggRunState.displayScore) * 0.22;
  easterEggRunState.player.jumpBuffer = Math.max(0, easterEggRunState.player.jumpBuffer - delta);
  easterEggRunState.player.duckBlend += ((easterEggRunState.controls.duck ? 1 : 0) - easterEggRunState.player.duckBlend) * 0.25;

  if (wantsBullet) {
    easterEggRunState.meter = Math.max(0, easterEggRunState.meter - difficulty.bulletDrain * delta);
  }

  if (easterEggRunState.player.lift <= 0.001 && easterEggRunState.player.jumpBuffer > 0) {
    easterEggRunState.player.velocity = 48;
    easterEggRunState.player.jumpBuffer = 0;
    addEasterEggParticles(24, 15.5, '#ffffff', 5);
  }

  easterEggRunState.player.velocity -= 120 * delta * playerFactor;
  easterEggRunState.player.lift += easterEggRunState.player.velocity * delta * playerFactor;
  if (easterEggRunState.player.lift <= 0) {
    easterEggRunState.player.lift = 0;
    easterEggRunState.player.velocity = 0;
  }

  easterEggRunState.spawnTimer -= delta * worldFactor;
  easterEggRunState.pickupTimer -= delta * (wantsBullet ? 0.72 : 1);

  if (easterEggRunState.spawnTimer <= 0) {
    spawnEasterEggObstacle();
    easterEggRunState.spawnTimer = difficulty.spawnEvery + Math.random() * difficulty.spawnJitter;
  }

  if (easterEggRunState.pickupTimer <= 0) {
    spawnEasterEggPickup();
    easterEggRunState.pickupTimer = difficulty.pickupEvery * 0.55;
  }

  const playerBox = getEasterEggPlayerBox();

  easterEggRunState.obstacles = easterEggRunState.obstacles.filter((obstacle) => {
    obstacle.x -= speed * delta * worldFactor;
    const boxes = obstacle.boxes
      ? obstacle.boxes.map((box) => ({ x: obstacle.x + box.x, y: obstacle.y + box.y, width: box.width, height: box.height }))
      : [{ x: obstacle.x, y: obstacle.y, width: obstacle.width, height: obstacle.height }];

    boxes.forEach((box) => {
      const dx = Math.abs((box.x + box.width * 0.5) - (playerBox.x + playerBox.width * 0.5));
      const dy = Math.abs((box.y + box.height * 0.5) - (playerBox.y + playerBox.height * 0.5));
      obstacle.closest = Math.min(obstacle.closest, dx + dy);
    });

    if (boxes.some((box) => boxesOverlap(playerBox, box))) {
      easterEggRunState.phase = 'gameover';
      easterEggRunState.message = 'RESET';
      easterEggProfile.highScore = Math.max(easterEggProfile.highScore, Math.floor(easterEggRunState.score));
      easterEggProfile.bestCombo = Math.max(easterEggProfile.bestCombo, easterEggRunState.bestCombo);
      easterEggProfile.runs += 1;
      saveEasterEggProfile();
      addEasterEggParticles(playerBox.x + 5, playerBox.y + 5, '#ff4264', 10);
      return false;
    }

    if (!obstacle.passed && obstacle.x + obstacle.width < playerBox.x) {
      obstacle.passed = true;
      if (obstacle.closest < 7) {
        easterEggRunState.combo += 1;
        easterEggRunState.bestCombo = Math.max(easterEggRunState.bestCombo, easterEggRunState.combo);
        easterEggRunState.meter = Math.min(100, easterEggRunState.meter + 8);
        easterEggRunState.score += 18;
      } else {
        easterEggRunState.combo = 0;
      }
    }

    return obstacle.x + obstacle.width > -16;
  });

  easterEggRunState.pickups = easterEggRunState.pickups.filter((pickup) => {
    pickup.x -= speed * delta * worldFactor;
    pickup.y += Math.sin(now * 8 + pickup.drift) * delta * 2.8;
    const pickupBox = { x: pickup.x, y: pickup.y, width: pickup.width, height: pickup.height };
    if (boxesOverlap(playerBox, pickupBox)) {
      easterEggRunState.score += 24;
      easterEggRunState.combo += 1;
      easterEggRunState.bestCombo = Math.max(easterEggRunState.bestCombo, easterEggRunState.combo);
      easterEggRunState.meter = Math.min(100, easterEggRunState.meter + 14);
      easterEggProfile.totalPickups += 1;
      addEasterEggParticles(pickup.x + 2, pickup.y + 2, '#9fe7ff', 7);
      return false;
    }
    return pickup.x + pickup.width > -12;
  });

  easterEggRunState.particles = easterEggRunState.particles.filter((particle) => {
    particle.life -= delta;
    particle.x += particle.vx * delta * (wantsBullet ? 0.55 : 1);
    particle.y += particle.vy * delta * (wantsBullet ? 0.55 : 1);
    particle.vy += 42 * delta;
    return particle.life > 0;
  });
}

function drawEasterEggPixelSprite(rows, x, y, pixelSize, ink, accent = null, eye = null) {
  for (let rowIndex = 0; rowIndex < rows.length; rowIndex += 1) {
    const row = rows[rowIndex];
    for (let columnIndex = 0; columnIndex < row.length; columnIndex += 1) {
      const cell = row[columnIndex];
      if (cell === '0') continue;

      if (cell === '2' && accent !== null) {
        fill(accent);
      } else if (cell === '3' && eye !== null) {
        fill(eye);
      } else {
        fill(ink);
      }

      rect(x + columnIndex * pixelSize, y + rowIndex * pixelSize, pixelSize, pixelSize);
    }
  }
}

function drawEasterEggCloud(x, y, ink, alpha = 70) {
  noFill();
  stroke(ink, alpha);
  strokeWeight(0.65);
  beginShape();
  vertex(x, y + 2);
  bezierVertex(x + 1, y - 0.5, x + 4, y - 0.5, x + 5, y + 2);
  bezierVertex(x + 5.6, y + 0.5, x + 8, y + 0.2, x + 8.6, y + 2);
  vertex(x + 11, y + 2);
  endShape();
  noStroke();
}

function drawEasterEggRunInBar(barWidth, barHeight) {
  if (!easterEggGame || !easterEggGame.active) return false;

  const game = easterEggGame;
  const stadiumHeight = barHeight * 0.84;
  const stadiumTop = -stadiumHeight;
  const boardY = -2.2;
  const boardHeight = 3.1;
  const scoreboardWidth = barWidth * 0.16;
  const scoreboardHeight = stadiumHeight * 0.9;
  const scoreboardX = barWidth * 0.5 - scoreboardWidth * 0.5;
  const scoreText = formatEasterEggScore(game.displayScore || game.score || 0, 4);
  const bestText = formatEasterEggScore((game.profile && game.profile.highScore) || 0, 4);
  const worldScale = barWidth / (game.width * 1.68);
  const worldShift = 0;
  const runnerGroundY = barHeight - 3.1;
  const jumpLift = game.player ? game.player.lift * 0.25 : 0;
  const ducking = !!(game.player && game.player.duckBlend > 0.45);
  const jumping = !!(game.player && game.player.lift > 2);
  const runFrame = floor((game.worldTime || game.elapsed || 0) * 10) % 2;

  noStroke();

  fill('#56626e');
  rect(0, stadiumTop, barWidth, stadiumHeight);
  fill('#72808d');
  rect(0, stadiumTop + 1.1, barWidth, 1.4);
  fill('#3f4750');
  rect(0, stadiumTop + 2.5, barWidth, 1.2);

  fill('#8ea0ad');
  rect(0, stadiumTop + 3.7, scoreboardX - 1.8, 7.9);
  rect(scoreboardX + scoreboardWidth + 1.8, stadiumTop + 3.7, barWidth - (scoreboardX + scoreboardWidth + 1.8), 7.9);

  const crowdBands = [
    { y: stadiumTop + 4.2, h: 6.9, seed: 0.9 },
    { y: stadiumTop + 4.6, h: 6.3, seed: 1.7 }
  ];

  crowdBands.forEach((band) => {
    for (let x = 2; x < barWidth - 2; x += 1.6) {
      if (x > scoreboardX - 2 && x < scoreboardX + scoreboardWidth + 2) continue;
      const sway = sin((x * 0.18) + (game.distance || 0) * 0.03 + band.seed);
      const bodyTop = band.y + ((floor(x) % 3) * 0.4);
      fill(sway > 0.45 ? '#d24a48' : (sway < -0.35 ? '#384858' : '#5a6977'));
      rect(x, bodyTop + 1.2, 1.1, band.h - 1.4);
      fill('#d2b48c');
      rect(x + 0.1, bodyTop, 0.9, 1.3);
    }
  });

  stroke('#d9e1e7');
  strokeWeight(0.6);
  line(0, boardY, scoreboardX - 1.2, boardY);
  line(scoreboardX + scoreboardWidth + 1.2, boardY, barWidth, boardY);
  noStroke();

  fill('#1d2227');
  rect(scoreboardX, stadiumTop + 0.6, scoreboardWidth, scoreboardHeight);
  fill('#2f363d');
  rect(scoreboardX, stadiumTop + 1.2, scoreboardWidth, 1.1);
  fill('#f5f5f5');
  textFont('RPIGeistMono');
  textAlign(CENTER, TOP);
  textSize(4.2);
  text('PUCK RUNNER', scoreboardX + scoreboardWidth * 0.5, stadiumTop + 1.8);
  textSize(2.4);
  textAlign(LEFT, TOP);
  text('SCORE', scoreboardX + 2.4, stadiumTop + 6.5);
  text('HIGH', scoreboardX + scoreboardWidth * 0.58, stadiumTop + 6.5);
  textSize(4.7);
  text(scoreText, scoreboardX + 2.4, stadiumTop + 9.2);
  text(bestText, scoreboardX + scoreboardWidth * 0.58, stadiumTop + 9.2);

  fill('#f7fbff');
  rect(0, 0, barWidth, barHeight);
  fill('#e5f2fa');
  rect(0, 1.2, barWidth, barHeight - 1.2);
  fill('#d7ebf7');
  rect(0, 6.5, barWidth, 4.2);
  fill('#c8e0f1');
  rect(0, 12.8, barWidth, barHeight - 12.8);

  fill('#c3322c');
  rect(0, boardY + 0.2, barWidth, 0.45);
  fill('#e7c64a');
  rect(0, boardY + boardHeight - 0.55, barWidth, 0.55);
  fill('#d6001c');
  rect(barWidth * 0.499, 0, 0.9, barHeight);

  stroke('#5aa0c8');
  strokeWeight(0.5);
  noFill();
  ellipse(barWidth * 0.2, barHeight * 0.56, 22, 12);
  ellipse(barWidth * 0.8, barHeight * 0.56, 22, 12);
  noStroke();

  const runnerX = game.playerX * worldScale + worldShift;
  const runnerY = runnerGroundY - jumpLift - (ducking ? 6.5 : 8.4);
  const jumpSprite = [
    '00022222000',
    '00211111200',
    '02111111120',
    '21113131112',
    '21111111112',
    '02111111120',
    '00211111200',
    '00001100000',
    '00010001000'
  ];
  const duckSprite = [
    '00022220000',
    '00211112000',
    '02111111200',
    '21113111120',
    '21111111120',
    '02111111200',
    '00011110000'
  ];
  const runSpriteA = [
    '00022222000',
    '00211111200',
    '02111111120',
    '21113131112',
    '21111111112',
    '02111111120',
    '00211111200',
    '00011001000',
    '00100000100'
  ];
  const runSpriteB = [
    '00022222000',
    '00211111200',
    '02111111120',
    '21113131112',
    '21111111112',
    '02111111120',
    '00211111200',
    '00001110000',
    '00010000100'
  ];
  drawEasterEggPixelSprite(
    ducking ? duckSprite : (jumping ? jumpSprite : (runFrame === 0 ? runSpriteA : runSpriteB)),
    round(runnerX),
    round(runnerY),
    1,
    color('#111111'),
    color('#d8241f'),
    color('#ffffff')
  );

  if (!jumping) {
    fill('#111111');
    rect(runnerX + 9, runnerGroundY - 1.4, 11.5, 0.95);
    fill('#6d5329');
    rect(runnerX + 19.6, runnerGroundY - 1.55, 3.6, 1.1);
  }

  const obstacleBaseY = barHeight - 2.1;
  const obstacleScaleY = 0.25;
  (game.obstacles || []).forEach((obstacle) => {
    const x = obstacle.x * worldScale + worldShift;
    if (x > barWidth + 30 || x < -30) return;

    if (obstacle.type === 'puck') {
      fill('#6c4e26');
      rect(x, obstacleBaseY - 1.2, 12.5, 0.95);
      fill('#1b1b1b');
      rect(x + 10.6, obstacleBaseY - 1.65, 2.4, 1.85);
      fill('#c82722');
      rect(x + 5.8, obstacleBaseY - 1.15, 2.4, 0.4);
    } else if (obstacle.type === 'check') {
      fill('#e7d6ab');
      rect(x + 0.5, obstacleBaseY - 5.2, 6.4, 4.8);
      fill('#111111');
      rect(x + 4.6, obstacleBaseY - 4.6, 3.6, 3.6);
      fill('#d8241f');
      rect(x + 1.6, obstacleBaseY - 4.8, 1.4, 4);
    } else if (obstacle.type === 'stick') {
      fill('#111111');
      rect(x, obstacleBaseY - 9.5, 14.5, 1.2);
      fill('#6c4e26');
      rect(x + 13.2, obstacleBaseY - 12.8, 1.3, 4.5);
      fill('#d8241f');
      rect(x + 9.5, obstacleBaseY - 9.35, 2.4, 0.35);
    } else if (obstacle.type === 'split') {
      fill('#d9dde2');
      rect(x + 1, obstacleBaseY - 8.2, 8.4, 0.9);
      rect(x + 1, obstacleBaseY - 8.2, 0.9, 7.2);
      rect(x + 8.5, obstacleBaseY - 8.2, 0.9, 7.2);
      stroke('#c81f1f');
      strokeWeight(0.7);
      line(x + 9.1, obstacleBaseY - 8.2, x + 12.1, obstacleBaseY - 12.2);
      line(x + 12.1, obstacleBaseY - 12.2, x + 12.1, obstacleBaseY - 1.2);
      noStroke();
    }
  });

  (game.pickups || []).forEach((pickup) => {
    const x = pickup.x * worldScale + worldShift;
    const y = obstacleBaseY - (pickup.y * obstacleScaleY) + 2;
    fill('#d8241f');
    rect(x + 1, y, 1, 4);
    rect(x, y + 1, 4, 1);
    fill('#ffffff');
    rect(x + 1, y + 1, 1, 1);
  });

  (game.particles || []).forEach((particle) => {
    const x = runnerX + (particle.x - game.playerX) * 0.06;
    const y = obstacleBaseY - (particle.y - (game.playerFloorY || 0)) * 0.1;
    fill(color(particle.color || '#d8241f'));
    rect(x, y, 0.8, 0.8);
  });

  fill('#a31d1b');
  textAlign(CENTER, TOP);
  textSize(5.1);
  text('R P I  E N G I N E E R S', barWidth * 0.5, -0.35);

  if (game.phase === 'boot' || game.phase === 'gameover') {
    fill('#ffffff');
    textSize(3.2);
    text(game.phase === 'boot' ? 'GET READY' : 'SPACE TO RETRY', barWidth * 0.5, stadiumTop + 13.6);
  }

  return true;
}

function isTextFieldElement(element) {
  if (!element) return false;
  const tagName = element.tagName ? element.tagName.toUpperCase() : '';
  return tagName === 'INPUT' || tagName === 'TEXTAREA' || tagName === 'SELECT' || element.isContentEditable;
}

function isEasterEggActive() {
  return !!(easterEggGame && easterEggGame.active);
}

function setEasterEggHintProgress(progress) {
  if (!easterEggHint) return;
  const clampedProgress = Math.max(0, Math.min(1, progress || 0));
  easterEggHint.style.setProperty('--hold-progress', clampedProgress.toFixed(3));
}

function setEasterEggHintState(visible, arming = false, label = 'HOLD TO ENTER') {
  if (!easterEggHint) return;

  if (!visible) {
    easterEggHint.classList.remove('is-visible', 'is-arming');
    setEasterEggHintProgress(0);
    if (easterEggHintLabel) {
      easterEggHintLabel.textContent = label;
    }
    return;
  }

  if (isEasterEggActive() || isPanningMode) return;

  easterEggHint.classList.toggle('is-visible', !!visible);
  easterEggHint.classList.toggle('is-arming', !!arming);

  if (easterEggHintLabel) {
    easterEggHintLabel.textContent = label;
  }
}

function getEasterEggBarBounds() {
  if (!appMain) return null;

  const appWidth = appMain.clientWidth || 0;
  const appHeight = appMain.clientHeight || 0;
  if (!appWidth || !appHeight) return null;

  const actualWidth = REFERENCE_WIDTH * LOGO_SCALE * zoomLevel;
  const actualHeight = 18 * LOGO_SCALE * zoomLevel;
  const actualLeft = appWidth / 2 + LOGO_SCALE * (panOffset.x + zoomLevel * (-REFERENCE_WIDTH / 2));
  const actualTop = appHeight / 2 + LOGO_SCALE * (panOffset.y + zoomLevel * (LOGO_VERTICAL_OFFSET + 132.911));
  const paddingX = Math.max(18, actualHeight * 1.4);
  const paddingY = Math.max(14, actualHeight * 1.7);

  return {
    left: actualLeft - paddingX,
    top: actualTop - paddingY,
    width: actualWidth + paddingX * 2,
    height: actualHeight + paddingY * 2,
    actualLeft,
    actualTop,
    actualWidth,
    actualHeight,
    hintX: actualLeft + actualWidth / 2,
    hintY: actualTop - Math.max(30, actualHeight * 2.1)
  };
}

function updateEasterEggHotspotBounds() {
  easterEggHotspotBounds = getEasterEggBarBounds();
  if (!easterEggHotspotBounds || !easterEggHint) return;

  easterEggHint.style.left = `${easterEggHotspotBounds.hintX}px`;
  easterEggHint.style.top = `${easterEggHotspotBounds.hintY}px`;
}

function isPointInEasterEggHotspot(clientX, clientY) {
  if (!easterEggHotspotBounds || !appMain) return false;
  const appRect = appMain.getBoundingClientRect();
  const localX = clientX - appRect.left;
  const localY = clientY - appRect.top;

  return localX >= easterEggHotspotBounds.left &&
    localX <= easterEggHotspotBounds.left + easterEggHotspotBounds.width &&
    localY >= easterEggHotspotBounds.top &&
    localY <= easterEggHotspotBounds.top + easterEggHotspotBounds.height;
}

function cancelEasterEggHold(keepVisible = false) {
  if (easterEggHoldRaf) {
    cancelAnimationFrame(easterEggHoldRaf);
    easterEggHoldRaf = 0;
  }

  easterEggHoldState.pointerId = null;
  easterEggHoldState.startedAt = 0;
  easterEggHoldState.progress = 0;
  easterEggHoldState.active = false;

  if (keepVisible) {
    setEasterEggHintState(true, false, 'HOLD TO ENTER');
  } else if (easterEggHint) {
    easterEggHint.classList.remove('is-arming');
    setEasterEggHintProgress(0);
  }
}

function runEasterEggHoldFrame(timestamp) {
  if (!easterEggHoldState.active) return;

  const progress = Math.max(0, Math.min(1, (timestamp - easterEggHoldState.startedAt) / 900));
  easterEggHoldState.progress = progress;
  setEasterEggHintProgress(progress);

  if (easterEggHintLabel) {
    easterEggHintLabel.textContent = `THAWING ${Math.round(progress * 100)}%`;
  }

  if (progress >= 1) {
    cancelEasterEggHold(false);
    openEasterEggExperience('hold');
    return;
  }

  easterEggHoldRaf = requestAnimationFrame(runEasterEggHoldFrame);
}

function beginEasterEggHold(pointerId) {
  if (isEasterEggActive() || isPanningMode) return;

  cancelEasterEggHold(true);
  easterEggHoldState.pointerId = pointerId;
  easterEggHoldState.startedAt = performance.now();
  easterEggHoldState.progress = 0;
  easterEggHoldState.active = true;
  setEasterEggHintState(true, true, 'THAWING 0%');
  easterEggHoldRaf = requestAnimationFrame(runEasterEggHoldFrame);
}

function handleEasterEggPointerMove(event) {
  if (!appMain || isEasterEggActive() || isPanningMode) {
    setEasterEggHintState(false);
    return;
  }

  updateEasterEggHotspotBounds();
  const inside = isPointInEasterEggHotspot(event.clientX, event.clientY);

  if (inside && !easterEggHoldState.active) {
    setEasterEggHintState(true, false, 'HOLD TO ENTER');
  } else if (!inside && !easterEggHoldState.active) {
    setEasterEggHintState(false);
  } else if (!inside && easterEggHoldState.active && easterEggHoldState.pointerId === event.pointerId) {
    cancelEasterEggHold(false);
    setEasterEggHintState(false);
  }
}

function handleEasterEggPointerDown(event) {
  if (isEasterEggActive() || isPanningMode) return;

  updateEasterEggHotspotBounds();
  if (!isPointInEasterEggHotspot(event.clientX, event.clientY)) return;

  event.preventDefault();
  beginEasterEggHold(event.pointerId);
}

function handleEasterEggPointerUp(event) {
  if (!easterEggHoldState.active) return;
  if (easterEggHoldState.pointerId !== null && event.pointerId !== easterEggHoldState.pointerId) return;

  const shouldStayVisible = isPointInEasterEggHotspot(event.clientX, event.clientY);
  cancelEasterEggHold(shouldStayVisible);
  if (!shouldStayVisible) {
    setEasterEggHintState(false);
  }
}

function handleEasterEggPointerLeave() {
  if (easterEggHoldState.active) {
    cancelEasterEggHold(false);
  }
  setEasterEggHintState(false);
}

function resizeEasterEggCanvas() {
  return;
}

function setEasterEggScoreboardVisibility(active) {
  if (workspaceDefaultControls) {
    workspaceDefaultControls.hidden = !!active;
  }
  if (easterEggScoreboard) {
    easterEggScoreboard.hidden = !active;
  }
}

function handleEasterEggGameStateChange(state) {
  const safeState = state || {};
  const score = formatEasterEggScore(safeState.displayScore || safeState.score || 0, 4);
  const best = formatEasterEggScore(safeState.highScore || 0, 4);
  const combo = formatEasterEggScore(safeState.combo || 0, 2);
  const status = !safeState.active
    ? 'Ready'
    : (safeState.phase === 'boot'
      ? (safeState.message || 'Rink warming up')
      : (safeState.gameOver ? 'Press space to retry' : (safeState.rank || 'Skating')));
  const meter = Math.max(0, Math.min(100, Math.round(safeState.meter || 0)));

  if (easterEggScoreValue) easterEggScoreValue.textContent = score;
  if (easterEggBestValue) easterEggBestValue.textContent = best;
  if (easterEggComboValue) easterEggComboValue.textContent = combo;
  if (easterEggStatusValue) easterEggStatusValue.textContent = status;
  if (easterEggMeterFill) easterEggMeterFill.style.width = `${meter}%`;
  if (easterEggLiveStatus) easterEggLiveStatus.textContent = status;
  if (easterEggLaunchButton) {
    easterEggLaunchButton.textContent = safeState.active ? 'Exit Rink Rush' : 'Activate Rink Rush';
  }

  return safeState;
}

function releaseEasterEggControls() {
  if (!easterEggGame) return;
  easterEggGame.setControl('duck', false);
  easterEggGame.setControl('bullet', false);
}

function openEasterEggExperience(source = 'secret') {
  if (isEasterEggActive() || !easterEggGame) return;

  easterEggLastFocusedElement = document.activeElement;
  easterEggPreviousPlaybackState = isPlaying;
  easterEggResumeAudio = isAudioPlaying;

  stopAudio();
  document.body.classList.add('easter-egg-active');
  setEasterEggScoreboardVisibility(true);
  easterEggGame.open(source);
  loop();
}

function closeEasterEggExperience() {
  if (!isEasterEggActive() || !easterEggGame) return;

  releaseEasterEggControls();
  easterEggGame.close();
  document.body.classList.remove('easter-egg-active');
  setEasterEggScoreboardVisibility(false);
  handleEasterEggGameStateChange({
    active: false,
    phase: 'idle',
    displayScore: 0,
    score: 0,
    combo: 0,
    meter: 0,
    highScore: easterEggGame.profile ? easterEggGame.profile.highScore : 0
  });

  if (easterEggPreviousPlaybackState) {
    loop();
  } else {
    noLoop();
    redraw();
  }

  if (easterEggResumeAudio && styleSupportsAudio(styleSelect ? styleSelect.value : 'solid')) {
    startAudio();
  }
  easterEggResumeAudio = false;
  if (easterEggLastFocusedElement && document.body.contains(easterEggLastFocusedElement)) {
    easterEggLastFocusedElement.focus();
  }
}

function setupEasterEggTouchControls() {
  return;
}

function setupEasterEggExperience() {
  if (!appMain) return;

  easterEggProfile = loadEasterEggProfile();
  if (typeof window.RPIRinkRush === 'undefined' || typeof window.RPIRinkRush.RinkRushGame !== 'function') {
    return;
  }

  easterEggGame = new window.RPIRinkRush.RinkRushGame(null, {
    audio: true,
    onStateChange: handleEasterEggGameStateChange
  });
  setEasterEggScoreboardVisibility(false);
  handleEasterEggGameStateChange({
    active: false,
    phase: 'idle',
    displayScore: 0,
    score: 0,
    combo: 0,
    meter: 0,
    highScore: easterEggGame.profile ? easterEggGame.profile.highScore : 0
  });

  if (easterEggLaunchButton) {
    easterEggLaunchButton.addEventListener('click', function () {
      if (isEasterEggActive()) {
        closeEasterEggExperience();
      } else {
        openEasterEggExperience('sidebar');
      }
    });
  }
}

function handleEasterEggShortcut(event) {
  if (isEasterEggActive() || event.ctrlKey || event.metaKey || event.altKey) return false;
  if (isTextFieldElement(document.activeElement)) return false;
  if (!event.key || event.key.length !== 1) return false;

  const character = event.key.toUpperCase().replace(/[^A-Z]/g, '');
  if (!character) return false;

  easterEggKeyBuffer = (easterEggKeyBuffer + character).slice(-8);
  if (easterEggKeyBufferTimer) {
    clearTimeout(easterEggKeyBufferTimer);
  }
  easterEggKeyBufferTimer = setTimeout(() => {
    easterEggKeyBuffer = '';
  }, 1200);

  if (!easterEggKeyBuffer.endsWith('PUCK')) {
    return false;
  }

  event.preventDefault();
  easterEggKeyBuffer = '';
  if (typeof Toast !== 'undefined' && Toast && typeof Toast.show === 'function') {
    Toast.show('Secret rink unlocked.', 'success');
  }
  openEasterEggExperience('sequence');
  return true;
}

function handleEasterEggGameKeydown(event) {
  if (!isEasterEggActive() || !easterEggGame) return false;

  switch (event.code) {
    case 'Escape':
      event.preventDefault();
      closeEasterEggExperience();
      return true;
    case 'ArrowUp':
    case 'KeyW':
    case 'Space':
      event.preventDefault();
      if (!event.repeat) {
        easterEggGame.setControl('jump', true);
      }
      return true;
    case 'ArrowDown':
    case 'KeyS':
      event.preventDefault();
      easterEggGame.setControl('duck', true);
      return true;
    case 'ShiftLeft':
    case 'ShiftRight':
      event.preventDefault();
      easterEggGame.setControl('bullet', true);
      return true;
    case 'Enter':
    case 'KeyR':
      event.preventDefault();
      if (easterEggGame.isGameOver()) {
        easterEggGame.restart();
      }
      return true;
    default:
      return false;
  }
}

function handleEasterEggGameKeyup(event) {
  if (!isEasterEggActive() || !easterEggGame) return false;

  switch (event.code) {
    case 'ArrowDown':
    case 'KeyS':
      easterEggGame.setControl('duck', false);
      return true;
    case 'ShiftLeft':
    case 'ShiftRight':
      easterEggGame.setControl('bullet', false);
      return true;
    default:
      return false;
  }
}

function styleSupportsAudio(style) {
  return style === 'binary' || style === 'ticker' || style === 'waveform' || style === 'morse' || style === 'music';
}

function showAudioToast(message, type = 'info') {
  if (typeof Toast !== 'undefined' && Toast && typeof Toast.show === 'function') {
    Toast.show(message, type);
  }
}

function updateAudioControlsUI() {
  const activeType = getCurrentAudioPreviewType();
  const staffPreviewDisabled = !currentStaffNotes || currentStaffNotes.length === 0;

  getAudioButtonConfig().forEach(({ type, button, currentShader: shaderId }) => {
    const isStaffControl = type === 'staff' && shaderId === 10;
    const disabled = isStaffControl && staffPreviewDisabled;

    renderPreviewButton(button, 'audio', {
      active: activeType === type && isAudioPlaying,
      disabled,
      disabledReason: 'Add notes first'
    });
  });
}








// Advanced circle packing algorithm based on Collins & Stephenson paper


// Calculate phase parameters based on density and size variation
function calculatePhaseParameters(density, sizeVariation, area, barHeight) {
  const phases = [];

  // Maximum radius is constrained by bar height (radius = height/2)
  const absoluteMaxRadius = barHeight / 2; // 9px for 18px bar height

  // Calculate size range based on size variation
  // 0% variation: use moderate size range
  // 100% variation: use full range from tiny to maximum possible
  const minPossibleRadius = Math.min(0.5, absoluteMaxRadius * 0.05); // Very small minimum
  const sizeRange = absoluteMaxRadius - minPossibleRadius;
  const variationFactor = sizeVariation / 100;

  // Base sizes scale with density and variation
  const baseSizeFactor = Math.sqrt(area) / 50;
  const baseRadius = Math.min(baseSizeFactor * (1.2 + density / 200), absoluteMaxRadius * 0.8);

  // Phase 1: Large circles (can reach maximum size with high variation)
  const largeMinRadius = Math.max(minPossibleRadius, baseRadius * (1 - variationFactor * 0.6));
  const largeMaxRadius = Math.min(absoluteMaxRadius, baseRadius * (1 + variationFactor * 1.2));

  phases.push({
    minRadius: largeMinRadius,
    maxRadius: largeMaxRadius,
    attempts: Math.floor(density * 15),
    candidatesPerAttempt: 25
  });

  // Phase 2: Medium circles
  const mediumBaseRadius = baseRadius * 0.65;
  const mediumMinRadius = Math.max(minPossibleRadius, mediumBaseRadius * (1 - variationFactor * 0.7));
  const mediumMaxRadius = Math.min(absoluteMaxRadius * 0.8, mediumBaseRadius * (1 + variationFactor * 0.8));

  phases.push({
    minRadius: mediumMinRadius,
    maxRadius: mediumMaxRadius,
    attempts: Math.floor(density * 30),
    candidatesPerAttempt: 35
  });

  // Phase 3: Small circles
  const smallBaseRadius = baseRadius * 0.4;
  const smallMinRadius = Math.max(minPossibleRadius, smallBaseRadius * (1 - variationFactor * 0.8));
  const smallMaxRadius = Math.min(absoluteMaxRadius * 0.6, smallBaseRadius * (1 + variationFactor * 0.6));

  phases.push({
    minRadius: smallMinRadius,
    maxRadius: smallMaxRadius,
    attempts: Math.floor(density * 60),
    candidatesPerAttempt: 45
  });

  // Phase 4: Micro circles for gap filling
  const microBaseRadius = baseRadius * 0.25;
  const microMinRadius = minPossibleRadius;
  const microMaxRadius = Math.min(absoluteMaxRadius * 0.4, microBaseRadius * (1 + variationFactor * 0.4));

  phases.push({
    minRadius: microMinRadius,
    maxRadius: microMaxRadius,
    attempts: Math.floor(density * 100),
    candidatesPerAttempt: 30
  });

  return phases;
}

// Execute a single packing phase
function executePackingPhase(barWidth, barHeight, existingCircles, phase, overlapAmount) {
  const newCircles = [];
  const minDistanceMultiplier = overlapAmount === 0 ? 2.0 : (2.0 - (overlapAmount / 100 * 1.8));

  // Create spatial grid for faster collision detection
  const spatialGrid = createSpatialGrid(barWidth, barHeight, existingCircles, phase.maxRadius);

  for (let attempt = 0; attempt < phase.attempts; attempt++) {
    let bestCandidate = null;
    let bestScore = -Infinity;

    // Generate candidates using improved sampling
    for (let candidate = 0; candidate < phase.candidatesPerAttempt; candidate++) {
      const radius = phase.minRadius + Math.random() * (phase.maxRadius - phase.minRadius);
      const x = radius + Math.random() * (barWidth - 2 * radius);
      const y = radius + Math.random() * (barHeight - 2 * radius);

      if (!hasCollisionFast(x, y, radius, existingCircles, newCircles, spatialGrid, minDistanceMultiplier)) {
        // Score based on distance to nearest circles and position diversity
        const score = calculatePlacementScore(x, y, radius, existingCircles, newCircles, barWidth, barHeight);

        if (score > bestScore) {
          bestScore = score;
          bestCandidate = { x, y, r: radius };
        }
      }
    }

    if (bestCandidate) {
      newCircles.push(bestCandidate);
      updateSpatialGrid(spatialGrid, bestCandidate);
    }
  }

  return newCircles;
}

// Execute gap-filling phase using spatial analysis
function executeGapFillingPhase(barWidth, barHeight, existingCircles, density, sizeVariation, overlapAmount) {
  const gapFillingCircles = [];
  const minDistanceMultiplier = overlapAmount === 0 ? 2.0 : (2.0 - (overlapAmount / 100 * 1.8));

  // Analyze gaps in the current packing
  const gaps = identifyGaps(barWidth, barHeight, existingCircles);

  // Fill each gap with appropriately sized circles
  for (const gap of gaps) {
    if (gap.maxRadius < barWidth / 100) continue; // Skip very small gaps

    const targetRadius = gap.maxRadius * 0.8; // Leave some margin
    const radiusVariation = targetRadius * (sizeVariation / 400);

    // Try multiple attempts to fill this gap
    for (let attempt = 0; attempt < 20; attempt++) {
      const radius = Math.max(
        targetRadius * 0.5,
        targetRadius + (Math.random() - 0.5) * radiusVariation
      );

      if (!hasCollisionWithAllCircles(gap.x, gap.y, radius, existingCircles, gapFillingCircles, minDistanceMultiplier)) {
        gapFillingCircles.push({ x: gap.x, y: gap.y, r: radius });
        break;
      }
    }
  }

  return gapFillingCircles;
}

// Create spatial grid for faster collision detection
function createSpatialGrid(width, height, circles, maxRadius) {
  const cellSize = maxRadius * 2;
  const cols = Math.ceil(width / cellSize);
  const rows = Math.ceil(height / cellSize);
  const grid = Array(rows).fill(null).map(() => Array(cols).fill(null).map(() => []));

  // Populate grid with existing circles
  for (const circle of circles) {
    const minCol = Math.max(0, Math.floor((circle.x - circle.r) / cellSize));
    const maxCol = Math.min(cols - 1, Math.floor((circle.x + circle.r) / cellSize));
    const minRow = Math.max(0, Math.floor((circle.y - circle.r) / cellSize));
    const maxRow = Math.min(rows - 1, Math.floor((circle.y + circle.r) / cellSize));

    for (let row = minRow; row <= maxRow; row++) {
      for (let col = minCol; col <= maxCol; col++) {
        grid[row][col].push(circle);
      }
    }
  }

  return { grid, cellSize, cols, rows };
}

// Update spatial grid with new circle
function updateSpatialGrid(spatialGrid, circle) {
  const { grid, cellSize, cols, rows } = spatialGrid;
  const minCol = Math.max(0, Math.floor((circle.x - circle.r) / cellSize));
  const maxCol = Math.min(cols - 1, Math.floor((circle.x + circle.r) / cellSize));
  const minRow = Math.max(0, Math.floor((circle.y - circle.r) / cellSize));
  const maxRow = Math.min(rows - 1, Math.floor((circle.y + circle.r) / cellSize));

  for (let row = minRow; row <= maxRow; row++) {
    for (let col = minCol; col <= maxCol; col++) {
      grid[row][col].push(circle);
    }
  }
}

// Fast collision detection using spatial grid
function hasCollisionFast(x, y, radius, existingCircles, newCircles, spatialGrid, minDistanceMultiplier) {
  // Check bounds
  if (x - radius < 0 || x + radius > spatialGrid.cols * spatialGrid.cellSize ||
    y - radius < 0 || y + radius > spatialGrid.rows * spatialGrid.cellSize) {
    return true;
  }

  // Check against grid cells
  const { grid, cellSize } = spatialGrid;
  const minCol = Math.max(0, Math.floor((x - radius) / cellSize));
  const maxCol = Math.min(grid[0].length - 1, Math.floor((x + radius) / cellSize));
  const minRow = Math.max(0, Math.floor((y - radius) / cellSize));
  const maxRow = Math.min(grid.length - 1, Math.floor((y + radius) / cellSize));

  for (let row = minRow; row <= maxRow; row++) {
    for (let col = minCol; col <= maxCol; col++) {
      for (const other of grid[row][col]) {
        const dx = x - other.x;
        const dy = y - other.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const minDistance = (radius + other.r) * minDistanceMultiplier;

        if (distance < minDistance) {
          return true;
        }
      }
    }
  }

  // Check against new circles in this phase
  for (const other of newCircles) {
    const dx = x - other.x;
    const dy = y - other.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const minDistance = (radius + other.r) * minDistanceMultiplier;

    if (distance < minDistance) {
      return true;
    }
  }

  return false;
}

// Calculate placement score for candidate position
function calculatePlacementScore(x, y, radius, existingCircles, newCircles, width, height) {
  let minDistance = Infinity;
  const allCircles = [...existingCircles, ...newCircles];

  // Find distance to nearest circle
  for (const other of allCircles) {
    const dx = x - other.x;
    const dy = y - other.y;
    const distance = Math.sqrt(dx * dx + dy * dy) - other.r - radius;
    minDistance = Math.min(minDistance, distance);
  }

  // Prefer positions that are:
  // 1. Far from other circles (maximal spacing)
  // 2. Not too close to edges (avoid edge effects)
  // 3. In areas with lower circle density

  const edgeDistance = Math.min(x - radius, width - x - radius, y - radius, height - y - radius);
  const edgeScore = Math.min(1.0, edgeDistance / (radius * 2));

  const densityScore = calculateLocalDensityScore(x, y, radius, allCircles, width, height);

  return minDistance * 0.6 + edgeScore * 0.2 + densityScore * 0.2;
}

// Calculate local density score (lower density = higher score)
function calculateLocalDensityScore(x, y, radius, circles, width, height) {
  const searchRadius = radius * 8;
  let localArea = 0;
  let occupiedArea = 0;

  // Calculate local density in surrounding area
  for (const circle of circles) {
    const dx = x - circle.x;
    const dy = y - circle.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance < searchRadius + circle.r) {
      // Calculate overlap area between search circle and existing circle
      const overlap = calculateCircleOverlap(x, y, searchRadius, circle.x, circle.y, circle.r);
      occupiedArea += overlap;
    }
  }

  localArea = Math.PI * searchRadius * searchRadius;
  const density = occupiedArea / localArea;

  return Math.max(0, 1.0 - density);
}

// Calculate overlap area between two circles
function calculateCircleOverlap(x1, y1, r1, x2, y2, r2) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const distance = Math.sqrt(dx * dx + dy * dy);

  if (distance >= r1 + r2) return 0; // No overlap
  if (distance <= Math.abs(r1 - r2)) {
    // One circle inside the other
    return Math.PI * Math.min(r1, r2) * Math.min(r1, r2);
  }

  // Partial overlap - use lens formula
  const a = r1 * r1;
  const b = r2 * r2;
  const d = distance;
  const x = (a - b + d * d) / (2 * d);
  const z = x - d;
  const y = Math.sqrt(a - x * x);

  return a * Math.acos(x / r1) + b * Math.acos(-z / r2) - y * d;
}

// Identify gaps in the current packing
function identifyGaps(width, height, circles) {
  const gaps = [];
  const samplePoints = Math.min(2000, width * height / 50); // Adaptive sampling

  for (let i = 0; i < samplePoints; i++) {
    const x = Math.random() * width;
    const y = Math.random() * height;

    // Find the largest circle that could fit at this point
    let maxRadius = Math.min(x, width - x, y, height - y);

    for (const circle of circles) {
      const dx = x - circle.x;
      const dy = y - circle.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      maxRadius = Math.min(maxRadius, distance - circle.r);
    }

    // If we can fit a reasonable-sized circle, mark it as a gap
    if (maxRadius > width / 200) {
      gaps.push({ x, y, maxRadius });
    }
  }

  // Sort gaps by size (largest first) and return top candidates
  gaps.sort((a, b) => b.maxRadius - a.maxRadius);
  return gaps.slice(0, Math.min(100, gaps.length));
}

// Check collision with all circles (used in gap filling)
function hasCollisionWithAllCircles(x, y, radius, existingCircles, newCircles, minDistanceMultiplier) {
  const allCircles = [...existingCircles, ...newCircles];

  for (const other of allCircles) {
    const dx = x - other.x;
    const dy = y - other.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const minDistance = (radius + other.r) * minDistanceMultiplier;

    if (distance < minDistance) {
      return true;
    }
  }

  return false;
}

// Calculate coverage percentage
function calculateCoverage(circles, totalArea) {
  let occupiedArea = 0;
  for (const circle of circles) {
    occupiedArea += Math.PI * circle.r * circle.r;
  }
  return Math.min(1.0, occupiedArea / totalArea);
}

// Generate grid-based circles
function generateGridCircles(barWidth, barHeight, rows, gridDensity, sizeVariationY, sizeVariationX, gridOverlap, layout) {
  const circles = [];

  // Safety guards
  if (barWidth <= 0 || barHeight <= 0 || rows < 1) return [];

  // Calculate base circle radius that fits the number of rows
  const baseRadius = (barHeight / (rows * 2)) * (gridDensity / 100);
  const rowHeight = barHeight / rows;

  // Calculate how many circles fit horizontally based on circle diameter
  const circleDiameter = baseRadius * 2;
  const baseColsPerRow = Math.floor(barWidth / circleDiameter);

  // Add extra circles based on overlap
  const overlapFactor = 1 + (gridOverlap / 100);
  const colsPerRow = Math.floor(baseColsPerRow * overlapFactor);

  for (let row = 0; row < rows; row++) {
    const rowProgress = rows > 1 ? row / (rows - 1) : 0.5; // 0 to 1 from top to bottom

    // Calculate Y position for this row
    const baseY = rowHeight * row + rowHeight / 2;

    // Calculate size variation for Y (top to bottom)
    const yVariationFactor = 1 + (sizeVariationY / 100) * (1 - rowProgress * 2); // -1 to 1, then scaled

    // Determine number of columns and spacing for this row
    let currentCols = colsPerRow;
    let horizontalSpacing;
    let startOffset = 0;

    if (layout === 'stagger') {
      if (row % 2 === 0) {
        // Even rows (0, 2, 4...): regular spacing
        horizontalSpacing = barWidth / Math.max(1, currentCols - 1);
        startOffset = 0;
      } else {
        // Odd rows (1, 3, 5...): offset by half circle diameter and use same number of circles
        horizontalSpacing = barWidth / Math.max(1, currentCols - 1);
        startOffset = circleDiameter / 2;
      }
    } else {
      // Straight layout: regular spacing
      horizontalSpacing = barWidth / Math.max(1, currentCols - 1);
      startOffset = 0;
    }

    for (let col = 0; col < currentCols; col++) {
      const colProgress = currentCols > 1 ? col / (currentCols - 1) : 0.5; // 0 to 1 from left to right

      // Calculate X position for this column
      const baseX = startOffset + col * horizontalSpacing;

      // Skip circles that would go outside the bar width
      if (baseX < baseRadius || baseX > barWidth - baseRadius) {
        continue;
      }

      // Calculate size variation for X (left to right)
      const xVariationFactor = 1 + (sizeVariationX / 100) * (colProgress * 2 - 1); // -1 to 1, then scaled

      // Combine both variation factors
      const combinedVariationFactor = yVariationFactor * xVariationFactor;
      const finalRadius = Math.max(0.5, baseRadius * combinedVariationFactor);

      // Ensure circles stay within bounds
      const clampedX = Math.max(finalRadius, Math.min(barWidth - finalRadius, baseX));
      const clampedY = Math.max(finalRadius, Math.min(barHeight - finalRadius, baseY));

      circles.push({
        x: clampedX,
        y: clampedY,
        r: finalRadius
      });
    }
  }

  console.log(`Generated ${circles.length} grid circles in ${rows} rows`);
  return circles;
}

// Optimized grid generation for zero size variation
function generateOptimizedGrid(barWidth, barHeight, baseRadius, minDistanceMultiplier) {
  const circles = [];

  // Calculate spacing based on the minimum distance multiplier
  const spacing = baseRadius * minDistanceMultiplier;

  // Use hexagonal packing for optimal space utilization
  const rowHeight = spacing * Math.sqrt(3) / 2;
  const rows = Math.floor(barHeight / rowHeight);
  const cols = Math.floor(barWidth / spacing);

  // Center the grid
  const offsetX = (barWidth - (cols - 1) * spacing) / 2;
  const offsetY = (barHeight - (rows - 1) * rowHeight) / 2;

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      // Alternate row offset for hexagonal packing
      const xOffset = (row % 2) * spacing * 0.5;
      const x = offsetX + col * spacing + xOffset;
      const y = offsetY + row * rowHeight;

      // Ensure circle fits within bounds
      if (x >= baseRadius && x <= barWidth - baseRadius &&
        y >= baseRadius && y <= barHeight - baseRadius) {
        circles.push({ x, y, r: baseRadius });
      }
    }
  }

  console.log(`Generated ${circles.length} circles in optimized grid`);
  return circles;
}



// Audio functions
let sequenceContext = {
  active: false,
  timerId: null,
  nextNoteTime: 0,
  currentNote: 0,
  baseTime: 0,
  type: null,
  osc1: null,
  osc2: null,
  gain1: null,
  gain2: null,
  inputGain: null,
  dryGain: null,
  wetGain: null,
  convolver: null,
  tremoloGain: null,
  tremoloLfo: null,
  tremoloDepth: null,
  activeVoices: []
};

let staffReverbImpulse = null;
let noiseBuffer = null;

function createNoiseBuffer(context, duration = 0.12) {
  const frameCount = Math.max(1, Math.floor(context.sampleRate * duration));
  const buffer = context.createBuffer(1, frameCount, context.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < frameCount; i++) {
    data[i] = (Math.random() * 2 - 1) * (1 - (i / frameCount));
  }
  return buffer;
}

function createReverbImpulse(context, duration = 1.8, decay = 2.6) {
  const frameCount = Math.floor(context.sampleRate * duration);
  const impulse = context.createBuffer(2, frameCount, context.sampleRate);
  for (let channel = 0; channel < impulse.numberOfChannels; channel++) {
    const data = impulse.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      const t = i / frameCount;
      data[i] = (Math.random() * 2 - 1) * Math.pow(1 - t, decay);
    }
  }
  return impulse;
}

function disconnectNode(node) {
  if (!node) return;
  try {
    node.disconnect();
  } catch (error) {
    console.warn('Node disconnect skipped:', error);
  }
}

async function initializeAudio() {
  try {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();

    // Load the pulse wave worklet
    await audioContext.audioWorklet.addModule('js/pulse-worklet.js');

    // Create gain node for volume control and smooth fade in/out
    gainNode = audioContext.createGain();
    gainNode.connect(audioContext.destination);
    gainNode.gain.value = 0;

    noiseBuffer = createNoiseBuffer(audioContext);
    staffReverbImpulse = createReverbImpulse(audioContext);

    console.log('Audio context initialized successfully');
  } catch (error) {
    console.error('Failed to initialize audio context:', error);
  }
}

function updateStaffEffects(time = audioContext ? audioContext.currentTime : 0) {
  if (!audioContext || sequenceContext.type !== 'staff' || !sequenceContext.active) return;

  if (sequenceContext.wetGain) {
    sequenceContext.wetGain.gain.cancelScheduledValues(time);
    sequenceContext.wetGain.gain.setValueAtTime(staffReverbToggle && staffReverbToggle.checked ? 0.5 : 0, time);
  }

  if (sequenceContext.dryGain) {
    sequenceContext.dryGain.gain.cancelScheduledValues(time);
    sequenceContext.dryGain.gain.setValueAtTime(0.9, time);
  }

  if (sequenceContext.tremoloDepth) {
    sequenceContext.tremoloDepth.gain.cancelScheduledValues(time);
    sequenceContext.tremoloDepth.gain.setValueAtTime(staffTremoloToggle && staffTremoloToggle.checked ? 0.38 : 0, time);
  }
}

function setupStaffEffectsChain() {
  sequenceContext.inputGain = audioContext.createGain();
  sequenceContext.dryGain = audioContext.createGain();
  sequenceContext.wetGain = audioContext.createGain();
  sequenceContext.convolver = audioContext.createConvolver();
  sequenceContext.tremoloGain = audioContext.createGain();
  sequenceContext.tremoloLfo = audioContext.createOscillator();
  sequenceContext.tremoloDepth = audioContext.createGain();

  sequenceContext.convolver.buffer = staffReverbImpulse;
  sequenceContext.tremoloGain.gain.setValueAtTime(0.75, audioContext.currentTime);
  sequenceContext.tremoloLfo.type = 'sine';
  sequenceContext.tremoloLfo.frequency.setValueAtTime(6.5, audioContext.currentTime);
  sequenceContext.tremoloDepth.gain.setValueAtTime(0, audioContext.currentTime);

  sequenceContext.inputGain.connect(sequenceContext.dryGain);
  sequenceContext.dryGain.connect(sequenceContext.tremoloGain);
  sequenceContext.inputGain.connect(sequenceContext.convolver);
  sequenceContext.convolver.connect(sequenceContext.wetGain);
  sequenceContext.wetGain.connect(sequenceContext.tremoloGain);
  sequenceContext.tremoloLfo.connect(sequenceContext.tremoloDepth);
  sequenceContext.tremoloDepth.connect(sequenceContext.tremoloGain.gain);
  sequenceContext.tremoloGain.connect(audioContext.destination);

  updateStaffEffects(audioContext.currentTime);
  sequenceContext.tremoloLfo.start(audioContext.currentTime);
}

async function startAudio() {
  // Only play audio if audioContext exists
  if (!audioContext || isAudioPlaying) {
    updateAudioControlsUI();
    return;
  }

  try {
    // Resume audio context if suspended (required by browsers)
    if (audioContext.state === 'suspended') {
      await audioContext.resume();
    }

    if (audioContext.state !== 'running') {
      showAudioToast('Audio is blocked by the browser. Click the page and try again.', 'warning');
      updateAudioControlsUI();
      return;
    }

    if (currentShader === 4) {
      startWaveformAudio();
    } else if (currentShader === 3) {
      startSequenceAudio('binary');
    } else if (currentShader === 7) {
      startSequenceAudio('morse');
    } else if (currentShader === 2) {
      startSequenceAudio('ticker');
    } else if (currentShader === 10) {
      if (!currentStaffNotes || currentStaffNotes.length === 0) {
        showAudioToast('Add notes to the keyboard before previewing music audio.', 'info');
        updateAudioControlsUI();
        return;
      }
      startSequenceAudio('staff');
    }
    if (isAudioPlaying && !hasShownAudioHintToast) {
      showAudioToast('Audio started. If you do not hear sound, check your device volume.', 'info');
      hasShownAudioHintToast = true;
    }
    updateAudioControlsUI();
  } catch (error) {
    console.error('Failed to start audio:', error);
    showAudioToast('Could not start audio. Check browser audio permissions.', 'error');
    updateAudioControlsUI();
  }
}

async function startWaveformAudio() {
  // Resume audio context if suspended (required by browsers)
  if (audioContext.state === 'suspended') {
    await audioContext.resume();
  }

  // Get current parameters
  const frequency = parseInt(waveformFrequencySlider.value);

  // Map frequency from 10-100 to C1-C5 (32.70Hz to 523.25Hz)
  const minFreq = 32.70; // C1
  const maxFreq = 523.25; // C5
  const normalizedFreq = (frequency - 10) / 90; // Normalize 10-100 to 0-1
  const mappedFrequency = minFreq + (normalizedFreq * (maxFreq - minFreq));

  // Create basic oscillators for smooth morphing
  const waveTypes = ['sine', 'sawtooth', 'square'];

  waveTypes.forEach(type => {
    // Create oscillator
    oscillators[type] = audioContext.createOscillator();
    oscillators[type].type = type;
    oscillators[type].frequency.setValueAtTime(mappedFrequency, audioContext.currentTime);

    // Create individual gain node for each oscillator
    oscillatorGains[type] = audioContext.createGain();
    oscillatorGains[type].gain.setValueAtTime(0, audioContext.currentTime);

    // Connect oscillator -> gain -> master gain -> destination
    oscillators[type].connect(oscillatorGains[type]);
    oscillatorGains[type].connect(gainNode);

    // Start oscillator
    oscillators[type].start();
  });

  // Create custom pulse wave using AudioWorklet
  try {
    pulseWorkletNode = new AudioWorkletNode(audioContext, 'pulse-processor');

    // Set initial frequency
    pulseWorkletNode.port.postMessage({
      type: 'frequency',
      value: mappedFrequency
    });

    // Set initial pulse width (20% to match visual)
    pulseWorkletNode.port.postMessage({
      type: 'pulseWidth',
      value: 0.2
    });

    oscillators.pulse = pulseWorkletNode;
    oscillatorGains.pulse = audioContext.createGain();
    oscillatorGains.pulse.gain.setValueAtTime(0, audioContext.currentTime);

    oscillators.pulse.connect(oscillatorGains.pulse);
    oscillatorGains.pulse.connect(gainNode);

  } catch (error) {
    console.error('Failed to create pulse worklet:', error);
    // Fallback: create a square wave oscillator
    oscillators.pulse = audioContext.createOscillator();
    oscillators.pulse.type = 'square';
    oscillators.pulse.frequency.setValueAtTime(mappedFrequency, audioContext.currentTime);

    oscillatorGains.pulse = audioContext.createGain();
    oscillatorGains.pulse.gain.setValueAtTime(0, audioContext.currentTime);

    oscillators.pulse.connect(oscillatorGains.pulse);
    oscillatorGains.pulse.connect(gainNode);
    oscillators.pulse.start();
  }

  // Clear any previously scheduled values to fix play/pause bug
  gainNode.gain.cancelScheduledValues(audioContext.currentTime);

  // Set master gain
  gainNode.gain.setValueAtTime(0, audioContext.currentTime);
  gainNode.gain.linearRampToValueAtTime(1.0, audioContext.currentTime + 0.05);

  isAudioPlaying = true;

  // Set initial waveform mix
  updateAudioParameters();

  console.log('Audio started - Frequency:', mappedFrequency, 'Type: morphing oscillators with pulse wave');
}

function stopAudio() {
  if (!isAudioPlaying) return;

  if (currentShader === 4) {
    stopWaveformAudio();
  } else {
    stopSequenceAudio();
  }

  isAudioPlaying = false;
  console.log('Audio stopped');
  updateAudioControlsUI();
}

function stopWaveformAudio() {
  try {
    // Clear any previously scheduled values to fix play/pause bug
    gainNode.gain.cancelScheduledValues(audioContext.currentTime);

    // Fade out master gain
    gainNode.gain.setValueAtTime(gainNode.gain.value, audioContext.currentTime);
    gainNode.gain.linearRampToValueAtTime(0, audioContext.currentTime + 0.05);

    // Stop all oscillators after fade out
    Object.keys(oscillators).forEach(type => {
      if (oscillators[type]) {
        if (type === 'pulse' && pulseWorkletNode) {
          // AudioWorklet nodes don't have a stop method, disconnect instead
          pulseWorkletNode.disconnect();
          pulseWorkletNode = null;
        } else if (oscillators[type].stop) {
          oscillators[type].stop(audioContext.currentTime + 0.05);
        }
        oscillators[type] = null;
      }
      if (oscillatorGains[type]) {
        oscillatorGains[type] = null;
      }
    });

    isAudioPlaying = false;

    console.log('Audio stopped');

  } catch (error) {
    console.error('Failed to stop waveform audio:', error);
  }
}

function startSequenceAudio(type) {
  if (sequenceContext.active) return;
  const previousType = sequenceContext.type;
  sequenceContext.active = true;
  isAudioPlaying = true;
  sequenceContext.type = type;
  sequenceContext.activeVoices = [];

  if (type === 'staff') {
    setupStaffEffectsChain();
  } else {
    // Set up oscillators
    sequenceContext.osc1 = audioContext.createOscillator();
    sequenceContext.gain1 = audioContext.createGain();
    sequenceContext.osc1.connect(sequenceContext.gain1);
    sequenceContext.gain1.connect(audioContext.destination);
    sequenceContext.gain1.gain.setValueAtTime(0, audioContext.currentTime);
  }

  if (type === 'ticker') {
    sequenceContext.osc2 = audioContext.createOscillator();
    sequenceContext.gain2 = audioContext.createGain();
    sequenceContext.osc2.connect(sequenceContext.gain2);
    sequenceContext.gain2.connect(audioContext.destination);
    sequenceContext.gain2.gain.setValueAtTime(0, audioContext.currentTime);

    sequenceContext.osc1.type = 'triangle'; // Top ticker
    sequenceContext.osc2.type = 'square';   // Bottom ticker
    sequenceContext.osc2.start(audioContext.currentTime);
  } else if (type === 'binary') {
    sequenceContext.osc1.type = 'sine'; // FSK
  } else if (type === 'morse') {
    sequenceContext.osc1.type = 'sine'; // CW
  }

  if (sequenceContext.osc1) {
    sequenceContext.osc1.start(audioContext.currentTime);
  }

  if (
    previousType !== type ||
    (type === 'morse' && sequenceContext.currentNote >= ((morseData && morseData.morse) ? morseData.morse.length : 0))
  ) {
    sequenceContext.currentNote = 0;
  }
  sequenceContext.nextNoteTime = audioContext.currentTime + 0.1;

  scheduleSequenceLoop();
}

function stopSequenceAudio() {
  sequenceContext.active = false;
  clearTimeout(sequenceContext.timerId);

  const t = audioContext.currentTime;
  if (sequenceContext.type === 'staff') {
    sequenceContext.activeVoices.forEach(voice => {
      if (voice.output) {
        voice.output.gain.cancelScheduledValues(t);
        voice.output.gain.setValueAtTime(Math.max(voice.output.gain.value, 0.0001), t);
        voice.output.gain.exponentialRampToValueAtTime(0.0001, t + 0.12);
      }
    });
    if (sequenceContext.tremoloDepth) {
      sequenceContext.tremoloDepth.gain.cancelScheduledValues(t);
      sequenceContext.tremoloDepth.gain.setValueAtTime(sequenceContext.tremoloDepth.gain.value, t);
      sequenceContext.tremoloDepth.gain.linearRampToValueAtTime(0, t + 0.05);
    }
    if (sequenceContext.dryGain) {
      sequenceContext.dryGain.gain.cancelScheduledValues(t);
      sequenceContext.dryGain.gain.setValueAtTime(sequenceContext.dryGain.gain.value, t);
      sequenceContext.dryGain.gain.linearRampToValueAtTime(0, t + 0.08);
    }
    if (sequenceContext.wetGain) {
      sequenceContext.wetGain.gain.cancelScheduledValues(t);
      sequenceContext.wetGain.gain.setValueAtTime(sequenceContext.wetGain.gain.value, t);
      sequenceContext.wetGain.gain.linearRampToValueAtTime(0, t + 0.12);
    }
  } else if (sequenceContext.gain1) {
    sequenceContext.gain1.gain.cancelScheduledValues(t);
    sequenceContext.gain1.gain.setValueAtTime(sequenceContext.gain1.gain.value, t);
    sequenceContext.gain1.gain.linearRampToValueAtTime(0, t + 0.05);
  }
  if (sequenceContext.gain2) {
    sequenceContext.gain2.gain.cancelScheduledValues(t);
    sequenceContext.gain2.gain.setValueAtTime(sequenceContext.gain2.gain.value, t);
    sequenceContext.gain2.gain.linearRampToValueAtTime(0, t + 0.05);
  }

  setTimeout(() => {
    sequenceContext.activeVoices.forEach(voice => {
      voice.oscillators.forEach(osc => {
        try { osc.stop(); } catch (error) { }
        disconnectNode(osc);
      });
      if (voice.noise) {
        try { voice.noise.stop(); } catch (error) { }
        disconnectNode(voice.noise);
      }
      voice.filters.forEach(filter => disconnectNode(filter));
      disconnectNode(voice.output);
    });
    sequenceContext.activeVoices = [];

    if (sequenceContext.tremoloLfo) {
      try { sequenceContext.tremoloLfo.stop(); } catch (error) { }
    }
    ['osc1', 'osc2', 'gain1', 'gain2', 'inputGain', 'dryGain', 'wetGain', 'convolver', 'tremoloGain', 'tremoloLfo', 'tremoloDepth'].forEach(key => {
      disconnectNode(sequenceContext[key]);
      sequenceContext[key] = null;
    });
  }, 100);
}

function scheduleSequenceLoop() {
  if (!sequenceContext.active) return;

  const lookahead = 0.5; // schedule half a second ahead
  const t = audioContext.currentTime;

  while (sequenceContext.active && sequenceContext.nextNoteTime < t + lookahead) {
    if (sequenceContext.type === 'morse') {
      scheduleMorseNote();
    } else if (sequenceContext.type === 'binary') {
      scheduleBinaryNote();
    } else if (sequenceContext.type === 'ticker') {
      scheduleTickerNote();
    } else if (sequenceContext.type === 'staff') {
      scheduleStaffNote();
    }
  }

  if (sequenceContext.active) {
    sequenceContext.timerId = setTimeout(scheduleSequenceLoop, 100);
  }
}

function scheduleMorseNote() {
  const data = morseData.morse;
  if (!data || data.length === 0) {
    sequenceContext.nextNoteTime += 1.0;
    return;
  }

  // Stop at the end of the morse sequence text naturally
  if (sequenceContext.currentNote >= data.length) {
    sequenceContext.nextNoteTime = audioContext.currentTime + 1.0;
    stopAudio();
    return;
  }

  const unitDuration = 0.08; // 80ms per morse unit
  const idx = sequenceContext.currentNote % data.length;
  const bit = data[idx];

  const time = sequenceContext.nextNoteTime;
  const gain = sequenceContext.gain1.gain;
  const osc = sequenceContext.osc1;

  osc.frequency.setValueAtTime(600, time); // 600 Hz CW tone

  if (bit === 1) {
    // Ramp up to avoid clicks
    gain.setValueAtTime(0, time);
    gain.linearRampToValueAtTime(0.5, time + 0.005);
    // Keep sustaining
    gain.setValueAtTime(0.5, time + unitDuration - 0.005);
    gain.linearRampToValueAtTime(0, time + unitDuration);
  } else {
    gain.setValueAtTime(0, time);
  }

  sequenceContext.nextNoteTime += unitDuration;
  sequenceContext.currentNote++;
}

function scheduleBinaryNote() {
  const data = binaryData.binary;
  if (!data || data.length === 0) {
    sequenceContext.nextNoteTime += 1.0;
    return;
  }

  const bitDuration = 0.15; // 150ms per bit (baud rate)
  const idx = sequenceContext.currentNote % data.length;
  const bit = data[idx];

  const time = sequenceContext.nextNoteTime;
  const gain = sequenceContext.gain1.gain;
  const osc = sequenceContext.osc1.frequency;

  // FSK modulation: 400Hz for 0, 800Hz for 1
  const freq = bit === '1' ? 800 : 400;

  // Small envelope for clicks and framing
  gain.setValueAtTime(0, time);
  gain.linearRampToValueAtTime(0.3, time + 0.01);
  osc.setValueAtTime(freq, time);

  gain.setValueAtTime(0.3, time + bitDuration - 0.01);
  gain.linearRampToValueAtTime(0, time + bitDuration);

  sequenceContext.nextNoteTime += bitDuration;
  sequenceContext.currentNote++;

  if (sequenceContext.currentNote % data.length === 0) {
    sequenceContext.nextNoteTime += 1.5; // 1.5s pause before repeating
  }
}

function scheduleTickerNote() {
  // Use ratio to sync two polyrhythmic tick sequences within a total loop duration
  const totalDuration = 4.0;
  const topRepeats = tickerSlider ? parseInt(tickerSlider.value) : 34;
  const countRatio = tickerRatioSlider ? parseInt(tickerRatioSlider.value) : 2;
  const bottomRepeats = Math.max(1, Math.floor(topRepeats / countRatio));

  const time = sequenceContext.nextNoteTime;

  // This will play a tick for whichever stream is active.
  // We'll manage both streams simultaneously in this tick since there's no data array.

  const topInterval = totalDuration / topRepeats;

  // Play top tick
  sequenceContext.osc1.frequency.setValueAtTime(1000, time);
  sequenceContext.osc1.frequency.exponentialRampToValueAtTime(1, time + 0.05);
  sequenceContext.gain1.gain.setValueAtTime(0.5, time);
  sequenceContext.gain1.gain.exponentialRampToValueAtTime(0.01, time + 0.05);

  // Determine if bottom tick should play
  // To avoid complex dual scheduling, just map bottom ticks to when they theoretically hit
  // Given we are moving at `topInterval` steps, bottom hits exactly when:
  if (sequenceContext.currentNote % countRatio === 0) {
    sequenceContext.osc2.frequency.setValueAtTime(300, time);
    sequenceContext.osc2.frequency.exponentialRampToValueAtTime(1, time + 0.05);
    sequenceContext.gain2.gain.setValueAtTime(0.8, time);
    sequenceContext.gain2.gain.exponentialRampToValueAtTime(0.01, time + 0.05);
  }

  sequenceContext.nextNoteTime += topInterval;
  sequenceContext.currentNote++;

  if (sequenceContext.currentNote % topRepeats === 0) {
    sequenceContext.nextNoteTime += 1.0; // 1s pause
  }
}

// Map notes to frequencies
const NOTE_FREQUENCIES = {
  'C4': 261.63, 'C#4': 277.18, 'D4': 293.66, 'D#4': 311.13,
  'E4': 329.63, 'F4': 349.23, 'F#4': 369.99, 'G4': 392.00,
  'G#4': 415.30, 'A4': 440.00, 'A#4': 466.16, 'B4': 493.88,
  'C5': 523.25
};

function registerStaffVoiceCleanup(voice, releaseAt) {
  sequenceContext.activeVoices.push(voice);
  const cleanupDelay = Math.max(0, (releaseAt - audioContext.currentTime) * 1000 + 250);
  window.setTimeout(() => {
    const index = sequenceContext.activeVoices.indexOf(voice);
    if (index >= 0) sequenceContext.activeVoices.splice(index, 1);
    voice.oscillators.forEach(osc => {
      try { osc.stop(); } catch (error) { }
      disconnectNode(osc);
    });
    if (voice.noise) {
      try { voice.noise.stop(); } catch (error) { }
      disconnectNode(voice.noise);
    }
    voice.filters.forEach(filter => disconnectNode(filter));
    disconnectNode(voice.output);
  }, cleanupDelay);
}

function triggerPianoVoice(freq, time, actualDuration) {
  const output = audioContext.createGain();
  const bodyFilter = audioContext.createBiquadFilter();
  const toneFilter = audioContext.createBiquadFilter();
  const cleanupNodes = [bodyFilter, toneFilter];
  const voiceDuration = Math.max(0.7, actualDuration * 1.5);

  bodyFilter.type = 'lowpass';
  bodyFilter.frequency.setValueAtTime(Math.min(5200, freq * 10), time);
  bodyFilter.frequency.exponentialRampToValueAtTime(Math.max(1200, freq * 3), time + 0.22);
  toneFilter.type = 'highpass';
  toneFilter.frequency.setValueAtTime(90, time);

  output.gain.setValueAtTime(0.0001, time);
  output.gain.linearRampToValueAtTime(0.38, time + 0.006);
  output.gain.exponentialRampToValueAtTime(0.12, time + 0.09);
  output.gain.exponentialRampToValueAtTime(0.0001, time + voiceDuration);

  const partialSpecs = [
    { type: 'sine', ratio: 1, gain: 0.42, detune: 0 },
    { type: 'triangle', ratio: 2, gain: 0.13, detune: 3 },
    { type: 'triangle', ratio: 3, gain: 0.07, detune: -4 }
  ];

  const oscillators = partialSpecs.map(spec => {
    const osc = audioContext.createOscillator();
    const partialGain = audioContext.createGain();
    cleanupNodes.push(partialGain);
    osc.type = spec.type;
    osc.frequency.setValueAtTime(freq * spec.ratio, time);
    osc.detune.setValueAtTime(spec.detune, time);
    partialGain.gain.setValueAtTime(spec.gain, time);
    partialGain.gain.exponentialRampToValueAtTime(0.0001, time + voiceDuration);
    osc.connect(partialGain);
    partialGain.connect(bodyFilter);
    osc.start(time);
    osc.stop(time + voiceDuration + 0.05);
    return osc;
  });

  let noise = null;
  if (noiseBuffer) {
    noise = audioContext.createBufferSource();
    noise.buffer = noiseBuffer;
    const noiseFilter = audioContext.createBiquadFilter();
    const noiseGain = audioContext.createGain();
    cleanupNodes.push(noiseFilter, noiseGain);
    noiseFilter.type = 'bandpass';
    noiseFilter.frequency.setValueAtTime(Math.min(6000, freq * 12), time);
    noiseFilter.Q.value = 0.9;
    noiseGain.gain.setValueAtTime(0.09, time);
    noiseGain.gain.exponentialRampToValueAtTime(0.0001, time + 0.04);
    noise.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(bodyFilter);
    noise.start(time);
    noise.stop(time + 0.06);
  }

  bodyFilter.connect(toneFilter);
  toneFilter.connect(output);
  output.connect(sequenceContext.inputGain);

  registerStaffVoiceCleanup({
    oscillators,
    noise,
    filters: cleanupNodes,
    output
  }, time + voiceDuration);
}

function triggerSimpleStaffVoice(freq, time, actualDuration, instrument) {
  const osc = audioContext.createOscillator();
  const toneGain = audioContext.createGain();
  const filter = audioContext.createBiquadFilter();
  const releaseAt = time + Math.max(0.18, actualDuration);

  osc.type = instrument === 'synth' ? 'sawtooth' : 'sine';
  osc.frequency.setValueAtTime(freq, time);

  if (instrument === 'synth') {
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(Math.min(4200, freq * 8), time);
    toneGain.gain.setValueAtTime(0.0001, time);
    toneGain.gain.linearRampToValueAtTime(0.24, time + 0.03);
    toneGain.gain.exponentialRampToValueAtTime(0.0001, releaseAt);
  } else {
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(freq * 2.5, time);
    filter.Q.value = 2.2;
    toneGain.gain.setValueAtTime(0.0001, time);
    toneGain.gain.linearRampToValueAtTime(0.5, time + 0.008);
    toneGain.gain.exponentialRampToValueAtTime(0.0001, time + Math.min(0.28, actualDuration + 0.05));
  }

  osc.connect(toneGain);
  toneGain.connect(filter);
  filter.connect(sequenceContext.inputGain);
  osc.start(time);
  osc.stop(releaseAt + 0.05);

  registerStaffVoiceCleanup({
    oscillators: [osc],
    noise: null,
    filters: [filter],
    output: toneGain
  }, releaseAt);
}

function scheduleStaffNote() {
  const data = currentStaffNotes;
  if (!data || data.length === 0) {
    sequenceContext.nextNoteTime += 1.0;
    return;
  }

  const tempo = staffTempoSlider ? parseInt(staffTempoSlider.value) : 120;
  // tempo is quarter notes per minute. So 1 quarter note = 60 / tempo seconds
  const quarterNoteDuration = 60 / tempo;

  const idx = sequenceContext.currentNote % data.length;
  const noteData = data[idx];
  const time = sequenceContext.nextNoteTime;
  const actualDuration = noteData.duration * quarterNoteDuration;
  const freq = NOTE_FREQUENCIES[noteData.note] || 440;
  const instrument = staffInstrumentSelect ? staffInstrumentSelect.value : 'piano';
  updateStaffEffects(time);

  if (instrument === 'piano') {
    triggerPianoVoice(freq, time, actualDuration);
  } else {
    triggerSimpleStaffVoice(freq, time, actualDuration, instrument);
  }

  sequenceContext.nextNoteTime += actualDuration;
  sequenceContext.currentNote++;
}


// Simple single oscillator approach like the original

// URL parameter management
function getUrlParameters() {
  const params = new URLSearchParams(window.location.search);
  return {
    style: normalizeStyleValue(params.get('style') || 'solid'),
    colorMode: normalizeColorModeValue(params.get('colorMode') || DEFAULT_COLOR_MODE),

    // Binary parameters
    binaryText: params.get('binaryText') || 'RPI',

    // Numeric parameters
    numericValue: params.get('numericValue') || '3.1415926535897932384626433832795028841971693993751058209749445923078164062862089986280348253421170679',
    numericMode: params.get('numericMode') || 'dotmatrix',
    circlesGradientVariant: Math.max(1, Math.min(3, parseInt(params.get('circlesGradientVariant')) || 1)),
    gradientVariant: Math.max(1, Math.min(2, parseInt(params.get('gradientVariant')) || 1)),
    gridVariant: Math.max(1, Math.min(3, parseInt(params.get('gridVariant')) || 1)),

    // Reference pattern parameters
    linesVariant: Math.max(1, Math.min(2, parseInt(params.get('linesVariant')) || 2)),
    pointConnectVariant: Math.max(1, Math.min(2, parseInt(params.get('pointConnectVariant')) || 1)),
    neuralNetworkHiddenLayers: Math.max(1, Math.min(5, parseInt(params.get('neuralNetworkHiddenLayers')) || 1)),
    triangleGridVariant: Math.max(1, Math.min(3, parseInt(params.get('triangleGridVariant')) || 2)),
    trianglesVariant: Math.max(1, Math.min(2, parseInt(params.get('trianglesVariant')) || 1)),

    // Ruler parameters
    rulerRepeats: parseInt(params.get('rulerRepeats')) || 10,
    rulerUnits: parseInt(params.get('rulerUnits')) || 4,

    // Ticker parameters
    tickerRepeats: parseInt(params.get('tickerRepeats')) || 34,
    tickerRatio: parseInt(params.get('tickerRatio')) || 2,
    tickerWidthRatio: parseInt(params.get('tickerWidthRatio')) || 2,

    // Waveform parameters
    waveformType: parseFloat(params.get('waveformType')) || 0,
    waveformFrequency: parseInt(params.get('waveformFrequency')) || 24,
    waveformSpeed: parseFloat(params.get('waveformSpeed')) || 0.7,

    waveformEnvelope: params.get('waveformEnvelope') || 'false',
    waveformEnvelopeType: params.get('waveformEnvelopeType') || 'sine',
    waveformEnvelopeWaves: typeof normalizeWaveformEnvelopeWaves === 'function'
      ? normalizeWaveformEnvelopeWaves(params.get('waveformEnvelopeWaves'))
      : Math.max(1, Math.min(10, Math.round(parseFloat(params.get('waveformEnvelopeWaves'))) || 1)),
    waveformEnvelopeCenter: typeof normalizeWaveformEnvelopeCenter === 'function'
      ? normalizeWaveformEnvelopeCenter(params.get('waveformEnvelopeCenter'))
      : Math.max(-0.5, Math.min(0.5, parseFloat(params.get('waveformEnvelopeCenter')) || 0)),
    waveformEnvelopeBipolar: params.get('waveformEnvelopeBipolar') || 'false',

    // Circles parameters
    circlesMode: params.get('circlesMode') || 'packing',
    circlesFill: params.get('circlesFill') || 'stroke',
    circlesDensity: parseInt(params.get('circlesDensity')) || 50,
    circlesSizeVariation: parseInt(params.get('circlesSizeVariation')) || 0,
    circlesOverlap: parseInt(params.get('circlesOverlap')) || 0,

    // Grid circles parameters
    circlesRows: parseInt(params.get('circlesRows')) || 2,
    circlesGridDensity: parseInt(params.get('circlesGridDensity')) || 100,
    circlesSizeVariationY: parseInt(params.get('circlesSizeVariationY')) || 0,
    circlesSizeVariationX: parseInt(params.get('circlesSizeVariationX')) || 0,
    circlesGridOverlap: parseInt(params.get('circlesGridOverlap')) || 0,
    circlesLayout: params.get('circlesLayout') || 'straight',

    // Truss parameters
    trussFamily: normalizeTrussFamilyValue(params.get('trussFamily') || 'flat'),
    trussSegments: parseInt(params.get('trussSegments')) || 15,
    trussThickness: parseFloat(params.get('trussThickness')) || 2,

    // Staff parameters
    staffNotes: params.get('staffNotes') || '',
    staffTempo: parseInt(params.get('staffTempo')) || 120,
    staffInstrument: params.get('staffInstrument') || 'piano',
    staffNoteShape: normalizeMusicNoteShape(params.get('staffNoteShape') || 'circle'),
    staffReverb: params.get('staffReverb') === 'true',
    staffTremolo: params.get('staffTremolo') === 'true',

    // Pulse parameters
    pulseText: params.get('pulseText') || 'RPI',
    pulseIntensity: parseFloat(params.get('pulseIntensity')) || 5,

    // Graph parameters
    graphText: params.get('graphText') || 'RPI',
    graphText2: params.get('graphText2') || '',
    graphText3: params.get('graphText3') || '',
    graphText4: params.get('graphText4') || '',
    graphText5: params.get('graphText5') || '',
    graphMulti: params.get('graphMulti') === 'true',
    graphScale: Math.max(GRAPH_SCALE_MIN, parseInt(params.get('graphScale')) || GRAPH_SCALE_DEFAULT),

    // Additional parameters
    morseText: params.get('morseText') || 'RPI'
  };
}

function updateUrlParameters() {
  const params = new URLSearchParams();

  // Only add parameters that differ from defaults to keep URLs clean
  if (styleSelect && styleSelect.value !== 'solid') {
    params.set('style', styleSelect.value);
  }

  if (colorModeSelect && colorModeSelect.value !== DEFAULT_COLOR_MODE) {
    params.set('colorMode', colorModeSelect.value);
  }

  // Add style-specific parameters only when that style is active
  if (styleSelect && styleSelect.value === 'binary') {
    if (binaryInput && binaryInput.value !== 'RPI') {
      params.set('binaryText', binaryInput.value);
    }
  }

  if (styleSelect && styleSelect.value === 'morse') {
    if (morseInput && morseInput.value !== 'RPI') {
      params.set('morseText', morseInput.value);
    }
  }

  if (styleSelect && styleSelect.value === 'numeric') {
    if (numericInput && numericInput.value !== '3.1415926535897932384626433832795028841971693993751058209749445923078164062862089986280348253421170679') {
      params.set('numericValue', numericInput.value);
    }
    if (numericModeSelect && numericModeSelect.value !== 'dotmatrix') {
      params.set('numericMode', numericModeSelect.value);
    }
  }

  if (styleSelect && styleSelect.value === 'circles-gradient') {
    if (circlesGradientVariantSlider && parseInt(circlesGradientVariantSlider.value, 10) !== 1) {
      params.set('circlesGradientVariant', circlesGradientVariantSlider.value);
    }
  }

  if (styleSelect && styleSelect.value === 'gradient') {
    if (gradientVariantSlider && parseInt(gradientVariantSlider.value, 10) !== 1) {
      params.set('gradientVariant', gradientVariantSlider.value);
    }
  }

  if (styleSelect && styleSelect.value === 'grid') {
    if (gridVariantSlider && parseInt(gridVariantSlider.value, 10) !== 1) {
      params.set('gridVariant', gridVariantSlider.value);
    }
  }

  if (styleSelect && styleSelect.value === 'lines') {
    if (linesVariantSlider && parseInt(linesVariantSlider.value, 10) !== 2) {
      params.set('linesVariant', linesVariantSlider.value);
    }
  }

  if (styleSelect && styleSelect.value === 'point-connect') {
    if (pointConnectVariantSlider && parseInt(pointConnectVariantSlider.value, 10) !== 1) {
      params.set('pointConnectVariant', pointConnectVariantSlider.value);
    }
  }

  if (styleSelect && styleSelect.value === 'neural-network') {
    if (neuralNetworkHiddenLayersSlider && parseInt(neuralNetworkHiddenLayersSlider.value, 10) !== 1) {
      params.set('neuralNetworkHiddenLayers', neuralNetworkHiddenLayersSlider.value);
    }
  }

  if (styleSelect && styleSelect.value === 'triangle-grid') {
    if (triangleGridVariantSlider && parseInt(triangleGridVariantSlider.value, 10) !== 2) {
      params.set('triangleGridVariant', triangleGridVariantSlider.value);
    }
  }

  if (styleSelect && styleSelect.value === 'triangles') {
    if (trianglesVariantSlider && parseInt(trianglesVariantSlider.value, 10) !== 1) {
      params.set('trianglesVariant', trianglesVariantSlider.value);
    }
  }

  if (styleSelect && styleSelect.value === 'truss') {
    if (trussFamilySelect && trussFamilySelect.value !== 'flat') {
      params.set('trussFamily', trussFamilySelect.value);
    }
    if (trussSegmentsSlider && parseInt(trussSegmentsSlider.value) !== 15) {
      params.set('trussSegments', trussSegmentsSlider.value);
    }
    if (trussThicknessSlider && parseFloat(trussThicknessSlider.value) !== 2) {
      params.set('trussThickness', trussThicknessSlider.value);
    }
  }

  if (styleSelect && styleSelect.value === 'music') {
    // staffNotes removed
    if (staffTempoSlider && parseInt(staffTempoSlider.value) !== 120) {
      params.set('staffTempo', staffTempoSlider.value);
    }
    if (staffInstrumentSelect && staffInstrumentSelect.value !== 'piano') {
      params.set('staffInstrument', staffInstrumentSelect.value);
    }
    if (staffNoteShapeSelect && staffNoteShapeSelect.value !== 'circle') {
      params.set('staffNoteShape', staffNoteShapeSelect.value);
    }
    if (staffReverbToggle && staffReverbToggle.checked) {
      params.set('staffReverb', 'true');
    }
    if (staffTremoloToggle && staffTremoloToggle.checked) {
      params.set('staffTremolo', 'true');
    }
  }

  if (styleSelect && styleSelect.value === 'graph') {
    if (graphInput && graphInput.value !== 'RPI') {
      params.set('graphText', graphInput.value);
    }
    if (graphMultiToggle && graphMultiToggle.checked) {
      params.set('graphMulti', 'true');
    }
    if (graphInput2 && graphInput2.value.trim()) {
      params.set('graphText2', graphInput2.value);
    }
    if (graphInput3 && graphInput3.value.trim()) {
      params.set('graphText3', graphInput3.value);
    }
    if (graphInput4 && graphInput4.value.trim()) {
      params.set('graphText4', graphInput4.value);
    }
    if (graphInput5 && graphInput5.value.trim()) {
      params.set('graphText5', graphInput5.value);
    }
    if (graphScaleSlider && parseInt(graphScaleSlider.value, 10) !== GRAPH_SCALE_DEFAULT) {
      params.set('graphScale', graphScaleSlider.value);
    }
  }

  if (styleSelect && styleSelect.value === 'ruler') {
    if (rulerRepeatsSlider && parseInt(rulerRepeatsSlider.value) !== 10) {
      params.set('rulerRepeats', rulerRepeatsSlider.value);
    }
    if (rulerUnitsSlider && parseInt(rulerUnitsSlider.value) !== 4) {
      params.set('rulerUnits', rulerUnitsSlider.value);
    }
  }

  if (styleSelect && styleSelect.value === 'ticker') {
    if (tickerSlider && parseInt(tickerSlider.value) !== 34) {
      params.set('tickerRepeats', tickerSlider.value);
    }
    if (tickerRatioSlider && parseInt(tickerRatioSlider.value) !== 2) {
      params.set('tickerRatio', tickerRatioSlider.value);
    }
    if (tickerWidthRatioSlider && parseInt(tickerWidthRatioSlider.value) !== 2) {
      params.set('tickerWidthRatio', tickerWidthRatioSlider.value);
    }
  }

  if (styleSelect && styleSelect.value === 'waveform') {
    if (waveformTypeSlider && parseFloat(waveformTypeSlider.value) !== 0) {
      params.set('waveformType', waveformTypeSlider.value);
    }
    if (waveformFrequencySlider && parseInt(waveformFrequencySlider.value) !== 24) {
      params.set('waveformFrequency', waveformFrequencySlider.value);
    }
    if (waveformSpeedSlider && parseFloat(waveformSpeedSlider.value) !== 0.7) {
      params.set('waveformSpeed', waveformSpeedSlider.value);
    }

    if (waveformEnvelopeToggle && waveformEnvelopeToggle.checked) {
      params.set('waveformEnvelope', 'true');
    }
    if (waveformEnvelopeType && waveformEnvelopeType.value !== 'sine') {
      params.set('waveformEnvelopeType', waveformEnvelopeType.value);
    }
    const normalizedEnvelopeWaves = waveformEnvelopeWavesSlider
      ? (typeof normalizeWaveformEnvelopeWaves === 'function'
        ? normalizeWaveformEnvelopeWaves(waveformEnvelopeWavesSlider.value)
        : Math.max(1, Math.min(10, Math.round(parseFloat(waveformEnvelopeWavesSlider.value)) || 1)))
      : 1;
    if (waveformEnvelopeWavesSlider && normalizedEnvelopeWaves !== 1) {
      params.set('waveformEnvelopeWaves', normalizedEnvelopeWaves);
    }
    const normalizedEnvelopeCenter = waveformEnvelopeCenterSlider
      ? (typeof normalizeWaveformEnvelopeCenter === 'function'
        ? normalizeWaveformEnvelopeCenter(waveformEnvelopeCenterSlider.value)
        : Math.max(-0.5, Math.min(0.5, parseFloat(waveformEnvelopeCenterSlider.value) || 0)))
      : 0;
    if (waveformEnvelopeCenterSlider && normalizedEnvelopeCenter !== 0) {
      params.set('waveformEnvelopeCenter', normalizedEnvelopeCenter);
    }
    if (waveformEnvelopeBipolarToggle && waveformEnvelopeBipolarToggle.checked) {
      params.set('waveformEnvelopeBipolar', 'true');
    }
  }

  if (styleSelect && styleSelect.value === 'circles') {
    if (circlesModeSelect && circlesModeSelect.value !== 'packing') {
      params.set('circlesMode', circlesModeSelect.value);
    }
    if (circlesFillSelect && circlesFillSelect.value !== 'stroke') {
      params.set('circlesFill', circlesFillSelect.value);
    }

    if (circlesModeSelect && circlesModeSelect.value === 'packing') {
      if (circlesDensitySlider && parseInt(circlesDensitySlider.value) !== 50) {
        params.set('circlesDensity', circlesDensitySlider.value);
      }
      if (circlesSizeVariationSlider && parseInt(circlesSizeVariationSlider.value) !== 0) {
        params.set('circlesSizeVariation', circlesSizeVariationSlider.value);
      }
      if (circlesOverlapSlider && parseInt(circlesOverlapSlider.value) !== 0) {
        params.set('circlesOverlap', circlesOverlapSlider.value);
      }
    } else {
      if (circlesRowsSlider && parseInt(circlesRowsSlider.value) !== 2) {
        params.set('circlesRows', circlesRowsSlider.value);
      }
      if (circlesGridDensitySlider && parseInt(circlesGridDensitySlider.value) !== 100) {
        params.set('circlesGridDensity', circlesGridDensitySlider.value);
      }
      if (circlesSizeVariationYSlider && parseInt(circlesSizeVariationYSlider.value) !== 0) {
        params.set('circlesSizeVariationY', circlesSizeVariationYSlider.value);
      }
      if (circlesSizeVariationXSlider && parseInt(circlesSizeVariationXSlider.value) !== 0) {
        params.set('circlesSizeVariationX', circlesSizeVariationXSlider.value);
      }
      if (circlesGridOverlapSlider && parseInt(circlesGridOverlapSlider.value) !== 0) {
        params.set('circlesGridOverlap', circlesGridOverlapSlider.value);
      }
      if (circlesLayoutSelect && circlesLayoutSelect.value !== 'straight') {
        params.set('circlesLayout', circlesLayoutSelect.value);
      }
    }
  }

  // Update URL without reloading the page
  const newUrl = params.toString() ? `${window.location.pathname}?${params.toString()}` : window.location.pathname;
  window.history.replaceState({}, '', newUrl);
}

function applyUrlParameters() {
  const params = getUrlParameters();

  // Apply style
  if (styleSelect) {
    styleSelect.value = normalizeStyleValue(params.style);
  }

  // Apply color mode
  if (colorModeSelect) {
    colorModeSelect.value = params.colorMode;
  }
  applyColorMode(params.colorMode);
  syncAllCustomSelects();

  // Apply binary parameters
  if (binaryInput) {
    binaryInput.value = params.binaryText;
  }

  // Apply morse parameters
  if (morseInput) {
    morseInput.value = params.morseText;
    updateMorseData(params.morseText);
  }

  // Apply numeric parameters
  if (numericInput) {
    numericInput.value = params.numericValue;
    updateNumericData(params.numericValue);
  }
  if (numericModeSelect) {
    numericModeSelect.value = params.numericMode;
  }

  if (circlesGradientVariantSlider) {
    circlesGradientVariantSlider.value = params.circlesGradientVariant;
    updateCirclesGradientVariantDisplay();
  }
  if (gradientVariantSlider) {
    gradientVariantSlider.value = params.gradientVariant;
    updateGradientVariantDisplay();
  }
  if (gridVariantSlider) {
    gridVariantSlider.value = params.gridVariant;
    updateGridVariantDisplay();
  }

  if (linesVariantSlider) {
    linesVariantSlider.value = params.linesVariant;
    updateLinesVariantDisplay();
  }
  if (pointConnectVariantSlider) {
    pointConnectVariantSlider.value = params.pointConnectVariant;
    updatePointConnectVariantDisplay();
  }
  if (neuralNetworkHiddenLayersSlider) {
    neuralNetworkHiddenLayersSlider.value = params.neuralNetworkHiddenLayers;
    updateNeuralNetworkHiddenLayersDisplay();
  }
  if (triangleGridVariantSlider) {
    triangleGridVariantSlider.value = params.triangleGridVariant;
    updateTriangleGridVariantDisplay();
  }
  if (trianglesVariantSlider) {
    trianglesVariantSlider.value = params.trianglesVariant;
    updateTrianglesVariantDisplay();
  }

  // Apply truss parameters
  if (trussFamilySelect) {
    trussFamilySelect.value = normalizeTrussFamilyValue(params.trussFamily);
  }
  if (trussSegmentsSlider) {
    trussSegmentsSlider.value = params.trussSegments;
  }
  if (trussThicknessSlider) {
    trussThicknessSlider.value = params.trussThickness;
  }

  // Apply staff parameters
  /*
  if (params.staffNotes) {
    currentStaffNotes = params.staffNotes.split(',').map(s => {
      const parts = s.split('_');
      return { note: parts[0], duration: parseFloat(parts[1]) };
    });
  } else {
    currentStaffNotes = [];
  }
  */
  if (staffTempoSlider) {
    staffTempoSlider.value = params.staffTempo;
    if (staffTempoDisplay) staffTempoDisplay.textContent = params.staffTempo;
  }
  if (staffInstrumentSelect) {
    staffInstrumentSelect.value = params.staffInstrument;
  }
  if (staffNoteShapeSelect) {
    staffNoteShapeSelect.value = params.staffNoteShape;
  }
  if (staffReverbToggle) {
    staffReverbToggle.checked = params.staffReverb;
  }
  if (staffTremoloToggle) {
    staffTremoloToggle.checked = params.staffTremolo;
  }

  // Apply pulse parameters
  if (pulseInput) {
    pulseInput.value = params.pulseText;
  }
  if (pulseIntensitySlider) {
    pulseIntensitySlider.value = params.pulseIntensity;
  }

  // Apply graph parameters
  if (graphInput) {
    graphInput.value = params.graphText;
  }
  if (graphInput2) {
    graphInput2.value = params.graphText2;
  }
  if (graphInput3) {
    graphInput3.value = params.graphText3;
  }
  if (graphInput4) {
    graphInput4.value = params.graphText4;
  }
  if (graphInput5) {
    graphInput5.value = params.graphText5;
  }
  if (graphMultiToggle) {
    graphMultiToggle.checked = params.graphMulti;
  }
  if (graphMultiInputs) {
    graphMultiInputs.style.display = params.graphMulti ? 'block' : 'none';
  }
  if (graphScaleSlider) {
    graphScaleSlider.value = Math.max(GRAPH_SCALE_MIN, params.graphScale);
  }
  if (graphScaleDisplay && graphScaleSlider) {
    graphScaleDisplay.textContent = graphScaleSlider.value;
  }

  // Apply ruler parameters
  if (rulerRepeatsSlider) {
    rulerRepeatsSlider.value = params.rulerRepeats;
  }
  if (rulerUnitsSlider) {
    rulerUnitsSlider.value = params.rulerUnits;
  }

  // Apply ticker parameters
  if (tickerSlider) {
    tickerSlider.value = params.tickerRepeats;
  }
  if (tickerRatioSlider) {
    tickerRatioSlider.value = params.tickerRatio;
  }
  if (tickerWidthRatioSlider) {
    tickerWidthRatioSlider.value = params.tickerWidthRatio;
  }

  // Apply waveform parameters
  if (waveformTypeSlider) {
    waveformTypeSlider.value = params.waveformType;
  }
  if (waveformFrequencySlider) {
    waveformFrequencySlider.value = params.waveformFrequency;
  }
  if (waveformSpeedSlider) {
    waveformSpeedSlider.value = params.waveformSpeed;
  }
  if (waveformEnvelopeToggle) {
    waveformEnvelopeToggle.checked = params.waveformEnvelope === 'true';
  }
  if (envelopeSettingsGroup) {
    envelopeSettingsGroup.style.display = params.waveformEnvelope === 'true' ? 'block' : 'none';
  }
  if (waveformEnvelopeType) {
    waveformEnvelopeType.value = params.waveformEnvelopeType;
  }
  if (waveformEnvelopeWavesSlider) {
    waveformEnvelopeWavesSlider.value = params.waveformEnvelopeWaves;
  }
  if (waveformEnvelopeWavesDisplay) {
    waveformEnvelopeWavesDisplay.textContent = params.waveformEnvelopeWaves;
  }
  if (waveformEnvelopeCenterSlider) {
    waveformEnvelopeCenterSlider.value = params.waveformEnvelopeCenter;
  }
  if (waveformEnvelopeCenterDisplay) {
    waveformEnvelopeCenterDisplay.textContent = params.waveformEnvelopeCenter;
  }
  if (waveformEnvelopeBipolarToggle) {
    waveformEnvelopeBipolarToggle.checked = params.waveformEnvelopeBipolar === 'true';
  }

  // Apply circles parameters
  if (circlesModeSelect) {
    circlesModeSelect.value = params.circlesMode;
  }
  if (circlesFillSelect) {
    circlesFillSelect.value = params.circlesFill;
  }
  if (circlesDensitySlider) {
    circlesDensitySlider.value = params.circlesDensity;
  }
  if (circlesSizeVariationSlider) {
    circlesSizeVariationSlider.value = params.circlesSizeVariation;
  }
  if (circlesOverlapSlider) {
    circlesOverlapSlider.value = params.circlesOverlap;
  }

  // Apply grid circles parameters
  if (circlesRowsSlider) {
    circlesRowsSlider.value = params.circlesRows;
  }
  if (circlesGridDensitySlider) {
    circlesGridDensitySlider.value = params.circlesGridDensity;
  }
  if (circlesSizeVariationYSlider) {
    circlesSizeVariationYSlider.value = params.circlesSizeVariationY;
  }
  if (circlesSizeVariationXSlider) {
    circlesSizeVariationXSlider.value = params.circlesSizeVariationX;
  }
  if (circlesGridOverlapSlider) {
    circlesGridOverlapSlider.value = params.circlesGridOverlap;
  }
  if (circlesLayoutSelect) {
    circlesLayoutSelect.value = params.circlesLayout;
  }

  // Update all displays and trigger style change
  updateAllDisplays();
  handleStyleChange();
  handleCirclesModeChange();

  // Update binary data
  updateBinaryData(params.binaryText);
}

function updateAllDisplays() {
  // Update all slider displays
  updateRulerRepeatsDisplay();
  updateRulerUnitsDisplay();
  updateTickerDisplay();
  updateTickerRatioDisplay();
  updateTickerWidthRatioDisplay();
  updateWaveformTypeDisplay();
  updateWaveformFrequencyDisplay();
  updateWaveformSpeedDisplay();
  updateCirclesDensityDisplay();
  updateCirclesSizeVariationDisplay();
  updateCirclesOverlapDisplay();
  updateCirclesRowsDisplay();
  updateCirclesGridDensityDisplay();
  updateCirclesSizeVariationYDisplay();
  updateCirclesSizeVariationXDisplay();
  updateCirclesGridOverlapDisplay();
  updateNeuralNetworkHiddenLayersDisplay();
}

function updateAudioParameters() {
  if (!isAudioPlaying || currentShader !== 4) return;

  try {
    const frequency = parseInt(waveformFrequencySlider.value);
    const waveType = parseFloat(waveformTypeSlider.value);

    // Map frequency from 10-100 to C1-C5 (32.70Hz to 523.25Hz)
    const minFreq = 32.70; // C1
    const maxFreq = 523.25; // C5
    const normalizedFreq = (frequency - 10) / 90; // Normalize 10-100 to 0-1
    const mappedFrequency = minFreq + (normalizedFreq * (maxFreq - minFreq));

    // Update frequency on all active oscillators
    Object.values(oscillators).forEach((osc, index) => {
      if (osc) {
        const oscType = Object.keys(oscillators)[index];
        if (oscType === 'pulse' && pulseWorkletNode) {
          // Send frequency update to pulse worklet
          pulseWorkletNode.port.postMessage({
            type: 'frequency',
            value: mappedFrequency
          });
        } else if (osc.frequency) {
          osc.frequency.exponentialRampToValueAtTime(mappedFrequency, audioContext.currentTime + 0.1);
        }
      }
    });

    // Calculate mix ratios for smooth morphing with proper pulse wave integration
    let sineGain = 0;
    let sawGain = 0;
    let squareGain = 0;
    let pulseGain = 0;

    // Use smooth crossfading between waveforms
    if (waveType <= 1.0) {
      // Sine to sawtooth (0.0 to 1.0)
      sineGain = Math.max(0, 1.0 - waveType);
      sawGain = Math.min(1.0, waveType);
    } else if (waveType <= 2.0) {
      // Sawtooth to square (1.0 to 2.0)
      const t = waveType - 1.0;
      sawGain = Math.max(0, 1.0 - t);
      squareGain = Math.min(1.0, t);
    } else {
      // Square to pulse (2.0 to 3.0)
      const t = waveType - 2.0;
      squareGain = Math.max(0, 1.0 - t);
      pulseGain = Math.min(1.0, t);

      // Update pulse width based on slider position
      // Map from 20% to 80% duty cycle as slider moves from 2.0 to 3.0
      const pulseWidth = 0.2 + t * 0.6;

      // Send pulse width update to worklet
      if (pulseWorkletNode) {
        pulseWorkletNode.port.postMessage({
          type: 'pulseWidth',
          value: pulseWidth
        });
      }
    }

    // Normalize gains to prevent volume changes
    const totalGain = sineGain + sawGain + squareGain + pulseGain;
    if (totalGain > 0) {
      sineGain /= totalGain;
      sawGain /= totalGain;
      squareGain /= totalGain;
      pulseGain /= totalGain;
    }

    // Apply master volume scaling
    const masterVolume = 0.1;
    sineGain *= masterVolume;
    sawGain *= masterVolume;
    squareGain *= masterVolume;
    pulseGain *= masterVolume;

    // Use smooth ramp time for gentle transitions
    const rampTime = 0.05;
    const time = audioContext.currentTime;

    // Use setTargetAtTime which cleanly and safely transitions from the current computed value
    if (oscillatorGains.sine) oscillatorGains.sine.gain.setTargetAtTime(sineGain, time, rampTime / 3);
    if (oscillatorGains.sawtooth) oscillatorGains.sawtooth.gain.setTargetAtTime(sawGain, time, rampTime / 3);
    if (oscillatorGains.square) oscillatorGains.square.gain.setTargetAtTime(squareGain, time, rampTime / 3);
    if (oscillatorGains.pulse) oscillatorGains.pulse.gain.setTargetAtTime(pulseGain, time, rampTime / 3);

  } catch (error) {
    console.error('Failed to update audio parameters:', error);
  }
}

let resizeTimeout;
function windowResized() {
  clearTimeout(resizeTimeout);
  resizeTimeout = setTimeout(() => {
    syncSidebarToggleState();
    const container = document.getElementById('p5-container');
    if (container) {
      resizeCanvas(container.offsetWidth, container.offsetHeight);
    } else {
      resizeCanvas(windowWidth, windowHeight);
    }
    updateEasterEggHotspotBounds();
    resizeEasterEggCanvas();
  }, 100);
}

// Frame rate limiting for performance
let lastFrameTime = 0;
const TARGET_FPS = 60;
const FRAME_INTERVAL = 1000 / TARGET_FPS;

function draw() {
  // Limit frame rate to prevent excessive computation
  const currentTime = millis();
  const deltaTime = currentTime - lastFrameTime;
  if (deltaTime < FRAME_INTERVAL) {
    return;
  }
  lastFrameTime = currentTime;

  if (isPlaying) {
    if (typeof window.animationTime === 'undefined') {
      window.animationTime = 0;
    }
    window.animationTime += deltaTime / 1000.0;
  }

  // Get current color scheme
  const colorScheme = colors[currentColorMode];

  // Keep the canvas transparent so the mark sits directly on the themed workspace.
  clear();

  // Use exact 250px reference dimensions
  const currentWidth = REFERENCE_WIDTH;
  const logoHeight = 111.76; // Exact height from 250px reference

  // Reset shader for regular drawing
  resetShader();



  // Draw the SVG logo
  push();
  translate(-width / 2, -height / 2); // Convert to screen coordinates for WEBGL
  translate(width / 2, height / 2);

  // Scale the logo appropriately
  scale(LOGO_SCALE);

  // Viewport View Transformation (Zoom & Pan)
  translate(panOffset.x, panOffset.y);
  scale(zoomLevel);

  // Center the logo
  translate(-currentWidth / 2, LOGO_VERTICAL_OFFSET);

  // Draw the actual SVG paths (excluding bar) with current foreground color
  if (colorScheme) {
    const fgColor = color(colorScheme.fg);
    fill(fgColor);
  } else {
    fill(0); // Fallback to black
  }
  noStroke();

  drawSVGPath(paths.r);
  drawSVGPath(paths.p);
  drawSVGPath(paths.i);

  pop();

  // Draw bottom bar
  drawBottomBar(currentWidth);

  if (isAnimated && currentTime - lastHeaderPreviewUpdateTime >= 120) {
    updateHeaderBrandPreview(true);
  }
}

function drawBottomBar(currentWidth) {
  // Use the exact same coordinate system and positioning as the logo
  push();
  translate(-width / 2, -height / 2); // Convert to screen coordinates for WEBGL
  translate(width / 2, height / 2);

  // Scale the same as logo
  scale(LOGO_SCALE);

  // Viewport View Transformation
  translate(panOffset.x, panOffset.y);
  scale(zoomLevel);

  // Center the same as logo
  translate(-currentWidth / 2, LOGO_VERTICAL_OFFSET);

  // Position the bar to match 250px reference exactly
  translate(0, 132.911); // Match exact bar Y position from 250px reference

  // Calculate bar dimensions to match 250px reference exactly
  const exactBarWidth = REFERENCE_WIDTH; // Exact width from 250px reference
  const rectHeight = 18; // Exact height from 250px reference
  const barStartX = 0; // Exact X position from 250px reference

  // Get current foreground color
  const colorScheme = colors[currentColorMode];
  const fgColor = colorScheme ? color(colorScheme.fg) : color(0);

  if (drawEasterEggRunInBar(exactBarWidth, rectHeight)) {
    pop();
    return;
  }

  // Always draw the bar - solid, ruler, binary, or ticker
  if (currentShader === 0) {
    // Solid mode - draw with current foreground color and corner details
    resetShader();
    fill(fgColor);
    noStroke();
    rectMode(CORNER);

    // Draw rectangle with 45-degree corner cuts on all four corners
    const cornerSize = 1.5;

    beginShape();
    // Start from top-left corner (cut)
    vertex(barStartX + cornerSize, 0);
    vertex(barStartX + exactBarWidth - cornerSize, 0); // Top edge
    vertex(barStartX + exactBarWidth, cornerSize); // Top-right corner cut
    vertex(barStartX + exactBarWidth, rectHeight - cornerSize); // Right edge
    vertex(barStartX + exactBarWidth - cornerSize, rectHeight); // Bottom-right corner cut
    vertex(barStartX + cornerSize, rectHeight); // Bottom edge
    vertex(barStartX, rectHeight - cornerSize); // Bottom-left corner cut
    vertex(barStartX, cornerSize); // Left edge to top-left corner cut
    endShape(CLOSE);

  } else if (currentShader === 1) {
    // Ruler mode - metric ruler pattern with fixed width ticks
    resetShader();
    fill(fgColor);
    noStroke();

    const repeats = parseInt(rulerRepeatsSlider.value);
    const units = parseInt(rulerUnitsSlider.value);

    // Calculate total number of ticks needed (including major ticks)
    const totalTicks = repeats * units + 1; // +1 for the final major tick

    // Calculate tick width so that tick width = gap width
    // Total space = totalTicks * tickWidth + (totalTicks - 1) * gapWidth
    // Since tickWidth = gapWidth, total space = totalTicks * tickWidth + (totalTicks - 1) * tickWidth
    // Total space = tickWidth * (2 * totalTicks - 1)
    const tickWidth = exactBarWidth / (2 * totalTicks - 1);
    const gapWidth = tickWidth; // Equal to tick width
    const tickSpacing = tickWidth + gapWidth;

    // Draw all ticks
    for (let i = 0; i < totalTicks; i++) {
      const tickX = barStartX + i * tickSpacing;

      // Determine tick height based on position
      let tickHeight;

      if (i === 0 || i === totalTicks - 1) {
        // Start and end ticks are full height
        tickHeight = rectHeight;
      } else if (i % units === 0) {
        // Major ticks at unit boundaries are full height
        tickHeight = rectHeight;
      } else {
        // Minor ticks vary by position within unit
        const positionInUnit = i % units;

        if (units === 10) {
          // Metric system (10 units)
          if (positionInUnit === 5) {
            tickHeight = rectHeight * 0.75; // Medium tick at 5
          } else if (positionInUnit % 2 === 0) {
            tickHeight = rectHeight * 0.5; // Small tick at even numbers
          } else {
            tickHeight = rectHeight * 0.25; // Smallest tick at odd numbers
          }
        } else {
          // For other unit counts, use a simpler pattern
          if (positionInUnit === Math.floor(units / 2)) {
            tickHeight = rectHeight * 0.75; // Medium tick at middle
          } else {
            tickHeight = rectHeight * 0.5; // Small ticks elsewhere
          }
        }
      }

      // Draw tick from bottom up
      const tickY = rectHeight - tickHeight;
      rect(tickX, tickY, tickWidth, tickHeight);
    }

  } else if (currentShader === 2) {
    // Ticker mode - aligned top and bottom ticks with proper ratios
    resetShader();
    fill(fgColor);
    noStroke();

    // Split the bar into top and bottom halves
    const halfHeight = rectHeight / 2;

    // Get ratio from sliders
    const ratio = parseInt(tickerRatioSlider.value);
    const widthRatio = parseInt(tickerWidthRatioSlider.value);

    // Calculate tick counts
    const bottomTicks = parseInt(tickerSlider.value);
    const topTicks = bottomTicks * ratio;

    // Calculate spacing - divide available width by number of ticks
    const tickSpacing = exactBarWidth / topTicks;
    const topTickWidth = tickSpacing / 2; // Half spacing for tick, half for gap
    const bottomTickWidth = topTickWidth * widthRatio;

    // Draw top row - every position
    for (let i = 0; i < topTicks; i++) {
      const x = barStartX + i * tickSpacing;
      rect(x, 0, topTickWidth, halfHeight);
    }

    // Draw bottom row - only at positions that align with the ratio
    for (let i = 0; i < bottomTicks; i++) {
      const topIndex = i * ratio;
      const x = barStartX + topIndex * tickSpacing;
      rect(x, halfHeight, bottomTickWidth, halfHeight);
    }

  } else if (currentShader === 3) {
    // Binary mode - 3-row grid: 0 = center bar, 1 = top and bottom bars
    resetShader();
    fill(fgColor);
    noStroke();

    // Get the binary data for the current text (default "RPI")
    const text = binaryInput.value || "RPI";
    const validBinaryData = textToBinary(text);

    // Safety check to prevent division by zero
    if (validBinaryData.length === 0) {
      return; // Skip drawing if no data
    }

    // No gaps between bits - they should touch
    const actualBitWidth = exactBarWidth / validBinaryData.length;

    // Define the 3-row grid
    const rowHeight = rectHeight / 3;
    const topRowY = 0;
    const middleRowY = rowHeight;
    const bottomRowY = rowHeight * 2;

    for (let i = 0; i < validBinaryData.length; i++) {
      const x = barStartX + i * actualBitWidth;

      if (validBinaryData[i] === 1) {
        // 1 = double bars at top and bottom rows
        rect(x, topRowY, actualBitWidth, rowHeight);
        rect(x, bottomRowY, actualBitWidth, rowHeight);
      } else {
        // 0 = single bar in middle row (vertically centered)
        rect(x, middleRowY, actualBitWidth, rowHeight);
      }
    }
  } else if (currentShader === 4) {
    // Waveform mode - draw a procedural waveform within the bar area
    resetShader();

    const frequency = parseInt(waveformFrequencySlider.value);
    const waveType = parseFloat(waveformTypeSlider.value);
    const speed = parseFloat(waveformSpeedSlider.value);
    const time = typeof window.animationTime !== 'undefined' ? window.animationTime : millis() / 1000.0;

    // Calculate optimal number of points based on frequency and width for ultra-smooth rendering
    // Use much higher point density for high frequencies to prevent aliasing
    const basePoints = Math.max(300, exactBarWidth * 3);
    const frequencyMultiplier = Math.max(1, frequency / 10);
    const points = Math.ceil(basePoints * frequencyMultiplier);

    // Helper function for smooth waveform generation (restored from original working version)
    function generateWaveValue(phase, type) {
      // Normalize phase to [0, 1] range more carefully
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

    // Use fill instead of stroke for smoother rendering at high frequencies
    fill(fgColor);
    noStroke();

    // Draw as a filled polygon for ultra-smooth appearance
    beginShape();

    // Start from bottom-left corner
    vertex(barStartX, rectHeight);

    // Generate the waveform curve
    for (let i = 0; i <= points; i++) {
      const xPortion = i / points;
      const x = xPortion * exactBarWidth;

      // Standard rolling phase calculation (horizontal movement only)
      let rawPhase = (xPortion * frequency) - (time * speed);

      // Fix tiny floating point inaccuracies
      rawPhase = Math.round(rawPhase * 1000000) / 1000000;

      // Generate smooth waveform value
      let wave = generateWaveValue(rawPhase, waveType);

      const applyEnvelope = waveformEnvelopeToggle && waveformEnvelopeToggle.checked;
      const envType = waveformEnvelopeType ? waveformEnvelopeType.value : 'sine';
      const envWaves = waveformEnvelopeWavesSlider
        ? (typeof normalizeWaveformEnvelopeWaves === 'function'
          ? normalizeWaveformEnvelopeWaves(waveformEnvelopeWavesSlider.value)
          : Math.max(1, Math.min(10, Math.round(parseFloat(waveformEnvelopeWavesSlider.value)) || 1)))
        : 1;
      const envCenter = waveformEnvelopeCenterSlider ? parseFloat(waveformEnvelopeCenterSlider.value) : 0;
      const bipolar = waveformEnvelopeBipolarToggle && waveformEnvelopeBipolarToggle.checked;
      if (typeof applyWaveformEnvelope === 'function') {
        wave = applyWaveformEnvelope(wave, {
          applyEnvelope,
          envType,
          envWaves,
          bipolar,
          xPortion
        });
      }

      const normalizedY = typeof mapWaveformToBarYFraction === 'function'
        ? mapWaveformToBarYFraction(wave, envCenter)
        : (1.0 - Math.max(0, Math.min(1, wave)));
      const y = rectHeight * normalizedY;

      vertex(barStartX + x, y);
    }

    // Complete the polygon by going to bottom-right corner
    vertex(barStartX + exactBarWidth, rectHeight);

    endShape(CLOSE);
  } else if (currentShader === 5) {
    // Circles mode - draw circle patterns within the bar area
    resetShader();

    const selectedMode = circlesModeSelect ? circlesModeSelect.value : 'packing';
    const fillStyle = circlesFillSelect.value;

    if (fillStyle === 'fill') {
      fill(fgColor);
      noStroke();
    } else {
      noFill();
      stroke(fgColor);
      strokeWeight(1);
    }

    if (selectedMode === 'grid') {
      // Grid mode - parameters will be read inside drawCirclePattern
      drawCirclePattern(null, barStartX, 0, exactBarWidth, rectHeight, 0, 0, 0);
    } else {
      // Packing mode
      const density = parseInt(circlesDensitySlider.value);
      const sizeVariation = parseInt(circlesSizeVariationSlider.value);
      const overlapAmount = parseInt(circlesOverlapSlider.value);

      drawCirclePattern(null, barStartX, 0, exactBarWidth, rectHeight, density, sizeVariation, overlapAmount);
    }
  } else if (currentShader === 6) {
    // Numeric mode - get visualization mode
    resetShader();

    const numericString = numericInput.value || "3.1415926535897932384626433832795028841971693993751058209749445923078164062862089986280348253421170679";
    const digits = parseNumericString(numericString);
    const mode = numericModeSelect ? numericModeSelect.value : 'dotmatrix';

    if (digits.length > 0) {
      const digitWidth = exactBarWidth / digits.length;
      const barY = 0; // We're already positioned at the correct Y coordinate for the bar

      if (mode === 'height') {
        // Height Encoding mode - digit height bars with inner border
        fill(fgColor);
        noStroke();
        rectMode(CORNER);

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
          const barYPos = rectHeight - barHeight; // Position from bottom

          rect(x, barYPos, digitWidth - 1, barHeight);
        }


      } else if (mode === 'dotmatrix') {
        // Dot Matrix mode - dots distributed evenly across the full height of the bar
        fill(fgColor);
        noStroke();
        rectMode(CORNER);

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

            rect(dotX, dotY, dotWidth, dotHeight, dotHeight / 2);
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
              rect(dotX, dotY, dotWidth, dotHeight, dotHeight / 2);
            }
          }
        }
      }
    }
  } else if (currentShader === 7) {
    // Morse code mode
    resetShader();
    fill(fgColor);
    noStroke();
    rectMode(CORNER);

    const text = morseInput ? morseInput.value || "RPI" : "RPI";
    const validMorseData = textToMorse(text);

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
            rect(runStartX, 0, currentRunLength * actualBitWidth, rectHeight);
            currentRunLength = 0;
          }
        }
      }
      if (currentRunLength > 0) {
        rect(runStartX, 0, currentRunLength * actualBitWidth, rectHeight);
      }
    }
  } else if (currentShader === 8) {
    // Runway pattern sourced from the Flying Club bar asset.
    resetShader();
    drawRunwayBarPattern(null, barStartX, 0, exactBarWidth, rectHeight, fgColor);
  } else if (currentShader === 9) {
    // Truss / Geometric pattern
    resetShader();
    const trussGeometry = createTrussPatternGeometry({
      barStartX,
      barY: 0,
      exactBarWidth,
      barHeight: rectHeight,
      segments: trussSegmentsSlider ? trussSegmentsSlider.value : 15,
      thickness: trussThicknessSlider ? trussThicknessSlider.value : 2,
      family: trussFamilySelect ? trussFamilySelect.value : 'flat'
    });

    noFill();
    stroke(fgColor);
    strokeWeight(trussGeometry.thickness);
    strokeCap(SQUARE);
    strokeJoin(MITER);

    for (let i = 0; i < trussGeometry.lines.length; i++) {
      const lineSegment = trussGeometry.lines[i];
      line(lineSegment.x1, lineSegment.y1, lineSegment.x2, lineSegment.y2);
    }
  } else if (currentShader === 10) {
    // Music notation pattern
    resetShader();
    const notesData = typeof currentStaffNotes !== 'undefined' ? currentStaffNotes : [];
    const renderData = buildMusicBarRenderData(notesData, {
      barStartX,
      exactBarWidth,
      rectTop: 0,
      rectHeight,
      thickness: 1,
      noteShape: getSelectedMusicNoteShape()
    });

    stroke(fgColor);
    strokeWeight(renderData.lineThickness);
    renderData.staffLines.forEach(segment => line(segment.x1, segment.y1, segment.x2, segment.y2));

    renderData.notes.forEach(noteRender => {
      drawMusicHeadP5('circle', noteRender.noteX, noteRender.noteY, noteRender.rx, noteRender.ry, true, fgColor);
    });

  } else if (currentShader === 13) {
    // Lines pattern
    resetShader();
    noStroke();
    fill(fgColor);

    const geometry = createLinesPatternGeometry({
      barStartX,
      barY: 0,
      exactBarWidth,
      barHeight: rectHeight,
      variant: linesVariantSlider ? linesVariantSlider.value : 2
    });

    for (let i = 0; i < geometry.rects.length; i++) {
      const rectData = geometry.rects[i];
      rect(rectData.x, rectData.y, rectData.width, rectData.height);
    }
  } else if (currentShader === 14) {
    // Point Connect pattern
    resetShader();
    noFill();
    const geometry = createPointConnectPatternGeometry({
      barStartX,
      barY: 0,
      exactBarWidth,
      barHeight: rectHeight,
      variant: pointConnectVariantSlider ? pointConnectVariantSlider.value : 1
    });

    stroke(fgColor);
    strokeWeight(geometry.thickness);
    strokeCap(SQUARE);
    strokeJoin(MITER);

    for (let i = 0; i < geometry.lines.length; i++) {
      const lineSegment = geometry.lines[i];
      line(lineSegment.x1, lineSegment.y1, lineSegment.x2, lineSegment.y2);
    }
  } else if (currentShader === 23) {
    // Neural network pattern
    resetShader();
    const geometry = createNeuralNetworkPatternGeometry({
      barStartX,
      barY: 0,
      exactBarWidth,
      barHeight: rectHeight,
      hiddenLayers: neuralNetworkHiddenLayersSlider ? neuralNetworkHiddenLayersSlider.value : 1
    });

    noFill();
    stroke(fgColor);
    strokeWeight(geometry.thickness);
    strokeCap(ROUND);
    strokeJoin(ROUND);

    for (let i = 0; i < geometry.lines.length; i++) {
      const lineSegment = geometry.lines[i];
      line(lineSegment.x1, lineSegment.y1, lineSegment.x2, lineSegment.y2);
    }

    noStroke();
    fill(fgColor);
    for (let i = 0; i < geometry.nodes.length; i++) {
      const node = geometry.nodes[i];
      circle(node.x, node.y, node.r * 2);
    }
  } else if (currentShader === 15) {
    // Triangle grid pattern
    resetShader();
    noFill();
    const geometry = createTriangleGridPatternGeometry({
      barStartX,
      barY: 0,
      exactBarWidth,
      barHeight: rectHeight,
      variant: triangleGridVariantSlider ? triangleGridVariantSlider.value : 2
    });

    stroke(fgColor);
    strokeWeight(geometry.thickness);
    strokeCap(SQUARE);
    strokeJoin(MITER);

    for (let i = 0; i < geometry.lines.length; i++) {
      const lineSegment = geometry.lines[i];
      line(lineSegment.x1, lineSegment.y1, lineSegment.x2, lineSegment.y2);
    }
  } else if (currentShader === 16) {
    // Circles gradient pattern
    resetShader();
    noStroke();
    fill(fgColor);
    const geometry = createCirclesGradientPatternGeometry({
      barStartX,
      barY: 0,
      exactBarWidth,
      barHeight: rectHeight,
      variant: circlesGradientVariantSlider ? circlesGradientVariantSlider.value : 1
    });

    for (let i = 0; i < geometry.rects.length; i++) {
      const rectData = geometry.rects[i];
      rect(rectData.x, rectData.y, rectData.width, rectData.height);
    }
    for (let i = 0; i < geometry.circles.length; i++) {
      const circleData = geometry.circles[i];
      circle(circleData.cx, circleData.cy, circleData.r * 2);
    }
  } else if (currentShader === 17) {
    // Gradient pattern
    resetShader();
    noStroke();
    fill(fgColor);
    const geometry = createGradientPatternGeometry({
      barStartX,
      barY: 0,
      exactBarWidth,
      barHeight: rectHeight,
      variant: gradientVariantSlider ? gradientVariantSlider.value : 1
    });

    for (let i = 0; i < geometry.rects.length; i++) {
      const rectData = geometry.rects[i];
      rect(rectData.x, rectData.y, rectData.width, rectData.height, rectData.radius);
    }
  } else if (currentShader === 18) {
    // Grid pattern
    resetShader();
    noFill();
    const geometry = createGridPatternGeometry({
      barStartX,
      barY: 0,
      exactBarWidth,
      barHeight: rectHeight,
      variant: gridVariantSlider ? gridVariantSlider.value : 1
    });

    stroke(fgColor);
    strokeWeight(geometry.thickness);
    strokeCap(SQUARE);
    strokeJoin(MITER);

    for (let i = 0; i < geometry.lines.length; i++) {
      const lineSegment = geometry.lines[i];
      line(lineSegment.x1, lineSegment.y1, lineSegment.x2, lineSegment.y2);
    }
  } else if (currentShader === 19) {
    // Triangles pattern
    resetShader();
    noStroke();
    fill(fgColor);
    const geometry = createTrianglesPatternGeometry({
      barStartX,
      barY: 0,
      exactBarWidth,
      barHeight: rectHeight,
      variant: trianglesVariantSlider ? trianglesVariantSlider.value : 1
    });

    for (let i = 0; i < geometry.polygons.length; i++) {
      beginShape();
      for (let j = 0; j < geometry.polygons[i].length; j++) {
        const point = geometry.polygons[i][j];
        vertex(point.x, point.y);
      }
      endShape(CLOSE);
    }
  } else if (currentShader === 20) {
    // Fibonacci sequence pattern
    resetShader();
    noStroke();
    fill(fgColor);
    const geometry = createFibonacciPatternGeometry({
      barStartX,
      barY: 0,
      exactBarWidth,
      barHeight: rectHeight
    });

    for (let i = 0; i < geometry.rects.length; i++) {
      const rectData = geometry.rects[i];
      rect(rectData.x, rectData.y, rectData.width, rectData.height);
    }
  } else if (currentShader === 21) {
    // Union pattern
    resetShader();
    noStroke();
    fill(fgColor);
    const geometry = createUnionPatternGeometry({
      barStartX,
      barY: 0,
      exactBarWidth,
      barHeight: rectHeight
    });

    for (let i = 0; i < geometry.topRects.length; i++) {
      const rectData = geometry.topRects[i];
      rect(rectData.x, rectData.y, rectData.width, rectData.height);
    }

    for (let i = 0; i < geometry.lowerPaths.length; i++) {
      beginShape();
      for (let j = 0; j < geometry.lowerPaths[i].length; j++) {
        const point = geometry.lowerPaths[i][j];
        vertex(point.x, point.y);
      }
      endShape(CLOSE);
    }
  } else if (currentShader === 22) {
    // Wave Quantum pattern
    resetShader();
    noFill();
    const geometry = createWaveQuantumPatternGeometry({
      barStartX,
      barY: 0,
      exactBarWidth,
      barHeight: rectHeight
    });

    stroke(fgColor);
    strokeWeight(geometry.thickness);
    strokeCap(ROUND);
    strokeJoin(ROUND);

    for (let i = 0; i < geometry.paths.length; i++) {
      beginShape();
      for (let j = 0; j < geometry.paths[i].length; j++) {
        const point = geometry.paths[i][j];
        vertex(point.x, point.y);
      }
      endShape();
    }
  } else if (currentShader === 11) {
    // Pulse / Centerline pattern
    resetShader();
    const text = pulseInput ? pulseInput.value || "RPI" : "RPI";
    const intensity = parseFloat(pulseIntensitySlider ? pulseIntensitySlider.value : 5) / 10.0;

    noStroke();
    fill(fgColor);

    const centerY = 0 + rectHeight / 2;
    rect(barStartX, centerY - 0.5, exactBarWidth, 1);

    if (text.length > 0) {
      const spacing = exactBarWidth / text.length;
      const pulseWidth = Math.max(1, spacing * 0.5);

      for (let i = 0; i < text.length; i++) {
        const charCode = text.charCodeAt(i);
        const normalizedHeight = 0.1 + ((charCode % 15) / 14.0) * 0.9;
        const h = rectHeight * normalizedHeight * intensity;

        const x = barStartX + i * spacing + (spacing - pulseWidth) / 2;
        const y = centerY - h / 2;

        rect(x, y, pulseWidth, h);
      }
    }
  } else if (currentShader === 12) {
    // Data Graph / Continuous line graph
    resetShader();
    const streamTexts = getGraphStreamTexts();
    const scaleFactor = getGraphScaleFactor();
    const { seriesList, minValue, maxValue } = buildGraphSeriesData(streamTexts);

    noFill();
    const baseColor = color(fgColor);

    for (let streamIndex = 0; streamIndex < seriesList.length; streamIndex++) {
      const series = seriesList[streamIndex];
      if (!series || series.length < 2) continue;

      const alpha = seriesList.length > 1 ? Math.max(80, 255 - streamIndex * 30) : 255;
      baseColor.setAlpha(alpha);
      stroke(baseColor);
      strokeWeight(seriesList.length > 1 ? 1.6 : 2.2);
      strokeJoin(ROUND);

      const steps = series.length - 1;
      beginShape();
      for (let i = 0; i < series.length; i++) {
        const normalized = (series[i] - minValue) / (maxValue - minValue);
        const x = barStartX + (steps === 0 ? 0 : (i / steps) * exactBarWidth);
        const y = rectHeight - normalized * rectHeight * scaleFactor;
        vertex(x, y);
      }
      endShape();
    }
  } else {
    // Fallback to solid with current foreground color
    resetShader();
    fill(fgColor);
    noStroke();
    rectMode(CORNER);
    rect(barStartX, 0, exactBarWidth, rectHeight);
  }

  pop();
}

// --- Phase 2c: Playback & Viewport Logic ---

function togglePlayback() {
  isPlaying = !isPlaying;

  if (isPlaying) {
    loop();
  } else {
    // Snap animation phase to mathematical zero-crossing for symmetry
    if (currentShader === 4 && waveformSpeedSlider) {
      const speed = parseFloat(waveformSpeedSlider.value);
      if (speed > 0) {
        // Round to nearest integer cycle to ensure consistent pause state
        const currentCycles = window.animationTime * speed;
        window.animationTime = Math.round(currentCycles) / speed;
      }
    }

    noLoop();
    redraw(); // Force draw of the perfectly snapped frame
  }

  syncMotionToggleState();
  requestUpdate();
}

function clampPanOffset() {
  let minX = 125 * zoomLevel - width / (2 * LOGO_SCALE);
  let maxX = width / (2 * LOGO_SCALE) - 125 * zoomLevel;
  if (minX > maxX) {
    let temp = minX; minX = maxX; maxX = temp;
  }

  let minY = 72 * zoomLevel - height / (2 * LOGO_SCALE);
  let maxY = height / (2 * LOGO_SCALE) - 79 * zoomLevel;
  if (minY > maxY) {
    let temp = minY; minY = maxY; maxY = temp;
  }

  panOffset.x = constrain(panOffset.x, minX, maxX);
  panOffset.y = constrain(panOffset.y, minY, maxY);
}

function zoomCanvas(amount) {
  zoomLevel += amount;
  zoomLevel = constrain(zoomLevel, MIN_ZOOM_LEVEL, MAX_ZOOM_LEVEL);

  clampPanOffset();
  updateEasterEggHotspotBounds();

  if (zoomLevelDisplay && document.activeElement !== zoomLevelDisplay) {
    zoomLevelDisplay.value = zoomLevelToDisplayPercent(zoomLevel) + '%';
  }

  if (!isPlaying) redraw();
}

function setPanMode(nextActive) {
  isPanningMode = !!nextActive;
  if (panBtn) {
    panBtn.classList.toggle('is-active', isPanningMode);
    document.body.style.cursor = isPanningMode ? 'move' : 'default';
  }

  if (isPanningMode) {
    cancelEasterEggHold(false);
    setEasterEggHintState(false);
  } else {
    updateEasterEggHotspotBounds();
  }
}

function togglePanMode() {
  setPanMode(!isPanningMode);
}

function handlePanModeOutsidePointerDown(event) {
  if (!isPanningMode) return;
  if (panBtn && panBtn.contains(event.target)) return;
  if (canvasViewport && canvasViewport.contains(event.target)) return;

  setPanMode(false);
}

function mouseDragged() {
  if (isPanningMode) {
    panOffset.x += movedX;
    panOffset.y += movedY;
    clampPanOffset();
    updateEasterEggHotspotBounds();
    if (!isPlaying) redraw();
    return false; // Prevent default browser drag
  }
}

// --- Custom Dropdown Logic ---
function setupCustomDropdowns() {
  const selects = document.querySelectorAll('.control-select');

  selects.forEach(select => {
    // Check if already initialized to avoid duplicates
    if (select.parentNode.classList.contains('custom-select-wrapper')) return;

    // Create wrapper
    const wrapper = document.createElement('div');
    wrapper.className = 'custom-select-wrapper';
    select.parentNode.insertBefore(wrapper, select);
    wrapper.appendChild(select);

    // Create trigger
    const trigger = document.createElement('div');
    trigger.className = 'custom-select-trigger';
    const selectedOption = select.options[select.selectedIndex];
    trigger.textContent = selectedOption ? selectedOption.textContent : 'Select...';
    wrapper.appendChild(trigger);

    // Create options list
    const optionsList = document.createElement('div');
    optionsList.className = 'custom-select-options';
    wrapper.appendChild(optionsList);

    const fadeTop = document.createElement('div');
    fadeTop.className = 'custom-select-scroll-fade custom-select-scroll-fade-top';
    optionsList.appendChild(fadeTop);

    const optionsViewport = document.createElement('div');
    optionsViewport.className = 'custom-select-options-scroll';
    optionsList.appendChild(optionsViewport);

    const fadeBottom = document.createElement('div');
    fadeBottom.className = 'custom-select-scroll-fade custom-select-scroll-fade-bottom';
    optionsList.appendChild(fadeBottom);

    const updateScrollFades = () => {
      const canScroll = optionsViewport.scrollHeight > optionsViewport.clientHeight + 1;
      const hasScrollTop = canScroll && optionsViewport.scrollTop > 1;
      const hasScrollBottom = canScroll &&
        optionsViewport.scrollTop + optionsViewport.clientHeight < optionsViewport.scrollHeight - 1;

      optionsList.classList.toggle('has-scroll-top', hasScrollTop);
      optionsList.classList.toggle('has-scroll-bottom', hasScrollBottom);
    };

    const appendCustomOption = (option) => {
      const customOption = document.createElement('div');
      customOption.className = 'custom-option';
      customOption.textContent = option.textContent;
      customOption.dataset.value = option.value;

      if (option.selected) {
        customOption.classList.add('selected');
      }

      customOption.addEventListener('click', (e) => {
        e.stopPropagation();

        // Update native select
        select.value = option.value;
        select.dispatchEvent(new Event('change'));

        // Update UI
        trigger.textContent = option.textContent;
        wrapper.querySelectorAll('.custom-option').forEach(opt => opt.classList.remove('selected'));
        customOption.classList.add('selected');
        wrapper.classList.remove('open');
        updateScrollFades();
      });

      optionsViewport.appendChild(customOption);
    };

    // Populate options, preserving optgroup headings where present.
    Array.from(select.children).forEach(child => {
      if (child.tagName === 'OPTGROUP') {
        const groupLabel = document.createElement('div');
        groupLabel.className = 'custom-option-group-label';
        groupLabel.textContent = child.label;
        optionsViewport.appendChild(groupLabel);

        Array.from(child.children).forEach(option => appendCustomOption(option));
        return;
      }

      if (child.tagName === 'OPTION') {
        appendCustomOption(child);
      }
    });

    // Toggle dropdown
    trigger.addEventListener('click', (e) => {
      e.stopPropagation();
      // Close all other dropdowns
      document.querySelectorAll('.custom-select-wrapper').forEach(w => {
        if (w !== wrapper) w.classList.remove('open');
      });
      wrapper.classList.toggle('open');
      requestAnimationFrame(updateScrollFades);
    });

    // Listen for external updates to the select (e.g. from keyboard shortcuts)
    select.addEventListener('change', () => {
      const newSelected = select.options[select.selectedIndex];
      syncCustomSelectUI(select, wrapper, select.value, newSelected ? newSelected.textContent : select.value);
      requestAnimationFrame(updateScrollFades);
    });

    optionsViewport.addEventListener('scroll', updateScrollFades);
    requestAnimationFrame(updateScrollFades);
  });

  // click outside to close dropdowns
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.custom-select-wrapper')) {
      document.querySelectorAll('.custom-select-wrapper').forEach(w => w.classList.remove('open'));
    }
  });
}

// Ensure custom dropdowns are initialized when DOM is ready
document.addEventListener('DOMContentLoaded', setupCustomDropdowns);
