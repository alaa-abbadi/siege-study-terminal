/* ===== MODULE 06: Patterns — local avoidance-pattern detection (no AI, no DOM) ===== */
const Patterns = (() => {
  'use strict';

  const HARD = ['outreach', 'igcse'];          // the work he avoids
  const EASY = ['chess', 'building'];          // the work he hides in
  const DAY_MS = 86400000;
  const DEFAULT_PROJECTS = ['ReviewPilot', 'Sinaan', 'Meridian', 'Siege'];

  // ---------- defensive readers (fresh install must never throw) ----------
  const safeLog = () => (Core.S && Array.isArray(Core.S.log)) ? Core.S.log : [];
  const safeDomains = () => (Core.S && Core.S.domains && typeof Core.S.domains === 'object') ? Core.S.domains : {};

  const ms = (t) => {
    if (!t) return null;
    const n = new Date(t).getTime();
    return isNaN(n) ? null : n;
  };
  const dayOf = (t) => {
    const m = ms(t);
    return m == null ? null : Core.dayKey(new Date(m));
  };
  const domOf = (e) => {
    if (!e) return null;
    if (typeof e.domain === 'string') return e.domain;
    if (e.data && typeof e.data.domain === 'string') return e.data.domain;
    return null;
  };
  const isEnabled = (d) => {
    const c = Core.S && Core.S.config;
    return !!(c && c.enabled && c.enabled[d]);
  };
  const health = (d) => {
    const o = safeDomains()[d];
    const h = o && typeof o.health === 'number' && isFinite(o.health) ? o.health : 100;
    return Math.round(Core.clamp(h, 0, 100));
  };
  const projectNames = () => {
    const b = safeDomains().building;
    const list = b && Array.isArray(b.projects)
      ? b.projects.map(p => p && typeof p.name === 'string' ? p.name : '').filter(Boolean)
      : [];
    return list.length ? list : DEFAULT_PROJECTS.slice();
  };

  // ---------- completed-siege records, newest first ----------
  // {t, ms, day, domain, proof?, proofType?, objective, project?}
  // Domain histories carry proof per schema; log entries fill any gaps.
  // Dedup by domain + minute so a history entry and its log twin count once.
  const completions = () => {
    const out = [];
    const seen = new Set();
    const add = (t, domain, extra) => {
      const m = ms(t);
      if (m == null || !Core.DOMAINS.includes(domain)) return;
      const key = domain + '|' + Math.floor(m / 60000);
      if (seen.has(key)) return;
      seen.add(key);
      out.push(Object.assign({ t, ms: m, day: Core.dayKey(new Date(m)), domain }, extra));
    };
    const fields = (src) => ({
      proof:     typeof src.proof === 'string' ? src.proof : undefined,
      proofType: typeof src.proofType === 'string' ? src.proofType : undefined,
      objective: typeof src.objective === 'string' ? src.objective : '',
      project:   typeof src.project === 'string' ? src.project : undefined
    });
    const doms = safeDomains();
    for (const d of Core.DOMAINS) {
      const hist = doms[d] && Array.isArray(doms[d].history) ? doms[d].history : [];
      for (const h of hist) {
        if (!h || h.valid === false) continue;
        add(h.t, d, fields(h));
      }
    }
    for (const e of safeLog()) {
      if (!e || e.type !== 'siege:completed') continue;
      add(e.t, domOf(e), fields(e));
    }
    out.sort((a, b) => b.ms - a.ms);
    return out;
  };

  // Which project a building siege served. Prefer explicit field; else match
  // project names in objective/proof text, biased AGAINST 'Siege' to avoid
  // false hits on the word itself.
  const projectOf = (c) => {
    if (c && typeof c.project === 'string' && c.project) return c.project.toLowerCase();
    const text = (((c && c.objective) || '') + ' ' + ((c && c.proof) || '')).toLowerCase();
    if (!text.trim()) return null;
    const names = projectNames().map(n => n.toLowerCase());
    for (const n of names) {
      if (n !== 'siege' && text.includes(n)) return n;
    }
    return (names.includes('siege') && /\bsiege\b/.test(text)) ? 'siege' : null;
  };

  // Extract domains from a mission:assigned log entry, whatever its shape.
  const missionDomains = (e) => {
    const out = [];
    const add = (d) => { if (typeof d === 'string' && Core.DOMAINS.includes(d) && !out.includes(d)) out.push(d); };
    if (!e) return out;
    add(e.domain);
    const arrays = [e.missions, e.mandatory, e.data && e.data.missions, e.data && e.data.mandatory];
    for (const a of arrays) {
      if (!Array.isArray(a)) continue;
      for (const m of a) {
        if (typeof m === 'string') add(m);
        else if (m && typeof m === 'object') add(m.domain);
      }
    }
    return out;
  };

  // ---------- detector 1: domain_avoidance ----------
  // A domain with 0 completed sieges in 5+ days while other domains logged 3+.
  const domainAvoidance = (comps, nowMs) => {
    const enabled = Core.enabledDomains();
    const lg = safeLog();
    const oldestMs = lg.length ? ms(lg[lg.length - 1] && lg[lg.length - 1].t) : null;
    const hits = [];
    for (const d of enabled) {
      const last = comps.find(c => c.domain === d);   // comps are newest-first
      let windowMs;
      if (last) windowMs = nowMs - last.ms;
      else if (oldestMs != null) windowMs = nowMs - oldestMs;   // never completed: measure from first event
      else continue;                                            // truly fresh install: no claim
      const days = Math.floor(windowMs / DAY_MS);
      if (days < 5) continue;
      const others = comps.filter(c => c.domain !== d && nowMs - c.ms <= windowMs).length;
      if (others >= 3) hits.push({ domain: d, days, others });
    }
    if (!hits.length) return null;
    hits.sort((a, b) => b.days - a.days);
    const list = hits.map(h => `${Core.META[h.domain].name} ${h.days} DAYS`).join(', ');
    const others = Math.max.apply(null, hits.map(h => h.others));
    return {
      key: 'domain_avoidance',
      name: 'DOMAIN AVOIDANCE',
      statement: `DOMAIN AVOIDANCE. ${list} WITH 0 COMPLETED SIEGES WHILE OTHER DOMAINS LOGGED ${others}. YOU ARE NOT BUSY, YOU ARE DODGING.`,
      evidence: hits.map(h =>
        `${Core.META[h.domain].name}: LAST COMPLETION ${h.days}D AGO, ${h.others} OTHER-DOMAIN COMPLETIONS IN THAT WINDOW`
      ).join('; ')
    };
  };

  // ---------- detector 2: comfort_cycling ----------
  // avg health of (chess, building) minus avg health of (outreach, igcse) >= 30.
  const comfortCycling = () => {
    const comfort = EASY.filter(isEnabled);
    const hard = HARD.filter(isEnabled);
    if (!comfort.length || !hard.length) return null;
    const avg = (a) => a.reduce((s, d) => s + health(d), 0) / a.length;
    const cAvg = avg(comfort), hAvg = avg(hard);
    const gap = cAvg - hAvg;
    if (gap < 30) return null;
    const part = (a) => a.map(d => `${Core.META[d].name} ${health(d)}`).join(' / ');
    return {
      key: 'comfort_cycling',
      name: 'COMFORT CYCLING',
      statement: `COMFORT CYCLING. ${part(comfort)} WHILE ${part(hard)}. GAP OF ${Math.round(gap)} POINTS. THIS IS HIDING, NOT DISCIPLINE.`,
      evidence: `COMFORT AVG ${Math.round(cAvg)} VS HARD AVG ${Math.round(hAvg)}; GAP ${Math.round(gap)} (THRESHOLD 30)`
    };
  };

  // ---------- detector 3: phantom_productivity ----------
  // >=50% of last 7 days' building sieges were on project 'Siege' while outreach health < 50.
  const phantomProductivity = (comps, nowMs) => {
    if (!isEnabled('building') || !isEnabled('outreach')) return null;
    const ou = health('outreach');
    if (ou >= 50) return null;
    const week = comps.filter(c => c.domain === 'building' && nowMs - c.ms <= 7 * DAY_MS);
    if (!week.length) return null;
    const onSiege = week.filter(c => projectOf(c) === 'siege').length;
    if (onSiege / week.length < 0.5) return null;
    const pct = Math.round((onSiege / week.length) * 100);
    return {
      key: 'phantom_productivity',
      name: 'PHANTOM PRODUCTIVITY',
      statement: `PHANTOM PRODUCTIVITY. ${onSiege} OF ${week.length} BUILDING SIEGES THIS WEEK (${pct}%) WENT INTO SIEGE ITSELF WHILE OUTREACH SITS AT ${ou}. YOU BUILT THE WEAPON. NOW FIRE IT.`,
      evidence: `BUILDING SIEGES LAST 7D: ${week.length}; ON PROJECT SIEGE: ${onSiege} (${pct}%, THRESHOLD 50%); OUTREACH HEALTH ${ou} (THRESHOLD <50)`
    };
  };

  // ---------- detector 4: time_displacement ----------
  // In last 7 days: days where an easy-domain siege (chess/building) completed while a
  // hard-domain mission (outreach/igcse) failed or was assigned and never done — 3+ such days.
  const timeDisplacement = (comps) => {
    const lg = safeLog();
    const today = Core.todayKey();
    const addTo = (map, day, dom) => { (map[day] = map[day] || new Set()).add(dom); };

    const failedByDay = {};
    const assignedByDay = {};
    for (const e of lg) {
      if (!e) continue;
      if (e.type === 'siege:failed' || e.type === 'siege:aborted') {
        const dom = domOf(e);
        const d = dayOf(e.t);
        if (d && HARD.includes(dom)) addTo(failedByDay, d, dom);
      } else if (e.type === 'mission:assigned') {
        const d = dayOf(e.t);
        if (!d) continue;
        for (const dom of missionDomains(e)) {
          if (HARD.includes(dom)) addTo(assignedByDay, d, dom);
        }
      }
    }
    // current mission list (covers today even if the assignment log entry is sparse)
    const S = Core.S;
    if (S && typeof S.missionsDate === 'string' && Array.isArray(S.missions)) {
      for (const m of S.missions) {
        if (!m || !HARD.includes(m.domain)) continue;
        addTo(assignedByDay, S.missionsDate, m.domain);
        if (m.status === 'failed') addTo(failedByDay, S.missionsDate, m.domain);
      }
    }
    const completedByDay = {};
    for (const c of comps) addTo(completedByDay, c.day, c.domain);

    let badDays = 0;
    const hardHit = {};
    for (let i = 0; i < 7; i++) {
      const d = Core.daysAgo(i);
      const comp = completedByDay[d] || new Set();
      if (!EASY.some(x => comp.has(x))) continue;          // no easy win that day
      const bad = new Set();
      (failedByDay[d] || new Set()).forEach(x => bad.add(x));
      (assignedByDay[d] || new Set()).forEach(x => {
        if (d !== today && !comp.has(x)) bad.add(x);       // past day, assigned, never completed
      });
      comp.forEach(x => bad.delete(x));                    // recovered same day: not displaced
      if (bad.size) {
        badDays++;
        bad.forEach(x => { hardHit[x] = (hardHit[x] || 0) + 1; });
      }
    }
    if (badDays < 3) return null;
    const hardList = Object.keys(hardHit).map(d => `${Core.META[d].name} ${hardHit[d]}`).join(', ');
    return {
      key: 'time_displacement',
      name: 'TIME DISPLACEMENT',
      statement: `TIME DISPLACEMENT. ${badDays} OF THE LAST 7 DAYS YOU FINISHED CHESS OR BUILDING WHILE HARD MISSIONS DIED THE SAME DAY (${hardList}). EASY FIRST, HARD NEVER.`,
      evidence: `DAYS WITH EASY COMPLETION + HARD FAILURE/MISS IN LAST 7: ${badDays} (THRESHOLD 3); HARD DOMAINS HIT: ${hardList}`
    };
  };

  // ---------- detector 5: streak_gaming ----------
  // >=3 of last 5 completed sieges had a non-inapp proof under 80 chars.
  const streakGaming = (comps) => {
    const judged = comps.filter(c => typeof c.proof === 'string' || c.proofType === 'inapp');
    const last = judged.slice(0, 5);
    if (last.length < 3) return null;
    const short = last.filter(c => c.proofType !== 'inapp' && String(c.proof || '').length < 80);
    if (short.length < 3) return null;
    const lens = short.map(c => String(c.proof || '').length);
    const minLen = Math.min.apply(null, lens);
    return {
      key: 'streak_gaming',
      name: 'STREAK GAMING',
      statement: `STREAK GAMING. ${short.length} OF YOUR LAST ${last.length} PROOFS RAN UNDER 80 CHARACTERS (SHORTEST ${minLen}). MINIMUM-VIABLE SIEGES FEED THE STREAK AND NOTHING ELSE.`,
      evidence: `LAST ${last.length} COMPLETED SIEGES: ${short.length} NON-INAPP PROOFS UNDER 80 CHARS (LENGTHS ${lens.join(', ')}; THRESHOLD 3 OF 5)`
    };
  };

  // ---------- public api ----------
  const detect = () => {
    const out = [];
    let comps = [];
    try { comps = completions(); } catch (e) { console.error('[patterns] completions', e); }
    const nowMs = Date.now();
    const detectors = [
      () => domainAvoidance(comps, nowMs),
      () => comfortCycling(),
      () => phantomProductivity(comps, nowMs),
      () => timeDisplacement(comps),
      () => streakGaming(comps)
    ];
    for (const fn of detectors) {
      try {
        const r = fn();
        if (r) out.push(r);
      } catch (e) { console.error('[patterns] detector', e); }
    }
    return out;
  };

  const summary = () => {
    const pats = detect();
    if (!pats.length) return 'NO AVOIDANCE PATTERNS DETECTED. KEEP IT THAT WAY.';
    return pats.map(p => p.statement).join('\n');
  };

  return { detect, summary };
})();
