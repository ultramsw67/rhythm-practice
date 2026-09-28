// 들어보기가 마디마다 실제로 소리가 나는지: 실제 악보를 OfflineAudioContext 로 그려 마디별 크기(dB)를 잰다
// (2026-09-28 "들어보기에서 첫마디·다음 마디 소리 안 남" 신고)
module.exports = async (c) => {
  await c.size(390, 844, true);
  await c.go(process.env.URL0 || 'http://127.0.0.1:' + (process.env.PORT || 8765) + '/');
  const r = await c.ev(`(async()=>{
    const out = []; const errs = [];
    window.addEventListener('error', e => errs.push(String(e.message)));
    const cases = [];
    for (const mode of ['rhythm','melody']) for (let lv=1; lv<=7; lv++) for (const meter of ['4/4','3/4','6/8']) for (const pickup of ['off','on'])
      cases.push({gen:2, mode, level:lv, meter, bars:4, key:'Bb', inst:'clarinet', bpm:96, pickup, artic:'auto', seed: 100+lv, edits:{}});
    if (${process.env.SAMPLES ? 'true' : 'false'}) await RPX.loadSound('clarinet');
    for (const S of cases) {
      const sc = Core.generate(S), tl = Core.timeline(sc, 1);
      const sr = 22050, oc = new OfflineAudioContext(1, Math.ceil((tl.total+0.5)*sr), sr);
      const mst = oc.createGain(); mst.connect(oc.destination);
      let pb; try { pb = RPX.schedulePlayback(oc, RPX.outChain(oc, mst), 0, tl, sc.melody, sc.melody ? RPX.soundFor('clarinet') : null); } catch (e) { out.push({S, err: String(e)}); continue; }
      const x = (await oc.startRendering()).getChannelData(0);
      // 마디별 크기 (예비박 없이 음만)
      const bars = sc.measures.map(m => {
        const ns = tl.notes.filter(n => sc.events[n.ev] && sc.events[n.ev].mi === m.mi);
        if (!ns.length) return 'rest';
        const a = Math.floor(ns[0].t*sr), b = Math.floor((ns[ns.length-1].t + Math.max(0.1, ns[ns.length-1].dur||0.1))*sr);
        let mx = 0; for (let i=a;i<b && i<x.length;i++) mx = Math.max(mx, Math.abs(x[i]));
        return mx > 0 ? Math.round(20*Math.log10(mx)) : -99;
      });
      const bad = bars.some(v => v !== 'rest' && v < -40);
      out.push({ k: S.mode[0]+S.level+' '+S.meter+' '+S.pickup+(pb.sampled?' smp':''), bars, bad, n0t: tl.notes[0] && +tl.notes[0].t.toFixed(2), lead: +tl.lead.toFixed(2) });
    }
    return { errs, bad: out.filter(o => o.bad || o.err), n: out.length, sample: out.slice(0, 4) };
  })()`);
  console.log(JSON.stringify(r, null, 1));
};
