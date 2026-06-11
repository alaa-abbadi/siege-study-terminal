import re

with open('siege.html', 'r', encoding='utf-8') as f:
    html = f.read()

dropzone_logic = """
// ============================================================
// DROPZONE LOGIC
// ============================================================
const dropArea = document.getElementById('drop-area');
const dropInput = document.getElementById('drop-file-input');
const dropLog = document.getElementById('drop-log');

if (dropArea && dropInput) {
  ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(evt => {
    dropArea.addEventListener(evt, e => {
      e.preventDefault(); e.stopPropagation();
    });
  });

  ['dragenter', 'dragover'].forEach(evt => {
    dropArea.addEventListener(evt, () => dropArea.style.borderColor = 'var(--accent)');
  });

  ['dragleave', 'drop'].forEach(evt => {
    dropArea.addEventListener(evt, () => dropArea.style.borderColor = 'var(--dim)');
  });

  dropArea.addEventListener('drop', e => {
    const files = e.dataTransfer.files;
    handleDropFiles(files);
  });
  
  dropInput.addEventListener('change', e => {
    handleDropFiles(e.target.files);
  });
}

function handleDropFiles(files) {
  if(!files || files.length === 0) return;
  
  [...files].forEach(file => {
    if(file.type !== 'application/pdf') {
      logDrop(`[ERR] ${file.name} is not a PDF.`);
      return;
    }
    
    logDrop(`[UPLOADING] ${file.name}...`);
    const reader = new FileReader();
    reader.onload = function(e) {
      const b64 = e.target.result;
      fetch('/api/upload', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ filename: file.name, data: b64 })
      }).then(r => r.json()).then(d => {
        if(d.status === 'ok') {
          logDrop(`[SUCCESS] ${file.name} sorted to vault.`);
          // Reload papers list
          fetch('/api/papers').then(res=>res.json()).then(dat => {
            window.allPapers = dat.papers;
            renderPapersList();
            
            // Also update mock papers dropdown if it exists
            const sel = document.getElementById('mock-paper-select');
            if(sel) {
               sel.innerHTML = '<option value="">-- select paper --</option>' + dat.papers.map(p => `<option value="${p}">${p}</option>`).join('');
            }
          });
        } else {
          logDrop(`[ERR] Failed to save ${file.name}.`);
        }
      }).catch(err => {
        logDrop(`[NETWORK ERR] ${file.name}`);
      });
    };
    reader.readAsDataURL(file);
  });
}

function logDrop(msg) {
  if(!dropLog) return;
  if(dropLog.innerText === 'Awaiting files...') dropLog.innerHTML = '';
  dropLog.innerHTML += `<div>${escapeHTML(msg)}</div>`;
  dropLog.scrollTop = dropLog.scrollHeight;
}
"""

html = html.replace("</script>\n</body>", dropzone_logic + "\n</script>\n</body>")

with open('siege.html', 'w', encoding='utf-8') as f:
    f.write(html)
