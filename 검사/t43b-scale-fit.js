// v3.7 음계 악보 잘림 전수: 320px × 글자 3단계 × 박자표 9 × 4~7단계 × 조표 ±7 (가락단음계)
module.exports = async (c) => {
  await c.size(320, 900, true);
  await c.go('http://127.0.0.1:' + (process.env.PORT || 8765) + '/');
  const r = await c.ev(`(async()=>{
    localStorage.setItem('rp.startSeen','true');
    const bad = []; let n = 0; const errs = [];
    window.addEventListener('error', e => errs.push(String(e.message)));
    for (const font of ['1','2','3']) {
      const b = document.querySelector('[data-font="'+font+'"], #fontSeg [data-v="'+font+'"]'); if (b) b.click();
      await new Promise(r=>setTimeout(r,200));
      for (const meter of Object.keys(Core.METERS)) for (const level of [4,5,6,7]) for (const key of ['C#m','Abm','C#','Cb','Bb']) {
        Object.assign(RP.set,{gen:2,drum:'',bow:'',mode:'melody',prac:'scale',minor:'m',kref:'w',meter,level,bars:4,key,inst:'clarinet',pickup:'auto',artic:'auto',bpm:60,seed:7,edits:{}});
        RP.rebuild(); await new Promise(r=>setTimeout(r,30)); n++;
        const host=document.querySelector('#score'), hr=host.getBoundingClientRect(); let over=0;
        for (const el of host.querySelectorAll('svg *')) { const q=el.getBoundingClientRect(); if (q.width && q.right>hr.right+1) over=Math.max(over, Math.round(q.right-hr.right)); }
        if (over > 0) bad.push([font,meter,level,key,over, RP.score.events.length]);
      }
    }
    return JSON.stringify({ n, bad: bad.slice(0,20), nbad: bad.length, errs: errs.slice(0,3) });
  })()`);
  console.log(r);
};
