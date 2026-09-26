// R6: 못갖춘마디(pickup) 녹음 - 정보 문구, 채점 정상 확인
const SET = require('./sets.json').rhythmPickup;
module.exports = async (c) => {
  await c.size(390, 844);
  await c.go('http://127.0.0.1:8772/');
  await c.ev(`(()=>{ indexedDB.deleteDatabase('rhythm-practice'); localStorage.clear(); })()`);
  await c.go('http://127.0.0.1:8772/');
  await c.ev(`(()=>{ Object.assign(RP.set, ${JSON.stringify(SET)}); RP.rebuild(); document.querySelector('#countIn').value='1'; document.querySelector('#metroOn').checked=true; document.querySelector('#listen').value='ear'; })()`);
  const info = await c.ev(`document.querySelector('#scoreInfo').textContent`);
  await c.ev(`document.querySelector('#recBtn').click()`);
  let st = '';
  for (let i = 0; i < 60; i++) { await c.sleep(1000); st = await c.ev(`document.querySelector('#recStatus').textContent`); if (/점 —|오류|못|않|멈췄/.test(st)) break; }
  const out = { pickLen: await c.ev(`RP.score.pickLen`), infoText: info, status: st, result: await c.ev(`({ total: document.querySelector('#resTotal').textContent, meta: document.querySelector('#resMeta').textContent, matched: RPX.take.result.matched, count: RPX.take.result.count })`) };
  await c.shot('qa-b/r6-pickup.png');
  console.log(JSON.stringify(out, null, 1));
};
