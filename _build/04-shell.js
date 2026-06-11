/* ===== MODULE 04: Shell — sidebar, router, overlays, toasts, chrome ===== */
const Shell = (() => {
  'use strict';

  const views = {};          // key -> {title, render, mount, unmount}
  let currentKey = null;
  let currentView = null;

  const NAV = [
    { key: 'dashboard', sym: '⊞', title: 'DASHBOARD' },
    { key: 'siege',     sym: '⚔', title: 'ACTIVE SIEGE' },
    { key: 'chess',     sym: '♟', title: 'CHESS' },
    { key: 'igcse',     sym: '📐', title: 'IGCSE' },
    { key: 'outreach',  sym: '☎', title: 'OUTREACH' },
    { key: 'gym',       sym: '⚡', title: 'GYM' },
    { key: 'building',  sym: '🔨', title: 'BUILDING' },
    { key: 'mun',       sym: '🏛', title: 'MUN' },
    { key: 'habits',    sym: '◉', title: 'HABITS' },
    { key: 'analytics', sym: '📊', title: 'ANALYTICS' }
  ];

  const registerView = (key, def) => { views[key] = def; };

  // ---------- routing ----------
  const keyFromHash = () => {
    const m = (location.hash || '').match(/^#\/([a-z]+)/);
    return m && views[m[1]] ? m[1] : 'dashboard';
  };

  const renderView = (key) => {
    const def = views[key];
    if (!def) return;
    if (currentView && currentView.unmount) { try { currentView.unmount(); } catch (e) { console.error(e); } }
    currentKey = key;
    currentView = def;
    const el = document.getElementById('view');
    el.innerHTML = '';
    try { def.render(el); } catch (e) {
      console.error('[shell] render failed', key, e);
      el.innerHTML = `<div class="sg-empty">VIEW ERROR: ${Core.esc(e.message)}</div>`;
    }
    if (def.mount) { try { def.mount(el); } catch (e) { console.error(e); } }
    el.scrollTop = 0;
    document.querySelectorAll('#sidebar .sb-item').forEach(b => {
      b.classList.toggle('active', b.dataset.key === key);
    });
    Core.Bus.emit('route:changed', key);
  };

  const navigate = (key) => {
    if (location.hash === '#/' + key) renderView(key);
    else location.hash = '#/' + key;
  };

  const current = () => currentKey;
  const refresh = () => { if (currentKey) renderView(currentKey); };

  // ---------- sidebar ----------
  const renderSidebar = () => {
    const sb = document.getElementById('sidebar');
    sb.innerHTML =
      NAV.map(n =>
        `<button class="sb-item" data-key="${n.key}" title="${n.title}">${n.sym}</button>`
      ).join('') +
      `<div class="sb-spacer"></div>
       <button class="sb-item" data-key="settings" title="SETTINGS">⚙</button>`;
    sb.querySelectorAll('.sb-item').forEach(b => {
      b.addEventListener('click', () => navigate(b.dataset.key));
    });
  };

  const applyLockState = () => {
    document.querySelectorAll('#sidebar .sb-item').forEach(b => {
      const k = b.dataset.key;
      if (Core.DOMAINS.includes(k)) {
        b.classList.toggle('sb-locked', Decay.isLocked(k));
      }
    });
  };

  // ---------- chrome (hidden during active siege) ----------
  const hideChrome = (hide) => {
    document.getElementById('app').style.display = hide ? 'none' : 'grid';
  };

  // ---------- overlays ----------
  const overlay = (html, opts = {}) => {
    const root = document.getElementById('overlays');
    const ov = document.createElement('div');
    ov.className = 'sg-overlay';
    ov.innerHTML = `<div class="sg-overlay-inner ${opts.cls || ''}">${html}</div>`;
    root.appendChild(ov);
    const close = () => { if (ov.parentNode) ov.parentNode.removeChild(ov); };
    if (opts.dismissible) {
      ov.addEventListener('click', (e) => { if (e.target === ov) close(); });
      const onKey = (e) => {
        if (e.key === 'Escape') { close(); document.removeEventListener('keydown', onKey); }
      };
      document.addEventListener('keydown', onKey);
    }
    return { el: ov, close };
  };

  // ---------- toasts ----------
  const toast = (msg, kind = 'info') => {
    const root = document.getElementById('toasts');
    const t = document.createElement('div');
    t.className = 'sg-toast' + (kind === 'ok' ? ' ok' : kind === 'err' ? ' err' : '');
    t.textContent = msg;
    root.appendChild(t);
    setTimeout(() => { if (t.parentNode) t.parentNode.removeChild(t); }, 5000);
  };

  // ---------- typed confirmation ----------
  const confirmTyped = (message, required) => new Promise((resolve) => {
    const { el, close } = overlay(`
      <div class="sg-h">CONFIRMATION REQUIRED</div>
      <p style="margin:8px 0;color:var(--txt)">${Core.esc(message)}</p>
      <p class="sg-sub" style="margin-bottom:6px">TYPE <b style="color:var(--red)">${Core.esc(required)}</b> TO PROCEED.</p>
      <input class="sg-input" id="confirm-typed-input" autocomplete="off" spellcheck="false">
      <div class="sg-row mt">
        <button class="sg-btn danger" id="confirm-typed-go" disabled>PROCEED</button>
        <button class="sg-btn" id="confirm-typed-cancel">CANCEL</button>
      </div>`, { cls: 'danger' });
    const input = el.querySelector('#confirm-typed-input');
    const go = el.querySelector('#confirm-typed-go');
    input.focus();
    input.addEventListener('input', () => { go.disabled = input.value !== required; });
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && input.value === required) { close(); resolve(true); }
    });
    go.addEventListener('click', () => { close(); resolve(true); });
    el.querySelector('#confirm-typed-cancel').addEventListener('click', () => { close(); resolve(false); });
  });

  // ---------- init ----------
  const init = () => {
    renderSidebar();

    window.addEventListener('hashchange', () => renderView(keyFromHash()));

    // '/' focuses the command bar from anywhere (unless typing in an input)
    document.addEventListener('keydown', (e) => {
      const tag = (document.activeElement && document.activeElement.tagName) || '';
      const typing = tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT';
      if (e.key === '/' && !typing) {
        const cmd = document.getElementById('cmd-input');
        if (cmd && document.getElementById('app').style.display !== 'none') {
          e.preventDefault();
          cmd.focus();
        }
      }
    });

    Core.Bus.on('decay:run', applyLockState);
    applyLockState();
    renderView(keyFromHash());
  };

  return { init, registerView, navigate, current, refresh, overlay, toast, confirmTyped, hideChrome, applyLockState };
})();
