// 5. 320·390·1024px × 글자 1·3 × 밝은·어두운: 설정 칸(단계 단추 4×2·설명·요약·타악기) 넘침·작은 단추·겹침, 연습 화면 캡처
const fs = require('fs');
module.exports = async (c) => {
  const B = 'http://127.0.0.1:' + (process.env.PORT || 8765) + '/';
  await c.go(B);
  for (const w of [320, 390, 1024]) for (const f of ['1', '3']) for (const th of ['light', 'dark']) {
    await c.size(w, 900, w < 900);
    await c.ev(`localStorage.clear(); localStorage.setItem('rp.startSeen','true'); localStorage.setItem('rp.font','${f}'); localStorage.setItem('rp.theme','"${th}"');
      localStorage.setItem('rp.set', JSON.stringify({gen:2, drum:'snare', mode:'rhythm', meter:'12/8', level:7, bars:8, key:'Bb', inst:'clarinet', bpm:208, pickup:'on', artic:'auto', seed:5, edits:{}}))`);
    await c.go(B);
    const r = await c.ev(`(()=>{ document.querySelector('#setBox').open=true;
      const segs=[...document.querySelectorAll('#levelSeg button')].map(b=>b.getBoundingClientRect());
      const rows=[...new Set(segs.map(q=>Math.round(q.top)))].length, perRow=segs.filter(q=>Math.round(q.top)===Math.round(segs[0].top)).length;
      const small=segs.filter(q=>q.width<44||q.height<44).length;
      const box=document.querySelector('#setBox').getBoundingClientRect();
      const outside=[...document.querySelectorAll('#setBox *')].filter(e=>e.offsetParent&&e.getBoundingClientRect().right>box.right+1).map(e=>e.id||e.tagName+'.'+e.className).slice(0,6);
      const hint=document.querySelector('#levelHint'), hq=hint.getBoundingClientRect();
      const sum=document.querySelector('#setSum'), sq=sum.getBoundingClientRect();
      const sumOverflow = sum.scrollWidth>sum.clientWidth+1;
      const drumLab=document.querySelector('#drum').closest('label'); const dq=document.querySelector('#drum').getBoundingClientRect();
      const svg=document.querySelector('#score svg'); const W=+svg.getAttribute('width'); const vb=svg.viewBox.baseVal; const k=vb&&vb.width?W/vb.width:1; const bb=svg.getBBox();
      const acts=[...document.querySelectorAll('.acts2 .btn')].filter(b=>b.offsetParent).map(b=>{const q=b.getBoundingClientRect(); return [b.id, Math.round(q.width), Math.round(q.height), b.scrollWidth>b.clientWidth+1]});
      const bg=getComputedStyle(document.body).backgroundColor, fg=getComputedStyle(document.body).color;
      const segBg=getComputedStyle(document.querySelector('#levelSeg button[aria-pressed=true]')||document.querySelector('#levelSeg button')).backgroundColor;
      const segFg=getComputedStyle(document.querySelector('#levelSeg button[aria-pressed=true]')||document.querySelector('#levelSeg button')).color;
      const paperBg=getComputedStyle(document.querySelector('#score')).backgroundColor;
      const noteFill=(svg.querySelector('path[fill]:not([fill=none]), g[fill]')||{getAttribute:()=>''}).getAttribute('fill');
      return { overflowX: document.documentElement.scrollWidth-innerWidth, rows, perRow, small, btnW:Math.round(segs[0].width), btnH:Math.round(segs[0].height), outside, hintH:Math.round(hq.height), hintTxt:hint.textContent, sumTxt:sum.textContent, sumOverflow, sumW:Math.round(sq.width), drumW:Math.round(dq.width), drumVisible:!!drumLab.offsetParent, clipR:Math.round((bb.x+bb.width)*k-W), acts, bg, fg, segBg, segFg, paperBg, noteFill };
    })()`);
    console.log(w, 'font' + f, th, JSON.stringify(r));
    await c.ev(`document.querySelector('nav.tabs') && (document.querySelector('nav.tabs').style.position='static')`);
    const m = await c.send('Page.getLayoutMetrics');
    const im = await c.send('Page.captureScreenshot', { format: 'png', clip: { x: 0, y: 0, width: w, height: Math.min(m.result.cssContentSize.height, 4000), scale: 1 }, captureBeyondViewport: true });
    fs.writeFileSync(__dirname + `/ui-${w}-f${f}-${th}.png`, Buffer.from(im.result.data, 'base64'));
    // 재생 중 진행 표시 색(.now) 이 어두운 화면에서 보이는지
    if (th === 'dark' && f === '3') {
      const p = await c.ev(`(async()=>{ document.querySelector('#playBtn').click(); const s=performance.now(); while(!document.querySelector('#score .now') && performance.now()-s<6000) await new Promise(r=>setTimeout(r,30));
        const el=document.querySelector('#score .now'); const out= el ? {cls:el.getAttribute('class'), fill:getComputedStyle(el.querySelector('path')||el).fill, stroke:getComputedStyle(el.querySelector('path')||el).stroke} : 'no .now';
        document.querySelector('#playBtn').click(); return out; })()`);
      console.log('   now-style', JSON.stringify(p));
    }
  }
  await c.ev(`localStorage.setItem('rp.theme','"auto"'); localStorage.setItem('rp.font','2')`);
};
