/**
 * Video Analysis & Motion Tracking Simulation (Logger Pro Replicator)
 * Designed for The Thinking Experiment (PhysicsKit)
 * Strictly Light Mode, Teal (#0f7e9b) and Amber (#d67b19).
 */

// Application State
const state = {
  activeTool: 'track', // 'track', 'scale', 'origin'
  activeSeries: 'A',   // 'A' or 'B'
  fps: 30,
  stepFrames: 2,
  currentTime: 0,
  duration: 0,
  isPlaying: false,
  showVectors: true,
  showLoupe: true,

  // Calibration & Transform
  pixelsPerMeter: 300, // 300px = 1m default
  origin: { x: 80, y: 380 }, // in video coordinate space
  originAngle: 0, // in radians

  // Scale stick state
  scaleStick: {
    start: { x: 100, y: 400 },
    end: { x: 400, y: 400 },
    lengthMeters: 1.0,
    isDragging: false,
    dragPoint: null
  },

  // Tracked data points
  series: {
    A: [], // Array of { frame, time, videoX, videoY, x, y, vx, vy, ax, ay }
    B: []
  },

  // Synthetic Video Generator (for built-in experiments)
  isSynthetic: true,
  syntheticType: 'projectile',
  syntheticCanvas: document.createElement('canvas'),
  syntheticCtx: null
};

// DOM Elements
const video = document.getElementById('mainVideo');
const overlayCanvas = document.getElementById('overlayCanvas');
const ctx = overlayCanvas.getContext('2d');
const loupeCanvas = document.getElementById('loupeCanvas');
const loupeCtx = loupeCanvas.getContext('2d');
const viewportContainer = document.getElementById('viewportContainer');
const dropzoneOverlay = document.getElementById('dropzoneOverlay');

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
const chkShowVectors = document.getElementById('chkShowVectors');
const chkShowLoupe = document.getElementById('chkShowLoupe');
const statusMessage = document.getElementById('statusMessage');

// Tools
const toolTrack = document.getElementById('toolTrack');
const toolScale = document.getElementById('toolScale');
const toolOrigin = document.getElementById('toolOrigin');
const btnApplyScale = document.getElementById('btnApplyScale');
const scaleLengthInput = document.getElementById('scaleLengthInput');
const scaleReadout = document.getElementById('scaleReadout');
const originAngleInput = document.getElementById('originAngleInput');
const btnResetOrigin = document.getElementById('btnResetOrigin');
const videoFileInput = document.getElementById('videoFileInput');
const btnExportCSV = document.getElementById('btnExportCSV');
const btnSampleSelect = document.getElementById('btnSampleSelect');

// Tabs
const tabButtons = document.querySelectorAll('.tab-btn');
const tabContents = document.querySelectorAll('.tab-content');
const pointsTableBody = document.getElementById('pointsTableBody');
const btnFitPosition = document.getElementById('btnFitPosition');
const btnFitVelocity = document.getElementById('btnFitVelocity');
const fitResultPos = document.getElementById('fitResultPos');
const fitResultVel = document.getElementById('fitResultVel');

// Charts
let posChart = null;
let velChart = null;

// ==========================================
// 1. Synthetic Physics Video Engine
// ==========================================
function initSyntheticExperiment(type = 'projectile') {
  state.isSynthetic = true;
  state.syntheticType = type;
  state.duration = 2.5; // 2.5 seconds
  state.currentTime = 0;
  state.fps = 60;
  fpsInput.value = state.fps;

  const w = 720;
  const h = 480;
  state.syntheticCanvas.width = w;
  state.syntheticCanvas.height = h;
  state.syntheticCtx = state.syntheticCanvas.getContext('2d');

  // Set default origin and scale for physics
  if (type === 'projectile') {
    state.origin = { x: 80, y: 410 };
    state.pixelsPerMeter = 140; // 140px = 1m
    state.scaleStick = {
      start: { x: 80, y: 430 },
      end: { x: 220, y: 430 },
      lengthMeters: 1.0,
      isDragging: false,
      dragPoint: null
    };
    updateStatus('Loaded Projectile Toss experiment (v0 = 4.2 m/s, θ = 58°). Click object to track motion!');
  } else if (type === 'freefall') {
    state.origin = { x: 360, y: 60 };
    state.pixelsPerMeter = 180;
    state.scaleStick = {
      start: { x: 260, y: 60 },
      end: { x: 260, y: 240 },
      lengthMeters: 1.0,
      isDragging: false,
      dragPoint: null
    };
    updateStatus('Loaded Free Fall Lab (g = 9.8 m/s²). Drop height = 2.0 m. Click basketball to track!');
  } else if (type === 'pendulum') {
    state.origin = { x: 360, y: 100 };
    state.pixelsPerMeter = 200;
    updateStatus('Loaded Simple Pendulum (L = 1.2 m). Click bob across complete oscillation cycles.');
  } else if (type === 'cart') {
    state.origin = { x: 50, y: 320 };
    state.pixelsPerMeter = 250;
    updateStatus('Loaded Elastic Cart Collision on Track. Track Cart A (Amber) then Cart B (Teal).');
  }

  updateScaleReadout();

  // Create stream for HTML video element
  try {
    const stream = state.syntheticCanvas.captureStream(state.fps);
    video.srcObject = stream;
    video.play().then(() => {
      video.pause();
      renderSyntheticFrame(0);
      resizeCanvas();
    });
  } catch (err) {
    console.warn('Canvas stream fallback:', err);
    // Fallback: draw directly to overlay
    renderSyntheticFrame(0);
    resizeCanvas();
  }

  dropzoneOverlay.classList.add('hidden');
}

