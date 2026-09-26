module.exports = async (c) => {
  await c.size(390, 844);
  await c.go('http://127.0.0.1:8765/');
  // 1) 음표 누르기 → 스타카토 붙이기
  const r1 = await c.ev(`(async()=>{
    RP.set.mode='melody'; RP.set.level=2; RP.set.meter='4/4'; RP.set.inst='alto_sax'; RP.set.key='Bb'; RP.set.artic='manual'; RP.set.seed=5; RP.set.edits={}; RP.rebuild();
    const host=document.querySelector('#score'); const h=host._hits.find(x=>!x.rest); const rc=host.getBoundingClientRect(); const s=host._scale;
    host.dispatchEvent(new MouseEvent('click',{bubbles:true,clientX:rc.left+h.x*s,clientY:rc.top+6+((h.y0+h.y1)/2)*s}));
    const open=!document.querySelector('#articSheet').classList.contains('hide');
    document.querySelector('#sheetChips [data-k="stac"]').click();
    document.querySelector('#sheetChips [data-k="slur"]').click();
    const ev=RP.score.events[h.id];
    return {open, id:h.id, artic:ev.artic, slurs:RP.score.slurs, sel: !!document.querySelector('#score .sel')};
  })()`);
  console.log('edit', JSON.stringify(r1));
  // 2) 공유 링크 왕복
  const r2 = await c.ev(`(async()=>{ document.querySelector('#shareBtn').click(); await new Promise(r=>setTimeout(r,300)); return location.hash.length })()`);
  console.log('hash len', r2);
  const hash = await c.ev('location.href');
  await c.go('about:blank');
  await c.go(hash.includes('#') ? hash : 'http://127.0.0.1:8765/');
  const r3 = await c.ev(`({seed:RP.set.seed, mode:RP.set.mode, artic: RP.score.events.filter(e=>e.artic.length).map(e=>e.id+':'+e.artic), slurs: RP.score.slurs, info: document.querySelector('#scoreInfo').textContent})`);
  console.log('shared', JSON.stringify(r3));
  // 3) 들어보기 → 음표 하이라이트
  const r4 = await c.ev(`(async()=>{ document.querySelector('#articSheet').classList.add('hide'); document.querySelector('#playBtn').click(); await new Promise(r=>setTimeout(r,3500)); const n=document.querySelectorAll('#score .now').length; const t=document.querySelector('#playBtn').textContent; document.querySelector('#playBtn').click(); return {now:n, btn:t, after: document.querySelector('#playBtn').textContent} })()`);
  console.log('play', JSON.stringify(r4));
  // 4) 어두운 화면 + 넓은 화면
  await c.ev(`document.documentElement.setAttribute('data-theme','dark')`);
  await c.shot('dark.png');
  await c.size(1280, 900, false);
  await c.ev(`RP.set.mode='rhythm';RP.set.meter='12/8';RP.set.level=2;RP.set.bars=8;RP.set.edits={};RP.set.artic='auto';RP.rebuild()`);
  await c.shot('wide.png');
};
