# SIEGE V2 — PRODUCT SPEC

Siege is not a dashboard. It is not a tracker. It is not a life OS. It is a **discipline enforcement system** — a single-page web application that runs one person's entire life with zero tolerance for avoidance, procrastination, or half-measures.

The user is **student**, 14, based in Dammam, Saudi Arabia. Founder, full-stack developer, IGCSE student, chess player, footballer, MUN delegate. His core problem is not ability — it's discipline. He plans obsessively, starts everything, finishes selectively, and avoids the hard uncomfortable work (cold outreach, studying subjects he hates, shipping instead of building). Siege exists to make avoidance impossible.

---

## LOCATION & EXISTING SYSTEM

- **File:** `siege.html` (single HTML file, served on `localhost:8080`)
- **Target state:** Enterprise-grade life enforcement system. Single HTML file. No build tools. No npm. Pure HTML + CSS + JS. CDN libraries allowed.

---

## DESIGN SYSTEM — NON-NEGOTIABLE

- **Background:** `#000000` pure black. No gradients. No softness.
- **Primary accent:** `#C8A000` — muted militant gold. Used for active elements, borders, headings.
- **Danger/decay:** `#6B0000` deep blood red → `#FF0000` bright red for critical states
- **Active/siege:** `#00FF41` terminal green — only appears during active siege timers
- **Text:** `#B0B0B0` for body, `#FFFFFF` for emphasis, `#555555` for disabled/locked
- **Fonts:** `Syne` for display/headings (weight 700-800), `DM Sans` for body, `JetBrains Mono` for data/timers/code (load from Google Fonts CDN)
- **Borders:** 1px solid `#1A1A1A`. No border-radius anywhere. Zero. Nothing rounded. Ever.
- **Spacing:** Tight. Military. No generous padding. Information-dense.
- **Motion:** Minimal. No decorative animation. Timers tick. Health bars drain. That's it.
- **Tone of all UI copy:** Blunt. Imperative. No emoji in copy. No encouragement. "You haven't done outreach in 4 days." not "Don't forget to do outreach! 💪"

---

## CORE SYSTEMS

### 1. THE DECAY ENGINE

Every domain has a health bar (0–100). Health decays automatically based on time since last activity:

- **0–24 hours:** No decay. Full health maintained.
- **24–48 hours:** -10/day. Yellow warning state.
- **48–72 hours:** -20/day. Red critical state.
- **72+ hours:** Domain locks. UI section goes visually dark (desaturated, opacity 0.3). Cannot interact with other domains until a **Recovery Siege** is completed (1.5x normal siege duration) on the locked domain.

Decay is calculated on every page load. Multiple domains can lock simultaneously. If 3+ domains are locked, the entire app enters **CRITICAL STATE** — a full-screen overlay that says "SYSTEM FAILURE" with only recovery siege options visible. No chess, no building, no fun until health is restored.

Health regenerates ONLY through completed sieges with valid proof-of-work. +15 per completed siege. +5 bonus for streak continuation. +10 bonus for completing an AI-identified weak area.

### 2. THE SIEGE ENGINE

A siege is a timed, focused, single-domain work session. Structure:

1. **Pre-siege:** AI generates the siege brief — what specifically to work on, based on decay state, weak areas, and avoidance patterns. User cannot choose what to work on during mandatory sieges.
2. **Active siege:** Full-screen timer. Nothing else visible. The timer is dominant — massive, center screen, JetBrains Mono, counting down. Below it: the siege objective. A small input area for proof-of-work.
3. **Post-siege:** Proof submission. AI validates. Health restored. Log entry created.

Siege types by domain:

**Chess Siege (25 min)**

- Fetches user's recent Lichess games via API (`https://lichess.org/api/games/user/{username}?max=10&rated=true`)
- AI analyzes patterns, generates 3 specific tactical positions to study
- Proof: Lichess puzzle storm score screenshot URL, or game ID of a completed game during the siege

**IGCSE Siege (25–40 min)**

