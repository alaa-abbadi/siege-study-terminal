/* ===== MODULE 03: Decay — health decay, locks, critical state, forecasts ===== */
const Decay = (() => {
  'use strict';

  // ---------- config ----------
  const decayCfg = () => {
    const c = (Core.S.config && Core.S.config.decay) || {};
    return {
      warnPerDay: typeof c.warnPerDay === 'number' ? c.warnPerDay : 10,
      critPerDay: typeof c.critPerDay === 'number' ? c.critPerDay : 20,
      lockHours:  typeof c.lockHours  === 'number' ? c.lockHours  : 72
    };
  };

  const healthOf = (obj) => (obj && typeof obj.health === 'number') ? obj.health : 100;

  // ---------- decay math ----------
  // Integral of the instantaneous decay rate over [h0, h1] hours-since-lastActive.
  // Rate: 0 below 24h; warnPerDay/24 per hour in [24,48); critPerDay/24 per hour at >=48h.
  const bandDecay = (h0, h1, cfg) => {
    if (!(h1 > h0)) return 0;
    const seg = (a, b) => Math.max(0, Math.min(h1, b) - Math.max(h0, a));
    return seg(24, 48) * (cfg.warnPerDay / 24) + seg(48, Infinity) * (cfg.critPerDay / 24);
  };

  // Apply accrued decay to one health-bearing object over [lastDecayAt, now],
  // segmented across band boundaries. Floors health at 0. Advances lastDecayAt.
  const applyDecay = (obj, cfg) => {
    if (!obj) return 0;
    const nowMs = Date.now();
    let laMs = Date.parse(obj.lastActive);
    let ldMs = Date.parse(obj.lastDecayAt);
    if (isNaN(laMs)) laMs = nowMs;
    if (isNaN(ldMs)) ldMs = nowMs;
    const h1 = Math.max(0, (nowMs - laMs) / 3600000);
    const h0 = Core.clamp((ldMs - laMs) / 3600000, 0, h1);
    const loss = bandDecay(h0, h1, cfg);
    if (loss > 0) obj.health = Math.max(0, healthOf(obj) - loss);
    obj.lastDecayAt = Core.iso();
    return loss;
  };

  // ---------- states ----------
  const bandState = (hours, hp) => {
    if (hours >= decayCfg().lockHours) return 'locked';
    if (hours >= 48 || hp <= 30) return 'critical';
    if (hours >= 24 || hp <= 60) return 'warning';
    return 'healthy';
  };

  const state = (domain) => {
    const dom = (Core.S.domains || {})[domain];
    if (!dom) return 'healthy';
    return bandState(Core.hoursSince(dom.lastActive), healthOf(dom));
  };

  const subjectState = (subjKey) => {
    const igcse = (Core.S.domains || {}).igcse || {};
    const sub = (igcse.subjects || {})[subjKey];
    if (!sub) return 'healthy';
    return bandState(Core.hoursSince(sub.lastActive), healthOf(sub));
  };

  const isLocked = (domain) => {
    const dom = (Core.S.domains || {})[domain];
    if (!dom) return false;
    return Core.hoursSince(dom.lastActive) >= decayCfg().lockHours;
  };

  const lockedDomains = () => Core.enabledDomains().filter(isLocked);

  const isCritical = () => lockedDomains().length >= 3;

  // ---------- start gate ----------
  const canStart = (domain, opts = {}) => {
    const recovery = !!(opts && opts.recovery);
    if (!Core.DOMAINS.includes(domain)) return { ok: false, reason: 'UNKNOWN DOMAIN' };
    const name = (Core.META[domain] || {}).name || String(domain).toUpperCase();
    if (!((Core.S.config || {}).enabled || {})[domain]) {
      return { ok: false, reason: name + ' IS DISABLED' };
    }
    const locked = lockedDomains();
    if (locked.length) {
      if (recovery && locked.includes(domain)) return { ok: true, reason: '' };
      const names = locked.map(d => (Core.META[d] || {}).name || d.toUpperCase()).join(' / ');
      return { ok: false, reason: 'RECOVER ' + names + ' FIRST' };
    }
    return { ok: true, reason: '' };
  };

  // ---------- transition logging (robust across reloads: derive last state from log) ----------
  const latestLockEvents = () => {
    const out = {};
    for (const e of Core.S.log) {
      if ((e.type === 'domain:locked' || e.type === 'domain:unlocked') && e.domain && !(e.domain in out)) {
        out[e.domain] = e.type;   // log is newest-first
      }
    }
    return out;
  };

  const syncLockLogs = () => {
    const latest = latestLockEvents();
    for (const d of Core.enabledDomains()) {
      const lockedNow = isLocked(d);
      if (lockedNow && latest[d] !== 'domain:locked') {
        const dom = (Core.S.domains || {})[d] || {};
        Core.log('domain:locked', { domain: d, hours: Math.floor(Core.hoursSince(dom.lastActive)) });
      } else if (!lockedNow && latest[d] === 'domain:locked') {
        Core.log('domain:unlocked', { domain: d });
      }
    }
  };

  const latestCriticalEvent = () => {
    for (const e of Core.S.log) {
      if (e.type === 'critical:entered' || e.type === 'critical:cleared') return e.type;
    }
    return null;
  };

  const syncCritical = () => {
    const crit = isCritical();
    const last = latestCriticalEvent();
    if (crit && last !== 'critical:entered') {
      Core.log('critical:entered', { locked: lockedDomains() });
      showCritical();
    } else if (!crit && last === 'critical:entered') {
      Core.log('critical:cleared', {});
    }
  };

  // ---------- daily snapshot ----------
  const maybeSnapshot = () => {
    let lastT = null;
    for (const e of Core.S.log) {
      if (e.type === 'health:snapshot') { lastT = e.t; break; }
    }
    if (lastT && Core.dayKey(lastT) === Core.todayKey()) return;
    const healths = {};
    for (const d of Core.DOMAINS) {
      const dom = (Core.S.domains || {})[d];
      healths[d] = Math.round(healthOf(dom) * 10) / 10;
    }
    Core.log('health:snapshot', { healths });
  };

  // ---------- run ----------
  const run = () => {
    const cfg = decayCfg();
    const domains = Core.S.domains || {};
    const enabled = ((Core.S.config || {}).enabled) || {};
    for (const d of Core.DOMAINS) {
      const dom = domains[d];
      if (!dom) continue;
      if (enabled[d]) {
        applyDecay(dom, cfg);
        if (d === 'igcse' && dom.subjects) {
          for (const sk of Object.keys(dom.subjects)) applyDecay(dom.subjects[sk], cfg);
        }
      } else {
        // disabled domains are frozen: advance lastDecayAt without decaying
        dom.lastDecayAt = Core.iso();
        if (d === 'igcse' && dom.subjects) {
          for (const sk of Object.keys(dom.subjects)) {
            if (dom.subjects[sk]) dom.subjects[sk].lastDecayAt = Core.iso();
          }
        }
      }
    }
    syncLockLogs();
    syncCritical();
    maybeSnapshot();
    Core.save();
    Core.Bus.emit('decay:run');
  };

  // ---------- tick: 60s heartbeat + day rollover ----------
  let timer = null;
  let dayCursor = null;
  const tick = () => {
    if (timer) clearInterval(timer);
    dayCursor = Core.todayKey();
    timer = setInterval(() => {
      try {
        const tk = Core.todayKey();
        if (tk !== dayCursor) {
          dayCursor = tk;
          Core.Bus.emit('day:rollover', tk);
        }
        run();
      } catch (e) { console.error('[decay] tick', e); }
    }, 60000);
    return timer;
  };

  // ---------- forecast ----------
  // Simulate forward day by day under current rules: when does this object lock,
  // and when does its health hit 0.
  const simulate = (obj) => {
    const cfg = decayCfg();
    const h = Core.hoursSince(obj.lastActive);
    let hp = healthOf(obj);
    let lockDay = (h >= cfg.lockHours) ? 0 : null;
    let zeroDay = (hp <= 0) ? 0 : null;
    for (let n = 1; n <= 30 && (lockDay === null || zeroDay === null); n++) {
      const a = h + 24 * (n - 1);
      const b = h + 24 * n;
      hp -= bandDecay(a, b, cfg);
      if (zeroDay === null && hp <= 0) zeroDay = n;
      if (lockDay === null && b >= cfg.lockHours) lockDay = n;
    }
    return { lockDay, zeroDay };
  };

  const forecastFor = (name, obj) => {
    const { lockDay, zeroDay } = simulate(obj);
    if (lockDay === 0) return { daysToLock: 0, line: name + ' IS LOCKED' };
    let line = null;
    if (lockDay !== null && (zeroDay === null || lockDay <= zeroDay)) {
      line = lockDay === 1 ? (name + ' LOCKS TOMORROW') : (name + ' LOCKS IN ' + lockDay + ' DAYS');
    } else if (zeroDay !== null) {
      line = zeroDay === 0 ? (name + ' HEALTH IS AT 0')
           : zeroDay === 1 ? (name + ' HEALTH HITS 0 TOMORROW')
           : (name + ' HEALTH HITS 0 IN ' + zeroDay + ' DAYS');
    }
    return { daysToLock: lockDay, line };
  };

  const forecast = (domain) => {
    const dom = (Core.S.domains || {})[domain];
    if (!dom) return { daysToLock: null, line: null };
    const name = (Core.META[domain] || {}).name || String(domain).toUpperCase();
    return forecastFor(name, dom);
  };

  const forecastAll = () => {
    const items = [];
    for (const d of Core.enabledDomains()) {
      if (state(d) === 'healthy') continue;
      const f = forecast(d);
      if (f.line) items.push({ days: f.daysToLock === null ? 99 : f.daysToLock, line: f.line });
    }
    if (((Core.S.config || {}).enabled || {}).igcse) {
      const subs = ((Core.S.domains || {}).igcse || {}).subjects || {};
      for (const sk of Object.keys(subs)) {
        if (subjectState(sk) === 'healthy') continue;
        const name = 'IGCSE ' + ((Core.SUBJECTS[sk] || {}).name || sk.toUpperCase());
        const f = forecastFor(name, subs[sk]);
        if (f.line) items.push({ days: f.daysToLock === null ? 99 : f.daysToLock, line: f.line });
      }
    }
    items.sort((a, b) => a.days - b.days);
    return items.map(i => i.line);
  };

  // ---------- restore (only way health regenerates) ----------
  const restore = (domain, opts = {}) => {
    const o = opts || {};
    const dom = (Core.S.domains || {})[domain];
    if (!dom) return { gained: 0, health: 0, streak: 0 };
    const cfg = decayCfg();
    const nowIso = Core.iso();
    const today = Core.todayKey();
    const yesterday = Core.daysAgo(1);
    const wasLocked = isLocked(domain);

    // settle accrued decay first so the gain lands on the true current value
    applyDecay(dom, cfg);

    let gain = 15;
    const hist = Array.isArray(dom.history) ? dom.history : [];
    const prev = hist.length ? hist[hist.length - 1] : null;
    const prevDay = (prev && prev.t) ? Core.dayKey(prev.t) : null;
    if (prevDay === today || prevDay === yesterday) {
      gain += 5;                                   // streak continuation bonus
      dom.streak = (dom.streak || 0) + 1;
    } else {
      dom.streak = 1;                              // gap > 1 day resets
    }
    if (o.weakArea) gain += 10;

    dom.health = Core.clamp(healthOf(dom) + gain, 0, 100);
    dom.lastActive = nowIso;
    dom.lastDecayAt = nowIso;
    dom.totalSieges = (dom.totalSieges || 0) + 1;

    if (o.subject && domain === 'igcse' && dom.subjects && dom.subjects[o.subject]) {
      const sub = dom.subjects[o.subject];
      applyDecay(sub, cfg);
      sub.health = Core.clamp(healthOf(sub) + gain, 0, 100);
      sub.lastActive = nowIso;
      sub.lastDecayAt = nowIso;
    }

    if (wasLocked) Core.log('domain:unlocked', { domain, recovery: !!o.recovery });
    syncCritical();
    Core.save();
    Core.Bus.emit('decay:run');
    return { gained: gain, health: dom.health, streak: dom.streak };
  };

  // ---------- CRITICAL overlay ----------
  let critOverlay = null;
  let critHandler = null;

  const criticalHtml = () => {
    const locked = lockedDomains();
    const rows = locked.map(d => {
      const dom = (Core.S.domains || {})[d] || {};
      const name = (Core.META[d] || {}).name || d.toUpperCase();
      const hrs = Math.floor(Core.hoursSince(dom.lastActive));
      const hp = Math.round(healthOf(dom));
      return '<div class="decay-crit-row">' +
        '<span class="decay-crit-name">' + Core.esc(name) + '</span>' +
        '<span class="decay-crit-hours">' + Core.esc(hrs + 'H SINCE LAST ACTIVITY — HEALTH ' + hp) + '</span>' +
        '<button class="sg-btn danger decay-crit-btn" data-domain="' + Core.esc(d) + '">RECOVERY SIEGE — ' + Core.esc(name) + '</button>' +
        '</div>';
    }).join('');
    return '<div class="decay-failure-title">SYSTEM FAILURE</div>' +
      '<div class="decay-failure-sub">' + Core.esc(locked.length + ' DOMAINS LOCKED. THE SYSTEM HAS COLLAPSED.') + '</div>' +
      '<div class="decay-crit-list">' + rows + '</div>' +
      '<div class="decay-failure-foot">RECOVERY SIEGES ARE THE ONLY WAY OUT. 1.5X DURATION. NOTHING ELSE UNTIL THEN.</div>';
  };

  const bindCritButtons = () => {
    if (!critOverlay || !critOverlay.el) return;
    critOverlay.el.querySelectorAll('.decay-crit-btn').forEach(b => {
      b.addEventListener('click', () => {
        const d = b.dataset.domain;
        try {
          const p = Siege.start({ domain: d, recovery: true });
          if (p && typeof p.catch === 'function') {
            p.catch(err => Shell.toast('RECOVERY SIEGE FAILED TO START. ' + ((err && err.message) || ''), 'err'));
          }
        } catch (e) {
          Shell.toast('RECOVERY SIEGE FAILED TO START. ' + ((e && e.message) || ''), 'err');
        }
      });
    });
  };

  const closeCritical = () => {
    if (critHandler) { Core.Bus.off('decay:run', critHandler); critHandler = null; }
    if (critOverlay) { try { critOverlay.close(); } catch (e) { console.error(e); } critOverlay = null; }
  };

  const showCritical = () => {
    if (critOverlay && critOverlay.el && critOverlay.el.parentNode) return critOverlay.el;  // one instance only
    if (!isCritical()) return null;
    critOverlay = Shell.overlay(criticalHtml(), { dismissible: false, cls: 'decay-critical' });
    bindCritButtons();
    critHandler = () => {
      if (!critOverlay) return;
      if (!isCritical()) {
        if (latestCriticalEvent() === 'critical:entered') Core.log('critical:cleared', {});
        closeCritical();
      } else {
        const inner = critOverlay.el.querySelector('.sg-overlay-inner');
        if (inner) { inner.innerHTML = criticalHtml(); bindCritButtons(); }
      }
    };
    Core.Bus.on('decay:run', critHandler);
    return critOverlay.el;
  };

  return {
    run, tick,
    state, subjectState,
    isLocked, lockedDomains, isCritical,
    canStart,
    forecast, forecastAll,
    restore,
    showCritical
  };
})();
