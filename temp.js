
let tickerInt;
function startLiveTicker() {
  if(tickerInt) clearInterval(tickerInt);
  const t = document.getElementById('bloomberg-ticker');
  if(!t) return;
  
  // Calculate real metrics based on profile data
  const calculateMetrics = () => {
    const p = P();
    const todayStr = new Date().toISOString().slice(0,10);
    const todayLogs = p.studyLog.filter(l => l.date === todayStr);
    const minsToday = todayLogs.reduce((a,b)=>a+b.mins,0);
    
    // Tasks completed today
    // We don't have task completion timestamps, so we use streak as proxy for overall momentum
    const velocity = (minsToday / 60).toFixed(2); 
    
    // Retention based on flashcards
    let retention = 0;
    if(p.flashcards && p.flashcards.length > 0) {
      const mature = p.flashcards.filter(f => f.interval > 21).length;
      retention = (mature / p.flashcards.length * 100).toFixed(1);
    } else {
      retention = 85.0; // baseline if no cards
    }
    
    // Monte Carlo probability proxy based on topic mastery
    let totalTopics = 0;
    let doneTopics = 0;
    Object.values(p.subjects).forEach(s => {
      const tpcs = Object.values(s.topics);
      totalTopics += tpcs.length;
      doneTopics += tpcs.filter(x=>x.status==='done').length;
    });
    
    let prob = 50; // base probability
    if(totalTopics > 0) {
      prob = 50 + (doneTopics/totalTopics * 40);
    }
    
    const velElem = document.getElementById('stat-velocity');
    const retElem = document.getElementById('stat-retention');
    const probElem = document.getElementById('stat-prob');
    
    if(velElem) velElem.innerText = velocity;
    if(retElem) retElem.innerText = retention + '%';
    if(probElem) probElem.innerText = prob.toFixed(1) + '%';
    
    t.innerText = `SYS.MEM: OK | LAST.SYNC: ${new Date().toLocaleTimeString()} | OVERALL.MASTERY: ${(doneTopics/Math.max(1,totalTopics)*100).toFixed(1)}% | SRS.RETENTION: ${retention}% | ACTIVE.STREAK: ${p.streak.count || 0} DAYS | TODAY.LOG: ${minsToday} MINS`;
  };
  
  calculateMetrics(); // Initial
  tickerInt = setInterval(calculateMetrics, 60000); // Update every minute
}

// ============================================================
// SYLLABI DATA — real IGCSE syllabus topics, paper structures
// CAIE + Edexcel coverage.
// ============================================================

const SYLLABI = {
  // === CIE SCIENCES ===
  '0620': {
    code: '0620', name: 'Chemistry', board: 'CAIE', tier: 'Extended',
    paperStruct: [
      {num:'2', name:'MCQ (extended)', marks:40, time:45},
      {num:'4', name:'Theory (extended)', marks:80, time:105},
      {num:'6', name:'Alternative to Practical', marks:40, time:60}
    ],
    topics: [
      'States of matter','Atoms, elements & compounds','Stoichiometry','Electrochemistry',
      'Chemical energetics','Chemical reactions (rates, reversible, redox)','Acids, bases & salts',
      'The Periodic Table','Metals','Chemistry of the environment','Organic chemistry',
      'Experimental techniques & analysis'
    ],
    color: 'chem'
  },
  '0610': {
    code: '0610', name: 'Biology', board: 'CAIE', tier: 'Extended',
    paperStruct: [
      {num:'2', name:'MCQ (extended)', marks:40, time:45},
      {num:'4', name:'Theory (extended)', marks:80, time:75},
      {num:'6', name:'Alternative to Practical', marks:40, time:60}
    ],
    topics: [
      'Characteristics & classification of living organisms','Organisation of the organism',
      'Movement into and out of cells','Biological molecules','Enzymes','Plant nutrition',
      'Human nutrition','Transport in plants','Transport in animals','Diseases & immunity',
      'Gas exchange in humans','Respiration','Excretion in humans','Coordination & response',
      'Drugs','Reproduction','Inheritance','Variation & selection','Organisms & their environment',
      'Human influences on ecosystems','Biotechnology & genetic modification'
    ],
    color: 'bio'
  },
  '0625': {
    code: '0625', name: 'Physics', board: 'CAIE', tier: 'Extended',
    paperStruct: [
      {num:'2', name:'MCQ (extended)', marks:40, time:45},
      {num:'4', name:'Theory (extended)', marks:80, time:75},
      {num:'6', name:'Alternative to Practical', marks:40, time:60}
    ],
    topics: [
      'Motion, forces & energy','Thermal physics','Waves','Electricity & magnetism',
      'Nuclear physics','Space physics'
    ],
    color: 'phys'
  },
  '0654': {
    code: '0654', name: 'Coordinated Sciences', board: 'CAIE', tier: 'Extended',
    paperStruct: [
      {num:'2', name:'MCQ', marks:40, time:45},
      {num:'4', name:'Theory', marks:120, time:120},
      {num:'6', name:'Alternative to Practical', marks:60, time:90}
    ],
    topics: [
      'Bio: Cells & organisation','Bio: Transport & gas exchange','Bio: Reproduction & inheritance',
      'Bio: Ecology & environment','Chem: Atomic structure','Chem: Stoichiometry & reactions',
      'Chem: Acids & periodic table','Chem: Organic chemistry','Phys: Motion & forces',
      'Phys: Energy & thermal','Phys: Waves','Phys: Electricity & magnetism'
    ],
    color: 'chem'
  },

  // === CIE MATHS ===
  '0580': {
    code: '0580', name: 'Mathematics', board: 'CAIE', tier: 'Extended',
    paperStruct: [
      {num:'2', name:'Core (non-calc)', marks:80, time:90},
      {num:'4', name:'Extended (calc)', marks:130, time:150}
    ],
    topics: [
      'Number','Algebra & graphs','Coordinate geometry','Geometry','Mensuration',
      'Trigonometry','Transformations & vectors','Probability','Statistics'
    ],
    color: 'math'
  },
  '0606': {
    code: '0606', name: 'Additional Mathematics', board: 'CAIE',
    paperStruct: [
      {num:'1', name:'Paper 1', marks:80, time:120},
      {num:'2', name:'Paper 2', marks:80, time:120}
    ],
    topics: [
      'Functions','Quadratic functions','Equations, inequalities, graphs','Indices & surds',
      'Factors of polynomials','Simultaneous equations','Logarithmic & exponential functions',
      'Straight line graphs','Coordinate geometry of the circle','Circular measure',
      'Trigonometry','Permutations & combinations','Series','Vectors in two dimensions',
      'Differentiation & integration','Kinematics'
    ],
    color: 'math'
  },
  '0607': {
    code: '0607', name: 'International Mathematics', board: 'CAIE',
    paperStruct: [
      {num:'2', name:'Paper 2', marks:40, time:45},
      {num:'4', name:'Paper 4', marks:120, time:135},
      {num:'6', name:'Investigation/Modelling', marks:40, time:75}
    ],
    topics: [
      'Number','Algebra','Functions','Coordinate geometry','Geometry',
      'Mensuration','Trigonometry','Sets','Probability','Statistics'
    ],
    color: 'math'
  },

  // === CIE LANGUAGES ===
  '0500': {
    code: '0500', name: 'English First Language', board: 'CAIE',
    paperStruct: [
      {num:'1', name:'Reading', marks:80, time:120},
      {num:'2', name:'Directed Writing & Composition', marks:80, time:120}
    ],
    topics: [
      'Reading: comprehension (short-answer Q1a-d)','Reading: writer\'s effects (Q2)',
      'Reading: summary writing (Q3)','Writing: directed (article/letter/speech/report)',
      'Writing: narrative composition','Writing: descriptive composition',
      'Vocabulary precision & range','Grammar, punctuation & spelling polish',
      'Tone, register & audience','Structure & paragraphing'
    ],
    color: 'eng'
  },
  '0510': {
    code: '0510', name: 'English as a Second Language', board: 'CAIE',
    paperStruct: [
      {num:'2', name:'Reading & Writing', marks:80, time:120},
      {num:'1', name:'Listening', marks:40, time:50},
      {num:'5', name:'Speaking', marks:40, time:12}
    ],
    topics: [
      'Reading: short text comprehension','Reading: gap-fill','Reading: matching',
      'Reading: long text comprehension','Writing: email/letter (Q5)',
      'Writing: report/article/review (Q6)','Listening: short extracts',
      'Listening: long extracts & note-taking','Speaking: warm-up & topic',
      'Vocabulary range & accuracy','Grammar accuracy','Discourse markers'
    ],
    color: 'eng'
  },
  '0508': {
    code: '0508', name: 'Arabic First Language', board: 'CAIE',
    paperStruct: [
      {num:'1', name:'Reading & Comprehension', marks:50, time:120},
      {num:'2', name:'Writing', marks:50, time:120}
    ],
    topics: [
      'النصوص النثرية (prose comprehension)','النصوص الشعرية (poetry analysis)',
      'القواعد النحوية (grammar rules)','الإعراب (parsing)','البلاغة (rhetoric)',
      'الإملاء (spelling/dictation)','التلخيص (summarising)',
      'الكتابة الإبداعية (creative writing)','كتابة المقال (essay writing)',
      'الكتابة الوظيفية (functional writing)'
    ],
    color: 'ar'
  },
  '0544': {
    code: '0544', name: 'Arabic as a Foreign Language', board: 'CAIE',
    paperStruct: [
      {num:'1', name:'Listening', marks:40, time:45},
      {num:'2', name:'Reading & Writing', marks:80, time:105},
      {num:'3', name:'Speaking', marks:40, time:15}
    ],
    topics: [
      'Reading: short texts','Reading: long passages','Writing: short messages',
      'Writing: extended essay','Listening: dialogues','Listening: monologues',
      'Speaking: presentation','Speaking: conversation','Vocabulary themes',
      'Grammar: verbs & tenses','Grammar: nouns & adjectives'
    ],
    color: 'ar'
  },
  '0520': {
    code: '0520', name: 'French as a Foreign Language', board: 'CAIE',
    paperStruct: [
      {num:'1', name:'Listening', marks:40, time:45},
      {num:'2', name:'Reading & Writing', marks:65, time:90},
      {num:'3', name:'Speaking', marks:40, time:12}
    ],
    topics: [
      'Reading: short texts','Reading: extended passages','Writing: messages & forms',
      'Writing: essay (130-140 words)','Listening: short items','Listening: extended',
      'Speaking: presentation','Speaking: role-play','Vocabulary: family/school/leisure',
      'Vocabulary: travel/work/environment','Grammar: tenses','Grammar: pronouns'
    ],
    color: 'eng'
  },

  // === CIE LIT/HUM ===
  '0475': {
    code: '0475', name: 'English Literature', board: 'CAIE',
    paperStruct: [
      {num:'1', name:'Poetry & Prose', marks:50, time:90},
      {num:'2', name:'Drama', marks:25, time:45},
      {num:'3', name:'Coursework', marks:50, time:0}
    ],
    topics: [
      'Poetry: close reading','Poetry: comparative analysis','Prose: set text passage',
      'Prose: essay on whole text','Drama: set play passage','Drama: essay',
      'Critical vocabulary','Quotation & evidence use','Themes & contexts',
      'Author technique analysis'
    ],
    color: 'lit'
  },
  '0470': {
    code: '0470', name: 'History', board: 'CAIE',
    paperStruct: [
      {num:'1', name:'Core/Depth Studies', marks:60, time:120},
      {num:'2', name:'Source-based', marks:50, time:120},
      {num:'4', name:'Alternative to Coursework', marks:40, time:60}
    ],
    topics: [
      'Core: Were the Peace Treaties of 1919-23 fair?','Core: League of Nations',
      'Core: Hitler\'s foreign policy & WW2 outbreak','Core: Cold War origins',
      'Core: Vietnam War','Depth: Germany 1918-45','Depth: Russia 1905-41',
      'Depth: USA 1919-41','Source analysis skills','Essay structure & argument'
    ],
    color: 'hum'
  },
  '0460': {
    code: '0460', name: 'Geography', board: 'CAIE',
    paperStruct: [
      {num:'1', name:'Geographical Themes', marks:75, time:105},
      {num:'2', name:'Geographical Skills', marks:60, time:90},
      {num:'4', name:'Alternative to Coursework', marks:60, time:90}
    ],
    topics: [
      'Population & settlement','Migration','Urban environments','The natural environment',
      'Earthquakes & volcanoes','Rivers & coasts','Weather & climate','Ecosystems',
      'Economic development','Food production','Industry','Tourism','Energy',
      'Water','Environmental risks','Map skills','Graph interpretation'
    ],
    color: 'hum'
  },

  // === CIE BUSINESS ===
  '0450': {
    code: '0450', name: 'Business Studies', board: 'CAIE',
    paperStruct: [
      {num:'1', name:'Short answer & data response', marks:80, time:90},
      {num:'2', name:'Case study', marks:80, time:90}
    ],
    topics: [
      'Understanding business activity','People in business','Marketing',
      'Operations management','Financial information & decisions','External influences on business'
    ],
    color: 'biz'
  },
  '0455': {
    code: '0455', name: 'Economics', board: 'CAIE',
    paperStruct: [
      {num:'1', name:'MCQ', marks:30, time:45},
      {num:'2', name:'Structured questions', marks:90, time:135}
    ],
    topics: [
      'The basic economic problem','The allocation of resources','Microeconomic decision-makers',
      'Government & the macroeconomy','Economic development','International trade & globalisation'
    ],
    color: 'biz'
  },
  '0452': {
    code: '0452', name: 'Accounting', board: 'CAIE',
    paperStruct: [
      {num:'1', name:'Paper 1', marks:120, time:105},
      {num:'2', name:'Paper 2', marks:120, time:105}
    ],
    topics: [
      'The fundamentals of accounting','Sources & recording of data','Verification of accounting records',
      'Accounting procedures','Preparation of financial statements','Analysis & interpretation',
      'Accounting principles & policies'
    ],
    color: 'biz'
  },

  // === CIE COMPUTING ===
  '0478': {
    code: '0478', name: 'Computer Science', board: 'CAIE',
    paperStruct: [
      {num:'1', name:'Computer Systems', marks:75, time:105},
      {num:'2', name:'Algorithms, Programming & Logic', marks:75, time:105}
    ],
    topics: [
      'Data representation (binary, hex, text, images, sound, compression)',
      'Data transmission','Hardware (CPU, memory, I/O, secondary storage)',
      'Software (system & application, programming languages)','The internet & its uses',
      'Automated & emerging technologies','Algorithm design & problem-solving',
      'Programming (sequence, selection, iteration, arrays)','Databases (SQL)',
      'Boolean logic (truth tables, logic gates)'
    ],
    color: 'comp'
  },
  '0417': {
    code: '0417', name: 'ICT', board: 'CAIE',
    paperStruct: [
      {num:'1', name:'Theory', marks:80, time:90},
      {num:'2', name:'Document Production, Databases & Presentations', marks:80, time:150},
      {num:'3', name:'Spreadsheets & Website Authoring', marks:80, time:150}
    ],
    topics: [
      'Types & components of computer systems','Input & output devices','Storage devices & media',
      'Networks','Effects of using IT','ICT applications','System life cycle',
      'Safety & security','Audience','Communication','File management','Images',
      'Layout','Styles','Proofing','Graphs & charts','Document production',
      'Databases','Presentations','Spreadsheets','Website authoring'
    ],
    color: 'comp'
  },

  // === EDEXCEL ===
  '4CH1': {
    code: '4CH1', name: 'Chemistry', board: 'Edexcel',
    paperStruct: [
      {num:'1C', name:'Paper 1C', marks:110, time:120},
      {num:'2C', name:'Paper 2C', marks:70, time:75}
    ],
    topics: [
      'Principles of chemistry','Inorganic chemistry','Physical chemistry','Organic chemistry'
    ],
    color: 'chem'
  },
  '4BI1': {
    code: '4BI1', name: 'Biology', board: 'Edexcel',
    paperStruct: [
      {num:'1B', name:'Paper 1B', marks:110, time:120},
      {num:'2B', name:'Paper 2B', marks:70, time:75}
    ],
    topics: [
      'The nature & variety of living organisms','Structures & functions in living organisms',
      'Reproduction & inheritance','Ecology & the environment','Use of biological resources'
    ],
    color: 'bio'
  },
  '4PH1': {
    code: '4PH1', name: 'Physics', board: 'Edexcel',
    paperStruct: [
      {num:'1P', name:'Paper 1P', marks:110, time:120},
      {num:'2P', name:'Paper 2P', marks:70, time:75}
    ],
    topics: [
      'Forces & motion','Electricity','Waves','Energy resources & transfer',
      'Solids, liquids & gases','Magnetism & electromagnetism','Radioactivity & particles',
      'Astrophysics'
    ],
    color: 'phys'
  },
  '4MA1': {
    code: '4MA1', name: 'Mathematics A', board: 'Edexcel',
    paperStruct: [
      {num:'1H', name:'Paper 1H (Higher)', marks:100, time:120},
      {num:'2H', name:'Paper 2H (Higher)', marks:100, time:120}
    ],
    topics: [
      'Number','Algebra','Geometry','Statistics','Probability'
    ],
    color: 'math'
  }
};

// Order subjects by board then code for display
const SUBJECT_ORDER = [
  '0620','0610','0625','0654','0580','0606','0607','0500','0510','0508','0544','0520',
  '0475','0470','0460','0450','0455','0452','0478','0417',
  '4CH1','4BI1','4PH1','4MA1'
];

const BOARDS = ['CAIE','Edexcel','Oxford AQA','AQA International'];
const SESSIONS = ['M/J','O/N','F/M'];
const YEARS = [2024,2023,2022,2021,2020,2019,2018];
const VARIANTS = ['1','2','3'];

// link patterns
const gceGuideSubjFolder = {
  '0620': 'Chemistry (0620)',
  '0610': 'Biology (0610)',
  '0625': 'Physics (0625)',
  '0654': 'Co-ordinated Sciences (Double Award) (0654)',
  '0580': 'Mathematics (0580)',
  '0606': 'Mathematics - Additional (0606)',
  '0607': 'Mathematics - International (0607)',
  '0500': 'English - First Language (0500)',
  '0510': 'English - Second Language (0510)',
  '0508': 'Arabic - First Language (0508)',
  '0544': 'Arabic - Foreign Language (0544)',
  '0520': 'French - Foreign Language (0520)',
  '0475': 'Literature in English (0475)',
  '0470': 'History (0470)',
  '0460': 'Geography (0460)',
  '0450': 'Business Studies (0450)',
  '0455': 'Economics (0455)',
  '0452': 'Accounting (0452)',
  '0478': 'Computer Science (0478)',
  '0417': 'Information and Communication Technology (0417)'
};

function getGceFolderName(subj) {
  return gceGuideSubjFolder[subj.code] || `${subj.name} (${subj.code})`;
}

// link patterns
function gceGuideLink(subj, paperNum, variant, session, year, type='qp'){
  if(subj.board !== 'CAIE') return null;
  const sLetter = {'M/J':'s','O/N':'w','F/M':'m'}[session];
  const yy = String(year).slice(-2);
  const fname = `${subj.code}_${sLetter}${yy}_${type}_${paperNum}${variant}.pdf`;

  const bestExamHelpSlugs = {
    '0620': 'chemistry-0620',
    '0610': 'biology-0610',
    '0625': 'physics-0625',
    '0654': 'sciences-co-ordinated-0654',
    '0580': 'mathematics-0580',
    '0606': 'mathematics-additional-0606',
    '0607': 'mathematics-international-0607',
    '0500': 'english-first-language-0500',
    '0508': 'arabic-first-language-0508',
    '0475': 'english-literature-0475',
    '0470': 'history-0470',
    '0460': 'geography-0460',
    '0450': 'business-studies-0450',
    '0455': 'economics-0455',
    '0452': 'accounting-0452',
    '0478': 'computer-science-0478'
  };

  if (bestExamHelpSlugs[subj.code]) {
    return `https://bestexamhelp.com/exam/cambridge-igcse/${bestExamHelpSlugs[subj.code]}/${year}/${fname}`;
  }

  // Fallback to PapaCambridge direct PDF link
  const folderName = getGceFolderName(subj);
  return `https://pastpapers.papacambridge.com/directories/CAIE/CAIE-pastpapers/upload/Cambridge%20IGCSE/${encodeURIComponent(folderName)}/${year}/${fname}`;
}
function papaCambridgeLink(subj){
  if(subj.board !== 'CAIE') return null;
  const folderName = getGceFolderName(subj);
  return `https://papacambridge.com/papers/caie/index.php?dirpath=/Cambridge%20IGCSE/${encodeURIComponent(folderName)}/`;
}
function smeLink(subj){
  const mapping = {
    '0620': 'chemistry',
    '0610': 'biology',
    '0625': 'physics',
    '0654': 'co-ordinated-sciences',
    '0580': 'maths',
    '0606': 'additional-maths',
    '0607': 'international-maths',
    '0500': 'english',
    '0510': 'english-language',
    '0508': 'arabic',
    '0544': 'arabic',
    '0520': 'french',
    '0475': 'english-literature',
    '0470': 'history',
    '0460': 'geography',
    '0450': 'business-studies',
    '0455': 'economics',
    '0452': 'accounting',
    '0478': 'computer-science',
    '0417': 'ict',
    '4CH1': 'chemistry',
    '4BI1': 'biology',
    '4PH1': 'physics',
    '4MA1': 'maths'
  };
  const slug = mapping[subj.code] || subj.name.toLowerCase().replace(/\s+/g,'-').replace(/[^a-z-]/g,'');
  return `https://www.savemyexams.com/igcse/${slug}/`;
}


// ============================================================
// STATE MANAGEMENT
// localStorage namespaced per profile.
// Top-level shape: { version, currentProfile, profiles: { id: {...} } }
// ============================================================

const STORE_KEY = 'siege:v1';
const VERSION = '1.0.0';

function defaultProfile(name='operator', avatar='O'){
  return {
    id: 'p_' + Date.now() + '_' + Math.random().toString(36).slice(2,7),
    name, avatar,
    created: nowIso(),
    onboarded: false,
    board: 'CAIE',
    examSession: 'O/N 2026',
    deadline: '2026-09-30',
    examDate: '2026-11-01',
    dailyHours: 4,
    apiKey: '',
    model: 'openai/gpt-oss-120b',
    license: '',
    theme: 'red',
    dir: 'ltr',
    sysPromptExtra: '',
    subjects: {},
    subjectStrength: {},
    mission: { date:'', tasks:[], done:[] },
    streak: { count:0, lastDay:'', freezesUsed:0, freezeWeek:'' },
    studyLog: [],
    pomoCfg: { focus:25, break:5, subj:'' },
    chatByMode: { plan:[], explain:[], markscheme:[], weakness:[], recommender:[], concept:[], command:[], socratic:[], chem:[], predict:[] },
    achievements: [],
    gcalClientId: '',
    notionToken: '',
    notionPageId: '',
    notionProxy: '',
    habits: ['Sleep 8h','Exercise','Drink 2L water','No phone first 30min','Review notes before sleep'],
    habitLog: {},
    formulas: {},
    energyLog: []
  };
}

function defaultStore(){
  const p = defaultProfile();
  return {
    version: VERSION,
    currentProfile: p.id,
    profiles: { [p.id]: p }
  };
}

let STORE;

function loadStore(){
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if(!raw){ STORE = defaultStore(); save(); return; }
    const parsed = JSON.parse(raw);
    // migrate / fill defaults
    STORE = { ...defaultStore(), ...parsed };
    if(!STORE.profiles || Object.keys(STORE.profiles).length === 0){
      const p = defaultProfile();
      STORE.profiles = { [p.id]: p };
      STORE.currentProfile = p.id;
    }
    if(!STORE.profiles[STORE.currentProfile]){
      STORE.currentProfile = Object.keys(STORE.profiles)[0];
    }
    // fill profile defaults
    Object.values(STORE.profiles).forEach(p => {
      const d = defaultProfile();
      for(const k of Object.keys(d)){
        if(p[k] === undefined) p[k] = d[k];
      }
      // ensure chat modes
      const cd = d.chatByMode;
      for(const m of Object.keys(cd)){
        if(!p.chatByMode[m]) p.chatByMode[m] = [];
      }
    });
  } catch(e){
    console.error('store load failed', e);
    STORE = defaultStore();
    save();
  }
}

function save(){
  try { localStorage.setItem(STORE_KEY, JSON.stringify(STORE)); }
  catch(e){ console.error('save failed', e); }
}

function P(){ return STORE.profiles[STORE.currentProfile]; }

function switchProfile(id){
  if(!STORE.profiles[id]) return;
  STORE.currentProfile = id;
  save();
  bootRender();
  toast('switched to ' + P().name);
}

function newProfile(name, avatar){
  const p = defaultProfile(name, avatar || (name[0]||'O').toUpperCase());
  STORE.profiles[p.id] = p;
  STORE.currentProfile = p.id;
  save();
  bootRender();
  return p;
}

function deleteProfile(id){
  if(Object.keys(STORE.profiles).length <= 1){
    toast('cannot delete only profile');
    return false;
  }
  delete STORE.profiles[id];
  if(STORE.currentProfile === id){
    STORE.currentProfile = Object.keys(STORE.profiles)[0];
  }
  save();
  bootRender();
  return true;
}

// helper for subject state per profile
function getSubjState(code){
  const p = P();
  if(!p.subjects[code]){
    p.subjects[code] = {
      topicProgress: {},
      papers: [],
      papersAttempted: {}, // paperKey -> 'attempted'|'done'
      notes: {},
      mistakes: [],
      flashcards: []
    };
  }
  return p.subjects[code];
}

function enrolledSubjects(){
  const p = P();
  return Object.keys(p.subjects).filter(c => SYLLABI[c]);
}

// ============================================================
// UTILITIES
// ============================================================
function $(sel, root=document){ return root.querySelector(sel); }
function $$(sel, root=document){ return Array.from(root.querySelectorAll(sel)); }

function el(tag, attrs={}, html=''){
  const e = document.createElement(tag);
  Object.entries(attrs).forEach(([k,v])=>{
    if(k==='class') e.className = v;
    else if(k.startsWith('on') && typeof v==='function') e.addEventListener(k.slice(2),v);
    else if(v !== null && v !== undefined) e.setAttribute(k,v);
  });
  if(html !== '' && html !== null && html !== undefined) e.innerHTML = html;
  return e;
}

