// v3.9.6 진행 표시: 녹음 중에는 음표 색이 바뀌지 않음(지금 음·지나간 음 표시 없음), 들어보기는 주황빨강(#ff3d00)·지나간 음 회색 그대로
// 사용: FAKE_WAV=<영문 경로 fake.wav> node cdp.js t53-rec-color.js  (녹음을 맨 먼저 해야 가짜 마이크가 정확)
module.exports = async (c) => {
  await c.size(390, 844);
  await c.go(process.env.URL0 || 'http://127.0.0.1:8765/');
  const bad = [];
  const colorNow = `(()=>{const el=document.querySelector('#score .now path, #score .now rect'); return el ? getComputedStyle(el).fill : null})()`;
  await c.ev(`(()=>{ Object.assign(RP.set,{mode:'melody',meter:'4/4',level:2,bars:4,key:'Bb',inst:'clarinet',bpm:96,pickup:'off',artic:'auto',seed:777,edits:{}}); RP.rebuild(); document.querySelector('#countIn').value='1'; })()`);
  await c.ev(`document.querySelector('#recBtn').click()`);
  let recMarked = 0;
  for (let i = 0; i < 16; i++) { await c.sleep(600); recMarked = Math.max(recMarked, await c.ev(`(()=>{ let n = 0; for (const el of document.querySelectorAll('#score [id^=vf-ev] path')) { const f = getComputedStyle(el).fill; if (f !== 'rgb(0, 0, 0)' && f !== 'none') n++; } return n + document.querySelectorAll('#score .now, #score .done').length; })()`)); }   // 녹음 중 10초 동안 지켜봄
  const recFill = recMarked;
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
  if (recMarked !== 0) bad.push('recMarked');
  if (playFill !== 'rgb(255, 61, 0)') bad.push('playNotOrange');
  if (leftAfterRec) bad.push('leftover');
  // 점수는 t4 가 본다 (이 시험은 색을 자주 재느라 가짜 마이크가 어긋날 수 있음)
  console.log(JSON.stringify(out));
  console.log('bad', JSON.stringify(bad));
};
