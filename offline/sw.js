// 리듬 연습 오프라인 — 자동 생성 (검사/build-offline.js). 직접 고치지 말 것
const CACHE = "rp-offline-v3.0-a9c6cf4465";
const FILES = ["./","index.html","vexflow.js","guide.html","manifest.webmanifest","img/sood-192.jpg","img/icon-180.png","img/icon-192.png","img/icon-512.png","LICENSES.txt","sounds/acoustic_grand_piano.js","sounds/alto_sax.js","sounds/baritone_sax.js","sounds/clarinet.js","sounds/flute.js","sounds/french_horn.js","sounds/LICENSE.txt","sounds/oboe.js","sounds/tenor_sax.js","sounds/trombone.js","sounds/trumpet.js","sounds/tuba.js"];
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
