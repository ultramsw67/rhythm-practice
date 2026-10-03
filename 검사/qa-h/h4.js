module.exports = async (c) => {
  await c.size(390, 844, true);
  await c.go('http://127.0.0.1:8765/');
  await c.ev(`localStorage.setItem('rp.startSeen','true'); localStorage.setItem('rp.font','3'); localStorage.setItem('rp.theme','"dark"')`);
  await c.go('http://127.0.0.1:8765/?q=' + Date.now());
  for (const mode of ['rhythm', 'melody']) {
    const seed = await c.ev(`(async()=>{for(let seed=1;seed<300;seed++){Object.assign(RP.set,{mode:'${mode}',gen:3,rv:2,style:'',drum:'',level:5,bars:4,artic:'auto',seed,edits:{},meter:'3/4',bpm:80,inst:'clarinet',key:'C'}); RP.rebuild();
      const ev=RP.score.events; if(ev.some(e=>e.tup&&e.m===3)&&!ev.some(e=>e.tup&&e.m<3)) {RP.syncForm(); RP.rebuild(); return seed;}} return -1})()`);
    console.log(mode, seed);
    await c.sleep(200);
    await c.shotEl(`h4-${mode}-tup-line2.png`, '#score');
  }
};
