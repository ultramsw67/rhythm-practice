// 앱으로 설치할 수 있는지 (크롬 기준: 설치 가능 여부·오류, 매니페스트 내용)
module.exports = async (c) => {
  await c.size(390, 844);
  await c.go(process.env.URL0 || 'http://127.0.0.1:' + (process.env.PORT || 8765) + '/');
  await c.sleep(1500);
  const m = await c.send('Page.getAppManifest');
  console.log('manifest url', m.result && m.result.url, 'errors', JSON.stringify(m.result && m.result.errors));
  const p = await c.send('Page.getAppManifest', {});
  const inst = await c.send('Page.getInstallabilityErrors');
  console.log('installability errors', JSON.stringify(inst.result && inst.result.installabilityErrors));
  console.log(JSON.stringify(await c.ev(`(async()=>{ const r = await fetch(document.querySelector('link[rel=manifest]').href); const j = await r.json(); const icons = await Promise.all(j.icons.map(async i => { const x = await fetch(new URL(i.src, r.url)); return i.src + ' ' + x.status + ' ' + x.headers.get('content-type'); })); return { name: j.name, short: j.short_name, display: j.display, icons, apple: document.querySelector('link[rel=apple-touch-icon]').href }; })()`)));
};
