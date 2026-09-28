// 1b. 좁은 화면에서 악보 오른쪽 잘림: 여러 seed·단계·박자표·글자 크기, 한 장 캡처
module.exports = async (c) => {
  const B = 'http://127.0.0.1:' + (process.env.PORT || 8765) + '/';
  let firstBad = null;
  for (const w of [320]) for (const f of ['1', '3']) {
    await c.size(w, 900, true);
    await c.go(B);
    await c.ev(`localStorage.clear(); localStorage.setItem('rp.startSeen','true'); localStorage.setItem('rp.font','${f}')`);
    await c.go(B);
    const r = await c.ev(`(()=>{ const meters=['2/4','3/4','4/4','5/4','6/8','7/8','9/8','12/8','2/2']; const bad={}; let worst=-1e9, n=0, ex=null;
      for (const mode of ['rhythm','melody']) for (let lv=4; lv<=7; lv++) for (const m of meters) for (let seed=1; seed<=6; seed++) for (const pk of ['off','on']) {
        Object.assign(RP.set,{gen:2,mode,level:lv,meter:m,bars:16,pickup:pk,artic:'auto',seed,edits:{},inst:'clarinet',key:'Bb',drum:''}); RP.rebuild(); n++;
        const svg=document.querySelector('#score svg'); if(!svg){bad['nosvg']=(bad['nosvg']||0)+1; continue;}
        const W=+svg.getAttribute('width'); const vb=svg.viewBox.baseVal; const k=vb&&vb.width?W/vb.width:1; const bb=svg.getBBox();
        const over=(bb.x+bb.width)*k-W; worst=Math.max(worst,over);
        if(over>1){ const key=mode+' lv'+lv+' '+m; bad[key]=(bad[key]||0)+1; if(!ex||over>ex.over) ex={mode,lv,m,seed,pk,over:Math.round(over)}; }
      } return {n, worst:Math.round(worst), bad, ex}; })()`);
    console.log(w, 'font' + f, JSON.stringify(r));
    if (r.ex && !firstBad) firstBad = { w, f, ...r.ex };
  }
  if (firstBad) {
    await c.size(firstBad.w, 900, true);
    await c.go(B); await c.ev(`localStorage.setItem('rp.font','${firstBad.f}')`); await c.go(B);
    await c.ev(`Object.assign(RP.set,{gen:2,mode:'${firstBad.mode}',level:${firstBad.lv},meter:'${firstBad.m}',bars:8,pickup:'${firstBad.pk}',artic:'auto',seed:${firstBad.seed},edits:{},drum:''}); RP.rebuild(); 1`);
    await c.shotEl('qa-f/clip-worst.png', '#score');
    console.log('shot', JSON.stringify(firstBad));
  }
};
