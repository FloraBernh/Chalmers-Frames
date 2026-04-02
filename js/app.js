/* ===================================================
   Photo Frames – app.js
   =================================================== */

// -- Frame names (each has a 1:1 and 4:5 variant) --
const FRAME_NAMES = [
  { id: 'energy',                 name: 'Energy' },
  { id: 'nano-science',           name: 'Nano Science' },
  { id: 'materials-science',      name: 'Materials Science' },
  { id: 'production',             name: 'Production' },
  { id: 'transportation',         name: 'Transportation' },
  { id: 'new-space',              name: 'New Space' },
  { id: 'mechanical-engineering', name: 'Mechanical Engineering' },
  { id: 'batteries',              name: 'Batteries' },
  { id: 'basic-sciences',         name: 'Basic Sciences' },
  { id: 'vision',                 name: 'My Vision' },
];

// -- Maps frame id + aspect to file path --
const FRAME_FILES = {
  'energy':                 { '1:1': 'frames/energy 1x1.png',                '4:5': 'frames/enegry 4x5.png' },
  'nano-science':           { '1:1': 'frames/nano science 1x1.png',          '4:5': 'frames/nano science 4x5.png' },
  'materials-science':      { '1:1': 'frames/materials science 1x1.png',     '4:5': 'frames/material science 4x5.png' },
  'production':             { '1:1': 'frames/production 1x1.png',            '4:5': 'frames/production 4x5.png' },
  'transportation':         { '1:1': 'frames/transportation 1x1.png',        '4:5': 'frames/transportation 4x5.png' },
  'new-space':              { '1:1': 'frames/new space 1x1.png',             '4:5': 'frames/new space 4x5.png' },
  'mechanical-engineering': { '1:1': 'frames/mechanical engineering 1x1.png', '4:5': 'frames/mechanical engineering 4x5.png' },
  'batteries':              { '1:1': 'frames/batteries 1x1.png',             '4:5': 'frames/batteries 4x5.png' },
  'basic-sciences':         { '1:1': 'frames/basic sciences 1x1.png',        '4:5': 'frames/basic sciences 4x5.png' },
  'vision':                 { '1:1': 'frames/vision 1x1.png',                '4:5': 'frames/vision 4x5.png' },
};

// -- Canvas output sizes --
const SIZES = {
  '1:1': { w: 1000, h: 1000 },
  '4:5': { w: 1000, h: 1250 },
};

// -- State --
let chosenAspect = null;
let chosenFrameId = null;
let userImg = null;
let frameImgs = {};  // { '1:1': Image, '4:5': Image }
let offsetX = 0;
let offsetY = 0;
let scale = 1;
let dragging = false;
let dragStartX = 0;
let dragStartY = 0;
let startOffsetX = 0;
let startOffsetY = 0;

// -- DOM refs --
const stepUpload = document.getElementById('step-upload');
const stepFrame = document.getElementById('step-frame');
const stepFormat = document.getElementById('step-format');
const stepPreview = document.getElementById('step-preview');
const frameList = document.getElementById('frame-list');
const dropzone = document.getElementById('dropzone');
const fileInput = document.getElementById('file-input');
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const preview1x1 = document.getElementById('preview-1x1');
const preview4x5 = document.getElementById('preview-4x5');
const exportBtn = document.getElementById('export-btn');
const changeImageBtn = document.getElementById('change-image-btn');
const startOverBtn = document.getElementById('start-over-btn');

// ===================================================
// Init
// ===================================================
function init() {
  buildFrameList();
  setupUpload();
  setupFormatCards();
  setupCanvasInteraction();
  setupExport();
  setupNavButtons();
}

// ===================================================
// Step 1: Upload
// ===================================================
function setupUpload() {
  dropzone.addEventListener('click', () => fileInput.click());

  fileInput.addEventListener('change', e => {
    if (e.target.files[0]) handleFile(e.target.files[0]);
  });

  dropzone.addEventListener('dragover', e => {
    e.preventDefault();
    dropzone.classList.add('dragover');
  });

  dropzone.addEventListener('dragleave', () => {
    dropzone.classList.remove('dragover');
  });

  dropzone.addEventListener('drop', e => {
    e.preventDefault();
    dropzone.classList.remove('dragover');
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) handleFile(file);
  });
}

