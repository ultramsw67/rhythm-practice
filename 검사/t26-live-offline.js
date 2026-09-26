// 실주소 오프라인 앱: 한 번 연 뒤 네트워크 차단하고 다시 열기
module.exports = async (c) => {
  await c.size(390, 844, true);
  const url = process.env.URL0 || 'https://ultramsw67.github.io/rhythm-practice/offline/';
  await c.go(url);
  console.log('first', JSON.stringify(await c.ev(`(async()=>{ await navigator.serviceWorker.ready; await new Promise(r=>setTimeout(r,2500)); const k=await caches.keys(); return { caches: k, files: k.length ? (await (await caches.open(k[0])).keys()).length : 0, status: document.querySelector('#offlineStatus').textContent }; })()`)));
  await c.send('Network.enable');
  await c.send('Network.emulateNetworkConditions', { offline: true, latency: 0, downloadThroughput: -1, uploadThroughput: -1 });
  await c.go(url);
  await c.sleep(1500);
  console.log('offline reopen', JSON.stringify(await c.ev(`(async()=>{ const o = { online: navigator.onLine, vex: !!(window.Vex && (Vex.Flow||Vex).Stave), svg: !!document.querySelector('#score svg'), ver: [...document.querySelectorAll('#tab-settings p')].map(p=>p.textContent).find(t=>t.includes('버전 v')), status: document.querySelector('#offlineStatus').textContent };
    document.querySelector('#startClose') && document.querySelector('#startClose').click();
    document.querySelector('nav.tabs [data-tab=settings]').click(); document.querySelector('#selfPerfect').click(); await new Promise(r=>setTimeout(r,4000)); o.selfTest = document.querySelector('#resTotal').textContent; return o; })()`)));
};
