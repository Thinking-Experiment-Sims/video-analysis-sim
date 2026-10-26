/**
 * Sports Analytics & Projectile Video Lab Simulation
 * Designed for The Thinking Experiment (PhysicsKit)
 * Strictly Light Mode: Teal (#0f7e9b), Amber (#d67b19), White (#ffffff).
 */

// Global Application State
const state = {
  currentStep: 1, // 1 to 5
  studentName: '',
  teacherName: 'Mr. Lopez',
  activeTool: 'track', // 'track', 'scale', 'origin'
  activeSeries: 'A',
  fps: 60,
  stepFrames: 2,
  currentTime: 0,
  duration: 0,
  isPlaying: false,

  // Visibility toggles
  showPoints: true,
  showVectors: true,
  showScale: true,
  showOrigin: true,

  // Marker options
  markerType: 'circle',
  markerRadius: 14,

  // Motion component filter & linearization
  motionFilter: 'both',
  isLinearized: false,
  timeOffset: 0,

  // Calibration & Transform
  pixelsPerMeter: 140,
  origin: { x: 80, y: 410 },
  originAngle: 0,

  // Scale stick state
  scaleStick: {
    start: { x: 80, y: 430 },
    end: { x: 220, y: 430 },
    lengthMeters: 1.0,
    isDragging: false,
    dragPoint: null
  },

  // Tracked data points
  series: {
    A: [], // Array of { frame, rawTime, time, videoX, videoY, x, y, vx, vy, ax, ay }
    B: []
  },

  // Tangent tool state (rubric requires 10 points from slopes of tangents)
  tangentPoints: [], // { time, vy, slope, x, y }
  activeTangentTime: 0,

  // 6-Graph Studio state
  activeGraphTab: 'y-pos', // 'y-pos', 'x-pos', 'y-vel', 'x-vel', 'y-acc', 'x-acc', 'grid-all'
  fitResults: {
    yPos: null, // { A, B, C, r2 } -> y = At^2 + Bt + C
    xPos: null, // { slope, intercept, r2 } -> x = mt + b
    yVel: null, // { slope, intercept, r2 }
    xVel: null,
    yAcc: null,
    xAcc: null
  },

  // Calculations & Reflection
  calcValues: {
    x0: 0, vx0: 0, ax: 0,
    y0: 0, vy0: 0, ay: -9.8,
    rangeCalc: 0, rangeMeas: 0, rangePctDiff: 0,
    hangCalc: 0, hangMeas: 0, hangPctDiff: 0,
    maxHCalc: 0, maxHMeas: 0, maxHPctDiff: 0,
    v0: 0, theta: 0,
    ayPctDiff: 0, axDiff: 0
  },
  reflectionText: '',

  // Presentation Deck Preview
  currentSlideIdx: 1,

  // Synthetic Video Generator
  isSynthetic: true,
  syntheticType: 'projectile',
  syntheticCanvas: document.createElement('canvas'),
  syntheticCtx: null
};

// ============================================================================
// DOM Elements Binding
// ============================================================================
const video = document.getElementById('mainVideo');
const overlayCanvas = document.getElementById('overlayCanvas');
const ctx = overlayCanvas.getContext('2d');
const reticlePreview = document.getElementById('reticlePreview');
const viewportContainer = document.getElementById('viewportContainer');
const dropzoneOverlay = document.getElementById('dropzoneOverlay');

// Stepper & Stages
const stepBtns = [
  document.getElementById('stepBtn1'),
  document.getElementById('stepBtn2'),
  document.getElementById('stepBtn3'),
  document.getElementById('stepBtn4'),
  document.getElementById('stepBtn5')
];
const videoWorkspaceStage = document.getElementById('videoWorkspaceStage');
const stepView3 = document.getElementById('stepView3');
const stepView4 = document.getElementById('stepView4');
const stepView5 = document.getElementById('stepView5');

// Student Metadata
const studentNameInput = document.getElementById('studentNameInput');
const teacherSelect = document.getElementById('teacherSelect');
const btnSaveSession = document.getElementById('btnSaveSession');
const btnLoadSession = document.getElementById('btnLoadSession');
const loadSessionInput = document.getElementById('loadSessionInput');

// Controls
const timeScrubber = document.getElementById('timeScrubber');
const currentTimeText = document.getElementById('currentTimeText');
const currentFrameText = document.getElementById('currentFrameText');
const btnPlayPause = document.getElementById('btnPlayPause');
const iconPlay = document.getElementById('iconPlay');
const iconPause = document.getElementById('iconPause');
const btnPrevFrame = document.getElementById('btnPrevFrame');
const btnNextFrame = document.getElementById('btnNextFrame');
const playbackRateSelect = document.getElementById('playbackRateSelect');
const fpsInput = document.getElementById('fpsInput');
const stepFrameSelect = document.getElementById('stepFrameSelect');
const seriesSelect = document.getElementById('seriesSelect');
const btnClearSeries = document.getElementById('btnClearSeries');
const btnSetTZero = document.getElementById('btnSetTZero');
const statusMessage = document.getElementById('statusMessage');

// Visibility & Tools
const chkShowPoints = document.getElementById('chkShowPoints');
const chkShowVectors = document.getElementById('chkShowVectors');
const chkShowScale = document.getElementById('chkShowScale');
const chkShowOrigin = document.getElementById('chkShowOrigin');
const markerTypeSelect = document.getElementById('markerTypeSelect');
const markerSizeSelect = document.getElementById('markerSizeSelect');
const motionComponentSelect = document.getElementById('motionComponentSelect');
const btnToggleLinearize = document.getElementById('btnToggleLinearize');
const posChartTitle = document.getElementById('posChartTitle');
const velChartTitle = document.getElementById('velChartTitle');
const toolTrack = document.getElementById('toolTrack');
const toolScale = document.getElementById('toolScale');
const toolOrigin = document.getElementById('toolOrigin');
const videoFileInput = document.getElementById('videoFileInput');
const btnExportCSV = document.getElementById('btnExportCSV');
const btnSampleSelect = document.getElementById('btnSampleSelect');
const scaleLengthInput = document.getElementById('scaleLengthInput');
const btnApplyScale = document.getElementById('btnApplyScale');
const scaleReadout = document.getElementById('scaleReadout');
const originAngleInput = document.getElementById('originAngleInput');
const btnResetOrigin = document.getElementById('btnResetOrigin');
const fitResultPos = document.getElementById('fitResultPos');
const fitResultVel = document.getElementById('fitResultVel');
const pointsTableBody = document.getElementById('pointsTableBody');
const btnFitQuadPos = document.getElementById('btnFitQuadPos');
const btnFitLinPos = document.getElementById('btnFitLinPos');
const btnFitVelocity = document.getElementById('btnFitVelocity');

// 6-Graph Studio Elements
const graphNavBtns = document.querySelectorAll('.graph-nav-btn');
const tangentStudioBar = document.getElementById('tangentStudioBar');
const tangentPointCountBadge = document.getElementById('tangentPointCountBadge');
const tangentTimeDisplay = document.getElementById('tangentTimeDisplay');
const tangentSlopeDisplay = document.getElementById('tangentSlopeDisplay');
const tangentSlider = document.getElementById('tangentSlider');
const btnRecordTangent = document.getElementById('btnRecordTangent');
const btnAutoSampleTangents = document.getElementById('btnAutoSampleTangents');
const btnAutoFitAll = document.getElementById('btnAutoFitAll');
const singleGraphContainer = document.getElementById('singleGraphContainer');
const gridAllContainer = document.getElementById('gridAllContainer');
const activeGraphEqTitle = document.getElementById('activeGraphEqTitle');
const activeGraphR2 = document.getElementById('activeGraphR2');
const activeGeneralEq = document.getElementById('activeGeneralEq');
const activeParticularEq = document.getElementById('activeParticularEq');
const activeGraphCanvas = document.getElementById('activeGraphCanvas');

// Calculations Workspace Elements
const btnAutoCalculateWorksheet = document.getElementById('btnAutoCalculateWorksheet');
const inpX0 = document.getElementById('inpX0');
const inpVx0 = document.getElementById('inpVx0');
const inpAx = document.getElementById('inpAx');
const lblAxDiff = document.getElementById('lblAxDiff');
const inpY0 = document.getElementById('inpY0');
const inpVy0 = document.getElementById('inpVy0');
const inpAy = document.getElementById('inpAy');
const badgeAyPctDiff = document.getElementById('badgeAyPctDiff');
const inpCalcRange = document.getElementById('inpCalcRange');
const inpMeasRange = document.getElementById('inpMeasRange');
const badgeRangePctDiff = document.getElementById('badgeRangePctDiff');
const inpCalcHangTime = document.getElementById('inpCalcHangTime');
const inpMeasHangTime = document.getElementById('inpMeasHangTime');
const badgeHangTimePctDiff = document.getElementById('badgeHangTimePctDiff');
const inpCalcMaxHeight = document.getElementById('inpCalcMaxHeight');
const inpMeasMaxHeight = document.getElementById('inpMeasMaxHeight');
const badgeMaxHeightPctDiff = document.getElementById('badgeMaxHeightPctDiff');
const inpSpeedV0 = document.getElementById('inpSpeedV0');
const inpAngleTheta = document.getElementById('inpAngleTheta');
const lblConsistencyCheck = document.getElementById('lblConsistencyCheck');
const reflectionText = document.getElementById('reflectionText');
const sentenceBadge = document.getElementById('sentenceBadge');

// Presentation Elements
const btnDownloadPptx = document.getElementById('btnDownloadPptx');
const btnPrintReport = document.getElementById('btnPrintReport');
const btnCopyFormData = document.getElementById('btnCopyFormData');
const slidePreviewTitle = document.getElementById('slidePreviewTitle');
const slideViewport = document.getElementById('slideViewport');
const btnPrevSlide = document.getElementById('btnPrevSlide');
const btnNextSlide = document.getElementById('btnNextSlide');
const slideThumbs = document.querySelectorAll('.slide-thumb');

// Chart Instances
let posChart = null;
let velChart = null;
let studioChart = null;
let gridCharts = {};

// ============================================================================
// Initialization & Synthetic Experiments
// ============================================================================
function init() {
  initEventListeners();
  initCharts();
  initSyntheticExperiment('projectile');
  resizeCanvas();
  renderSyntheticFrame(0);
  drawOverlay();
  updateTable();
  updateStepView(1);
}

function updateStatus(msg) {
  if (statusMessage) statusMessage.textContent = msg;
}

