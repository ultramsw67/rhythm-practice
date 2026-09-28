// v2.9 화면: 320px·어두운 화면·아주 크게 캡처 + 가로 넘침·버튼 높이 검사
const fs = require('fs');
module.exports = async (c) => {
  const B = process.env.URL0 || 'http://127.0.0.1:' + (process.env.PORT || 8765) + '/';
  const shot = async (name, w) => {
    await c.ev(`document.querySelector('nav.tabs').style.position='static'`);
    const m = await c.send('Page.getLayoutMetrics');
    const im = await c.send('Page.captureScreenshot', { format: 'png', clip: { x: 0, y: 0, width: w, height: Math.min(m.result.cssContentSize.height, 5000), scale: 1 }, captureBeyondViewport: true });
    fs.writeFileSync(__dirname + '/' + name, Buffer.from(im.result.data, 'base64'));
    await c.ev(`document.querySelector('nav.tabs').style.position=''`);
  };
  const check = () => c.ev(`(()=>{ const vis=[...document.querySelectorAll('button,select,.btn')].filter(e=>e.offsetParent&&getComputedStyle(e).display!=='none'&&!e.closest('#articSheet'));
    const small=vis.filter(e=>e.getBoundingClientRect().height<44).map(e=>e.id||e.textContent.trim().slice(0,12));
    const svg=[...document.querySelectorAll('.paper svg')].map(s=>Math.round(s.getBoundingClientRect().right-s.parentNode.getBoundingClientRect().right));
    return { overflowX: document.documentElement.scrollWidth - innerWidth, small, svgOver: svg, font: document.documentElement.dataset.font, fs: getComputedStyle(document.body).fontSize } })()`);
  await c.size(320, 700); await c.go(B);
  await c.ev(`localStorage.setItem('rp.startSeen','true'); localStorage.setItem('rp.font','3'); localStorage.setItem('rp.set', JSON.stringify(Object.assign({}, window.RP.set, {mode:'melody', key: 7, bars: 8, level: 7, gen: 2})))`);
  await c.go(B);
  console.log('320 xl', JSON.stringify(await check()));
  await shot('ui-320-xl.png', 320);
  await c.ev(`document.querySelector('nav.tabs [data-tab=settings]').click()`); await c.sleep(300);
  console.log('320 xl settings', JSON.stringify(await check()));
  await shot('ui-320-settings.png', 320);
  await c.ev(`(async()=>{ document.querySelector('#selfPerfect').click(); await new Promise(r=>setTimeout(r,3500)); })()`);
  console.log('320 xl result', JSON.stringify(await check()));
  await c.size(390, 844);
  await c.ev(`localStorage.setItem('rp.font','2'); localStorage.setItem('rp.theme','"dark"')`); await c.go(B);
  console.log('390 dark', JSON.stringify(await check()));
  await shot('ui-390-dark.png', 390);
  // 글자 크기 단추 동작
  const r = await c.ev(`(async()=>{ document.querySelector('nav.tabs [data-tab=settings]').click(); const b=document.querySelector('#fontSeg [data-v="1"]'); b.click(); await new Promise(r=>setTimeout(r,300));
    return { font: document.documentElement.dataset.font, saved: localStorage.getItem('rp.font'), pressed: b.getAttribute('aria-pressed'), fs: getComputedStyle(document.body).fontSize } })()`);
  console.log('font btn', JSON.stringify(r));
  await c.ev(`localStorage.setItem('rp.theme','"auto"'); localStorage.setItem('rp.font','2')`);
};
