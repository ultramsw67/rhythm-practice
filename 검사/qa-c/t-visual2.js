module.exports = async (c) => {
  await c.size(390, 844, true);
  const B = 'http://127.0.0.1:8773/';
  await c.go(B);
  await c.ev(`(()=>{document.querySelectorAll('nav.tabs button').forEach(b=>{if(b.dataset.tab==='practice') b.click();});})()`);
  await c.ev(`window.scrollTo(0, document.body.scrollHeight)`);
  await c.sleep(150);
  // 토스트 강제 표시
  await c.ev(`(()=>{const t=document.querySelector('#toast'); t.textContent='공유받은 악보를 열었습니다'; t.classList.add('on');})()`);
  await c.sleep(100);
  const top = await c.send('Page.captureScreenshot', { format: 'png', clip: { x: 0, y: 0, width: 390, height: 844, scale: 1 } });
  require('fs').writeFileSync(__dirname + '/toast-shot.png', Buffer.from(top.result.data, 'base64'));
  // 예비박 오버레이 강제 표시
  await c.ev(`(()=>{const b=document.querySelector('#countBig'); b.classList.remove('hide'); b.textContent='2';})()`);
  await c.sleep(100);
  const cnt = await c.send('Page.captureScreenshot', { format: 'png', clip: { x: 0, y: 0, width: 390, height: 844, scale: 1 } });
  require('fs').writeFileSync(__dirname + '/countin-shot.png', Buffer.from(cnt.result.data, 'base64'));
  // 대비 확인용 계산
  const contrast = await c.ev(`(()=>{
    function lum(hex){ hex=hex.replace('#',''); if(hex.length===3) hex=hex.split('').map(x=>x+x).join(''); const r=parseInt(hex.slice(0,2),16)/255,g=parseInt(hex.slice(2,4),16)/255,b=parseInt(hex.slice(4,6),16)/255; const f=v=>v<=0.03928?v/12.92:Math.pow((v+0.055)/1.055,2.4); return 0.2126*f(r)+0.7152*f(g)+0.0722*f(b); }
    function ratio(a,b){ const L1=lum(a),L2=lum(b); const hi=Math.max(L1,L2),lo=Math.min(L1,L2); return (hi+0.05)/(lo+0.05); }
    document.documentElement.setAttribute('data-theme','dark');
    const cs = getComputedStyle(document.documentElement);
    const sub = cs.getPropertyValue('--sub').trim(), card=cs.getPropertyValue('--card').trim(), bg=cs.getPropertyValue('--bg').trim(), line=cs.getPropertyValue('--line').trim();
    return { subOnCard: ratio(sub,card).toFixed(2), lineOnCard: ratio(line,card).toFixed(2), lineOnBg: ratio(line,bg).toFixed(2) };
  })()`);
  console.log('contrast(dark)', JSON.stringify(contrast));
};