function renderSyntheticFrame(t) {
  if (!state.isSynthetic || !state.syntheticCtx) return;
  const ctxS = state.syntheticCtx;
  const w = state.syntheticCanvas.width;
  const h = state.syntheticCanvas.height;

  // Background: Clean lab setting (Light mode, white/subtle gray)
  ctxS.fillStyle = '#f8fafc';
  ctxS.fillRect(0, 0, w, h);

  // Lab Wall & Measurement Grid
  ctxS.strokeStyle = '#e2e8f0';
  ctxS.lineWidth = 1;
  const gridStep = state.pixelsPerMeter / 2; // 0.5m grid
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

  // Lab Table / Floor
  ctxS.fillStyle = '#e2edf3';
  ctxS.fillRect(0, 420, w, 60);
  ctxS.strokeStyle = '#a9c4cf';
  ctxS.lineWidth = 2;
  ctxS.beginPath();
  ctxS.moveTo(0, 420);
  ctxS.lineTo(w, 420);
  ctxS.stroke();

  // Lab Meter Stick on Wall (Visible reference)
  ctxS.fillStyle = '#ffecb3';
  ctxS.strokeStyle = '#d67b19';
  ctxS.lineWidth = 1.5;
  const stickX = 80;
  const stickY = 435;
  const stickW = state.pixelsPerMeter; // exactly 1.0m
  ctxS.fillRect(stickX, stickY, stickW, 14);
  ctxS.strokeRect(stickX, stickY, stickW, 14);
  ctxS.fillStyle = '#123140';
  ctxS.font = 'bold 9px monospace';
  ctxS.fillText('1.00 METER REFERENCE', stickX + 18, stickY + 11);

  // Render Experiments
  if (state.syntheticType === 'projectile') {
    // Projectile Launch: v0 = 4.2 m/s, theta = 58 deg, g = 9.8 m/s^2
    const theta = 58 * (Math.PI / 180);
    const v0 = 4.2;
    const g = 9.8;
    const xMeters = v0 * Math.cos(theta) * t;
    const yMeters = Math.max(0, (v0 * Math.sin(theta) * t) - (0.5 * g * t * t));

    const ballPixelX = state.origin.x + (xMeters * state.pixelsPerMeter);
    const ballPixelY = state.origin.y - (yMeters * state.pixelsPerMeter);

    // Ball (Bright Amber with subtle 3D lighting)
    const rad = 13;
    const grad = ctxS.createRadialGradient(ballPixelX - 3, ballPixelY - 3, 2, ballPixelX, ballPixelY, rad);
    grad.addColorStop(0, '#f9a825');
    grad.addColorStop(0.7, '#d67b19');
    grad.addColorStop(1, '#9e5207');

    ctxS.fillStyle = grad;
    ctxS.beginPath();
    ctxS.arc(ballPixelX, ballPixelY, rad, 0, Math.PI * 2);
    ctxS.fill();
    ctxS.strokeStyle = '#6d3600';
    ctxS.lineWidth = 1.5;
    ctxS.stroke();

    // Center of mass crosshair
    ctxS.strokeStyle = 'rgba(255, 255, 255, 0.8)';
    ctxS.beginPath();
    ctxS.moveTo(ballPixelX - 5, ballPixelY);
    ctxS.lineTo(ballPixelX + 5, ballPixelY);
    ctxS.moveTo(ballPixelX, ballPixelY - 5);
    ctxS.lineTo(ballPixelX, ballPixelY + 5);
    ctxS.stroke();

  } else if (state.syntheticType === 'freefall') {
    // Free fall: y(t) = 0.5 * g * t^2
    const g = 9.8;
    const yMeters = Math.min(2.0, 0.5 * g * t * t);
    const ballPixelX = state.origin.x;
    const ballPixelY = state.origin.y + (yMeters * state.pixelsPerMeter);

    const rad = 16;
    const grad = ctxS.createRadialGradient(ballPixelX - 4, ballPixelY - 4, 3, ballPixelX, ballPixelY, rad);
    grad.addColorStop(0, '#ff8a65');
    grad.addColorStop(0.8, '#d84315');
    grad.addColorStop(1, '#bf360c');

    ctxS.fillStyle = grad;
    ctxS.beginPath();
    ctxS.arc(ballPixelX, ballPixelY, rad, 0, Math.PI * 2);
    ctxS.fill();
    ctxS.strokeStyle = '#4e1402';
    ctxS.lineWidth = 1.5;
    ctxS.stroke();

  } else if (state.syntheticType === 'pendulum') {
    // Pendulum: theta(t) = theta0 * cos(omega * t)
    const L = 1.2;
    const omega = Math.sqrt(9.8 / L);
    const theta0 = 0.45; // rad
    const currentTheta = theta0 * Math.cos(omega * t);

    const bobPixelX = state.origin.x + (L * Math.sin(currentTheta) * state.pixelsPerMeter);
    const bobPixelY = state.origin.y + (L * Math.cos(currentTheta) * state.pixelsPerMeter);

    // String
    ctxS.strokeStyle = '#475569';
    ctxS.lineWidth = 2;
    ctxS.beginPath();
    ctxS.moveTo(state.origin.x, state.origin.y);
    ctxS.lineTo(bobPixelX, bobPixelY);
    ctxS.stroke();

    // Pivot mount
    ctxS.fillStyle = '#0f7e9b';
    ctxS.fillRect(state.origin.x - 12, state.origin.y - 8, 24, 10);

    // Bob
    ctxS.fillStyle = '#0f7e9b';
    ctxS.beginPath();
    ctxS.arc(bobPixelX, bobPixelY, 15, 0, Math.PI * 2);
    ctxS.fill();
    ctxS.strokeStyle = '#095f76';
    ctxS.lineWidth = 2;
    ctxS.stroke();

  } else if (state.syntheticType === 'cart') {
    // Cart collision: Cart A moves right, collides with resting Cart B at t = 1.0s
    let xA = 0.2;
    let xB = 1.2;
    if (t < 1.0) {
      xA = 0.2 + 0.8 * t;
      xB = 1.0;
    } else {
      const dt = t - 1.0;
      xA = 1.0 + 0.1 * dt; // rebound / slow
      xB = 1.0 + 0.7 * dt; // pushed forward
    }

    const cartAY = 390;
    const cartAX = state.origin.x + (xA * state.pixelsPerMeter);
    const cartBX = state.origin.x + (xB * state.pixelsPerMeter);

    // Cart A (Amber)
    ctxS.fillStyle = '#d67b19';
    ctxS.fillRect(cartAX - 30, cartAY, 60, 26);
    ctxS.strokeStyle = '#9e5207';
    ctxS.strokeRect(cartAX - 30, cartAY, 60, 26);

    // Cart B (Teal)
    ctxS.fillStyle = '#0f7e9b';
    ctxS.fillRect(cartBX - 30, cartAY, 60, 26);
    ctxS.strokeStyle = '#095f76';
    ctxS.strokeRect(cartBX - 30, cartAY, 60, 26);
  }
}

