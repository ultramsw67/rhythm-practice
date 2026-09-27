// 휴대폰에서 다른 앱에 갔다 오는 상황 흉내: 화면 숨김(visibilitychange) + 소리 엔진 멈춤/닫힘 + 저장소 연결 끊김
// FAKE_WAV 필요(녹음 단계)
module.exports = async (c) => {
  await c.size(390, 844, true);
  await c.go(process.env.URL0 || 'http://127.0.0.1:' + (process.env.PORT || 8765) + '/');
  const hide = (h) => `(()=>{ Object.defineProperty(document, 'hidden', { value: ${h}, configurable: true }); Object.defineProperty(document, 'visibilityState', { value: '${h ? 'hidden' : 'visible'}', configurable: true }); document.dispatchEvent(new Event('visibilitychange')); window.dispatchEvent(new Event(${h} ? 'pagehide' : 'pageshow')); })()`;
  await c.ev(`(async()=>{ for (let i=0;i<100 && !window.RP;i++) await new Promise(r=>setTimeout(r,100)); })()`);  // 새 프로필은 악보 도구를 받느라 늦게 준비됨
  const out = {};
  // ① 녹음 중에 다른 앱으로 → 돌아옴
  out.recBackground = await c.ev(`(async()=>{
    Object.assign(RP.set,{mode:'rhythm',meter:'4/4',level:1,bars:4,bpm:90,artic:'auto',seed:3,edits:{}}); RP.rebuild(); document.querySelector('#countIn').value='1';
    document.querySelector('#recBtn').click(); await new Promise(r=>setTimeout(r,2000));
    const during = !!RPX.rec;
    ${hide(true)}; await RPX.actx.suspend();                     // 휴대폰이 소리 엔진을 멈춘 상태
    await new Promise(r=>setTimeout(r,3000));
    ${hide(false)};
    await new Promise(r=>setTimeout(r,1500));
    return { during, recStill: !!RPX.rec, locked: document.body.classList.contains('recording'), status: document.querySelector('#recStatus').textContent, btn: document.querySelector('#recBtn').textContent, ctx: RPX.actx && RPX.actx.state };
  })()`);
  // ② 돌아온 뒤 들어보기 (엔진이 멈춤·닫힘인 상태에서)
  out.playAfterSuspend = await c.ev(`(async()=>{
    if (RPX.rec) document.querySelector('#recBtn').click(); await new Promise(r=>setTimeout(r,300));
    try { await RPX.actx.suspend(); } catch (e) {}
    const t1 = RPX.actx.currentTime;
    document.querySelector('#playBtn').click(); await new Promise(r=>setTimeout(r,1500));
    const r = { btn: document.querySelector('#playBtn').textContent, ctx: RPX.actx.state, advanced: +(RPX.actx.currentTime - t1).toFixed(2) };
    if (RPX.playing) document.querySelector('#playBtn').click();
    return r; })()`);
  out.playAfterClose = await c.ev(`(async()=>{
    await new Promise(r=>setTimeout(r,300));
    try { await RPX.actx.close(); } catch (e) {}
    let err = null; const h = e => { err = String(e.message || e.reason); }; window.addEventListener('error', h); window.addEventListener('unhandledrejection', h);
    document.querySelector('#playBtn').click(); await new Promise(r=>setTimeout(r,1500));
    const r = { btn: document.querySelector('#playBtn').textContent, ctx: RPX.actx && RPX.actx.state, err };
    if (RPX.playing) document.querySelector('#playBtn').click();
    return r; })()`);
  // ③ 저장소 연결이 끊긴 뒤 저장
  out.dbClosed = await c.ev(`(async()=>{
    try { RPX.DB.db && RPX.DB.db.close(); } catch (e) {}
    document.querySelector('nav.tabs [data-tab=settings]').click(); document.querySelector('#selfPerfect').click(); await new Promise(r=>setTimeout(r,4000));
    const save = document.querySelector('#resSave'); save.click(); await new Promise(r=>setTimeout(r,800));
    return { saveHidden: save.classList.contains('hide'), count: (await RPX.DB.all()).length, toast: document.querySelector('#toast').textContent };
  })()`);
  console.log(JSON.stringify(out, null, 1));
};