function handleFile(file) {
  const reader = new FileReader();
  reader.onload = e => {
    const img = new Image();
    img.onload = () => {
      userImg = img;
      resetTransform();
      showStep('step-frame');
    };
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
}

// ===================================================
// Step 2: Frame selection
// ===================================================
function buildFrameList() {
  frameList.innerHTML = '';

  FRAME_NAMES.forEach(frame => {
    const btn = document.createElement('button');
    btn.className = 'frame-list-item';

    const nameEl = document.createElement('span');
    nameEl.className = 'frame-list-name';
    nameEl.textContent = frame.name;

    btn.appendChild(nameEl);

    btn.addEventListener('click', () => {
      chosenFrameId = frame.id;
      frameList.querySelectorAll('.frame-list-item').forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
      loadFrameImages(() => {
        renderFormatPreviews();
        showStep('step-format');
      });
    });

    frameList.appendChild(btn);
  });
}

function loadFrameImages(callback) {
  const files = FRAME_FILES[chosenFrameId];
  frameImgs = {};
  let loaded = 0;
  const aspects = Object.keys(files);
  const total = aspects.length;

  aspects.forEach(aspect => {
    const img = new Image();
    img.onload = () => {
      frameImgs[aspect] = img;
      loaded++;
      if (loaded === total && callback) callback();
    };
    img.onerror = () => {
      loaded++;
      if (loaded === total && callback) callback();
    };
    img.src = files[aspect];
  });
}

// ===================================================
// Step 3: Format selection with live previews
// ===================================================
function setupFormatCards() {
  document.querySelectorAll('.format-card').forEach(card => {
    card.addEventListener('click', () => {
      chosenAspect = card.dataset.aspect;
      document.querySelectorAll('.format-card').forEach(c => c.classList.remove('selected'));
      card.classList.add('selected');
      resetTransform();
      drawComposite();
      showStep('step-preview');
    });
  });
}

function renderFormatPreviews() {
  renderPreviewCanvas(preview1x1, '1:1');
  renderPreviewCanvas(preview4x5, '4:5');
}

function renderPreviewCanvas(cvs, aspect) {
  if (!userImg || !frameImgs[aspect]) return;

  const size = SIZES[aspect];
  cvs.width = size.w;
  cvs.height = size.h;
  const c = cvs.getContext('2d');

  c.clearRect(0, 0, size.w, size.h);

  // Draw user image with cover-fit (centered, no offset)
  const imgAspect = userImg.width / userImg.height;
  const canvasAspect = size.w / size.h;

  let drawW, drawH;
  if (imgAspect > canvasAspect) {
    drawH = size.h;
    drawW = drawH * imgAspect;
  } else {
    drawW = size.w;
    drawH = drawW / imgAspect;
  }

  const drawX = (size.w - drawW) / 2;
  const drawY = (size.h - drawH) / 2;
  c.drawImage(userImg, drawX, drawY, drawW, drawH);

  // Draw frame overlay
  c.drawImage(frameImgs[aspect], 0, 0, size.w, size.h);
}

// ===================================================
// Step 4: Adjust + export
// ===================================================
function drawComposite() {
  if (!userImg || !chosenAspect || !frameImgs[chosenAspect]) return;

  const size = SIZES[chosenAspect];
  canvas.width = size.w;
  canvas.height = size.h;

  ctx.clearRect(0, 0, size.w, size.h);

  // Draw user image with cover-fit + offset + scale
  const imgAspect = userImg.width / userImg.height;
  const canvasAspect = size.w / size.h;

  let drawW, drawH;
  if (imgAspect > canvasAspect) {
    drawH = size.h * scale;
    drawW = drawH * imgAspect;
  } else {
    drawW = size.w * scale;
    drawH = drawW / imgAspect;
  }

  const drawX = (size.w - drawW) / 2 + offsetX;
  const drawY = (size.h - drawH) / 2 + offsetY;

  ctx.drawImage(userImg, drawX, drawY, drawW, drawH);
  ctx.drawImage(frameImgs[chosenAspect], 0, 0, size.w, size.h);
}

// ===================================================
// Canvas interaction (drag + zoom)
// ===================================================
function setupCanvasInteraction() {
  canvas.addEventListener('mousedown', e => {
    dragging = true;
    dragStartX = e.clientX;
    dragStartY = e.clientY;
    startOffsetX = offsetX;
    startOffsetY = offsetY;
  });

  window.addEventListener('mousemove', e => {
    if (!dragging) return;
    const rect = canvas.getBoundingClientRect();
    const scaleRatio = canvas.width / rect.width;
    offsetX = startOffsetX + (e.clientX - dragStartX) * scaleRatio;
    offsetY = startOffsetY + (e.clientY - dragStartY) * scaleRatio;
    drawComposite();
  });

  window.addEventListener('mouseup', () => { dragging = false; });

  let lastTouchDist = 0;

  canvas.addEventListener('touchstart', e => {
    if (e.touches.length === 1) {
      dragging = true;
      dragStartX = e.touches[0].clientX;
      dragStartY = e.touches[0].clientY;
      startOffsetX = offsetX;
      startOffsetY = offsetY;
    } else if (e.touches.length === 2) {
      lastTouchDist = getTouchDist(e.touches);
    }
  });

  canvas.addEventListener('touchmove', e => {
    e.preventDefault();
    if (e.touches.length === 1 && dragging) {
      const rect = canvas.getBoundingClientRect();
      const scaleRatio = canvas.width / rect.width;
      offsetX = startOffsetX + (e.touches[0].clientX - dragStartX) * scaleRatio;
      offsetY = startOffsetY + (e.touches[0].clientY - dragStartY) * scaleRatio;
      drawComposite();
    } else if (e.touches.length === 2) {
      const dist = getTouchDist(e.touches);
      if (lastTouchDist > 0) {
        const delta = dist / lastTouchDist;
        scale = Math.max(0.5, Math.min(5, scale * delta));
        drawComposite();
      }
      lastTouchDist = dist;
    }
  }, { passive: false });

  canvas.addEventListener('touchend', () => {
    dragging = false;
    lastTouchDist = 0;
  });

  canvas.addEventListener('wheel', e => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.95 : 1.05;
    scale = Math.max(0.5, Math.min(5, scale * delta));
    drawComposite();
  }, { passive: false });
}