// ==========================================
// 2. Video Player & Frame Stepping
// ==========================================
function updateTimeAndFrame(time) {
  state.currentTime = Math.max(0, Math.min(state.duration || 10, time));
  const currentFrame = Math.round(state.currentTime * state.fps);

  timeScrubber.value = (state.currentTime / (state.duration || 1)) * 100;
  currentTimeText.textContent = `t = ${state.currentTime.toFixed(3)} s`;
  currentFrameText.textContent = `Frame: ${currentFrame}`;

  if (state.isSynthetic) {
    renderSyntheticFrame(state.currentTime);
  } else {
    video.currentTime = state.currentTime;
  }

  drawOverlay();
}

function stepFrame(delta) {
  const dt = delta / state.fps;
  updateTimeAndFrame(state.currentTime + dt);
}

function togglePlay() {
  state.isPlaying = !state.isPlaying;
  if (state.isPlaying) {
    iconPlay.style.display = 'none';
    iconPause.style.display = 'inline';
    if (!state.isSynthetic) {
      video.play();
    } else {
      lastPlayTime = performance.now();
      requestAnimationFrame(playSyntheticLoop);
    }
  } else {
    iconPlay.style.display = 'inline';
    iconPause.style.display = 'none';
    if (!state.isSynthetic) {
      video.pause();
    }
  }
}

let lastPlayTime = 0;
function playSyntheticLoop(now) {
  if (!state.isPlaying || !state.isSynthetic) return;
  const dt = (now - lastPlayTime) / 1000 * parseFloat(playbackRateSelect.value);
  lastPlayTime = now;

  let newTime = state.currentTime + dt;
  if (newTime >= state.duration) {
    newTime = 0; // Loop experiment
  }
  updateTimeAndFrame(newTime);
  requestAnimationFrame(playSyntheticLoop);
}

