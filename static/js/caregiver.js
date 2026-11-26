/* ======================================================== */
/* SNEHA MITRA - FRONT-LINE GDA NURSING CARE SCRIPT         */
/* ======================================================== */

(function () {
  'use strict';

  const POLL_INTERVAL_MS = 4000;
  const TOAST_DURATION_MS = 2600;
  const SHIFT_NOT_STARTED = 'NOT_STARTED';
  const SHIFT_ON_DUTY = 'ON_DUTY';
  const SHIFT_COMPLETED = 'COMPLETED';

  const sm = window.SM || {};
  let TASKS = Array.isArray(sm.tasks) ? sm.tasks : [];

  let shiftState = sm.shiftState || SHIFT_NOT_STARTED;
  const incompleteReasonsMap = {};
  let LANG = 'en';
  window.SM_LANG = LANG;
  let _lateLoginHasLiveToken = false;
  let _statusPollTimer = null;

  const DEFAULT_ICON = window.SM_DEFAULT_ICON || '';
  const CAT_ICON_MAP = window.SM_CAT_ICON_MAP || {};
  const ICONS = window.SM_ICONS || {};

  const byId = (id) => document.getElementById(id);

  function esc(s) {
    const raw = (s === null || s === undefined) ? '' : s;
    return String(raw).replace(/[&<>"']/g, (c) => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[c]));
  }

  function fmtTime(iso) {
    if (!iso) return '';
    try {
      return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch (_) {
      return iso;
    }
  }

  function formatDurationMins(mins) {
    const total = Math.max(0, Math.round(+mins || 0));
    const h = Math.floor(total / 60);
    const m = total % 60;
    if (h > 0 && m > 0) return `${h} hr${h !== 1 ? 's' : ''} ${m} min${m !== 1 ? 's' : ''}`;
    if (h > 0) return `${h} hr${h !== 1 ? 's' : ''}`;
    return `${m} min${m !== 1 ? 's' : ''}`;
  }

  async function apiRequest(url, options = {}) {
    const method = options.method || 'GET';
    const headers = Object.assign({ Accept: 'application/json' }, options.headers || {});
    if (options.body !== undefined) {
      headers['Content-Type'] = 'application/json';
      headers['X-CSRF-Token'] = sm.csrf;
    }
    const res = await fetch(url, {
      method,
      credentials: 'same-origin',
      headers,
      body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
    });
    if (res.status === 401) {
      window.location.href = 'login.html';
      return { ok: false, status: 401, data: {} };
    }
    const data = await res.json().catch(() => ({}));
    return { ok: res.ok, status: res.status, data };
  }

  /* ---------- Translation Dictionary & Dynamic Language Switching ---------- */
  const TR = {
    // Caregiver & Patient Names / IDs / Roles
    "prasad": ["ప్రసాద్", "प्रसाद"],
    "Prasad": ["ప్రసాద్", "प्रसाद"],
    "prasad12": ["ప్రసాద్12", "प्रसाद12"],
    "Prasad12": ["ప్రసాద్12", "प्रसाद12"],
    "(prasad12)": ["(ప్రసాద్12)", "(प्रसाद12)"],
    "Charan tej": ["చరణ్ తేజ్", "चरण तेज"],
    "Charan Tej": ["చరణ్ తేజ్", "चरण तेज"],
    "charan tej": ["చరణ్ తేజ్", "चरण तेज"],
    "Charan": ["చరణ్", "चरण"],
    "charan": ["చరణ్", "चरण"],
    "tej": ["తేజ్", "तेज"],
    "Tej": ["తేజ్", "तेज"],
    "tej2": ["తేజ్2", "तेज2"],
    "Chinna": ["చిన్నా", "चिन्ना"],
    "Ramesh Kumar": ["రమేష్ కుమార్", "रमेश कुमार"],
    "Ramesh": ["రమేష్", "रमेश"],
    "Kumar": ["కుమార్", "कुमार"],
    "Anand Rao": ["ఆనంద్ రావు", "आनंद राव"],
    "Anand": ["ఆనంద్", "आनंद"],
    "Rao": ["రావు", "राव"],
    "Suresh Rao": ["సురేష్ రావు", "सुरेश राव"],
    "Suresh": ["సురేష్", "सुरेश"],
    "Lakshmi Devi": ["లక్ష్మి దేవి", "लक्ष्मी देवी"],
    "Lakshmi": ["లక్ష్మి", "लक्ष्मी"],
    "Devi": ["దేవి", "देवी"],
    "gda01": ["జీడీఏ01", "जीडीए01"],
    "GDA": ["జీడీఏ", "जीडीए"],
    "Admin": ["అడ్మిన్", "एडमिन"],
    "Supervisor": ["సూపర్‌వైజర్", "पर्यवेक्षक"],
    "Admin Supervisor": ["అడ్మిన్ సూపర్‌వైజర్", "एडमिन सुपरवाइजर"],
    "Sravani": ["శ్రావణి", "श्रावणी"],
    "Sarada Devi": ["శారదా దేవి", "शारदा देवी"],
    "Venkata Rao": ["వెంకట రావు", "वेंकट राव"],
    "Raghava Rao (Son)": ["రాఘవ రావు (కుమారుడు)", "राघव राव (बेटा)"],
    "Meera Rao (Daughter)": ["మీరా రావు (కుమార్తె)", "मीरा राव (बेटी)"],
    "Karthik Sharma": ["కార్తీక్ శర్మ", "कार्तिक शर्मा"],
    "Dr. Kavitha Nair": ["డా. కవిత నాయర్", "डॉ. कविता नायर"],
    "Dr. S. Narayana": ["డా. ఎస్. నారాయణ", "डॉ. एस. नारायण"],
    "Prasanthi Nilayam Road, Puttaparthi": ["ప్రశాంతి నిలయం రోడ్, పుట్టపర్తి", "प्रशांति निलयम रोड, पुट्टपर्थी"],
    "Gopuram Street, Puttaparthi": ["గోపురం వీధి, పుట్టపర్తి", "गोपुरम स्ट्रीट, पुट्टपर्थी"],
    "Chitravathi Road, Puttaparthi": ["చిత్రావతి రోడ్, పుట్టపర్తి", "चित्रावती रोड, पुट्टपर्थी"],
    "Bukkapatnam Main Rd, Puttaparthi": ["బుక్కపట్నం మెయిన్ రోడ్, పుట్టపర్తి", "बुक्कपट्टनम मेन रोड, पुट्टपर्थी"],

    // Header & Greeting
    "Good Morning": ["శుభోదయం", "सुप्रभात"],
    "Good Afternoon": ["శుభ మధ్యాహ్నం", "शुभ दोपहर"],
    "Good Evening": ["శుభ సాయంత్రం", "शुभ संध्या"],
    "Good Night": ["శుభరాత్రి", "शुभ रात्रि"],
    "Sign Out": ["లాగ్ అవుట్", "लॉग आउट"],
    "Shift:": ["షిఫ్ట్:", "शिफ्ट:"],
    "Shift": ["షిఫ్ట్", "शिफ्ट"],
    "Date:": ["తేదీ:", "दिनांक:"],
    "Date": ["తేదీ", "दिनांक"],
    "Extended": ["పొడిగించబడింది", "विस्तारित"],
    "Morning Shift": ["ఉదయం షిఫ్ట్", "सुबह की शिफ्ट"],
    "Evening Shift": ["సాయంత్రం షిఫ్ట్", "शाम की शिफ्ट"],
    "Night Shift": ["రాత్రి షిఫ్ట్", "रात की शिफ्ट"],

    // Units & Time / Duration
    "hrs": ["గంటలు", "घंटे"],
    "hr": ["గంట", "घंटा"],
    "hours": ["గంటలు", "घंटे"],
    "hour": ["గంట", "घंटा"],
    "mins": ["నిమిషాలు", "मिनट"],
    "min": ["నిమిషం", "मिनट"],
    "minutes": ["నిమిషాలు", "मिनट"],
    "yrs": ["సంవత్సరాలు", "वर्ष"],
    "yr": ["సంవత్సరం", "वर्ष"],
    "years": ["సంవత్సరాలు", "वर्ष"],
    "year": ["సంవత్సరం", "वर्ष"],
    "Now": ["ఇప్పుడు", "अभी"],
    "early": ["ముందుగా", "पहले"],

    // Patient Information
    "ID:": ["ఐడీ:", "आईडी:"],
    "ID": ["ఐడీ", "आईडी"],
    "Female": ["స్త్రీ", "महिला"],
    "Male": ["పురుషుడు", "पुरुष"],
    "Patient": ["రోగి", "मरीज"],
    "Home Care": ["గృహ సంరక్షణ", "होम केयर"],
    "Daily Assistance": ["రోజువారీ సహాయం", "दैनिक सहायता"],
    "Vital Monitoring": ["వైటల్స్ పర్యవేక్షణ", "वाइटल्स निगरानी"],
    "Elderly Care": ["వృద్ధుల సంరక్షణ", "बुजुर्गों की देखभाल"],
    "Post Operative": ["ఆపరేషన్ తదుపరి సంరక్షణ", "ऑपरेशन के बाद की देखभाल"],
    "Bedridden": ["మంచానికే పరిమితమైన రోగి", "बिस्तर पर आश्रित मरीज"],
    "Palliative Care": ["పాలియేటివ్ సంరక్షణ", "उपशामक देखभाल"],
    "Dementia Care": ["డిమెన్షియా సంరక్షణ", "डिमेंशिया देखभाल"],
    "Physiotherapy": ["ఫిజియోథెరపీ", "फिजियोथेरेपी"],
    "No Active Care Shift": ["యాక్టివ్ కేర్ షిఫ్ట్ లేదు", "कोई सक्रिय केयर शिफ्ट नहीं"],
    "No active patient shift assigned. Contact Administrator.": ["యాక్టివ్ రోగి షిఫ్ట్ కేటాయించలేదు. నిర్వాహకుడిని సంప్రదించండి.", "कोई सक्रिय मरीज शिफ्ट आवंटित नहीं है। व्यवस्थापक से संपर्क करें।"],

    // Shift Duty Status
    "Shift Duty Status": ["షిఫ్ట్ డ్యూటీ స్థితి", "शिफ्ट ड्यूटी स्थिति"],
    "Not Started": ["ప్రారంభం కాలేదు", "शुरू नहीं हुआ"],
    "On Duty": ["డ్యూటీలో ఉన్నారు", "ड्यूटी पर"],
    "Shift Completed": ["షిఫ్ట్ పూర్తయింది", "शिफ्ट समाप्त"],
    "Shift Date": ["షిఫ్ట్ తేదీ", "शिफ्ट तिथि"],
    "Login Time": ["లాగిన్ సమయం", "लॉगिन समय"],
    "Logout Time": ["లాగౌట్ సమయం", "लॉगआउट समय"],
    "Logged in at:": ["లాగిన్ సమయం:", "लॉगिन समय:"],
    "Logged in at": ["లాగిన్ సమయం", "लॉगिन समय"],
    "Logged out at:": ["లాగౌట్ సమయం:", "लॉगआउट समय:"],
    "Logged out at": ["లాగౌట్ సమయం", "लॉगआउट समय"],
    "Shift not started. Please log in to view today's care tasks.": ["షిఫ్ట్ ప్రారంభం కాలేదు. పనులను చూడటానికి లాగిన్ చేయండి.", "शिफ्ट शुरू नहीं हुई। काम देखने के लिए लॉगिन करें।"],
    "Start Shift (Log In)": ["షిఫ్ట్ ప్రారంభించండి (లాగిన్)", "शिफ्ट शुरू करें (लॉगिन)"],
    "End Shift (Log Out)": ["షిఫ్ట్ ముగించండి (లాగౌట్)", "शिफ्ट समाप्त करें (लॉगआउट)"],
    "Scheduled": ["షెడ్యూల్ చేయబడింది", "निर्धारित"],
    "(Delayed)": ["(ఆలస్యం)", "(विलंबित)"],

    // Shift Notices
    "Tasks Locked Prior to Shift Login": ["షిఫ్ట్ లాగిన్‌కు ముందు పనులు లాక్ చేయబడ్డాయి", "शिफ्ट लॉगिन से पहले कार्य लॉक हैं"],
    "Care activities and vitals are locked. Tap Start Shift (Log In) above to begin your shift duty and reveal today's care tasks.": ["సంరక్షణ పనులు మరియు వైటల్స్ లాక్ చేయబడ్డాయి. నేటి పనులను చూడటానికి పైన ఉన్న 'షిఫ్ట్ ప్రారంభించండి' నొక్కండి.", "देखभाल कार्य और वाइटल्स लॉक हैं। आज के कार्य देखने के लिए ऊपर 'शिफ्ट शुरू करें' पर टैप करें।"],
    "Today's Shift is Completed": ["నేటి షిఫ్ట్ పూర్తయింది", "आज की शिफ्ट समाप्त हो गई है"],
    "All completed tasks, reasons, and attendance details have been securely saved to the database.": ["పూర్తయిన పనులు, కారణాలు మరియు వివరాలు డేటాబేస్‌లో భద్రపరచబడ్డాయి.", "पूरे किए गए कार्य, कारण और विवरण डेटाबेस में सुरक्षित हैं।"],

    // Vitals
    "Current Vitals": ["ప్రస్తుత వైటల్స్", "वर्तमान वाइटल्स"],
    "+ Update": ["+ అప్‌డేట్", "+ अपडेट"],
    "Update Patient Vitals": ["రోగి వైటల్స్ అప్‌డేట్", "मरीज के वाइटल्स अपडेट"],
    "BP (mmHg)": ["బీపీ (mmHg)", "बीपी (mmHg)"],
    "SpO2 (%)": ["SpO2 (%)", "SpO2 (%)"],
    "Pulse (bpm)": ["పల్స్ (bpm)", "पल्स (bpm)"],
    "Temp (°F)": ["ఉష్ణోగ్రత (°F)", "तापमान (°F)"],
    "Temp (&deg;F)": ["ఉష్ణోగ్రత (°F)", "तापमान (°F)"],
    "Sugar (GRBS mg/dL)": ["షుగర్ (GRBS mg/dL)", "शुगर (GRBS mg/dL)"],
    "BP": ["బీపీ", "बीपी"],
    "SpO2": ["SpO2", "SpO2"],
    "Pulse": ["పల్స్", "पल्स"],
    "Temp": ["ఉష్ణోగ్రత", "तापमान"],
    "Sugar": ["షుగర్", "शुगर"],
    "(Normal)": ["(సాధారణం)", "(सामान्य)"],
    "Normal": ["సాధారణం", "सामान्य"],
    "PulseOx": ["పల్స్ ఆక్స్", "पल्स ऑक्स"],
    "Oral": ["నోటి ద్వారా", "मौखिक"],
    "Save & Sync Vitals": ["వైటల్స్ సేవ్ చేయండి", "वाइटल्स सहेजें"],

    // All PCA Catalog Tasks (a1 to a23)
    "Bath, mouth care and hair care": ["స్నానం, నోటి మరియు జుట్టు సంరక్షణ", "स्नान, मुंह और बालों की देखभाल"],
    "Perineal care": ["పెరినియల్ సంరక్షణ", "पेरिनियल देखभाल"],
    "Routine evening care": ["రోజువారీ సాయంత్రం సంరక్షణ", "दैनिक शाम की देखभाल"],
    "Monitor temperature and pulse": ["ఉష్ణోగ్రత మరియు పల్స్ పర్యవేక్షణ", "तापमान और नाड़ी की निगरानी"],
    "Monitor BP": ["రక్తపోటు (బీపీ) పర్యవేక్షణ", "बीपी की निगरानी"],
    "Provide assistance for oral feeding": ["నోటి ద్వారా ఆహారానికి సహాయం", "मौखिक भोजन में सहायता"],
    "Position changing - 2nd hourly / as needed": ["భంగిమ మార్పు - ప్రతి 2 గంటలకు / అవసరమైనప్పుడు", "स्थिति बदलना - हर 2 घंटे / आवश्यकतानुसार"],
    "Back care - every 4 hours / as needed": ["వీపు సంరక్షణ - ప్రతి 4 గంటలకు / అవసరమైనప్పుడు", "पीठ की देखभाल - हर 4 घंटे / आवश्यकतानुसार"],
    "Monitoring of Nimbus mattress and other devices": ["నింబస్ పరుపు మరియు ఇతర పరికరాల పర్యవేక్షణ", "निम्बस गद्दे और अन्य उपकरणों की निगरानी"],
    "Perform skin assessment - 4 hours": ["చర్మ పరీక్ష నిర్వహణ - 4 గంటలు", "त्वचा की जांच - 4 घंटे"],
    "Hot and cold application": ["వేడి మరియు చల్లని చికిత్స", "गर्म और ठंडी सिंकाई"],
    "Preparing the environment for rest / relaxation": ["విశ్రాంతి కోసం వాతావరణాన్ని సిద్ధం చేయడం", "आराम / विश्राम के लिए वातावरण तैयार करना"],
    "Preparing the environment for rest": ["విశ్రాంతి కోసం వాతావరణం సిద్ధం", "आराम के लिए वातावरण तैयार करना"],
    "Assist in joint and muscle strengthening exercises": ["కీళ్ళు మరియు కండరాల వ్యాయామాలలో సహాయం", "जोड़ों और मांसपेशियों के व्यायाम में सहायता"],
    "Assist in walking / climbing the stairs": ["నడక / మెట్లు ఎక్కడంలో సహాయం", "चलने / सीढ़ियां चढ़ने में सहायता"],
    "Reading newspaper / book": ["వార్తాపత్రిక / పుస్తకం చదవడం", "अखबार / किताब पढ़ना"],
    "Engage in playing indoor games, TV / music": ["ఇండోర్ ఆటలు, టీవీ / సంగీతంలో నిమగ్నం చేయడం", "इनडोर खेल, टीवी / संगीत में शामिल करना"],
    "Accompany watching": ["తోడుగా ఉండటం / పర్యవేక్షణ", "साथ में समय बिताना / निगरानी"],
    "Encourage new hobby development": ["కొత్త అభిరుచులను ప్రోత్సహించడం", "नए शौक विकसित करने के लिए प्रोत्साहित करना"],
    "Listen to Bhajans and Radio Sai": ["భజనలు మరియు రేడియో సాయి వినడం", "भजन और रेडियो साई सुनना"],
    "Facilitate prayer environment": ["ప్రార్థన వాతావరణాన్ని కల్పించడం", "प्रार्थना का माहौल बनाना"],
    "Provide bed pan, urinals": ["బెడ్ పాన్, యూరినల్స్ అందించడం", "बेडपैन, यूरिनल उपलब्ध कराना"],
    "Assist to washroom": ["వాష్‌రూమ్‌కు సహాయం", "शौचालय जाने में सहायता"],
    "Assist in oral medication": ["నోటి ద్వారా మందులు వేసుకోవడంలో సహాయం", "मौखिक दवा लेने में सहायता"],

    // Default Care Tasks
    "Morning Sponge Bath & Mouth Clean": ["ఉదయం స్పాంజ్ బాత్ & నోటి శుభ్రత", "सुबह का स्पंज बाथ और मुंह की सफाई"],
    "Turn Patient / Change Position (Q2H)": ["రోగి భంగిమ మార్పు (ప్రతి 2 గంటలకు)", "मरीज की करवट बदलना (हर 2 घंटे में)"],
    "Tube Feeding / Soft Breakfast": ["ట్యూబ్ ఫీడింగ్ / మృదువైన అల్పాహారం", "ट्यूब से भोजन / हल्का नाश्ता"],
    "Check BP & Body Temperature": ["బీపీ & శరీర ఉష్ణోగ్రత తనిఖీ", "बीपी और शरीर का तापमान जांचें"],
    "Back Massage & Air Mattress Check": ["వీపు మసాజ్ & ఎయిర్ బెడ్ తనిఖీ", "पीठ की मालिश और एयर गद्दा जांच"],
    "Give Medicines on Time": ["సమయానికి మందులు ఇవ్వడం", "समय पर दवाएं देना"],
    "Care Activity": ["సంరక్షణ పని", "देखभाल कार्य"],

    // Task Frequencies & Statuses
    "Today's Care Tasks": ["నేటి సంరక్షణ పనులు", "आज के देखभाल कार्य"],
    "Once": ["ఒకసారి", "एक बार"],
    "Twice": ["రెండుసార్లు", "दो बार"],
    "Thrice": ["మూడుసార్లు", "तीन बार"],
    "SOS": ["అవసరమైనప్పుడు (SOS)", "आवश्यकतानुसार (SOS)"],
    "Every 2 Hours": ["ప్రతి 2 గంటలకు", "हर 2 घंटे में"],
    "4 Hours": ["4 గంటలు", "4 घंटे"],
    "As Needed": ["అవసరమైనప్పుడు", "आवश्यकतानुसार"],
    "Daily": ["రోజూ", "दैनिक"],
    "Sup. Rec": ["సూపర్‌వైజర్ సిఫార్సు", "पर्यवेक्षक अनुशंसित"],
    "Activity Completed": ["పని పూర్తయింది", "काम पूरा हुआ"],
    "Activity Marked Pending": ["పని మిగిలి ఉంది", "काम बाकी रखा गया"],
    "Pending": ["మిగిలి ఉంది", "लंबित"],
    "Done": ["పూర్తయింది", "पूर्ण"],
    "done": ["పూర్తయింది", "पूरा"],
    "of": ["లో", "में से"],
    "completed": ["పూర్తయింది", "पूर्ण"],
    "Mark Complete": ["పూర్తయిందిగా గుర్తించు", "पूर्ण चिह्नित करें"],
    "Skip": ["దాటవేయి", "छोड़ें"],
    "Reason Required": ["కారణం అవసరం", "कारण आवश्यक"],

    // Task Categories
    "Comfort & Hygiene": ["సౌకర్యం & పరిశుభ్రత", "आराम और स्वच्छता"],
    "Monitor Vital Signs": ["వైటల్స్ పర్యవేక్షణ", "वाइटल्स की निगरानी"],
    "Nutritional Support & Bedsore Prevention": ["పోషకాహార మద్దతు & బెడ్‌సోర్ నివారణ", "पोषण सहायता और बेडसोर रोकथाम"],
    "Rest and Relaxation": ["విశ్రాంతి మరియు ఉపశమనం", "विश्राम और आराम"],
    "Activity and Exercises": ["కార్యకలాపాలు & వ్యాయామాలు", "गतिविधि और व्यायाम"],
    "Diversion Therapy": ["వినోద చికిత్స", "डायवर्जन थेरेपी"],
    "Spiritual Support": ["ఆధ్యాత్మిక మద్దతు", "आध्यात्मिक सहायता"],
    "Elimination Needs": ["విసర్జన అవసరాలు", "मल-मूत्र त्याग सहायता"],
    "Medicine Administration": ["మందుల నిర్వహణ", "दवा प्रबंधन"],

    // Emergency SOS
    "Emergency SOS / Supervisor": ["అత్యవసర SOS / సూపర్‌వైజర్", "आपातकालीन SOS / सुपरवाइजर"],
    "Emergency Supervisor Alert": ["అత్యవసర సూపర్‌వైజర్ హెచ్చరిక", "आपातकालीन सुपरवाइजर अलर्ट"],
    "Notify the Institute Supervisor immediately of critical patient conditions.": ["రోగి తీవ్ర పరిస్థితిని వెంటనే సూపర్‌వైజర్‌కు తెలపండి.", "गंभीर स्थिति की सूचना तुरंत सुपरवाइजर को दें।"],
    "Alert Reason": ["హెచ్చరిక కారణం", "अलर्ट का कारण"],
    "Abnormal vital signs (BP or Pulse)": ["అసాధారణ వైటల్స్ (BP లేదా పల్స్)", "असामान्य वाइटल्स (बीपी या पल्स)"],
    "Change in patient consciousness": ["రోగి స్పృహలో మార్పు", "मरीज की चेतना में बदलाव"],
    "Sudden chest pain": ["ఆకస్మిక ఛాతీ నొప్పి", "अचानक सीने में दर्द"],
    "Patient fall or injury": ["రోగి కింద పడటం లేదా గాయం", "मरीज का गिरना या चोट"],
    "Patient refusing food or medicine": ["రోగి ఆహారం లేదా మందు నిరాకరించడం", "मरीज द्वारा भोजन या दवा से इनकार"],
    "Brief Note": ["సంక్షిప్త గమనిక", "संक्षिप्त विवरण"],
    "e.g. BP 85/55, severe sweating": ["ఉదా. BP 85/55, తీవ్ర చెమట", "उदा. बीपी 85/55, पसीना आना"],
    "Send Alert Now": ["ఇప్పుడే హెచ్చరిక పంపండి", "अभी अलर्ट भेजें"],
    "Call Emergency": ["అత్యవసర కాల్", "इमरजेंसी कॉल"],

    // Incomplete Tasks Modal
    "Reason for Incomplete Tasks": ["అసంపూర్ణ పనులకు కారణం", "अधूरे कार्यों का कारण"],
    "Some tasks were not completed. Please provide a valid reason for each skipped task before logging out.": ["కొన్ని పనులు పూర్తి కాలేదు. లాగౌట్ చేసే ముందు కారణం తెలపండి.", "कुछ कार्य पूरे नहीं हुए। लॉग आउट करने से पहले कारण बताएं।"],
    "Select reason for incomplete task:": ["అసంపూర్ణ పనికి కారణాన్ని ఎంచుకోండి:", "अधूरे कार्य का कारण चुनें:"],
    "-- Choose reason --": ["-- కారణాన్ని ఎంచుకోండి --", "-- कारण चुनें --"],
    "Patient Refused": ["రోగి నిరాకరించారు", "मरीज ने मना कर दिया"],
    "Patient Sleeping / Resting": ["రోగి నిద్రపోతున్నారు / విశ్రాంతి", "मरीज सो रहे हैं / आराम कर रहे हैं"],
    "Doctor / Supervisor Advice": ["డాక్టర్ / సూపర్‌వైజర్ సలహా", "डॉक्टर / सुपरवाइजर की सलाह"],
    "Family Requested Delay": ["కుటుంబ సభ్యుల ఆలస్య అభ్యర్థన", "परिवार ने देरी का अनुरोध किया"],
    "Equipment / Consumable Unavailable": ["పరికరాలు అందుబాటులో లేవు", "उपकरण उपलब्ध नहीं"],
    "Other Clinical Reason": ["ఇతర వైద్య కారణం", "अन्य चिकित्सीय कारण"],
    "Additional details or notes (required if Other)": ["అదనపు వివరాలు (ఇతర అయితే అవసరం)", "अतिरिक्त विवरण (अन्य होने पर आवश्यक)"],
    "Back": ["వెనుకకు", "वापस"],
    "Save Reasons & Log Out": ["కారణాలు సేవ్ చేసి లాగౌట్ చేయండి", "कारण सहेजें और लॉग आउट करें"],

    // Delayed Login Modal
    "Delayed Login Reason Required": ["ఆలస్య లాగిన్‌కు కారణం అవసరం", "देरी से लॉगिन का कारण आवश्यक"],
    "Your shift login is past the scheduled start time. Please provide a valid reason for the delay.": ["మీ షిఫ్ట్ లాగిన్ సమయం దాటింది. దయచేసి ఆలస్యానికి కారణం తెలపండి.", "आपकी शिफ्ट लॉगिन का समय बीत चुका है। कृपया देरी का कारण बताएं।"],
    "Delay Reason": ["ఆలస్య కారణం", "देरी का कारण"],
    "Traffic / Travel Delay": ["ట్రాఫిక్ / ప్రయాణ ఆలస్యం", "ट्रैफिक / यात्रा में देरी"],
    "Public Transport Issue": ["ప్రజా రవాణా సమస్య", "सार्वजनिक परिवहन समस्या"],
    "Personal / Family Emergency": ["వ్యక్తిగత / కుటుంబ అత్యవసరం", "व्यक्तिगत / पारिवारिक आपातकाल"],
    "Previous Shift Handover Delay": ["మునుపటి షిఫ్ట్ అప్పగింత ఆలస్యం", "पिछली शिफ्ट हैंडओवर में देरी"],
    "Weather / Route Disruption": ["వాతావరణం / మార్గ అంతరాయం", "मौसम / मार्ग व्यवधान"],
    "Additional Details (required if Other)": ["అదనపు వివరాలు (ఇతర అయితే అవసరం)", "अतिरिक्त विवरण (अन्य होने पर आवश्यक)"],
    "Enter specific details for delayed login": ["ఆలస్య లాగిన్‌కు వివరాలు నమోదు చేయండి", "देरी से लॉगिन का विवरण दर्ज करें"],
    "Cancel": ["రద్దు చేయి", "रद्द करें"],
    "Submit Reason & Start Shift": ["కారణం సమర్పించి షిఫ్ట్ ప్రారంభించండి", "कारण जमा करें और शिफ्ट शुरू करें"],

    // Early Logout Modal
    "Early Logout Request (Admin Approval)": ["ముందస్తు లాగౌట్ అభ్యర్థన (అడ్మిన్ ఆమోదం)", "जल्दी लॉगआउट अनुरोध (व्यवस्थापक स्वीकृति)"],
    "You are attempting to log out before your scheduled shift logout time. Please submit a reason for Admin approval.": ["మీరు సమయం కంటే ముందే లాగౌట్ చేయాలని ప్రయత్నిస్తున్నారు. అడ్మిన్ ఆమోదం కోసం కారణం తెలపండి.", "आप समय से पहले लॉग आउट कर रहे हैं। व्यवस्थापक की मंजूरी के लिए कारण बताएं।"],
    "Early Logout Reason": ["ముందస్తు లాగౌట్ కారణం", "जल्दी लॉगआउट का कारण"],
    "Family / Personal Emergency": ["కుటుంబ / వ్యక్తిగత అత్యవసరం", "पारिवारिक / व्यक्तिगत आपातकाल"],
    "Medical / Health Issue": ["వైద్య / ఆరోగ్య సమస్య", "चिकित्सा / स्वास्थ्य समस्या"],
    "Patient Discharged / Visit Ended Early": ["రోగి డిశ్చార్జ్ / విజిట్ ముగిసింది", "मरीज डिस्चार्ज / मुलाकात जल्दी समाप्त"],
    "Relieving Caregiver Arrived Early": ["తదుపరి కేర్‌గివర్ త్వరగా వచ్చారు", "अगला केयरगिवर जल्दी आ गया"],
    "Supervisor Instructed Early Leave": ["సూపర్‌వైజర్ సెలవు సూచించారు", "सुपरवाइजर ने जल्दी जाने को कहा"],
    "Detailed Reason (required if Other)": ["వివరణాత్మక కారణం (ఇతర అయితే అవసరం)", "विस्तृत कारण (अन्य होने पर आवश्यक)"],
    "Explain why you need to log out early": ["ఎందుకు ముందుగా వెళ్లాలో వివరించండి", "जल्दी लॉगआउट का कारण बताएं"],
    "Request Admin Approval": ["అడ్మిన్ ఆమోదం కోరండి", "व्यवस्थापक स्वीकृति का अनुरोध करें"],
    "Reason:": ["కారణం:", "कारण:"],
    "Note:": ["గమనిక:", "नोट:"],
    "Admin Note:": ["అడ్మిన్ గమనిక:", "व्यवस्थापक नोट:"],
    "Tap End Shift (Log Out) to complete.": ["ముగించడానికి 'షిఫ్ట్ ముగించండి' నొక్కండి.", "पूरा करने के लिए 'शिफ्ट समाप्त करें' पर टैप करें।"],
    "Early Logout Pending Admin Approval": ["ముందస్తు లాగౌట్ అడ్మిన్ ఆమోదం కోసం వేచి ఉంది", "जल्दी लॉगआउट व्यवस्थापक की मंजूरी के लिए लंबित"],
    "Early Logout Approved by Admin": ["ముందస్తు లాగౌట్ అడ్మిన్ ద్వారా ఆమోదించబడింది", "जल्दी लॉगआउट व्यवस्थापक द्वारा स्वीकृत"],
    "Early Logout Request Rejected by Admin": ["ముందస్తు లాగౌట్ అభ్యర్థన అడ్మిన్ ద్వారా తిరస్కరించబడింది", "जल्दी लॉगआउट अनुरोध व्यवस्थापक द्वारा अस्वीकृत"],
    "Other": ["ఇతర", "अन्य"],

    // Dynamic Shift Prompt & Toast Messages
    "Scheduled shift start is": ["షెడ్యూల్ చేసిన షిఫ్ట్ ప్రారంభ సమయం", "निर्धारित शिफ्ट शुरू होने का समय है"],
    "Current time:": ["ప్రస్తుత సమయం:", "वर्तमान समय:"],
    "delayed by": ["ఆలస్యం:", "देरी:"],
    "Please provide a valid reason for the delayed login.": ["ఆలస్య లాగిన్ కోసం సరైన కారణాన్ని తెలపండి.", "कृपया देरी से लॉगिन का वैध कारण बताएं।"],
    "Scheduled shift logout time is": ["షెడ్యూల్ చేసిన షిఫ్ట్ ముగింపు సమయం", "निर्धारित शिफ्ट समाप्त होने का समय है"],
    "early by": ["ముందుగా:", "जल्दी:"],
    "Admin approval is required before logging out early.": ["సమయం కంటే ముందే లాగౌట్ చేయడానికి అడ్మిన్ ఆమోదం అవసరం.", "जल्दी लॉगआउट के लिए व्यवस्थापक की स्वीकृति आवश्यक है।"],
    "Start your shift to update care tasks.": ["సంరక్షణ పనులను అప్‌డేట్ చేయడానికి మీ షిఫ్ట్ ప్రారంభించండి.", "देखभाल कार्यों को अपडेट करने के लिए शिफ्ट शुरू करें।"],
    "Vitals updated and synced.": ["వైటల్స్ అప్‌డేట్ చేయబడ్డాయి.", "वाइटल्स अपडेट और सिंक हो गए।"],
    "Vitals Updated Successfully": ["వైటల్స్ విజయవంతంగా అప్‌డేట్ చేయబడ్డాయి", "वाइटल्स सफलतापूर्वक अपडेट किए गए"],
    "Supervisor Alert Dispatched:": ["సూపర్‌వైజర్ హెచ్చరిక పంపబడింది:", "सुपरवाइजर अलर्ट भेजा गया:"],
    "Shift started successfully!": ["షిఫ్ట్ విజయవంతంగా ప్రారంభమైంది!", "शिफ्ट सफलतापूर्वक शुरू हुई!"],
    "Early logout request sent. Waiting for Admin approval.": ["ముందస్తు లాగౌట్ అభ్యర్థన పంపబడింది. అడ్మిన్ ఆమోదం కోసం వేచి ఉండండి.", "जल्दी लॉगआउट अनुरोध भेजा गया। स्वीकृति की प्रतीक्षा करें।"],
    "Early logout request is still pending Admin approval.": ["ముందస్తు లాగౌట్ అభ్యర్థన ఇంకా అడ్మిన్ ఆమోదం కోసం వేచి ఉంది.", "जल्दी लॉगआउट अनुरोध अभी भी लंबित है।"],
    "Shift ended and tasks saved to database successfully.": ["షిఫ్ట్ ముగిసింది మరియు పనులు సేవ్ చేయబడ్డాయి.", "शिफ्ट समाप्त हुई और कार्य सहेजे गए।"],
    "Shift already completed for today.": ["నేటి షిఫ్ట్ ఇప్పటికే పూర్తయింది.", "आज की शिफ्ट पहले ही पूरी हो चुकी है।"],
    "Shift is already active.": ["షిఫ్ట్ ఇప్పటికే కొనసాగుతోంది.", "शिफ्ट पहले से सक्रिय है।"],

    // Face Check & GPS Verification Modals
    "Face Check": ["ముఖ తనిఖీ", "चेहरा जांच"],
    "Bright Light": ["ప్రకాశవంతమైన వెలుతురు", "तेज रोशनी"],
    "Blink Eyes": ["కనురెప్ప ఆర్పండి", "पलक झपकाएं"],
    "Live Face": ["లైవ్ ముఖం", "लाइव चेहरा"],
    "Checking…": ["తనిఖీ చేస్తోంది…", "जांच हो रही है…"],
    "Waiting…": ["వేచి ఉంది…", "प्रतीक्षा में…"],
    "Connecting…": ["కనెక్ట్ అవుతోంది…", "कनेक्ट हो रहा है…"],
    "Starting camera…": ["కెమెరా ప్రారంభమవుతోంది…", "कैमरा शुरू हो रहा है…"],
    "Verifying…": ["నిర్ధారిస్తోంది…", "सत्यापन हो रहा है…"],
    "Verified ✓": ["నిర్ధారించబడింది ✓", "सत्यापित ✓"],
    "Stand facing bright light": ["వెలుతురు వైపు తిరిగి నిలబడండి", "तेज रोशनी के सामने खड़े हों"],
    "Face Torch: ON (Illuminating Face)": ["ఫేస్ టార్చ్: ఆన్ (ముఖానికి వెలుతురు)", "फेस टॉर्च: चालू"],
    "Face Torch: OFF (Tap to Turn ON)": ["ఫేస్ టార్చ్: ఆఫ్ (ఆన్ చేయడానికి నొక్కండి)", "फेस टॉर्च: बंद (चालू करने के लिए टैप करें)"],
    "Look straight & blink": ["నేరుగా చూసి కనురెప్ప ఆర్పండి", "सीधे देखें और पलक झपकाएं"],
    "Try Again": ["మళ్ళీ ప్రయత్నించండి", "पुनः प्रयास करें"],
    "Ready": ["సిద్ధంగా ఉంది", "तैयार"],
    "Demo camera preview active…": ["డెమో కెమెరా ప్రివ్యూ సక్రియం…", "डेमो कैमरा प्रीव्यू सक्रिय…"],
    "Verifying GPS Location": ["GPS స్థానం తనిఖీ చేస్తోంది", "GPS स्थान सत्यापित हो रहा है"],
    "Verifying Distance...": ["దూరం తనిఖీ చేస్తోంది...", "दूरी सत्यापित हो रही है..."],
    "Location Verified!": ["స్థానం నిర్ధారించబడింది!", "स्थान सत्यापित!"],
    "Location Check Failed": ["స్థాన తనిఖీ విఫలమైంది", "स्थान जांच विफल"],
    "GPS Signal Too Weak": ["GPS సిగ్నల్ బలహీనంగా ఉంది", "GPS सिग्नल कमजोर है"],
    "Geofence Verification Failed": ["జియోఫెన్స్ తనిఖీ విఫలమైంది", "जियोफेंस सत्यापन विफल"],
    "Checking if you are within 100 meters of the patient's registered residence...": ["రోగి ఇంటి నుండి 100 మీటర్ల పరిధిలో ఉన్నారో తనిఖీ చేస్తోంది...", "जांच हो रही है कि आप मरीज के घर के 100 मीटर के दायरे में हैं या नहीं..."],
    "Requesting high-accuracy GPS satellite fix. Please tap \"Allow\" if your device prompts for location access.": ["ఖచ్చితమైన GPS స్థానం కోసం అనుమతి అడుగుతోంది. అడిగితే \"Allow\" నొక్కండి.", "सटीक GPS लोकेशन का अनुरोध किया जा रहा है। अनुमति मांगने पर \"Allow\" दबाएं।"],
    "Shift login is blocked until your location is verified at the patient's home.": ["రోగి ఇంటి వద్ద స్థానం నిర్ధారించే వరకు షిఫ్ట్ లాగిన్ ఆపబడింది.", "मरीज के घर पर स्थान सत्यापित होने तक शिफ्ट लॉगिन रुका रहेगा।"],
    "Patient:": ["రోగి:", "मरीज:"],
    "Distance to Home:": ["ఇంటికి దూరం:", "घर से दूरी:"],
    "GPS Accuracy:": ["GPS ఖచ్చితత్వం:", "GPS सटीकता:"],
    "Allowed Geofence:": ["అనుమతించిన పరిధి:", "अनुमत दायरा:"],
    "Calculating...": ["లెక్కిస్తోంది...", "गणना हो रही है..."],
    "100 meters": ["100 మీటర్లు", "100 मीटर"],
    "meters": ["మీటర్లు", "मीटर"],
    "Assigned Patient": ["కేటాయించిన రోగి", "नियुक्त मरीज"],
    "🔄 Retry GPS Check": ["🔄 మళ్ళీ GPS తనిఖీ", "🔄 GPS फिर जांचें"]
  };

  const TR_KEYS = Object.keys(TR).sort((a, b) => b.length - a.length);
  const TR_PATTERNS = TR_KEYS.map((k) => {
    const escaped = k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const startBound = /^[A-Za-z0-9]/.test(k) ? '(?<![A-Za-z0-9_])' : '';
    const endBound = /[A-Za-z0-9]$/.test(k) ? '(?![A-Za-z0-9_])' : '';
    return { key: k, regex: new RegExp(startBound + escaped + endBound, 'g') };
  });

  function tr(str) {
    if (!str || LANG === 'en') return str;
    const idx = (LANG === 'te') ? 0 : 1;
    const trimmed = String(str).trim();
    if (TR[trimmed]) return String(str).replace(trimmed, TR[trimmed][idx]);
    const lower = trimmed.toLowerCase();
    if (TR[lower]) return String(str).replace(trimmed, TR[lower][idx]);

    let res = String(str);
    for (let i = 0; i < TR_PATTERNS.length; i++) {
      const entry = TR_PATTERNS[i];
      if (entry.key.length > 1 && res.includes(entry.key)) {
        res = res.replace(entry.regex, TR[entry.key][idx]);
      }
    }
    return res;
  }
  window.tr = tr;

  function setLocalizedText(el, rawEnglish) {
    if (!el) return;
    const str = String((rawEnglish === null || rawEnglish === undefined) ? '' : rawEnglish);
    el.textContent = (LANG === 'en') ? str : tr(str);
    if (el.firstChild) el.firstChild._en = str;
  }

  function showToast(msg) {
    const toastEl = byId('widgetToast');
    if (!toastEl) return;
    toastEl.setAttribute('data-dynamic-tr', '1');
    toastEl.textContent = tr(msg);
    toastEl.classList.remove('hidden');
    setTimeout(() => toastEl.classList.add('hidden'), TOAST_DURATION_MS);
  }

  /* ---------- UI State Updates & Live Shift Sync ---------- */
  function renderGdaMetaUI() {
    const u = sm.user || {};
    const gdaName = byId('gdaName');
    const gdaId = byId('gdaId');
    if (gdaName && u.name) setLocalizedText(gdaName, u.name);
    if (gdaId && u.id) setLocalizedText(gdaId, `(${u.id})`);
  }

  function renderPatientMetaUI() {
    const pt = sm.patient || {};
    const ptCard = byId('patientCard');
    const inactNotice = byId('inactiveAssignmentNotice');
    const inactReason = byId('inactiveAssignmentReason');
    const dutyCard = byId('dutyCard');

    if (sm.hasActiveAssignment === false) {
      if (ptCard) ptCard.classList.add('hidden');
      if (dutyCard) dutyCard.classList.add('hidden');
      if (inactNotice) inactNotice.classList.remove('hidden');
      if (inactReason) setLocalizedText(inactReason, sm.inactiveReason || 'No active patient shift assigned. Contact Administrator.');
      return;
    }

    if (ptCard) ptCard.classList.remove('hidden');
    if (dutyCard) dutyCard.classList.remove('hidden');
    if (inactNotice) inactNotice.classList.add('hidden');

    const ptPhoto = byId('patientPhoto');
    const ptName = byId('patientName');
    const ptAhid = byId('patientAhid');
    const ptMeta = byId('patientMeta');
    const ptTags = byId('patientTags');

    if (ptPhoto) {
      const av = sm.avatars || {};
      const ptGen = String(pt.gender || '').toLowerCase();
      const fallbackPt = ptGen === 'female'
        ? (av.femalePatient || sm.defaultPatientPhoto)
        : ptGen === 'male'
          ? (av.malePatient || sm.defaultPatientPhoto)
          : (av.patient || sm.defaultPatientPhoto);
      ptPhoto.src = pt.photo || fallbackPt || '';
    }
    if (ptName) setLocalizedText(ptName, pt.name || '');
    if (ptAhid) setLocalizedText(ptAhid, `ID: ${pt.ahid || pt.id || ''}`);
    if (ptMeta) {
      setLocalizedText(ptMeta, `${pt.age ? `${pt.age} yrs` : '--'} • ${pt.gender || 'Patient'} • ${pt.address || 'Home Care'}`);
    }
    if (ptTags) {
      ptTags.setAttribute('data-dynamic-tr', '1');
      const conds = pt.conditions ? String(pt.conditions).split(',') : ['Daily Assistance', 'Vital Monitoring'];
      let tagsHtml = conds.map((c) => {
        const rawTag = c.trim();
        const transTag = (LANG === 'en') ? rawTag : tr(rawTag);
        return '<span class="bg-[#FFF8E1] text-[#2C3E50] border border-[#F9A825] text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">' +
          `<span class="w-1.5 h-1.5 rounded-full bg-[#D32F2F]"></span>${esc(transTag)}</span>`;
      }).join('');
      if (pt.emergencyContact) {
        tagsHtml += `<span class="bg-slate-100 text-[#757575] border border-slate-200 text-[10px] font-semibold px-2 py-0.5 rounded-full truncate">&#128222; ${esc(pt.emergencyContact)}</span>`;
      }
      ptTags.innerHTML = tagsHtml;
    }
  }

  function renderShiftMetaUI() {
    const sh = sm.shift || {};
    const shiftText = byId('shiftText');
    const shiftExt = byId('shiftExtendedBadge');
    const shiftDatePill = byId('shiftDatePill');
    const schedDate = byId('schedDate');
    const schedStart = byId('schedStart');
    const schedEnd = byId('schedEnd');

    if (shiftText) {
      const durPart = (sh.duration && sh.duration !== '--') ? ` (${sh.duration})` : '';
      setLocalizedText(shiftText, `Shift: ${sh.timing || '--'}${durPart}`);
    }
    if (shiftExt) {
      setLocalizedText(shiftExt, 'Extended');
      shiftExt.classList.toggle('hidden', !sh.extended);
    }
    if (shiftDatePill) setLocalizedText(shiftDatePill, `Date: ${sh.date || ''}`);
    if (schedDate) schedDate.textContent = sh.date || '--';
    if (schedStart) schedStart.textContent = sh.start || '--';
    if (schedEnd) schedEnd.textContent = sh.end || '--';
  }

  function renderEarlyLogoutBanner() {
    const banner = byId('earlyLogoutBanner');
    if (!banner) return;
    banner.setAttribute('data-dynamic-tr', '1');
    const req = sm.earlyLogoutRequest;
    if (sm.hasActiveAssignment === false || shiftState !== SHIFT_ON_DUTY || !req) {
      banner.className = 'hidden text-[11px] font-semibold px-3 py-2 rounded-lg border mb-2 text-center';
      banner.innerHTML = '';
      return;
    }

    const earlyTag = req.earlyByMinutes ? ` (${formatDurationMins(req.earlyByMinutes)} early)` : '';
    if (req.status === 'PENDING') {
      banner.className = 'text-[11px] font-semibold px-3 py-2 rounded-lg border border-amber-300 bg-amber-50 text-amber-900 mb-2 text-center';
      banner.innerHTML = `${esc(tr('Early Logout Pending Admin Approval'))}${esc(tr(earlyTag))}<br><span class="font-normal text-[10px]">${esc(tr('Reason:'))} ${esc(req.reason)}</span>`;
      return;
    }
    if (req.status === 'APPROVED') {
      banner.className = 'text-[11px] font-semibold px-3 py-2 rounded-lg border border-emerald-400 bg-emerald-50 text-emerald-900 mb-2 text-center';
      const noteHtml = req.adminNote ? `<br><span class="font-normal text-[10px]">${esc(tr('Note:'))} ${esc(req.adminNote)}</span>` : '';
      banner.innerHTML = `${esc(tr('Early Logout Approved by Admin'))}${esc(tr(earlyTag))}! ${esc(tr('Tap End Shift (Log Out) to complete.'))}${noteHtml}`;
      return;
    }
    if (req.status === 'REJECTED') {
      banner.className = 'text-[11px] font-semibold px-3 py-2 rounded-lg border border-red-300 bg-red-50 text-red-900 mb-2 text-center';
      const noteHtml = req.adminNote ? `<br><span class="font-normal text-[10px]">${esc(tr('Admin Note:'))} ${esc(req.adminNote)}</span>` : '';
      banner.innerHTML = `${esc(tr('Early Logout Request Rejected by Admin'))}${esc(tr(earlyTag))}${noteHtml}`;
      return;
    }
    banner.className = 'hidden';
    banner.innerHTML = '';
  }

  function setBtnDisabled(btn, disabled) {
    if (!btn) return;
    btn.disabled = Boolean(disabled);
    btn.classList.toggle('btn-disabled', Boolean(disabled));
  }

  function updateShiftUI() {
    const preNotice = byId('preShiftNotice');
    const compNotice = byId('completedShiftNotice');
    const activeContent = byId('activeShiftContent');
    const btnLogin = byId('btnLogin');
    const btnLogout = byId('btnLogout');
    const dutyStatus = byId('dutyStatus');
    const dutyInfo = byId('dutyInfo');
    const btnUpdateVitals = byId('btnUpdateVitals');

    renderGdaMetaUI();
    renderPatientMetaUI();
    renderShiftMetaUI();
    renderEarlyLogoutBanner();

    if (sm.hasActiveAssignment === false) {
      if (preNotice) preNotice.classList.add('hidden');
      if (compNotice) compNotice.classList.add('hidden');
      if (activeContent) activeContent.classList.add('hidden');
      setBtnDisabled(btnLogin, true);
      setBtnDisabled(btnLogout, true);
      applyLang();
      return;
    }

    if (shiftState === SHIFT_NOT_STARTED) {
      if (preNotice) preNotice.classList.remove('hidden');
      if (compNotice) compNotice.classList.add('hidden');
      if (activeContent) activeContent.classList.add('hidden');

      setBtnDisabled(btnLogin, Boolean(sm.isFutureShift));
      setBtnDisabled(btnLogout, true);
      if (dutyStatus) setLocalizedText(dutyStatus, sm.isFutureShift ? 'Scheduled' : 'Not Started');
      if (dutyInfo) {
        dutyInfo.setAttribute('data-dynamic-tr', '1');
        dutyInfo.textContent = sm.isFutureShift
          ? `${tr('Scheduled')} ${(sm.shift && sm.shift.assignedDate) || ''}`
          : tr("Shift not started. Please log in to view today's care tasks.");
      }
    } else if (shiftState === SHIFT_ON_DUTY) {
      if (preNotice) preNotice.classList.add('hidden');
      if (compNotice) compNotice.classList.add('hidden');
      if (activeContent) activeContent.classList.remove('hidden');

      setBtnDisabled(btnLogin, true);
      setBtnDisabled(btnLogout, false);
      setBtnDisabled(btnUpdateVitals, false);

      const inTime = (sm.log && sm.log.loginTime) ? fmtTime(sm.log.loginTime) : tr('Now');
      const lateTag = (sm.log && sm.log.loginStatus === 'LATE')
        ? ` <span class="text-amber-700 font-bold">${esc(tr('(Delayed)'))}</span>`
        : '';
      if (dutyStatus) setLocalizedText(dutyStatus, 'On Duty');
      if (dutyInfo) {
        dutyInfo.setAttribute('data-dynamic-tr', '1');
        dutyInfo.innerHTML = `${esc(tr('Logged in at'))}: <b>${esc(inTime)}</b>${lateTag}`;
      }
    } else if (shiftState === SHIFT_COMPLETED) {
      if (preNotice) preNotice.classList.add('hidden');
      if (compNotice) compNotice.classList.remove('hidden');
      if (activeContent) activeContent.classList.remove('hidden');

      setBtnDisabled(btnLogin, true);
      setBtnDisabled(btnLogout, true);
      setBtnDisabled(btnUpdateVitals, true);

      const lin = (sm.log && sm.log.loginTime) ? fmtTime(sm.log.loginTime) : '--';
      const lout = (sm.log && sm.log.logoutTime) ? fmtTime(sm.log.logoutTime) : '--';
      if (dutyStatus) setLocalizedText(dutyStatus, 'Shift Completed');
      if (dutyInfo) {
        dutyInfo.setAttribute('data-dynamic-tr', '1');
        dutyInfo.textContent = `${tr('Shift Completed')}: ${tr('Logged in at')} ${lin} • ${tr('Logged out at')} ${lout}`;
      }
    }
    applyLang();
  }

  function taskSignature(arr) {
    return (arr || []).map((t) => [t.id, t.title, t.freq, t.rec ? 1 : 0, t.img || ''].join(':')).join('|');
  }

  function stopStatusPolling() {
    if (_statusPollTimer) {
      clearInterval(_statusPollTimer);
      _statusPollTimer = null;
    }
  }

  async function refreshShiftStatus() {
    if (!sm.urls || !sm.urls.status) return;
    try {
      const res = await fetch(sm.urls.status, {
        method: 'GET',
        credentials: 'same-origin',
        headers: { Accept: 'application/json' },
      });
      if (res.status === 401 || res.status === 403) {
        stopStatusPolling();
        return;
      }
      if (!res.ok) return;
      const data = await res.json();
      if (!data || !data.ok) return;

      const prevState = shiftState;
      const prevTasksSig = taskSignature(TASKS);

      sm.hasActiveAssignment = data.hasActiveAssignment;
      sm.inactiveReason = data.inactiveReason || '';
      sm.isFutureShift = Boolean(data.isFutureShift);
      if (data.patient) sm.patient = data.patient;
      if (data.planInfo !== undefined) sm.planInfo = data.planInfo;
      sm.shift = data.shift || sm.shift;
      sm.timingCheck = data.timingCheck || sm.timingCheck;

      const prevReqStatus = sm.earlyLogoutRequest && sm.earlyLogoutRequest.status;
      sm.earlyLogoutRequest = data.earlyLogoutRequest || null;
      if (prevReqStatus === 'PENDING' && sm.earlyLogoutRequest && sm.earlyLogoutRequest.status === 'APPROVED') {
        if (window.SnehaVoice) window.SnehaVoice.speak('logout_approved');
      }

      sm.log = data.log || {};
      shiftState = data.shiftState || SHIFT_NOT_STARTED;
      sm.shiftState = shiftState;

      if (Array.isArray(data.tasks)) {
        const localDoneMap = {};
        if (shiftState === SHIFT_ON_DUTY) {
          TASKS.forEach((t) => { if (t.done) localDoneMap[t.id] = true; });
        }
        TASKS = data.tasks.map((t) => Object.assign({}, t, {
          done: shiftState === SHIFT_ON_DUTY ? Boolean(localDoneMap[t.id] || t.done) : Boolean(t.done),
        }));
      }

      updateShiftUI();
      if (prevState !== shiftState || prevTasksSig !== taskSignature(TASKS)) {
        renderTasks();
      }
      applyLang();
    } catch (_) {
      // Ignore transient background polling glitches
    }
  }

  /* ---------- Tasks Rendering & Toggling ---------- */
  function renderTasks() {
    const container = byId('taskListContainer');
    if (!container) return;

    let doneCount = 0;
    const isCompletedState = (shiftState === SHIFT_COMPLETED);
    container.innerHTML = TASKS.map((t) => {
      if (t.done) doneCount++;
      const cardStyle = t.done ? 'border-2 border-[#2C3E50] bg-white' : 'border border-[#E0E6ED] bg-white';
      const iconKey = ICONS[t.id] ? t.id : (CAT_ICON_MAP[t.cat] || '');
      const iconSvg = (iconKey && ICONS[iconKey]) ? ICONS[iconKey] : DEFAULT_ICON;
      const iconHtml = t.img
        ? `<img src="${esc(t.img)}" alt="" class="w-full h-full object-cover rounded-xl">`
        : `<svg width="36" height="36" viewBox="0 0 48 48" fill="none" stroke-linecap="round" stroke-linejoin="round">${iconSvg}</svg>`;
      const rawTitle = t.title || '';
      const rawFreq = t.freq || 'Once';
      const transTitle = (LANG === 'en') ? rawTitle : tr(rawTitle);
      const transFreq = (LANG === 'en') ? rawFreq : tr(rawFreq);
      const supRec = (LANG === 'en') ? 'Sup. Rec' : tr('Sup. Rec');
      const cardStateCls = isCompletedState ? 'opacity-85' : 'cursor-pointer active:scale-[.98] transition';
      const taskAttr = isCompletedState ? '' : ` data-task-id="${esc(t.id)}"`;
      const recTag = t.rec ? `<span class="bg-[#D32F2F] text-white px-1.5 py-0.5 rounded text-[10px] font-bold">${esc(supRec)}</span>` : '';
      const checkCls = t.done ? 'bg-[#D32F2F] border-[#D32F2F] text-white' : 'bg-white border-[#2C3E50]';

      return `<div class="${cardStyle} rounded-2xl p-2.5 flex items-center gap-3 select-none shadow-xs ${cardStateCls}"${taskAttr}>` +
        `<div class="w-12 h-12 rounded-xl bg-[#F4F6F8] border border-[#E0E6ED] flex items-center justify-center flex-shrink-0 overflow-hidden">${iconHtml}</div>` +
        `<div class="flex-1 min-w-0">` +
        `<div class="text-[13px] font-bold text-[#2C3E50] leading-snug truncate" data-en="${esc(rawTitle)}">${esc(transTitle)}</div>` +
        `<div class="mt-0.5 flex flex-wrap gap-1"><span class="bg-slate-100 px-1.5 py-0.5 rounded text-[10px] text-[#2C3E50] font-bold" data-en="${esc(rawFreq)}">${esc(transFreq)}</span>${recTag}</div>` +
        `</div>` +
        `<div class="w-6 h-6 rounded-md border-2 flex items-center justify-center text-xs font-bold ${checkCls}">${t.done ? '&#10003;' : ''}</div>` +
        `</div>`;
    }).join('');

    const totalTasks = TASKS.length || 1;
    const pct = Math.round((doneCount / totalTasks) * 100);
    const pBar = byId('progBar');
    const pBadge = byId('progressBadge');
    if (pBar) pBar.style.width = `${pct}%`;
    if (pBadge) {
      pBadge.setAttribute('data-dynamic-tr', '1');
      pBadge.textContent = LANG === 'te'
        ? `${doneCount}/${totalTasks} పూర్తి`
        : LANG === 'hi'
          ? `${doneCount}/${totalTasks} पूरा`
          : `${doneCount} of ${totalTasks} done`;
    }
    applyLang();
  }

  window.toggleTask = function (id) {
    if (shiftState !== SHIFT_ON_DUTY) {
      showToast('Start your shift to update care tasks.');
      return;
    }
    const task = TASKS.find((t) => String(t.id) === String(id));
    if (!task) return;
    task.done = !task.done;
    renderTasks();
    showToast(task.done ? 'Activity Completed' : 'Activity Marked Pending');
    if (window.SnehaVoice) {
      window.SnehaVoice.speakTask(task.done ? 'task_completed' : 'task_removed', task.title);
    }
    if (window.SM_DEMO && typeof window.SM_DEMO.notifyDemoAction === 'function') {
      window.SM_DEMO.notifyDemoAction('Demo task update');
    }
  };

  /* ---------- Shift Login Flow ---------- */
  async function performShiftLogin(lateReason) {
    const btn = byId('btnLogin');
    if (btn) btn.disabled = true;

    try {
      const { ok, data } = await apiRequest(sm.urls.shiftLogin, {
        method: 'POST',
        body: { lateReason: lateReason || '' },
      });

      if (!ok || !data.ok) {
        if (data.requiresLateReason) {
          if (btn) btn.disabled = false;
          _lateLoginHasLiveToken = true;
          sm.timingCheck = sm.timingCheck || {};
          sm.timingCheck.isLoginDelayed = true;
          sm.timingCheck.scheduledStart = data.scheduledStart || (sm.shift && sm.shift.start);
          sm.timingCheck.loginDelayMinutes = data.loginDelayMinutes || 0;
          sm.timingCheck.nowTime = data.nowTime || '';
          openLateLoginModal();
          return;
        }
        if (data.requiresLiveness) {
          if (btn) btn.disabled = false;
          _lateLoginHasLiveToken = false;
          if (window.SnehaVoice) window.SnehaVoice.speak('login_start');
          const passed = await startLivenessCheck('start_shift');
          if (passed) await performShiftLogin(lateReason);
          return;
        }
        throw new Error(data.error || 'Failed to start shift.');
      }

      _lateLoginHasLiveToken = false;
      shiftState = SHIFT_ON_DUTY;
      sm.shiftState = SHIFT_ON_DUTY;
      sm.log = sm.log || {};
      sm.log.loginTime = data.loginTime || new Date().toISOString();
      sm.log.loginStatus = data.loginStatus || 'ON_TIME';
      sm.log.lateLoginReason = data.lateLoginReason || '';
      if (data.shift) sm.shift = data.shift;
      updateShiftUI();
      renderTasks();
      showToast(
        data.loginStatus === 'LATE'
          ? 'Shift started (Delayed reason recorded). Tasks unlocked.'
          : 'Shift started successfully. Tasks unlocked.'
      );
      if (window.SnehaVoice) window.SnehaVoice.speak('shift_login_success');
    } catch (err) {
      if (btn) btn.disabled = false;
      showToast(err.message || 'Could not log in to shift.');
    }
  }

  function openLateLoginModal() {
    const tc = sm.timingCheck || {};
    const info = byId('lateLoginPromptInfo');
    if (info) {
      info.setAttribute('data-dynamic-tr', '1');
      const delayPart = tc.loginDelayMinutes ? `, ${esc(tr('delayed by'))} <b>${esc(tr(formatDurationMins(tc.loginDelayMinutes)))}</b>` : '';
      info.innerHTML =
        `${esc(tr('Scheduled shift start is'))} <b>${esc(tc.scheduledStart || (sm.shift && sm.shift.start) || '--')}</b>` +
        ` (${esc(tr('Current time:'))} <b>${esc(tc.nowTime || '')}</b>${delayPart}). ${esc(tr('Please provide a valid reason for the delayed login.'))}`;
    }
    const sel = byId('lateReasonSelect');
    const note = byId('lateReasonNote');
    if (sel) { sel.value = ''; sel.classList.remove('input-error'); }
    if (note) { note.value = ''; note.classList.remove('input-error'); }
    window.openModal('modalLateLogin');
  }

  window.submitLateLogin = async function () {
    const sel = byId('lateReasonSelect');
    const note = byId('lateReasonNote');
    const rVal = sel ? sel.value.trim() : '';
    const nVal = note ? note.value.trim() : '';

    if (!rVal) {
      if (sel) sel.classList.add('input-error');
      showToast('Please select a reason for delayed login.');
      return;
    }
    if (rVal === 'Other' && !nVal) {
      if (note) note.classList.add('input-error');
      showToast('Please enter details for the delayed login reason.');
      return;
    }
    if (sel) sel.classList.remove('input-error');
    if (note) note.classList.remove('input-error');

    const combined = rVal + (nVal ? ` - ${nVal}` : '');
    window.closeModal('modalLateLogin');

    if (_lateLoginHasLiveToken) {
      _lateLoginHasLiveToken = false;
      await performShiftLogin(combined);
      return;
    }
    const passed = await startLivenessCheck('start_shift');
    if (passed) await performShiftLogin(combined);
  };

  window.handleShiftLogin = async function () {
    await refreshShiftStatus();
    if (sm.hasActiveAssignment === false) {
      showToast(sm.inactiveReason || 'No active care shift assigned.');
      return;
    }
    if (sm.isFutureShift) {
      showToast(`Shift starts on ${(sm.shift && sm.shift.assignedDate) || ''}.`);
      return;
    }
    if (shiftState === SHIFT_COMPLETED) {
      showToast('Shift already completed for today.');
      return;
    }
    if (shiftState === SHIFT_ON_DUTY) {
      showToast('Shift is already active.');
      return;
    }
    if (sm.timingCheck && sm.timingCheck.isLoginDelayed) {
      _lateLoginHasLiveToken = false;
      openLateLoginModal();
      return;
    }
    if (window.SnehaVoice) window.SnehaVoice.speak('login_start');
    const passed = await startLivenessCheck('start_shift');
    if (passed) await performShiftLogin('');
  };

  /* ---------- Early Logout & Shift End Flow ---------- */
  function openEarlyLogoutModal() {
    const sh = sm.shift || {};
    const tc = sm.timingCheck || {};
    const info = byId('earlyLogoutPromptInfo');
    if (info) {
      info.setAttribute('data-dynamic-tr', '1');
      const earlyPart = tc.earlyLogoutMinutes ? `, ${esc(tr('early by'))} <b>${esc(tr(formatDurationMins(tc.earlyLogoutMinutes)))}</b>` : '';
      info.innerHTML =
        `${esc(tr('Scheduled shift logout time is'))} <b>${esc(sh.end || tc.scheduledEnd || '--')}</b>` +
        ` (${esc(tr('Current time:'))} <b>${esc(tc.nowTime || '')}</b>${earlyPart}). ${esc(tr('Admin approval is required before logging out early.'))}`;
    }
    const sel = byId('earlyReasonSelect');
    const note = byId('earlyReasonNote');
    if (sel) { sel.value = ''; sel.classList.remove('input-error'); }
    if (note) { note.value = ''; note.classList.remove('input-error'); }
    window.openModal('modalEarlyLogout');
  }

  async function proceedToShiftLogoutFlow() {
    const incomplete = TASKS.filter((t) => !t.done);
    if (incomplete.length > 0) {
      renderIncompleteModal(incomplete);
      window.openModal('modalIncomplete');
      return;
    }
    const passed = await startLivenessCheck('end_shift');
    if (passed) await window.submitShiftLogout();
  }

  window.submitEarlyLogoutRequest = async function () {
    const sel = byId('earlyReasonSelect');
    const note = byId('earlyReasonNote');
    const rVal = sel ? sel.value.trim() : '';
    const nVal = note ? note.value.trim() : '';

    if (!rVal) {
      if (sel) sel.classList.add('input-error');
      showToast('Please select a reason for early logout.');
      return;
    }
    if (rVal === 'Other' && !nVal) {
      if (note) note.classList.add('input-error');
      showToast('Please provide detailed reason for early logout.');
      return;
    }
    if (sel) sel.classList.remove('input-error');
    if (note) note.classList.remove('input-error');

    const combined = rVal + (nVal ? ` - ${nVal}` : '');
    const btn = byId('btnSubmitEarlyLogout');
    if (btn) btn.disabled = true;

    try {
      const { ok, data } = await apiRequest(sm.urls.earlyLogoutRequest, {
        method: 'POST',
        body: { reason: combined },
      });
      if (btn) btn.disabled = false;
      if (!ok || !data.ok) throw new Error(data.error || 'Failed to send request.');

      window.closeModal('modalEarlyLogout');
      if (data.earlyNotNeeded) {
        await refreshShiftStatus();
        await proceedToShiftLogoutFlow();
        return;
      }
      sm.earlyLogoutRequest = data.request || sm.earlyLogoutRequest;
      updateShiftUI();
      showToast('Early logout request sent. Waiting for Admin approval.');
      if (window.SnehaVoice) window.SnehaVoice.speak('logout_request_sent');
    } catch (err) {
      if (btn) btn.disabled = false;
      showToast(err.message || 'Could not submit early logout request.');
    }
  };

  window.handleShiftLogout = async function () {
    await refreshShiftStatus();
    if (sm.hasActiveAssignment === false) {
      showToast(sm.inactiveReason || 'No active care shift assigned.');
      return;
    }
    if (shiftState !== SHIFT_ON_DUTY) {
      showToast('You must start your shift before logging out.');
      return;
    }

    if (sm.timingCheck && sm.timingCheck.isEarlyLogout) {
      const req = sm.earlyLogoutRequest;
      if (req && req.status === 'APPROVED') {
        await proceedToShiftLogoutFlow();
      } else if (req && req.status === 'PENDING') {
        showToast('Early logout request is still pending Admin approval.');
      } else {
        openEarlyLogoutModal();
      }
      return;
    }
    await proceedToShiftLogoutFlow();
  };

  function renderIncompleteModal(incompleteTasks) {
    const container = byId('incompleteTaskList');
    if (!container) return;

    container.innerHTML = incompleteTasks.map((t) => {
      const prevReason = incompleteReasonsMap[t.id] || '';
      const rawTitle = t.title || '';
      const transTitle = (LANG === 'en') ? rawTitle : tr(rawTitle);
      return `<div class="p-3 bg-slate-50 border border-slate-200 rounded-xl" data-tid="${esc(t.id)}">` +
        '<div class="font-bold text-xs text-[#2C3E50] mb-1.5 flex items-center justify-between">' +
        `<span class="truncate" data-en="${esc(rawTitle)}">${esc(transTitle)}</span>` +
        `<span class="text-[10px] bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full font-bold flex-shrink-0">${esc(tr('Pending'))}</span>` +
        '</div>' +
        `<label class="block text-[11px] font-semibold text-[#757575] mb-1">${esc(tr('Select reason for incomplete task:'))}</label>` +
        '<select class="inc-select w-full text-xs p-2 border border-[#E0E6ED] rounded-lg mb-1.5 bg-white font-medium text-[#2C3E50]">' +
        `<option value="">${esc(tr('-- Choose reason --'))}</option>` +
        `<option value="Patient Refused"${prevReason.startsWith('Patient Refused') ? ' selected' : ''}>${esc(tr('Patient Refused'))}</option>` +
        `<option value="Patient Sleeping / Resting"${prevReason.startsWith('Patient Sleeping') ? ' selected' : ''}>${esc(tr('Patient Sleeping / Resting'))}</option>` +
        `<option value="Doctor / Supervisor Advice"${prevReason.startsWith('Doctor') ? ' selected' : ''}>${esc(tr('Doctor / Supervisor Advice'))}</option>` +
        `<option value="Family Requested Delay"${prevReason.startsWith('Family') ? ' selected' : ''}>${esc(tr('Family Requested Delay'))}</option>` +
        `<option value="Equipment / Consumable Unavailable"${prevReason.startsWith('Equipment') ? ' selected' : ''}>${esc(tr('Equipment / Consumable Unavailable'))}</option>` +
        `<option value="Other"${prevReason.startsWith('Other') ? ' selected' : ''}>${esc(tr('Other Clinical Reason'))}</option>` +
        '</select>' +
        `<input type="text" class="inc-note w-full text-xs p-2 border border-[#E0E6ED] rounded-lg placeholder-slate-400" placeholder="${esc(tr('Additional details or notes (required if Other)'))}">` +
        '</div>';
    }).join('');
    applyLang();
  }

  window.confirmIncompleteReasons = async function () {
    const container = byId('incompleteTaskList');
    if (!container) return;
    const rows = container.querySelectorAll('[data-tid]');
    let valid = true;

    rows.forEach((row) => {
      const tid = row.getAttribute('data-tid');
      const sel = row.querySelector('.inc-select');
      const noteInp = row.querySelector('.inc-note');
      const val = sel ? sel.value.trim() : '';
      const note = noteInp ? noteInp.value.trim() : '';

      if (!val) {
        valid = false;
        if (sel) sel.classList.add('input-error');
        return;
      }
      if (val === 'Other' && !note) {
        valid = false;
        if (noteInp) noteInp.classList.add('input-error');
        return;
      }
      if (sel) sel.classList.remove('input-error');
      if (noteInp) noteInp.classList.remove('input-error');
      incompleteReasonsMap[tid] = val + (note ? ` - ${note}` : '');
    });

    if (!valid) {
      showToast('Please provide a valid reason for each skipped task.');
      return;
    }

    window.closeModal('modalIncomplete');
    const passed = await startLivenessCheck('end_shift');
    if (passed) await window.submitShiftLogout();
  };

  /* ---------- Modals & Vitals ---------- */
  window.openModal = function (id) {
    const m = byId(id);
    if (!m) return;
    m.classList.remove('hidden');
    applyLang();
  };

  window.closeModal = function (id) {
    const m = byId(id);
    if (m) m.classList.add('hidden');
  };

  window.openVitalsModal = function () {
    if (shiftState === SHIFT_COMPLETED) return;
    window.openModal('modalVitals');
  };

  window.openSosModal = function () {
    window.openModal('modalSos');
  };

  window.saveVitals = function () {
    byId('valBP').textContent = byId('inBP').value || '120/80';
    byId('valSpO2').textContent = byId('inSpO2').value || '98%';
    byId('valPulse').textContent = byId('inPulse').value || '72';
    byId('valTemp').textContent = byId('inTemp').value || '98.4°F';
    byId('valGRBS').textContent = (byId('inGRBS').value || '130').replace('mg/dL', '').trim();

    window.closeModal('modalVitals');
    showToast('Vitals Updated Successfully');
    if (window.SM_DEMO && typeof window.SM_DEMO.notifyDemoAction === 'function') {
      window.SM_DEMO.notifyDemoAction('Demo vitals update');
    }
  };

  window.submitSos = function () {
    const reason = byId('sosReasonSelect').value;
    const note = (byId('sosNoteInput') && byId('sosNoteInput').value) || '';
    apiRequest('/caregiver/sos', { method: 'POST', body: { reason, note } }).catch(() => {});
    if (byId('sosNoteInput')) byId('sosNoteInput').value = '';
    window.closeModal('modalSos');
    showToast(`Supervisor Alert Dispatched: ${reason}`);
  };

  /* ---------- Submit Shift Logout & Save in DB ---------- */
  window.submitShiftLogout = async function () {
    const btnLogout = byId('btnLogout');
    if (btnLogout) btnLogout.disabled = true;

    const doneMap = {};
    TASKS.forEach((t) => { doneMap[t.id] = Boolean(t.done); });

    const vitals = {
      bp: byId('valBP') ? byId('valBP').textContent.trim() : '',
      spo2: byId('valSpO2') ? byId('valSpO2').textContent.trim() : '',
      pulse: byId('valPulse') ? byId('valPulse').textContent.trim() : '',
      temp: byId('valTemp') ? byId('valTemp').textContent.trim() : '',
      grbs: byId('valGRBS') ? byId('valGRBS').textContent.trim() : '',
    };

    try {
      const { ok, data } = await apiRequest(sm.urls.shiftLogout, {
        method: 'POST',
        body: {
          tasks: TASKS,
          done: doneMap,
          incompleteReasons: incompleteReasonsMap,
          vitals,
          remarks: ['All care activities processed'],
        },
      });

      if (!ok || !data.ok) {
        if (data.requiresEarlyLogoutApproval) {
          if (btnLogout && shiftState === SHIFT_ON_DUTY) btnLogout.disabled = false;
          await refreshShiftStatus();
          showToast(data.error || 'Admin approval required for early logout.');
          if (!sm.earlyLogoutRequest || sm.earlyLogoutRequest.status !== 'PENDING') {
            openEarlyLogoutModal();
          }
          return;
        }
        if (data.requiresLiveness) {
          if (btnLogout && shiftState === SHIFT_ON_DUTY) btnLogout.disabled = false;
          const passed = await startLivenessCheck('end_shift');
          if (passed) await window.submitShiftLogout();
          return;
        }
        throw new Error(data.error || 'Failed to submit shift.');
      }

      shiftState = SHIFT_COMPLETED;
      sm.shiftState = SHIFT_COMPLETED;
      sm.log = sm.log || {};
      sm.log.logoutTime = data.logoutTime || new Date().toISOString();
      if (data.shift) sm.shift = data.shift;
      updateShiftUI();
      renderTasks();
      showToast('Shift ended and tasks saved to database successfully.');
      if (window.SnehaVoice) window.SnehaVoice.speak('logout_success');
    } catch (err) {
      if (btnLogout && shiftState === SHIFT_ON_DUTY) btnLogout.disabled = false;
      showToast(err.message || 'Failed to complete shift logout.');
    }
  };

  /* ---------- Language Switching & Complete UI Translation ---------- */
  function applyLang() {
    const isEn = (LANG === 'en');
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null);
    let node;
    while ((node = walker.nextNode())) {
      const p = node.parentElement;
      if (!p || p.closest('.notranslate, [translate="no"], [data-dynamic-tr], script, style, noscript, #langBar')) continue;
      const enAttr = p.getAttribute ? p.getAttribute('data-en') : null;
      if (node._en === undefined) node._en = enAttr || node.nodeValue;
      node.nodeValue = isEn ? node._en : tr(node._en);
    }

    document.querySelectorAll('input[placeholder], textarea[placeholder]').forEach((el) => {
      if (el.closest('.notranslate, [translate="no"], [data-dynamic-tr], #langBar')) return;
      if (el._enPh === undefined) el._enPh = el.placeholder;
      el.placeholder = isEn ? el._enPh : tr(el._enPh);
    });

    document.querySelectorAll('select option').forEach((opt) => {
      if (opt.closest('.notranslate, [translate="no"], #langBar')) return;
      if (opt._enText === undefined) opt._enText = opt.text;
      opt.text = isEn ? opt._enText : tr(opt._enText);
    });
  }

  window.setLang = function (l) {
    LANG = l || 'en';
    window.SM_LANG = LANG;
    try { localStorage.setItem('sm_lang', LANG); } catch (_) {}

    document.querySelectorAll('#langBar button').forEach((b) => {
      b.className = 'text-[10px] font-bold px-1.5 py-0.5 rounded-full border ' +
        (b.dataset.lang === LANG ? 'bg-[#D32F2F] border-[#D32F2F] text-white' : 'border-white/30 text-slate-300');
    });

    const hr = new Date().getHours();
    const greetKey = (hr < 12) ? 'Good Morning' : (hr < 17) ? 'Good Afternoon' : (hr < 21) ? 'Good Evening' : 'Good Night';
    const greetEl = byId('greet');
    if (greetEl) greetEl.textContent = tr(greetKey);

    renderGdaMetaUI();
    renderTasks();
    updateShiftUI();
    applyLang();
    if (window.SnehaVoice) window.SnehaVoice.setLanguage(LANG);
  };

  /* ---------- Delegated DOM Events (replaces inline onclick) ---------- */
  function bindUiEvents() {
    const ACTIONS = {
      toggleMute: () => { if (window.SnehaVoice) window.SnehaVoice.toggleMute(); },
      shiftLogin: () => window.handleShiftLogin(),
      shiftLogout: () => window.handleShiftLogout(),
      openVitals: () => window.openVitalsModal(),
      openSos: () => window.openSosModal(),
      submitSos: () => window.submitSos(),
      saveVitals: () => window.saveVitals(),
      confirmIncomplete: () => window.confirmIncompleteReasons(),
      submitLateLogin: () => window.submitLateLogin(),
      submitEarlyLogout: () => window.submitEarlyLogoutRequest(),
    };

    document.addEventListener('click', (event) => {
      const langBtn = event.target.closest('#langBar [data-lang]');
      if (langBtn) {
        window.setLang(langBtn.dataset.lang);
        return;
      }

      const closeBtn = event.target.closest('[data-close-modal]');
      if (closeBtn) {
        window.closeModal(closeBtn.dataset.closeModal);
        return;
      }

      const taskCard = event.target.closest('#taskListContainer [data-task-id]');
      if (taskCard) {
        window.toggleTask(taskCard.dataset.taskId);
        return;
      }

      const actBtn = event.target.closest('[data-action]');
      if (actBtn && ACTIONS[actBtn.dataset.action]) {
        ACTIONS[actBtn.dataset.action]();
      }
    });
  }

  /* ---------- Initialization & Live Sync ---------- */
  try {
    const savedLang = localStorage.getItem('sm_lang');
    if (savedLang && ['te', 'hi', 'en'].includes(savedLang)) {
      LANG = savedLang;
      window.SM_LANG = savedLang;
    }
  } catch (_) {}

  bindUiEvents();
  window.setLang(LANG);

  if (sm.urls && sm.urls.status) {
    _statusPollTimer = setInterval(() => {
      if (document.visibilityState !== 'hidden') refreshShiftStatus();
    }, POLL_INTERVAL_MS);
    window.addEventListener('focus', () => refreshShiftStatus());
  }
})();
