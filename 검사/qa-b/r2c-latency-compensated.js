// R2c: 실제로 250ms 늦은 연주를 지연 보정 250ms 로 녹음 -> meanDevMs 가 0 근처로 돌아오고 점수가 회복돼야 함
const SET = require('./sets.json').rhythm4;
module.exports = async (c) => {
  await c.size(390, 844);
  await c.send('Page.addScriptToEvaluateOnNewDocument', { source: `localStorage.setItem('rp.latency', JSON.stringify({ ms:250, src:'manual', at: Date.now() }));` });
  await c.go('http://127.0.0.1:8772/');
  await c.ev(`(()=>{ indexedDB.deleteDatabase('rhythm-practice'); })()`);
  await c.go('http://127.0.0.1:8772/');
  await c.ev(`(()=>{ Object.assign(RP.set, ${JSON.stringify(SET)}); RP.rebuild(); document.querySelector('#countIn').value='1'; document.querySelector('#metroOn').checked=true; document.querySelector('#listen').value='ear'; })()`);
  await c.ev(`document.querySelector('#recBtn').click()`);
  let st = '';
  for (let i = 0; i < 60; i++) { await c.sleep(1000); st = await c.ev(`document.querySelector('#recStatus').textContent`); if (/점 —|오류|못|않|멈췄/.test(st)) break; }
  const out = { status: st, result: await c.ev(`({ total: document.querySelector('#resTotal').textContent, dev: RPX.take.result.meanDevMs, matched: RPX.take.result.matched, count: RPX.take.result.count })`) };
  console.log(JSON.stringify(out, null, 1));
};
