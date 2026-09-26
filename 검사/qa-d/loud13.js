// v1.9 phone-speaker loudness for all 13 instruments (incl c_treble/c_bass/horn/tenor_sax/bari_sax) + clipping check
module.exports = async (c) => {
  await c.size(390, 844, true);
  await c.go(process.env.URL0 || 'http://127.0.0.1:' + (process.env.PORT || 8781) + '/');
  const r = await c.ev(`(async()=>{
    const insts = {
      c_treble:57, flute:60, oboe:58, clarinet:52, alto_sax:58, tenor_sax:58, bari_sax:58,
      trumpet:55, horn:55, trombone:40, euphonium:40, tuba:28, c_bass:38
    };
    const res = {};
    for (const [name, midi] of Object.entries(insts)) {
      const q = 0.5, lead = 0.3;
      // plain notes (loudness) + one accent + one marcato note (clipping stress)
      const notes = [
        { ev:0, ids:[0], t: lead+0*q, written:q, nominal:q, artic:[], legato:false, concert: midi, midi },
        { ev:1, ids:[1], t: lead+1*q, written:q, nominal:q, artic:[], legato:false, concert: midi+2, midi: midi+2 },
        { ev:2, ids:[2], t: lead+2*q, written:q, nominal:q, artic:['acc'], legato:false, concert: midi, midi },
        { ev:3, ids:[3], t: lead+3*q, written:q, nominal:q, artic:['marc'], legato:false, concert: midi+4, midi: midi+4 },
      ];
      const tl = { notes, clicks: [], lead, total: lead + 4*q + 0.3 };
      const sr = 44100, oc = new OfflineAudioContext(1, Math.ceil(tl.total*sr), sr);
      const hp1 = oc.createBiquadFilter(); hp1.type='highpass'; hp1.frequency.value=500; hp1.Q.value=0.7;
      const hp2 = oc.createBiquadFilter(); hp2.type='highpass'; hp2.frequency.value=500; hp2.Q.value=0.7;
      hp1.connect(hp2).connect(oc.destination);
      RPX.schedulePlayback(oc, hp1, 0, tl, true);
      const x = (await oc.startRendering()).getChannelData(0);
      let s=0, n=0; for (const nt of [notes[0], notes[1]]) { const a=Math.floor((nt.t+0.04)*sr), b=Math.floor((nt.t+0.3)*sr); for (let i=a;i<b;i++){ s+=x[i]*x[i]; n++; } }
      const bodyDb = +(10*Math.log10(s/n + 1e-12)).toFixed(1);
      // clipping: max abs sample over whole buffer (pre-filter chain, so check on raw dest too)
      let mx=0; for (let i=0;i<x.length;i++) mx = Math.max(mx, Math.abs(x[i]));
      res[name] = { midi, bodyDb, maxAfterFilter: +mx.toFixed(3) };
    }
    return res; })()`);
  console.log(JSON.stringify(r, null, 1));
  // also check clipping straight to destination (no filter) for accent/marcato at loud instruments
  const r2 = await c.ev(`(async()=>{
    const cases = { trumpet:72, tuba:34, c_treble:72 };
    const out = {};
    for (const [name, midi] of Object.entries(cases)) {
      const q=0.5, lead=0.2;
      const notes = [{ev:0,ids:[0],t:lead,written:q,nominal:q,artic:['marc'],legato:false,concert:midi,midi}];
      const tl = { notes, clicks: [], lead, total: lead+q+0.3 };
      const sr=44100, oc=new OfflineAudioContext(1, Math.ceil(tl.total*sr), sr);
      RPX.schedulePlayback(oc, oc.destination, 0, tl, true);
      const x=(await oc.startRendering()).getChannelData(0);
      let mx=0; for (let i=0;i<x.length;i++) mx=Math.max(mx, Math.abs(x[i]));
      out[name] = +mx.toFixed(3);
    }
    return out; })()`);
  console.log('marcato no-filter max amplitude', JSON.stringify(r2));
};
