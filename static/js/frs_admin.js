/* SNEHA MITRA - FRS face enrollment card (injected into the admin page). */
(function () {
  'use strict';

  const CARD_ID = 'frsCard';
  const MIN_FACE_LUM = 35;
  const MAX_FACE_LUM = 240;
  const BACKLIGHT_FACE_MAX = 45;
  const BACKLIGHT_DIFF_MIN = 95;
  const MAX_IMAGE_DIM = 640;
  const JPEG_QUALITY = 0.9;
  const LIGHT_POLL_MS = 220;

  let list = [];
  let pending = null;
  let stream = null;
  let liveLightTimer = null;
  let liveLightOk = false;

  const byId = (id) => document.getElementById(id);

  async function apiRequest(method, url, body) {
    const opt = {
      method,
      credentials: 'same-origin',
      headers: { 'X-CSRF-Token': window.SM.csrf }
    };
    if (body !== undefined) {
      opt.headers['Content-Type'] = 'application/json';
      opt.body = JSON.stringify(body);
    }
    const res = await fetch(url, opt);
    const json = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(json.error || `HTTP ${res.status}`);
    return json;
  }

  function setMsg(text, isError) {
    const el = byId('frsMsg');
    if (!el) return;
    el.textContent = text;
    el.classList.toggle('frs-msg--error', Boolean(isError));
    el.classList.toggle('frs-msg--ok', !isError);
  }

  function analyzeFaceLighting(canvas) {
    const w = canvas.width;
    const h = canvas.height;
    const d = canvas.getContext('2d').getImageData(0, 0, w, h).data;
    const x1 = Math.floor(w * 0.31);
    const x2 = Math.ceil(w * 0.69);
    const y1 = Math.floor(h * 0.24);
    const y2 = Math.ceil(h * 0.68);
    let faceSum = 0;
    let faceCount = 0;
    let bgSum = 0;
    let bgCount = 0;
    const step = Math.max(1, Math.floor(Math.min(w, h) / 80));

    for (let y = 0; y < h; y += step) {
      for (let x = 0; x < w; x += step) {
        const idx = (y * w + x) * 4;
        const lum = d[idx] * 0.299 + d[idx + 1] * 0.587 + d[idx + 2] * 0.114;
        if (x >= x1 && x < x2 && y >= y1 && y < y2) {
          faceSum += lum;
          faceCount++;
        } else {
          bgSum += lum;
          bgCount++;
        }
      }
    }

    const faceLum = faceCount ? (faceSum / faceCount) : 0;
    const bgLum = bgCount ? (bgSum / bgCount) : faceLum;
    const backlit = (faceLum < BACKLIGHT_FACE_MAX && (bgLum - faceLum) > BACKLIGHT_DIFF_MIN);
    return { faceLum, bgLum, backlit };
  }

  function evaluatePreviewLighting(canvas, sourceLabel) {
    const m = analyzeFaceLighting(canvas);
    const saveBtn = byId('frsSave');
    let errMsg = '';

    if (m.faceLum < MIN_FACE_LUM) {
      errMsg = `❌ ${sourceLabel} rejected: Face lighting is too dark (${Math.round(m.faceLum)}/255, minimum ${MIN_FACE_LUM} required). Stand directly facing bright light.`;
    } else if (m.backlit) {
      errMsg = `❌ ${sourceLabel} rejected: Strong backlight puts face in shadow. Turn around to face the bright light.`;
    } else if (m.faceLum > MAX_FACE_LUM) {
      errMsg = `❌ ${sourceLabel} rejected: Harsh glare or overexposure (${Math.round(m.faceLum)}/255). Adjust lighting.`;
    }

    if (errMsg) {
      if (saveBtn) saveBtn.disabled = true;
      setMsg(errMsg, true);
      return false;
    }
    if (saveBtn) saveBtn.disabled = false;
    setMsg(`✓ ${sourceLabel} passed bright-face check (${Math.round(m.faceLum)}/255). Press "Save & Enroll Face".`, false);
    return true;
  }

  function resizeToDataUrl(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = reject;
      reader.onload = () => {
        const img = new Image();
        img.onerror = reject;
        img.onload = () => {
          const scale = Math.min(1, MAX_IMAGE_DIM / Math.max(img.width, img.height));
          const canvas = document.createElement('canvas');
          canvas.width = Math.round(img.width * scale);
          canvas.height = Math.round(img.height * scale);
          canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
          const ok = evaluatePreviewLighting(canvas, 'Photo');
          resolve({ dataUrl: canvas.toDataURL('image/jpeg', JPEG_QUALITY), lightOk: ok });
        };
        img.src = reader.result;
      };
      reader.readAsDataURL(file);
    });
  }

  function renderOptions() {
    const sel = byId('frsUser');
    if (!sel) return;
    const current = sel.value;
    sel.textContent = '';
    list.forEach((u) => {
      const opt = document.createElement('option');
      const tag = u.enrolled ? '\u2714 face saved' : '\u2716 no face photo';
      opt.value = u.id;
      opt.textContent = `${u.name} (${u.id}) - ${tag}`;
      sel.appendChild(opt);
    });
    if (current) sel.value = current;
  }

  async function checkStatus() {
    try {
      const d = await apiRequest('GET', '/api/frs/status');
      if (!d.ready) setMsg(`Cannot save face yet: ${d.problems.join(' ')}`, true);
    } catch (_) {
      setMsg('Cannot reach the server to check face recognition.', true);
    }
  }

  async function loadList() {
    try {
      const d = await apiRequest('GET', '/api/frs/caregivers');
      list = d.caregivers || [];
      renderOptions();
    } catch (err) {
      setMsg(err.message, true);
    }
  }

  function showPreview(dataUrl) {
    const img = byId('frsPreview');
    if (!img || !dataUrl) return;
    img.src = dataUrl;
    img.classList.add('frs-visible');
  }

  async function onPick(ev) {
    const file = ev.target.files[0];
    pending = null;
    stopCamera();
    if (!file) return;
    try {
      const res = await resizeToDataUrl(file);
      showPreview(res.dataUrl);
      pending = res.lightOk ? res.dataUrl : null;
    } catch (_) {
      setMsg('Could not read that image.', true);
    }
  }

  function updateLiveLightBadge(badge, m) {
    let warnMsg = '';
    if (m.faceLum < MIN_FACE_LUM) {
      warnMsg = `🌙 Face too dark (${Math.round(m.faceLum)}/255) — stand facing bright light`;
    } else if (m.backlit) {
      warnMsg = '☀️ Strong backlight — turn around to face the light';
    } else if (m.faceLum > MAX_FACE_LUM) {
      warnMsg = '☀️ Harsh glare on face — adjust lighting';
    }

    if (warnMsg) {
      liveLightOk = false;
      badge.textContent = warnMsg;
      badge.classList.add('frs-live-light--warn');
      badge.classList.remove('frs-live-light--ok');
      return;
    }

    liveLightOk = true;
    badge.textContent = `💡 Bright face lighting OK (${Math.round(m.faceLum)}/255) — look straight & capture`;
    badge.classList.remove('frs-live-light--warn');
    badge.classList.add('frs-live-light--ok');
  }

  function startLiveLightMonitor() {
    stopLiveLightMonitor();
    const probe = document.createElement('canvas');
    probe.width = 160;
    probe.height = 120;
    liveLightTimer = setInterval(() => {
      const video = byId('frsVideo');
      const badge = byId('frsLiveLight');
      const capBtn = byId('frsCapture');
      if (!stream || !video || !video.videoWidth || !badge) return;
      probe.getContext('2d').drawImage(video, 0, 0, 160, 120);
      updateLiveLightBadge(badge, analyzeFaceLighting(probe));
      if (capBtn) capBtn.disabled = !liveLightOk;
    }, LIGHT_POLL_MS);
  }

  function stopLiveLightMonitor() {
    if (liveLightTimer) {
      clearInterval(liveLightTimer);
      liveLightTimer = null;
    }
    liveLightOk = false;
  }

  function showCameraUi(on) {
    const box = byId('frsCamBox');
    const openBtn = byId('frsOpenCam');
    if (!box) return;
    box.classList.toggle('frs-visible', Boolean(on));
    if (openBtn) openBtn.classList.toggle('frs-hidden', Boolean(on));
    if (on && stream) byId('frsVideo').srcObject = stream;
  }

  function stopCamera() {
    stopLiveLightMonitor();
    if (stream) stream.getTracks().forEach((t) => t.stop());
    stream = null;
    showCameraUi(false);
  }

  async function openCamera() {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setMsg('Camera needs HTTPS (or localhost). Use the file option instead.', true);
      return;
    }
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: MAX_IMAGE_DIM }, height: { ideal: 480 } },
        audio: false
      });
      showCameraUi(true);
      startLiveLightMonitor();
      setMsg('Stand facing bright light and look straight at the camera, then press Take Snapshot.', false);
    } catch (_) {
      setMsg('Camera blocked or not available. Allow camera access.', true);
    }
  }

  function capturePhoto() {
    const video = byId('frsVideo');
    if (!stream || !video || !video.videoWidth) {
      setMsg('Camera is still starting. Try again.', true);
      return;
    }
    const scale = Math.min(1, MAX_IMAGE_DIM / Math.max(video.videoWidth, video.videoHeight));
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(video.videoWidth * scale);
    canvas.height = Math.round(video.videoHeight * scale);
    canvas.getContext('2d').drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', JPEG_QUALITY);
    showPreview(dataUrl);
    const ok = evaluatePreviewLighting(canvas, 'Snapshot');
    pending = ok ? dataUrl : null;
    stopCamera();
  }

  async function onSave() {
    const userId = byId('frsUser').value;
    if (!userId) return setMsg('Choose a caregiver first.', true);
    if (!pending) return setMsg('Take or choose a bright, clear face photo first.', true);

    setMsg('Validating face brightness, single person, and clarity on server...', false);
    try {
      const res = await apiRequest('POST', `/api/frs/enroll/${encodeURIComponent(userId)}`, { photo: pending });
      setMsg('✓ Face registered successfully! Caregiver is now authorized for face login & logout.', false);
      if (window.cache && window.cache.users && window.cache.users[userId]) {
        window.cache.users[userId].photo = (res && res.photo) || pending;
        window.cache.users[userId].photoPath = (res && res.photoPath) || '';
      }
      pending = null;
      byId('frsFile').value = '';
      await loadList();
    } catch (err) {
      setMsg(`Photo NOT saved — ${err.message}`, true);
    }
  }

  function buildCard() {
    const card = document.createElement('div');
    card.id = CARD_ID;
    card.className = 'card mt-14';
    card.innerHTML =
      '<h2>Face Recognition Enrollment (FRS)</h2>' +
      '<div class="frs-rules-box">' +
      '<div class="frs-rules-title">📋 Strict Registration Rules (Photo Rejected Otherwise):</div>' +
      '<div class="frs-rules-grid">' +
      '<div class="frs-rule-item">💡 <b>Bright Light on Face</b><br><span class="frs-rule-desc">Stand facing bright light (no dark/backlight shadows)</span></div>' +
      '<div class="frs-rule-item">👤 <b>Only 1 Person</b><br><span class="frs-rule-desc">Solo caregiver looking straight ahead</span></div>' +
      '<div class="frs-rule-item">🖼️ <b>Clear &amp; Sharp</b><br><span class="frs-rule-desc">Eyes clearly visible against plain wall</span></div>' +
      '</div></div>' +
      '<label for="frsUser" class="text-bold-600">Select Caregiver</label><select id="frsUser" class="frs-select"></select>' +
      '<label for="frsFile" class="mt-12 text-bold-600">Upload Face Photo</label>' +
      '<input id="frsFile" type="file" accept="image/*" capture="user" class="mt-4">' +
      '<div class="mt-10"><button class="btn sec" type="button" id="frsOpenCam">📷 Use Live Camera</button></div>' +
      '<div id="frsCamBox" class="frs-cam-box">' +
      '<div id="frsLiveLight" class="frs-live-light">Checking face brightness…</div>' +
      '<video id="frsVideo" autoplay playsinline muted class="frs-video"></video>' +
      '<div class="row mt-8"><button class="btn" type="button" id="frsCapture" disabled>📸 Take Snapshot</button>' +
      '<button class="btn sec" type="button" id="frsCamCancel">Cancel</button></div></div>' +
      '<img id="frsPreview" alt="Enrolled caregiver face preview" class="frs-preview-img">' +
      '<div class="row mt-10"><button class="btn" type="button" id="frsSave">Save &amp; Enroll Face</button></div>' +
      '<p id="frsMsg" class="hint mt-8 text-bold-600" role="status"></p>';
    return card;
  }

  function mountCard() {
    const form = byId('userForm');
    if (!form || byId(CARD_ID)) return;
    const host = form.closest('.card') || form.parentNode;
    host.parentNode.insertBefore(buildCard(), host.nextSibling);
    byId('frsFile').addEventListener('change', onPick);
    byId('frsSave').addEventListener('click', onSave);
    byId('frsOpenCam').addEventListener('click', openCamera);
    byId('frsCapture').addEventListener('click', capturePhoto);
    byId('frsCamCancel').addEventListener('click', stopCamera);
    if (stream) showCameraUi(true);
    if (pending) showPreview(pending);
    renderOptions();
    loadList();
    checkStatus();
  }

  function start() {
    const app = byId('app') || document.body;
    new MutationObserver(mountCard).observe(app, { childList: true, subtree: true });
    mountCard();
  }

  window.refreshFrsList = loadList;

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();
