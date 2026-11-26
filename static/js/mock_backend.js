/* =============================================================================
   SNEHA MITRA — Client-Side Mock Backend (Zero-Server Demo Mode)
   Provides persistent localStorage data & intercepts internal API fetch calls
   so the Admin and Caregiver interfaces behave identically to the live app.
   ============================================================================= */
(function (global) {
  'use strict';

  const DB_KEY = 'sm_dummy_db_v1';
  const SESSION_USER_KEY = 'sm_dummy_active_user';
  const GPS_PASS_KEY = 'sm_dummy_gps_ok';

  function pad2(n) {
    return (n < 10 ? '0' : '') + n;
  }

  function fmtDate(d) {
    return d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate());
  }

  function addDays(dateStr, days) {
    const p = dateStr.split('-');
    const d = new Date(+p[0], +p[1] - 1, +p[2]);
    d.setDate(d.getDate() + days);
    return fmtDate(d);
  }

  function isoAt(dateStr, hh, mm) {
    const p = dateStr.split('-');
    return new Date(+p[0], +p[1] - 1, +p[2], hh, mm, 0).toISOString();
  }

  function fmtNow12h() {
    return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
  }

  function clone(o) {
    return JSON.parse(JSON.stringify(o));
  }

  function mergeDeep(target, patch) {
    const out = clone(target || {});
    Object.keys(patch || {}).forEach((k) => {
      const v = patch[k];
      if (v && typeof v === 'object' && !Array.isArray(v) && out[k] && typeof out[k] === 'object' && !Array.isArray(out[k])) {
        out[k] = mergeDeep(out[k], v);
      } else {
        out[k] = clone(v);
      }
    });
    return out;
  }

  function createSeedDb() {
    const today = fmtDate(new Date());
    const yest = addDays(today, -1);
    const twoDaysAgo = addDays(today, -2);
    const planDueInit = addDays(today, -27); // renewOn = today + 3 days (shows on Dashboard!)
    const planFreshInit = addDays(today, -10);

    return {
      seq: 100,
      users: {
        admin: {
          name: 'Admin Supervisor',
          mobile: '9848011223',
          role: 'ADMIN',
          status: 'ACTIVE',
          photo: 'static/img/avatars/user_default.svg'
        },
        gda01: {
          name: 'Prasad',
          mobile: '9876543210',
          role: 'CAREGIVER',
          status: 'ACTIVE',
          age: 29,
          photo: 'static/img/avatars/male_nurse.svg'
        },
        cg02: {
          name: 'Sravani',
          mobile: '9876501234',
          role: 'CAREGIVER',
          status: 'ACTIVE',
          age: 26,
          photo: 'static/img/avatars/user_default.svg'
        },
        cg03: {
          name: 'Ramesh',
          mobile: '9123456789',
          role: 'CAREGIVER',
          status: 'ACTIVE',
          age: 32,
          photo: '' // Intentionally unenrolled to demonstrate FRS badge & enrollment
        },
        cg04: {
          name: 'Lakshmi',
          mobile: '9988776655',
          role: 'CAREGIVER',
          status: 'PENDING',
          age: 27,
          photo: ''
        }
      },
      patients: {
        p1: {
          name: 'Lakshmi Devi',
          age: 74,
          gender: 'Female',
          ahid: 'AHID-1042',
          address: 'Prasanthi Nilayam Road, Puttaparthi',
          emergencyName: 'Raghava Rao (Son)',
          emergencyMobile: '9440112233',
          conditions: 'Post Operative, Vital Monitoring, Elderly Care',
          photo: 'static/img/avatars/female_patient.svg',
          latitude: 14.16421,
          longitude: 77.81294,
          geofenceRadiusM: 100,
          active: true,
          createdAt: isoAt(planDueInit, 9, 15),
          createdBy: 'admin'
        },
        p2: {
          name: 'Anand Rao',
          age: 68,
          gender: 'Male',
          ahid: 'AHID-1089',
          address: 'Gopuram Street, Puttaparthi',
          emergencyName: 'Meera Rao (Daughter)',
          emergencyMobile: '9440998877',
          conditions: 'Physiotherapy, Daily Assistance',
          photo: 'static/img/avatars/male_patient.svg',
          latitude: 14.16185,
          longitude: 77.81052,
          geofenceRadiusM: 100,
          active: true,
          createdAt: isoAt(planFreshInit, 10, 0),
          createdBy: 'admin'
        },
        p3: {
          name: 'Sarada Devi',
          age: 81,
          gender: 'Female',
          ahid: 'AHID-1104',
          address: 'Chitravathi Road, Puttaparthi',
          emergencyName: 'Karthik Sharma',
          emergencyMobile: '9849223344',
          conditions: 'Bedridden, Palliative Care',
          photo: 'static/img/avatars/female_patient.svg',
          latitude: 14.1659,
          longitude: 77.8151,
          geofenceRadiusM: 100,
          active: true,
          createdAt: isoAt(planFreshInit, 11, 20),
          createdBy: 'admin'
        },
        p4: {
          name: 'Venkata Rao',
          age: 72,
          gender: 'Male',
          ahid: 'AHID-1015',
          address: 'Bukkapatnam Main Rd, Puttaparthi',
          emergencyName: 'Suresh Rao',
          emergencyMobile: '9885114477',
          conditions: 'Dementia Care',
          photo: 'static/img/avatars/male_patient.svg',
          latitude: null,
          longitude: null,
          geofenceRadiusM: 100,
          active: false,
          createdAt: isoAt(planDueInit, 14, 0),
          createdBy: 'admin'
        }
      },
      plans: {
        pl1: {
          patientId: 'p1',
          firstInitDate: planDueInit,
          initDate: planDueInit,
          renewOn: addDays(planDueInit, 30),
          validFrom: planDueInit,
          validTo: addDays(planDueInit, 30),
          status: 'ACTIVE',
          supName: 'Dr. Kavitha Nair',
          supAhid: 'SUP-AHID-204',
          supMobile: '9848055667',
          other: 'Check BP before morning medication. Assist gently while walking.',
          recNote: 'Patient recovering well after knee surgery.',
          items: {
            a1: { rec: true, freq: 'Once' },
            a4: { rec: true, freq: 'Twice' },
            a5: { rec: true, freq: 'Twice' },
            a6: { rec: false, freq: 'Thrice' },
            a7: { rec: true, freq: 'Thrice' },
            a14: { rec: true, freq: 'Once' },
            a23: { rec: true, freq: 'Twice' }
          },
          createdBy: 'admin',
          createdAt: isoAt(planDueInit, 9, 30)
        },
        pl2: {
          patientId: 'p2',
          firstInitDate: planFreshInit,
          initDate: planFreshInit,
          renewOn: addDays(planFreshInit, 30),
          validFrom: planFreshInit,
          validTo: addDays(planFreshInit, 30),
          status: 'ACTIVE',
          supName: 'Dr. Kavitha Nair',
          supAhid: 'SUP-AHID-204',
          supMobile: '9848055667',
          other: 'Encourage 15 mins afternoon walk and evening bhajans.',
          recNote: 'Monitor sugar level before lunch.',
          items: {
            a1: { rec: true, freq: 'Once' },
            a5: { rec: true, freq: 'Twice' },
            a13: { rec: true, freq: 'Once' },
            a14: { rec: false, freq: 'Once' },
            a19: { rec: false, freq: 'Once' },
            a23: { rec: true, freq: 'Twice' }
          },
          createdBy: 'admin',
          createdAt: isoAt(planFreshInit, 10, 15)
        },
        pl3: {
          patientId: 'p3',
          firstInitDate: planFreshInit,
          initDate: planFreshInit,
          renewOn: addDays(planFreshInit, 30),
          validFrom: planFreshInit,
          validTo: addDays(planFreshInit, 30),
          status: 'ACTIVE',
          supName: 'Dr. S. Narayana',
          supAhid: 'SUP-AHID-118',
          supMobile: '9848077889',
          other: 'Maintain 2nd hourly position change and Nimbus mattress pressure.',
          recNote: 'Strict bedsore prevention protocol.',
          items: {
            a1: { rec: true, freq: 'Once' },
            a2: { rec: true, freq: 'Twice' },
            a7: { rec: true, freq: 'Thrice' },
            a8: { rec: true, freq: 'Twice' },
            a9: { rec: true, freq: 'Once' },
            a10: { rec: true, freq: 'Once' },
            a21: { rec: false, freq: 'Thrice' }
          },
          createdBy: 'admin',
          createdAt: isoAt(planFreshInit, 11, 45)
        },
        pl4: {
          patientId: 'p4',
          firstInitDate: planDueInit,
          initDate: planDueInit,
          renewOn: addDays(planDueInit, 30),
          validFrom: planDueInit,
          validTo: addDays(planDueInit, 30),
          status: 'CLOSED',
          supName: 'Dr. Kavitha Nair',
          supAhid: 'SUP-AHID-204',
          supMobile: '9848055667',
          other: 'Patient temporarily relocated.',
          items: {
            a1: { rec: true, freq: 'Once' },
            a12: { rec: false, freq: 'Once' },
            a23: { rec: true, freq: 'Twice' }
          },
          createdBy: 'admin',
          createdAt: isoAt(planDueInit, 14, 10)
        }
      },
      assignments: {
        asg1: {
          patientId: 'p1',
          planId: 'pl1',
          caregiverId: 'gda01',
          shiftDate: today,
          startDate: planDueInit,
          shift: '08:00 AM - 08:00 PM',
          shiftStart: '08:00 AM',
          shiftEnd: '08:00 PM',
          shiftStart24: '08:00',
          shiftEnd24: '20:00',
          shiftDuration: '12 hrs',
          shiftDurationMinutes: 720,
          isOvernight: false,
          endDate: '',
          status: 'ACTIVE',
          demoTimingMode: 'ON_TIME',
          assignedBy: 'admin',
          createdAt: isoAt(planDueInit, 9, 45),
          updatedAt: isoAt(today, 7, 30)
        },
        asg2: {
          patientId: 'p2',
          planId: 'pl2',
          caregiverId: 'cg02',
          shiftDate: today,
          startDate: planFreshInit,
          shift: '08:00 AM - 08:00 PM',
          shiftStart: '08:00 AM',
          shiftEnd: '08:00 PM',
          shiftStart24: '08:00',
          shiftEnd24: '20:00',
          shiftDuration: '12 hrs',
          shiftDurationMinutes: 720,
          isOvernight: false,
          endDate: '',
          status: 'ACTIVE',
          demoTimingMode: 'EARLY_LOGOUT',
          assignedBy: 'admin',
          createdAt: isoAt(planFreshInit, 10, 30),
          updatedAt: isoAt(today, 8, 0)
        },
        asg3: {
          patientId: 'p3',
          planId: 'pl3',
          caregiverId: 'cg03',
          shiftDate: today,
          startDate: planFreshInit,
          shift: '09:00 AM - 09:00 PM',
          shiftStart: '09:00 AM',
          shiftEnd: '09:00 PM',
          shiftStart24: '09:00',
          shiftEnd24: '21:00',
          shiftDuration: '12 hrs',
          shiftDurationMinutes: 720,
          isOvernight: false,
          endDate: '',
          status: 'ACTIVE',
          demoTimingMode: 'LATE_LOGIN',
          assignedBy: 'admin',
          createdAt: isoAt(planFreshInit, 12, 0),
          updatedAt: isoAt(today, 9, 0)
        }
      },
      logs: {
        ['asg2_' + today]: {
          assignmentId: 'asg2',
          planId: 'pl2',
          patientId: 'p2',
          caregiverId: 'cg02',
          date: today,
          shiftDate: today,
          shift: '08:00 AM - 08:00 PM',
          shiftDuration: '12 hrs',
          loginTime: isoAt(today, 8, 4),
          logoutTime: '',
          loginStatus: 'ON_TIME',
          loginDelayMinutes: 0,
          done: { a1: true, a5: true, a13: true, a23: true },
          remarks: ['All care completed'],
          note: 'Vitals stable, completed morning exercise.',
          vitals: { bp: '124/80', spo2: '98%', pulse: '74', temp: '98.4°F', grbs: '132' }
        },
        ['asg1_' + yest]: {
          assignmentId: 'asg1',
          planId: 'pl1',
          patientId: 'p1',
          caregiverId: 'gda01',
          date: yest,
          shiftDate: yest,
          shift: '08:00 AM - 08:00 PM',
          shiftDuration: '12 hrs',
          loginTime: isoAt(yest, 8, 2),
          logoutTime: isoAt(yest, 20, 5),
          loginStatus: 'ON_TIME',
          logoutStatus: 'ON_TIME',
          done: { a1: true, a4: true, a5: true, a6: true, a7: true, a14: true, a23: true },
          remarks: ['All care completed'],
          note: 'Patient comfortable and cooperative all day.',
          vitals: { bp: '126/82', spo2: '97%', pulse: '76', temp: '98.6°F', grbs: '138' }
        },
        ['asg2_' + yest]: {
          assignmentId: 'asg2',
          planId: 'pl2',
          patientId: 'p2',
          caregiverId: 'cg02',
          date: yest,
          shiftDate: yest,
          shift: '08:00 AM - 08:00 PM',
          shiftDuration: '12 hrs',
          loginTime: isoAt(yest, 8, 22),
          logoutTime: isoAt(yest, 19, 10),
          loginStatus: 'LATE',
          loginDelayMinutes: 22,
          lateLoginReason: 'Traffic / Travel Delay - Heavy rain near Gopuram main road',
          logoutStatus: 'EARLY_APPROVED',
          earlyLogoutMinutes: 50,
          earlyLogoutReason: 'Relieving Caregiver Arrived Early',
          earlyLogoutApprovedBy: 'Admin Supervisor',
          done: { a1: true, a5: true, a13: true, a14: false, a19: true, a23: true },
          incompleteReasons: { a14: 'Patient Sleeping / Resting - Afternoon nap' },
          remarks: ['All care completed'],
          note: 'Handed over evening vitals to family.',
          vitals: { bp: '128/84', spo2: '98%', pulse: '78', temp: '98.5°F', grbs: '140' }
        },
        ['asg3_' + twoDaysAgo]: {
          assignmentId: 'asg3',
          planId: 'pl3',
          patientId: 'p3',
          caregiverId: 'cg03',
          date: twoDaysAgo,
          shiftDate: twoDaysAgo,
          shift: '09:00 AM - 09:00 PM',
          shiftDuration: '12 hrs',
          loginTime: isoAt(twoDaysAgo, 9, 18),
          logoutTime: isoAt(twoDaysAgo, 21, 2),
          loginStatus: 'LATE',
          loginDelayMinutes: 18,
          lateLoginReason: 'Public Transport Issue - Bus delayed by 20 mins',
          logoutStatus: 'ON_TIME',
          done: { a1: true, a2: true, a7: true, a8: true, a9: true, a10: true, a21: true },
          remarks: ['All care completed'],
          note: 'Skin integrity normal, Nimbus mattress checked.'
        }
      },
      requests: {
        req1: {
          type: 'EARLY_LOGOUT',
          logId: 'asg2_' + today,
          assignmentId: 'asg2',
          caregiverId: 'cg02',
          caregiverName: 'Sravani',
          patientId: 'p2',
          patientName: 'Anand Rao',
          shiftDate: today,
          shift: '08:00 AM - 08:00 PM',
          shiftStart: '08:00 AM',
          shiftEnd: '08:00 PM',
          shiftDuration: '12 hrs',
          requestedAt: isoAt(today, 17, 15),
          requestedTimeDisplay: '05:15 PM',
          earlyByMinutes: 165,
          reason: 'Family / Personal Emergency - Need to attend family medical appointment',
          status: 'PENDING',
          adminNote: ''
        },
        req2: {
          type: 'EARLY_LOGOUT',
          logId: 'asg2_' + yest,
          assignmentId: 'asg2',
          caregiverId: 'cg02',
          caregiverName: 'Sravani',
          patientId: 'p2',
          patientName: 'Anand Rao',
          shiftDate: yest,
          shift: '08:00 AM - 08:00 PM',
          shiftStart: '08:00 AM',
          shiftEnd: '08:00 PM',
          shiftDuration: '12 hrs',
          requestedAt: isoAt(yest, 19, 5),
          requestedTimeDisplay: '07:05 PM',
          earlyByMinutes: 55,
          reason: 'Relieving Caregiver Arrived Early',
          status: 'APPROVED',
          adminNote: 'Handover confirmed with family.',
          reviewedBy: 'admin',
          reviewedByName: 'Admin Supervisor',
          reviewedAt: isoAt(yest, 19, 8)
        }
      },
      alerts: {
        al1: {
          patientId: 'p1',
          caregiverId: 'gda01',
          type: 'Abnormal vital signs of patient',
          note: 'BP slightly elevated (148/92) after afternoon walk; advised rest.',
          status: 'OPEN',
          raisedAt: isoAt(today, 13, 20),
          closedBy: '',
          closedAt: ''
        },
        al2: {
          patientId: 'p3',
          caregiverId: 'cg03',
          type: 'Unwanted situation at patient home',
          note: 'Power outage affected Nimbus mattress backup; restored in 15 mins.',
          status: 'CLOSED',
          raisedAt: isoAt(yest, 16, 40),
          closedBy: 'admin',
          closedAt: isoAt(yest, 17, 5)
        }
      },
      categories: {},
      tasks: {
        t_custom_1: {
          id: 't_custom_1',
          custom: true,
          name: 'Foot massage & warm compress',
          cat: 'c4',
          img: ''
        }
      },
      history: [
        {
          id: 108,
          changedAt: isoAt(today, 17, 15),
          entityType: 'FOLLOW_UP_REQUEST',
          entityId: 'req1',
          action: 'CREATE',
          source: 'APP',
          changedBy: 'cg02',
          changedByName: 'Sravani',
          changedByRole: 'CAREGIVER',
          patientId: 'p2',
          patientName: 'Anand Rao',
          caregiverId: 'cg02',
          caregiverName: 'Sravani',
          summary: 'Sravani requested early logout for Anand Rao',
          reason: 'Family / Personal Emergency',
          changedFields: ['status', 'reason'],
          oldValues: null,
          newValues: { status: 'PENDING', earlyByMinutes: 165 }
        },
        {
          id: 107,
          changedAt: isoAt(yest, 19, 8),
          entityType: 'FOLLOW_UP_REQUEST',
          entityId: 'req2',
          action: 'APPROVE',
          source: 'APP',
          changedBy: 'admin',
          changedByName: 'Admin Supervisor',
          changedByRole: 'ADMIN',
          patientId: 'p2',
          patientName: 'Anand Rao',
          caregiverId: 'cg02',
          caregiverName: 'Sravani',
          summary: 'Approved early logout request for Sravani',
          reason: 'Handover confirmed with family.',
          changedFields: ['status', 'adminNote'],
          oldValues: { status: 'PENDING' },
          newValues: { status: 'APPROVED', adminNote: 'Handover confirmed with family.' }
        },
        {
          id: 106,
          changedAt: isoAt(yest, 10, 15),
          entityType: 'ASSIGNMENT',
          entityId: 'asg1',
          action: 'EXTEND_SHIFT',
          source: 'APP',
          changedBy: 'admin',
          changedByName: 'Admin Supervisor',
          changedByRole: 'ADMIN',
          patientId: 'p1',
          patientName: 'Lakshmi Devi',
          caregiverId: 'gda01',
          caregiverName: 'Prasad',
          summary: 'Updated shift timings for Prasad (08:00 AM - 08:00 PM)',
          reason: 'Evening physiotherapy follow-up',
          changedFields: ['shift', 'shiftDuration'],
          oldValues: { shift: '08:00 AM - 06:00 PM', shiftDuration: '10 hrs' },
          newValues: { shift: '08:00 AM - 08:00 PM', shiftDuration: '12 hrs' }
        },
        {
          id: 105,
          changedAt: isoAt(planFreshInit, 10, 15),
          entityType: 'CARE_PLAN',
          entityId: 'pl2',
          action: 'CREATE',
          source: 'APP',
          changedBy: 'admin',
          changedByName: 'Admin Supervisor',
          changedByRole: 'ADMIN',
          patientId: 'p2',
          patientName: 'Anand Rao',
          summary: 'Created 30-day Care Plan for Anand Rao (6 activities)',
          changedFields: ['items', 'status', 'renewOn'],
          oldValues: null,
          newValues: { status: 'ACTIVE', activitiesCount: 6, supName: 'Dr. Kavitha Nair' }
        },
        {
          id: 104,
          changedAt: isoAt(planDueInit, 9, 20),
          entityType: 'PATIENT',
          entityId: 'p1',
          action: 'UPDATE',
          source: 'DB_TRIGGER',
          changedBy: 'admin',
          changedByName: 'Admin Supervisor',
          changedByRole: 'ADMIN',
          patientId: 'p1',
          patientName: 'Lakshmi Devi',
          summary: 'Updated GPS residence geofence (100m) for Lakshmi Devi',
          changedFields: ['latitude', 'longitude', 'geofenceRadiusM'],
          oldValues: { latitude: null, longitude: null },
          newValues: { latitude: 14.16421, longitude: 77.81294, geofenceRadiusM: 100 }
        },
        {
          id: 103,
          changedAt: isoAt(planDueInit, 9, 5),
          entityType: 'USER',
          entityId: 'gda01',
          action: 'UPDATE',
          source: 'APP',
          changedBy: 'admin',
          changedByName: 'Admin Supervisor',
          changedByRole: 'ADMIN',
          caregiverId: 'gda01',
          caregiverName: 'Prasad',
          summary: 'Enrolled biometric face photo for Prasad (gda01)',
          changedFields: ['photo'],
          oldValues: { photo: '(none)' },
          newValues: { photo: 'enrolled' }
        }
      ]
    };
  }

  function loadDb() {
    try {
      const raw = localStorage.getItem(DB_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && parsed.users && parsed.patients) return parsed;
      }
    } catch (_) {}
    const seed = createSeedDb();
    saveDb(seed);
    return seed;
  }

  function saveDb(db) {
    try {
      localStorage.setItem(DB_KEY, JSON.stringify(db));
    } catch (_) {}
  }

  function nextHistId(db) {
    db.seq = (db.seq || 100) + 1;
    return db.seq;
  }

  function addHistory(db, entry) {
    db.history = db.history || [];
    db.history.unshift(Object.assign({
      id: nextHistId(db),
      changedAt: new Date().toISOString(),
      source: 'APP',
      changedBy: getActiveUserId(),
      changedByName: (db.users[getActiveUserId()] || {}).name || 'Admin Supervisor',
      changedByRole: (db.users[getActiveUserId()] || {}).role || 'ADMIN'
    }, entry));
    if (db.history.length > 250) db.history = db.history.slice(0, 250);
  }

  function getActiveUserId() {
    try {
      return localStorage.getItem(SESSION_USER_KEY) || 'gda01';
    } catch (_) {
      return 'gda01';
    }
  }

  function getActiveCaregiverId(db) {
    let uid = getActiveUserId();
    if (!db || !db.users || !db.users[uid] || db.users[uid].role !== 'CAREGIVER') {
      uid = 'gda01';
    }
    return uid;
  }

  function setActiveUserId(uid) {
    try {
      localStorage.setItem(SESSION_USER_KEY, uid);
    } catch (_) {}
  }

  const PCA_TASK_NAMES = {
    a1: ['Bath, mouth care and hair care', 'Once', 'c1'],
    a2: ['Perineal care', 'Twice', 'c1'],
    a3: ['Routine evening care', 'Once', 'c1'],
    a4: ['Monitor temperature and pulse', 'Twice', 'c2'],
    a5: ['Monitor BP', 'Twice', 'c2'],
    a6: ['Provide assistance for oral feeding', 'Thrice', 'c3'],
    a7: ['Position changing - 2nd hourly / as needed', 'Thrice', 'c3'],
    a8: ['Back care - every 4 hours / as needed', 'Twice', 'c3'],
    a9: ['Monitoring of Nimbus mattress and other devices', 'Once', 'c3'],
    a10: ['Perform skin assessment - 4 hours', 'Once', 'c3'],
    a11: ['Hot and cold application', 'SOS', 'c4'],
    a12: ['Preparing the environment for rest / relaxation', 'Once', 'c4'],
    a13: ['Assist in joint and muscle strengthening exercises', 'Once', 'c5'],
    a14: ['Assist in walking / climbing the stairs', 'Once', 'c5'],
    a15: ['Reading newspaper / book', 'Once', 'c6'],
    a16: ['Engage in playing indoor games, TV / music', 'Once', 'c6'],
    a17: ['Accompany watching', 'Once', 'c6'],
    a18: ['Encourage new hobby development', 'Once', 'c6'],
    a19: ['Listen to Bhajans and Radio Sai', 'Once', 'c6'],
    a20: ['Facilitate prayer environment', 'Once', 'c7'],
    a21: ['Provide bed pan, urinals', 'Thrice', 'c8'],
    a22: ['Assist to washroom', 'Thrice', 'c8'],
    a23: ['Assist in oral medication', 'Twice', 'c9']
  };

  function buildCaregiverContext(db, userId) {
    const today = fmtDate(new Date());
    const user = Object.assign({ id: userId }, db.users[userId] || db.users.gda01 || { name: 'Prasad', role: 'CAREGIVER', photo: 'static/img/avatars/male_nurse.svg' });
    const asgEntry = Object.keys(db.assignments)
      .map((id) => Object.assign({ id }, db.assignments[id]))
      .find((a) => a.caregiverId === user.id && a.status === 'ACTIVE');

    if (!asgEntry) {
      return {
        user,
        hasActiveAssignment: false,
        inactiveReason: 'No active patient shift is assigned to you. Please contact the Administrator.',
        isFutureShift: false,
        patient: {},
        planInfo: null,
        shift: { name: 'No Active Shift', timing: '--', date: today, assignedDate: today, effectiveDate: today, start: '--', end: '--', duration: '--', extended: false },
        timingCheck: { isLoginDelayed: false, loginDelayMinutes: 0, isEarlyLogout: false, earlyLogoutMinutes: 0, nowTime: fmtNow12h(), scheduledStart: '--', scheduledEnd: '--' },
        earlyLogoutRequest: null,
        tasks: [],
        shiftState: 'NOT_STARTED',
        log: {}
      };
    }

    const ptRaw = db.patients[asgEntry.patientId];
    const patient = ptRaw ? Object.assign({ id: asgEntry.patientId }, ptRaw, {
      emergencyContact: ptRaw.emergencyContact || (ptRaw.emergencyName ? `${ptRaw.emergencyName} (${ptRaw.emergencyMobile || ''})` : ptRaw.emergencyMobile || '')
    }) : {};

    const plan = db.plans[asgEntry.planId] || Object.keys(db.plans).map((id) => Object.assign({ id }, db.plans[id])).find((p) => p.patientId === asgEntry.patientId && p.status === 'ACTIVE');

    if (!ptRaw || ptRaw.active === false || !plan || plan.status !== 'ACTIVE') {
      return {
        user,
        hasActiveAssignment: false,
        inactiveReason: (!ptRaw || ptRaw.active === false) ? 'Assigned patient is currently inactive. Contact the Administrator.' : 'Care plan is inactive or expired.',
        isFutureShift: false,
        patient,
        planInfo: null,
        shift: {
          name: 'Assigned Shift',
          timing: asgEntry.shift || '08:00 AM - 08:00 PM',
          date: today,
          assignedDate: asgEntry.shiftDate || today,
          effectiveDate: today,
          start: asgEntry.shiftStart || '08:00 AM',
          end: asgEntry.shiftEnd || '08:00 PM',
          duration: asgEntry.shiftDuration || '12 hrs',
          extended: Boolean(asgEntry.extended)
        },
        timingCheck: { isLoginDelayed: false, loginDelayMinutes: 0, isEarlyLogout: false, earlyLogoutMinutes: 0, nowTime: fmtNow12h(), scheduledStart: asgEntry.shiftStart || '08:00 AM', scheduledEnd: asgEntry.shiftEnd || '08:00 PM' },
        earlyLogoutRequest: null,
        tasks: [],
        shiftState: 'NOT_STARTED',
        log: {}
      };
    }

    const logId = `${asgEntry.id}_${today}`;
    const log = db.logs[logId] || null;
    const items = plan.items || {};
    const tasks = [];
    Object.keys(items).forEach((actId) => {
      const tDoc = (db.tasks && db.tasks[actId]) || {};
      if (tDoc.deleted) return;
      const base = PCA_TASK_NAMES[actId];
      const meta = items[actId] || {};
      tasks.push({
        id: actId,
        activityId: actId,
        title: (tDoc.name || '').trim() || (base ? base[0] : `Care Activity (${actId})`),
        freq: meta.freq || (base ? base[1] : 'Once'),
        cat: (tDoc.cat || '').trim() || (base ? base[2] : 'c1'),
        rec: Boolean(meta.rec),
        img: tDoc.img || '',
        done: Boolean(log && log.done && log.done[actId])
      });
    });

    let shiftState = 'NOT_STARTED';
    if (log && log.loginTime && !log.logoutTime) shiftState = 'ON_DUTY';
    else if (log && log.logoutTime) shiftState = 'COMPLETED';

    const earlyReqs = Object.keys(db.requests || {})
      .map((id) => Object.assign({ id }, db.requests[id]))
      .filter((r) => r.logId === logId && r.type === 'EARLY_LOGOUT' && r.status !== 'SUPERSEDED')
      .sort((a, b) => (b.requestedAt || '').localeCompare(a.requestedAt || ''));

    const mode = asgEntry.demoTimingMode || 'ON_TIME';
    const isFutureShift = (asgEntry.shiftDate && asgEntry.shiftDate > today);

    return {
      user,
      hasActiveAssignment: true,
      inactiveReason: '',
      isFutureShift: Boolean(isFutureShift),
      asgId: asgEntry.id,
      planId: plan.id || asgEntry.planId,
      logId,
      patient,
      planInfo: {
        id: plan.id || asgEntry.planId,
        status: plan.status,
        initDate: plan.initDate,
        renewOn: plan.renewOn,
        other: plan.other || '',
        supName: plan.supName || '',
        supMobile: plan.supMobile || ''
      },
      shift: {
        name: asgEntry.extended ? 'Extended Shift' : 'Assigned Shift',
        timing: asgEntry.shift || '08:00 AM - 08:00 PM',
        date: today,
        assignedDate: asgEntry.shiftDate || today,
        effectiveDate: today,
        start: asgEntry.shiftStart || '08:00 AM',
        end: asgEntry.shiftEnd || '08:00 PM',
        duration: asgEntry.shiftDuration || '12 hrs',
        extended: Boolean(asgEntry.extended),
        originalEnd: asgEntry.originalShiftEnd || ''
      },
      timingCheck: {
        isLoginDelayed: mode === 'LATE_LOGIN',
        loginDelayMinutes: mode === 'LATE_LOGIN' ? 25 : 0,
        isEarlyLogout: mode === 'EARLY_LOGOUT',
        earlyLogoutMinutes: mode === 'EARLY_LOGOUT' ? 165 : 0,
        nowTime: fmtNow12h(),
        scheduledStart: asgEntry.shiftStart || '08:00 AM',
        scheduledEnd: asgEntry.shiftEnd || '08:00 PM'
      },
      earlyLogoutRequest: earlyReqs[0] || null,
      tasks,
      shiftState,
      log: log || {}
    };
  }

  function jsonResp(obj, status) {
    const body = JSON.stringify(obj);
    return new Response(body, {
      status: status || 200,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  function parseBody(init) {
    if (!init || !init.body) return {};
    try {
      return typeof init.body === 'string' ? JSON.parse(init.body) : init.body;
    } catch (_) {
      return {};
    }
  }

  const ENTITY_LABELS = {
    users: 'USER',
    patients: 'PATIENT',
    plans: 'CARE_PLAN',
    assignments: 'ASSIGNMENT',
    logs: 'ATTENDANCE_LOG',
    alerts: 'ALERT',
    tasks: 'TASK',
    categories: 'CATEGORY',
    requests: 'FOLLOW_UP_REQUEST'
  };

  function handleMockRequest(urlStr, method, body) {
    const db = loadDb();
    const u = new URL(urlStr, 'http://localhost');
    const path = u.pathname;
    method = (method || 'GET').toUpperCase();

    // --- Admin Data & History ---
    if (path === '/api/data' && method === 'GET') {
      return jsonResp({
        users: db.users,
        patients: db.patients,
        plans: db.plans,
        assignments: db.assignments,
        logs: db.logs,
        alerts: db.alerts,
        tasks: db.tasks,
        categories: db.categories,
        requests: db.requests,
        history: db.history
      });
    }

    if (path === '/api/history' && method === 'GET') {
      return jsonResp({ ok: true, history: db.history || [] });
    }

    // --- Users API ---
    if (path === '/api/users' && method === 'POST') {
      const id = String(body.id || '').trim();
      if (!id) return jsonResp({ error: 'ID is required', errors: { id: 'ID is required' } }, 422);
      if (Object.keys(db.users).some((k) => k.toLowerCase() === id.toLowerCase())) {
        return jsonResp({ error: 'ID already exists', errors: { id: 'This ID is already used' } }, 422);
      }
      const userObj = {
        name: String(body.name || '').trim(),
        mobile: String(body.mobile || '').trim(),
        role: body.role || 'CAREGIVER',
        status: 'ACTIVE',
        photo: body.role === 'CAREGIVER' ? '' : 'static/img/avatars/user_default.svg'
      };
      db.users[id] = userObj;
      addHistory(db, {
        entityType: 'USER',
        entityId: id,
        action: 'CREATE',
        caregiverId: id,
        caregiverName: userObj.name,
        summary: `Created ${userObj.role === 'ADMIN' ? 'Admin' : 'Caregiver'} account for ${userObj.name} (${id})`,
        changedFields: ['name', 'mobile', 'role', 'status'],
        oldValues: null,
        newValues: userObj
      });
      saveDb(db);
      return jsonResp({ user: Object.assign({ id }, userObj) }, 201);
    }

    const userPwMatch = path.match(/^\/api\/users\/([^/]+)\/password$/);
    if (userPwMatch && method === 'POST') {
      const uid = decodeURIComponent(userPwMatch[1]);
      if (!db.users[uid]) return jsonResp({ error: 'User not found' }, 404);
      addHistory(db, {
        entityType: 'USER',
        entityId: uid,
        action: 'PASSWORD_RESET',
        caregiverId: uid,
        caregiverName: db.users[uid].name,
        summary: `Password reset for ${db.users[uid].name} (${uid})`,
        changedFields: ['password'],
        oldValues: { password: '••••••••' },
        newValues: { password: '•••••••• (reset)' }
      });
      saveDb(db);
      return jsonResp({ ok: true });
    }

    const userPatchMatch = path.match(/^\/api\/users\/([^/]+)$/);
    if (userPatchMatch && method === 'PATCH') {
      const uid = decodeURIComponent(userPatchMatch[1]);
      if (!db.users[uid]) return jsonResp({ error: 'User not found' }, 404);
      const oldU = clone(db.users[uid]);
      db.users[uid] = mergeDeep(db.users[uid], body);
      addHistory(db, {
        entityType: 'USER',
        entityId: uid,
        action: body.status === 'ACTIVE' ? 'ACTIVATE' : body.status === 'DISABLED' ? 'DEACTIVATE' : 'UPDATE',
        caregiverId: uid,
        caregiverName: db.users[uid].name,
        summary: `Updated account ${db.users[uid].name} (${uid})`,
        changedFields: Object.keys(body),
        oldValues: oldU,
        newValues: db.users[uid]
      });
      saveDb(db);
      return jsonResp({ ok: true, user: db.users[uid] });
    }

    // --- FRS API ---
    if (path === '/api/frs/status' && method === 'GET') {
      return jsonResp({ ok: true, ready: true, problems: [] });
    }

    if (path === '/api/frs/caregivers' && method === 'GET') {
      const list = Object.keys(db.users)
        .filter((id) => db.users[id].role === 'CAREGIVER')
        .map((id) => ({
          id,
          name: db.users[id].name,
          enrolled: Boolean(db.users[id].photo || db.users[id].photoPath)
        }));
      return jsonResp({ ok: true, caregivers: list });
    }

    const frsEnrollMatch = path.match(/^\/api\/frs\/enroll\/([^/]+)$/);
    if (frsEnrollMatch && method === 'POST') {
      const uid = decodeURIComponent(frsEnrollMatch[1]);
      if (!db.users[uid]) return jsonResp({ error: 'Caregiver not found' }, 404);
      db.users[uid].photo = body.photo || 'static/img/avatars/male_nurse.svg';
      db.users[uid].photoPath = db.users[uid].photo;
      addHistory(db, {
        entityType: 'USER',
        entityId: uid,
        action: 'UPDATE',
        caregiverId: uid,
        caregiverName: db.users[uid].name,
        summary: `Enrolled biometric face photo for ${db.users[uid].name} (${uid})`,
        changedFields: ['photo'],
        oldValues: { photo: '(previous)' },
        newValues: { photo: 'enrolled' }
      });
      saveDb(db);
      return jsonResp({ ok: true, photo: db.users[uid].photo, photoPath: db.users[uid].photo });
    }

    // --- Assignment Shift Update / Extend ---
    const shiftUpdMatch = path.match(/^\/api\/(?:docs\/)?assignments\/([^/]+)\/shift$/);
    if (shiftUpdMatch && method === 'POST') {
      const asgId = decodeURIComponent(shiftUpdMatch[1]);
      const asg = db.assignments[asgId];
      if (!asg) return jsonResp({ error: 'Assignment not found' }, 404);
      const oldAsg = clone(asg);
      const shiftStr = `${body.shiftStart || asg.shiftStart} - ${body.shiftEnd || asg.shiftEnd}`;
      asg.originalShiftEnd = asg.shiftEnd;
      asg.caregiverId = body.caregiverId || asg.caregiverId;
      asg.shiftDate = body.shiftDate || asg.shiftDate;
      asg.startDate = asg.shiftDate;
      asg.shiftStart = body.shiftStart || asg.shiftStart;
      asg.shiftEnd = body.shiftEnd || asg.shiftEnd;
      asg.shift = shiftStr;
      asg.extendReason = body.extendReason || '';
      asg.extended = Boolean(body.extended);
      asg.updatedAt = new Date().toISOString();

      // Reopen today's log if requested
      const today = fmtDate(new Date());
      const lid = `${asgId}_${today}`;
      if (body.reopenIfCompleted && db.logs[lid] && db.logs[lid].logoutTime) {
        db.logs[lid].logoutTime = '';
        db.logs[lid].shift = shiftStr;
      }

      addHistory(db, {
        entityType: 'ASSIGNMENT',
        entityId: asgId,
        action: 'EXTEND_SHIFT',
        patientId: asg.patientId,
        patientName: (db.patients[asg.patientId] || {}).name || asg.patientId,
        caregiverId: asg.caregiverId,
        caregiverName: (db.users[asg.caregiverId] || {}).name || asg.caregiverId,
        summary: `Updated shift for ${(db.users[asg.caregiverId] || {}).name || asg.caregiverId}: ${shiftStr}`,
        reason: body.extendReason || '',
        changedFields: ['caregiverId', 'shiftDate', 'shift', 'extended'],
        oldValues: { shift: oldAsg.shift, caregiverId: oldAsg.caregiverId },
        newValues: { shift: asg.shift, caregiverId: asg.caregiverId, extended: asg.extended }
      });
      saveDb(db);
      return jsonResp({ ok: true, assignment: asg });
    }

    // --- Early Logout Review ---
    const reqReviewMatch = path.match(/^\/api\/requests\/([^/]+)\/review$/);
    if (reqReviewMatch && method === 'POST') {
      const reqId = decodeURIComponent(reqReviewMatch[1]);
      const req = db.requests[reqId];
      if (!req) return jsonResp({ error: 'Request not found' }, 404);
      const oldStatus = req.status;
      req.status = body.decision === 'APPROVED' ? 'APPROVED' : 'REJECTED';
      req.adminNote = body.adminNote || '';
      req.reviewedBy = 'admin';
      req.reviewedByName = 'Admin Supervisor';
      req.reviewedAt = new Date().toISOString();
      addHistory(db, {
        entityType: 'FOLLOW_UP_REQUEST',
        entityId: reqId,
        action: req.status === 'APPROVED' ? 'APPROVE' : 'REJECT',
        patientId: req.patientId,
        patientName: req.patientName,
        caregiverId: req.caregiverId,
        caregiverName: req.caregiverName,
        summary: `${req.status === 'APPROVED' ? 'Approved' : 'Rejected'} early logout request for ${req.caregiverName}`,
        reason: req.adminNote || '',
        changedFields: ['status', 'adminNote'],
        oldValues: { status: oldStatus },
        newValues: { status: req.status, adminNote: req.adminNote }
      });
      saveDb(db);
      return jsonResp({ ok: true, request: req });
    }

    // --- Generic Collections API (/api/<col>/<id>) ---
    const colMatch = path.match(/^\/api\/([a-z]+)\/([^/]+)$/);
    if (colMatch) {
      const col = colMatch[1];
      const docId = decodeURIComponent(colMatch[2]);
      if (!db[col]) db[col] = {};
      const oldDoc = db[col][docId] ? clone(db[col][docId]) : null;
      const entityType = ENTITY_LABELS[col] || col.toUpperCase();

      if (method === 'PUT') {
        db[col][docId] = clone(body);
        const action = oldDoc ? (body.renewedDate && !oldDoc.renewedDate ? 'RENEW' : 'UPDATE') : 'CREATE';
        addHistory(db, {
          entityType,
          entityId: docId,
          action,
          patientId: body.patientId || (col === 'patients' ? docId : undefined),
          caregiverId: body.caregiverId || (col === 'users' ? docId : undefined),
          summary: `${action === 'CREATE' ? 'Created' : action === 'RENEW' ? 'Renewed' : 'Updated'} ${entityType.toLowerCase().replace('_', ' ')} (${body.name || docId})`,
          changedFields: Object.keys(body),
          oldValues: oldDoc,
          newValues: db[col][docId]
        });
        saveDb(db);
        return jsonResp({ ok: true, doc: db[col][docId] });
      }

      if (method === 'PATCH') {
        db[col][docId] = mergeDeep(db[col][docId], body);
        let action = 'UPDATE';
        if (body.active === false || body.status === 'CLOSED' || body.status === 'ENDED' || body.status === 'DISABLED') action = 'DEACTIVATE';
        else if (body.active === true || body.status === 'ACTIVE') action = 'ACTIVATE';
        else if (body.status === 'CLOSED' && col === 'alerts') action = 'CLOSE';
        addHistory(db, {
          entityType,
          entityId: docId,
          action,
          patientId: db[col][docId].patientId || (col === 'patients' ? docId : undefined),
          caregiverId: db[col][docId].caregiverId,
          summary: `${action} on ${entityType.toLowerCase().replace('_', ' ')} (${db[col][docId].name || docId})`,
          changedFields: Object.keys(body),
          oldValues: oldDoc,
          newValues: db[col][docId]
        });
        saveDb(db);
        return jsonResp({ ok: true, doc: db[col][docId] });
      }

      if (method === 'DELETE') {
        delete db[col][docId];
        addHistory(db, {
          entityType,
          entityId: docId,
          action: 'DELETE',
          patientId: oldDoc && oldDoc.patientId,
          summary: `Deleted ${entityType.toLowerCase().replace('_', ' ')} (${(oldDoc && oldDoc.name) || docId})`,
          changedFields: [],
          oldValues: oldDoc,
          newValues: null
        });
        saveDb(db);
        return jsonResp({ ok: true });
      }
    }

    // --- Caregiver Endpoints ---
    if (path === '/caregiver/status' && method === 'GET') {
      const ctx = buildCaregiverContext(db, getActiveCaregiverId(db));
      return jsonResp(Object.assign({ ok: true }, ctx));
    }

    if (path === '/caregiver/shift_login' && method === 'POST') {
      const uid = getActiveCaregiverId(db);
      const ctx = buildCaregiverContext(db, uid);
      if (!ctx.hasActiveAssignment) return jsonResp({ ok: false, error: ctx.inactiveReason }, 400);
      const nowIso = new Date().toISOString();
      const lateReason = String(body.lateReason || '').trim();
      const loginStatus = lateReason ? 'LATE' : 'ON_TIME';
      db.logs[ctx.logId] = {
        assignmentId: ctx.asgId,
        planId: ctx.planId,
        patientId: ctx.patient.id,
        caregiverId: uid,
        date: ctx.shift.date,
        shiftDate: ctx.shift.date,
        shift: ctx.shift.timing,
        shiftDuration: ctx.shift.duration,
        loginTime: nowIso,
        logoutTime: '',
        loginStatus,
        loginDelayMinutes: lateReason ? (ctx.timingCheck.loginDelayMinutes || 15) : 0,
        lateLoginReason: lateReason,
        done: {},
        remarks: [],
        note: ''
      };
      addHistory(db, {
        entityType: 'ATTENDANCE_LOG',
        entityId: ctx.logId,
        action: 'CREATE',
        patientId: ctx.patient.id,
        patientName: ctx.patient.name,
        caregiverId: uid,
        caregiverName: ctx.user.name,
        summary: `${ctx.user.name} started shift for ${ctx.patient.name}`,
        reason: lateReason || undefined,
        changedFields: ['loginTime', 'loginStatus'],
        oldValues: null,
        newValues: { loginTime: nowIso, loginStatus }
      });
      saveDb(db);
      try { sessionStorage.removeItem(GPS_PASS_KEY); } catch (_) {}
      return jsonResp({
        ok: true,
        loginTime: nowIso,
        loginStatus,
        lateLoginReason: lateReason,
        shift: ctx.shift
      });
    }

    if (path === '/caregiver/early_logout_request' && method === 'POST') {
      const uid = getActiveCaregiverId(db);
      const ctx = buildCaregiverContext(db, uid);
      if (!ctx.hasActiveAssignment) return jsonResp({ ok: false, error: ctx.inactiveReason }, 400);
      const reqId = 'req_' + Date.now().toString(36);
      const reqObj = {
        type: 'EARLY_LOGOUT',
        logId: ctx.logId,
        assignmentId: ctx.asgId,
        caregiverId: uid,
        caregiverName: ctx.user.name,
        patientId: ctx.patient.id,
        patientName: ctx.patient.name,
        shiftDate: ctx.shift.date,
        shift: ctx.shift.timing,
        shiftStart: ctx.shift.start,
        shiftEnd: ctx.shift.end,
        shiftDuration: ctx.shift.duration,
        requestedAt: new Date().toISOString(),
        requestedTimeDisplay: fmtNow12h(),
        earlyByMinutes: ctx.timingCheck.earlyLogoutMinutes || 60,
        reason: body.reason || 'Personal reason',
        status: 'PENDING',
        adminNote: ''
      };
      db.requests[reqId] = reqObj;
      addHistory(db, {
        entityType: 'FOLLOW_UP_REQUEST',
        entityId: reqId,
        action: 'CREATE',
        patientId: ctx.patient.id,
        patientName: ctx.patient.name,
        caregiverId: uid,
        caregiverName: ctx.user.name,
        summary: `${ctx.user.name} requested early logout for ${ctx.patient.name}`,
        reason: reqObj.reason,
        changedFields: ['status', 'reason'],
        oldValues: null,
        newValues: reqObj
      });
      saveDb(db);
      return jsonResp({ ok: true, request: Object.assign({ id: reqId }, reqObj) });
    }

    if (path === '/caregiver/shift_logout' && method === 'POST') {
      const uid = getActiveCaregiverId(db);
      const ctx = buildCaregiverContext(db, uid);
      if (!ctx.hasActiveAssignment) return jsonResp({ ok: false, error: ctx.inactiveReason }, 400);
      const nowIso = new Date().toISOString();
      const log = db.logs[ctx.logId] || {
        assignmentId: ctx.asgId,
        planId: ctx.planId,
        patientId: ctx.patient.id,
        caregiverId: uid,
        date: ctx.shift.date,
        shiftDate: ctx.shift.date,
        shift: ctx.shift.timing,
        shiftDuration: ctx.shift.duration,
        loginTime: nowIso
      };
      log.logoutTime = nowIso;
      log.done = body.done || {};
      log.incompleteReasons = body.incompleteReasons || {};
      log.vitals = body.vitals || {};
      log.remarks = body.remarks || ['All care activities processed'];
      log.submittedAt = nowIso;
      if (ctx.earlyLogoutRequest && ctx.earlyLogoutRequest.status === 'APPROVED') {
        log.logoutStatus = 'EARLY_APPROVED';
        log.earlyLogoutMinutes = ctx.earlyLogoutRequest.earlyByMinutes || 0;
        log.earlyLogoutReason = ctx.earlyLogoutRequest.reason || '';
        log.earlyLogoutApprovedBy = ctx.earlyLogoutRequest.reviewedByName || 'Admin Supervisor';
      } else {
        log.logoutStatus = 'ON_TIME';
      }
      db.logs[ctx.logId] = log;
      addHistory(db, {
        entityType: 'ATTENDANCE_LOG',
        entityId: ctx.logId,
        action: 'UPDATE',
        patientId: ctx.patient.id,
        patientName: ctx.patient.name,
        caregiverId: uid,
        caregiverName: ctx.user.name,
        summary: `${ctx.user.name} completed shift for ${ctx.patient.name}`,
        changedFields: ['logoutTime', 'done', 'vitals'],
        oldValues: { logoutTime: '' },
        newValues: { logoutTime: nowIso, logoutStatus: log.logoutStatus }
      });
      saveDb(db);
      return jsonResp({ ok: true, logoutTime: nowIso, shift: ctx.shift });
    }

    if (path === '/caregiver/sos' && method === 'POST') {
      const uid = getActiveCaregiverId(db);
      const ctx = buildCaregiverContext(db, uid);
      const aid = 'al_' + Date.now().toString(36);
      db.alerts[aid] = {
        patientId: ctx.patient.id || 'p1',
        caregiverId: uid,
        type: body.reason || 'Emergency Alert',
        note: body.note || '',
        status: 'OPEN',
        raisedAt: new Date().toISOString(),
        closedBy: '',
        closedAt: ''
      };
      addHistory(db, {
        entityType: 'ALERT',
        entityId: aid,
        action: 'CREATE',
        patientId: ctx.patient.id,
        caregiverId: uid,
        summary: `Emergency SOS alert raised by ${ctx.user.name}: ${body.reason || 'Emergency'}`,
        changedFields: ['type', 'status'],
        oldValues: null,
        newValues: db.alerts[aid]
      });
      saveDb(db);
      return jsonResp({ ok: true });
    }

    // --- GPS Endpoints ---
    if (path === '/caregiver/gps/status' && method === 'GET') {
      let ok = false;
      try { ok = sessionStorage.getItem(GPS_PASS_KEY) === '1'; } catch (_) {}
      return jsonResp({ ok: true, isGpsOk: ok });
    }

    if (path === '/caregiver/gps/verify' && method === 'POST') {
      const ctx = buildCaregiverContext(db, getActiveCaregiverId(db));
      try { sessionStorage.setItem(GPS_PASS_KEY, '1'); } catch (_) {}
      return jsonResp({
        ok: true,
        patientName: (ctx.patient && ctx.patient.name) || 'Assigned Patient',
        distance_m: 18,
        accuracy_m: 12,
        radius_m: (ctx.patient && ctx.patient.geofenceRadiusM) || 100
      });
    }

    if (path === '/caregiver/gps/resolve_url' && method === 'GET') {
      const q = u.searchParams.get('url') || '';
      const m = q.match(/(-?\d+\.\d+)[,\s]+(-?\d+\.\d+)/);
      return jsonResp({
        ok: true,
        latitude: m ? parseFloat(m[1]) : 14.16421,
        longitude: m ? parseFloat(m[2]) : 77.81294,
        name: 'Patient Residence (Puttaparthi)'
      });
    }

    // --- Liveness Endpoints ---
    if (path === '/caregiver/liveness/challenge' && method === 'POST') {
      return jsonResp({
        ok: true,
        token: 'demo_liveness_' + Date.now(),
        maxAttempts: 5,
        attemptsRemaining: 5
      });
    }

    if (path === '/caregiver/liveness/verify' && method === 'POST') {
      return jsonResp({ ok: true, message: 'Face Verified!' });
    }

    // --- Auth Endpoints ---
    if (path === '/logout' && method === 'POST') {
      return jsonResp({ ok: true });
    }

    if (path.startsWith('/api/tts/stream')) {
      return new Response('', { status: 200 });
    }

    return null;
  }

  // Intercept fetch for internal endpoints
  const nativeFetch = global.fetch ? global.fetch.bind(global) : null;
  global.fetch = function (input, init) {
    const urlStr = typeof input === 'string' ? input : (input && input.url) || '';
    const isInternal = /^(\/api\/|\/caregiver\/|\/logout$|\/login$)/.test(urlStr) ||
      (urlStr.startsWith(global.location.origin) && /^\/(api|caregiver|logout|login)/.test(urlStr.slice(global.location.origin.length)));

    if (isInternal) {
      const method = ((init && init.method) || (input && input.method) || 'GET').toUpperCase();
      const body = parseBody(init);
      const mockRes = handleMockRequest(urlStr, method, body);
      if (mockRes) {
        if (method !== 'GET' && method !== 'HEAD') {
          notifyDemoAction();
        }
        return new Promise((resolve) => setTimeout(() => resolve(mockRes), 60));
      }
    }
    if (nativeFetch) return nativeFetch(input, init);
    return Promise.reject(new Error('Network unavailable in offline demo'));
  };

  function hydrateCaregiverWindowSM() {
    const db = loadDb();
    const uid = getActiveCaregiverId(db);
    const ctx = buildCaregiverContext(db, uid);

    global.SM = {
      csrf: 'demo-csrf-token',
      user: ctx.user,
      hasActiveAssignment: ctx.hasActiveAssignment,
      inactiveReason: ctx.inactiveReason,
      isFutureShift: ctx.isFutureShift,
      defaultPatientPhoto: 'static/img/avatars/patient_default.svg',
      avatars: {
        user: 'static/img/avatars/user_default.svg',
        caregiver: 'static/img/avatars/male_nurse.svg',
        patient: 'static/img/avatars/patient_default.svg',
        malePatient: 'static/img/avatars/male_patient.svg',
        femalePatient: 'static/img/avatars/female_patient.svg'
      },
      patient: ctx.patient,
      planInfo: ctx.planInfo,
      shift: ctx.shift,
      timingCheck: ctx.timingCheck,
      earlyLogoutRequest: ctx.earlyLogoutRequest,
      tasks: ctx.tasks,
      shiftState: ctx.shiftState,
      log: ctx.log,
      urls: {
        status: '/caregiver/status',
        shiftLogin: '/caregiver/shift_login',
        earlyLogoutRequest: '/caregiver/early_logout_request',
        shiftLogout: '/caregiver/shift_logout',
        livenessChallenge: '/caregiver/liveness/challenge',
        livenessVerify: '/caregiver/liveness/verify'
      }
    };

    const gdaPhoto = document.getElementById('gdaPhoto');
    if (gdaPhoto) {
      gdaPhoto.src = ctx.user.photo || (ctx.user.role === 'CAREGIVER' ? 'static/img/avatars/male_nurse.svg' : 'static/img/avatars/user_default.svg');
      gdaPhoto.alt = ctx.user.name || '';
    }
    const progBadge = document.getElementById('progressBadge');
    if (progBadge) {
      const done = (ctx.tasks || []).filter((t) => t.done).length;
      progBadge.textContent = `${done} of ${(ctx.tasks || []).length} done`;
    }
    const callEm = document.getElementById('sosEmergencyCallLink');
    if (callEm && ctx.patient) {
      callEm.href = 'tel:' + (ctx.patient.emergencyMobile || '9999999999');
    }
  }

  function authenticateDemoUser(rawId) {
    const db = loadDb();
    const id = String(rawId || '').trim();
    if (!id) return { ok: false, error: 'Enter your User ID' };
    const matchedKey = Object.keys(db.users).find((k) => k.toLowerCase() === id.toLowerCase());
    if (matchedKey) {
      const u = db.users[matchedKey];
      setActiveUserId(matchedKey);
      return { ok: true, id: matchedKey, role: u.role };
    }
    if (/^admin/i.test(id)) {
      setActiveUserId('admin');
      return { ok: true, id: 'admin', role: 'ADMIN' };
    }
    setActiveUserId('gda01');
    return { ok: true, id: 'gda01', role: 'CAREGIVER' };
  }

  function resetDemoData() {
    const seed = createSeedDb();
    saveDb(seed);
    try { sessionStorage.removeItem(GPS_PASS_KEY); } catch (_) {}
    return seed;
  }

  let _demoPopupTimer = null;

  function ensureDemoStylesAndBadge() {
    if (typeof document === 'undefined' || !document.head || !document.body) return;

    if (!document.getElementById('smDemoNoticeStyle')) {
      const style = document.createElement('style');
      style.id = 'smDemoNoticeStyle';
      style.textContent =
        '#smDemoHighlightBadge{' +
        'position:fixed;bottom:12px;left:12px;z-index:99990;' +
        'display:inline-flex;align-items:center;gap:7px;' +
        'background:linear-gradient(135deg,#B91C1C,#D97706);color:#FFFFFF;' +
        'border:2px solid #FEF08A;border-radius:999px;padding:7px 14px;' +
        'font:800 12px/1.2 system-ui,-apple-system,Segoe UI,Roboto,sans-serif;' +
        'letter-spacing:.04em;box-shadow:0 6px 20px rgba(185,28,28,.38);' +
        'cursor:pointer;user-select:none;}' +
        '#smDemoHighlightBadge .sm-demo-dot{width:8px;height:8px;border-radius:50%;background:#FEF08A;animation:smDemoPulse 1.5s infinite;}' +
        '@keyframes smDemoPulse{0%,100%{transform:scale(1);opacity:1}50%{transform:scale(1.35);opacity:.6}}' +
        '#smDemoActionPopup{' +
        'position:fixed;top:16px;left:50%;transform:translate(-50%,-18px);z-index:99999;' +
        'width:min(92vw,420px);background:#FFFBEB;color:#78350F;' +
        'border:2px solid #D97706;border-left:6px solid #DC2626;border-radius:14px;' +
        'padding:12px 14px;box-shadow:0 16px 36px rgba(15,23,42,.28);' +
        'display:flex;align-items:flex-start;gap:10px;opacity:0;pointer-events:none;' +
        'transition:opacity .2s ease,transform .2s ease;' +
        'font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;}' +
        '#smDemoActionPopup.sm-open{opacity:1;pointer-events:auto;transform:translate(-50%,0);}' +
        '#smDemoActionPopup .sm-pop-icon{font-size:18px;line-height:1.1;flex-shrink:0;}' +
        '#smDemoActionPopup .sm-pop-body{flex:1;min-width:0;}' +
        '#smDemoActionPopup .sm-pop-title{font-size:13px;font-weight:900;color:#991B1B;margin:0 0 2px;}' +
        '#smDemoActionPopup .sm-pop-sub{font-size:11.5px;font-weight:600;color:#78350F;line-height:1.35;margin:0;}' +
        '#smDemoActionPopup .sm-pop-close{background:none;border:0;color:#92400E;font-size:16px;font-weight:800;cursor:pointer;padding:0 4px;line-height:1;}';
      document.head.appendChild(style);
    }

    if (!document.getElementById('smDemoHighlightBadge')) {
      const badge = document.createElement('button');
      badge.type = 'button';
      badge.id = 'smDemoHighlightBadge';
      badge.className = 'notranslate';
      badge.setAttribute('translate', 'no');
      badge.innerHTML = '<span class="sm-demo-dot"></span><span>IT IS A DEMO</span>';
      badge.title = 'Demo Environment Notice';
      badge.addEventListener('click', () => notifyDemoAction('Demo preview mode'));
      document.body.appendChild(badge);
    }

    if (!document.getElementById('smDemoActionPopup')) {
      const pop = document.createElement('div');
      pop.id = 'smDemoActionPopup';
      pop.className = 'notranslate';
      pop.setAttribute('translate', 'no');
      pop.setAttribute('role', 'alert');
      pop.innerHTML =
        '<div class="sm-pop-icon">⚠️</div>' +
        '<div class="sm-pop-body">' +
        '  <div class="sm-pop-title">It is a DEMO, not Original project</div>' +
        '  <div class="sm-pop-sub" id="smDemoPopSub">Actions and created records are saved only in temporary browser demo storage.</div>' +
        '</div>' +
        '<button type="button" class="sm-pop-close" aria-label="Close demo notice">&times;</button>';
      pop.querySelector('.sm-pop-close').addEventListener('click', () => {
        pop.classList.remove('sm-open');
      });
      document.body.appendChild(pop);
    }
  }

  function notifyDemoAction(actionHint) {
    ensureDemoStylesAndBadge();
    const pop = typeof document !== 'undefined' && document.getElementById('smDemoActionPopup');
    if (!pop) return;
    const sub = document.getElementById('smDemoPopSub');
    if (sub) {
      sub.textContent = actionHint
        ? `${actionHint} — changes are simulated locally in this demo browser only.`
        : 'Changes you create or update are simulated locally in this demo browser only.';
    }
    pop.classList.add('sm-open');
    clearTimeout(_demoPopupTimer);
    _demoPopupTimer = setTimeout(() => {
      pop.classList.remove('sm-open');
    }, 3600);
  }

  if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', ensureDemoStylesAndBadge);
    } else {
      ensureDemoStylesAndBadge();
    }
  }

  global.SM_DEMO = {
    loadDb,
    saveDb,
    getActiveUserId,
    setActiveUserId,
    authenticateDemoUser,
    hydrateCaregiverWindowSM,
    resetDemoData,
    notifyDemoAction
  };
})(window);