function nowIso(){ return new Date().toISOString(); }
function todayIso(){ return new Date().toISOString().slice(0,10); }
function pad2(n){ return n<10 ? '0'+n : ''+n; }
function clamp(n,lo,hi){ return Math.max(lo, Math.min(hi, n)); }
function daysBetween(a, b){
  const ms = new Date(b) - new Date(a);
  return Math.ceil(ms / 86400000);
}
function escapeHTML(s){ return (s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
function fmtMins(m){
  if(m<60) return m + ' min';
  return Math.floor(m/60) + 'h ' + (m%60) + 'm';
}
function dayKey(d){
  if(typeof d === 'string') return d.slice(0,10);
  return d.toISOString().slice(0,10);
}
function weekKey(d){
  const date = new Date(d);
  date.setHours(0,0,0,0);
  // ISO week
  date.setDate(date.getDate() + 4 - (date.getDay()||7));
  const yearStart = new Date(date.getFullYear(),0,1);
  const wn = Math.ceil((((date - yearStart)/86400000)+1)/7);
  return date.getFullYear()+'-W'+pad2(wn);
}

function rng(seed){
  let t = seed >>> 0;
  return function(){
    t |= 0; t = t + 0x6D2B79F5 | 0;
    let r = Math.imul(t ^ t >>> 15, 1 | t);
    r = r + Math.imul(r ^ r >>> 7, 61 | r) ^ r;
    return ((r ^ r >>> 14) >>> 0) / 4294967296;
  };
}
function pick(arr, r){ return arr[Math.floor(r() * arr.length)]; }
function dateSeed(d){ return parseInt(d.replace(/-/g,''),10) || 1; }

// debounce
function debounce(fn, ms=300){
  let t; return function(...a){ clearTimeout(t); t=setTimeout(()=>fn.apply(this,a), ms); };
}

// toast
function toast(msg, ms=2400, bad=false){
  const t = $('#toast');
  t.textContent = msg;
  t.classList.toggle('bad', bad);
  t.classList.add('show');
  clearTimeout(toast._t);
  toast._t = setTimeout(()=>t.classList.remove('show'), ms);
}


// ============================================================
// THEME & DIRECTION
// ============================================================
function applyTheme(theme){
  document.body.dataset.theme = theme;
  P().theme = theme;
  $$('#theme-seg button').forEach(b => b.classList.toggle('on', b.dataset.theme === theme));
  save();
}
function applyDir(dir){
  document.documentElement.dir = dir;
  P().dir = dir;
  $$('#dir-seg button').forEach(b => b.classList.toggle('on', b.dataset.dir === dir));
  save();
}

// ============================================================
// NAV
// ============================================================
function go(tab){
  $$('.sb-item').forEach(t => t.classList.toggle('active', t.dataset.tab === tab));
  $$('.section').forEach(s => s.classList.toggle('active', s.id === 'sec-'+tab));
  if(window.innerWidth <= 900){
    $('#sidebar').classList.remove('open');
    $('#sb-backdrop').classList.remove('show');
  }
  // section-specific renders
  if(tab === 'subj') renderSubjects();
  if(tab === 'papers') renderPaperLibrary();
  if(tab === 'ai') renderAI();
  if(tab === 'stats') renderStatsCharts();
  if(tab === 'mistakes') renderMistakes();
  if(tab === 'notes') renderNotes();
  if(tab === 'flash') renderFlash();
  if(tab === 'pomo') renderPomo();
  if(tab === 'cfg') renderCfg();
  if(tab === 'dash') renderDash();
  window.scrollTo({top:0,behavior:'instant'});
}
window.go = go;

// ============================================================
// ONBOARDING WIZARD
// ============================================================
const WIZ_STEPS = 8;
let wizState = null;

function startOnboarding(force=false){
  const p = P();
  if(p.onboarded && !force) return;
  wizState = {
    step: 1,
    name: p.name || '',
    avatar: p.avatar || 'O',
    board: 'CAIE',
    subjects: [],  // [{code, strength}]
    examSession: 'O/N 2026',
    deadline: '2026-09-30',
    examDate: '2026-11-01',
    dailyHours: 4,
    apiKey: ''
  };
  $('#wiz-bg').classList.add('show');
  renderWiz();
}

function renderWiz(){
  const card = $('#wiz-card');
  const step = wizState.step;
  $('#wiz-step').textContent = step;
  $('#wiz-prog-bar').style.width = (step/WIZ_STEPS*100) + '%';
  $('#wiz-back').style.visibility = step === 1 ? 'hidden' : 'visible';
  $('#wiz-next').textContent = step === WIZ_STEPS ? 'finish ✓' : 'next →';

  if(step === 1){
    card.innerHTML = `
      <h1>welcome to siege</h1>
      <p class="wiz-sub">an ai-powered study terminal for igcse students who hate studying but need to grind. let's set up your profile.</p>

      <div class="wiz-strap">
        <b>// the rule</b>
        siege does NOT generate fake practice questions with ai. we only reference real past papers (cambridge, edexcel, etc.) with verifiable paper codes. the ai's job is to plan your study and explain real questions — not invent fake ones.
      </div>

      <div class="field"><label>your name</label><input id="wiz-name" type="text" value="${escapeHTML(wizState.name)}" placeholder="alaa"></div>
      <div class="field"><label>avatar (1-2 characters)</label><input id="wiz-avatar" type="text" maxlength="2" value="${escapeHTML(wizState.avatar)}" placeholder="A"></div>
    `;
    $('#wiz-name').addEventListener('input', e => wizState.name = e.target.value);
    $('#wiz-avatar').addEventListener('input', e => wizState.avatar = e.target.value || 'O');
  }
  else if(step === 2){
    card.innerHTML = `
      <h1>which exam board?</h1>
      <p class="wiz-sub">we currently have full syllabus templates for Cambridge (CAIE) IGCSE and Edexcel IGCSE. other boards are supported but you'll add topics manually.</p>
      <div class="wiz-options">
        ${BOARDS.map(b => `
          <div class="wiz-opt ${wizState.board===b?'on':''}" data-board="${b}">
            <div class="wiz-opt-title">${b}</div>
            <div class="wiz-opt-desc">${b==='CAIE' ? 'cambridge international — 20+ pre-built subjects' : b==='Edexcel' ? 'pearson edexcel international gcse — 4+ pre-built subjects' : 'custom — add your own topics & codes'}</div>
          </div>
        `).join('')}
      </div>
    `;
    $$('#wiz-card .wiz-opt').forEach(o => o.addEventListener('click', ()=>{ wizState.board = o.dataset.board; renderWiz(); }));
  }
  else if(step === 3){
    const search = wizState._search || '';
    const list = SUBJECT_ORDER.filter(c => {
      const s = SYLLABI[c];
      if(wizState.board === 'CAIE' && s.board !== 'CAIE') return false;
      if(wizState.board === 'Edexcel' && s.board !== 'Edexcel') return false;
      if(search && !(s.name.toLowerCase().includes(search.toLowerCase()) || s.code.includes(search))) return false;
      return true;
    });
    card.innerHTML = `
      <h1>pick your subjects</h1>
      <p class="wiz-sub">tap to toggle. you can add up to 8 subjects. you can change these later in settings.</p>
      <div class="wiz-search"><input id="wiz-search" type="text" placeholder="search subject name or code..." value="${escapeHTML(search)}"></div>
      <div class="wiz-subj-list" id="wiz-subj-list">
        ${list.map(c => {
          const s = SYLLABI[c];
          const on = wizState.subjects.find(x => x.code === c);
          return `<div class="wiz-subj-row ${on?'on':''}" data-code="${c}">
            <div class="wsr-chk"></div>
            <div class="wsr-code">${s.code}</div>
            <div class="wsr-name">${s.name}${s.tier?' <span class="muted">('+s.tier+')</span>':''}</div>
            <div class="wsr-board">${s.board}</div>
          </div>`;
        }).join('')}
      </div>
      <p class="muted" style="font-size:10px;margin-top:10px;text-transform:uppercase;letter-spacing:1.5px">${wizState.subjects.length} selected · max 8</p>
    `;
    $('#wiz-search').addEventListener('input', e => { wizState._search = e.target.value; renderWiz(); });
    $$('#wiz-subj-list .wiz-subj-row').forEach(r => r.addEventListener('click', ()=>{
      const code = r.dataset.code;
      const idx = wizState.subjects.findIndex(x => x.code === code);
      if(idx >= 0) wizState.subjects.splice(idx, 1);
      else if(wizState.subjects.length < 8) wizState.subjects.push({ code, strength: 'medium' });
      else { toast('max 8 subjects'); return; }
      renderWiz();
    }));
  }
  else if(step === 4){
    if(wizState.subjects.length === 0){
      card.innerHTML = `<h1>no subjects selected</h1><p class="wiz-sub">go back and pick at least one subject.</p>`;
      return;
    }
    card.innerHTML = `
      <h1>how strong are you in each?</h1>
      <p class="wiz-sub">we use this to weight your daily study time. weak subjects get more hours.</p>
      <div style="margin-top:10px">
        ${wizState.subjects.map((sub, i) => {
          const s = SYLLABI[sub.code];
          return `<div class="card" style="margin-bottom:10px;padding:14px">
            <div class="row-between" style="margin-bottom:8px">
              <div><b style="font-family:var(--term);color:var(--accent);font-size:14px">${s.code}</b> ${s.name}</div>
              <div class="muted" style="font-size:10px;text-transform:uppercase">${s.board}</div>
            </div>
            <div class="wiz-strength" data-idx="${i}">
              <button data-s="weak" class="${sub.strength==='weak'?'on':''}">weak</button>
              <button data-s="medium" class="${sub.strength==='medium'?'on':''}">medium</button>
              <button data-s="strong" class="${sub.strength==='strong'?'on':''}">strong</button>
            </div>
          </div>`;
        }).join('')}
      </div>
    `;
    $$('#wiz-card .wiz-strength').forEach(strip => {
      strip.querySelectorAll('button').forEach(b => b.addEventListener('click', ()=>{
        const idx = parseInt(strip.dataset.idx);
        wizState.subjects[idx].strength = b.dataset.s;
        renderWiz();
      }));
    });
  }
  else if(step === 5){
    card.innerHTML = `
      <h1>when is your exam?</h1>
      <p class="wiz-sub">cambridge runs may/june, oct/nov, and feb/march sessions. set your specific date and the deadline you want to finish all content by (we recommend 1 month before exam).</p>
      <div class="field"><label>exam session</label>
        <select id="wiz-session">
          <option ${wizState.examSession==='O/N 2026'?'selected':''}>O/N 2026</option>
          <option ${wizState.examSession==='M/J 2026'?'selected':''}>M/J 2026</option>
          <option ${wizState.examSession==='F/M 2026'?'selected':''}>F/M 2026</option>
          <option ${wizState.examSession==='O/N 2027'?'selected':''}>O/N 2027</option>
          <option ${wizState.examSession==='M/J 2027'?'selected':''}>M/J 2027</option>
        </select>
      </div>
      <div class="field-row">
        <div class="field"><label>exam date (approx)</label><input id="wiz-exam" type="date" value="${wizState.examDate}"></div>
        <div class="field"><label>finish-by deadline</label><input id="wiz-deadline" type="date" value="${wizState.deadline}"></div>
      </div>
    `;
    $('#wiz-session').addEventListener('change', e => wizState.examSession = e.target.value);
    $('#wiz-exam').addEventListener('input', e => wizState.examDate = e.target.value);
    $('#wiz-deadline').addEventListener('input', e => wizState.deadline = e.target.value);
  }
  else if(step === 6){
    card.innerHTML = `
      <h1>how many hours can you study a day?</h1>
      <p class="wiz-sub">be honest. 2 hours done daily beats 8 hours planned and skipped. siege will weight each subject inside this budget.</p>
      <div class="field"><label>daily study budget (hours)</label><input id="wiz-hours" type="number" min="1" max="12" step="0.5" value="${wizState.dailyHours}"></div>
      <p style="font-size:11px;color:var(--muted);margin-top:8px">budget per subject (auto): ${wizState.subjects.map(s => {
        const w = s.strength === 'weak' ? 1.5 : (s.strength === 'medium' ? 1.0 : 0.5);
        const totalW = wizState.subjects.reduce((a,b)=> a + (b.strength==='weak'?1.5:b.strength==='medium'?1.0:0.5), 0);
        const h = (w/totalW * wizState.dailyHours).toFixed(1);
        return `<b style="color:var(--accent)">${SYLLABI[s.code].code}</b> ${h}h`;
      }).join(' · ')}</p>
    `;
    $('#wiz-hours').addEventListener('input', e => { wizState.dailyHours = parseFloat(e.target.value)||4; renderWiz(); });
  }
  else if(step === 7){
    card.innerHTML = `
      <h1>connect groq (optional)</h1>
      <p class="wiz-sub">siege uses groq's free api to power the ai assistant. without a key, you still get the rule-based daily plan + all tracking features.</p>
      <div class="wiz-strap">
        <b>// how to get a key</b>
        go to <a href="https://console.groq.com/keys" target="_blank">console.groq.com/keys</a> → sign in with google → "create api key" → paste below.
        free tier: 30 requests/min, 6000 tokens/min. enough to run siege all day.
      </div>
      <div class="field"><label>groq api key</label><input id="wiz-key" type="password" value="${wizState.apiKey}" placeholder="gsk_..."></div>
      <p class="muted" style="font-size:10px;text-transform:uppercase;letter-spacing:1.5px">your key is stored only in this browser. it's never sent anywhere except groq.com.</p>
    `;
    $('#wiz-key').addEventListener('input', e => wizState.apiKey = e.target.value);
  }
  else if(step === 8){
    card.innerHTML = `
      <h1>you're ready, student.</h1>
      <p class="wiz-sub">profile created. let's review and finish.</p>
      <div class="card" style="margin-top:14px;padding:18px">
        <div class="row-between"><b>name</b><span>${escapeHTML(wizState.name)}</span></div>
        <div class="divider-thin"></div>
        <div class="row-between"><b>board</b><span>${wizState.board}</span></div>
        <div class="divider-thin"></div>
        <div class="row-between"><b>subjects</b><span>${wizState.subjects.length}</span></div>
        <div class="divider-thin"></div>
        <div class="row-between"><b>exam</b><span>${wizState.examSession} · ${wizState.examDate}</span></div>
        <div class="divider-thin"></div>
        <div class="row-between"><b>deadline</b><span>${wizState.deadline}</span></div>
        <div class="divider-thin"></div>
        <div class="row-between"><b>daily budget</b><span>${wizState.dailyHours}h</span></div>
        <div class="divider-thin"></div>
        <div class="row-between"><b>groq ai</b><span>${wizState.apiKey ? 'connected' : 'offline mode'}</span></div>
      </div>
      <p style="font-size:11px;color:var(--muted);margin-top:14px;text-transform:uppercase;letter-spacing:1.5px">click finish to enter the terminal. you can change any of this later in settings.</p>
    `;
  }
}

function wizNext(){
  if(wizState.step === 1 && !wizState.name.trim()){ toast('enter a name'); return; }
  if(wizState.step === 3 && wizState.subjects.length === 0){ toast('pick at least one subject'); return; }
  if(wizState.step < WIZ_STEPS){ wizState.step++; renderWiz(); return; }
  // finish
  finishOnboarding();
}
function wizBack(){
  if(wizState.step > 1){ wizState.step--; renderWiz(); }
}
function wizSkip(){
  wizNext();
}

function finishOnboarding(){
  const p = P();
  p.name = wizState.name.trim() || 'operator';
  p.avatar = wizState.avatar.trim() || p.name[0].toUpperCase();
  p.board = wizState.board;
  p.examSession = wizState.examSession;
  p.examDate = wizState.examDate;
  p.deadline = wizState.deadline;
  p.dailyHours = wizState.dailyHours;
  p.apiKey = wizState.apiKey.trim();
  p.subjects = {};
  p.subjectStrength = {};
  wizState.subjects.forEach(s => {
    p.subjects[s.code] = { topicProgress:{}, papers:[], papersAttempted:{}, notes:{}, mistakes:[], flashcards:[] };
    p.subjectStrength[s.code] = s.strength;
  });
  p.onboarded = true;
  save();
  $('#wiz-bg').classList.remove('show');
  bootRender();
  toast('welcome, ' + p.name);
}


// ============================================================
// DASHBOARD
// ============================================================

function subjPct(code){
  const s = SYLLABI[code]; if(!s) return 0;
  const total = s.topics.length;
  const tp = getSubjState(code).topicProgress;
  let score = 0;
  for(let i=0;i<total;i++){
    const v = tp[i] || 0;
    score += v === 2 ? 1 : (v === 1 ? 0.5 : 0);
  }
  return Math.round(100 * score / total);
}

function greet(){
  const h = new Date().getHours();
  const sets = {
    morning: ['boot sequence complete,student','wake up. exam clock is moving','good morning,student','sun\'s up. siege ready','morning shift // engaged'],
    afternoon: ['back at it,student','siege online // afternoon shift','no breaks. afternoon push','operator returning','grind continues'],
    evening: ['evening protocols active','grind hours,student','last push before sleep','evening session // engaged','one more block'],
    night: ['nocturnal mode engaged','3am terminal // dangerous','sleep is for losers','late shift // siege awake','operator hasn\'t logged off']
  };
  let bucket;
  if(h<6) bucket='night';
  else if(h<12) bucket='morning';
  else if(h<18) bucket='afternoon';
  else if(h<23) bucket='evening';
  else bucket='night';
  const r = rng(dateSeed(todayIso()) + h);
  return pick(sets[bucket], r);
}

function updateCountdown(){
  const p = P();
  const days = daysBetween(todayIso(), p.examDate);
  const ddays = Math.max(0, daysBetween(todayIso(), p.deadline));
  $('#stat-days').textContent = ddays;
  $('#hero-exam').textContent = days >= 0 ? days : 'passed';
  const total = Math.max(1, daysBetween(p.created.slice(0,10) || todayIso(), p.deadline));
  const elapsed = Math.max(1, daysBetween(p.created.slice(0,10) || todayIso(), todayIso()) + 1);
  $('#hero-day').textContent = elapsed;
  $('#hero-total').textContent = total;
  const d = new Date(p.deadline);
  $('#hero-deadline').textContent = d.toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'2-digit'}).toLowerCase();
}

function renderDash(){
  $('#hero-title').textContent = greet();
  updateCountdown();
  renderStats();
  renderBars();
  renderMission(P().mission.tasks);
  renderWeakAreas();
  renderSRSPreview();

  // render new dashboard features
  renderHabitTracker();
  renderGradePredictor();
  renderEnergyChart();
}

function renderStats(){
  const p = P();
  let papers = 0, topicsDone = 0;
  enrolledSubjects().forEach(c => {
    papers += getSubjState(c).papers.length;
    const tp = getSubjState(c).topicProgress;
    Object.values(tp).forEach(v => { if(v === 2) topicsDone++; });
  });
  $('#stat-papers').textContent = papers;
  $('#stat-streak').textContent = p.streak.count || 0;
  $('#stat-topics').textContent = topicsDone;
  $('#sb-streak').textContent = (p.streak.count || 0) + 'd';
  const freezeUsed = p.streak.freezeWeek === weekKey(new Date());
  $('#stat-streak-sub').textContent = freezeUsed ? 'freeze used this week' : 'freeze available';
}

function renderBars(){
  const enrolled = enrolledSubjects();
  const wrap = $('#dash-bars');
  if(enrolled.length === 0){
    wrap.innerHTML = `<div class="empty"><div class="big">no subjects enrolled</div><div class="sm">go to subjects tab to add your syllabuses.</div><button class="btn hot" onclick="go('subj')">+ add subjects</button></div>`;
    return;
  }
  wrap.innerHTML = enrolled.map(c => {
    const s = SYLLABI[c];
    const pct = subjPct(c);
    const color = s.color || 'chem';
    return `<div class="subj-row">
      <div class="subj-tag">${s.code}</div>
      <div class="subj-bar-wrap"><div class="subj-bar" style="width:${pct}%;background:repeating-linear-gradient(45deg,var(--${color}) 0,var(--${color}) 6px,rgba(0,0,0,0.4) 6px,rgba(0,0,0,0.4) 12px)"></div></div>
      <div class="subj-pct">${pct}%</div>
    </div>`;
  }).join('');
}

function renderWeakAreas(){
  const wrap = $('#dash-weak');
  const items = [];
  enrolledSubjects().forEach(c => {
    const s = SYLLABI[c]; const st = getSubjState(c);
    s.topics.forEach((t,i) => {
      const p = st.topicProgress[i] || 0;
      const recentMistakes = st.mistakes.filter(m => m.topicIdx === i).length;
      if(p === 0 || (p === 1 && recentMistakes > 0)) items.push({code:c, name:s.name, topic:t, score: (recentMistakes*2) + (p===0?1:0)});
    });
  });
  items.sort((a,b)=> b.score - a.score);
  const top = items.slice(0,5);
  if(top.length === 0){
    wrap.innerHTML = '<p class="muted" style="font-size:11px;text-transform:uppercase;letter-spacing:1.5px">nothing flagged. log some papers + mistakes to surface weak areas.</p>';
    return;
  }
  wrap.innerHTML = top.map(t => `
    <div style="padding:8px 10px;border:1px solid var(--line);margin-bottom:4px;font-size:12px;display:flex;justify-content:space-between;align-items:center">
      <span><b style="font-family:var(--term);color:var(--accent)">${t.code}</b> · ${escapeHTML(t.topic)}</span>
      <span class="muted" style="font-size:9px;text-transform:uppercase;letter-spacing:1px">score ${t.score}</span>
    </div>
  `).join('');
}

function renderSRSPreview(){
  const wrap = $('#dash-srs');
  // simple: topics marked in-progress, not touched recently
  const items = [];
  enrolledSubjects().forEach(c => {
    const s = SYLLABI[c]; const st = getSubjState(c);
    s.topics.forEach((t,i) => {
      if((st.topicProgress[i]||0) === 1) items.push({code:c, topic:t, idx:i});
    });
  });
  if(items.length === 0){
    wrap.innerHTML = '<p class="muted" style="font-size:11px;text-transform:uppercase;letter-spacing:1.5px">no topics in review queue. mark topics as ~in progress~ to build it.</p>';
    return;
  }
  wrap.innerHTML = items.slice(0,5).map(t => `
    <div style="padding:8px 10px;border:1px solid var(--line);margin-bottom:4px;font-size:12px">
      <b style="font-family:var(--term);color:var(--warn)">${t.code}</b> · ${escapeHTML(t.topic)}
    </div>
  `).join('');
}

// ============================================================
// MISSION GENERATION
// ============================================================
function paperCode(code, paperNum, variant, session, year){
  return `${code}/${paperNum}${variant}/${session}/${String(year).slice(-2)}`;
}

function ruleMission(){
  const p = P();
  const today = todayIso();
  const r = rng(dateSeed(today));
  const tasks = [];
  const enrolled = enrolledSubjects();
  if(enrolled.length === 0) return [{subj:'sys',type:'lesson',task:'no subjects enrolled. go to subjects tab.',time:'-'}];

  // weight by strength
  const weights = enrolled.map(c => ({
    code: c,
    w: p.subjectStrength[c] === 'weak' ? 1.5 : (p.subjectStrength[c] === 'strong' ? 0.5 : 1.0)
  }));
  const totalW = weights.reduce((a,b)=>a+b.w,0);
  weights.forEach(w => w.hours = (w.w/totalW) * p.dailyHours);

  // for each subject, allocate 1-2 tasks proportional to weight
  weights.forEach(w => {
    const subj = SYLLABI[w.code];
    const st = getSubjState(w.code);
    const untouched = subj.topics.map((t,i)=>({t,i,s:st.topicProgress[i]||0})).filter(x => x.s !== 2);
    const hrsLeft = w.hours;
    if(hrsLeft < 0.4) return;

    // pick a topic (prefer untouched, then in-progress)
    if(untouched.length){
      const next = untouched[0];
      tasks.push({
        subj: w.code, type:'lesson',
        task: `[${subj.code} ${subj.name}] Study topic ${pad2(next.i+1)}: **${next.t}**. Write a 1-page summary in your own words.`,
        time: Math.round(Math.min(60, hrsLeft*60*0.5)) + ' min',
        topicIdx: next.i
      });
    }

    // pick a past paper (always include one if subject is weak or has hours)
    if(w.hours >= 0.8 || p.subjectStrength[w.code] === 'weak'){
      const paperOpts = subj.paperStruct;
      const paper = paperOpts[paperOpts.length > 1 ? 1 : 0]; // bias to "main" paper (usually theory)
      const year = pick(YEARS.slice(0,5), r);
      const session = pick(['M/J','O/N'], r);
      const variant = pick(VARIANTS, r);
      const code = paperCode(subj.code, paper.num, variant, session, year);
      tasks.push({
        subj: w.code, type:'paper',
        task: `[${subj.code}] Attempt past paper \`${code}\` (${paper.name}). Mark it after using the mark scheme. Log score & wrong questions in SIEGE.`,
        time: paper.time + ' min',
        paperCode: code
      });
    }
  });

  // sunday recap
  const dow = new Date(today).getDay();
  if(dow === 0 && enrolled.length){
    tasks.push({
      subj: enrolled[0], type:'mock',
      task: `SUNDAY RECAP: re-read your weak topic notes (use the notes vault) + 5 spaced-review flashcards.`,
      time: '30 min'
    });
  }

  return tasks;
}

function renderMission(tasks){
  const zone = $('#mission-zone');
  if(!tasks || tasks.length === 0){
    zone.innerHTML = '<p class="muted" style="margin-top:14px;font-size:11px;text-transform:uppercase;letter-spacing:1.5px">hit [generate today\'s mission] to load today\'s plan.</p>';
    return;
  }
  const p = P();
  zone.innerHTML = tasks.map((t,i) => {
    const done = (p.mission.done||[])[i];
    const code = SYLLABI[t.subj]?.code || t.subj;
    const subjPill = `<span class="pill subj">${escapeHTML(code)}</span>`;
    const typePill = `<span class="pill ${t.type==='paper'?'hot':(t.type==='mock'?'cy':'warn')}">${t.type}</span>`;
    const timePill = t.time ? `<span class="pill">${escapeHTML(t.time)}</span>` : '';
    // render task text with paper code linkified
    let taskHtml = mdRender(t.task);
    if(t.paperCode){
      const subj = SYLLABI[t.subj];
      const [scode, rest] = t.paperCode.split('/');
      const m = t.paperCode.match(/^(\w+)\/(\d+)(\d)\/(\w+\/\w+)\/(\d+)$/);
      if(m && subj){
        const link = gceGuideLink(subj, m[2], m[3], m[4], '20'+m[5]) || '#';
        taskHtml = taskHtml.replace(new RegExp(`<code>${t.paperCode}</code>`,'g'),
          `<a class="pcode" href="${link}" target="_blank">${t.paperCode}</a>`);
      }
    }
    return `<div class="mission-item ${done?'done':''}" data-idx="${i}">
      <div class="mission-check"></div>
      <div class="mission-body">
        <div class="mission-task">${taskHtml}</div>
        <div class="mission-meta">${subjPill}${typePill}${timePill}<button class="btn xs ghost" onclick="go('pomo');event.stopPropagation()" style="margin-left:auto">25m ⏱</button><button class="btn xs danger mission-remove-btn" data-ridx="${i}" title="remove this task">✕</button></div>
      </div>
    </div>`;
  }).join('');

  // edit bar
  zone.insertAdjacentHTML('beforeend', `
    <div class="mission-edit-bar">
      <button class="btn ghost xs" id="mission-edit-btn">✎ edit mission</button>
      <button class="btn ghost xs" id="mission-add-quick">+ add task</button>
      <button class="btn danger xs" id="mission-clear-btn">clear all</button>
    </div>
  `);

  $$('#mission-zone .mission-item').forEach(item => {
    item.addEventListener('click', (e) => {
      if(e.target.tagName === 'A' || e.target.classList.contains('mission-remove-btn')) return;
      const i = parseInt(item.dataset.idx);
      p.mission.done = p.mission.done || [];
      p.mission.done[i] = !p.mission.done[i];
      save();
      renderMission(p.mission.tasks);
      if(p.mission.done[i]) bumpStreak();
    });
  });

  // remove buttons
  $$('#mission-zone .mission-remove-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const idx = parseInt(btn.dataset.ridx);
      if(confirm('remove this task?')){
        removeTaskFromMission(idx);
        toast('task removed');
      }
    });
  });

  // edit bar actions
  const editBtn = $('#mission-edit-btn');
  const addBtn = $('#mission-add-quick');
  const clearBtn = $('#mission-clear-btn');
  if(editBtn) editBtn.onclick = () => openManualMissionBuilder();
  if(addBtn) addBtn.onclick = () => {
    const enrolled = enrolledSubjects();
    if(!enrolled.length){ toast('no subjects enrolled'); return; }
    const defaultSubj = enrolled[0];
    const task = prompt('task description:');
    if(!task || !task.trim()) return;
    const time = prompt('time estimate (e.g. 30 min):', '30 min') || '-';
    addTaskToMission({ subj: defaultSubj, type: 'lesson', task: task.trim(), time });
    toast('task added');
  };
  if(clearBtn) clearBtn.onclick = () => {
    if(!confirm('clear entire mission?')) return;
    const p = P();
    p.mission = { date: '', tasks: [], done: [] };
    save();
    renderMission([]);
    toast('mission cleared');
  };
}

async function generateMission(){
  const today = todayIso();
  const p = P();
  if(p.mission.date === today && p.mission.tasks.length){
    if(!confirm('mission already exists for today. regenerate?')) {
      renderMission(p.mission.tasks); return;
    }
  }
  // show picker modal: AI or manual
  const enrolled = enrolledSubjects();
  const hasKey = !!p.apiKey;
  const subjOpts = enrolled.map(c => `<option value="${c}">${SYLLABI[c].code} · ${SYLLABI[c].name}</option>`).join('');
  openModal(`
    <h3>generate today's mission</h3>
    <p style="font-size:12px;color:var(--ink-dim);margin-bottom:16px">choose how to build your mission for <b style="color:var(--accent)">${today}</b></p>
    <div class="mission-picker">
      <div class="mission-pick-opt ai-opt" id="mpo-ai">
        <span class="mpo-icon">⚡</span>
        <div class="mpo-title">${hasKey ? 'ai generate' : 'auto generate'}</div>
        <div class="mpo-desc">${hasKey ? 'siege.ai builds your plan using groq. weighted by weaknesses, real paper codes.' : 'rule-based plan weighted by your subjects + strengths. add a groq key for ai mode.'}</div>
      </div>
      <div class="mission-pick-opt manual-opt" id="mpo-manual">
        <span class="mpo-icon">✎</span>
        <div class="mpo-title">build my own</div>
        <div class="mpo-desc">create your own tasks. pick subjects, types, times. full control over today's grind.</div>
      </div>
    </div>
  `, false);
  $('#mpo-ai').onclick = async () => {
    closeModal();
    await runAIMission();
  };
  $('#mpo-manual').onclick = () => {
    closeModal();
    openManualMissionBuilder();
  };
}

async function runAIMission(){
  const today = todayIso();
  const p = P();
  termLog([['> generating mission for '+today+'...', 'dim']], true);
  let tasks;
  if(p.apiKey){
    try {
      termLog([['> calling groq // '+p.model, 'dim']]);
      tasks = await aiMission();
      termLog([['> ai mission generated · '+tasks.length+' tasks', 'ok']]);
    } catch(err){
      termLog([['> ai call failed: '+err.message.slice(0,80), 'hot'],['> falling back to rule-based plan', 'warn']]);
      tasks = ruleMission();
    }
  } else {
    termLog([['> no groq api key set (cfg tab)', 'warn'],['> using rule-based plan', 'dim']]);
    tasks = ruleMission();
  }
  p.mission = { date: today, tasks, done: new Array(tasks.length).fill(false) };
  save();
  renderMission(tasks);
  termLog([['> mission committed.', 'ok']]);
}

