// v3.9.3 리듬 스타일 반주(들어보기): 스타일마다 반주 + 연습 리듬을 오프라인으로 그려 ① 찢어짐 없음(최대 < 0.99) ② 반주가 연습 리듬보다 작음
// ③ 카우벨·발 하이햇 소리가 실제로 남 ④ 화면에서 들어보기를 눌렀을 때 반주 칸이 켜져 있으면 소리 부품이 더 많이 예약됨
module.exports = async (c) => {
  await c.size(390, 900, true);
  await c.go('http://127.0.0.1:' + (process.env.PORT || 8765) + '/');
  await c.ev(`localStorage.setItem('rp.startSeen','true')`);
  await c.go('http://127.0.0.1:' + (process.env.PORT || 8765) + '/?t=2');
  const r = await c.ev(`(async()=>{
    const out = {}, bad = [];
    for (const k of Object.keys(Core.STYLES)) {
      const S = Core.STYLES[k];
      const set = Object.assign({}, RP.set, { mode:'rhythm', gen:3, rv:2, style:k, drum:'', level:2, bars:4, meter:S.meters[0], bpm:S.bpm, seed:5, edits:{} });
      const sc = Core.generate(set), tl = Core.timeline(sc, 0);
      const ks = Core.generate(Object.assign({}, set, { drum:'kit', level:1 })), atl = Core.timeline(ks, 0);
      const dur = Math.max(tl.total, atl.total) + 0.5, sr = 44100;
      const render = async (main, accomp) => {
        const oc = new OfflineAudioContext(1, Math.ceil(dur * sr), sr);
        const m = oc.createGain(); m.gain.value = 0.9; m.connect(oc.destination);
        const o = RPX.outChain(oc, m);
        if (main) RPX.schedulePlayback(oc, o, 0.05, tl, false, null, {});
        if (accomp) { const g = oc.createGain(); g.gain.value = 0.75; g.connect(o); RPX.schedulePlayback(oc, g, 0.05, atl, false, null, { drum:'kit' }); }
        const b = await oc.startRendering(); const d = b.getChannelData(0);
        let pk = 0, ss = 0; for (let i = 0; i < d.length; i++) { const a = Math.abs(d[i]); if (a > pk) pk = a; ss += d[i] * d[i]; }
        return { pk: +pk.toFixed(3), rms: +Math.sqrt(ss / d.length).toFixed(4) };
      };
      const both = await render(true, true), line = await render(true, false), acc = await render(false, true);
      out[k] = { both: both.pk, line: line.rms, acc: acc.rms, keys: [...new Set(atl.notes.flatMap(n => n.kit || []))].join('+') };
      if (both.pk >= 0.99) bad.push([k, 'clip', both.pk]);
      if (!(acc.rms < line.rms)) bad.push([k, 'accLouder', acc.rms, line.rms]);
      if (acc.rms < 0.002) bad.push([k, 'accSilent', acc.rms]);
    }
    // 카우벨·발 하이햇 소리
    for (const kind of ['bell', 'pedal', 'ride', 'rim']) {
      const oc = new OfflineAudioContext(1, 22050, 44100); const nodes = RPX.drumHit(oc, oc.destination, kind, 0.01, { len: 0.2, peak: 1 });
      const d = (await oc.startRendering()).getChannelData(0); let pk = 0; for (const v of d) pk = Math.max(pk, Math.abs(v));
      out['hit_' + kind] = +pk.toFixed(3); if (pk < 0.02 || pk >= 0.99) bad.push(['hit', kind, pk]);
    }
    // 화면: 반주 켬/끔
    const count = async on => { const ac=document.getElementById('accomp'); ac.checked = on; ac.dispatchEvent(new Event('change')); const sel=document.getElementById('style'); sel.value='bossa'; sel.dispatchEvent(new Event('change'));
      document.querySelector('#playBtn').click(); await new Promise(r=>setTimeout(r,2500)); const n = window.__lastPlayingNodes || (RPX.playing ? RPX.playing.nodes.length : -1); document.querySelector('#playBtn').click(); await new Promise(r=>setTimeout(r,300)); return n; };
    out.nodesOff0 = await count(false); out.nodesOn = await count(true); out.nodesOff = await count(false);
    if (!(out.nodesOn > Math.max(out.nodesOff, out.nodesOff0))) bad.push(['uiAccomp', out.nodesOn, out.nodesOff, out.nodesOff0]);
    { const ac=document.getElementById('accomp'); ac.checked = true; ac.dispatchEvent(new Event('change')); }
    return JSON.stringify({ out, bad });
  })()`);
  console.log(r);
  const errs = c.logs.filter(l => /^EXC|^error/.test(l));
  console.log('errs', JSON.stringify(errs));
  console.log('bad', JSON.stringify(JSON.parse(r).bad), JSON.parse(r).bad.length + errs.length);
};
