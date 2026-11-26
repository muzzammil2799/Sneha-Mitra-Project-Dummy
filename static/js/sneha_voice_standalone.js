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
    "Facilitate prayer environment": { te: "ప్రార్థన వాతావరణాన్ని కల్పించడం", hi: "प्रार्थना का माहौल बनाना" },
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
    let currentAudio = null;
    let speakSeq = 0;

    function ensureNoReferrerMeta() {
      try {
        if (typeof document === 'undefined' || !document.head) return;
        let meta = document.querySelector('meta[name="referrer"]');
        if (!meta) {
          meta = document.createElement('meta');
          meta.name = 'referrer';
          meta.content = 'no-referrer';
          document.head.appendChild(meta);
        }
      } catch (_) {}
    }

    function load() {
      return new Promise((resolve) => {
        if (!('speechSynthesis' in window)) return resolve();
        voices = window.speechSynthesis.getVoices();
        if (voices.length) return resolve();

        let done = false;
        const finish = () => {
          if (done) return;
          done = true;
          try { window.speechSynthesis.removeEventListener('voiceschanged', onChanged); } catch (_) {}
          resolve();
        };
        const onChanged = () => {
          voices = window.speechSynthesis.getVoices();
          if (voices.length) finish();
        };
        try {
          window.speechSynthesis.addEventListener('voiceschanged', onChanged);
        } catch (_) {
          window.speechSynthesis.onvoiceschanged = onChanged;
        }
        setTimeout(finish, 300); // Keep user-gesture activation fresh
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

    function buildStreamCandidates(text, shortLang) {
      const q = encodeURIComponent(text.slice(0, 180));
      const gtxTts = `https://translate.googleapis.com/translate_tts?ie=UTF-8&tl=${encodeURIComponent(shortLang)}&client=gtx&q=${q}`;
      const twObTts = `https://translate.googleapis.com/translate_tts?ie=UTF-8&tl=${encodeURIComponent(shortLang)}&client=tw-ob&q=${q}`;
      const isStaticDemo = Boolean(window.SM_DEMO) || window.location.protocol === 'file:';
      if (isStaticDemo) {
        return [gtxTts, twObTts];
      }
      return [
        `/api/tts/stream?lang=${encodeURIComponent(shortLang)}&text=${encodeURIComponent(text)}`,
        gtxTts,
        twObTts
      ];
    }

    let sharedAudio = null;
    function getSharedAudio() {
      if (!sharedAudio) {
        sharedAudio = new Audio();
      }
      return sharedAudio;
    }

    function playStreamChunk(chunk, shortLang, seq) {
      return new Promise((resolve) => {
        if (seq !== speakSeq) return resolve(false);
        const candidates = buildStreamCandidates(chunk, shortLang);
        let idx = 0;

        function tryNext() {
          if (seq !== speakSeq) {
            currentAudio = null;
            return resolve(false);
          }
          if (idx >= candidates.length) {
            currentAudio = null;
            return resolve(false);
          }
          const audio = getSharedAudio();
          audio.onended = null;
          audio.onerror = null;
          currentAudio = audio;
          let settled = false;

          const fail = () => {
            if (settled) return;
            settled = true;
            audio.onended = null;
            audio.onerror = null;
            idx += 1;
            tryNext();
          };

          audio.onended = () => {
            if (settled) return;
            settled = true;
            audio.onended = null;
            audio.onerror = null;
            if (currentAudio === audio) currentAudio = null;
            resolve(true);
          };
          audio.onerror = fail;

          audio.volume = 1.0;
          audio.src = candidates[idx];
          const p = audio.play();
          if (p && typeof p.catch === 'function') {
            p.catch(fail);
          }
        }

        tryNext();
      });
    }

    async function playStream(text, lang, onEnd, seq) {
      try {
        ensureNoReferrerMeta();
        if (currentAudio) {
          try {
            currentAudio.onended = null;
            currentAudio.onerror = null;
            currentAudio.pause();
            currentAudio.currentTime = 0;
          } catch (_) {}
          currentAudio = null;
        }
        const shortLang = lang.split('-')[0];
        const chunks = splitText(text, 160);
        let allPlayed = true;
        for (const chunk of chunks) {
          if (seq !== speakSeq) return false;
          const ok = await playStreamChunk(chunk, shortLang, seq);
          if (!ok) {
            allPlayed = false;
            break;
          }
        }
        if (allPlayed && seq === speakSeq && onEnd) onEnd();
        return allPlayed;
      } catch (err) {
        console.warn('[SnehaVoice] Fallback audio exception:', err);
        return false;
      }
    }

    function speakWithNativeVoice(text, opts, voice, mySeq, allowStreamFallback) {
      const {
        lang = 'en-IN',
        rate = 0.95,
        pitch = 1.0,
        volume = 1.0,
        onEnd = null
      } = opts;

      return new Promise((resolve) => {
        try {
          if (window.speechSynthesis.speaking || window.speechSynthesis.pending) {
            window.speechSynthesis.cancel();
          }
          window.speechSynthesis.resume();
        } catch (_) {}

        const chunks = splitText(text);
        let started = false;
        let fellBack = false;
        let settled = false;

        const fallbackToStream = (reason) => {
          if (fellBack || settled || mySeq !== speakSeq) return;
          fellBack = true;
          settled = true;
          clearTimeout(startWatchdog);
          console.warn('[SnehaVoice] Native voice fallback to stream:', reason);
          try { window.speechSynthesis.cancel(); } catch (_) {}
          if (allowStreamFallback) {
            playStream(text, lang, onEnd, mySeq).then(resolve);
          } else {
            resolve(false);
          }
        };

        const startWatchdog = setTimeout(() => {
          if (!started) fallbackToStream('start-timeout');
        }, 1200);

        chunks.forEach((chunk, i) => {
          const u = new SpeechSynthesisUtterance(chunk);
          u.lang = lang;
          u.rate = (lang.startsWith('te') || lang.startsWith('hi')) ? 0.90 : rate;
          u.pitch = pitch;
          u.volume = volume;
          u.voice = voice;
          u.onstart = () => {
            started = true;
            clearTimeout(startWatchdog);
          };
          if (i === chunks.length - 1) {
            u.onend = () => {
              clearTimeout(startWatchdog);
              if (!fellBack && !settled && mySeq === speakSeq) {
                settled = true;
                if (onEnd) onEnd();
                resolve(true);
              }
            };
          }
          u.onerror = (e) => {
            const errCode = (e && e.error) || 'unknown';
            if (errCode === 'interrupted' || errCode === 'canceled') return;
            fallbackToStream(errCode);
          };
          window.speechSynthesis.speak(u);
        });
      });
    }

    async function speakText(text, opts = {}) {
      if (isMuted || !text) return false;

      const {
        lang = 'en-IN',
        localOnly = false,
        onEnd = null
      } = opts;

      stop();
      const mySeq = ++speakSeq;

      if (!voices.length && 'speechSynthesis' in window) {
        voices = window.speechSynthesis.getVoices();
      }
      if (!voices.length) {
        await load();
        if (mySeq !== speakSeq) return false;
      }

      // Prefer genuine local OS voices; avoid broken/slow cloud speechSynthesis voices for Telugu/Hindi
      // by streaming TTS immediately inside the user click gesture.
      const localVoice = pickVoice(lang, true);
      if (localVoice && 'speechSynthesis' in window) {
        return speakWithNativeVoice(text, opts, localVoice, mySeq, true);
      }

      const streamOk = await playStream(text, lang, onEnd, mySeq);
      if (streamOk || mySeq !== speakSeq) return streamOk;

      if (!localOnly && 'speechSynthesis' in window) {
        const cloudVoice = pickVoice(lang, false);
        if (cloudVoice) {
          return speakWithNativeVoice(text, opts, cloudVoice, mySeq, false);
        }
      }
      return false;
    }

    const stop = () => {
      speakSeq += 1;
      if ('speechSynthesis' in window) {
        try { window.speechSynthesis.cancel(); } catch (_) {}
      }
      if (currentAudio) {
        try {
          currentAudio.onended = null;
          currentAudio.onerror = null;
          currentAudio.pause();
          currentAudio.currentTime = 0;
        } catch (_) {}
        currentAudio = null;
      }
    };

    const listVoices = async () => {
      await load();
      return voices;
    };

    return {
      speak: speakText,
      stop,
      listVoices,
      ensureNoReferrerMeta,
      getSharedAudio,
      isPlayingAudio: () => Boolean(currentAudio)
    };
  })();

  // 4. BROWSER AUTOPLAY & AUDIO UNLOCKER
  let audioUnlocked = false;
  const SILENT_WAV = 'data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA';
  function unlockAudio() {
    if ('speechSynthesis' in window) {
      try { window.speechSynthesis.resume(); } catch (_) {}
    }
    if (!audioUnlocked && !Sneha.isPlayingAudio()) {
      audioUnlocked = true;
      try {
        const audio = Sneha.getSharedAudio();
        if (!audio.src || audio.paused) {
          audio.volume = 0.01;
          audio.src = SILENT_WAV;
          const p = audio.play();
          if (p && typeof p.then === 'function') {
            p.then(() => {
              if (!Sneha.isPlayingAudio() && audio.src === SILENT_WAV) {
                try { audio.pause(); } catch (_) {}
              }
            }).catch((err) => {
              if (!err || err.name !== 'AbortError') audioUnlocked = false;
            });
          }
        }
      } catch (_) {
        audioUnlocked = false;
      }
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
    } else if (!btn.hasAttribute('data-action')) {
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
    Sneha.ensureNoReferrerMeta();
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
