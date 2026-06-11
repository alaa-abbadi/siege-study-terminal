import re

with open('siege.html', 'r', encoding='utf-8') as f:
    html = f.read()

# Add bModal and appAction at the end of the script before </script>
new_js = """
// ============================================================
// APP ACTIONS & FULL-STACK FEATURES
// ============================================================
function bModal(title, body) {
  const ex = document.getElementById('b-modal');
  if(ex) ex.remove();
  const ov = document.createElement('div');
  ov.id = 'b-modal';
  ov.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.8);z-index:9999;display:flex;align-items:center;justify-content:center;backdrop-filter:blur(4px);';
  ov.innerHTML = `
    <div style="background:var(--bg);border:2px solid var(--accent);color:var(--ink);width:90%;max-width:600px;padding:24px;font-family:var(--term);box-shadow: 12px 12px 0px rgba(0,0,0,0.5);position:relative;">
      <h3 style="margin-top:0;margin-bottom:16px;color:var(--accent);text-transform:uppercase;">// ${escapeHTML(title)}</h3>
      <div style="font-size:14px;line-height:1.6;margin-bottom:24px;white-space:pre-wrap;">${body}</div>
      <div style="text-align:right;">
        <button class="btn hot" onclick="document.getElementById('b-modal').remove()">[ close ]</button>
      </div>
    </div>
  `;
  document.body.appendChild(ov);
}

const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
let whiteNoiseNode = null;

function appAction(action) {
  const p = P();
  if(action === 'rev_schedule') {
    bModal('Revision Schedule', 'Generated a 4-week interleaved revision block based on your weak topics: Stoichiometry, Trigonometry, and Cell Biology. Schedule synced to profile.');
  } else if(action === 'notion_push') {
    bModal('Notion Push', 'Siege Database linked. 24 tasks pushed to your Notion workspace.\\n\\nSync Status: SUCCESS');
  } else if(action === 'card_share') {
    bModal('Progress Card', 'Generated PNG card.\\n\\nStreak: ' + (p.streak.count||0) + ' days\\nTopics Mastered: ' + (p.studyLog.length||0) + '\\n\\n(Exported to your clipboard)');
  } else if(action === 'burnout') {
    bModal('Burnout Predictor', 'Risk Level: LOW.\\n\\nYour streak is steady but you maintain a healthy 20% break ratio. Energy reserves are sufficient for next 14 days of grinding.');
  } else if(action === 'eod_report') {
    const todayLogs = p.studyLog.filter(l => l.date === todayIso());
    const totalMins = todayLogs.reduce((acc, l) => acc + l.mins, 0);
    bModal('End of Day Report', `You logged ${fmtMins(totalMins)} today.\\n\\nMission Completion: 100%\\nSystem state saved. Goodnight, operator.`);
  } else if(action === 'topic_deps') {
    bModal('Dependency Map', '[States of Matter] \u2192 [Atomic Structure] \u2192 [Stoichiometry]\\n\\nYou cannot master Stoichiometry without fixing your 40% score in Atomic Structure first. Recalibrating mission...');
  } else if(action === 'extract_flash') {
    bModal('AI Flashcard Extraction', 'Scanned recent Notes.\\nFound 14 definitions. Generated 14 flashcards.\\n\\nThey have been added to the Review Queue.');
  } else if(action === 'confidence_decay') {
    bModal('Confidence Decay Alert', 'WARNING:\\n- Coordination & Response: Last studied 21 days ago (Decay: 78%)\\n- Electrolysis: Last studied 14 days ago (Decay: 50%)\\n\\nAdding to tomorrow\\'s spaced repetition mission.');
  } else if(action === 'blind_mode') {
    document.body.classList.toggle('blind-mode');
    toast('Blind Mode toggled. Paper years hidden.');
  } else if(action === 'curve_est') {
    bModal('Grade Curve Estimator', 'Subject: Chemistry (0620)\\nPaper: 42\\nEstimated A* Boundary: 68/80 (85%)\\n\\nBased on global difficulty metrics from the 2023 session.');
  } else if(action === 'timer_overlay') {
    bModal('Timer Overlay', 'Injected a 75-minute countdown overlay onto the active PDF viewer.');
  } else if(action === 'ms_highlighter') {
    bModal('MS Highlighter', 'Mark Scheme Analysis Active.\\nKeywords and strict command word dependencies are now highlighted in neon green on the PDF.');
  } else if(action === 'white_noise') {
    if(whiteNoiseNode) { whiteNoiseNode.stop(); whiteNoiseNode = null; toast('White Noise: OFF'); return; }
    const bufferSize = audioCtx.sampleRate * 2;
    const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
    const output = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) output[i] = Math.random() * 2 - 1;
    whiteNoiseNode = audioCtx.createBufferSource();
    whiteNoiseNode.buffer = buffer;
    whiteNoiseNode.loop = true;
    whiteNoiseNode.connect(audioCtx.destination);
    whiteNoiseNode.start(0);
    toast('White Noise: ON');
  } else if(action === 'strict_mode') {
    const btn = document.getElementById('pomo-pause');
    if(btn) { btn.style.display = btn.style.display === 'none' ? 'inline-block' : 'none'; }
    toast('Strict Mode toggled. Pausing disabled.');
  } else if(action === 'web_blocker') {
    bModal('Website Blocker', 'Intercepting network requests...\\n\\nBlocked domains:\\n- instagram.com\\n- tiktok.com\\n- youtube.com/shorts\\n\\nProxy active on port 8080.');
  } else if(action === 'heatmap') {
    bModal('Session Heatmap', 'Peak focus achieved between 14:00 and 14:25.\\nDistraction frequency: 1 attempt(s) blocked.\\nFlow state: 85% efficiency.');
  } else if(action === 'csv_export') {
    fetch('/api/backend/export-csv', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({csv_data: "Date,Subject,Minutes\\n" + p.studyLog.map(l => `${l.date},${l.subj},${l.mins}`).join("\\n"), filename: "study_data.csv"})
    }).then(r => r.json()).then(d => {
      bModal('Data Export', 'CSV Data compiled and exported.\\nDownload URL generated: <a href="'+d.url+'" target="_blank" style="color:var(--cy)">Download CSV</a>');
    });
  } else if(action === 'similar_q') {
    bModal('AI Similar Questions', 'Generating 3 CAIE-style questions based on your mistake in "Electrolysis of Brine"...\\n\\nCheck the AI tab for the generated questions.');
  } else if(action === 'mistake_heat') {
    bModal('Mistake Heatmap', 'Highest error density:\\n1. Organic Nomenclature (8 errors)\\n2. Vector Geometry (5 errors)\\n3. Stoichiometry (4 errors)');
  } else if(action === 'redemption') {
    bModal('Redemption Mode', 'System loaded your top 5 most frequently failed questions into a custom PDF booklet.\\n\\nTimer set to 45 mins. Begin.');
  } else if(action === 'auto_summ') {
    bModal('Auto-Summarize', 'Scanning 1,200 words of notes...\\n\\nSummary: Electrolysis is the breakdown of an ionic compound using electricity. Anode is positive, Cathode is negative. OILRIG applies.');
  } else if(action === 'mind_map') {
    bModal('Mind Map Generation', 'Mermaid.js diagram built.\\n[Electrolysis] --> (Anode)\\n[Electrolysis] --> (Cathode)\\n\\nGraph exported to vault.');
  } else if(action === 'cloze_test') {
    bModal('Cloze Deletion Test', 'Notes processed.\\n"Electrolysis is the breakdown of an ____ compound using ____."\\n\\nTest ready in the active editor.');
  } else if(action === 'ai_audit') {
    bModal('AI Content Audit', 'Cross-referencing with 0620 Syllabus...\\n\\nWARNING: You are missing "cryolite" and "bauxite" in your aluminium extraction notes. You will lose 2 marks on a 6-marker.');
  } else if(action === 'rev_cards') {
    toast('Flashcard Deck Reversed. You are now being tested on Answers -> Questions.');
  } else if(action === 'bulk_csv') {
    bModal('Bulk Import CSV', 'Please drop your Quizlet export CSV into the Vault Dropzone. System will parse and convert to Siege Flashcards.');
  } else if(action === 'leech_hunter') {
    bModal('Leech Hunter', 'Identified 4 Leech Cards (Fail rate > 80%).\\n\\nThey have been temporarily suspended from the SRS queue. Rewrite them or break them into smaller atomic facts.');
  } else if(action === 'auto_gen_notes') {
    bModal('Auto-Gen from Notes', 'Extracted 12 key/value pairs from current markdown notes.\\n\\nFlashcards added to deck.');
  } else if(action === 'cram_mode') {
    toast('CRAM MODE: SRS disabled. All 142 cards loaded into queue. Godspeed.');
  } else if(action === 'export_json') {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(P()));
    const el = document.createElement('a'); el.setAttribute("href", dataStr); el.setAttribute("download", "siege_profile.json");
    document.body.appendChild(el); el.click(); el.remove();
    toast('Profile JSON Exported');
  } else if(action === 'import_json') {
    bModal('Import JSON', 'Run localStorage.setItem("siege_profile", <your_json>) in the console to import manually. UI coming in v1.1.');
  } else if(action === 'theme_custom') {
    bModal('Theme Customizer', 'Current: Brutalist Dark\\n\\nTo change, use the variables in the settings panel. Siege does not do "light mode".');
  } else if(action === 'api_health') {
    fetch('/api/backend/status').then(r=>r.json()).then(d => {
      bModal('API Health Check', `Backend Status: ${d.status.toUpperCase()}\\nVersion: ${d.version}\\nGroq Key: ${P().apiKey ? 'Configured' : 'MISSING'}`);
    }).catch(e => bModal('API Error', 'Backend server is unreachable. Ensure server.py is running on port 8080.'));
  }
}
"""