// ==========================================
// 3. Coordinate System & Scale Calibration
// ==========================================
function transformToPhysics(videoX, videoY) {
  // Translate relative to origin
  const dx = videoX - state.origin.x;
  const dy = -(videoY - state.origin.y); // Invert Y (upwards is positive in physics)

  // Rotate by originAngle
  const cos = Math.cos(state.originAngle);
  const sin = Math.sin(state.originAngle);
  const rx = dx * cos - dy * sin;
  const ry = dx * sin + dy * cos;

  // Convert pixels to meters
  const xMeters = rx / state.pixelsPerMeter;
  const yMeters = ry / state.pixelsPerMeter;

  return { x: xMeters, y: yMeters };
}

function updateScaleReadout() {
  const pxPerMeter = state.pixelsPerMeter;
  const mPerPx = 1 / pxPerMeter;
  scaleReadout.textContent = `Current Scale: 1 px = ${mPerPx.toFixed(4)} m (${pxPerMeter.toFixed(1)} px/m)`;
}

function calculateScaleFromStick() {
  const dx = state.scaleStick.end.x - state.scaleStick.start.x;
  const dy = state.scaleStick.end.y - state.scaleStick.start.y;
  const pixelDist = Math.sqrt(dx * dx + dy * dy);
  const meters = parseFloat(scaleLengthInput.value) || 1.0;

  if (pixelDist > 5) {
    state.pixelsPerMeter = pixelDist / meters;
    state.scaleStick.lengthMeters = meters;
    updateScaleReadout();
    recalculateKinematics();
    updateStatus(`Scale calibrated: ${pixelDist.toFixed(1)} px = ${meters} m (${state.pixelsPerMeter.toFixed(1)} px/m)`);
    drawOverlay();
  }
}

// ==========================================
// 4. Point Tracking & Kinematics Engine
// ==========================================
function addTrackPoint(videoX, videoY) {
  const currentSeries = state.series[state.activeSeries];
  const frame = Math.round(state.currentTime * state.fps);

  // Check if frame already tracked; replace if so
  const existingIdx = currentSeries.findIndex(p => p.frame === frame);
  const phys = transformToPhysics(videoX, videoY);

  const pointData = {
    frame: frame,
    time: state.currentTime,
    videoX: videoX,
    videoY: videoY,
    x: phys.x,
    y: phys.y,
    vx: 0,
    vy: 0,
    ax: 0,
    ay: 0
  };

  if (existingIdx >= 0) {
    currentSeries[existingIdx] = pointData;
  } else {
    currentSeries.push(pointData);
    // Keep sorted by frame
    currentSeries.sort((a, b) => a.frame - b.frame);
  }

  // Numerical differentiation across series
  recalculateKinematics();

  // Auto-advance by selected step frames
  const advance = parseInt(stepFrameSelect.value, 10);
  stepFrame(advance);

  updateStatus(`Recorded point #${currentSeries.length} for Series ${state.activeSeries} at t = ${pointData.time.toFixed(3)}s`);
}

function recalculateKinematics() {
  ['A', 'B'].forEach(sKey => {
    const pts = state.series[sKey];
    for (let i = 0; i < pts.length; i++) {
      // Re-transform position in case origin or scale changed
      const phys = transformToPhysics(pts[i].videoX, pts[i].videoY);
      pts[i].x = phys.x;
      pts[i].y = phys.y;

      // Centered finite differences for velocity:
      // vi = (x_{i+1} - x_{i-1}) / (t_{i+1} - t_{i-1})
      if (i > 0 && i < pts.length - 1) {
        const dt = pts[i + 1].time - pts[i - 1].time;
        if (dt > 0.0001) {
          pts[i].vx = (pts[i + 1].x - pts[i - 1].x) / dt;
          pts[i].vy = (pts[i + 1].y - pts[i - 1].y) / dt;
        }
      } else if (i === 0 && pts.length > 1) {
        // Forward difference at start
        const dt = pts[1].time - pts[0].time;
        pts[0].vx = dt > 0 ? (pts[1].x - pts[0].x) / dt : 0;
        pts[0].vy = dt > 0 ? (pts[1].y - pts[0].y) / dt : 0;
      } else if (i === pts.length - 1 && pts.length > 1) {
        // Backward difference at end
        const dt = pts[i].time - pts[i - 1].time;
        pts[i].vx = dt > 0 ? (pts[i].x - pts[i - 1].x) / dt : 0;
        pts[i].vy = dt > 0 ? (pts[i].y - pts[i - 1].y) / dt : 0;
      }
    }
  });

  updateTable();
  updateCharts();
}

// ==========================================
// 5. Canvas Overlay & Loupe Rendering
// ==========================================
function resizeCanvas() {
  const rect = (state.isSynthetic) 
    ? { width: state.syntheticCanvas.width, height: state.syntheticCanvas.height }
    : video.getBoundingClientRect();

  const w = rect.width || 720;
  const h = rect.height || 480;

  overlayCanvas.width = w;
  overlayCanvas.height = h;
  drawOverlay();
}

