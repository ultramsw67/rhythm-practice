// v3.1 나눠 예약: 0.5초씩 나눠 예약한 소리 = 한꺼번에 예약한 소리 인지 (합성·악기 소리, 모든 단계)
// + 실제 재생 버튼: 재생 중 예약된 부품 수가 한꺼번에 예약보다 훨씬 적은지
module.exports = async (c) => {
  await c.size(390, 844, true);
  await c.go(process.env.URL0 || 'http://127.0.0.1:' + (process.env.PORT || 8765) + '/');
  const r = await c.ev(`(async()=>{
    await RPX.loadSound('clarinet');
    const res = [];
    for (const mode of ['rhythm','melody']) for (let lv=1; lv<=7; lv++) {
      const S = {gen:2, mode, level:lv, meter:'4/4', bars:4, key:'Bb', inst:'clarinet', bpm:100, pickup:'auto', artic:'auto', seed: 300+lv, edits:{}};
      const sc = Core.generate(S), tl = Core.timeline(sc, 1), snd = sc.melody ? RPX.soundFor('clarinet') : null;
      const ren = async chunk => {
        const sr = 22050, oc = new OfflineAudioContext(1, Math.ceil((tl.total+0.5)*sr), sr);
        const m = oc.createGain(); m.connect(oc.destination); const out = RPX.outChain(oc, m);
        if (!chunk) RPX.schedulePlayback(oc, out, 0, tl, sc.melody, snd);
        else { const st = { i: 0 }; for (let u = 0.5; ; u += 0.5) { const q = RPX.schedulePlayback(oc, out, 0, tl, sc.melody, snd, { st, until: u }); if (q.done) break; } }
        return (await oc.startRendering()).getChannelData(0);
      };
      const a = await ren(false), b = await ren(true);
      let d = 0, mx = 0; for (let i=0;i<a.length;i++){ d = Math.max(d, Math.abs(a[i]-b[i])); mx = Math.max(mx, Math.abs(a[i])); }
      res.push(mode[0]+lv+' diff '+d.toExponential(1)+' peak '+mx.toFixed(2));
    }
    // 실제 재생: 16마디 7단계에서 1초 뒤 예약된 부품 수
    Object.assign(RP.set,{gen:2,mode:'rhythm',level:7,meter:'4/4',bars:16,bpm:100,pickup:'off',artic:'auto',seed:5,edits:{}}); RP.rebuild();
    document.querySelector('#playBtn').click();
    await new Promise(r=>setTimeout(r,1500));
    const live = { nodes: RPX.playing && RPX.playing.nodes.length, total: Core.timeline(RP.score,1).notes.length, btn: document.querySelector('#playBtn').textContent };
    await new Promise(r=>setTimeout(r,4000));
    live.nodesLater = RPX.playing && RPX.playing.nodes.length;
    document.querySelector('#playBtn').click();
    live.after = document.querySelector('#playBtn').textContent;
    return { res, live };
  })()`);
  console.log(JSON.stringify(r, null, 1));
};
