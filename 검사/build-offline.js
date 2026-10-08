// 오프라인 버전 만들기 — 원본 index.html 에서 자동 생성 (앱을 고친 뒤 이것만 다시 돌리면 된다)
//   node build-offline.js
// ① (2026-10-08 운영 종료) 예전엔 ../offline/ 에 올라가던 웹 오프라인 앱 — 지금은 바탕화면 보관 폴더에만 만든다
// ② 바탕화면/수드 리듬 연습/보관/수드 리듬 연습 오프라인/ : PC 에서 파일을 두 번 눌러 여는 판. 악보 도구·그림을 파일 안에 모두 넣음
const fs = require('fs'), path = require('path'), crypto = require('crypto');
const ROOT = path.join(__dirname, '..');
// 2026-10-08 "오프라인 앱은 내리고 너만 저장해놔": 웹 오프라인 앱은 더 이상 올리지 않는다. 저장소 offline/ 에는 운영 종료 안내(index.html)와
// 설치된 앱을 지우는 sw.js 만 둔다(손으로 만든 파일, 이 스크립트가 덮지 않음). 오프라인 앱은 바탕화면 보관 폴더에만 만들어 둔다.
const OUT1 = process.env.OFFLINE_OUT1 || 'C:/Users/ultramsw67/Desktop/수드 리듬 연습/보관/오프라인 앱 (웹판, 최신)';
if (path.resolve(OUT1) === path.resolve(ROOT, 'offline')) throw new Error('offline/ 은 운영 종료 안내 자리 — 오프라인 앱을 여기에 만들지 않는다');
const OUT2 = 'C:/Users/ultramsw67/Desktop/수드 리듬 연습/보관/수드 리듬 연습 오프라인';     // 2026-09-28 바탕화면 「수드 리듬 연습」 최종 폴더로 정리 → 2026-10-08 "오프라인 내용 다 없애줘" 로 그 안 「보관」 폴더로
const ONLINE = 'https://ultramsw67.github.io/rhythm-practice/';
const CDN = '<script src="https://cdn.jsdelivr.net/npm/vexflow@4.2.5/build/cjs/vexflow.js"></script>';
let src = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const guide = fs.readFileSync(path.join(ROOT, 'guide.html'), 'utf8');
let vex = fs.readFileSync(path.join(ROOT, 'vendor', 'vexflow-4.2.5.js'), 'utf8');
if (process.env.MARK) vex += '\n// ' + process.env.MARK + '\n';                // 업데이트 시험용 표시
if (vex.includes('</script')) throw new Error('vexflow 안에 </script 가 있어 파일에 넣을 수 없음');
const need = (s, a) => { if (!s.includes(a)) throw new Error('원본에서 찾지 못함: ' + a.slice(0, 60)); };
let ver = (src.match(/버전 (v[\d.]+)/) || [])[1] || 'v?';
if (process.env.VER_OVERRIDE) { src = src.replace('버전 ' + ver + ' · ', '버전 ' + process.env.VER_OVERRIDE + ' · '); ver = process.env.VER_OVERRIDE; }

// 공통: 제목·배지·오프라인 상태 줄
function common(s, badge) {
  s = s.replace(/\n\s*<p [^>]*id="offlineLinkP"[^\n]*<\/p>/, '');                 // 오프라인판에는 '오프라인 버전 열기' 줄이 필요 없음
  need(s, '<title>수드 리듬 연습</title>'); s = s.replace('<title>수드 리듬 연습</title>', '<title>수드 리듬 연습 (오프라인)</title>');
  need(s, 'title="연습 화면 맨 위로">수드 리듬 연습</button></h1>');
  s = s.replace('title="연습 화면 맨 위로">수드 리듬 연습</button></h1>', 'title="연습 화면 맨 위로">수드 리듬 연습</button> <span class="off-badge">오프라인</span></h1>');
  need(s, '.home-btn{'); s = s.replace('.home-btn{', '.off-badge{display:inline-block;vertical-align:middle;font-size:11px;font-weight:700;color:#fff;background:#2f855a;border-radius:999px;padding:2px 8px;margin-left:4px}\n.home-btn{');
  const v = `버전 ${ver} · `; need(s, v);
  s = s.replace(v, `버전 ${ver} (오프라인 ${badge}) · `);
  // 아이폰 홈 화면에 두 앱을 다 저장해도 이름이 겹치지 않게 (v3.9.1, manifest short_name 과 같게)
  need(s, '<meta name="apple-mobile-web-app-title" content="수드 리듬 연습">');
  s = s.replace('<meta name="apple-mobile-web-app-title" content="수드 리듬 연습">', '<meta name="apple-mobile-web-app-title" content="수드 리듬(오프)">');
  need(s, '<h2>이 앱에 대해</h2>');
  s = s.replace('<h2>이 앱에 대해</h2>', '<h2>이 앱에 대해</h2>\n      <p id="offlineStatus" style="margin:0 0 8px;font-weight:600">오프라인 준비 중…</p>');
  return s;
}

