// Highlight during active recording (after count-in, while notes are being played)
module.exports = async (c) => {
  await c.size(390, 844, true);
  await c.go(process.env.URL0 || 'http://127.0.0.1:' + (process.env.PORT || 8781) + '/');
  await c.ev(`document.querySelector('#startClose').click()`);
  const SET = { mode: 'rhythm', level: 1, meter: '4/4', bars: 2, key: 'C', inst: 'c_treble', bpm: 100, pickup: 'off', artic: 'auto', seed: 3, edits: {} };
  await c.ev(`(()=>{ Object.assign(RP.set, ${JSON.stringify(SET)}); RP.rebuild(); document.querySelector('#countIn').value='1'; })()`);
  await c.ev(`document.querySelector('#recBtn').click()`);
  // count-in 1 bar @100bpm 4/4 = 2.4s; check at 3.5s (should be in note region) and 5.5s (later notes passed = grey)
  await c.sleep(3500);
  const mid = await c.ev(`({ now: document.querySelectorAll('#score .now').length, done: document.querySelectorAll('#score .done').length })`);
  await c.sleep(2000);
  const late = await c.ev(`({ now: document.querySelectorAll('#score .now').length, done: document.querySelectorAll('#score .done').length })`);
  let st = '';
  for (let i = 0; i < 30; i++) { await c.sleep(500); st = await c.ev(`document.querySelector('#recStatus').textContent`); if (/점 —|오류|못|않|멈췄/.test(st)) break; }
  const afterFinish = await c.ev(`({ now: document.querySelectorAll('#score .now').length, done: document.querySelectorAll('#score .done').length, recording: document.body.classList.contains('recording') })`);
  console.log(JSON.stringify({ mid, late, recStatus: st, afterFinish }, null, 1));
};
