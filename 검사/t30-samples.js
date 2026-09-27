// v2.3 악기 소리: 모든 악기 불러오기·길이, 기호 구별(샘플), 찌그러짐·휴대폰/이어폰 크기, 실제 재생 버튼
module.exports = async (c) => {
  await c.size(390, 844, true);
  await c.go(process.env.URL0 || 'http://127.0.0.1:' + (process.env.PORT || 8765) + '/');
  const r = await c.ev(`(async()=>{
    const out = { load: {}, level: {}, artic: null, errors: [] };
    window.addEventListener('error', e => out.errors.push(String(e.message)));
    for (const inst of Object.keys(Core.INSTS)) {
      const t0 = performance.now(); const e = await RPX.loadSound(inst);
      out.load[inst] = e ? { ms: Math.round(performance.now() - t0), notes: e.notes.length, dur: +Math.min(...Object.values(e.buffers).map(b=>b.duration)).toFixed(2), gain: +e.gain.toFixed(2) } : 'FAIL';
    }
    const render = async (inst, notesSpec, phone) => {
      const snd = RPX.soundFor(inst); const q = 0.5, lead = 0.2;
      const notes = notesSpec.map(([m, a, leg], i) => ({ ev:i, ids:[i], t: lead + i*q, written: q, nominal: a.includes('ferm') ? 2*q : q, artic: a, legato: !!leg, concert: m, midi: m }));
      const tl = { notes, clicks: [], lead, total: lead + (notes.length+1.5)*q };
      const sr = 44100, oc = new OfflineAudioContext(1, Math.ceil(tl.total*sr), sr);
      let dest = oc.destination;
      if (phone) { const h1=oc.createBiquadFilter(); h1.type='highpass'; h1.frequency.value=500; const h2=oc.createBiquadFilter(); h2.type='highpass'; h2.frequency.value=500; h1.connect(h2).connect(oc.destination); dest=h1; }
      const mst = oc.createGain(); mst.gain.value = 0.9; mst.connect(dest);
      RPX.schedulePlayback(oc, RPX.outChain(oc, mst), 0, tl, true, snd);
      const x = (await oc.startRendering()).getChannelData(0);
      const env = Core.envelope(x, sr, 0.005, 0.02), L = env.L, fi = t => Math.max(0, Math.min(L.length-1, Math.round((t - env.t0)/env.hop)));
      let mx = 0; for (let i=0;i<x.length;i++) mx = Math.max(mx, Math.abs(x[i]));
      return { x, sr, L, fi, mx, notes, q };
    };
    // 크기·찌그러짐: 악기마다 가운데 음 보통/악센트/마르카토
    for (const [inst, I] of Object.entries(Core.INSTS)) {
      const mid = Math.round((I.r[1][0] + I.r[1][1]) / 2) + I.t;
      const full = await render(inst, [[mid, []], [mid, ['acc']], [mid, ['marc']]], false);
      const ph = await render(inst, [[mid, []], [mid+2, []], [mid, []]], true);
      const body = (R, i) => { let s=0,n=0; const a=Math.floor((0.2+i*R.q+0.05)*R.sr), b=Math.floor((0.2+i*R.q+0.3)*R.sr); for (let k=a;k<b;k++){ s+=R.x[k]*R.x[k]; n++; } return 10*Math.log10(s/n+1e-12); };
      const head = (R, i) => { let s=0,n=0; const a=Math.floor((0.2+i*R.q)*R.sr), b=Math.floor((0.2+i*R.q+0.12)*R.sr); for (let k=a;k<b;k++){ s+=R.x[k]*R.x[k]; n++; } return 10*Math.log10(s/n+1e-12); };
      out.level[inst] = { full: +body(full,0).toFixed(1), phone: +body(ph,0).toFixed(1), accDb: +(head(full,1) - head(full,0)).toFixed(1), peak: +full.mx.toFixed(3) };
    }
    // 기호 구별 (클라리넷): 보통·스타카토·스타카티시모·테누토·슬러·페르마타
    const R = await render('clarinet', [[62,[]],[64,[]],[65,['stac']],[67,['stacc']],[69,['ten']],[71,[],1],[72,[],1],[74,[]],[72,['ferm']]], false);
    const on = (i, span) => { const a = R.fi(0.2 + i*R.q), b = R.fi(0.2 + i*R.q + span); let pk=-200; for (let k=a;k<R.fi(0.2+i*R.q+0.06);k++) pk=Math.max(pk,R.L[k]); let n=0; for (let k=a;k<b;k++) if (R.L[k] > pk-20) n++; return +(n*0.005).toFixed(2); };
    const dip = i => { const t = 0.2 + i*R.q; let mn=999; for (let k=R.fi(t-0.03);k<=R.fi(t+0.01);k++) mn=Math.min(mn,R.L[k]); return +(R.L[R.fi(t-0.08)] - mn).toFixed(1); };
    out.artic = { normal: on(0, R.q), stac: on(2, R.q), stacc: on(3, R.q), ten: on(4, R.q), slurDip1: dip(6), slurDip2: dip(7), normalDip: dip(1), ferm: on(8, 2.2*R.q) };
    // 실제 재생 버튼 (트럼펫)
    document.querySelector('#modeSeg [data-v=melody]').click(); await new Promise(r=>setTimeout(r,200));
    const s = document.querySelector('#inst'); s.value = 'trumpet'; s.dispatchEvent(new Event('change')); await new Promise(r=>setTimeout(r,1500));
    out.info = document.querySelector('#soundInfo').textContent;
    document.querySelector('#playBtn').click(); await new Promise(r=>setTimeout(r,1200)); out.playBtn = document.querySelector('#playBtn').textContent; document.querySelector('#playBtn').click();
    return out; })()`);
  console.log(JSON.stringify(r, null, 1));
};
