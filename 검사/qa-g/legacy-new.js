module.exports = async (c) => {
  await c.size(390, 844);
  await c.go('http://127.0.0.1:8765/');
  const r = await c.ev(`(async()=>{ const sl=ms=>new Promise(r=>setTimeout(r,ms)); window.__errs=[]; addEventListener('error',e=>__errs.push(e.message));
    const t = await RPX.DB.get('legacy-nogen'); RPX.showResult(t,false); await sl(800);
    document.querySelector('#resAgain').click(); await sl(500); const a={ gen:RP.set.gen, seed:RP.set.seed, hint:document.querySelector('#levelHint').textContent.slice(0,25), evs:RP.score.events.length };
    RPX.showResult(t,false); await sl(800); document.querySelector('#resNew').click(); await sl(500); const b={ gen:RP.set.gen, seed:RP.set.seed, level:RP.set.level, hint:document.querySelector('#levelHint').textContent.slice(0,25) };
    // 새로고침 후 유지?
    return { a, b, errs: __errs }; })()`);
  console.log(JSON.stringify(r));
  await c.go('http://127.0.0.1:8765/');
  console.log('reload', await c.ev(`RP.set.gen+' '+RP.set.level+' '+document.querySelector('#levelHint').textContent.slice(0,25)`));
};
