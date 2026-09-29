// 피아노 견본 wav (앱에서 만든 실제 악보를 들어보기와 같은 소리 길로)
module.exports = async (c) => {
  await c.size(390, 844, true);
  await c.go('http://127.0.0.1:8765/');
  const b64 = await c.ev(`(async()=>{
    document.querySelector('#modeSeg [data-v=melody]').click(); await new Promise(r=>setTimeout(r,300));
    const s = document.querySelector('#inst'); s.value = 'c_treble'; s.dispatchEvent(new Event('change')); await new Promise(r=>setTimeout(r,500));
    const e = await RPX.loadSound('c_treble');
    const q = 0.5, lead = 0.3, spec = [[60,[],0],[62,[],0],[64,[],0],[65,[],0],[67,[],1],[69,[],1],[71,[],1],[72,[],0],[72,['stac'],0],[71,['stac'],0],[69,['ten'],0],[67,['acc'],0],[65,[],0],[64,[],0],[62,[],0],[60,['ferm'],0]];
    const notes = spec.map(([m,a,leg],i)=>({ ev:i, ids:[i], t: lead+i*q, written:q, nominal: a.includes('ferm')?3*q:q, artic:a, legato:!!leg, concert:m, midi:m }));
    const tl = { notes, clicks: [], lead, total: lead+(notes.length+3)*q };
    const oc = new OfflineAudioContext(1, Math.ceil(tl.total*44100), 44100);
    const mst = oc.createGain(); mst.gain.value = 0.9; mst.connect(oc.destination);
    RPX.schedulePlayback(oc, RPX.outChain(oc, mst), 0, tl, true, e);
    const y = (await oc.startRendering()).getChannelData(0);
    const buf = new ArrayBuffer(44 + y.length*2), v = new DataView(buf); const w=(o,t)=>{for(let i=0;i<t.length;i++)v.setUint8(o+i,t.charCodeAt(i));};
    w(0,'RIFF'); v.setUint32(4,36+y.length*2,true); w(8,'WAVEfmt '); v.setUint32(16,16,true); v.setUint16(20,1,true); v.setUint16(22,1,true); v.setUint32(24,44100,true); v.setUint32(28,88200,true); v.setUint16(32,2,true); v.setUint16(34,16,true); w(36,'data'); v.setUint32(40,y.length*2,true);
    for (let i=0;i<y.length;i++) v.setInt16(44+i*2, Math.max(-1,Math.min(1,y[i]))*32767, true);
    let bin=''; const u=new Uint8Array(buf); for (let i=0;i<u.length;i+=8192) bin+=String.fromCharCode.apply(null,u.subarray(i,i+8192)); return btoa(bin); })()`);
  require('fs').writeFileSync(process.env.OUT, Buffer.from(b64, 'base64'));
  console.log('wav ok', process.env.OUT);
};
