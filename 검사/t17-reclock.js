// 녹음 중에는 못 쓰는 버튼이 흐려지고 눌리지 않는지 (FAKE_WAV 필요)
module.exports = async (c) => {
  await c.size(390, 844);
  await c.go(process.env.URL0 || 'http://127.0.0.1:' + (process.env.PORT || 8765) + '/');
  const r = await c.ev(`(async()=>{
    Object.assign(RP.set,{mode:'rhythm',level:1,meter:'4/4',bars:2,bpm:100,artic:'auto',seed:3,edits:{}}); RP.rebuild();
    document.querySelector('#recBtn').click(); await new Promise(r=>setTimeout(r,1500));
    const cs = q => { const e=document.querySelector(q); const s=getComputedStyle(e); return s.pointerEvents + '/' + s.opacity; };
    const out = { body: document.body.classList.contains('recording'), newBtn: cs('#newBtn'), playBtn: cs('#playBtn'), setBox: cs('#setBox'), recBtn: cs('#recBtn'), restart: cs('#recRestart'), otherTab: cs('nav.tabs [data-tab=library]') };
    document.querySelector('#recBtn').click(); await new Promise(r=>setTimeout(r,400));
    out.after = document.body.classList.contains('recording') + ' ' + cs('#newBtn');
    return out; })()`);
  console.log(JSON.stringify(r));
};
