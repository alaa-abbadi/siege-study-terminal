import http.server
import socketserver
import json
import base64
import os

PORT = 8080
DIRECTORY = "/home/alaaabbadi/code projects/siege"
VAULT_DIR = os.path.join(DIRECTORY, "vault")
OBSIDIAN_AGENDAS_DIR = "/home/alaaabbadi/Documents/Obsidian Vault/Siege_Agendas"

if not os.path.exists(VAULT_DIR):
    os.makedirs(VAULT_DIR)
if not os.path.exists(OBSIDIAN_AGENDAS_DIR):
    os.makedirs(OBSIDIAN_AGENDAS_DIR)

class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)

    def end_headers(self):
        if self.path.startswith('/api/'):
            self.send_header('Cache-Control', 'no-store, no-cache, must-revalidate')
        super().end_headers()

    def do_GET(self):
        if self.path.startswith("/api/papers"):
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            papers = []
            for f in os.listdir(VAULT_DIR):
                if f.endswith('.pdf'):
                    papers.append(f)
            self.wfile.write(json.dumps({"papers": sorted(papers)}).encode())
            return
        elif self.path.startswith("/api/obsidian/tasks"):
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            tasks = []
            if os.path.exists(OBSIDIAN_AGENDAS_DIR):
                for f in os.listdir(OBSIDIAN_AGENDAS_DIR):
                    if f.endswith('.md'):
                        filepath = os.path.join(OBSIDIAN_AGENDAS_DIR, f)
                        with open(filepath, 'r', encoding='utf-8') as md_file:
                            lines = md_file.readlines()
                            for i, line in enumerate(lines):
                                stripped = line.strip()
                                if stripped.startswith('- [ ] ') or stripped.startswith('- [x] ') or stripped.startswith('- [X] '):
                                    is_done = stripped.startswith('- [x] ') or stripped.startswith('- [X] ')
                                    text = stripped[6:]
                                    tasks.append({
                                        "file": f,
                                        "line_idx": i,
                                        "text": text,
                                        "done": is_done
                                    })
            self.wfile.write(json.dumps({"tasks": tasks}).encode())
            return
        return super().do_GET()

    def do_POST(self):
        if self.path == "/api/upload":
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            data = json.loads(post_data.decode('utf-8'))
            
            filename = data.get('filename')
            file_b64 = data.get('data')
            
            if not filename or not file_b64:
                self.send_response(400)
                self.end_headers()
                return
                
            filename = os.path.basename(filename)
            file_data = base64.b64decode(file_b64.split(',')[1] if ',' in file_b64 else file_b64)
            
            filepath = os.path.join(VAULT_DIR, filename)
            with open(filepath, 'wb') as f:
                f.write(file_data)
                
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({"status": "ok", "filename": filename}).encode())
            return
            
        elif self.path == "/api/delete":
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            data = json.loads(post_data.decode('utf-8'))
            filename = data.get('filename')
            
            if filename:
                filename = os.path.basename(filename)
                filepath = os.path.join(VAULT_DIR, filename)
                if os.path.exists(filepath):
                    os.remove(filepath)
            
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({"status": "ok"}).encode())
            return
            
        elif self.path == "/api/obsidian/update_task":
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            data = json.loads(post_data.decode('utf-8'))
            filename = data.get('file')
            line_idx = data.get('line_idx')
            done = data.get('done')
            
            if filename and line_idx is not None and done is not None:
                filename = os.path.basename(filename)
                filepath = os.path.join(OBSIDIAN_AGENDAS_DIR, filename)
                if os.path.exists(filepath):
                    with open(filepath, 'r', encoding='utf-8') as md_file:
                        lines = md_file.readlines()
                    
                    if 0 <= line_idx < len(lines):
                        line = lines[line_idx]
                        if done:
                            lines[line_idx] = line.replace('- [ ]', '- [x]', 1)
                        else:
                            lines[line_idx] = line.replace('- [x]', '- [ ]', 1).replace('- [X]', '- [ ]', 1)
                        
                        with open(filepath, 'w', encoding='utf-8') as md_file:
                            md_file.writelines(lines)
            
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({"status": "ok"}).encode())
            return

        self.send_response(404)
        self.end_headers()

# Allow reuse of address to prevent "Address already in use" errors during dev
socketserver.TCPServer.allow_reuse_address = True
with socketserver.TCPServer(("", PORT), Handler) as httpd:
    print(f"Serving at port {PORT}")
    httpd.serve_forever()
