// R1: 리듬 모드 기본 녹음(완벽 연주) - 채점/저장/색칠/이중 녹음/중간 멈춤+가드 확인
const path = require('path');
const D = __dirname.replace(/\\/g, '/');
const SET = require('./sets.json').rhythm4;
module.exports = async (c) => {
  await c.size(390, 844);
  await c.go('http://127.0.0.1:8772/');
  await c.ev(`(()=>{ indexedDB.deleteDatabase('rhythm-practice'); localStorage.clear(); })()`);
  await c.go('http://127.0.0.1:8772/');
  await c.ev(`(()=>{ Object.assign(RP.set, ${JSON.stringify(SET)}); RP.rebuild(); document.querySelector('#countIn').value='1'; document.querySelector('#metroOn').checked=true; document.querySelector('#listen').value='ear'; })()`);
  const out = {};
  // 1) 첫 녹음 (실제)
  await c.ev(`document.querySelector('#recBtn').click()`);
  let st = '';
  for (let i = 0; i < 60; i++) { await c.sleep(1000); st = await c.ev(`document.querySelector('#recStatus').textContent`); if (/점 —|오류|못|않|멈췄/.test(st)) break; }
  out.rec1status = st;
  out.rec1 = await c.ev(`({ total: document.querySelector('#resTotal').textContent, parts: document.querySelector('#resParts').textContent, tips: [...document.querySelectorAll('#resTips li')].map(l=>l.textContent), take: RPX.take && { matched: RPX.take.result.matched, count: RPX.take.result.count, dev: RPX.take.result.meanDevMs, grades: RPX.take.result.notes.map(n=>n.grade) }, cap: RPX.lastCap })`);
  await c.shot('qa-b/r1-result.png');
  out.dbAfter1 = await c.ev(`(async()=>(await RPX.DB.all()).length)()`);
  // 2) 곧바로 두 번째 녹음(같은 wav 재생 위치가 이미 지나간 상태 - 실사용자의 "연속 두 번 녹음" 흉내)
  await c.ev(`document.querySelector('nav.tabs [data-tab=practice]').click()`);
  await c.ev(`document.querySelector('#recBtn').click()`);
  for (let i = 0; i < 30; i++) { await c.sleep(1000); st = await c.ev(`document.querySelector('#recStatus').textContent`); if (/점 —|오류|못|않|멈췄/.test(st)) break; }
  out.rec2status = st;
  out.dbAfter2 = await c.ev(`(async()=>(await RPX.DB.all()).length)()`);
  // 3) 세 번째 녹음 시작 후 중간에 다른 조작 시도(가드 확인) -> 그만하기로 멈춤
  await c.ev(`document.querySelector('#recBtn').click()`);
  await c.sleep(800);
  out.duringRec = await c.ev(`(()=>{
    const before = { seed: RP.score.set.seed, tab: document.querySelector('#tab-practice').classList.contains('hide') };
    document.querySelector('nav.tabs [data-tab=library]').click();
    const libShown = !document.querySelector('#tab-library').classList.contains('hide');
    document.querySelector('nav.tabs [data-tab=practice]').click();
    document.querySelector('#newBtn').click();
    const seedAfterNew = RP.score.set.seed;
    document.querySelector('#playBtn').click();
    const playedWhileRec = document.querySelector('#playBtn').textContent;
    document.querySelector('#bars').value = '8'; document.querySelector('#bars').dispatchEvent(new Event('change'));
    const barsAfter = RP.set.bars;
    return { libShown, seedSame: seedAfterNew===before.seed, playedWhileRec, barsSame: barsAfter===SET_BARS };
  })()`.replace('SET_BARS', SET.bars));
  const recBtnTextDuring = await c.ev(`document.querySelector('#recBtn').textContent`);
  out.recBtnTextDuring = recBtnTextDuring;
  await c.ev(`document.querySelector('#recBtn').click()`); // 그만하기
  await c.sleep(300);
  out.abortStatus = await c.ev(`document.querySelector('#recStatus').textContent`);
  out.dbAfter3 = await c.ev(`(async()=>(await RPX.DB.all()).length)()`);
  out.recBtnTextAfterAbort = await c.ev(`document.querySelector('#recBtn').textContent`);
  console.log(JSON.stringify(out, null, 1));
};
