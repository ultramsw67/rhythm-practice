module.exports = async (c) => {
  await c.size(390, 844); await c.go('http://127.0.0.1:8765/');
  const r = await c.ev(`(async()=>{ const sl=ms=>new Promise(r=>setTimeout(r,ms)); const q=s=>document.querySelector(s); const out=[];
    for (const prac of ['scale','']) for (const L of [2,3,4,5]) for (const bpm of [88,208]) { Object.assign(RP.set,{mode:'melody',prac,key:'Bb',inst:'clarinet',level:L,meter:'4/4',bpm,bars:4,seed:3}); RP.syncForm(); RP.rebuild(); out.push(prac+'|L'+L+'|'+bpm+'|n='+RP.score.events.length+'|'+(q('#scoreInfo').textContent.match(/\(이 박자[^)]*\)/)||['-'])[0]); }
    q('nav.tabs [data-tab=settings]').click(); q('#calSpk').click(); await sl(700); const d=q('#calSpk').disabled; q('nav.tabs [data-tab=practice]').click(); await sl(100); q('#recBtn').click(); await sl(500); out.push('calDisabled='+d+' rec='+!!RPX.rec+' st='+q('#recStatus').textContent+' toast='+q('#toast').textContent+'/'+getComputedStyle(q('#toast')).opacity);
    return out; })()`);
  console.log(r.join('\n'));
};
