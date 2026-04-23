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
const MAX_LOGO_SCALE = 1.5;
const REFERENCE_LOGO_HEIGHT = 111.76;
const REFERENCE_BAR_Y = 132.911;
const REFERENCE_BAR_HEIGHT = 18;
const REFERENCE_TOTAL_HEIGHT = REFERENCE_BAR_Y + REFERENCE_BAR_HEIGHT;
const RESPONSIVE_LOGO_WIDTH_RATIO = 0.72;
const RESPONSIVE_LOGO_HEIGHT_RATIO = 0.48;
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
let lunarGroup;
let lunarAudioBtn;
let staffAudioBtn;
let rulerGroup;
let rulerRepeatsSlider;
let rulerRepeatsDisplay;
let rulerUnitsSlider;
let rulerUnitsDisplay;
let rulerMotionToggle;
let rulerReverseToggle;
let rulerSpeedSlider;
let rulerSpeedDisplay;
let tickerSlider;
let tickerDisplay;
let tickerGroup;
let tickerRatioSlider;
let tickerRatioDisplay;
let tickerWidthRatioSlider;
let tickerWidthRatioDisplay;
let tickerMotionToggle;
let tickerReverseToggle;
let tickerSpeedSlider;
let tickerSpeedDisplay;
let tickerAudioBtn;
let waveformGroup;
let waveformTypeSlider;
let waveformTypeDisplay;
let waveformFrequencySlider;
let waveformFrequencyDisplay;
let waveformSpeedSlider;
let waveformSpeedDisplay;
let waveformMotionToggle;
let waveformReverseToggle;
let waveformAudioBtn;
let waveformEnvelopeToggle;
let envelopeSettingsGroup;
let waveformEnvelopeType;
let waveformEnvelopeWavesSlider;
let waveformEnvelopeWavesDisplay;
let waveformEnvelopeCenterSlider;
let waveformEnvelopeCenterDisplay;
let waveformEnvelopeBipolarToggle;
let circlesGroup;
let circlesDensitySlider;
let circlesDensityDisplay;
let circlesSizeVariationSlider;
let circlesSizeVariationDisplay;
let circlesFillSelect;
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
const sliderValueEditorConfigs = [];

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
let saveButtonLabel;
let saveMenu;
let savePngButton;
let saveSvgButton;
let saveLoopGifButton;
let styleSelectLabel;
let colorModeSelectLabel;
let reportProblemLabel;
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
const ARTEMIS_II_SPLASHDOWN_AT = Date.parse('2026-04-10T20:07:00-04:00');
const ARTEMIS_II_AUDIO_SOURCE = 'assets/audio/artemis-ii-liftoff.mp3';
const ARTEMIS_CREDIT_LINKS = {
  reidWiseman: 'https://news.rpi.edu/2026/04/13/engineers-who-reached-moon-how-rpi-became-launchpad-stars',
  rpiEngineers: 'https://news.rpi.edu/2026/03/31/meet-rpi-engineers-guiding-artemis-ii-moon-and-back'
};
const DEFAULT_SAVE_MENU_COPY = {
  button: 'Download Asset',
  png: {
    label: 'PNG',
    description: 'Best for slides, docs, and sharing'
  },
  svg: {
    label: 'SVG',
    description: 'Best for resizing without losing quality'
  },
  gif: {
    label: 'GIF',
    description: 'Best for animated slides and screens'
  }
};
const MISSION_CONTROL_SAVE_MENU_COPY = {
  button: 'Learn About RPI x Artemis',
  png: {
    label: "Reid Wiseman '97",
    description: 'Commander'
  },
  svg: {
    label: "Maeve Marshall '23, M.Eng. '24",
    description: 'GNC Engineer'
  },
  gif: {
    label: "Paul McKee '17, MS '18, Ph.D. '23",
    description: 'Orion Optical Navigation Engineer'
  }
};
const DEFAULT_INTERFACE_COPY = {
  styleLabel: 'BAR STYLE',
  colorLabel: 'COLOR THEME',
  reportProblem: 'Report a Problem'
};
const MISSION_CONTROL_INTERFACE_COPY = {
  styleLabel: 'SIGNAL',
  colorLabel: 'DISPLAY MODE',
  reportProblem: 'Report Anomaly'
};
let lunarCounterRoot = null;
let lunarCounterToggle = null;
let lunarCounterDetail = null;
let lunarCounterDays = null;
let lunarCounterHours = null;
let lunarCounterMinutes = null;
let lunarCounterSeconds = null;
let lunarCounterInterval = 0;
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
let activeAudioPreviewType = null;
let hasShownAudioHintToast = false;
let artemisMissionAudio = null;

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
  : ['black', 'white', 'red', 'blue', 'gold', 'silver', 'gray', 'lunar'];
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
const loopingGifUtils = typeof window !== 'undefined' ? window.loopingGifUtils || null : null;
const getLoopingGifFramePlan = loopingGifUtils && typeof loopingGifUtils.getLoopingGifFramePlan === 'function'
  ? loopingGifUtils.getLoopingGifFramePlan
  : null;
const getLoopingAnimationState = loopingGifUtils && typeof loopingGifUtils.getLoopingAnimationState === 'function'
  ? loopingGifUtils.getLoopingAnimationState
  : null;
const normalizeLoopSpeed = loopingGifUtils && typeof loopingGifUtils.normalizeLoopSpeed === 'function'
  ? loopingGifUtils.normalizeLoopSpeed
  : function fallbackNormalizeLoopSpeed(style, value) {
    const defaultSpeed = style === 'waveform' ? 0.7 : 1;
    const numericValue = parseFloat(value);
    if (!Number.isFinite(numericValue)) {
      return defaultSpeed;
    }
    return Math.max(0.2, Math.min(5, numericValue));
  };

let currentColorMode = DEFAULT_COLOR_MODE;
let lastNonLunarColorMode = DEFAULT_COLOR_MODE;
const colors = {
  lunar: { bg: '#05070a', fg: '#f4f7fb' },
  black: { bg: '#ffffff', fg: '#000000' },
  white: { bg: '#000000', fg: '#ffffff' },
  red: { bg: '#ffffff', fg: '#d6001c' },
  blue: { bg: '#ffffff', fg: '#0081CE' },
  gold: { bg: '#fffaf0', fg: '#CDAC38' },
  silver: { bg: '#11161d', fg: '#E1EDF5' },
  gray: { bg: '#151b21', fg: '#B9CCD8' }
};

function padCounterValue(value, digits) {
  return String(Math.max(0, Math.floor(value) || 0)).padStart(digits, '0');
}

function updateLunarSplashdownCounter(now = Date.now()) {
  if (!lunarCounterRoot || Number.isNaN(ARTEMIS_II_SPLASHDOWN_AT)) return;

  const elapsedSeconds = Math.max(0, Math.floor((now - ARTEMIS_II_SPLASHDOWN_AT) / 1000));
  const days = Math.floor(elapsedSeconds / 86400);
  const hours = Math.floor((elapsedSeconds % 86400) / 3600);
  const minutes = Math.floor((elapsedSeconds % 3600) / 60);
  const seconds = elapsedSeconds % 60;

  if (lunarCounterDays) lunarCounterDays.textContent = padCounterValue(days, 3);
  if (lunarCounterHours) lunarCounterHours.textContent = padCounterValue(hours, 2);
  if (lunarCounterMinutes) lunarCounterMinutes.textContent = padCounterValue(minutes, 2);
  if (lunarCounterSeconds) lunarCounterSeconds.textContent = padCounterValue(seconds, 2);

  lunarCounterRoot.setAttribute(
    'aria-label',
    `Time since Artemis II splashdown: ${days} days, ${hours} hours, ${minutes} minutes, ${seconds} seconds`
  );
  if (lunarCounterToggle) {
    lunarCounterToggle.setAttribute(
      'aria-label',
      `Show Artemis II splashdown details. Elapsed time: ${days} days, ${hours} hours, ${minutes} minutes, ${seconds} seconds`
    );
  }
}

function setupLunarSplashdownCounter() {
  lunarCounterRoot = document.getElementById('lunar-splashdown-counter');
  lunarCounterToggle = document.getElementById('lunar-counter-detail-toggle');
  lunarCounterDetail = document.getElementById('lunar-counter-detail');
  lunarCounterDays = document.getElementById('lunar-counter-days');
  lunarCounterHours = document.getElementById('lunar-counter-hours');
  lunarCounterMinutes = document.getElementById('lunar-counter-minutes');
  lunarCounterSeconds = document.getElementById('lunar-counter-seconds');

  if (!lunarCounterRoot) return;

  if (lunarCounterToggle && lunarCounterDetail) {
    lunarCounterToggle.addEventListener('click', toggleLunarCounterDetail);
    document.addEventListener('click', handleLunarCounterOutsideClick);
    document.addEventListener('keydown', handleLunarCounterKeydown);
  }

  updateLunarSplashdownCounter();
  if (lunarCounterInterval) {
    clearInterval(lunarCounterInterval);
  }
  lunarCounterInterval = setInterval(updateLunarSplashdownCounter, 1000);

  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) {
      updateLunarSplashdownCounter();
    }
  });
}

function toggleLunarCounterDetail(event) {
  if (event) event.stopPropagation();
  if (!lunarCounterToggle || !lunarCounterDetail) return;

  const shouldOpen = lunarCounterDetail.hidden;
  lunarCounterDetail.hidden = !shouldOpen;
  lunarCounterToggle.setAttribute('aria-expanded', shouldOpen ? 'true' : 'false');
}

function closeLunarCounterDetail() {
  if (!lunarCounterToggle || !lunarCounterDetail || lunarCounterDetail.hidden) return;

  lunarCounterDetail.hidden = true;
  lunarCounterToggle.setAttribute('aria-expanded', 'false');
}

function handleLunarCounterOutsideClick(event) {
  if (!lunarCounterRoot || lunarCounterRoot.contains(event.target)) return;
  closeLunarCounterDetail();
}

function handleLunarCounterKeydown(event) {
  if (event.key !== 'Escape') return;
  closeLunarCounterDetail();
}

const themeClassByColorMode = {
  lunar: 'theme-lunar',
  black: 'theme-black',
  white: 'theme-white',
  red: 'theme-red',
  blue: 'theme-blue',
  gold: 'theme-gold',
  silver: 'theme-silver',
  gray: 'theme-gray'
};

// Set this to a deployed Google Apps Script web app URL to send reports directly into a Google Sheet.
const BUG_REPORT_APPS_SCRIPT_URL = '';
const GITHUB_NEW_ISSUE_URL = 'https://github.com/tennitech/rpi-logo-generator/issues/new';
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
  if (typeof text !== 'string') text = "RPI";

  text = text.trim().toUpperCase().substring(0, 100);
  if (!text) return [];

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
const MOTION_ENABLED_BY_STYLE = {
  ruler: true,
  ticker: true,
  waveform: true
};
const DEFAULT_ZOOM_LEVEL = 1.2;
const MIN_DISPLAY_ZOOM_PERCENT = 50;
const MAX_DISPLAY_ZOOM_PERCENT = 250;
const COMPACT_LAYOUT_MAX_WIDTH = 900;
const MIN_ZOOM_LEVEL = DEFAULT_ZOOM_LEVEL * (MIN_DISPLAY_ZOOM_PERCENT / 100);
const MAX_ZOOM_LEVEL = DEFAULT_ZOOM_LEVEL * (MAX_DISPLAY_ZOOM_PERCENT / 100);

let zoomLevel = DEFAULT_ZOOM_LEVEL;
let panOffset = { x: 0, y: 0 };
let panTargetOffset = { x: 0, y: 0 };
let panVelocity = { x: 0, y: 0 };
let panAnimationFrame = 0;
let panPointerId = null;
let panPointerPosition = null;
let panGestureHandlersBound = false;
let pinchGestureHandlersBound = false;
let browserZoomGuardsBound = false;
let pinchTouchState = null;
let safariGestureStartZoomLevel = null;
let responsiveWorkspaceResizeObserver = null;
let responsiveWorkspaceSyncFrame = 0;
let workspaceResizeTransitionFrame = 0;
let workspaceResizeTransitionTimeout = 0;
let isWorkspaceResizeTransitionActive = false;
let lastCanvasSize = { width: 0, height: 0 };
let responsiveCanvasResizeTimeout = 0;
let lastCompactLayoutState = null;
let desktopSidebarWasCollapsed = false;
let isPanDragging = false;
let isPanningMode = false;
let isCanvasPinching = false;
let isAnimated = false;
let lastHeaderPreviewMarkup = '';
let lastHeaderPreviewUpdateTime = 0;
const RESPONSIVE_CANVAS_RESIZE_SETTLE_MS = 120;
const WAVEFORM_RENDER_MIN_POINTS = 240;
const WAVEFORM_RENDER_MAX_POINTS = 1200;
const WAVEFORM_RENDER_POINTS_PER_BAR_PIXEL = 2;
const WAVEFORM_RENDER_POINTS_PER_CYCLE = 12;

const PAN_DRAG_RESISTANCE = 0.42;
const PAN_FOLLOW_EASE = 0.26;
const PAN_INERTIA_DECAY = 0.88;
const PAN_INERTIA_STOP_THRESHOLD = 0.025;
const PAN_SETTLE_THRESHOLD = 0.04;
const PAN_EDGE_PADDING = 12;
const TRACKPAD_PINCH_ZOOM_SENSITIVITY = 0.0025;

const CIRCLES_GRID_ROWS = 2;
const CIRCLES_GRID_LAYOUT = 'straight';
const MISSION_CONTROL_GRID_TARGET_CELL = 64;
const MISSION_CONTROL_GRID_GROUP_SIZE = 10;
const MISSION_CONTROL_GRID_MIN_COLUMNS = 10;
const MISSION_CONTROL_GRID_MAX_COLUMNS = 40;
const MISSION_CONTROL_GRID_MIN_ROWS = 10;
const MISSION_CONTROL_GRID_MAX_ROWS = 30;

function getResponsiveLogoScale(viewportWidth = width, viewportHeight = height) {
  const safeWidth = Math.max(1, Math.round(viewportWidth || 0));
  const safeHeight = Math.max(1, Math.round(viewportHeight || 0));
  const widthLimitedScale =
    (safeWidth * RESPONSIVE_LOGO_WIDTH_RATIO) / (REFERENCE_WIDTH * DEFAULT_ZOOM_LEVEL);
  const heightLimitedScale =
    (safeHeight * RESPONSIVE_LOGO_HEIGHT_RATIO) / (REFERENCE_TOTAL_HEIGHT * DEFAULT_ZOOM_LEVEL);

  return Math.min(MAX_LOGO_SCALE, widthLimitedScale, heightLimitedScale);
}

