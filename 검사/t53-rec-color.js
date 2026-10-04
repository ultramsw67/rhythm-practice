// v3.9.5 진행 표시 색: 녹음 중 = 파랑(#1a5fd6, 채점 색과 겹치지 않게), 들어보기 = 주황빨강(#ff3d00) 그대로, 끝나면 표시가 지워지는지
// 사용: FAKE_WAV=<영문 경로 fake.wav> node cdp.js t53-rec-color.js  (녹음을 맨 먼저 해야 가짜 마이크가 정확)
module.exports = async (c) => {
  await c.size(390, 844);
  await c.go(process.env.URL0 || 'http://127.0.0.1:8765/');
  const bad = [];
  const colorNow = `(()=>{const el=document.querySelector('#score .now path, #score .now rect'); return el ? getComputedStyle(el).fill : null})()`;
  await c.ev(`(()=>{ Object.assign(RP.set,{mode:'melody',meter:'4/4',level:2,bars:4,key:'Bb',inst:'clarinet',bpm:96,pickup:'off',artic:'auto',seed:777,edits:{}}); RP.rebuild(); document.querySelector('#countIn').value='1'; })()`);
  await c.ev(`document.querySelector('#recBtn').click()`);
  let recFill = null;
  for (let i = 0; i < 40 && !recFill; i++) { await c.sleep(250); recFill = await c.ev(colorNow); }
  const recBody = await c.ev(`document.body.classList.contains('recording')`);
  let st = '';
  for (let i = 0; i < 40; i++) { await c.sleep(1000); st = await c.ev(`document.querySelector('#recStatus').textContent`); if (/점 —|오류|못|않|멈췄/.test(st)) break; }
  const leftAfterRec = await c.ev(`document.querySelectorAll('#score .now').length`);
  await c.ev(`document.querySelector('nav.tabs [data-tab=practice]').click()`);
  await c.ev(`document.querySelector('#playBtn').click()`);
  let playFill = null;
  for (let i = 0; i < 40 && !playFill; i++) { await c.sleep(250); playFill = await c.ev(colorNow); }
  await c.ev(`document.querySelector('#playBtn').click()`);
  const out = { recFill, recBody, st, leftAfterRec, playFill };
  if (recFill !== 'rgb(26, 95, 214)') bad.push('recNotBlue');
  if (playFill !== 'rgb(255, 61, 0)') bad.push('playNotOrange');
  if (leftAfterRec) bad.push('leftover');
  if (!/100점/.test(st)) bad.push('recScore');
  console.log(JSON.stringify(out));
  console.log('bad', JSON.stringify(bad));
};
