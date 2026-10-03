// 리듬 스타일 소리 견본: 스타일마다 1단계(대표 리듬) 4마디를 들어보기와 같은 소리(연습 리듬 + 스타일 반주)로 wav 하나에 이어 붙인다
// 사용: OUT=<저장 폴더> node cdp.js make-style-samples.js   → OUT/리듬 스타일 견본.wav, 스타일 순서는 화면 순서, 사이 1초 쉼
const fs = require('fs'), path = require('path');
module.exports = async (c) => {
  await c.go('http://127.0.0.1:' + (process.env.PORT || 8765) + '/');
  const b64 = await c.ev(`(async()=>{
    const sr = 44100, parts = [];
    for (const k of Object.keys(Core.STYLES)) {
      const S = Core.STYLES[k];
      const set = Object.assign({}, RP.set, { mode:'rhythm', gen:3, rv:2, style:k, drum:'', level:1, bars:4, meter:S.meters[0], bpm:S.bpm, seed:7, edits:{}, artic:'auto' });
      const sc = Core.generate(set), tl = Core.timeline(sc, 1);
      const ks = Core.generate(Object.assign({}, set, { drum:'kit', level:1 })), atl = Core.timeline(ks, 1);
      const oc = new OfflineAudioContext(1, Math.ceil((Math.max(tl.total, atl.total) + 0.8) * sr), sr);
      const m = oc.createGain(); m.gain.value = 0.9; m.connect(oc.destination);
      const o = RPX.outChain(oc, m);
      for (const ck of tl.clicks.filter(x => x.countIn)) { const g = oc.createGain(), os = oc.createOscillator(); os.frequency.value = ck.level ? 1500 : 1000; g.gain.setValueAtTime(0.25, 0.05 + ck.t); g.gain.exponentialRampToValueAtTime(0.001, 0.05 + ck.t + 0.05); os.connect(g).connect(m); os.start(0.05 + ck.t); os.stop(0.05 + ck.t + 0.06); }
      RPX.schedulePlayback(oc, o, 0.05, tl, false, null, {});
      const g = oc.createGain(); g.gain.value = 0.75; g.connect(o); RPX.schedulePlayback(oc, g, 0.05, atl, false, null, { drum:'kit' });
      parts.push((await oc.startRendering()).getChannelData(0), new Float32Array(sr));
    }
    const n = parts.reduce((s, p) => s + p.length, 0), all = new Float32Array(n); let o2 = 0; for (const p of parts) { all.set(p, o2); o2 += p.length; }
    const blob = RPX.toWav(all, sr); const buf = new Uint8Array(await blob.arrayBuffer()); let s = ''; for (let i = 0; i < buf.length; i += 0x8000) s += String.fromCharCode.apply(null, buf.subarray(i, i + 0x8000)); return btoa(s);
  })()`);
  const out = path.join(process.env.OUT || __dirname, '리듬 스타일 견본.wav');
  fs.writeFileSync(out, Buffer.from(b64, 'base64'));
  console.log('written', out, fs.statSync(out).size);
};
