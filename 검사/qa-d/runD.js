// Sloppy recording: colors, tips, result buttons (새 악보로 연습 / 같은 악보 다시 녹음)
const fs = require('fs'), path = require('path');
const OUT = __dirname;
const SET = { mode: 'rhythm', level: 1, meter: '4/4', bars: 2, key: 'C', inst: 'c_treble', bpm: 100, pickup: 'off', artic: 'auto', seed: 3, edits: {} };
module.exports = async (c) => {
  await c.size(390, 844, true);
  await c.go(process.env.URL0 || 'http://127.0.0.1:' + (process.env.PORT || 8781) + '/');
  await c.ev(`document.querySelector('#startClose').click()`);
  const out = {};
  await c.ev(`(()=>{ Object.assign(RP.set, ${JSON.stringify(SET)}); RP.rebuild(); document.querySelector('#countIn').value='1'; })()`);
  await c.ev(`document.querySelector('#recBtn').click()`);
  let st = '';
  for (let i = 0; i < 60; i++) { await c.sleep(1000); st = await c.ev(`document.querySelector('#recStatus').textContent`); if (/점 —|오류|못|않|멈췄/.test(st)) break; }
  out.recStatus = st;
  await c.sleep(500);
  out.colors = await c.ev(`(()=>{ const els = [...document.querySelectorAll('#resScore path, #resScore .vf-stavenote')]; const cls = new Set(); document.querySelectorAll('#resScore [class*=grade-], #resScore [style*=fill]').forEach(e=>{}); return { total: document.querySelector('#resTotal, .res-score, #resScoreNum')?.textContent, tips: document.querySelector('#resTips').children.length, tipsText: [...document.querySelectorAll('#resTips li')].map(l=>l.textContent) }; })()`);
  out.scoreMultipleOf10 = await c.ev(`(()=>{ const m = document.body.innerHTML.match(/(\\d+)점/); return m ? +m[1] : null; })()`);
  const rc = await c.ev(`(()=>{const r=document.querySelector('#tab-result').getBoundingClientRect(); return {x:0,y:Math.max(0,r.top+scrollY),width:390,height:Math.min(r.height,1400),scale:1}})()`);
  const shot1 = await c.send('Page.captureScreenshot', { format: 'png', clip: rc });
  fs.writeFileSync(path.join(OUT, 'result-sloppy.png'), Buffer.from(shot1.result.data, 'base64'));

  out.seedBefore = await c.ev(`RP.set.seed`);
  await c.ev(`document.querySelector('#resNew').click()`);
  await c.sleep(300);
  out.afterResNew = await c.ev(`({ tab: document.querySelector('[data-tab=practice]').getAttribute('aria-selected'), seed: RP.set.seed, sameMeterBpm: RP.set.meter==='4/4' && RP.set.bpm===100 })`);

  console.log(JSON.stringify(out, null, 1));
};
