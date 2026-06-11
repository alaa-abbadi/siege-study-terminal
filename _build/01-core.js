/* ===== MODULE 01: Core — state, persistence, log, utils, bus ===== */
const Core = (() => {
  'use strict';

  const PREFIX = 'siege_';
  const KEYS = ['domains','config','log','missions','missionsDate','streaks',
                'habits','briefing','debriefs','proofHashes','aiNotes'];

  const DOMAINS = ['chess','igcse','outreach','gym','building','mun'];
  const META = {
    chess:    { name:'CHESS',    sym:'♟' },
    igcse:    { name:'IGCSE',    sym:'📐' },
    outreach: { name:'OUTREACH', sym:'☎' },
    gym:      { name:'GYM',      sym:'⚡' },
    building: { name:'BUILDING', sym:'🔨' },
    mun:      { name:'MUN',      sym:'🏛' }
  };
  const SUBJECTS = {
    chemistry:       { name:'CHEMISTRY',        code:'0620' },
    computerScience: { name:'COMPUTER SCIENCE', code:'0478' },
    english:         { name:'ENGLISH',          code:'0510' },
    arabic:          { name:'ARABIC',           code:'0508' }
  };

  // ---------- bus ----------
  const handlers = {};
  const Bus = {
    on(evt, fn)  { (handlers[evt] = handlers[evt] || []).push(fn); },
    off(evt, fn) { handlers[evt] = (handlers[evt] || []).filter(f => f !== fn); },
    emit(evt, data) {
      (handlers[evt] || []).forEach(fn => { try { fn(data); } catch (e) { console.error('[bus]', evt, e); } });
    }
  };

  // ---------- time ----------
  const now = () => new Date();
  const iso = () => new Date().toISOString();
  const dayKey = (d) => {
    const x = d instanceof Date ? d : new Date(d);
    const p = (n) => String(n).padStart(2, '0');
    return `${x.getFullYear()}-${p(x.getMonth() + 1)}-${p(x.getDate())}`;
  };
  const todayKey = () => dayKey(new Date());
  const daysAgo = (n) => { const d = new Date(); d.setDate(d.getDate() - n); return dayKey(d); };
  const hoursSince = (isoStr) => {
    if (!isoStr) return 0;
    const t = new Date(isoStr).getTime();
    if (isNaN(t)) return 0;
    return Math.max(0, (Date.now() - t) / 3600000);
  };
  const MONTHS = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];
  const fmtDate = (dk) => {
    if (!dk) return '—';
    const [, m, d] = dk.split('-').map(Number);
    return `${MONTHS[(m || 1) - 1]} ${d}`;
  };
  const fmtTime = (isoStr) => {
    const d = new Date(isoStr);
    if (isNaN(d.getTime())) return '—';
    const p = (n) => String(n).padStart(2, '0');
    return `${p(d.getHours())}:${p(d.getMinutes())}`;
  };
  const fmtClock = (totalSec) => {
    totalSec = Math.max(0, Math.round(totalSec));
    const h = Math.floor(totalSec / 3600), m = Math.floor((totalSec % 3600) / 60), s = totalSec % 60;
    const p = (n) => String(n).padStart(2, '0');
    return h > 0 ? `${h}:${p(m)}:${p(s)}` : `${p(m)}:${p(s)}`;
  };

  // ---------- misc utils ----------
  const clamp = (n, lo, hi) => Math.min(hi, Math.max(lo, n));
  const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  const esc = (s) => String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  const md = (s) => esc(s)
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/\n/g, '<br>');
  const hash = (s) => {
    s = String(s == null ? '' : s).replace(/\s+/g, ' ').trim().toLowerCase();
    let h = 5381;
    for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) >>> 0;
    return h.toString(16);
  };

  // ---------- default state ----------
  const domainDefaults = () => ({
    health: 100, lastActive: iso(), lastDecayAt: iso(),
    streak: 0, totalSieges: 0, history: []
  });
  const subjectDefaults = (weak) => ({
    health: 100, lastActive: iso(), lastDecayAt: iso(), weakAreas: weak || [], scores: []
  });
  const defaultState = () => ({
    domains: {
      chess:    domainDefaults(),
      igcse:    Object.assign(domainDefaults(), { subjects: {
        chemistry:       subjectDefaults(['balancing equations', 'Brønsted-Lowry acids/bases']),
        computerScience: subjectDefaults(),
        english:         subjectDefaults(),
        arabic:          subjectDefaults()
      }}),
      outreach: Object.assign(domainDefaults(), { contacts: [], messagesSent: 0, replies: 0 }),
      gym:      Object.assign(domainDefaults(), { nextSplit: 'push', sessions: [] }),
      building: Object.assign(domainDefaults(), { projects: [
        { name: 'ReviewPilot', hours: 0 }, { name: 'Sinaan', hours: 0 },
        { name: 'Meridian', hours: 0 },   { name: 'Siege', hours: 0 }
      ]}),
      mun:      Object.assign(domainDefaults(), { papers: [] })
    },
    config: {
      apiKey: '', model: 'claude-sonnet-4-6', lichessUsername: '',
      wakeUpTime: '06:00', reviewTime: '22:00',
      durations: { chess: 25, igcse: 35, outreach: 15, gym: 60, building: 60, mun: 30 },
      decay: { warnPerDay: 10, critPerDay: 20, lockHours: 72 },
      enabled: { chess: true, igcse: true, outreach: true, gym: true, building: true, mun: true },
      onboarded: false
    },
    log: [],
    missions: [],
    missionsDate: null,
    streaks: { current: 0, longest: 0, lastFullDay: null },
    habits: {
      wake: { history: {} }, coldShower: { history: {} }, phone: { history: {} },
      prayer: { history: {} }, water: { history: {} }, sleep: { history: {} },
      reading: { history: {} }
    },
    briefing: { date: null, acked: false, data: null },
    debriefs: {},
    proofHashes: [],
    aiNotes: {}
  });

  // deep-merge stored data over defaults so schema additions never break old saves
  const merge = (def, val) => {
    if (Array.isArray(def) || Array.isArray(val)) return val !== undefined ? val : def;
    if (def && typeof def === 'object') {
      const out = {};
      const src = (val && typeof val === 'object') ? val : {};
      for (const k of new Set([...Object.keys(def), ...Object.keys(src)])) {
        out[k] = k in def ? merge(def[k], src[k]) : src[k];
      }
      return out;
    }
    return val !== undefined ? val : def;
  };

  let S = defaultState();

  const load = () => {
    const def = defaultState();
    const loaded = {};
    for (const k of KEYS) {
      try {
        const raw = localStorage.getItem(PREFIX + k);
        if (raw != null) loaded[k] = JSON.parse(raw);
      } catch (e) { console.error('[core] bad key', k, e); }
    }
    for (const k of KEYS) S[k] = merge(def[k], loaded[k]);
    return S;
  };

  const save = () => {
    if (S.log.length > 5000) S.log.length = 5000;
    if (S.proofHashes.length > 500) S.proofHashes.length = 500;
    for (const k of KEYS) {
      try { localStorage.setItem(PREFIX + k, JSON.stringify(S[k])); }
      catch (e) { console.error('[core] save failed', k, e); }
    }
    Bus.emit('state:saved');
  };

  const reset = () => {
    for (const k of Object.keys(localStorage)) {
      if (k.startsWith(PREFIX)) localStorage.removeItem(k);
    }
    sessionStorage.removeItem('siege_active');
    S = defaultState();
  };

  const log = (type, data = {}) => {
    const entry = Object.assign({ t: iso(), type }, data);
    S.log.unshift(entry);
    save();
    Bus.emit('log', entry);
    return entry;
  };

  const enabledDomains = () => DOMAINS.filter(d => S.config.enabled[d]);

  const exportJSON = () => {
    const out = { exportedAt: iso(), version: 2 };
    for (const k of KEYS) out[k] = S[k];
    return JSON.stringify(out, null, 2);
  };
  const importJSON = (str) => {
    try {
      const data = JSON.parse(str);
      if (!data || typeof data !== 'object' || !data.domains || !data.config) return false;
      const def = defaultState();
      for (const k of KEYS) { if (data[k] !== undefined) S[k] = merge(def[k], data[k]); }
      save();
      return true;
    } catch (e) { return false; }
  };

  return {
    get S() { return S; },
    KEYS, DOMAINS, META, SUBJECTS, Bus,
    load, save, reset, log,
    now, iso, dayKey, todayKey, daysAgo, hoursSince,
    fmtDate, fmtTime, fmtClock,
    clamp, uid, esc, md, hash,
    defaultState, enabledDomains, exportJSON, importJSON
  };
})();
