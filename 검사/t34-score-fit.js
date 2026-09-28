// 글자 크기(1~3) × 화면 폭 × 어려운 조표에서 악보 내용이 오른쪽으로 잘리지 않는지 (getBBox)
module.exports = async (c) => {
  const B = 'http://127.0.0.1:' + (process.env.PORT || 8765) + '/';
  await c.go(B);
  for (const w of [320, 360, 390, 430, 768]) {
    await c.size(w, 900, w < 500);
    for (const f of [1, 2, 3]) {
      await c.ev(`localStorage.setItem('rp.font','${f}'); localStorage.setItem('rp.startSeen','true')`);
      await c.go(B);
      const r = await c.ev(`(()=>{ let worst=-1e9, bad=[];
        for (const key of [7,-7,0]) for (const mode of ['melody','rhythm']) for (let seed=1; seed<=6; seed++) for (const inst of ['flute','tuba','alto_sax']) {
          Object.assign(RP.set,{mode,level:3,meter:'4/4',bars:8,inst,key,bpm:100,artic:'auto',pickup:'auto',seed,edits:{}}); RP.rebuild();
          const svg=document.querySelector('#score svg'); const W=+svg.getAttribute('width'); const bb=svg.getBBox(); const sc=svg.getBoundingClientRect().width/W;
          const over = (bb.x+bb.width)*(svg.viewBox.baseVal && svg.viewBox.baseVal.width ? W/svg.viewBox.baseVal.width : 1) - W;
          worst=Math.max(worst,over); if(over>1) bad.push([key,mode,seed,inst,Math.round(over)]);
        } return {worst:Math.round(worst), bad:bad.slice(0,3), n:bad.length}; })()`);
      console.log(w, 'font' + f, JSON.stringify(r));
    }
  }
};
