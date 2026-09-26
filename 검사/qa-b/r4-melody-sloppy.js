// R4: 선율 모드 흔들린 연주 - R3(완벽) 대비 점수 하락, 등급 색·팁 확인
const SET = require('./sets.json').melody4;
module.exports = async (c) => {
  await c.size(390, 844);
  await c.go('http://127.0.0.1:8772/');
  await c.ev(`(()=>{ indexedDB.deleteDatabase('rhythm-practice'); localStorage.clear(); })()`);
  await c.go('http://127.0.0.1:8772/');
  await c.ev(`(()=>{ Object.assign(RP.set, ${JSON.stringify(SET)}); RP.rebuild(); document.querySelector('#countIn').value='1'; document.querySelector('#metroOn').checked=true; document.querySelector('#listen').value='ear'; })()`);
  await c.ev(`document.querySelector('#recBtn').click()`);
  let st = '';
  for (let i = 0; i < 60; i++) { await c.sleep(1000); st = await c.ev(`document.querySelector('#recStatus').textContent`); if (/점 —|오류|못|않|멈췄/.test(st)) break; }
  const out = { status: st };
  out.result = await c.ev(`({ total: document.querySelector('#resTotal').textContent, matched: RPX.take.result.matched, count: RPX.take.result.count, dev: RPX.take.result.meanDevMs, grades: RPX.take.result.notes.map(n=>n.grade), tips: [...document.querySelectorAll('#resTips li')].map(l=>l.textContent) })`);
  await c.shot('qa-b/r4-result.png');
  console.log(JSON.stringify(out, null, 1));
};
