import re

with open('siege.html', 'r', encoding='utf-8') as f:
    html = f.read()

mock_logic = """
  } else if(action === 'start_mock') {
    const sel = document.getElementById('mock-paper-select');
    if(!sel || !sel.value) { bModal('Error', 'No paper selected.'); return; }
    const file = sel.value;
    const mins = parseInt(document.getElementById('mock-duration').value) || 90;
    
    if(!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(e => console.log(e));
    }
    
    document.body.classList.add('blind-mode');
    document.body.classList.add('focus-mode');
    
    bModal('SIMULATION STARTED', `Paper: ${file}\\nDuration: ${mins} minutes.\\n\\nRules:\\n1. No pausing.\\n2. Full screen locked.\\n3. Mark schemes hidden.\\n\\nGood luck.`);
    
    // Auto navigate to papers tab and load the file
    go('papers');
    loadPaper(file);
    appAction('timer_overlay'); // Trigger the overlay
"""

html = html.replace("} else if(action === 'api_health') {", mock_logic + "  } else if(action === 'api_health') {")

# Also add logic to populate the mock-paper-select
fetch_papers = """
    // Populate mock papers when papers arrive
    const sel = document.getElementById('mock-paper-select');
    if(sel) {
      sel.innerHTML = '<option value="">-- select paper --</option>' + d.papers.map(p => `<option value="${p}">${p}</option>`).join('');
    }
"""
html = html.replace("renderPapersList();", "renderPapersList();" + fetch_papers)

with open('siege.html', 'w', encoding='utf-8') as f:
    f.write(html)
