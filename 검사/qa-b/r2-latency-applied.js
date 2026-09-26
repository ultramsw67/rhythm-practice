// R2: 지연 보정 값이 실제로 채점에 반영되는지 (localStorage 사전 주입 250ms) - R1 baseline(0ms, meanDevMs=0)과 비교
const SET = require('./sets.json').rhythm4;
module.exports = async (c) => {
  await c.size(390, 844);
  // 페이지 로드 전에 지연값 주입 (앱 스크립트가 시작할 때 이미 읽도록)
  await c.send('Page.addScriptToEvaluateOnNewDocument', { source: `localStorage.setItem('rp.latency', JSON.stringify({ ms:250, src:'manual', at: Date.now() }));` });
  await c.go('http://127.0.0.1:8772/');
  await c.ev(`(()=>{ indexedDB.deleteDatabase('rhythm-practice'); })()`);
  await c.go('http://127.0.0.1:8772/');
  const out = {};
  out.latShown = await c.ev(`document.querySelector('#latNow').textContent`);
  await c.ev(`(()=>{ Object.assign(RP.set, ${JSON.stringify(SET)}); RP.rebuild(); document.querySelector('#countIn').value='1'; document.querySelector('#metroOn').checked=true; document.querySelector('#listen').value='ear'; })()`);
  await c.ev(`document.querySelector('#recBtn').click()`);
  let st = '';
  for (let i = 0; i < 60; i++) { await c.sleep(1000); st = await c.ev(`document.querySelector('#recStatus').textContent`); if (/점 —|오류|못|않|멈췄/.test(st)) break; }
  out.status = st;
  out.result = await c.ev(`({ total: document.querySelector('#resTotal').textContent, dev: RPX.take.result.meanDevMs, latencyMsUsed: RPX.take.latencyMs, matched: RPX.take.result.matched, count: RPX.take.result.count })`);
  console.log(JSON.stringify(out, null, 1));
};
