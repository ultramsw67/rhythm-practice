// 들어보기 소리 균형 찾기: 설정별로 ① 악센트 대비(dB, 모든 악기) ② 최대 진폭 ③ 휴대폰 스피커 크기 ④ 이어폰 크기
module.exports = async (c) => {
  await c.size(390, 844, true);
  await c.go(process.env.URL0 || 'http://127.0.0.1:' + (process.env.PORT || 8765) + '/');
  const configs = JSON.parse(process.env.CONFIGS || '[{"trim":0},{"trim":0.4},{"trim":0.6},{"trim":0.8}]');
  for (const cfg of configs) {
    const r = await c.ev(`(async()=>{
      RPX.tune = ${JSON.stringify(cfg)};
      const render = async (midi, art, phone) => {
        const q=0.5, lead=0.2;
        const notes = [0,1,2].map(i => ({ev:i,ids:[i],t:lead+i*q,written:q,nominal:q,artic: i===1 ? art : [],legato:false,concert:midi,midi}));
        const tl = { notes, clicks: [], lead, total: lead+3*q+0.3 };
        const sr=44100, oc=new OfflineAudioContext(1, Math.ceil(tl.total*sr), sr);
        let dest = oc.destination;
        if (phone) { const h1=oc.createBiquadFilter(); h1.type='highpass'; h1.frequency.value=500; const h2=oc.createBiquadFilter(); h2.type='highpass'; h2.frequency.value=500; h1.connect(h2).connect(oc.destination); dest=h1; }
        const master = oc.createGain(); master.gain.value = 0.9; master.connect(dest);
        RPX.schedulePlayback(oc, RPX.outChain(oc, master), 0, tl, true);
        const x=(await oc.startRendering()).getChannelData(0);
        const seg = (t0, t1) => { let s=0,n=0,mx=0; for (let i=Math.floor(t0*sr); i<Math.floor(t1*sr); i++){ s+=x[i]*x[i]; n++; mx=Math.max(mx,Math.abs(x[i])); } return { rms: 10*Math.log10(s/n+1e-12), mx }; };
        return { n0: seg(lead+0.005, lead+0.06), acc: seg(lead+q+0.005, lead+q+0.06), body: seg(lead+0.06, lead+0.3), all: seg(0, tl.total) };
      };
      const out = { accMin: 99, worst: 0, phoneMin: 99, phoneMax: -99, fullMin: 99, fullMax: -99, low: {} };
      for (const [name, inst] of Object.entries(Core.INSTS)) {
        const lo = inst.r[2][0] + inst.t, hi = inst.r[2][1] + inst.t, mid = Math.round((lo+hi)/2);
        for (const midi of [lo, mid]) {
          const a = await render(midi, ['acc'], false);
          const cdb = a.acc.rms - a.n0.rms;                       // 악센트 첫머리 vs 보통 첫머리 (이어폰 기준)
          const ap = await render(midi, ['acc'], true);
          const cdbPhone = ap.acc.rms - ap.n0.rms;                 // 휴대폰 스피커 기준
          const m = await render(midi, ['marc'], false);
          out.worst = Math.max(out.worst, a.all.mx, m.all.mx);
          out.accMin = Math.min(out.accMin, cdb, cdbPhone);
          if (midi === mid) { out.phoneMin = Math.min(out.phoneMin, ap.body.rms); out.phoneMax = Math.max(out.phoneMax, ap.body.rms); out.fullMin = Math.min(out.fullMin, a.body.rms); out.fullMax = Math.max(out.fullMax, a.body.rms); }
          if (/tuba|trombone|bari/.test(name)) out.low[name + midi] = [+cdb.toFixed(1), +cdbPhone.toFixed(1)];
        }
      }
      for (const k of ['accMin','worst','phoneMin','phoneMax','fullMin','fullMax']) out[k] = +out[k].toFixed(k==='worst'?3:1);
      return out; })()`);
    console.log(JSON.stringify(cfg), JSON.stringify(r));
  }
};
