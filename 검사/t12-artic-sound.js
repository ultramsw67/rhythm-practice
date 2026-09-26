// 들어보기 아티큘레이션이 귀로 구별되는지: 소리를 만들어(OfflineAudioContext) 길이·세기·이어짐을 잰다
// 견본 소리 파일도 저장한다 (SAVE_WAV=경로)
const fs = require('fs');
module.exports = async (c) => {
  await c.size(390, 844);
  await c.go(process.env.URL0 || 'http://127.0.0.1:' + (process.env.PORT || 8765) + '/');
  const r = await c.ev(`(async()=>{
    const bpm = 72, q = 60 / bpm, lead = 0.4;
    // 도레미파솔… 4분음표. 1마디 보통 / 2마디 스타카토·스타카티시모 / 3마디 테누토·악센트·마르카토 / 4마디 슬러 3음 + 페르마타
    const spec = [[60,[]],[62,[]],[64,[]],[65,[]], [67,['stac']],[65,['stac']],[64,['stacc']],[62,['stacc']], [60,['ten']],[62,['ten']],[64,['acc']],[65,['marc']], [67,[],1],[69,[],1],[71,[]],[72,['ferm']]];
    const notes = spec.map(([m, a, leg], i) => ({ ev:i, ids:[i], t: lead + i*q, written: q, nominal: a.includes('ferm') ? 2*q : q, artic: a, legato: !!leg, concert: m, midi: m }));
    const tl = { notes, clicks: [], lead, total: lead + 17*q + 0.5 };
    const sr = 44100, oc = new OfflineAudioContext(1, Math.ceil(tl.total * sr), sr);
    RPX.schedulePlayback(oc, oc.destination, 0, tl, true);
    const buf = await oc.startRendering(); const x = buf.getChannelData(0);
    const env = Core.envelope(x, sr, 0.005, 0.02); const L = env.L, fi = t => Math.max(0, Math.min(L.length-1, Math.round((t - env.t0)/env.hop)));
    const res = notes.map((n, i) => {
      const a = fi(n.t), b = fi(n.t + q * (n.artic.includes('ferm') ? 2.2 : 1) - 0.005);
      let pk = -200; for (let k=a;k<fi(n.t+0.05);k++) pk=Math.max(pk,L[k]);
      let body = -200; for (let k=fi(n.t+0.08);k<fi(n.t+0.2);k++) body=Math.max(body,L[k]);
      let on = 0; for (let k=a;k<b;k++) if (L[k] > pk - 20) on++;
      let dip = 0; if (i>0) { let mn=999; for (let k=fi(n.t-0.03);k<=fi(n.t+0.01);k++) mn=Math.min(mn,L[k]); dip = +(Math.max(L[fi(n.t-0.06)], 0) === 0 ? (L[fi(n.t-0.06)] - mn) : (L[fi(n.t-0.06)] - mn)).toFixed(1); }
      return { i, artic: n.artic.join(',') || (n.legato ? 'slur' : (spec[i-1]&&spec[i-1][2] ? 'slur끝' : '보통')), soundSec: +(on*env.hop).toFixed(3), ratio: +((on*env.hop)/q).toFixed(2), peakDb: +pk.toFixed(1), bodyDb: +body.toFixed(1), dipBefore: dip };
    });
    let mx = 0; for (let i=0;i<x.length;i++) mx = Math.max(mx, Math.abs(x[i]));
    const wav = await new Promise(rs => { const fr = new FileReader(); fr.onload = () => rs(String(fr.result).split(',')[1]); fr.readAsDataURL(RPX.toWav(x.map ? x : x, sr)); });
    return { res, max: +mx.toFixed(3), wav };
  })()`);
  if (process.env.SAVE_WAV) fs.writeFileSync(process.env.SAVE_WAV, Buffer.from(r.wav, 'base64'));
  console.log('max amplitude', r.max);
  for (const x of r.res) console.log(String(x.i).padStart(2), x.artic.padEnd(6), 'sound', x.soundSec, 's ratio', x.ratio, ' peak', x.peakDb, 'body', x.bodyDb, ' dipBefore', x.dipBefore);
  // 실제 재생 버튼도 오류 없이 도는지
  const p = await c.ev(`(async()=>{ document.querySelector('#playBtn').click(); await new Promise(r=>setTimeout(r,2500)); const t=document.querySelector('#playBtn').textContent; document.querySelector('#playBtn').click(); return t; })()`);
  console.log('play button', p);
};
