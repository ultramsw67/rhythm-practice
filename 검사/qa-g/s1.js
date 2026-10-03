module.exports = async (c) => {
  await c.size(390, 900, true);
  await c.go('http://127.0.0.1:8765/'); await c.ev(`localStorage.setItem('rp.startSeen','true')`); await c.go('http://127.0.0.1:8765/?t=2');
  const r = await c.ev(`(async()=>{Object.assign(RP.set,{mode:'rhythm',drum:'kit',style:'swing',meter:'4/4',level:3,bars:4,bpm:120,seed:11,edits:{}});RP.syncForm();RP.rebuild();
    const tl=Core.timeline(RP.score,1); const out={n:tl.notes.length, first:tl.notes.slice(0,6).map(x=>[+x.t.toFixed(3),x.kit&&x.kit.join('+'),x.ids.length])};
    document.querySelector('#playBtn').click(); const seen=[]; for(let i=0;i<12;i++){await new Promise(r=>setTimeout(r,400)); seen.push(document.querySelectorAll('#score .now').length+'/'+document.querySelectorAll('#score .done').length);} document.querySelector('#playBtn').click();
    out.seen=seen; out.ids=[...document.querySelectorAll('#score [id]')].slice(0,5).map(e=>e.id); return out})()`);
  console.log(JSON.stringify(r));
};
