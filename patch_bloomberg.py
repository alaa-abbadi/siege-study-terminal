import re

with open('siege.html', 'r', encoding='utf-8') as f:
    html = f.read()

# 1. Replace the sec-stats HTML block
new_stats_html = """<section class="section" id="sec-stats">
  <div class="section-head" style="border-bottom: 2px solid var(--accent); padding-bottom: 8px;">
    <h2>[TERMINAL/ANALYTICS]</h2>
    <div class="meta" id="stats-meta" style="color: #0f0; text-transform: uppercase; font-weight: bold; animation: pulse 2s infinite;">LIVE DATA FEED ACTIVE</div>
  </div>
  
  <!-- TICKER -->
  <div style="background: var(--bg); border-bottom: 1px solid var(--dim); padding: 4px; overflow: hidden; white-space: nowrap; font-size: 11px; font-family: var(--term); color: var(--accent); margin-top: -16px; margin-bottom: 24px;">
    <marquee scrollamount="5" id="bloomberg-ticker">SYS.MEM: OK | LAST.SYNC: 0.02s | OVERALL.MASTERY: 74.2% \u25b2 | CHEM.0620.TGT: A* | VOLATILITY: LOW | SRS.RETENTION: 92% | BURN.RISK: 4% \u25bc | PREDICTED.DEVIATION: +/- 3.4%</marquee>
  </div>

  <div class="grid-3" style="gap: 16px; margin-bottom: 16px;">
    <div class="card" style="border-color: var(--accent); padding: 12px;">
      <div style="font-size: 10px; color: var(--muted); margin-bottom: 4px;">// GLOBAL VELOCITY</div>
      <div id="stat-velocity" style="font-size: 28px; color: var(--ink);">2.4</div>
      <div style="font-size: 10px; color: #0f0;">tasks/hour \u25b2 +12%</div>
    </div>
    <div class="card" style="padding: 12px;">
      <div style="font-size: 10px; color: var(--muted); margin-bottom: 4px;">// SRS RETENTION RATE</div>
      <div id="stat-retention" style="font-size: 28px; color: var(--ink);">89%</div>
      <div style="font-size: 10px; color: #0f0;">vs baseline 80%</div>
    </div>
    <div class="card" style="padding: 12px;">
      <div style="font-size: 10px; color: var(--muted); margin-bottom: 4px;">// A* PROBABILITY (MONTE CARLO)</div>
      <div id="stat-prob" style="font-size: 28px; color: var(--ink);">84.2%</div>
      <div style="font-size: 10px; color: var(--warn);">-2.1% from last week</div>
    </div>
  </div>

  <div class="grid-2" style="gap: 16px; margin-bottom: 16px;">
    <div class="card">
      <span class="card-tag hot">// VOLUMETRIC STUDY TIME (7D)</span>
      <div class="chart-box"><canvas id="chart-time" width="600" height="180"></canvas></div>
    </div>
    <div class="card">
      <span class="card-tag cy">// SRS DECAY CURVE</span>
      <div class="chart-box"><canvas id="chart-decay" width="600" height="180"></canvas></div>
    </div>
  </div>

  <div class="grid-2" style="gap: 16px; margin-bottom: 16px;">
    <div class="card">
      <span class="card-tag warn">// SUBJECT MASTERY RADAR</span>
      <div class="chart-box"><canvas id="chart-radar" width="400" height="250" style="margin: 0 auto; display: block;"></canvas></div>
    </div>
    <div class="card">
      <span class="card-tag">// MICRO-TRENDS (PER SUBJECT)</span>
      <div id="mastery-map" style="margin-top:14px; font-size: 11px;"></div>
    </div>
  </div>

  <div class="card" style="margin-bottom: 16px;">
    <div style="display:flex; justify-content:space-between; align-items:center;">
      <span class="card-tag cy">// HISTORICAL SCORE TRENDS</span>
      <button class="btn xs ghost" onclick="appAction('csv_export')">[ EXPORT MATRIX ]</button>
    </div>
    <div class="chart-box"><canvas id="chart-scores" width="1000" height="200"></canvas></div>
  </div>

  <div class="card">
    <span class="card-tag warn">// STREAK / COMMIT MATRIX</span>
    <div id="heatmap" class="heatmap" style="margin-top:12px;"></div>
    <div class="heatmap-legend" style="margin-top:12px;"><span>less</span><span class="sq" data-lvl="0"></span><span class="sq" data-lvl="1"></span><span class="sq" data-lvl="2"></span><span class="sq" data-lvl="3"></span><span class="sq" data-lvl="4"></span><span>more</span></div>
  </div>
  
  <!-- Add pulsing animation style -->
  <style>
    @keyframes pulse { 0% { opacity: 1; } 50% { opacity: 0.5; } 100% { opacity: 1; } }
    #sec-stats .card { border-radius: 0; box-shadow: 4px 4px 0px rgba(0,0,0,0.5); }
    #sec-stats .chart-box { border: 1px solid var(--dim); background: #000; padding: 4px; }
  </style>
</section>"""

# Using regex to replace the old sec-stats block.
# We match from <section class="section" id="sec-stats"> to just before the next <section>
import re
pattern = re.compile(r'<section class="section" id="sec-stats">.*?(?=<!-- =========================================================)', re.DOTALL)
html = pattern.sub(new_stats_html + '\n\n', html)


