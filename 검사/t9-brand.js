// 대표 이미지·워터마크 확인
module.exports = async (c) => {
  const B = process.env.URL0 || 'http://127.0.0.1:' + (process.env.PORT || 8765) + '/';
  await c.size(390, 844);
  await c.go(B);
  const r = await c.ev(`({ img: (()=>{const i=document.querySelector('.brand img'); return i && i.complete && i.naturalWidth})(), wm: document.querySelector('.brand .wm')?.textContent, icon: document.querySelector('link[rel=icon]')?.href })`);
  console.log(JSON.stringify(r));
  await c.ev(`document.querySelector('nav.tabs').style.display='none'`);
  const top = await c.send('Page.captureScreenshot', { format: 'png', clip: { x: 0, y: 0, width: 390, height: 760, scale: 1 } });
  require('fs').writeFileSync(__dirname + '/brand-light.png', Buffer.from(top.result.data, 'base64'));
  await c.ev(`document.documentElement.setAttribute('data-theme','dark')`);
  const top2 = await c.send('Page.captureScreenshot', { format: 'png', clip: { x: 0, y: 0, width: 390, height: 760, scale: 1 } });
  require('fs').writeFileSync(__dirname + '/brand-dark.png', Buffer.from(top2.result.data, 'base64'));
  await c.shotEl('brand-paper.png', '#score');
};
