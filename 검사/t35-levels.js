// v3.0 난이도 7단계 → v3.9 5단계: 단계마다 악보 캡처(lv1~7.png), 단계 단추·설명 줄, 320px 에서 넘침·작은 단추, 옛 3단계 악보 표시
module.exports = async (c) => {
  await c.size(390, 844);
  await c.go('http://127.0.0.1:8765/');
  await c.ev(`localStorage.setItem('rp.startSeen','true')`);
  const seeds = {};                                   // 5 = 3-3-2 리듬, 6 = 셔플([3 q 8]) 이 나오는 번호
  for (let lv = 1; lv <= 5; lv++) {
    const info = await c.ev(`(()=>{Object.assign(RP.set,{gen:3,mode:'rhythm',level:${lv},meter:'4/4',bars:4,pickup:'off',artic:'auto',bpm:88,seed:${seeds[lv] || 30 + lv},edits:{}});RP.rebuild();
      return document.querySelector('#scoreInfo').textContent+' | '+(document.querySelector('#score .placeholder')?.textContent||'ok')})()`);
    console.log('lv' + lv, info);
    await c.shotEl('lv' + lv + '.png', '#score');
  }
  // 단계 단추를 실제로 눌러 본다
  for (const w of [320, 390, 1024]) {
    await c.size(w, 900, w < 900);
    await c.go('http://127.0.0.1:8765/');
    const r = await c.ev(`(()=>{const d=document.querySelector('details#setBox, details'); if(d) d.open=true;
      const bs=[...document.querySelectorAll('#levelSeg button')]; bs[4].click();
      const hint=document.querySelector('#levelHint').textContent, sum=document.querySelector('#setSum').textContent;
      const small=bs.filter(b=>{const q=b.getBoundingClientRect();return q.width<44||q.height<44}).length;
      return JSON.stringify({n:bs.length, level:RP.set.level, gen:RP.set.gen, pressed:bs.filter(b=>b.getAttribute('aria-pressed')==='true').map(b=>b.dataset.v), hint, sum, small, overflowX:document.documentElement.scrollWidth-innerWidth})})()`);
    console.log(w, r);
    await c.shotEl('lvseg-' + w + '.png', '#levelSeg');
  }
  // 옛 3단계 기록(gen 0)을 열면: 단추는 안 눌린 상태, 안내 문구
  const old = await c.ev(`(()=>{Object.assign(RP.set,{gen:0,level:3,edits:{}});RP.rebuild();RP.syncForm&&RP.syncForm();
    return document.querySelector('#levelHint').textContent+' | '+document.querySelector('#scoreInfo').textContent})()`);
  console.log('legacy', old);
};