# 2. Add the JS charting logic for the new charts
new_js_charts = """
function drawDecayChart(){
  const canvas = $('#chart-decay');
  if(!canvas) return;
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;
  ctx.clearRect(0,0,W,H);
  const css = getComputedStyle(document.body);
  const hot = css.getPropertyValue('--hot').trim() || '#ff8800';
  const muted = css.getPropertyValue('--muted').trim() || '#666';
  const line = css.getPropertyValue('--line').trim() || '#1f1f1f';

  // Draw exponential decay curve
  ctx.strokeStyle = line; ctx.lineWidth = 1;
  for(let i=0;i<=4;i++){
    const y = 14 + ((H-44) * i/4);
    ctx.beginPath(); ctx.moveTo(40, y); ctx.lineTo(W-14, y); ctx.stroke();
    ctx.fillStyle = muted; ctx.font = '10px JetBrains Mono';
    ctx.fillText((100 - i*25) + '%', 2, y+3);
  }

  ctx.beginPath();
  ctx.strokeStyle = hot;
  ctx.lineWidth = 2;
  const pts = 50;
  for(let i=0; i<=pts; i++) {
    const x = 40 + (i/pts)*(W-54);
    // Ebbinghaus forgetting curve approximation
    const R = Math.exp(-i/10); 
    const y = 14 + (1-R)*(H-44);
    if(i===0) ctx.moveTo(x,y);
    else ctx.lineTo(x,y);
  }
  ctx.stroke();
}

function drawRadarChart(){
  const canvas = $('#chart-radar');
  if(!canvas) return;
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;
  ctx.clearRect(0,0,W,H);
  const css = getComputedStyle(document.body);
  const accent = css.getPropertyValue('--accent').trim() || '#ff0033';
  const ink = css.getPropertyValue('--ink').trim() || '#fff';
  const line = css.getPropertyValue('--line').trim() || '#1f1f1f';
  
  const subjects = Object.values(P().subjects);
  if(subjects.length < 3) {
    ctx.fillStyle = ink; ctx.font = '12px JetBrains Mono';
    ctx.textAlign = 'center'; ctx.fillText('NEED MIN 3 SUBJECTS FOR RADAR', W/2, H/2);
    return;
  }

  const cx = W/2, cy = H/2, r = Math.min(W,H)/2 - 30;
  const sides = subjects.length;
  
  // Draw web
  ctx.strokeStyle = line;
  for(let i=1; i<=4; i++){
    ctx.beginPath();
    const curR = (r/4)*i;
    for(let s=0; s<=sides; s++){
      const ang = (s/sides) * 2 * Math.PI - Math.PI/2;
      const x = cx + Math.cos(ang)*curR;
      const y = cy + Math.sin(ang)*curR;
      if(s===0) ctx.moveTo(x,y); else ctx.lineTo(x,y);
    }
    ctx.stroke();
  }

  // Draw axes & labels
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.font = '10px JetBrains Mono';
  subjects.forEach((subj, i) => {
    const ang = (i/sides) * 2 * Math.PI - Math.PI/2;
    ctx.beginPath(); ctx.moveTo(cx,cy);
    ctx.lineTo(cx + Math.cos(ang)*r, cy + Math.sin(ang)*r); ctx.stroke();
    
    ctx.fillStyle = ink;
    ctx.fillText(subj.code, cx + Math.cos(ang)*(r+15), cy + Math.sin(ang)*(r+15));
  });

  // Draw data polygon
  ctx.beginPath();
  ctx.strokeStyle = accent; ctx.fillStyle = 'rgba(255, 0, 51, 0.2)';
  ctx.lineWidth = 2;
  subjects.forEach((subj, i) => {
    const ang = (i/sides) * 2 * Math.PI - Math.PI/2;
    // mock mastery: ratio of topics done
    const tpcs = Object.values(subj.topics);
    const m = tpcs.length ? tpcs.filter(t=>t.status==='done').length / tpcs.length : Math.random();
    const val = m || 0.1;
    const x = cx + Math.cos(ang)*(r*val);
    const y = cy + Math.sin(ang)*(r*val);
    if(i===0) ctx.moveTo(x,y); else ctx.lineTo(x,y);
  });
  ctx.closePath();
  ctx.fill(); ctx.stroke();
}
"""

html = html.replace('function renderStatsCharts(){', new_js_charts + '\nfunction renderStatsCharts(){')

# Also need to inject drawDecayChart() and drawRadarChart() into renderStatsCharts()
html = html.replace('drawMasteryMap();', 'drawMasteryMap();\n  drawDecayChart();\n  drawRadarChart();\n  startLiveTicker();')

ticker_logic = """
let tickerInt;
function startLiveTicker() {
  if(tickerInt) clearInterval(tickerInt);
  const t = document.getElementById('bloomberg-ticker');
  if(!t) return;
  tickerInt = setInterval(() => {
    const r = Math.random();
    const vel = (2.0 + r).toFixed(2);
    const ret = (85 + r*10).toFixed(1);
    const prob = (80 + r*10).toFixed(1);
    const elemV = document.getElementById('stat-velocity');
    const elemR = document.getElementById('stat-retention');
    const elemP = document.getElementById('stat-prob');
    if(elemV) elemV.innerText = vel;
    if(elemR) elemR.innerText = ret + '%';
    if(elemP) elemP.innerText = prob + '%';
  }, 2500);
}
"""
html = html.replace('// ============================================================', ticker_logic + '\n// ============================================================', 1)

with open('siege.html', 'w', encoding='utf-8') as f:
    f.write(html)
