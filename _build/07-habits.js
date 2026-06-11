/* ===== MODULE 07: Habits — habit chains, daily logging, dashboard card ===== */
const Habits = (() => {
  'use strict';

  const ORDER = ['wake', 'coldShower', 'phone', 'prayer', 'water', 'sleep', 'reading'];
  const PRAYERS = ['FAJR', 'DHUHR', 'ASR', 'MAGHRIB', 'ISHA'];
  const WATER_TARGET = 3000;
  const WATER_STEP = 250;
  const READ_MIN = 20;
  const CHAIN_DAYS = 60;
  const DAY_RE = /^\d{4}-\d{2}-\d{2}$/;

  const DEFS = {
    wake:       { name: 'WAKE',        abbr: 'WAKE' },
    coldShower: { name: 'COLD SHOWER', abbr: 'COLD' },
    phone:      { name: 'PHONE HOURS', abbr: 'PHON' },
    prayer:     { name: 'PRAYER',      abbr: 'PRAY' },
    water:      { name: 'WATER',       abbr: 'WATR' },
    sleep:      { name: 'SLEEP',       abbr: 'SLEP' },
    reading:    { name: 'READING',     abbr: 'READ' }
  };

  /* ---------- state access (defensive: never throw on fresh/partial state) ---------- */
  const histOf = (key) => {
    const H = Core.S.habits;
    if (!H || !H[key] || !H[key].history || typeof H[key].history !== 'object') return {};
    return H[key].history;
  };
  const ensure = (key) => {
    if (!Core.S.habits || typeof Core.S.habits !== 'object') Core.S.habits = {};
    const H = Core.S.habits;
    if (!H[key] || typeof H[key] !== 'object') H[key] = { history: {} };
    if (!H[key].history || typeof H[key].history !== 'object') H[key].history = {};
    return H[key].history;
  };
  const todayVal = (key) => histOf(key)[Core.todayKey()];
  const prayersToday = () => {
    const v = todayVal('prayer');
    return PRAYERS.map((_, i) => !!(Array.isArray(v) && v[i]));
  };

  /* ---------- completion rules (CONTRACT) ---------- */
  const isComplete = (key, dk) => {
    const v = histOf(key)[dk];
    switch (key) {
      case 'wake':
      case 'coldShower': return v === true;
      case 'phone':      return typeof v === 'number' && isFinite(v);
      case 'prayer':     return Array.isArray(v) && v.length >= 5 && v.slice(0, 5).every(Boolean);
      case 'water':      return typeof v === 'number' && v >= WATER_TARGET;
      case 'sleep':      return typeof v === 'string' && /^\d{1,2}:\d{2}$/.test(v);
      case 'reading':    return !!v && typeof v === 'object' && Number(v.pages) >= READ_MIN;
      default:           return false;
    }
  };

  /* ---------- wake gating: wakeUpTime + 30min grace ---------- */
  const wakeWindow = () => {
    const cfg = String((Core.S.config && Core.S.config.wakeUpTime) || '06:00').trim();
    const m = /^(\d{1,2}):(\d{2})$/.exec(cfg);
    const h = m ? Core.clamp(parseInt(m[1], 10), 0, 23) : 6;
    const mn = m ? Core.clamp(parseInt(m[2], 10), 0, 59) : 0;
    const deadline = h * 60 + mn + 30;
    const d = new Date();
    const nowMin = d.getHours() * 60 + d.getMinutes();
    const pad = (n) => String(n).padStart(2, '0');
    return {
      open: nowMin <= deadline,
      deadline: pad(Math.floor(deadline / 60) % 24) + ':' + pad(deadline % 60)
    };
  };

  const refreshView = () => {
    try { if (Shell.current() === 'habits') Shell.refresh(); } catch (e) { /* shell not mounted yet */ }
  };

  /* ---------- logging API ---------- */
  const logWake = () => {
    const t = Core.todayKey();
    const hist = ensure('wake');
    if (hist[t] === true) { Shell.toast('WAKE ALREADY LOGGED.'); return; }
    const w = wakeWindow();
    if (!w.open) { Shell.toast('TOO LATE. CHAIN BROKEN.', 'err'); return; }
    hist[t] = true;
    Core.log('habit:logged', { habit: 'wake', value: true });
    Shell.toast('WAKE LOGGED.', 'ok');
    refreshView();
  };

  const logShower = () => {
    const t = Core.todayKey();
    const hist = ensure('coldShower');
    if (hist[t] === true) { Shell.toast('COLD SHOWER ALREADY LOGGED.'); return; }
    hist[t] = true;
    Core.log('habit:logged', { habit: 'coldShower', value: true });
    Shell.toast('COLD SHOWER LOGGED.', 'ok');
    refreshView();
  };

  const setPhone = (hours) => {
    const s = String(hours == null ? '' : hours).trim();
    if (!s) { Shell.toast('ENTER PHONE HOURS FIRST.', 'err'); return; }
    const h = Number(s);
    if (!isFinite(h) || h < 0 || h > 24) { Shell.toast('INVALID HOURS. 0 TO 24.', 'err'); return; }
    const v = Math.round(h * 10) / 10;
    ensure('phone')[Core.todayKey()] = v;
    Core.log('habit:logged', { habit: 'phone', value: v });
    if (v >= 4) Shell.toast('PHONE ' + v + 'H LOGGED. THAT IS A PROBLEM.', 'err');
    else Shell.toast('PHONE ' + v + 'H LOGGED.', 'ok');
    refreshView();
  };

  const togglePrayer = (i) => {
    i = Math.floor(Number(i));
    if (!(i >= 0 && i < 5)) return;
    const t = Core.todayKey();
    const hist = ensure('prayer');
    const cur = Array.isArray(hist[t]) ? hist[t] : [];
    const arr = PRAYERS.map((_, k) => !!cur[k]);
    arr[i] = !arr[i];
    hist[t] = arr;
    Core.log('habit:logged', { habit: 'prayer', value: arr.slice() });
    const n = arr.filter(Boolean).length;
    if (n === 5) Shell.toast('ALL 5 PRAYERS LOGGED.', 'ok');
    else Shell.toast(PRAYERS[i] + (arr[i] ? ' LOGGED. ' : ' CLEARED. ') + n + '/5.');
    refreshView();
  };

  const addWater = (ml) => {
    const n = Math.floor(Number(ml));
    if (!isFinite(n) || n <= 0) return;
    const t = Core.todayKey();
    const hist = ensure('water');
    const before = typeof hist[t] === 'number' && isFinite(hist[t]) ? hist[t] : 0;
    const total = before + n;
    hist[t] = total;
    Core.log('habit:logged', { habit: 'water', value: total });
    if (before < WATER_TARGET && total >= WATER_TARGET) Shell.toast('WATER TARGET HIT. ' + total + 'ML.', 'ok');
    else Shell.toast('WATER ' + total + ' / ' + WATER_TARGET + ' ML.');
    refreshView();
  };

  const logSleep = (hhmm) => {
    const s = String(hhmm == null ? '' : hhmm).trim();
    const m = /^(\d{1,2}):(\d{2})$/.exec(s);
    if (!m || Number(m[1]) > 23 || Number(m[2]) > 59) { Shell.toast('INVALID TIME. USE HH:MM.', 'err'); return; }
    const v = String(m[1]).padStart(2, '0') + ':' + m[2];
    ensure('sleep')[Core.todayKey()] = v;
    Core.log('habit:logged', { habit: 'sleep', value: v });
    Shell.toast('SLEEP LOGGED ' + v + '.', 'ok');
    refreshView();
  };

  const logReading = (from, to) => {
    const f = Math.floor(Number(String(from == null ? '' : from).trim()));
    const t2 = Math.floor(Number(String(to == null ? '' : to).trim()));
    if (!isFinite(f) || !isFinite(t2) || f < 0 || t2 <= f) { Shell.toast('INVALID PAGE RANGE. FROM MUST BE BELOW TO.', 'err'); return; }
    const pages = t2 - f;
    ensure('reading')[Core.todayKey()] = { from: f, to: t2, pages };
    Core.log('habit:logged', { habit: 'reading', value: { from: f, to: t2, pages } });
    if (pages < READ_MIN) Shell.toast(pages + ' PAGES. MINIMUM IS ' + READ_MIN + '. CHAIN STAYS BROKEN.', 'err');
    else Shell.toast(pages + ' PAGES LOGGED.', 'ok');
    refreshView();
  };

  /* ---------- chain + streak (CONTRACT) ---------- */
  const chain = (key, days = CHAIN_DAYS) => {
    days = Math.max(1, Math.floor(Number(days) || CHAIN_DAYS));
    const hist = histOf(key);
    const valid = Object.keys(hist).filter(k => DAY_RE.test(k)).sort();
    const first = valid.length ? valid[0] : null;
    const today = Core.todayKey();
    const out = [];
    for (let i = days - 1; i >= 0; i--) {
      const dk = Core.daysAgo(i);
      if (!first || dk < first) { out.push(null); continue; }     // before any data: no chain yet
      const done = isComplete(key, dk);
      if (dk === today) out.push(done ? true : null);             // today pending, not broken
      else out.push(done ? true : false);                         // past day: broken if incomplete
    }
    return out;
  };

  const streak = (key) => {
    const hist = histOf(key);
    const valid = Object.keys(hist).filter(k => DAY_RE.test(k)).sort();
    if (!valid.length) return { current: 0, longest: 0 };
    const today = Core.todayKey();
    const start = new Date(valid[0] + 'T00:00:00');
    const end = new Date(today + 'T00:00:00');
    if (isNaN(start.getTime()) || isNaN(end.getTime())) return { current: 0, longest: 0 };
    let run = 0, longest = 0, guard = 0;
    const d = new Date(start);
    while (d.getTime() <= end.getTime() && guard++ < 4000) {
      const dk = Core.dayKey(d);
      if (isComplete(key, dk)) { run++; if (run > longest) longest = run; }
      else if (dk !== today) run = 0;                             // today incomplete = pending, keeps current
      d.setDate(d.getDate() + 1);
    }
    return { current: run, longest };
  };

  /* ---------- habits view ---------- */
  const chainHtml = (key) => {
    const arr = chain(key, CHAIN_DAYS);
    const today = Core.todayKey();
    return arr.map((v, idx) => {
      const dk = Core.daysAgo(CHAIN_DAYS - 1 - idx);
      const cls = v === true ? ' l4' : v === false ? ' broken' : '';
      const tCls = dk === today ? ' today' : '';
      const label = Core.fmtDate(dk) + ' — ' +
        (v === true ? 'COMPLETE' : v === false ? 'BROKEN' : (dk === today ? 'PENDING' : 'NO DATA'));
      return `<span class="cell${cls}${tCls}" title="${Core.esc(label)}"></span>`;
    }).join('');
  };

  const controlHtml = (key) => {
    const today = Core.todayKey();
    switch (key) {
      case 'wake': {
        if (isComplete('wake', today)) return `<span class="sg-tag gold">LOGGED</span>`;
        const w = wakeWindow();
        if (w.open) {
          return `<button class="sg-btn small" data-act="wake">I'M UP</button>` +
                 `<span class="hab-note">WINDOW CLOSES ${Core.esc(w.deadline)}</span>`;
        }
        return `<button class="sg-btn small" disabled>I'M UP</button>` +
               `<span class="hab-reason">TOO LATE. WINDOW CLOSED AT ${Core.esc(w.deadline)}.</span>`;
      }
      case 'coldShower':
        return isComplete('coldShower', today)
          ? `<span class="sg-tag gold">DONE</span>`
          : `<button class="sg-btn small" data-act="shower">COLD SHOWER DONE</button>`;
      case 'phone': {
        const v = todayVal('phone');
        const has = typeof v === 'number' && isFinite(v);
        return `<input class="sg-input hab-num" data-in="phone" type="number" min="0" max="24" step="0.5" placeholder="HRS" value="${has ? Core.esc(v) : ''}">` +
               `<button class="sg-btn small" data-act="phone">SET</button>` +
               (has ? `<span class="sg-tag gold">${Core.esc(v)}H</span>` : '');
      }
      case 'prayer': {
        const arr = prayersToday();
        const n = arr.filter(Boolean).length;
        return PRAYERS.map((p, i) =>
          `<button class="hab-pray${arr[i] ? ' on' : ''}" data-act="pray" data-i="${i}">${p}</button>`
        ).join('') + `<span class="sg-tag ${n === 5 ? 'gold' : 'dim'}">${n}/5</span>`;
      }
      case 'water': {
        const raw = todayVal('water');
        const v = typeof raw === 'number' && isFinite(raw) ? raw : 0;
        return `<button class="sg-btn small" data-act="water">+${WATER_STEP}ML</button>` +
               `<span class="hab-water num${v >= WATER_TARGET ? ' hit' : ''}">${v} / ${WATER_TARGET} ML</span>`;
      }
      case 'sleep': {
        const v = todayVal('sleep');
        const has = typeof v === 'string' && v.length > 0;
        return `<input class="sg-input hab-time" data-in="sleep" maxlength="5" placeholder="23:30" value="${has ? Core.esc(v) : ''}">` +
               `<button class="sg-btn small" data-act="sleep">LOG</button>` +
               (has ? `<span class="sg-tag gold">LOGGED</span>` : '');
      }
      case 'reading': {
        const v = todayVal('reading');
        const has = !!v && typeof v === 'object';
        const pages = has ? Math.floor(Number(v.pages)) || 0 : 0;
        const fv = has && isFinite(Number(v.from)) ? Math.floor(Number(v.from)) : '';
        const tv = has && isFinite(Number(v.to)) ? Math.floor(Number(v.to)) : '';
        return `<input class="sg-input hab-num" data-in="rfrom" type="number" min="0" placeholder="FROM" value="${fv}">` +
               `<input class="sg-input hab-num" data-in="rto" type="number" min="0" placeholder="TO" value="${tv}">` +
               `<button class="sg-btn small" data-act="reading">LOG</button>` +
               (has
                 ? (pages >= READ_MIN
                     ? `<span class="sg-tag gold">${pages} PG</span>`
                     : `<span class="sg-tag red">${pages} PG — MIN ${READ_MIN}</span>`)
                 : '');
      }
      default: return '';
    }
  };

  const rowHtml = (key) => {
    const def = DEFS[key];
    const st = streak(key);
    return `<div class="hab-row" data-row="${key}">
      <div class="hab-head">
        <span class="hab-name">${def.name}</span>
        <span class="hab-streak">CUR <b>${st.current}</b> / MAX <b>${st.longest}</b></span>
        <span class="hab-ctl">${controlHtml(key)}</span>
      </div>
      <div class="hab-chain">${chainHtml(key)}</div>
    </div>`;
  };

  const bindView = (el) => {
    el.querySelectorAll('[data-act]').forEach(btn => {
      btn.addEventListener('click', () => {
        const act = btn.getAttribute('data-act');
        const row = btn.closest('.hab-row');
        const inVal = (name) => {
          const n = row ? row.querySelector(`[data-in="${name}"]`) : null;
          return n ? n.value : '';
        };
        if (act === 'wake') logWake();
        else if (act === 'shower') logShower();
        else if (act === 'phone') setPhone(inVal('phone'));
        else if (act === 'pray') togglePrayer(parseInt(btn.getAttribute('data-i'), 10));
        else if (act === 'water') addWater(WATER_STEP);
        else if (act === 'sleep') logSleep(inVal('sleep'));
        else if (act === 'reading') logReading(inVal('rfrom'), inVal('rto'));
      });
    });
  };

  const renderView = (el) => {
    el.innerHTML = `
      <div class="sg-h">HABIT CHAINS — LAST ${CHAIN_DAYS} DAYS</div>
      <div class="hab-legend">
        <span><span class="cell l4"></span> COMPLETE</span>
        <span><span class="cell broken"></span> BROKEN</span>
        <span><span class="cell"></span> NO DATA / PENDING</span>
      </div>
      ${ORDER.map(rowHtml).join('')}`;
    bindView(el);
  };

  /* ---------- dashboard card ---------- */
  const tcRow = (key) => {
    const def = DEFS[key];
    const today = Core.todayKey();
    const done = isComplete(key, today);
    let val = '—', valCls = '', hint = '';
    if (key === 'wake') {
      if (done) val = 'UP';
      else if (wakeWindow().open) hint = "I'M UP";
      else { val = 'MISSED'; valCls = ' miss'; }
    } else if (key === 'coldShower') {
      if (done) val = 'DONE'; else hint = 'LOG';
    } else if (key === 'phone') {
      const v = todayVal('phone');
      if (typeof v === 'number' && isFinite(v)) val = v + 'H';
    } else if (key === 'prayer') {
      const arr = prayersToday();
      const n = arr.filter(Boolean).length;
      val = n + '/5';
      const i = arr.indexOf(false);
      if (i >= 0) hint = PRAYERS[i];
    } else if (key === 'water') {
      const raw = todayVal('water');
      const v = typeof raw === 'number' && isFinite(raw) ? raw : 0;
      val = v + '/' + WATER_TARGET;
      if (v < WATER_TARGET) hint = '+' + WATER_STEP;
    } else if (key === 'sleep') {
      const v = todayVal('sleep');
      if (typeof v === 'string' && v.length > 0) val = v;
    } else if (key === 'reading') {
      const v = todayVal('reading');
      if (v && typeof v === 'object' && isFinite(Number(v.pages))) {
        const p = Math.floor(Number(v.pages));
        val = p + 'PG';
        if (p < READ_MIN) valCls = ' miss';
      }
    }
    const quick = key === 'wake' || key === 'coldShower' || key === 'water' || key === 'prayer';
    return `<div class="hab-tc${quick ? ' click' : ''}" data-habit="${key}" title="${Core.esc(def.name)}">
      <span class="hab-dot${done ? ' on' : ''}"></span>
      <span class="hab-tc-abbr">${def.abbr}</span>
      <span class="hab-tc-val num${valCls}">${Core.esc(val)}</span>
      ${hint ? `<span class="hab-tc-hint">${Core.esc(hint)}</span>` : ''}
    </div>`;
  };

  const cardRows = () => ORDER.map(tcRow).join('');
  const todayCard = () => `<div class="hab-card">${cardRows()}</div>`;

  const bindCard = (el) => {
    if (!el) return;
    const card = (el.classList && el.classList.contains('hab-card'))
      ? el : (el.querySelector('.hab-card') || el);
    card.querySelectorAll('[data-habit]').forEach(node => {
      node.addEventListener('click', () => {
        const key = node.getAttribute('data-habit');
        const today = Core.todayKey();
        let acted = true;
        if (key === 'wake') {
          if (isComplete('wake', today)) acted = false; else logWake();
        } else if (key === 'coldShower') {
          if (isComplete('coldShower', today)) acted = false; else logShower();
        } else if (key === 'water') {
          addWater(WATER_STEP);
        } else if (key === 'prayer') {
          const arr = prayersToday();
          const i = arr.indexOf(false);
          if (i >= 0) togglePrayer(i); else acted = false;
        } else {
          Shell.navigate('habits');
          return;
        }
        if (acted) { card.innerHTML = cardRows(); bindCard(card); }
      });
    });
  };

  /* ---------- init ---------- */
  let onRoll = null;
  const init = () => {
    Shell.registerView('habits', {
      title: 'HABITS',
      render(el) { renderView(el); },
      mount() {
        onRoll = () => { try { if (Shell.current() === 'habits') Shell.refresh(); } catch (e) { /* noop */ } };
        Core.Bus.on('day:rollover', onRoll);
      },
      unmount() {
        if (onRoll) { Core.Bus.off('day:rollover', onRoll); onRoll = null; }
      }
    });
  };

  return {
    init, todayCard, bindCard,
    logWake, logShower, setPhone, togglePrayer, addWater, logSleep, logReading,
    chain, streak
  };
})();
