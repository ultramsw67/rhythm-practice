module.exports = async (c) => {
  await c.size(390, 844, true);
  await c.send('Emulation.setUserAgentOverride', { userAgent: 'Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Mobile Safari/537.36' });
  await c.send('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 5 });
  await c.go('http://127.0.0.1:8773/');
  // 접힌 상태로: 악보 설정 details 를 닫아 접힌 실제 사용 흐름을 재현 + 스크롤 없이 첫 화면 확인
  const fold = await c.ev(`(()=>{
    const nav = document.querySelector('nav.tabs').getBoundingClientRect();
    const scoreCard = document.querySelector('#score').closest('.card');
    const recCard = document.querySelector('#recCard');
    const sr = scoreCard.getBoundingClientRect(), rr = recCard.getBoundingClientRect();
    return { navTop: nav.top, scoreTop: sr.top, scoreBottom: sr.bottom, scoreVisibleBeforeNav: Math.max(0, Math.min(sr.bottom, nav.top) - sr.top),
      recBtnHiddenByNav: rr.top > nav.top, detailsOpen: document.querySelector('#setBox').open };
  })()`);
  console.log('fold(초기, 설정열림)', JSON.stringify(fold));

  // 이제 실제로 노트를 화면 중앙으로 스크롤한 뒤 터치
  await c.ev(`(()=>{document.getElementById('vf-ev'+RP.score.events[0].id).scrollIntoView({block:'center'});})()`);
  await c.sleep(200);
  const hit = await c.ev(`(()=>{const el=document.getElementById('vf-ev'+RP.score.events[0].id); const r=el.getBoundingClientRect(); return {x:Math.round(r.left+5), y:Math.round(r.top+5)};})()`);
  console.log('hit(스크롤 후)', JSON.stringify(hit));
  async function tap(x, y) {
    await c.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y }] });
    await c.sleep(30);
    await c.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  }
  await tap(hit.x, hit.y);
  await c.sleep(250);
  const sheetOpen = await c.ev(`!document.querySelector('#articSheet').classList.contains('hide')`);
  console.log('sheetOpen(스크롤 후 터치)', sheetOpen);
  await c.shot('qa-c/touch4-afterscroll.png');
};
