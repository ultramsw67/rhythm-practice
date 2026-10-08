// 2026-10-08 오프라인 앱 운영 종료 — 예전에 설치된 저장본 관리자를 이것으로 바꿔, 저장해 둔 앱 파일을 지우고 스스로 물러난다.
// 녹음(IndexedDB)은 건드리지 않는다. 열려 있던 화면은 다시 열어 운영 종료 안내(index.html)를 보여 준다.
self.addEventListener('install', function () { self.skipWaiting(); });
self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (ks) { return Promise.all(ks.filter(function (k) { return k.indexOf('rp-offline-') === 0; }).map(function (k) { return caches.delete(k); })); })
    .then(function () { return self.registration.unregister(); })
    .then(function () { return self.clients.matchAll({ type: 'window' }); })
    .then(function (cs) { cs.forEach(function (c) { try { c.navigate(c.url); } catch (e) { } }); }));
});
