/* =============================================================================
   SNEHA MITRA — Admin Leaflet Map Picker & GPS Location Tracker for Patients
   Default Focus: Puttaparthi, Sri Sathya Sai District, Andhra Pradesh
   ============================================================================= */
(function () {
  'use strict';

  if (window.__gpsAdminInitialized) return;
  window.__gpsAdminInitialized = true;

  const PUTTAPARTHI_COORDS = [14.163678, 77.812498];
  const PUTTAPARTHI_ZOOM = 15;
  const DEFAULT_RADIUS = 100;
  const MIN_RADIUS = 10;
  const DISTRICT_VIEWBOX = '77.20,14.60,78.30,13.70';
  const MAP_RETRY_MS = 200;
  const MAP_RESIZE_MS = 250;

  let map = null;
  let marker = null;
  let circle = null;
  let currentLat = null;
  let currentLng = null;
  let currentRadius = DEFAULT_RADIUS;

  const byId = (id) => document.getElementById(id);

  function getVal(id) {
    const el = byId(id);
    return el ? el.value.trim() : '';
  }

  function isValidCoordPair(lat, lng) {
    return (
      lat !== null && lat !== undefined && !Number.isNaN(Number(lat)) &&
      lng !== null && lng !== undefined && !Number.isNaN(Number(lng))
    );
  }

  async function apiRequest(url) {
    const res = await fetch(url, { headers: { Accept: 'application/json' } });
    return res.json();
  }

  function parseCoordinates(inputStr) {
    if (!inputStr) return null;
    const s = inputStr.trim();

    const patterns = [
      /!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/,
      /@(-?\d+\.\d+),(-?\d+\.\d+)/,
      /[?&](?:q|query|ll|daddr|destination)=(-?\d+\.\d+)[,+](-?\d+\.\d+)/,
      /\/(?:place|search)\/(-?\d+\.\d+)[,+](-?\d+\.\d+)/,
      /center=(-?\d+\.\d+)(?:%2C|,)(-?\d+\.\d+)/,
      /#map=\d+\/(-?\d+\.\d+)\/(-?\d+\.\d+)/,
    ];
    for (const pattern of patterns) {
      const match = s.match(pattern);
      if (match) return { lat: parseFloat(match[1]), lng: parseFloat(match[2]) };
    }

    const raw = s.match(/(-?\d+\.\d+)[,\s]+(-?\d+\.\d+)/);
    if (raw) {
      const lat = parseFloat(raw[1]);
      const lng = parseFloat(raw[2]);
      if (lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
        return { lat, lng };
      }
    }
    return null;
  }

  function updateFormPill(lat, lng, radius) {
    const pill = byId('gpsPillStatus');
    const ptLat = byId('pt_lat');
    const ptLng = byId('pt_lng');
    const ptRad = byId('pt_radius');
    const btn = byId('btnOpenLocationModal');
    const btnClear = byId('btnClearLocation');
    const fieldBox = byId('locationFormField');

    const valid = isValidCoordPair(lat, lng);
    const effectiveRadius = radius || DEFAULT_RADIUS;

    if (ptLat) ptLat.value = valid ? Number(lat).toFixed(6) : '';
    if (ptLng) ptLng.value = valid ? Number(lng).toFixed(6) : '';
    if (ptRad) ptRad.value = effectiveRadius;
    if (fieldBox) fieldBox.classList.toggle('gps-form-field--pinned', valid);

    if (!pill) return;
    if (valid) {
      pill.className = 'gps-coords-badge pinned';
      pill.textContent = `✓ Pinned: ${Number(lat).toFixed(4)}, ${Number(lng).toFixed(4)} (${effectiveRadius}m)`;
      if (btn) {
        btn.classList.add('has-coords');
        btn.classList.remove('no-coords');
        btn.textContent = '📍 Edit Location / Move Pin';
      }
      if (btnClear) btnClear.classList.remove('d-none');
      return;
    }

    pill.className = 'gps-coords-badge';
    pill.textContent = 'Location Not Set (Optional)';
    if (btn) {
      btn.classList.remove('has-coords');
      btn.classList.add('no-coords');
      btn.textContent = '📍 Location (Optional)';
    }
    if (btnClear) btnClear.classList.add('d-none');
  }

  function setPin(latInput, lngInput, radius, panToLocation) {
    const lat = parseFloat(latInput);
    const lng = parseFloat(lngInput);
    if (Number.isNaN(lat) || Number.isNaN(lng)) return;

    currentLat = lat;
    currentLng = lng;
    window._gpsCurrentLat = lat;
    window._gpsCurrentLng = lng;

    let radVal = parseInt(radius || getVal('modal_radius') || DEFAULT_RADIUS, 10);
    if (Number.isNaN(radVal) || radVal < MIN_RADIUS) radVal = DEFAULT_RADIUS;
    currentRadius = radVal;
    window._gpsCurrentRadius = radVal;

    const pos = [lat, lng];
    if (map && window.L) {
      if (!marker) {
        marker = L.marker(pos, { draggable: true }).addTo(map);
        marker.on('dragend', (e) => {
          const p = e.target.getLatLng();
          setPin(p.lat, p.lng, currentRadius, false);
        });
      } else {
        marker.setLatLng(pos);
      }

      if (!circle) {
        circle = L.circle(pos, {
          radius: currentRadius,
          color: '#0284C7',
          fillColor: '#38BDF8',
          fillOpacity: 0.22,
          weight: 2,
        }).addTo(map);
      } else {
        circle.setLatLng(pos);
        circle.setRadius(currentRadius);
      }

      if (panToLocation !== false) {
        map.setView(pos, Math.max(map.getZoom(), 16));
      }
    }

    const latIn = byId('modal_lat');
    const lngIn = byId('modal_lng');
    const radIn = byId('modal_radius');
    const badge = byId('modalGpsBadge');

    if (latIn) latIn.value = lat.toFixed(6);
    if (lngIn) lngIn.value = lng.toFixed(6);
    if (radIn) radIn.value = currentRadius;

    if (badge) {
      badge.className = 'gps-coords-badge pinned';
      badge.textContent = `📍 Pinned: ${lat.toFixed(6)}, ${lng.toFixed(6)} | Geofence: ${currentRadius}m`;
    }
  }

  async function resolveHttpMapLink(query, statusEl) {
    if (statusEl) statusEl.textContent = '🔍 Resolving Google Maps link... Extracting exact satellite pin...';
    try {
      const data = await apiRequest(`/caregiver/gps/resolve_url?url=${encodeURIComponent(query)}`);
      if (data && data.ok && data.latitude && data.longitude) {
        setPin(data.latitude, data.longitude, currentRadius, true);
        if (statusEl) {
          statusEl.textContent = `✓ Google Maps Pin Tracked: ${data.name || 'Patient Residence'} (Lat: ${Number(data.latitude).toFixed(6)}, Lng: ${Number(data.longitude).toFixed(6)})`;
        }
        return;
      }
      const errMsg = (data && data.error) || 'Please open the link in your browser and copy coordinates.';
      if (statusEl) statusEl.textContent = `❌ Could not resolve Google Maps link. ${errMsg}`;
      alert(
        `Could not automatically resolve this Google Maps link: ${(data && data.error) || 'Unknown error'}\n\n` +
        'Tip: You can open the link in Google Maps, tap/right-click the pin, and paste the numbers (e.g. 14.1675, 77.8112).'
      );
    } catch (_) {
      if (statusEl) {
        statusEl.textContent = '❌ Network error resolving link. You can drag the pin on the map or paste exact coordinates.';
      }
    }
  }

  async function searchDistrictNominatim(query, statusEl) {
    const cleanQ = query.replace(/[^\w\s,.-]/g, '').trim();
    const searchVariants = [
      `${cleanQ}, Puttaparthi, Sri Sathya Sai District`,
      `${cleanQ}, Puttaparthi`,
      `${cleanQ}, Sri Sathya Sai District, Andhra Pradesh`,
      `${cleanQ}, Sri Sathya Sai District`,
      `${cleanQ}, Andhra Pradesh`,
    ];

    for (const variant of searchVariants) {
      try {
        const url = `https://nominatim.openstreetmap.org/search?format=json&countrycodes=in&viewbox=${DISTRICT_VIEWBOX}&limit=3&q=${encodeURIComponent(variant)}`;
        const results = await apiRequest(url);
        if (!Array.isArray(results) || !results.length) continue;

        const bestMatch = results.find((item) => {
          const rLat = parseFloat(item.lat);
          const rLon = parseFloat(item.lon);
          return rLat >= 13.0 && rLat <= 16.5 && rLon >= 76.5 && rLon <= 81.0;
        });

        if (bestMatch) {
          const lat = parseFloat(bestMatch.lat);
          const lon = parseFloat(bestMatch.lon);
          setPin(lat, lon, currentRadius, true);
          const shortName = bestMatch.display_name.split(',')[0] || query;
          if (statusEl) {
            statusEl.textContent = `✓ Tracked: ${shortName} (Lat: ${lat.toFixed(6)}, Lng: ${lon.toFixed(6)})`;
          }
          return;
        }
      } catch (_) {
        // Try next query variant
      }
    }

    if (statusEl) {
      statusEl.textContent = "⚠️ Location not found in Sri Sathya Sai District. Please click the map or drag the pin to the patient's house.";
    }
    alert(`Could not automatically track "${query}" in Sri Sathya Sai District. Please click on the map or drag the pin to the patient's house.`);
  }

  function trackLocationName() {
    const query = getVal('gpsSearchInput') || getVal('pt_addr');
    if (!query) {
      alert('Please enter a location name, landmark, village, street, or paste coordinates to track.');
      return;
    }

    const statusEl = byId('gpsSearchStatus');
    if (statusEl) statusEl.textContent = 'Tracking location in Sri Sathya Sai District / Puttaparthi...';

    const coords = parseCoordinates(query);
    if (coords) {
      setPin(coords.lat, coords.lng, currentRadius, true);
      if (statusEl) {
        statusEl.textContent = `✓ Coordinates tracked: ${coords.lat.toFixed(6)}, ${coords.lng.toFixed(6)}`;
      }
      return;
    }

    const isHttpLink = /^https?:\/\//i.test(query) || /maps\.app\.goo\.gl|goo\.gl\/maps|google\.[a-z.]+\/maps/i.test(query);
    if (isHttpLink) {
      resolveHttpMapLink(query, statusEl);
      return;
    }

    searchDistrictNominatim(query, statusEl);
  }

  function useCurrentLocation() {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }
    const statusEl = byId('gpsSearchStatus');
    if (statusEl) statusEl.textContent = 'Acquiring high-accuracy GPS fix from device...';

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        const acc = Math.round(pos.coords.accuracy);
        setPin(lat, lng, currentRadius, true);
        if (statusEl) {
          statusEl.textContent = `✓ Device Location Pinned: ±${acc}m accuracy (Lat: ${lat.toFixed(6)}, Lng: ${lng.toFixed(6)})`;
        }
      },
      (err) => {
        if (statusEl) statusEl.textContent = `GPS permission denied or unavailable: ${err.message}`;
        alert(`Could not acquire device location: ${err.message}`);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  }

  function initMap(initialLat, initialLng, initialRadius) {
    if (!window.L) {
      setTimeout(() => initMap(initialLat, initialLng, initialRadius), MAP_RETRY_MS);
      return;
    }
    if (!byId('gpsAdminMap')) return;

    if (map) {
      try { map.remove(); } catch (_) {}
      map = null;
      marker = null;
      circle = null;
    }

    const hasExisting = isValidCoordPair(initialLat, initialLng);
    const startPos = hasExisting ? [initialLat, initialLng] : PUTTAPARTHI_COORDS;
    const startZoom = hasExisting ? 17 : PUTTAPARTHI_ZOOM;

    map = L.map('gpsAdminMap', { center: startPos, zoom: startZoom, zoomControl: true });
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap | Sri Sathya Sai District',
    }).addTo(map);

    map.on('click', (e) => {
      setPin(e.latlng.lat, e.latlng.lng, getVal('modal_radius'), false);
    });

    if (hasExisting) {
      setPin(initialLat, initialLng, initialRadius || DEFAULT_RADIUS, false);
    } else {
      setPin(PUTTAPARTHI_COORDS[0], PUTTAPARTHI_COORDS[1], initialRadius || DEFAULT_RADIUS, false);
      const badge = byId('modalGpsBadge');
      if (badge) {
        badge.className = 'gps-coords-badge';
        badge.textContent = '📍 Default: Puttaparthi center. Enter location or drag pin to patient home.';
      }
    }

    setTimeout(() => {
      if (map) map.invalidateSize();
    }, MAP_RESIZE_MS);
  }

  window.openGpsLocationModal = function () {
    let modal = byId('modalGpsAdmin');
    if (!modal) {
      buildAndInjectModal();
      modal = byId('modalGpsAdmin');
    }
    if (!modal) return;

    modal.classList.add('active');
    const latV = getVal('pt_lat');
    const lngV = getVal('pt_lng');
    const radV = getVal('pt_radius') || DEFAULT_RADIUS;

    initMap(
      latV ? parseFloat(latV) : currentLat,
      lngV ? parseFloat(lngV) : currentLng,
      radV ? parseInt(radV, 10) : (currentRadius || DEFAULT_RADIUS)
    );
  };

  window.closeGpsLocationModal = function () {
    const modal = byId('modalGpsAdmin');
    if (modal) modal.classList.remove('active');
  };

  function clearSelectedLocation(shouldCloseModal) {
    currentLat = null;
    currentLng = null;
    window._gpsCurrentLat = null;
    window._gpsCurrentLng = null;
    if (marker && map) {
      map.removeLayer(marker);
      marker = null;
    }
    if (circle && map) {
      map.removeLayer(circle);
      circle = null;
    }
    const inLat = byId('modal_lat');
    const inLng = byId('modal_lng');
    if (inLat) inLat.value = '';
    if (inLng) inLng.value = '';

    updateFormPill(null, null, DEFAULT_RADIUS);
    if (shouldCloseModal) window.closeGpsLocationModal();

    const errEl = byId('pt_err');
    if (errEl && errEl.textContent.includes('GPS')) errEl.textContent = '';
  }

  function confirmLocation() {
    const latInput = parseFloat(getVal('modal_lat'));
    const lngInput = parseFloat(getVal('modal_lng'));

    let lat = (!Number.isNaN(latInput) && latInput >= -90 && latInput <= 90) ? latInput : currentLat;
    let lng = (!Number.isNaN(lngInput) && lngInput >= -180 && lngInput <= 180) ? lngInput : currentLng;

    if ((lat === null || lat === undefined || Number.isNaN(lat)) && window._gpsCurrentLat !== undefined) {
      lat = window._gpsCurrentLat;
    }
    if ((lng === null || lng === undefined || Number.isNaN(lng)) && window._gpsCurrentLng !== undefined) {
      lng = window._gpsCurrentLng;
    }

    if (!isValidCoordPair(lat, lng)) {
      alert('Please set or track a location on the map first.');
      return;
    }

    currentLat = lat;
    currentLng = lng;
    window._gpsCurrentLat = lat;
    window._gpsCurrentLng = lng;

    let rad = parseInt(getVal('modal_radius') || DEFAULT_RADIUS, 10);
    if (Number.isNaN(rad) || rad < MIN_RADIUS) rad = DEFAULT_RADIUS;
    currentRadius = rad;
    window._gpsCurrentRadius = rad;

    updateFormPill(currentLat, currentLng, rad);
    window.closeGpsLocationModal();

    const errEl = byId('pt_err');
    if (errEl && errEl.textContent.includes('GPS')) errEl.textContent = '';
  }

  function buildAndInjectModal() {
    if (byId('modalGpsAdmin')) {
      bindModalHandlers();
      return;
    }

    const modal = document.createElement('div');
    modal.id = 'modalGpsAdmin';
    modal.innerHTML =
      '<div class="gps-admin-modal-card">' +
      '  <div class="gps-map-header">' +
      '    <div class="gps-map-title">' +
      '      📍 Patient Residence Location &amp; 100m Geofence' +
      '      <span class="gps-default-tag">Puttaparthi, Sri Sathya Sai District</span>' +
      '    </div>' +
      '    <button type="button" class="gps-btn-curr" id="modalBtnCurr">🎯 Use My Current Location</button>' +
      '  </div>' +
      '  <p class="gps-admin-desc">' +
      '    Paste a <b>Google Maps link</b> (e.g. <code>https://maps.app.goo.gl/...</code>), enter a landmark/address in <b>Puttaparthi / Sri Sathya Sai District</b>, or drop a pin. Caregivers must be within <b>100 meters</b> to start shift.' +
      '  </p>' +
      '  <div class="gps-search-row">' +
      '    <input type="text" id="gpsSearchInput" class="gps-search-input" ' +
      '           placeholder="Paste Google Maps link (https://maps.app.goo.gl/...) or enter landmark, village, street...">' +
      '    <button type="button" class="gps-btn-search" id="modalBtnTrack">🔍 Track Location</button>' +
      '  </div>' +
      '  <div id="gpsSearchStatus" class="gps-search-status">Default focus: Puttaparthi, Sri Sathya Sai District</div>' +
      '  <div id="gpsAdminMap"></div>' +
      '  <div class="gps-grid-inputs">' +
      '    <div><label for="modal_lat" class="gps-input-label">Latitude (Optional)</label><input type="text" id="modal_lat" class="gps-modal-input"></div>' +
      '    <div><label for="modal_lng" class="gps-input-label">Longitude (Optional)</label><input type="text" id="modal_lng" class="gps-modal-input"></div>' +
      '    <div><label for="modal_radius" class="gps-input-label">Geofence Radius (m)</label><input type="number" id="modal_radius" min="20" max="500" value="100" class="gps-modal-input-center"></div>' +
      '  </div>' +
      '  <div class="gps-modal-footer">' +
      '    <div id="modalGpsBadge" class="gps-coords-badge">📍 <i>Loading coordinates...</i></div>' +
      '    <div class="d-flex gap-8">' +
      '      <button type="button" class="gps-btn-close-modal gps-btn-clear" id="modalBtnClear">Clear Location</button>' +
      '      <button type="button" class="gps-btn-close-modal" id="modalBtnCancel">Cancel</button>' +
      '      <button type="button" class="gps-btn-confirm" id="modalBtnConfirm">✓ Confirm &amp; Set Location</button>' +
      '    </div>' +
      '  </div>' +
      '</div>';

    document.body.appendChild(modal);
    bindModalHandlers();
  }

  function bindModalHandlers() {
    const btnTrack = byId('modalBtnTrack');
    if (btnTrack) btnTrack.onclick = trackLocationName;

    const inputSearch = byId('gpsSearchInput');
    if (inputSearch) {
      inputSearch.onkeydown = (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          trackLocationName();
        }
      };
    }

    const btnCurr = byId('modalBtnCurr');
    if (btnCurr) btnCurr.onclick = useCurrentLocation;

    const btnConfirm = byId('modalBtnConfirm');
    if (btnConfirm) btnConfirm.onclick = confirmLocation;

    const btnCancel = byId('modalBtnCancel');
    if (btnCancel) btnCancel.onclick = window.closeGpsLocationModal;

    const btnClearModal = byId('modalBtnClear');
    if (btnClearModal) btnClearModal.onclick = () => clearSelectedLocation(true);

    const onCoordChange = () => {
      const lat = parseFloat(getVal('modal_lat'));
      const lng = parseFloat(getVal('modal_lng'));
      if (!Number.isNaN(lat) && !Number.isNaN(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
        setPin(lat, lng, getVal('modal_radius'), true);
      }
    };

    const inLat = byId('modal_lat');
    if (inLat) {
      inLat.onchange = onCoordChange;
      inLat.oninput = onCoordChange;
    }

    const inLng = byId('modal_lng');
    if (inLng) {
      inLng.onchange = onCoordChange;
      inLng.oninput = onCoordChange;
    }

    const inRad = byId('modal_radius');
    if (inRad) {
      inRad.oninput = () => {
        const r = parseInt(getVal('modal_radius') || DEFAULT_RADIUS, 10);
        if (circle) circle.setRadius(r);
        if (currentLat && currentLng) setPin(currentLat, currentLng, r, false);
      };
    }
  }

  function mountLocationFieldInForm() {
    buildAndInjectModal();
    const form = document.querySelector('form[data-sub="patient"]');
    if (!form || byId('locationFormField')) return;

    const currentPatient = (window.S && window.S.ep && window.cache && window.cache.patients)
      ? window.cache.patients[window.S.ep]
      : null;

    let lat = currentPatient ? currentPatient.latitude : null;
    let lng = currentPatient ? currentPatient.longitude : null;
    let rad = currentPatient
      ? (currentPatient.geofenceRadiusM || currentPatient.geofence_radius_m || DEFAULT_RADIUS)
      : DEFAULT_RADIUS;

    if ((lat === null || lat === undefined) && currentLat !== null && currentLng !== null) {
      lat = currentLat;
      lng = currentLng;
      rad = currentRadius || DEFAULT_RADIUS;
    }

    const hasCoords = isValidCoordPair(lat, lng);
    const container = document.createElement('div');
    container.id = 'locationFormField';
    container.className = `gps-form-field ${hasCoords ? 'gps-form-field--pinned' : ''}`.trim();

    container.innerHTML =
      '<label class="gps-patient-title">Patient GPS Residence Location <span class="gps-patient-sub">(Optional)</span></label>' +
      '<div class="d-flex gap-10">' +
      `  <button type="button" class="btn sec gps-btn-set-loc ${hasCoords ? 'has-coords' : 'no-coords'}" id="btnOpenLocationModal">` +
      `    📍 ${hasCoords ? 'Edit Location / Move Pin' : 'Location (Optional)'}` +
      '  </button>' +
      `  <button type="button" class="btn sec gps-btn-clear-loc ${hasCoords ? '' : 'd-none'}" id="btnClearLocation">✕ Clear Location</button>` +
      `  <span id="gpsPillStatus" class="gps-coords-badge ${hasCoords ? 'pinned' : ''}">` +
      (hasCoords
        ? `✓ Pinned: ${Number(lat).toFixed(4)}, ${Number(lng).toFixed(4)} (${rad}m Geofence)`
        : 'Location Not Set (Optional)') +
      '  </span>' +
      '</div>' +
      `<input type="hidden" id="pt_lat" value="${hasCoords ? lat : ''}">` +
      `<input type="hidden" id="pt_lng" value="${hasCoords ? lng : ''}">` +
      `<input type="hidden" id="pt_radius" value="${rad}">`;

    const errEl = form.querySelector('#pt_err') || form.querySelector('.err');
    if (errEl) form.insertBefore(container, errEl);
    else form.appendChild(container);

    const btnOpen = byId('btnOpenLocationModal');
    if (btnOpen) btnOpen.onclick = window.openGpsLocationModal;

    const btnClear = byId('btnClearLocation');
    if (btnClear) btnClear.onclick = () => clearSelectedLocation(false);
  }

  function start() {
    const app = byId('app') || document.body;
    new MutationObserver(mountLocationFieldInForm).observe(app, { childList: true, subtree: true });
    mountLocationFieldInForm();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }
})();