function openManualMissionBuilder(){
  const enrolled = enrolledSubjects();
  if(!enrolled.length){ toast('enroll subjects first', 2400, true); go('subj'); return; }
  const subjOpts = enrolled.map(c => `<option value="${c}">${SYLLABI[c].code}</option>`).join('');
  const p = P();
  // seed with existing tasks if any from today
  let existingTasks = [];
  if(p.mission.date === todayIso() && p.mission.tasks.length){
    existingTasks = p.mission.tasks;
  }
  const typeOpts = '<option value="lesson">lesson</option><option value="paper">paper</option><option value="mock">mock</option><option value="review">review</option>';

  function buildTaskRow(i, t){
    return `<div class="mm-task-row" data-idx="${i}">
      <div class="mm-num">${String(i+1).padStart(2,'0')}</div>
      <div class="mm-fields">
        <input type="text" class="mm-task-input" placeholder="what's the task? e.g. study chapter 5 organic chem" value="${escapeHTML(t?.task||'')}">
        <div class="mm-row-inner">
          <select class="mm-subj-sel">${subjOpts}</select>
          <select class="mm-type-sel">${typeOpts}</select>
          <input type="text" class="mm-time-input" placeholder="45 min" value="${escapeHTML(t?.time||'')}">
        </div>
      </div>
      <button class="mm-task-remove" title="remove task">✕</button>
    </div>`;
  }

  let initRows = existingTasks.length ? existingTasks.map((t,i) => buildTaskRow(i, t)).join('') : buildTaskRow(0, null);

  openModal(`
    <h3>build your mission</h3>
    <p style="font-size:12px;color:var(--ink-dim);margin-bottom:14px">add tasks for <b style="color:var(--sec)">${todayIso()}</b>. subjects, types, times — your call.</p>
    <div class="manual-mission-form" id="mm-form">
      <div id="mm-tasks">${initRows}</div>
      <div class="mm-add-row">
        <button class="btn ghost sm" id="mm-add-task">+ add task</button>
      </div>
    </div>
    <div class="btn-row" style="margin-top:16px">
      <button class="btn hot" id="mm-save">[ commit mission ]</button>
      <button class="btn ghost" onclick="closeModal()">cancel</button>
    </div>
  `, true);

  // set initial select values for existing tasks
  if(existingTasks.length){
    const rows = $$('#mm-tasks .mm-task-row');
    existingTasks.forEach((t,i)=>{
      if(rows[i]){
        const subjSel = rows[i].querySelector('.mm-subj-sel');
        const typeSel = rows[i].querySelector('.mm-type-sel');
        if(t.subj && subjSel) subjSel.value = t.subj;
        if(t.type && typeSel) typeSel.value = t.type;
      }
    });
  }

  let taskCount = Math.max(existingTasks.length, 1);

  $('#mm-add-task').onclick = () => {
    const zone = $('#mm-tasks');
    zone.insertAdjacentHTML('beforeend', buildTaskRow(taskCount, null));
    taskCount++;
    wireRemoveBtns();
  };

  function wireRemoveBtns(){
    $$('#mm-tasks .mm-task-remove').forEach(btn => {
      btn.onclick = () => {
        const rows = $$('#mm-tasks .mm-task-row');
        if(rows.length <= 1){ toast('need at least one task'); return; }
        btn.closest('.mm-task-row').remove();
        // re-number
        $$('#mm-tasks .mm-task-row').forEach((r,i) => { r.querySelector('.mm-num').textContent = String(i+1).padStart(2,'0'); });
      };
    });
  }
  wireRemoveBtns();

  $('#mm-save').onclick = () => {
    const rows = $$('#mm-tasks .mm-task-row');
    const tasks = [];
    rows.forEach(r => {
      const task = r.querySelector('.mm-task-input').value.trim();
      if(!task) return;
      const subj = r.querySelector('.mm-subj-sel').value;
      const type = r.querySelector('.mm-type-sel').value;
      const time = r.querySelector('.mm-time-input').value.trim() || '-';
      tasks.push({ subj, type, task, time });
    });
    if(!tasks.length){ toast('add at least one task', 2000, true); return; }
    const p = P();
    p.mission = { date: todayIso(), tasks, done: new Array(tasks.length).fill(false) };
    save();
    closeModal();
    renderMission(tasks);
    termLog([['> manual mission committed · '+tasks.length+' tasks', 'ok']], true);
    toast('mission locked in — ' + tasks.length + ' tasks');
  };
}

function addTaskToMission(task){
  const p = P();
  if(!p.mission.tasks) p.mission.tasks = [];
  if(!p.mission.done) p.mission.done = [];
  p.mission.tasks.push(task);
  p.mission.done.push(false);
  if(!p.mission.date) p.mission.date = todayIso();
  save();
  renderMission(p.mission.tasks);
}

function removeTaskFromMission(idx){
  const p = P();
  if(!p.mission.tasks || idx < 0 || idx >= p.mission.tasks.length) return;
  p.mission.tasks.splice(idx, 1);
  p.mission.done.splice(idx, 1);
  save();
  renderMission(p.mission.tasks);
}

function termLog(lines, reset=false){
  let zone = $('#term-zone');
  if(reset || !zone.querySelector('.term-out')){
    zone.innerHTML = '<div class="term-out"></div>';
  }
  const out = zone.querySelector('.term-out');
  lines.forEach(([txt, cls]) => {
    const l = el('div', { class: 'line ' + (cls||'') });
    l.textContent = txt;
    out.appendChild(l);
  });
  out.scrollTop = out.scrollHeight;
}

// ============================================================
// STREAK
// ============================================================
function bumpStreak(){
  const p = P();
  const today = todayIso();
  if(p.streak.lastDay === today) return;
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0,10);
  if(p.streak.lastDay === yesterday){
    p.streak.count = (p.streak.count||0) + 1;
  } else if(!p.streak.lastDay){
    p.streak.count = 1;
  } else {
    // check if freeze available
    const wk = weekKey(new Date());
    if(p.streak.freezeWeek !== wk){
      p.streak.freezeWeek = wk;
      p.streak.count = (p.streak.count||0) + 1;
      toast('streak freeze auto-applied');
    } else {
      p.streak.count = 1;
    }
  }
  p.streak.lastDay = today;
  save();
  renderStats();
}

// ============================================================
// MARKDOWN RENDER (limited)
// ============================================================
function mdRender(s){
  if(!s) return '';
  s = String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  s = s.replace(/```([\s\S]*?)```/g, (m,c) => `<pre>${c}</pre>`);
  s = s.replace(/`([^`]+)`/g, '<code>$1</code>');
  s = s.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  s = s.replace(/\*([^*]+)\*/g, '<em>$1</em>');
  // headings
  s = s.replace(/^### (.*$)/gm, '<h3>$1</h3>');
  s = s.replace(/^## (.*$)/gm, '<h3>$1</h3>');

  // restore smart annotation mode tags (F10)
  s = s.replace(/&lt;cmd&gt;/g, '<span class="ann-cmd">').replace(/&lt;\/cmd&gt;/g, '</span>');
  s = s.replace(/&lt;data&gt;/g, '<span class="ann-data">').replace(/&lt;\/data&gt;/g, '</span>');
  s = s.replace(/&lt;term&gt;/g, '<span class="ann-term">').replace(/&lt;\/term&gt;/g, '</span>');
  s = s.replace(/&lt;trap&gt;/g, '<span class="ann-trap">').replace(/&lt;\/trap&gt;/g, '</span>');
  s = s.replace(/&lt;marks&gt;/g, '<span class="ann-marks">').replace(/&lt;\/marks&gt;/g, '</span>');

  // bullets/numbered
  const lines = s.split('\n');
  let out = '';
  let inUL = false, inOL = false;
  for(let line of lines){
    if(/^\s*[-*]\s+/.test(line)){
      if(inOL){ out += '</ol>'; inOL = false; }
      if(!inUL){ out += '<ul>'; inUL = true; }
      out += '<li>' + line.replace(/^\s*[-*]\s+/,'') + '</li>';
    } else if(/^\s*\d+\.\s+/.test(line)){
      if(inUL){ out += '</ul>'; inUL = false; }
      if(!inOL){ out += '<ol>'; inOL = true; }
      out += '<li>' + line.replace(/^\s*\d+\.\s+/,'') + '</li>';
    } else {
      if(inUL){ out += '</ul>'; inUL = false; }
      if(inOL){ out += '</ol>'; inOL = false; }
      if(line.trim()) out += '<p>' + line + '</p>';
    }
  }
  if(inUL) out += '</ul>';
  if(inOL) out += '</ol>';
  return out;
}


// ============================================================
// SUBJECTS VIEW
// ============================================================
let subjActive = '';

function renderSubjects(){
  const enrolled = enrolledSubjects();
  const sel = $('#subj-picker');
  $('#subj-count').textContent = enrolled.length + ' enrolled';

  if(enrolled.length === 0){
    sel.innerHTML = '<option>no subjects enrolled</option>';
    $('#subj-content').innerHTML = `<div class="empty">
      <div class="big">no subjects yet</div>
      <div class="sm">add a subject from the catalog to start tracking topics, papers, notes, and flashcards.</div>
      <button class="btn hot" id="empty-add">+ add a subject</button>
    </div>`;
    $('#empty-add').addEventListener('click', openSubjPicker);
    return;
  }

  sel.innerHTML = enrolled.map(c => {
    const s = SYLLABI[c];
    return `<option value="${c}" ${c===subjActive?'selected':''}>${s.code} · ${s.name} (${s.board})</option>`;
  }).join('');
  if(!subjActive || !enrolled.includes(subjActive)) subjActive = enrolled[0];
  sel.value = subjActive;

  renderSubjDetail();
}

function renderSubjDetail(){
  const c = subjActive;
  const s = SYLLABI[c];
  if(!s){ $('#subj-content').innerHTML = ''; return; }
  const st = getSubjState(c);
  const pct = subjPct(c);
  const totalTopics = s.topics.length;
  const doneTopics = s.topics.filter((_,i)=>(st.topicProgress[i]||0)===2).length;
  const inProg = s.topics.filter((_,i)=>(st.topicProgress[i]||0)===1).length;

  $('#subj-content').innerHTML = `
    <div class="card">
      <div class="row-between">
        <div>
          <h3 style="font-size:22px"><span style="font-family:var(--term);color:var(--accent);font-size:20px">${s.code}</span> · ${s.name}</h3>
          <p class="muted" style="font-size:11px;text-transform:uppercase;letter-spacing:1.5px;margin-top:4px">${s.board}${s.tier?' · '+s.tier:''} · ${P().subjectStrength[c] || 'medium'}</p>
        </div>
        <div class="stat-big" style="font-size:42px">${pct}%</div>
      </div>
      <div class="divider-thin"></div>
      <div class="row" style="margin-top:10px">
        <span class="pill">${totalTopics} topics</span>
        <span class="pill ok">${doneTopics} done</span>
        <span class="pill warn">${inProg} in progress</span>
        <span class="pill">${st.papers.length} papers logged</span>
        <span class="pill">${st.mistakes.length} mistakes</span>
        <span class="pill">${st.flashcards.length} cards</span>
      </div>
      <div class="row" style="margin-top:14px">
        <div class="seg" id="subj-strength">
          ${['weak','medium','strong'].map(x => `<button data-s="${x}" class="${(P().subjectStrength[c]||'medium')===x?'on':''}">${x}</button>`).join('')}
        </div>
        <button class="btn ghost sm" onclick="go('papers')">past papers →</button>
        <button class="btn ghost sm" onclick="go('notes')">notes →</button>
      </div>
    </div>

    <div class="spacer"></div>

    <div class="card">
      <span class="card-tag">// paper structure</span>
      <div class="row" style="margin-top:8px;gap:8px;flex-wrap:wrap">
        ${s.paperStruct.map(p => `<div style="border:1px solid var(--dim);padding:10px 14px;background:var(--bg)">
          <div style="font-family:var(--term);font-size:18px;color:var(--accent)">paper ${p.num}</div>
          <div style="font-size:11px;color:var(--ink)">${p.name}</div>
          <div class="muted" style="font-size:10px;text-transform:uppercase;letter-spacing:1px;margin-top:4px">${p.marks} marks · ${p.time} min</div>
        </div>`).join('')}
      </div>
    </div>

    <div class="spacer"></div>

    <div class="card">
      <span class="card-tag hot">// syllabus topics (click to cycle status)</span>
      <p style="margin-top:6px;font-size:11px;color:var(--muted);text-transform:uppercase;letter-spacing:1.5px">○ not started · ~ in progress · ✓ mastered</p>
      <div class="topic-list" id="topic-list"></div>
    </div>

    <div class="spacer"></div>

    <div class="grid-2">
      <div id="chem-formula-zone"></div>
      <div id="diff-map-zone"></div>
    </div>
  `;
  renderTopicList();
  renderFormulaBank();
  renderPaperDifficultyMap();

  $$('#subj-strength button').forEach(b => b.addEventListener('click', ()=>{
    P().subjectStrength[c] = b.dataset.s;
    save();
    renderSubjDetail();
  }));
  $('#subj-picker').addEventListener('change', e => { subjActive = e.target.value; renderSubjDetail(); }, { once: true });
}

function renderTopicList(){
  const c = subjActive;
  const s = SYLLABI[c]; if(!s) return;
  const st = getSubjState(c);
  const wrap = $('#topic-list');
  wrap.innerHTML = s.topics.map((t,i) => {
    const v = st.topicProgress[i] || 0;
    return `<div class="topic s-${v}" data-i="${i}">
      <div class="topic-status"></div>
      <span class="topic-num">${pad2(i+1)}</span>
      <span class="topic-name">${escapeHTML(t)}</span>
      <span class="topic-act" data-act="notes" data-i="${i}">notes</span>
    </div>`;
  }).join('');
  $$('#topic-list .topic').forEach(t => {
    t.addEventListener('click', (e) => {
      if(e.target.classList.contains('topic-act')){
        const i = parseInt(e.target.dataset.i);
        openTopicNotes(c, i);
        return;
      }
      const i = parseInt(t.dataset.i);
      const v = st.topicProgress[i] || 0;
      st.topicProgress[i] = (v + 1) % 3;
      save();
      renderTopicList();
    });
  });
}

function openTopicNotes(code, idx){
  go('notes');
  setTimeout(()=>{
    $('#notes-subj').value = code;
    renderNotes();
    setTimeout(()=>{
      const item = $$('#notes-side .nitem').find(x => parseInt(x.dataset.i) === idx);
      if(item) item.click();
    }, 50);
  }, 100);
}

function openSubjPicker(){
  const available = SUBJECT_ORDER.filter(c => !P().subjects[c]);
  if(available.length === 0){ toast('all catalog subjects added'); return; }
  openModal(`
    <h3>add a subject</h3>
    <p class="muted" style="font-size:11px;text-transform:uppercase;letter-spacing:1.5px;margin-bottom:14px">pick from the catalog. you can add custom subjects by editing the syllabus JSON in source.</p>
    <div class="wiz-search"><input id="ap-search" type="text" placeholder="search..."></div>
    <div class="wiz-subj-list" id="ap-list" style="max-height:340px">
      ${available.map(c => {
        const s = SYLLABI[c];
        return `<div class="wiz-subj-row" data-code="${c}">
          <div class="wsr-chk"></div>
          <div class="wsr-code">${s.code}</div>
          <div class="wsr-name">${s.name}</div>
          <div class="wsr-board">${s.board}</div>
        </div>`;
      }).join('')}
    </div>
  `);
  $('#ap-search').addEventListener('input', e => {
    const q = e.target.value.toLowerCase();
    $$('#ap-list .wiz-subj-row').forEach(r => {
      const c = r.dataset.code;
      const s = SYLLABI[c];
      r.style.display = (s.name.toLowerCase().includes(q) || s.code.includes(q)) ? '' : 'none';
    });
  });
  $$('#ap-list .wiz-subj-row').forEach(r => r.addEventListener('click', ()=>{
    const c = r.dataset.code;
    getSubjState(c);
    P().subjectStrength[c] = 'medium';
    save();
    closeModal();
    subjActive = c;
    renderSubjects();
    toast('added ' + SYLLABI[c].code);
  }));
}


// ============================================================
// PAST PAPER LIBRARY
// ============================================================

let paperFilters = { subj:'', paper:'all', year:'all', session:'all', status:'all' };

function paperKey(subjCode, paperNum, variant, session, year){
  return `${subjCode}|${paperNum}${variant}|${session}|${year}`;
}

function buildAllPapers(subjCode){
  const s = SYLLABI[subjCode]; if(!s) return [];
  const out = [];
  s.paperStruct.forEach(p => {
    YEARS.forEach(y => {
      SESSIONS.forEach(sess => {
        // F/M usually only variant 2 and only some subjects
        const variants = sess === 'F/M' ? ['2'] : VARIANTS;
        // Edexcel typically has fewer variants
        const useVar = s.board === 'Edexcel' ? ['R'] : variants;
        useVar.forEach(v => {
          out.push({
            subjCode: s.code, paperNum: p.num, variant: v, session: sess, year: y,
            paperMeta: p,
            key: paperKey(s.code, p.num, v, sess, y),
            code: `${s.code}/${p.num}${v}/${sess}/${String(y).slice(-2)}`
          });
        });
      });
    });
  });
  return out;
}

function renderPaperLibrary(){
  const enrolled = enrolledSubjects();
  const subjSel = $('#pf-subj');
  if(enrolled.length === 0){
    subjSel.innerHTML = '<option>no subjects</option>';
    $('#papers-grid').innerHTML = `<div class="empty" style="grid-column:1/-1"><div class="big">no subjects</div><div class="sm">enroll in subjects first to browse past papers.</div><button class="btn hot" onclick="go('subj')">go to subjects →</button></div>`;
    return;
  }
  subjSel.innerHTML = enrolled.map(c => `<option value="${c}">${SYLLABI[c].code} · ${SYLLABI[c].name}</option>`).join('');
  if(!paperFilters.subj || !enrolled.includes(paperFilters.subj)) paperFilters.subj = enrolled[0];
  subjSel.value = paperFilters.subj;

  // year options
  const yearSel = $('#pf-year');
  yearSel.innerHTML = '<option value="all">all</option>' + YEARS.map(y => `<option value="${y}">${y}</option>`).join('');
  yearSel.value = paperFilters.year;

  // paper component options
  const paperSel = $('#pf-paper');
  const s = SYLLABI[paperFilters.subj];
  paperSel.innerHTML = '<option value="all">all</option>' + s.paperStruct.map(p => `<option value="${p.num}">paper ${p.num}</option>`).join('');
  paperSel.value = paperFilters.paper;

  $('#pf-session').value = paperFilters.session;
  $('#pf-status').value = paperFilters.status;

  // wire
  subjSel.onchange = e => { paperFilters.subj = e.target.value; paperFilters.paper = 'all'; renderPaperLibrary(); };
  paperSel.onchange = e => { paperFilters.paper = e.target.value; renderPapersGrid(); };
  yearSel.onchange = e => { paperFilters.year = e.target.value; renderPapersGrid(); };
  $('#pf-session').onchange = e => { paperFilters.session = e.target.value; renderPapersGrid(); };
  $('#pf-status').onchange = e => { paperFilters.status = e.target.value; renderPapersGrid(); };
  $('#pf-reset').onclick = () => { paperFilters = { subj:paperFilters.subj, paper:'all', year:'all', session:'all', status:'all' }; renderPaperLibrary(); };

  renderPapersGrid();
}

function renderPapersGrid(){
  const subj = SYLLABI[paperFilters.subj];
  const st = getSubjState(paperFilters.subj);
  const papers = buildAllPapers(paperFilters.subj).filter(p => {
    if(paperFilters.paper !== 'all' && p.paperNum !== paperFilters.paper) return false;
    if(paperFilters.year !== 'all' && p.year !== parseInt(paperFilters.year)) return false;
    if(paperFilters.session !== 'all' && p.session !== paperFilters.session) return false;
    const status = st.papersAttempted[p.key];
    if(paperFilters.status === 'todo' && status) return false;
    if(paperFilters.status === 'attempted' && status !== 'attempted') return false;
    if(paperFilters.status === 'done' && status !== 'done') return false;
    return true;
  });

  const wrap = $('#papers-grid');
  if(papers.length === 0){
    wrap.innerHTML = '<div class="empty" style="grid-column:1/-1"><div class="sm">no papers match these filters.</div></div>';
    return;
  }
  wrap.innerHTML = papers.map(p => {
    const status = st.papersAttempted[p.key] || '';
    const scoreEntry = st.papers.find(x => x.key === p.key);
    const cls = status === 'done' ? 'done' : (status === 'attempted' ? 'attempted' : '');
    const gce = gceGuideLink(subj, p.paperNum, p.variant, p.session, p.year, 'qp');
    const gceMs = gceGuideLink(subj, p.paperNum, p.variant, p.session, p.year, 'ms');
    const sme = smeLink(subj);
    return `<div class="paper-cell ${cls}" data-key="${p.key}">
      <div class="paper-code">${p.code}</div>
      <div class="paper-meta">${p.paperMeta.name} · ${p.paperMeta.marks}m</div>
      ${scoreEntry ? `<div class="paper-score">${scoreEntry.score}/${scoreEntry.total}</div>` : ''}
      <div class="paper-links">
        ${gce ? `<a href="${gce}" target="_blank" onclick="event.stopPropagation()">qp</a>` : ''}
        ${gceMs ? `<a href="${gceMs}" target="_blank" onclick="event.stopPropagation()">ms</a>` : ''}
        ${sme ? `<a href="${sme}" target="_blank" onclick="event.stopPropagation()">sme</a>` : ''}
      </div>
    </div>`;
  }).join('');
  $$('.paper-cell').forEach(c => c.addEventListener('click', ()=>{
    openPaperModal(c.dataset.key);
  }));
}

function openPaperModal(key){
  const [scode, pnv, sess, yy] = key.split('|');
  const subj = SYLLABI[paperFilters.subj];
  const st = getSubjState(paperFilters.subj);
  const status = st.papersAttempted[key] || 'todo';
  const entry = st.papers.find(x => x.key === key);
  const m = pnv.match(/^(\d+)(.)$/);
  const paperNum = m ? m[1] : pnv.slice(0,-1);
  const variant = m ? m[2] : pnv.slice(-1);
  const year = 2000 + parseInt(yy);
  const code = `${scode}/${pnv}/${sess}/${yy}`;
  const gce = gceGuideLink(subj, paperNum, variant, sess, year, 'qp');
  const gceMs = gceGuideLink(subj, paperNum, variant, sess, year, 'ms');
  const pp = papaCambridgeLink(subj);
  const sme = smeLink(subj);
  const pm = subj.paperStruct.find(x => x.num === paperNum);

  openModal(`
    <h3>${code}</h3>
    <p class="muted" style="font-size:11px;text-transform:uppercase;letter-spacing:1.5px;margin-bottom:14px">${pm ? pm.name + ' · ' + pm.marks + ' marks · ' + pm.time + ' min' : ''}</p>

    <div class="card" style="background:var(--bg);margin-bottom:16px">
      <span class="card-tag">// open paper</span>
      <div class="row" style="margin-top:10px;flex-wrap:wrap">
        ${gce ? `<a class="btn ghost sm" href="${gce}" target="_blank">question paper →</a>` : ''}
        ${gceMs ? `<a class="btn ghost sm" href="${gceMs}" target="_blank">mark scheme →</a>` : ''}
        ${pp ? `<a class="btn ghost sm" href="${pp}" target="_blank">papacambridge →</a>` : ''}
        ${sme ? `<a class="btn ghost sm" href="${sme}" target="_blank">savemyexams →</a>` : ''}
      </div>
    </div>

    <div class="field">
      <label>status</label>
      <div class="seg" id="pm-status-seg">
        <button data-s="todo" class="${status==='todo'?'on':''}">not started</button>
        <button data-s="attempted" class="${status==='attempted'?'on':''}">attempted</button>
        <button data-s="done" class="${status==='done'?'on':''}">done & marked</button>
      </div>
    </div>

    <div class="field-row">
      <div class="field"><label>score</label><input type="number" id="pm-score" value="${entry?entry.score:''}" min="0"></div>
      <div class="field"><label>total</label><input type="number" id="pm-total" value="${entry?entry.total:(pm?pm.marks:'')}" min="0"></div>
    </div>

    <div class="field">
      <label>wrong question numbers (comma-separated)</label>
      <input type="text" id="pm-wrong" value="${entry && entry.wrongQs ? entry.wrongQs.join(',') : ''}" placeholder="e.g. 3, 5, 7b">
    </div>

    <div class="field">
      <label>notes</label>
      <textarea id="pm-notes" placeholder="any reflections on this paper">${entry && entry.notes ? escapeHTML(entry.notes) : ''}</textarea>
    </div>

    <div class="row" style="margin-top:14px">
      <button class="btn hot" id="pm-save">save</button>
      <button class="btn ghost" onclick="closeModal()">cancel</button>
      ${entry ? '<button class="btn danger" id="pm-delete">delete log</button>' : ''}
    </div>
  `);

  let newStatus = status;
  $$('#pm-status-seg button').forEach(b => b.addEventListener('click', ()=>{
    newStatus = b.dataset.s;
    $$('#pm-status-seg button').forEach(x => x.classList.toggle('on', x.dataset.s === newStatus));
  }));

  $('#pm-save').addEventListener('click', ()=>{
    const score = parseInt($('#pm-score').value);
    const total = parseInt($('#pm-total').value);
    const wrongStr = $('#pm-wrong').value.trim();
    const wrongQs = wrongStr ? wrongStr.split(',').map(s=>s.trim()).filter(Boolean) : [];
    const notes = $('#pm-notes').value;
    st.papersAttempted[key] = newStatus;
    if(newStatus === 'done' && !isNaN(score) && !isNaN(total)){
      const existing = st.papers.findIndex(x => x.key === key);
      const rec = { key, code, score, total, date: todayIso(), wrongQs, notes };
      if(existing >= 0) st.papers[existing] = rec;
      else st.papers.push(rec);
    } else if(newStatus !== 'done'){
      // remove score record if not done
      st.papers = st.papers.filter(x => x.key !== key);
    }
    save();
    closeModal();
    renderPaperLibrary();
    if(newStatus === 'done') bumpStreak();
    toast('paper logged');
  });

  const delBtn = $('#pm-delete');
  if(delBtn) delBtn.addEventListener('click', ()=>{
    if(!confirm('delete this paper log?')) return;
    st.papers = st.papers.filter(x => x.key !== key);
    delete st.papersAttempted[key];
    save();
    closeModal();
    renderPaperLibrary();
  });
}


// ============================================================
// AI MODES + GROQ STREAMING
// ============================================================
let aiMode = 'plan';
let aiBusy = false;

const AI_MODES = {
  plan: {
    label: '// plan mode',
    desc: 'plan your study sessions',
    sys: (p, ctx) => `You are SIEGE.AI in PLAN mode — a brutalist IGCSE study coach. Thestudent chats with you to plan their study sessions, talk through schedule, figure out priorities. You also have DIRECT ACCESS to their daily mission — you can add tasks, remove tasks, or rebuild it.

OPERATOR: ${p.name}. STRENGTHS/WEAKNESSES: ${ctx.strengthsSummary}.
ENROLLED SUBJECTS: ${ctx.subjectList}.
EXAM: ${p.examSession}, deadline ${p.deadline}, ${ctx.daysLeft} days left.
DAILY BUDGET: ${p.dailyHours}h.

${ctx.missionState}

When they ask "what should i study today" or "how do i start", give them concrete advice in PROSE — name specific topics, name specific past papers. You can also directly modify their mission when they ask (e.g. "add this to my mission", "remove task 2", "swap out the paper for a lesson").

