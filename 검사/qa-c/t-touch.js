// 터치 이벤트로 음표 누르기·탭 전환·슬라이더 확인 (마우스 클릭 아님)
module.exports = async (c) => {
  await c.size(390, 844, true);
  await c.send('Emulation.setUserAgentOverride', { userAgent: 'Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Mobile Safari/537.36' });
  await c.send('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 5 });
  await c.go('http://127.0.0.1:8773/');

  async function tap(x, y) {
    await c.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y }] });
    await c.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  }

  const out = {};
  // 1) 음표 터치로 아티큘레이션 시트 열기
  const hit = await c.ev(`(()=>{ if(!RP.score||!RP.score.events.length) return null; const ev=RP.score.events[0]; const el=document.getElementById('vf-ev'+ev.id); if(!el) return null; const r=el.getBoundingClientRect(); return {x:r.left+5,y:r.top+5}; })()`);
  if (hit) { await tap(hit.x, hit.y); await c.sleep(200); }
  out.sheetOpenByTouch = await c.ev(`!document.querySelector('#articSheet').classList.contains('hide')`);
  // 시트 안 칩을 터치로 눌러 아티큘레이션 적용
  const chip = await c.ev(`(()=>{const b=document.querySelector('#sheetChips button[data-k="stac"]'); if(!b) return null; const r=b.getBoundingClientRect(); return {x:r.left+r.width/2,y:r.top+r.height/2};})()`);
  if (chip) { await tap(chip.x, chip.y); await c.sleep(150); }
  out.chipToggledByTouch = await c.ev(`(()=>{const e=RP.score.events[0]; return e.artic.includes('stac');})()`);
  // 닫기
  const closeBtn = await c.ev(`(()=>{const r=document.querySelector('#sheetClose').getBoundingClientRect(); return {x:r.left+r.width/2,y:r.top+r.height/2};})()`);
  await tap(closeBtn.x, closeBtn.y); await c.sleep(150);
  out.sheetClosedByTouch = await c.ev(`document.querySelector('#articSheet').classList.contains('hide')`);

  // 2) 탭 전환 터치
  const resTab = await c.ev(`(()=>{const b=document.querySelector('nav.tabs button[data-tab="result"]'); const r=b.getBoundingClientRect(); return {x:r.left+r.width/2,y:r.top+r.height/2};})()`);
  await tap(resTab.x, resTab.y); await c.sleep(200);
  out.tabSwitchedByTouch = await c.ev(`document.querySelector('nav.tabs button[data-tab="result"]').getAttribute('aria-selected')`);
  const pracTab = await c.ev(`(()=>{const b=document.querySelector('nav.tabs button[data-tab="practice"]'); const r=b.getBoundingClientRect(); return {x:r.left+r.width/2,y:r.top+r.height/2};})()`);
  await tap(pracTab.x, pracTab.y); await c.sleep(150);

  // 3) 새 악보 버튼 터치
  const before = await c.ev(`RP.set.seed`);
  const newBtn = await c.ev(`(()=>{const r=document.querySelector('#newBtn').getBoundingClientRect(); return {x:r.left+r.width/2,y:r.top+r.height/2};})()`);
  await tap(newBtn.x, newBtn.y); await c.sleep(150);
  out.newScoreByTouch = (await c.ev(`RP.set.seed`)) !== before;

  // 4) BPM 슬라이더를 터치 드래그(touchStart+touchMove+touchEnd)로 조작
  const rangeInfo = await c.ev(`(()=>{const r=document.querySelector('#bpmRange').getBoundingClientRect(); return {left:r.left,right:r.right,top:r.top,h:r.height,before:+document.querySelector('#bpmRange').value};})()`);
  const y = rangeInfo.top + rangeInfo.h / 2;
  await c.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: rangeInfo.left + 5, y }] });
  await c.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: rangeInfo.right - 5, y }] });
  await c.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await c.sleep(400);
  out.bpmBefore = rangeInfo.before;
  out.bpmAfterTouchDrag = await c.ev(`+document.querySelector('#bpmRange').value`);

  // 5) touch-action 속성들 (더블탭 확대 방지 여부)
  out.touchAction = await c.ev(`({paper: getComputedStyle(document.querySelector('.paper')).touchAction, body: getComputedStyle(document.body).touchAction, btn: getComputedStyle(document.querySelector('.btn')).touchAction, viewportMeta: document.querySelector('meta[name=viewport]').content})`);

  console.log(JSON.stringify(out, null, 1));
};