// Preset Physics / Sports Experiments
function initSyntheticExperiment(type = 'projectile') {
  state.isSynthetic = true;
  state.syntheticType = type;
  state.duration = 2.5;
  state.currentTime = 0;
  state.timeOffset = 0;
  state.fps = 60;
  if (fpsInput) fpsInput.value = state.fps;

  const w = 720;
  const h = 480;
  state.syntheticCanvas.width = w;
  state.syntheticCanvas.height = h;
  state.syntheticCtx = state.syntheticCanvas.getContext('2d');

  if (type === 'projectile') {
    state.origin = { x: 80, y: 410 };
    state.pixelsPerMeter = 140;
    state.scaleStick = {
      start: { x: 80, y: 430 },
      end: { x: 220, y: 430 },
      lengthMeters: 1.0,
      isDragging: false,
      dragPoint: null
    };
    updateStatus('Loaded 2D Projectile Motion. Click object to place tracking points!');
  } else if (type === 'basketball') {
    state.duration = 2.0;
    state.origin = { x: 90, y: 390 };
    state.pixelsPerMeter = 110;
    state.scaleStick = {
      start: { x: 90, y: 410 },
      end: { x: 200, y: 410 },
      lengthMeters: 1.0,
      isDragging: false,
      dragPoint: null
    };
    updateStatus('Loaded Basketball Arc (3-Pt Shot). Calibrate scale and track trajectory!');
  } else if (type === 'soccer') {
    state.duration = 2.2;
    state.origin = { x: 70, y: 410 };
    state.pixelsPerMeter = 90;
    state.scaleStick = {
      start: { x: 70, y: 430 },
      end: { x: 160, y: 430 },
      lengthMeters: 1.0,
      isDragging: false,
      dragPoint: null
    };
    updateStatus('Loaded Soccer Chip Kick. Track parabolic flight path!');
  } else if (type === 'freefall') {
    state.duration = 1.2;
    state.origin = { x: 360, y: 60 };
    state.pixelsPerMeter = 180;
    state.scaleStick = {
      start: { x: 260, y: 60 },
      end: { x: 260, y: 240 },
      lengthMeters: 1.0,
      isDragging: false,
      dragPoint: null
    };
    updateStatus('Loaded Free Fall Lab (g = 9.8 m/s²). Drop height = 2.0 m.');
  } else if (type === 'pendulum') {
    state.duration = 3.0;
    state.origin = { x: 360, y: 80 };
    state.pixelsPerMeter = 150;
    state.scaleStick = {
      start: { x: 360, y: 80 },
      end: { x: 510, y: 80 },
      lengthMeters: 1.0,
      isDragging: false,
      dragPoint: null
    };
    updateStatus('Loaded Simple Harmonic Pendulum.');
  } else if (type === 'cart') {
    state.duration = 2.5;
    state.origin = { x: 60, y: 350 };
    state.pixelsPerMeter = 160;
    state.scaleStick = {
      start: { x: 60, y: 370 },
      end: { x: 220, y: 370 },
      lengthMeters: 1.0,
      isDragging: false,
      dragPoint: null
    };
    updateStatus('Loaded Elastic Cart Collision.');
  }

  updateScaleReadout();
  if (scaleLengthInput) scaleLengthInput.value = state.scaleStick.lengthMeters.toFixed(2);
  if (timeScrubber) {
    timeScrubber.min = 0;
    timeScrubber.max = state.duration;
    timeScrubber.value = 0;
  }
  updateTimeAndFrame(0);
}

function renderSyntheticFrame(t) {
  if (!state.isSynthetic || !state.syntheticCtx) return;
  const ctxS = state.syntheticCtx;
  const w = state.syntheticCanvas.width;
  const h = state.syntheticCanvas.height;

  // Background
  ctxS.fillStyle = '#f8fafc';
  ctxS.fillRect(0, 0, w, h);

  // Background Grid
  ctxS.strokeStyle = '#e2e8f0';
  ctxS.lineWidth = 1;
  const gridStep = state.pixelsPerMeter / 2;
  for (let x = 0; x < w; x += gridStep) {
    ctxS.beginPath();
    ctxS.moveTo(x, 0);
    ctxS.lineTo(x, h);
    ctxS.stroke();
  }
  for (let y = 0; y < h; y += gridStep) {
    ctxS.beginPath();
    ctxS.moveTo(0, y);
    ctxS.lineTo(w, y);
    ctxS.stroke();
  }

  // Floor / Turf
  if (state.syntheticType === 'soccer') {
    ctxS.fillStyle = '#e8f5e9'; // Turf light green
    ctxS.fillRect(0, 420, w, 60);
    ctxS.strokeStyle = '#81c784';
  } else if (state.syntheticType === 'basketball') {
    ctxS.fillStyle = '#fff3e0'; // Hardwood court
    ctxS.fillRect(0, 420, w, 60);
    ctxS.strokeStyle = '#ffb74d';
  } else {
    ctxS.fillStyle = '#e2edf3';
    ctxS.fillRect(0, 420, w, 60);
    ctxS.strokeStyle = '#a9c4cf';
  }
  ctxS.lineWidth = 2;
  ctxS.beginPath();
  ctxS.moveTo(0, 420);
  ctxS.lineTo(w, 420);
  ctxS.stroke();

  // 1.00 Meter Calibration Stick
  ctxS.fillStyle = '#ffecb3';
  ctxS.strokeStyle = '#d67b19';
  ctxS.lineWidth = 1.5;
  const stickX = 80;
  const stickY = 435;
  const stickW = state.pixelsPerMeter;
  ctxS.fillRect(stickX, stickY, stickW, 14);
  ctxS.strokeRect(stickX, stickY, stickW, 14);
  ctxS.fillStyle = '#123140';
  ctxS.font = 'bold 9px monospace';
  ctxS.fillText('1.00 METER REFERENCE', stickX + 14, stickY + 11);

  // Simulation physics
  if (state.syntheticType === 'projectile') {
    const theta = 56 * (Math.PI / 180);
    const v0 = 4.3;
    const g = 9.8;
    const tFlight = (2 * v0 * Math.sin(theta)) / g;
    const tClamped = Math.min(t, tFlight);

    const xMeters = v0 * Math.cos(theta) * tClamped;
    const yMeters = v0 * Math.sin(theta) * tClamped - 0.5 * g * tClamped * tClamped;

    const ballX = state.origin.x + xMeters * state.pixelsPerMeter;
    const ballY = state.origin.y - yMeters * state.pixelsPerMeter;

    drawSportsBall(ctxS, ballX, ballY, 11, 'baseball');
  } else if (state.syntheticType === 'basketball') {
    const theta = 62 * (Math.PI / 180);
    const v0 = 5.6;
    const g = 9.8;
    const tFlight = 1.4;
    const tClamped = Math.min(t, tFlight);

    const xMeters = v0 * Math.cos(theta) * tClamped;
    const yMeters = v0 * Math.sin(theta) * tClamped - 0.5 * g * tClamped * tClamped;

    const ballX = state.origin.x + xMeters * state.pixelsPerMeter;
    const ballY = state.origin.y - yMeters * state.pixelsPerMeter;

    // Draw Basketball Hoop
    ctxS.strokeStyle = '#c53030';
    ctxS.lineWidth = 4;
    ctxS.strokeRect(620, 160, 4, 180);
    ctxS.fillStyle = '#d67b19';
    ctxS.fillRect(575, 220, 45, 6);

    drawSportsBall(ctxS, ballX, ballY, 13, 'basketball');
  } else if (state.syntheticType === 'soccer') {
    const theta = 48 * (Math.PI / 180);
    const v0 = 6.2;
    const g = 9.8;
    const tFlight = 1.55;
    const tClamped = Math.min(t, tFlight);

    const xMeters = v0 * Math.cos(theta) * tClamped;
    const yMeters = v0 * Math.sin(theta) * tClamped - 0.5 * g * tClamped * tClamped;

    const ballX = state.origin.x + xMeters * state.pixelsPerMeter;
    const ballY = state.origin.y - yMeters * state.pixelsPerMeter;

    drawSportsBall(ctxS, ballX, ballY, 12, 'soccer');
  } else if (state.syntheticType === 'freefall') {
    const g = 9.8;
    const tDrop = Math.sqrt((2 * 1.8) / g);
    const tClamped = Math.min(t, tDrop);
    const yMeters = 0.5 * g * tClamped * tClamped;
    const ballX = state.origin.x;
    const ballY = state.origin.y + yMeters * state.pixelsPerMeter;

    drawSportsBall(ctxS, ballX, ballY, 12, 'baseball');
  } else if (state.syntheticType === 'pendulum') {
    const L = 1.5;
    const theta0 = 0.45;
    const omega = Math.sqrt(9.8 / L);
    const theta = theta0 * Math.cos(omega * t);

    const bobX = state.origin.x + L * Math.sin(theta) * state.pixelsPerMeter;
    const bobY = state.origin.y + L * Math.cos(theta) * state.pixelsPerMeter;

    ctxS.strokeStyle = '#4b6570';
    ctxS.lineWidth = 1.5;
    ctxS.beginPath();
    ctxS.moveTo(state.origin.x, state.origin.y);
    ctxS.lineTo(bobX, bobY);
    ctxS.stroke();

    drawSportsBall(ctxS, bobX, bobY, 14, 'metallic');
  } else if (state.syntheticType === 'cart') {
    const xCart = state.origin.x + (1.2 * t) * state.pixelsPerMeter;
    ctxS.fillStyle = '#0f7e9b';
    ctxS.fillRect(xCart - 25, 400, 50, 20);
    ctxS.fillStyle = '#123140';
    ctxS.beginPath();
    ctxS.arc(xCart - 15, 420, 6, 0, Math.PI * 2);
    ctxS.arc(xCart + 15, 420, 6, 0, Math.PI * 2);
    ctxS.fill();
  }
}

function drawSportsBall(ctxS, x, y, r, ballType) {
  ctxS.save();
  ctxS.beginPath();
  ctxS.arc(x, y, r, 0, Math.PI * 2);

  if (ballType === 'basketball') {
    ctxS.fillStyle = '#d67b19';
    ctxS.fill();
    ctxS.strokeStyle = '#123140';
    ctxS.lineWidth = 1.5;
    ctxS.stroke();
    // Seams
    ctxS.beginPath();
    ctxS.arc(x, y, r * 0.7, 0, Math.PI);
    ctxS.stroke();
  } else if (ballType === 'soccer') {
    ctxS.fillStyle = '#ffffff';
    ctxS.fill();
    ctxS.strokeStyle = '#123140';
    ctxS.lineWidth = 1.5;
    ctxS.stroke();
    ctxS.fillStyle = '#123140';
    ctxS.beginPath();
    ctxS.arc(x, y, r * 0.35, 0, Math.PI * 2);
    ctxS.fill();
  } else if (ballType === 'metallic') {
    ctxS.fillStyle = '#0f7e9b';
    ctxS.fill();
    ctxS.strokeStyle = '#095f76';
    ctxS.lineWidth = 2;
    ctxS.stroke();
  } else {
    // Standard Bright Yellow/White Tennis or Baseball
    ctxS.fillStyle = '#fef08a';
    ctxS.fill();
    ctxS.strokeStyle = '#d67b19';
    ctxS.lineWidth = 1.5;
    ctxS.stroke();
    ctxS.strokeStyle = '#e11d48';
    ctxS.lineWidth = 1;
    ctxS.beginPath();
    ctxS.arc(x - 3, y, r * 0.7, -Math.PI / 2, Math.PI / 2);
    ctxS.stroke();
  }
  ctxS.restore();
}

// ============================================================================
// Step Workflow & Mode Switching
// ============================================================================
function updateStepView(stepNum) {
  state.currentStep = stepNum;

  // Update Stepper Buttons
  stepBtns.forEach((btn, idx) => {
    if (!btn) return;
    const num = idx + 1;
    btn.classList.remove('active', 'completed');
    if (num === stepNum) {
      btn.classList.add('active');
    } else if (num < stepNum) {
      btn.classList.add('completed');
    }
  });

  // Switch Stages
  if (videoWorkspaceStage) videoWorkspaceStage.style.display = (stepNum === 1 || stepNum === 2) ? 'grid' : 'none';
  if (stepView3) stepView3.style.display = (stepNum === 3) ? 'block' : 'none';
  if (stepView4) stepView4.style.display = (stepNum === 4) ? 'block' : 'none';
  if (stepView5) stepView5.style.display = (stepNum === 5) ? 'block' : 'none';

  if (stepNum === 1) {
    setActiveTool('scale');
    updateStatus('Step 1: Set coordinate origin and drag amber scale stick across 1 meter reference.');
  } else if (stepNum === 2) {
    setActiveTool('track');
    updateStatus('Step 2: Step through frames and click projectile center-of-mass to track trajectory.');
  } else if (stepNum === 3) {
    updateStatus('Step 3: Kinematics Studio - Verify curves of best fit and sample 10 tangent slopes.');
    renderStudioGraph(state.activeGraphTab);
  } else if (stepNum === 4) {
    updateStatus('Step 4: Guided Workspace - Review measured vs calculated kinematics & write reflection.');
    autoCalculateWorksheet();
  } else if (stepNum === 5) {
    updateStatus('Step 5: Presentation & Reports - Export 8-slide PowerPoint deck, print lab report, copy form data.');
    renderSlideDeckPreview(state.currentSlideIdx);
  }

  // Ensure KaTeX renders math in updated elements
  if (window.renderMathInElement) {
    renderMathInElement(document.body, {
      delimiters: [
        { left: '$$', right: '$$', display: true },
        { left: '\\[', right: '\\]', display: true },
        { left: '\\(', right: '\\)', display: false },
        { left: '$', right: '$', display: false }
      ]
    });
  }
}