function drawOverlay() {
  ctx.clearRect(0, 0, overlayCanvas.width, overlayCanvas.height);

  // If synthetic and no video stream playing, paint background frame
  if (state.isSynthetic && state.syntheticCanvas.width) {
    ctx.drawImage(state.syntheticCanvas, 0, 0, overlayCanvas.width, overlayCanvas.height);
  }

  // 1. Draw Origin & Axes
  drawAxes();

  // 2. Draw Scale Stick (if scale tool is active or calibrated)
  drawScaleStick();

  // 3. Draw Tracked Points & Velocity Vectors for all Series
  drawTrackedPoints();
}

function drawAxes() {
  const ox = state.origin.x;
  const oy = state.origin.y;
  const angle = state.originAngle;
  const axisLen = 140;

  ctx.save();
  ctx.translate(ox, oy);
  ctx.rotate(-angle);

  // X-Axis (Teal)
  ctx.strokeStyle = '#0f7e9b';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(axisLen, 0);
  // Arrow head
  ctx.lineTo(axisLen - 8, -5);
  ctx.moveTo(axisLen, 0);
  ctx.lineTo(axisLen - 8, 5);
  ctx.stroke();

  // Y-Axis (Teal)
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(0, -axisLen);
  // Arrow head
  ctx.lineTo(-5, -axisLen + 8);
  ctx.moveTo(0, -axisLen);
  ctx.lineTo(5, -axisLen + 8);
  ctx.stroke();

  // Labels
  ctx.fillStyle = '#0f7e9b';
  ctx.font = 'bold 12px Inter, sans-serif';
  ctx.fillText('+x', axisLen + 6, 4);
  ctx.fillText('+y', -8, -axisLen - 8);

  // Origin point
  ctx.fillStyle = '#0f7e9b';
  ctx.beginPath();
  ctx.arc(0, 0, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  ctx.restore();
}

function drawScaleStick() {
  const s = state.scaleStick;
  ctx.save();
  ctx.strokeStyle = '#d67b19';
  ctx.lineWidth = 2.5;

  // Main line
  ctx.beginPath();
  ctx.moveTo(s.start.x, s.start.y);
  ctx.lineTo(s.end.x, s.end.y);
  ctx.stroke();

  // End caps
  const capLen = 10;
  const angle = Math.atan2(s.end.y - s.start.y, s.end.x - s.start.x);
  const perp = angle + Math.PI / 2;

  [s.start, s.end].forEach(pt => {
    ctx.beginPath();
    ctx.moveTo(pt.x + Math.cos(perp) * capLen, pt.y + Math.sin(perp) * capLen);
    ctx.lineTo(pt.x - Math.cos(perp) * capLen, pt.y - Math.sin(perp) * capLen);
    ctx.stroke();

    // Draggable handle circle
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(pt.x, pt.y, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  });

  // Length label
  const midX = (s.start.x + s.end.x) / 2;
  const midY = (s.start.y + s.end.y) / 2;
  ctx.fillStyle = '#d67b19';
  ctx.font = 'bold 11px Inter, sans-serif';
  ctx.fillText(`${s.lengthMeters.toFixed(2)} m`, midX + 6, midY - 6);

  ctx.restore();
}

function drawTrackedPoints() {
  const currentFrame = Math.round(state.currentTime * state.fps);

  ['A', 'B'].forEach(sKey => {
    const pts = state.series[sKey];
    const isAmber = sKey === 'A';
    const mainColor = isAmber ? '#d67b19' : '#0f7e9b';
    const softColor = isAmber ? 'rgba(214, 123, 25, 0.45)' : 'rgba(15, 126, 155, 0.45)';

    for (let i = 0; i < pts.length; i++) {
      const p = pts[i];
      const isCurrent = Math.abs(p.frame - currentFrame) <= 1;

      // Draw point dot
      ctx.fillStyle = isCurrent ? mainColor : softColor;
      ctx.beginPath();
      ctx.arc(p.videoX, p.videoY, isCurrent ? 6 : 4, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1;
      ctx.stroke();

      // Velocity Vector (Arrow)
      if (state.showVectors && (p.vx !== 0 || p.vy !== 0)) {
        const vScale = 30; // Pixel length per m/s
        const vxPx = p.vx * vScale;
        const vyPx = -p.vy * vScale; // Invert back for screen coordinates

        ctx.strokeStyle = mainColor;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(p.videoX, p.videoY);
        ctx.lineTo(p.videoX + vxPx, p.videoY + vyPx);
        ctx.stroke();
      }
    }
  });
}

// Loupe Magnifier Engine
function updateLoupe(e) {
  if (!state.showLoupe) {
    loupeCanvas.style.display = 'none';
    return;
  }

  const rect = overlayCanvas.getBoundingClientRect();
  const mouseX = e.clientX - rect.left;
  const mouseY = e.clientY - rect.top;

  if (mouseX < 0 || mouseX > overlayCanvas.width || mouseY < 0 || mouseY > overlayCanvas.height) {
    loupeCanvas.style.display = 'none';
    return;
  }

  loupeCanvas.style.display = 'block';
  loupeCanvas.style.left = `${mouseX}px`;
  loupeCanvas.style.top = `${mouseY}px`;

  // Draw 2.5x zoomed view
  loupeCtx.clearRect(0, 0, 120, 120);
  const zoom = 2.5;
  const srcW = 120 / zoom;
  const srcH = 120 / zoom;
  const srcX = mouseX - srcW / 2;
  const srcY = mouseY - srcH / 2;

  // Source image from video or synthetic canvas
  const source = state.isSynthetic ? state.syntheticCanvas : video;
  loupeCtx.drawImage(source, srcX, srcY, srcW, srcH, 0, 0, 120, 120);

  // Loupe crosshair
  loupeCtx.strokeStyle = '#d67b19';
  loupeCtx.lineWidth = 1.5;
  loupeCtx.beginPath();
  loupeCtx.moveTo(60, 40);
  loupeCtx.lineTo(60, 80);
  loupeCtx.moveTo(40, 60);
  loupeCtx.lineTo(80, 60);
  loupeCtx.stroke();
}

// ==========================================
// 6. Interactive Charts & Curve Fitting
// ==========================================
function initCharts() {
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    animation: false,
    plugins: {
      legend: {
        display: true,
        position: 'top',
        labels: { boxWidth: 10, font: { size: 10 } }
      }
    },
    scales: {
      x: {
        title: { display: true, text: 'Time t (s)', font: { size: 10 } },
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
        { label: 'y (m)', data: [], backgroundColor: '#d67b19', borderColor: '#d67b19', pointRadius: 4 },
        { label: 'x (m)', data: [], backgroundColor: '#0f7e9b', borderColor: '#0f7e9b', pointRadius: 4 }
      ]
    },
    options: {
      ...chartOptions,
      scales: {
        ...chartOptions.scales,
        y: { title: { display: true, text: 'Position (m)', font: { size: 10 } }, grid: { color: '#eef3f6' } }
      }
    }
  });

  const ctxVel = document.getElementById('velChart').getContext('2d');
  velChart = new Chart(ctxVel, {
    type: 'scatter',
    data: {
      datasets: [
        { label: 'vy (m/s)', data: [], backgroundColor: '#d67b19', borderColor: '#d67b19', pointRadius: 4 },
        { label: 'vx (m/s)', data: [], backgroundColor: '#0f7e9b', borderColor: '#0f7e9b', pointRadius: 4 }
      ]
    },
    options: {
      ...chartOptions,
      scales: {
        ...chartOptions.scales,
        y: { title: { display: true, text: 'Velocity (m/s)', font: { size: 10 } }, grid: { color: '#eef3f6' } }
      }
    }
  });
}

function updateCharts() {
  const pts = state.series[state.activeSeries];
  if (!posChart || !velChart) return;

  posChart.data.datasets[0].data = pts.map(p => ({ x: p.time, y: p.y }));
  posChart.data.datasets[1].data = pts.map(p => ({ x: p.time, y: p.x }));
  posChart.update();

  velChart.data.datasets[0].data = pts.map(p => ({ x: p.time, y: p.vy }));
  velChart.data.datasets[1].data = pts.map(p => ({ x: p.time, y: p.vx }));
  velChart.update();
}

// Curve Fitting (Linear & Quadratic Regressions)
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
  const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;
  return { slope, intercept };
}