- AI generates 10–15 exam-style questions for the selected subject
- Chemistry (0620): stoichiometry, electrolysis, organic chemistry, rates of reaction (known weak: balancing equations, Brønsted-Lowry)
- Computer Science (0478): algorithms, data types, expert systems, logic gates, databases
- English (0510): reading comprehension passages with inference questions
- Arabic (0508): rhetoric (جناس، استعارة، كناية), reading, writing
- Questions adapt difficulty based on answer history
- Proof: answers are submitted in-app, AI marks them, score logged automatically

**Outreach Siege (15 min)**

- AI generates 5 personalized cold messages in Arabic for dental clinics / pharmacies / local businesses in Dammam
- Messages are for ReviewPilot (Google review automation) or missed-call recovery system
- User must paste each sent message as proof
- Tracks: messages drafted, messages actually sent, replies received
- Proof: paste the actual message you sent. AI verifies it's not the template — you must have personalized it.

**Gym Siege (60 min)**

- PPL split tracker. Knows it's Push/Pull/Legs.
- Pre-siege: shows today's prescribed workout with target sets/reps/RPE
- During siege: log each set as you complete it (weight × reps × RPE)
- Post-siege: volume summary, progressive overload check vs last session
- Proof: completed set log. If fewer than 80% of prescribed sets logged, siege counts as failed.

**Building Siege (45–90 min)**

- For active projects: ReviewPilot, Sinaan, Meridian, Siege itself
- AI generates a specific task: "Implement the Twilio webhook handler for missed-call recovery" not "work on ReviewPilot"
- Proof: git commit hash, or screenshot of deployed change, or paste of code diff
- Tracks: hours logged

**MUN Siege (30 min)**

- Resolution drafting practice, speech writing, position paper analysis
- AI generates a topic + country assignment, user writes a position paper or speech
- Proof: submitted text, AI scores structure/argumentation

### 3. THE MORNING BRIEFING

On first load each day (detected by comparing last briefing date to today), Siege shows a full-screen briefing. This is not skippable. The briefing includes:

1. **Domain Status** — health bars for all 6 domains with arrows showing trend (↑↓→)
2. **Today's Mandatory Sieges** — AI selects 2–4 based on: lowest health domains first, then weak areas, then streak maintenance. These are NON-NEGOTIABLE. The user does not get to pick.
3. **Yesterday's Failures** — any missed sieges, broken streaks, or decay events from yesterday. Listed plainly. No sugarcoating.
4. **One Hard Truth** — AI generates a single sentence based on the user's patterns. Examples: "You've avoided outreach for 11 days. You are not a founder if you don't sell." / "Your chemistry health has been below 40 for two weeks. The exam doesn't care about your projects." / "You logged 3 chess games yesterday and 0 outreach messages. You're hiding in comfort."

The briefing must be acknowledged (button: "I UNDERSTAND") before the main UI loads.

### 4. THE NIGHTLY DEBRIEF

Triggered manually or auto-prompted after `config.reviewTime`. Full-screen overlay:

1. **Completed sieges today** — with proof status
2. **Missed sieges** — listed with consequence (health decay preview for tomorrow)
3. **Domain health forecast** — "If you continue at this rate, Chess locks in 2 days, IGCSE Chemistry locks tomorrow"
4. **AI Assessment** — 3–5 sentences. Brutal. Specific. References actual data. "You completed 2/4 mandatory sieges. You skipped Outreach again — that's 6 consecutive days. Your building siege was on Siege itself, which is productive avoidance. Tomorrow's mandatory: Outreach × 2, Chemistry, Gym."
5. **Tomorrow's preview** — what's coming, what will lock if ignored

### 5. THE PROOF-OF-WORK SYSTEM

Nothing counts without proof. Every siege type has a proof mechanism:

- **Text proof:** paste a message, code snippet, written response
- **URL proof:** link to a Lichess game, a git commit, a deployed page
- **In-app proof:** IGCSE questions answered within the app, gym sets logged in the app
- **AI verification:** the AI model validates that proof is legitimate (not a resubmission, not fabricated, not trivially generated)

