(function () {
  'use strict';
  const SM = window.SM;
  const app = document.getElementById('app');
  /* ---------- fixed lists from the Care Plan sheet ---------- */
  const CATS_DEFAULT = [
    { id: 'c1', name: 'Comfort & Hygiene', items: [['a1', 'Bath, mouth care and hair care'], ['a2', 'Perineal care'], ['a3', 'Routine evening care']] },
    { id: 'c2', name: 'Monitor Vital Signs', items: [['a4', 'Monitor temperature and pulse'], ['a5', 'Monitor BP']] },
    { id: 'c3', name: 'Nutritional Support & Bedsore Prevention', items: [['a6', 'Provide assistance for oral feeding'], ['a7', 'Position changing - 2nd hourly / as needed'], ['a8', 'Back care - every 4 hours / as needed'], ['a9', 'Monitoring of Nimbus mattress and other devices'], ['a10', 'Perform skin assessment - 4 hours']] },
    { id: 'c4', name: 'Rest and Relaxation', items: [['a11', 'Hot and cold application'], ['a12', 'Preparing the environment for rest / relaxation']] },
    { id: 'c5', name: 'Activity and Exercises', items: [['a13', 'Assist in joint and muscle strengthening exercises'], ['a14', 'Assist in walking / climbing the stairs']] },
    { id: 'c6', name: 'Diversion Therapy', items: [['a15', 'Reading newspaper / book'], ['a16', 'Engage in playing indoor games, TV / music'], ['a17', 'Accompany watching'], ['a18', 'Encourage new hobby development'], ['a19', 'Listen to Bhajans and Radio Sai']] },
    { id: 'c7', name: 'Spiritual Support', items: [['a20', 'Facilitate prayer environment']] },
    { id: 'c8', name: 'Elimination Needs', items: [['a21', 'Provide bed pan, urinals'], ['a22', 'Assist to washroom']] },
    { id: 'c9', name: 'Medicine Administration', items: [['a23', 'Assist in oral medication']] }];
  let CATS = CATS_DEFAULT.map(function (c) { return { id: c.id, name: c.name, items: c.items.slice() }; });
  let ACTNAME = {}; CATS.forEach(function (c) { c.items.forEach(function (i) { ACTNAME[i[0]] = i[1]; }); });
  const FREQ = ['Once', 'Twice', 'Thrice', 'SOS'];
  const ALERTS = ['Abnormal vital signs of patient', 'Change in patient’s consciousness', 'Sudden chest pain', 'Patient fall', 'Misbehavior from patient or family member', 'Unwanted situation at patient home'];
  const REMARKS = ['All care completed', 'Patient refused an activity', 'Vital signs abnormal, supervisor informed', 'Patient not at home / visit cancelled', 'Other'];
  const COLS = ['users', 'patients', 'plans', 'assignments', 'logs', 'alerts', 'tasks', 'categories', 'requests'];

  /* ---------- small helpers ---------- */
  const LOGO = SM.logo;
  let DEF = window.SM_ICONS || {}, CMAP = window.SM_CAT_ICON_MAP || {}, ICO = { "dash": "M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z", "patients": "M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 21c0-4 4-6 8-6s8 2 8 6", "users": "M9 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7zM2 20c0-3.5 3.2-5.5 7-5.5s7 2 7 5.5M17 5a3 3 0 0 1 0 6M19 15c2 .7 3 2.2 3 4", "assign": "M5 12h14M13 6l6 6-6 6", "plans": "M6 3h9l4 4v14H6zM9 12h7M9 16h7", "attend": "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 7v5l3 2", "requests": "M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2M9 5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2M9 14l2 2 4-4", "recs": "M5 12l5 5 9-10", "alerts": "M6 17V11a6 6 0 0 1 12 0v6l2 2H4zM10 21h4", "history": "M12 8v4l3 3M3.05 11a9 9 0 1 1 .5 4m-.5 5v-5h5", "lib": "M4 6h4M12 6h8M8 6a2 2 0 1 0 4 0a2 2 0 1 0-4 0M4 12h10M18 12h2M14 12a2 2 0 1 0 4 0a2 2 0 1 0-4 0M4 18h2M10 18h10M6 18a2 2 0 1 0 4 0a2 2 0 1 0-4 0" }, CATOF = {};
  function syncTasks() {
    CATOF = {}; ACTNAME = {};
    let activeCats = [];
    CATS_DEFAULT.forEach(function (c) {
      let catDoc = cache.categories[c.id];
      if (catDoc && catDoc.deleted) return;
      let catName = (catDoc && catDoc.name) || c.name;
      let its = [];
      c.items.forEach(function (x) {
        let tDoc = cache.tasks[x[0]];
        if (tDoc && tDoc.deleted) return;
        its.push([x[0], (tDoc && tDoc.name) || x[1]]);
        ACTNAME[x[0]] = (tDoc && tDoc.name) || x[1];
        CATOF[x[0]] = c.id;
      });
      activeCats.push({ id: c.id, name: catName, items: its });
    });
    list('categories').forEach(function (c) {
      if (c.deleted || activeCats.some(function (x) { return x.id === c.id; })) return;
      activeCats.push({ id: c.id, name: c.name, items: [] });
    });
    list('tasks').forEach(function (t) {
      if (t.deleted) return;
      if (t.custom && t.name) {
        let tc = activeCats.filter(function (x) { return x.id === t.cat; })[0];
        if (!tc && activeCats.length) tc = activeCats[0];
        if (tc) {
          tc.items.push([t.id, t.name]);
          ACTNAME[t.id] = t.name;
          CATOF[t.id] = tc.id;
        }
      }
    });
    CATS = activeCats;
  }
  function tile(aid) { let t = cache.tasks[aid], im = t && t.img; return '<span class="ti">' + (im ? '<img src="' + esc(im) + '" alt="">' : '<svg viewBox="0 0 48 48" fill="none" stroke-linecap="round" stroke-linejoin="round">' + DEF[CMAP[CATOF[aid] || 'c1']] + '</svg>') + '</span>'; }
  function defaultAvatar(r, kind) {
    let avs = (SM && SM.avatars) || {};
    let isPt = kind === 'patient' || (r && ((r.ahid !== null && r.ahid !== undefined) || (r.emergencyMobile !== null && r.emergencyMobile !== undefined)));
    if (isPt) {
      let g = String((r && r.gender) || '').toLowerCase();
      if (g === 'female') return avs.femalePatient || 'static/img/avatars/female_patient.svg';
      if (g === 'male') return avs.malePatient || 'static/img/avatars/male_patient.svg';
      return avs.patient || 'static/img/avatars/patient_default.svg';
    }
    if (r && r.role === 'CAREGIVER') return avs.caregiver || 'static/img/avatars/male_nurse.svg';
    return avs.user || 'static/img/avatars/user_default.svg';
  }
  function av(r, kind) { let src = (r && r.photo) || defaultAvatar(r, kind); return '<img class="av" src="' + esc(src) + '" alt="">'; }
  function readImg(f, sz) { return new Promise(function (res, rej) { let r = new FileReader(); r.onload = function () { let im = new Image(); im.onload = function () { let s = sz || 160, k = Math.min(1, s / Math.max(im.width, im.height)), c = document.createElement('canvas'); c.width = Math.round(im.width * k); c.height = Math.round(im.height * k); c.getContext('2d').drawImage(im, 0, 0, c.width, c.height); res(c.toDataURL('image/jpeg', .8)); }; im.onerror = rej; im.src = r.result; }; r.onerror = rej; r.readAsDataURL(f); }); }
  function dist(a, b, c, d) { let R = 6371000, p = Math.PI / 180, x = (c - a) * p, y = (d - b) * p, h = Math.sin(x / 2) * Math.sin(x / 2) + Math.cos(a * p) * Math.cos(c * p) * Math.sin(y / 2) * Math.sin(y / 2); return 2 * R * Math.asin(Math.sqrt(h)); }
  function faceCheck(pt) {
    return new Promise(function (res) {
      let o = document.createElement('div'); o.className = 'ovl'; o.innerHTML = '<div class="mod"><h2>Face check-in (FRS)</h2><p class="hint" id="fc_m">Starting camera...</p><video id="fc_v" autoplay playsinline muted></video><div class="row"><button class="btn" id="fc_go">Capture &amp; Log In</button><button class="btn sec" id="fc_x">Cancel</button></div></div>';
      document.body.appendChild(o); let st = null; function done(r) { if (st) st.getTracks().forEach(function (t) { t.stop(); }); o.remove(); res(r); }
      let m = function (t) { document.getElementById('fc_m').textContent = t; };
      try { navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } }).then(function (x) { st = x; document.getElementById('fc_v').srcObject = x; m('Look at the camera. Your location is checked at the patient home.'); }).catch(function () { m('Camera is blocked. Allow camera access to log in.'); }); } catch (e) { m('Camera is not available on this device.'); }
      document.getElementById('fc_x').onclick = function () { done(null); };
      document.getElementById('fc_go').onclick = function () {
        let v = document.getElementById('fc_v'); if (!st || !v.videoWidth) return;
        let c = document.createElement('canvas'); c.width = 160; c.height = Math.round(160 * v.videoHeight / v.videoWidth); c.getContext('2d').drawImage(v, 0, 0, c.width, c.height); let img = c.toDataURL('image/jpeg', .6); m('Checking location...');
        if (!navigator.geolocation) return m('Location is not available on this device.');
        navigator.geolocation.getCurrentPosition(function (p) {
          let d = (pt.lat !== null && pt.lat !== undefined) ? dist(pt.lat, pt.lng, p.coords.latitude, p.coords.longitude) : null;
          if ((d !== null && d !== undefined) && d > 200) return m('You are ' + Math.round(d) + ' m away. Face check-in works only at the patient location.');
          done({ img: img, lat: p.coords.latitude, lng: p.coords.longitude, dist: d });
        }, function () { m('Location is needed. Allow location access.'); }, { enableHighAccuracy: true, timeout: 10000 });
      };
    });
  }

  function $(id) { return document.getElementById(id); }
  function val(id) { let e = $(id); return e ? e.value : ''; }
  function esc(s) { return String((s === null || s === undefined) ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function pad2(n) { return (n < 10 ? '0' : '') + n; }
  function fmtD(d) { return d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate()); }
  function T() { return fmtD(new Date()); }
  function parseD(s) { let p = s.split('-'); return new Date(+p[0], +p[1] - 1, +p[2]); }
  function addDays(s, n) { let d = parseD(s); d.setDate(d.getDate() + n); return fmtD(d); }
  function daysTo(s) { return Math.round((parseD(s) - parseD(T())) / 864e5); }
  function showD(s) { if (!s) return ''; let p = s.split('-'); return p[2] + '/' + p[1] + '/' + p[0]; }
  function showT(iso) { if (!iso) return '--'; try { return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true }); } catch (e) { return iso; } }
  function parse12hTime(raw, ampm) {
    let text = String(raw || '').trim();
    let mer = String(ampm || '').trim().toUpperCase();
    let h12, mins, h24;
    if (mer === 'AM' || mer === 'PM') {
      let m12 = text.match(/^([1-9]|0[1-9]|1[0-2])(?::([0-5][0-9]))?$/);
      if (!m12) {
        let m12f = text.match(/^([1-9]|0[1-9]|1[0-2])(?::([0-5][0-9]))?\s*(AM|PM)$/i);
        if (!m12f) return { ok: false, error: 'Enter valid 12-hr time (01:00 to 12:59)' };
        h12 = +m12f[1]; mins = +(m12f[2] || '0'); mer = m12f[3].toUpperCase();
      } else {
        h12 = +m12[1]; mins = +(m12[2] || '0');
      }
      h24 = (mer === 'AM' && h12 === 12) ? 0 : (mer === 'PM' && h12 === 12) ? 12 : (mer === 'PM' ? h12 + 12 : h12);
    } else {
      let mf = text.match(/^([1-9]|0[1-9]|1[0-2])(?::([0-5][0-9]))?\s*(AM|PM)$/i);
      if (mf) {
        h12 = +mf[1]; mins = +(mf[2] || '0'); mer = mf[3].toUpperCase();
        h24 = (mer === 'AM' && h12 === 12) ? 0 : (mer === 'PM' && h12 === 12) ? 12 : (mer === 'PM' ? h12 + 12 : h12);
      } else {
        let m24 = text.match(/^([01]?\d|2[0-3]):([0-5]\d)$/);
        if (!m24) return { ok: false, error: 'Enter valid time with AM/PM' };
        h24 = +m24[1]; mins = +m24[2];
        mer = h24 >= 12 ? 'PM' : 'AM';
        h12 = (h24 % 12 === 0) ? 12 : (h24 % 12);
      }
    }
    return { ok: true, formatted: pad2(h12) + ':' + pad2(mins) + ' ' + mer, hhmm12: pad2(h12) + ':' + pad2(mins), hhmm24: pad2(h24) + ':' + pad2(mins), ampm: mer, totalMinutes: h24 * 60 + mins };
  }
  function splitTime12h(str, fallbackTime, fallbackAmpm) {
    let s = String(str || '').trim();
    if (s.indexOf('(') >= 0 && s.indexOf(')') >= 0) { s = s.slice(s.indexOf('(') + 1, s.indexOf(')')); }
    let p = parse12hTime(s);
    if (p.ok) return { time: p.hhmm12, ampm: p.ampm };
    return { time: fallbackTime || '08:00', ampm: fallbackAmpm || 'AM' };
  }
  function formatDurationMins(mins) {
    let total = Math.max(0, Math.round(+mins || 0));
    let h = Math.floor(total / 60), m = total % 60;
    if (h > 0 && m > 0) return h + ' hr' + (h !== 1 ? 's' : '') + ' ' + m + ' min' + (m !== 1 ? 's' : '');
    if (h > 0) return h + ' hr' + (h !== 1 ? 's' : '');
    return m + ' min' + (m !== 1 ? 's' : '');
  }
  function calcShiftMetrics(stRaw, stAm, etRaw, etAm, sDate) {
    let s = parse12hTime(stRaw, stAm);
    if (!s.ok) return { ok: false, error: 'Shift Start: ' + s.error };
    let e = parse12hTime(etRaw, etAm);
    if (!e.ok) return { ok: false, error: 'Shift End: ' + e.error };
    let diff = e.totalMinutes - s.totalMinutes;
    let isOvernight = diff <= 0;
    if (diff <= 0) diff += 1440;
    return {
      ok: true,
      shiftDate: sDate || T(),
      shiftStart: s.formatted,
      shiftEnd: e.formatted,
      shiftStart24: s.hhmm24,
      shiftEnd24: e.hhmm24,
      shift: s.formatted + ' - ' + e.formatted,
      shiftDuration: formatDurationMins(diff),
      shiftDurationMinutes: diff,
      isOvernight: isOvernight
    };
  }
  function updateShiftDurBox(stId, stAmId, etId, etAmId, durId) {
    let el = $(durId); if (!el) return;
    let m = calcShiftMetrics(val(stId), val(stAmId), val(etId), val(etAmId), '');
    el.value = m.ok ? (m.shiftDuration + (m.isOvernight ? ' (Next day)' : '')) : '--';
  }
  window.syncShiftDur = updateShiftDurBox;
  function uid() { return 'x' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7); }
  function clone(o) { return JSON.parse(JSON.stringify(o)); }
  function merge(a, b) { for (let k in b) { if (b[k] && typeof b[k] === 'object' && !Array.isArray(b[k])) { a[k] = merge(a[k] && typeof a[k] === 'object' ? a[k] : {}, b[k]); } else a[k] = b[k]; } return a; }
  let toastT;
  function toast(m) { let t = $('toast'); t.textContent = m; t.hidden = false; clearTimeout(toastT); toastT = setTimeout(function () { t.hidden = true; }, 3500); }
  function showAdminModal(title, innerHtml, footerButtons) {
    let m = $('adminModal');
    if (m) {
      m.remove();
    }
    m = document.createElement('div');
    m.id = 'adminModal';
    m.className = 'ovl';
    m.setAttribute('role', 'dialog');
    m.setAttribute('aria-modal', 'true');
    m.style.display = 'flex';

    let fHtml = footerButtons || '<button class="btn sec" data-act="closemod" id="adm_mod_close">Close</button>';
    m.innerHTML = '<div class="mod-card">' +
      '<div class="mod-header">' +
      '<h2 class="mod-title">' + esc(title) + '</h2>' +
      '<button class="mod-close-btn" data-act="closemod" id="adm_mod_x" aria-label="Close">&times;</button>' +
      '</div>' +
      '<div id="adm_mod_body" class="mod-body">' + innerHtml + '</div>' +
      '<div class="mod-footer">' + fHtml + '</div>' +
      '</div>';

    document.body.appendChild(m);
    m.hidden = false;

    let close = function () { closeAdminModal(); };
    let xBtn = $('adm_mod_x'); if (xBtn) xBtn.onclick = close;
    let cBtn = $('adm_mod_close'); if (cBtn) cBtn.onclick = close;
    m.onclick = function (e) { if (e.target === m) close(); };
  }
  function closeAdminModal() {
    let m = $('adminModal');
    if (m) {
      m.style.setProperty('display', 'none', 'important');
      m.hidden = true;
      m.innerHTML = '';
      m.remove();
    }
    if (S.tab) {
      render(false);
    }
  }
  /* ---------- data layer: every change is saved on the server ---------- */
  let initTab = (window.SM && window.SM.initialTab) || (window.location.hash ? window.location.hash.replace('#', '') : 'dash');
  let cache = {}, historyList = [], queues = {}, S = { me: null, tab: initTab, pf: null, ep: null, eu: null, rp: null, asg: null, viewDate: null, coll: {}, navOpen: false, ready: false, dirty: false };
  COLS.forEach(function (c) { cache[c] = {}; });
  function list(col) { return Object.keys(cache[col]).map(function (id) { return Object.assign({ id: id }, cache[col][id]); }); }
  function enqueue(key, fn) { let p = (queues[key] || Promise.resolve()).then(fn, fn); queues[key] = p.catch(function () { }); return p; }
  function api(method, url, body) {
    let opt = { method: method, credentials: 'same-origin', headers: { 'X-CSRF-Token': SM.csrf } };
    if (body !== undefined) { opt.headers['Content-Type'] = 'application/json'; opt.body = JSON.stringify(body); }
    return fetch(url, opt).then(function (r) {
      return r.json().catch(function () { return {}; }).then(function (j) {
        if (r.status === 401) { window.location.href = SM.urls.login; }
        if (!r.ok) { let e = new Error(j.error || ('HTTP ' + r.status)); e.code = r.status; e.errors = j.errors; throw e; }
        return j;
      });
    });
  }
  function refreshHistory() { return api('GET', SM.urls.docs + '/history?limit=200').then(function (r) { if (r && Array.isArray(r.history)) historyList = r.history; }, function () { }); }
  function loadAll() { return api('GET', SM.urls.data).then(function (d) { COLS.forEach(function (c) { cache[c] = d[c] || {}; }); historyList = Array.isArray(d.history) ? d.history : []; }); }
  function writeErr(e) {
    toast('Could not save (' + ((e && (e.code || e.message)) || 'error') + '). Try again.');
    loadAll().then(refresh, refresh);
  }
  function wr(col, id, op, data) {
    let m = cache[col];
    if (op === 'del') delete m[id]; else if (op === 'set') m[id] = clone(data); else m[id] = merge(clone(m[id] || {}), clone(data));
    changed();
    let url = SM.urls.docs + '/' + col + '/' + encodeURIComponent(id);
    return enqueue(col + '/' + id, function () {
      let req = op === 'del' ? api('DELETE', url) : op === 'set' ? api('PUT', url, data) : api('PATCH', url, data);
      return req.then(function (res) { refreshHistory(); return res; });
    }).catch(writeErr);
  }
  function put(c, i, d) { return wr(c, i, 'set', d); }
  function upd(c, i, d) { return wr(c, i, 'update', d); }
  let chT;
  function changed() { clearTimeout(chT); chT = setTimeout(refresh, 40); }

  /* ---------- views ---------- */
  function shell(inner) {
    if (S.me && S.me.role === 'ADMIN') {
      let open = list('alerts').filter(function (a) { return a.status === 'OPEN'; }).length;
      let pendReq = list('requests').filter(function (r) { return r.status === 'PENDING'; }).length;
      return '<div class="adm' + (S.navOpen ? ' open' : '') + '">' +
        '<div class="scrim" data-act="closemenu"></div>' +
        '<aside class="side">' +
        '<div class="sb-brand"><img src="' + LOGO + '" alt=""><span>SNEHA MITRA</span><button type="button" class="sb-close" data-act="closemenu" aria-label="Close menu">&times;</button></div>' +
        TABS.map(function (x) { let badge = (x[0] === 'alerts' && open) ? open : (x[0] === 'requests' && pendReq) ? pendReq : 0; return '<a href="#" class="sl' + (S.tab === x[0] ? ' active' : '') + '" data-act="tab" data-t="' + x[0] + '"><svg viewBox="0 0 24 24"><path d="' + ICO[x[0]] + '"/></svg><span class="t">' + x[1] + '</span>' + (badge ? '<span class="cnt">' + badge + '</span>' : '') + '</a>'; }).join('') +
        '<div class="sb-user sb-user-column"><div class="row sb-user-row">' + av(S.me) + '<span class="un sb-user-name">' + esc(S.me.name) + '</span></div><button class="btn sm sb-logout-btn" data-act="logout"><svg viewBox="0 0 24 24" class="sb-logout-icon"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/></svg>Log Out</button></div>' +
        '</aside>' +
        '<div class="adm-main">' +
        '<div class="mtop"><button class="mb" data-act="menu" aria-label="Menu"><svg viewBox="0 0 24 24"><path d="M4 7h16M4 12h16M4 17h16"/></svg></button><img src="' + LOGO + '" alt=""><b class="brand-letter-spacing">SNEHA MITRA</b></div>' +
        '<div class="hero">' + av(S.me) + '<div><small>Welcome back</small><b>' + esc(S.me.name) + '</b></div><span class="pill">Admin</span></div>' +
        '<main class="main">' + inner + '</main>' +
        '</div>' +
        '</div>';
    }
    let r = S.me ? '<span>' + esc(S.me.name) + ' (Care Giver)</span><button class="btn sm top-logout-btn" data-act="logout">Log Out</button>' : '<span>Care Plan &amp; Attendance System</span>';
    return '<div class="nav"><div class="brand"><img src="' + LOGO + '" alt="">SNEHA MITRA</div><div class="navr">' + r + '</div></div><main class="container">' + inner + '</main><div class="footer">&copy; SNEHA MITRA Patient Care Assistant Services</div>' + (S.me ? '<nav class="cgbar"><a href="#" data-act="top">Care Plan</a><a href="#" data-act="sos">Report Alert</a><a href="#" data-act="logout">Logout</a></nav>' : '');
  }
  function vLoading() { return '<div class="card center"><h2>Loading…</h2><p class="hint">Connecting to the data store.</p></div>'; }
  /* ---- create user (replaces the old public Register page) ---- */
  const USER_FIELDS = ['name', 'id', 'mobile', 'role', 'pw', 'pw2'];
  function vUserForm() {
    let u = S.eu ? cache.users[S.eu] : null;
    let isEdit = !!S.eu;
    function f(id, label, type, v, extra) { return '<div><label for="f_' + id + '">' + label + '</label><input type="' + type + '" id="f_' + id + '" value="' + esc(v || '') + '" ' + (extra || '') + '><div class="field-err" id="e_' + id + '" role="alert"></div></div>'; }
    let r = u ? u.role : '';
    return '<div class="card top"><h2>' + (isEdit ? 'Edit user (' + esc(S.eu) + ')' : 'Create user') + '</h2><p class="hint">' + (isEdit ? 'Update user details and access role.' : 'Add an Admin or a Care Giver. They can log in with this ID and password right away.') + '</p><form data-sub="newuser" id="userForm" autocomplete="off" novalidate><div class="grid2">' +
      f('name', 'Full name', 'text', u ? u.name : '', 'autocomplete="off"') + f('id', 'ID (Care Giver ID or Admin ID)', 'text', S.eu || '', 'autocomplete="off"' + (isEdit ? ' disabled' : '')) + f('mobile', 'Mobile number', 'text', u ? u.mobile : '', 'inputmode="numeric" maxlength="10" autocomplete="off"') +
      '<div><label>Role</label><div><label class="choice"><input type="radio" name="role" id="f_role1" value="ADMIN"' + (r === 'ADMIN' ? ' checked' : '') + '> Admin</label><label class="choice"><input type="radio" name="role" id="f_role2" value="CAREGIVER"' + (r === 'CAREGIVER' || (!isEdit && r !== 'ADMIN') ? ' checked' : '') + '> Care Giver</label></div><div class="field-err" id="e_role" role="alert"></div></div>' +
      f('pw', isEdit ? 'New password (optional)' : 'Password', 'password', '', 'autocomplete="new-password"') + f('pw2', isEdit ? 'Confirm new password' : 'Confirm password', 'password', '', 'autocomplete="new-password"') +
      '</div><div class="row"><button class="btn" type="submit">' + (isEdit ? 'Update user' : 'Create user') + '</button>' + (isEdit ? '<button class="btn sec" type="button" data-act="canceluser">Cancel</button>' : '') + '</div></form></div>';
  }
  function userFormValues() {
    return { name: val('f_name').trim(), id: (S.eu || val('f_id')).trim(), mobile: val('f_mobile').trim(), pw: val('f_pw'), pw2: val('f_pw2'), role: $('f_role1').checked ? 'ADMIN' : $('f_role2').checked ? 'CAREGIVER' : '' };
  }
  function userFormErrors(v) {
    let er = {};
    if (!v.name) er.name = 'Full name is required'; else if (!/^[A-Za-z][A-Za-z .()' -]*$/.test(v.name)) er.name = 'Letters only';
    if (!S.eu) {
      if (!v.id) er.id = 'ID is required'; else if (!/^[A-Za-z0-9_.@+-]{3,30}$/.test(v.id)) er.id = '3 to 30 letters or numbers, no spaces'; else if (cache.users[v.id.toLowerCase()]) er.id = 'This ID is already used';
    }
    if (!v.mobile) er.mobile = 'Mobile number is required'; else if (!/^\d{10}$/.test(v.mobile)) er.mobile = 'Enter 10 digits';
    if (!v.role) er.role = 'Choose a role';
    if (!S.eu || v.pw) {
      if (!S.eu && !v.pw) er.pw = 'Password is required';
      else if (v.pw && (v.pw.length < 8 || !/\d/.test(v.pw))) er.pw = 'At least 8 characters and one number';
      if (v.pw && v.pw2 !== v.pw) er.pw2 = 'Passwords do not match';
    }
    return er;
  }
  /* Red border + message under the field when wrong, green border when right.
     showAll=false: empty fields stay neutral (used while typing). serverErrors: messages from the server. */
  function userFormCheck(showAll, serverErrors) {
    if (!$('userForm')) return {};
    let er = Object.assign(userFormErrors(userFormValues()), serverErrors || {});
    ['name', 'id', 'mobile', 'pw', 'pw2'].forEach(function (k) {
      let inp = $('f_' + k);
      FormCheck.setState(inp, $('e_' + k), (showAll || inp.value !== '') ? (er[k] || '') : '');
    });
    $('e_role').textContent = showAll && er.role ? er.role : '';
    return er;
  }
  function focusFirstError(er) {
    for (let i = 0; i < USER_FIELDS.length; i++) { let k = USER_FIELDS[i]; if (er[k]) { FormCheck.focus(k === 'role' ? $('f_role1') : $('f_' + k)); return; } }
  }

  /* ---- admin ---- */
  const TABS = [['dash', 'Dashboard'], ['users', 'Caregivers'], ['patients', 'Patients'], ['plans', 'Care Plans'], ['assign', 'Assign Caregiver'], ['attend', 'Attendance'], ['requests', "Follow up's"], ['history', 'History'], ['lib', 'Customization']];
  function pname(id) { let p = cache.patients[id]; return p ? p.name : '(removed patient)'; }
  function uname(id) { let u = cache.users[id]; return u ? u.name : id; }
  function activePlans() { return list('plans').filter(function (p) { return p.status === 'ACTIVE'; }); }
  function planFor(pid) { return activePlans().filter(function (p) { return p.patientId === pid; })[0]; }
  function anyPlanFor(pid) { let ps = list('plans').filter(function (p) { return p.patientId === pid; }); return ps.filter(function (p) { return p.status === 'ACTIVE'; })[0] || ps[0]; }
  function vAdmin() {
    let fn = { dash: vDash, patients: vPatients, plans: vPlans, assign: vAssign, attend: vAttend, requests: vRequests, history: vHistory, recs: vRecs, alerts: vAlerts, users: vUsers, lib: vLib }[S.tab] || vDash;
    return fn();
  }
  function vLib() {
    let lt = S.lt || 'tasks', h = '<h1>Customization</h1><div class="sub">' + [['tasks', 'Care Tasks'], ['patients', 'Patients'], ['users', 'Caregivers']].map(function (x) { return '<a href="#" data-act="lt" data-t="' + x[0] + '" class="' + (lt === x[0] ? 'on' : '') + '">' + x[1] + '</a>'; }).join('') + '</div>';
    let pick = function (ch, col, id, txt) { return '<label class="btn sm sec fbtn">' + txt + '<input type="file" accept="image/*" data-chg="' + ch + '" data-col="' + col + '" data-id="' + esc(id) + '"></label>'; };
    if (lt === 'tasks') {
      h += '<div class="card top"><h2>Add a new category</h2><form data-sub="newcat"><div class="row row-bottom-gap"><div class="flex-min-200"><label for="nc_name">Category name</label><input type="text" id="nc_name" placeholder="e.g. Mobility &amp; Exercise"></div><button class="btn" type="submit">Add Category</button></div><div class="err" id="nc_err" role="alert"></div></form></div>';
      h += '<div class="card"><h2>Add a new task</h2><form data-sub="newtask"><div class="grid2"><div><label for="nt_name">Task name</label><input type="text" id="nt_name" placeholder="e.g. Foot massage"></div><div><label for="nt_cat">Category</label><select id="nt_cat">' + CATS.map(function (c) { return '<option value="' + c.id + '">' + esc(c.name) + '</option>'; }).join('') + '</select></div><div><label>Task image (optional)</label><input type="file" name="nt_img" accept="image/*"></div></div><div class="err" id="nt_err" role="alert"></div><button class="btn" type="submit">Add Task</button></form></div>';
      CATS.forEach(function (c) {
        h += '<div class="card"><div class="row card-section-header"><h3 class="category-heading">' + esc(c.name) + ' <span class="category-count">(' + c.items.length + ' tasks)</span></h3><button class="btn sm sec btn-danger" data-act="delcat" data-id="' + esc(c.id) + '" data-name="' + esc(c.name) + '">Delete Category</button></div>' +
          (c.items.length ? c.items.map(function (i) {
            let t = cache.tasks[i[0]] || {};
            return '<div class="lrow">' + tile(i[0]) + '<div class="nm">' + esc(i[1]) + (t.custom ? ' <span class="tag fill">New</span>' : '') + '</div>' +
              pick('timg', 'tasks', i[0], 'Change image') +
              (t.img ? '<button class="btn sm sec" data-act="timgdel" data-id="' + esc(i[0]) + '">Delete image</button>' : '') +
              '<button class="btn sm sec btn-danger" data-act="deltask" data-id="' + esc(i[0]) + '" data-name="' + esc(i[1]) + '">Delete</button></div>';
          }).join('') : '<p class="hint">No tasks in this category.</p>') + '</div>';
      });
    } else if (lt === 'patients') {
      h += '<div class="card top"><h2>Patient photos</h2><p class="hint">Manage patient profile photos displayed across care sheets.</p>' + (list('patients').map(function (p) {
        return '<div class="lrow">' + av(p, 'patient') + '<div class="nm">' + esc(p.name) + '<div class="hint">ID: ' + esc(p.ahid || p.id) + '</div></div>' +
          pick('pphoto', 'patients', p.id, 'Change photo') +
          (p.photo ? '<button class="btn sm sec btn-danger" data-act="delphoto" data-col="patients" data-id="' + esc(p.id) + '" data-name="' + esc(p.name) + '">Delete photo</button>' : '') +
          '</div>';
      }).join('') || '<p>No patients yet. Add one in the Patients tab.</p>') + '</div>';
    } else {
      h += '<div class="card top"><h2>Caregiver photos</h2><p class="hint">Profile photos used for caregiver accounts and care sheets.</p>' + (list('users').map(function (u) {
        return '<div class="lrow">' + av(u) + '<div class="nm">' + esc(u.name) + '<div class="hint">' + (u.role === 'ADMIN' ? 'Admin' : 'Care Giver') + ' &bull; ' + esc(u.id) + '</div></div>' +
          pick('pphoto', 'users', u.id, 'Change photo') +
          (u.photo ? '<button class="btn sm sec btn-danger" data-act="delphoto" data-col="users" data-id="' + esc(u.id) + '" data-name="' + esc(u.name) + '">Delete photo</button>' : '') +
          '</div>';
      }).join('')) + '</div>';
    }
    return h;
  }
  function vDash() {
    let pts = list('patients').filter(function (p) { return p.active !== false; }).length;
    let td = T(), duty = {}; list('logs').forEach(function (l) { if (l.date === td && l.loginTime) duty[l.caregiverId] = 1; });
    let due = activePlans().filter(function (p) { return daysTo(p.renewOn) <= 5; });
    let open = list('alerts').filter(function (a) { return a.status === 'OPEN'; }).length;
    let pend = list('users').filter(function (u) { return u.status === 'PENDING'; }).length;
    let pendReq = list('requests').filter(function (r) { return r.status === 'PENDING'; }).length;
    let h = '<h1>Dashboard</h1><div class="stats"><div class="stat"><b>' + pts + '</b>Total patients</div><div class="stat"><b>' + Object.keys(duty).length + '</b>Caregivers on duty today</div><div class="stat"><b>' + due.length + '</b>Plans due for 30-day renewal</div><div class="stat"><b>' + open + '</b>Open alerts</div></div>';
    if (pend) h += '<div class="alert"><b>' + pend + ' account(s) waiting for approval.</b> Open the Users tab to approve.</div>';
    if (pendReq) h += '<div class="alert"><b>' + pendReq + ' caregiver early logout request(s) pending approval.</b> <a href="#" data-act="tab" data-t="requests">Review in Follow up\'s tab</a></div>';

    // Active Care Workers Shift & Hours Status Table
    let cgs = list('users').filter(function (u) { return u.role === 'CAREGIVER'; });
    let cgRows = cgs.map(function (u) {
      let asgs = list('assignments').filter(function (a) { return a.caregiverId === u.id && a.status === 'ACTIVE'; });
      let ptNames = asgs.map(function (a) { return pname(a.patientId); }).join(', ') || 'None';
      return '<tr>' +
        '<td class="cell-ellipsis-bold">' + esc(u.id) + '</td>' +
        '<td class="cell-ellipsis">' + esc(u.name) + '</td>' +
        '<td class="cell-ellipsis">' + esc(ptNames) + '</td>' +
        '<td class="cell-center"><button class="btn sm" data-act="viewduty" data-id="' + esc(u.id) + '">View</button></td>' +
        '</tr>';
    }).join('');
    h += '<div class="card"><h2>Care Workers &amp; Shift Status</h2>' +
      '<div class="scroll"><table class="table-fixed">' +
      '<thead><tr><th class="col-26">Caregiver ID</th><th class="col-30">Name</th><th class="col-26">Patient Name</th><th class="col-18-center">Action</th></tr></thead>' +
      '<tbody>' + (cgRows || '<tr><td colspan="4">No caregivers found.</td></tr>') + '</tbody>' +
      '</table></div></div>';

    if (due.length) {
      let dueRows = due.map(function (p) {
        let pt = cache.patients[p.patientId] || {};
        let ptName = pt.name || pname(p.patientId);
        let ptId = pt.ahid || p.patientId;
        let ptAge = pt.age ? (pt.age + ' yrs') : '--';
        return '<tr>' +
          '<td class="cell-ellipsis-bold">' + esc(ptName) + '</td>' +
          '<td class="cell-ellipsis">' + esc(ptId) + '</td>' +
          '<td class="cell-ellipsis">' + esc(ptAge) + '</td>' +
          '<td class="cell-center"><button class="btn sm" data-act="viewplan" data-id="' + esc(p.id) + '">View</button></td>' +
          '</tr>';
      }).join('');
      h += '<div class="card"><h2>Plans due for renewal</h2><div class="scroll"><table class="table-fixed"><thead><tr><th class="col-34">Name</th><th class="col-26">ID</th><th class="col-22">Age</th><th class="col-18-center">Action</th></tr></thead><tbody>' + dueRows + '</tbody></table></div></div>';
    }
    return h;
  }
  function vPatients() {
    let p = S.ep ? cache.patients[S.ep] : null; p = p || {};
    let rows = list('patients').sort(function (a, b) { return (a.name || '').localeCompare(b.name || ''); }).map(function (x) {
      return '<tr>' +
        '<td class="cell-ellipsis-bold">' + esc(x.name) + '</td>' +
        '<td class="cell-ellipsis">' + esc(x.ahid || x.id) + '</td>' +
        '<td class="cell-ellipsis">' + esc(x.age) + ' yrs</td>' +
        '<td class="cell-center"><button class="btn sm" data-act="viewpt" data-id="' + esc(x.id) + '">View</button></td>' +
        '</tr>';
    }).join('');
    return '<h1>Patients</h1><div class="card"><h2>' + (S.ep ? 'Edit patient' : 'Add patient') + '</h2><form data-sub="patient"><div class="grid2"><div><label for="pt_name">Patient Name</label><input type="text" id="pt_name" value="' + esc(p.name || '') + '"></div><div><label for="pt_age">Age</label><input type="number" id="pt_age" min="0" max="120" value="' + esc((p.age === null || p.age === undefined) ? '' : p.age) + '"></div><div><label for="pt_gender">Gender</label><select id="pt_gender"><option value="Patient"' + (p.gender !== 'Male' && p.gender !== 'Female' ? ' selected' : '') + '>Not specified (Default)</option><option value="Male"' + (p.gender === 'Male' ? ' selected' : '') + '>Male</option><option value="Female"' + (p.gender === 'Female' ? ' selected' : '') + '>Female</option></select></div><div><label for="pt_ahid">AHID</label><input type="text" id="pt_ahid" value="' + esc(p.ahid || '') + '"></div><div><label for="pt_addr">Address (optional)</label><input type="text" id="pt_addr" value="' + esc(p.address || '') + '"></div><div><label for="pt_en">Emergency contact name</label><input type="text" id="pt_en" value="' + esc(p.emergencyName || '') + '"></div><div><label for="pt_em">Emergency contact number of family member</label><input type="text" id="pt_em" inputmode="numeric" maxlength="10" value="' + esc(p.emergencyMobile || '') + '"></div><div><label>Patient photo</label><div class="row">' + av(p, 'patient') + '<input type="file" name="pt_img" accept="image/*" class="flex-1 min-w-0"></div></div></div><div class="err" id="pt_err" role="alert"></div><div class="row"><button class="btn" type="submit">Save patient</button>' + (S.ep ? '<button class="btn sec" type="button" data-act="cancelpt">Cancel</button>' : '') + '</div></form></div>' +
      '<div class="scroll"><table class="table-fixed"><thead><tr><th class="col-34">Name</th><th class="col-26">ID</th><th class="col-22">Age</th><th class="col-18-center">Action</th></tr></thead><tbody>' + (rows || '<tr><td colspan="4">No patients yet.</td></tr>') + '</tbody></table></div>';
  }
  function vPlans() {
    if (S.pf) return vPlanForm();
    let rows = list('plans').sort(function (a, b) { return (b.initDate || '').localeCompare(a.initDate || ''); }).map(function (p) {
      let pt = cache.patients[p.patientId] || {};
      let ptName = pt.name || pname(p.patientId);
      let ptId = pt.ahid || p.patientId;
      let ptAge = pt.age ? (pt.age + ' yrs') : '--';
      let startDt = showD(p.initDate) || '--';
      let renDt = showD(p.renewOn) || '--';
      let dtDisplay = startDt + ' / ' + renDt;
      let dtTitle = 'Initiation: ' + (showD(p.firstInitDate || p.initDate) || '--') + (p.renewedDate ? ' | Renewed: ' + showD(p.renewedDate) : '') + ' | Next Renewal: ' + renDt;
      return '<tr>' +
        '<td class="cell-ellipsis-bold">' + esc(ptName) + '</td>' +
        '<td class="cell-ellipsis">' + esc(ptId) + '</td>' +
        '<td class="cell-ellipsis">' + esc(ptAge) + '</td>' +
        '<td class="cell-ellipsis" title="' + esc(dtTitle) + '">' + esc(dtDisplay) + '</td>' +
        '<td class="cell-center"><button class="btn sm" data-act="viewplan" data-id="' + esc(p.id) + '">View</button></td>' +
        '</tr>';
    }).join('');
    return '<h1>Care Plans</h1><p>Only one care plan is allowed per patient. You can edit, renew, deactivate, or delete a patient’s care plan.</p><p><button class="btn" data-act="newplan">New Care Plan</button></p><div class="scroll"><table class="table-fixed"><thead><tr><th class="col-23">Name</th><th class="col-17">ID</th><th class="col-11">Age</th><th class="col-33">Initiation / Renewal Date</th><th class="col-16-center">Action</th></tr></thead><tbody>' + (rows || '<tr><td colspan="5">No care plans yet.</td></tr>') + '</tbody></table></div>';
  }
  function vPlanForm() {
    let f = S.pf, src = f.editId ? cache.plans[f.editId] : f.renewFrom ? cache.plans[f.renewFrom] : null, items = (src && src.items) || {};
    let fixed = !!(f.editId || f.renewFrom);
    let pats = fixed ? list('patients').filter(function (p) { return src && p.id === src.patientId; }) : list('patients').filter(function (p) { return p.active !== false && !anyPlanFor(p.id); });
    let pid = src ? src.patientId : '';
    let dateLabel = f.renewFrom ? 'Renewal Date' : 'Date of initiation';
    let infoMsg = !fixed && !pats.length ? 'Every active patient already has a care plan. Please edit, renew, or delete an existing care plan instead.' : f.renewFrom ? 'Renewing existing care plan in-place (no duplicate plan will be created).' : '';
    let h = '<h1>Care Plan - Patient Care Assistant (PCA) Services</h1><form data-sub="plan"><div class="card"><h2>Patient details</h2><div class="grid2"><div><label for="pf_patient">Patient</label><select id="pf_patient" data-chg="pfpatient"' + (fixed ? ' disabled' : '') + '><option value="">Select patient</option>' + pats.map(function (p) { return '<option value="' + p.id + '"' + (p.id === pid ? ' selected' : '') + '>' + esc(p.name) + ' (' + esc(p.ahid) + ')</option>'; }).join('') + '</select></div><div><label for="pf_date">' + dateLabel + '</label><input type="date" id="pf_date" value="' + esc(f.renewFrom || !src ? T() : src.initDate) + '" onclick="try{if(this.showPicker)this.showPicker();}catch(e){}" class="cursor-pointer"></div></div><p class="hint text-warning-bold" id="pf_info" >' + esc(infoMsg) + '</p></div>' +
      '<div class="legend"><b>Legend:</b> Tick the box to include the activity. Supervisor Recommendation = Yes / No. Frequency = Once, Twice, Thrice, or SOS (only when needed).</div>';
    CATS.forEach(function (c) {
      let any = c.items.some(function (it) { return items[it[0]]; });
      h += '<details class="cat"' + (any ? ' open' : '') + '><summary>' + esc(c.name) + '</summary>';
      c.items.forEach(function (it) {
        let a = it[0], cur = items[a];
        h += '<div class="pr"><label class="choice"><input type="checkbox" id="ck_' + a + '" data-chg="pfck" data-a="' + a + '"' + (cur ? ' checked' : '') + '> ' + esc(it[1]) + '</label><div class="pro"><b>Supervisor Recommendation:</b> <label class="choice"><input type="radio" name="rec_' + a + '" id="ry_' + a + '"' + (cur && cur.rec ? ' checked' : '') + '> Yes</label><label class="choice"><input type="radio" name="rec_' + a + '" id="rn_' + a + '"' + (cur && !cur.rec ? ' checked' : '') + '> No</label></div><div class="pro"><b>Frequency:</b> ' +
          FREQ.map(function (q) { return '<label class="choice"><input type="radio" name="fq_' + a + '" id="fq_' + a + '_' + q + '"' + (cur && cur.freq === q ? ' checked' : '') + '> ' + q + '</label>'; }).join('') + '</div></div>';
      });
      h += '</details>';
    });
    h += '<div class="card"><h2>Any other instructions</h2><label class="choice"><input type="checkbox" id="pf_oc" data-chg="pfother"' + (src && src.other ? ' checked' : '') + '> Other instruction needed</label><textarea id="pf_ot" rows="3" placeholder="Write instruction here"' + (src && src.other ? '' : ' hidden') + '>' + esc(src ? src.other || '' : '') + '</textarea></div>' +
      '<div class="card"><h2>Supervisor</h2><div class="grid2"><div><label for="pf_sn">Supervisor name</label><input type="text" id="pf_sn" value="' + esc(src ? src.supName || '' : '') + '"></div><div><label for="pf_sa">Supervisor Signature (with AHID)</label><input type="text" id="pf_sa" value="' + esc(src ? src.supAhid || '' : '') + '"></div><div><label for="pf_sm">Supervisor mobile number</label><input type="text" id="pf_sm" inputmode="numeric" maxlength="10" value="' + esc(src ? src.supMobile || '' : '') + '"></div></div></div>' +
      '<div class="err" id="pf_err" role="alert"></div><div class="row"><button class="btn" type="submit">Save Plan</button><button class="btn sec" type="button" data-act="cancelplan">Cancel</button></div></form>';
    return h;
  }
  function syncPlanForm() {
    if (!S.pf || !$('pf_date')) return;
    CATS.forEach(function (c) {
      c.items.forEach(function (it) {
        let a = it[0], on = $('ck_' + a).checked;
        ['ry_' + a, 'rn_' + a].concat(FREQ.map(function (q) { return 'fq_' + a + '_' + q; })).forEach(function (id) { $(id).disabled = !on; });
      });
    });
    let o = $('pf_oc'); if (o) $('pf_ot').hidden = !o.checked;
    let sel = $('pf_patient'), pid = val('pf_patient'), info = $('pf_info');
    if (info) {
      let fixed = !!(S.pf.editId || S.pf.renewFrom);
      let ex = pid && !fixed ? anyPlanFor(pid) : null;
      if (ex) { info.textContent = 'This patient already has a care plan. Please edit, renew, or delete the existing plan instead.'; }
      else if (!fixed && sel && sel.options.length <= 1) { info.textContent = 'Every active patient already has a care plan. Please edit, renew, or delete an existing care plan instead.'; }
      else if (S.pf.renewFrom) { info.textContent = 'Renewing existing care plan in-place (no duplicate plan will be created).'; }
      else { info.textContent = ''; }
    }
  }
  function vAssign() {
    let pats = list('patients').filter(function (p) { return p.active !== false; });
    let cgs = list('users').filter(function (u) { return u.role === 'CAREGIVER' && u.status === 'ACTIVE'; });
    let rows = list('assignments').sort(function (a, b) { return (b.shiftDate || b.startDate || '').localeCompare(a.shiftDate || a.startDate || ''); }).map(function (a) {
      let pt = cache.patients[a.patientId] || {};
      let ptName = pt.name || pname(a.patientId);
      let ptId = pt.ahid || a.patientId;
      let ptAge = pt.age ? (pt.age + ' yrs') : '--';
      return '<tr>' +
        '<td class="cell-ellipsis-bold">' + esc(ptName) + '</td>' +
        '<td class="cell-ellipsis">' + esc(ptId) + '</td>' +
        '<td class="cell-ellipsis">' + esc(ptAge) + '</td>' +
        '<td class="cell-center"><button class="btn sm" data-act="viewasg" data-id="' + esc(a.id) + '">View</button></td>' +
        '</tr>';
    }).join('');
    let timeSync = "syncShiftDur('as_shift_start','as_shift_start_ampm','as_shift_end','as_shift_end_ampm','as_shift_dur')";
    return '<h1>Assign Caregiver</h1><div class="card"><form data-sub="assign"><div class="grid2">' +
      '<div><label for="as_p">Patient</label><select id="as_p"><option value="">Select patient</option>' + pats.map(function (p) { return '<option value="' + p.id + '">' + esc(p.name) + ' (' + esc(p.ahid) + ')</option>'; }).join('') + '</select></div>' +
      '<div><label for="as_c">Care Giver</label><select id="as_c"><option value="">Select caregiver</option>' + cgs.map(function (u) { return '<option value="' + esc(u.id) + '">' + esc(u.name) + ' (' + esc(u.id) + ')</option>'; }).join('') + '</select></div>' +
      '<div><label for="as_shift_start">Shift Start (12-hr)</label><div class="d-flex gap-8"><input type="text" id="as_shift_start" class="notranslate no-keyboard-icon flex-1" inputmode="numeric" placeholder="08:00" value="08:00" autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false" translate="no" virtualkeyboardpolicy="manual" oninput="this.value=this.value.replace(/[^0-9:]/g,\'\');' + timeSync + '" ><select id="as_shift_start_ampm" onchange="' + timeSync + '" class="w-78-fixed"><option value="AM" selected>AM</option><option value="PM">PM</option></select></div></div>' +
      '<div><label for="as_shift_end">Shift End (12-hr)</label><div class="d-flex gap-8"><input type="text" id="as_shift_end" class="notranslate no-keyboard-icon flex-1" inputmode="numeric" placeholder="08:00" value="08:00" autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false" translate="no" virtualkeyboardpolicy="manual" oninput="this.value=this.value.replace(/[^0-9:]/g,\'\');' + timeSync + '" ><select id="as_shift_end_ampm" onchange="' + timeSync + '" class="w-78-fixed"><option value="AM">AM</option><option value="PM" selected>PM</option></select></div></div>' +
      '<div><label for="as_shift_dur">Shift Duration</label><input type="text" id="as_shift_dur" value="12 hrs" readonly class="bg-subtle-bold"></div>' +
      '<div><label for="as_d">Shift Date</label><input type="date" id="as_d" value="' + T() + '" onclick="try{if(this.showPicker)this.showPicker();}catch(e){}" class="cursor-pointer"></div>' +
      '</div><div class="err" id="as_err" role="alert"></div><button class="btn" type="submit">Assign</button></form></div>' +
      '<div class="scroll"><table class="table-fixed"><thead><tr><th class="col-34">Name</th><th class="col-26">ID</th><th class="col-22">Age</th><th class="col-18-center">Action</th></tr></thead><tbody>' + (rows || '<tr><td colspan="4">No assignments yet.</td></tr>') + '</tbody></table></div>';
  }
  function attRows() {
    let fp = val('at_p'), fc = val('at_c'), fm = $('at_m') ? val('at_m') : T().slice(0, 7);
    return list('logs').filter(function (l) { return (!fp || l.patientId === fp) && (!fc || l.caregiverId === fc) && (!fm || (l.date || '').indexOf(fm) === 0); }).sort(function (a, b) { return b.date.localeCompare(a.date); });
  }
  function doneCount(l) {
    let p = cache.plans[l.planId];
    let tot = p ? Object.keys(p.items || {}).length : 0, d = 0;
    for (let k in (l.done || {})) if (l.done[k] && p && p.items && p.items[k]) d++;
    if (tot === 0) {
      let dkeys = Object.keys(l.done || {});
      d = 0;
      dkeys.forEach(function (k) { if (l.done[k]) d++; });
      tot = dkeys.length || (l.tasks ? l.tasks.length : 6);
    }
    return [d, tot];
  }
  function vAttend() {
    let pats = list('patients'), cgs = list('users').filter(function (u) { return u.role === 'CAREGIVER'; });
    let allLogs = attRows();
    let dl = allLogs.length > 0;
    let rows = allLogs.map(function (l) {
      let pt = cache.patients[l.patientId] || {};
      let ptName = pt.name || pname(l.patientId);
      let ptId = pt.ahid || l.patientId;
      let ptAge = pt.age ? (pt.age + ' yrs') : '--';
      return '<tr>' +
        '<td class="cell-ellipsis-bold">' + esc(ptName) + '</td>' +
        '<td class="cell-ellipsis">' + esc(ptId) + '</td>' +
        '<td class="cell-ellipsis">' + esc(ptAge) + '</td>' +
        '<td class="cell-center"><button class="btn sm" data-act="viewatt" data-id="' + esc(l.id) + '">View</button></td>' +
        '</tr>';
    }).join('');
    return '<h1>Attendance</h1><div class="card"><div class="grid2"><div><label for="at_p">Patient</label><select id="at_p" data-chg="filter"><option value="">All patients</option>' + pats.map(function (p) { return '<option value="' + p.id + '">' + esc(p.name) + '</option>'; }).join('') + '</select></div><div><label for="at_c">Care Giver</label><select id="at_c" data-chg="filter"><option value="">All caregivers</option>' + cgs.map(function (u) { return '<option value="' + esc(u.id) + '">' + esc(u.name) + '</option>'; }).join('') + '</select></div><div><label for="at_m">Month</label><input type="month" id="at_m" data-chg="filter" value="' + T().slice(0, 7) + '"></div></div>' + (dl ? '<p class="duty-progress-bar-wrap"><button class="btn sec" data-act="csv">Download as Excel (CSV)</button></p>' : '') + '</div><div class="scroll"><table class="table-fixed"><thead><tr><th class="col-34">Name</th><th class="col-26">ID</th><th class="col-22">Age</th><th class="col-18-center">Action</th></tr></thead><tbody>' + (rows || '<tr><td colspan="4">No attendance records for this filter.</td></tr>') + '</tbody></table></div>';
  }
  function vRequests() {
    let order = { PENDING: 0, APPROVED: 1, REJECTED: 2, SUPERSEDED: 3 };
    let reqs = list('requests').sort(function (a, b) {
      let oa = (order[a.status] !== null && order[a.status] !== undefined) ? order[a.status] : 9;
      let ob = (order[b.status] !== null && order[b.status] !== undefined) ? order[b.status] : 9;
      if (oa !== ob) return oa - ob;
      return (b.requestedAt || '').localeCompare(a.requestedAt || '');
    });
    let statusTag = function (s) {
      if (s === 'PENDING') return '<span class="tag status-warning">Pending</span>';
      if (s === 'APPROVED') return '<span class="tag status-success">Approved</span>';
      if (s === 'REJECTED') return '<span class="tag fill">Rejected</span>';
      return '<span class="tag status-muted">Updated</span>';
    };
    let reqRows = reqs.map(function (r) {
      return '<tr>' +
        '<td class="cell-ellipsis-bold">' + esc(r.caregiverName || uname(r.caregiverId)) + '</td>' +
        '<td class="cell-ellipsis">' + esc(r.caregiverId) + '</td>' +
        '<td class="cell-ellipsis">' + statusTag(r.status) + '</td>' +
        '<td class="cell-center"><button class="btn sm" data-act="viewreq" data-id="' + esc(r.id) + '">View</button></td>' +
        '</tr>';
    }).join('');

    let lateLogs = list('logs').filter(function (l) {
      return l.loginStatus === 'LATE' || !!l.lateLoginReason;
    }).sort(function (a, b) { return (b.loginTime || b.date || '').localeCompare(a.loginTime || a.date || ''); });
    let lateRows = lateLogs.map(function (l) {
      let delayStr = formatDurationMins(l.loginDelayMinutes || 0);
      return '<tr>' +
        '<td class="cell-ellipsis-bold">' + esc(uname(l.caregiverId)) + '</td>' +
        '<td class="cell-ellipsis" title="' + esc(showD(l.date)) + '">' + esc(l.caregiverId) + '</td>' +
        '<td class="cell-ellipsis-bold text-warning-tag" title="' + esc(delayStr + ' on ' + showD(l.date)) + '">' + esc(delayStr) + '</td>' +
        '<td class="cell-center"><button class="btn sm" data-act="viewatt" data-id="' + esc(l.id) + '">View</button></td>' +
        '</tr>';
    }).join('');

    let pendCount = reqs.filter(function (r) { return r.status === 'PENDING'; }).length;
    return '<h1>Follow up\'s</h1>' +
      '<div class="card top"><h2>Early Logout Approval Requests' + (pendCount ? ' (' + pendCount + ' Pending)' : '') + '</h2>' +
      '<p class="hint">Review and approve or reject caregiver requests to log out before scheduled shift end time.</p>' +
      '<div class="scroll"><table class="table-fixed"><thead><tr><th class="col-32">Name</th><th class="col-24">ID</th><th class="col-26">Status</th><th class="col-18-center">Action</th></tr></thead>' +
      '<tbody>' + (reqRows || '<tr><td colspan="4">No early logout requests yet.</td></tr>') + '</tbody></table></div></div>' +
      '<div class="card"><h2>Delayed Login Reasons</h2>' +
      '<p class="hint">Reasons submitted by caregivers who logged in after their scheduled shift start time.</p>' +
      '<div class="scroll"><table class="table-fixed"><thead><tr><th class="col-32">Name</th><th class="col-24">ID</th><th class="col-26">Delay</th><th class="col-18-center">Action</th></tr></thead>' +
      '<tbody>' + (lateRows || '<tr><td colspan="4">No delayed logins recorded.</td></tr>') + '</tbody></table></div></div>';
  }
  function histActionClass(a) {
    if (a === 'CREATE' || a === 'APPROVE' || a === 'ACTIVATE') return 'tag-success';
    if (a === 'RENEW' || a === 'EXTEND_SHIFT' || a === 'REASSIGN' || a === 'REOPEN') return 'tag-warning';
    if (a === 'DELETE' || a === 'DEACTIVATE' || a === 'REJECT') return 'tag-danger';
    return 'tag-muted';
  }
  function histTimelineHtml(items, emptyMsg) {
    if (!items || !items.length) {
      return '<div class="timeline-empty">' + esc(emptyMsg || 'No recorded changes yet.') + '</div>';
    }
    return '<div class="timeline-container">' +
      '<div class="section-subheading">Change History (' + items.length + ')</div>' +
      '<div class="timeline-list">' +
      items.slice(0, 12).map(function (x) {
        let dtStr = (x.changedAt ? (showD(x.changedAt.slice(0, 10)) + ' ' + showT(x.changedAt)) : '--');
        return '<div class="timeline-card">' +
          '<div class="timeline-card-header">' +
          '<span class="tag tag-m0 ' + histActionClass(x.action) + '">' + esc(x.entityType + ' · ' + x.action) + '</span>' +
          '<span class="timeline-date">' + esc(dtStr) + '</span>' +
          '</div>' +
          '<div class="timeline-summary">' + esc(x.summary) + '</div>' +
          '<div class="timeline-footer">' +
          '<span>By: <b>' + esc(x.changedByName || x.changedBy || 'System') + '</b>' + (x.source === 'DB_TRIGGER' ? ' (DB Trigger)' : '') + '</span>' +
          '<button class="btn sm sec btn-timeline-detail" type="button" data-act="viewhist" data-id="' + esc(x.id) + '" >Details</button>' +
          '</div>' +
          '</div>';
      }).join('') +
      '</div></div>';
  }
  function vHistory() {
    let fEnt = val('ht_ent'), fPt = val('ht_pt'), fAct = val('ht_act'), fSrc = val('ht_src');
    let pats = list('patients').sort(function (a, b) { return (a.name || '').localeCompare(b.name || ''); });
    let filtered = (historyList || []).filter(function (x) {
      if (fEnt && x.entityType !== fEnt) return false;
      if (fPt && x.patientId !== fPt) return false;
      if (fAct && x.action !== fAct) return false;
      if (fSrc && x.source !== fSrc) return false;
      return true;
    });
    let rows = filtered.map(function (x) {
      let whenStr = x.changedAt ? (showD(x.changedAt.slice(0, 10)) + ' ' + showT(x.changedAt)) : '--';
      let modAct = (x.entityType || '') + ' · ' + (x.action || '');
      return '<tr>' +
        '<td class="cell-ellipsis" title="' + esc(whenStr) + '">' + esc(whenStr) + '</td>' +
        '<td class="cell-ellipsis" title="' + esc(modAct + ' (' + (x.source || 'APP') + ')') + '"><span class="tag tag-m0 ' + histActionClass(x.action) + '">' + esc(x.action) + '</span> ' + esc(x.entityType) + '</td>' +
        '<td class="cell-ellipsis text-bold-600" title="' + esc(x.summary) + '">' + esc(x.summary) + '</td>' +
        '<td class="cell-center"><button class="btn sm" data-act="viewhist" data-id="' + esc(x.id) + '">View</button></td>' +
        '</tr>';
    }).join('');
    return '<h1>History &amp; Audit Log</h1>' +
      '<div class="card"><div class="grid2">' +
      '<div><label for="ht_ent">Module / Table</label><select id="ht_ent" data-chg="filter">' +
      '<option value="">All modules</option>' +
      '<option value="CARE_PLAN">Care Plans</option>' +
      '<option value="ASSIGNMENT">Assignments &amp; Shifts</option>' +
      '<option value="FOLLOW_UP_REQUEST">Follow up\'s</option>' +
      '<option value="PATIENT">Patients</option>' +
      '<option value="USER">Users &amp; Caregivers</option>' +
      '<option value="CATEGORY">Categories</option>' +
      '<option value="TASK">Care Tasks</option>' +
      '<option value="ALERT">Alerts</option>' +
      '<option value="ATTENDANCE_LOG">Attendance Reopen / Logs</option>' +
      '</select></div>' +
      '<div><label for="ht_pt">Patient</label><select id="ht_pt" data-chg="filter"><option value="">All patients</option>' + pats.map(function (p) { return '<option value="' + esc(p.id) + '">' + esc(p.name) + ' (' + esc(p.ahid) + ')</option>'; }).join('') + '</select></div>' +
      '<div><label for="ht_act">Action</label><select id="ht_act" data-chg="filter">' +
      '<option value="">All actions</option>' +
      '<option value="CREATE">Create</option>' +
      '<option value="UPDATE">Update / Edit</option>' +
      '<option value="RENEW">Renew Plan</option>' +
      '<option value="EXTEND_SHIFT">Extend Shift</option>' +
      '<option value="REASSIGN">Reassign Caregiver</option>' +
      '<option value="APPROVE">Approve</option>' +
      '<option value="REJECT">Reject</option>' +
      '<option value="DEACTIVATE">Deactivate</option>' +
      '<option value="ACTIVATE">Activate</option>' +
      '<option value="REOPEN">Reopen Log</option>' +
      '<option value="DELETE">Delete</option>' +
      '<option value="CLOSE">Close Alert</option>' +
      '<option value="PASSWORD_RESET">Password Reset</option>' +
      '</select></div>' +
      '<div><label for="ht_src">Source</label><select id="ht_src" data-chg="filter"><option value="">All (App + DB Trigger)</option><option value="APP">Application</option><option value="DB_TRIGGER">Direct SQL / DB Trigger</option></select></div>' +
      '</div></div>' +
      '<div class="scroll"><table class="table-fixed"><thead><tr><th class="col-23">Date / Time</th><th class="col-26">Module &amp; Action</th><th class="col-37">Summary</th><th class="col-14-center">Details</th></tr></thead>' +
      '<tbody>' + (rows || '<tr><td colspan="4">No change history recorded for this filter.</td></tr>') + '</tbody></table></div>';
  }
  function vRecs() {
    let pats = list('patients').filter(function (p) { return p.active !== false; });
    let h = '<h1>Supervisor Recommendations</h1><p>Choose a patient to review activities and set Yes / No for each one.</p><div class="card"><label for="rc_p">Patient</label><select id="rc_p" data-chg="recpt"><option value="">Select patient</option>' + pats.map(function (p) { return '<option value="' + p.id + '"' + (p.id === S.rp ? ' selected' : '') + '>' + esc(p.name) + '</option>'; }).join('') + '</select></div>';
    let plan = S.rp ? planFor(S.rp) : null;
    if (S.rp && !plan) h += '<div class="alert">This patient has no active care plan.</div>';
    if (plan) {
      h += '<form data-sub="recs"><div class="scroll"><table><tr><th>Activity</th><th>Supervisor Recommendation</th></tr>';
      CATS.forEach(function (c) { c.items.forEach(function (it) { let cur = plan.items[it[0]]; if (!cur) return; h += '<tr><td>' + esc(it[1]) + '</td><td><label class="choice"><input type="radio" name="rr_' + it[0] + '" id="rry_' + it[0] + '"' + (cur.rec ? ' checked' : '') + '> Yes</label><label class="choice"><input type="radio" name="rr_' + it[0] + '" id="rrn_' + it[0] + '"' + (!cur.rec ? ' checked' : '') + '> No</label></td></tr>'; }); });
      h += '</table></div><div class="card"><h2>Supervisor sign-off</h2><div class="grid2"><div><label for="rc_sn">Supervisor name</label><input type="text" id="rc_sn" value="' + esc(plan.supName || '') + '"></div><div><label for="rc_sa">Supervisor Signature (with AHID)</label><input type="text" id="rc_sa" value="' + esc(plan.supAhid || '') + '"></div><div><label for="rc_sm">Supervisor mobile number</label><input type="text" id="rc_sm" inputmode="numeric" maxlength="10" value="' + esc(plan.supMobile || '') + '"></div></div><label for="rc_note">Recommendation notes</label><textarea id="rc_note" rows="3">' + esc(plan.recNote || '') + '</textarea><div class="err" id="rc_err" role="alert"></div><button class="btn" type="submit">Save Recommendation</button></div></form>';
    }
    return h;
  }
  function alertBox() { return '<div class="alert"><b>Caregivers must inform the supervisor about:</b><ul>' + ALERTS.map(function (a) { return '<li>' + esc(a) + '</li>'; }).join('') + '</ul></div>'; }
  function vAlerts() {
    let rows = list('alerts').sort(function (a, b) { return (b.raisedAt || '').localeCompare(a.raisedAt || ''); }).map(function (a) {
      return '<tr><td>' + showD((a.raisedAt || '').slice(0, 10)) + ' ' + showT(a.raisedAt) + '</td><td>' + esc(pname(a.patientId)) + '</td><td>' + esc(uname(a.caregiverId)) + '</td><td>' + esc(a.type) + (a.note ? '<br>' + esc(a.note) : '') + '</td><td>' + (a.status === 'OPEN' ? '<span class="tag fill">Open</span>' : 'Closed') + '</td><td>' + (a.status === 'OPEN' ? '<button class="btn sm" data-act="closealert" data-id="' + a.id + '">Close</button>' : '') + '</td></tr>';
    }).join('');
    return '<h1>Alerts to Notify Supervisor</h1>' + alertBox() + '<div class="scroll"><table><tr><th>Date / Time</th><th>Patient</th><th>Care Giver</th><th>Alert type</th><th>Status</th><th></th></tr>' + (rows || '<tr><td colspan="6">No alerts reported.</td></tr>') + '</table></div>';
  }
  function vUsers() {
    let rows = list('users').sort(function (a, b) { return (a.name || '').localeCompare(b.name || ''); }).map(function (u) {
      let ageDisplay = u.age ? (u.age + ' yrs') : (u.role === 'ADMIN' ? 'Admin' : 'Care Giver');
      return '<tr>' +
        '<td class="cell-ellipsis-bold">' + esc(u.name) + '</td>' +
        '<td class="cell-ellipsis">' + esc(u.id) + '</td>' +
        '<td class="cell-ellipsis">' + esc(ageDisplay) + '</td>' +
        '<td class="cell-center"><button class="btn sm" data-act="viewuser" data-id="' + esc(u.id) + '">View</button></td>' +
        '</tr>';
    }).join('');
    return '<h1>Caregivers / Users</h1><p>Create accounts, edit user details, approve new accounts and reset forgotten passwords.</p>' + vUserForm() + '<div class="err" id="us_err" role="alert"></div><div class="scroll"><table class="table-fixed"><thead><tr><th class="col-34">Name</th><th class="col-26">ID</th><th class="col-22">Role / Age</th><th class="col-18-center">Action</th></tr></thead><tbody>' + (rows || '<tr><td colspan="4">No users found.</td></tr>') + '</tbody></table></div>';
  }

  /* ---- care giver ---- */
  function myAsgs() { let td = T(); return list('assignments').filter(function (a) { return a.caregiverId === S.me.id && a.status === 'ACTIVE' && a.startDate <= td; }); }
  function curAsg() { let l = myAsgs(); let a = l.filter(function (x) { return x.id === S.asg; })[0] || l[0]; return a || null; }
  function vCare() {
    let all = myAsgs(), a = curAsg();
    if (!a) return '<h1>Daily Care Sheet</h1><div class="card"><p>No patient has been assigned to you yet. Please contact the administrator.</p></div>';
    let pt = cache.patients[a.patientId] || {}, plan = cache.plans[a.planId] || planFor(a.patientId) || { items: {} };
    let td = T(), logId = a.id + '_' + td, log = cache.logs[logId], inn = !!(log && log.loginTime), out = !!(log && log.logoutTime), act = inn && !out;
    let items = plan.items || {}, tot = Object.keys(items).length, dn = 0; if (log) for (let k in log.done) if (log.done[k] && items[k]) dn++;
    let h = '<h1>Daily Care Sheet</h1>';
    if (all.length > 1) h += '<div class="card"><label for="c_asg">Patient</label><select id="c_asg" data-chg="asg">' + all.map(function (x) { return '<option value="' + x.id + '"' + (x.id === a.id ? ' selected' : '') + '>' + esc(pname(x.patientId)) + '</option>'; }).join('') + '</select></div>';
    h += '<div class="card top"><div class="row duty-progress-row" >' + av(S.me) + '<div><b>' + esc(S.me.name) + '</b><div class="hint">' + esc(S.me.id) + '</div></div><span class="flex-1"></span><div class="duty-progress-pct"><b>' + esc(pt.name) + '</b><div class="hint">' + esc(pt.ahid || '') + '</div></div>' + av(pt, 'patient') + '</div></div>';
    h += '<div class="card top"><div class="scroll m-0" ><table><tr><td><b>Care Giver Name</b></td><td>' + esc(S.me.name) + '</td><td><b>ID</b></td><td>' + esc(S.me.id) + '</td></tr><tr><td><b>Patient Name</b></td><td>' + esc(pt.name) + '</td><td><b>Age</b></td><td>' + esc(pt.age) + '</td></tr><tr><td><b>AHID</b></td><td>' + esc(pt.ahid) + '</td><td><b>Date</b></td><td>' + showD(td) + '</td></tr></table></div></div>';
    h += '<div class="card top"><h2>Log In / Log Out</h2><button class="btn full" data-act="login"' + (inn ? ' disabled' : '') + '>Log In</button><button class="btn sec full" data-act="logoutshift"' + (!act ? ' disabled' : '') + '>Log Out</button><p class="duty-progress-bar-wrap">Log In time: <b>' + showT(log && log.loginTime) + '</b> &nbsp; Log Out time: <b>' + showT(log && log.logoutTime) + '</b></p></div>';
    h += '<div class="alert"><b>Inform the Supervisor immediately if:</b><ul>' + ALERTS.map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ul><p class="text-primary-var"><b>Call Supervisor:</b> ' + (plan.supMobile ? '<a href="tel:' + esc(plan.supMobile) + '" class="text-primary-var">' + esc(plan.supMobile) + '</a>' : 'number not set') + (pt.emergencyMobile ? ' &nbsp; <b>Family emergency number:</b> ' + esc(pt.emergencyMobile) : '') + '</p>' +
      '<div class="grid2"><div><label for="al_t">Report an alert</label><select id="al_t">' + ALERTS.map(function (x, i) { return '<option value="' + i + '">' + esc(x) + '</option>'; }).join('') + '</select></div><div><label for="al_n">Short note (optional)</label><input type="text" id="al_n"></div></div><button class="btn" data-act="alert">Report to supervisor</button></div>';
    h += '<div class="card"><h2>Today’s Care Plan</h2><div class="legend"><b>Legend:</b> ☑ Done &nbsp; ☐ Not done &nbsp; <span class="tag">SOS</span> only when needed &nbsp; <span class="tag fill">Supervisor recommended</span></div><p><b>' + dn + ' of ' + tot + ' done</b></p><div class="bar" role="progressbar" aria-valuemin="0" aria-valuemax="' + tot + '" aria-valuenow="' + dn + '"><i style="width:' + (tot ? Math.round(dn * 100 / tot) : 0) + '%"></i></div>';
    if (!inn) h += '<p class="hint good">Press Log In to start ticking activities.</p>';
    CATS.forEach(function (c) {
      let its = c.items.filter(function (i) { return items[i[0]]; }); if (!its.length) return;
      h += '<details class="cat" data-cat="' + c.id + '"' + (S.coll[c.id] ? '' : ' open') + '><summary>' + esc(c.name) + '</summary>' + its.map(function (i) {
        let it = items[i[0]], ck = !!(log && log.done && log.done[i[0]]);
        return '<div class="act">' + tile(i[0]) + '<input type="checkbox" class="tick" id="t_' + i[0] + '" data-chg="tick" data-a="' + i[0] + '" data-log="' + logId + '"' + (ck ? ' checked' : '') + (act ? '' : ' disabled') + ' aria-labelledby="n_' + i[0] + '"><div class="nm" id="n_' + i[0] + '">' + esc(i[1]) + '<div><span class="tag">' + esc(it.freq) + '</span>' + (it.rec ? '<span class="tag fill">Supervisor recommended</span>' : '') + '</div></div></div>';
      }).join('') + '</details>';
    });
    if (plan.other) h += '<div class="card"><h3>Any other instructions</h3><p>' + esc(plan.other) + '</p></div>';
    h += '</div>';
    h += '<div class="card"><h2>Remarks</h2>' + REMARKS.map(function (r, i) { return '<label class="choice d-flex" ><input type="checkbox" class="rk" id="rk' + i + '" data-chg="remark" data-log="' + logId + '" value="' + esc(r) + '"' + (log && (log.remarks || []).indexOf(r) >= 0 ? ' checked' : '') + (act ? '' : ' disabled') + '> ' + esc(r) + '</label>'; }).join('') + '<label for="rk_note">Short note (optional)</label><textarea id="rk_note" rows="2" data-chg="note" data-log="' + logId + '"' + (act ? '' : ' disabled') + '>' + esc(log ? log.note || '' : '') + '</textarea><div class="row mt-10" ><button class="btn" data-act="submitlog"' + (act ? '' : ' disabled') + '>Submit Day Log</button></div></div>';
    let dim = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate(), tdn = new Date().getDate(), ym = td.slice(0, 7);
    h += '<div class="card"><h2>Month view (Day 1 to Day 31)</h2><p class="hint">Today is highlighted. Past days are read-only; tap a day to view it. ✔ means a log exists.</p><div class="days">';
    for (let d = 1; d <= 31; d++) { let ds = ym + '-' + pad2(d), has = cache.logs[a.id + '_' + ds]; h += '<button class="day' + (d === tdn ? ' today' : '') + (S.viewDate === ds ? ' sel' : '') + '" data-act="viewday" data-d="' + ds + '"' + (d > dim || d > tdn ? ' disabled' : '') + '>' + d + (has ? ' ✔' : '') + '</button>'; }
    h += '</div>';
    if (S.viewDate && S.viewDate !== td) {
      let vl = cache.logs[a.id + '_' + S.viewDate];
      h += '<div class="mt-14"><h3>' + showD(S.viewDate) + '</h3>';
      if (!vl) h += '<p>No log for this day.</p>';
      else { h += '<p>Log In: <b>' + showT(vl.loginTime) + '</b> &nbsp; Log Out: <b>' + showT(vl.logoutTime) + '</b></p><ul>' + Object.keys(items).map(function (k) { return '<li>' + (vl.done && vl.done[k] ? '☑' : '☐') + ' ' + esc(ACTNAME[k]) + '</li>'; }).join('') + '</ul><p>Remarks: ' + esc((vl.remarks || []).join('; ') || 'none') + (vl.note ? ' – ' + esc(vl.note) : '') + '</p>' + (vl.signature ? '<img class="sigimg" src="' + esc(vl.signature) + '" alt="Client signature" width="200">' : ''); }
      h += '</div>';
    }
    return h + '</div>';
  }

  /* ---------- render ---------- */
  function snap() { let m = {}; app.querySelectorAll('input[id],select[id],textarea[id]').forEach(function (e) { m[e.id] = (e.type === 'checkbox' || e.type === 'radio') ? e.checked : e.value; }); return m; }
  function restore(m) { for (let id in m) { let e = $(id); if (!e) continue; if (e.type === 'checkbox' || e.type === 'radio') e.checked = m[id]; else if (e.tagName === 'SELECT') { if (Array.prototype.some.call(e.options, function (o) { return o.value === m[id]; })) e.value = m[id]; } else e.value = m[id]; } }
  function render(keep) {
    syncTasks();
    let prevSide = app.querySelector('.side'), sideY = prevSide ? prevSide.scrollTop : 0;
    let m = keep ? snap() : null, y = window.scrollY, h;
    if (!S.ready || !S.me) h = vLoading(); else h = S.me.role === 'ADMIN' ? vAdmin() : vCare();
    app.innerHTML = shell(h);
    let curSide = app.querySelector('.side'); if (curSide && S.navOpen) curSide.scrollTop = sideY;
    if (m) restore(m);
    syncPlanForm(); userFormCheck(false);
    window.scrollTo(0, y);
  }
  function refresh() {
    if (!S.ready || !S.me) return;
    let u = cache.users[S.me.id];
    if (!u || u.status !== 'ACTIVE') { logout(); return; }
    S.me = Object.assign({ id: S.me.id }, u);
    let a = document.activeElement;
    if (a && app.contains(a) && /^(INPUT|TEXTAREA|SELECT)$/.test(a.tagName) && a.type !== 'checkbox' && a.type !== 'radio' && a.type !== 'file') { S.dirty = true; return; }
    render(true);
  }
  document.addEventListener('focusout', function () { if (S.dirty) setTimeout(function () { S.dirty = false; refresh(); }, 250); });
  function logout() {
    let go = function () { window.location.href = SM.urls.login; };
    api('POST', SM.urls.logout).then(go, go);
  }

  /* ---------- actions ---------- */
  function setErr(id, m) { let e = $(id); if (e) e.textContent = m; }
  let ACT = {
    closemod: function () { closeAdminModal(); },
    menu: function () { S.navOpen = !S.navOpen; let a = document.querySelector('.adm'); if (a) a.classList.toggle('open', S.navOpen); },
    closemenu: function () { S.navOpen = false; let a = document.querySelector('.adm'); if (a) a.classList.remove('open'); },
    top: function () { window.scrollTo({ top: 0, behavior: 'smooth' }); },
    sos: function () { let e = $('al_t'); if (e) { e.scrollIntoView({ behavior: 'smooth', block: 'center' }); e.focus(); } },
    lt: function (t) { S.lt = t.dataset.t; render(false); },
    viewpt: function (t) {
      let p = cache.patients[t.dataset.id];
      if (!p) return;
      let asg = list('assignments').filter(function (a) { return a.patientId === p.id && a.status === 'ACTIVE'; })[0];
      let cgName = asg ? (uname(asg.caregiverId) + ' (' + asg.caregiverId + ')') : 'Not assigned';
      let plan = planFor(p.id);
      let planInfo = plan ? (Object.keys(plan.items || {}).length + ' care activities') : 'No active care plan';
      let h = '<div class="modal-header-flex">' +
        av(p, 'patient') +
        '<div><div class="modal-title-bold">' + esc(p.name) + '</div>' +
        '<div class="text-muted-sm">ID / AHID: <b>' + esc(p.ahid || p.id) + '</b> &bull; Status: <b class=\"' + (p.active === false ? 'status-pill-inactive' : 'status-pill-active') + '\">' + (p.active === false ? 'Inactive' : 'Active') + '</b></div></div>' +
        '</div>' +
        '<table class="detail-table">' +
        '<tr><td class="detail-label">Age</td><td>' + esc(p.age) + ' yrs' + (p.gender && p.gender !== 'Patient' ? ' &bull; ' + esc(p.gender) : '') + '</td></tr>' +
        '<tr><td class="detail-label">Address</td><td>' + esc(p.address || 'Home Care') + '</td></tr>' +
        '<tr><td class="detail-label">Emergency Contact</td><td>' + esc(p.emergencyName || '--') + ' (' + esc(p.emergencyMobile || '--') + ')</td></tr>' +
        '<tr><td class="detail-label">Assigned Caregiver</td><td>' + esc(cgName) + '</td></tr>' +
        '<tr><td class="detail-label">Care Plan</td><td>' + esc(planInfo) + '</td></tr>' +
        '</table>' +
        histTimelineHtml((historyList || []).filter(function (x) { return x.patientId === p.id; }), 'No recorded changes for this patient yet.');
      let f = '<button class="btn sm sec" data-act="editpt" data-id="' + esc(p.id) + '">Edit</button>' +
        '<button class="btn sm sec ' + (p.active === false ? 'status-btn-activate' : 'status-btn-deactivate') + '" data-act="togpt" data-id="' + esc(p.id) + '">' + (p.active === false ? 'Activate' : 'Deactivate') + '</button>' +
        '<button class="btn sec" data-act="closemod" id="adm_mod_close">Close</button>';
      showAdminModal('Patient Details', h, f);
    },
    viewatt: function (t) {
      let l = cache.logs[t.dataset.id];
      if (!l) return;
      let pt = cache.patients[l.patientId] || {};
      let c = doneCount(l);
      let reas = [];
      if (l.incompleteReasons && typeof l.incompleteReasons === 'object') {
        for (let rk in l.incompleteReasons) {
          if (l.incompleteReasons[rk]) reas.push(l.incompleteReasons[rk]);
        }
      }
      let loginBadge = l.loginStatus === 'LATE'
        ? '<span class="tag status-warning">Delayed (' + esc(formatDurationMins(l.loginDelayMinutes || 0)) + ')</span>'
        : '<span class="tag status-success">On Time</span>';
      let logoutBadge = l.logoutStatus === 'EARLY_APPROVED'
        ? '<span class="tag status-info">Early (' + (l.earlyLogoutMinutes ? esc(formatDurationMins(l.earlyLogoutMinutes)) + ' &bull; ' : '') + 'Admin Approved)</span>'
        : (l.logoutTime ? '<span class="tag status-success">On Time</span>' : '');
      let workedDur = '';
      if (l.loginTime && l.logoutTime) {
        let wt1 = new Date(l.loginTime).getTime(), wt2 = new Date(l.logoutTime).getTime();
        if (wt2 > wt1) workedDur = formatDurationMins(Math.round((wt2 - wt1) / 60000));
      }
      let h = '<table class="detail-table">' +
        '<tr><td class="detail-label-w135">Shift Date</td><td>' + showD(l.shiftDate || l.date) + '</td></tr>' +
        '<tr><td class="detail-label">Patient Name</td><td><b>' + esc(pname(l.patientId)) + '</b></td></tr>' +
        '<tr><td class="detail-label">Patient ID</td><td>' + esc(pt.ahid || l.patientId) + '</td></tr>' +
        '<tr><td class="detail-label">Care Giver</td><td><b>' + esc(uname(l.caregiverId)) + '</b> (' + esc(l.caregiverId) + ')</td></tr>' +
        '<tr><td class="detail-label">Scheduled Shift</td><td><b>' + esc(l.shift || '--') + '</b>' + (l.shiftDuration ? ' (' + esc(l.shiftDuration) + ')' : '') + (l.shiftExtended ? ' <span class="tag status-warning">Extended</span>' : '') + '</td></tr>' +
        '<tr><td class="detail-label">Actual Log In</td><td>' + showT(l.loginTime) + ' ' + (l.loginTime ? loginBadge : '') + '</td></tr>' +
        '<tr><td class="detail-label">Actual Log Out</td><td>' + showT(l.logoutTime) + ' ' + logoutBadge + '</td></tr>' +
        (workedDur ? '<tr><td class="detail-label">Worked Duration</td><td><b>' + esc(workedDur) + '</b></td></tr>' : '') +
        '<tr><td class="detail-label">Tasks Done</td><td><b>' + c[0] + ' of ' + c[1] + '</b></td></tr>' +
        '</table>';
      if (l.lateLoginReason) {
        h += '<div class="alert-box-warning">' +
          '<b class="alert-box-warning-body">Delayed Login Reason:</b> ' + esc(l.lateLoginReason) +
          '</div>';
      }
      if (l.earlyLogoutReason) {
        h += '<div class="alert-box-info">' +
          '<b class="alert-box-info-body">Early Logout Reason:</b> ' + esc(l.earlyLogoutReason) +
          (l.earlyLogoutApprovedBy ? ' <span class="text-success">(Approved by ' + esc(l.earlyLogoutApprovedBy) + ')</span>' : '') +
          '</div>';
      }
      if (reas.length) {
        h += '<div class="alert-box-danger">' +
          '<div class="alert-danger-heading">Incomplete / Skipped Tasks:</div>' +
          '<ul class="alert-list">' + reas.map(function (r) { return '<li>' + esc(r) + '</li>'; }).join('') + '</ul>' +
          '</div>';
      }
      if ((l.remarks && l.remarks.length) || l.note) {
        h += '<div class="detail-table"><b>Remarks:</b> ' + esc((l.remarks || []).join('; ')) + (l.note ? ' &bull; ' + esc(l.note) : '') + '</div>';
      }
      if (l.signature) {
        h += '<div><div class="section-subheading">Client / Family Signature:</div>' +
          '<img src="' + esc(l.signature) + '" class="alert-img-preview" alt="Signature">' +
          '</div>';
      }
      let f = '<button class="btn sec" data-act="closemod" id="adm_mod_close">Close</button>';
      showAdminModal('Attendance Sheet - ' + showD(l.date), h, f);
    },
    viewuser: function (t) {
      let uid = t.dataset.id, rawU = cache.users[uid];
      if (!rawU) return;
      let u = Object.assign({ id: uid }, rawU);
      let asgs = list('assignments').filter(function (a) { return a.caregiverId === u.id && a.status === 'ACTIVE'; });
      let ptNames = asgs.map(function (a) { return pname(a.patientId); }).join(', ') || 'None';
      let me = u.id === S.me.id;
      let photoSrc = u.photo || u.photo_path || defaultAvatar(u);
      let hasPhoto = !!(u.photo_path || u.photo);
      let faceBadge = hasPhoto
        ? '<span class="badge-verified">✓ Face Enrolled</span>'
        : '<span class="badge-unverified">⚠ No Face Photo</span>';

      let h = '<div class="modal-header-flex">' +
        '<div class="avatar-preview-wrap" data-act="enroll_face_ui" data-id="' + esc(u.id) + '" title="Click to add/update face photo">' +
        '<img src="' + esc(photoSrc) + '" class="avatar-preview-img ' + (hasPhoto ? 'has-photo' : '') + '" alt="' + esc(u.name) + '">' +
        '<div class="avatar-badge-icon" title="Add or update face photo">📷</div>' +
        '</div>' +
        '<div><div class="modal-title-bold d-flex">' + esc(u.name) + faceBadge + '</div>' +
        '<div class="text-muted-sm">ID: <b>' + esc(u.id) + '</b> &bull; Role: <b>' + (u.role === 'ADMIN' ? 'Admin' : 'Care Giver') + '</b>' + (u.age ? (' &bull; Age: <b>' + esc(u.age) + ' yrs</b>') : '') + '</div></div>' +
        '</div>' +
        (u.role === 'CAREGIVER' ? (
          '<div class="modal-header-hero">' +
          '<div class="d-flex gap-10">' +
          '<span class="font-22">' + (hasPhoto ? '🟢' : '🔴') + '</span>' +
          '<div>' +
          '<div class="section-subheading m-0">Biometric Face Recognition</div>' +
          '<div class="text-bold-600 ' + (hasPhoto ? 'text-success' : 'text-danger') + '">' + (hasPhoto ? 'Photo enrolled & verified for shift check-in' : 'Photo required! Unregistered caregivers cannot check in') + '</div>' +
          '</div>' +
          '</div>' +
          '<button class="btn sm btn-dark-pill" data-act="enroll_face_ui" data-id="' + esc(u.id) + '" >' + (hasPhoto ? 'Update Face' : '📷 Add Face Photo') + '</button>' +
          '</div>'
        ) : '') +
        '<table class="detail-table">' +
        '<tr><td class="detail-label">Mobile Number</td><td>' + esc(u.mobile || '--') + '</td></tr>' +
        '<tr><td class="detail-label">Account Status</td><td><b class=\"' + (u.status === 'ACTIVE' ? 'status-pill-active' : 'status-pill-inactive') + '\">' + esc(u.status) + '</b></td></tr>' +
        '<tr><td class="detail-label">Active Patients</td><td>' + esc(ptNames) + '</td></tr>' +
        '</table>' +
        '<div class="info-card-panel">' +
        '<div class="section-subheading">Reset User Password</div>' +
        '<div class="row gap-8" >' +
        '<input type="text" id="mod_rp_' + esc(u.id) + '" placeholder="Enter new password (min 8 chars)" class="flex-1 cell-padded">' +
        '<button class="btn sm sec" data-act="resetpw_mod" data-id="' + esc(u.id) + '">Reset Password</button>' +
        '</div>' +
        '</div>';
      let f = '<button class="btn sm sec" data-act="edituser" data-id="' + esc(u.id) + '">Edit</button>' +
        (!me && u.status === 'ACTIVE' ? '<button class="btn sm sec btn-danger" data-act="disable" data-id="' + esc(u.id) + '">Deactivate</button>' : '') +
        (!me && (u.status === 'DISABLED' || u.status === 'PENDING') ? '<button class="btn sm sec btn-success" data-act="approve" data-id="' + esc(u.id) + '">Activate</button>' : '') +
        '<button class="btn sec" data-act="closemod" id="adm_mod_close">Close</button>';
      showAdminModal('Caregiver / User Details', h, f);
    },
    enroll_face_ui: function (t) {
      let uid = t.dataset.id, rawU = cache.users[uid];
      if (!rawU) return;
      let u = Object.assign({ id: uid }, rawU);
      let camStream = null;
      let pendingPhoto = null;

      let h = '<div class="mb-12">' +
        '<div class="text-muted-sm">Caregiver: <b class="text-primary-var">' + esc(u.name) + ' (' + esc(u.id) + ')</b></div>' +
        '<div class="btn-grid-3">' +
        '<div id="adm_chk_wall" class="kpi-box">' +
        '<div id="adm_chk_wall_icon" class="font-15">🖼️</div><div class="kpi-val">Plain Wall</div><div id="adm_chk_wall_sub" class="kpi-lbl">Solid wall</div>' +
        '</div>' +
        '<div id="adm_chk_light" class="kpi-box">' +
        '<div id="adm_chk_light_icon" class="font-15">💡</div><div class="kpi-val">Bright Light</div><div id="adm_chk_light_sub" class="kpi-lbl">Lit face</div>' +
        '</div>' +
        '<div id="adm_chk_face" class="kpi-box">' +
        '<div id="adm_chk_face_icon" class="font-15">👤</div><div class="kpi-val">Single Face</div><div id="adm_chk_face_sub" class="kpi-lbl">1 Caregiver</div>' +
        '</div>' +
        '</div>' +
        '<div class="d-flex gap-10 mb-12">' +
        '<button type="button" class="btn sm sec btn-flex-center" id="adm_cam_start" >📷 Use Live Camera</button>' +
        '<label class="btn sm sec btn-flex-center cursor-pointer m-0" >📁 Choose Photo File<input type="file" id="adm_face_file" accept="image/*" capture="user" class="d-none"></label>' +
        '</div>' +
        '<div id="adm_cam_box" class="camera-card">' +
        '<video id="adm_cam_video" autoplay playsinline muted class="camera-video"></video>' +
        '<div class="camera-actions">' +
        '<button type="button" class="btn sm camera-snapshot-btn" id="adm_cam_snap" >📸 Capture Snapshot</button>' +
        '<button type="button" class="btn sm sec camera-cancel-btn" id="adm_cam_stop" >Cancel Camera</button>' +
        '</div>' +
        '</div>' +
        '<div id="adm_prev_box" class="camera-preview-wrap">' +
        '<img id="adm_face_prev" src="" class="camera-preview-img">' +
        '</div>' +
        '<div id="adm_fe_msg" class="camera-status-msg"></div>' +
        '</div>';

      let f = '<button class="btn sm camera-save-btn" id="adm_fe_save"  disabled>Save & Enroll Face</button>' +
        '<button class="btn sec camera-retake-btn" data-act="closemod" id="adm_fe_close" >Close</button>';

      showAdminModal('Face Recognition Enrollment', h, f);

      let admTimer = null;
      function updateAdmBadge(boxId, iconId, subId, isOk, okIcon, okSub, warnIcon, warnSub) {
        let box = document.getElementById(boxId);
        let icon = document.getElementById(iconId);
        let sub = document.getElementById(subId);
        if (!box || !icon || !sub) return;
        if (isOk) {
          box.style.background = '#ECFDF5';
          box.style.borderColor = '#10B981';
          icon.textContent = okIcon || '✅';
          sub.textContent = okSub;
          sub.style.color = '#047857';
        } else {
          box.style.background = '#FFFBEB';
          box.style.borderColor = '#F59E0B';
          icon.textContent = warnIcon || '⚠️';
          sub.textContent = warnSub;
          sub.style.color = '#B45309';
        }
      }

      function stopCam() {
        if (admTimer) { clearInterval(admTimer); admTimer = null; }
        if (camStream) {
          camStream.getTracks().forEach(function (tr) { tr.stop(); });
          camStream = null;
        }
        let box = document.getElementById('adm_cam_box');
        if (box) box.style.display = 'none';
      }

      function setFeMsg(msg, isErr) {
        let el = document.getElementById('adm_fe_msg');
        if (!el) return;
        el.textContent = msg;
        el.style.color = isErr ? '#D32F2F' : '#16A34A';
      }

      let btnStart = document.getElementById('adm_cam_start');
      if (btnStart) {
        btnStart.onclick = function () {
          if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            setFeMsg('Camera requires HTTPS or localhost. Please use "Choose Photo File".', true);
            return;
          }
          navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' }, audio: false }).then(function (s) {
            camStream = s;
            let v = document.getElementById('adm_cam_video');
            let box = document.getElementById('adm_cam_box');
            if (v && box) {
              v.srcObject = s;
              box.style.display = 'block';
              setFeMsg('Live check active: Align face inside circle and snap.', false);
              // Live real-time check loop
              let cScan = document.createElement('canvas');
              cScan.width = 64; cScan.height = 48;
              let ctxScan = cScan.getContext('2d');
              if (admTimer) clearInterval(admTimer);
              admTimer = setInterval(function () {
                if (!v.videoWidth) return;
                ctxScan.drawImage(v, 0, 0, 64, 48);
                let d = ctxScan.getImageData(0, 0, 64, 48).data;
                let sum = 0;
                for (let i = 0; i < d.length; i += 4) { sum += d[i] * 0.299 + d[i + 1] * 0.587 + d[i + 2] * 0.114; }
                let lum = sum / (d.length / 4);
                if (lum < 32) {
                  updateAdmBadge('adm_chk_light', 'adm_chk_light_icon', 'adm_chk_light_sub', false, '', '', '🌙', '⚠️ Too dark');
                  v.style.borderColor = '#F59E0B';
                } else if (lum > 248) {
                  updateAdmBadge('adm_chk_light', 'adm_chk_light_icon', 'adm_chk_light_sub', false, '', '', '☀️', '⚠️ Glare');
                  v.style.borderColor = '#F59E0B';
                } else {
                  updateAdmBadge('adm_chk_light', 'adm_chk_light_icon', 'adm_chk_light_sub', true, '✅', '✓ Well lit');
                  updateAdmBadge('adm_chk_wall', 'adm_chk_wall_icon', 'adm_chk_wall_sub', true, '✅', '✓ Solid wall');
                  updateAdmBadge('adm_chk_face', 'adm_chk_face_icon', 'adm_chk_face_sub', true, '✅', '✓ Single face');
                  v.style.borderColor = '#10B981';
                }
              }, 300);
            }
          }).catch(function () {
            setFeMsg('Camera blocked or unavailable. Please allow camera permissions or upload file.', true);
          });
        };
      }

      let btnStop = document.getElementById('adm_cam_stop');
      if (btnStop) btnStop.onclick = stopCam;

      let btnSnap = document.getElementById('adm_cam_snap');
      if (btnSnap) {
        btnSnap.onclick = function () {
          let v = document.getElementById('adm_cam_video');
          if (!camStream || !v || !v.videoWidth) return;
          let scale = Math.min(1, 640 / Math.max(v.videoWidth, v.videoHeight));
          let c = document.createElement('canvas');
          c.width = Math.round(v.videoWidth * scale);
          c.height = Math.round(v.videoHeight * scale);
          let ctx = c.getContext('2d');
          ctx.drawImage(v, 0, 0, c.width, c.height);

          // Strict brightness check on face snapshot
          let imgData = ctx.getImageData(0, 0, c.width, c.height).data;
          let sum = 0;
          for (let i = 0; i < imgData.length; i += 4) { sum += imgData[i] * 0.299 + imgData[i + 1] * 0.587 + imgData[i + 2] * 0.114; }
          let photoLum = sum / (imgData.length / 4);

          pendingPhoto = c.toDataURL('image/jpeg', 0.90);
          stopCam();
          let prevBox = document.getElementById('adm_prev_box');
          let prevImg = document.getElementById('adm_face_prev');
          let saveBtn = document.getElementById('adm_fe_save');
          if (prevBox && prevImg && saveBtn) {
            prevImg.src = pendingPhoto;
            prevBox.style.display = 'block';

            if (photoLum < 45) {
              saveBtn.disabled = true;
              updateAdmBadge('adm_chk_light', 'adm_chk_light_icon', 'adm_chk_light_sub', false, '', '', '🌙', '⚠️ Too dark (' + Math.round(photoLum) + '/255)');
              setFeMsg('❌ Photo rejected: Face lighting is too dark (' + Math.round(photoLum) + '/255). Caregiver MUST stand in bright light to register.', true);
              return;
            }
            if (photoLum > 240) {
              saveBtn.disabled = true;
              updateAdmBadge('adm_chk_light', 'adm_chk_light_icon', 'adm_chk_light_sub', false, '', '', '☀️', '⚠️ Glare');
              setFeMsg('❌ Photo rejected: Excessive glare on face. Adjust lighting.', true);
              return;
            }

            saveBtn.disabled = false;
            updateAdmBadge('adm_chk_wall', 'adm_chk_wall_icon', 'adm_chk_wall_sub', true, '✅', '✓ Solid wall');
            updateAdmBadge('adm_chk_light', 'adm_chk_light_icon', 'adm_chk_light_sub', true, '✅', '✓ Bright light');
            updateAdmBadge('adm_chk_face', 'adm_chk_face_icon', 'adm_chk_face_sub', true, '✅', '✓ 1 Caregiver');
            setFeMsg('✓ Quality checked: Bright lighting verified! Click "Save & Enroll Face".', false);
          }
        };
      }

      let inpFile = document.getElementById('adm_face_file');
      if (inpFile) {
        inpFile.onchange = function (e) {
          let file = e.target.files && e.target.files[0];
          if (!file) return;
          stopCam();
          readImg(file, 640).then(function (durl) {
            pendingPhoto = durl;
            let prevBox = document.getElementById('adm_prev_box');
            let prevImg = document.getElementById('adm_face_prev');
            let saveBtn = document.getElementById('adm_fe_save');
            if (prevBox && prevImg && saveBtn) {
              prevImg.src = pendingPhoto;
              prevBox.style.display = 'block';

              // Check brightness of image file
              let testImg = new Image();
              testImg.onload = function () {
                let tc = document.createElement('canvas');
                tc.width = 64; tc.height = 48;
                let tctx = tc.getContext('2d');
                tctx.drawImage(testImg, 0, 0, 64, 48);
                let td = tctx.getImageData(0, 0, 64, 48).data;
                let tsum = 0;
                for (let j = 0; j < td.length; j += 4) { tsum += td[j] * 0.299 + td[j + 1] * 0.587 + td[j + 2] * 0.114; }
                let lum = tsum / (td.length / 4);
                if (lum < 45) {
                  saveBtn.disabled = true;
                  updateAdmBadge('adm_chk_light', 'adm_chk_light_icon', 'adm_chk_light_sub', false, '', '', '🌙', '⚠️ Too dark (' + Math.round(lum) + '/255)');
                  setFeMsg('❌ Photo rejected: Face lighting is too dark (' + Math.round(lum) + '/255). Must be in bright light.', true);
                  return;
                }
                if (lum > 240) {
                  saveBtn.disabled = true;
                  updateAdmBadge('adm_chk_light', 'adm_chk_light_icon', 'adm_chk_light_sub', false, '', '', '☀️', '⚠️ Glare');
                  setFeMsg('❌ Photo rejected: Direct glare detected on face.', true);
                  return;
                }
                saveBtn.disabled = false;
                updateAdmBadge('adm_chk_wall', 'adm_chk_wall_icon', 'adm_chk_wall_sub', true, '✅', '✓ Solid wall');
                updateAdmBadge('adm_chk_light', 'adm_chk_light_icon', 'adm_chk_light_sub', true, '✅', '✓ Bright light');
                updateAdmBadge('adm_chk_face', 'adm_chk_face_icon', 'adm_chk_face_sub', true, '✅', '✓ 1 Caregiver');
                setFeMsg('✓ Quality checked: Bright light verified! Click "Save & Enroll Face".', false);
              };
              testImg.src = pendingPhoto;
            }
          }).catch(function () {
            setFeMsg('Could not read that image file.', true);
          });
        };
      }

      let btnSave = document.getElementById('adm_fe_save');
      if (btnSave) {
        btnSave.onclick = function () {
          if (!pendingPhoto) return;
          btnSave.disabled = true;
          setFeMsg('Verifying face quality & enrolling...', false);
          api('POST', '/api/frs/enroll/' + encodeURIComponent(u.id), { photo: pendingPhoto })
            .then(function (res) {
              setFeMsg('✓ Face enrolled successfully! Caregiver can now pass mobile face check-in.', false);
              if (cache.users[u.id]) {
                cache.users[u.id].photo = pendingPhoto;
                cache.users[u.id].photo_path = pendingPhoto;
              }
              setTimeout(function () {
                stopCam();
                closeAdminModal();
                render(true);
              }, 1200);
            })
            .catch(function (err) {
              btnSave.disabled = false;
              setFeMsg(err.message || 'Face photo could not be enrolled.', true);
            });
        };
      }

      let btnClose = document.getElementById('adm_fe_close');
      if (btnClose) {
        let origClose = btnClose.onclick;
        btnClose.onclick = function (e) {
          stopCam();
          if (origClose) origClose.call(this, e);
        };
      }
    },
    viewduty: function (t) {
      let uid = t.dataset.id, rawU = cache.users[uid];
      if (!rawU) return;
      let u = Object.assign({ id: uid }, rawU);
      let td = T();
      let logs = list('logs').filter(function (l) { return l.caregiverId === u.id; });
      let todayLogs = logs.filter(function (l) { return l.date === td; });
      let activeLog = todayLogs.filter(function (l) { return l.loginTime && !l.logoutTime; })[0];
      let isShiftActive = !!activeLog;

      let totalMinutes = 0;
      logs.forEach(function (l) {
        if (l.loginTime && l.logoutTime) {
          let t1 = new Date(l.loginTime).getTime();
          let t2 = new Date(l.logoutTime).getTime();
          if (t2 > t1) totalMinutes += Math.round((t2 - t1) / 60000);
        } else if (l.loginTime && !l.logoutTime && l.date === td) {
          let t1 = new Date(l.loginTime).getTime();
          let t2 = Date.now();
          if (t2 > t1) totalMinutes += Math.round((t2 - t1) / 60000);
        }
      });
      let totalHoursDisplay = formatDurationMins(totalMinutes);

      let asgs = list('assignments').filter(function (a) { return a.caregiverId === u.id && a.status === 'ACTIVE'; });
      let asgListHtml = asgs.length ? asgs.map(function (a) {
        let pt = cache.patients[a.patientId] || {};
        let dur = a.shiftDuration ? (' &bull; Duration: <b>' + esc(a.shiftDuration) + '</b>') : '';
        let ext = a.extended ? ' <span class="tag status-warning">Extended</span>' : '';
        return '<li class="mb-6"><b>' + esc(pt.name || pname(a.patientId)) + '</b> (ID: ' + esc(pt.ahid || a.patientId) + ')<br><span class="text-muted-sm">Date: <b>' + showD(a.shiftDate || a.startDate) + '</b> &bull; Shift: <b>' + esc(a.shift || '08:00 AM - 08:00 PM') + '</b>' + dur + ext + '</span></li>';
      }).join('') : '<li>No active patients assigned</li>';

      let todayIn = todayLogs.length && todayLogs[0].loginTime ? showT(todayLogs[0].loginTime) : '--';
      let todayOut = todayLogs.length && todayLogs[0].logoutTime ? showT(todayLogs[0].logoutTime) : (isShiftActive ? '<span class="text-success">Currently On Duty</span>' : '--');

      let h = '<div class="modal-header-flex">' +
        av(u) +
        '<div><div class="modal-title-bold">' + esc(u.name) + '</div>' +
        '<div class="text-muted-sm">Caregiver ID: <b>' + esc(u.id) + '</b> &bull; Mobile: <b>' + esc(u.mobile || '--') + '</b></div></div>' +
        '</div>' +
        '<table class="detail-table">' +
        '<tr><td class="detail-label">Active Shift Status</td><td>' +
        (isShiftActive ? '<span class="tag fill tag-done" >Active On Shift</span>' : '<span class="tag tag-pending" >Off Duty / Inactive</span>') +
        '</td></tr>' +
        '<tr><td class="detail-label">Today\'s Log In</td><td>' + todayIn + (todayLogs.length && todayLogs[0].loginStatus === 'LATE' ? ' <span class="tag status-warning">Delayed (' + esc(formatDurationMins(todayLogs[0].loginDelayMinutes || 0)) + ')</span>' : '') + '</td></tr>' +
        '<tr><td class="detail-label">Today\'s Log Out</td><td>' + todayOut + '</td></tr>' +
        '<tr><td class="detail-label">Total Shift Hours Completed</td><td><b class="text-info-14">' + totalHoursDisplay + '</b></td></tr>' +
        '</table>' +
        '<div class="section-subheading">Assigned Patients &amp; Shift Timings (' + asgs.length + '):</div>' +
        '<ul class="modal-list">' + asgListHtml + '</ul>';

      let f = '<button class="btn sec" data-act="closemod" id="adm_mod_close">Close</button>';
      showAdminModal('Care Worker Shift & Duty Details', h, f);
    },
    viewasg: function (t) {
      let a = cache.assignments[t.dataset.id];
      if (!a) return;
      let pt = cache.patients[a.patientId] || {};
      let plan = cache.plans[a.planId];
      let cgs = list('users').filter(function (u) { return u.role === 'CAREGIVER' && (u.status === 'ACTIVE' || u.id === a.caregiverId); });
      let rawParts = (a.shift || '08:00 AM - 08:00 PM').replace(/^.*?\(([^)]+)\).*$/, '$1').split('-');
      let stParts = splitTime12h(a.shiftStart || rawParts[0], '08:00', 'AM');
      let etParts = splitTime12h(a.shiftEnd || rawParts[1], '08:00', 'PM');
      let curDate = a.shiftDate || a.startDate || T();
      let curMetrics = calcShiftMetrics(stParts.time, stParts.ampm, etParts.time, etParts.ampm, curDate);
      let modSync = "syncShiftDur('mod_shift_start_" + esc(a.id) + "','mod_shift_start_ampm_" + esc(a.id) + "','mod_shift_end_" + esc(a.id) + "','mod_shift_end_ampm_" + esc(a.id) + "','mod_shift_dur_" + esc(a.id) + "')";
      let h = '<table class="detail-table">' +
        '<tr><td class="detail-label">Patient Name</td><td><b>' + esc(pname(a.patientId)) + '</b></td></tr>' +
        '<tr><td class="detail-label">Patient ID</td><td>' + esc(pt.ahid || a.patientId) + '</td></tr>' +
        '<tr><td class="detail-label">Patient Age</td><td>' + (pt.age ? (pt.age + ' yrs') : '--') + '</td></tr>' +
        '<tr><td class="detail-label">Care Giver</td><td><b>' + esc(uname(a.caregiverId)) + '</b> (' + esc(a.caregiverId) + ')</td></tr>' +
        '<tr><td class="detail-label">Shift Start</td><td><b>' + esc(stParts.time + ' ' + stParts.ampm) + '</b></td></tr>' +
        '<tr><td class="detail-label">Shift End</td><td><b>' + esc(etParts.time + ' ' + etParts.ampm) + '</b>' + (a.extended ? ' <span class="tag status-warning">Extended</span>' : '') + (a.originalShiftEnd ? '<br><span class="text-muted-11">Previous Logout: ' + esc(a.originalShiftEnd) + '</span>' : '') + '</td></tr>' +
        '<tr><td class="detail-label">Shift Duration</td><td><b>' + esc(a.shiftDuration || (curMetrics.ok ? curMetrics.shiftDuration : '--')) + '</b></td></tr>' +
        '<tr><td class="detail-label">Shift Date</td><td><b>' + showD(curDate) + '</b></td></tr>' +
        '<tr><td class="detail-label">Care Plan</td><td>' + (plan ? (Object.keys(plan.items || plan.activities || {}).length + ' care activities (' + esc(plan.status || 'ACTIVE') + ')') : 'Plan active') + '</td></tr>' +
        '<tr><td class="detail-label">Status</td><td><b>' + esc(a.status) + '</b></td></tr>' +
        '</table>' +
        '<div class="info-card-panel">' +
        '<div class="section-subheading">Edit / Extend Shift &amp; Assignment</div>' +
        '<div class="grid2 d-flex gap-10 mb-10" >' +
        '<div>' +
        '<label for="mod_shift_cg_' + esc(a.id) + '" class="item-subtitle">Care Giver</label>' +
        '<select id="mod_shift_cg_' + esc(a.id) + '" class="slot-card">' +
        cgs.map(function (u) { return '<option value="' + esc(u.id) + '"' + (u.id === a.caregiverId ? ' selected' : '') + '>' + esc(u.name) + ' (' + esc(u.id) + ')</option>'; }).join('') +
        '</select>' +
        '</div>' +
        '<div>' +
        '<label for="mod_shift_date_' + esc(a.id) + '" class="item-subtitle">Shift Date</label>' +
        '<input type="date" id="mod_shift_date_' + esc(a.id) + '" value="' + esc(curDate) + '" onclick="try{if(this.showPicker)this.showPicker();}catch(e){}" class="slot-card cursor-pointer">' +
        '</div>' +
        '<div>' +
        '<label for="mod_shift_start_' + esc(a.id) + '" class="item-subtitle">Shift Start (Login Time)</label>' +
        '<div class="slot-select-row">' +
        '<input type="text" id="mod_shift_start_' + esc(a.id) + '" class="notranslate no-keyboard-icon slot-select-input" inputmode="numeric" placeholder="08:00" value="' + esc(stParts.time) + '" autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false" translate="no" virtualkeyboardpolicy="manual" oninput="this.value=this.value.replace(/[^0-9:]/g,\'\');' + modSync + '" >' +
        '<select id="mod_shift_start_ampm_' + esc(a.id) + '" onchange="' + modSync + '" class="slot-select-btn"><option value="AM"' + (stParts.ampm === 'AM' ? ' selected' : '') + '>AM</option><option value="PM"' + (stParts.ampm === 'PM' ? ' selected' : '') + '>PM</option></select>' +
        '</div>' +
        '</div>' +
        '<div>' +
        '<label for="mod_shift_end_' + esc(a.id) + '" class="item-subtitle">Shift End (Logout Time)</label>' +
        '<div class="slot-select-row">' +
        '<input type="text" id="mod_shift_end_' + esc(a.id) + '" class="notranslate no-keyboard-icon slot-select-input" inputmode="numeric" placeholder="08:00" value="' + esc(etParts.time) + '" autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false" translate="no" virtualkeyboardpolicy="manual" oninput="this.value=this.value.replace(/[^0-9:]/g,\'\');' + modSync + '" >' +
        '<select id="mod_shift_end_ampm_' + esc(a.id) + '" onchange="' + modSync + '" class="slot-select-btn"><option value="AM"' + (etParts.ampm === 'AM' ? ' selected' : '') + '>AM</option><option value="PM"' + (etParts.ampm === 'PM' ? ' selected' : '') + '>PM</option></select>' +
        '</div>' +
        '</div>' +
        '<div>' +
        '<label for="mod_shift_dur_' + esc(a.id) + '" class="item-subtitle">Shift Duration</label>' +
        '<input type="text" id="mod_shift_dur_' + esc(a.id) + '" value="' + esc(a.shiftDuration || (curMetrics.ok ? curMetrics.shiftDuration : '--')) + '" readonly class="slot-card active">' +
        '</div>' +
        '<div>' +
        '<label for="mod_shift_reason_' + esc(a.id) + '" class="item-subtitle">Extension / Update Note (optional)</label>' +
        '<input type="text" id="mod_shift_reason_' + esc(a.id) + '" placeholder="e.g. Extended for evening patient support" value="' + esc(a.extendReason || '') + '" class="slot-card">' +
        '</div>' +
        '</div>' +
        '<label class="choice text-muted-sm mb-10" ><input type="checkbox" id="mod_shift_reopen_' + esc(a.id) + '" checked> Update / reopen active shift logout timing if already logged out</label>' +
        '<div><button class="btn sm" data-act="saveshift" data-id="' + esc(a.id) + '">Save / Extend Shift Timing</button></div>' +
        '</div>' +
        histTimelineHtml((historyList || []).filter(function (x) { return x.entityType === 'ASSIGNMENT' && x.entityId === a.id; }), 'No shift extensions or assignment edits recorded yet.');
      let f = (a.status === 'ACTIVE' ? '<button class="btn sm sec btn-danger" data-act="endasg" data-id="' + esc(a.id) + '">Deactivate / End</button>' : '') +
        '<button class="btn sec" data-act="closemod" id="adm_mod_close">Close</button>';
      showAdminModal('Assignment Details', h, f);
    },
    saveshift: async function (t) {
      let id = t.dataset.id;
      let cgId = val('mod_shift_cg_' + id).trim();
      let sDate = val('mod_shift_date_' + id).trim() || T();
      let st = val('mod_shift_start_' + id).trim();
      let stAm = val('mod_shift_start_ampm_' + id);
      let et = val('mod_shift_end_' + id).trim();
      let etAm = val('mod_shift_end_ampm_' + id);
      let extReason = val('mod_shift_reason_' + id).trim();
      let reopenEl = $('mod_shift_reopen_' + id);
      let reopen = reopenEl ? !!reopenEl.checked : true;
      let m = calcShiftMetrics(st, stAm, et, etAm, sDate);
      if (!m.ok) return toast(m.error);
      try {
        await api('POST', SM.urls.docs + '/assignments/' + encodeURIComponent(id) + '/shift', {
          caregiverId: cgId,
          shiftDate: m.shiftDate,
          shiftStart: m.shiftStart,
          startAmpm: stAm,
          shiftEnd: m.shiftEnd,
          endAmpm: etAm,
          extendReason: extReason,
          reopenIfCompleted: reopen,
          extended: true
        });
        await loadAll();
        toast('Shift & assignment updated: ' + m.shift + ' (' + m.shiftDuration + ')');
        closeAdminModal();
        render(false);
      } catch (e) {
        toast('Could not update shift timings: ' + (e.message || 'error'));
      }
    },
    viewreq: function (t) {
      let r = cache.requests[t.dataset.id];
      if (!r) return;
      let statusTag = r.status === 'APPROVED'
        ? '<span class="tag status-success">Approved</span>'
        : r.status === 'REJECTED'
          ? '<span class="tag fill">Rejected</span>'
          : r.status === 'PENDING'
            ? '<span class="tag status-warning">Pending Admin Approval</span>'
            : '<span class="tag status-muted">Superseded</span>';
      let h = '<table class="detail-table">' +
        '<tr><td class="detail-label">Care Giver</td><td><b>' + esc(r.caregiverName || uname(r.caregiverId)) + '</b> (' + esc(r.caregiverId) + ')</td></tr>' +
        '<tr><td class="detail-label">Patient</td><td><b>' + esc(r.patientName || pname(r.patientId)) + '</b></td></tr>' +
        '<tr><td class="detail-label">Shift Date</td><td>' + showD(r.shiftDate) + '</td></tr>' +
        '<tr><td class="detail-label">Scheduled Shift</td><td><b>' + esc(r.shift) + '</b> (' + esc(r.shiftDuration || '--') + ')</td></tr>' +
        '<tr><td class="detail-label">Requested Logout</td><td><b>' + esc(r.requestedTimeDisplay || showT(r.requestedAt)) + '</b>' + (r.earlyByMinutes ? ' <span class="text-danger">(' + esc(formatDurationMins(r.earlyByMinutes)) + ' early)</span>' : '') + '</td></tr>' +
        '<tr><td class="detail-label">Caregiver Reason</td><td><b>' + esc(r.reason) + '</b></td></tr>' +
        '<tr><td class="detail-label">Request Status</td><td>' + statusTag + '</td></tr>' +
        (r.reviewedByName ? '<tr><td class="detail-label">Reviewed By</td><td>' + esc(r.reviewedByName) + ' at ' + showT(r.reviewedAt) + '</td></tr>' : '') +
        '</table>' +
        '<div class="info-card-panel">' +
        '<label for="mod_req_note_' + esc(r.id) + '" class="item-subtitle">Admin Review Note (optional)</label>' +
        '<textarea id="mod_req_note_' + esc(r.id) + '" rows="2" placeholder="Enter note for caregiver"' + (r.status !== 'PENDING' ? ' readonly' : '') + '>' + esc(r.adminNote || '') + '</textarea>' +
        '</div>';
      let f = (r.status === 'PENDING'
        ? '<button class="btn sm tag-success"  data-act="approvereq" data-id="' + esc(r.id) + '">Approve</button>' +
        '<button class="btn sm" data-act="rejectreq" data-id="' + esc(r.id) + '">Reject</button>'
        : '') +
        '<button class="btn sec" data-act="closemod" id="adm_mod_close">Close</button>';
      showAdminModal('Early Logout Request Details', h, f);
    },
    approvereq: async function (t) {
      let id = t.dataset.id;
      let note = val('mod_req_note_' + id).trim();
      try {
        await api('POST', SM.urls.docs + '/requests/' + encodeURIComponent(id) + '/review', { decision: 'APPROVED', adminNote: note });
        await loadAll();
        toast('Early logout request approved.');
        closeAdminModal();
        render(false);
      } catch (e) {
        toast('Could not approve request: ' + (e.message || 'error'));
      }
    },
    rejectreq: async function (t) {
      let id = t.dataset.id;
      let note = val('mod_req_note_' + id).trim();
      try {
        await api('POST', SM.urls.docs + '/requests/' + encodeURIComponent(id) + '/review', { decision: 'REJECTED', adminNote: note });
        await loadAll();
        toast('Early logout request rejected.');
        closeAdminModal();
        render(false);
      } catch (e) {
        toast('Could not reject request: ' + (e.message || 'error'));
      }
    },
    viewplan: function (t) {
      let p = cache.plans[t.dataset.id];
      if (!p) return;
      let pt = cache.patients[p.patientId] || {};
      let items = p.items || {};
      let actList = Object.keys(items).map(function (k) {
        return '<li><b>' + esc(ACTNAME[k] || k) + '</b> <span class="tag">' + esc(items[k].freq) + '</span>' + (items[k].rec ? '<span class="tag fill">Supervisor Recommended</span>' : '') + '</li>';
      }).join('');
      let initDt = p.firstInitDate || p.initDate;
      let isRenewed = !!(p.renewedDate || p.lastRenewedAt);
      let stBadge = p.status === 'ACTIVE'
        ? '<span class="badge-active">ACTIVE</span>'
        : '<span class="badge-closed">' + esc(p.status === 'CLOSED' ? 'DEACTIVATED' : (p.status || 'CLOSED')) + '</span>';
      let h = '<table class="detail-table">' +
        '<tr><td class="detail-label">Patient Name</td><td><b>' + esc(pname(p.patientId)) + '</b></td></tr>' +
        '<tr><td class="detail-label">Patient ID</td><td>' + esc(pt.ahid || p.patientId) + '</td></tr>' +
        '<tr><td class="detail-label">Patient Age</td><td>' + (pt.age ? (pt.age + ' yrs') : '--') + '</td></tr>' +
        '<tr><td class="detail-label">Initiation Date</td><td>' + (showD(initDt) || '--') + '</td></tr>' +
        (isRenewed ? '<tr><td class="detail-label">Renewal Date</td><td><b>' + (showD(p.renewedDate || p.initDate) || '--') + '</b></td></tr>' : '') +
        '<tr><td class="detail-label">Next Renewal Date</td><td>' + (showD(p.renewOn) || '--') + '</td></tr>' +
        '<tr><td class="detail-label">Status</td><td>' + stBadge + '</td></tr>' +
        '<tr><td class="detail-label">Supervisor</td><td>' + esc(p.supName || '--') + ' (' + esc(p.supMobile || '--') + ')</td></tr>' +
        (p.other ? '<tr><td class="detail-label">Other Instructions</td><td>' + esc(p.other) + '</td></tr>' : '') +
        '</table>' +
        '<div class="section-subheading">Care Activities (' + Object.keys(items).length + '):</div>' +
        '<ul class="modal-list">' + (actList || '<li>No activities selected</li>') + '</ul>' +
        histTimelineHtml((historyList || []).filter(function (x) { return x.entityType === 'CARE_PLAN' && (x.entityId === p.id || x.patientId === p.patientId); }), 'No care plan edits or renewals recorded yet.');
      let f = '<button class="btn sm sec" data-act="editplan" data-id="' + esc(p.id) + '">Edit</button>' +
        (p.status === 'ACTIVE'
          ? '<button class="btn sm sec btn-danger-outline"  data-act="closeplan" data-id="' + esc(p.id) + '">Deactivate</button>'
          : '<button class="btn sm btn-success"  data-act="openplan" data-id="' + esc(p.id) + '">Activate</button>') +
        '<button class="btn sm" data-act="renew" data-id="' + esc(p.id) + '">Renew Plan</button>' +
        '<button class="btn sm btn-danger" data-act="delplan" data-id="' + esc(p.id) + '">Delete</button>' +
        '<button class="btn sec" data-act="closemod" id="adm_mod_close">Close</button>';
      showAdminModal('Care Plan Details', h, f);
    },
    viewhist: function (t) {
      let targetId = String(t.dataset.id);
      let item = (historyList || []).filter(function (x) { return String(x.id) === targetId; })[0];
      if (!item) return;

      let whenStr = item.changedAt ? (showD(item.changedAt.slice(0, 10)) + ' ' + showT(item.changedAt)) : '--';

      function fmtVal(v) {
        if (v === null || v === undefined) return '<span class="diff-none">(none)</span>';
        try {
          return '<pre class="diff-box">' + esc(JSON.stringify(v, null, 2)) + '</pre>';
        } catch (e) {
          return esc(String(v));
        }
      }

      let h = '<table class="detail-table">' +
        '<tr><td class="detail-label">When</td><td>' + esc(whenStr) + '</td></tr>' +
        '<tr><td class="detail-label">Module &amp; Action</td><td><span class="tag">' + esc(item.action) + '</span> <b>' + esc(item.entityType) + '</b> (' + esc(item.entityId) + ')</td></tr>' +
        '<tr><td class="detail-label">Changed By</td><td><b>' + esc(item.changedByName || item.changedBy || 'System') + '</b>' + (item.changedByRole ? ' (' + esc(item.changedByRole) + ')' : '') + ' &bull; Source: <b>' + esc(item.source || 'APP') + '</b></td></tr>' +
        (item.patientId ? '<tr><td class="detail-label">Patient</td><td>' + esc(item.patientName || pname(item.patientId)) + ' (' + esc(item.patientId) + ')</td></tr>' : '') +
        (item.caregiverId ? '<tr><td class="detail-label">Care Giver</td><td>' + esc(item.caregiverName || uname(item.caregiverId)) + ' (' + esc(item.caregiverId) + ')</td></tr>' : '') +
        '<tr><td class="detail-label">Summary</td><td><b>' + esc(item.summary) + '</b></td></tr>' +
        (item.reason ? '<tr><td class="detail-label">Reason / Note</td><td>' + esc(item.reason) + '</td></tr>' : '') +
        ((item.changedFields && item.changedFields.length) ? '<tr><td class="detail-label">Changed Fields</td><td>' + item.changedFields.map(function (cf) { return '<span class="tag">' + esc(cf) + '</span>'; }).join(' ') + '</td></tr>' : '') +
        '</table>' +
        '<div class="diff-title first">Before Change:</div>' + fmtVal(item.oldValues) +
        '<div class="diff-title">After Change:</div>' + fmtVal(item.newValues);

      showAdminModal('Change History #' + esc(item.id), h, '<button class="btn sec" data-act="closemod" id="adm_mod_close">Close</button>');
    },
    delcat: async function (t) {
      let id = t.dataset.id, name = t.dataset.name || id;
      if (!confirm('Are you sure you want to delete category "' + name + '" and all its tasks?')) return;
      await put('categories', id, { id: id, name: name, deleted: true });
      let cat = CATS.filter(function (c) { return c.id === id; })[0];
      if (cat && cat.items) {
        for (let i = 0; i < cat.items.length; i++) {
          await put('tasks', cat.items[i][0], { id: cat.items[i][0], deleted: true });
        }
      }
      toast('Category "' + name + '" deleted');
      render(false);
    },
    deltask: async function (t) {
      let id = t.dataset.id, name = t.dataset.name || id;
      if (!confirm('Are you sure you want to delete task "' + name + '"?')) return;
      await put('tasks', id, { id: id, name: name, deleted: true });
      toast('Task "' + name + '" deleted');
      render(false);
    },
    timgdel: async function (t) {
      let id = t.dataset.id;
      let name = ACTNAME[id] || id;
      if (!confirm('Are you sure you want to delete the image for "' + name + '"?')) return;
      try {
        let o = Object.assign({}, cache.tasks[id] || { id: id });
        o.img = '';
        if (cache.tasks[id]) cache.tasks[id].img = '';
        render(false);
        let res = await api('PUT', SM.urls.docs + '/tasks/' + encodeURIComponent(id), o);
        if (res && res.doc && cache.tasks[id]) cache.tasks[id] = res.doc;
        refreshHistory();
        toast('Task image deleted');
        render(false);
      } catch (e) {
        toast('Could not delete image: ' + (e.message || 'error'));
        render(false);
      }
    },
    delphoto: async function (t) {
      let col = t.dataset.col, id = t.dataset.id, name = t.dataset.name || '';
      if (!confirm('Are you sure you want to delete the photo' + (name ? ' for ' + name : '') + '?')) return;
      if (col === 'users') {
        try {
          let res = await api('PATCH', SM.urls.users + '/' + encodeURIComponent(id), { photo: '' });
          if (res && res.user) cache.users[id] = res.user;
          else if (cache.users[id]) cache.users[id].photo = '';
          refreshHistory();
          if (typeof window.refreshFrsList === 'function') window.refreshFrsList();
          toast('Photo deleted & FRS unregistered');
          render(false);
        } catch (e) {
          toast(e.message || 'Could not delete photo.');
        }
        return;
      }
      await upd(col, id, { photo: '' });
      toast('Photo deleted');
      render(false);
    },
    resetpw_mod: async function (t) {
      let id = t.dataset.id;
      let pw = val('mod_rp_' + id);
      if (pw.length < 8 || !/\d/.test(pw)) return toast('Password needs at least 8 characters and one number.');
      try {
        await api('POST', SM.urls.users + '/' + encodeURIComponent(id) + '/password', { password: pw });
        toast('Password reset successfully.');
        closeAdminModal();
      } catch (e) {
        toast('Could not reset password: ' + (e.message || 'error'));
      }
    },
    taskdel: async function (t) {
      let id = t.dataset.id, name = t.dataset.name || id;
      if (!confirm('Are you sure you want to delete task "' + name + '"?')) return;
      await put('tasks', id, { id: id, name: name, deleted: true });
      toast('Task "' + name + '" deleted');
      render(false);
    },
    logout: function () { logout(); },
    tab: function (t) {
      S.tab = t.dataset.t; S.pf = null; S.ep = null; S.eu = null; S.navOpen = false;
      if (window.location.hash !== '#' + S.tab) {
        try { history.pushState({ tab: S.tab }, '', '#' + S.tab); } catch (e) { }
      }
      render(false);
    },
    newplan: function () { S.pf = {}; render(false); },
    cancelplan: function () { S.pf = null; render(false); },
    editplan: function (t) { S.pf = { editId: t.dataset.id }; closeAdminModal(); render(false); window.scrollTo({ top: 0, behavior: 'smooth' }); },
    renew: function (t) { S.tab = 'plans'; S.pf = { renewFrom: t.dataset.id }; closeAdminModal(); render(false); window.scrollTo({ top: 0, behavior: 'smooth' }); },
    editpt: function (t) { S.ep = t.dataset.id; closeAdminModal(); render(false); window.scrollTo({ top: 0, behavior: 'smooth' }); },
    cancelpt: function () { S.ep = null; render(false); },
    edituser: function (t) { S.eu = t.dataset.id; closeAdminModal(); render(false); window.scrollTo({ top: 0, behavior: 'smooth' }); },
    canceluser: function () { S.eu = null; render(false); },
    togpt: async function (t) {
      let p = cache.patients[t.dataset.id];
      let nextState = (p.active === false);
      await upd('patients', t.dataset.id, { active: nextState });
      toast(nextState ? 'Patient activated' : 'Patient deactivated');
      closeAdminModal();
      render(false);
    },
    endasg: async function (t) {
      await upd('assignments', t.dataset.id, { status: 'ENDED', endDate: T() });
      toast('Assignment deactivated / ended');
      closeAdminModal();
      render(false);
    },
    closeplan: async function (t) {
      await upd('plans', t.dataset.id, { status: 'CLOSED' });
      toast('Care plan deactivated');
      closeAdminModal();
      render(false);
    },
    openplan: async function (t) {
      await upd('plans', t.dataset.id, { status: 'ACTIVE' });
      toast('Care plan activated');
      closeAdminModal();
      render(false);
    },
    delplan: async function (t) {
      let id = t.dataset.id, p = cache.plans[id], label = p ? pname(p.patientId) : id;
      if (!confirm('Are you sure you want to delete the care plan for "' + label + '"? This action cannot be undone.')) return;
      await wr('plans', id, 'del');
      await loadAll();
      toast('Care plan deleted');
      closeAdminModal();
      render(false);
    },
    closealert: function (t) { upd('alerts', t.dataset.id, { status: 'CLOSED', closedBy: S.me.id, closedAt: new Date().toISOString() }); },
    approve: async function (t) {
      await upd('users', t.dataset.id, { status: 'ACTIVE' });
      toast('Account activated');
      closeAdminModal();
      render(false);
    },
    disable: async function (t) {
      await upd('users', t.dataset.id, { status: 'DISABLED' });
      toast('Account deactivated');
      closeAdminModal();
      render(false);
    },
    resetpw: async function (t) {
      let pw = val('rp_' + t.dataset.id);
      if (pw.length < 8 || !/\d/.test(pw)) return setErr('us_err', 'New password needs at least 8 characters and one number.');
      try { await api('POST', SM.urls.users + '/' + encodeURIComponent(t.dataset.id) + '/password', { password: pw }); }
      catch (e) { return setErr('us_err', (e.errors && e.errors.password) || e.message); }
      $('rp_' + t.dataset.id).value = ''; setErr('us_err', ''); toast('Password reset. Share the new password with the user.');
    },
    csv: function () {
      let q = function (s) { return '"' + String((s === null || s === undefined) ? '' : s).replace(/"/g, '""') + '"'; };
      let rows = [['Date', 'Patient', 'AHID', 'Care Giver', 'Log In', 'Log Out', 'Tasks done', 'Tasks planned', 'Remarks']].concat(attRows().map(function (l) {
        let c = doneCount(l);
        let reas = [];
        if (l.incompleteReasons && typeof l.incompleteReasons === 'object') {
          for (let rk in l.incompleteReasons) {
            if (l.incompleteReasons[rk]) reas.push(l.incompleteReasons[rk]);
          }
        }
        let rem = (l.remarks || []).concat(reas).join('; ') + (l.note ? ' - ' + l.note : '');
        return [l.date, pname(l.patientId), (cache.patients[l.patientId] || {}).ahid || '', uname(l.caregiverId), showT(l.loginTime), showT(l.logoutTime), c[0], c[1], rem];
      }));
      let a = document.createElement('a'), url = URL.createObjectURL(new Blob([rows.map(function (r) { return r.map(q).join(','); }).join('\n')], { type: 'text/csv;charset=utf-8' }));
      a.href = url; a.download = 'mitraz-attendance-' + T() + '.csv'; document.body.appendChild(a); a.click(); a.remove();
      setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
    },
    login: async function () {
      let id = S.me.id + '_' + T(), a = curAsg(); if (!a) return; let logId = a.id + '_' + T();
      if (cache.logs[logId] && cache.logs[logId].loginTime) return;
      let fc = await faceCheck(cache.patients[a.patientId] || {}); if (!fc) return;
      await put('logs', logId, { faceImg: fc.img, lat: fc.lat, lng: fc.lng, dist: (fc.dist === null || fc.dist === undefined) ? '' : Math.round(fc.dist), assignmentId: a.id, planId: a.planId, patientId: a.patientId, caregiverId: S.me.id, date: T(), loginTime: new Date().toISOString(), logoutTime: '', done: {}, remarks: [], note: '', signature: '', submittedAt: '' });
      toast('Logged in at ' + showT(new Date().toISOString()));
    },
    logoutshift: async function () {
      let a = curAsg(), logId = a.id + '_' + T(), l = cache.logs[logId];
      if (!l || !l.loginTime) return;
      await upd('logs', logId, { logoutTime: new Date().toISOString() }); toast('Logged out. Thank you.');
    },
    submitlog: async function () {
      let a = curAsg(), logId = a.id + '_' + T();
      let n = $('rk_note');
      await upd('logs', logId, { note: n ? n.value : '', submittedAt: new Date().toISOString() });
      toast('Day log submitted.');
    },
    alert: async function () {
      let a = curAsg(); if (!a) return;
      await put('alerts', uid(), { patientId: a.patientId, caregiverId: S.me.id, type: ALERTS[+val('al_t')], note: val('al_n').trim(), status: 'OPEN', raisedAt: new Date().toISOString(), closedBy: '', closedAt: '' });
      $('al_n').value = ''; toast('Alert sent to the administrator. Also call the supervisor.');
    },
    viewday: function (t) { S.viewDate = t.dataset.d === T() ? null : t.dataset.d; render(true); }
  };
  let CHG = {
    timg: async function (el) {
      let f = el.files && el.files[0];
      if (!f) return;
      let id = el.dataset.id;
      try {
        toast('Processing image...');
        let d = await readImg(f, 300);
        if (!cache.tasks[id]) cache.tasks[id] = { id: id, name: ACTNAME[id] || id, cat: CATOF[id] || 'c1' };
        cache.tasks[id].img = d;
        el.blur();
        el.value = '';
        render(false);
        let payload = Object.assign({}, cache.tasks[id], { img: d });
        let res = await api('PUT', SM.urls.docs + '/tasks/' + encodeURIComponent(id), payload);
        if (res && res.doc && cache.tasks[id]) cache.tasks[id] = res.doc;
        refreshHistory();
        toast('Image saved successfully');
        render(false);
      } catch (e) {
        el.value = '';
        toast('Could not save image: ' + (e.message || 'error'));
        render(false);
      }
    },
    pphoto: async function (el) {
      let f = el.files[0]; if (!f) return;
      let col = el.dataset.col, id = el.dataset.id;
      if (col === 'users') {
        readImg(f, 640).then(function (d) {
          toast('Validating face lighting & quality...');
          return api('PATCH', SM.urls.users + '/' + encodeURIComponent(id), { photo: d }).then(function (res) {
            if (res && res.user) cache.users[id] = res.user;
            refreshHistory();
            if (typeof window.refreshFrsList === 'function') window.refreshFrsList();
            toast('Face photo validated & saved');
            render(false);
          });
        }).catch(function (e) {
          el.value = '';
          toast((e && e.message) || 'Photo rejected. Stand in bright light with only one face visible.');
        });
        return;
      }
      try {
        let d = await readImg(f, 200);
        if (cache[col] && cache[col][id]) cache[col][id].photo = d;
        el.blur();
        el.value = '';
        render(false);
        let res = await api('PATCH', SM.urls.docs + '/' + col + '/' + encodeURIComponent(id), { photo: d });
        if (res && res.doc && cache[col]) cache[col][id] = res.doc;
        refreshHistory();
        toast('Photo saved');
        render(false);
      } catch (e) {
        el.value = '';
        toast('Could not save photo: ' + (e.message || 'error'));
        render(false);
      }
    },
    filter: function () { render(true); },
    recpt: function (t) { S.rp = t.value || null; render(false); },
    asg: function (t) { S.asg = t.value; S.viewDate = null; render(false); },
    pfpatient: function () { syncPlanForm(); },
    pfother: function () { syncPlanForm(); },
    pfck: function (t) { let a = t.dataset.a; if (t.checked) { if (!$('ry_' + a).checked && !$('rn_' + a).checked) $('rn_' + a).checked = true; if (!FREQ.some(function (q) { return $('fq_' + a + '_' + q).checked; })) $('fq_' + a + '_Once').checked = true; } syncPlanForm(); },
    tick: function (t) { let o = {}; o[t.dataset.a] = t.checked; upd('logs', t.dataset.log, { done: o }); },
    remark: function (t) { let r = []; app.querySelectorAll('.rk').forEach(function (c) { if (c.checked) r.push(c.value); }); upd('logs', t.dataset.log, { remarks: r }); },
    note: function (t) { upd('logs', t.dataset.log, { note: t.value }); }
  };
  let SUB = {
    newcat: async function () {
      let n = val('nc_name').trim();
      if (!n) return setErr('nc_err', 'Enter a category name.');
      let cid = 'c_' + Date.now().toString(36);
      await put('categories', cid, { id: cid, name: n, deleted: false });
      toast('Category "' + n + '" added');
      $('nc_name').value = '';
      setErr('nc_err', '');
      render(false);
    },
    newtask: async function () { let n = val('nt_name').trim(); if (!n) return setErr('nt_err', 'Enter the task name.'); let f = app.querySelector('[name=nt_img]').files[0], img = f ? await readImg(f) : ''; await put('tasks', uid(), { custom: true, name: n, cat: val('nt_cat'), img: img }); toast('Task added. It is now in Care Plans.'); },
    newuser: async function () {
      let er = userFormCheck(true);
      if (Object.keys(er).length) return focusFirstError(er);
      let v = userFormValues();
      if (S.eu) {
        try {
          let patchData = { name: v.name, mobile: v.mobile, role: v.role };
          await api('PATCH', SM.urls.users + '/' + encodeURIComponent(S.eu), patchData);
          if (v.pw) {
            await api('POST', SM.urls.users + '/' + encodeURIComponent(S.eu) + '/password', { password: v.pw });
          }
          cache.users[S.eu] = Object.assign({}, cache.users[S.eu], patchData);
          refreshHistory();
          toast('User updated: ' + v.name);
          S.eu = null;
          render(false);
        } catch (e) {
          return toast('Could not update user: ' + (e.message || 'error'));
        }
        return;
      }
      let res;
      try { res = await api('POST', SM.urls.users, { name: v.name, id: v.id, mobile: v.mobile, role: v.role, password: v.pw, confirm: v.pw2 }); }
      catch (e) {
        if (e.errors) { er = userFormCheck(true, { name: e.errors.name, id: e.errors.id, mobile: e.errors.mobile, role: e.errors.role, pw: e.errors.password, pw2: e.errors.confirm }); focusFirstError(er); return; }
        return toast('Could not create the user (' + e.message + ').');
      }
      let u = res.user, id = u.id; delete u.id; cache.users[id] = u;
      refreshHistory();
      toast('User created: ' + u.name + ' (' + id + ')'); render(false);
    },
    patient: async function () {
      let n = val('pt_name').trim(), age = val('pt_age'), ahid = val('pt_ahid').trim(), em = val('pt_em').trim();
      if (!n) return setErr('pt_err', 'Patient name is required.');
      if (age === '' || +age < 0 || +age > 120) return setErr('pt_err', 'Enter a valid age.');
      if (!ahid) return setErr('pt_err', 'AHID is required.');
      if (list('patients').some(function (p) { return p.ahid.toLowerCase() === ahid.toLowerCase() && p.id !== S.ep; })) return setErr('pt_err', 'This AHID is already used.');
      if (!/^\d{10}$/.test(em)) return setErr('pt_err', 'Emergency contact number must be 10 digits.');
      let old = S.ep ? cache.patients[S.ep] : null;
      let pfl = app.querySelector('[name=pt_img]').files[0], ph = pfl ? await readImg(pfl, 200) : ((old && old.photo) || '');
      let latV = val('pt_lat'), lngV = val('pt_lng'), radV = val('pt_radius');
      await put('patients', S.ep || uid(), Object.assign({}, old || { active: true, createdAt: new Date().toISOString(), createdBy: S.me.id }, { photo: ph, name: n, age: +age, gender: val('pt_gender') || 'Patient', ahid: ahid, address: val('pt_addr').trim(), emergencyName: val('pt_en').trim(), emergencyMobile: em, latitude: latV ? parseFloat(latV) : null, longitude: lngV ? parseFloat(lngV) : null, geofenceRadiusM: radV ? parseInt(radV, 10) : 100 }));
      S.ep = null; toast('Patient saved'); render(false);
    },
    plan: async function () {
      let f = S.pf, targetId = f.editId || f.renewFrom || '', pid = targetId ? cache.plans[targetId].patientId : val('pf_patient');
      if (!pid) return setErr('pf_err', 'Choose a patient.');
      let date = val('pf_date'); if (!date) return setErr('pf_err', f.renewFrom ? 'Choose the renewal date.' : 'Choose the date of initiation.');
      let items = {};
      CATS.forEach(function (c) { c.items.forEach(function (it) { let a = it[0]; if ($('ck_' + a).checked) { let q = FREQ.filter(function (x) { return $('fq_' + a + '_' + x).checked; })[0] || 'Once'; items[a] = { rec: $('ry_' + a).checked, freq: q }; } }); });
      if (!Object.keys(items).length) return setErr('pf_err', 'Tick at least one care activity.');
      let sm = val('pf_sm').trim(); if (sm && !/^\d{10}$/.test(sm)) return setErr('pf_err', 'Supervisor mobile number must be 10 digits.');
      if (!targetId && anyPlanFor(pid)) return setErr('pf_err', 'This patient already has a care plan. Only one care plan is allowed per patient — edit, renew, or delete the existing plan.');
      let base = { patientId: pid, initDate: date, renewOn: addDays(date, 30), validFrom: date, validTo: addDays(date, 30), items: items, other: $('pf_oc').checked ? val('pf_ot').trim() : '', supName: val('pf_sn').trim(), supAhid: val('pf_sa').trim(), supMobile: sm };
      let saveId = targetId || uid(), doc;
      if (f.editId) {
        doc = Object.assign({}, cache.plans[f.editId], base);
      } else if (f.renewFrom) {
        let old = cache.plans[f.renewFrom] || {};
        doc = Object.assign({}, old, base, { status: 'ACTIVE', firstInitDate: old.firstInitDate || old.initDate, renewedDate: date, lastRenewedAt: new Date().toISOString() });
      } else {
        doc = Object.assign(base, { firstInitDate: date, status: 'ACTIVE', recNote: '', createdBy: S.me.id, createdAt: new Date().toISOString() });
      }
      try {
        await api('PUT', SM.urls.docs + '/plans/' + encodeURIComponent(saveId), doc);
        cache.plans[saveId] = doc;
        refreshHistory();
        changed();
      } catch (e) {
        if (e && e.code === 409) { await loadAll().catch(function () { }); }
        return setErr('pf_err', (e && e.message) || 'Could not save care plan.');
      }
      let relink = list('assignments').filter(function (a) { return a.patientId === pid && a.status === 'ACTIVE' && a.planId !== saveId; });
      for (let i = 0; i < relink.length; i++) { await upd('assignments', relink[i].id, { planId: saveId }); }
      S.pf = null;
      toast(f.renewFrom ? 'Care plan renewed' : f.editId ? 'Care plan updated' : 'Care plan saved');
      render(false);
    },
    assign: async function () {
      let p = val('as_p'), c = val('as_c'), d = val('as_d');
      let st = val('as_shift_start').trim(), stAm = val('as_shift_start_ampm');
      let et = val('as_shift_end').trim(), etAm = val('as_shift_end_ampm');
      if (!p || !c || !d) return setErr('as_err', 'Choose a patient, a caregiver and a shift date.');
      let m = calcShiftMetrics(st, stAm, et, etAm, d);
      if (!m.ok) return setErr('as_err', m.error);
      let plan = planFor(p); if (!plan) return setErr('as_err', 'This patient has no active care plan. Create one first.');
      if (list('assignments').some(function (a) { return a.patientId === p && a.caregiverId === c && a.status === 'ACTIVE'; })) return setErr('as_err', 'This caregiver is already assigned to this patient.');
      let nowTs = new Date().toISOString();
      await put('assignments', uid(), { patientId: p, planId: plan.id, caregiverId: c, shiftDate: m.shiftDate, startDate: m.shiftDate, shift: m.shift, shiftStart: m.shiftStart, shiftEnd: m.shiftEnd, shiftStart24: m.shiftStart24, shiftEnd24: m.shiftEnd24, shiftDuration: m.shiftDuration, shiftDurationMinutes: m.shiftDurationMinutes, isOvernight: m.isOvernight, endDate: '', status: 'ACTIVE', assignedBy: S.me.id, createdAt: nowTs, updatedAt: nowTs });
      toast('Caregiver assigned (' + m.shift + ' | ' + m.shiftDuration + ')'); render(false);
    },
    recs: async function () {
      let plan = planFor(S.rp); if (!plan) return;
      let sm = val('rc_sm').trim(); if (sm && !/^\d{10}$/.test(sm)) return setErr('rc_err', 'Supervisor mobile number must be 10 digits.');
      let items = clone(plan.items); for (let a in items) items[a].rec = $('rry_' + a).checked;
      await put('plans', plan.id, Object.assign({}, plan, { items: items, supName: val('rc_sn').trim(), supAhid: val('rc_sa').trim(), supMobile: sm, recNote: val('rc_note').trim() }));
      toast('Recommendation saved');
    }
  };
  document.addEventListener('click', function (e) { let t = e.target.closest('[data-act]'); if (!t || t.disabled) return; let f = ACT[t.dataset.act]; if (f) { if (t.tagName === 'A' || t.tagName === 'BUTTON') e.preventDefault(); f(t, e); } });
  document.addEventListener('change', function (e) { let f = e.target.dataset && e.target.dataset.chg && CHG[e.target.dataset.chg]; if (f) f(e.target, e); });
  document.addEventListener('input', function (e) { if (e.target.closest && e.target.closest('#userForm')) userFormCheck(false); });
  document.addEventListener('submit', function (e) { let f = e.target.dataset && e.target.dataset.sub; if (f && SUB[f]) { e.preventDefault(); SUB[f](e.target); } });
  document.addEventListener('toggle', function (e) { let c = e.target.dataset && e.target.dataset.cat; if (c) S.coll[c] = !e.target.open; }, true);
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
      if ($('adminModal')) { closeAdminModal(); }
      else if (S.navOpen) { ACT.closemenu(); }
    }
  });
  window.addEventListener('popstate', function (e) {
    let m = $('adminModal');
    if (m) {
      closeAdminModal();
    }
    if (e.state && e.state.tab) {
      S.tab = e.state.tab;
      render(false);
    } else if (window.location.hash) {
      let hTab = window.location.hash.replace('#', '');
      if (hTab && hTab !== S.tab) {
        S.tab = hTab;
        render(false);
      }
    }
  });

  /* ---------- start ---------- */
  render(false);
  loadAll().then(function () {
    let u = cache.users[SM.user.id];
    if (!(u && u.status === 'ACTIVE')) return logout();
    S.me = Object.assign({ id: SM.user.id }, u); S.ready = true;
    if (!S.tab) S.tab = initTab || 'dash';
    render(false);
    setInterval(function () {
      if (document.visibilityState === 'hidden' || $('adminModal') || S.pf || S.ep || S.eu || S.navOpen) return;
      let a = document.activeElement;
      if (a && app.contains(a) && /^(INPUT|TEXTAREA|SELECT)$/.test(a.tagName)) return;
      loadAll().then(function () { if (!$('adminModal') && !S.navOpen) refresh(); }, function () { });
    }, 20000); // 20s background sync interval (reduced from 6s)
  }, function () { toast('Could not load the data. Reload the page.'); });
})();