function quadraticRegression(points) {
  // y = A*t^2 + B*t + C  where A = 0.5 * a, so acceleration a = 2A
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

  // Solve 3x3 system using Cramer's rule
  const D = (
    n * (sumT2 * sumT4 - sumT3 * sumT3) -
    sumT * (sumT * sumT4 - sumT2 * sumT3) +
    sumT2 * (sumT * sumT3 - sumT2 * sumT2)
  );

  if (Math.abs(D) < 1e-9) return null;

  const Da = (
    n * (sumT2 * sumT2Y - sumTY * sumT3) -
    sumT * (sumT * sumT2Y - sumTY * sumT2) +
    sumY * (sumT * sumT3 - sumT2 * sumT2)
  );

  const A = Da / D;
  const accel = 2 * A;
  return { A, accel };
}

// ==========================================
// 7. Data Table Synchronization & Export
// ==========================================
function updateTable() {
  const pts = state.series[state.activeSeries];
  if (pts.length === 0) {
    pointsTableBody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: var(--subtle); padding: 2rem;">No tracking points yet. Click on the video to record points.</td></tr>`;
    return;
  }

  pointsTableBody.innerHTML = pts.map((p, idx) => `
    <tr data-time="${p.time}">
      <td>${idx + 1}</td>
      <td>${p.time.toFixed(3)}</td>
      <td>${p.x.toFixed(3)}</td>
      <td>${p.y.toFixed(3)}</td>
      <td>${p.vx.toFixed(3)}</td>
      <td>${p.vy.toFixed(3)}</td>
    </tr>
  `).join('');

  // Row click navigates video
  pointsTableBody.querySelectorAll('tr').forEach(row => {
    row.addEventListener('click', () => {
      const t = parseFloat(row.dataset.time);
      updateTimeAndFrame(t);
    });
  });
}

