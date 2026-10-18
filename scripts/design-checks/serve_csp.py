#!/usr/bin/env python3
"""เสิร์ฟ dist/ พร้อม CSP เดียวกับเว็บจริง (อ่านจาก dist/_headers) ที่พอร์ต 8792
เหตุผล: เซิร์ฟเวอร์ที่ไม่ส่ง CSP ทำให้ผลวัดต่างจากเว็บจริง (เคยเจอในรอบสีเขียว)
usage: python3 scripts/design-checks/serve_csp.py [port]"""
import http.server, socketserver, re, os, sys, pathlib
ROOT = pathlib.Path(__file__).resolve().parents[2] / 'dist'
os.chdir(ROOT)
csp = None
for line in open('_headers', encoding='utf-8'):
    m = re.match(r'\s*Content-Security-Policy:\s*(.+)', line)
    if m: csp = m.group(1).strip(); break
if not csp: sys.exit('ไม่พบ Content-Security-Policy ใน dist/_headers')
PROJECT = ROOT.parent
class H(http.server.SimpleHTTPRequestHandler):
    # เส้นทางเฉพาะเครื่องมือทดสอบ: /__ds/<ไฟล์> เสิร์ฟจาก scripts/design-checks/ และ /__css/<ไฟล์> จาก assets/css/
    # (ใช้ดูหน้าตัวอย่างภายในและ CSS ที่ยังไม่ผ่านการ build ไม่มีผลกับเว็บจริง)
    def translate_path(self, path):
        for prefix, base in (('/__ds/', PROJECT / 'scripts' / 'design-checks'), ('/__css/', PROJECT / 'assets' / 'css')):
            if path.startswith(prefix):
                rel = path[len(prefix):].split('?')[0].split('#')[0]
                target = (base / rel).resolve()
                if base.resolve() in target.parents:   # กัน ../ ออกนอกโฟลเดอร์
                    return str(target)
                return str(base / '__denied__')
        return super().translate_path(path)
    def end_headers(self):
        self.send_header('Content-Security-Policy', csp); super().end_headers()
    def log_message(self, *a): pass
socketserver.TCPServer.allow_reuse_address = True
port = int(sys.argv[1]) if len(sys.argv) > 1 else 8792
with socketserver.TCPServer(('', port), H) as s: s.serve_forever()
