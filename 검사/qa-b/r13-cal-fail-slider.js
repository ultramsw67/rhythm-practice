// R13: 클릭이 안 들리는 경우 실패 메시지 + 슬라이더로 직접 맞추기
module.exports = async (c) => {
  await c.size(390, 844);
  await c.go('http://127.0.0.1:8772/');
  await c.ev(`(()=>{ localStorage.clear(); })()`);
  await c.go('http://127.0.0.1:8772/');
  await c.ev(`document.querySelector('nav.tabs [data-tab=settings]').click()`);
  await c.ev(`document.querySelector('#calSpk').click()`);
  let msg = '';
  for (let i = 0; i < 15; i++) { await c.sleep(1000); msg = await c.ev(`document.querySelector('#calMsg').textContent`); if (/맞췄|잘 안|오류/.test(msg)) break; }
  const out = { failMsg: msg, latNowAfterFail: await c.ev(`document.querySelector('#latNow').textContent`), btnsReenabled: await c.ev(`({spk: document.querySelector('#calSpk').disabled, clap: document.querySelector('#calClap').disabled})`) };
  // 슬라이더로 직접 맞추기
  out.slider = await c.ev(`(()=>{ const r=document.querySelector('#latRange'); r.value='-85'; r.dispatchEvent(new Event('input')); return { shown: document.querySelector('#latNow').textContent, obj: JSON.parse(localStorage.getItem('rp.latency')) }; })()`);
  console.log(JSON.stringify(out, null, 1));
};
