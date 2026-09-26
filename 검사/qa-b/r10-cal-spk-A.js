// R10: 스피커로 자동 측정(clicks-A) + 연속 두 번 누르기(중복 방지) 확인
module.exports = async (c) => {
  await c.size(390, 844);
  await c.go('http://127.0.0.1:8772/');
  await c.ev(`(()=>{ localStorage.clear(); })()`);
  await c.go('http://127.0.0.1:8772/');
  await c.ev(`document.querySelector('nav.tabs [data-tab=settings]').click()`);
  // 더블 클릭(연타) - 두 번째는 무시돼야 함
  await c.ev(`(()=>{ document.querySelector('#calSpk').click(); document.querySelector('#calSpk').click(); })()`);
  const disabledRightAfter = await c.ev(`document.querySelector('#calSpk').disabled`);
  let msg = '';
  for (let i = 0; i < 15; i++) { await c.sleep(1000); msg = await c.ev(`document.querySelector('#calMsg').textContent`); if (/맞췄|잘 안|오류/.test(msg)) break; }
  const out = { disabledRightAfter, msg, latNow: await c.ev(`document.querySelector('#latNow').textContent`), latSrc: await c.ev(`document.querySelector('#latSrc').textContent`), latencyObj: await c.ev(`JSON.parse(localStorage.getItem('rp.latency'))`) };
  await c.shot('qa-b/r10-cal-spk-A.png');
  console.log(JSON.stringify(out, null, 1));
};
