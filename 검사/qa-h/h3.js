module.exports = async (c) => {
  const W = +(process.env.W || 390);
  await c.size(W, 844, true);
  await c.go('http://127.0.0.1:8765/');
  await c.ev(`localStorage.setItem('rp.startSeen','true'); localStorage.setItem('rp.font','3'); localStorage.setItem('rp.theme','"dark"')`);
  await c.go('http://127.0.0.1:8765/?q=' + Date.now());
  for (const [st, L, seed] of JSON.parse(process.env.CASES)) {
    const s = await c.ev(`(async()=>{Object.assign(RP.set,{mode:'rhythm',gen:3,rv:2,style:'${st}',drum:'',level:${L},bars:4,artic:'auto',seed:${seed},edits:{},meter:Core.STYLES['${st}'].meters[0],bpm:Core.STYLES['${st}'].bpm}); RP.syncForm(); RP.rebuild(); await new Promise(r=>setTimeout(r,100));
      return RP.score.events.map(e=>'m'+e.m+':'+(e.rest?'r':'')+e.base+(e.dots?'.':'')+(e.tup?'t':'')).join(' ')})()`);
    console.log(st, L, seed, s);
    await c.shotEl(`h3-${W}-${st}-${L}-${seed}.png`, '#score');
  }
};
