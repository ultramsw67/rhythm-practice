// v3.6 피아노(C 악기) 소리: 샘플 길이·음 시작(해머 소리)·끝 울림 확인
module.exports = async (c) => {
  await c.size(390, 844, true);
  await c.go(process.env.URL0 || 'http://127.0.0.1:' + (process.env.PORT || 8765) + '/');
  const r = await c.ev(`(async()=>{
    const e = await RPX.loadSound('c_treble');
    const info = { notes: e.notes, dur: e.notes.map(m => +e.buffers[m].duration.toFixed(2)), gain: +e.gain.toFixed(2), loop: e.loop };
    // 음 시작 모양: 처음 30ms 와 100~300ms 크기 비교 (피아노는 첫 순간이 가장 큼)
    const b = e.buffers[60], x = b.getChannelData(0), sr = b.sampleRate;
    const rms = (a, z) => { let q=0,n=0; for (let i=Math.floor(a*sr); i<Math.floor(z*sr); i++){ q+=x[i]*x[i]; n++; } return +(10*Math.log10(q/n+1e-12)).toFixed(1); };
    info.c4 = { first: rms(0, 0.03), a: rms(0.03,0.1), b: rms(0.1,0.3), c: rms(0.5,0.8), d: rms(1,1.4), tail: rms(Math.max(0,b.duration-0.3), b.duration) };
    // 보통 음 / 슬러 음 렌더 → 음마다 시작 20ms 와 앞 음 끝 크기 차 (해머 소리가 들리는지)
    const q = 0.5, lead = 0.2, spec = [[60,[],0],[62,[],0],[64,[],1],[65,[],1],[67,[],0],[69,['stac'],0],[67,['ten'],0],[64,['acc'],0],[60,['ferm'],0]];
    const notes = spec.map(([m,a,leg],i)=>({ ev:i, ids:[i], t: lead+i*q, written:q, nominal: a.includes('ferm')?2*q:q, artic:a, legato:!!leg, concert:m, midi:m }));
    const tl = { notes, clicks: [], lead, total: lead+(notes.length+2)*q };
    const oc = new OfflineAudioContext(1, Math.ceil(tl.total*44100), 44100);
    const mst = oc.createGain(); mst.gain.value = 0.9; mst.connect(oc.destination);
    RPX.schedulePlayback(oc, RPX.outChain(oc, mst), 0, tl, true, e);
    const y = (await oc.startRendering()).getChannelData(0);
    const db = (a, z) => { let s=0,n=0; for (let k=Math.floor(a*44100); k<Math.floor(z*44100); k++){ s+=y[k]*y[k]; n++; } return 10*Math.log10(s/n+1e-12); };
    info.onset = notes.map((n,i)=> +(db(n.t, n.t+0.03) - db(n.t-0.06, n.t-0.01)).toFixed(1));   // 음 시작 순간이 앞보다 몇 dB 큰가
    info.gapAfter = notes.map((n,i)=> +db(n.t+q-0.04, n.t+q-0.005).toFixed(1));               // 다음 음 바로 앞 크기 (뚝 끊기면 아주 작음)
    let mx=0; for (const v of y) mx=Math.max(mx,Math.abs(v)); info.peak=+mx.toFixed(3);
    window.__wav = Array.from(RPX.toWav ? [] : []);
    return info; })()`);
  console.log(JSON.stringify(r));
};