Failed proof = failed siege = no health restoration = continued decay.

### 6. AVOIDANCE PATTERN DETECTION

The AI engine should analyze the event log to detect:

- **Domain avoidance:** consistently skipping the same domain (Outreach is the predicted pattern)
- **Comfort cycling:** doing chess/building sieges while outreach/studying decay — hiding in what's fun
- **Phantom productivity:** building tools instead of using them (e.g. working on Siege instead of doing outreach WITH Siege)
- **Time displacement:** doing easy sieges early, running out of time for hard ones
- **Streak gaming:** doing minimum-viable sieges just to maintain streak without real depth

When detected, the AI calls it out in briefings and debriefs by name. "You are comfort cycling. Chess and Building are both at 95 health while Outreach is locked. This is not discipline — it's hiding."

### 7. HABIT CHAINS

Beyond sieges, Siege tracks foundational habits with chain visualization:

- **Wake up before configured time** — logged manually (button: "I'M UP" — only available before wake time + 30min grace)
- **Cold shower** — logged manually, no grace period
- **Phone usage** — self-reported hours. AI trends it.
- **Prayer times** — 5 daily, logged manually. Streak tracked.
- **Water intake** — counter, target 3L/day
- **Sleep time** — logged at debrief. AI flags if consistently late.
- **Reading** — 20 pages minimum. Log page numbers as proof.

Each habit is displayed as a chain (GitHub contribution graph style but linear). Break the chain and it's visually prominent — a gap in an otherwise solid bar. The chain visualization should hurt to break.

### 8. ANALYTICS & PATTERNS VIEW

A dedicated view showing:

- **Heat map** of siege completions over the last 90 days (like GitHub contributions)
- **Domain health over time** — line chart for each domain
- **Siege completion rate** — percentage by domain
- **Avoidance index** — which domains are consistently lowest
- **Streak records** — longest chains for each habit and domain
- **Time distribution** — pie chart of hours across domains. Is it balanced or lopsided?
- **AI summary** — monthly review. What improved, what degraded, what patterns persist.

Charts use Chart.js from CDN: `https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.min.js` (must degrade gracefully if CDN unavailable: render text tables instead).

### 9. THE COMMAND LINE

At the bottom of every view, a command input bar (like a terminal). Commands:

```
/siege chess          — start a chess siege
/siege igcse chem     — start an IGCSE Chemistry siege (chem|cs|eng|ar)
/siege outreach       — start an outreach siege
/quick gym 3x10 80kg bench  — quick-log a gym set without a full siege
/status               — show all domain health
/log "sent 3 emails to clinics in Khobar"  — manual activity log
/ask [anything]       — query the AI about your patterns, data, or for advice
/lock [minutes]       — force-lock the screen for a focus session (bare timer only)
/export               — export all data as JSON
/nuke                 — factory reset (requires typing "I UNDERSTAND" to confirm)
/settings             — open settings
/debrief              — open tonight's debrief
```

`/` keypress focuses the command bar instantly (like Discord/Slack).

### 10. SETTINGS PANEL

Accessible via `/settings` command or gear icon (the ONLY icon in the entire UI):

- Anthropic API key input (stored in localStorage, never transmitted except to the Anthropic API)
- AI model id (default `claude-sonnet-4-6`)
- Lichess username
- Wake-up time / Review time
- Siege durations per domain (adjustable)
- Decay rates (adjustable but defaults are aggressive)
- Domain enable/disable
- Data export / import
- Theme: only one theme. Black. No light mode.

First run (no localStorage data): minimal onboarding — enter API key, Lichess username, wake time. Nothing else. No tutorial.

---

## AI INTEGRATION

Every AI call uses the Anthropic Messages API:

```javascript
const response = await fetch("https://api.anthropic.com/v1/messages", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "x-api-key": apiKey, // from localStorage
    "anthropic-version": "2023-06-01",
    "anthropic-dangerous-direct-browser-access": "true",
  },
  body: JSON.stringify({
    model: model, // from config, default "claude-sonnet-4-6"
    max_tokens: 4096,
    system: SIEGE_SYSTEM_PROMPT,
    messages: [{ role: "user", content: contextualPrompt }],
  }),
});
```