// ① 인터넷에 올리는 오프라인 앱 ------------------------------------------------
fs.mkdirSync(path.join(OUT1, 'img'), { recursive: true });   // OUT1 도 함께 만들어짐
let a = common(src, '앱');
need(a, CDN); a = a.replace(CDN, '<script src="vexflow.js"></script>');
a = a.replace('</body>', `<script>
// 서비스워커: 처음 한 번 열 때 앱·악보 도구·그림을 이 기기에 저장 → 다음부터 인터넷 없이 열림
(function () {
  var el = document.getElementById('offlineStatus');
  function say(t) { if (el) el.textContent = t; }
  if (!('serviceWorker' in navigator)) { say('이 브라우저는 오프라인 저장을 지원하지 않습니다. 크롬·사파리 최신판을 쓰세요.'); return; }
  var ok = false;
  function net() { return navigator.onLine ? ' (지금 인터넷 연결됨)' : ' (지금 인터넷 끊김 — 저장본으로 동작 중)'; }
  function show() { if (ok) say('✅ 이 기기에 저장됨 — 인터넷 없이도 열립니다' + net()); }
  window.addEventListener('online', show); window.addEventListener('offline', show);
  // 새 버전이 들어오면 한 번만 저절로 새로고침 (처음 설치 때는 하지 않음)
  var had = !!navigator.serviceWorker.controller;
  navigator.serviceWorker.addEventListener('controllerchange', function () {
    if (!had) { had = true; return; }
    try { if (sessionStorage.getItem('rp-sw-reloaded')) return; } catch (e) { }
    later();
  });
  // v4.0.4: 녹음·채점 중이거나 저장 안 한 결과가 있으면 새로고침을 미뤘다가, 다시 앞으로 오거나 몇 초마다 보아 한가할 때 한다
  var waitT = 0;
  function later() {
    clearTimeout(waitT);
    if (window.rpBusy && window.rpBusy()) { waitT = setTimeout(later, 3000); return; }
    try { sessionStorage.setItem('rp-sw-reloaded', '1'); } catch (e) { }
    say('새 버전으로 바꾸는 중…'); location.reload();
  }
  try { setTimeout(function () { sessionStorage.removeItem('rp-sw-reloaded'); }, 10000); } catch (e) { }
  navigator.serviceWorker.register('sw.js').then(function () { return navigator.serviceWorker.ready; })
    .then(function () { ok = true; show(); })
    .catch(function () { say('오프라인 저장에 실패했습니다. 인터넷에 연결된 상태에서 한 번 다시 여세요.'); });
})();
</script>
</body>`);
fs.writeFileSync(path.join(OUT1, 'index.html'), a);
// v4.0.4 온라인 앱이 새 버전을 알아채는 표 (index.html 의 autoupdate 가 읽음)
if (!process.env.OFFLINE_OUT1) fs.writeFileSync(path.join(ROOT, 'version.txt'), ver + String.fromCharCode(10));
fs.writeFileSync(path.join(OUT1, 'vexflow.js'), vex);
for (const f of ['sood-192.jpg', 'icon-180.png', 'icon-192.png', 'icon-512.png']) fs.copyFileSync(path.join(ROOT, 'img', f), path.join(OUT1, 'img', f));
// 악기 소리(선율 모드): 모두 복사해 처음 열 때 함께 저장 → 인터넷 없이도 모든 악기 소리
const SOUNDS = fs.readdirSync(path.join(ROOT, 'sounds')).filter(f => /\.(js|txt)$/.test(f));
fs.mkdirSync(path.join(OUT1, 'sounds'), { recursive: true });
for (const f of SOUNDS) fs.copyFileSync(path.join(ROOT, 'sounds', f), path.join(OUT1, 'sounds', f));
fs.copyFileSync(path.join(ROOT, 'LICENSES.txt'), path.join(OUT1, 'LICENSES.txt'));  // 외부 자료 라이선스 전문
fs.writeFileSync(path.join(OUT1, 'guide.html'), guide.replace('<title>수드 리듬 연습 사용법</title>', '<title>수드 리듬 연습 사용법 (오프라인)</title>'));
const man = JSON.parse(fs.readFileSync(path.join(ROOT, 'manifest.webmanifest'), 'utf8'));
Object.assign(man, { id: './', name: '수드 리듬 연습 오프라인 — 수트와후드', short_name: '수드 리듬(오프)', start_url: './', scope: './' });
fs.writeFileSync(path.join(OUT1, 'manifest.webmanifest'), JSON.stringify(man, null, 2));
// 저장할 파일 목록과 내용 지문 → 앱을 고치면 캐시 이름이 바뀌어 새 버전을 받는다
const files = ['./', 'index.html', 'vexflow.js', 'guide.html', 'manifest.webmanifest', 'img/sood-192.jpg', 'img/icon-180.png', 'img/icon-192.png', 'img/icon-512.png', 'LICENSES.txt'].concat(SOUNDS.map(f => 'sounds/' + f));
const h = crypto.createHash('sha1');
for (const f of files.slice(1)) h.update(fs.readFileSync(path.join(OUT1, f)));
const CACHE = 'rp-offline-' + ver + '-' + h.digest('hex').slice(0, 10);
fs.writeFileSync(path.join(OUT1, 'sw.js'), `// 리듬 연습 오프라인 — 자동 생성 (검사/build-offline.js). 직접 고치지 말 것
const CACHE = ${JSON.stringify(CACHE)};
const FILES = ${JSON.stringify(files)};
// 새 버전을 저장할 때는 브라우저 자체 캐시(최대 10분)를 건너뛰고 인터넷에서 새로 받는다 — 옛 파일이 새 저장소에 섞이지 않게
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES.map(f => new Request(f, { cache: 'reload' })))).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k.startsWith('rp-offline-') && k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
// 저장본을 먼저 보여 주고(인터넷 없어도 열림), 인터넷이 되면 뒤에서 새 파일로 바꿔 둔다
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return;
  e.respondWith(caches.open(CACHE).then(async c => {
    const hit = await c.match(req, { ignoreSearch: true }) || (req.mode === 'navigate' ? await c.match('index.html') : null);
    const net = fetch(req.url, { cache: 'no-cache' }).then(r => { if (r && r.ok) c.put(req, r.clone()); return r; }).catch(() => null);
    return hit || (await net) || new Response('오프라인입니다', { status: 503, headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
  }));
});
`);

