// R5: 16마디 긴 곡, 예비박 2마디, 그만하기(중간 멈춤) -> 저장 안 됨 확인 -> 다시 녹음 완주 -> 리사이즈/테마 전환 후 결과 재렌더 확인
const SET = require('./sets.json').melodyLong16;
module.exports = async (c) => {
  await c.size(390, 844);
  await c.go('http://127.0.0.1:8772/');
  await c.ev(`(()=>{ indexedDB.deleteDatabase('rhythm-practice'); localStorage.clear(); })()`);
  await c.go('http://127.0.0.1:8772/');
  await c.ev(`(()=>{ Object.assign(RP.set, ${JSON.stringify(SET)}); RP.rebuild(); document.querySelector('#countIn').value='2'; document.querySelector('#metroOn').checked=true; document.querySelector('#listen').value='ear'; })()`);
  const out = {};
  out.dbBefore = await c.ev(`(async()=>(await RPX.DB.all()).length)()`);
  // 1) 시작 후 4초 만에 그만하기
  await c.ev(`document.querySelector('#recBtn').click()`);
  await c.sleep(4000);
  await c.ev(`document.querySelector('#recBtn').click()`);
  await c.sleep(300);
  out.abortStatus = await c.ev(`document.querySelector('#recStatus').textContent`);
  out.dbAfterAbort = await c.ev(`(async()=>(await RPX.DB.all()).length)()`);
  out.recBtnAfterAbort = await c.ev(`document.querySelector('#recBtn').textContent`);
  // 2) 다시 녹음 (완주)
  await c.ev(`document.querySelector('#recBtn').click()`);
  let st = '';
  for (let i = 0; i < 90; i++) { await c.sleep(1000); st = await c.ev(`document.querySelector('#recStatus').textContent`); if (/점 —|오류|못|않|멈췄/.test(st)) break; }
  out.fullStatus = st;
  out.dbAfterFull = await c.ev(`(async()=>(await RPX.DB.all()).length)()`);
  out.fullResult = await c.ev(`({ total: document.querySelector('#resTotal').textContent, count: RPX.take && RPX.take.result.count })`);
  // 3) 리사이즈 + 테마 전환 후 결과 재렌더 확인
  await c.size(800, 1000);
  await c.sleep(300);
  out.afterResize = await c.ev(`({ svg: !!document.querySelector('#resScore svg'), total: document.querySelector('#resTotal').textContent })`);
  out.beforeTheme = await c.ev(`(()=>{ const cs=getComputedStyle(document.documentElement); const okVar=cs.getPropertyValue('--ok').trim();
    const el=[...document.querySelectorAll('#resScore [fill]')].find(e=>e.getAttribute('fill') && e.getAttribute('fill')!=='none');
    return { okVar, sampleFill: el && el.getAttribute('fill') }; })()`);
  await c.ev(`document.querySelector('#themeBtn').click()`); // auto -> light
  await c.sleep(200);
  const theme1 = await c.ev(`document.documentElement.getAttribute('data-theme')`);
  await c.ev(`document.querySelector('#themeBtn').click()`); // light -> dark
  await c.sleep(300);
  const theme2 = await c.ev(`document.documentElement.getAttribute('data-theme')`);
  out.afterThemeNoRerender = await c.ev(`(()=>{ const cs=getComputedStyle(document.documentElement); const okVar=cs.getPropertyValue('--ok').trim();
    const el=[...document.querySelectorAll('#resScore [fill]')].find(e=>e.getAttribute('fill') && e.getAttribute('fill')!=='none');
    return { okVar, sampleFill: el && el.getAttribute('fill') }; })()`);
  await c.shot('qa-b/r5-theme-dark-norerender.png');
  // 수동으로 결과 탭 다시 진입(재렌더) 하면 색이 새 테마를 따라가는지
  await c.ev(`(async()=>{ showTabByClick(); await new Promise(r=>setTimeout(r,200)); })(); function showTabByClick(){ document.querySelector('nav.tabs [data-tab=library]').click(); document.querySelector('nav.tabs [data-tab=result]').click(); }`);
  await c.sleep(300);
  out.afterReenterTab = await c.ev(`(()=>{ const el=[...document.querySelectorAll('#resScore [fill]')].find(e=>e.getAttribute('fill') && e.getAttribute('fill')!=='none'); return { sampleFill: el && el.getAttribute('fill') }; })()`);
  out.theme1 = theme1; out.theme2 = theme2;
  await c.shot('qa-b/r5-theme-dark-rerendered.png');
  console.log(JSON.stringify(out, null, 1));
};
