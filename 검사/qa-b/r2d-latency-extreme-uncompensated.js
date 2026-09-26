// R2d: 실제로 700ms 늦은 연주를, 지연 보정 없이(0ms) 녹음 -> 굵은 오차 범위를 벗어나는지 확인
const SET = require('./sets.json').rhythm4;
module.exports = async (c) => {
  await c.size(390, 844);
  await c.go('http://127.0.0.1:8772/');
  await c.ev(`(()=>{ indexedDB.deleteDatabase('rhythm-practice'); localStorage.clear(); })()`);
  await c.go('http://127.0.0.1:8772/');
  await c.ev(`(()=>{ Object.assign(RP.set, ${JSON.stringify(SET)}); RP.rebuild(); document.querySelector('#countIn').value='1'; document.querySelector('#metroOn').checked=true; document.querySelector('#listen').value='ear'; })()`);
  await c.ev(`document.querySelector('#recBtn').click()`);
  let st = '';
  for (let i = 0; i < 60; i++) { await c.sleep(1000); st = await c.ev(`document.querySelector('#recStatus').textContent`); if (/점 —|오류|못|않|멈췄/.test(st)) break; }
  const out = { status: st, result: await c.ev(`({ total: document.querySelector('#resTotal').textContent, dev: RPX.take.result.meanDevMs, matched: RPX.take.result.matched, count: RPX.take.result.count })`) };
  console.log(JSON.stringify(out, null, 1));
};
