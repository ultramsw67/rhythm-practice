// 진단: #score 에 클릭이 실제로 도달하는지, 좌표가 무엇인지
module.exports = async (c) => {
  await c.size(390, 844, true);
  await c.send('Emulation.setUserAgentOverride', { userAgent: 'Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Mobile Safari/537.36' });
  await c.send('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 5 });
  await c.go('http://127.0.0.1:8773/');
  await c.ev(`(()=>{document.querySelector('#score').addEventListener('click', e=>{window.__clicks=(window.__clicks||[]); window.__clicks.push({x:e.clientX,y:e.clientY,type:'capture-log'});}, true);})()`);
  const hit = await c.ev(`(()=>{ const ev=RP.score.events[0]; const el=document.getElementById('vf-ev'+ev.id); const r=el.getBoundingClientRect(); return {x:Math.round(r.left+5),y:Math.round(r.top+5), tag: el.tagName, r};})()`);
  console.log('hit target', JSON.stringify(hit));
  await c.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: hit.x, y: hit.y }] });
  await c.sleep(50);
  await c.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await c.sleep(300);
  const clicks = await c.ev(`window.__clicks || []`);
  console.log('clicks after touch', JSON.stringify(clicks));
  const sheetOpen = await c.ev(`!document.querySelector('#articSheet').classList.contains('hide')`);
  console.log('sheetOpen', sheetOpen);
  // 이제 순수 마우스 클릭(Input.dispatchMouseEvent)으로 같은 좌표 시도
  await c.send('Input.dispatchMouseEvent', { type: 'mousePressed', x: hit.x, y: hit.y, button: 'left', clickCount: 1 });
  await c.send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: hit.x, y: hit.y, button: 'left', clickCount: 1 });
  await c.sleep(300);
  const clicks2 = await c.ev(`window.__clicks || []`);
  console.log('clicks after mouse', JSON.stringify(clicks2));
  const sheetOpen2 = await c.ev(`!document.querySelector('#articSheet').classList.contains('hide')`);
  console.log('sheetOpen2', sheetOpen2);
};
