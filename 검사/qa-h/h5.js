module.exports = async (c) => {
  await c.size(390, 844, true);
  await c.go('http://127.0.0.1:8765/');
  await c.ev(`localStorage.setItem('rp.startSeen','true')`);
  await c.go('http://127.0.0.1:8765/?q=' + Date.now());
  const r = await c.ev(`(()=>{const out=[];
    for (const st of ['swing','shuffle']) for (const drum of ['','kit']) for (let seed=1; seed<200; seed++){
      const set={mode:'rhythm',gen:3,rv:2,style:st,drum,level:5,bars:4,artic:'auto',seed,edits:{},meter:'4/4',bpm:Core.STYLES[st].bpm,inst:'clarinet',key:'C'};
      const sc=Core.generate(set); const tl=Core.timeline(sc,1); const spt=sc.spt; const lead=sc.measLen;
      const tup=sc.events.filter(e=>e.tup&&!e.rest);
      const s16=sc.events.filter(e=>!e.rest&&e.base==='16');
      if (tup.length){ const n=tl.notes.filter(n=>tup.some(e=>e.id===n.ev)); const devs=n.map(x=>{const e=sc.events[x.ev]; return Math.round((x.t-(lead+e.start)*spt)*1000)}); out.push([st,drum,seed,'tupDevMs',devs.join(',')]); }
      if (s16.length && out.filter(o=>o[3]==='16').length<3) { const n=tl.notes.filter(n=>s16.some(e=>e.id===n.ev)); out.push([st,drum,seed,'16',n.map(x=>{const e=sc.events[x.ev]; return Math.round((x.t-(lead+e.start)*spt)*1000)}).join(',')]); }
      if (out.length>8) break;
    } return out})()`);
  console.log(JSON.stringify(r));
};
