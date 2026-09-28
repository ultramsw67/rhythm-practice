// 4. 옛 판 호환: gen 없는 저장 설정(level 1~3) → 1·4·7단계, gen:0 → "이전 판 난이도" 문구
module.exports = async (c) => {
  const B = 'http://127.0.0.1:' + (process.env.PORT || 8765) + '/';
  await c.size(390, 844, true);
  await c.go(B);
  const old = { mode: 'rhythm', meter: '3/4', level: 1, bars: 8, key: 'F', inst: 'flute', bpm: 96, pickup: 'auto', artic: 'auto', seed: 1234, edits: {} };
  for (const lv of [1, 2, 3]) for (const mode of ['rhythm', 'melody']) {
    await c.ev(`localStorage.clear(); localStorage.setItem('rp.startSeen','true'); localStorage.setItem('rp.set', JSON.stringify(Object.assign(${JSON.stringify(old)}, {level:${lv}, mode:'${mode}'})))`);
    await c.go(B);
    console.log('nogen lv' + lv + ' ' + mode, await c.ev(`JSON.stringify({gen:RP.set.gen, level:RP.set.level, seed:RP.set.seed, meter:RP.set.meter, bars:RP.set.bars, hint:document.querySelector('#levelHint').textContent, sum:document.querySelector('#setSum').textContent, pressed:[...document.querySelectorAll('#levelSeg [aria-pressed=true]')].map(b=>b.dataset.v), saved:JSON.parse(localStorage.getItem('rp.set')).gen+'/'+JSON.parse(localStorage.getItem('rp.set')).level, svg:!!document.querySelector('#score svg')})`));
    // 다시 열어도 그대로인지 (두 번 옮기지 않는지)
    await c.go(B);
    console.log('  reopen', await c.ev(`RP.set.gen+' '+RP.set.level+' | '+document.querySelector('#setSum').textContent`));
  }
  // gen 0 이 저장된 경우
  for (const lv of [1, 2, 3]) {
    await c.ev(`localStorage.clear(); localStorage.setItem('rp.startSeen','true'); localStorage.setItem('rp.set', JSON.stringify(Object.assign(${JSON.stringify(old)}, {gen:0, level:${lv}})))`);
    await c.go(B);
    console.log('gen0 lv' + lv, await c.ev(`JSON.stringify({gen:RP.set.gen, level:RP.set.level, hint:document.querySelector('#levelHint').textContent, sum:document.querySelector('#setSum').textContent, info:document.querySelector('#scoreInfo').textContent, pressed:document.querySelectorAll('#levelSeg [aria-pressed=true]').length, svg:!!document.querySelector('#score svg')})`));
    // 옛 판에서 박자표·새 악보를 바꾸면?
    console.log('  meter change', await c.ev(`(()=>{const s=document.querySelector('#meter'); s.value='6/8'; s.dispatchEvent(new Event('change')); return RP.set.gen+' '+RP.set.level+' | '+document.querySelector('#levelHint').textContent+' | '+document.querySelector('#setSum').textContent})()`));
    console.log('  new score', await c.ev(`(()=>{document.querySelector('#newBtn').click(); return RP.set.gen+' '+RP.set.level+' | '+document.querySelector('#levelHint').textContent})()`));
    console.log('  play', await c.ev(`(async()=>{document.querySelector('#playBtn').click(); await new Promise(r=>setTimeout(r,2000)); const t=document.querySelector('#playBtn').textContent; document.querySelector('#playBtn').click(); return t})()`));
    console.log('  click 2', await c.ev(`(()=>{document.querySelectorAll('#levelSeg button')[1].click(); return RP.set.gen+' '+RP.set.level+' | '+document.querySelector('#levelHint').textContent+' | '+[...document.querySelectorAll('#levelSeg [aria-pressed=true]')].map(b=>b.dataset.v)})()`));
  }
  // gen 없음 + level 이 이상한 값
  for (const lv of [0, 4, 7, 'null', '"2"']) {
    await c.ev(`localStorage.clear(); localStorage.setItem('rp.startSeen','true'); localStorage.setItem('rp.set', JSON.stringify(Object.assign(${JSON.stringify(old)}, {level:${lv}})))`);
    await c.go(B);
    console.log('odd level ' + lv, await c.ev(`JSON.stringify({gen:RP.set.gen, level:RP.set.level, hint:document.querySelector('#levelHint').textContent, svg:!!document.querySelector('#score svg'), ph:(document.querySelector('#score .placeholder')||{}).textContent})`));
  }
  // 옛 링크 (l:1~3, gen 없음)
  for (const lv of [1, 2, 3]) {
    await c.go(B + '#' + encodeURIComponent(JSON.stringify({ m: 'r', t: '4/4', l: lv, b: 4, k: 'C', s: 77, v: 90 })));
    await c.go(B + '#' + encodeURIComponent(JSON.stringify({ m: 'r', t: '4/4', l: lv, b: 4, k: 'C', s: 77, v: 90 })));
    console.log('oldlink l' + lv, await c.ev(`RP.set.gen+' '+RP.set.level+' | '+document.querySelector('#levelHint').textContent`));
  }
  // 옛 기록(보관함) 열기: gen 없는 take
  console.log('--- console errors above if any');
};