function exportCSV() {
  const pts = state.series[state.activeSeries];
  if (pts.length === 0) {
    alert('No data points to export. Track some points first!');
    return;
  }

  let csv = "Frame,Time (s),x (m),y (m),vx (m/s),vy (m/s)\n";
  pts.forEach(p => {
    csv += `${p.frame},${p.time.toFixed(4)},${p.x.toFixed(4)},${p.y.toFixed(4)},${p.vx.toFixed(4)},${p.vy.toFixed(4)}\n`;
  });

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `video_analysis_series_${state.activeSeries}.csv`;
  a.click();
  URL.revokeObjectURL(url);
  updateStatus('Exported kinematics data to CSV successfully.');
}

// ==========================================
// 8. Event Handlers & Initialization
// ==========================================
function updateStatus(msg) {
  statusMessage.textContent = msg;
}

function setupEventListeners() {
  // Video Drag & Drop
  viewportContainer.addEventListener('dragover', e => e.preventDefault());
  viewportContainer.addEventListener('drop', e => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('video/')) {
      loadUserVideo(file);
    }
  });

  videoFileInput.addEventListener('change', e => {
    const file = e.target.files[0];
    if (file) loadUserVideo(file);
  });

  // Presets
  document.querySelectorAll('.pill-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const preset = btn.dataset.preset;
      initSyntheticExperiment(preset);
    });
  });

  btnSampleSelect.addEventListener('click', () => {
    dropzoneOverlay.classList.remove('hidden');
  });

  // Tools Switcher
  toolTrack.addEventListener('click', () => setTool('track'));
  toolScale.addEventListener('click', () => setTool('scale'));
  toolOrigin.addEventListener('click', () => setTool('origin'));

  // Video Transport
  btnPlayPause.addEventListener('click', togglePlay);
  btnPrevFrame.addEventListener('click', () => stepFrame(-1));
  btnNextFrame.addEventListener('click', () => stepFrame(1));
  timeScrubber.addEventListener('input', e => {
    const pct = parseFloat(e.target.value) / 100;
    updateTimeAndFrame(pct * state.duration);
  });
  fpsInput.addEventListener('change', e => {
    state.fps = parseInt(e.target.value, 10) || 30;
  });

  // Keyboard Shortcuts (Space = Play/Pause, Arrow Left/Right = Frame step)
  window.addEventListener('keydown', e => {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') return;
    if (e.code === 'Space') {
      e.preventDefault();
      togglePlay();
    } else if (e.code === 'ArrowLeft') {
      e.preventDefault();
      stepFrame(-1);
    } else if (e.code === 'ArrowRight') {
      e.preventDefault();
      stepFrame(1);
    }
  });

  // Canvas Interactions
  overlayCanvas.addEventListener('mousemove', e => {
    updateLoupe(e);
    handleCanvasMouseMove(e);
  });

  overlayCanvas.addEventListener('mouseleave', () => {
    loupeCanvas.style.display = 'none';
  });

  overlayCanvas.addEventListener('mousedown', handleCanvasMouseDown);
  window.addEventListener('mouseup', handleCanvasMouseUp);

  // Tabs
  tabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      tabButtons.forEach(b => b.classList.remove('active'));
      tabContents.forEach(c => c.classList.remove('active'));
      btn.classList.add('active');
      document.getElementById(btn.dataset.tab).classList.add('active');
    });
  });

  // Calibration Actions
  btnApplyScale.addEventListener('click', calculateScaleFromStick);
  originAngleInput.addEventListener('input', e => {
    state.originAngle = (parseFloat(e.target.value) || 0) * (Math.PI / 180);
    recalculateKinematics();
    drawOverlay();
  });
  btnResetOrigin.addEventListener('click', () => {
    state.origin = { x: overlayCanvas.width / 2, y: overlayCanvas.height / 2 };
    recalculateKinematics();
    drawOverlay();
  });

  // Series Actions
  seriesSelect.addEventListener('change', e => {
    state.activeSeries = e.target.value;
    updateTable();
    updateCharts();
    drawOverlay();
  });
  btnClearSeries.addEventListener('click', () => {
    if (confirm(`Clear all points for Series ${state.activeSeries}?`)) {
      state.series[state.activeSeries] = [];
      recalculateKinematics();
      drawOverlay();
    }
  });

  // Curve Fits
  btnFitPosition.addEventListener('click', () => {
    const pts = state.series[state.activeSeries].map(p => ({ x: p.time, y: p.y }));
    const quad = quadraticRegression(pts);
    if (quad) {
      fitResultPos.style.display = 'inline';
      fitResultPos.textContent = `y-accel: ${quad.accel.toFixed(2)} m/s²`;
    } else {
      alert('Need at least 3 points to fit a quadratic curve.');
    }
  });

  btnFitVelocity.addEventListener('click', () => {
    const pts = state.series[state.activeSeries].map(p => ({ x: p.time, y: p.vy }));
    const lin = linearRegression(pts);
    if (lin) {
      fitResultVel.style.display = 'inline';
      fitResultVel.textContent = `Slope (a_y): ${lin.slope.toFixed(2)} m/s²`;
    } else {
      alert('Need at least 2 velocity points for linear fit.');
    }
  });

  chkShowVectors.addEventListener('change', e => {
    state.showVectors = e.target.checked;
    drawOverlay();
  });

  chkShowLoupe.addEventListener('change', e => {
    state.showLoupe = e.target.checked;
    if (!state.showLoupe) loupeCanvas.style.display = 'none';
  });

  btnExportCSV.addEventListener('click', exportCSV);
}

