// 모바일 선율 모드 들어보기: ① 오류로 멈추는지 ② 휴대폰 스피커(낮은 소리 못 냄)로 들리는지
module.exports = async (c) => {
  await c.size(390, 844, true);
  await c.send('Emulation.setUserAgentOverride', { userAgent: 'Mozilla/5.0 (Linux; Android 14; SM-S918N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0 Mobile Safari/537.36' });
  await c.send('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 5 });
  await c.go(process.env.URL0 || 'http://127.0.0.1:' + (process.env.PORT || 8765) + '/');
  // ① 실제 버튼으로 재생 (선율 모드, 악기 여러 개)
  const r1 = await c.ev(`(async()=>{
    const out = [];
    document.querySelector('#startClose') && document.querySelector('#startClose').click();
    document.querySelector('#modeSeg [data-v=melody]').click(); await new Promise(r=>setTimeout(r,200));
    for (const inst of ['clarinet','flute','alto_sax','trumpet','trombone','tuba','soprano_sax','contrabass']) {
      const s = document.querySelector('#inst'); s.value = inst; s.dispatchEvent(new Event('change')); await new Promise(r=>setTimeout(r,150));
      const errs = []; const h = e => errs.push(String(e.message||e.reason)); window.addEventListener('error', h); window.addEventListener('unhandledrejection', h);
      document.querySelector('#playBtn').click(); await new Promise(r=>setTimeout(r,900));
      const label = document.querySelector('#playBtn').textContent;
      document.querySelector('#playBtn').click(); await new Promise(r=>setTimeout(r,150));
      window.removeEventListener('error', h); window.removeEventListener('unhandledrejection', h);
      out.push(inst + ': ' + label + (errs.length ? ' ERR ' + errs.join('|') : ''));
    }
    return out; })()`);
  console.log(r1.join('\n'));
  // ② 소리를 만들어 휴대폰 스피커 흉내(500Hz 아래는 거의 안 나옴)를 거쳐 크기 재기
  const r2 = await c.ev(`(async()=>{
    const res = {};
    const cases = { rhythm: {melody:false, midi:70}, clarinet: {melody:true, midi:62}, flute: {melody:true, midi:72}, alto_sax: {melody:true, midi:56}, trumpet: {melody:true, midi:60}, trombone: {melody:true, midi:48}, tuba: {melody:true, midi:36}, soprano_sax: {melody:true, midi:68}, contrabass: {melody:true, midi:31} };
    for (const [k, v] of Object.entries(cases)) {
      const q = 0.5, lead = 0.3;
      const notes = [0,1,2,3].map(i => ({ ev:i, ids:[i], t: lead + i*q, written: q, nominal: q, artic: [], legato: false, concert: v.midi + (i%2), midi: v.midi }));
      const tl = { notes, clicks: [], lead, total: lead + 4*q + 0.3 };
      const sr = 44100, oc = new OfflineAudioContext(1, Math.ceil(tl.total*sr), sr);
      // 휴대폰 스피커: 500Hz 아래를 크게 깎는 고역 통과(2단)
      const hp1 = oc.createBiquadFilter(); hp1.type='highpass'; hp1.frequency.value=500; hp1.Q.value=0.7;
      const hp2 = oc.createBiquadFilter(); hp2.type='highpass'; hp2.frequency.value=500; hp2.Q.value=0.7;
      if (window.__FULL) { hp1.frequency.value = 10; hp2.frequency.value = 10; } hp1.connect(hp2).connect(oc.destination);
      const mst = oc.createGain(); mst.gain.value = 0.9; mst.connect(hp1); RPX.schedulePlayback(oc, RPX.outChain ? RPX.outChain(oc, mst) : hp1, 0, tl, v.melody);   // 실제 재생과 같은 출력단
      const x = (await oc.startRendering()).getChannelData(0);
      // 혀 소리(첫 25ms)를 뺀 음 몸통의 크기
      let s=0, n=0; for (const nt of notes) { const a=Math.floor((nt.t+0.04)*sr), b=Math.floor((nt.t+0.3)*sr); for (let i=a;i<b;i++){ s+=x[i]*x[i]; n++; } }
      res[k] = +(10*Math.log10(s/n + 1e-12)).toFixed(1);
    }
    return res; })()`);
  console.log('phone-speaker body level dB', JSON.stringify(r2));
};
