// 업데이트 흐름 시험용 서버. STALE=1 이면 GitHub Pages 처럼 max-age=600 을 보낸다
const http = require('http'), fs = require('fs'), path = require('path');
const root = process.argv[2];
const stale = process.env.STALE === '1';
http.createServer((req, res) => {
  let p = decodeURIComponent(req.url.split('?')[0]);
  if (p.endsWith('/')) p += 'index.html';
  const f = path.join(root, p);
  fs.readFile(f, (e, d) => {
    if (e) { res.writeHead(404); res.end('nf'); return; }
    const ext = path.extname(f);
    const cc = stale && ext !== '.js' ? 'max-age=600' : (stale ? 'max-age=600' : 'no-store'); // sw.js 도 GH Pages 는 600s 캐시함(그래도 브라우저가 24h 마다/updateViaCache 규칙으로 별도 취급)
    res.writeHead(200, { 'Content-Type': ({ '.html': 'text/html; charset=utf-8', '.webmanifest': 'application/manifest+json', '.png': 'image/png', '.jpg': 'image/jpeg', '.js': 'text/javascript', '.json': 'application/json', '.css': 'text/css' })[ext] || 'application/octet-stream', 'Cache-Control': cc });
    res.end(d);
  });
}).listen(+process.env.PORT || 8783, '127.0.0.1', () => console.log('ok ' + (process.env.PORT || 8783) + (stale ? ' (STALE mode)' : '')));