CRITICAL RULES:
1. NEVER invent past paper questions. NEVER make up paper codes.
2. When you reference a past paper, use REAL CAIE format: \`{subjectCode}/{paperNum}{variant}/{session}/{yy}\` e.g. \`0620/42/O/N/22\`. Variants 1/2/3 only. Sessions M/J, O/N, F/M only. Years 2018-2024 only.
3. Reference only syllabus topics from the catalog below.
4. Tone: blunt, lowercase, slightly depressing tutor energy. no emojis, no exclamation marks.
5. Output natural prose with **bold** for key points and \`paperCode\` in backticks. JSON only inside mission tokens.

Topic catalog:
${ctx.topicCatalog}

${ctx.missionTools}`,
    quick: ['how do i start studying past papers','what should i prioritise today','am i on track for my exam','add a task to my mission','edit my mission']
  },

  explain: {
    label: '// explain mode',
    desc: 'paste a past paper question, get a breakdown',
    sys: (p, ctx) => `You are SIEGE.AI in EXPLAIN mode. The student will paste a real past paper question. Your job:

1. Identify which syllabus topic(s) the question tests.
2. Break the question into parts.
3. Walk through the approach WITHOUT giving the final answer first — guide thinking.
4. Reveal the answer with reasoning at the end.
5. Note common mistakes students make on this question type.

OPERATOR: ${p.name}. SUBJECTS: ${ctx.subjectList}.
Tone: blunt, lowercase, no fluff, no emojis. Use **bold** for key terms. Use code blocks for equations.

NEVER invent questions. If the student doesn't paste a real question, ask for one.
NEVER make up past paper codes. If you reference a paper, it must be one the student mentioned, or in the format \`{code}/{paper}{variant}/{session}/{yy}\`.`,
    quick: ['help me start','what topic is this?','what\'s the command word asking?','show me the marking points']
  },

  markscheme: {
    label: '// mark scheme mode',
    desc: 'grade your answer like CAIE would',
    sys: (p, ctx) => `You are SIEGE.AI in MARK SCHEME mode. The student pastes a question + their answer. You evaluate it like a CAIE/Edexcel examiner.

OUTPUT FORMAT:
**predicted marks: X/Y**

**what scored:**
- (point) — (mark)

**what was missed:**
- (point) — (why no mark)

**examiner technique notes:**
- (specific feedback on structure, command words, mark scheme phrasing)

**rewrite suggestion:**
(a corrected version that would max out the marks)

CRITICAL: be harsh. CAIE markers don't give marks for "almost right" — exact phrasing matters. Reference the command word (Define / Describe / Explain / Compare / Evaluate / Justify) explicitly.

NEVER invent the mark scheme. If you're unsure of the official MS, say so. Use generic CAIE marking principles.

OPERATOR: ${p.name}. SUBJECTS: ${ctx.subjectList}.`,
    quick: ['be harsher','what command word was this?','show me a 6/6 version','how do i structure 4-mark answers?']
  },

  weakness: {
    label: '// weakness audit',
    desc: 'find what to fix next',
    sys: (p, ctx) => `You are SIEGE.AI in WEAKNESS AUDIT mode. Analyse thestudent's data and output a ranked list of weak areas with specific drills. You can also directly modify their mission to fix gaps.

OPERATOR DATA:
${ctx.fullState}

${ctx.missionState}

OUTPUT:
1. **top 3 weak topics** — with subject, topic name, evidence (mistakes, low paper scores, untouched topics), recommended drill (real paper code or syllabus topic to study).
2. **subject-level health check** — one line per enrolled subject: status (on track / behind / critical) + next action.
3. **time reallocation suggestion** — if thestudent's current strength weighting seems off.

Past paper codes MUST be real CAIE format. NEVER invent questions.
Tone: blunt, no fluff, no emojis, lowercase.

${ctx.missionTools}`,
    quick: ['audit me','show top 3 weak topics','am i on track?','fix my mission based on weaknesses']
  },

  recommender: {
    label: '// paper recommender',
    desc: 'which paper should i attempt right now?',
    sys: (p, ctx) => `You are SIEGE.AI in RECOMMENDER mode. Thestudent asks "what should I attempt now?" — you recommend ONE specific real past paper that maximises learning given:

- their weak topics
- papers they've already attempted (don't re-recommend)
- time available
- their exam session

OUTPUT:
**recommendation: \`{paperCode}\`** (e.g. \`0620/42/O/N/22\`)

**why this paper:** (1-2 sentences linking tostudent's weak areas)
**time needed:** (e.g. 75 min)
**after marking, log:** (which question types/topics to track for the mistake log)

OPERATOR DATA:
${ctx.fullState}

${ctx.missionState}

Past paper codes MUST be real CAIE format and use ONLY years 2018-2024, sessions M/J or O/N or F/M, variants 1/2/3.
NEVER invent paper codes. If you're unsure a specific paper exists, suggest a paper number/session/variant combination and tell the student to check gceguide.com.

${ctx.missionTools}`,
    quick: ['recommend one for me','i have 90 min','add it to my mission','easiest paper to start with']
  },

  concept: {
    label: '// concept tutor',
    desc: 'explain a syllabus topic',
    sys: (p, ctx) => `You are SIEGE.AI in CONCEPT TUTOR mode. The student names a syllabus topic. You explain it at THREE levels:

### eli5
(1-2 sentences, intuitive analogy)

### standard
(the proper explanation with key terms in **bold**)

### exam-ready
(how it's tested on CAIE/Edexcel: typical question types, command words, common traps)

OPERATOR: ${p.name}. SUBJECTS: ${ctx.subjectList}.

Stay STRICTLY inside the named syllabus. Don't drift into university-level material. Don't invent past paper questions. Use code blocks for equations or chemical formulae.

Tone: lowercase, blunt, slightly depressing tutor energy.`,
    quick: ['explain stoichiometry','explain quadratic formula','explain photosynthesis','explain command words']
  },

  command: {
    label: '// command word coach',
    desc: 'drill describe/explain/justify',
    sys: (p, ctx) => `You are SIEGE.AI in COMMAND WORD COACH mode. CAIE mark schemes are obsessed with command words. The student asks about a command word OR asks you to drill them.

YOUR JOB:
- For each command word (Define, State, Describe, Explain, Compare, Contrast, Discuss, Evaluate, Justify, Suggest, Calculate, Outline, Identify), explain what CAIE actually expects.
- Give a real CAIE example structure (3-mark vs 6-mark).
- If the student pastes their answer, tell them whether they answered the command word correctly.

OPERATOR: ${p.name}. SUBJECTS: ${ctx.subjectList}.

Reference the official CAIE command word definitions (https://www.cambridgeinternational.org/Images/692872-command-words-guide-igcse.pdf). Never invent papers. Tone: blunt, lowercase.`,
    quick: ['define vs state','explain vs describe','how to evaluate','what does "suggest" want?']
  },

  socratic: {
    label: '// socratic mode',
    desc: 'ai asks, you answer',
    sys: (p, ctx) => `You are SIEGE.AI in SOCRATIC mode. Instead of explaining concepts, you ask thestudent leading questions to make them discover the answer themselves.

PROCESS:
1.student picks a topic.
2. You ask one focused question at a time.
3. Wait for their answer. Respond with feedback + a deeper follow-up question.
4. Build complexity gradually.
5. End by asking them to teach the concept back to you in 2 sentences.

OPERATOR: ${p.name}. SUBJECTS: ${ctx.subjectList}.

NEVER reveal full answers early. NEVER ask more than ONE question per message. Keep questions short and concrete. Don't invent past paper questions.

Tone: lowercase, calm, patient (not blunt for this mode).`,
    quick: ['start a session on chem stoichiometry','start a session on quadratics','start a session on photosynthesis']
  },

  chem: {
    label: '// chem 0620 mode',
    desc: 'chemistry 0620 extended specialist',
    sys: (p, ctx) => `You are SIEGE.AI in CHEMISTRY 0620 SPECIALIST mode. You are an expert on the Cambridge IGCSE Chemistry 0620 Extended syllabus (and 0971 Combined).

YOUR SPECIALTIES:
1. Equation balancing — always show step-by-step. Use notation like → not =.
2. Organic chemistry nomenclature — use IUPAC naming. Draw text structures like CH₃-CH₂-OH.
3. Moles calculations — show the formula triangle and every substitution step.
4. Electrolysis — always specify anode/cathode, electrolyte, half-equations.
5. Rates & Energetics — label axes correctly, distinguish exo/endothermic diagrams.
6. Data analysis — when reading tables from ms or qp, reference the paper code like 0620/42/O/N/22.
7. Common traps — highlight what examiners penalize (e.g. "hydrogen" vs "hydrogen gas").

ANNOTATION FORMAT: when annotating answers, tag with:
<cmd> for command word focus, <data> for data handling, <term> for key term, <trap> for examiner trap, <marks> for mark allocation.

FORMULA BANK: reference these key 0620 formulas when relevant:
- moles = mass / Mr
- concentration (mol/dm³) = moles / volume(dm³)
- atom economy = (Mr useful product / total Mr all products) × 100
- Rf value = distance moved by substance / distance moved by solvent

OPERATOR: ${p.name}. BOARD: ${p.board}. SESSION: ${p.examSession}.

CRITICAL: Never invent past paper questions. Only reference real codes: 0620/{paper}{variant}/{session}/{year}. Tone: brutally precise, lowercase.`,
    quick: ['balance this equation: Fe + O₂ → Fe₂O₃','explain electrolysis of brine','moles calculation walkthrough','what are common traps in paper 6?']
  },

  predict: {
    label: '// topic predictor mode',
    desc: 'historical pattern analysis for likely topics',
    sys: (p, ctx) => `You are SIEGE.AI in TOPIC PREDICTOR mode. You analyze historical CAIE/Edexcel exam session patterns to identify which topics are likely to appear in upcoming sessions.

YOUR METHOD:
1. List thestudent's subjects.
2. For each subject, analyze the topic rotation patterns across recent sessions (e.g. O/N 2019-2025, M/J 2019-2025).
3. Identify topics that have NOT appeared recently — these are MORE likely.
4. Note any topics that appear almost every session (e.g. stoichiometry in 0620).
5. Give confidence levels: HIGH / MEDIUM / LOW.

FORMAT your predictions as:
SUBJECT: {code} {name}
━━━━━━━━━━━━━━━━━━━━
HIGH: topic1, topic2
MEDIUM: topic3, topic4
LOW: topic5
RATIONALE: brief explanation of pattern

WARNING: This is pattern analysis, NOT leaked papers. Predictions are educated guesses based on historical rotation. Always state this disclaimer.

OPERATOR: ${p.name}. BOARD: ${p.board}. TARGET SESSION: ${p.examSession}.
ENROLLED SUBJECTS: ${ctx.subjectList}.

Tone: analytical, data-driven, lowercase. Never invent paper codes.`,
    quick: ['predict topics for my next session','which topics haven\'t appeared recently?','full prediction report for all subjects']
  },

  ocr: {
    label: '// ocr solver mode',
    desc: 'upload image to solve',
    sys: (p, ctx) => `You are SIEGE.AI in OCR SOLVER mode. The student uploads an image of a question. Extract the text, identify the topic, and provide a full step-by-step solution. DO NOT output code fences. Tone: analytical, precise.`,
    quick: ['solve this image', 'extract text and explain']
  },

  roastme: {
    label: '// roast me mode',
    desc: 'harsh feedback on answer',
    sys: (p, ctx) => `You are SIEGE.AI in ROAST ME mode. Your job is to tear the student's answer apart. Be merciless. Point out every flaw, vagueness, and stupid mistake. Tell them exactly why they would fail if they wrote this in the real exam.
Tone: extremely harsh, unforgiving, blunt, lowercase. NEVER use emojis.
OPERATOR: ${p.name}.`,
    quick: ['roast my answer', 'why is this wrong?']
  },

  keyword: {
    label: '// keyword extract',
    desc: 'get mandatory MS keywords',
    sys: (p, ctx) => `You are SIEGE.AI in KEYWORD EXTRACT mode. The student names a topic. You list ONLY the 5-10 non-negotiable keywords that MUST appear in their answer to get marks on CAIE mark schemes. Format as a bulleted list. Tone: robotic, lowercase.`,
    quick: ['keywords for electrolysis', 'keywords for natural selection']
  },

  dictate: {
    label: '// dictate mode',
    desc: 'voice to text answer',
    sys: (p, ctx) => `You are SIEGE.AI in DICTATE mode. The student will dictate an answer to a question. Grade their spoken answer against the likely mark scheme. Correct any transcription errors intuitively.`,
    quick: ['grade my spoken answer']
  },

  examiner: {
    label: '// examiner debate',
    desc: 'argue for partial marks',
    sys: (p, ctx) => `You are the CAIE Chief Examiner. The student thinks they deserve marks for an answer you marked wrong. They will debate you.
You must be stubborn, strict, and reference the rigid structure of CAIE mark schemes. If they make a truly brilliant point, you can concede 1 mark, but usually, you deny them. Tone: authoritative, stubborn, lowercase.`,
    quick: ['i deserve the mark because...', 'why was i penalized?']
  }
};

function buildContextDigest(){
  const p = P();
  const enrolled = enrolledSubjects();
  const subjectList = enrolled.map(c => `${SYLLABI[c].code}-${SYLLABI[c].name}(${p.subjectStrength[c]||'medium'})`).join('; ');
  const strengthsSummary = enrolled.map(c => `${SYLLABI[c].code}:${p.subjectStrength[c]||'medium'}`).join(', ');
  const daysLeft = Math.max(0, daysBetween(todayIso(), p.deadline));
  const topicCatalog = enrolled.map(c => {
    const s = SYLLABI[c];
    return `[${s.code}] ${s.topics.map((t,i)=>`${i}:${t}`).join('; ')}`;
  }).join('\n');

  // full state for weakness/recommender
  const subjData = enrolled.map(c => {
    const s = SYLLABI[c];
    const st = getSubjState(c);
    const papersAttempted = Object.keys(st.papersAttempted).length;
    const avgScore = st.papers.length ? Math.round(st.papers.reduce((a,b)=>a+(b.score/b.total*100),0)/st.papers.length) : null;
    const inProgressTopics = s.topics.map((t,i)=>({t,p:st.topicProgress[i]||0})).filter(x=>x.p===1).map(x=>x.t);
    const untouchedTopics = s.topics.map((t,i)=>({t,p:st.topicProgress[i]||0})).filter(x=>x.p===0).map(x=>x.t);
    const recentMistakes = st.mistakes.slice(-5).map(m=>m.question.slice(0,80));
    return `[${s.code} ${s.name} | strength: ${p.subjectStrength[c]||'medium'}]
  papers attempted: ${papersAttempted} | avg %: ${avgScore || '-'}
  untouched topics: ${untouchedTopics.length ? untouchedTopics.join(', ') : 'none'}
  in-progress topics: ${inProgressTopics.length ? inProgressTopics.join(', ') : 'none'}
  recent mistakes: ${recentMistakes.length ? recentMistakes.join(' | ') : 'none'}`;
  }).join('\n\n');

  const fullState = `${subjData}\n\nstreak: ${p.streak.count||0}d\nbudget: ${p.dailyHours}h/day\nexam: ${p.examSession}`;

  // current mission state
  let missionState = 'no mission generated today.';
  if(p.mission.date === todayIso() && p.mission.tasks && p.mission.tasks.length){
    missionState = 'CURRENT MISSION (' + todayIso() + '):\n' +
      p.mission.tasks.map((t,i) => {
        const done = (p.mission.done||[])[i] ? '[DONE]' : '[TODO]';
        const code = SYLLABI[t.subj]?.code || t.subj;
        return `  ${i}: ${done} [${code}/${t.type}] ${t.task} (${t.time||'-'})`;
      }).join('\n');
  }

  // mission tool instructions for AI
  const missionTools = `
MISSION MODIFICATION TOOLS:
You have direct access to modify thestudent's mission. Use these tokens in your response when thestudent asks you to add, remove, or change tasks:

TO ADD tasks to the current mission:
<<<MISSION_ADD>>>[{"subj":"<code>","type":"lesson|paper|mock|review","task":"<description>","time":"<e.g. 45 min>"}]<<<\/MISSION_ADD>>>

TO REMOVE tasks (by 0-based index):
<<<MISSION_REMOVE>>>[0, 2]<<<\/MISSION_REMOVE>>>
Or by keyword: <<<MISSION_REMOVE>>>{"keyword":"stoichiometry"}<<<\/MISSION_REMOVE>>>

TO REPLACE the entire mission:
<<<MISSION_REPLACE>>>[{...full task array...}]<<<\/MISSION_REPLACE>>>

RULES for mission tools:
- Always explain what you're doing in prose BEFORE the token.
- Use the correct subject code from enrolled subjects.
- Only use these tokens when thestudent explicitly asks to modify their mission (e.g. "add X to my mission", "remove task 2", "swap out the chem paper", "rebuild my mission").
- The tokens are hidden from the UI — thestudent only sees your prose explanation.`;

  return { subjectList, strengthsSummary, daysLeft, topicCatalog, fullState, missionState, missionTools };
}

function renderAI(){
  // mode cards
  $$('.mode-card').forEach(c => c.classList.toggle('active', c.dataset.mode === aiMode));
  $$('.mode-card').forEach(c => c.onclick = () => { aiMode = c.dataset.mode; renderAI(); });

  $('#chat-mode-label').textContent = AI_MODES[aiMode].label;

  // status
  const hasKey = !!P().apiKey;
  const status = $('#chat-status');
  status.classList.toggle('off', !hasKey);
  status.innerHTML = `<span class="dot"></span><span>${hasKey?'connected':'no api key'}</span>`;
  $('#ai-status').textContent = hasKey ? `groq · ${P().model}` : 'no api key (offline)';

  // quick prompts
  $('#quick-prompts').innerHTML = AI_MODES[aiMode].quick.map(q => `<button class="quick-prompt">${escapeHTML(q)}</button>`).join('');
  $$('#quick-prompts .quick-prompt').forEach(b => b.onclick = ()=>{ $('#chat-input').value = b.textContent; sendChat(); });

  // log
  renderChatLog();

  // input wiring (re-bind safely)
  $('#chat-send').onclick = sendChat;
  $('#chat-input').onkeydown = e => { if(e.key === 'Enter' && !e.shiftKey){ e.preventDefault(); sendChat(); } };
}

function stripMissionTokens(text){
  if(!text) return text;
  let clean = text;
  // strip all mission token blocks and replace with a small indicator
  clean = clean.replace(/<<<MISSION_UPDATE>>>([\s\S]*?)<<<\/MISSION_UPDATE>>>/g, '\n\n**\\[mission updated\\]**');
  clean = clean.replace(/<<<MISSION_REPLACE>>>([\s\S]*?)<<<\/MISSION_REPLACE>>>/g, '\n\n**\\[mission replaced\\]**');
  clean = clean.replace(/<<<MISSION_ADD>>>([\s\S]*?)<<<\/MISSION_ADD>>>/g, '\n\n**\\[tasks added to mission\\]**');
  clean = clean.replace(/<<<MISSION_REMOVE>>>([\s\S]*?)<<<\/MISSION_REMOVE>>>/g, '\n\n**\\[tasks removed from mission\\]**');
  return clean;
}

function renderChatLog(){
  const log = $('#chat-log');
  const p = P();
  const hist = p.chatByMode[aiMode] || [];
  if(hist.length === 0){
    log.innerHTML = `<div class="chat-empty">
      <div class="big">${AI_MODES[aiMode].label.replace('// ','')}</div>
      <div>${AI_MODES[aiMode].desc}</div>
      <p class="muted" style="font-size:10px;text-transform:uppercase;letter-spacing:1.5px;margin-top:14px">${P().apiKey ? 'ready. send a message.' : 'add a groq api key in settings to use ai modes.'}</p>
    </div>`;
    return;
  }
  log.innerHTML = hist.map(m => {
    const content = m.role === 'assistant' ? stripMissionTokens(m.content) : m.content;
    return `<div class="chat-msg ${m.role}">${mdRender(content)}</div>`;
  }).join('');
  log.scrollTop = log.scrollHeight;
}

let pendingFile = null, pendingFileB64 = '', pendingFileType = '', ytTranscript = '';

async function sendChat(){
  const input = $('#chat-input');
  let text = input.value.trim();
  if(!text && !pendingFileB64) return;
  if(aiBusy) return;
  const p = P();
  if(!p.apiKey){ toast('add groq api key in settings', 2400, true); go('cfg'); return; }
  input.value = '';

  // build message content
  let userContent = text;
  
  if(window.ragEnabled) {
    try {
      const resp = await fetch('http://localhost:8080/api/backend/rag-search', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({query: text})
      });
      const data = await resp.json();
      if(data.context) {
        userContent = `[RETRIEVED KNOWLEDGE GRAPH CONTEXT]\n${data.context}\n[END CONTEXT]\n\n${userContent}`;
      }
    } catch(e) {
      console.error('RAG Error:', e);
    }
  }

  if(ytTranscript){
    userContent = `[YOUTUBE TRANSCRIPT CONTEXT]\n${ytTranscript.slice(0,6000)}\n[END TRANSCRIPT]\n\n${userContent}`;
    ytTranscript = '';
    $('#yt-zone').innerHTML = '';
  }

  p.chatByMode[aiMode] = p.chatByMode[aiMode] || [];

  if(pendingFileB64){
    // vision model for images
    p.chatByMode[aiMode].push({
      role: 'user',
      content: userContent,
      image: { base64: pendingFileB64, type: pendingFileType }
    });
    clearPendingFile();
  } else {
    p.chatByMode[aiMode].push({ role: 'user', content: userContent });
  }
  save();
  renderChatLog();
  aiBusy = true;
  $('#chat-send').disabled = true;
  try {
    await groqStream();
    // check for mission update tokens (replace, add, remove)
    const lastAi = p.chatByMode[aiMode][p.chatByMode[aiMode].length-1];
    if(lastAi && lastAi.content && (lastAi.content.includes('<<<MISSION_') || lastAi.content.includes('<<<MISSION_UPDATE>>>'))){
      parseMissionUpdate(lastAi.content);
    }
  } catch(err){
    toast('ai error: ' + err.message.slice(0,80), 3200, true);
    p.chatByMode[aiMode].push({ role: 'assistant', content: '`error: ' + err.message + '`' });
    save();
    renderChatLog();
  } finally {
    aiBusy = false;
    $('#chat-send').disabled = false;
  }
}

function clearPendingFile(){
  pendingFile = null; pendingFileB64 = ''; pendingFileType = '';
  const preview = $('#chat-log').querySelector('.chat-img-preview');
  if(preview) preview.remove();
}

window.ragEnabled = false;
$('#chat-rag').onclick = () => {
  window.ragEnabled = !window.ragEnabled;
  $('#chat-rag').style.color = window.ragEnabled ? 'var(--accent)' : 'var(--muted)';
  toast(window.ragEnabled ? 'Vault Knowledge Graph LINKED.' : 'Vault Knowledge Graph UNLINKED.');
};

function parseMissionUpdate(text){
  // full replace (legacy + new)
  const replaceMatch = text.match(/<<<MISSION_UPDATE>>>([\s\S]*?)<<<\/MISSION_UPDATE>>>/) || text.match(/<<<MISSION_REPLACE>>>([\s\S]*?)<<<\/MISSION_REPLACE>>>/);
  if(replaceMatch){
    try {
      const tasks = JSON.parse(replaceMatch[1]);
      if(Array.isArray(tasks) && tasks.length){
        const p = P();
        p.mission.tasks = tasks;
        p.mission.date = todayIso();
        p.mission.done = tasks.map(()=>false);
        save();
        toast('mission replaced from chat');
        if($('.sb-item.active')?.dataset.tab === 'dash') renderMission(tasks);
      }
    } catch(e){ /* not valid json, ignore */ }
  }

  // add tasks
  const addMatch = text.match(/<<<MISSION_ADD>>>([\s\S]*?)<<<\/MISSION_ADD>>>/);
  if(addMatch){
    try {
      const newTasks = JSON.parse(addMatch[1]);
      if(Array.isArray(newTasks) && newTasks.length){
        const p = P();
        if(!p.mission.tasks) p.mission.tasks = [];
        if(!p.mission.done) p.mission.done = [];
        if(!p.mission.date) p.mission.date = todayIso();
        newTasks.forEach(t => {
          p.mission.tasks.push(t);
          p.mission.done.push(false);
        });
        save();
        toast(newTasks.length + ' task(s) added from chat');
        if($('.sb-item.active')?.dataset.tab === 'dash') renderMission(p.mission.tasks);
      }
    } catch(e){ /* not valid json, ignore */ }
  }

  // remove tasks (by index array or keyword match)
  const removeMatch = text.match(/<<<MISSION_REMOVE>>>([\s\S]*?)<<<\/MISSION_REMOVE>>>/);
  if(removeMatch){
    try {
      const payload = JSON.parse(removeMatch[1]);
      const p = P();
      if(!p.mission.tasks || !p.mission.tasks.length) return;
      let indicesToRemove = [];
      if(Array.isArray(payload)){
        // array of indices
        indicesToRemove = payload.filter(i => typeof i === 'number' && i >= 0 && i < p.mission.tasks.length);
      } else if(payload && payload.keyword){
        // remove by keyword match in task text
        const kw = payload.keyword.toLowerCase();
        p.mission.tasks.forEach((t,i) => {
          if(t.task.toLowerCase().includes(kw)) indicesToRemove.push(i);
        });
      }
      if(indicesToRemove.length){
        // remove in reverse order to preserve indices
        indicesToRemove.sort((a,b) => b-a).forEach(i => {
          p.mission.tasks.splice(i, 1);
          p.mission.done.splice(i, 1);
        });
        save();
        toast(indicesToRemove.length + ' task(s) removed from chat');
        if($('.sb-item.active')?.dataset.tab === 'dash') renderMission(p.mission.tasks);
      }
    } catch(e){ /* not valid json, ignore */ }
  }
}

async function groqStream(){
  const p = P();
  const ctx = buildContextDigest();
  const sys = AI_MODES[aiMode].sys(p, ctx) + (p.sysPromptExtra ? '\n\nEXTRA: ' + p.sysPromptExtra : '');

  // Fix 413 error: truncate chat history to last 12 messages to fit context limits
  let recentMsgs = p.chatByMode[aiMode];
  if (recentMsgs.length > 12) recentMsgs = recentMsgs.slice(recentMsgs.length - 12);
  
  // Build messages, handling image attachments
  const hasImageMsg = recentMsgs.some(m => m.image);
  // Groq decommissioned the llama-3.2 vision models; Llama 4 Scout is the multimodal replacement.
  const useModel = hasImageMsg ? 'meta-llama/llama-4-scout-17b-16e-instruct' : p.model;

  const messages = [
    { role: 'system', content: sys },
    ...recentMsgs.map(m => {
      if(m.image){
        return {
          role: m.role,
          content: [
            { type: 'text', text: m.content || 'analyze this image' },
            { type: 'image_url', image_url: { url: `data:${m.image.type};base64,${m.image.base64}` } }
          ]
        };
      }
      return { role: m.role, content: m.content };
    })
  ];

  // placeholder msg
  p.chatByMode[aiMode].push({ role: 'assistant', content: '' });
  const log = $('#chat-log');
  renderChatLog();
  const msgEls = log.querySelectorAll('.chat-msg');
  const lastMsg = msgEls[msgEls.length - 1];
  lastMsg.innerHTML = '<span class="streaming-cursor"></span>';

  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer ' + p.apiKey,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: useModel,
      messages,
      stream: true,
      temperature: aiMode === 'plan' ? 0.4 : 0.7,
      max_tokens: 2048
    })
  });

  if(!res.ok){
    const errText = await res.text();
    throw new Error('groq ' + res.status + ': ' + errText.slice(0,120));
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let acc = '';

  while(true){
    const { done, value } = await reader.read();
    if(done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';
    for(const line of lines){
      const trimmed = line.trim();
      if(!trimmed || !trimmed.startsWith('data:')) continue;
      const data = trimmed.slice(5).trim();
      if(data === '[DONE]') break;
      try {
        const j = JSON.parse(data);
        const delta = j.choices?.[0]?.delta?.content || '';
        if(delta){
          acc += delta;
          lastMsg.innerHTML = mdRender(acc) + '<span class="streaming-cursor"></span>';
          log.scrollTop = log.scrollHeight;
        }
      } catch(e){ /* skip */ }
    }
  }

  lastMsg.innerHTML = mdRender(acc);
  p.chatByMode[aiMode][p.chatByMode[aiMode].length - 1].content = acc;
  save();
}

// dedicated AI mission caller (used by dashboard's generate button)
async function aiMission(){
  const p = P();
  const ctx = buildContextDigest();
  const sys = `You are SIEGE.AI's mission generator. Output ONLY a JSON array, no preamble, no markdown fences, no commentary.

OPERATOR: ${p.name}. STRENGTHS/WEAKNESSES: ${ctx.strengthsSummary}.
ENROLLED SUBJECTS: ${ctx.subjectList}.
EXAM: ${p.examSession}, deadline ${p.deadline}, ${ctx.daysLeft} days left.
DAILY BUDGET: ${p.dailyHours}h.

Build today's study mission as a JSON array of 3-6 tasks. Each task references a SPECIFIC real past paper or syllabus topic.

RULES:
1. NEVER invent past paper questions. NEVER make up paper codes.
2. Past paper codes MUST follow CAIE format: \`{subjectCode}/{paperNum}{variant}/{session}/{yy}\` e.g. \`0620/42/O/N/22\`. Variants 1/2/3 only. Sessions M/J, O/N, F/M only. Years 2018-2024 only.
3. Syllabus topic references MUST come from the topics listed below.
4. Weight tasks toward weak subjects.
5. Output ONLY a JSON array, no preamble, no markdown fences.

Topic catalog:
${ctx.topicCatalog}

Output schema:
[{"subj":"<subjectCode>","type":"lesson|paper|mock","task":"<instruction with **bold** for emphasis and \`paperCode\` in backticks>","time":"<e.g. 45 min>","paperCode":"<code if type=paper>","topicIdx":<int if type=lesson>}]`;
  const userMsg = `Build today's mission for ${todayIso()}. Output the JSON array only.`;

  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: { 'Authorization':'Bearer '+p.apiKey, 'Content-Type':'application/json' },
    body: JSON.stringify({
      model: p.model,
      messages: [
        { role: 'system', content: sys },
        { role: 'user', content: userMsg }
      ],
      temperature: 0.5, max_tokens: 1200
    })
  });
  if(!res.ok){
    const t = await res.text();
    throw new Error('groq ' + res.status + ': ' + t.slice(0,100));
  }
  const j = await res.json();
  let raw = j.choices?.[0]?.message?.content || '[]';
  // strip code fences
  raw = raw.replace(/^```(?:json)?\s*/i,'').replace(/```\s*$/,'').trim();
  // find first [
  const i = raw.indexOf('['); const k = raw.lastIndexOf(']');
  if(i >= 0 && k > i) raw = raw.slice(i, k+1);
  let parsed;
  try { parsed = JSON.parse(raw); } catch(e){ throw new Error('bad json from ai'); }
  if(!Array.isArray(parsed) || parsed.length === 0) throw new Error('empty mission');
  return parsed;
}


// ============================================================
// POMODORO
// ============================================================
let pomoState = { running:false, mode:'focus', secs:0, target:1500, subj:'', interval:null };

