/* ===== MODULE 05: Siege — fullscreen timed sessions, proof gate, focus lock ===== */
const Siege = (() => {
  'use strict';

  const STORE_KEY = 'siege_active';
  const registry = {};        // domain key -> hooks {prepare, body?, validate, summary?}
  let session = null;         // active session (siege, or focus lock with kind:'lock')
  let tickId = null;
  let validating = false;
  let viewRegistered = false;
  let els = {};               // live DOM refs inside #siege-root

  // ---------- helpers ----------
  const root = () => document.getElementById('siege-root');

  const persist = () => {
    if (!session) return;
    try { sessionStorage.setItem(STORE_KEY, JSON.stringify(session)); }
    catch (e) { console.error('[siege] persist failed', e); }
  };
  const clearStore = () => { try { sessionStorage.removeItem(STORE_KEY); } catch (e) {} };

  const metaName = (s) => {
    const m = Core.META[s.domain];
    let name = m ? m.name : String(s.domain || '').toUpperCase();
    if (s.subject && Core.SUBJECTS[s.subject]) name += ' — ' + Core.SUBJECTS[s.subject].name;
    return name;
  };
  const recoveryTag = (s) => s.recovery ? ' <span class="sg-tag red">RECOVERY SIEGE</span>' : '';

  const findMission = (id) => {
    if (!id || !Array.isArray(Core.S.missions)) return null;
    return Core.S.missions.find(m => m && m.id === id) || null;
  };
  const setMission = (id, status) => {
    const m = findMission(id);
    if (m) m.status = status;
    return m;
  };

  const lowestSubject = () => {
    const subs = (Core.S.domains.igcse && Core.S.domains.igcse.subjects) || {};
    let best = null, bestH = Infinity;
    for (const k of Object.keys(subs)) {
      const h = Number(subs[k] && subs[k].health);
      if (isFinite(h) && h < bestH) { bestH = h; best = k; }
    }
    return best || 'chemistry';
  };

  const updateGlobalStreak = () => {
    const today = Core.todayKey();
    const st = Core.S.streaks || (Core.S.streaks = { current: 0, longest: 0, lastFullDay: null });
    if (Core.S.missionsDate !== today) return;
    const ms = Core.S.missions || [];
    if (!ms.length) return;
    if (!ms.every(m => m && m.status === 'completed')) return;
    if (st.lastFullDay === today) return;
    st.current = (st.lastFullDay === Core.daysAgo(1)) ? (st.current || 0) + 1 : 1;
    st.longest = Math.max(st.longest || 0, st.current);
    st.lastFullDay = today;
  };

  const setStatus = (text, kind) => {
    if (!els.status) return;
    els.status.textContent = text;
    els.status.classList.toggle('siege-err', kind === 'err');
    els.status.classList.toggle('siege-ok', kind === 'ok');
  };

  // ---------- fullscreen takeover ----------
  const takeover = () => {
    const r = root();
    r.classList.add('on');
    try { Shell.hideChrome(true); } catch (e) {}
    // typed-confirm modals live in #overlays (z 100) below #siege-root (z 200) — raise them
    const ov = document.getElementById('overlays');
    if (ov) ov.style.zIndex = '250';
    return r;
  };

  const exitFullscreen = () => {
    stopTick();
    const r = root();
    if (r) { r.classList.remove('on'); r.innerHTML = ''; }
    const ov = document.getElementById('overlays');
    if (ov) ov.style.zIndex = '';
    try { Shell.hideChrome(false); } catch (e) {}
    clearStore();
    document.title = 'SIEGE';
    session = null;
    validating = false;
    els = {};
    try { Shell.refresh(); } catch (e) {}
  };

  // ---------- timer ----------
  const stopTick = () => { if (tickId) { clearInterval(tickId); tickId = null; } };
  const startTick = () => { stopTick(); tickId = setInterval(onTick, 1000); onTick(); };

  const onTick = () => {
    if (!session) { stopTick(); return; }
    const remaining = Math.max(0, Math.ceil((new Date(session.endsAt).getTime() - Date.now()) / 1000));
    const clock = Core.fmtClock(remaining);
    if (els.timer) els.timer.textContent = clock;
    document.title = clock + ' — SIEGE';
    if (els.textarea) session.proofDraft = els.textarea.value;
    persist();
    if (remaining > 0) return;
    if (session.kind === 'lock') {
      exitFullscreen();
      Shell.toast('LOCK COMPLETE.', 'ok');
      return;
    }
    enterProofPhase();
    stopTick();
  };

  const enterProofPhase = () => {
    if (!session || session.kind === 'lock') return;
    session.status = 'proof';
    if (els.frame) els.frame.classList.add('proof-phase');
    if (els.timer) { els.timer.classList.add('proof-phase'); els.timer.textContent = '00:00'; }
    if (els.submit && !validating) els.submit.disabled = false;
    if ((session.rejections | 0) > 0) {
      setStatus('PROOF REJECTED: ' + (session.lastReason || 'INSUFFICIENT PROOF') + ' — ONE RETRY REMAINS.', 'err');
    } else {
      setStatus('TIMER COMPLETE. SUBMIT PROOF NOW.');
    }
    persist();
  };

  // ---------- screens ----------
  const renderPrepare = () => {
    const r = takeover();
    r.innerHTML =
      `<div class="siege-frame"></div>
       <div class="siege-prep">
         <div class="siege-domain">${Core.esc(metaName(session))}${recoveryTag(session)}</div>
         <div class="siege-prep-line">GENERATING BRIEF…</div>
         <div class="siege-prep-sub">STAND BY. THE BRIEF DECIDES WHAT YOU WORK ON.</div>
       </div>`;
    els = {};
  };

  const renderActive = () => {
    const r = takeover();
    const s = session;
    const proofPhase = s.status === 'proof';
    const hasTextarea = s.proofType !== 'inapp';
    r.innerHTML =
      `<div class="siege-frame${proofPhase ? ' proof-phase' : ''}"></div>
       <div class="siege-timer${proofPhase ? ' proof-phase' : ''}">--:--</div>
       <div class="siege-domain">${Core.esc(metaName(s))}${recoveryTag(s)}</div>
       <div class="siege-objective">${Core.esc(s.objective || '')}</div>
       ${s.detail ? `<div class="siege-detail">${s.detail}</div>` : ''}
       <div class="siege-body" id="siege-body"></div>
       <div class="siege-proof">
         ${hasTextarea ? `<textarea class="sg-textarea" id="siege-proof-text" spellcheck="false" placeholder="${Core.esc(s.proofPlaceholder || '')}"></textarea>` : ''}
         <div class="sg-row mt">
           <button class="sg-btn green" id="siege-submit"${proofPhase ? '' : ' disabled'}>SUBMIT PROOF</button>
           <button class="sg-btn small siege-abandon" id="siege-abandon">ABANDON</button>
         </div>
         <div class="siege-status" id="siege-status"></div>
       </div>`;
    els = {
      frame: r.querySelector('.siege-frame'),
      timer: r.querySelector('.siege-timer'),
      body: r.querySelector('#siege-body'),
      textarea: r.querySelector('#siege-proof-text'),
      submit: r.querySelector('#siege-submit'),
      status: r.querySelector('#siege-status')
    };
    if (els.textarea) {
      els.textarea.value = s.proofDraft || '';
      els.textarea.addEventListener('input', () => { s.proofDraft = els.textarea.value; persist(); });
    }
    const hooks = registry[s.domain];
    if (hooks && typeof hooks.body === 'function') {
      try { hooks.body(els.body, s); } catch (e) { console.error('[siege] body hook failed', e); }
    }
    els.submit.addEventListener('click', submitProof);
    r.querySelector('#siege-abandon').addEventListener('click', () => { abort('abandon button'); });
    if (proofPhase && (s.rejections | 0) > 0) {
      setStatus('PROOF REJECTED: ' + (s.lastReason || 'INSUFFICIENT PROOF') + ' — ONE RETRY REMAINS.', 'err');
    } else if (proofPhase) {
      setStatus('TIMER COMPLETE. SUBMIT PROOF NOW.');
    } else {
      setStatus('PROOF UNLOCKS WHEN THE TIMER ENDS. WORK.');
    }
    startTick();
  };

  const renderLock = () => {
    const r = takeover();
    const min = Math.max(1, Math.round((session.durationSec || 60) / 60));
    r.innerHTML =
      `<div class="siege-frame"></div>
       <div class="siege-timer">--:--</div>
       <div class="siege-lock-line">LOCKED. ${min} MINUTES.</div>
       <button class="sg-btn small siege-abandon" id="siege-lock-abandon">ABANDON LOCK</button>`;
    els = { timer: r.querySelector('.siege-timer') };
    r.querySelector('#siege-lock-abandon').addEventListener('click', abortLock);
  };

  const renderPanel = (ok, info) => {
    const s = session;
    const r = root();
    let summary = '';
    if (ok) {
      const hooks = registry[s.domain];
      if (hooks && typeof hooks.summary === 'function') {
        try { summary = hooks.summary(s) || ''; } catch (e) { console.error('[siege] summary hook failed', e); }
      }
    }
    r.innerHTML =
      `<div class="siege-frame ${ok ? 'proof-phase' : 'siege-fail'}"></div>
       <div class="siege-panel${ok ? '' : ' siege-panel-fail'}">
         <div class="siege-panel-title">${ok ? 'SIEGE COMPLETE' : 'SIEGE FAILED'}</div>
         <div class="siege-domain">${Core.esc(metaName(s))}${recoveryTag(s)}</div>
         <div class="sg-kv"><span>OBJECTIVE</span><span>${Core.esc(String(s.objective || '').slice(0, 140))}</span></div>
         <div class="sg-kv"><span>DURATION</span><span>${Math.round((s.durationSec || 0) / 60)} MIN</span></div>
         ${info.score !== undefined ? `<div class="sg-kv"><span>SCORE</span><span>${Core.esc(info.score)}</span></div>` : ''}
         ${ok
           ? `<div class="siege-panel-health">+${Math.round(info.gained || 0)} HEALTH RESTORED</div>
              <div class="siege-panel-reason">VALIDATION: ${Core.esc(info.reason || '')}</div>`
           : `<div class="siege-panel-health siege-panel-nohealth">SIEGE FAILED. NO HEALTH RESTORED.</div>
              <div class="siege-panel-reason">PROOF REJECTED: ${Core.esc(info.reason || '')}</div>`}
         ${summary ? `<div class="siege-panel-summary">${summary}</div>` : ''}
         <div class="sg-row mt"><button class="sg-btn" id="siege-exit">EXIT</button></div>
       </div>`;
    els = {};
    r.querySelector('#siege-exit').addEventListener('click', exitFullscreen);
  };

  // ---------- proof submission ----------
  const submitProof = async () => {
    if (!session || session.status !== 'proof' || validating) return;
    const proofText = els.textarea ? els.textarea.value.trim() : '';
    if (session.proofType !== 'inapp' && !proofText) {
      setStatus('EMPTY PROOF. PASTE THE WORK.', 'err');
      return;
    }
    validating = true;
    if (els.submit) els.submit.disabled = true;
    setStatus('VALIDATING PROOF…');
    let result = null;
    const hooks = registry[session.domain];
    try {
      if (hooks && typeof hooks.validate === 'function') {
        result = await hooks.validate(session, proofText);
      } else {
        result = await AI.validateProof({
          domain: session.domain, objective: session.objective,
          proofType: session.proofType, proof: proofText
        });
      }
    } catch (e) {
      console.error('[siege] validate failed', e);
      try {
        result = await AI.validateProof({
          domain: session.domain, objective: session.objective,
          proofType: session.proofType, proof: proofText
        });
      } catch (e2) {
        const dup = Array.isArray(Core.S.proofHashes) && Core.S.proofHashes.includes(Core.hash(proofText));
        result = { valid: !dup && proofText.length >= 40, reason: 'LOCAL CHECK ONLY — VALIDATOR UNAVAILABLE' };
      }
    }
    validating = false;
    if (!session || session.status !== 'proof') return;  // aborted mid-validation
    if (!result || typeof result.valid !== 'boolean') {
      result = { valid: false, reason: 'VALIDATOR RETURNED NOTHING' };
    }
    if (result.valid) { complete(proofText, result); return; }
    session.rejections = (session.rejections | 0) + 1;
    session.lastReason = String(result.reason || 'INSUFFICIENT PROOF');
    if (session.rejections >= 2) { fail(proofText, session.lastReason); return; }
    persist();
    if (els.submit) els.submit.disabled = false;
    setStatus('PROOF REJECTED: ' + session.lastReason + ' — ONE RETRY REMAINS.', 'err');
  };

  const complete = (proofText, result) => {
    const s = session;
    s.status = 'done';
    const durationMin = Math.round((s.durationSec || 0) / 60);
    const d = Core.S.domains[s.domain];
    const before = d ? (Number(d.health) || 0) : 0;
    const weak = result.weakArea !== undefined ? !!result.weakArea : !!s.weakArea;
    try {
      Decay.restore(s.domain, { subject: s.subject || null, weakArea: weak, recovery: !!s.recovery });
    } catch (e) { console.error('[siege] restore failed', e); }
    const after = d ? (Number(d.health) || 0) : before;
    const gained = Math.max(0, Math.round(after - before));
    const entry = {
      t: Core.iso(), durationMin, objective: s.objective,
      proof: String(proofText || '').slice(0, 400), proofType: s.proofType,
      valid: true, recovery: !!s.recovery, assessment: String(result.reason || '')
    };
    if (result.score !== undefined) entry.score = result.score;
    if (d && Array.isArray(d.history)) d.history.push(entry);
    if (proofText && !Array.isArray(Core.S.proofHashes)) Core.S.proofHashes = [];
    if (proofText) Core.S.proofHashes.unshift(Core.hash(proofText));
    setMission(s.missionId, 'completed');
    updateGlobalStreak();
    Core.save();
    Core.log('siege:completed', {
      domain: s.domain, subject: s.subject, recovery: !!s.recovery,
      durationMin, missionId: s.missionId, score: result.score,
      objective: String(s.objective || '').slice(0, 200)
    });
    if (s.recovery) Core.log('siege:recovery', { domain: s.domain });
    stopTick();
    clearStore();
    Core.Bus.emit('siege:done', s);
    renderPanel(true, { gained, reason: entry.assessment, score: result.score });
  };

  const fail = (proofText, reason) => {
    const s = session;
    s.status = 'failed';
    const durationMin = Math.round((s.durationSec || 0) / 60);
    const d = Core.S.domains[s.domain];
    if (d && Array.isArray(d.history)) {
      d.history.push({
        t: Core.iso(), durationMin, objective: s.objective,
        proof: String(proofText || '').slice(0, 400), proofType: s.proofType,
        valid: false, recovery: !!s.recovery, assessment: String(reason || '')
      });
    }
    setMission(s.missionId, 'failed');
    Core.save();
    Core.log('siege:failed', {
      domain: s.domain, subject: s.subject, recovery: !!s.recovery,
      durationMin, reason: String(reason || '').slice(0, 200)
    });
    stopTick();
    clearStore();
    Core.Bus.emit('siege:done', s);
    renderPanel(false, { reason });
  };

  // ---------- abort ----------
  const abort = async (reason) => {
    if (!session) return;
    if (session.kind === 'lock') { abortLock(); return; }
    if (session.status === 'done' || session.status === 'failed') return;
    const ok = await Shell.confirmTyped('ABANDONING COUNTS AS A FAILED SIEGE.', 'I QUIT');
    if (!ok || !session || session.kind === 'lock') return;
    if (session.status === 'done' || session.status === 'failed') return;
    const s = session;
    s.status = 'failed';
    const durationMin = Math.round((s.durationSec || 0) / 60);
    const d = Core.S.domains[s.domain];
    if (d && Array.isArray(d.history)) {
      d.history.push({
        t: Core.iso(), durationMin, objective: s.objective, proof: '',
        proofType: s.proofType, valid: false, recovery: !!s.recovery, assessment: 'ABANDONED'
      });
    }
    setMission(s.missionId, 'failed');
    Core.save();
    Core.log('siege:aborted', {
      domain: s.domain, subject: s.subject, recovery: !!s.recovery,
      durationMin, reason: String(reason || 'user')
    });
    exitFullscreen();
    Shell.toast('SIEGE ABANDONED. LOGGED AS FAILURE.', 'err');
  };

  const abortLock = async () => {
    if (!session || session.kind !== 'lock') return;
    const ok = await Shell.confirmTyped('BREAKING THE LOCK ENDS THE SESSION.', 'I QUIT');
    if (!ok || !session || session.kind !== 'lock') return;
    exitFullscreen();
    Shell.toast('LOCK ABANDONED.', 'err');
  };

  // ---------- view ----------
  const ensureView = () => {
    if (viewRegistered) return;
    try {
      Shell.registerView('siege', {
        title: 'ACTIVE SIEGE',
        render(el) {
          if (session && session.kind !== 'lock') {
            el.innerHTML =
              `<div class="sg-h">ACTIVE SIEGE</div>
               <div class="sg-card">
                 <div class="sg-kv"><span>DOMAIN</span><span>${Core.esc(metaName(session))}</span></div>
                 <div class="sg-kv"><span>OBJECTIVE</span><span>${Core.esc(String(session.objective || '').slice(0, 140))}</span></div>
                 <div class="sg-kv"><span>STATUS</span><span>${Core.esc(String(session.status || '').toUpperCase())}</span></div>
               </div>
               <button class="sg-btn green" id="siege-view-return">RETURN TO SIEGE</button>`;
            const btn = el.querySelector('#siege-view-return');
            if (btn) btn.addEventListener('click', () => {
              if (!session) return;
              if (session.kind === 'lock') renderLock(); else renderActive();
            });
          } else {
            el.innerHTML = `<div class="sg-empty">NO ACTIVE SIEGE — START ONE FROM A DOMAIN OR /siege &lt;domain&gt;</div>`;
          }
        }
      });
      viewRegistered = true;
    } catch (e) { console.error('[siege] view registration failed', e); }
  };

  // ---------- public api ----------
  const registerDomain = (key, hooks) => {
    ensureView();
    if (key && hooks && typeof hooks === 'object') registry[key] = hooks;
  };

  const start = async (opts = {}) => {
    const domain = opts.domain;
    let subject = opts.subject || null;
    const recovery = !!opts.recovery;
    const missionId = opts.missionId || null;

    ensureView();
    if (session) { Shell.toast('A SIEGE IS ALREADY ACTIVE. FINISH IT.', 'err'); return; }
    if (!domain || !Core.S.domains[domain]) { Shell.toast('UNKNOWN DOMAIN.', 'err'); return; }

    let gate = { ok: true, reason: '' };
    try { gate = Decay.canStart(domain, { recovery }) || gate; }
    catch (e) { console.error('[siege] canStart failed', e); }
    if (!gate.ok) { Shell.toast(gate.reason || 'DOMAIN BLOCKED.', 'err'); return; }

    const mission = findMission(missionId);
    if (mission && mission.subject && !subject) subject = mission.subject;
    if (domain === 'igcse' && !subject) subject = lowestSubject();

    const cfg = Core.S.config || {};
    const baseMin = (mission && Number(mission.durationMin) > 0)
      ? Number(mission.durationMin)
      : ((cfg.durations && Number(cfg.durations[domain]) > 0) ? Number(cfg.durations[domain]) : 30);
    const durationMin = recovery ? Math.round(baseMin * 1.5) : Math.round(baseMin);

    const s = {
      id: Core.uid(), domain, subject, recovery, missionId,
      objective: mission ? String(mission.objective || '') : '',
      detail: '', proofType: 'text', proofPlaceholder: '',
      weakArea: !!(mission && mission.weakArea),
      startedAt: null, durationSec: durationMin * 60, endsAt: null,
      status: 'preparing', data: {}, rejections: 0, lastReason: '', proofDraft: ''
    };
    session = s;
    if (mission) { mission.status = 'active'; Core.save(); }
    renderPrepare();

    const hooks = registry[domain];
    try {
      if (hooks && typeof hooks.prepare === 'function') await hooks.prepare(s);
    } catch (e) {
      console.error('[siege] prepare failed', e);
      if (session === s) {
        if (mission && mission.status === 'active') { mission.status = 'pending'; Core.save(); }
        exitFullscreen();
        Shell.toast('BRIEF GENERATION FAILED: ' + String((e && e.message) || e).slice(0, 120).toUpperCase(), 'err');
      }
      return;
    }
    if (session !== s) return;  // aborted while preparing

    if (!s.objective) {
      s.objective = metaName(s) + ' SIEGE. ' + durationMin + ' MINUTES OF FOCUSED WORK. DOCUMENT EVERYTHING YOU DID.';
    }
    if (s.proofType !== 'text' && s.proofType !== 'url' && s.proofType !== 'inapp') s.proofType = 'text';
    if (!s.proofPlaceholder && s.proofType !== 'inapp') {
      s.proofPlaceholder = s.proofType === 'url'
        ? 'PASTE THE URL. GAME, COMMIT, OR DEPLOYED PAGE.'
        : 'PASTE THE PROOF. SPECIFIC AND VERIFIABLE. MINIMUM 40 CHARACTERS.';
    }

    s.startedAt = Core.iso();
    s.endsAt = new Date(Date.now() + s.durationSec * 1000).toISOString();
    s.status = 'running';
    persist();
    Core.log('siege:started', {
      domain, subject, recovery, durationMin, missionId,
      objective: String(s.objective).slice(0, 200)
    });
    renderActive();
  };

  const active = () => (session && session.kind !== 'lock' ? session : null);

  const resume = () => {
    ensureView();
    let raw = null;
    try { raw = sessionStorage.getItem(STORE_KEY); } catch (e) {}
    if (!raw) return false;
    let s = null;
    try { s = JSON.parse(raw); } catch (e) {}
    if (!s || typeof s !== 'object' || !s.id || !s.endsAt) { clearStore(); return false; }
    const endMs = new Date(s.endsAt).getTime();
    if (isNaN(endMs)) { clearStore(); return false; }
    const nowMs = Date.now();

    if (s.kind === 'lock') {
      if (s.status === 'running' && nowMs < endMs) {
        session = s;
        renderLock();
        startTick();
        return true;
      }
      clearStore();
      return false;
    }

    if (!s.domain || !Core.S.domains[s.domain]) { clearStore(); return false; }

    if (s.status === 'running' && nowMs < endMs) {
      session = s;
      renderActive();
      return true;
    }
    if ((s.status === 'running' || s.status === 'proof') && nowMs >= endMs && (nowMs - endMs) <= 2 * 3600000) {
      s.status = 'proof';
      session = s;
      renderActive();
      return true;
    }
    clearStore();
    return false;
  };

  const focusLock = (minutes) => {
    ensureView();
    if (session) { Shell.toast('A SIEGE IS ALREADY ACTIVE.', 'err'); return; }
    let min = Math.round(Number(minutes));
    if (!isFinite(min) || min <= 0) min = 25;
    min = Core.clamp(min, 1, 600);
    session = {
      id: Core.uid(), kind: 'lock', domain: null, subject: null, recovery: false,
      missionId: null, objective: '', detail: '', proofType: 'text', proofPlaceholder: '',
      weakArea: false, startedAt: Core.iso(), durationSec: min * 60,
      endsAt: new Date(Date.now() + min * 60000).toISOString(),
      status: 'running', data: {}
    };
    persist();
    renderLock();
    startTick();
  };

  return { registerDomain, start, active, resume, abort, focusLock };
})();
