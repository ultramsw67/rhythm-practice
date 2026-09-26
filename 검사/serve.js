const http = require('http'), fs = require('fs'), path = require('path');
const root = process.argv[2];
http.createServer((req, res) => {
  let p = decodeURIComponent(req.url.split('?')[0]);
  if (p.endsWith('/')) p += 'index.html';
  const f = path.join(root, p);
  fs.readFile(f, (e, d) => {
    if (e) { res.writeHead(404); res.end('nf'); return; }
    const ext = path.extname(f);
    res.writeHead(200, { 'Content-Type': ({'.html':'text/html; charset=utf-8','.webmanifest':'application/manifest+json','.png':'image/png','.jpg':'image/jpeg','.js':'text/javascript','.json':'application/json','.css':'text/css'})[ext] || 'application/octet-stream', 'Cache-Control': 'no-store' });
    res.end(d);
  });
}).listen(+process.env.PORT || 8765, '127.0.0.1', () => console.log('ok ' + (process.env.PORT || 8765)));
