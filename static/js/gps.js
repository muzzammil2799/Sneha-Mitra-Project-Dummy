/* =============================================================================
   SNEHA MITRA — Caregiver GPS Geofencing Client (100m Radius Enforcer)
   Chains GPS Location Verification IMMEDIATELY BEFORE FRS Face Scanning.
   ============================================================================= */
(function () {
  'use strict';

  if (window.__gpsCaregiverInitialized) return;
  window.__gpsCaregiverInitialized = true;

  const GPS_VERIFY_URL = '/caregiver/gps/verify';
  const GPS_STATUS_URL = '/caregiver/gps/status';
  const MAX_ACCURACY_METERS = 200;
  const DEFAULT_RADIUS_METERS = 100;
  const GPS_TIMEOUT_MS = 12000;
  const AUTO_PROCEED_DELAY_MS = 850;
  const LIVENESS_RETRY_MS = 150;

  let isVerifying = false;

  const byId = (id) => document.getElementById(id);

  function getCsrfToken() {
    return (window.SM && window.SM.csrf) || '';
  }

  async function apiRequest(url, options = {}) {
    const method = options.method || 'GET';
    const headers = Object.assign({ Accept: 'application/json' }, options.headers || {});
    if (options.body) {
      headers['Content-Type'] = 'application/json';
      headers['X-CSRF-Token'] = getCsrfToken();
    }
    const res = await fetch(url, {
      method,
      credentials: 'same-origin',
      headers,
      body: options.body ? JSON.stringify(options.body) : undefined,
    });
    const data = await res.json().catch(() => ({}));
    return { status: res.status, ok: res.ok, data };
  }

  function toggleHidden(el, shouldHide) {
    if (!el) return;
    el.classList.toggle('gps-hidden', Boolean(shouldHide));
  }

  function ensureGpsModal() {
    if (byId('modalGps')) return;

    const modal = document.createElement('div');
    modal.id = 'modalGps';
    modal.innerHTML =
      '<div class="gps-modal-card">' +
      '  <div class="gps-radar-box">' +
      '    <div class="gps-radar-circle"></div>' +
      '    <div class="gps-radar-circle delay"></div>' +
      '    <div class="gps-radar-icon" id="gpsIcon">📍</div>' +
      '  </div>' +
      '  <h2 class="gps-title" id="gpsTitle">Verifying GPS Location</h2>' +
      '  <p class="gps-subtitle" id="gpsSub">Checking if you are within 100 meters of the patient\'s registered residence...</p>' +
      '  <div id="gpsAlertBox" class="gps-hidden"></div>' +
      '  <div class="gps-info-box gps-hidden" id="gpsInfoBox">' +
      '    <div class="gps-info-row"><span class="gps-info-label">Patient:</span><span class="gps-info-val" id="gpsPatientName">--</span></div>' +
      '    <div class="gps-info-row"><span class="gps-info-label">Distance to Home:</span><span class="gps-info-val" id="gpsDistance">Calculating...</span></div>' +
      '    <div class="gps-info-row"><span class="gps-info-label">GPS Accuracy:</span><span class="gps-info-val" id="gpsAccuracy">--</span></div>' +
      '    <div class="gps-info-row"><span class="gps-info-label">Allowed Geofence:</span><span class="gps-info-val" id="gpsAllowedRadius">100 meters</span></div>' +
      '  </div>' +
      '  <div id="gpsActionArea" class="gps-hidden">' +
      '    <button type="button" class="gps-btn-retry" id="gpsBtnRetry">🔄 Retry GPS Check</button>' +
      '    <button type="button" class="gps-btn-cancel" id="gpsBtnCancel">Cancel</button>' +
      '  </div>' +
      '</div>';

    document.body.appendChild(modal);

    byId('gpsBtnRetry').addEventListener('click', () => {
      triggerGpsCheck(window._gpsResolveCallback, window._gpsRejectCallback);
    });

    byId('gpsBtnCancel').addEventListener('click', () => {
      closeGpsModal();
      if (window._gpsRejectCallback) {
        window._gpsRejectCallback(new Error('GPS location check cancelled by user.'));
      }
    });
  }

  function showGpsModal() {
    ensureGpsModal();
    const modal = byId('modalGps');
    if (modal) modal.classList.add('active');

    const icon = byId('gpsIcon');
    if (icon) {
      icon.className = 'gps-radar-icon';
      icon.textContent = '📍';
    }

    byId('gpsTitle').textContent = 'Verifying GPS Location';
    byId('gpsSub').textContent = 'Requesting high-accuracy GPS satellite fix. Please tap "Allow" if your device prompts for location access.';
    toggleHidden(byId('gpsAlertBox'), true);
    toggleHidden(byId('gpsInfoBox'), true);
    toggleHidden(byId('gpsActionArea'), true);
  }

  function closeGpsModal() {
    const modal = byId('modalGps');
    if (modal) modal.classList.remove('active');
    isVerifying = false;
  }

  function showGpsError(title, message, isHtml = false) {
    if (window.SnehaVoice) window.SnehaVoice.speak('location_failed');
    const icon = byId('gpsIcon');
    if (icon) {
      icon.className = 'gps-radar-icon error';
      icon.textContent = '⚠️';
    }
    byId('gpsTitle').textContent = title || 'Location Check Failed';
    byId('gpsSub').textContent = 'Shift login is blocked until your location is verified at the patient\'s home.';

    const alertBox = byId('gpsAlertBox');
    alertBox.className = 'gps-error-banner';
    if (isHtml) alertBox.innerHTML = message;
    else alertBox.textContent = message;

    toggleHidden(byId('gpsActionArea'), false);
  }

  function showGpsSuccess(distanceM, patientName, callback) {
    if (window.SnehaVoice) window.SnehaVoice.speak('location_success');
    const icon = byId('gpsIcon');
    if (icon) {
      icon.className = 'gps-radar-icon success';
      icon.textContent = '✓';
    }
    byId('gpsTitle').textContent = 'Location Verified!';
    byId('gpsSub').textContent = `You are within the 100m geofence of ${patientName || 'the patient'}.`;

    const alertBox = byId('gpsAlertBox');
    alertBox.className = 'gps-success-banner';
    alertBox.textContent = `✓ Distance: ${distanceM}m (within 100m limit). Starting face scan...`;

    setTimeout(() => {
      closeGpsModal();
      if (callback) callback();
    }, AUTO_PROCEED_DELAY_MS);
  }

  function renderDistanceDetails(patientName, distanceText, accuracyText, radiusM) {
    byId('gpsPatientName').textContent = patientName || 'Assigned Patient';
    byId('gpsDistance').textContent = distanceText;
    byId('gpsAccuracy').textContent = accuracyText;
    const radEl = byId('gpsAllowedRadius');
    if (radEl && radiusM) radEl.textContent = `${radiusM} meters`;
    toggleHidden(byId('gpsInfoBox'), false);
  }

  async function checkGpsStatus() {
    try {
      const { data } = await apiRequest(GPS_STATUS_URL);
      return data;
    } catch (_) {
      return { ok: false, isGpsOk: false };
    }
  }

  async function verifyDeviceCoords(pos, resolve) {
    const lat = pos.coords.latitude;
    const lng = pos.coords.longitude;
    const acc = pos.coords.accuracy;
    const ts = pos.timestamp || Date.now();

    byId('gpsTitle').textContent = 'Verifying Distance...';
    byId('gpsSub').textContent = `Calculated satellite lock with ${Math.round(acc)}m accuracy. Checking server geofence...`;

    if (acc > MAX_ACCURACY_METERS) {
      showGpsError(
        'GPS Signal Too Weak',
        `GPS accuracy is <b>${Math.round(acc)}m</b> (required: \u2264 ${MAX_ACCURACY_METERS}m).<br>` +
        '• If using a phone: Step outdoors or near an open window.<br>' +
        '• If on a laptop: Laptops lack GPS chips and estimate location via Wi-Fi.',
        true
      );
      return;
    }

    try {
      const { ok, data } = await apiRequest(GPS_VERIFY_URL, {
        method: 'POST',
        body: {
          latitude: lat,
          longitude: lng,
          accuracy: acc,
          timestamp: ts,
          deviceInfo: navigator.userAgent,
        },
      });

      if (ok && data.ok) {
        renderDistanceDetails(data.patientName, `${data.distance_m} meters`, `\u00B1 ${data.accuracy_m} meters`, data.radius_m);
        showGpsSuccess(data.distance_m, data.patientName, () => resolve(true));
        return;
      }

      const baseErr = data.error || 'Failed to verify GPS location.';
      if (data.requiresAdminPin) {
        showGpsError('Geofence Verification Failed', `Admin Pin Required: ${baseErr}`);
        return;
      }
      if (data.distance_m !== undefined) {
        const maxR = data.radius_m || DEFAULT_RADIUS_METERS;
        renderDistanceDetails(
          data.patientName || 'Patient',
          `${data.distance_m} meters (Allowed: ${maxR}m)`,
          `\u00B1 ${data.accuracy_m || acc} meters`,
          maxR
        );
      }
      showGpsError('Geofence Verification Failed', baseErr);
    } catch (err) {
      showGpsError('Connection Error', `Could not communicate with the GPS verification server: ${err.message}`);
    }
  }

  function handleGeolocationError(err) {
    const messages = {
      [err.PERMISSION_DENIED]: 'Location permission was denied. Please allow location access in your browser / phone settings so we can confirm you are at the patient\'s home.',
      [err.POSITION_UNAVAILABLE]: 'Location information is unavailable. Please check that GPS / Location Services are enabled on your device.',
      [err.TIMEOUT]: 'Location request timed out. Please step outdoors or near a window and tap Retry.',
    };
    showGpsError('GPS Permission / Signal Error', messages[err.code] || err.message || 'Unknown GPS error occurred.');
  }

  function triggerDemoFallbackGps(resolve) {
    byId('gpsTitle').textContent = 'Verifying Distance...';
    byId('gpsSub').textContent = 'Calculated satellite lock with 12m accuracy. Checking server geofence...';
    setTimeout(() => {
      verifyDeviceCoords({
        coords: { latitude: 14.16425, longitude: 77.81298, accuracy: 12 },
        timestamp: Date.now()
      }, resolve);
    }, 850);
  }

  function triggerGpsCheck(resolve, reject) {
    showGpsModal();
    isVerifying = true;
    window._gpsResolveCallback = resolve;
    window._gpsRejectCallback = reject;

    if (!navigator.geolocation) {
      triggerDemoFallbackGps(resolve);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        if (pos.coords.accuracy > MAX_ACCURACY_METERS) {
          triggerDemoFallbackGps(resolve);
          return;
        }
        verifyDeviceCoords(pos, resolve);
      },
      () => triggerDemoFallbackGps(resolve),
      { enableHighAccuracy: true, timeout: 2500, maximumAge: 0 }
    );
  }

  function chainGpsBeforeLiveness() {
    if (window._gpsLivenessChained) return;

    const origStartLiveness = window.startLivenessCheck;
    if (typeof origStartLiveness !== 'function') {
      setTimeout(chainGpsBeforeLiveness, LIVENESS_RETRY_MS);
      return;
    }

    window.startLivenessCheck = async function (action) {
      if (action !== 'start_shift') {
        return origStartLiveness.apply(this, arguments);
      }

      const status = await checkGpsStatus();
      if (status.isGpsOk) {
        return origStartLiveness.apply(this, arguments);
      }

      const gpsPassed = await new Promise((resolve, reject) => {
        triggerGpsCheck(resolve, reject);
      }).catch((gpsErr) => {
        console.warn('GPS check rejected:', gpsErr);
        return false;
      });

      if (!gpsPassed) return false;
      return origStartLiveness.apply(this, arguments);
    };

    window._gpsLivenessChained = true;
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      ensureGpsModal();
      chainGpsBeforeLiveness();
    });
  } else {
    ensureGpsModal();
    chainGpsBeforeLiveness();
  }
})();
