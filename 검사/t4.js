const SET = JSON.parse(process.env.SET);
module.exports = async (c) => {
  await c.size(390, 844);
  await c.go(process.env.URL0 || 'http://127.0.0.1:8765/');
  await c.ev(`(()=>{ Object.assign(RP.set, ${JSON.stringify(SET)}); RP.rebuild(); document.querySelector('#countIn').value='1'; })()`);
  await c.ev(`document.querySelector('#recBtn').click()`);
  let st = '';
  for (let i = 0; i < 60; i++) { await c.sleep(1000); st = await c.ev(`document.querySelector('#recStatus').textContent`); if (/점 —|오류|못|않|멈췄/.test(st)) break; }
  const r = await c.ev(`({ st: document.querySelector('#recStatus').textContent, cap: RPX.lastCap, played: RPX.take && RPX.take.result.played, matched: RPX.take && RPX.take.result.matched, sr: (window.AudioContext && 1) })`);
  console.log(JSON.stringify(r));
};
