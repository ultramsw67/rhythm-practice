module.exports = async (c) => {
  await c.size(390, 844, true);
  await c.go('http://127.0.0.1:8765/');
  await c.ev(`localStorage.setItem('rp.startSeen','true'); localStorage.setItem('rp.font','3'); localStorage.setItem('rp.theme','"dark"')`);
  await c.go('http://127.0.0.1:8765/?q=' + Date.now());
  const r = await c.ev(`(async()=>{const out=[];
    for (const st of ['waltz','swing','shuffle','march','ballad','latin','bossa','rock']) for (const L of [3,4,5]) for (let seed=1; seed<40; seed++){
      Object.assign(RP.set,{mode:'rhythm',gen:3,rv:2,style:st,drum:'',level:L,bars:4,artic:'auto',seed,edits:{},meter:Core.STYLES[st].meters[0],bpm:Core.STYLES[st].bpm}); RP.rebuild();
      const ev=RP.score.events; const groups=new Set(ev.filter(e=>e.tup).map(e=>e.tup.g));
      const svgT=[...document.querySelectorAll('#score svg text')].filter(t=>/^[23]$/.test(t.textContent.trim())).length;
      // 셋잇단 아닌 쉼표/음표 덮는지
      if (svgT !== groups.size) out.push([st,L,seed,groups.size,svgT, ev.map(e=>(e.rest?'r':'')+e.base+(e.dots?'.':'')+(e.tup?'t'+e.tup.g:'')).join(' ')]);
    } return out})()`);
  console.log(r.length, JSON.stringify(r.slice(0, 12)));
};
