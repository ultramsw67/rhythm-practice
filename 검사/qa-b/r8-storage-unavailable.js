// R8: indexedDB.open 이 던지도록 만들어 저장소 불가 상황을 흉내 -> 메모리 대체 안내문, 채점 시험 저장, 보관함 표시 확인
module.exports = async (c) => {
  await c.size(390, 844);
  await c.send('Page.addScriptToEvaluateOnNewDocument', {
    source: `Object.defineProperty(window.indexedDB, 'open', { value: () => { throw new Error('blocked-by-qa'); }, configurable: true });`
  });
  await c.go('http://127.0.0.1:8772/');
  await c.sleep(500);
  const out = {};
  out.note = await c.ev(`RPX.DB.note`);
  out.latInfoHasNote = await c.ev(`document.querySelector('#latInfo').textContent`);
  // 채점 시험으로 결과 하나 만들고 저장 (메모리 경로)
  await c.ev(`(async()=>{ document.querySelector('#selfPerfect').click(); await new Promise(r=>setTimeout(r,2500)); })()`);
  out.saveOk = await c.ev(`(async()=>{ document.querySelector('#resSave').click(); await new Promise(r=>setTimeout(r,300)); return (await RPX.DB.all()).length; })()`);
  out.libStatus = await c.ev(`(async()=>{ document.querySelector('nav.tabs [data-tab=library]').click(); await new Promise(r=>setTimeout(r,300)); return document.querySelector('#libStatus').textContent; })()`);
  out.cardCount = await c.ev(`document.querySelectorAll('#libList .take').length`);
  await c.shot('qa-b/r8-storage-fallback.png');
  console.log(JSON.stringify(out, null, 1));
};