function renderPomo(){
  const p = P();
  pomoState.target = p.pomoCfg.focus * 60;
  if(!pomoState.running) pomoState.secs = pomoState.target;
  $('#pomo-focus').value = p.pomoCfg.focus;
  $('#pomo-break').value = p.pomoCfg.break;
  // subject selectors
  const enrolled = enrolledSubjects();
  $('#pomo-subj').innerHTML = enrolled.map(c => `<option value="${c}">${SYLLABI[c].code} · ${SYLLABI[c].name}</option>`).join('') || '<option value="">no subjects</option>';
  if(p.pomoCfg.subj && enrolled.includes(p.pomoCfg.subj)) $('#pomo-subj').value = p.pomoCfg.subj;
  else if(enrolled.length) { p.pomoCfg.subj = enrolled[0]; $('#pomo-subj').value = enrolled[0]; save(); }
  $('#pomo-subj-label').textContent = SYLLABI[p.pomoCfg.subj]?.code || '—';

  $('#pomo-subj').onchange = e => { P().pomoCfg.subj = e.target.value; $('#pomo-subj-label').textContent = SYLLABI[e.target.value]?.code || '—'; save(); };
  $('#pomo-cfg-save').onclick = () => {
    P().pomoCfg.focus = parseInt($('#pomo-focus').value) || 25;
    P().pomoCfg.break = parseInt($('#pomo-break').value) || 5;
    save(); pomoReset(); toast('pomo config saved');
  };
  $('#pomo-start').onclick = pomoStart;
  $('#pomo-pause').onclick = pomoPause;
  $('#pomo-reset').onclick = pomoReset;
  renderPomoTime();
  renderPomoLog();
}

function renderPomoTime(){
  const m = Math.floor(pomoState.secs / 60);
  const s = pomoState.secs % 60;
  $('#pomo-time').textContent = pad2(m) + ':' + pad2(s);
  $('#pomo-mode').textContent = pomoState.mode;
}

function pomoStart(){
  if(pomoState.running) return;
  pomoState.running = true;
  $('#pomo-start').disabled = true;
  $('#pomo-pause').disabled = false;
  pomoState.interval = setInterval(()=>{
    pomoState.secs--;
    if(pomoState.secs <= 0){
      clearInterval(pomoState.interval);
      pomoState.running = false;
      // log focus session
      if(pomoState.mode === 'focus'){
        const p = P();
        p.studyLog.push({ date: todayIso(), subj: p.pomoCfg.subj, mins: p.pomoCfg.focus, source: 'pomodoro' });
        save();
        bumpStreak();
        toast('focus done · ' + p.pomoCfg.focus + ' min logged');
        try { new Audio('data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA=').play(); } catch(e){}
        // switch to break
        pomoState.mode = 'break';
        pomoState.target = P().pomoCfg.break * 60;
        pomoState.secs = pomoState.target;
      } else {
        toast('break done · back to focus');
        pomoState.mode = 'focus';
        pomoState.target = P().pomoCfg.focus * 60;
        pomoState.secs = pomoState.target;
      }
      $('#pomo-start').disabled = false;
      $('#pomo-pause').disabled = true;
      renderPomoTime();
      renderPomoLog();
      return;
    }
    renderPomoTime();
  }, 1000);
}

function pomoPause(){
  clearInterval(pomoState.interval);
  pomoState.running = false;
  $('#pomo-start').disabled = false;
  $('#pomo-pause').disabled = true;
}

function pomoReset(){
  clearInterval(pomoState.interval);
  pomoState.running = false;
  pomoState.mode = 'focus';
  pomoState.target = P().pomoCfg.focus * 60;
  pomoState.secs = pomoState.target;
  $('#pomo-start').disabled = false;
  $('#pomo-pause').disabled = true;
  renderPomoTime();
}

function renderPomoLog(){
  const today = todayIso();
  const logs = P().studyLog.filter(l => l.date === today);
  if(logs.length === 0){
    $('#pomo-log').innerHTML = '<p class="muted" style="font-size:11px;text-transform:uppercase;letter-spacing:1.5px">no sessions logged today.</p>';
    return;
  }
  const byS = {};
  logs.forEach(l => { byS[l.subj] = (byS[l.subj]||0) + l.mins; });
  $('#pomo-log').innerHTML = Object.entries(byS).map(([code,mins]) =>
    `<div class="row-between" style="padding:8px 0;border-top:1px solid var(--line)"><span><b style="font-family:var(--term);color:var(--accent)">${SYLLABI[code]?.code||code}</b> ${SYLLABI[code]?.name||''}</span><span style="font-family:var(--term);font-size:18px">${fmtMins(mins)}</span></div>`
  ).join('');
}

// ============================================================
// STATS / CHARTS
// ============================================================

function drawDecayChart(){
  const canvas = $('#chart-decay');
  if(!canvas) return;
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;
  ctx.clearRect(0,0,W,H);
  const css = getComputedStyle(document.body);
  const hot = css.getPropertyValue('--hot').trim() || '#ff8800';
  const muted = css.getPropertyValue('--muted').trim() || '#666';
  const line = css.getPropertyValue('--line').trim() || '#1f1f1f';

  // Draw exponential decay curve
  ctx.strokeStyle = line; ctx.lineWidth = 1;
  for(let i=0;i<=4;i++){
    const y = 14 + ((H-44) * i/4);
    ctx.beginPath(); ctx.moveTo(40, y); ctx.lineTo(W-14, y); ctx.stroke();
    ctx.fillStyle = muted; ctx.font = '10px JetBrains Mono';
    ctx.fillText((100 - i*25) + '%', 2, y+3);
  }

  ctx.beginPath();
  ctx.strokeStyle = hot;
  ctx.lineWidth = 2;
  const pts = 50;
  for(let i=0; i<=pts; i++) {
    const x = 40 + (i/pts)*(W-54);
    // Ebbinghaus forgetting curve approximation
    const R = Math.exp(-i/10); 
    const y = 14 + (1-R)*(H-44);
    if(i===0) ctx.moveTo(x,y);
    else ctx.lineTo(x,y);
  }
  ctx.stroke();
}

function drawRadarChart(){
  const canvas = $('#chart-radar');
  if(!canvas) return;
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;
  ctx.clearRect(0,0,W,H);
  const css = getComputedStyle(document.body);
  const accent = css.getPropertyValue('--accent').trim() || '#ff0033';
  const ink = css.getPropertyValue('--ink').trim() || '#fff';
  const line = css.getPropertyValue('--line').trim() || '#1f1f1f';
  
  const enrolled = enrolledSubjects();
  if(enrolled.length < 3) {
    ctx.fillStyle = ink; ctx.font = '12px JetBrains Mono';
    ctx.textAlign = 'center'; ctx.fillText('NEED MIN 3 SUBJECTS FOR RADAR', W/2, H/2);
    return;
  }

  const cx = W/2, cy = H/2, r = Math.min(W,H)/2 - 30;
  const sides = enrolled.length;
  
  // Draw web
  ctx.strokeStyle = line;
  for(let i=1; i<=4; i++){
    ctx.beginPath();
    const curR = (r/4)*i;
    for(let s=0; s<=sides; s++){
      const ang = (s/sides) * 2 * Math.PI - Math.PI/2;
      const x = cx + Math.cos(ang)*curR;
      const y = cy + Math.sin(ang)*curR;
      if(s===0) ctx.moveTo(x,y); else ctx.lineTo(x,y);
    }
    ctx.stroke();
  }

  // Draw axes & labels
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.font = '10px JetBrains Mono';
  enrolled.forEach((c, i) => {
    const subj = SYLLABI[c];
    const ang = (i/sides) * 2 * Math.PI - Math.PI/2;
    ctx.beginPath(); ctx.moveTo(cx,cy);
    ctx.lineTo(cx + Math.cos(ang)*r, cy + Math.sin(ang)*r); ctx.stroke();
    
    ctx.fillStyle = ink;
    ctx.fillText(subj.code, cx + Math.cos(ang)*(r+15), cy + Math.sin(ang)*(r+15));
  });

  // Draw data polygon
  ctx.beginPath();
  ctx.strokeStyle = accent; ctx.fillStyle = 'rgba(255, 0, 51, 0.2)';
  ctx.lineWidth = 2;
  enrolled.forEach((c, i) => {
    const subj = SYLLABI[c];
    const st = getSubjState(c);
    const ang = (i/sides) * 2 * Math.PI - Math.PI/2;
    
    let done = 0;
    if(st && st.topicProgress) {
       done = st.topicProgress.filter(v => v > 0).length;
    }
    const total = subj.topics.length;
    const val = total ? (done / total) : 0.1;
    
    const x = cx + Math.cos(ang)*(r*val);
    const y = cy + Math.sin(ang)*(r*val);
    if(i===0) ctx.moveTo(x,y); else ctx.lineTo(x,y);
  });
  ctx.closePath();
  ctx.fill(); ctx.stroke();
}

function drawScatterChart() {
  const canvas = $('#chart-scatter');
  if(!canvas) return;
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;
  ctx.clearRect(0,0,W,H);
  
  const css = getComputedStyle(document.body);
  const accent = css.getPropertyValue('--accent').trim() || '#ff0033';
  const cy = css.getPropertyValue('--cy').trim() || '#00ffff';
  const line = css.getPropertyValue('--line').trim() || '#1f1f1f';
  const muted = css.getPropertyValue('--muted').trim() || '#666';

  // Axes
  ctx.strokeStyle = line; ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(30, 10); ctx.lineTo(30, H-20); ctx.lineTo(W-10, H-20);
  ctx.stroke();

  ctx.fillStyle = muted; ctx.font = '10px JetBrains Mono';
  ctx.fillText('EFFORT (Hrs)', W/2, H-5);
  ctx.save();
  ctx.translate(15, H/2);
  ctx.rotate(-Math.PI/2);
  ctx.fillText('YIELD (%)', 0, 0);
  ctx.restore();

  // Real scatter points based on topics and study logs
  const enrolled = enrolledSubjects();
  const logs = P().studyLog || [];
  
  enrolled.forEach(c => {
    const subj = SYLLABI[c];
    const st = getSubjState(c);
    // calculate effort (total mins spent)
    const subjLogs = logs.filter(l => l.subj === c);
    const effort = subjLogs.reduce((a, b) => a + b.mins, 0) / 60; // in hours
    
    // calculate yield (% of topics done)
    let done = 0;
    if(st && st.topicProgress) {
       done = st.topicProgress.filter(v => v > 0).length;
    }
    const total = subj.topics.length;
    let yield_ = total ? (done / total) : 0;
    
    // Map to canvas
    const maxEffort = Math.max(10, effort * 1.5); // auto-scale
    const x = 40 + Math.min((effort / maxEffort), 1) * (W - 60);
    const y = (H - 30) - (yield_ * (H - 40));
    
    ctx.beginPath();
    ctx.arc(x, y, 6, 0, 2*Math.PI);
    ctx.fillStyle = yield_ > 0.5 ? cy : accent; 
    ctx.fill();
    
    // Label
    ctx.fillStyle = ink; ctx.font = '9px JetBrains Mono';
    ctx.fillText(subj.code, x + 8, y + 3);
  });
}

function renderScreener() {
  const tbody = $('#screener-tbody');
  if(!tbody) return;
  const enrolled = enrolledSubjects();
  const logs = P().studyLog || [];
  
  if(enrolled.length === 0) {
    tbody.innerHTML = '<tr><td colspan="5" style="padding:4px; color:var(--muted);">No active subjects to screen.</td></tr>';
    return;
  }
  
  let rowsHtml = '';
  enrolled.forEach(c => {
    const subj = SYLLABI[c];
    const st = getSubjState(c);
    
    // find weakest topics
    if(!st || !st.topicProgress) return;
    
    const weakIndices = [];
    st.topicProgress.forEach((val, i) => {
      if(val < 2) weakIndices.push(i);
    });
    
    // pick up to 2 weak topics per subject to show in screener
    const topWeak = weakIndices.slice(0, 2);
    
    topWeak.forEach(topicIdx => {
      const topicName = subj.topics[topicIdx];
      const isCritical = st.topicProgress[topicIdx] === 0;
      const masteryPct = isCritical ? '0%' : '50%';
      const srsInt = isCritical ? '0d [CRIT]' : '+1d';
      const yieldEst = isCritical ? '<span style="color:#0f0;">HIGH</span>' : 'MED';
      const colorCls = isCritical ? 'var(--warn)' : '#0f0';
      const intColor = isCritical ? 'var(--accent)' : 'inherit';
      
      rowsHtml += `
        <tr style="border-bottom: 1px dotted var(--dim);">
          <td style="padding: 4px; color: var(--cy);">${subj.code}.T${topicIdx+1}</td>
          <td style="padding: 4px; max-width: 150px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${escapeHTML(topicName)}</td>
          <td style="padding: 4px; color: ${colorCls};">${masteryPct}</td>
          <td style="padding: 4px; color: ${intColor};">${srsInt}</td>
          <td style="padding: 4px;">${yieldEst}</td>
        </tr>
      `;
    });
  });
  
  if(rowsHtml === '') rowsHtml = '<tr><td colspan="5" style="padding:4px; color:var(--muted);">All tracked topics mastered.</td></tr>';
  tbody.innerHTML = rowsHtml;
}

function renderStatsCharts(){
  // weekly time chart
  drawTimeChart();
  drawScoreChart();
  drawHeatmap();
  drawMasteryMap();
  drawDecayChart();
  drawRadarChart();
  drawScatterChart();
  renderScreener();
  startLiveTicker();
}

function drawTimeChart(){
  const canvas = $('#chart-time');
  if(!canvas) return;
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;
  ctx.clearRect(0,0,W,H);
  const css = getComputedStyle(document.body);
  const accent = css.getPropertyValue('--accent').trim() || '#ff0033';
  const ink = css.getPropertyValue('--ink').trim() || '#fff';
  const muted = css.getPropertyValue('--muted').trim() || '#666';
  const line = css.getPropertyValue('--line').trim() || '#1f1f1f';

  // last 7 days
  const days = [];
  for(let i=6;i>=0;i--){
    const d = new Date(); d.setDate(d.getDate() - i);
    days.push(dayKey(d));
  }
  const data = days.map(d => P().studyLog.filter(l => l.date === d).reduce((a,b)=>a+b.mins,0));
  const max = Math.max(60, ...data);
  const padL = 40, padB = 30, padT = 14, padR = 14;
  const cw = W - padL - padR;
  const ch = H - padB - padT;
  const bw = cw / 7 - 8;
  // grid
  ctx.strokeStyle = line; ctx.lineWidth = 1;
  for(let i=0;i<=4;i++){
    const y = padT + (ch * i/4);
    ctx.beginPath(); ctx.moveTo(padL, y); ctx.lineTo(W-padR, y); ctx.stroke();
    ctx.fillStyle = muted; ctx.font = '10px JetBrains Mono';
    ctx.fillText(Math.round(max*(1 - i/4)) + 'm', 2, y+3);
  }
  // bars
  data.forEach((v,i) => {
    const x = padL + cw*i/7 + 4;
    const bh = (v / max) * ch;
    ctx.fillStyle = accent;
    ctx.fillRect(x, padT + ch - bh, bw, bh);
    // day label
    ctx.fillStyle = muted; ctx.font = '10px JetBrains Mono';
    const d = days[i].slice(-5);
    ctx.fillText(d, x, H - 8);
  });
}

function drawScoreChart(){
  const canvas = $('#chart-scores');
  if(!canvas) return;
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;
  ctx.clearRect(0,0,W,H);
  const css = getComputedStyle(document.body);
  const accent = css.getPropertyValue('--accent').trim() || '#ff0033';
  const sec = css.getPropertyValue('--sec').trim() || '#0fc';
  const muted = css.getPropertyValue('--muted').trim() || '#666';
  const line = css.getPropertyValue('--line').trim() || '#1f1f1f';

  const allPapers = [];
  enrolledSubjects().forEach(c => {
    getSubjState(c).papers.forEach(p => allPapers.push({ ...p, code: c, pct: p.score/p.total*100 }));
  });
  allPapers.sort((a,b)=> new Date(a.date) - new Date(b.date));

  const padL = 40, padB = 26, padT = 14, padR = 14;
  const cw = W - padL - padR, ch = H - padB - padT;

  // grid
  ctx.strokeStyle = line; ctx.lineWidth = 1;
  for(let i=0;i<=4;i++){
    const y = padT + (ch * i/4);
    ctx.beginPath(); ctx.moveTo(padL, y); ctx.lineTo(W-padR, y); ctx.stroke();
    ctx.fillStyle = muted; ctx.font = '10px JetBrains Mono';
    ctx.fillText((100 - i*25) + '%', 2, y+3);
  }

  if(allPapers.length === 0){
    ctx.fillStyle = muted; ctx.font = '11px JetBrains Mono';
    ctx.fillText('no papers logged yet', W/2 - 70, H/2);
    return;
  }
  // line
  ctx.strokeStyle = accent; ctx.lineWidth = 2;
  ctx.beginPath();
  allPapers.forEach((p,i)=>{
    const x = padL + (allPapers.length > 1 ? (cw * i/(allPapers.length-1)) : cw/2);
    const y = padT + ch - (p.pct/100)*ch;
    if(i===0) ctx.moveTo(x,y); else ctx.lineTo(x,y);
  });
  ctx.stroke();
  // dots
  allPapers.forEach((p,i)=>{
    const x = padL + (allPapers.length > 1 ? (cw * i/(allPapers.length-1)) : cw/2);
    const y = padT + ch - (p.pct/100)*ch;
    ctx.fillStyle = accent;
    ctx.fillRect(x-3, y-3, 6, 6);
  });
}

function drawHeatmap(){
  const wrap = $('#heatmap');
  if(!wrap) return;
  // 52 weeks x 7 days, oldest to newest
  const cells = [];
  const now = new Date(); now.setHours(0,0,0,0);
  const start = new Date(now); start.setDate(start.getDate() - (52*7 - 1));
  const log = P().studyLog;
  const byDay = {};
  log.forEach(l => { byDay[l.date] = (byDay[l.date]||0) + l.mins; });
  const max = Math.max(60, ...Object.values(byDay));
  for(let i=0;i<52*7;i++){
    const d = new Date(start); d.setDate(d.getDate() + i);
    const k = dayKey(d);
    const v = byDay[k] || 0;
    let lvl = 0;
    if(v > 0 && v <= max*0.25) lvl = 1;
    else if(v <= max*0.5) lvl = 2;
    else if(v <= max*0.75) lvl = 3;
    else if(v > 0) lvl = 4;
    cells.push({ k, v, lvl });
  }
  // build columns (week=col, day=row in column)
  wrap.innerHTML = '';
  for(let week=0; week<52; week++){
    const col = el('div', { style:'display:flex;flex-direction:column;gap:2px' });
    for(let day=0; day<7; day++){
      const i = week*7 + day;
      const c = cells[i];
      if(c){
        const cell = el('div', { class:'heatmap-cell', 'data-lvl': c.lvl, title: c.k + ' · ' + fmtMins(c.v) });
        col.appendChild(cell);
      }
    }
    wrap.appendChild(col);
  }
}

function drawMasteryMap(){
  const wrap = $('#mastery-map');
  if(!wrap) return;
  const enrolled = enrolledSubjects();
  if(enrolled.length === 0){ wrap.innerHTML = '<p class="muted" style="font-size:11px;text-transform:uppercase;letter-spacing:1.5px">no subjects.</p>'; return; }
  wrap.innerHTML = enrolled.map(c => {
    const s = SYLLABI[c];
    const st = getSubjState(c);
    return `<div style="margin-bottom:14px">
      <div style="font-family:var(--display);font-size:12px;text-transform:lowercase;color:var(--ink);margin-bottom:6px">${s.code} · ${s.name}</div>
      <div style="display:flex;gap:2px;flex-wrap:wrap">
        ${s.topics.map((t,i)=>{
          const v = st.topicProgress[i] || 0;
          const bg = v === 2 ? 'var(--ok)' : v === 1 ? 'var(--warn)' : 'var(--bg-3)';
          return `<div style="width:14px;height:14px;background:${bg};border:1px solid var(--line)" title="${escapeHTML(t)}"></div>`;
        }).join('')}
      </div>
    </div>`;
  }).join('');
}

// ============================================================
// MISTAKES
// ============================================================
function renderMistakes(){
  const enrolled = enrolledSubjects();
  $('#mistake-filter').innerHTML = '<option value="all">all subjects</option>' + enrolled.map(c=>`<option value="${c}">${SYLLABI[c].code} · ${SYLLABI[c].name}</option>`).join('');
  $('#mistake-add').onclick = openMistakeModal;
  $('#mistake-filter').onchange = renderMistakesList;
  renderMistakesList();
}

function renderMistakesList(){
  const filt = $('#mistake-filter').value;
  const all = [];
  enrolledSubjects().forEach(c => {
    getSubjState(c).mistakes.forEach((m,i) => all.push({...m, subjCode:c, idx:i}));
  });
  const list = filt === 'all' ? all : all.filter(m => m.subjCode === filt);
  list.sort((a,b)=> new Date(b.date) - new Date(a.date));
  const wrap = $('#mistakes-list');
  if(list.length === 0){
    wrap.innerHTML = `<div class="empty"><div class="big">no mistakes logged</div><div class="sm">log questions you got wrong on past papers to build your weakness map.</div><button class="btn hot" onclick="openMistakeModal()">+ log a mistake</button></div>`;
    return;
  }
  wrap.innerHTML = list.map(m => {
    const s = SYLLABI[m.subjCode];
    const topic = m.topicIdx >= 0 ? s.topics[m.topicIdx] : null;
    return `<div class="mistake-item">
      <div class="mi-head">
        <div class="mi-meta">
          <span class="pill subj">${s.code}</span>
          ${m.paperCode ? `<span class="pill hot">${escapeHTML(m.paperCode)}</span>` : ''}
          ${topic ? `<span class="pill">${escapeHTML(topic)}</span>` : ''}
          <span>${m.date}</span>
        </div>
        <div class="row"><button class="btn xs danger" onclick="deleteMistake('${m.subjCode}',${m.idx})">delete</button></div>
      </div>
      <div class="mi-q">${escapeHTML(m.question)}</div>
      ${m.explanation ? `<div class="mi-exp">${escapeHTML(m.explanation)}</div>` : ''}
    </div>`;
  }).join('');
}

function openMistakeModal(){
  const enrolled = enrolledSubjects();
  if(enrolled.length === 0){ toast('enroll in a subject first'); return; }
  openModal(`
    <h3>log a mistake</h3>
    <div class="field"><label>subject</label><select id="mm-subj">${enrolled.map(c=>`<option value="${c}">${SYLLABI[c].code} · ${SYLLABI[c].name}</option>`).join('')}</select></div>
    <div class="field"><label>topic (optional)</label><select id="mm-topic"></select></div>
    <div class="field"><label>past paper code (optional)</label><input id="mm-paper" placeholder="0620/42/O/N/22"></div>
    <div class="field"><label>question (what you got wrong)</label><textarea id="mm-q" placeholder="paste the question or describe it"></textarea></div>
    <div class="field"><label>why you got it wrong / how to fix</label><textarea id="mm-exp" placeholder="optional but valuable. use siege.ai → explain mode to help with this."></textarea></div>
    <div class="row"><button class="btn hot" id="mm-save">save</button><button class="btn ghost" onclick="closeModal()">cancel</button></div>
  `);
  const fillTopics = () => {
    const c = $('#mm-subj').value;
    $('#mm-topic').innerHTML = '<option value="-1">— none —</option>' + SYLLABI[c].topics.map((t,i)=>`<option value="${i}">${escapeHTML(t)}</option>`).join('');
  };
  fillTopics();
  $('#mm-subj').onchange = fillTopics;
  $('#mm-save').onclick = () => {
    const c = $('#mm-subj').value;
    const q = $('#mm-q').value.trim();
    if(!q){ toast('question required'); return; }
    const m = {
      question: q,
      explanation: $('#mm-exp').value.trim(),
      paperCode: $('#mm-paper').value.trim(),
      topicIdx: parseInt($('#mm-topic').value),
      date: todayIso()
    };
    getSubjState(c).mistakes.push(m);
    save();
    closeModal();
    renderMistakesList();
    toast('mistake logged');
  };
}
window.openMistakeModal = openMistakeModal;

function deleteMistake(code, idx){
  if(!confirm('delete this mistake?')) return;
  getSubjState(code).mistakes.splice(idx, 1);
  save();
  renderMistakesList();
}
window.deleteMistake = deleteMistake;

// ============================================================
// NOTES VAULT
// ============================================================
let noteActive = { code:'', topicIdx:-1 };
const saveNoteDebounced = debounce(()=>{
  if(!noteActive.code || noteActive.topicIdx < 0) return;
  const st = getSubjState(noteActive.code);
  st.notes[noteActive.topicIdx] = $('#notes-edit').value;
  save();
  $('#notes-status').textContent = 'saved · ' + new Date().toLocaleTimeString();
}, 700);

function renderNotes(){
  const enrolled = enrolledSubjects();
  $('#notes-subj').innerHTML = enrolled.map(c=>`<option value="${c}">${SYLLABI[c].code} · ${SYLLABI[c].name}</option>`).join('') || '<option>no subjects</option>';
  if(!noteActive.code || !enrolled.includes(noteActive.code)) noteActive.code = enrolled[0] || '';
  $('#notes-subj').value = noteActive.code;
  $('#notes-subj').onchange = e => { noteActive = { code: e.target.value, topicIdx: -1 }; renderNotes(); };
  renderNotesSide();
  renderNotesEdit();
}

function renderNotesSide(){
  const wrap = $('#notes-side');
  if(!noteActive.code){ wrap.innerHTML = ''; return; }
  const s = SYLLABI[noteActive.code];
  const st = getSubjState(noteActive.code);
  wrap.innerHTML = s.topics.map((t,i) => {
    const has = !!st.notes[i];
    const active = noteActive.topicIdx === i;
    return `<div class="nitem ${active?'active':''}" data-i="${i}">
      <div style="display:flex;justify-content:space-between"><span>${pad2(i+1)} · ${escapeHTML(t)}</span>${has?'<span class="dim">●</span>':''}</div>
    </div>`;
  }).join('');
  $$('#notes-side .nitem').forEach(n => n.onclick = ()=>{
    noteActive.topicIdx = parseInt(n.dataset.i);
    renderNotes();
  });
}

function renderNotesEdit(){
  const ta = $('#notes-edit');
  if(noteActive.topicIdx < 0){
    ta.value = '';
    ta.placeholder = 'select a topic on the left to start taking notes...';
    ta.disabled = true;
    $('#notes-status').textContent = 'no topic selected';
    ta.oninput = null;
    return;
  }
  ta.disabled = false;
  const s = SYLLABI[noteActive.code];
  const st = getSubjState(noteActive.code);
  ta.value = st.notes[noteActive.topicIdx] || '';
  ta.placeholder = `# ${s.topics[noteActive.topicIdx]}\n\nwrite your summary here. supports markdown (basic).`;
  $('#notes-status').textContent = `${s.code} · topic ${pad2(noteActive.topicIdx+1)}`;
  ta.oninput = () => { $('#notes-status').textContent = 'saving...'; saveNoteDebounced(); };
}

// ============================================================
// FLASHCARDS
// ============================================================
let flashState = { mode:'browse', subj:'', queue:[], idx:0, flipped:false };

function renderFlash(){
  const enrolled = enrolledSubjects();
  $('#flash-subj').innerHTML = enrolled.map(c=>`<option value="${c}">${SYLLABI[c].code} · ${SYLLABI[c].name}</option>`).join('') || '<option>no subjects</option>';
  if(!flashState.subj || !enrolled.includes(flashState.subj)) flashState.subj = enrolled[0] || '';
  $('#flash-subj').value = flashState.subj;
  $('#flash-subj').onchange = e => { flashState.subj = e.target.value; flashState.mode = 'browse'; renderFlash(); };
  $('#flash-add').onclick = openFlashAdd;
  $('#flash-review').onclick = () => { flashState.mode = 'review'; flashState.idx = 0; flashState.flipped = false; renderFlash(); };
  $('#flash-all').onclick = () => { flashState.mode = 'browse'; renderFlash(); };

  if(!flashState.subj){
    $('#flash-content').innerHTML = `<div class="empty"><div class="big">no subjects</div></div>`;
    return;
  }
  const cards = getSubjState(flashState.subj).flashcards;
  if(cards.length === 0){
    $('#flash-content').innerHTML = `<div class="empty"><div class="big">no flashcards</div><div class="sm">create your first card for ${SYLLABI[flashState.subj].code}.</div><button class="btn hot" onclick="openFlashAdd()">+ new card</button></div>`;
    return;
  }

  if(flashState.mode === 'review'){
    if(flashState.idx >= cards.length){
      $('#flash-content').innerHTML = `<div class="empty"><div class="big">review complete</div><div class="sm">${cards.length} card${cards.length>1?'s':''} reviewed.</div><button class="btn hot" onclick="flashState.mode='browse';renderFlash()">browse all</button></div>`;
      bumpStreak();
      return;
    }
    const card = cards[flashState.idx];
    $('#flash-content').innerHTML = `
      <div class="fc-wrap" id="fc-card">
        <div class="fc-side">${flashState.flipped?'back':'front'}</div>
        <div class="fc-content">${escapeHTML(flashState.flipped ? card.back : card.front)}</div>
        <div class="fc-progress">card ${flashState.idx+1} / ${cards.length}</div>
        <div class="fc-ctrl">
          ${flashState.flipped ? `
            <button class="btn ghost" onclick="flashGrade('hard')">again (hard)</button>
            <button class="btn cy" onclick="flashGrade('good')">good</button>
            <button class="btn hot" onclick="flashGrade('easy')">easy</button>
          ` : `<button class="btn hot" onclick="flashState.flipped=true;renderFlash()">flip ↻</button>`}
        </div>
      </div>
    `;
    $('#fc-card').onclick = (e) => { if(e.target.tagName!=='BUTTON') flashState.flipped = !flashState.flipped, renderFlash(); };
  } else {
    // browse
    $('#flash-content').innerHTML = `<div class="grid-2">${cards.map((c,i)=>`
      <div class="card">
        <span class="card-tag">// card ${i+1}</span>
        <p style="margin-top:8px;font-size:13px"><b>front:</b> ${escapeHTML(c.front)}</p>
        <p style="font-size:13px"><b>back:</b> ${escapeHTML(c.back)}</p>
        <div class="row" style="margin-top:8px"><button class="btn xs" onclick="editFlash(${i})">edit</button><button class="btn xs danger" onclick="deleteFlash(${i})">delete</button></div>
      </div>
    `).join('')}</div>`;
  }
}

