// 여러 폭 x 라이트/다크 x 탭별 가로넘침·하단 겹침 확인
module.exports = async (c) => {
  const sizes = [
    [320, 700, true, 'p320'],
    [360, 740, true, 'p360'],
    [375, 812, true, 'p375'],
    [390, 844, true, 'p390'],
    [414, 896, true, 'p414'],
    [844, 390, true, 'land844'],
    [1024, 768, false, 'tab1024'],
    [1440, 900, false, 'desk1440'],
  ];
  const tabs = ['practice', 'result', 'library', 'settings'];
  const out = [];
  for (const [w, h, mobile, tag] of sizes) {
    await c.size(w, h, mobile);
    await c.go('http://127.0.0.1:8773/');
    if (mobile) await c.send('Emulation.setUserAgentOverride', { userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1' });
    for (const scheme of ['light', 'dark']) {
      await c.send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-color-scheme', value: scheme }] });
      for (const t of tabs) {
        // 리듬 모드로 강제 후 결과 탭은 가상 채점 하나 만들어서 내용 있는 상태로 확인
        if (t === 'result') {
          await c.ev(`(()=>{ if(!RPX.take){ RPX.selfTest(false);} })()`);
          await c.sleep(400);
        }
        await c.ev(`(()=>{document.querySelectorAll('nav.tabs button').forEach(b=>{if(b.dataset.tab===${JSON.stringify(t)}) b.click();})})()`);
        await c.sleep(150);
        await c.ev(`window.scrollTo(0, document.body.scrollHeight)`);
        await c.sleep(100);
        const info = await c.ev(`({
          overflowX: document.documentElement.scrollWidth > innerWidth + 1,
          scrollW: document.documentElement.scrollWidth, innerW: innerWidth,
          bodyPadBottom: getComputedStyle(document.body).paddingBottom,
          navRect: (()=>{const n=document.querySelector('nav.tabs'); const r=n.getBoundingClientRect(); return {top:r.top,bottom:r.bottom,h:r.height}})(),
          lastCardBottom: (()=>{const cards=document.querySelectorAll('#tab-'+${JSON.stringify(t)}+' .card'); if(!cards.length) return null; const r=cards[cards.length-1].getBoundingClientRect(); return r.bottom})(),
          winH: innerHeight,
        })`);
        out.push({ tag, scheme, t, info });
      }
    }
    // 아티큘레이션 시트가 탭바를 가리는지: 연습탭에서 시트 열기
    await c.ev(`(()=>{document.querySelectorAll('nav.tabs button').forEach(b=>{if(b.dataset.tab==='practice') b.click();})})()`);
    await c.sleep(150);
    await c.ev(`(()=>{RP.rebuild(); if(RP.score && RP.score.events.length){ const ev=RP.score.events[0]; const el=document.getElementById('vf-ev'+ev.id); if(el){el.dispatchEvent(new MouseEvent('click',{bubbles:true,clientX: (el.getBoundingClientRect().left+5), clientY: (el.getBoundingClientRect().top+5)}));}}})()`);
    await c.sleep(150);
    const sheetInfo = await c.ev(`(()=>{const s=document.querySelector('#articSheet'); if(!s||s.classList.contains('hide')) return {open:false}; const r=s.getBoundingClientRect(); const nav=document.querySelector('nav.tabs').getBoundingClientRect(); return {open:true, sheetBottom:r.bottom, navTop:nav.top, overlap: r.bottom > nav.top, sheetTop:r.top, winH:innerHeight}})()`);
    out.push({ tag, sheet: sheetInfo });
    await c.shot(`qa-c/shot-${tag}.png`);
  }
  console.log(JSON.stringify(out, null, 1));
};
