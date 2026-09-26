// 모든 화면 캡처 (휴대폰 390px, 처음 온 사람 기준) + 녹음 중 잠금 확인
const fs = require('fs');
module.exports = async (c) => {
  const B = process.env.URL0 || 'http://127.0.0.1:' + (process.env.PORT || 8765) + '/';
  await c.size(390, 844);
  await c.go(B);
  await c.ev(`(()=>{ localStorage.clear(); indexedDB.deleteDatabase('rhythm-practice'); })()`);
  await c.go(B);
  const shotFull = async (name) => {
    await c.ev(`document.querySelector('nav.tabs').style.position='static'`);
    const m = await c.send('Page.getLayoutMetrics');
    const h = Math.min(m.result.cssContentSize.height, 5000);
    const im = await c.send('Page.captureScreenshot', { format: 'png', clip: { x: 0, y: 0, width: 390, height: h, scale: 1 }, captureBeyondViewport: true });
    fs.writeFileSync(__dirname + '/' + name, Buffer.from(im.result.data, 'base64'));
    await c.ev(`document.querySelector('nav.tabs').style.position=''`);
  };
  const info = await c.ev(`({ start: !document.querySelector('#startCard').classList.contains('hide'), modeHint: document.querySelector('#modeHint').textContent, latGo: !document.querySelector('#latGo').classList.contains('hide') })`);
  console.log(JSON.stringify(info));
  await shotFull('scr-practice.png');
  await c.ev(`document.querySelector('nav.tabs [data-tab=result]').click()`); await c.sleep(300); await shotFull('scr-result-empty.png');
  await c.ev(`document.querySelector('nav.tabs [data-tab=library]').click()`); await c.sleep(500); await shotFull('scr-library-empty.png');
  await c.ev(`document.querySelector('nav.tabs [data-tab=settings]').click()`); await c.sleep(300); await shotFull('scr-settings.png');
  const r2 = await c.ev(`(async()=>{ document.querySelector('#selfPerfect').click(); await new Promise(r=>setTimeout(r,3500)); return document.querySelector('#resTotal').textContent })()`);
  console.log('self', r2);
  await shotFull('scr-result.png');
  await c.ev(`document.querySelector('nav.tabs [data-tab=library]').click()`); await c.sleep(300);
  await c.ev(`document.querySelector('#resSave') && 0`);
  // 시작 카드 닫기·지연 보정 바로가기
  const r3 = await c.ev(`(async()=>{ document.querySelector('#homeBtn').click(); await new Promise(r=>setTimeout(r,200)); document.querySelector('#startLat').click(); await new Promise(r=>setTimeout(r,300));
    return { settings: !document.querySelector('#tab-settings').classList.contains('hide'), startHidden: document.querySelector('#startCard').classList.contains('hide'), seen: localStorage.getItem('rp.startSeen') } })()`);
  console.log(JSON.stringify(r3));
  // 빈 화면의 '연습하러 가기'
  const r4 = await c.ev(`(async()=>{ document.querySelector('nav.tabs [data-tab=library]').click(); await new Promise(r=>setTimeout(r,400)); const g=document.querySelector('#libList .go-practice'); if(!g) return 'no button (list not empty?)'; g.click(); await new Promise(r=>setTimeout(r,200)); return !document.querySelector('#tab-practice').classList.contains('hide'); })()`);
  console.log('go-practice', r4);
};