// Zoom/Pan/Playback UI references
let zoomInBtn, zoomOutBtn, zoomResetBtn, zoomLevelDisplay;

function isCompactLayoutViewport(viewportWidth = window.innerWidth) {
  return Math.max(0, Math.round(viewportWidth || 0)) <= COMPACT_LAYOUT_MAX_WIDTH;
}

const AVAILABLE_STYLE_VALUES = new Set([
  'solid', 'ruler', 'ticker', 'binary', 'waveform', 'circles',
  'numeric', 'morse', 'circles-gradient', 'gradient', 'grid',
  'lines', 'point-connect', 'neural-network', 'triangle-grid', 'triangles',
  'fibonacci-sequence', 'union', 'wave-quantum',
  'runway', 'lunar', 'truss', 'music', 'graph'
]);

const UNAVAILABLE_STYLE_VALUES = new Set([
  'music',
  'graph',
  'truss'
]);

const ROUTABLE_STYLE_VALUES = new Set(
  Array.from(AVAILABLE_STYLE_VALUES).filter(style => !UNAVAILABLE_STYLE_VALUES.has(style))
);

function normalizeStyleValue(style) {
  if (style === 'staff') return 'solid';
  if (style === 'matrix') return 'solid';
  return ROUTABLE_STYLE_VALUES.has(style) ? style : 'solid';
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
    [lunarAudioBtn, 'audio'],
    [tickerAudioBtn, 'audio'],
    [waveformAudioBtn, 'audio'],
    [staffAudioBtn, 'audio']
  ].forEach(([button, kind]) => ensurePreviewButtonMarkup(button, kind));
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

function parseSliderNumericInput(rawValue, options = {}) {
  const tokens = String(rawValue ?? '')
    .trim()
    .replace(/,/g, '')
    .match(/-?\d*\.?\d+/g);

  if (!tokens || tokens.length === 0) {
    return null;
  }

  const token = options.token === 'last' ? tokens[tokens.length - 1] : tokens[0];
  const numericValue = parseFloat(token);
  return Number.isFinite(numericValue) ? numericValue : null;
}

function normalizeSliderValue(slider, rawValue) {
  if (!slider) return null;

  const numericValue = Number(rawValue);
  if (!Number.isFinite(numericValue)) {
    return null;
  }

  const min = parseFloat(slider.min);
  const max = parseFloat(slider.max);
  const step = slider.step === 'any' || slider.step === '' ? 1 : parseFloat(slider.step || '1');
  const precision = getStepPrecision(step);

  let clampedValue = numericValue;
  if (Number.isFinite(min)) {
    clampedValue = Math.max(min, clampedValue);
  }
  if (Number.isFinite(max)) {
    clampedValue = Math.min(max, clampedValue);
  }

  if (Number.isFinite(step) && step > 0 && Number.isFinite(min)) {
    clampedValue = min + Math.round((clampedValue - min) / step) * step;
  }

  if (Number.isFinite(min)) {
    clampedValue = Math.max(min, clampedValue);
  }
  if (Number.isFinite(max)) {
    clampedValue = Math.min(max, clampedValue);
  }

  if (precision > 0) {
    return clampedValue.toFixed(precision);
  }

  return String(Math.round(clampedValue));
}

function resizeSliderValueEditorInput(input) {
  if (!input) return;
  const nextWidth = Math.max(2, String(input.value || '').length + 0.75);
  input.style.width = `${nextWidth}ch`;
}

function cancelSliderValueEditor(config) {
  if (!config || !config.editorInput || !config.display) return;

  const valueGroup = config.display.parentElement;
  config.editorInput.remove();
  config.editorInput = null;
  config.display.removeAttribute('aria-hidden');
  if (valueGroup) {
    valueGroup.classList.remove('is-editing');
  }

  if (typeof config.refreshDisplay === 'function') {
    config.refreshDisplay();
  }
}

function commitSliderValueEditor(config) {
  if (!config || !config.editorInput || !config.display) return;

  const valueGroup = config.display.parentElement;
  const rawValue = config.editorInput.value;
  config.editorInput.remove();
  config.editorInput = null;
  config.display.removeAttribute('aria-hidden');
  if (valueGroup) {
    valueGroup.classList.remove('is-editing');
  }

  const parser = typeof config.parseValue === 'function'
    ? config.parseValue
    : (value) => {
      const numericValue = parseSliderNumericInput(value);
      return numericValue === null ? null : normalizeSliderValue(config.slider, numericValue);
    };
  const parsedValue = parser(rawValue);

  if (parsedValue !== null && config.slider) {
    config.slider.value = parsedValue;
    if (typeof config.commit === 'function') {
      config.commit();
    } else if (typeof config.refreshDisplay === 'function') {
      config.refreshDisplay();
    }
    return;
  }

  if (typeof config.refreshDisplay === 'function') {
    config.refreshDisplay();
  }
}

function activateSliderValueEditor(config) {
  if (!config || !config.display || !config.slider || config.editorInput) return;

  const valueGroup = config.display.parentElement;
  if (!valueGroup) return;

  const input = document.createElement('input');
  input.type = 'text';
  input.className = 'slider_value-input';
  input.autocomplete = 'off';
  input.spellcheck = false;
  input.inputMode = config.inputMode || 'decimal';
  input.value = typeof config.getEditorValue === 'function'
    ? config.getEditorValue()
    : config.display.textContent.trim();
  input.setAttribute('aria-label', config.ariaLabel || 'Set slider value');

  config.editorInput = input;
  if (valueGroup) {
    valueGroup.classList.add('is-editing');
  }
  config.display.setAttribute('aria-hidden', 'true');
  valueGroup.appendChild(input);
  resizeSliderValueEditorInput(input);

  input.addEventListener('input', function () {
    resizeSliderValueEditorInput(input);
  });
  input.addEventListener('blur', function () {
    commitSliderValueEditor(config);
  });
  input.addEventListener('keydown', function (event) {
    if (event.key === 'Enter') {
      event.preventDefault();
      input.blur();
      return;
    }

    if (event.key === 'Escape') {
      event.preventDefault();
      cancelSliderValueEditor(config);
    }
  });

  requestAnimationFrame(() => {
    input.focus();
    input.select();
  });
}

function prepareSliderValueLabelLayout(display) {
  if (!display) return;

  const label = display.closest('label.control-label');
  if (!label || label.dataset.sliderValueLayout === 'ready') {
    return;
  }

  const nodes = Array.from(label.childNodes);
  const displayIndex = nodes.indexOf(display);
  if (displayIndex === -1) {
    return;
  }

  const labelText = document.createElement('span');
  labelText.className = 'slider_label-text';

  const valueGroup = document.createElement('span');
  valueGroup.className = 'slider_value-group';

  nodes.forEach((node, index) => {
    if (index < displayIndex) {
      labelText.appendChild(node);
      return;
    }

    if (node.nodeType === 3) {
      if (node.textContent.trim().length === 0) {
        return;
      }

      const affix = document.createElement('span');
      affix.className = 'slider_value-affix';
      affix.textContent = node.textContent;
      valueGroup.appendChild(affix);
      return;
    }

    valueGroup.appendChild(node);
  });

  label.replaceChildren(labelText, valueGroup);
  label.classList.add('slider_label-row');
  label.dataset.sliderValueLayout = 'ready';
}

function registerSliderValueEditor(config) {
  if (!config || !config.display || !config.slider) return;

  prepareSliderValueLabelLayout(config.display);
  config.display.classList.add('slider_value-display');
  config.display.tabIndex = 0;
  config.display.setAttribute('role', 'button');
  config.display.setAttribute('title', 'Click to enter a value');
  if (config.ariaLabel) {
    config.display.setAttribute('aria-label', config.ariaLabel);
  }

  const activate = (event) => {
    event.preventDefault();
    event.stopPropagation();
    activateSliderValueEditor(config);
  };

  config.display.addEventListener('mousedown', function (event) {
    event.preventDefault();
  });
  config.display.addEventListener('click', activate);
  config.display.addEventListener('keydown', function (event) {
    if (event.key === 'Enter' || event.key === ' ') {
      activate(event);
    }
  });

  sliderValueEditorConfigs.push(config);
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

function styleSupportsMotion(style) {
  const normalizedStyle = normalizeStyleValue(style);
  return normalizedStyle === 'ruler' || normalizedStyle === 'ticker' || normalizedStyle === 'waveform';
}

function getCurrentMotionStyle() {
  switch (currentShader) {
    case 1:
      return 'ruler';
    case 2:
      return 'ticker';
    case 4:
      return 'waveform';
    default:
      return null;
  }
}

function getMotionControlConfig(style) {
  const normalizedStyle = normalizeStyleValue(style);
  if (normalizedStyle === 'ruler') {
    return {
      toggle: rulerMotionToggle,
      speedSlider: rulerSpeedSlider,
      speedDisplay: rulerSpeedDisplay
    };
  }

  if (normalizedStyle === 'ticker') {
    return {
      toggle: tickerMotionToggle,
      speedSlider: tickerSpeedSlider,
      speedDisplay: tickerSpeedDisplay
    };
  }

  if (normalizedStyle === 'waveform') {
    return {
      toggle: waveformMotionToggle,
      speedSlider: waveformSpeedSlider,
      speedDisplay: waveformSpeedDisplay
    };
  }

  return {
    toggle: null,
    speedSlider: null,
    speedDisplay: null
  };
}

function getLoopRuntimeValues() {
  return {
    rulerRepeats: rulerRepeatsSlider ? rulerRepeatsSlider.value : 10,
    rulerUnits: rulerUnitsSlider ? rulerUnitsSlider.value : 4,
    rulerSpeed: rulerSpeedSlider ? rulerSpeedSlider.value : 1,
    rulerReverse: rulerReverseToggle ? rulerReverseToggle.checked : false,
    tickerRepeats: tickerSlider ? tickerSlider.value : 34,
    tickerRatio: tickerRatioSlider ? tickerRatioSlider.value : 2,
    tickerWidthRatio: tickerWidthRatioSlider ? tickerWidthRatioSlider.value : 2,
    tickerSpeed: tickerSpeedSlider ? tickerSpeedSlider.value : 1,
    tickerReverse: tickerReverseToggle ? tickerReverseToggle.checked : false,
    waveformSpeed: waveformSpeedSlider ? waveformSpeedSlider.value : 0.7,
    waveformReverse: waveformReverseToggle ? waveformReverseToggle.checked : false
  };
}

function isMotionEnabledForStyle(style) {
  const normalizedStyle = normalizeStyleValue(style);
  if (!styleSupportsMotion(normalizedStyle)) {
    return false;
  }

  return MOTION_ENABLED_BY_STYLE[normalizedStyle] !== false;
}

function getLoopAnimationStateForStyle(style, barWidth = REFERENCE_WIDTH, elapsedSecondsOverride = null) {
  const normalizedStyle = normalizeStyleValue(style);
  if (!styleSupportsMotion(normalizedStyle)) {
    return null;
  }

  const elapsedSeconds = Number.isFinite(elapsedSecondsOverride)
    ? elapsedSecondsOverride
    : (isMotionEnabledForStyle(normalizedStyle)
      ? (typeof window.animationTime !== 'undefined' ? window.animationTime : 0)
      : 0);

  if (getLoopingAnimationState) {
    return getLoopingAnimationState(normalizedStyle, getLoopRuntimeValues(), {
      barWidth,
      elapsedSeconds
    });
  }

  if (!getLoopingGifFramePlan) {
    return null;
  }

  const framePlan = getLoopingGifFramePlan(normalizedStyle, getLoopRuntimeValues(), { barWidth });
  if (!framePlan) {
    return null;
  }

  const periodSeconds = Math.max(0.0001, Number(framePlan.periodSeconds) || 1);
  const progress = ((elapsedSeconds / periodSeconds) % 1 + 1) % 1;
  return {
    ...framePlan,
    progress,
    loopOffsetX: typeof framePlan.getLoopOffsetX === 'function' ? framePlan.getLoopOffsetX(progress) : 0,
    timeSeconds: typeof framePlan.getTimeSeconds === 'function'
      ? framePlan.getTimeSeconds(progress)
      : periodSeconds * progress
  };
}

function getCurrentLoopAnimationState(barWidth = REFERENCE_WIDTH) {
  return getLoopAnimationStateForStyle(getCurrentMotionStyle(), barWidth);
}

function syncMotionToggleState() {
  ['ruler', 'ticker', 'waveform'].forEach((style) => {
    const { toggle } = getMotionControlConfig(style);
    if (toggle) {
      toggle.checked = isMotionEnabledForStyle(style);
    }
  });
}

function setMotionEnabledForStyle(style, enabled, options = {}) {
  const normalizedStyle = normalizeStyleValue(style);
  if (!styleSupportsMotion(normalizedStyle)) {
    return;
  }

  MOTION_ENABLED_BY_STYLE[normalizedStyle] = !!enabled;
  if (options.resetPhase !== false) {
    window.animationTime = 0;
  }

  syncMotionToggleState();
  requestUpdate();
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
    case 24:
      return isMissionControlThemeActive() ? 'lunar' : null;
    default:
      return null;
  }
}

function getActiveAudioPreviewType() {
  return isAudioPlaying ? activeAudioPreviewType : null;
}

function getWaveformRenderPointCount(barWidth, frequency) {
  const safeBarWidth = Math.max(1, Number(barWidth) || REFERENCE_WIDTH);
  const safeFrequency = Math.max(1, Math.round(Number(frequency) || 1));
  const widthDrivenPoints = Math.ceil(safeBarWidth * WAVEFORM_RENDER_POINTS_PER_BAR_PIXEL);
  const frequencyDrivenPoints = safeFrequency * WAVEFORM_RENDER_POINTS_PER_CYCLE;

  return Math.max(
    WAVEFORM_RENDER_MIN_POINTS,
    Math.min(WAVEFORM_RENDER_MAX_POINTS, Math.max(widthDrivenPoints, frequencyDrivenPoints))
  );
}

