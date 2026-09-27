// 다른 앱에 갔다 온 뒤 다시 녹음·다시 들어보기가 정상으로 시작되는지 (FAKE_WAV 필요)
module.exports = async (c) => {
  await c.size(390, 844, true);
  await c.go(process.env.URL0 || 'http://127.0.0.1:' + (process.env.PORT || 8765) + '/');
  const r = await c.ev(`(async()=>{
    const hide = h => { Object.defineProperty(document, 'hidden', { value: h, configurable: true }); Object.defineProperty(document, 'visibilityState', { value: h ? 'hidden' : 'visible', configurable: true }); document.dispatchEvent(new Event('visibilitychange')); };
    const out = {};
    Object.assign(RP.set,{mode:'melody',meter:'4/4',level:1,bars:2,inst:'flute',key:'C',bpm:100,artic:'auto',seed:4,edits:{}}); RP.rebuild(); document.querySelector('#countIn').value='1';
    // 들어보기 → 숨김 → 돌아옴 → 다시 들어보기
    document.querySelector('#playBtn').click(); await new Promise(r=>setTimeout(r,800));
    hide(true); await RPX.actx.close(); await new Promise(r=>setTimeout(r,500)); hide(false);
    out.afterHideBtn = document.querySelector('#playBtn').textContent;
    document.querySelector('#playBtn').click(); await new Promise(r=>setTimeout(r,1500));
    out.replay = { btn: document.querySelector('#playBtn').textContent, ctx: RPX.actx.state, t: +RPX.actx.currentTime.toFixed(2) };
    document.querySelector('#playBtn').click(); await new Promise(r=>setTimeout(r,300));
    // 녹음 → 숨김 → 돌아옴 → 다시 녹음 (엔진을 새로 만든 뒤에도 녹음이 도는지)
    document.querySelector('#recBtn').click(); await new Promise(r=>setTimeout(r,1500));
    hide(true); await new Promise(r=>setTimeout(r,300)); hide(false);
    out.afterHideRec = document.querySelector('#recStatus').textContent;
    document.querySelector('#recBtn').click(); await new Promise(r=>setTimeout(r,2000));
    out.reRec = { status: document.querySelector('#recStatus').textContent, rec: !!RPX.rec, chunks: RPX.rec && RPX.rec.cap.chunks.length, kind: RPX.rec && RPX.rec.cap.kind };
    if (RPX.rec) document.querySelector('#recBtn').click();
    await new Promise(r=>setTimeout(r,300));
    out.final = { locked: document.body.classList.contains('recording'), btn: document.querySelector('#recBtn').textContent };
    return out; })()`);
  console.log(JSON.stringify(r, null, 1));
};
