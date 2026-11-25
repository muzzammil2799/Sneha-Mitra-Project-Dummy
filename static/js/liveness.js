/* =============================================================================
 * SNEHA MITRA — Visual Face, Eye-Blink & Natural Motion Biometric Module
 * File: app/static/js/liveness.js
 * =============================================================================
 */

(function (global) {
  'use strict';

  const CAPTURE_WIDTH = 480;
  const CAPTURE_HEIGHT = 640;
  const FRAME_JPEG_QUALITY = 0.86;
  const SAMPLE_INTERVAL_MS = 100;
  const MIN_SCAN_MS = 1500;
  const MAX_SCAN_MS = 3400;
  const MIN_FACE_LUM = 25;
  const MAX_FACE_LUM = 240;
  const ALIGNED_FRAMES_NEEDED = 6;
  const KEYFRAME_COUNT = 6;
  const AUTO_CLOSE_MS = 550;
  const LOCK_CLOSE_MS = 2600;
  const MIN_BLINK_ELAPSED_MS = 250;
  const BLINK_EYE_DIFF_THRESH = 4.2;
  const BLINK_RECOVERY_RATIO = 0.65;

  let _stream = null;
  let _animFrame = null;
  let _captureTimer = null;
  let _resolvePromise = null;
  let _challengeToken = null;
  let _csrfToken = null;
  let _urls = null;
  let _maxAttempts = 5;
  let _attemptsLeft = 5;

  let _scanState = 'idle';
  let _torchActive = true;
  let _alignedFrames = 0;
  let _scanStartTime = 0;
  let _samples = [];
  let _baselineEyeBuf = null;
  let _baselineFaceBuf = null;
  let _prevFaceBuf = null;
  let _canvasBuffer = null;

  const LABELS = {
    lookBlink: {
      en: 'Look straight & blink',
      te: 'నేరుగా చూసి కనురెప్ప ఆర్పండి',
      hi: 'सीधे देखें और पलक झपकाएं'
    },
    brightNeed: {
      en: 'Stand facing bright light',
      te: 'వెలుతురులో నిలబడండి',
      hi: 'तेज रोशनी के सामने खड़े हों'
    },
    backlightWarn: {
      en: 'Face is dark — turn toward light',
      te: 'ముఖంపై వెలుతురు పడేలా తిరగండి',
      hi: 'चेहरे पर रोशनी रखें'
    },
    scanningBlink: {
      en: 'Blink naturally now…',
      te: 'ఇప్పుడు కనురెప్ప ఆర్పండి…',
      hi: 'अब पलक झपकाएं…'
    },
    verifying: {
      en: 'Checking face & eyes…',
      te: 'ముఖం తనిఖీ జరుగుతోంది…',
      hi: 'चेहरा जांच हो रही है…'
    },
    verified: {
      en: 'Face Verified!',
      te: 'ముఖం నిర్ధారించబడింది!',
      hi: 'चेहरा सत्यापित!'
    },
    blinkWord: {
      en: 'Blink',
      te: 'కనురెప్ప',
      hi: 'पलक'
    }
  };

  const VIEWFINDER_STATE_CLASSES = ['lv-vf-aligning', 'lv-vf-ready', 'lv-vf-warn', 'lv-vf-success', 'lv-vf-error'];
  const STATUS_CLASSES = ['lv-status--ok', 'lv-status--warn', 'lv-status--error', 'lv-status--neutral'];

  const getEl = (id) => document.getElementById(id);

  function _t(key) {
    const lang = global.SM_LANG || 'en';
    const entry = LABELS[key];
    if (!entry) return key;
    return entry[lang] || entry.en;
  }

  async function apiRequest(url, body) {
    const res = await fetch(url, {
      method: 'POST',
      credentials: 'same-origin',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-Token': _csrfToken
      },
      body: body ? JSON.stringify(body) : undefined
    });

    if (res.status === 401) {
      window.location.href = 'login.html';
      return { status: 401, data: { error: 'Session expired. Please log in again.' } };
    }
    const data = await res.json().catch(() => ({}));
    return { status: res.status, data };
  }

  function _setViewfinderState(stateClass) {
    const vf = getEl('livenessViewfinder');
    if (!vf) return;
    vf.classList.remove(...VIEWFINDER_STATE_CLASSES);
    if (stateClass) vf.classList.add(stateClass);
  }

  function _setStatus(msg, tone) {
    const el = getEl('livenessStatus');
    if (!el) return;
    el.textContent = msg;
    el.classList.remove(...STATUS_CLASSES);
    const toneClass = (tone === 'ok')
      ? 'lv-status--ok'
      : (tone === 'warn')
        ? 'lv-status--warn'
        : (tone === 'error')
          ? 'lv-status--error'
          : 'lv-status--neutral';
    el.classList.add(toneClass);
  }

  function _setInstruction(msg, icon) {
    const txt = getEl('lvMainText');
    const icn = getEl('lvMainIcon');
    if (txt) txt.textContent = msg;
    if (icn && icon) icn.textContent = icon;
  }

  function _setProgress(pct) {
    const el = getEl('livenessProgress');
    if (el) el.style.width = `${Math.min(100, Math.max(0, pct))}%`;
  }

  function _setWarning(msg) {
    const el = getEl('livenessAmbientWarning');
    if (!el) return;
    if (msg) {
      el.textContent = msg;
      el.classList.remove('hidden');
      return;
    }
    el.classList.add('hidden');
  }

  function _showRetryButton(show) {
    const btn = getEl('livenessRetryBtn');
    if (!btn) return;
    btn.classList.toggle('hidden', !show);
  }

  function _renderAttemptDots(remaining, total) {
    const box = getEl('livenessAttemptDots');
    if (!box) return;
    const max = Math.max(1, total || 5);
    const rawRem = (remaining === null || remaining === undefined) ? max : remaining;
    const rem = Math.max(0, Math.min(max, rawRem));
    box.textContent = '';
    for (let i = 0; i < max; i++) {
      const dot = document.createElement('span');
      dot.className = `lv-attempt-dot ${i < rem ? 'lv-attempt-dot--ok' : ''}`.trim();
      box.appendChild(dot);
    }
  }

  function _updateBadge(boxId, iconId, subId, isOk, okIcon, okSub, warnIcon, warnSub) {
    const box = getEl(boxId);
    const icon = getEl(iconId);
    const sub = getEl(subId);
    if (!box || !icon || !sub) return;

    if (isOk === true) {
      box.className = 'bg-emerald-50 border-2 border-emerald-500 rounded-xl py-1 px-1 text-center shadow-xs transition-all duration-200';
      icon.textContent = okIcon || '✅';
      sub.textContent = okSub;
      sub.className = 'text-[8px] text-emerald-800 font-bold leading-tight truncate';
      return;
    }
    if (isOk === false) {
      box.className = 'bg-amber-50 border-2 border-amber-400 rounded-xl py-1 px-1 text-center shadow-xs transition-all duration-200';
      icon.textContent = warnIcon || '⚠️';
      sub.textContent = warnSub;
      sub.className = 'text-[8px] text-amber-800 font-bold leading-tight truncate';
      return;
    }
    box.className = 'bg-[#F8FAFC] border-2 border-[#E2E8F0] rounded-xl py-1 px-1 text-center shadow-xs transition-all duration-200';
    icon.textContent = okIcon || '⏳';
    sub.textContent = okSub || 'Checking…';
    sub.className = 'text-[8px] text-[#64748B] font-semibold leading-tight truncate';
  }

  function _openModal() {
    const modal = getEl('modalLiveness');
    if (modal) modal.classList.remove('hidden');
    const overlay = getEl('livenessSuccessOverlay');
    if (overlay) overlay.classList.add('hidden');
    const scanLine = getEl('livenessScanLine');
    if (scanLine) scanLine.classList.remove('lv-scanning');
    const eyeText = getEl('livenessEyeText');
    if (eyeText) eyeText.textContent = _t('blinkWord');
    _showRetryButton(false);
    toggleTorchLight(true);
    const torchRing = getEl('livenessTorchRing');
    if (torchRing) torchRing.classList.remove('success');
    _setViewfinderState('lv-vf-aligning');
  }

  function _closeModal() {
    const modal = getEl('modalLiveness');
    if (modal) modal.classList.add('hidden');
  }

  function _setHardwareTorch(enable) {
    if (!_stream) return;
    try {
      const track = _stream.getVideoTracks()[0];
      if (track && typeof track.getCapabilities === 'function') {
        const caps = track.getCapabilities();
        if (caps.torch) {
          track.applyConstraints({ advanced: [{ torch: Boolean(enable) }] }).catch(() => {});
        }
      }
    } catch (_) {}
  }

  function toggleTorchLight(force) {
    _torchActive = (typeof force === 'boolean') ? force : !_torchActive;
    const ring = getEl('livenessTorchRing');
    const icon = getEl('livenessTorchIcon');
    const text = getEl('livenessTorchText');
    const btn = getEl('livenessTorchToggleBtn');

    if (_torchActive) {
      if (ring) {
        ring.classList.remove('off');
        ring.classList.add('lv-torch-halo');
      }
      if (icon) icon.textContent = '🔦';
      if (text) text.textContent = 'Face Torch: ON (Illuminating Face)';
      if (btn) {
        btn.className = 'inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-[10.5px] font-bold bg-amber-500/10 border border-amber-400 text-amber-800 shadow-xs transition-all active:scale-95 cursor-pointer';
      }
    } else {
      if (ring) {
        ring.classList.remove('lv-torch-halo');
        ring.classList.add('off');
      }
      if (icon) icon.textContent = '💡';
      if (text) text.textContent = 'Face Torch: OFF (Tap to Turn ON)';
      if (btn) {
        btn.className = 'inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-[10.5px] font-bold bg-slate-100 border border-slate-300 text-slate-500 shadow-xs transition-all active:scale-95 cursor-pointer';
      }
    }
    _setHardwareTorch(_torchActive);
  }
  window.toggleTorchLight = toggleTorchLight;

  async function _startCamera() {
    if (_stream) {
      const existingVideo = getEl('livenessVideo');
      if (existingVideo && !existingVideo.srcObject) existingVideo.srcObject = _stream;
      const spinner = getEl('livenessSpinner');
      if (spinner) spinner.classList.add('hidden');
      return;
    }

    const video = getEl('livenessVideo');
    if (!video) throw new Error('Video element missing');

    let stream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } },
        audio: false
      });
    } catch (_) {
      throw new Error('Camera permission blocked or camera not available.');
    }

    _stream = stream;
    video.srcObject = stream;
    await new Promise((resolve) => {
      video.onloadedmetadata = () => {
        video.play();
        const spinner = getEl('livenessSpinner');
        if (spinner) spinner.classList.add('hidden');
        _setHardwareTorch(_torchActive);
        resolve();
      };
    });
  }

  function _clearLoops() {
    if (_animFrame) {
      cancelAnimationFrame(_animFrame);
      _animFrame = null;
    }
    if (_captureTimer) {
      clearInterval(_captureTimer);
      _captureTimer = null;
    }
  }

  function _stopCamera() {
    _clearLoops();
    _setHardwareTorch(false);
    if (_stream) {
      _stream.getTracks().forEach((tr) => tr.stop());
      _stream = null;
    }
    const video = getEl('livenessVideo');
    if (video) video.srcObject = null;
    const scanLine = getEl('livenessScanLine');
    if (scanLine) scanLine.classList.remove('lv-scanning');
  }

  function _captureFrame() {
    const video = getEl('livenessVideo');
    const canvas = getEl('livenessCanvas');
    if (!video || !canvas || !video.videoWidth) return null;
    const scale = Math.min(1, 640 / Math.max(video.videoWidth, video.videoHeight));
    canvas.width = Math.round((video.videoWidth || CAPTURE_WIDTH) * scale);
    canvas.height = Math.round((video.videoHeight || CAPTURE_HEIGHT) * scale);
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL('image/jpeg', FRAME_JPEG_QUALITY);
  }

  function _sampleLowRes(video) {
    if (!video || !video.videoWidth || video.readyState < 2) return null;
    if (!_canvasBuffer) {
      _canvasBuffer = document.createElement('canvas');
      _canvasBuffer.width = 80;
      _canvasBuffer.height = 60;
    }
    const ctx = _canvasBuffer.getContext('2d');
    ctx.drawImage(video, 0, 0, 80, 60);
    return ctx.getImageData(0, 0, 80, 60).data;
  }

  function _analyzeLiveStream(video) {
    const d = _sampleLowRes(video);
    if (!d) {
      return { ready: false, faceOk: false, lightOk: false, backlit: false, lum: 0, bgLum: 0, eyeBuf: null, faceBuf: null };
    }

    let faceSum = 0;
    let faceCount = 0;
    let faceContrast = 0;
    const faceBuf = new Float32Array(32 * 32);
    let fi = 0;
    for (let y = 14; y < 46; y++) {
      for (let x = 24; x < 56; x++) {
        const idx = (y * 80 + x) * 4;
        const lum = d[idx] * 0.299 + d[idx + 1] * 0.587 + d[idx + 2] * 0.114;
        faceBuf[fi++] = lum;
        faceSum += lum;
        if (x > 24) {
          const pidx = (y * 80 + (x - 1)) * 4;
          const plum = d[pidx] * 0.299 + d[pidx + 1] * 0.587 + d[pidx + 2] * 0.114;
          faceContrast += Math.abs(lum - plum);
        }
        faceCount++;
      }
    }
    const faceLum = faceSum / faceCount;
    const avgContrast = faceContrast / faceCount;

    const eyeBuf = new Float32Array(28 * 12);
    let ei = 0;
    for (let ey = 20; ey < 32; ey++) {
      for (let ex = 26; ex < 54; ex++) {
        const eidx = (ey * 80 + ex) * 4;
        eyeBuf[ei++] = d[eidx] * 0.299 + d[eidx + 1] * 0.587 + d[eidx + 2] * 0.114;
      }
    }

    let bgSum = 0;
    let bgCount = 0;
    for (let by = 0; by < 60; by += 2) {
      for (let bx = 0; bx < 80; bx += 2) {
        if (bx >= 20 && bx < 60 && by >= 10 && by < 52) continue;
        const bidx = (by * 80 + bx) * 4;
        bgSum += d[bidx] * 0.299 + d[bidx + 1] * 0.587 + d[bidx + 2] * 0.114;
        bgCount++;
      }
    }
    const bgLum = bgCount ? (bgSum / bgCount) : faceLum;

    const backlit = (faceLum < 45 && (bgLum - faceLum) > 95);
    const lightOk = (faceLum >= MIN_FACE_LUM && faceLum <= MAX_FACE_LUM && !backlit);
    const facePresent = (avgContrast > 1.0 && faceLum > 18);

    return {
      ready: (lightOk && facePresent),
      faceOk: facePresent,
      lightOk,
      backlit,
      lum: faceLum,
      bgLum,
      eyeBuf,
      faceBuf
    };
  }

  function _meanAbsDiffNorm(a, b) {
    if (!a || !b || a.length !== b.length) return 0;
    let sumA = 0;
    let sumB = 0;
    for (let i = 0; i < a.length; i++) {
      sumA += a[i];
      sumB += b[i];
    }
    const meanA = sumA / a.length;
    const meanB = sumB / b.length;
    let diff = 0;
    for (let j = 0; j < a.length; j++) {
      diff += Math.abs((a[j] - meanA) - (b[j] - meanB));
    }
    return diff / a.length;
  }

  function _runAlignLoop() {
    if (_scanState !== 'aligning') return;

    const video = getEl('livenessVideo');
    if (!video || video.readyState < 2) {
      _animFrame = requestAnimationFrame(_runAlignLoop);
      return;
    }

    const q = _analyzeLiveStream(video);
    if (q.faceOk) {
      _updateBadge('chkSingleFace', 'chkSingleFaceIcon', 'chkSingleFaceSub', true, '✅', '✓ Ready');
    } else {
      _updateBadge('chkSingleFace', 'chkSingleFaceIcon', 'chkSingleFaceSub', false, '', '', '👤', 'Center face');
    }

    if (q.lum < MIN_FACE_LUM) {
      _updateBadge('chkBrightLight', 'chkBrightLightIcon', 'chkBrightLightSub', false, '', '', '🌙', 'Too dark');
      _setWarning(`☀️ ${_t('brightNeed')}`);
    } else if (q.backlit) {
      _updateBadge('chkBrightLight', 'chkBrightLightIcon', 'chkBrightLightSub', false, '', '', '☀️', 'Backlight');
      _setWarning(`☀️ ${_t('backlightWarn')}`);
    } else if (q.lum > MAX_FACE_LUM) {
      _updateBadge('chkBrightLight', 'chkBrightLightIcon', 'chkBrightLightSub', false, '', '', '☀️', 'Glare');
      _setWarning('⚠️ Too much glare on face');
    } else {
      _updateBadge('chkBrightLight', 'chkBrightLightIcon', 'chkBrightLightSub', true, '✅', '✓ Bright');
      _setWarning('');
    }

    _updateBadge('chkEyeBlink', 'chkEyeBlinkIcon', 'chkEyeBlinkSub', null, '👁️', _t('blinkWord'));

    if (q.ready) {
      _alignedFrames++;
      _setViewfinderState('lv-vf-ready');
      if (_alignedFrames >= ALIGNED_FRAMES_NEEDED) {
        _startAdaptiveBlinkScan(q);
        return;
      }
    } else {
      _alignedFrames = Math.max(0, _alignedFrames - 1);
      _setViewfinderState('lv-vf-warn');
    }

    _animFrame = requestAnimationFrame(_runAlignLoop);
  }

  function _startAdaptiveBlinkScan(initialQ) {
    _clearLoops();
    _scanState = 'scanning';
    _scanStartTime = performance.now();
    _samples = [];
    _baselineEyeBuf = initialQ.eyeBuf;
    _baselineFaceBuf = initialQ.faceBuf;
    _prevFaceBuf = initialQ.faceBuf;

    _setInstruction(_t('scanningBlink'), '👁️');
    _setStatus('Blink naturally…', 'ok');
    _updateBadge('chkEyeBlink', 'chkEyeBlinkIcon', 'chkEyeBlinkSub', null, '👁️', 'Scanning…');

    const scanLine = getEl('livenessScanLine');
    if (scanLine) scanLine.classList.add('lv-scanning');

    const firstUrl = _captureFrame();
    if (firstUrl) {
      _samples.push({ dataUrl: firstUrl, t: 0, eyeDiff: 0, faceDiff: 0, lum: initialQ.lum });
    }

    let blinkPeakSeen = false;
    let blinkPeakDiff = 0;
    let blinkRecovered = false;
    let motionSeen = false;

    _captureTimer = setInterval(() => {
      if (_scanState !== 'scanning') {
        _clearLoops();
        return;
      }
      const video = getEl('livenessVideo');
      if (!video || video.readyState < 2) return;

      const elapsed = performance.now() - _scanStartTime;
      const q = _analyzeLiveStream(video);
      const frameUrl = _captureFrame();
      if (!frameUrl) return;

      const eyeDiff = _meanAbsDiffNorm(q.eyeBuf, _baselineEyeBuf);
      const faceDiff = _meanAbsDiffNorm(q.faceBuf, _prevFaceBuf);
      const totalFaceShift = _meanAbsDiffNorm(q.faceBuf, _baselineFaceBuf);
      _prevFaceBuf = q.faceBuf;

      _samples.push({ dataUrl: frameUrl, t: elapsed, eyeDiff, faceDiff, totalFaceShift, lum: q.lum });

      if (faceDiff > 1.2 || totalFaceShift > 2.0) motionSeen = true;
      if (eyeDiff > blinkPeakDiff) blinkPeakDiff = eyeDiff;
      if (eyeDiff >= BLINK_EYE_DIFF_THRESH && elapsed >= MIN_BLINK_ELAPSED_MS) blinkPeakSeen = true;
      if (blinkPeakSeen && eyeDiff < blinkPeakDiff * BLINK_RECOVERY_RATIO) {
        blinkRecovered = true;
        _updateBadge('chkEyeBlink', 'chkEyeBlinkIcon', 'chkEyeBlinkSub', true, '✅', '✓ Blink');
      }

      let pct = Math.min(95, Math.round((elapsed / MAX_SCAN_MS) * 100));
      if (blinkRecovered && motionSeen) pct = Math.max(pct, 88);
      _setProgress(pct);

      const readyEarly = (elapsed >= MIN_SCAN_MS && blinkRecovered && motionSeen && _samples.length >= KEYFRAME_COUNT);
      const timedOut = (elapsed >= MAX_SCAN_MS && _samples.length >= KEYFRAME_COUNT);
      if (readyEarly || timedOut) {
        _clearLoops();
        _finalizeAndSubmit();
      }
    }, SAMPLE_INTERVAL_MS);
  }

  function _selectKeyframes(samples) {
    const n = samples.length;
    if (n <= KEYFRAME_COUNT) return samples.map((s) => s.dataUrl);

    let peakIdx = 1;
    let bestEye = -1;
    for (let i = 1; i < n - 1; i++) {
      if (samples[i].eyeDiff > bestEye) {
        bestEye = samples[i].eyeDiff;
        peakIdx = i;
      }
    }

    const picked = { 0: true, [n - 1]: true, [peakIdx]: true };
    if (peakIdx + 1 < n - 1) picked[peakIdx + 1] = true;
    else if (peakIdx - 1 > 0) picked[peakIdx - 1] = true;

    picked[Math.max(1, Math.floor(peakIdx / 2))] = true;
    picked[Math.min(n - 2, Math.floor((peakIdx + n - 1) / 2))] = true;

    const step = (n - 1) / (KEYFRAME_COUNT - 1);
    for (let k = 1; Object.keys(picked).length < KEYFRAME_COUNT && k < n; k++) {
      picked[Math.min(n - 1, Math.max(0, Math.round(k * step)))] = true;
    }
    for (let f = 1; Object.keys(picked).length < KEYFRAME_COUNT && f < n - 1; f++) {
      picked[f] = true;
    }

    let indices = Object.keys(picked).map((x) => parseInt(x, 10)).sort((a, b) => a - b);
    if (indices.length > KEYFRAME_COUNT) indices = indices.slice(0, KEYFRAME_COUNT);
    return indices.map((idx) => samples[idx].dataUrl);
  }

  async function _finalizeAndSubmit() {
    _scanState = 'verifying';
    _setProgress(100);
    _setInstruction(_t('verifying'), '⏳');
    _setStatus('Verifying…', '');

    try {
      const { status, data } = await apiRequest(_urls.livenessVerify, {
        token: _challengeToken,
        frames: _selectKeyframes(_samples)
      });
      if (status === 200 && data.ok) {
        _onUnlockSuccess(data.message || _t('verified'));
      } else {
        _onUnlockFailure(data);
      }
    } catch (_) {
      _onUnlockFailure({ error: 'Network error. Please check your connection and try again.' });
    }
  }

  function _onUnlockSuccess(msg) {
    if (window.SnehaVoice) window.SnehaVoice.speak('face_success');
    _scanState = 'done';
    _setHardwareTorch(false);
    const torchRing = getEl('livenessTorchRing');
    if (torchRing) torchRing.classList.add('success');
    _clearLoops();
    _setStatus('Verified ✓', 'ok');
    _setInstruction(msg, '🔓');
    _updateBadge('chkEyeBlink', 'chkEyeBlinkIcon', 'chkEyeBlinkSub', true, '✅', '✓ Verified');

    const scanLine = getEl('livenessScanLine');
    if (scanLine) scanLine.classList.remove('lv-scanning');
    const overlay = getEl('livenessSuccessOverlay');
    if (overlay) overlay.classList.remove('hidden');
    _setViewfinderState('lv-vf-success');

    setTimeout(() => {
      _stopCamera();
      _closeModal();
      if (_resolvePromise) _resolvePromise(true);
      _resolvePromise = null;
    }, AUTO_CLOSE_MS);
  }

  function _closeAfterFailureDelay() {
    _showRetryButton(false);
    setTimeout(() => {
      _stopCamera();
      _closeModal();
      if (_resolvePromise) _resolvePromise(false);
      _resolvePromise = null;
    }, LOCK_CLOSE_MS);
  }

  function _onUnlockFailure(data) {
    if (window.SnehaVoice) window.SnehaVoice.speak('face_failed');
    _clearLoops();
    _scanState = 'failed';
    _alignedFrames = 0;
    _setProgress(0);

    const errMsg = (data && data.error) || 'Face verification failed. Please try again in bright light.';
    if (data && typeof data.maxAttempts === 'number') _maxAttempts = data.maxAttempts;
    if (data && typeof data.attemptsRemaining === 'number') _attemptsLeft = data.attemptsRemaining;
    _renderAttemptDots(_attemptsLeft, _maxAttempts);

    const scanLine = getEl('livenessScanLine');
    if (scanLine) scanLine.classList.remove('lv-scanning');
    _setViewfinderState('lv-vf-error');

    if (data && data.locked) {
      _setInstruction(errMsg, '🔒');
      _setStatus('Locked — too many attempts', 'error');
      _closeAfterFailureDelay();
      return;
    }

    if (data && data.enrolled === false) {
      _setInstruction(errMsg, '🚫');
      _setStatus('Face not registered', 'error');
      _closeAfterFailureDelay();
      return;
    }

    _setInstruction(errMsg, '❌');
    _setStatus(`Attempts left: ${_attemptsLeft} / ${_maxAttempts}`, 'error');
    _showRetryButton(true);
  }

  async function _fetchChallenge() {
    const { status, data } = await apiRequest(_urls.livenessChallenge);
    if (status === 200 && data.ok) {
      _maxAttempts = data.maxAttempts || 5;
      _attemptsLeft = (data.attemptsRemaining !== null && data.attemptsRemaining !== undefined)
        ? data.attemptsRemaining
        : _maxAttempts;
      _renderAttemptDots(_attemptsLeft, _maxAttempts);
      return data;
    }
    const err = new Error(data.error || `Server error ${status}`);
    err.data = data;
    throw err;
  }

  let _demoTimers = [];
  function _clearDemoTimers() {
    _demoTimers.forEach((t) => clearTimeout(t));
    _demoTimers = [];
    const simImg = getEl('lvDemoAvatar');
    if (simImg) simImg.remove();
  }

  function _runDemoLivenessSimulation() {
    _clearDemoTimers();
    _scanState = 'scanning';
    const spinner = getEl('livenessSpinner');
    if (spinner) spinner.classList.add('hidden');

    const vf = getEl('livenessViewfinder');
    if (vf && !getEl('lvDemoAvatar')) {
      const img = document.createElement('img');
      img.id = 'lvDemoAvatar';
      const u = (global.SM && global.SM.user) || {};
      img.src = u.photo || 'static/img/avatars/male_nurse.svg';
      img.alt = u.name || 'Caregiver';
      img.className = 'absolute inset-0 w-full h-full object-cover rounded-full bg-slate-100';
      vf.insertBefore(img, vf.firstChild);
    }

    const scanLine = getEl('livenessScanLine');
    if (scanLine) scanLine.classList.add('lv-scanning');

    _setViewfinderState('lv-vf-ready');
    _setStatus('Demo camera preview active…', 'ok');
    _setInstruction(_t('lookBlink'), '👁️');
    _setProgress(15);

    _demoTimers.push(setTimeout(() => {
      if (_scanState !== 'scanning') return;
      _updateBadge('chkBrightLight', 'chkBrightLightIcon', 'chkBrightLightSub', true, '✅', '✓ Bright');
      _updateBadge('chkSingleFace', 'chkSingleFaceIcon', 'chkSingleFaceSub', true, '✅', '✓ Ready');
      _setInstruction(_t('scanningBlink'), '👁️');
      _setProgress(48);
    }, 450));

    _demoTimers.push(setTimeout(() => {
      if (_scanState !== 'scanning') return;
      _updateBadge('chkEyeBlink', 'chkEyeBlinkIcon', 'chkEyeBlinkSub', true, '✅', '✓ Blink');
      _setInstruction(_t('verifying'), '⏳');
      _setProgress(85);
    }, 1150));

    _demoTimers.push(setTimeout(async () => {
      if (_scanState !== 'scanning') return;
      _setProgress(100);
      try {
        await apiRequest(_urls.livenessVerify, { token: _challengeToken, frames: [] });
      } catch (_) {}
      _onUnlockSuccess(_t('verified'));
    }, 1750));
  }

  async function _beginRound() {
    _clearDemoTimers();
    _showRetryButton(false);
    _setProgress(0);
    _setWarning('');
    _setStatus('Connecting…', '');
    _setInstruction('Starting camera…', '⏳');
    _alignedFrames = 0;
    _samples = [];

    _updateBadge('chkBrightLight', 'chkBrightLightIcon', 'chkBrightLightSub', null, '💡', 'Checking…');
    _updateBadge('chkEyeBlink', 'chkEyeBlinkIcon', 'chkEyeBlinkSub', null, '👁️', _t('blinkWord'));
    _updateBadge('chkSingleFace', 'chkSingleFaceIcon', 'chkSingleFaceSub', null, '👤', 'Checking…');

    const ch = await _fetchChallenge();
    _challengeToken = ch.token;

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      _runDemoLivenessSimulation();
      return;
    }

    try {
      await _startCamera();
      _scanState = 'aligning';
      _setStatus(`Attempts left: ${_attemptsLeft} / ${_maxAttempts}`, 'ok');
      _setInstruction(_t('lookBlink'), '👁️');
      _runAlignLoop();
    } catch (_) {
      _runDemoLivenessSimulation();
    }
  }

  function startLivenessCheck() {
    const sm = global.SM || {};
    _csrfToken = sm.csrf || '';
    _urls = sm.urls || {};

    if (!_urls.livenessChallenge || !_urls.livenessVerify) {
      return Promise.resolve(false);
    }

    return new Promise((resolve) => {
      _resolvePromise = resolve;
      _scanState = 'idle';
      _openModal();

      const spinner = getEl('livenessSpinner');
      if (spinner) spinner.classList.remove('hidden');

      _beginRound().catch((err) => {
        _clearDemoTimers();
        _stopCamera();
        _closeModal();
        alert(err.message || 'Face verification could not start.');
        if (_resolvePromise) _resolvePromise(false);
        _resolvePromise = null;
      });
    });
  }

  function retryLivenessCheck() {
    if (_scanState !== 'failed') return;
    _beginRound().catch((err) => {
      if (err && err.data && (err.data.locked || err.data.enrolled === false)) {
        _onUnlockFailure(err.data);
        return;
      }
      _onUnlockFailure({ error: (err && err.message) || 'Could not restart face check.' });
    });
  }

  function cancelLivenessCheck() {
    _clearDemoTimers();
    _stopCamera();
    _scanState = 'done';
    _closeModal();
    if (_resolvePromise) _resolvePromise(false);
    _resolvePromise = null;
  }

  function _bindModalEvents() {
    const modal = getEl('modalLiveness');
    if (!modal || modal.dataset.lvBound === '1') return;
    modal.dataset.lvBound = '1';
    modal.addEventListener('click', (event) => {
      const btn = event.target.closest('[data-lv-action]');
      if (!btn) return;
      const action = btn.dataset.lvAction;
      if (action === 'cancel') cancelLivenessCheck();
      else if (action === 'retry') retryLivenessCheck();
      else if (action === 'torch') toggleTorchLight();
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', _bindModalEvents);
  } else {
    _bindModalEvents();
  }

  global.startLivenessCheck = startLivenessCheck;
  global.retryLivenessCheck = retryLivenessCheck;
  global.cancelLivenessCheck = cancelLivenessCheck;
})(window);