function generateWaveformValue(phase, type) {
  const normalizedPhase = phase - Math.floor(phase);
  const wrappedPhase = normalizedPhase < 0 ? normalizedPhase + 1 : normalizedPhase;

  const sine = (Math.sin(wrappedPhase * 2 * Math.PI - Math.PI / 2) + 1) * 0.5;
  const saw = wrappedPhase;
  const square = wrappedPhase > 0.5 ? 1.0 : 0.0;
  const pulse = wrappedPhase > 0.8 ? 1.0 : 0.0;

  if (type < 1.0) {
    return sine + (saw - sine) * type;
  }

  if (type < 2.0) {
    const mix = type - 1.0;
    return saw + (square - saw) * mix;
  }

  const mix = type - 2.0;
  return square + (pulse - square) * mix;
}

function getWaveformEnvelopeSettings() {
  return {
    applyEnvelope: !!(waveformEnvelopeToggle && waveformEnvelopeToggle.checked),
    envType: waveformEnvelopeType ? waveformEnvelopeType.value : 'sine',
    envWaves: waveformEnvelopeWavesSlider
      ? (typeof normalizeWaveformEnvelopeWaves === 'function'
        ? normalizeWaveformEnvelopeWaves(waveformEnvelopeWavesSlider.value)
        : Math.max(1, Math.min(10, Math.round(parseFloat(waveformEnvelopeWavesSlider.value)) || 1)))
      : 1,
    envCenter: waveformEnvelopeCenterSlider ? parseFloat(waveformEnvelopeCenterSlider.value) : 0,
    bipolar: !!(waveformEnvelopeBipolarToggle && waveformEnvelopeBipolarToggle.checked)
  };
}

