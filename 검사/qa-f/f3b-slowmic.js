// 3b. 마이크 허락 창이 늦게 닫히는 경우(3초): 들어보기 준비 중·재생 중에 녹음을 누르면 재생과 녹음이 겹치는지
module.exports = async (c) => {
  const B = 'http://127.0.0.1:' + (process.env.PORT || 8765) + '/';
  await c.size(390, 844, true);
  await c.go(B);
  await c.ev(`localStorage.clear(); localStorage.setItem('rp.startSeen','true')`);
  await c.go(B);
  await c.ev(`window.__w=ms=>new Promise(r=>setTimeout(r,ms)); window.__btn=()=>document.querySelector('#playBtn').textContent;
    const g=navigator.mediaDevices.getUserMedia.bind(navigator.mediaDevices); navigator.mediaDevices.getUserMedia=async(o)=>{ await __w(3000); return g(o); };
    Object.assign(RP.set,{mode:'rhythm',level:3,meter:'4/4',bars:4,bpm:100,drum:''}); RP.rebuild(); 1`);
  // A: 녹음 먼저 누르고(마이크 허락 대기 중) 들어보기
  console.log('A rec then play', await c.ev(`(async()=>{ document.querySelector('#recBtn').click(); await __w(300); document.querySelector('#playBtn').click(); const log=[];
    for (let i=0;i<12;i++){ await __w(500); log.push((RPX.playing?'P':'-')+(RPX.rec?'R':'-')+' '+__btn()); }
    if (RPX.rec) document.querySelector('#recBtn').click(); await __w(300); if (RPX.playing) document.querySelector('#playBtn').click(); await __w(100);
    return JSON.stringify(log)+' | end '+(RPX.playing?'P':'-')+(RPX.rec?'R':'-')+' '+__btn(); })()`));
  // B: 들어보기(준비 중) 누르고 바로 녹음
  console.log('B play then rec', await c.ev(`(async()=>{ try{await RPX.actx.suspend();}catch(e){} document.querySelector('#playBtn').click(); document.querySelector('#recBtn').click(); const log=[];
    for (let i=0;i<12;i++){ await __w(500); log.push((RPX.playing?'P':'-')+(RPX.rec?'R':'-')+' '+__btn()); }
    if (RPX.rec) document.querySelector('#recBtn').click(); await __w(300); if (RPX.playing) document.querySelector('#playBtn').click(); await __w(100);
    return JSON.stringify(log)+' | end '+(RPX.playing?'P':'-')+(RPX.rec?'R':'-')+' '+__btn(); })()`));
  // C: 재생 중 녹음 → 마이크 대기 중 들어보기 다시
  console.log('C playing, rec, play again', await c.ev(`(async()=>{ const b=document.querySelector('#playBtn'); b.click(); await __w(1500); document.querySelector('#recBtn').click(); await __w(200); b.click(); const log=[];
    for (let i=0;i<12;i++){ await __w(500); log.push((RPX.playing?'P':'-')+(RPX.rec?'R':'-')+' '+__btn()); }
    if (RPX.rec) document.querySelector('#recBtn').click(); await __w(300); if (RPX.playing) b.click(); await __w(100);
    return JSON.stringify(log)+' | end '+(RPX.playing?'P':'-')+(RPX.rec?'R':'-')+' '+__btn(); })()`));
  // D: 마이크 대기 중 설정 바꾸기(단계)
  console.log('D rec pending, change level', await c.ev(`(async()=>{ document.querySelector('#recBtn').click(); await __w(300); document.querySelector('#setBox').open=true; document.querySelectorAll('#levelSeg button')[4].click(); const lvNow=RP.set.level;
    await __w(4000); const r=(RPX.rec?'R':'-')+' level '+lvNow+' recScoreLevel '+(RPX.rec&&RPX.rec.set&&RPX.rec.set.level)+' shown '+RP.set.level;
    if (RPX.rec) document.querySelector('#recBtn').click(); await __w(300); return r; })()`));
};