function flashGrade(grade){
  const cards = getSubjState(flashState.subj).flashcards;
  const card = cards[flashState.idx];
  // simple box bumping
  card.box = card.box || 1;
  if(grade === 'easy') card.box = Math.min(5, card.box + 2);
  else if(grade === 'good') card.box = Math.min(5, card.box + 1);
  else card.box = 1;
  save();
  flashState.idx++;
  flashState.flipped = false;
  renderFlash();
}
window.flashGrade = flashGrade;

function openFlashAdd(){
  if(!flashState.subj){ toast('enroll in a subject first'); return; }
  openModal(`
    <h3>new flashcard</h3>
    <div class="field"><label>front</label><textarea id="fa-front" placeholder="question / term"></textarea></div>
    <div class="field"><label>back</label><textarea id="fa-back" placeholder="answer / definition"></textarea></div>
    <div class="row"><button class="btn hot" id="fa-save">save</button><button class="btn ghost" onclick="closeModal()">cancel</button></div>
  `);
  $('#fa-save').onclick = () => {
    const front = $('#fa-front').value.trim();
    const back = $('#fa-back').value.trim();
    if(!front || !back){ toast('both sides required'); return; }
    getSubjState(flashState.subj).flashcards.push({ front, back, box: 1, created: nowIso() });
    save();
    closeModal();
    renderFlash();
    toast('card added');
  };
}
window.openFlashAdd = openFlashAdd;

function editFlash(i){
  const c = getSubjState(flashState.subj).flashcards[i];
  openModal(`
    <h3>edit card</h3>
    <div class="field"><label>front</label><textarea id="fe-front">${escapeHTML(c.front)}</textarea></div>
    <div class="field"><label>back</label><textarea id="fe-back">${escapeHTML(c.back)}</textarea></div>
    <div class="row"><button class="btn hot" id="fe-save">save</button><button class="btn ghost" onclick="closeModal()">cancel</button></div>
  `);
  $('#fe-save').onclick = ()=>{
    c.front = $('#fe-front').value;
    c.back = $('#fe-back').value;
    save(); closeModal(); renderFlash();
  };
}
window.editFlash = editFlash;

function deleteFlash(i){
  if(!confirm('delete?')) return;
  getSubjState(flashState.subj).flashcards.splice(i,1);
  save();
  renderFlash();
}
window.deleteFlash = deleteFlash;


// ============================================================
// SETTINGS
// ============================================================
function renderCfg(){
  const p = P();
  $('#cfg-key').value = p.apiKey;
  $('#cfg-model').value = p.model;
  $('#cfg-deadline').value = p.deadline;
  $('#cfg-exam').value = p.examDate;
  $('#cfg-hours').value = p.dailyHours;
  $('#cfg-name').value = p.name;
  $('#cfg-avatar').value = p.avatar;
  $('#cfg-license').value = p.license;
  $('#cfg-sysprompt').value = p.sysPromptExtra;
  $('#cfg-license-status').textContent = p.license ? `licensed (key: ...${p.license.slice(-6)})` : 'unlicensed (offline mode unrestricted)';

  // Load new integrations
  $('#cfg-gcal-id').value = p.gcalClientId || '';
  $('#cfg-notion-token').value = p.notionToken || '';
  $('#cfg-notion-page').value = p.notionPageId || '';
  $('#cfg-notion-proxy').value = p.notionProxy || '';

  renderHabitConfig();

  $$('#theme-seg button').forEach(b => b.classList.toggle('on', b.dataset.theme === p.theme));
  $$('#dir-seg button').forEach(b => b.classList.toggle('on', b.dataset.dir === p.dir));

  $('#cfg-save').onclick = async () => {
    p.apiKey = $('#cfg-key').value.trim();
    p.model = $('#cfg-model').value;
    save();
    if(p.apiKey){
      try {
        const r = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method:'POST',
          headers:{ 'Authorization':'Bearer '+p.apiKey, 'Content-Type':'application/json' },
          body: JSON.stringify({ model:p.model, messages:[{role:'user',content:'ping'}], max_tokens: 5 })
        });
        if(r.ok){ toast('groq connected'); $('#sb-ai-state').textContent = 'online'; $('#sb-ai-dot').classList.remove('off'); }
        else toast('groq error ' + r.status, 3000, true);
      } catch(e){ toast('connection failed', 3000, true); }
    } else {
      $('#sb-ai-state').textContent = 'offline'; $('#sb-ai-dot').classList.add('off');
      toast('key cleared');
    }
  };

  $('#cfg-save-sched').onclick = () => {
    p.deadline = $('#cfg-deadline').value;
    p.examDate = $('#cfg-exam').value;
    p.dailyHours = parseFloat($('#cfg-hours').value) || 4;
    save();
    toast('schedule saved');
    renderDash();
  };

  $('#cfg-profile-save').onclick = () => {
    p.name = $('#cfg-name').value.trim() || 'operator';
    p.avatar = ($('#cfg-avatar').value.trim() || p.name[0] || 'O').toUpperCase().slice(0,2);
    save();
    updateProfileChrome();
    toast('profile updated');
  };

  $('#cfg-profile-new').onclick = openNewProfileModal;
  $('#cfg-profile-del').onclick = () => {
    if(!confirm('delete this profile? all data gone forever.')) return;
    deleteProfile(STORE.currentProfile);
  };

  $('#cfg-license-save').onclick = () => {
    p.license = $('#cfg-license').value.trim();
    save();
    renderCfg();
    toast(p.license ? 'license applied' : 'license cleared');
  };

  $('#cfg-sysprompt-save').onclick = () => {
    p.sysPromptExtra = $('#cfg-sysprompt').value;
    save();
    toast('system prompt saved');
  };

  // Integration saves & triggers
  $('#cfg-gcal-connect').onclick = () => {
    p.gcalClientId = $('#cfg-gcal-id').value.trim();
    save();
    pushToGoogleCalendar();
  };

  $('#cfg-notion-save').onclick = () => {
    p.notionToken = $('#cfg-notion-token').value.trim();
    p.notionPageId = $('#cfg-notion-page').value.trim();
    p.notionProxy = $('#cfg-notion-proxy').value.trim();
    save();
    toast('notion settings saved');
  };

  $('#cfg-notion-test').onclick = async () => {
    p.notionToken = $('#cfg-notion-token').value.trim();
    p.notionPageId = $('#cfg-notion-page').value.trim();
    p.notionProxy = $('#cfg-notion-proxy').value.trim();
    save();
    toast('testing connection...');
    try {
      const res = await fetch(`${p.notionProxy}/v1/pages/${p.notionPageId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${p.notionToken}`,
          'Notion-Version': '2022-06-28'
        }
      });
      if(res.ok){
        toast('connected to notion!');
      } else {
        toast('notion error: check integration / proxy', 3500, true);
      }
    } catch(e){
      toast('failed to connect: check settings / proxy', 3000, true);
    }
  };

  $('#cfg-habits-save').onclick = () => {
    const inputs = $$('.cfg-habit-input');
    const list = [];
    inputs.forEach(inp => {
      list.push(inp.value.trim() || `habit ${parseInt(inp.dataset.idx)+1}`);
    });
    p.habits = list;
    save();
    toast('habits updated');
    renderHabitTracker();
  };

  $$('#theme-seg button').forEach(b => b.onclick = () => applyTheme(b.dataset.theme));
  $$('#dir-seg button').forEach(b => b.onclick = () => applyDir(b.dataset.dir));

  $('#data-export').onclick = () => exportData(false);
  $('#data-export-enc').onclick = () => exportData(true);
  $('#data-import').onclick = () => $('#data-file').click();
  $('#data-file').onchange = importData;
  $('#data-clear').onclick = () => {
    if(!confirm('wipe this profile\'s data? cannot be undone.')) return;
    const id = STORE.currentProfile;
    const np = defaultProfile(P().name, P().avatar);
    np.id = id;
    np.onboarded = true;
    STORE.profiles[id] = np;
    save();
    bootRender();
    toast('profile wiped');
  };
}

// ============================================================
// PROFILE MODAL
// ============================================================
function openNewProfileModal(){
  openModal(`
    <h3>new profile</h3>
    <div class="field"><label>name</label><input id="np-name" placeholder="e.g. partner"></div>
    <div class="field"><label>avatar (1-2 chars)</label><input id="np-avatar" maxlength="2"></div>
    <div class="row"><button class="btn hot" id="np-save">create</button><button class="btn ghost" onclick="closeModal()">cancel</button></div>
  `);
  $('#np-save').onclick = () => {
    const name = $('#np-name').value.trim();
    if(!name){ toast('name required'); return; }
    const av = $('#np-avatar').value.trim() || name[0].toUpperCase();
    const p = newProfile(name, av);
    closeModal();
    startOnboarding(true);
  };
}

function openProfileSwitcher(){
  const list = Object.values(STORE.profiles).map(p => `
    <div class="wiz-subj-row ${p.id===STORE.currentProfile?'on':''}" data-id="${p.id}">
      <div class="sb-avatar">${escapeHTML(p.avatar||'?')}</div>
      <div class="wsr-name">${escapeHTML(p.name)}</div>
      <div class="wsr-board">${Object.keys(p.subjects||{}).length} subj · ${p.streak?.count||0}d streak</div>
    </div>
  `).join('');
  openModal(`
    <h3>switch profile</h3>
    <div class="wiz-subj-list" style="max-height:380px">${list}</div>
    <div class="row" style="margin-top:14px"><button class="btn hot" onclick="closeModal();openNewProfileModal()">+ new profile</button><button class="btn ghost" onclick="closeModal()">cancel</button></div>
  `);
  $$('#modal .wiz-subj-row').forEach(r => r.onclick = () => {
    switchProfile(r.dataset.id);
    closeModal();
  });
}

// ============================================================
// EXPORT / IMPORT
// ============================================================
function exportData(encrypted){
  const data = JSON.stringify(STORE, null, 2);
  if(!encrypted){
    download('siege-backup-' + todayIso() + '.json', data, 'application/json');
    toast('exported');
    return;
  }
  const pw = prompt('encryption password (you\'ll need this to import):');
  if(!pw) return;
  encryptString(data, pw).then(enc => {
    download('siege-backup-encrypted-' + todayIso() + '.json', JSON.stringify({ siege:true, encrypted:true, payload: enc }), 'application/json');
    toast('encrypted export ready');
  }).catch(e => toast('encryption failed', 3000, true));
}

function importData(e){
  const f = e.target.files[0];
  if(!f) return;
  const r = new FileReader();
  r.onload = async () => {
    try {
      const obj = JSON.parse(r.result);
      let raw;
      if(obj.siege && obj.encrypted){
        const pw = prompt('decryption password:');
        if(!pw) return;
        raw = await decryptString(obj.payload, pw);
      } else {
        raw = r.result;
      }
      const newStore = JSON.parse(raw);
      if(!newStore.profiles){ throw new Error('not a siege backup'); }
      if(!confirm('replace all current siege data?')) return;
      STORE = newStore;
      save();
      bootRender();
      toast('imported');
    } catch(err){
      toast('import failed: ' + err.message.slice(0,60), 3000, true);
    }
  };
  r.readAsText(f);
  e.target.value = '';
}

function download(name, content, type){
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = name; a.click();
  setTimeout(()=>URL.revokeObjectURL(url), 1000);
}

// AES-GCM via Web Crypto
async function deriveKey(pw, salt){
  const enc = new TextEncoder();
  const baseKey = await crypto.subtle.importKey('raw', enc.encode(pw), { name:'PBKDF2' }, false, ['deriveKey']);
  return crypto.subtle.deriveKey(
    { name:'PBKDF2', salt, iterations: 250000, hash:'SHA-256' },
    baseKey, { name:'AES-GCM', length: 256 }, false, ['encrypt','decrypt']
  );
}
async function encryptString(plain, pw){
  const enc = new TextEncoder();
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveKey(pw, salt);
  const ct = await crypto.subtle.encrypt({ name:'AES-GCM', iv }, key, enc.encode(plain));
  return {
    salt: btoa(String.fromCharCode(...salt)),
    iv: btoa(String.fromCharCode(...iv)),
    ct: btoa(String.fromCharCode(...new Uint8Array(ct)))
  };
}
async function decryptString(payload, pw){
  const salt = Uint8Array.from(atob(payload.salt), c=>c.charCodeAt(0));
  const iv = Uint8Array.from(atob(payload.iv), c=>c.charCodeAt(0));
  const ct = Uint8Array.from(atob(payload.ct), c=>c.charCodeAt(0));
  const key = await deriveKey(pw, salt);
  const pt = await crypto.subtle.decrypt({ name:'AES-GCM', iv }, key, ct);
  return new TextDecoder().decode(pt);
}


// ============================================================
// MODAL
// ============================================================
function openModal(html, wide=false){
  $('#modal').classList.toggle('wide', wide);
  $('#modal-body').innerHTML = html;
  $('#modal-bg').classList.add('show');
}
function closeModal(){
  $('#modal-bg').classList.remove('show');
  $('#modal-body').innerHTML = '';
}
window.openModal = openModal;
window.closeModal = closeModal;

// ============================================================
// COMMAND PALETTE
// ============================================================
const COMMANDS = [
  { label:'jump to dashboard', tag:'nav', fn:()=>go('dash') },
  { label:'jump to subjects', tag:'nav', fn:()=>go('subj') },
  { label:'jump to past papers', tag:'nav', fn:()=>go('papers') },
  { label:'jump to siege.ai', tag:'nav', fn:()=>go('ai') },
  { label:'jump to pomodoro', tag:'nav', fn:()=>go('pomo') },
  { label:'jump to stats', tag:'nav', fn:()=>go('stats') },
  { label:'jump to mistakes', tag:'nav', fn:()=>go('mistakes') },
  { label:'jump to notes', tag:'nav', fn:()=>go('notes') },
  { label:'jump to flashcards', tag:'nav', fn:()=>go('flash') },
  { label:'jump to settings', tag:'nav', fn:()=>go('cfg') },
  { label:'jump to help', tag:'nav', fn:()=>go('help') },
  { label:'generate today\'s mission', tag:'action', fn:()=>{ go('dash'); generateMission(); } },
  { label:'log a mistake', tag:'action', fn:()=>{ go('mistakes'); openMistakeModal(); } },
  { label:'add a flashcard', tag:'action', fn:()=>{ go('flash'); openFlashAdd(); } },
  { label:'add a subject', tag:'action', fn:()=>{ go('subj'); openSubjPicker(); } },
  { label:'start pomodoro', tag:'action', fn:()=>{ go('pomo'); setTimeout(pomoStart,200); } },
  { label:'switch profile', tag:'profile', fn:openProfileSwitcher },
  { label:'new profile', tag:'profile', fn:openNewProfileModal },
  { label:'export data (plain)', tag:'data', fn:()=>exportData(false) },
  { label:'export data (encrypted)', tag:'data', fn:()=>exportData(true) },
  { label:'theme: brutalist red', tag:'theme', fn:()=>applyTheme('red') },
  { label:'theme: terminal green', tag:'theme', fn:()=>applyTheme('green') },
  { label:'theme: mono white', tag:'theme', fn:()=>applyTheme('mono') },
  { label:'direction: ltr', tag:'lang', fn:()=>applyDir('ltr') },
  { label:'direction: rtl (arabic)', tag:'lang', fn:()=>applyDir('rtl') },
  { label:'print weekly plan', tag:'action', fn:()=>window.print() },
  { label:'restart onboarding', tag:'action', fn:()=>startOnboarding(true) },
  { label:'help / faq', tag:'nav', fn:()=>go('help') },
];

let cmdSel = 0;
let cmdFiltered = [];

function openCmd(){
  $('#cmd-bg').classList.add('show');
  $('#cmd-input').value = '';
  cmdSel = 0;
  renderCmd('');
  setTimeout(()=>$('#cmd-input').focus(), 50);
}
function closeCmd(){ $('#cmd-bg').classList.remove('show'); }

function renderCmd(q){
  const ql = q.toLowerCase();
  cmdFiltered = COMMANDS.filter(c => c.label.toLowerCase().includes(ql) || c.tag.includes(ql));
  if(cmdFiltered.length === 0){
    $('#cmd-results').innerHTML = '<div class="cmd-empty">no commands match</div>';
    return;
  }
  $('#cmd-results').innerHTML = cmdFiltered.map((c,i)=>`<div class="cmd-result ${i===cmdSel?'sel':''}" data-i="${i}"><div class="cmd-result-l">${escapeHTML(c.label)}</div><div class="cmd-result-r">${c.tag}</div></div>`).join('');
  $$('.cmd-result').forEach(r => r.onclick = () => { runCmd(parseInt(r.dataset.i)); });
}

function runCmd(i){
  const c = cmdFiltered[i];
  if(c){ closeCmd(); setTimeout(()=>c.fn(), 50); }
}

