// localStorage 접근 시 예외 던지기 + indexedDB 없음 을 주입하고 앱이 살아있는지 확인
module.exports = async (c) => {
  await c.size(390, 844, true);
  const B = 'http://127.0.0.1:8773/';
  await c.size(390, 844, true);

  // localStorage 접근 시 예외
  await c.send('Page.addScriptToEvaluateOnNewDocument', {
    source: `Object.defineProperty(window,'localStorage',{get(){throw new Error('storage blocked')}});`
  });
  await c.go(B);
  await c.sleep(300);
  const r1 = await c.ev(`({
    appAlive: !!(window.RP && RP.score),
    scoreEvents: RP.score ? RP.score.events.length : -1,
    themeBtnText: document.querySelector('#themeBtn').textContent,
    canClickTheme: (()=>{ try{ document.querySelector('#themeBtn').click(); return true; }catch(e){ return 'ERR:'+e.message; } })(),
    canNewScore: (()=>{ try{ document.querySelector('#newBtn').click(); return true; }catch(e){ return 'ERR:'+e.message; } })(),
    toastAfter: document.querySelector('#toast').textContent,
  })`);
  console.log('localStorage-throw', JSON.stringify(r1, null, 1));
  console.log('console-logs-so-far:', JSON.stringify(c.logs));

  // indexedDB 없음 (새 문서 스크립트 갈아끼우기 위해 재설정)
  await c.send('Page.addScriptToEvaluateOnNewDocument', {
    source: `Object.defineProperty(window,'indexedDB',{get(){return undefined}});`
  });
  await c.go(B);
  await c.sleep(500);
  const r2 = await c.ev(`({
    appAlive: !!(window.RP && RP.score),
    latInfoText: document.querySelector('#latInfo').textContent,
    dbNote: window.RPX ? RPX.DB.note : null,
  })`);
  console.log('indexedDB-missing', JSON.stringify(r2, null, 1));
  // 이 상태에서 가상 연주로 채점 시험 -> 보관함(메모리)에 저장되는지
  await c.ev(`RPX.selfTest(false)`);
  await c.sleep(600);
  const r3 = await c.ev(`({ recStatusIrrelevant:true, curTakeTotal: RPX.take && RPX.take.result.total })`);
  console.log('selftest-with-no-idb', JSON.stringify(r3));
  console.log('console-logs-final:', JSON.stringify(c.logs));
};