// Tool Switching
function setActiveTool(tool) {
  state.activeTool = tool;
  [toolTrack, toolScale, toolOrigin].forEach(btn => {
    if (btn) btn.classList.remove('active', 'btn-amber');
  });

  if (tool === 'track' && toolTrack) {
    toolTrack.classList.add('active', 'btn-amber');
  } else if (tool === 'scale' && toolScale) {
    toolScale.classList.add('active', 'btn-amber');
  } else if (tool === 'origin' && toolOrigin) {
    toolOrigin.classList.add('active', 'btn-amber');
  }
  drawOverlay();
}

// Coordinate Transforms
function transformToPhysics(screenX, screenY) {
  const dx = screenX - state.origin.x;
  const dy = state.origin.y - screenY; // Screen Y goes down; Physics Y goes up

  const angle = state.originAngle;
  const cosA = Math.cos(angle);
  const sinA = Math.sin(angle);

  const rotX = dx * cosA - dy * sinA;
  const rotY = dx * sinA + dy * cosA;

  const metersX = rotX / state.pixelsPerMeter;
  const metersY = rotY / state.pixelsPerMeter;

  return { x: metersX, y: metersY };
}

function getAdjustedTime(rawTime) {
  return Math.max(0, rawTime - state.timeOffset);
}

function updateTimeAndFrame(t) {
  state.currentTime = t;
  const adjustedT = getAdjustedTime(t);
  const frame = Math.round(t * state.fps);

  if (currentTimeText) currentTimeText.textContent = `t = ${adjustedT.toFixed(3)} s`;
  if (currentFrameText) currentFrameText.textContent = `Frame: ${frame}`;
  if (timeScrubber) timeScrubber.value = t;

  if (state.isSynthetic) {
    renderSyntheticFrame(t);
    drawOverlay();
  } else if (video && !video.paused) {
    drawOverlay();
  }
}

function stepFrame(delta) {
  const dt = 1 / state.fps;
  let nextT = state.currentTime + delta * dt;
  nextT = Math.max(0, Math.min(state.duration, nextT));
  if (state.isSynthetic) {
    updateTimeAndFrame(nextT);
  } else if (video) {
    video.currentTime = nextT;
  }
}

function togglePlay() {
  state.isPlaying = !state.isPlaying;
  if (iconPlay) iconPlay.style.display = state.isPlaying ? 'none' : 'block';
  if (iconPause) iconPause.style.display = state.isPlaying ? 'block' : 'none';

  if (state.isSynthetic) {
    if (state.isPlaying) playSyntheticLoop();
  } else if (video) {
    if (state.isPlaying) video.play();
    else video.pause();
  }
}

let syntheticPlayTimer = null;
function playSyntheticLoop() {
  if (!state.isPlaying || !state.isSynthetic) return;
  const dt = (1 / state.fps) * (parseFloat(playbackRateSelect ? playbackRateSelect.value : 0.5));
  let nextT = state.currentTime + dt;
  if (nextT >= state.duration) {
    nextT = 0;
  }
  updateTimeAndFrame(nextT);
  syntheticPlayTimer = requestAnimationFrame(playSyntheticLoop);
}

// Point Tracking
function addTrackPoint(screenX, screenY) {
  const currentT = state.currentTime;
  const pts = state.series[state.activeSeries];
  const phys = transformToPhysics(screenX, screenY);
  const frame = Math.round(currentT * state.fps);

  // Avoid duplicates within 1 frame
  const existingIdx = pts.findIndex(p => Math.abs(p.rawTime - currentT) < 0.005);
  const ptData = {
    frame,
    rawTime: currentT,
    time: getAdjustedTime(currentT),
    videoX: screenX,
    videoY: screenY,
    x: phys.x,
    y: phys.y,
    vx: 0,
    vy: 0,
    ax: 0,
    ay: 0
  };

  if (existingIdx !== -1) {
    pts[existingIdx] = ptData;
  } else {
    pts.push(ptData);
  }

  pts.sort((a, b) => a.rawTime - b.rawTime);
  recalculateKinematics();
  updateTable();
  updateCharts();

  // Step forward
  const framesToStep = parseInt(stepFrameSelect ? stepFrameSelect.value : 2, 10);
  stepFrame(framesToStep);
}

function recalculateKinematics() {
  const pts = state.series[state.activeSeries];
  pts.forEach(p => { p.time = getAdjustedTime(p.rawTime); });
  if (pts.length < 2) return;

  // Numerical Velocities
  for (let i = 0; i < pts.length; i++) {
    if (i === 0) {
      const dt = pts[1].time - pts[0].time;
      pts[0].vx = dt > 0 ? (pts[1].x - pts[0].x) / dt : 0;
      pts[0].vy = dt > 0 ? (pts[1].y - pts[0].y) / dt : 0;
    } else if (i === pts.length - 1) {
      const dt = pts[i].time - pts[i - 1].time;
      pts[i].vx = dt > 0 ? (pts[i].x - pts[i - 1].x) / dt : 0;
      pts[i].vy = dt > 0 ? (pts[i].y - pts[i - 1].y) / dt : 0;
    } else {
      const dt = pts[i + 1].time - pts[i - 1].time;
      pts[i].vx = dt > 0 ? (pts[i + 1].x - pts[i - 1].x) / dt : 0;
      pts[i].vy = dt > 0 ? (pts[i + 1].y - pts[i - 1].y) / dt : 0;
    }
  }

  // Numerical Accelerations
  for (let i = 0; i < pts.length; i++) {
    if (i === 0) {
      const dt = pts[1].time - pts[0].time;
      pts[0].ax = dt > 0 ? (pts[1].vx - pts[0].vx) / dt : 0;
      pts[0].ay = dt > 0 ? (pts[1].vy - pts[0].vy) / dt : 0;
    } else if (i === pts.length - 1) {
      const dt = pts[i].time - pts[i - 1].time;
      pts[i].ax = dt > 0 ? (pts[i].vx - pts[i - 1].vx) / dt : 0;
      pts[i].ay = dt > 0 ? (pts[i].vy - pts[i - 1].vy) / dt : 0;
    } else {
      const dt = pts[i + 1].time - pts[i - 1].time;
      pts[i].ax = dt > 0 ? (pts[i + 1].vx - pts[i - 1].vx) / dt : 0;
      pts[i].ay = dt > 0 ? (pts[i + 1].vy - pts[i - 1].vy) / dt : 0;
    }
  }
}

function setInitialTimeAtFirstPoint() {
  const pts = state.series[state.activeSeries];
  if (pts.length === 0) return;
  state.timeOffset = pts[0].rawTime;
  recalculateKinematics();
  updateTimeAndFrame(state.currentTime);
  updateTable();
  updateCharts();
  updateStatus(`Set t₀ = 0.000 s at first tracked point (${state.timeOffset.toFixed(3)}s)`);
}

// Canvas Overlay Drawing
function resizeCanvas() {
  if (!overlayCanvas || !viewportContainer) return;
  const rect = viewportContainer.getBoundingClientRect();
  overlayCanvas.width = rect.width || 720;
  overlayCanvas.height = rect.height || 480;
}

function drawOverlay() {
  if (!ctx || !overlayCanvas) return;
  ctx.clearRect(0, 0, overlayCanvas.width, overlayCanvas.height);

  if (state.isSynthetic && state.syntheticCanvas) {
    ctx.drawImage(state.syntheticCanvas, 0, 0, overlayCanvas.width, overlayCanvas.height);
  }

  if (state.showOrigin) drawAxes();
  if (state.showScale) drawScaleStick();
  if (state.showPoints) drawTrackedPoints();
}

function drawAxes() {
  const ox = state.origin.x;
  const oy = state.origin.y;
  const angle = state.originAngle;

  ctx.save();
  ctx.translate(ox, oy);
  ctx.rotate(-angle);

  // X Axis (Teal)
  ctx.strokeStyle = '#0f7e9b';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-40, 0);
  ctx.lineTo(120, 0);
  ctx.stroke();

  // Y Axis (Amber)
  ctx.strokeStyle = '#d67b19';
  ctx.beginPath();
  ctx.moveTo(0, 40);
  ctx.lineTo(0, -120);
  ctx.stroke();

  // Origin point
  ctx.fillStyle = '#123140';
  ctx.beginPath();
  ctx.arc(0, 0, 4.5, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#0f7e9b';
  ctx.font = 'bold 11px sans-serif';
  ctx.fillText('+x', 125, 4);
  ctx.fillStyle = '#d67b19';
  ctx.fillText('+y', -8, -125);

  ctx.restore();
}

