// R12: 손뼉으로 측정(clicks-A, clap 창) - spk 결과(R10)와 비교, 메시지·소스 문구 확인
module.exports = async (c) => {
  await c.size(390, 844);
  await c.go('http://127.0.0.1:8772/');
  await c.ev(`(()=>{ localStorage.clear(); })()`);
  await c.go('http://127.0.0.1:8772/');
  await c.ev(`document.querySelector('nav.tabs [data-tab=settings]').click()`);
  await c.ev(`document.querySelector('#calClap').click()`);
  let msg = '';
  for (let i = 0; i < 15; i++) { await c.sleep(1000); msg = await c.ev(`document.querySelector('#calMsg').textContent`); if (/맞췄|잘 안|오류/.test(msg)) break; }
  const out = { msg, latNow: await c.ev(`document.querySelector('#latNow').textContent`), latSrc: await c.ev(`document.querySelector('#latSrc').textContent`), latencyObj: await c.ev(`JSON.parse(localStorage.getItem('rp.latency'))`) };
  await c.shot('qa-b/r12-cal-clap-A.png');
  console.log(JSON.stringify(out, null, 1));
};
