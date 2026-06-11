# SIEGE V2 — ARCHITECTURE CONTRACT (binding for every module)

The final artifact is ONE `siege.html`: `<head>` (fonts + Chart.js CDN + one `<style>`) → `<body>` (static shell markup) → one `<script type="module">` containing all JS modules concatenated **in numeric file order**.

## Hard rules for every module file

1. Each JS module file contains EXACTLY ONE top-level declaration:
   `const ModuleName = (() => { 'use strict'; /* ... */ return api; })();`
   No other top-level `const`/`let`/`function`/`class`. No `import`/`export`. No top-level `await`.
2. Files are concatenated into a single module scope. You MAY reference other modules' `const` bindings **inside function bodies** (they resolve at call time). You MUST NOT call or read another module during your IIFE's execution (TDZ — modules below you in the order don't exist yet). All cross-module work happens after `Boot` runs.
3. All dynamic strings interpolated into HTML go through `Core.esc()` (or `Core.md()` for AI prose). No exceptions — AI output and user input are untrusted.
4. UI copy: UPPERCASE labels, blunt imperative tone, no emoji, no encouragement, no exclamation marks. e.g. `NO PROOF. SIEGE FAILED.`
5. Every state mutation goes through `Core.S` followed by `Core.save()`. Never touch `localStorage` directly (only Core does).
6. Every significant event calls `Core.log(type, data)` (types listed below).
7. Each module may ship a companion CSS file (same number, `.css`). ALL selectors in it must be prefixed with the module's prefix (e.g. `.chess-`, `.igcse-`, `.brief-`). Use the design tokens and core components from `00-css.css` — do not redefine colors/fonts/buttons. NO `border-radius`, no gradients, no shadows, no animations except what 00 provides.
8. AI failure is normal. Every feature that uses `AI.*` MUST have a deterministic local fallback built from real local data and must never block the UI on error.

## Module load order (file → const name)

| # | file | const | author |
|---|------|-------|--------|
| 01 | 01-core.js | `Core` | provided |
| 02 | 02-ai.js | `AI` | agent |
| 03 | 03-decay.js | `Decay` | agent |
| 04 | 04-shell.js | `Shell` | provided |
| 05 | 05-siege.js | `Siege` | agent |
| 06 | 06-patterns.js | `Patterns` | agent |
| 07 | 07-habits.js | `Habits` | agent |
| 08 | 08-dashboard.js | `Dashboard` | agent |
| 09 | 09-chess.js | `ChessMod` | agent |
| 10 | 10-igcse.js | `IGCSE` | agent |
| 11 | 11-outreach.js | `Outreach` | agent |
| 12 | 12-gym.js | `Gym` | agent |
| 13 | 13-building.js | `Building` | agent |
| 14 | 14-mun.js | `MUN` | agent |
| 15 | 15-analytics.js | `Analytics` | agent |
| 16 | 16-briefing.js | `Briefing` | agent |
| 17 | 17-commands.js | `Commands` | agent |
| 18 | 18-settings.js | `Settings` | agent |
| 19 | 19-boot.js | `Boot` | provided |

---

## STATE SCHEMA (`Core.S`, persisted under `siege_*` keys)

```js
{
  domains: {
    chess:    { health:100, lastActive:ISO, lastDecayAt:ISO, streak:0, totalSieges:0, history:[] },
    igcse:    { ...same, subjects: {
        chemistry:       { health:100, lastActive:ISO, lastDecayAt:ISO, weakAreas:['balancing equations','Brønsted-Lowry acids/bases'], scores:[] },
        computerScience: { health:100, lastActive:ISO, lastDecayAt:ISO, weakAreas:[], scores:[] },
        english:         { health:100, lastActive:ISO, lastDecayAt:ISO, weakAreas:[], scores:[] },
        arabic:          { health:100, lastActive:ISO, lastDecayAt:ISO, weakAreas:[], scores:[] } } },
    outreach: { ...same, contacts:[], messagesSent:0, replies:0 },
    gym:      { ...same, nextSplit:'push', sessions:[] },   // sessions: [{date, split, sets:[{exercise,weight,reps,rpe}], volume}]
    building: { ...same, projects:[{name:'ReviewPilot',hours:0},{name:'Sinaan',hours:0},{name:'Meridian',hours:0},{name:'Siege',hours:0}] },
    mun:      { ...same, papers:[] }
  },
  // history entries: {t:ISO, durationMin, objective, proof, proofType, valid, recovery, assessment, score?}
  config: {
    apiKey:'', model:'claude-sonnet-4-6', lichessUsername:'',
    wakeUpTime:'06:00', reviewTime:'22:00',
    durations:{chess:25, igcse:35, outreach:15, gym:60, building:60, mun:30},   // minutes
    decay:{warnPerDay:10, critPerDay:20, lockHours:72},
    enabled:{chess:true, igcse:true, outreach:true, gym:true, building:true, mun:true},
    onboarded:false
  },
  log: [],                       // newest first: {t:ISO, type, ...data}; capped at 5000
  missions: [],                  // [{id, domain, subject?, objective, durationMin, weakArea:bool, status:'pending'|'active'|'completed'|'failed'}]
  missionsDate: null,            // dayKey the missions belong to
  streaks: { current:0, longest:0, lastFullDay:null },   // global: every mandatory mission completed that day
  habits: {
    wake:      { history:{} },   // dayKey -> true
    coldShower:{ history:{} },   // dayKey -> true
    phone:     { history:{} },   // dayKey -> hours (number)
    prayer:    { history:{} },   // dayKey -> [bool,bool,bool,bool,bool] (fajr,dhuhr,asr,maghrib,isha)
    water:     { history:{} },   // dayKey -> ml (number), target 3000
    sleep:     { history:{} },   // dayKey -> 'HH:MM'
    reading:   { history:{} }    // dayKey -> {from,to,pages}
  },
  briefing: { date:null, acked:false, data:null },   // data: {statusLines, mandatory, failures, hardTruth, source}
  debriefs: {},                  // dayKey -> {completed, missed, forecast, assessment, tomorrow, source}
  proofHashes: [],               // Core.hash() of every accepted proof (resubmission detection), capped 500
  aiNotes: {}                    // free cache: {'chess:analysis': {t, data}, 'monthly:2026-06': {...}}
}
```

**Log event types** (use these exact strings): `siege:started`, `siege:completed`, `siege:failed`, `siege:aborted`, `siege:recovery`, `domain:locked`, `domain:unlocked`, `health:snapshot` (daily, `{healths:{chess:n,...}}`), `habit:logged` (`{habit, value}`), `briefing:acked`, `debrief:done`, `manual:log` (`{text}`), `ai:error`, `outreach:sent`, `gym:set`, `mission:assigned`, `critical:entered`, `critical:cleared`, `nuke`.

---

## MODULE APIs (implement EXACTLY these signatures)

### Core (provided — read `01-core.js` before writing your module)

```
Core.S                                  // live state object (schema above)
Core.save()                             // persist everything
Core.load()  Core.reset()
Core.log(type, data={})                 // prepend log entry + save + Bus.emit('log',entry)
Core.uid() Core.iso() Core.now()
Core.todayKey() Core.dayKey(d) Core.daysAgo(n) Core.hoursSince(iso)
Core.clamp(n,lo,hi) Core.esc(s) Core.md(s) Core.hash(s)
Core.fmtClock(totalSec)                 // '24:59' / '1:04:09'
Core.fmtDate(dayKey)                    // 'JUN 10'
Core.fmtTime(iso)                       // '21:43'
Core.DOMAINS                            // ['chess','igcse','outreach','gym','building','mun']
Core.META                               // {chess:{name:'CHESS', sym:'♟'}, igcse:{name:'IGCSE', sym:'📐'}, outreach:{name:'OUTREACH', sym:'☎'}, gym:{name:'GYM', sym:'⚡'}, building:{name:'BUILDING', sym:'🔨'}, mun:{name:'MUN', sym:'🏛'}}
Core.SUBJECTS                           // {chemistry:{name:'CHEMISTRY', code:'0620'}, computerScience:{name:'COMPUTER SCIENCE', code:'0478'}, english:{name:'ENGLISH', code:'0510'}, arabic:{name:'ARABIC', code:'0508'}}
Core.enabledDomains()                   // DOMAINS filtered by config.enabled
Core.exportJSON() Core.importJSON(str)  // importJSON returns bool
Core.Bus.on(evt,fn) / .off(evt,fn) / .emit(evt,data)
```

Bus events in use: `'log'`, `'state:saved'`, `'decay:run'`, `'day:rollover'`, `'siege:done'`, `'route:changed'`.

### AI (02)

```
AI.SYSTEM                                // SIEGE system prompt verbatim from SPEC
AI.ready()                               // bool: apiKey present
AI.call({prompt, system=AI.SYSTEM, maxTokens=4096})  // → Promise<string>; throws AI.Error
AI.json({prompt, system=AI.SYSTEM, maxTokens=4096, shape})
   // appends strict JSON-only instruction + `shape` example; strips ``` fences; JSON.parse;
   // ONE retry feeding the parse error back; throws AI.Error on final failure
AI.context()                             // string: current data block — all domain healths + hours since active,
                                         // streaks, today's missions+status, habits today, last 30 log lines,
                                         // Patterns.detect() output. Injected into prompts by callers.
AI.validateProof({domain, objective, proofType, proof}) // → Promise<{valid:bool, reason:string}>
   // checks Core.S.proofHashes for resubmission FIRST (local, instant reject);
   // then AI judges legitimacy; on AI failure → local fallback: valid if proof.length>=40
   // and not a resubmission, reason 'LOCAL CHECK ONLY — AI UNAVAILABLE'
AI.ask(q)                                // → Promise<string>; /ask command; AI.context() included
AI.Error                                 // error class: {message, offline:bool, status?:number}
```

Endpoint per SPEC (model + key from `Core.S.config`). 30s timeout via AbortController. On HTTP 401/403 → toast `API KEY REJECTED. FIX IT IN /settings`. Log `ai:error` on every failure.

### Decay (03)

```
Decay.run()                  // apply time-based decay to every enabled domain AND igcse subject:
                             //   hours = hoursSince(lastActive); decay accrues continuously per band
                             //   (24-48h: warnPerDay/24 per h; 48h+: critPerDay/24 per h; floor 0),
                             //   applied incrementally since lastDecayAt; lock at >= lockHours.
                             // Writes one 'health:snapshot' log per day. Emits 'decay:run'.
                             // On lock transition: log 'domain:locked'. Handles CRITICAL entry/exit.
Decay.tick()                 // start 60s interval: run() + day-rollover detection (emit 'day:rollover')
Decay.state(domain)          // 'healthy'|'warning'|'critical'|'locked'
                             //   locked: hours>=lockHours; critical: hours>=48 OR health<=30;
                             //   warning: hours>=24 OR health<=60; else healthy
Decay.subjectState(subjKey)  // same banding for igcse subjects
Decay.isLocked(domain)       // bool
Decay.lockedDomains()        // [keys] (enabled only)
Decay.isCritical()           // lockedDomains().length >= 3
Decay.canStart(domain, {recovery=false})
                             // {ok:bool, reason:string} — if ANY domain is locked, only recovery
                             //   sieges on locked domains are allowed: reason 'RECOVER <X> FIRST'
Decay.forecast(domain)       // {daysToLock:number|null, line:string|null} e.g. 'CHESS LOCKS IN 2 DAYS'
Decay.forecastAll()          // [lines] for every enabled domain at risk, soonest first
Decay.restore(domain, {subject=null, weakArea=false, recovery=false})
                             // +15 base, +5 if domain.streak continues (last siege was yesterday/today),
                             // +10 if weakArea; clamp 100; set lastActive/lastDecayAt=now; streak++
                             // (streak resets to 1 if gap >1 day); totalSieges++; subject health too if given;
                             // unlock if was locked (log 'domain:unlocked'); save; emit 'decay:run'
Decay.showCritical()         // render SYSTEM FAILURE full-screen overlay (Shell.overlay, non-dismissible):
                             //   'SYSTEM FAILURE' + the locked domains + ONLY recovery siege buttons
                             //   (calls Siege.start({domain, recovery:true})). Guard: only one instance.
                             //   Closes itself when isCritical() becomes false (listen 'decay:run').
```

### Shell (04 — provided; read `04-shell.js`)

```
Shell.init()
Shell.registerView(key, {title, render(el), mount?(el), unmount?()})
Shell.navigate(key)          // sets location.hash = '#/'+key
Shell.current()              // current view key
Shell.refresh()              // re-render current view
Shell.overlay(html, {dismissible=false, cls=''})  // → {el, close()}; stacks; returns root element
Shell.toast(msg, kind='info')        // kind: 'info'|'ok'|'err'
Shell.confirmTyped(message, required) // → Promise<bool>; modal that requires typing `required`
Shell.hideChrome(hide)       // true during active siege: hides sidebar+commandbar
Shell.applyLockState()       // restyles sidebar per Decay states (call after decay events)
```

View keys (all must be registered): `dashboard, siege, chess, igcse, outreach, gym, building, mun, habits, analytics, settings`. Domain views are registered by their domain modules; `siege` view is registered by Siege (shows active siege or 'NO ACTIVE SIEGE — START ONE FROM A DOMAIN OR /siege <domain>').

### Siege (05)

```
Siege.registerDomain(key, hooks)   // each domain module calls this at Boot-time via its init()
  hooks = {
    prepare(session) → Promise<void>
       // MUST set: session.objective (string), session.proofType ('text'|'url'|'inapp'),
       //           session.proofPlaceholder (string)
       // MAY set: session.detail (SAFE html string), session.weakArea (bool), session.data ({})
       // Use AI with local fallback. For mandatory missions session.objective is pre-filled — keep it.
    body?(el, session)              // render in-app UI under the timer (IGCSE questions, Gym set logger)
    validate(session, proofText) → Promise<{valid:bool, reason:string, score?:string, weakArea?:bool}>
       // domain-specific validation; default path delegates to AI.validateProof
    summary?(session) → string      // SAFE html for post-siege panel
  }
Siege.start({domain, subject=null, recovery=false, missionId=null}) → Promise<void>
   // 1. Decay.canStart gate (toast reason on fail)  2. build session, duration =
   //    config.durations[domain] * (recovery?1.5:1)  3. hooks.prepare (show 'GENERATING BRIEF…')
   // 4. fullscreen takeover (Shell.hideChrome(true), render into #siege-root), log 'siege:started'
Siege.active() → session|null
Siege.resume() → bool              // called by Boot: restore session from sessionStorage('siege_active')
                                   //   if present & endsAt within last 2h; re-enter fullscreen
Siege.abort(reason)                // requires Shell.confirmTyped('TYPE "I QUIT" TO ABANDON','I QUIT');
                                   //   marks failed, log 'siege:aborted', mission→failed, exit fullscreen
Siege.focusLock(minutes)           // /lock: bare timer overlay, ESC disabled, only timer; no proof/log
session = {id, domain, subject, recovery, missionId, objective, detail, proofType,
           proofPlaceholder, weakArea, startedAt:ISO, durationSec, endsAt:ISO,
           status:'preparing'|'running'|'proof'|'done'|'failed', data:{}}
```

Behavior: timer counts down (1s interval, derive remaining from `endsAt`, not accumulated ticks). Persist session to sessionStorage each tick. Proof submission UI disabled until timer hits 0 (for `inapp` proofType the body UI is interactive throughout; SUBMIT unlocks at 0). At 0: status `proof`, green border stops pulsing, `SUBMIT PROOF` enabled. On submit → hooks.validate → if valid: `Decay.restore(domain,{subject,weakArea,recovery})`, push to `domains[d].history`, push proof hash, mission→completed, update global streak (if ALL today's missions completed and `streaks.lastFullDay !== today`: current++ or reset logic, longest=max, lastFullDay=today), log `siege:completed` (+`siege:recovery` if recovery), emit `'siege:done'`, show post-siege panel (validation reason, health gained, summary), then EXIT button → restore chrome, navigate back. If invalid: show reason `PROOF REJECTED: <reason>` with ONE retry allowed; second rejection → failed (log `siege:failed`, mission→failed, no health). Recovery siege duration ×1.5.

### Patterns (06)

```
Patterns.detect() → [{key, name, statement, evidence}]
  // PURE LOCAL analysis (no AI) of Core.S.log + domains + missions. Detect (only include if triggered):
  // domain_avoidance: a domain with 0 completed sieges in 5+ days while others have 3+ → name it, count days
  // comfort_cycling: avg health of (chess,building) − avg health of (outreach,igcse) >= 30
  // phantom_productivity: >=50% of last 7 days' building sieges were on project 'Siege' while outreach health < 50
  // time_displacement: in last 7 days, hard-domain missions (outreach,igcse) failed/missed while
  //   easy-domain (chess,building) completed same-day >= 3 times
  // streak_gaming: >=3 of last 5 completed sieges had proof length < 80 chars (non-inapp)
  // statement: blunt one-liner with real numbers, e.g.
  //   'COMFORT CYCLING. CHESS 95 / BUILDING 90 WHILE OUTREACH IS AT 20. THIS IS HIDING, NOT DISCIPLINE.'
Patterns.summary() → string   // newline-joined statements or 'NO AVOIDANCE PATTERNS DETECTED. KEEP IT THAT WAY.'
```

### Habits (07)

```
Habits.init()                       // registers 'habits' view
Habits.todayCard() → SAFE html      // compact dot-row for dashboard (one row per habit, today's state,
                                    //   clickable quick-log where applicable)
Habits.bindCard(el)                 // attach handlers after todayCard html is inserted
Habits.logWake()                    // only allowed before wakeUpTime+30min grace; else toast 'TOO LATE. CHAIN BROKEN.'
Habits.logShower() Habits.setPhone(hours) Habits.togglePrayer(i)
Habits.addWater(ml) Habits.logSleep('HH:MM') Habits.logReading(from,to)
Habits.chain(key, days=60) → [bool|null]  // per-day completion (null = no data/today pending)
                                    // complete means: wake/coldShower true; prayer all 5; water>=3000;
                                    //   reading pages>=20; phone logged; sleep logged
Habits.streak(key) → {current, longest}
```

Habits view: one horizontal chain bar per habit (60 days, GitHub-style cells but linear), gaps visually loud (deep red cell), current/longest streak numbers, today's logging controls. All habit logs call `Core.log('habit:logged',{habit,value})`.

### Dashboard (08)

```
Dashboard.init()   // registers 'dashboard' view per SPEC layout:
  // 1. six stacked horizontal health bars (use .sg-bar, state class from Decay.state, show health number,
  //    streak, hours-since-active, trend arrow ↑↓→ comparing today vs yesterday's health:snapshot)
  //    Locked domains: .locked-section + 'LOCKED — RECOVERY SIEGE REQUIRED'
  // 2. today's mission cards: domain sym+name, objective, duration, status chip, START/RESUME button
  //    (button calls Siege.start({domain,subject,missionId})); failed shown in red
  // 3. Habits.todayCard()
  // 4. briefing block: hardTruth (large, white, Syne) + Patterns.summary()
  // Re-render on Bus 'decay:run', 'siege:done', 'day:rollover' (only when current view is dashboard).
```

### Domain modules (09–14) — common shape

```
<Mod>.init()   // 1. Shell.registerView('<domain>', {...})  2. Siege.registerDomain('<domain>', hooks)
```

Every domain view shows: header (sym, name, health bar with state, streak, totalSieges, hours since active), START SIEGE button (disabled w/ reason if !Decay.canStart) or RECOVERY SIEGE button (red) if locked, siege history table (date, duration, objective, proof excerpt, VALID/FAILED, recovery flag), plus the domain-specific blocks below. Buttons call `Siege.start(...)`.

- **ChessMod (09):** `prepare`: fetch `https://lichess.org/api/games/user/{u}?max=10&rated=true` with header `Accept: application/x-ndjson`, parse NDJSON lines (fields: players.white/black .user.id + .rating, winner, moves, opening?). Cache in `aiNotes['chess:games']`. AI analyzes → objective + 3 positions/themes to study (detail). Fallback (no username/offline/AI fail): canned tactical drill objective for 1000–1200 (e.g. 'LICHESS PUZZLE STORM. 25 MINUTES. BEAT YOUR BEST SCORE. RECORD IT.'). proofType 'text' (game ID or puzzle score + what you learned). View extras: recent games W/L list if cached, identified weak patterns.
- **IGCSE (10):** view shows 4 subject sub-bars (Decay.subjectState), per-subject weak areas + last scores, per-subject START buttons. `Siege.start({domain:'igcse', subject})` — subject required (default = lowest-health subject). `prepare`: AI generates 10–15 exam-style questions (JSON: `[{q, type:'mcq'|'short', options?, marks}]`) within syllabus, biased to weakAreas, difficulty adapted to recent scores. Store in session.data.questions. Fallback: built-in question bank (≥8 real syllabus questions per subject hardcoded). proofType 'inapp'. `body`: render questions with inputs. `validate`: collect answers → AI marks (JSON `{scores:[], total, max, weakAreas:[], feedback}`) → score%, push to subject.scores, merge weakAreas; valid if attempted ≥70% of questions; AI-fail fallback: mark mcq locally via stored answer keys (fallback bank has keys), short answers accepted if non-empty, note 'LOCAL MARKING'. Returns score string + weakArea flag.
- **Outreach (11):** `prepare`: AI drafts 5 personalized Saudi-dialect Arabic cold messages (ReviewPilot / missed-call-text-back, Dammam dental clinics + pharmacies); shown in `detail` (and `body` renders them with COPY buttons). Fallback: 3 hardcoded Arabic templates clearly marked 'TEMPLATE — PERSONALIZE BEFORE SENDING'. proofType 'text': paste the messages actually sent. `validate`: AI checks personalization vs template + not resubmission; count sent → `messagesSent += n`, log `outreach:sent`. View extras: contacts table (name, business, status, add form), messagesSent / replies counters (increment buttons).
- **Gym (12):** PPL rotation in `domains.gym.nextSplit`. Built-in default programs: push/pull/legs arrays of {exercise, sets, reps, rpe} (proper-form, age-appropriate hypertrophy). `prepare`: today's split + prescribed exercises (AI may adjust based on last session; fallback = template); detail = workout table. proofType 'inapp'. `body`: set logger — each prescribed set row gets weight×reps×RPE inputs + LOG button (logs `gym:set`). `validate`: local — logged sets ≥ 80% of prescribed → valid (no AI needed); compute volume, compare vs last same-split session → overload line in summary; push session, advance nextSplit. View extras: last sessions volume table, next split indicator, `Gym.quickLog(setsxReps, weight, exercise)` for /quick.
- **Building (13):** view extras: projects table (name, hours, add project), select project before siege (lowest-attention default; mandatory missions may name one). `prepare`: AI generates ONE concrete task for the selected project (mentions ReviewPilot=Google review automation + missed-call recovery, Sinaan, Meridian, Siege). Fallback: 'SHIP ONE COMMIT TO <project>. SMALLEST DEPLOYABLE CHANGE. NO REFACTORS.' proofType 'text' (commit hash / diff / deployed URL). `validate`: AI legitimacy check + length; hours += durationMin/60 on project.
- **MUN (14):** `prepare`: AI generates committee + topic + country assignment + format (position paper / 1-min speech / resolution clause). Fallback: rotating hardcoded set of 5 assignments. proofType 'text' — write submission in the proof area (textarea is the work surface). `validate`: AI scores structure/argumentation 1–10 (≥5 valid) + 2-line critique; fallback: valid if ≥600 chars; push to papers.

### Analytics (15)

```
Analytics.init()   // registers 'analytics' view
```
Blocks: (a) 90-day completion heatmap — custom DOM grid (NOT Chart.js), 13 cols × 7 rows, intensity by sieges/day from log; (b) domain health over time — Chart.js line, one series per domain from `health:snapshot` logs; (c) completion rate by domain — completed/(completed+failed+aborted) from log, bar list; (d) avoidance index — domains ranked by (100−avgHealth)+10×missedMissions, worst first, in red; (e) streak records — per habit + per domain current/longest; (f) time distribution — Chart.js pie of completed siege minutes per domain; (g) AI monthly summary — button 'GENERATE MONTHLY REVIEW', cached in `aiNotes['monthly:<YYYY-MM>']`, fallback = local stats block. Chart.js may be ABSENT (offline): check `typeof Chart !== 'undefined'`; else render the same data as text tables. Charts styled: black bg, #1A1A1A grid, gold/red/green series, JetBrains Mono ticks (set Chart defaults once).

### Briefing (16)

```
Briefing.init()        // Bus.on('day:rollover', maybeShow); schedule debrief auto-prompt check in tick
Briefing.maybeShow()   // if S.briefing.date !== todayKey() OR !acked → show()
Briefing.show()        // full-screen non-dismissible overlay:
  // 1. domain status bars w/ trend arrows (vs yesterday snapshot)
  // 2. TODAY'S MANDATORY SIEGES — generate via AI ({mandatory:[{domain,subject?,objective,durationMin,weakArea}], hardTruth, failures:[...]})
  //    using AI.context(); 2–4 missions; selection rule in prompt: lowest health first, weak areas, streak maintenance.
  //    Local fallback: 2 lowest-health domains + (outreach if health<70) + canned hardTruth from Patterns.detect().
  // 3. YESTERDAY'S FAILURES — from log: missed/failed missions, locks, broken habit chains
  // 4. ONE HARD TRUTH — large white text
  // 'I UNDERSTAND' button → S.missions = mandatory (status pending, ids), missionsDate=today,
  //    briefing={date,acked:true,data}, log 'briefing:acked' + 'mission:assigned', save, close, Shell.refresh()
Briefing.debrief()     // full-screen overlay (dismissible): completed sieges w/ proof status, missed missions
  // + consequence (decay preview), Decay.forecastAll(), AI assessment (3–5 brutal sentences w/ real data;
  //   fallback local), tomorrow preview. Cache in S.debriefs[today]. log 'debrief:done'.
  // Auto-prompt: after config.reviewTime if not done today → toast once + dot on command bar.
```

### Commands (17)

```
Commands.init()        // wires the command input (Shell renders #cmd-input; Commands owns parsing)
Commands.exec(raw)     // parse + dispatch; unknown → toast 'UNKNOWN COMMAND. /help'
// /help (list), /siege <domain> [chem|cs|eng|ar], /quick gym <SxR> <Wkg> <exercise>, /status (overlay table),
// /log "text" (manual:log), /ask <q> (overlay with answer; streaming not required),
// /lock [min=25] → Siege.focusLock, /export → Core.exportJSON download, /nuke → confirmTyped('I UNDERSTAND') → Core.reset()+reload,
// /settings /debrief /brief → navigate or open
// History: up/down arrows recall previous commands (session only).
```

### Settings (18)

```
Settings.init()        // registers 'settings' view
Settings.onboard() → Promise<void>   // first-run overlay (non-dismissible): API key, lichess username,
                                     // wake time. SAVE → config.onboarded=true. Resolves when done.
```
View: every config field (api key as password input + SHOW toggle, model id, lichess, wake/review times, per-domain durations, decay rates, enable/disable domain checkboxes), EXPORT (download json) / IMPORT (file input → Core.importJSON → reload), NUKE button (same as /nuke). Saving applies instantly (Core.save + toast 'SAVED.').

### Boot (19 — provided)

Order: `Core.load()` → if `!config.onboarded` → `await Settings.onboard()` → init all modules → `Decay.run()`/`tick()` → `Shell.init()` → `Siege.resume()` (if resumed, stop) → `Briefing.maybeShow()` → `Decay.isCritical() && Decay.showCritical()`.

---

## CSS CONTRACT (00-css.css is provided — READ IT)

Tokens: `--bg --gold --red-deep --red --green --txt --white --dim --border --warn` (warn = #E8D44D), fonts `--f-disp --f-body --f-mono`.
Core components you must reuse: `.sg-btn` (`.danger`, `.green`, `[disabled]`), `.sg-card`, `.sg-h` (section heading), `.sg-bar > .sg-bar-fill` with state classes `.is-ok .is-warn .is-crit .is-locked`, `.sg-input .sg-textarea .sg-select`, `.sg-table`, `.sg-tag`, `.sg-kv`, `.locked-section`, `.sg-overlay-inner`, `.trend-up .trend-down .trend-flat`.
Static shell ids: `#app #sidebar #main #view #cmdbar #cmd-input #overlays #siege-root`.

## OUTPUT REQUIREMENTS FOR AGENT-BUILT MODULES

Write `NN-name.js` (and `NN-name.css` if you have view UI) into `_build/`. Then return JSON: `{"jsFile":"...","cssFile":"...or null","publicApi":["..."],"notes":"integration assumptions/risks, 3 lines max"}`. Code must parse under `node --check` (plain script syntax — no import/export/top-level await). Be exhaustive within your module: real question banks, real Arabic templates, real workout programs — NO placeholders, NO TODOs.