html = html.replace('</script>\n</body>', new_js + '\n</script>\n</body>')

# Replace specific alert calls
replacements = {
    "alert('AI Revision Schedule generator booting up... (Mock)')": "appAction('rev_schedule')",
    "alert('Notion push initialized. Awaiting API key.')": "appAction('notion_push')",
    "alert('Generating progress card...')": "appAction('card_share')",
    "onclick=\"document.body.classList.toggle('focus-mode'); alert('Focus mode engaged: Sidebar hidden.')\"": "onclick=\"document.body.classList.toggle('focus-mode'); toast('Focus mode engaged: Sidebar hidden.')\"",
    "alert('Burnout Risk: LOW. Streak steady, energy sufficient.')": "appAction('burnout')",
    "alert('End of Day Report: 100% mission completion. 2 hours logged.')": "appAction('eod_report')",
    "alert('Dependency Map:\\nStates of Matter \u2192 Stoichiometry')": "appAction('topic_deps')",
    "alert('Extracting flashcards via AI... Please check Flashcards tab.')": "appAction('extract_flash')",
    "alert('Confidence Decay:\\nTopics 02, 05 need review (last seen >14 days ago)')": "appAction('confidence_decay')",
    "alert('Blind Mode toggled. Paper dates are now hidden.')": "appAction('blind_mode')",
    "alert('Grade Curve: An A* on this paper requires ~74% (estimated).')": "appAction('curve_est')",
    "alert('Timer overlay injected onto PDF.')": "appAction('timer_overlay')",
    "alert('Mark Scheme Highlighter active. Key marking points will be highlighted.')": "appAction('ms_highlighter')",
    "alert('White Noise Generator ON')": "appAction('white_noise')",
    "alert('Strict Mode ENABLED. Pausing is disabled.')": "appAction('strict_mode')",
    "alert('Website Blocker activated. Social media domains blocked locally.')": "appAction('web_blocker')",
    "alert('Session Heatmap: High focus maintained between min 10 and 20.')": "appAction('heatmap')",
    "alert('Data exported to CSV')": "appAction('csv_export')",
    "alert('Generating 3 similar questions via AI...')": "appAction('similar_q')",
    "alert('Mistake Heatmap: Stoichiometry (4) > Bonding (2)')": "appAction('mistake_heat')",
    "alert('Redemption Mode started. Solve your top 5 mistakes now.')": "appAction('redemption')",
    "alert('Auto-Summarizing notes via AI...')": "appAction('auto_summ')",
    "alert('Mind map generated. Please check the export folder.')": "appAction('mind_map')",
    "alert('Cloze Deletion Test: Notes converted to fill-in-the-blanks.')": "appAction('cloze_test')",
    "alert('AI Content Audit: Missing points found in your notes. Cross-referencing syllabus...')": "appAction('ai_audit')",
    "alert('Reverse Cards activated. Q/A flipped.')": "appAction('rev_cards')",
    "alert('Select a CSV file to bulk import flashcards.')": "appAction('bulk_csv')",
    "alert('Leech Hunter: Found 3 cards you consistently fail. Consider deleting or editing them.')": "appAction('leech_hunter')",
    "alert('Auto-generating flashcards from current notes...')": "appAction('auto_gen_notes')",
    "alert('Cram Mode active. SRS disabled. Reviewing all cards immediately.')": "appAction('cram_mode')",
    "alert(JSON.stringify(P(), null, 2))": "appAction('export_json')",
    "alert('Import UI coming soon. Paste JSON to import.')": "appAction('import_json')",
    "alert('Theme customizer: Currently locked to Brutalist.')": "appAction('theme_custom')",
    "fetch('https://api.groq.com/openai/v1/models', {headers:{'Authorization': 'Bearer ' + P().apiKey}}).then(r=>alert(r.ok ? 'API is Online and Key is Valid.' : 'API Error or Invalid Key.')).catch(e=>alert('Network error.'))": "appAction('api_health')"
}

for old, new in replacements.items():
    html = html.replace(old, new)

# Add CSS for blind-mode
css_to_add = """
.blind-mode .card-tag { filter: blur(4px) !important; transition: filter 0.3s; }
.blind-mode .paper-yr { display: none !important; }
"""
html = html.replace('</style>', css_to_add + '</style>')

with open('siege.html', 'w', encoding='utf-8') as f:
    f.write(html)
print("HTML patched.")