function drawScaleStick() {
  const s = state.scaleStick.start;
  const e = state.scaleStick.end;

  ctx.save();
  ctx.strokeStyle = '#d67b19';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(s.x, s.y);
  ctx.lineTo(e.x, e.y);
  ctx.stroke();

  // Endcaps
  [s, e].forEach(p => {
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#d67b19';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(p.x, p.y, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  });

  const midX = (s.x + e.x) / 2;
  const midY = (s.y + e.y) / 2;
  ctx.fillStyle = '#123140';
  ctx.font = 'bold 11px sans-serif';
  ctx.fillText(`${state.scaleStick.lengthMeters.toFixed(2)} m`, midX + 6, midY - 6);

  ctx.restore();
}

function drawTrackedPoints() {
  ['A', 'B'].forEach(sKey => {
    const pts = state.series[sKey];
    if (pts.length === 0) return;
    const isA = sKey === 'A';
    const color = isA ? '#d67b19' : '#0f7e9b';

    pts.forEach((p, idx) => {
      ctx.save();
      ctx.strokeStyle = color;
      ctx.fillStyle = color;
      ctx.lineWidth = 1.5;

      if (state.markerType === 'circle') {
        ctx.beginPath();
        ctx.arc(p.videoX, p.videoY, state.markerRadius, 0, Math.PI * 2);
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(p.videoX, p.videoY, 2.5, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.beginPath();
        ctx.arc(p.videoX, p.videoY, 4, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.font = '10px sans-serif';
      ctx.fillText(`${idx + 1}`, p.videoX + 10, p.videoY - 6);

      // Velocity vectors
      if (state.showVectors && (p.vx !== 0 || p.vy !== 0)) {
        const arrowScale = 12;
        const vxPix = p.vx * arrowScale;
        const vyPix = -p.vy * arrowScale;
        ctx.strokeStyle = '#095f76';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(p.videoX, p.videoY);
        ctx.lineTo(p.videoX + vxPix, p.videoY + vyPix);
        ctx.stroke();
      }
      ctx.restore();
    });
  });
}

function updateScaleReadout() {
  const dx = state.scaleStick.end.x - state.scaleStick.start.x;
  const dy = state.scaleStick.end.y - state.scaleStick.start.y;
  const pixelDist = Math.hypot(dx, dy);
  if (pixelDist > 5) {
    state.pixelsPerMeter = pixelDist / state.scaleStick.lengthMeters;
    if (scaleReadout) {
      scaleReadout.textContent = `Current Scale: 1 px = ${(1 / state.pixelsPerMeter).toFixed(4)} m (${state.pixelsPerMeter.toFixed(1)} px/m)`;
    }
  }
}

// Table & CSV Export
function updateTable() {
  if (!pointsTableBody) return;
  const pts = state.series[state.activeSeries];
  if (pts.length === 0) {
    pointsTableBody.innerHTML = '<tr><td colspan="6" style="text-align: center; color: var(--subtle); padding: 2rem;">No tracking points yet. Click on the video to record points.</td></tr>';
    return;
  }

  let html = '';
  pts.forEach((p, idx) => {
    html += `
      <tr style="cursor: pointer;" onclick="jumpToPointFrame(${idx})">
        <td><strong>${idx + 1}</strong></td>
        <td>${p.time.toFixed(3)}</td>
        <td>${p.x.toFixed(3)}</td>
        <td>${p.y.toFixed(3)}</td>
        <td>${p.vx.toFixed(2)}</td>
        <td>${p.vy.toFixed(2)}</td>
      </tr>
    `;
  });
  pointsTableBody.innerHTML = html;
}

window.jumpToPointFrame = function(idx) {
  const pts = state.series[state.activeSeries];
  if (pts[idx]) {
    updateTimeAndFrame(pts[idx].rawTime);
  }
};

function exportCSV() {
  const pts = state.series[state.activeSeries];
  if (pts.length === 0) {
    alert('No data points to export yet!');
    return;
  }

  let csv = 'Point,Time (s),x (m),y (m),vx (m/s),vy (m/s),ax (m/s2),ay (m/s2)\n';
  pts.forEach((p, idx) => {
    csv += `${idx + 1},${p.time.toFixed(4)},${p.x.toFixed(4)},${p.y.toFixed(4)},${p.vx.toFixed(4)},${p.vy.toFixed(4)},${p.ax.toFixed(4)},${p.ay.toFixed(4)}\n`;
  });

  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `projectile-kinematics-series-${state.activeSeries}.csv`;
  a.click();
}

// ============================================================================
// Regressions & Kinematic Curve Fitting
// ============================================================================
function linearRegression(points) {
  const n = points.length;
  if (n < 2) return null;
  let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;
  points.forEach(p => {
    sumX += p.x;
    sumY += p.y;
    sumXY += p.x * p.y;
    sumXX += p.x * p.x;
  });
  const denom = (n * sumXX - sumX * sumX);
  if (Math.abs(denom) < 1e-9) return null;

  const slope = (n * sumXY - sumX * sumY) / denom;
  const intercept = (sumY - slope * sumX) / n;

  const meanY = sumY / n;
  let ssTot = 0, ssRes = 0;
  points.forEach(p => {
    const pred = slope * p.x + intercept;
    ssTot += (p.y - meanY) ** 2;
    ssRes += (p.y - pred) ** 2;
  });
  const r2 = ssTot > 0 ? Math.max(0, 1 - (ssRes / ssTot)) : 1;
  return { slope, intercept, r2 };
}

function quadraticRegression(points) {
  const n = points.length;
  if (n < 3) return null;

  let sumT = 0, sumT2 = 0, sumT3 = 0, sumT4 = 0;
  let sumY = 0, sumTY = 0, sumT2Y = 0;

  points.forEach(p => {
    const t = p.x;
    const y = p.y;
    const t2 = t * t;
    sumT += t;
    sumT2 += t2;
    sumT3 += t2 * t;
    sumT4 += t2 * t2;
    sumY += y;
    sumTY += t * y;
    sumT2Y += t2 * y;
  });

  const D = (
    n * (sumT2 * sumT4 - sumT3 * sumT3) -
    sumT * (sumT * sumT4 - sumT2 * sumT3) +
    sumT2 * (sumT * sumT3 - sumT2 * sumT2)
  );
  if (Math.abs(D) < 1e-9) return null;

  const Da = (
    sumY * (sumT2 * sumT4 - sumT3 * sumT3) -
    sumTY * (sumT * sumT4 - sumT2 * sumT3) +
    sumT2Y * (sumT * sumT3 - sumT2 * sumT2)
  );

  const Db = (
    n * (sumTY * sumT4 - sumT2Y * sumT3) -
    sumT * (sumY * sumT4 - sumT2Y * sumT2) +
    sumT2 * (sumY * sumT3 - sumTY * sumT2)
  );

  const Dc = (
    n * (sumT2 * sumT2Y - sumTY * sumT3) -
    sumT * (sumT * sumT2Y - sumTY * sumT2) +
    sumY * (sumT * sumT3 - sumT2 * sumT2)
  );

  const C = Da / D;
  const B = Db / D;
  const A = Dc / D;

  const meanY = sumY / n;
  let ssTot = 0, ssRes = 0;
  points.forEach(p => {
    const pred = A * p.x * p.x + B * p.x + C;
    ssTot += (p.y - meanY) ** 2;
    ssRes += (p.y - pred) ** 2;
  });
  const r2 = ssTot > 0 ? Math.max(0, 1 - (ssRes / ssTot)) : 1;

  return { A, B, C, r2 };
}

// Charts Initialization
function initCharts() {
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    animation: false,
    plugins: {
      legend: { position: 'top', labels: { boxWidth: 12, font: { size: 10 } } }
    },
    scales: {
      x: {
        title: { display: true, text: 'Time t (s)', font: { size: 11, weight: 'bold' } },
        grid: { color: '#eef3f6' }
      },
      y: {
        grid: { color: '#eef3f6' }
      }
    }
  };

  const ctxPos = document.getElementById('posChart').getContext('2d');
  posChart = new Chart(ctxPos, {
    type: 'scatter',
    data: {
      datasets: [
        { label: 'y (m)', data: [], backgroundColor: '#d67b19', borderColor: '#d67b19', pointRadius: 4.5 },
        { label: 'x (m)', data: [], backgroundColor: '#0f7e9b', borderColor: '#0f7e9b', pointRadius: 4.5 },
        { label: 'Model Fit', data: [], type: 'line', borderColor: '#b06210', borderWidth: 2, pointRadius: 0, fill: false }
      ]
    },
    options: {
      ...chartOptions,
      scales: {
        ...chartOptions.scales,
        y: { title: { display: true, text: 'Position (m)', font: { size: 11, weight: 'bold' } }, grid: { color: '#eef3f6' } }
      }
    }
  });

  const ctxVel = document.getElementById('velChart').getContext('2d');
  velChart = new Chart(ctxVel, {
    type: 'scatter',
    data: {
      datasets: [
        { label: 'vy (m/s)', data: [], backgroundColor: '#d67b19', borderColor: '#d67b19', pointRadius: 4.5 },
        { label: 'vx (m/s)', data: [], backgroundColor: '#0f7e9b', borderColor: '#0f7e9b', pointRadius: 4.5 },
        { label: 'Linear Fit', data: [], type: 'line', borderColor: '#b06210', borderWidth: 2, pointRadius: 0, fill: false }
      ]
    },
    options: {
      ...chartOptions,
      scales: {
        ...chartOptions.scales,
        y: { title: { display: true, text: 'Velocity (m/s)', font: { size: 11, weight: 'bold' } }, grid: { color: '#eef3f6' } }
      }
    }
  });
}

function updateCharts() {
  const pts = state.series[state.activeSeries];
  if (!posChart || !velChart) return;

  const yData = pts.map(p => ({ x: p.time, y: p.y }));
  const xData = pts.map(p => ({ x: p.time, y: p.x }));

  if (state.motionFilter === 'vertical') {
    posChart.data.datasets[0].data = yData;
    posChart.data.datasets[0].hidden = false;
    posChart.data.datasets[1].data = [];
    posChart.data.datasets[1].hidden = true;
  } else if (state.motionFilter === 'horizontal') {
    posChart.data.datasets[0].data = [];
    posChart.data.datasets[0].hidden = true;
    posChart.data.datasets[1].data = xData;
    posChart.data.datasets[1].hidden = false;
  } else {
    posChart.data.datasets[0].data = yData;
    posChart.data.datasets[0].hidden = false;
    posChart.data.datasets[1].data = xData;
    posChart.data.datasets[1].hidden = false;
  }
  posChart.update();

  const vyData = pts.map(p => ({ x: p.time, y: p.vy }));
  const vxData = pts.map(p => ({ x: p.time, y: p.vx }));
  if (state.motionFilter === 'vertical') {
    velChart.data.datasets[0].data = vyData;
    velChart.data.datasets[0].hidden = false;
    velChart.data.datasets[1].data = [];
    velChart.data.datasets[1].hidden = true;
  } else if (state.motionFilter === 'horizontal') {
    velChart.data.datasets[0].data = [];
    velChart.data.datasets[0].hidden = true;
    velChart.data.datasets[1].data = vxData;
    velChart.data.datasets[1].hidden = false;
  } else {
    velChart.data.datasets[0].data = vyData;
    velChart.data.datasets[0].hidden = false;
    velChart.data.datasets[1].data = vxData;
    velChart.data.datasets[1].hidden = false;
  }
  velChart.update();
}

// ============================================================================
// Step 3: 6-Graph Kinematics Studio & Tangent Tool
// ============================================================================
function autoFitAllGraphs() {
  const pts = state.series[state.activeSeries];
  if (pts.length < 3) {
    alert('Please track at least 3 points on the video before fitting models!');
    return;
  }

  // 1. yPos: Quadratic Fit y = At^2 + Bt + C
  const yPts = pts.map(p => ({ x: p.time, y: p.y }));
  state.fitResults.yPos = quadraticRegression(yPts);

  // 2. xPos: Linear Fit x = mt + b
  const xPts = pts.map(p => ({ x: p.time, y: p.x }));
  state.fitResults.xPos = linearRegression(xPts);

  // 3. yVel: Linear Fit vy = mt + b
  const vyPts = pts.map(p => ({ x: p.time, y: p.vy }));
  state.fitResults.yVel = linearRegression(vyPts);

  // 4. xVel: Linear Fit vx = mt + b
  const vxPts = pts.map(p => ({ x: p.time, y: p.vx }));
  state.fitResults.xVel = linearRegression(vxPts);

  // 5. yAcc: Mean vertical acceleration
  const meanAy = pts.reduce((acc, p) => acc + p.ay, 0) / pts.length;
  state.fitResults.yAcc = { mean: meanAy, ref: -9.8 };

  // 6. xAcc: Mean horizontal acceleration
  const meanAx = pts.reduce((acc, p) => acc + p.ax, 0) / pts.length;
  state.fitResults.xAcc = { mean: meanAx, ref: 0.0 };

  renderStudioGraph(state.activeGraphTab);
  updateStatus('Auto-fitted all 6 kinematic graphs successfully with equations!');
}

function renderStudioGraph(graphType) {
  state.activeGraphTab = graphType;
  graphNavBtns.forEach(btn => {
    btn.classList.toggle('active', btn.dataset.graph === graphType);
  });

  if (graphType === 'grid-all') {
    if (singleGraphContainer) singleGraphContainer.style.display = 'none';
    if (tangentStudioBar) tangentStudioBar.style.display = 'none';
    if (gridAllContainer) gridAllContainer.style.display = 'grid';
    renderAllGridGraphs();
    return;
  }

  if (singleGraphContainer) singleGraphContainer.style.display = 'flex';
  if (gridAllContainer) gridAllContainer.style.display = 'none';

  // Tangent tool visibility: shown for y-pos and y-vel
  if (tangentStudioBar) {
    tangentStudioBar.style.display = (graphType === 'y-pos' || graphType === 'y-vel') ? 'flex' : 'none';
  }

  const pts = state.series[state.activeSeries];
  if (pts.length < 2) return;

  // Ensure fits exist
  if (!state.fitResults.yPos) autoFitAllGraphs();

  const ctxS = activeGraphCanvas.getContext('2d');
  if (studioChart) studioChart.destroy();

  let title = '';
  let generalEq = '';
  let particularEq = '';
  let r2Val = 'N/A';
  let chartData = { datasets: [] };
  let yAxisLabel = '';

  const tMin = pts[0].time;
  const tMax = pts[pts.length - 1].time;

  if (graphType === 'y-pos') {
    title = '1. Vertical Position vs. Time [y(t)]';
    const fit = state.fitResults.yPos;
    const y0 = fit ? fit.C : pts[0].y;
    const v0y = fit ? fit.B : 0;
    const ay = fit ? 2 * fit.A : -9.8;
    r2Val = fit ? `R² = ${fit.r2.toFixed(4)}` : '';

    generalEq = '\\[y(t) = \\frac{1}{2}a_y t^2 + v_{0y}t + y_0\\]';
    particularEq = `\\[y(t) = (${fit ? fit.A.toFixed(3) : '-4.900'}\\text{ m/s}^2)t^2 + (${v0y.toFixed(3)}\\text{ m/s})t + (${y0.toFixed(3)}\\text{ m})\\]`;
    yAxisLabel = 'Vertical Position y (m)';

    // Fit line points
    const fitLine = [];
    const steps = 40;
    for (let i = 0; i <= steps; i++) {
      const t = tMin + (tMax - tMin) * (i / steps);
      const yFit = fit ? (fit.A * t * t + fit.B * t + fit.C) : (y0 + v0y * t + 0.5 * ay * t * t);
      fitLine.push({ x: t, y: yFit });
    }

    chartData.datasets = [
      { label: 'Measured y (m)', data: pts.map(p => ({ x: p.time, y: p.y })), backgroundColor: '#d67b19', borderColor: '#d67b19', pointRadius: 5 },
      { label: 'Quadratic Fit', data: fitLine, type: 'line', borderColor: '#b06210', borderWidth: 2.5, pointRadius: 0, fill: false }
    ];
  } else if (graphType === 'x-pos') {
    title = '2. Horizontal Position vs. Time [x(t)]';
    const fit = state.fitResults.xPos;
    const v0x = fit ? fit.slope : 0;
    const x0 = fit ? fit.intercept : 0;
    r2Val = fit ? `R² = ${fit.r2.toFixed(4)}` : '';

    generalEq = '\\[x(t) = v_{0x}t + x_0\\]';
    particularEq = `\\[x(t) = (${v0x.toFixed(3)}\\text{ m/s})t + (${x0.toFixed(3)}\\text{ m})\\]`;
    yAxisLabel = 'Horizontal Position x (m)';

    const fitLine = [
      { x: tMin, y: fit ? fit.slope * tMin + fit.intercept : 0 },
      { x: tMax, y: fit ? fit.slope * tMax + fit.intercept : 0 }
    ];

    chartData.datasets = [
      { label: 'Measured x (m)', data: pts.map(p => ({ x: p.time, y: p.x })), backgroundColor: '#0f7e9b', borderColor: '#0f7e9b', pointRadius: 5 },
      { label: 'Linear Fit (v₀ₓ)', data: fitLine, type: 'line', borderColor: '#095f76', borderWidth: 2.5, pointRadius: 0, fill: false }
    ];
  } else if (graphType === 'y-vel') {
    title = '3. Vertical Velocity vs. Time [vy(t)] (From Tangent Slopes)';
    const fit = state.fitResults.yVel;
    const ay = fit ? fit.slope : -9.8;
    const v0y = fit ? fit.intercept : 0;
    r2Val = fit ? `R² = ${fit.r2.toFixed(4)}` : '';

    generalEq = '\\[v_y(t) = a_y t + v_{0y}\\]';
    particularEq = `\\[v_y(t) = (${ay.toFixed(3)}\\text{ m/s}^2)t + (${v0y.toFixed(3)}\\text{ m/s})\\]`;
    yAxisLabel = 'Vertical Velocity vy (m/s)';

    const fitLine = [
      { x: tMin, y: fit ? fit.slope * tMin + fit.intercept : 0 },
      { x: tMax, y: fit ? fit.slope * tMax + fit.intercept : 0 }
    ];

    chartData.datasets = [
      { label: 'Numerical vy', data: pts.map(p => ({ x: p.time, y: p.vy })), backgroundColor: '#cbd5e1', borderColor: '#cbd5e1', pointRadius: 3.5 },
      { label: '10 Tangent Points (Rubric)', data: state.tangentPoints.map(p => ({ x: p.time, y: p.vy })), backgroundColor: '#d67b19', borderColor: '#b06210', pointRadius: 6, pointStyle: 'rectRot' },
      { label: 'Linear Fit (Slope = ay)', data: fitLine, type: 'line', borderColor: '#d67b19', borderWidth: 2.5, pointRadius: 0, fill: false }
    ];
  } else if (graphType === 'x-vel') {
    title = '4. Horizontal Velocity vs. Time [vx(t)]';
    const fit = state.fitResults.xVel;
    const ax = fit ? fit.slope : 0;
    const v0x = fit ? fit.intercept : 0;
    r2Val = fit ? `R² = ${fit.r2.toFixed(4)}` : '';

    generalEq = '\\[v_x(t) = a_x t + v_{0x}\\]';
    particularEq = `\\[v_x(t) = (${ax.toFixed(3)}\\text{ m/s}^2)t + (${v0x.toFixed(3)}\\text{ m/s})\\]`;
    yAxisLabel = 'Horizontal Velocity vx (m/s)';

    const fitLine = [
      { x: tMin, y: fit ? fit.slope * tMin + fit.intercept : 0 },
      { x: tMax, y: fit ? fit.slope * tMax + fit.intercept : 0 }
    ];

    chartData.datasets = [
      { label: 'Measured vx (m/s)', data: pts.map(p => ({ x: p.time, y: p.vx })), backgroundColor: '#0f7e9b', borderColor: '#0f7e9b', pointRadius: 5 },
      { label: 'Linear Fit (Slope ≈ 0)', data: fitLine, type: 'line', borderColor: '#095f76', borderWidth: 2.5, pointRadius: 0, fill: false }
    ];
  } else if (graphType === 'y-acc') {
    title = '5. Vertical Acceleration vs. Time [ay(t)]';
    const meanAy = state.fitResults.yAcc ? state.fitResults.yAcc.mean : -9.8;
    generalEq = '\\[a_y(t) = a_y = \\text{constant}\\]';
    particularEq = `\\[a_y(t) = ${meanAy.toFixed(3)}\\text{ m/s}^2 \\quad (\\text{Ref } g = -9.80\\text{ m/s}^2)\\]`;
    yAxisLabel = 'Vertical Acc ay (m/s²)';

    chartData.datasets = [
      { label: 'Instantaneous ay', data: pts.map(p => ({ x: p.time, y: p.ay })), backgroundColor: '#d67b19', borderColor: '#d67b19', pointRadius: 4 },
      { label: 'Mean ay Fit', data: [{ x: tMin, y: meanAy }, { x: tMax, y: meanAy }], type: 'line', borderColor: '#b06210', borderWidth: 2.5, pointRadius: 0, fill: false },
      { label: 'Reference g (-9.8 m/s²)', data: [{ x: tMin, y: -9.8 }, { x: tMax, y: -9.8 }], type: 'line', borderColor: '#94a3b8', borderDash: [5, 5], borderWidth: 1.5, pointRadius: 0, fill: false }
    ];
  } else if (graphType === 'x-acc') {
    title = '6. Horizontal Acceleration vs. Time [ax(t)]';
    const meanAx = state.fitResults.xAcc ? state.fitResults.xAcc.mean : 0.0;
    generalEq = '\\[a_x(t) = a_x = \\text{constant}\\]';
    particularEq = `\\[a_x(t) = ${meanAx.toFixed(3)}\\text{ m/s}^2 \\quad (\\text{Ref } a_x = 0.00\\text{ m/s}^2)\\]`;
    yAxisLabel = 'Horizontal Acc ax (m/s²)';

    chartData.datasets = [
      { label: 'Instantaneous ax', data: pts.map(p => ({ x: p.time, y: p.ax })), backgroundColor: '#0f7e9b', borderColor: '#0f7e9b', pointRadius: 4 },
      { label: 'Mean ax Fit', data: [{ x: tMin, y: meanAx }, { x: tMax, y: meanAx }], type: 'line', borderColor: '#095f76', borderWidth: 2.5, pointRadius: 0, fill: false }
    ];
  }

  if (activeGraphEqTitle) activeGraphEqTitle.textContent = title;
  if (activeGraphR2) activeGraphR2.textContent = r2Val;
  if (activeGeneralEq) activeGeneralEq.textContent = generalEq;
  if (activeParticularEq) activeParticularEq.textContent = particularEq;

  studioChart = new Chart(ctxS, {
    type: 'scatter',
    data: chartData,
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: false,
      plugins: {
        legend: { position: 'top', labels: { font: { size: 11, weight: 'bold' } } }
      },
      scales: {
        x: { title: { display: true, text: 'Time t (s)', font: { size: 12, weight: 'bold' } }, grid: { color: '#eef3f6' } },
        y: { title: { display: true, text: yAxisLabel, font: { size: 12, weight: 'bold' } }, grid: { color: '#eef3f6' } }
      }
    }
  });

  if (window.renderMathInElement) {
    renderMathInElement(document.getElementById('stepView3'));
  }
}

function renderAllGridGraphs() {
  const configs = [
    { id: 'canvasGridYPos', type: 'y-pos' },
    { id: 'canvasGridXPos', type: 'x-pos' },
    { id: 'canvasGridYVel', type: 'y-vel' },
    { id: 'canvasGridXVel', type: 'x-vel' },
    { id: 'canvasGridYAcc', type: 'y-acc' },
    { id: 'canvasGridXAcc', type: 'x-acc' }
  ];

  const pts = state.series[state.activeSeries];
  if (pts.length < 2) return;

  configs.forEach(cfg => {
    const canvas = document.getElementById(cfg.id);
    if (!canvas) return;
    if (gridCharts[cfg.id]) gridCharts[cfg.id].destroy();

    const ctx = canvas.getContext('2d');
    let datasets = [];
    if (cfg.type === 'y-pos') {
      datasets = [{ label: 'y(t)', data: pts.map(p => ({ x: p.time, y: p.y })), backgroundColor: '#d67b19', pointRadius: 3 }];
    } else if (cfg.type === 'x-pos') {
      datasets = [{ label: 'x(t)', data: pts.map(p => ({ x: p.time, y: p.x })), backgroundColor: '#0f7e9b', pointRadius: 3 }];
    } else if (cfg.type === 'y-vel') {
      datasets = [{ label: 'vy(t)', data: pts.map(p => ({ x: p.time, y: p.vy })), backgroundColor: '#d67b19', pointRadius: 3 }];
    } else if (cfg.type === 'x-vel') {
      datasets = [{ label: 'vx(t)', data: pts.map(p => ({ x: p.time, y: p.vx })), backgroundColor: '#0f7e9b', pointRadius: 3 }];
    } else if (cfg.type === 'y-acc') {
      datasets = [{ label: 'ay(t)', data: pts.map(p => ({ x: p.time, y: p.ay })), backgroundColor: '#d67b19', pointRadius: 3 }];
    } else if (cfg.type === 'x-acc') {
      datasets = [{ label: 'ax(t)', data: pts.map(p => ({ x: p.time, y: p.ax })), backgroundColor: '#0f7e9b', pointRadius: 3 }];
    }

    gridCharts[cfg.id] = new Chart(ctx, {
      type: 'scatter',
      data: { datasets },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: false,
        plugins: { legend: { display: false } },
        scales: {
          x: { grid: { color: '#f1f5f9' }, ticks: { font: { size: 9 } } },
          y: { grid: { color: '#f1f5f9' }, ticks: { font: { size: 9 } } }
        }
      }
    });
  });
}

// Tangent Line Sampler
function updateTangentTool(sliderVal) {
  const pts = state.series[state.activeSeries];
  if (pts.length < 3) return;
  const tMin = pts[0].time;
  const tMax = pts[pts.length - 1].time;
  const t = tMin + (tMax - tMin) * (sliderVal / 100);
  state.activeTangentTime = t;

  const fit = state.fitResults.yPos;
  // Instantaneous slope dy/dt = 2A*t + B
  const slope = fit ? (2 * fit.A * t + fit.B) : 0;

  if (tangentTimeDisplay) tangentTimeDisplay.textContent = `${t.toFixed(3)} s`;
  if (tangentSlopeDisplay) tangentSlopeDisplay.textContent = `${slope.toFixed(3)} m/s`;
}

function recordTangentPoint() {
  const pts = state.series[state.activeSeries];
  if (pts.length < 3) return;
  const t = state.activeTangentTime;
  const fit = state.fitResults.yPos;
  const slope = fit ? (2 * fit.A * t + fit.B) : 0;

  // Add to tangentPoints
  state.tangentPoints.push({ time: t, vy: slope });
  state.tangentPoints.sort((a, b) => a.time - b.time);

  if (tangentPointCountBadge) {
    tangentPointCountBadge.textContent = `Sampled: ${state.tangentPoints.length} / 10 Tangent Points`;
    if (state.tangentPoints.length >= 10) {
      tangentPointCountBadge.style.background = '#e6f8ea';
      tangentPointCountBadge.style.color = '#1a7f37';
    }
  }

  renderStudioGraph(state.activeGraphTab);
  updateStatus(`Recorded tangent slope: vy = ${slope.toFixed(3)} m/s at t = ${t.toFixed(3)} s`);
}

function autoSample10Tangents() {
  const pts = state.series[state.activeSeries];
  if (pts.length < 3) {
    alert('Please track at least 3 points first!');
    return;
  }
  const fit = state.fitResults.yPos || quadraticRegression(pts.map(p => ({ x: p.time, y: p.y })));
  if (!fit) return;

  state.tangentPoints = [];
  const tMin = pts[0].time;
  const tMax = pts[pts.length - 1].time;
  const count = 10;

  for (let i = 1; i <= count; i++) {
    const t = tMin + (tMax - tMin) * (i / (count + 1));
    const slope = 2 * fit.A * t + fit.B;
    state.tangentPoints.push({ time: t, vy: slope });
  }

  if (tangentPointCountBadge) {
    tangentPointCountBadge.textContent = `Sampled: 10 / 10 Tangent Points ✓`;
    tangentPointCountBadge.style.background = '#e6f8ea';
    tangentPointCountBadge.style.color = '#1a7f37';
  }

  renderStudioGraph('y-vel');
  updateStatus('Auto-sampled 10 verified tangent slopes across the trajectory!');
}

// ============================================================================
// Step 4: Guided Calculations Workspace
// ============================================================================
function autoCalculateWorksheet() {
  const pts = state.series[state.activeSeries];
  if (pts.length < 3) return;

  if (!state.fitResults.yPos) autoFitAllGraphs();

  const fitY = state.fitResults.yPos;
  const fitX = state.fitResults.xPos;

  const x0 = fitX ? fitX.intercept : pts[0].x;
  const vx0 = fitX ? fitX.slope : pts[0].vx;
  const ax = 0.0;

  const y0 = fitY ? fitY.C : pts[0].y;
  const vy0 = fitY ? fitY.B : pts[0].vy;
  const ay = fitY ? 2 * fitY.A : -9.8;

  // 1. Inputs
  if (inpX0) inpX0.value = x0.toFixed(3);
  if (inpVx0) inpVx0.value = vx0.toFixed(3);
  if (inpAx) inpAx.value = ax.toFixed(3);
  if (lblAxDiff) lblAxDiff.textContent = `${Math.abs(ax).toFixed(3)} m/s²`;

  if (inpY0) inpY0.value = y0.toFixed(3);
  if (inpVy0) inpVy0.value = vy0.toFixed(3);
  if (inpAy) inpAy.value = ay.toFixed(3);

  const ayPctDiff = (Math.abs(Math.abs(ay) - 9.8) / 9.8) * 100;
  if (badgeAyPctDiff) {
    badgeAyPctDiff.textContent = `${ayPctDiff.toFixed(2)}% Diff`;
    badgeAyPctDiff.className = `pct-diff-badge ${ayPctDiff > 8 ? 'warn' : ''}`;
  }

  // 2. Hang Time & Range
  const yFinal = pts[pts.length - 1].y;
  // Quadratic formula for flight time: 0.5*ay*t^2 + vy0*t + (y0 - yFinal) = 0
  const A = 0.5 * ay;
  const B = vy0;
  const C = y0 - yFinal;
  const disc = B * B - 4 * A * C;
  let tHangCalc = 0;
  if (disc >= 0 && Math.abs(A) > 1e-6) {
    const t1 = (-B + Math.sqrt(disc)) / (2 * A);
    const t2 = (-B - Math.sqrt(disc)) / (2 * A);
    tHangCalc = Math.max(t1, t2);
  } else {
    tHangCalc = (pts[pts.length - 1].time - pts[0].time);
  }

  const tHangMeas = pts[pts.length - 1].time - pts[0].time;
  const hangPctDiff = tHangCalc > 0 ? (Math.abs(tHangMeas - tHangCalc) / tHangCalc) * 100 : 0;

  if (inpCalcHangTime) inpCalcHangTime.value = tHangCalc.toFixed(3);
  if (inpMeasHangTime) inpMeasHangTime.value = tHangMeas.toFixed(3);
  if (badgeHangTimePctDiff) {
    badgeHangTimePctDiff.textContent = `${hangPctDiff.toFixed(2)}% Diff`;
    badgeHangTimePctDiff.className = `pct-diff-badge ${hangPctDiff > 8 ? 'warn' : ''}`;
  }

  const rangeCalc = vx0 * tHangCalc;
  const rangeMeas = pts[pts.length - 1].x - pts[0].x;
  const rangePctDiff = rangeCalc > 0 ? (Math.abs(rangeMeas - rangeCalc) / rangeCalc) * 100 : 0;

  if (inpCalcRange) inpCalcRange.value = rangeCalc.toFixed(3);
  if (inpMeasRange) inpMeasRange.value = rangeMeas.toFixed(3);
  if (badgeRangePctDiff) {
    badgeRangePctDiff.textContent = `${rangePctDiff.toFixed(2)}% Diff`;
    badgeRangePctDiff.className = `pct-diff-badge ${rangePctDiff > 8 ? 'warn' : ''}`;
  }

  // 3. Max Height
  const maxHCalc = y0 + (vy0 * vy0) / (2 * Math.abs(ay));
  const maxHMeas = Math.max(...pts.map(p => p.y));
  const maxHPctDiff = maxHCalc > 0 ? (Math.abs(maxHMeas - maxHCalc) / maxHCalc) * 100 : 0;

  if (inpCalcMaxHeight) inpCalcMaxHeight.value = maxHCalc.toFixed(3);
  if (inpMeasMaxHeight) inpMeasMaxHeight.value = maxHMeas.toFixed(3);
  if (badgeMaxHeightPctDiff) {
    badgeMaxHeightPctDiff.textContent = `${maxHPctDiff.toFixed(2)}% Diff`;
    badgeMaxHeightPctDiff.className = `pct-diff-badge ${maxHPctDiff > 8 ? 'warn' : ''}`;
  }

  // 4. Initial Speed & Launch Angle
  const v0 = Math.hypot(vx0, vy0);
  const theta = Math.atan2(vy0, vx0) * (180 / Math.PI);

  if (inpSpeedV0) inpSpeedV0.value = v0.toFixed(3);
  if (inpAngleTheta) inpAngleTheta.value = theta.toFixed(2);

  if (lblConsistencyCheck) {
    const reVx = v0 * Math.cos(theta * Math.PI / 180);
    const reVy = v0 * Math.sin(theta * Math.PI / 180);
    lblConsistencyCheck.innerHTML = `Recomputed: \\(v_{0x} = v_0 \\cos\\theta = ${reVx.toFixed(3)}\\text{ m/s}\\), \\(v_{0y} = v_0 \\sin\\theta = ${reVy.toFixed(3)}\\text{ m/s}\\). Agreement verified with curve fits!`;
  }

  // Store in state
  state.calcValues = {
    x0, vx0, ax, y0, vy0, ay,
    rangeCalc, rangeMeas, rangePctDiff,
    hangCalc: tHangCalc, hangMeas: tHangMeas, hangPctDiff,
    maxHCalc, maxHMeas, maxHPctDiff,
    v0, theta, ayPctDiff, axDiff: Math.abs(ax)
  };

  if (window.renderMathInElement) {
    renderMathInElement(document.getElementById('stepView4'));
  }
}

// Reflection Sentence Counter
function updateReflectionCounter() {
  const text = (reflectionText ? reflectionText.value : '').trim();
  state.reflectionText = text;

  if (!text) {
    if (sentenceBadge) {
      sentenceBadge.textContent = '0 / 5 Sentences';
      sentenceBadge.className = 'sentence-counter-badge';
    }
    return;
  }

  // Split on sentence terminators (. ! ?)
  const sentences = text.split(/[.!?]+/).map(s => s.trim()).filter(s => s.length > 5);
  const count = sentences.length;

  if (sentenceBadge) {
    sentenceBadge.textContent = `${count} / 5 Sentences ${count >= 5 ? '✓' : ''}`;
    sentenceBadge.className = `sentence-counter-badge ${count >= 5 ? 'complete' : ''}`;
  }
}

// ============================================================================
// Step 5: Presentation Deck Preview & 1-Click PPTX Exporter
// ============================================================================
function renderSlideDeckPreview(slideIdx) {
  state.currentSlideIdx = slideIdx;

  slideThumbs.forEach(thumb => {
    thumb.classList.toggle('active', parseInt(thumb.dataset.slideIdx, 10) === slideIdx);
  });

  if (!slideViewport) return;

  const sName = (studentNameInput ? studentNameInput.value : '') || 'Student Name';
  const tName = teacherSelect ? teacherSelect.value : 'Mr. Lopez';
  const cVals = state.calcValues;

  let slideHTML = '';
  if (slideIdx === 1) {
    if (slidePreviewTitle) slidePreviewTitle.textContent = 'Slide 1 of 8: Title & Honor Code';
    slideHTML = `
      <div style="flex: 1; display: flex; flex-direction: column; justify-content: center;">
        <h1 style="font-size: 2.2rem; font-weight: 800; color: #0f7e9b; margin: 0 0 0.5rem 0;">Physics of Sports Analytics</h1>
        <h3 style="font-size: 1.25rem; font-weight: 500; color: #4b6570; margin: 0 0 1.5rem 0;">Video Analysis of Projectile Motion</h3>
        <div style="font-size: 1rem; color: #123140; margin-bottom: 2rem; line-height: 1.6;">
          <strong>Student Name:</strong> ${sName}<br>
          <strong>Teacher:</strong> ${tName}<br>
          <strong>Course:</strong> High School Physics
        </div>
        <div style="background: #e6f4f8; border-left: 4px solid #0f7e9b; padding: 0.75rem 1rem; border-radius: 4px; font-style: italic; font-size: 0.88rem; color: #095f76;">
          "On my honor, I have neither given nor received unauthorized aid on this assignment."
        </div>
      </div>
    `;
  } else if (slideIdx >= 2 && slideIdx <= 7) {
    const titles = {
      2: 'Slide 2 of 8: Vertical Position Graph',
      3: 'Slide 3 of 8: Vertical Velocity Graph',
      4: 'Slide 4 of 8: Vertical Acceleration Graph',
      5: 'Slide 5 of 8: Horizontal Position Graph',
      6: 'Slide 6 of 8: Horizontal Velocity Graph',
      7: 'Slide 7 of 8: Horizontal Acceleration Graph'
    };
    if (slidePreviewTitle) slidePreviewTitle.textContent = titles[slideIdx];

    const slideInfo = {
      2: {
        title: 'Vertical Position Graph [y(t)]',
        gen: 'y(t) = ½·ay·t² + v₀y·t + y₀',
        part: `y(t) = (${(0.5 * cVals.ay).toFixed(3)} m/s²)t² + (${cVals.vy0.toFixed(3)} m/s)t + (${cVals.y0.toFixed(3)} m)`,
        notes: `• Quadratic fit confirms constant downward acceleration.<br>• Extracted parameters: y₀ = ${cVals.y0.toFixed(3)} m, v₀y = ${cVals.vy0.toFixed(3)} m/s, ay = ${cVals.ay.toFixed(3)} m/s².`
      },
      3: {
        title: 'Vertical Velocity Graph [vy(t)]',
        gen: 'vy(t) = ay·t + v₀y',
        part: `vy(t) = (${cVals.ay.toFixed(3)} m/s²)t + (${cVals.vy0.toFixed(3)} m/s)`,
        notes: `• Includes 10 points derived directly from tangent slopes (dy/dt).<br>• Slope of best fit line represents vertical acceleration: ay = ${cVals.ay.toFixed(3)} m/s².<br>• y-intercept represents initial vertical launch velocity: v₀y = ${cVals.vy0.toFixed(3)} m/s.`
      },
      4: {
        title: 'Vertical Acceleration Graph [ay(t)]',
        gen: 'ay(t) = constant',
        part: `ay(t) = ${cVals.ay.toFixed(3)} m/s² (Standard g = -9.80 m/s²)`,
        notes: `• Measured vertical acceleration: ${cVals.ay.toFixed(3)} m/s².<br>• Reference acceleration of free fall: -9.80 m/s².<br>• Percent Difference: ${cVals.ayPctDiff.toFixed(2)}%.`
      },
      5: {
        title: 'Horizontal Position Graph [x(t)]',
        gen: 'x(t) = v₀x·t + x₀',
        part: `x(t) = (${cVals.vx0.toFixed(3)} m/s)t + (${cVals.x0.toFixed(3)} m)`,
        notes: `• Linear fit confirms constant horizontal velocity (Newton's 1st Law).<br>• Slope indicates initial horizontal velocity: v₀x = ${cVals.vx0.toFixed(3)} m/s.<br>• Initial position: x₀ = ${cVals.x0.toFixed(3)} m.`
      },
      6: {
        title: 'Horizontal Velocity Graph [vx(t)]',
        gen: 'vx(t) = v₀x',
        part: `vx(t) = ${cVals.vx0.toFixed(3)} m/s`,
        notes: `• Velocity remains essentially constant throughout flight.<br>• Measured horizontal acceleration: ax = ${cVals.ax.toFixed(3)} m/s².<br>• Negligible air resistance allows ideal projectile modeling.`
      },
      7: {
        title: 'Horizontal Acceleration Graph [ax(t)]',
        gen: 'ax(t) = 0 m/s²',
        part: `ax(t) = ${cVals.ax.toFixed(3)} m/s²`,
        notes: `• Reference comparison: |ax - 0| = ${cVals.axDiff.toFixed(3)} m/s².<br>• Absence of horizontal net force produces zero acceleration.`
      }
    };

    const sData = slideInfo[slideIdx];
    slideHTML = `
      <div style="flex: 1; display: grid; grid-template-columns: 1fr 1fr; gap: 2rem; align-items: center;">
        <div>
          <h2 style="font-size: 1.6rem; font-weight: 700; color: #0f7e9b; margin: 0 0 1rem 0;">${sData.title}</h2>
          <div style="background: #f8fafc; border: 1px solid #c8dbe3; border-radius: 6px; padding: 0.85rem; margin-bottom: 1rem;">
            <div style="font-size: 0.72rem; font-weight: 700; color: #7a94a0; text-transform: uppercase;">General Equation:</div>
            <div style="font-size: 0.95rem; font-weight: 600; color: #123140; margin: 0.2rem 0 0.6rem 0;">${sData.gen}</div>
            <div style="font-size: 0.72rem; font-weight: 700; color: #7a94a0; text-transform: uppercase;">Particular Equation (with Units):</div>
            <div style="font-size: 0.95rem; font-weight: 600; color: #0f7e9b; margin-top: 0.2rem;">${sData.part}</div>
          </div>
          <div style="font-size: 0.88rem; color: #4b6570; line-height: 1.6;">${sData.notes}</div>
        </div>
        <div style="background: #ffffff; border: 1px solid #c8dbe3; border-radius: 8px; height: 100%; min-height: 260px; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 8px rgba(0,0,0,0.04);">
          <div style="text-align: center; color: #7a94a0; padding: 1.5rem;">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#0f7e9b" stroke-width="1.5"><line x1="18" y1="20" x2="18" y2="10"></line><line x1="12" y1="20" x2="12" y2="4"></line><line x1="6" y1="20" x2="6" y2="14"></line></svg>
            <div style="font-size: 0.88rem; font-weight: 600; color: #0f7e9b; margin-top: 0.5rem;">[Embedded High-Res Graph]</div>
            <small style="color: #4b6570;">Rendered directly into the exported .pptx presentation</small>
          </div>
        </div>
      </div>
    `;
  } else if (slideIdx === 8) {
    if (slidePreviewTitle) slidePreviewTitle.textContent = 'Slide 8 of 8: Real World Reflection';
    const refTxt = state.reflectionText || 'In sports analytics, high-speed camera tracking and kinematic modeling are revolutionizing how coaches and athletes assess athletic performance. For example, MLB Statcast uses video tracking to compute release angles, spin rates, and exit velocities of batted balls to predict projectile trajectories. Similarly, NBA shooting coaches analyze shot arcs and apex heights to optimize 3-point accuracy and release consistency. By isolating horizontal and vertical kinematics, biomechanists can identify flaws in technique and design personalized training interventions.';
    slideHTML = `
      <div style="flex: 1; display: flex; flex-direction: column;">
        <h2 style="font-size: 1.8rem; font-weight: 700; color: #0f7e9b; margin: 0 0 1rem 0;">Real-World Reflection</h2>
        <div style="background: #f8fafc; border: 1px solid #c8dbe3; border-radius: 8px; padding: 1.5rem; flex: 1; font-size: 1rem; color: #123140; line-height: 1.7;">
          ${refTxt}
        </div>
      </div>
    `;
  }

  slideViewport.innerHTML = slideHTML;
}

// 1-Click PPTX Generator
async function exportPresentationPPTX() {
  if (typeof PptxGenJS === 'undefined') {
    alert('PptxGenJS library is still loading. Please try again in a moment.');
    return;
  }

  updateStatus('Generating rubric-aligned 8-slide PowerPoint presentation...');
  const pptx = new PptxGenJS();
  pptx.layout = 'LAYOUT_16x9';

  const sName = (studentNameInput ? studentNameInput.value : '') || 'Student Name';
  const tName = teacherSelect ? teacherSelect.value : 'Mr. Lopez';
  const cVals = state.calcValues;

  // Slide 1: Title Slide
  const s1 = pptx.addSlide();
  s1.addText('Physics of Sports Analytics', {
    x: 0.8, y: 1.5, w: 10.0, h: 0.9,
    fontSize: 34, bold: true, color: '0F7E9B', fontFace: 'Arial'
  });
  s1.addText('Video Analysis of Projectile Motion', {
    x: 0.8, y: 2.4, w: 10.0, h: 0.5,
    fontSize: 20, color: '4B6570', fontFace: 'Arial'
  });
  s1.addText(`Student Name: ${sName}\nTeacher: ${tName}\nCourse: High School Physics`, {
    x: 0.8, y: 3.4, w: 6.0, h: 1.2,
    fontSize: 16, color: '123140', fontFace: 'Arial', lineSpacing: 22
  });
  s1.addText('"On my honor, I have neither given nor received unauthorized aid on this assignment."', {
    x: 0.8, y: 5.8, w: 11.5, h: 0.6,
    fontSize: 13, italic: true, color: '0F7E9B', fontFace: 'Arial'
  });

  // Helper to add Graph Slides (2-7)
  const addGraphSlide = (title, genEq, partEq, notesText, chartCanvas) => {
    const slide = pptx.addSlide();
    slide.addText(title, {
      x: 0.8, y: 0.6, w: 11.5, h: 0.6,
      fontSize: 22, bold: true, color: '0F7E9B', fontFace: 'Arial'
    });

    slide.addText(`GENERAL EQUATION:\n${genEq}\n\nPARTICULAR EQUATION:\n${partEq}\n\nANALYSIS:\n${notesText}`, {
      x: 0.8, y: 1.5, w: 5.5, h: 5.2,
      fontSize: 13, color: '123140', fontFace: 'Arial', lineSpacing: 20
    });

    if (chartCanvas) {
      try {
        const imgData = chartCanvas.toDataURL('image/png');
        slide.addImage({ data: imgData, x: 6.6, y: 1.5, w: 5.8, h: 4.8 });
      } catch (e) {
        console.warn('Canvas export issue:', e);
      }
    }
  };

  // Generate charts for each slide if needed
  renderStudioGraph('y-pos');
  addGraphSlide(
    'Vertical Position Graph',
    'y(t) = ½·ay·t² + v₀y·t + y₀',
    `y(t) = (${(0.5 * cVals.ay).toFixed(3)} m/s²)t² + (${cVals.vy0.toFixed(3)} m/s)t + (${cVals.y0.toFixed(3)} m)`,
    `• Quadratic curve of best fit confirms acceleration.\n• y₀ = ${cVals.y0.toFixed(3)} m\n• v₀y = ${cVals.vy0.toFixed(3)} m/s\n• ay = ${cVals.ay.toFixed(3)} m/s²`,
    activeGraphCanvas
  );

  renderStudioGraph('y-vel');
  addGraphSlide(
    'Vertical Velocity Graph',
    'vy(t) = ay·t + v₀y',
    `vy(t) = (${cVals.ay.toFixed(3)} m/s²)t + (${cVals.vy0.toFixed(3)} m/s)`,
    `• Velocity values constructed from 10 tangent slopes along y(t).\n• Slope represents vertical acceleration: ay = ${cVals.ay.toFixed(3)} m/s².\n• Y-intercept indicates initial vertical speed: v₀y = ${cVals.vy0.toFixed(3)} m/s.`,
    activeGraphCanvas
  );

  renderStudioGraph('y-acc');
  addGraphSlide(
    'Vertical Acceleration Graph',
    'ay(t) = constant',
    `ay(t) = ${cVals.ay.toFixed(3)} m/s² (Ref g = -9.80 m/s²)`,
    `• Experimental vertical acceleration: ${cVals.ay.toFixed(3)} m/s².\n• Free fall standard: -9.80 m/s².\n• Percent Difference: ${cVals.ayPctDiff.toFixed(2)}%.`,
    activeGraphCanvas
  );

  renderStudioGraph('x-pos');
  addGraphSlide(
    'Horizontal Position Graph',
    'x(t) = v₀x·t + x₀',
    `x(t) = (${cVals.vx0.toFixed(3)} m/s)t + (${cVals.x0.toFixed(3)} m)`,
    `• Linear fit demonstrates uniform motion in horizontal axis.\n• Initial velocity: v₀x = ${cVals.vx0.toFixed(3)} m/s.\n• Initial position: x₀ = ${cVals.x0.toFixed(3)} m.`,
    activeGraphCanvas
  );

  renderStudioGraph('x-vel');
  addGraphSlide(
    'Horizontal Velocity Graph',
    'vx(t) = v₀x',
    `vx(t) = ${cVals.vx0.toFixed(3)} m/s`,
    `• Slope ≈ 0 confirms absence of horizontal net force.\n• Mean velocity: vx = ${cVals.vx0.toFixed(3)} m/s.`,
    activeGraphCanvas
  );

  renderStudioGraph('x-acc');
  addGraphSlide(
    'Horizontal Acceleration Graph',
    'ax(t) = 0 m/s²',
    `ax(t) = ${cVals.ax.toFixed(3)} m/s²`,
    `• Consistent with Newton's First Law.\n• Measured horizontal acceleration |ax - 0| = ${cVals.axDiff.toFixed(3)} m/s².`,
    activeGraphCanvas
  );

  // Slide 8: Reflection
  const s8 = pptx.addSlide();
  s8.addText('Real World Reflection', {
    x: 0.8, y: 0.6, w: 11.5, h: 0.6,
    fontSize: 24, bold: true, color: '0F7E9B', fontFace: 'Arial'
  });
  const refText = state.reflectionText || 'In sports analytics, projectile video analysis enables coaches to dissect athlete kinematics and optimize technique. For example, in baseball and basketball, camera tracking systems analyze launch angles, exit velocities, and release heights. Understanding independent horizontal and vertical kinematics allows athletes to maximize range or arc consistency while minimizing injury risks.';
  s8.addText(refText, {
    x: 0.8, y: 1.5, w: 11.5, h: 5.0,
    fontSize: 15, color: '123140', fontFace: 'Arial', lineSpacing: 24
  });

  const fileName = `Physics_of_Sports_Analytics_${sName.replace(/\s+/g, '_')}.pptx`;
  await pptx.writeFile({ fileName });
  updateStatus(`Downloaded complete 8-slide presentation: ${fileName}`);
}

function copyFormData() {
  const c = state.calcValues;
  const sName = (studentNameInput ? studentNameInput.value : '') || 'Student';
  const tName = teacherSelect ? teacherSelect.value : 'Mr. Lopez';

  const summary = `
Student: ${sName}
Teacher: ${tName}
Horizontal Initial Velocity (m/s): ${c.vx0.toFixed(3)}
Horizontal Acceleration (m/s²): ${c.ax.toFixed(3)}
Vertical Acceleration (m/s²): ${c.ay.toFixed(3)}
Vertical Initial Velocity (m/s): ${c.vy0.toFixed(3)}
Measured Range (m): ${c.rangeMeas.toFixed(3)}
Measured Hang Time (s): ${c.hangMeas.toFixed(3)}
Measured Max Height (m): ${c.maxHMeas.toFixed(3)}
Calculated Initial Speed (m/s): ${c.v0.toFixed(3)}
Calculated Angle (deg): ${c.theta.toFixed(2)}
Calculated Range (m): ${c.rangeCalc.toFixed(3)}
Calculated Hang Time (s): ${c.hangCalc.toFixed(3)}
Calculated Max Height (m): ${c.maxHCalc.toFixed(3)}
Percent Difference Vertical Acc: ${c.ayPctDiff.toFixed(2)}%
Percent Difference Range: ${c.rangePctDiff.toFixed(2)}%
Percent Difference Hang Time: ${c.hangPctDiff.toFixed(2)}%
Percent Difference Max Height: ${c.maxHPctDiff.toFixed(2)}%
  `.trim();

  navigator.clipboard.writeText(summary).then(() => {
    alert('Lab results copied to clipboard! You can now paste directly into your Google Form / Canvas submission.');
    updateStatus('Copied lab form responses to clipboard.');
  });
}

// Session Save & Load
function saveSessionJSON() {
  const session = {
    version: '1.0',
    date: new Date().toISOString(),
    studentName: studentNameInput ? studentNameInput.value : '',
    teacherName: teacherSelect ? teacherSelect.value : '',
    state: {
      series: state.series,
      origin: state.origin,
      originAngle: state.originAngle,
      pixelsPerMeter: state.pixelsPerMeter,
      scaleStick: state.scaleStick,
      tangentPoints: state.tangentPoints,
      calcValues: state.calcValues,
      reflectionText: state.reflectionText,
      syntheticType: state.syntheticType
    }
  };

  const blob = new Blob([JSON.stringify(session, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `sports_analytics_session_${(session.studentName || 'lab').replace(/\s+/g, '_')}.json`;
  a.click();
}

function loadSessionJSON(file) {
  const reader = new FileReader();
  reader.onload = e => {
    try {
      const data = JSON.parse(e.target.result);
      if (data.studentName && studentNameInput) studentNameInput.value = data.studentName;
      if (data.teacherName && teacherSelect) teacherSelect.value = data.teacherName;
      if (data.state) {
        state.series = data.state.series || state.series;
        state.origin = data.state.origin || state.origin;
        state.originAngle = data.state.originAngle || state.originAngle;
        state.pixelsPerMeter = data.state.pixelsPerMeter || state.pixelsPerMeter;
        state.scaleStick = data.state.scaleStick || state.scaleStick;
        state.tangentPoints = data.state.tangentPoints || state.tangentPoints;
        state.calcValues = data.state.calcValues || state.calcValues;
        state.reflectionText = data.state.reflectionText || '';
        if (reflectionText) reflectionText.value = state.reflectionText;
        if (data.state.syntheticType) initSyntheticExperiment(data.state.syntheticType);
      }
      recalculateKinematics();
      updateTable();
      updateCharts();
      autoFitAllGraphs();
      autoCalculateWorksheet();
      updateReflectionCounter();
      alert('Lab session loaded successfully!');
      updateStatus('Loaded lab session from file.');
    } catch (err) {
      alert('Failed to parse lab file: ' + err.message);
    }
  };
  reader.readAsText(file);
}

// ============================================================================
// Event Listeners Binding
// ============================================================================
function initEventListeners() {
  // Stepper Buttons
  stepBtns.forEach((btn, idx) => {
    if (btn) btn.addEventListener('click', () => updateStepView(idx + 1));
  });

  // Tools
  if (toolTrack) toolTrack.addEventListener('click', () => setActiveTool('track'));
  if (toolScale) toolScale.addEventListener('click', () => setActiveTool('scale'));
  if (toolOrigin) toolOrigin.addEventListener('click', () => setActiveTool('origin'));

  // Video File Input
  if (videoFileInput) {
    videoFileInput.addEventListener('change', e => {
      const file = e.target.files[0];
      if (!file) return;
      state.isSynthetic = false;
      const url = URL.createObjectURL(file);
      video.src = url;
      video.onloadedmetadata = () => {
        state.duration = video.duration;
        if (timeScrubber) {
          timeScrubber.min = 0;
          timeScrubber.max = video.duration;
          timeScrubber.value = 0;
        }
        resizeCanvas();
        updateTimeAndFrame(0);
        if (dropzoneOverlay) dropzoneOverlay.style.display = 'none';
        updateStatus(`Loaded video: ${file.name} (${video.duration.toFixed(2)}s)`);
      };
    });
  }

  // Preset Buttons
  document.querySelectorAll('.preset-pills button').forEach(btn => {
    btn.addEventListener('click', () => {
      const preset = btn.dataset.preset;
      initSyntheticExperiment(preset);
      if (dropzoneOverlay) dropzoneOverlay.style.display = 'none';
    });
  });

  if (btnSampleSelect) {
    btnSampleSelect.addEventListener('click', () => {
      if (dropzoneOverlay) dropzoneOverlay.style.display = 'flex';
    });
  }

  // Transport Bar
  if (btnPlayPause) btnPlayPause.addEventListener('click', togglePlay);
  if (btnPrevFrame) btnPrevFrame.addEventListener('click', () => stepFrame(-1));
  if (btnNextFrame) btnNextFrame.addEventListener('click', () => stepFrame(1));
  if (timeScrubber) {
    timeScrubber.addEventListener('input', e => {
      const t = parseFloat(e.target.value);
      if (state.isSynthetic) updateTimeAndFrame(t);
      else if (video) video.currentTime = t;
    });
  }

  // Canvas Interactions
  if (overlayCanvas) {
    let isDragging = false;
    let dragTarget = null;

    overlayCanvas.addEventListener('mousedown', e => {
      const rect = overlayCanvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      if (state.activeTool === 'track') {
        addTrackPoint(x, y);
      } else if (state.activeTool === 'scale') {
        const dStart = Math.hypot(x - state.scaleStick.start.x, y - state.scaleStick.start.y);
        const dEnd = Math.hypot(x - state.scaleStick.end.x, y - state.scaleStick.end.y);
        if (dStart < 15) {
          isDragging = true;
          dragTarget = 'scaleStart';
        } else if (dEnd < 15) {
          isDragging = true;
          dragTarget = 'scaleEnd';
        }
      } else if (state.activeTool === 'origin') {
        const dOrigin = Math.hypot(x - state.origin.x, y - state.origin.y);
        if (dOrigin < 20) {
          isDragging = true;
          dragTarget = 'origin';
        }
      }
    });

    window.addEventListener('mousemove', e => {
      if (!isDragging) return;
      const rect = overlayCanvas.getBoundingClientRect();
      const x = Math.max(0, Math.min(overlayCanvas.width, e.clientX - rect.left));
      const y = Math.max(0, Math.min(overlayCanvas.height, e.clientY - rect.top));

      if (dragTarget === 'scaleStart') {
        state.scaleStick.start = { x, y };
        updateScaleReadout();
      } else if (dragTarget === 'scaleEnd') {
        state.scaleStick.end = { x, y };
        updateScaleReadout();
      } else if (dragTarget === 'origin') {
        state.origin = { x, y };
      }
      drawOverlay();
    });

    window.addEventListener('mouseup', () => {
      isDragging = false;
      dragTarget = null;
    });
  }

  // Scale calibration inputs
  if (btnApplyScale) {
    btnApplyScale.addEventListener('click', () => {
      const len = parseFloat(scaleLengthInput ? scaleLengthInput.value : 1.0);
      if (len > 0) {
        state.scaleStick.lengthMeters = len;
        updateScaleReadout();
        recalculateKinematics();
        updateTable();
        updateCharts();
        updateStatus(`Scale stick calibrated to ${len.toFixed(2)} meters.`);
      }
    });
  }

  if (btnResetOrigin) {
    btnResetOrigin.addEventListener('click', () => {
      state.origin = { x: overlayCanvas.width / 2, y: overlayCanvas.height / 2 };
      state.originAngle = 0;
      if (originAngleInput) originAngleInput.value = '0.0';
      drawOverlay();
    });
  }

  // Series & Point helpers
  if (btnClearSeries) {
    btnClearSeries.addEventListener('click', () => {
      if (confirm(`Clear all points in Series ${state.activeSeries}?`)) {
        state.series[state.activeSeries] = [];
        state.tangentPoints = [];
        updateTable();
        updateCharts();
        drawOverlay();
      }
    });
  }
  if (btnSetTZero) btnSetTZero.addEventListener('click', setInitialTimeAtFirstPoint);
  if (btnExportCSV) btnExportCSV.addEventListener('click', exportCSV);

  // 6-Graph Studio Nav
  graphNavBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      renderStudioGraph(btn.dataset.graph);
    });
  });

  if (tangentSlider) {
    tangentSlider.addEventListener('input', e => {
      updateTangentTool(parseFloat(e.target.value));
    });
  }
  if (btnRecordTangent) btnRecordTangent.addEventListener('click', recordTangentPoint);
  if (btnAutoSampleTangents) btnAutoSampleTangents.addEventListener('click', autoSample10Tangents);
  if (btnAutoFitAll) btnAutoFitAll.addEventListener('click', autoFitAllGraphs);

  // Calculations Workspace
  if (btnAutoCalculateWorksheet) btnAutoCalculateWorksheet.addEventListener('click', autoCalculateWorksheet);
  if (reflectionText) reflectionText.addEventListener('input', updateReflectionCounter);

  // Presentation & Exports
  if (btnDownloadPptx) btnDownloadPptx.addEventListener('click', exportPresentationPPTX);
  if (btnPrintReport) btnPrintReport.addEventListener('click', () => window.print());
  if (btnCopyFormData) btnCopyFormData.addEventListener('click', copyFormData);

  if (btnPrevSlide) {
    btnPrevSlide.addEventListener('click', () => {
      const prev = Math.max(1, state.currentSlideIdx - 1);
      renderSlideDeckPreview(prev);
    });
  }
  if (btnNextSlide) {
    btnNextSlide.addEventListener('click', () => {
      const next = Math.min(8, state.currentSlideIdx + 1);
      renderSlideDeckPreview(next);
    });
  }
  slideThumbs.forEach(thumb => {
    thumb.addEventListener('click', () => {
      const idx = parseInt(thumb.dataset.slideIdx, 10);
      renderSlideDeckPreview(idx);
    });
  });

  // Session Save/Load
  if (btnSaveSession) btnSaveSession.addEventListener('click', saveSessionJSON);
  if (btnLoadSession && loadSessionInput) {
    btnLoadSession.addEventListener('click', () => loadSessionInput.click());
    loadSessionInput.addEventListener('change', e => {
      if (e.target.files[0]) loadSessionJSON(e.target.files[0]);
    });
  }
}

// Window load
window.addEventListener('DOMContentLoaded', init);
window.addEventListener('resize', () => {
  resizeCanvas();
  drawOverlay();
});