function getTouchDist(touches) {
  const dx = touches[0].clientX - touches[1].clientX;
  const dy = touches[0].clientY - touches[1].clientY;
  return Math.sqrt(dx * dx + dy * dy);
}

// ===================================================
// Navigation buttons
// ===================================================
function startOver() {
  chosenAspect = null;
  chosenFrameId = null;
  userImg = null;
  frameImgs = {};
  fileInput.value = '';
  resetTransform();
  document.querySelectorAll('.format-card').forEach(c => c.classList.remove('selected'));
  frameList.querySelectorAll('.frame-list-item').forEach(b => b.classList.remove('selected'));
  showStep('step-upload');
}

function setupNavButtons() {
  // Logo resets to start
  document.getElementById('logo-link').addEventListener('click', e => {
    e.preventDefault();
    startOver();
  });

  // Back buttons
  document.getElementById('back-to-upload').addEventListener('click', () => showStep('step-upload'));
  document.getElementById('back-to-frame').addEventListener('click', () => showStep('step-frame'));
  document.getElementById('back-to-format').addEventListener('click', () => showStep('step-format'));

  // Step 4 buttons
  changeImageBtn.addEventListener('click', () => {
    userImg = null;
    fileInput.value = '';
    showStep('step-upload');
  });

  startOverBtn.addEventListener('click', () => startOver());
}

// ===================================================
// Step management
// ===================================================
function showStep(stepId) {
  [stepUpload, stepFrame, stepFormat, stepPreview].forEach(s => s.classList.add('hidden'));
  document.getElementById(stepId).classList.remove('hidden');
}

function resetTransform() {
  offsetX = 0;
  offsetY = 0;
  scale = 1;
}

// ===================================================
// Export
// ===================================================
function setupExport() {
  exportBtn.addEventListener('click', () => {
    if (!userImg || !frameImgs[chosenAspect]) return;

    canvas.toBlob(blob => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'photo-frame.png';
      a.style.display = 'none';
      document.body.appendChild(a);
      a.click();
      setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }, 1000);
    }, 'image/png');
  });
}

// ===================================================
// Start
// ===================================================
document.addEventListener('DOMContentLoaded', init);