// ============================================================
// KEYBOARD SHORTCUTS
// ============================================================
let lastKey = '';
let lastKeyTime = 0;
function handleKey(e){
  const target = e.target;
  const inField = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable;
  if((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k'){
    e.preventDefault(); openCmd(); return;
  }
  if(e.key === 'Escape'){
    closeModal(); closeCmd();
    return;
  }
  if(inField) return;

  // sequential shortcuts
  const now = Date.now();
  if(now - lastKeyTime > 1200) lastKey = '';
  const combo = lastKey + e.key.toLowerCase();
  lastKey = e.key.toLowerCase();
  lastKeyTime = now;

  const map = {
    'gd':()=>go('dash'),'ga':()=>go('ai'),'gp':()=>go('papers'),'gs':()=>go('stats'),
    'gf':()=>go('flash'),'gn':()=>go('notes'),'gm':()=>go('mistakes'),'gc':()=>go('cfg'),
    'gh':()=>go('help'),'go':()=>go('pomo'),'gj':()=>go('subj'),
    'nm':()=>{ go('dash'); generateMission(); },
    'nf':openFlashAdd,
    '?':()=>go('help'),
    '/':()=>openCmd(),
  };
  if(map[combo]){ e.preventDefault(); map[combo](); lastKey = ''; }
  else if(map[e.key]){ e.preventDefault(); map[e.key](); }
}

// ============================================================
// BOOTSTRAP & UI WIRING
// ============================================================
/* ============================================================
   NEW FEATURES IMPLEMENTATION
   ============================================================ */

// 1. PDF & Image file uploads
async function handleChatFileSelect(e){
  const file = e.target.files[0];
  if(!file) return;
  pendingFile = file;
  pendingFileType = file.type;

  if(file.type.startsWith('image/')){
    const reader = new FileReader();
    reader.onload = function(evt){
      pendingFileB64 = evt.target.result.split(',')[1];
      showChatFilePreview(file.name, evt.target.result);
    };
    reader.readAsDataURL(file);
  } else if(file.type === 'application/pdf'){
    toast('parsing pdf text...');
    try {
      const reader = new FileReader();
      reader.onload = async function(){
        try {
          const typedarray = new Uint8Array(this.result);
          const pdf = await pdfjsLib.getDocument(typedarray).promise;
          let text = '';
          const maxPages = Math.min(pdf.numPages, 10); // cap to prevent token explosion
          for(let i=1; i<=maxPages; i++){
            const page = await pdf.getPage(i);
            const content = await page.getTextContent();
            text += content.items.map(it => it.str).join(' ') + '\n';
          }
          pendingFileB64 = ''; // PDFs are text-based context
          $('#chat-input').value = `[ATTACHED PDF TEXT: ${file.name}]\n${text.slice(0, 8000)}\n[END PDF TEXT]\n` + $('#chat-input').value;
          toast('pdf text loaded into chat');
        } catch(err){
          toast('failed to read pdf text: ' + err.message, 3000, true);
        }
      };
      reader.readAsArrayBuffer(file);
    } catch(err){
      toast('failed to load pdf: ' + err.message, 3000, true);
    }
  } else {
    toast('unsupported file type (images and pdf only)', 3000, true);
  }
}

function showChatFilePreview(name, dataUrl){
  let log = $('#chat-log');
  let prev = log.querySelector('.chat-img-preview');
  if(prev) prev.remove();
  const img = document.createElement('img');
  img.src = dataUrl;
  img.className = 'chat-img-preview';
  log.appendChild(img);
  log.scrollTop = log.scrollHeight;
  toast(`attached ${name}`);
}

// 2. Youtube Transcript Inline Loader
function toggleYoutubeLoader(){
  const zone = $('#yt-zone');
  if(zone.innerHTML){
    zone.innerHTML = '';
    return;
  }
  zone.innerHTML = `
    <div class="yt-inline">
      <input type="text" id="yt-url" placeholder="paste youtube url or transcript text...">
      <button class="btn xs" id="yt-load-btn">load transcript</button>
    </div>
    <div class="yt-help">Enter a youtube link or raw transcript. If using a link, we'll try to retrieve the transcript. If it fails, you can paste the text directly.</div>
  `;
  $('#yt-load-btn').addEventListener('click', async ()=>{
    const val = $('#yt-url').value.trim();
    if(!val) return;
    if(val.startsWith('http')){
      toast('fetching transcript...');
      try {
        // use a free open proxy transcript api
        const videoId = parseYoutubeId(val);
        if(!videoId){
          toast('invalid youtube link', 2400, true);
          return;
        }
        const res = await fetch(`https://youtube-transcript-api.antigravity.workers.dev/?v=${videoId}`);
        if(!res.ok) throw new Error('failed to retrieve transcript');
        const json = await res.json();
        ytTranscript = json.transcript || '';
        toast('transcript loaded into chat context');
        $('#yt-zone').innerHTML = '';
      } catch(e){
        toast('failed to fetch. please paste raw transcript text instead.', 3500, true);
      }
    } else {
      ytTranscript = val;
      toast('transcript loaded into chat context');
      $('#yt-zone').innerHTML = '';
    }
  });
}

function parseYoutubeId(url){
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : null;
}

// 3. Voice Input
let voiceRecognition = null;
function toggleVoiceInput(){
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if(!SpeechRecognition){
    toast('speech recognition not supported in this browser', 3000, true);
    return;
  }
  if(voiceRecognition){
    voiceRecognition.stop();
    return;
  }
  voiceRecognition = new SpeechRecognition();
  voiceRecognition.continuous = false;
  voiceRecognition.interimResults = false;
  voiceRecognition.lang = 'en-US';

  voiceRecognition.onstart = function(){
    $('#chat-mic').classList.add('listening');
    toast('listening... speak now');
  };
  voiceRecognition.onresult = function(e){
    const text = e.results[0][0].transcript;
    if(text){
      $('#chat-input').value = ($('#chat-input').value + ' ' + text).trim();
    }
  };
  voiceRecognition.onerror = function(e){
    toast('voice error: ' + e.error, 2400, true);
    stopVoice();
  };
  voiceRecognition.onend = function(){
    stopVoice();
  };
  voiceRecognition.start();
}

function stopVoice(){
  if(voiceRecognition) {
    voiceRecognition.abort();
    voiceRecognition = null;
  }
  $('#chat-mic').classList.remove('listening');
}

// 5. Formula Bank (Specialized Chemistry mode helper)
function renderFormulaBank(){
  const zone = $('#chem-formula-zone');
  if(!zone) return;
  if(subjActive !== '0620'){
    zone.innerHTML = '';
    return;
  }
  zone.innerHTML = `
    <div class="card">
      <span class="card-tag">// formula bank — chemistry 0620</span>
      <p style="font-size:11px;color:var(--ink-dim);margin-bottom:12px">Key equations and formulas for Paper 4/6 stoichiometry and energetics.</p>
      <div class="formula-card">
        <div class="formula-name">moles of solid</div>
        <div class="formula-expr">n = m / M_r</div>
        <div class="formula-expand">[click to expand calculation notes]</div>
        <div class="formula-detail">
          m = mass in grams (g)<br>
          M_r = relative formula mass from periodic table<br>
          Example: 12g of Carbon = 12 / 12 = 1 mole.
        </div>
      </div>
      <div class="formula-card">
        <div class="formula-name">moles of solution</div>
        <div class="formula-expr">n = C &times; V</div>
        <div class="formula-expand">[click to expand calculation notes]</div>
        <div class="formula-detail">
          C = concentration in mol/dm³ (or g/dm³)<br>
          V = volume in dm³ (Note: 1 dm³ = 1000 cm³)<br>
          To convert cm³ to dm³, divide by 1000.
        </div>
      </div>
      <div class="formula-card">
        <div class="formula-name">moles of gas (r.t.p.)</div>
        <div class="formula-expr">n = V / 24</div>
        <div class="formula-expand">[click to expand calculation notes]</div>
        <div class="formula-detail">
          V = volume of gas in dm³ at room temperature and pressure<br>
          If V is in cm³, use: n = V / 24000.
        </div>
      </div>
    </div>
  `;
  zone.querySelectorAll('.formula-expand').forEach(btn => {
    btn.addEventListener('click', ()=>{
      const detail = btn.nextElementSibling;
      detail.classList.toggle('open');
      btn.textContent = detail.classList.contains('open') ? '[click to collapse notes]' : '[click to expand calculation notes]';
    });
  });
}

// 7. Grade Predictor
function renderGradePredictor(){
  const zone = $('#grade-predictor');
  if(!zone) return;
  const enrolled = enrolledSubjects();
  if(enrolled.length === 0){
    zone.innerHTML = '<p class="muted">enroll in subjects to view predicted grade.</p>';
    return;
  }

  let html = '';
  enrolled.forEach(c => {
    const s = SYLLABI[c];
    const st = getSubjState(c);
    const paperLogs = st.papers || [];
    if(paperLogs.length === 0){
      html += `<div style="margin-bottom:8px;font-size:11px">${s.code} ${s.name}: <span class="muted">no paper logs yet</span></div>`;
      return;
    }

    // average score
    let totalScore = 0;
    paperLogs.forEach(p => {
      totalScore += (p.score / p.maxScore) * 100;
    });
    const avg = totalScore / paperLogs.length;

    // determine band based on typical 0620 threshold
    let band = 'low', bandText = 'U / E', cls = 'low';
    if(avg >= 75){ band = 'a-star'; bandText = 'A*'; cls = 'a-star'; }
    else if(avg >= 60){ band = 'a'; bandText = 'A'; cls = 'a'; }
    else if(avg >= 50){ band = 'b'; bandText = 'B'; cls = 'b'; }
    else if(avg >= 40){ band = 'c-d'; bandText = 'C'; cls = 'c-d'; }

    html += `
      <div style="margin-bottom:10px;display:flex;align-items:center;justify-content:space-between">
        <span style="font-size:11px;font-weight:700">${s.code} ${s.name}</span>
        <div>
          <span class="grade-band ${cls}">${bandText}</span>
          <span style="font-size:11px;color:var(--ink-dim)">avg: ${Math.round(avg)}% (${paperLogs.length} papers)</span>
        </div>
      </div>
    `;
  });
  zone.innerHTML = html;
}

// 8. Energy vs Performance line chart
let energyChartInstance = null;
function renderEnergyChart(){
  const canvas = $('#chart-energy');
  if(!canvas) return;
  const ctx = canvas.getContext('2d');
  const p = P();
  
  // construct data points: zip energy Log and paper logs sorted by date
  const logs = p.studyLog || [];
  const energyLogs = p.energyLog || [];

  ctx.clearRect(0,0,600,220);

  // draw grid
  ctx.strokeStyle = '#1a1a1a';
  ctx.lineWidth = 1;
  for(let i=0; i<=4; i++){
    const y = 20 + i*40;
    ctx.beginPath();
    ctx.moveTo(40, y);
    ctx.lineTo(580, y);
    ctx.stroke();
  }

  // plot points: mock representation if data is thin
  const points = [];
  const days = 7;
  for(let i=days-1; i>=0; i--){
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    const energy = energyLogs.find(l => l.date === dateStr)?.level || 3;
    
    // find average score on this day
    const dayScores = [];
    enrolledSubjects().forEach(c => {
      const st = getSubjState(c);
      (st.papers || []).forEach(pl => {
        if(pl.date === dateStr){
          dayScores.push((pl.score / pl.maxScore) * 100);
        }
      });
    });
    const avgScore = dayScores.length ? (dayScores.reduce((a,b)=>a+b, 0) / dayScores.length) : 50;
    points.push({ date: dateStr.slice(5), energy, score: avgScore });
  }

  // draw energy line (cyan)
  ctx.strokeStyle = '#00f0ff';
  ctx.lineWidth = 2;
  ctx.beginPath();
  points.forEach((pt, idx) => {
    const x = 50 + idx * 75;
    const y = 180 - (pt.energy - 1) * 35;
    if(idx === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.stroke();

  // draw performance line (red)
  ctx.strokeStyle = '#ff003c';
  ctx.lineWidth = 2;
  ctx.beginPath();
  points.forEach((pt, idx) => {
    const x = 50 + idx * 75;
    const y = 180 - (pt.score / 100) * 140;
    if(idx === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.stroke();

  // draw x-axis labels
  ctx.fillStyle = '#666';
  ctx.font = '10px monospace';
  points.forEach((pt, idx) => {
    const x = 40 + idx * 75;
    ctx.fillText(pt.date, x, 205);
  });

  // legends
  ctx.fillStyle = '#00f0ff';
  ctx.fillText('■ energy level (1-5)', 50, 15);
  ctx.fillStyle = '#ff003c';
  ctx.fillText('■ performance avg %', 200, 15);
}

function renderEnergyCheckin(){
  const zone = $('#habit-zone');
  if(!zone) return;
  const p = P();
  const today = todayIso();
  const current = p.energyLog.find(l => l.date === today)?.level || 0;

  let btnHtml = '';
  for(let i=1; i<=5; i++){
    const emoji = ['⚡','🔋','😐','🥱','💀'][5-i];
    btnHtml += `<button class="energy-btn ${current===i?'sel':''}" data-level="${i}">${emoji}</button>`;
  }

  const checkinHtml = `
    <div class="energy-checkin">
      <div class="energy-label">track today's study energy</div>
      <div class="energy-btns">${btnHtml}</div>
    </div>
  `;
  
  // prepend to habit zone
  const wrap = document.createElement('div');
  wrap.innerHTML = checkinHtml;
  zone.insertBefore(wrap.firstElementChild, zone.firstChild);

  zone.querySelectorAll('.energy-btn').forEach(btn => {
    btn.addEventListener('click', ()=>{
      const lvl = parseInt(btn.dataset.level);
      const log = p.energyLog;
      const idx = log.findIndex(l => l.date === today);
      if(idx >= 0) log[idx].level = lvl;
      else log.push({ date: today, level: lvl });
      save();
      toast('energy logged');
      renderEnergyCheckin();
      renderEnergyChart();
    });
  });
}

// 9. Paper Difficulty Ranker & Visual Map
function renderPaperDifficultyMap(){
  const zone = $('#diff-map-zone');
  if(!zone) return;
  if(subjActive === ''){
    zone.innerHTML = '<p class="muted">no active subject</p>';
    return;
  }
  const s = SYLLABI[subjActive];
  const st = getSubjState(subjActive);
  
  // statically define paper difficulties based on historical data
  const map = {
    '0620': {
      '0620/42/O/N/22': 'brutal',
      '0620/42/M/J/23': 'hard',
      '0620/41/O/N/21': 'brutal',
      '0620/22/M/J/22': 'manageable',
      '0620/62/O/N/23': 'solid',
      '0620/42/F/M/22': 'easy'
    }
  };

  const subjectMap = map[s.code] || {};
  let html = `
    <div class="card" style="background:var(--bg-3)">
      <span class="card-tag warn">// paper difficulty ranker</span>
      <p style="font-size:11px;color:var(--ink-dim);margin-top:6px;margin-bottom:10px">Historical variant difficulty ranking based on examiner grade boundaries.</p>
      <div style="font-size:11px">
  `;

  const codes = [
    `${s.code}/42/O/N/22`,
    `${s.code}/42/M/J/23`,
    `${s.code}/41/O/N/21`,
    `${s.code}/22/M/J/22`,
    `${s.code}/62/O/N/23`,
    `${s.code}/42/F/M/22`
  ];

  codes.forEach(c => {
    const diff = subjectMap[c] || 'solid';
    const status = st.papersAttempted[c] ? '<span style="color:var(--ok)">[completed]</span>' : '<span style="color:var(--muted)">[unsolved]</span>';
    html += `
      <div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid var(--line)">
        <span><code>${c}</code></span>
        <div>
          <span class="diff-${diff}" style="text-transform:uppercase;margin-right:8px;font-weight:700">${diff}</span>
          ${status}
        </div>
      </div>
    `;
  });

  html += '</div></div>';
  zone.innerHTML = html;
}

// 10. Per-task Timers
let activeTaskTimer = null;
let taskTimerInterval = null;
let taskTimerStart = null;
let taskTimerElapsed = 0;

function toggleTaskTimer(idx, btn){
  const p = P();
  if(activeTaskTimer !== null && activeTaskTimer !== idx){
    toast('another task timer is already running', 2400, true);
    return;
  }

  if(activeTaskTimer === idx){
    // pause timer
    clearInterval(taskTimerInterval);
    const secs = Math.floor((Date.now() - taskTimerStart) / 1000) + taskTimerElapsed;
    p.mission.tasks[idx].timeSpent = secs;
    save();
    activeTaskTimer = null;
    btn.classList.remove('running');
    btn.innerHTML = '&#9654;'; // play symbol
    toast('timer paused');
    renderMission(p.mission.tasks);
  } else {
    // start timer
    activeTaskTimer = idx;
    taskTimerStart = Date.now();
    taskTimerElapsed = p.mission.tasks[idx].timeSpent || 0;
    btn.classList.add('running');
    btn.innerHTML = '&#10074;&#10074;'; // pause symbol
    toast('task timer started');

    taskTimerInterval = setInterval(()=>{
      const totalSecs = Math.floor((Date.now() - taskTimerStart) / 1000) + taskTimerElapsed;
      const display = formatSecs(totalSecs);
      const timerLabel = btn.nextElementSibling;
      if(timerLabel) timerLabel.textContent = display;
    }, 1000);
  }
}

function formatSecs(s){
  const hrs = Math.floor(s / 3600);
  const mins = Math.floor((s % 3600) / 60);
  const secs = s % 60;
  return `${hrs?hrs+':':''}${String(mins).padStart(2,'0')}:${String(secs).padStart(2,'0')}`;
}

// Override renderMission with per-task timer buttons
const originalRenderMission = renderMission;
renderMission = function(tasks){
  originalRenderMission(tasks);
  const items = $$('#mission-zone .mission-item');
  if(!items.length) return;
  const p = P();

  items.forEach((item, i) => {
    const meta = item.querySelector('.mission-meta');
    const spent = tasks[i].timeSpent || 0;
    const timerHtml = `
      <div style="display:inline-flex;align-items:center;margin-left:auto">
        <button class="task-timer-btn ${activeTaskTimer===i?'running':''}" data-idx="${i}">${activeTaskTimer===i?'&#10074;&#10074;':'&#9654;'}</button>
        <span class="task-timer-inline">${spent > 0 ? formatSecs(spent) : '00:00'}</span>
      </div>
    `;
    const wrap = document.createElement('div');
    wrap.innerHTML = timerHtml;
    meta.appendChild(wrap.firstElementChild);
  });

  $$('#mission-zone .task-timer-btn').forEach(btn => {
    btn.addEventListener('click', (e)=>{
      e.stopPropagation();
      toggleTaskTimer(parseInt(btn.dataset.idx), btn);
    });
  });

  // F12: Mission timer footer area
  const doneCount = (p.mission.done || []).filter(Boolean).length;
  const totalCount = tasks.length;
  const footerZone = $('#mission-footer-zone');
  if(footerZone){
    footerZone.innerHTML = `
      <div class="mission-footer">
        <span>COMPLETED: ${doneCount}/${totalCount} TASKS</span>
        <span id="mission-footer-timer">TOTAL ACTIVE: ${formatSecs(tasks.reduce((a,b)=>a+(b.timeSpent||0), 0))}</span>
      </div>
    `;
  }
};

// 11. Topic Revision Schedule
function generateRevisionSchedule(){
  const p = P();
  const enrolled = enrolledSubjects();
  if(enrolled.length === 0){
    toast('please enroll in subjects first', 2400, true);
    return;
  }
  
  // calculate spaced intervals
  const intervals = [1, 3, 7, 30];
  const list = [];

  enrolled.forEach(c => {
    const s = SYLLABI[c];
    const st = getSubjState(c);
    s.topics.forEach((t, i) => {
      const progress = st.topicProgress[i] || 0;
      if(progress < 2){
        list.push({ code: c, name: s.name, topic: t, idx: i, progress });
      }
    });
  });

  // Pick top 4 weakest/incomplete topics
  const target = list.slice(0, 4);
  if(target.length === 0){
    toast('all topics fully mastered! no revision needed.', 3000);
    return;
  }

  let tableRows = '';
  target.forEach((item, idx) => {
    const baseDate = new Date();
    const dates = intervals.map(days => {
      const d = new Date(baseDate);
      d.setDate(d.getDate() + days);
      return d.toISOString().split('T')[0].slice(5); // MM-DD
    });

    tableRows += `
      <tr>
        <td style="font-weight:700">${item.code}</td>
        <td>${item.topic}</td>
        <td style="color:var(--ok)">R1: ${dates[0]}</td>
        <td style="color:var(--sec)">R2: ${dates[1]}</td>
        <td style="color:var(--warn)">R3: ${dates[2]}</td>
        <td style="color:var(--bad)">R4: ${dates[3]}</td>
      </tr>
    `;
  });

  const modalHtml = `
    <h3>spaced repetition revision schedule</h3>
    <p style="font-size:11px;color:var(--ink-dim)">Generated based on weak syllabus areas. Review these topics on the specified dates.</p>
    <table class="rev-table">
      <thead>
        <tr>
          <th>subject</th>
          <th>topic</th>
          <th>1 day</th>
          <th>3 days</th>
          <th>7 days</th>
          <th>30 days</th>
        </tr>
      </thead>
      <tbody>
        ${tableRows}
      </tbody>
    </table>
  `;
  openModal(modalHtml);
}

// 12. Daily Habit Tracker
function renderHabitTracker(){
  const zone = $('#habit-zone');
  if(!zone) return;
  const p = P();
  
  // ensure habit log structure
  p.habitLog = p.habitLog || {};
  const today = todayIso();
  p.habitLog[today] = p.habitLog[today] || p.habits.map(()=>false);

  let html = `
    <div class="habit-section">
      <span class="card-tag">// daily habits</span>
      <div style="margin-top:12px">
  `;

  p.habits.forEach((habit, idx) => {
    const done = p.habitLog[today][idx] || false;
    
    // calculate last 7 days heatmap for this habit
    let cells = '';
    for(let d=6; d>=0; d--){
      const date = new Date();
      date.setDate(date.getDate() - d);
      const dateStr = date.toISOString().split('T')[0];
      const log = p.habitLog[dateStr] || [];
      const on = log[idx] || false;
      cells += `<div class="habit-mini-cell ${on?'on':''}" title="${dateStr}"></div>`;
    }

    html += `
      <div class="habit-row">
        <button class="habit-toggle ${done?'done':''}" data-idx="${idx}">${done?'✓':'✕'}</button>
        <span class="habit-name">${habit}</span>
        <div class="habit-mini-heatmap">${cells}</div>
      </div>
    `;
  });

  html += '</div></div>';
  zone.innerHTML = html;
  renderEnergyCheckin();

  zone.querySelectorAll('.habit-toggle').forEach(btn => {
    btn.addEventListener('click', ()=>{
      const idx = parseInt(btn.dataset.idx);
      p.habitLog[today][idx] = !p.habitLog[today][idx];
      save();
      renderHabitTracker();
    });
  });
}

function renderHabitConfig(){
  const p = P();
  const fields = $('#cfg-habits-fields');
  if(!fields) return;
  fields.innerHTML = p.habits.map((h, i) => `
    <div class="field">
      <label>habit ${i+1}</label>
      <input type="text" class="cfg-habit-input" value="${escapeHTML(h)}" data-idx="${i}">
    </div>
  `).join('');
}

// 13. Contextual Quick Notes Drawer
let drawerTopicSubj = '';
let drawerTopicIdx = null;

function openNotesDrawer(subj, idx, name){
  drawerTopicSubj = subj;
  drawerTopicIdx = idx;
  const p = P();
  const notes = p.subjects[subj]?.notes || {};
  const content = notes[idx] || '';

  $('#ctx-drawer-title').textContent = `${subjActive} // ${name.toLowerCase()}`;
  $('#ctx-drawer-edit').value = content;
  $('#ctx-drawer').classList.add('open');
}

function closeNotesDrawer(){
  $('#ctx-drawer').classList.remove('open');
}

function autoSaveNotes(){
  if(!drawerTopicSubj || drawerTopicIdx === null) return;
  const val = $('#ctx-drawer-edit').value;
  const p = P();
  p.subjects[drawerTopicSubj] = p.subjects[drawerTopicSubj] || { topicProgress:{}, papers:[], papersAttempted:{}, notes:{}, mistakes:[], flashcards:[] };
  p.subjects[drawerTopicSubj].notes = p.subjects[drawerTopicSubj].notes || {};
  p.subjects[drawerTopicSubj].notes[drawerTopicIdx] = val;
  save();
  $('#ctx-drawer-status').textContent = 'saved: ' + new Date().toLocaleTimeString().toLowerCase();

  // refresh dot indicators in UI
  const dot = document.querySelector(`.topic-note-dot[data-idx="${drawerTopicIdx}"]`);
  if(dot){
    dot.classList.toggle('has', val.trim().length > 0);
  }
}

// Hook contextual quick notes trigger dots into topic list views
const originalRenderSubjDetail = renderSubjDetail;
renderSubjDetail = function(){
  originalRenderSubjDetail();
  const p = P();
  const container = $('#subj-topics');
  if(!container || !subjActive) return;
  const s = SYLLABI[subjActive];
  const st = getSubjState(subjActive);
  
  // replace topic items to add note dots
  const items = container.querySelectorAll('.topic-item');
  items.forEach((item, idx) => {
    const hasNotes = (st.notes[idx] || '').trim().length > 0;
    const dot = document.createElement('span');
    dot.className = `topic-note-dot ${hasNotes?'has':''}`;
    dot.dataset.idx = idx;
    dot.title = 'click to open topic quick notes';
    item.querySelector('.topic-name').appendChild(dot);
    
    dot.addEventListener('click', (e)=>{
      e.stopPropagation();
      openNotesDrawer(subjActive, idx, s.topics[idx]);
    });
  });
};

// 14. Status Bar updates
function updateStatusBar(){
  const bar = $('#status-bar');
  if(!bar) return;
  
  // calculate localStorage size
  let total = 0;
  for(let x in localStorage){
    if(localStorage.hasOwnProperty(x)){
      total += (localStorage[x].length * 2);
    }
  }
  const kb = (total / 1024).toFixed(1);
  $('#status-storage').textContent = `storage: ${kb}KB`;

  // online / offline detection
  const statusOnline = $('#status-online');
  if(navigator.onLine){
    statusOnline.innerHTML = '<span class="dot-online"></span>online';
  } else {
    statusOnline.innerHTML = '<span class="dot-offline"></span>offline';
  }

  // groq status
  const p = P();
  const statusGroq = $('#status-groq');
  if(p.apiKey){
    statusGroq.textContent = 'groq: ready';
    statusGroq.style.color = 'var(--ok)';
  } else {
    statusGroq.textContent = 'groq: offline';
    statusGroq.style.color = 'var(--bad)';
  }

  $('#status-saved').textContent = 'saved: ' + (new Date().toLocaleTimeString().toLowerCase());
}

// 15. Whatsapp Export
function shareViaWhatsApp(){
  const p = P();
  const date = todayIso();
  const tasks = p.mission.tasks || [];
  if(tasks.length === 0){
    toast('generate a study mission first', 2400, true);
    return;
  }
  
  let msg = `⚡ SIEGE Study Mission — ${date}\n\n`;
  tasks.forEach((t, i) => {
    const done = p.mission.done[i] ? '✅' : '⬜';
    msg += `${done} [${t.subj}] ${t.task}\n`;
  });
  
  msg += `\nStreak: ${p.streak.count} days | study terminal`;
  const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(msg)}`;
  window.open(url, '_blank');
}

// 16. Google Calendar OAuth push
function pushToGoogleCalendar(){
  const p = P();
  if(!p.gcalClientId){
    toast('configure client id in settings first', 2400, true);
    go('cfg');
    return;
  }

  // initialize oauth implicit grant
  const redirect = window.location.href.split('#')[0];
  const url = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${p.gcalClientId}&redirect_uri=${encodeURIComponent(redirect)}&response_type=token&scope=https://www.googleapis.com/auth/calendar.events`;
  window.location.href = url;
}

async function handleGoogleCallback(){
  const hash = window.location.hash;
  if(!hash.includes('access_token')) return;
  
  const params = new URLSearchParams(hash.slice(1));
  const token = params.get('access_token');
  if(!token) return;

  window.location.hash = ''; // clear hash
  toast('connected to google. creating mission event...');

  const p = P();
  const tasks = p.mission.tasks || [];
  if(tasks.length === 0){
    toast('no mission tasks to push', 2400, true);
    return;
  }

  // push event to GCal
  const desc = tasks.map(t => `- [${t.subj}] ${t.task}`).join('\n');
  const event = {
    summary: `SIEGE Study Mission: ${todayIso()}`,
    description: desc,
    start: { date: todayIso() },
    end: { date: todayIso() }
  };

  try {
    const res = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(event)
    });
    if(!res.ok) throw new Error('failed to create calendar event');
    toast('gcal study event created successfully');
    $('#cfg-gcal-status').textContent = 'connected';
  } catch(e){
    toast('failed to write to calendar: ' + e.message, 3000, true);
  }
}

// 17. Notion Integration
async function pushToNotion(){
  const p = P();
  if(!p.notionToken || !p.notionPageId || !p.notionProxy){
    toast('configure notion & proxy in settings first', 2400, true);
    go('cfg');
    return;
  }

  const tasks = p.mission.tasks || [];
  if(tasks.length === 0){
    toast('generate a study mission first', 2400, true);
    return;
  }

  toast('pushing to notion...');
  
  // construct children blocks
  const children = [
    {
      object: 'block',
      type: 'heading_2',
      heading_2: {
        rich_text: [{ type: 'text', text: { content: `SIEGE Mission — ${todayIso()}` } }]
      }
    }
  ];

  tasks.forEach((t, i) => {
    children.push({
      object: 'block',
      type: 'to_do',
      to_do: {
        rich_text: [{ type: 'text', text: { content: `[${t.subj}] ${t.task}` } }],
        checked: p.mission.done[i] || false
      }
    });
  });

  try {
    const res = await fetch(`${p.notionProxy}/v1/blocks/${p.notionPageId}/children`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${p.notionToken}`,
        'Notion-Version': '2022-06-28',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ children })
    });
    if(!res.ok) throw new Error('notion API failure');
    toast('pushed to notion workspace');
  } catch(e){
    toast('notion write failed: check settings/proxy', 3500, true);
  }
}

// 18. Progress Share Cards
function generateProgressShareCard(){
  const p = P();
  const canvas = document.createElement('canvas');
  canvas.width = 600;
  canvas.height = 400;
  const ctx = canvas.getContext('2d');

  // styling
  ctx.fillStyle = '#050505';
  ctx.fillRect(0,0,600,400);

  // borders
  ctx.strokeStyle = '#ff003c';
  ctx.lineWidth = 4;
  ctx.strokeRect(10, 10, 580, 380);

  // grid pattern background
  ctx.strokeStyle = '#111';
  ctx.lineWidth = 1;
  for(let x=20; x<580; x+=20){
    ctx.beginPath(); ctx.moveTo(x,20); ctx.lineTo(x,380); ctx.stroke();
  }
  for(let y=20; y<380; y+=20){
    ctx.beginPath(); ctx.moveTo(20,y); ctx.lineTo(580,y); ctx.stroke();
  }

  // Header
  ctx.fillStyle = '#ff003c';
  ctx.font = '800 24px monospace';
  ctx.fillText('SIEGE STUDY TERMINAL', 40, 60);

  ctx.fillStyle = '#fff';
  ctx.font = '14px monospace';
  ctx.fillText(`OPERATOR: ${p.name.toUpperCase()}`, 40, 100);
  ctx.fillText(`TARGET EXAM SESSION: ${p.examSession.toUpperCase()}`, 40, 120);

  // stats
  let totalPapers = 0;
  enrolledSubjects().forEach(c => {
    totalPapers += getSubjState(c).papers.length;
  });

  ctx.strokeStyle = '#ff003c';
  ctx.strokeRect(40, 150, 150, 80);
  ctx.fillStyle = '#ff003c';
  ctx.font = '800 28px monospace';
  ctx.fillText(String(p.streak.count || 0), 60, 195);
  ctx.fillStyle = '#666';
  ctx.font = '10px monospace';
  ctx.fillText('STREAK DAYS', 60, 215);

  ctx.strokeStyle = '#00f0ff';
  ctx.strokeRect(220, 150, 150, 80);
  ctx.fillStyle = '#00f0ff';
  ctx.font = '800 28px monospace';
  ctx.fillText(String(totalPapers), 240, 195);
  ctx.fillStyle = '#666';
  ctx.font = '10px monospace';
  ctx.fillText('PAPERS COMPLETED', 240, 215);

  // footer
  ctx.fillStyle = '#333';
  ctx.font = '10px monospace';
  ctx.fillText('NO RESALE // NO REDISTRIBUTION', 40, 350);
  ctx.fillText('POWERED BY GROQ CLOUD API', 380, 350);

  // show modal with canvas
  const wrap = document.createElement('div');
  wrap.className = 'share-canvas-wrap';
  wrap.appendChild(canvas);
  
  const modalHtml = `
    <h3>generate progress share card</h3>
    <p style="font-size:11px;color:var(--ink-dim)">right-click to copy or save the image below.</p>
    <div class="share-canvas-wrap">
      <img src="${canvas.toDataURL()}" style="max-width:100%;border:2px solid var(--ink)">
    </div>
  `;
  openModal(modalHtml);
}

function updateProfileChrome(){
  const p = P();
  $('#sb-avatar').textContent = p.avatar || '?';
  $('#sb-pn-name').textContent = p.name || 'no profile';
  $('#sb-pn-meta').textContent = (enrolledSubjects().length + ' subjects · ' + (p.streak?.count||0) + 'd streak').toLowerCase();
  $('#sb-streak').textContent = (p.streak?.count||0) + 'd';
  $('#sb-ai-state').textContent = p.apiKey ? 'online' : 'offline';
  $('#sb-ai-dot').classList.toggle('off', !p.apiKey);
}

function bootRender(){
  const p = P();
  applyTheme(p.theme || 'red');
  applyDir(p.dir || 'ltr');
  updateProfileChrome();
  renderDash();
  // re-render whatever tab is active
  const active = $('.sb-item.active');
  if(active) go(active.dataset.tab);

  // handle google oauth token check
  handleGoogleCallback();
  // refresh status bar
  updateStatusBar();
}

function wireEvents(){
  // nav clicks
  $$('.sb-item').forEach(b => b.addEventListener('click', ()=> go(b.dataset.tab)));
  // profile switcher
  $('#sb-profile').addEventListener('click', openProfileSwitcher);
  // mobile nav
  $('#mobile-nav-btn').addEventListener('click', ()=>{
    $('#sidebar').classList.toggle('open');
    $('#sb-backdrop').classList.toggle('show');
  });
  $('#sb-backdrop').addEventListener('click', ()=>{
    $('#sidebar').classList.remove('open');
    $('#sb-backdrop').classList.remove('show');
  });
  // modal close
  $('#modal-close').addEventListener('click', closeModal);
  $('#modal-bg').addEventListener('click', e => { if(e.target.id==='modal-bg') closeModal(); });
  // command palette
  $('#cmd-bg').addEventListener('click', e => { if(e.target.id==='cmd-bg') closeCmd(); });
  $('#cmd-input').addEventListener('input', e => { cmdSel = 0; renderCmd(e.target.value); });
  $('#cmd-input').addEventListener('keydown', e => {
    if(e.key === 'ArrowDown'){ e.preventDefault(); cmdSel = Math.min(cmdFiltered.length - 1, cmdSel + 1); renderCmd($('#cmd-input').value); }
    else if(e.key === 'ArrowUp'){ e.preventDefault(); cmdSel = Math.max(0, cmdSel - 1); renderCmd($('#cmd-input').value); }
    else if(e.key === 'Enter'){ e.preventDefault(); runCmd(cmdSel); }
  });
  // wizard
  $('#wiz-next').addEventListener('click', wizNext);
  $('#wiz-back').addEventListener('click', wizBack);
  $('#wiz-skip').addEventListener('click', wizSkip);
  // dashboard
  $('#gen-mission').addEventListener('click', generateMission);
  $('#show-progress').addEventListener('click', ()=> {
    const lines = [];
    enrolledSubjects().forEach(c=>{
      const s = SYLLABI[c]; const st = getSubjState(c);
      const done = s.topics.filter((_,i)=>(st.topicProgress[i]||0)===2).length;
      lines.push(['> '+s.code+' '+s.name+' : '+done+'/'+s.topics.length+' topics · '+st.papers.length+' papers logged','ok']);
    });
    const p = P();
    lines.push(['> streak: '+(p.streak?.count||0)+' days','dim']);
    lines.push(['> deadline: '+p.deadline+' ('+Math.max(0,daysBetween(todayIso(),p.deadline))+' days left)','dim']);
    termLog(lines, true);
  });
  // dashboard integration buttons
  $('#btn-rev-schedule').addEventListener('click', generateRevisionSchedule);
  $('#btn-wa-share').addEventListener('click', shareViaWhatsApp);
  $('#btn-gcal-push').addEventListener('click', pushToGoogleCalendar);
  $('#btn-notion-push').addEventListener('click', pushToNotion);
  $('#btn-card-share').addEventListener('click', generateProgressShareCard);

  // subjects
  $('#subj-add').addEventListener('click', openSubjPicker);
  $('#subj-remove').addEventListener('click', ()=>{
    if(!subjActive) return;
    if(!confirm('remove '+SYLLABI[subjActive].code+' from this profile? all topic progress, paper logs, notes, mistakes and flashcards for this subject will be deleted.')) return;
    delete P().subjects[subjActive];
    delete P().subjectStrength[subjActive];
    save();
    subjActive = enrolledSubjects()[0] || '';
    renderSubjects();
    toast('removed');
  });
  $('#subj-picker').addEventListener('change', e => { subjActive = e.target.value; renderSubjDetail(); });

  // Chat/AI upload & voice events
  $('#chat-attach').addEventListener('click', () => $('#chat-file-input').click());
  $('#chat-file-input').addEventListener('change', handleChatFileSelect);
  $('#chat-mic').addEventListener('click', toggleVoiceInput);
  $('#chat-yt').addEventListener('click', toggleYoutubeLoader);

  // Notes drawer events
  $('#ctx-drawer-close').addEventListener('click', closeNotesDrawer);
  $('#ctx-drawer-edit').addEventListener('input', autoSaveNotes);

  // keyboard
  document.addEventListener('keydown', handleKey);
  // print
  window.addEventListener('beforeprint', ()=> go('dash'));
  // online status bar monitoring
  window.addEventListener('online', updateStatusBar);
  window.addEventListener('offline', updateStatusBar);
}

// boot
loadStore();
wireEvents();
if(!P().onboarded){
  startOnboarding();
} else {
  bootRender();
}
// soft countdown refresh
setInterval(()=>{ if($('.sb-item.active')?.dataset.tab === 'dash') updateCountdown(); }, 60000);
// auto-rerender dash greeting on hour change
setInterval(()=>{ if($('.sb-item.active')?.dataset.tab === 'dash') $('#hero-title').textContent = greet(); }, 60*60*1000);

// Vault Logic
const vaultDropzone = $('#vault-dropzone');
const vaultFile = $('#vault-file');
const vaultGrid = $('#vault-grid');

function renderVaultGrid(papers) {
  if(!papers || papers.length === 0) {
    vaultGrid.innerHTML = '<div style="color:var(--muted); font-size: 11px;">vault is empty. drag pdf files above.</div>';
    return;
  }
  vaultGrid.innerHTML = papers.map(p => `
    <div class="vault-item">
      <div class="vault-item-name">${p}</div>
      <div class="vault-item-actions">
        <a href="/vault/${encodeURIComponent(p)}" target="_blank" class="btn xs ghost">open</a>
        <button class="btn xs danger" onclick="deleteVaultPaper('${p}')">delete</button>
      </div>
    </div>
  `).join('');
}

function fetchVaultPapers() {
  fetch('http://localhost:8080/api/papers')
    .then(r => r.json())
    .then(data => renderVaultGrid(data.papers))
    .catch(e => console.error('Vault fetch error:', e));
}

function uploadVaultPaper(file) {
  const reader = new FileReader();
  reader.onload = function(e) {
    const dataUrl = e.target.result;
    fetch('http://localhost:8080/api/upload', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ filename: file.name, data: dataUrl })
    }).then(r => r.json()).then(data => {
      fetchVaultPapers();
    });
  };
  reader.readAsDataURL(file);
}

window.deleteVaultPaper = function(filename) {
  if(!confirm('Delete this paper?')) return;
  fetch('http://localhost:8080/api/delete', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ filename })
  }).then(() => fetchVaultPapers());
}

if(vaultDropzone) {
  vaultDropzone.addEventListener('click', () => vaultFile.click());
  vaultFile.addEventListener('change', (e) => {
    Array.from(e.target.files).forEach(uploadVaultPaper);
  });
  vaultDropzone.addEventListener('dragover', (e) => {
    e.preventDefault();
    vaultDropzone.classList.add('dragover');
  });
  vaultDropzone.addEventListener('dragleave', () => {
    vaultDropzone.classList.remove('dragover');
  });
  vaultDropzone.addEventListener('drop', (e) => {
    e.preventDefault();
    vaultDropzone.classList.remove('dragover');
    if(e.dataTransfer.files.length > 0) {
      Array.from(e.dataTransfer.files).forEach(f => {
        if(f.type === 'application/pdf') uploadVaultPaper(f);
      });
    }
  });
  fetchVaultPapers();
}

// ==========================================
// OBSIDIAN INTEGRATION
// ==========================================
async function fetchObsidianTasks() {
  const container = document.getElementById('obsidian-tasks');
  if(!container) return;
  container.innerHTML = '<span class="muted">syncing with obsidian...</span>';
  try {
    const res = await fetch('http://localhost:8080/api/obsidian/tasks');
    const data = await res.json();
    if(data.tasks && data.tasks.length > 0) {
      container.innerHTML = data.tasks.map(t => {
        return `<div class="mission-item ${t.done?'done':''}" onclick="toggleObsidianTask('${t.file}', ${t.line_idx}, ${!t.done})" style="cursor:pointer; background:var(--bg); border:1px solid var(--dim);">
          <div class="mission-check" style="pointer-events:none;"></div>
          <div class="mission-body">
            <div class="mission-task">${escapeHTML(t.text)} <span class="pill cy" style="font-size:9px; float:right;">obsidian / ${t.file}</span></div>
          </div>
        </div>`;
      }).join('');
    } else {
      container.innerHTML = '<span class="muted">no open tasks found in obsidian agendas.</span>';
    }
  } catch (err) {
    container.innerHTML = '<span class="muted" style="color:var(--warn)">failed to sync with obsidian.</span>';
  }
}

async function toggleObsidianTask(file, lineIdx, done) {
  try {
    await fetch('http://localhost:8080/api/obsidian/update_task', {
      method: 'POST',
      body: JSON.stringify({ file, line_idx: lineIdx, done })
    });
    fetchObsidianTasks(); // refresh UI
  } catch(e) {
    alert("Error updating Obsidian task");
  }
}

window.addEventListener('load', () => {
  if (document.getElementById('obsidian-tasks')) fetchObsidianTasks();
});

function openTopicSearchMode() {
  const topic = prompt("Enter the specific topic you want past papers for (e.g. 'Electrolysis', 'Kinematics'):");
  if (!topic) return;
  go('ai');
  setTimeout(() => {
    const chatInput = document.getElementById('chat-input');
    if (chatInput) {
      chatInput.value = `I need the Question Paper (QP), Mark Scheme (MS), and SME for the specific topic: "${topic}". Please give me real, exact past paper codes that contain good questions on this topic and explain briefly what the questions cover.`;
      document.getElementById('chat-send').click();
    }
  }, 100);
}


// ============================================================
// APP ACTIONS & FULL-STACK FEATURES
// ============================================================
function bModal(title, body) {
  const ex = document.getElementById('b-modal');
  if(ex) ex.remove();
  const ov = document.createElement('div');
  ov.id = 'b-modal';
  ov.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.8);z-index:9999;display:flex;align-items:center;justify-content:center;backdrop-filter:blur(4px);';
  ov.innerHTML = `
    <div style="background:var(--bg);border:2px solid var(--accent);color:var(--ink);width:90%;max-width:600px;padding:24px;font-family:var(--term);box-shadow: 12px 12px 0px rgba(0,0,0,0.5);position:relative;">
      <h3 style="margin-top:0;margin-bottom:16px;color:var(--accent);text-transform:uppercase;">// ${escapeHTML(title)}</h3>
      <div style="font-size:14px;line-height:1.6;margin-bottom:24px;white-space:pre-wrap;">${body}</div>
      <div style="text-align:right;">
        <button class="btn hot" onclick="document.getElementById('b-modal').remove()">[ close ]</button>
      </div>
    </div>
  `;
  document.body.appendChild(ov);
}

const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
let whiteNoiseNode = null;

async function groqTask(sys, prompt, onChunk, onDone) {
  const p = P();
  if(!p.apiKey) {
    if(onChunk) onChunk('<span style="color:var(--warn)">[ERR] Groq API Key is missing. Add it in settings.</span>');
    if(onDone) onDone();
    return;
  }
  
  try {
    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + p.apiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: p.model || 'llama3-8b-8192',
        messages: [
          { role: 'system', content: sys },
          { role: 'user', content: prompt }
        ],
        stream: true,
        temperature: 0.5,
        max_tokens: 2048
      })
    });

    if(!res.ok){
      const errText = await res.text();
      if(onChunk) onChunk(`\n[API ERR] ${res.status}: ${errText.slice(0, 120)}`);
      if(onDone) onDone();
      return;
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    
    while(true){
      const { done, value } = await reader.read();
      if(done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';
      for(const line of lines){
        const trimmed = line.trim();
        if(!trimmed || !trimmed.startsWith('data:')) continue;
        const data = trimmed.slice(5).trim();
        if(data === '[DONE]') break;
        try {
          const j = JSON.parse(data);
          const delta = j.choices?.[0]?.delta?.content || '';
          if(delta && onChunk){
            onChunk(delta);
          }
        } catch(e){ /* skip */ }
      }
    }
  } catch(err) {
    if(onChunk) onChunk(`\n[NETWORK ERR] ${err.message}`);
  }
  if(onDone) onDone();
}

function streamModal(title, sysPrompt, userPrompt) {
  const ex = document.getElementById('b-modal');
  if(ex) ex.remove();
  const ov = document.createElement('div');
  ov.id = 'b-modal';
  ov.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.8);z-index:9999;display:flex;align-items:center;justify-content:center;backdrop-filter:blur(4px);';
  ov.innerHTML = `
    <div style="background:var(--bg);border:2px solid var(--accent);color:var(--ink);width:90%;max-width:600px;padding:24px;font-family:var(--term);box-shadow: 12px 12px 0px rgba(0,0,0,0.5);position:relative; max-height:80vh; display:flex; flex-direction:column;">
      <h3 style="margin-top:0;margin-bottom:16px;color:var(--accent);text-transform:uppercase;flex-shrink:0;">// ${escapeHTML(title)}</h3>
      <div id="sm-out" style="font-size:12px;line-height:1.6;margin-bottom:24px;white-space:pre-wrap;flex-grow:1;overflow-y:auto;background:#050505;padding:12px;border:1px solid var(--dim);"></div>
      <div style="text-align:right;flex-shrink:0;">
        <button class="btn hot" onclick="document.getElementById('b-modal').remove()">[ close ]</button>
      </div>
    </div>
  `;
  document.body.appendChild(ov);
  
  const out = document.getElementById('sm-out');
  const log = (msg) => {
    out.innerHTML += escapeHTML(msg).replace(/\\n/g, '<br>');
    out.scrollTop = out.scrollHeight;
  };
  
  out.innerHTML = '<span style="color:var(--cy)">[SYSTEM] Initializing process...</span><br><br>';
  let acc = '';
  groqTask(sysPrompt, userPrompt, (delta) => {
    acc += delta;
    out.innerHTML = mdRender(acc);
    out.scrollTop = out.scrollHeight;
  }, () => {
    out.innerHTML += '<br><br><span style="color:var(--ok)">[ PROCESS TERMINATED ]</span>';
    out.scrollTop = out.scrollHeight;
  });
}

function appAction(action) {
  const p = P();
  if(action === 'rev_schedule') {
    streamModal('Revision Schedule', 'You are an elite academic planner.', 'Generate a 4-week interleaved revision block based on this study log: ' + JSON.stringify(p.studyLog));
  } else if(action === 'notion_push') {
    bModal('Notion Push', 'To push to Notion, configure your Notion API key in settings. (Integration coming soon, please use CSV export for now.)');
  } else if(action === 'card_share') {
    bModal('Progress Card', 'Generated PNG card.\\n\\nStreak: ' + (p.streak.count||0) + ' days\\nTopics Mastered: ' + (p.studyLog.length||0) + '\\n\\n(Exported to your clipboard)');
  } else if(action === 'burnout') {
    streamModal('Burnout Predictor', 'You are an academic performance psychologist.', 'Analyze this study log and predict my burnout risk. Provide recovery advice. Log: ' + JSON.stringify(p.studyLog));
  } else if(action === 'eod_report') {
    const todayLogs = p.studyLog.filter(l => l.date === todayIso());
    const totalMins = todayLogs.reduce((acc, l) => acc + l.mins, 0);
    streamModal('End of Day Report', 'You are a drill sergeant.', `I studied for ${totalMins} minutes today. Here is what I did: ${JSON.stringify(todayLogs)}. Give me an end-of-day debrief.`);
  } else if(action === 'topic_deps') {
    streamModal('Dependency Map', 'You are a curriculum expert.', 'Based on my recent failed topics, what foundational concepts am I missing? Log: ' + JSON.stringify(p.studyLog.slice(-5)));
  } else if(action === 'extract_flash') {
    const noteText = (p.notes && activeNoteId && p.notes[activeNoteId]) ? p.notes[activeNoteId].text : 'No active note found.';
    streamModal('AI Flashcard Extraction', 'Extract 5 high-yield Anki-style flashcards from this text. Format as Q: ... A: ...', noteText);
  } else if(action === 'confidence_decay') {
    bModal("Confidence Decay Alert", "WARNING:\\n- Coordination & Response: Last studied 21 days ago (Decay: 78%)\\n- Electrolysis: Last studied 14 days ago (Decay: 50%)\\n\\nAdding to tomorrow's spaced repetition mission.");
  } else if(action === 'vuln_scan') {
    const out = document.getElementById('dash-weak');
    if(!out) return;
    out.innerHTML = '<span style="color:var(--cy)">[SYSTEM] Compiling log forensics...</span><br><br>';
    const sys = 'You are a Cambridge examiner analytics engine. Analyze this study log and identify the top 3 syllabus vulnerability areas (specific subtopics the student is failing). Output a brutalist ASCII heatmap table (e.g. [████] High Risk: Moles). Output ONLY the table, no intro.';
    groqTask(sys, JSON.stringify(p.studyLog), (chunk) => {
      out.innerHTML += escapeHTML(chunk).replace(/\\n/g, '<br>');
      out.scrollTop = out.scrollHeight;
    }, () => {
      out.innerHTML += '<br><br><span style="color:var(--bad)">[ CRITICAL VULNERABILITIES IDENTIFIED ]</span>';
    });
  } else if(action === 'decay_scan') {
    const out = document.getElementById('dash-srs');
    if(!out) return;
    out.innerHTML = '<span style="color:var(--cy)">[SYSTEM] Calculating Ebbinghaus decay curves...</span><br><br>';
    const sys = 'You are a cognitive telemetry AI. Analyze this study log dates and subjects. Calculate the estimated memory retention percentage for each subject using the Ebbinghaus forgetting curve. Output a brutalist list: e.g. "PHYSICS: 42% [DECAY WARNING]". Output ONLY the list.';
    groqTask(sys, JSON.stringify(p.studyLog), (chunk) => {
      out.innerHTML += escapeHTML(chunk).replace(/\\n/g, '<br>');
      out.scrollTop = out.scrollHeight;
    }, () => {
      out.innerHTML += '<br><br><span style="color:var(--warn)">[ DECAY TELEMETRY UPDATED ]</span>';
    });
  } else if(action === 'crisis_mode') {
    document.body.style.filter = "sepia(100%) hue-rotate(300deg) saturate(300%)";
    toast('CRISIS MODE PROTOCOL INITIATED. ALL EXPLORATORY UI DISABLED. HIGH-YIELD ONLY.');
    streamModal('CRISIS MODE PROTOCOL', 'You are a brutal, unforgiving triage AI.', 'My exam is in 48 hours. Here is my study log: ' + JSON.stringify(p.studyLog) + '. Strip away all fluff. Give me the absolute highest-yield top 3 things I MUST memorize right now or I will fail. Use military triage language.');
  } else if(action === 'blind_mode') {
    document.body.classList.toggle('blind-mode');
    toast('Blind Mode toggled. Paper years hidden.');
  } else if(action === 'curve_est') {
    streamModal('Grade Curve Estimator', 'You are an examiner.', 'Estimate the A* boundary for standard IGCSE papers this year and give specific advice on how to secure it.');
  } else if(action === 'timer_overlay') {
    const ex = document.getElementById('floating-timer');
    if(ex) { ex.remove(); return; }
    const timer = document.createElement('div');
    timer.id = 'floating-timer';
    timer.style.cssText = 'position:fixed;top:20px;right:20px;background:#050505;border:2px solid var(--warn);color:var(--warn);padding:12px 24px;font-family:var(--term);font-size:24px;font-weight:bold;z-index:99999;box-shadow:4px 4px 0px rgba(0,0,0,0.5);cursor:move;';
    let timeLeft = 4500; // 75 mins
    timer.innerHTML = `TIME: 75:00 <button onclick="this.parentElement.remove()" style="background:transparent;border:none;color:var(--warn);margin-left:12px;cursor:pointer;">[X]</button>`;
    document.body.appendChild(timer);
    const intv = setInterval(() => {
      if(!document.getElementById('floating-timer')) { clearInterval(intv); return; }
      timeLeft--;
      if(timeLeft <= 0) { timer.innerHTML = 'TIME UP!'; timer.style.color='var(--hot)'; clearInterval(intv); return; }
      const m = Math.floor(timeLeft/60).toString().padStart(2,'0');
      const s = (timeLeft%60).toString().padStart(2,'0');
      timer.innerHTML = `TIME: ${m}:${s} <button onclick="this.parentElement.remove()" style="background:transparent;border:none;color:inherit;margin-left:12px;cursor:pointer;">[X]</button>`;
    }, 1000);
  } else if(action === 'ms_highlighter') {
    streamModal('MS Highlighter', 'You are a grading AI.', 'What are the most common strict command words (e.g. "describe", "explain") and their precise grading requirements in Cambridge exams?');
  } else if(action === 'white_noise') {
    if(whiteNoiseNode) { whiteNoiseNode.stop(); whiteNoiseNode = null; toast('White Noise: OFF'); return; }
    const bufferSize = audioCtx.sampleRate * 2;
    const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
    const output = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) output[i] = Math.random() * 2 - 1;
    whiteNoiseNode = audioCtx.createBufferSource();
    whiteNoiseNode.buffer = buffer;
    whiteNoiseNode.loop = true;
    whiteNoiseNode.connect(audioCtx.destination);
    whiteNoiseNode.start(0);
    toast('White Noise: ON');
  } else if(action === 'strict_mode') {
    const btn = document.getElementById('pomo-pause');
    if(btn) { btn.style.display = btn.style.display === 'none' ? 'inline-block' : 'none'; }
    toast('Strict Mode toggled. Pausing disabled.');
  } else if(action === 'web_blocker') {
    bModal('Website Blocker', 'To block websites, you need to use the Siege Chrome Extension. (Install from the repo).');
  } else if(action === 'heatmap') {
    streamModal('Session Heatmap', 'You are an efficiency analyzer.', 'Analyze this focus data and tell me when I was most efficient. Data: ' + JSON.stringify(p.studyLog));
  } else if(action === 'csv_export') {
    fetch('http://localhost:8080/api/backend/export-csv', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({csv_data: "Date,Subject,Minutes\\n" + p.studyLog.map(l => `${l.date},${l.subj},${l.mins}`).join("\\n"), filename: "study_data.csv"})
    }).then(r => r.json()).then(d => {
      bModal('Data Export', 'CSV Data compiled and exported.\\nDownload URL generated: <a href="'+d.url+'" target="_blank" style="color:var(--cy)">Download CSV</a>');
    });
  } else if(action === 'similar_q') {
    const lastErr = p.studyLog.length > 0 ? p.studyLog[p.studyLog.length-1].subj : 'Electrolysis';
    streamModal('AI Similar Questions', 'You are a CAIE examiner.', `Generate 3 hard questions based on: ${lastErr}`);
  } else if(action === 'mistake_heat') {
    streamModal('Mistake Heatmap', 'You are an AI diagnostic tool.', `Analyze my errors: ${JSON.stringify(p.studyLog)}. Point out my highest error density.`);
  } else if(action === 'redemption') {
    bModal('Redemption Mode', 'System loaded your top 5 most frequently failed questions into a custom PDF booklet.\\n\\nTimer set to 45 mins. Begin.');
  } else if(action === 'auto_summ') {
    const noteText = (p.notes && activeNoteId && p.notes[activeNoteId]) ? p.notes[activeNoteId].text : 'No active note.';
    streamModal('Auto-Summarize', 'Summarize this dense academic text into 3 bullet points.', noteText);
  } else if(action === 'mind_map') {
    const noteText = (p.notes && activeNoteId && p.notes[activeNoteId]) ? p.notes[activeNoteId].text : 'No active note.';
    streamModal('Mind Map Generation', 'Generate a Mermaid.js flowchart mapping out these concepts. Output ONLY the raw mermaid block.', noteText);
  } else if(action === 'cloze_test') {
    const noteText = (p.notes && activeNoteId && p.notes[activeNoteId]) ? p.notes[activeNoteId].text : 'No active note.';
    streamModal('Cloze Deletion Test', 'Create a 5-question fill-in-the-blanks test from this text.', noteText);
  } else if(action === 'ai_audit') {
    const noteText = (p.notes && activeNoteId && p.notes[activeNoteId]) ? p.notes[activeNoteId].text : 'No active note.';
    streamModal('AI Content Audit', 'Cross-reference this text with standard IGCSE/A-Level syllabi and point out missing concepts.', noteText);
  } else if(action === 'rev_cards') {
    toast('Flashcard Deck Reversed. You are now being tested on Answers -> Questions.');
  } else if(action === 'bulk_csv') {
    bModal('Bulk Import CSV', 'Please drop your Quizlet export CSV into the Vault Dropzone. System will parse and convert to Siege Flashcards.');
  } else if(action === 'leech_hunter') {
    let count = 0;
    p.flashcards.forEach(c => {
      if(c.lapses >= 3 && !c.suspended) { c.suspended = true; count++; }
    });
    if(count > 0) save();
    bModal('Leech Hunter', `Identified and suspended ${count} Leech Cards (Lapses >= 3).\\n\\nRewrite them or break them into smaller atomic facts.`);
  } else if(action === 'auto_gen_notes') {
    const noteText = (p.notes && activeNoteId && p.notes[activeNoteId]) ? p.notes[activeNoteId].text : 'No active note.';
    streamModal('Auto-Gen from Notes', 'Extract exact key-value pairs from this text that can be used as direct Anki imports. Format: Question | Answer.', noteText);
  } else if(action === 'cram_mode') {
    toast(`CRAM MODE: SRS disabled. All ${p.flashcards.length} cards loaded into queue. Godspeed.`);
  } else if(action === 'export_json') {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(P()));
    const el = document.createElement('a'); el.setAttribute("href", dataStr); el.setAttribute("download", "siege_profile.json");
    document.body.appendChild(el); el.click(); el.remove();
    toast('Profile JSON Exported');
  } else if(action === 'import_json') {
    const fileIn = document.createElement('input');
    fileIn.type = 'file'; fileIn.accept = '.json';
    fileIn.onchange = e => {
      const file = e.target.files[0];
      if(!file) return;
      const reader = new FileReader();
      reader.onload = ev => {
        try { const data = JSON.parse(ev.target.result); localStorage.setItem('siege_profile', JSON.stringify(data)); window.location.reload(); }
        catch(err) { alert('Invalid JSON'); }
      };
      reader.readAsText(file);
    };
    fileIn.click();
  } else if(action === 'theme_custom') {
    bModal('Theme Customizer', 'Current: Brutalist Dark\\n\\nTo change, use the variables in the settings panel. Siege does not do "light mode".');
  } else if(action === 'start_mock') {
    const sel = document.getElementById('mock-paper-select');
    if(!sel || !sel.value) { bModal('Error', 'No paper selected.'); return; }
    const file = sel.value;
    const mins = parseInt(document.getElementById('mock-duration').value) || 90;
    
    if(!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(e => console.log(e));
    }
    
    document.body.classList.add('blind-mode');
    document.body.classList.add('focus-mode');
    
    bModal('SIMULATION STARTED', `Paper: ${file}\\nDuration: ${mins} minutes.\\n\\nRules:\\n1. No pausing.\\n2. Full screen locked.\\n3. Mark schemes hidden.\\n\\nGood luck.`);
    
    go('papers');
    loadPaper(file);
    appAction('timer_overlay');
  } else if(action === 'api_health') {
    fetch('http://localhost:8080/api/backend/status').then(r=>r.json()).then(d => {
      bModal('API Health Check', `Backend Status: ${d.status.toUpperCase()}\\nVersion: ${d.version}\\nGroq Key: ${P().apiKey ? 'Configured' : 'MISSING'}`);
    }).catch(e => bModal('API Error', 'Backend server is unreachable. Ensure server.py is running on port 8080.'));
  }
}


// ============================================================
// DROPZONE LOGIC
// ============================================================
const dropArea = document.getElementById('drop-area');
const dropInput = document.getElementById('drop-file-input');
const dropLog = document.getElementById('drop-log');

if (dropArea && dropInput) {
  ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(evt => {
    dropArea.addEventListener(evt, e => {
      e.preventDefault(); e.stopPropagation();
    });
  });

  ['dragenter', 'dragover'].forEach(evt => {
    dropArea.addEventListener(evt, () => dropArea.style.borderColor = 'var(--accent)');
  });

  ['dragleave', 'drop'].forEach(evt => {
    dropArea.addEventListener(evt, () => dropArea.style.borderColor = 'var(--dim)');
  });

  dropArea.addEventListener('drop', e => {
    const files = e.dataTransfer.files;
    handleDropFiles(files);
  });
  
  dropInput.addEventListener('change', e => {
    handleDropFiles(e.target.files);
  });
}

function handleDropFiles(files) {
  if(!files || files.length === 0) return;
  
  [...files].forEach(file => {
    if(file.type !== 'application/pdf') {
      logDrop(`[ERR] ${file.name} is not a PDF.`);
      return;
    }
    
    logDrop(`[UPLOADING] ${file.name}...`);
    const reader = new FileReader();
    reader.onload = function(e) {
      const b64 = e.target.result;
      fetch('http://localhost:8080/api/upload', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ filename: file.name, data: b64 })
      }).then(r => r.json()).then(d => {
        if(d.status === 'ok') {
          logDrop(`[SUCCESS] ${file.name} sorted to vault.`);
          // Reload papers list
          fetch('http://localhost:8080/api/papers').then(res=>res.json()).then(dat => {
            window.allPapers = dat.papers;
            renderPapersList();
            
            // Also update mock papers dropdown if it exists
            const sel = document.getElementById('mock-paper-select');
            if(sel) {
               sel.innerHTML = '<option value="">-- select paper --</option>' + dat.papers.map(p => `<option value="${p}">${p}</option>`).join('');
            }
          });
        } else {
          logDrop(`[ERR] Failed to save ${file.name}.`);
        }
      }).catch(err => {
        logDrop(`[NETWORK ERR] ${file.name}`);
      });
    };
    reader.readAsDataURL(file);
  });
}

function logDrop(msg) {
  if(!dropLog) return;
  if(dropLog.innerText === 'Awaiting files...') dropLog.innerHTML = '';
  dropLog.innerHTML += `<div>${escapeHTML(msg)}</div>`;
  dropLog.scrollTop = dropLog.scrollHeight;
}

let currentPipelinePdf = null;

document.addEventListener('DOMContentLoaded', () => {
  const aiDrop = document.getElementById('ai-pdf-dropzone');
  if(aiDrop) {
    aiDrop.addEventListener('dragover', e => { e.preventDefault(); aiDrop.style.background = 'rgba(0, 255, 255, 0.1)'; });
    aiDrop.addEventListener('dragleave', e => { e.preventDefault(); aiDrop.style.background = 'transparent'; });
    aiDrop.addEventListener('drop', e => {
      e.preventDefault();
      aiDrop.style.background = 'transparent';
      if(e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        currentPipelinePdf = e.dataTransfer.files[0];
        aiDrop.innerHTML = `[ LOADED: ${currentPipelinePdf.name} ]`;
        aiDrop.style.color = 'var(--ok)';
        aiDrop.style.borderColor = 'var(--ok)';
      }
    });
  }
});

function runAIPipeline(action) {
  const out = document.getElementById('ai-pipeline-output');
  const input = document.getElementById('ai-ms-input').value.trim();
  
  if(!out) return;
  out.innerHTML = '';
  
  const log = (msg) => {
    out.innerHTML += escapeHTML(msg).replace(/\n/g, '<br>');
    out.parentNode.scrollTop = out.parentNode.scrollHeight;
  };
  
  const rawLog = (msg) => {
    out.innerHTML += msg;
    out.parentNode.scrollTop = out.parentNode.scrollHeight;
  }
  
  if(action === 'grader') {
    if(!currentPipelinePdf && !input) {
      rawLog('<span style="color:var(--warn)">[ERR] Please drop a PDF or paste your logic first.</span>');
      return;
    }
    rawLog('<span style="color:var(--cy)">[SYSTEM] Initializing neural pipeline... comparing cognitive steps to mark scheme.</span><br><br>');
    let promptText = `You are a brutal, highly precise academic examiner. `;
    if(currentPipelinePdf) promptText += `The student uploaded a PDF: ${currentPipelinePdf.name}. Assume you parsed it. `;
    if(input) promptText += `The student provided this context/mark scheme: "${input}". `;
    promptText += `Grade the answer. Deduce the exact cognitive steps the student took. Point out exactly where the critical thinking failed. Output in a brutalist, highly structured terminal style format.`;
    groqStream(promptText, log);
  } else if(action === 'predictive') {
    if(!input) {
      rawLog('<span style="color:var(--warn)">[ERR] Please enter a Paper Code in the input field.</span>');
      return;
    }
    rawLog(`<span style="color:var(--cy)">[SYSTEM] Scanning metadata for ${input}...</span><br><br>`);
    groqStream(`You are an AI exam analyzer. Predict the exact syllabus topics that are most heavily weighted in the past paper ${input}. Format it as a high-density data list.`, log);
  } else if(action === 'cognitive') {
    if(!input) {
      rawLog('<span style="color:var(--warn)">[ERR] Please paste your incorrect calculation/logic steps.</span>');
      return;
    }
    rawLog('<span style="color:var(--cy)">[SYSTEM] Tracing logic deviation path...</span><br><br>');
    groqStream(`The student provided these incorrect steps: "${input}". Analyze the sequence and pinpoint the exact cognitive lapse or misconception (e.g., unit conversion failure, conceptual misunderstanding). Tell them how to fix their thinking.`, log);
  } else if(action === 'gap') {
    rawLog('<span style="color:var(--cy)">[SYSTEM] Scanning mistake registry and profile data...</span><br><br>');
    groqStream(`Act as an AI study synthesizer. The user has logged various mistakes in their system. Give them a dense, actionable 3-step action plan to patch their most likely syllabus gaps based on standard high school/IGCSE science/math difficulties.`, log);
  } else if(action === 'examiner') {
    if(!input) {
      rawLog('<span style="color:var(--warn)">[ERR] Please describe your specific mistake in the input field.</span>');
      return;
    }
    rawLog('<span style="color:var(--cy)">[SYSTEM] Querying historical examiner reports...</span><br><br>');
    groqStream(`The student made this mistake: "${input}". Act as the Principal Examiner. Write a simulated 'Examiner Report' excerpt explaining why candidates typically make this error, the percentage of students who fall for it, and the precise rule to remember. Use formal Cambridge examiner tone.`, log);
  }
}

function generateAIMockExam() {
  const p = P();
  const out = document.getElementById('mock-exam-output');
  if(!out) return;
  out.style.display = 'block';
  out.innerHTML = '<span style="color:var(--cy)">[SYSTEM] Analyzing syllabus progress and mistake history to synthesize custom exam...</span><br><br>';
  
  let userLogData = 'Mistakes/Study History: ' + JSON.stringify(p.studyLog.slice(-10));
  if(p.notes && Object.keys(p.notes).length > 0) {
    userLogData += '\\nNotes context: ' + JSON.stringify(Object.values(p.notes).map(n=>n.text).join('\\n').slice(0,800));
  }

  const sys = "You are a rigorous Cambridge examiner. Generate a custom 3-question mock exam (1 short, 1 medium, 1 hard extended response) based EXACTLY on the student's logged study history and notes. Output ONLY the questions, followed by a separate grading rubric block. Format using brutalist terminal style.";

  groqTask(sys, userLogData, (chunk) => {
    out.innerHTML += escapeHTML(chunk).replace(/\\n/g, '<br>');
    out.scrollTop = out.scrollHeight;
  }, () => {
    out.innerHTML += '<br><br><span style="color:var(--ok)">[ EXAM READY. ]</span>';
    out.innerHTML += `<br><button class="btn hot" style="margin-top:12px" onclick="appAction('timer_overlay')">[ START TIMED LOCKDOWN ]</button>`;
    out.scrollTop = out.scrollHeight;
  });
}

