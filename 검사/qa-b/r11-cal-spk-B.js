// R11: 스피커로 자동 측정(clicks-B = A보다 100ms 늦은 클릭열) - R10 대비 지연값이 약 +100ms 차이나야 함
module.exports = async (c) => {
  await c.size(390, 844);
  await c.go('http://127.0.0.1:8772/');
  await c.ev(`(()=>{ localStorage.clear(); })()`);
  await c.go('http://127.0.0.1:8772/');
  await c.ev(`document.querySelector('nav.tabs [data-tab=settings]').click()`);
  await c.ev(`document.querySelector('#calSpk').click()`);
  let msg = '';
  for (let i = 0; i < 15; i++) { await c.sleep(1000); msg = await c.ev(`document.querySelector('#calMsg').textContent`); if (/맞췄|잘 안|오류/.test(msg)) break; }
  const out = { msg, latNow: await c.ev(`document.querySelector('#latNow').textContent`), latencyObj: await c.ev(`JSON.parse(localStorage.getItem('rp.latency'))`) };
  await c.shot('qa-b/r11-cal-spk-B.png');
  console.log(JSON.stringify(out, null, 1));
};
