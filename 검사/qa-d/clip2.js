// Same signal chain as real playScore(): schedulePlayback -> compressor(-10dB,4:1) -> master(gain .9) -> destination
module.exports = async (c) => {
  await c.size(390, 844, true);
  await c.go(process.env.URL0 || 'http://127.0.0.1:' + (process.env.PORT || 8781) + '/');
  const r = await c.ev(`(async()=>{
    const cases = { trumpet:72, tuba:34, c_treble:72, trombone:40, c_bass:38, euphonium:40 };
    const out = {};
    for (const [name, midi] of Object.entries(cases)) {
      const q=0.5, lead=0.2;
      const notes = [{ev:0,ids:[0],t:lead,written:q,nominal:q,artic:['marc'],legato:false,concert:midi,midi}];
      const tl = { notes, clicks: [], lead, total: lead+q+0.3 };
      const sr=44100, oc=new OfflineAudioContext(1, Math.ceil(tl.total*sr), sr);
      const master = oc.createGain(); master.gain.value = 0.9; master.connect(oc.destination);
      const comp = oc.createDynamicsCompressor(); comp.threshold.value=-10; comp.ratio.value=4; comp.connect(master);
      RPX.schedulePlayback(oc, comp, 0, tl, true);
      const x=(await oc.startRendering()).getChannelData(0);
      let mx=0; for (let i=0;i<x.length;i++) mx=Math.max(mx, Math.abs(x[i]));
      out[name] = +mx.toFixed(3);
    }
    return out; })()`);
  console.log('marcato through real chain (compressor+master) max amplitude', JSON.stringify(r));
};
