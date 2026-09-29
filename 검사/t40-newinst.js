// v3.4 소프라노 색소폰·더블베이스: 악보(조표·음자리표), 악기 이름·이조 안내, 목록 순서
module.exports = async (c) => {
  await c.size(390, 900, true);
  await c.go('http://127.0.0.1:' + (process.env.PORT || 8765) + '/');
  await c.ev(`localStorage.setItem('rp.startSeen','true')`);
  const opts = await c.ev(`[...document.querySelectorAll('#inst option')].map(o=>o.textContent).join(' / ')`);
  console.log('list', opts);
  for (const inst of ['soprano_sax', 'contrabass']) {
    const r = await c.ev(`(()=>{Object.assign(RP.set,{gen:2,drum:'',mode:'melody',level:3,meter:'4/4',bars:4,key:'Bb',inst:'${inst}',pickup:'off',artic:'auto',bpm:90,seed:5,edits:{}});RP.rebuild();
      const ns=RP.score.events.filter(e=>!e.rest).map(e=>e.midi); return JSON.stringify({info:document.querySelector('#scoreInfo').textContent, lo:Math.min(...ns), hi:Math.max(...ns), concertLo:Math.min(...ns)+RP.score.inst.t, ph:(document.querySelector('#score .placeholder')||{}).textContent||''})})()`);
    console.log(inst, r);
    await c.shotEl('inst-' + inst + '.png', '#score');
  }
};