function getAudioButtonConfig() {
  return [
    { type: 'binary', button: binaryAudioBtn, currentShader: 3 },
    { type: 'morse', button: morseAudioBtn, currentShader: 7 },
    { type: 'ticker', button: tickerAudioBtn, currentShader: 2 },
    { type: 'waveform', button: waveformAudioBtn, currentShader: 4 },
    { type: 'lunar', button: lunarAudioBtn, currentShader: 24 },
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

  if (currentType === 'waveform' || currentType === 'lunar') {
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
  const activeType = getActiveAudioPreviewType();

  if (type === 'staff' && (!currentStaffNotes || currentStaffNotes.length === 0)) {
    showAudioToast('Add notes to the keyboard before previewing music audio.', 'info');
    return;
  }

  if (isAudioPlaying) {
    stopAudio();
    if (activeType === type) {
      return;
    }
  }

  if (type !== 'waveform' && type !== 'lunar') {
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
      if (rulerSpeedSlider) rulerSpeedSlider.value = 1;
      if (rulerReverseToggle) rulerReverseToggle.checked = false;
      updateRulerRepeatsDisplay();
      updateRulerUnitsDisplay();
      updateRulerSpeedDisplay();
      setMotionEnabledForStyle('ruler', true);
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
      if (tickerSpeedSlider) tickerSpeedSlider.value = 1;
      if (tickerReverseToggle) tickerReverseToggle.checked = false;
      updateTickerDisplay();
      updateTickerRatioDisplay();
      updateTickerWidthRatioDisplay();
      updateTickerSpeedDisplay();
      setMotionEnabledForStyle('ticker', true);
      break;
    case 'waveform':
      if (waveformTypeSlider) waveformTypeSlider.value = 0;
      if (waveformFrequencySlider) waveformFrequencySlider.value = 24;
      if (waveformSpeedSlider) waveformSpeedSlider.value = 0.7;
      if (waveformReverseToggle) waveformReverseToggle.checked = false;
      if (waveformEnvelopeToggle) waveformEnvelopeToggle.checked = false;
      if (waveformEnvelopeType) waveformEnvelopeType.value = 'sine';
      if (waveformEnvelopeWavesSlider) waveformEnvelopeWavesSlider.value = 1;
      if (waveformEnvelopeCenterSlider) waveformEnvelopeCenterSlider.value = 0;
      if (waveformEnvelopeBipolarToggle) waveformEnvelopeBipolarToggle.checked = false;
      if (envelopeSettingsGroup) envelopeSettingsGroup.style.display = 'none';
      updateWaveformTypeDisplay();
      updateWaveformFrequencyDisplay();
      updateWaveformSpeedDisplay();
      updateWaveformEnvelopeWavesDisplay();
      updateWaveformEnvelopeCenterDisplay();
      updateAudioParameters();
      setMotionEnabledForStyle('waveform', true);
      break;
    case 'circles':
      if (circlesFillSelect) circlesFillSelect.value = 'stroke';
      if (circlesDensitySlider) circlesDensitySlider.value = 50;
      if (circlesSizeVariationSlider) circlesSizeVariationSlider.value = 0;
      resetCirclePatternCache();
      updateCirclesDensityDisplay();
      updateCirclesSizeVariationDisplay();
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
      updateTrussSegmentsDisplay();
      updateTrussThicknessDisplay();
      break;
    case 'music':
      if (staffInstrumentSelect) staffInstrumentSelect.value = 'piano';
      if (staffNoteShapeSelect) staffNoteShapeSelect.value = 'circle';
      if (staffReverbToggle) staffReverbToggle.checked = false;
      if (staffTremoloToggle) staffTremoloToggle.checked = false;
      if (staffTempoSlider) staffTempoSlider.value = 120;
      updateStaffTempoDisplay();
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
      updateGraphScaleDisplay();
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
      surpriseBtn.textContent = 'Randomize';
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
      if (rulerSpeedSlider) rulerSpeedSlider.value = randomStepValue(0.4, 3.5, 0.1);
      if (rulerReverseToggle) rulerReverseToggle.checked = randomChance(0.5);
      updateRulerRepeatsDisplay();
      updateRulerUnitsDisplay();
      updateRulerSpeedDisplay();
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
      if (tickerWidthRatioSlider) {
        applyTickerWidthRatioBounds(tickerRatioSlider, tickerWidthRatioSlider);
        tickerWidthRatioSlider.value = randomStepValue(1, parseInt(tickerWidthRatioSlider.max, 10), 1);
      }
      if (tickerSpeedSlider) tickerSpeedSlider.value = randomStepValue(0.4, 3.5, 0.1);
      if (tickerReverseToggle) tickerReverseToggle.checked = randomChance(0.5);
      updateTickerDisplay();
      updateTickerRatioDisplay();
      updateTickerWidthRatioDisplay();
      updateTickerSpeedDisplay();
      break;
    case 'waveform':
      if (waveformTypeSlider) waveformTypeSlider.value = pickRandom(['0', '1', '2', '3']);
      if (waveformFrequencySlider) waveformFrequencySlider.value = randomStepValue(12, 88, 1);
      if (waveformSpeedSlider) waveformSpeedSlider.value = randomStepValue(0.3, 3.6, 0.1);
      if (waveformReverseToggle) waveformReverseToggle.checked = randomChance(0.5);
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
      updateWaveformEnvelopeWavesDisplay();
      updateWaveformEnvelopeCenterDisplay();
      updateAudioParameters();
      break;
    case 'circles':
      if (circlesFillSelect) circlesFillSelect.value = pickRandom(['stroke', 'fill']);
      resetCirclePatternCache();
      if (circlesDensitySlider) circlesDensitySlider.value = randomStepValue(20, 95, 1);
      if (circlesSizeVariationSlider) circlesSizeVariationSlider.value = randomStepValue(0, 85, 1);
      updateCirclesDensityDisplay();
      updateCirclesSizeVariationDisplay();
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
      updateTrussSegmentsDisplay();
      updateTrussThicknessDisplay();
      break;
    case 'music':
      if (staffInstrumentSelect) staffInstrumentSelect.value = pickRandom(['piano', 'synth', 'marimba']);
      if (staffNoteShapeSelect) staffNoteShapeSelect.value = pickRandom(['circle', 'square', 'diamond', 'triangle']);
      if (staffReverbToggle) staffReverbToggle.checked = randomChance(0.45);
      if (staffTremoloToggle) staffTremoloToggle.checked = randomChance(0.35);
      if (staffTempoSlider) staffTempoSlider.value = randomStepValue(76, 176, 1);
      updateStaffTempoDisplay();
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
      updateGraphScaleDisplay();
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

function buildGitHubIssueUrl() {
  const payload = buildBugReportPayload();
  const colorThemeLabel = String(payload.colorMode || DEFAULT_COLOR_MODE).replace(/-/g, ' ').toUpperCase();
  const issueTitle = `${payload.styleLabel} issue`;
  const issueBody = [
    '### Summary',
    'Describe the issue here.',
    '',
    '### Context',
    `- Style: ${payload.styleLabel}`,
    `- Color theme: ${colorThemeLabel}`,
    `- Viewport: ${payload.viewport}`,
    `- URL: ${payload.stateUrl}`,
    `- User agent: ${payload.userAgent}`,
    `- Timestamp: ${payload.timestamp}`
  ].join('\n');
  const params = new URLSearchParams({
    title: issueTitle,
    body: issueBody
  });

  return `${GITHUB_NEW_ISSUE_URL}?${params.toString()}`;
}

function openGitHubIssue() {
  const issueWindow = window.open(buildGitHubIssueUrl(), '_blank', 'noopener,noreferrer');
  if (issueWindow) issueWindow.opener = null;
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

function isLunarStyleSelected() {
  return normalizeStyleValue(styleSelect ? styleSelect.value : 'solid') === 'lunar';
}

function getSelectableColorModes() {
  return isLunarStyleSelected()
    ? AVAILABLE_COLOR_MODES.slice()
    : AVAILABLE_COLOR_MODES.filter(mode => mode !== 'lunar');
}

function syncLunarColorOptionAvailability() {
  if (!colorModeSelect) return;

  const allowLunarTheme = isLunarStyleSelected();
  const lunarOption = colorModeSelect.querySelector('option[value="lunar"]');

  if (lunarOption) {
    lunarOption.hidden = !allowLunarTheme;
    lunarOption.disabled = !allowLunarTheme;
  }

  const wrapperElement = colorModeSelect.parentElement;
  const customLunarOption = wrapperElement
    ? wrapperElement.querySelector('.custom-option[data-value="lunar"]')
    : null;

  if (customLunarOption) {
    customLunarOption.classList.toggle('is-hidden', !allowLunarTheme);
    customLunarOption.setAttribute('aria-hidden', String(!allowLunarTheme));
    customLunarOption.setAttribute('aria-disabled', String(!allowLunarTheme));
  }
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

function quantizeMissionControlGridCount(size, minCount, maxCount) {
  const rawGroupCount = Math.max(1, Math.round(size / (MISSION_CONTROL_GRID_TARGET_CELL * MISSION_CONTROL_GRID_GROUP_SIZE)));
  const quantizedCount = rawGroupCount * MISSION_CONTROL_GRID_GROUP_SIZE;
  return Math.max(minCount, Math.min(maxCount, quantizedCount));
}

function syncMissionControlGrid() {
  const logoContainer = document.querySelector('.logo-container');
  if (!logoContainer) return;

  const width = logoContainer.clientWidth;
  const height = logoContainer.clientHeight;
  if (!width || !height) return;

  const columns = quantizeMissionControlGridCount(
    width,
    MISSION_CONTROL_GRID_MIN_COLUMNS,
    MISSION_CONTROL_GRID_MAX_COLUMNS
  );
  const rows = quantizeMissionControlGridCount(
    height,
    MISSION_CONTROL_GRID_MIN_ROWS,
    MISSION_CONTROL_GRID_MAX_ROWS
  );

  const cellX = width / columns;
  const cellY = height / rows;

  logoContainer.style.setProperty('--lunar-grid-cell-x', `${cellX}px`);
  logoContainer.style.setProperty('--lunar-grid-cell-y', `${cellY}px`);
  logoContainer.style.setProperty('--lunar-grid-major-x', `${cellX * 5}px`);
  logoContainer.style.setProperty('--lunar-grid-major-y', `${cellY * 5}px`);
}

function syncResponsiveLayoutMode() {
  if (!appSidebar) return false;

  const isCompactLayout = isCompactLayoutViewport();
  if (lastCompactLayoutState === isCompactLayout) {
    return false;
  }

  if (isCompactLayout) {
    desktopSidebarWasCollapsed = appSidebar.classList.contains('sidebar-collapsed');
    appSidebar.classList.remove('sidebar-collapsed');
    appSidebar.classList.remove('active');
  } else {
    appSidebar.classList.remove('active');
    appSidebar.classList.toggle('sidebar-collapsed', desktopSidebarWasCollapsed);
  }

  lastCompactLayoutState = isCompactLayout;
  return true;
}

function hasPendingResponsiveCanvasResize() {
  return responsiveCanvasResizeTimeout !== 0;
}

function flushResponsiveCanvasResize() {
  if (!responsiveCanvasResizeTimeout) return;
  window.clearTimeout(responsiveCanvasResizeTimeout);
  responsiveCanvasResizeTimeout = 0;
}

function scheduleResponsiveCanvasResize(delay = RESPONSIVE_CANVAS_RESIZE_SETTLE_MS) {
  flushResponsiveCanvasResize();
  responsiveCanvasResizeTimeout = window.setTimeout(() => {
    responsiveCanvasResizeTimeout = 0;
    requestResponsiveWorkspaceSizing();
  }, delay);
}

function syncResponsiveWorkspaceSizing() {
  responsiveWorkspaceSyncFrame = 0;
  syncViewportHeightVar();
  syncResponsiveLayoutMode();
  syncSidebarToggleState();
  syncMissionControlGrid();

  const container = document.getElementById('p5-container');
  if (container && typeof resizeCanvas === 'function') {
    const nextWidth = Math.round(container.offsetWidth);
    const nextHeight = Math.round(container.offsetHeight);

    if (
      nextWidth > 0 &&
      nextHeight > 0 &&
      (lastCanvasSize.width !== nextWidth || lastCanvasSize.height !== nextHeight)
    ) {
      if (isWorkspaceResizeTransitionActive || hasPendingResponsiveCanvasResize()) {
        return;
      }

      resizeCanvas(nextWidth, nextHeight);
      lastCanvasSize = { width: nextWidth, height: nextHeight };
      clampPanOffset();
      renderPanOffsetChange();
    }
  }

}

function requestResponsiveWorkspaceSizing() {
  if (responsiveWorkspaceSyncFrame) return;
  responsiveWorkspaceSyncFrame = requestAnimationFrame(syncResponsiveWorkspaceSizing);
}

function finishWorkspaceResizeTransitionSync(options = {}) {
  const shouldRequestSizing = options.requestSizing !== false;

  if (workspaceResizeTransitionFrame) {
    cancelAnimationFrame(workspaceResizeTransitionFrame);
    workspaceResizeTransitionFrame = 0;
  }

  if (workspaceResizeTransitionTimeout) {
    window.clearTimeout(workspaceResizeTransitionTimeout);
    workspaceResizeTransitionTimeout = 0;
  }

  if (!isWorkspaceResizeTransitionActive) return;

  isWorkspaceResizeTransitionActive = false;
  if (shouldRequestSizing) {
    flushResponsiveCanvasResize();
    requestResponsiveWorkspaceSizing();
  }
}

function startWorkspaceResizeTransitionSync(duration = 450) {
  finishWorkspaceResizeTransitionSync({ requestSizing: false });
  isWorkspaceResizeTransitionActive = true;

  workspaceResizeTransitionFrame = requestAnimationFrame(() => {
    workspaceResizeTransitionFrame = 0;
    syncViewportHeightVar();
    syncSidebarToggleState();
    syncMissionControlGrid();
  });

  workspaceResizeTransitionTimeout = window.setTimeout(() => {
    finishWorkspaceResizeTransitionSync();
  }, duration);
}

function setupResponsiveWorkspaceSizing() {
  requestResponsiveWorkspaceSizing();

  if (responsiveWorkspaceResizeObserver) {
    responsiveWorkspaceResizeObserver.disconnect();
  }

  const resizeTarget = document.querySelector('.canvas-viewport');
  if (!resizeTarget || typeof ResizeObserver === 'undefined') return;

  responsiveWorkspaceResizeObserver = new ResizeObserver(() => {
    if (!isWorkspaceResizeTransitionActive) {
      scheduleResponsiveCanvasResize();
    }
    requestResponsiveWorkspaceSizing();
  });
  responsiveWorkspaceResizeObserver.observe(resizeTarget);
}


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
  setupViewportHeightSync();

  // Create canvas that fills the container
  const container = document.getElementById('p5-container');
  const width = container ? container.offsetWidth : windowWidth;
  const height = container ? container.offsetHeight : windowHeight;

  let canvas = createCanvas(width, height, WEBGL);
  canvas.parent('p5-container');
  lastCanvasSize = { width, height };
  setupResponsiveWorkspaceSizing();

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
  lunarGroup = document.getElementById('lunar-group');
  lunarAudioBtn = document.getElementById('lunar-audio-btn');
  rulerGroup = document.getElementById('ruler-group');
  rulerRepeatsSlider = document.getElementById('ruler-repeats-slider');
  rulerRepeatsDisplay = document.getElementById('ruler-repeats-display');
  rulerUnitsSlider = document.getElementById('ruler-units-slider');
  rulerUnitsDisplay = document.getElementById('ruler-units-display');
  rulerMotionToggle = document.getElementById('ruler-motion-toggle');
  rulerReverseToggle = document.getElementById('ruler-reverse-toggle');
  rulerSpeedSlider = document.getElementById('ruler-speed-slider');
  rulerSpeedDisplay = document.getElementById('ruler-speed-display');
  tickerSlider = document.getElementById('ticker-slider');
  tickerDisplay = document.getElementById('ticker-display');
  tickerGroup = document.getElementById('ticker-group');
  tickerRatioSlider = document.getElementById('ticker-ratio-slider');
  tickerRatioDisplay = document.getElementById('ticker-ratio-display');
  tickerWidthRatioSlider = document.getElementById('ticker-width-ratio-slider');
  tickerWidthRatioDisplay = document.getElementById('ticker-width-ratio-display');
  tickerMotionToggle = document.getElementById('ticker-motion-toggle');
  tickerReverseToggle = document.getElementById('ticker-reverse-toggle');
  tickerSpeedSlider = document.getElementById('ticker-speed-slider');
  tickerSpeedDisplay = document.getElementById('ticker-speed-display');
  tickerAudioBtn = document.getElementById('ticker-audio-btn');
  waveformGroup = document.getElementById('waveform-group');
  waveformTypeSlider = document.getElementById('waveform-type-slider');
  waveformTypeDisplay = document.getElementById('waveform-type-display');
  waveformFrequencySlider = document.getElementById('waveform-frequency-slider');
  waveformFrequencyDisplay = document.getElementById('waveform-frequency-display');
  waveformSpeedSlider = document.getElementById('waveform-speed-slider');
  waveformSpeedDisplay = document.getElementById('waveform-speed-display');
  waveformMotionToggle = document.getElementById('waveform-motion-toggle');
  waveformReverseToggle = document.getElementById('waveform-reverse-toggle');
  waveformAudioBtn = document.getElementById('waveform-audio-btn');
  waveformEnvelopeToggle = document.getElementById('waveform-envelope-toggle');
  envelopeSettingsGroup = document.getElementById('envelope-settings-group');
  waveformEnvelopeType = document.getElementById('waveform-envelope-type');
  waveformEnvelopeWavesSlider = document.getElementById('waveform-envelope-waves-slider');
  waveformEnvelopeWavesDisplay = document.getElementById('waveform-envelope-waves-display');
  waveformEnvelopeCenterSlider = document.getElementById('waveform-envelope-center-slider');
  waveformEnvelopeCenterDisplay = document.getElementById('waveform-envelope-center-display');
  waveformEnvelopeBipolarToggle = document.getElementById('waveform-envelope-bipolar-toggle');
  circlesGroup = document.getElementById('circles-group');
  circlesDensitySlider = document.getElementById('circles-density-slider');
  circlesDensityDisplay = document.getElementById('circles-density-display');

  zoomInBtn = document.getElementById('zoom-in-btn');
  zoomOutBtn = document.getElementById('zoom-out-btn');
  zoomResetBtn = document.getElementById('zoom-reset-btn');
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
      setZoomLevel(DEFAULT_ZOOM_LEVEL);
      setPanOffset({ x: 0, y: 0 }, { immediate: true });
      if (zoomLevelDisplay) {
        zoomLevelDisplay.value = '100%';
      }
      if (!isMotionEnabledForStyle(getCurrentMotionStyle())) redraw();
    });
  }

  // Zoom Input Handling
  if (zoomLevelDisplay) {
    const handleZoomInput = () => {
      let val = zoomLevelDisplay.value.replace('%', '');
      let num = parseFloat(val);
      if (!isNaN(num)) {
        setZoomLevel(displayPercentToZoomLevel(num));
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

  circlesSizeVariationSlider = document.getElementById('circles-size-variation-slider');
  circlesSizeVariationDisplay = document.getElementById('circles-size-variation-display');
  circlesFillSelect = document.getElementById('circles-fill-select');
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
  bindPanGestureHandlers();
  bindCanvasPinchHandlers();
  bindBrowserZoomGuards();
  updatePanTouchAction();
  appSidebar = document.getElementById('app-sidebar');
  sidebarScroll = document.getElementById('sidebar-scroll');
  headerLogoPreview = document.getElementById('header-logo-preview');
  mobileMenuToggle = document.getElementById('mobile-menu-toggle');
  styleSelectLabel = document.getElementById('style-select-label');
  colorModeSelectLabel = document.getElementById('color-mode-select-label');
  reportProblemBtn = document.getElementById('report-problem-btn');
  reportProblemLabel = document.getElementById('report-problem-label');
  bugReportDialog = document.getElementById('bug-report-dialog');
  bugReportForm = document.getElementById('bug-report-form');
  bugReportContext = document.getElementById('bug-report-context');
  bugReportCloseBtn = document.getElementById('bug-report-close');
  bugReportCancelBtn = document.getElementById('bug-report-cancel');
  bugReportSubjectInput = document.getElementById('bug-report-subject');
  bugReportDetailsInput = document.getElementById('bug-report-details');
  bugReportStepsInput = document.getElementById('bug-report-steps');
  bugReportEmailInput = document.getElementById('bug-report-email');
  // Get save control references (globals declared at top so toggleSaveMenu can access them)
  saveButton = document.getElementById('save-button');
  saveButtonLabel = document.getElementById('save-button-label');
  saveMenu = document.getElementById('save-menu');
  savePngButton = document.getElementById('save-png');
  saveSvgButton = document.getElementById('save-svg');
  saveLoopGifButton = document.getElementById('save-loop-gif');
  syncResponsiveLayoutMode();
  syncMissionControlInterfaceCopy();
  syncMissionControlSaveMenu();

  initializePreviewButtons();

  updateSidebarScrollFadeState();
  if (sidebarScroll) {
    sidebarScroll.addEventListener('scroll', updateSidebarScrollFadeState, { passive: true });
  }
  if (appSidebar) {
    appSidebar.addEventListener('transitionend', handleSidebarTransitionEnd);
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
  if (rulerSpeedSlider) {
    rulerSpeedSlider.addEventListener('input', function () {
      updateRulerSpeedDisplay();
      updateUrlParameters();
      requestUpdate();
    });
  }
  if (rulerMotionToggle) {
    rulerMotionToggle.addEventListener('change', function () {
      setMotionEnabledForStyle('ruler', this.checked);
    });
  }
  if (rulerReverseToggle) {
    rulerReverseToggle.addEventListener('change', function () {
      window.animationTime = 0;
      updateUrlParameters();
      requestUpdate();
    });
  }
  updateRulerRepeatsDisplay(); // Set initial value
  updateRulerUnitsDisplay(); // Set initial value
  updateRulerSpeedDisplay();

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
  if (tickerSpeedSlider) {
    tickerSpeedSlider.addEventListener('input', function () {
      updateTickerSpeedDisplay();
      updateUrlParameters();
      requestUpdate();
    });
  }
  if (tickerMotionToggle) {
    tickerMotionToggle.addEventListener('change', function () {
      setMotionEnabledForStyle('ticker', this.checked);
    });
  }
  if (tickerReverseToggle) {
    tickerReverseToggle.addEventListener('change', function () {
      window.animationTime = 0;
      updateUrlParameters();
      requestUpdate();
    });
  }
  updateTickerSpeedDisplay();

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
  if (waveformMotionToggle) {
    waveformMotionToggle.addEventListener('change', function () {
      setMotionEnabledForStyle('waveform', this.checked);
    });
  }
  if (waveformReverseToggle) {
    waveformReverseToggle.addEventListener('change', function () {
      window.animationTime = 0;
      updateUrlParameters();
      requestUpdate();
    });
  }

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
      updateWaveformEnvelopeWavesDisplay();
      updateUrlParameters();
      requestUpdate();
    });
  }
  if (waveformEnvelopeCenterSlider) {
    waveformEnvelopeCenterSlider.addEventListener('input', function () {
      updateWaveformEnvelopeCenterDisplay();
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
  syncMotionToggleState();

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

  updateCirclesDensityDisplay(); // Set initial value
  updateCirclesSizeVariationDisplay(); // Set initial value

  // Setup circles fill selector
  circlesFillSelect.addEventListener('change', function () {
    updateUrlParameters();
  });

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
      openGitHubIssue();
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

  // Use pointerdown so taps still produce normal click events for the controls themselves.
  document.addEventListener('pointerdown', handleClickOutside, true);

  // Focus trap and Escape key support for sidebar
  appSidebar.addEventListener('keydown', function (e) {
    // Only trap focus in compact layout when the sidebar is active.
    if (isCompactLayoutViewport() && !appSidebar.classList.contains('active')) return;

    // Handle Escape to close in compact layout only.
    if (e.key === 'Escape' && isCompactLayoutViewport()) {
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
    savePngButton.addEventListener('click', handleSavePngClick);
  }
  if (saveSvgButton) {
    saveSvgButton.addEventListener('click', handleSaveSvgClick);
  }
  if (saveLoopGifButton) {
    saveLoopGifButton.addEventListener('click', handleSaveLoopGifClick);
  }

  // Close save menu when clicking outside
  document.addEventListener('click', function (event) {
    const btn = document.getElementById('save-button');
    const menu = document.getElementById('save-menu');

    if (btn && menu && !btn.contains(event.target) && !menu.contains(event.target)) {
      if (!menu.classList.contains('hidden')) {
        hideSaveMenu();
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
    const syncMorseInput = function () {
      handleMorseInput();
      updateUrlParameters();
      requestUpdate();
    };
    morseInput.addEventListener('input', syncMorseInput);
    morseInput.addEventListener('keyup', syncMorseInput);
    morseInput.addEventListener('paste', syncMorseInput);
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

  if (lunarAudioBtn) {
    lunarAudioBtn.addEventListener('click', function (e) {
      e.preventDefault();
      togglePreviewAudio('lunar');
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
      updateTrussSegmentsDisplay();
      updateUrlParameters(); requestUpdate();
    });
    updateTrussSegmentsDisplay();
  }
  if (trussThicknessSlider) {
    trussThicknessSlider.addEventListener('input', function () {
      updateTrussThicknessDisplay();
      updateUrlParameters(); requestUpdate();
    });
    updateTrussThicknessDisplay();
  }

  // Setup staff controls
  if (staffTempoSlider) {
    staffTempoSlider.addEventListener('input', function () {
      updateStaffTempoDisplay();
      updateUrlParameters(); requestUpdate();
    });
    updateStaffTempoDisplay();
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
      updateGraphScaleDisplay();
      updateUrlParameters(); requestUpdate();
    });
    if (graphScaleSlider) {
      graphScaleSlider.value = Math.max(GRAPH_SCALE_MIN, parseInt(graphScaleSlider.value, 10) || GRAPH_SCALE_DEFAULT);
    }
    updateGraphScaleDisplay();
  }

  [
    {
      slider: rulerRepeatsSlider,
      display: rulerRepeatsDisplay,
      refreshDisplay: updateRulerRepeatsDisplay,
      commit: () => { updateRulerRepeatsDisplay(); updateUrlParameters(); requestUpdate(); },
      ariaLabel: 'Set ruler repeats'
    },
    {
      slider: rulerUnitsSlider,
      display: rulerUnitsDisplay,
      refreshDisplay: updateRulerUnitsDisplay,
      commit: () => { updateRulerUnitsDisplay(); updateUrlParameters(); requestUpdate(); },
      ariaLabel: 'Set ruler units'
    },
    {
      slider: rulerSpeedSlider,
      display: rulerSpeedDisplay,
      refreshDisplay: updateRulerSpeedDisplay,
      commit: () => { updateRulerSpeedDisplay(); updateUrlParameters(); requestUpdate(); },
      ariaLabel: 'Set ruler motion speed'
    },
    {
      slider: tickerSlider,
      display: tickerDisplay,
      refreshDisplay: updateTickerDisplay,
      commit: () => { updateTickerDisplay(); updateUrlParameters(); requestUpdate(); },
      ariaLabel: 'Set ticker repeats'
    },
    {
      slider: tickerRatioSlider,
      display: tickerRatioDisplay,
      refreshDisplay: updateTickerRatioDisplay,
      commit: () => { updateTickerRatioDisplay(); updateUrlParameters(); requestUpdate(); },
      parseValue: (value) => {
        const numericValue = parseSliderNumericInput(value, { token: 'first' });
        return numericValue === null ? null : normalizeSliderValue(tickerRatioSlider, numericValue);
      },
      ariaLabel: 'Set ticker count ratio',
      getEditorValue: () => tickerRatioDisplay ? tickerRatioDisplay.textContent.trim() : ''
    },
    {
      slider: tickerWidthRatioSlider,
      display: tickerWidthRatioDisplay,
      refreshDisplay: updateTickerWidthRatioDisplay,
      commit: () => { updateTickerWidthRatioDisplay(); updateUrlParameters(); requestUpdate(); },
      parseValue: (value) => {
        const numericValue = parseSliderNumericInput(value, { token: 'last' });
        return numericValue === null ? null : normalizeSliderValue(tickerWidthRatioSlider, numericValue);
      },
      ariaLabel: 'Set ticker width ratio',
      getEditorValue: () => tickerWidthRatioDisplay ? tickerWidthRatioDisplay.textContent.trim() : ''
    },
    {
      slider: tickerSpeedSlider,
      display: tickerSpeedDisplay,
      refreshDisplay: updateTickerSpeedDisplay,
      commit: () => { updateTickerSpeedDisplay(); updateUrlParameters(); requestUpdate(); },
      ariaLabel: 'Set ticker motion speed'
    },
    {
      slider: waveformFrequencySlider,
      display: waveformFrequencyDisplay,
      refreshDisplay: updateWaveformFrequencyDisplay,
      commit: () => { updateWaveformFrequencyDisplay(); updateAudioParameters(); updateUrlParameters(); requestUpdate(); },
      ariaLabel: 'Set waveform frequency'
    },
    {
      slider: waveformSpeedSlider,
      display: waveformSpeedDisplay,
      refreshDisplay: updateWaveformSpeedDisplay,
      commit: () => { updateWaveformSpeedDisplay(); updateUrlParameters(); requestUpdate(); },
      ariaLabel: 'Set waveform motion speed'
    },
    {
      slider: waveformEnvelopeWavesSlider,
      display: waveformEnvelopeWavesDisplay,
      refreshDisplay: updateWaveformEnvelopeWavesDisplay,
      commit: () => { updateWaveformEnvelopeWavesDisplay(); updateUrlParameters(); requestUpdate(); },
      ariaLabel: 'Set waveform envelope waves'
    },
    {
      slider: waveformEnvelopeCenterSlider,
      display: waveformEnvelopeCenterDisplay,
      refreshDisplay: updateWaveformEnvelopeCenterDisplay,
      commit: () => { updateWaveformEnvelopeCenterDisplay(); updateUrlParameters(); requestUpdate(); },
      ariaLabel: 'Set waveform envelope center offset'
    },
    {
      slider: circlesDensitySlider,
      display: circlesDensityDisplay,
      refreshDisplay: updateCirclesDensityDisplay,
      commit: () => { updateCirclesDensityDisplay(); redraw(); updateUrlParameters(); },
      ariaLabel: 'Set circles density'
    },
    {
      slider: circlesSizeVariationSlider,
      display: circlesSizeVariationDisplay,
      refreshDisplay: updateCirclesSizeVariationDisplay,
      commit: () => { updateCirclesSizeVariationDisplay(); redraw(); updateUrlParameters(); },
      ariaLabel: 'Set circles size variation'
    },
    {
      slider: trussSegmentsSlider,
      display: trussSegmentsDisplay,
      refreshDisplay: updateTrussSegmentsDisplay,
      commit: () => { updateTrussSegmentsDisplay(); updateUrlParameters(); requestUpdate(); },
      ariaLabel: 'Set truss segments'
    },
    {
      slider: trussThicknessSlider,
      display: trussThicknessDisplay,
      refreshDisplay: updateTrussThicknessDisplay,
      commit: () => { updateTrussThicknessDisplay(); updateUrlParameters(); requestUpdate(); },
      ariaLabel: 'Set truss thickness'
    },
    {
      slider: staffTempoSlider,
      display: staffTempoDisplay,
      refreshDisplay: updateStaffTempoDisplay,
      commit: () => { updateStaffTempoDisplay(); updateUrlParameters(); requestUpdate(); },
      ariaLabel: 'Set music tempo'
    },
    {
      slider: graphScaleSlider,
      display: graphScaleDisplay,
      refreshDisplay: updateGraphScaleDisplay,
      commit: () => { updateGraphScaleDisplay(); updateUrlParameters(); requestUpdate(); },
      ariaLabel: 'Set graph scale max'
    },
    {
      slider: circlesGradientVariantSlider,
      display: circlesGradientVariantDisplay,
      refreshDisplay: updateCirclesGradientVariantDisplay,
      commit: () => { updateCirclesGradientVariantDisplay(); updateUrlParameters(); requestUpdate(); },
      ariaLabel: 'Set circles gradient variant'
    },
    {
      slider: gradientVariantSlider,
      display: gradientVariantDisplay,
      refreshDisplay: updateGradientVariantDisplay,
      commit: () => { updateGradientVariantDisplay(); updateUrlParameters(); requestUpdate(); },
      ariaLabel: 'Set gradient variant'
    },
    {
      slider: gridVariantSlider,
      display: gridVariantDisplay,
      refreshDisplay: updateGridVariantDisplay,
      commit: () => { updateGridVariantDisplay(); updateUrlParameters(); requestUpdate(); },
      ariaLabel: 'Set grid variant'
    },
    {
      slider: pointConnectVariantSlider,
      display: pointConnectVariantDisplay,
      refreshDisplay: updatePointConnectVariantDisplay,
      commit: () => { updatePointConnectVariantDisplay(); updateUrlParameters(); requestUpdate(); },
      ariaLabel: 'Set point connect variant'
    },
    {
      slider: neuralNetworkHiddenLayersSlider,
      display: neuralNetworkHiddenLayersDisplay,
      refreshDisplay: updateNeuralNetworkHiddenLayersDisplay,
      commit: () => { updateNeuralNetworkHiddenLayersDisplay(); updateUrlParameters(); requestUpdate(); },
      ariaLabel: 'Set neural network hidden layers'
    },
    {
      slider: triangleGridVariantSlider,
      display: triangleGridVariantDisplay,
      refreshDisplay: updateTriangleGridVariantDisplay,
      commit: () => { updateTriangleGridVariantDisplay(); updateUrlParameters(); requestUpdate(); },
      ariaLabel: 'Set triangle grid variant'
    },
    {
      slider: trianglesVariantSlider,
      display: trianglesVariantDisplay,
      refreshDisplay: updateTrianglesVariantDisplay,
      commit: () => { updateTrianglesVariantDisplay(); updateUrlParameters(); requestUpdate(); },
      ariaLabel: 'Set triangles variant'
    }
  ].forEach(registerSliderValueEditor);

  // Apply URL parameters if present, otherwise use defaults
  applyUrlParameters();
  updateUrlParameters();

  // Initialize Web Audio API
  initializeAudio();

  // Initialize custom dropdowns
  setupCustomDropdowns();
  syncLunarColorOptionAvailability();
  syncAllCustomSelects();
  updateHeaderBrandPreview(true);

  setupLunarSplashdownCounter();

  // Add global keyboard event listener for more reliable shift detection
  document.addEventListener('keydown', function (event) {
    // Only handle keyboard events on non-mobile devices
    if ('ontouchstart' in window || navigator.maxTouchPoints > 0) {
      return; // Skip keyboard shortcuts on mobile
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
      // Morse, Artemis II mission audio, and music use spacebar for audio transport.
      if (currentShader === 7 || currentShader === 10 || (currentShader === 24 && isMissionControlThemeActive())) {
        event.preventDefault();
        if (isAudioPlaying) {
          stopAudio();
        } else {
          startAudio();
        }
        return;
      }

      // Motion-enabled styles use spacebar to toggle loop preview on and off.
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

      const colorModes = getSelectableColorModes();
      const currentIndex = Math.max(0, colorModes.indexOf(currentColorMode));

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

  const handleDocumentAudioDeactivation = function () {
    if (!audioContext) return;
    pauseAllAudioPlayback({ suspendContext: true });
  };

  document.addEventListener('visibilitychange', function () {
    if (document.hidden) {
      handleDocumentAudioDeactivation();
    }
  });

  window.addEventListener('blur', handleDocumentAudioDeactivation);
  window.addEventListener('pagehide', handleDocumentAudioDeactivation);
  window.addEventListener('beforeunload', handleDocumentAudioDeactivation);
  document.addEventListener('freeze', handleDocumentAudioDeactivation);
}

function handleBinaryInput() {
  const text = binaryInput.value || "RPI";
  updateBinaryData(text);
}

function handleMorseInput() {
  updateMorseData(morseInput.value);
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
  let cleanText = typeof text === 'string' ? text : "RPI";
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

function updateRulerSpeedDisplay() {
  if (!rulerSpeedSlider || !rulerSpeedDisplay) return;
  rulerSpeedSlider.value = String(normalizeLoopSpeed('ruler', rulerSpeedSlider.value));
  rulerSpeedDisplay.textContent = parseFloat(rulerSpeedSlider.value).toFixed(1);
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
  applyTickerWidthRatioBounds(tickerRatioSlider, tickerWidthRatioSlider);
  setTickerWidthRatioDisplayValue(tickerWidthRatioSlider, tickerWidthRatioDisplay);
}

function updateTickerWidthRatioDisplay() {
  applyTickerWidthRatioBounds(tickerRatioSlider, tickerWidthRatioSlider);
  setTickerWidthRatioDisplayValue(tickerWidthRatioSlider, tickerWidthRatioDisplay);
}

function updateTickerSpeedDisplay() {
  if (!tickerSpeedSlider || !tickerSpeedDisplay) return;
  tickerSpeedSlider.value = String(normalizeLoopSpeed('ticker', tickerSpeedSlider.value));
  tickerSpeedDisplay.textContent = parseFloat(tickerSpeedSlider.value).toFixed(1);
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
  if (!waveformSpeedSlider || !waveformSpeedDisplay) return;
  waveformSpeedSlider.value = String(normalizeLoopSpeed('waveform', waveformSpeedSlider.value));
  const sliderValue = parseFloat(waveformSpeedSlider.value);
  waveformSpeedDisplay.textContent = sliderValue.toFixed(1);
}

function updateWaveformEnvelopeWavesDisplay() {
  if (!waveformEnvelopeWavesSlider || !waveformEnvelopeWavesDisplay) return;
  const normalizedValue = typeof normalizeWaveformEnvelopeWaves === 'function'
    ? normalizeWaveformEnvelopeWaves(waveformEnvelopeWavesSlider.value)
    : Math.max(1, Math.min(10, Math.round(parseFloat(waveformEnvelopeWavesSlider.value)) || 1));
  waveformEnvelopeWavesSlider.value = normalizedValue;
  waveformEnvelopeWavesDisplay.textContent = String(normalizedValue);
}

function updateWaveformEnvelopeCenterDisplay() {
  if (!waveformEnvelopeCenterSlider || !waveformEnvelopeCenterDisplay) return;
  const normalizedValue = typeof normalizeWaveformEnvelopeCenter === 'function'
    ? normalizeWaveformEnvelopeCenter(waveformEnvelopeCenterSlider.value)
    : Math.max(-0.5, Math.min(0.5, parseFloat(waveformEnvelopeCenterSlider.value) || 0));
  waveformEnvelopeCenterSlider.value = normalizedValue;
  waveformEnvelopeCenterDisplay.textContent = String(normalizedValue);
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

function updateTrussSegmentsDisplay() {
  if (!trussSegmentsSlider || !trussSegmentsDisplay) return;
  trussSegmentsDisplay.textContent = trussSegmentsSlider.value;
}

function updateTrussThicknessDisplay() {
  if (!trussThicknessSlider || !trussThicknessDisplay) return;
  trussThicknessDisplay.textContent = trussThicknessSlider.value;
}

function updateStaffTempoDisplay() {
  if (!staffTempoSlider || !staffTempoDisplay) return;
  staffTempoDisplay.textContent = staffTempoSlider.value;
}

function updateGraphScaleDisplay() {
  if (!graphScaleSlider || !graphScaleDisplay) return;
  graphScaleSlider.value = Math.max(GRAPH_SCALE_MIN, parseInt(graphScaleSlider.value, 10) || GRAPH_SCALE_DEFAULT);
  graphScaleDisplay.textContent = graphScaleSlider.value;
}

function resetCirclePatternCache() {
  staticCircleData = null;
  redraw();
}

function toggleMobileMenu() {
  const isCompactLayout = isCompactLayoutViewport();

  if (isCompactLayout) {
    const isActive = appSidebar.classList.contains('active');
    if (!isActive) {
      // Opening sidebar in compact overlay layout
      lastFocusedElement = document.activeElement;
      appSidebar.classList.add('active');
      if (mobileMenuToggle) mobileMenuToggle.setAttribute('aria-expanded', 'true');

      setTimeout(() => {
        const firstFocusable = appSidebar.querySelector('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
        if (firstFocusable) firstFocusable.focus();
      }, 100);
    } else {
      // Closing sidebar in compact overlay layout
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
    desktopSidebarWasCollapsed = appSidebar.classList.contains('sidebar-collapsed');
    startWorkspaceResizeTransitionSync(460);
  }

  syncSidebarToggleState();
}

function handleClickOutside(event) {
  // Only apply in compact overlay layout where the sidebar covers the workspace.
  if (!isCompactLayoutViewport()) return;
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

function isMissionControlCreditsMenuActive() {
  return currentColorMode === 'lunar';
}

function hideSaveMenu() {
  if (saveMenu) {
    saveMenu.classList.add('hidden');
    saveMenu.style.position = '';
    saveMenu.style.top = '';
    saveMenu.style.left = '';
    saveMenu.style.right = '';
    saveMenu.style.maxWidth = '';
  }
  if (saveButton) saveButton.setAttribute('aria-expanded', 'false');
}

function positionSaveMenu() {
  if (!saveMenu || !saveButton || saveMenu.classList.contains('hidden')) return;

  saveMenu.style.position = '';
  saveMenu.style.top = '';
  saveMenu.style.left = '';
  saveMenu.style.right = '';
  saveMenu.style.maxWidth = '';

  if (!isCompactLayoutViewport()) return;

  const visualViewport = window.visualViewport || null;
  const viewportWidth = visualViewport && Number.isFinite(visualViewport.width)
    ? visualViewport.width
    : (window.innerWidth || document.documentElement.clientWidth || 0);
  const viewportOffsetLeft = visualViewport && Number.isFinite(visualViewport.offsetLeft)
    ? visualViewport.offsetLeft
    : 0;
  const viewportOffsetTop = visualViewport && Number.isFinite(visualViewport.offsetTop)
    ? visualViewport.offsetTop
    : 0;
  const edgePadding = 8;
  const buttonRect = saveButton.getBoundingClientRect();

  saveMenu.style.position = 'fixed';
  saveMenu.style.top = `${Math.round(viewportOffsetTop + buttonRect.bottom + 6)}px`;
  saveMenu.style.right = 'auto';
  saveMenu.style.maxWidth = `${Math.max(0, Math.floor(viewportWidth - edgePadding * 2))}px`;

  const menuWidth = saveMenu.offsetWidth;
  const minLeft = viewportOffsetLeft + edgePadding;
  const maxLeft = Math.max(minLeft, viewportOffsetLeft + viewportWidth - menuWidth - edgePadding);
  const preferredLeft = buttonRect.right + viewportOffsetLeft - menuWidth;
  const clampedLeft = Math.min(Math.max(preferredLeft, minLeft), maxLeft);

  saveMenu.style.left = `${Math.round(clampedLeft)}px`;
}

function openMissionControlCreditLink(url) {
  const linkedWindow = window.open(url, '_blank', 'noopener,noreferrer');
  if (linkedWindow) linkedWindow.opener = null;
  hideSaveMenu();
}

function setSaveOptionCopy(optionElement, optionCopy) {
  if (!optionElement || !optionCopy) return;

  const labelElement = optionElement.querySelector('.option-label');
  const descriptionElement = optionElement.querySelector('.option-desc');

  if (labelElement) labelElement.textContent = optionCopy.label;
  if (descriptionElement) descriptionElement.textContent = optionCopy.description;
  optionElement.setAttribute('aria-label', `${optionCopy.label}: ${optionCopy.description}`);
}

function syncMissionControlInterfaceCopy() {
  const missionControlActive = isMissionControlCreditsMenuActive();
  const interfaceCopy = missionControlActive ? MISSION_CONTROL_INTERFACE_COPY : DEFAULT_INTERFACE_COPY;

  if (styleSelectLabel) styleSelectLabel.textContent = interfaceCopy.styleLabel;
  if (colorModeSelectLabel) colorModeSelectLabel.textContent = interfaceCopy.colorLabel;
  if (reportProblemLabel) reportProblemLabel.textContent = interfaceCopy.reportProblem;
  if (reportProblemBtn) {
    reportProblemBtn.setAttribute('aria-label', `${interfaceCopy.reportProblem} on GitHub`);
  }
  if (!missionControlActive) closeLunarCounterDetail();
}

function syncMissionControlSaveMenu() {
  const missionControlActive = isMissionControlCreditsMenuActive();
  const menuCopy = missionControlActive ? MISSION_CONTROL_SAVE_MENU_COPY : DEFAULT_SAVE_MENU_COPY;

  if (saveButtonLabel) saveButtonLabel.textContent = menuCopy.button;
  if (saveButton) {
    saveButton.setAttribute(
      'aria-label',
      missionControlActive ? 'Open RPI x Artemis II credits' : 'Open asset download menu'
    );
  }

  setSaveOptionCopy(savePngButton, menuCopy.png);
  setSaveOptionCopy(saveSvgButton, menuCopy.svg);
  setSaveOptionCopy(saveLoopGifButton, menuCopy.gif);

  if (saveLoopGifButton && missionControlActive) {
    saveLoopGifButton.hidden = false;
  } else {
    updateLoopingGifSaveOption();
  }
}

function handleSavePngClick(event) {
  if (isMissionControlCreditsMenuActive()) {
    event.preventDefault();
    event.stopPropagation();
    openMissionControlCreditLink(ARTEMIS_CREDIT_LINKS.reidWiseman);
    return;
  }

  savePNG();
}

function handleSaveSvgClick(event) {
  if (isMissionControlCreditsMenuActive()) {
    event.preventDefault();
    event.stopPropagation();
    openMissionControlCreditLink(ARTEMIS_CREDIT_LINKS.rpiEngineers);
    return;
  }

  saveSVG();
}

function handleSaveLoopGifClick(event) {
  if (isMissionControlCreditsMenuActive()) {
    event.preventDefault();
    event.stopPropagation();
    openMissionControlCreditLink(ARTEMIS_CREDIT_LINKS.rpiEngineers);
    return;
  }

  saveLoopingGIF();
}

function toggleSaveMenu(e) {
  if (e) e.stopPropagation();

  if (saveMenu) {
    syncMissionControlSaveMenu();
    saveMenu.classList.toggle('hidden');
    const isExpanded = !saveMenu.classList.contains('hidden');
    if (saveButton) saveButton.setAttribute('aria-expanded', isExpanded);
    if (isExpanded) {
      requestAnimationFrame(positionSaveMenu);
    } else {
      hideSaveMenu();
    }
  }
}

function updateLoopingGifSaveOption() {
  if (!saveLoopGifButton) return;
  if (isMissionControlCreditsMenuActive()) {
    saveLoopGifButton.hidden = false;
    return;
  }

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

  const isCompactLayout = isCompactLayoutViewport();
  const isExpanded = isCompactLayout
    ? appSidebar.classList.contains('active')
    : !appSidebar.classList.contains('sidebar-collapsed');

  mobileMenuToggle.setAttribute('aria-expanded', isExpanded ? 'true' : 'false');
  mobileMenuToggle.setAttribute('aria-label', isExpanded ? 'Close design controls' : 'Open design controls');
}

function handleSidebarTransitionEnd(event) {
  if (!isWorkspaceResizeTransitionActive || !appSidebar) return;
  if (event.target !== appSidebar) return;

  const propertyName = event.propertyName || '';
  if (!propertyName || propertyName === 'transform' || propertyName.startsWith('margin-')) {
    finishWorkspaceResizeTransitionSync();
  }
}

function handleStyleChange() {
  // Get the selected style from dropdown
  const selectedStyle = normalizeStyleValue(styleSelect ? styleSelect.value : 'solid');
  if (styleSelect && styleSelect.value !== selectedStyle) {
    styleSelect.value = selectedStyle;
  }

  syncLunarColorOptionAvailability();
  if (selectedStyle !== 'lunar' && currentColorMode === 'lunar') {
    applyColorMode(lastNonLunarColorMode || DEFAULT_COLOR_MODE);
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
    case 'lunar':
      currentShader = 24;
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
    if (lunarGroup) lunarGroup.style.display = 'none';
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
        isAnimated = true;
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
      case 'lunar':
        syncLunarPreviewVisibility(selectedStyle);
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

    syncMotionToggleState();

    stopAudio();
  }

  syncLunarPreviewVisibility(selectedStyle);
  console.log('Style changed to:', selectedStyle, 'currentShader:', currentShader);
  syncMissionControlSaveMenu();
  updateSidebarScrollFadeState();
  updateAudioControlsUI();
  requestUpdate();
}

function handleColorModeChange() {
  const selectedColorMode = colorModeSelect ? colorModeSelect.value : DEFAULT_COLOR_MODE;
  applyColorMode(selectedColorMode);
}

function applyColorMode(colorMode) {
  const normalizedColorMode = normalizeColorModeValue(colorMode);
  currentColorMode = normalizedColorMode === 'lunar' && !isLunarStyleSelected()
    ? (lastNonLunarColorMode || DEFAULT_COLOR_MODE)
    : normalizedColorMode;

  if (currentColorMode !== 'lunar') {
    lastNonLunarColorMode = currentColorMode;
  }

  syncLunarColorOptionAvailability();

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

  syncMissionControlInterfaceCopy();
  syncMissionControlSaveMenu();
  syncLunarPreviewVisibility();
  updateAudioControlsUI();
  if (activeAudioPreviewType === 'lunar' && !isMissionControlThemeActive(currentColorMode)) {
    stopAudio();
  }
  console.log('Color mode applied:', currentColorMode);
  requestUpdate();
}

function buildHeaderPreviewSVG() {
  const currentWidth = REFERENCE_WIDTH;
  const logoHeight = REFERENCE_TOTAL_HEIGHT;
  const fgColor = 'currentColor';
  const barY = REFERENCE_BAR_Y;
  const barHeight = REFERENCE_BAR_HEIGHT;
  const exactBarWidth = REFERENCE_WIDTH;
  const barStartX = 0;
  const loopAnimationState = getCurrentLoopAnimationState(exactBarWidth);
  const timeSeconds = loopAnimationState
    ? loopAnimationState.timeSeconds
    : (typeof window.animationTime !== 'undefined'
      ? window.animationTime
      : (typeof millis === 'function' ? millis() / 1000.0 : 0));

  let svgContent = `
<svg viewBox="0 0 ${currentWidth} ${logoHeight}" xmlns="http://www.w3.org/2000/svg" role="presentation" focusable="false" aria-hidden="true" style="overflow: visible;">
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
        loopOffsetX: loopAnimationState ? loopAnimationState.loopOffsetX : 0,
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
        circlesFill: circlesFillSelect ? circlesFillSelect.value : 'stroke',
        circlesDensity: circlesDensitySlider ? circlesDensitySlider.value : 50,
        circlesSizeVariation: circlesSizeVariationSlider ? circlesSizeVariationSlider.value : 0,
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

  if (!isMotionEnabledForStyle(getCurrentMotionStyle())) {
    redraw();
  }
}

function styleSupportsAudio(style) {
  return style === 'binary'
    || style === 'ticker'
    || style === 'waveform'
    || style === 'morse'
    || style === 'music'
    || style === 'lunar';
}

function showAudioToast(message, type = 'info') {
  if (typeof Toast !== 'undefined' && Toast && typeof Toast.show === 'function') {
    Toast.show(message, type);
  }
}

function updateAudioControlsUI() {
  const activeType = getActiveAudioPreviewType();
  const staffPreviewDisabled = !currentStaffNotes || currentStaffNotes.length === 0;
  const lunarPreviewDisabled = !isMissionControlThemeActive();

  getAudioButtonConfig().forEach(({ type, button, currentShader: shaderId }) => {
    const isStaffControl = type === 'staff' && shaderId === 10;
    const isLunarControl = type === 'lunar' && shaderId === 24;
    const disabled = (isStaffControl && staffPreviewDisabled) || (isLunarControl && lunarPreviewDisabled);
    const disabledReason = isStaffControl
      ? 'Add notes first'
      : (isLunarControl ? 'Use Mission Control theme' : 'Unavailable');

    renderPreviewButton(button, 'audio', {
      active: activeType === type && isAudioPlaying,
      disabled,
      disabledReason
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
function executePackingPhase(barWidth, barHeight, existingCircles, phase) {
  const newCircles = [];
  const minDistanceMultiplier = 2.0;

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
function executeGapFillingPhase(barWidth, barHeight, existingCircles, density, sizeVariation) {
  const gapFillingCircles = [];
  const minDistanceMultiplier = 2.0;

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
function generateGridCircles(barWidth, barHeight, rows, gridDensity, sizeVariationY, sizeVariationX, layout) {
  const circles = [];

  // Safety guards
  if (barWidth <= 0 || barHeight <= 0 || rows < 1) return [];
  const safeDensity = Math.max(10, Math.min(100, parseFloat(gridDensity) || 50));
  const safeVariationY = Math.max(0, Math.min(100, parseFloat(sizeVariationY) || 0));
  const safeVariationX = Math.max(0, Math.min(100, parseFloat(sizeVariationX) || 0));

  // Calculate base circle radius that fits the number of rows
  const baseRadius = Math.max(0.5, (barHeight / (rows * 2)) * (safeDensity / 100));
  const rowHeight = barHeight / rows;

  // Calculate how many circles fit horizontally based on circle diameter
  const circleDiameter = baseRadius * 2;
  const baseColsPerRow = Math.max(2, Math.ceil(barWidth / circleDiameter) + 1);
  const colsPerRow = baseColsPerRow;

  for (let row = 0; row < rows; row++) {
    const rowProgress = rows > 1 ? row / (rows - 1) : 0.5; // 0 to 1 from top to bottom

    // Calculate Y position for this row
    const baseY = rowHeight * row + rowHeight / 2;

    // Calculate size variation for Y (top to bottom)
    const yVariationFactor = 1 + (safeVariationY / 100) * (1 - rowProgress * 2); // -1 to 1, then scaled

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

      // Calculate size variation for X (left to right)
      const xVariationFactor = 1 + (safeVariationX / 100) * (colProgress * 2 - 1); // -1 to 1, then scaled

      // Combine both variation factors
      const combinedVariationFactor = yVariationFactor * xVariationFactor;
      const finalRadius = Math.max(0.5, baseRadius * combinedVariationFactor);

      circles.push({
        x: Math.max(0, Math.min(barWidth, baseX)),
        y: Math.max(0, Math.min(barHeight, baseY)),
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

function isMissionControlThemeActive(colorMode = currentColorMode) {
  return normalizeColorModeValue(colorMode) === 'lunar';
}

function syncLunarPreviewVisibility(selectedStyle = normalizeStyleValue(styleSelect ? styleSelect.value : 'solid')) {
  if (!lunarGroup) return;

  lunarGroup.style.display = selectedStyle === 'lunar' && isMissionControlThemeActive()
    ? 'block'
    : 'none';
}

function handleArtemisMissionAudioEnded() {
  if (activeAudioPreviewType !== 'lunar') {
    return;
  }

  isAudioPlaying = false;
  activeAudioPreviewType = null;
  updateAudioControlsUI();
}

function ensureArtemisMissionAudio() {
  if (artemisMissionAudio) {
    return artemisMissionAudio;
  }

  if (typeof Audio !== 'function') {
    return null;
  }

  artemisMissionAudio = new Audio(ARTEMIS_II_AUDIO_SOURCE);
  artemisMissionAudio.preload = 'auto';
  artemisMissionAudio.playsInline = true;
  artemisMissionAudio.addEventListener('ended', handleArtemisMissionAudioEnded);

  return artemisMissionAudio;
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
  try {
    const requestedType = getCurrentAudioPreviewType();
    if (!requestedType) {
      updateAudioControlsUI();
      return;
    }

    if (isAudioPlaying) {
      updateAudioControlsUI();
      return;
    }

    if (requestedType === 'lunar') {
      await startArtemisMissionAudio();
    } else {
      if (!audioContext) {
        updateAudioControlsUI();
        return;
      }

      // Resume audio context if suspended (required by browsers)
      if (audioContext.state === 'suspended') {
        await audioContext.resume();
      }

      if (audioContext.state !== 'running') {
        showAudioToast('Audio is blocked by the browser. Click the page and try again.', 'warning');
        updateAudioControlsUI();
        return;
      }

      if (requestedType === 'waveform') {
        startWaveformAudio();
      } else if (requestedType === 'binary') {
        startSequenceAudio('binary');
      } else if (requestedType === 'morse') {
        startSequenceAudio('morse');
      } else if (requestedType === 'ticker') {
        startSequenceAudio('ticker');
      } else if (requestedType === 'staff') {
        if (!currentStaffNotes || currentStaffNotes.length === 0) {
          showAudioToast('Add notes to the keyboard before previewing music audio.', 'info');
          updateAudioControlsUI();
          return;
        }
        startSequenceAudio('staff');
      }
    }
    if (isAudioPlaying) {
      activeAudioPreviewType = requestedType;
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

async function startArtemisMissionAudio() {
  if (!isMissionControlThemeActive()) {
    showAudioToast('Artemis II audio is only available in the Mission Control theme.', 'info');
    return;
  }

  const audioElement = ensureArtemisMissionAudio();
  if (!audioElement) {
    throw new Error('Unable to initialize Artemis II audio element');
  }

  audioElement.pause();
  audioElement.currentTime = 0;

  const playResult = audioElement.play();
  if (playResult && typeof playResult.then === 'function') {
    await playResult;
  }

  isAudioPlaying = true;
  console.log('Artemis II audio started');
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

function pauseAllAudioPlayback(options = {}) {
  if (isAudioPlaying || sequenceContext.active || activeAudioPreviewType) {
    stopAudio();
  }

  if (options.suspendContext && audioContext && audioContext.state === 'running') {
    audioContext.suspend().catch((error) => {
      console.warn('Unable to suspend audio context:', error);
    });
  }
}

function stopAudio() {
  const activeType = getActiveAudioPreviewType() || sequenceContext.type;
  if (!activeType && !isAudioPlaying && !sequenceContext.active) return;

  if (activeType === 'waveform') {
    stopWaveformAudio();
  } else if (activeType === 'lunar') {
    stopArtemisMissionAudio();
  } else {
    stopSequenceAudio();
  }

  isAudioPlaying = false;
  activeAudioPreviewType = null;
  console.log('Audio stopped');
  updateAudioControlsUI();
}

function stopArtemisMissionAudio() {
  if (!artemisMissionAudio) {
    return;
  }

  artemisMissionAudio.pause();
  try {
    artemisMissionAudio.currentTime = 0;
  } catch (error) {
    console.warn('Unable to reset Artemis II audio position:', error);
  }
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
    activeAudioPreviewType = null;

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
    sequenceContext.type = null;
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
  const routeStyle = window.__RPI_GENERATOR_ROUTE_STYLE__
    ? normalizeStyleValue(window.__RPI_GENERATOR_ROUTE_STYLE__)
    : (window.GeneratorRoutes && typeof window.GeneratorRoutes.getGeneratorRouteStyleFromPathname === 'function'
      ? window.GeneratorRoutes.getGeneratorRouteStyleFromPathname(window.location.pathname)
      : null);
  const style = normalizeStyleValue(routeStyle || params.get('style') || 'solid');
  const requestedColorMode = normalizeColorModeValue(params.get('colorMode') || DEFAULT_COLOR_MODE);
  const colorMode = style === 'lunar' || requestedColorMode !== 'lunar'
    ? requestedColorMode
    : DEFAULT_COLOR_MODE;

  return {
    style,
    colorMode,

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
    rulerSpeed: normalizeLoopSpeed('ruler', params.get('rulerSpeed')),
    rulerReverse: params.get('rulerReverse') === 'true',

    // Ticker parameters
    tickerRepeats: parseInt(params.get('tickerRepeats')) || 34,
    tickerRatio: parseInt(params.get('tickerRatio')) || 2,
    tickerWidthRatio: parseInt(params.get('tickerWidthRatio')) || 2,
    tickerSpeed: normalizeLoopSpeed('ticker', params.get('tickerSpeed')),
    tickerReverse: params.get('tickerReverse') === 'true',

    // Waveform parameters
    waveformType: parseFloat(params.get('waveformType')) || 0,
    waveformFrequency: parseInt(params.get('waveformFrequency')) || 24,
    waveformSpeed: normalizeLoopSpeed('waveform', params.get('waveformSpeed')),
    waveformReverse: params.get('waveformReverse') === 'true',

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
    circlesFill: params.get('circlesFill') || 'stroke',
    circlesDensity: parseInt(params.get('circlesDensity')) || 50,
    circlesSizeVariation: parseInt(params.get('circlesSizeVariation')) || 0,

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
    morseText: params.has('morseText') ? params.get('morseText') : 'RPI'
  };
}

function updateUrlParameters() {
  const params = new URLSearchParams();
  const selectedStyle = normalizeStyleValue(styleSelect ? styleSelect.value : 'solid');

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
    if (rulerSpeedSlider && parseFloat(rulerSpeedSlider.value) !== 1) {
      params.set('rulerSpeed', rulerSpeedSlider.value);
    }
    if (rulerReverseToggle && rulerReverseToggle.checked) {
      params.set('rulerReverse', 'true');
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
    if (tickerSpeedSlider && parseFloat(tickerSpeedSlider.value) !== 1) {
      params.set('tickerSpeed', tickerSpeedSlider.value);
    }
    if (tickerReverseToggle && tickerReverseToggle.checked) {
      params.set('tickerReverse', 'true');
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
    if (waveformReverseToggle && waveformReverseToggle.checked) {
      params.set('waveformReverse', 'true');
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
    if (circlesFillSelect && circlesFillSelect.value !== 'stroke') {
      params.set('circlesFill', circlesFillSelect.value);
    }

    if (circlesDensitySlider && parseInt(circlesDensitySlider.value) !== 50) {
      params.set('circlesDensity', circlesDensitySlider.value);
    }
    if (circlesSizeVariationSlider && parseInt(circlesSizeVariationSlider.value) !== 0) {
      params.set('circlesSizeVariation', circlesSizeVariationSlider.value);
    }
  }

  // Update URL without reloading the page
  const newUrl = window.GeneratorRoutes && typeof window.GeneratorRoutes.buildGeneratorUrl === 'function'
    ? window.GeneratorRoutes.buildGeneratorUrl(selectedStyle, params, window.location.pathname)
    : (params.toString() ? `${window.location.pathname}?${params.toString()}` : window.location.pathname);
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
  updateTrussSegmentsDisplay();
  updateTrussThicknessDisplay();

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
  }
  updateStaffTempoDisplay();
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
  updateGraphScaleDisplay();

  // Apply ruler parameters
  if (rulerRepeatsSlider) {
    rulerRepeatsSlider.value = params.rulerRepeats;
  }
  if (rulerUnitsSlider) {
    rulerUnitsSlider.value = params.rulerUnits;
  }
  if (rulerSpeedSlider) {
    rulerSpeedSlider.value = params.rulerSpeed;
  }
  if (rulerReverseToggle) {
    rulerReverseToggle.checked = params.rulerReverse;
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
  if (tickerSpeedSlider) {
    tickerSpeedSlider.value = params.tickerSpeed;
  }
  if (tickerReverseToggle) {
    tickerReverseToggle.checked = params.tickerReverse;
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
  if (waveformReverseToggle) {
    waveformReverseToggle.checked = params.waveformReverse;
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
  updateWaveformEnvelopeWavesDisplay();
  if (waveformEnvelopeCenterSlider) {
    waveformEnvelopeCenterSlider.value = params.waveformEnvelopeCenter;
  }
  updateWaveformEnvelopeCenterDisplay();
  if (waveformEnvelopeBipolarToggle) {
    waveformEnvelopeBipolarToggle.checked = params.waveformEnvelopeBipolar === 'true';
  }

  // Apply circles parameters
  if (circlesFillSelect) {
    circlesFillSelect.value = params.circlesFill;
  }
  if (circlesDensitySlider) {
    circlesDensitySlider.value = params.circlesDensity;
  }
  if (circlesSizeVariationSlider) {
    circlesSizeVariationSlider.value = params.circlesSizeVariation;
  }

  // Update all displays and trigger style change
  updateAllDisplays();
  handleStyleChange();
  resetCirclePatternCache();

  // Update binary data
  updateBinaryData(params.binaryText);
}

function updateAllDisplays() {
  // Update all slider displays
  updateRulerRepeatsDisplay();
  updateRulerUnitsDisplay();
  updateRulerSpeedDisplay();
  updateTickerDisplay();
  updateTickerRatioDisplay();
  updateTickerWidthRatioDisplay();
  updateTickerSpeedDisplay();
  updateWaveformTypeDisplay();
  updateWaveformFrequencyDisplay();
  updateWaveformSpeedDisplay();
  updateWaveformEnvelopeWavesDisplay();
  updateWaveformEnvelopeCenterDisplay();
  updateCirclesDensityDisplay();
  updateCirclesSizeVariationDisplay();
  updateCirclesGradientVariantDisplay();
  updateGradientVariantDisplay();
  updateGridVariantDisplay();
  updatePointConnectVariantDisplay();
  updateNeuralNetworkHiddenLayersDisplay();
  updateTriangleGridVariantDisplay();
  updateTrianglesVariantDisplay();
  updateTrussSegmentsDisplay();
  updateTrussThicknessDisplay();
  updateStaffTempoDisplay();
  updateGraphScaleDisplay();
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

function windowResized() {
  syncViewportHeightVar();
  scheduleResponsiveCanvasResize();
  requestResponsiveWorkspaceSizing();
}

// Frame rate limiting for performance
let lastFrameTime = 0;
const TARGET_FPS = 60;
const FRAME_INTERVAL = 1000 / TARGET_FPS;
let hasBoundViewportHeightSync = false;

function getViewportHeight() {
  const visualViewportHeight = window.visualViewport && Number.isFinite(window.visualViewport.height)
    ? window.visualViewport.height
    : 0;

  if (visualViewportHeight > 0) {
    return visualViewportHeight;
  }

  return window.innerHeight || document.documentElement.clientHeight || 0;
}

function syncViewportHeightVar() {
  const nextHeight = Math.round(getViewportHeight());
  const currentHeight = parseInt(document.documentElement.style.getPropertyValue('--viewport-height'), 10);
  if (nextHeight > 0) {
    document.documentElement.style.setProperty('--viewport-height', `${nextHeight}px`);
  }
  return nextHeight > 0 && currentHeight !== nextHeight;
}

function handleViewportHeightChange() {
  const viewportHeightChanged = syncViewportHeightVar();
  const layoutModeChanged = syncResponsiveLayoutMode();
  positionSaveMenu();
  if (viewportHeightChanged || layoutModeChanged) {
    scheduleResponsiveCanvasResize();
  }
  requestResponsiveWorkspaceSizing();
}

function setupViewportHeightSync() {
  syncViewportHeightVar();

  if (hasBoundViewportHeightSync) return;
  hasBoundViewportHeightSync = true;

  window.addEventListener('resize', handleViewportHeightChange, { passive: true });

  if (window.visualViewport) {
    window.visualViewport.addEventListener('resize', handleViewportHeightChange, { passive: true });
    window.visualViewport.addEventListener('scroll', handleViewportHeightChange, { passive: true });
  }
}

function draw() {
  // Limit frame rate to prevent excessive computation
  const currentTime = millis();
  const deltaTime = currentTime - lastFrameTime;
  if (deltaTime < FRAME_INTERVAL) {
    return;
  }
  lastFrameTime = currentTime;

  if (isMotionEnabledForStyle(getCurrentMotionStyle())) {
    if (typeof window.animationTime === 'undefined') {
      window.animationTime = 0;
    }
    window.animationTime += deltaTime / 1000.0;
  }

  // Get current color scheme
  const colorScheme = colors[currentColorMode];
  const responsiveLogoScale = getResponsiveLogoScale();

  // Keep the canvas transparent so the mark sits directly on the themed workspace.
  clear();

  // Use exact 250px reference dimensions
  const currentWidth = REFERENCE_WIDTH;
  const logoHeight = REFERENCE_LOGO_HEIGHT; // Exact height from 250px reference

  // Reset shader for regular drawing
  resetShader();



  // Draw the SVG logo
  push();
  translate(-width / 2, -height / 2); // Convert to screen coordinates for WEBGL
  translate(width / 2, height / 2);

  // Keep 100% zoom proportional to the visible workspace instead of fixed CSS pixels.
  scale(responsiveLogoScale);

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

  if (isAnimated && isMotionEnabledForStyle(getCurrentMotionStyle()) && currentTime - lastHeaderPreviewUpdateTime >= 120) {
    updateHeaderBrandPreview(true);
  }
}

function drawBottomBar(currentWidth) {
  const responsiveLogoScale = getResponsiveLogoScale();

  // Use the exact same coordinate system and positioning as the logo
  push();
  translate(-width / 2, -height / 2); // Convert to screen coordinates for WEBGL
  translate(width / 2, height / 2);

  // Scale the same as logo
  scale(responsiveLogoScale);

  // Viewport View Transformation
  translate(panOffset.x, panOffset.y);
  scale(zoomLevel);

  // Center the same as logo
  translate(-currentWidth / 2, LOGO_VERTICAL_OFFSET);

  // Position the bar to match 250px reference exactly
  translate(0, REFERENCE_BAR_Y); // Match exact bar Y position from 250px reference

  // Calculate bar dimensions to match 250px reference exactly
  const exactBarWidth = REFERENCE_WIDTH; // Exact width from 250px reference
  const rectHeight = REFERENCE_BAR_HEIGHT; // Exact height from 250px reference
  const barStartX = 0; // Exact X position from 250px reference

  // Get current foreground color
  const colorScheme = colors[currentColorMode];
  const fgColor = colorScheme ? color(colorScheme.fg) : color(0);
  const currentMotionStyle = getCurrentMotionStyle();
  const loopAnimationState = getCurrentLoopAnimationState(exactBarWidth);

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
    const rulerGeometry = createRulerPatternGeometry({
      barStartX,
      barY: 0,
      exactBarWidth,
      barHeight: rectHeight,
      rulerRepeats: rulerRepeatsSlider ? rulerRepeatsSlider.value : 10,
      rulerUnits: rulerUnitsSlider ? rulerUnitsSlider.value : 4,
      loopOffsetX: currentMotionStyle === 'ruler' && loopAnimationState ? loopAnimationState.loopOffsetX : 0
    });

    for (let i = 0; i < rulerGeometry.rects.length; i++) {
      const rulerRect = rulerGeometry.rects[i];
      rect(rulerRect.x, rulerRect.y, rulerRect.width, rulerRect.height);
    }

  } else if (currentShader === 2) {
    // Ticker mode - aligned top and bottom ticks with proper ratios
    resetShader();
    fill(fgColor);
    noStroke();

    const tickerGeometry = createTickerPatternGeometry({
      barStartX,
      barY: 0,
      exactBarWidth,
      barHeight: rectHeight,
      tickerRepeats: tickerSlider ? tickerSlider.value : 34,
      tickerRatio: tickerRatioSlider ? tickerRatioSlider.value : 2,
      tickerWidthRatio: tickerWidthRatioSlider ? tickerWidthRatioSlider.value : 2,
      loopOffsetX: currentMotionStyle === 'ticker' && loopAnimationState ? loopAnimationState.loopOffsetX : 0
    });

    for (let i = 0; i < tickerGeometry.rects.length; i++) {
      const tickerRect = tickerGeometry.rects[i];
      rect(tickerRect.x, tickerRect.y, tickerRect.width, tickerRect.height);
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
    const time = currentMotionStyle === 'waveform' && loopAnimationState
      ? loopAnimationState.timeSeconds
      : 0;
    const points = getWaveformRenderPointCount(exactBarWidth, frequency);
    const {
      applyEnvelope,
      envType,
      envWaves,
      envCenter,
      bipolar
    } = getWaveformEnvelopeSettings();

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
      let wave = generateWaveformValue(rawPhase, waveType);
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

    const fillStyle = circlesFillSelect.value;

    if (fillStyle === 'fill') {
      fill(fgColor);
      noStroke();
    } else {
      noFill();
      stroke(fgColor);
      strokeWeight(1);
    }

    const density = parseInt(circlesDensitySlider.value);
    const sizeVariation = parseInt(circlesSizeVariationSlider.value);

    drawCirclePattern(null, barStartX, 0, exactBarWidth, rectHeight, density, sizeVariation);
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

    const text = morseInput ? morseInput.value : "RPI";
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
  } else if (currentShader === 24) {
    // Lunar pattern sourced from the Artemis bar asset.
    resetShader();
    drawLunarBarPattern(null, barStartX, 0, exactBarWidth, rectHeight, colorScheme ? colorScheme.fg : '#000000');
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
  const currentStyle = getCurrentMotionStyle();
  if (!currentStyle) {
    return;
  }

  setMotionEnabledForStyle(currentStyle, !isMotionEnabledForStyle(currentStyle));
}

function applyPanEdgeInset(min, max) {
  if (min > max) {
    return { min: max, max: min };
  }

  const edgeInset = PAN_EDGE_PADDING / getResponsiveLogoScale();
  if (max - min <= edgeInset * 2) {
    const midpoint = (min + max) / 2;
    return { min: midpoint, max: midpoint };
  }

  return { min: min + edgeInset, max: max - edgeInset };
}

function getPanBounds() {
  const responsiveLogoScale = getResponsiveLogoScale();
  const horizontalBounds = applyPanEdgeInset(
    125 * zoomLevel - width / (2 * responsiveLogoScale),
    width / (2 * responsiveLogoScale) - 125 * zoomLevel
  );
  let minX = horizontalBounds.min;
  let maxX = horizontalBounds.max;
  if (minX > maxX) {
    let temp = minX; minX = maxX; maxX = temp;
  }

  const verticalBounds = applyPanEdgeInset(
    72 * zoomLevel - height / (2 * responsiveLogoScale),
    height / (2 * responsiveLogoScale) - 79 * zoomLevel
  );
  let minY = verticalBounds.min;
  let maxY = verticalBounds.max;
  if (minY > maxY) {
    let temp = minY; minY = maxY; maxY = temp;
  }

  return { minX, maxX, minY, maxY };
}

function clampPanPoint(point) {
  const bounds = getPanBounds();
  point.x = constrain(point.x, bounds.minX, bounds.maxX);
  point.y = constrain(point.y, bounds.minY, bounds.maxY);
  return point;
}

function stopPanAnimation() {
  if (panAnimationFrame) {
    cancelAnimationFrame(panAnimationFrame);
    panAnimationFrame = 0;
  }
}

function renderPanOffsetChange() {
  if (!isMotionEnabledForStyle(getCurrentMotionStyle())) redraw();
}

function setPanOffset(nextOffset, options = {}) {
  const clampedOffset = clampPanPoint({ x: nextOffset.x, y: nextOffset.y });
  panTargetOffset = { ...clampedOffset };
  panVelocity = { x: 0, y: 0 };

  if (options.immediate) {
    stopPanAnimation();
    panOffset = { ...clampedOffset };
    renderPanOffsetChange();
    return;
  }

  startPanAnimation();
}

function clampPanOffset() {
  clampPanPoint(panOffset);
  clampPanPoint(panTargetOffset);
}

function startPanAnimation() {
  if (panAnimationFrame) return;
  panAnimationFrame = requestAnimationFrame(animatePanOffset);
}

function animatePanOffset() {
  panAnimationFrame = 0;

  if (!isPanDragging) {
    panTargetOffset.x += panVelocity.x;
    panTargetOffset.y += panVelocity.y;
    clampPanPoint(panTargetOffset);

    const hitHorizontalEdge = panTargetOffset.x === getPanBounds().minX || panTargetOffset.x === getPanBounds().maxX;
    const hitVerticalEdge = panTargetOffset.y === getPanBounds().minY || panTargetOffset.y === getPanBounds().maxY;
    panVelocity.x = hitHorizontalEdge ? 0 : panVelocity.x * PAN_INERTIA_DECAY;
    panVelocity.y = hitVerticalEdge ? 0 : panVelocity.y * PAN_INERTIA_DECAY;
  }

  const deltaX = panTargetOffset.x - panOffset.x;
  const deltaY = panTargetOffset.y - panOffset.y;
  panOffset.x += deltaX * PAN_FOLLOW_EASE;
  panOffset.y += deltaY * PAN_FOLLOW_EASE;
  clampPanPoint(panOffset);
  renderPanOffsetChange();

  const isStillMoving = Math.abs(deltaX) > PAN_SETTLE_THRESHOLD ||
    Math.abs(deltaY) > PAN_SETTLE_THRESHOLD ||
    Math.abs(panVelocity.x) > PAN_INERTIA_STOP_THRESHOLD ||
    Math.abs(panVelocity.y) > PAN_INERTIA_STOP_THRESHOLD;

  if (isStillMoving) {
    startPanAnimation();
    return;
  }

  panOffset = { ...panTargetOffset };
  panVelocity = { x: 0, y: 0 };
  renderPanOffsetChange();
}

function zoomCanvas(amount) {
  setZoomLevel(zoomLevel + amount);
}

function setZoomLevel(nextZoomLevel) {
  const clampedZoomLevel = constrain(nextZoomLevel, MIN_ZOOM_LEVEL, MAX_ZOOM_LEVEL);
  const zoomChanged = Math.abs(clampedZoomLevel - zoomLevel) > 0.0001;

  zoomLevel = clampedZoomLevel;

  clampPanOffset();

  if (zoomLevelDisplay && document.activeElement !== zoomLevelDisplay) {
    zoomLevelDisplay.value = zoomLevelToDisplayPercent(zoomLevel) + '%';
  }

  if (zoomChanged && !isMotionEnabledForStyle(getCurrentMotionStyle())) redraw();
}

function getTouchDistance(touches) {
  if (!touches || touches.length < 2) return 0;

  const firstTouch = touches[0];
  const secondTouch = touches[1];
  return Math.hypot(secondTouch.clientX - firstTouch.clientX, secondTouch.clientY - firstTouch.clientY);
}

function stopCanvasPinchGesture() {
  isCanvasPinching = false;
  pinchTouchState = null;
  safariGestureStartZoomLevel = null;
}

function updatePanTouchAction() {
  if (!canvasViewport) return;
  canvasViewport.classList.toggle('is-pan-active', isPanningMode);
}

function clearPanPointerState() {
  if (canvasViewport && panPointerId != null && canvasViewport.hasPointerCapture && canvasViewport.hasPointerCapture(panPointerId)) {
    try {
      canvasViewport.releasePointerCapture(panPointerId);
    } catch (error) {
      // Ignore release failures when the pointer is already inactive.
    }
  }

  panPointerId = null;
  panPointerPosition = null;
}

function applyPanDragDelta(deltaX, deltaY) {
  if (!isPanningMode) return;

  isPanDragging = true;
  const resistedX = deltaX * PAN_DRAG_RESISTANCE;
  const resistedY = deltaY * PAN_DRAG_RESISTANCE;
  panTargetOffset.x += resistedX;
  panTargetOffset.y += resistedY;
  panVelocity.x = resistedX;
  panVelocity.y = resistedY;
  clampPanPoint(panTargetOffset);
  startPanAnimation();
}

function bindPanGestureHandlers() {
  if (panGestureHandlersBound || !canvasViewport) return;
  panGestureHandlersBound = true;

  canvasViewport.addEventListener('pointerdown', (event) => {
    if (!isPanningMode) return;
    if (event.pointerType === 'mouse') return;

    panPointerId = event.pointerId;
    panPointerPosition = { x: event.clientX, y: event.clientY };

    if (canvasViewport.setPointerCapture) {
      canvasViewport.setPointerCapture(event.pointerId);
    }

    event.preventDefault();
  });

  canvasViewport.addEventListener('pointermove', (event) => {
    if (!isPanningMode || panPointerId !== event.pointerId || !panPointerPosition) return;

    const deltaX = event.clientX - panPointerPosition.x;
    const deltaY = event.clientY - panPointerPosition.y;
    panPointerPosition = { x: event.clientX, y: event.clientY };

    if (deltaX === 0 && deltaY === 0) return;

    event.preventDefault();
    applyPanDragDelta(deltaX, deltaY);
  });

  const finishPointerPan = (event) => {
    if (panPointerId !== event.pointerId) return;
    clearPanPointerState();
    endPanDrag();
  };

  canvasViewport.addEventListener('pointerup', finishPointerPan);
  canvasViewport.addEventListener('pointercancel', finishPointerPan);
}

function bindCanvasPinchHandlers() {
  if (pinchGestureHandlersBound || !canvasViewport) return;
  pinchGestureHandlersBound = true;

  canvasViewport.addEventListener('touchstart', (event) => {
    if (event.touches.length < 2) return;

    const distance = getTouchDistance(event.touches);
    if (!distance) return;

    clearPanPointerState();
    endPanDrag();
    isCanvasPinching = true;
    pinchTouchState = {
      distance,
      zoomLevel
    };
    event.preventDefault();
  }, { passive: false });

  canvasViewport.addEventListener('touchmove', (event) => {
    if (!pinchTouchState || event.touches.length < 2) return;

    const nextDistance = getTouchDistance(event.touches);
    if (!nextDistance || !pinchTouchState.distance) return;

    isCanvasPinching = true;
    event.preventDefault();
    setZoomLevel(pinchTouchState.zoomLevel * (nextDistance / pinchTouchState.distance));
  }, { passive: false });

  const finishCanvasTouchGesture = (event) => {
    if (event.touches.length >= 2) {
      const distance = getTouchDistance(event.touches);
      if (!distance) return;

      pinchTouchState = {
        distance,
        zoomLevel
      };
      isCanvasPinching = true;
      return;
    }

    stopCanvasPinchGesture();
  };

  canvasViewport.addEventListener('touchend', finishCanvasTouchGesture, { passive: true });
  canvasViewport.addEventListener('touchcancel', finishCanvasTouchGesture, { passive: true });
}

function bindBrowserZoomGuards() {
  if (browserZoomGuardsBound) return;
  browserZoomGuardsBound = true;

  window.addEventListener('wheel', (event) => {
    if (!event.ctrlKey) return;

    const eventTarget = event.target;
    const isCanvasGesture = !!(canvasViewport && eventTarget instanceof Node && canvasViewport.contains(eventTarget));
    event.preventDefault();

    if (!isCanvasGesture) return;

    const zoomMultiplier = Math.exp(-event.deltaY * TRACKPAD_PINCH_ZOOM_SENSITIVITY);
    setZoomLevel(zoomLevel * zoomMultiplier);
  }, { passive: false });

  const supportsTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  if (supportsTouch) return;

  document.addEventListener('gesturestart', (event) => {
    const eventTarget = event.target;
    const isCanvasGesture = !!(canvasViewport && eventTarget instanceof Node && canvasViewport.contains(eventTarget));
    safariGestureStartZoomLevel = isCanvasGesture ? zoomLevel : null;
    event.preventDefault();
  }, { passive: false });

  document.addEventListener('gesturechange', (event) => {
    const eventTarget = event.target;
    const isCanvasGesture = !!(canvasViewport && eventTarget instanceof Node && canvasViewport.contains(eventTarget));
    event.preventDefault();

    if (!isCanvasGesture || safariGestureStartZoomLevel == null || typeof event.scale !== 'number') return;

    setZoomLevel(safariGestureStartZoomLevel * event.scale);
  }, { passive: false });

  document.addEventListener('gestureend', (event) => {
    safariGestureStartZoomLevel = null;
    event.preventDefault();
  }, { passive: false });
}

function mouseDragged() {
  if (isPanningMode && panPointerId == null) {
    applyPanDragDelta(movedX, movedY);
    return false; // Prevent default browser drag
  }
}

function touchMoved() {
  if (isPanningMode || isCanvasPinching) {
    return false;
  }
}

function endPanDrag() {
  if (!isPanDragging) return;
  isPanDragging = false;
  startPanAnimation();
}

function mouseReleased() {
  endPanDrag();
}

function touchEnded() {
  endPanDrag();
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
      customOption.setAttribute('aria-disabled', String(option.disabled));

      if (option.selected) {
        customOption.classList.add('selected');
      }

      if (option.hidden) {
        customOption.classList.add('is-hidden');
        customOption.setAttribute('aria-hidden', 'true');
      }

      if (option.disabled) {
        customOption.classList.add('is-disabled');
      }

      customOption.addEventListener('click', (e) => {
        e.stopPropagation();
        if (customOption.classList.contains('is-hidden') || customOption.classList.contains('is-disabled')) {
          return;
        }

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