function setTool(tool) {
  state.activeTool = tool;
  [toolTrack, toolScale, toolOrigin].forEach(b => b.classList.remove('active'));
  if (tool === 'track') toolTrack.classList.add('active');
  if (tool === 'scale') toolScale.classList.add('active');
  if (tool === 'origin') toolOrigin.classList.add('active');
  updateStatus(`Active Tool: ${tool.toUpperCase()}. ${tool === 'track' ? 'Click on video to place point.' : tool === 'scale' ? 'Drag scale stick handles.' : 'Drag origin axes to position.'}`);
}

function loadUserVideo(file) {
  const url = URL.createObjectURL(file);
  state.isSynthetic = false;
  video.srcObject = null;
  video.src = url;
  video.load();
  video.onloadedmetadata = () => {
    state.duration = video.duration;
    state.currentTime = 0;
    dropzoneOverlay.classList.add('hidden');
    resizeCanvas();
    updateTimeAndFrame(0);
    updateStatus(`Loaded "${file.name}" (${video.videoWidth}x${video.videoHeight}, ${video.duration.toFixed(2)}s). Ready to track!`);
  };
}

// Canvas Mouse Interactions
let isDraggingOrigin = false;
let isDraggingScale = false;
let scaleDragPoint = null;

function handleCanvasMouseDown(e) {
  const rect = overlayCanvas.getBoundingClientRect();
  const mx = e.clientX - rect.left;
  const my = e.clientY - rect.top;

  if (state.activeTool === 'track') {
    addTrackPoint(mx, my);
  } else if (state.activeTool === 'origin') {
    isDraggingOrigin = true;
    state.origin = { x: mx, y: my };
    recalculateKinematics();
    drawOverlay();
  } else if (state.activeTool === 'scale') {
    const dStart = Math.hypot(mx - state.scaleStick.start.x, my - state.scaleStick.start.y);
    const dEnd = Math.hypot(mx - state.scaleStick.end.x, my - state.scaleStick.end.y);

    if (dStart < 15) {
      isDraggingScale = true;
      scaleDragPoint = 'start';
    } else if (dEnd < 15) {
      isDraggingScale = true;
      scaleDragPoint = 'end';
    } else {
      // Start new line from current point
      isDraggingScale = true;
      scaleDragPoint = 'end';
      state.scaleStick.start = { x: mx, y: my };
      state.scaleStick.end = { x: mx, y: my };
    }
  }
}

function handleCanvasMouseMove(e) {
  const rect = overlayCanvas.getBoundingClientRect();
  const mx = e.clientX - rect.left;
  const my = e.clientY - rect.top;

  if (isDraggingOrigin) {
    state.origin = { x: mx, y: my };
    recalculateKinematics();
    drawOverlay();
  } else if (isDraggingScale) {
    if (scaleDragPoint === 'start') {
      state.scaleStick.start = { x: mx, y: my };
    } else if (scaleDragPoint === 'end') {
      state.scaleStick.end = { x: mx, y: my };
    }
    calculateScaleFromStick();
    drawOverlay();
  }
}

function handleCanvasMouseUp() {
  isDraggingOrigin = false;
  isDraggingScale = false;
  scaleDragPoint = null;
}

// Initialize Application
window.addEventListener('DOMContentLoaded', () => {
  setupEventListeners();
  initCharts();
  initSyntheticExperiment('projectile');
});
