/* ===== MODULE 08: Dashboard — health bars, mission cards, habits, briefing ===== */
const Dashboard = (() => {
  'use strict';

  const STATE_CLS = { healthy: 'is-ok', warning: 'is-warn', critical: 'is-crit', locked: 'is-locked' };
  const BUS_EVENTS = ['decay:run', 'siege:done', 'day:rollover'];

  let rootEl = null;

  // ---------- data helpers ----------
  const todaysMissions = () => {
    if (Core.S.missionsDate !== Core.todayKey()) return [];
    return Array.isArray(Core.S.missions) ? Core.S.missions.filter(m => m && m.id) : [];
  };

  const yesterdaySnapshot = () => {
    const yk = Core.daysAgo(1);
    const log = Array.isArray(Core.S.log) ? Core.S.log : [];
    for (const e of log) {
      if (e && e.type === 'health:snapshot' && Core.dayKey(e.t) === yk) return e;
    }
    return null;
  };

  const trendFor = (d, cur, snap) => {
    if (!snap || !snap.healths || typeof snap.healths[d] !== 'number') {
      return { sym: '→', cls: 'trend-flat' };
    }
    const prev = Math.round(snap.healths[d]);
    if (cur > prev) return { sym: '↑', cls: 'trend-up' };
    if (cur < prev) return { sym: '↓', cls: 'trend-down' };
    return { sym: '→', cls: 'trend-flat' };
  };

  const domainState = (d) => {
    try { return Decay.state(d) || 'healthy'; } catch (e) { return 'healthy'; }
  };

  // ---------- html builders ----------
  const topStrip = () => {
    const ms = todaysMissions();
    const done = ms.filter(m => m.status === 'completed').length;
    const st = Core.S.streaks || { current: 0, longest: 0 };
    const missionTxt = ms.length ? `MISSIONS <b>${done}/${ms.length}</b> COMPLETE` : 'NO MISSIONS ASSIGNED';
    let lockedCount = 0;
    try { lockedCount = Core.enabledDomains().filter(d => domainState(d) === 'locked').length; } catch (e) {}
    const lockTxt = lockedCount > 0
      ? `<span class="dash-top-alert">${lockedCount} DOMAIN${lockedCount === 1 ? '' : 'S'} LOCKED</span>`
      : '<span>ALL DOMAINS OPERATIONAL</span>';
    return `
      <div class="dash-top">
        <span><b>${Core.esc(Core.fmtDate(Core.todayKey()))}</b></span>
        <span>${missionTxt}</span>
        ${lockTxt}
        <span>GLOBAL STREAK <b>${Number(st.current) || 0}</b> · LONGEST <b>${Number(st.longest) || 0}</b></span>
      </div>`;
  };

  const domainRow = (d, snap) => {
    const meta = Core.META[d] || { name: String(d).toUpperCase(), sym: '·' };
    const dom = (Core.S.domains && Core.S.domains[d]) || {};
    const health = Math.round(Core.clamp(Number(dom.health) || 0, 0, 100));
    const st = domainState(d);
    const hrs = Math.floor(Core.hoursSince(dom.lastActive));
    const tr = trendFor(d, health, snap);
    const row = `
      <div class="dash-row">
        <span class="dash-sym">${meta.sym}</span>
        <span class="dash-name">${Core.esc(meta.name)}</span>
        <div class="sg-bar dash-bar"><div class="sg-bar-fill ${STATE_CLS[st] || 'is-ok'}" style="width:${health}%"></div></div>
        <span class="dash-health">${health}</span>
        <span class="dash-meta">STREAK ${Number(dom.streak) || 0}</span>
        <span class="dash-meta">LAST ACTIVE ${hrs}H AGO</span>
        <span class="dash-trend ${tr.cls}">${tr.sym}</span>
      </div>`;
    if (st !== 'locked') return row;
    return `
      <div class="dash-lockwrap">
        <div class="dash-lockhead">
          <div class="locked-banner">${meta.sym} ${Core.esc(meta.name)}: LOCKED — RECOVERY SIEGE REQUIRED</div>
          <button class="sg-btn danger" data-dash-act="recovery" data-domain="${Core.esc(d)}">RECOVERY SIEGE</button>
        </div>
        <div class="locked-section">${row}</div>
      </div>`;
  };

  const missionCard = (m) => {
    const meta = Core.META[m.domain] || { name: String(m.domain || '').toUpperCase(), sym: '·' };
    const subj = m.subject
      ? ' — ' + (Core.SUBJECTS[m.subject] ? Core.SUBJECTS[m.subject].name : String(m.subject).toUpperCase())
      : '';
    const status = m.status || 'pending';
    let tag = '<span class="sg-tag gold">PENDING</span>';
    let cardCls = '';
    let action = `<button class="sg-btn small" data-dash-act="start" data-mid="${Core.esc(m.id)}">START</button>`;
    if (status === 'completed') {
      tag = '<span class="sg-tag green">DONE</span>'; cardCls = ' ok'; action = '';
    } else if (status === 'failed') {
      tag = '<span class="sg-tag red">FAILED</span>'; cardCls = ' crit'; action = '';
    } else if (status === 'active') {
      tag = '<span class="sg-tag green">ACTIVE</span>';
      action = `<button class="sg-btn small green" data-dash-act="resume" data-mid="${Core.esc(m.id)}">RESUME</button>`;
    }
    const weak = m.weakArea ? ' <span class="sg-tag dim">WEAK AREA</span>' : '';
    return `
      <div class="sg-card dash-mission${cardCls}">
        <div class="dash-mis-head">
          <span class="dash-mis-dom">${meta.sym} ${Core.esc(meta.name)}${Core.esc(subj)}</span>
          <span class="dash-mis-tags">${tag}${weak}</span>
        </div>
        <div class="dash-mis-obj">${Core.esc(m.objective || '')}</div>
        <div class="dash-mis-foot">
          <span class="dash-mis-dur">${Number(m.durationMin) || 0} MIN</span>
          ${action}
        </div>
      </div>`;
  };

  const missionsBlock = () => {
    const ms = todaysMissions();
    if (!ms.length) return '<div class="sg-empty">NO MISSIONS ASSIGNED. THE BRIEFING ASSIGNS THEM.</div>';
    return `<div class="dash-missions">${ms.map(missionCard).join('')}</div>`;
  };

  const habitsBlock = () => {
    let html = '';
    try { html = String(Habits.todayCard() || ''); }
    catch (e) { console.error('[dash] habits card', e); html = '<div class="sg-empty">HABIT TRACKER UNAVAILABLE.</div>'; }
    return `<div id="dash-habits">${html}</div>`;
  };

  const briefingBlock = () => {
    const b = Core.S.briefing || {};
    const acked = !!(b.acked && b.date === Core.todayKey() && b.data && b.data.hardTruth);
    const truth = acked
      ? `<div class="hard-truth">${Core.esc(b.data.hardTruth)}</div>`
      : '<div class="sg-empty">NO HARD TRUTH. BRIEFING NOT ACKNOWLEDGED TODAY.</div>';
    let pat = '';
    try { pat = String(Patterns.summary() || ''); }
    catch (e) { console.error('[dash] patterns', e); pat = 'PATTERN ANALYSIS UNAVAILABLE.'; }
    const lines = pat.split('\n').map(s => s.trim()).filter(Boolean);
    const clean = lines.length === 1 && lines[0].indexOf('NO AVOIDANCE PATTERNS') === 0;
    const patHtml = lines.map(l => `<div class="dash-pat-line${clean ? ' clean' : ''}">${Core.esc(l)}</div>`).join('')
      || '<div class="dash-pat-line clean">NO PATTERN DATA.</div>';
    return `${truth}
      <div class="sg-sub dash-pat-head">PATTERN ANALYSIS</div>
      <div class="dash-patterns">${patHtml}</div>`;
  };

  const render = (el) => {
    const snap = yesterdaySnapshot();
    let enabled = [];
    try { enabled = Core.enabledDomains(); } catch (e) { enabled = []; }
    const rows = enabled.map(d => domainRow(d, snap)).join('');
    el.innerHTML = `
      ${topStrip()}
      <div class="sg-h">DOMAIN HEALTH</div>
      <div class="dash-domains">${rows || '<div class="sg-empty">NO DOMAINS ENABLED. ENABLE THEM IN /settings.</div>'}</div>
      <div class="sg-h">TODAY'S MANDATORY SIEGES</div>
      ${missionsBlock()}
      <div class="sg-h">HABITS — TODAY</div>
      ${habitsBlock()}
      <div class="sg-h">BRIEFING</div>
      ${briefingBlock()}`;
  };

  // ---------- events ----------
  const startSiege = (opts) => {
    let p = null;
    try { p = Siege.start(opts); }
    catch (err) {
      console.error('[dash] siege start', err);
      Shell.toast('SIEGE START FAILED. ' + String((err && err.message) || err).toUpperCase(), 'err');
      return;
    }
    if (p && typeof p.catch === 'function') {
      p.catch(err => {
        console.error('[dash] siege start', err);
        Shell.toast('SIEGE START FAILED. ' + String((err && err.message) || err).toUpperCase(), 'err');
      });
    }
  };

  const onClick = (e) => {
    const btn = e.target && e.target.closest ? e.target.closest('[data-dash-act]') : null;
    if (!btn || btn.disabled) return;
    const act = btn.getAttribute('data-dash-act');
    if (act === 'recovery') {
      const d = btn.getAttribute('data-domain');
      if (d) startSiege({ domain: d, recovery: true });
      return;
    }
    if (act === 'start' || act === 'resume') {
      if (act === 'resume') {
        let live = null;
        try { live = Siege.active(); } catch (err) { live = null; }
        if (live) { Shell.navigate('siege'); return; }
      }
      const mid = btn.getAttribute('data-mid');
      const m = todaysMissions().find(x => x.id === mid);
      if (!m) { Shell.toast('MISSION NOT FOUND. REFRESH.', 'err'); return; }
      startSiege({ domain: m.domain, subject: m.subject || null, missionId: m.id });
    }
  };

  const onBus = () => {
    if (Shell.current() === 'dashboard') Shell.refresh();
  };

  // ---------- view lifecycle ----------
  const mount = (el) => {
    rootEl = el;
    el.addEventListener('click', onClick);
    BUS_EVENTS.forEach(evt => Core.Bus.on(evt, onBus));
    const hb = el.querySelector('#dash-habits');
    if (hb) {
      try { Habits.bindCard(hb); }
      catch (e) { console.error('[dash] habits bind', e); }
    }
  };

  const unmount = () => {
    BUS_EVENTS.forEach(evt => Core.Bus.off(evt, onBus));
    if (rootEl) { rootEl.removeEventListener('click', onClick); rootEl = null; }
  };

  const init = () => {
    Shell.registerView('dashboard', { title: 'DASHBOARD', render, mount, unmount });
  };

  return { init };
})();
