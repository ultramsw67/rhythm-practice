module.exports = async (c) => {
  await c.size(390, 844); await c.go('http://127.0.0.1:8765/');
  for (const seed of [9, 10, 11]) {
  const r = await c.ev(`(async()=>{ const sl=ms=>new Promise(r=>setTimeout(r,ms)); Object.assign(RP.set,{mode:'melody',prac:'',inst:'flute',level:2,meter:'4/4',bars:4,bpm:88,seed:${seed},artic:'auto',edits:{}}); RP.syncForm(); RP.rebuild(); await sl(500);
    const host=document.querySelector('#score'); host.scrollIntoView(); await sl(200); const s=host._scale, rc=host.getBoundingClientRect();
    const hits=host._hits; const last=hits.filter(x=>!x.rest).slice(-1)[0]; const evs=RP.score.events; 
    host.dispatchEvent(new MouseEvent('click',{bubbles:true,clientX:rc.left+last.x*s,clientY:rc.top+6+((last.y0+last.y1)/2)*s})); await sl(300);
    const chips=[...document.querySelectorAll('#sheetChips button')].map(b=>b.dataset.k+':'+b.getAttribute('aria-pressed'));
    const lastEv = evs.filter(e=>!e.rest).slice(-1)[0];
    return { lastHit: JSON.stringify(last).slice(0,120), title: document.querySelector('#sheetTitle').textContent, chips, lastEv: JSON.stringify({artic:lastEv.artic, ferm:lastEv.ferm, tie:lastEv.tie, tieNext: lastEv.tieNext}), lastIsRest: evs[evs.length-1].rest }; })()`);
  console.log(seed, JSON.stringify(r));
  await c.ev(`document.querySelector('#sheetClose').click()`);
  }
};