if (process.env.SKIP_DESKTOP) { console.log('offline(web) built', ver, CACHE); process.exit(0); }
// ② PC 바탕화면 폴더 (파일 하나로 열기) ------------------------------------------
fs.mkdirSync(OUT2, { recursive: true });
const b64 = f => fs.readFileSync(path.join(ROOT, 'img', f)).toString('base64');
const imgJpg = 'data:image/jpeg;base64,' + b64('sood-192.jpg');
const iconPng = 'data:image/png;base64,' + b64('icon-192.png');
let d = common(src, 'PC 파일');
need(d, CDN); d = d.replace(CDN, '<script>\n' + vex + '\n</script>');
d = d.split('src="img/sood-192.jpg"').join('src="' + imgJpg + '"');
d = d.replace(/<link rel="icon" href="img\/icon-192.png">/, '<link rel="icon" href="' + iconPng + '">');
d = d.replace(/<link rel="apple-touch-icon"[^>]*>\n?/, '').replace(/<link rel="manifest"[^>]*>\n?/, '');
d = d.split('href="guide.html"').join('href="사용법.html"');
// 파일로 열면 주소가 file:// 이라 공유 링크는 인터넷 주소로 만든다
need(d, "const url = location.href.split('#')[0] + '#' + code;");
d = d.replace("const url = location.href.split('#')[0] + '#' + code;", `const url = ${JSON.stringify(ONLINE)} + '#' + code;`);
d = d.replace('</body>', `<script>
(function () { var el = document.getElementById('offlineStatus'); if (el) el.textContent = '✅ PC 파일 버전 — 인터넷 없이 바로 열립니다. 녹음은 이 PC 의 브라우저 안에 저장됩니다.'; })();
</script>
</body>`);
fs.writeFileSync(path.join(OUT2, '수드 리듬 연습 오프라인.html'), d);
fs.mkdirSync(path.join(OUT2, 'sounds'), { recursive: true });
for (const f of SOUNDS) fs.copyFileSync(path.join(ROOT, 'sounds', f), path.join(OUT2, 'sounds', f));
fs.copyFileSync(path.join(ROOT, 'LICENSES.txt'), path.join(OUT2, 'LICENSES.txt'));
let g = guide.replace('<title>수드 리듬 연습 사용법</title>', '<title>수드 리듬 연습 사용법 (오프라인)</title>')
  .split('src="img/sood-192.jpg"').join('src="' + imgJpg + '"')
  .replace('<link rel="icon" href="img/sood-192.jpg">', '<link rel="icon" href="' + iconPng + '">')
  .replace('<a href="index.html">앱으로</a>', '<a href="수드 리듬 연습 오프라인.html">앱으로</a>');
fs.writeFileSync(path.join(OUT2, '사용법.html'), g);
fs.writeFileSync(path.join(OUT2, '읽어 주세요.txt'), '\ufeff' + [
  '수드 리듬 연습 오프라인 (PC 파일 버전) ' + ver,
  '',
  '1. 「수드 리듬 연습 오프라인.html」 을 두 번 누르면 크롬이나 엣지로 열립니다. 인터넷이 없어도 됩니다.',
  '2. 기본 브라우저가 다른 것이면: 파일을 오른쪽 클릭 → 연결 프로그램 → Chrome 또는 Microsoft Edge 를 고르세요.',
  '3. 이 폴더를 통째로 USB 나 다른 PC 에 옮겨도 그대로 열립니다. sounds 폴더(악기 소리)도 꼭 같이 옮기세요.',
  '4. 녹음과 점수는 이 PC 의 브라우저 안에 저장됩니다. 폴더를 옮기면 보관함은 새로 시작하니 먼저 보관함 → 전체 백업 내보내기를 하세요.',
].join('\r\n') + '\r\n');
console.log('offline built', ver, CACHE, '| desktop file', Math.round(fs.statSync(path.join(OUT2, '수드 리듬 연습 오프라인.html')).size / 1024) + 'KB');
