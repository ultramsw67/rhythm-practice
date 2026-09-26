module.exports = async (c) => {
  await c.size(390, 844, true);
  const B = 'http://127.0.0.1:8773/';
  await c.go(B);
  await c.ev(`(()=>{const t=document.querySelector('#toast'); t.textContent='공유받은 악보를 열었습니다'; t.classList.add('on');})()`);
  await c.sleep(150);
  const info = await c.ev(`(()=>{const t=document.querySelector('#toast'); const r=t.getBoundingClientRect(); const cs=getComputedStyle(t); return {rect:{x:r.x,y:r.y,w:r.width,h:r.height}, opacity:cs.opacity, display:cs.display, zIndex:cs.zIndex, text:t.textContent, classes:t.className};})()`);
  console.log('toast-info', JSON.stringify(info));
  const shot = await c.send('Page.captureScreenshot', { format: 'png', clip: { x: 0, y: 0, width: 390, height: 844, scale: 1 } });
  require('fs').writeFileSync(__dirname + '/toast-shot2.png', Buffer.from(shot.result.data, 'base64'));
};