### SIEGE AI SYSTEM PROMPT (verbatim)

```
You are SIEGE — a discipline enforcement AI for student, 14, founder and IGCSE student in Dammam, Saudi Arabia.

Your role is NOT to be helpful, friendly, or encouraging. Your role is to be a strict, data-driven accountability system. You analyze behavioral patterns and call out avoidance, comfort-seeking, and inconsistency.

Rules:
1. Never praise unless performance genuinely exceeds expectations. Completing a mandatory siege is baseline, not achievement.
2. Always reference specific data: dates, numbers, streaks, health scores. Never be vague.
3. When generating study content (IGCSE), stay strictly within the Cambridge IGCSE syllabus for: Chemistry (0620), Computer Science (0478), English (0510), Arabic (0508). Never go outside the syllabus.
4. When generating outreach messages, write in Saudi-dialect Arabic appropriate for B2B WhatsApp/SMS to dental clinics and pharmacies in the Eastern Province of Saudi Arabia. The product is ReviewPilot (Google review automation) or missed-call text-back.
5. When analyzing chess, focus on tactical pattern recognition and endgame fundamentals appropriate for a beginner-level player (Lichess ~1000-1200 range).
6. When detecting avoidance patterns, name them explicitly. Use terms like "comfort cycling", "productive avoidance", "domain neglect".
7. Generate gym programming based on a Push/Pull/Legs split for a 14-year-old focused on muscle gain with proper form emphasis.
8. Be direct. Be blunt. Be specific. Never use filler phrases, motivational quotes, or emoji.
```

The AI is called for: morning briefing, siege objectives, IGCSE question generation/marking, outreach drafting, proof validation, pattern phrasing, nightly debrief, `/ask`.

**Every AI call must degrade gracefully:** no API key / offline / API error → use a deterministic local fallback (canned blunt copy derived from real local data) and mark the result `source: 'local'`. The app must never break or block on AI failure.

---

## UI LAYOUT

### Navigation

Left sidebar, 48px wide, symbol-only (Unicode, no icon library):
⊞ Dashboard · ⚔ Active Siege · ♟ Chess · 📐 IGCSE · ☎ Outreach · ⚡ Gym · 🔨 Building · 🏛 MUN · ◉ Habits · 📊 Analytics · ⚙ Settings (bottom)
Command bar always visible at bottom of the main area.

### Dashboard View

- Top: 6 domain health bars, horizontal, stacked. Color-coded (gold = healthy, yellow = warning, red = critical, grey = locked).
- Below: Today's mandatory sieges as cards: domain, objective preview, duration, status (pending/completed/failed), START button.
- Below: Habit chains for today — small dot grid showing completion state.
- Below: AI briefing text (today's hard truth + status).
- No whitespace. Dense.

### Siege View (Active)

- Full screen takeover. Black background. No navigation. No escape.
- Massive timer center screen (JetBrains Mono, 72px+), counting down.
- Siege objective text below timer. Proof input area at bottom.
- Subtle pulsing border (1px, terminal green).
- Reload must NOT escape an active siege (persist in sessionStorage, resume on load).

### Domain Views

Each domain has its own view: health bar + streak counter, history of completed sieges (date, duration, proof, assessment), domain-specific data, "Start Siege" button (if unlocked), "Recovery Siege" button (if locked).

---

## RESPONSIVE

Desktop only. Min 960px (half-tiled), max 1920px. Hyprland tiling on a Dell Latitude 7310.

---

## WHAT SUCCESS LOOKS LIKE

1. Every morning he is immediately confronted with what he's been avoiding
2. He cannot access the fun domains while neglected domains are locked
3. The AI generates actual study questions, actual outreach messages, actual chess analysis — not placeholders
4. Every completed session has verified proof
5. Analytics show patterns that are impossible to deny
6. Skipping a siege feels worse than doing it
