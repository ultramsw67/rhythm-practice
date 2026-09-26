// 실제 뷰포트 그대로(풀페이지 아님) 스크린샷 — 시트·탭바 겹침을 눈으로 확인
module.exports = async (c) => {
  const sizes = [
    [320, 700, true, 'p320'],
    [390, 844, true, 'p390'],
    [844, 390, true, 'land844'],
  ];
  for (const [w, h, mobile, tag] of sizes) {
    await c.size(w, h, mobile);
    await c.go('http://127.0.0.1:8773/');
    await c.send('Emulation.setUserAgentOverride', { userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1' });
    // 연습 탭 맨 아래로 스크롤
    await c.ev(`window.scrollTo(0, document.body.scrollHeight)`);
    await c.sleep(150);
    const top = await c.send('Page.captureScreenshot', { format: 'png', clip: { x: 0, y: 0, width: w, height: h, scale: 1 } });
    require('fs').writeFileSync(__dirname + `/vp-${tag}-bottom.png`, Buffer.from(top.result.data, 'base64'));
    // 아티큘레이션 시트 열기
    await c.ev(`(()=>{window.scrollTo(0,0); if(RP.score && RP.score.events.length){ const ev=RP.score.events[0]; const el=document.getElementById('vf-ev'+ev.id); if(el){const r=el.getBoundingClientRect(); el.dispatchEvent(new MouseEvent('click',{bubbles:true,clientX:r.left+5,clientY:r.top+5}));}}})()`);
    await c.sleep(200);
    const sh = await c.send('Page.captureScreenshot', { format: 'png', clip: { x: 0, y: 0, width: w, height: h, scale: 1 } });
    require('fs').writeFileSync(__dirname + `/vp-${tag}-sheet.png`, Buffer.from(sh.result.data, 'base64'));
    // 다크모드로 시트 그대로
    await c.ev(`document.documentElement.setAttribute('data-theme','dark')`);
    await c.sleep(100);
    const shd = await c.send('Page.captureScreenshot', { format: 'png', clip: { x: 0, y: 0, width: w, height: h, scale: 1 } });
    require('fs').writeFileSync(__dirname + `/vp-${tag}-sheet-dark.png`, Buffer.from(shd.result.data, 'base64'));
  }
};
