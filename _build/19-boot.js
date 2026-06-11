/* ===== MODULE 19: Boot — startup orchestration ===== */
const Boot = (() => {
  'use strict';

  const initModules = () => {
    // order matters only for view registration aesthetics; all calls are safe post-definition
    const mods = [Habits, Dashboard, ChessMod, IGCSE, Outreach, Gym, Building, MUN,
                  Analytics, Briefing, Commands, Settings];
    for (const m of mods) {
      try { if (m && typeof m.init === 'function') m.init(); }
      catch (e) { console.error('[boot] module init failed', e); }
    }
  };

  const start = async () => {
    Core.load();

    if (!Core.S.config.onboarded) {
      await Settings.onboard();
    }

    initModules();

    Decay.run();
    Decay.tick();

    Shell.init();

    // an active siege survives reload — re-enter it before anything else
    const resumed = (() => { try { return Siege.resume(); } catch (e) { console.error(e); return false; } })();
    if (resumed) return;

    if (Decay.isCritical()) {
      Decay.showCritical();
      return;
    }

    Briefing.maybeShow();
  };

  document.readyState === 'loading'
    ? document.addEventListener('DOMContentLoaded', () => { start(); })
    : start();

  return { start };
})();
