// 실제 들어보기 출력단(outChain)을 거친 최대 진폭 — 모든 악기 × 보통/악센트/마르카토. 0.99 를 넘으면 찢어짐
module.exports = async (c) => {
  await c.size(390, 844, true);
  await c.go(process.env.URL0 || 'http://127.0.0.1:' + (process.env.PORT || 8765) + '/');
  const r = await c.ev(`(async()=>{
    const out = {}; let worst = 0;
    for (const [name, inst] of Object.entries(Core.INSTS)) {
      const lo = inst.r[2][0] + inst.t, hi = inst.r[2][1] + inst.t;
      for (const midi of [lo, Math.round((lo+hi)/2), hi]) for (const art of [[], ['acc'], ['marc']]) {
        const q=0.5, lead=0.2;
        const notes = [0,1,2].map(i => ({ev:i,ids:[i],t:lead+i*q,written:q,nominal:q,artic: i===1 ? art : [],legato:false,concert:midi,midi}));
        const tl = { notes, clicks: [], lead, total: lead+3*q+0.3 };
        const sr=44100, oc=new OfflineAudioContext(1, Math.ceil(tl.total*sr), sr);
        const master = oc.createGain(); master.gain.value = 0.9; master.connect(oc.destination);
        RPX.schedulePlayback(oc, RPX.outChain(oc, master), 0, tl, true);
        const x=(await oc.startRendering()).getChannelData(0);
        let mx=0; for (let i=0;i<x.length;i++) mx=Math.max(mx, Math.abs(x[i]));
        const k = name + ' ' + midi + ' ' + (art[0]||'-'); out[k] = +mx.toFixed(3); worst = Math.max(worst, mx);
      }
    }
    const over = Object.entries(out).filter(([k,v]) => v > 0.99);
    const contrast = {}; for (const n of Object.keys(Core.INSTS)) { const ks = Object.keys(out).filter(k => k.startsWith(n + ' ')); const byMidi = {}; ks.forEach(k => { const [, m, a] = k.split(' '); (byMidi[m] = byMidi[m] || {})[a] = out[k]; }); contrast[n] = Object.values(byMidi).map(v => +(20*Math.log10(v.acc / v['-'])).toFixed(1)); }
    return { worst: +worst.toFixed(3), over, accentDb: contrast, sample: Object.entries(out).filter(([k]) => /tuba|trombone|flute/.test(k)).slice(0, 12) }; })()`);
  console.log(JSON.stringify(r));
};
