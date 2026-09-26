module.exports = async (c) => {
  await c.size(390, 844, true);
  await c.go('http://127.0.0.1:8773/');
  const info = await c.ev(`(()=>{
    const sc=document.querySelector('#score');
    const r=sc.getBoundingClientRect();
    const ev0=RP.score.events[0];
    const el=document.getElementById('vf-ev'+ev0.id);
    const er=el ? el.getBoundingClientRect() : null;
    return { scrollY: scrollY, innerH: innerHeight, scoreRectTop: r.top, scoreRectH: r.height, hostChildren: sc.children.length,
      evEl: !!el, evTop: er&&er.top, evLeft: er&&er.left, hitsLen: (sc._hits||[]).length,
      barsSet: RP.set.bars, meter: RP.set.meter, mode: RP.set.mode, bpm: RP.set.bpm,
      docScrollH: document.documentElement.scrollHeight };
  })()`);
  console.log(JSON.stringify(info, null, 1));
};
