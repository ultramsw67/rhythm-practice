// 3c. 마이크 준비 중(micBusy)에 단계·박자표를 바꾸면 설정과 악보가 어긋나는지
module.exports = async (c) => {
  const B = 'http://127.0.0.1:' + (process.env.PORT || 8765) + '/';
  await c.size(390, 844, true);
  await c.go(B);
  await c.ev(`localStorage.clear(); localStorage.setItem('rp.startSeen','true')`);
  await c.go(B);
  await c.ev(`window.__w=ms=>new Promise(r=>setTimeout(r,ms));
    const g=navigator.mediaDevices.getUserMedia.bind(navigator.mediaDevices); navigator.mediaDevices.getUserMedia=async(o)=>{ await __w(2000); return g(o); };
    Object.assign(RP.set,{gen:2,mode:'rhythm',level:3,meter:'4/4',bars:2,bpm:120,drum:''}); RP.rebuild(); 1`);
  for (const [nm, act] of [['level', `document.querySelectorAll('#levelSeg button')[4].click()`], ['meter', `(()=>{const s=document.querySelector('#meter'); s.value='6/8'; s.dispatchEvent(new Event('change'));})()`], ['bars', `(()=>{const s=document.querySelector('#bars'); s.value='16'; s.dispatchEvent(new Event('change'));})()`]]) {
    console.log(nm, await c.ev(`(async()=>{ Object.assign(RP.set,{gen:2,level:3,meter:'4/4',bars:2}); RP.rebuild(); const before=document.querySelector('#scoreInfo').textContent;
      document.querySelector('#recBtn').click(); await __w(300); document.querySelector('#setBox').open=true; ${act};
      const mid={set:RP.set.level+' '+RP.set.meter+' '+RP.set.bars, info:document.querySelector('#scoreInfo').textContent, pressed:[...document.querySelectorAll('#levelSeg [aria-pressed=true]')].map(b=>b.dataset.v).join(), meterSel:document.querySelector('#meter').value, barsSel:document.querySelector('#bars').value, scoreMeasures:RP.score.measures.length};
      await __w(2500); const r=RPX.rec; const recInfo = r ? {set:r.set.level+' '+r.set.meter+' '+r.set.bars, scoreMeasures:r.score.measures.length, scoreMeter:r.score.meter||(r.score.measures[0]&&r.score.measures[0].len)} : 'no rec';
      if (RPX.rec) document.querySelector('#recBtn').click(); await __w(400);
      const saved=JSON.parse(localStorage.getItem('rp.set'))||{};
      return JSON.stringify({before, mid, recInfo, after:{set:RP.set.level+' '+RP.set.meter+' '+RP.set.bars, info:document.querySelector('#scoreInfo').textContent, saved:saved.level+' '+saved.meter+' '+saved.bars}}); })()`));
  }
};
