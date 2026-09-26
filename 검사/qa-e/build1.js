// build-offline.js 의 "① 인터넷에 올리는 오프라인 앱" 부분만 떼어 재현 (업데이트 흐름 시험용)
// 사용: node build1.js <SRC_ROOT> <OUT1> [VER_OVERRIDE] [MARK]
const fs = require('fs'), path = require('path'), crypto = require('crypto');
const [, , SRC_ROOT, OUT1, VEROVERRIDE, MARK] = process.argv;
const CDN = '<script src="https://cdn.jsdelivr.net/npm/vexflow@4.2.5/build/cjs/vexflow.js"></script>';
let src = fs.readFileSync(path.join(SRC_ROOT, 'index.html'), 'utf8');
const guide = fs.readFileSync(path.join(SRC_ROOT, 'guide.html'), 'utf8');
let vex = fs.readFileSync(path.join(SRC_ROOT, 'vendor', 'vexflow-4.2.5.js'), 'utf8');
if (MARK) vex += '\n// QA-V2-MARKER\n';
const need = (s, a) => { if (!s.includes(a)) throw new Error('not found: ' + a.slice(0, 80)); };
let ver = (src.match(/버전 (v[\d.]+)/) || [])[1] || 'v?';
if (VEROVERRIDE) {
  const oldLine = `버전 ${ver} · `;
  need(src, oldLine);
  src = src.replace(oldLine, `버전 ${VEROVERRIDE} · `);
  ver = VEROVERRIDE;
}
function common(s, badge) {
  need(s, '<title>리듬 연습</title>'); s = s.replace('<title>리듬 연습</title>', '<title>리듬 연습 (오프라인)</title>');
  need(s, 'title="연습 화면 맨 위로">리듬 연습</button></h1>');
  s = s.replace('title="연습 화면 맨 위로">리듬 연습</button></h1>', 'title="연습 화면 맨 위로">리듬 연습</button> <span class="off-badge">오프라인</span></h1>');
  need(s, '.home-btn{'); s = s.replace('.home-btn{', '.off-badge{display:inline-block;vertical-align:middle;font-size:11px;font-weight:700;color:#fff;background:#2f855a;border-radius:999px;padding:2px 8px;margin-left:4px}\n.home-btn{');
  const v = `버전 ${ver} · `; need(s, v);
  s = s.replace(v, `버전 ${ver} (오프라인 ${badge}) · `);
  need(s, '<h2>이 앱에 대해</h2>');
  s = s.replace('<h2>이 앱에 대해</h2>', '<h2>이 앱에 대해</h2>\n      <p id="offlineStatus" style="margin:0 0 8px;font-weight:600">오프라인 준비 중…</p>');
  return s;
}
fs.mkdirSync(path.join(OUT1, 'img'), { recursive: true });
let a = common(src, '앱');
need(a, CDN); a = a.replace(CDN, '<script src="vexflow.js"></script>');
a = a.replace('</body>', `<script>
(function () {
  var el = document.getElementById('offlineStatus');
  function say(t) { if (el) el.textContent = t; }
  if (!('serviceWorker' in navigator)) { say('이 브라우저는 오프라인 저장을 지원하지 않습니다. 크롬·사파리 최신판을 쓰세요.'); return; }
  navigator.serviceWorker.register('sw.js').then(function () { return navigator.serviceWorker.ready; })
    .then(function () { say('✅ 이 기기에 저장됨 — 이제 인터넷 없이도 열립니다'); })
    .catch(function () { say('오프라인 저장에 실패했습니다. 인터넷에 연결된 상태에서 한 번 다시 여세요.'); });
})();
</script>
</body>`);
fs.writeFileSync(path.join(OUT1, 'index.html'), a);
fs.writeFileSync(path.join(OUT1, 'vexflow.js'), vex);
for (const f of ['sood-192.jpg', 'icon-180.png', 'icon-192.png', 'icon-512.png']) fs.copyFileSync(path.join(SRC_ROOT, 'img', f), path.join(OUT1, 'img', f));
fs.writeFileSync(path.join(OUT1, 'guide.html'), guide.replace('<title>리듬 연습 사용법</title>', '<title>리듬 연습 사용법 (오프라인)</title>'));
const man = JSON.parse(fs.readFileSync(path.join(SRC_ROOT, 'manifest.webmanifest'), 'utf8'));
Object.assign(man, { id: './', name: '리듬 연습 오프라인 — 수트와후드', short_name: '리듬 연습(오프)', start_url: './', scope: './' });
fs.writeFileSync(path.join(OUT1, 'manifest.webmanifest'), JSON.stringify(man, null, 2));
const files = ['./', 'index.html', 'vexflow.js', 'guide.html', 'manifest.webmanifest', 'img/sood-192.jpg', 'img/icon-180.png', 'img/icon-192.png', 'img/icon-512.png'];
const h = crypto.createHash('sha1');
for (const f of files.slice(1)) h.update(fs.readFileSync(path.join(OUT1, f)));
const CACHE = 'rp-offline-' + ver + '-' + h.digest('hex').slice(0, 10);
fs.writeFileSync(path.join(OUT1, 'sw.js'), `const CACHE = ${JSON.stringify(CACHE)};
const FILES = ${JSON.stringify(files)};
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k.startsWith('rp-offline-') && k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return;
  e.respondWith(caches.open(CACHE).then(async c => {
    const hit = await c.match(req, { ignoreSearch: true }) || (req.mode === 'navigate' ? await c.match('index.html') : null);
    const net = fetch(req).then(r => { if (r && r.ok) c.put(req, r.clone()); return r; }).catch(() => null);
    return hit || (await net) || new Response('오프라인입니다', { status: 503, headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
  }));
});
`);
console.log('built', ver, CACHE);
