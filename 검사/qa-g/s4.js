const SET = JSON.parse(process.env.SET);
module.exports = async (c) => {
  await c.size(390, 844);
  await c.go('http://127.0.0.1:8765/');
  await c.ev(`(()=>{ Object.assign(RP.set, ${JSON.stringify(SET)}); RP.rebuild(); document.querySelector('#countIn').value='1'; })()`);
  await c.ev(`document.querySelector('#recBtn').click()`);
  let st = '';
  for (let i = 0; i < 60; i++) { await c.sleep(1000); st = await c.ev(`document.querySelector('#recStatus').textContent`); if (/점 —|오류|못|않|멈췄/.test(st)) break; }
  const r = await c.ev(`(()=>{const R=RPX.take.result; return { st: document.querySelector('#recStatus').textContent, raw:R.raw, parts:R.parts, matched:R.matched, count:R.count, extras:R.extras, meanDev:R.meanDevMs, played:R.played, grades:R.notes.map(n=>n.grade[0]).join(''), devs:R.notes.map(n=>n.dev==null?'-':Math.round(n.dev*1000)).join(' ') }})()`);
  console.log(JSON.stringify(r));
};
