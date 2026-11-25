/**
 * =============================================================================
 * SNEHA MITRA — 100% Client-Side Web Speech API (speechSynthesis) Engine
 * Zero Server Network Calls | Zero Disk Storage | Pure Browser Voice Engine
 * =============================================================================
 */
(function () {
  'use strict';

  // 1. TRI-LINGUAL VOICE MESSAGES DICTIONARY
  const MESSAGES = {
    login_start: {
      en: 'Signing in to Sneha Mitra, please wait.',
      te: 'స్నేహ మిత్ర లోనికి లాగిన్ అవుతున్నారు, దయచేసి వేచి ఉండండి.',
      hi: 'स्नेहा मित्रा में लॉगिन हो रहे हैं, कृपया प्रतीक्षा करें।'
    },
    shift_login_success: {
      en: 'Shift login successful. Welcome to your duty.',
      te: 'షిఫ్ట్ లాగిన్ విజయవంతమైంది. మీ విధులకు స్వాగతం.',
      hi: 'शिफ्ट लॉगिन सफल रहा। आपकी ड्यूटी में स्वागत है।'
    },
    location_success: {
      en: 'Location verified successfully.',
      te: 'స్థాన ధృవీకరణ విజయవంతమైంది.',
      hi: 'स्थान सत्यापन सफल रहा।'
    },
    location_failed: {
      en: 'Location verification failed. Please check your GPS.',
      te: 'స్థాన ధృవీకరణ విఫలమైంది. దయచేసి మీ GPS ని తనిఖీ చేయండి.',
      hi: 'स्थान सत्यापन विफल रहा। कृपया अपना जीपीएस जांचें।'
    },
    face_success: {
      en: 'Face recognition successful.',
      te: 'ముఖ గుర్తింపు విజయవంతమైంది.',
      hi: 'चेहरा पहचान सफल रही।'
    },
    face_failed: {
      en: 'Face recognition failed. Please try again.',
      te: 'ముఖ గుర్తింపు విఫలమైంది. దయచేసి మళ్ళీ ప్రయత్నించండి.',
      hi: 'चेहरा पहचान विफल रही। कृपया पुनः प्रयास करें।'
    },
    task_completed: {
      en: '{task} duty completed.',
      te: '{task} పని పూర్తయింది.',
      hi: '{task} काम पूरा हो गया।'
    },
    task_removed: {
      en: '{task} duty removed.',
      te: '{task} పని తీసివేయబడింది.',
      hi: '{task} काम हटा दिया गया।'
    },
    logout_request_sent: {
      en: 'Logout request sent to admin. Please wait for approval.',
      te: 'నిష్క్రమణ అభ్యర్థన అడ్మిన్ కు పంపబడింది. దయచేసి ఆమోదం కోసం వేచి ఉండండి.',
      hi: 'लॉगआउट अनुरोध एडमिन को भेजा गया। कृपया स्वीकृति की प्रतीक्षा करें।'
    },
    logout_approved: {
      en: 'Logout request approved by admin. You can now end your shift.',
      te: 'నిష్క్రమణ అభ్యర్థన అడ్మిన్ ద్వారా ఆమోదించబడింది. మీరు ఇప్పుడు మీ షిఫ్ట్ ముగించవచ్చు.',
      hi: 'लॉगआउट अनुरोध एडमिन द्वारा स्वीकृत कर दिया गया। अब आप अपनी शिफ्ट समाप्त कर सकते हैं।'
    },
    logout_success: {
      en: 'Shift logout successful. Have a nice day.',
      te: 'షిఫ్ట్ లాగౌట్ విజయవంతమైంది. మంచి రోజు ఉండాలని కోరుకుంటున్నాము.',
      hi: 'Shift logout ho gaya. Aapka din shubh ho.'
    },
    internet_low: {
      en: 'Your internet is low.',
      te: 'మీ ఇంటర్నెట్ నెమ్మదిగా ఉంది.',
      hi: 'आपका इंटरनेट धीमा है।'
    }
  };

  // 2. COMMON TASK TRANSLATIONS (All PCA Catalog & Standard Tasks)
  const TASK_NAME_TR = {
    "Bath, mouth care and hair care": { te: "స్నానం, నోటి మరియు జుట్టు సంరక్షణ", hi: "स्नान, मुंह और बालों की देखभाल" },
    "Perineal care": { te: "పెరినియల్ సంరక్షణ", hi: "पेरिनियल देखभाल" },
    "Routine evening care": { te: "రోజువారీ సాయంత్రం సంరక్షణ", hi: "दैनिक शाम की देखभाल" },
    "Monitor temperature and pulse": { te: "ఉష్ణోగ్రత మరియు పల్స్ పర్యవేక్షణ", hi: "तापमान और नाड़ी की निगरानी" },
    "Monitor BP": { te: "రక్తపోటు (బీపీ) పర్యవేక్షణ", hi: "बीपी की निगरानी" },
    "Provide assistance for oral feeding": { te: "నోటి ద్వారా ఆహారానికి సహాయం", hi: "मौखिक भोजन में सहायता" },
    "Position changing - 2nd hourly / as needed": { te: "భంగిమ మార్పు - ప్రతి 2 గంటలకు / అవసరమైనప్పుడు", hi: "स्थिति बदलना - हर 2 घंटे / आवश्यकतानुसार" },
    "Back care - every 4 hours / as needed": { te: "వీపు సంరక్షణ - ప్రతి 4 గంటలకు / అవసరమైనప్పుడు", hi: "पीठ की देखभाल - हर 4 घंटे / आवश्यकतानुसार" },
    "Monitoring of Nimbus mattress and other devices": { te: "నింబస్ పరుపు మరియు ఇతర పరికరాల పర్యవేక్షణ", hi: "निम्बस गद्दे और अन्य उपकरणों की निगरानी" },
    "Perform skin assessment - 4 hours": { te: "చర్మ పరీక్ష నిర్వహణ - 4 గంటలు", hi: "त्वचा की जांच - 4 घंटे" },
    "Hot and cold application": { te: "వేడి మరియు చల్లని చికిత్స", hi: "गर्म और ठंडी सिंकाई" },
    "Preparing the environment for rest / relaxation": { te: "విశ్రాంతి కోసం వాతావరణాన్ని సిద్ధం చేయడం", hi: "आराम / विश्राम के लिए वातावरण तैयार करना" },
    "Preparing the environment for rest": { te: "విశ్రాంతి కోసం వాతావరణం సిద్ధం", hi: "आराम के लिए वातावरण तैयार करना" },
    "Assist in joint and muscle strengthening exercises": { te: "కీళ్ళు మరియు కండరాల వ్యాయామాలలో సహాయం", hi: "जोड़ों और मांसपेशियों के व्यायाम में सहायता" },
    "Assist in walking / climbing the stairs": { te: "నడక / మెట్లు ఎక్కడంలో సహాయం", hi: "चलने / सीढ़ियां चढ़ने में सहायता" },
    "Reading newspaper / book": { te: "వార్తాపత్రిక / పుస్తకం చదవడం", hi: "अखबार / किताब पढ़ना" },
    "Engage in playing indoor games, TV / music": { te: "ఇండోర్ ఆటలు, టీవీ / సంగీతంలో నిమగ్నం చేయడం", hi: "इनडोर खेल, टीवी / संगीत में शामिल करना" },
    "Accompany watching": { te: "తోడుగా ఉండటం / పర్యవేక్షణ", hi: "साथ में समय बिताना / निगरानी" },
    "Encourage new hobby development": { te: "కొత్త అభిరుచులను ప్రోత్సహించడం", hi: "नए शौक विकसित करने के लिए प्रोत्साहित करना" },
    "Listen to Bhajans and Radio Sai": { te: "భజనలు మరియు రేడియో సాయి వినడం", hi: "भजन और रेडियो साई सुनना" },
    "Facilitate prayer environment": { te: "ప్రార్థన వాతావరణాన్ని కల్పించడం", hi: "ప్రార్థన వాతావరణాన్ని కల్పించడం", hi: "प्रार्थना का माहौल बनाना" },
    "Provide bed pan, urinals": { te: "బెడ్ పాన్, యూరినల్స్ అందించడం", hi: "बेडपैन, यूरिनल उपलब्ध कराना" },
    "Assist to washroom": { te: "వాష్‌రూమ్‌కు సహాయం", hi: "शौचालय जाने में सहायता" },
    "Assist in oral medication": { te: "నోటి ద్వారా మందులు వేసుకోవడంలో సహాయం", hi: "मौखिक दवा लेने में सहायता" },
    "Morning Sponge Bath & Mouth Clean": { te: "ఉదయం స్పాంజ్ బాత్ & నోటి శుభ్రత", hi: "सुबह का स्पंज बाथ और मुंह की सफाई" },
    "Turn Patient / Change Position (Q2H)": { te: "రోగి భంగిమ మార్పు (ప్రతి 2 గంటలకు)", hi: "मरीज की करवट बदलना (हर 2 घंटे में)" },
    "Tube Feeding / Soft Breakfast": { te: "ట్యూబ్ ఫీడింగ్ / మృదువైన అల్పాహారం", hi: "ट्यूब से भोजन / हल्का नाश्ता" },
    "Check BP & Body Temperature": { te: "బీపీ & శరీర ఉష్ణోగ్రత తనిఖీ", hi: "बीपी और शरीर का तापमान जांचें" },
    "Back Massage & Air Mattress Check": { te: "వీపు మసాజ్ & ఎయిర్ బెడ్ తనిఖీ", hi: "पीठ की मालिश और एयर गद्दा जांच" },
    "Give Medicines on Time": { te: "సమయానికి మందులు ఇవ్వడం", hi: "समय पर दवाएं देना" }
  };

  // State Management
  let isMuted = localStorage.getItem('sneha_tts_muted') === 'true';
  let activeLang = localStorage.getItem('sm_lang') || window.SM_LANG || 'en';
  let lastInternetAlertTime = 0;

  // Map simple codes (en, te, hi) to BCP 47 standard tags
  const LANG_TAGS = {
    en: 'en-IN',
    te: 'te-IN',
    hi: 'hi-IN'
  };

  // 3. CORE WEB SPEECH SYNTHESIS ENGINE (User Standard Module)
  const Sneha = (() => {
    let voices = [];

    function load() {
      return new Promise((resolve) => {
        if (!('speechSynthesis' in window)) return resolve();
        voices = window.speechSynthesis.getVoices();
        if (voices.length) return resolve();

        window.speechSynthesis.onvoiceschanged = () => {
          voices = window.speechSynthesis.getVoices();
          resolve();
        };
        setTimeout(resolve, 1500); // Safety fallback if event never fires
      });
    }

    function pickVoice(lang, localOnly) {
      if (!voices || !voices.length) return null;
      const base = lang.split('-')[0].toLowerCase();
      const target = lang.toLowerCase().replace('_', '-');
      const pool = voices.filter(v => !localOnly || v.localService);

      // 1. Exact match by BCP-47 tag (e.g. te-IN or te_IN)
      const exact = pool.find(v => v.lang && v.lang.toLowerCase().replace('_', '-') === target);
      if (exact) return exact;

      // 2. Base match by language code prefix (e.g. 'te' or startsWith 'te-')
      const baseMatch = pool.find(v => v.lang && (v.lang.toLowerCase() === base || v.lang.toLowerCase().startsWith(base + '-')));
      if (baseMatch) return baseMatch;

      // 3. Name check ONLY for the explicit language keyword (e.g. "telugu", "తెలుగు")
      const langNames = {
        te: ['telugu', 'తెలుగు'],
        hi: ['hindi', 'हिन्दी', 'हिंदी'],
        en: ['english']
      };
      const keywords = langNames[base] || [];
      if (keywords.length) {
        const nameMatch = pool.find(v => {
          const n = (v.name || '').toLowerCase();
          return keywords.some(k => n.includes(k));
        });
        if (nameMatch) return nameMatch;
      }

      return null;
    }

    function splitText(text, max = 180) {
      const parts = text.match(/[^.!?।]+[.!?।]?/g) || [text];
      const out = [];
      let buf = '';
      for (const p of parts) {
        if ((buf + p).length > max && buf) {
          out.push(buf.trim());
          buf = '';
        }
        buf += p;
      }
      if (buf.trim()) out.push(buf.trim());
      return out;
    }

    let currentAudio = null;

    function playStream(text, lang, onEnd) {
      return new Promise((resolve) => {
        try {
          if (currentAudio) {
            try { currentAudio.pause(); currentAudio.currentTime = 0; } catch (_) {}
            currentAudio = null;
          }
          const shortLang = lang.split('-')[0];
          const streamUrl = `/api/tts/stream?lang=${encodeURIComponent(shortLang)}&text=${encodeURIComponent(text)}`;
          const audio = new Audio();
          currentAudio = audio;
          let finished = false;

          function done(success) {
            if (!finished) {
              finished = true;
              if (currentAudio === audio) currentAudio = null;
              if (onEnd && success) onEnd();
              resolve(success);
            }
          }

          audio.onended = () => done(true);
          audio.onerror = (e) => {
            console.warn('[SnehaVoice] Audio stream error:', e);
            done(false);
          };

          audio.src = streamUrl;
          const p = audio.play();
          if (p && typeof p.catch === 'function') {
            p.catch((err) => {
              console.warn('[SnehaVoice] Audio play error:', err);
              done(false);
            });
          }
        } catch (err) {
          console.warn('[SnehaVoice] Fallback audio exception:', err);
          resolve(false);
        }
      });
    }

    async function speakText(text, opts = {}) {
      if (isMuted || !text) return false;

      const {
        lang = 'en-IN',
        rate = 0.95,
        pitch = 1.0,
        volume = 1.0,
        localOnly = false,
        onEnd = null
      } = opts;

      await load();
      stop();

      const voice = pickVoice(lang, localOnly);

      // If browser has a genuine native voice for this language, use client-side speechSynthesis
      if (voice && 'speechSynthesis' in window) {
        try { window.speechSynthesis.cancel(); } catch (_) {}
        const chunks = splitText(text);
        chunks.forEach((chunk, i) => {
          const u = new SpeechSynthesisUtterance(chunk);
          u.lang = lang;
          u.rate = (lang.startsWith('te') || lang.startsWith('hi')) ? 0.90 : rate;
          u.pitch = pitch;
          u.volume = volume;
          u.voice = voice;
          if (i === chunks.length - 1 && onEnd) u.onend = onEnd;
          u.onerror = (e) => console.warn('[SnehaVoice] Speech error:', e.error);
          window.speechSynthesis.speak(u);
        });
        return true;
      }

      // If browser has NO genuine voice for this language (e.g. Telugu on Chrome desktop):
      // Seamlessly stream in-memory audio fallback (Zero disk storage, pure in-memory)
      return playStream(text, lang, onEnd);
    }

    const stop = () => {
      if ('speechSynthesis' in window) {
        try { window.speechSynthesis.cancel(); } catch (_) {}
      }
      if (currentAudio) {
        try { currentAudio.pause(); currentAudio.currentTime = 0; } catch (_) {}
        currentAudio = null;
      }
    };

    const listVoices = async () => {
      await load();
      return voices;
    };

    return { speak: speakText, stop, listVoices };
  })();

  // 4. BROWSER AUTOPLAY & AUDIO UNLOCKER
  let audioUnlocked = false;
  function unlockAudio() {
    if ('speechSynthesis' in window) {
      try { window.speechSynthesis.resume(); } catch (_) {}
    }
    if (!audioUnlocked) {
      try {
        const dummy = new Audio();
        dummy.volume = 0;
        const p = dummy.play();
        if (p && typeof p.catch === 'function') p.catch(() => {});
        dummy.pause();
        audioUnlocked = true;
      } catch (_) {}
    }
  }
  window.addEventListener('click', unlockAudio, { passive: true });
  window.addEventListener('touchstart', unlockAudio, { passive: true });
  window.addEventListener('pointerdown', unlockAudio, { passive: true });

  // 5. ON-SCREEN VISUAL TOAST
  function getOrCreateToast() {
    let toast = document.getElementById('snehaVoiceToast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'snehaVoiceToast';
      toast.innerHTML = `
        <div class="voice-icon">🔊</div>
        <div class="voice-wave"><span></span><span></span><span></span></div>
        <span id="snehaVoiceText"></span>
      `;
      document.body.appendChild(toast);
    }
    return toast;
  }

  function showOnScreenText(text) {
    const toast = getOrCreateToast();
    const textEl = document.getElementById('snehaVoiceText');
    if (textEl) textEl.textContent = text;
    toast.classList.add('active');
    clearTimeout(toast._hideTimer);
    toast._hideTimer = setTimeout(() => { toast.classList.remove('active'); }, 4200);
  }

  // 6. LANGUAGE & TRANSLATION HELPERS
  function getLang() {
    if (window.SM_LANG && ['en', 'te', 'hi'].includes(window.SM_LANG)) return window.SM_LANG;
    const saved = localStorage.getItem('sm_lang');
    if (saved && ['en', 'te', 'hi'].includes(saved)) return saved;
    return activeLang || 'en';
  }

  function setLanguage(lang) {
    if (['en', 'te', 'hi'].includes(lang)) {
      activeLang = lang;
      try { localStorage.setItem('sm_lang', lang); } catch (_) {}
    }
  }

  function translateTaskTitle(rawTitle, lang) {
    if (!rawTitle || lang === 'en') return rawTitle;
    if (typeof window.tr === 'function') {
      const translated = window.tr(rawTitle);
      if (translated && translated !== rawTitle) return translated;
    }
    const entry = TASK_NAME_TR[rawTitle.trim()];
    if (entry && entry[lang]) return entry[lang];
    return rawTitle;
  }

  // 7. MUTE BUTTON UI
  function renderMuteButton() {
    let btn = document.getElementById('snehaVoiceMuteBtn');
    if (!btn) {
      const target = document.getElementById('langBar') || document.querySelector('header');
      if (!target || !target.parentNode) return;
      btn = document.createElement('button');
      btn.id = 'snehaVoiceMuteBtn';
      btn.type = 'button';
      btn.setAttribute('aria-label', 'Toggle Voice Announcements');
      btn.onclick = toggleMute;
      target.parentNode.insertBefore(btn, target.nextSibling);
    } else {
      btn.onclick = toggleMute;
    }
    btn.textContent = isMuted ? '🔇' : '🔊';
    btn.title = isMuted ? 'Voice Muted (Click to Unmute)' : 'Voice Enabled (Click to Mute)';
    btn.classList.toggle('muted', isMuted);
  }

  function toggleMute() {
    unlockAudio();
    isMuted = !isMuted;
    localStorage.setItem('sneha_tts_muted', String(isMuted));
    renderMuteButton();

    const lang = getLang();
    const mutedMsg = (lang === 'te') ? 'వాయిస్ సందేశాలు మ్యూట్ చేయబడ్డాయి' : (lang === 'hi') ? 'ध्वनि संदेश म्यूट किए गए' : 'Voice messages muted';
    const unmutedMsg = (lang === 'te') ? 'వాయిస్ సందేశాలు ప్రారంభించబడ్డాయి' : (lang === 'hi') ? 'ध्वनि संदेश चालू किए गए' : 'Voice messages enabled';

    if (isMuted) {
      Sneha.stop();
      showOnScreenText(mutedMsg);
    } else {
      showOnScreenText(unmutedMsg);
      const bcpTag = LANG_TAGS[lang] || 'en-IN';
      Sneha.speak(unmutedMsg, { lang: bcpTag });
    }
  }

  // 8. HIGH-LEVEL API CALLED BY CAREGIVER.JS, GPS.JS & LIVENESS.JS
  function speak(messageKey, options) {
    if (isMuted) return;
    const lang = getLang();
    const text = (MESSAGES[messageKey] && (MESSAGES[messageKey][lang] || MESSAGES[messageKey]['en'])) || messageKey;
    if (!text) return;

    showOnScreenText(text);

    const bcpTag = LANG_TAGS[lang] || 'en-IN';
    Sneha.speak(text, {
      lang: bcpTag,
      onEnd: options && options.onEnd
    });
  }

  function speakTask(actionKey, rawTitle, options) {
    if (isMuted) return;
    const lang = getLang();
    const localizedTitle = translateTaskTitle(rawTitle, lang);
    const template = (MESSAGES[actionKey] && MESSAGES[actionKey][lang]) || MESSAGES[actionKey]['en'] || '{task}';
    const text = template.replace('{task}', localizedTitle);

    showOnScreenText(text);

    const bcpTag = LANG_TAGS[lang] || 'en-IN';
    Sneha.speak(text, {
      lang: bcpTag,
      onEnd: options && options.onEnd
    });
  }

  function checkNetworkStatus() {
    const now = Date.now();
    if (now - lastInternetAlertTime < 30000) return;
    const isOffline = !navigator.onLine;
    let isSlow = false;
    if (navigator.connection) {
      const conn = navigator.connection;
      if (conn.effectiveType === 'slow-2g' || conn.effectiveType === '2g' || (conn.downlink && conn.downlink < 0.4)) {
        isSlow = true;
      }
    }
    if (isOffline || isSlow) {
      lastInternetAlertTime = now;
      speak('internet_low');
    }
  }

  window.addEventListener('offline', checkNetworkStatus);
  if (navigator.connection) navigator.connection.addEventListener('change', checkNetworkStatus);

  function init() {
    renderMuteButton();
    if ('speechSynthesis' in window) {
      window.speechSynthesis.getVoices();
    }
  }

  // 9. EXPOSE EXACT GLOBAL API WITH ALL ORIGINAL CONNECTIONS INTACT
  window.SnehaVoice = {
    speak: speak,
    speakTask: speakTask,
    setLanguage: setLanguage,
    getLang: getLang,
    toggleMute: toggleMute,
    isMuted: () => isMuted,
    stop: Sneha.stop,
    listVoices: Sneha.listVoices
  };

  // Alias Sneha directly on window
  window.Sneha = Sneha;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
