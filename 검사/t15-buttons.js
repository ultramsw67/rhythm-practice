// v1.5 홈·다시 하기·처음 상태로 버튼 확인 (FAKE_WAV 있으면 녹음 '처음부터'도)
module.exports = async (c) => {
  const B = process.env.URL0 || 'http://127.0.0.1:' + (process.env.PORT || 8765) + '/';
  await c.size(390, 844);
  await c.go(B);
  const out = {};
  // 1) 녹음 중 '처음부터' (가짜 마이크는 맨 처음 써야 정확)
  if (process.env.FAKE_WAV) {
    out.restart = await c.ev(`(async()=>{
      Object.assign(RP.set,{mode:'rhythm',level:1,meter:'4/4',bars:2,bpm:100,artic:'auto',seed:3,edits:{}}); RP.rebuild(); document.querySelector('#countIn').value='1';
      const hiddenBefore = document.querySelector('#recRestart').classList.contains('hide');
      document.querySelector('#recBtn').click(); await new Promise(r=>setTimeout(r,1800));
      const shown = !document.querySelector('#recRestart').classList.contains('hide');
      document.querySelector('#recRestart').click(); await new Promise(r=>setTimeout(r,1800));
      const st = document.querySelector('#recStatus').textContent, btn = document.querySelector('#recBtn').textContent;
      document.querySelector('#recBtn').click(); await new Promise(r=>setTimeout(r,400));
      return { hiddenBefore, shown, stAfterRestart: st, btnAfterRestart: btn, hiddenAfterStop: document.querySelector('#recRestart').classList.contains('hide'), status: document.querySelector('#recStatus').textContent };
    })()`);
  }
  // 2) 홈 버튼
  out.home = await c.ev(`(async()=>{ document.querySelector('nav.tabs [data-tab=library]').click(); await new Promise(r=>setTimeout(r,200)); window.scrollTo(0,500);
    document.querySelector('#homeBtn').click(); await new Promise(r=>setTimeout(r,200));
    return { practice: !document.querySelector('#tab-practice').classList.contains('hide'), top: window.scrollY }; })()`);
  // 3) 기호 처음대로
  out.editReset = await c.ev(`(async()=>{
    Object.assign(RP.set,{mode:'melody',level:1,meter:'4/4',bars:2,inst:'flute',key:'C',artic:'auto',seed:9,edits:{}}); RP.rebuild();
    const hidden0 = document.querySelector('#editResetRow').classList.contains('hide');
    const auto0 = JSON.stringify(RP.score.events.map(e=>e.artic));
    const host=document.querySelector('#score'); host.scrollIntoView(); const s=host._scale, rc=host.getBoundingClientRect();
    const h=host._hits.find(x=>!x.rest); host.dispatchEvent(new MouseEvent('click',{bubbles:true,clientX:rc.left+h.x*s,clientY:rc.top+6+((h.y0+h.y1)/2)*s}));
    document.querySelector('#sheetChips [data-k=marc]').click();
    const shown = !document.querySelector('#editResetRow').classList.contains('hide');
    document.querySelector('#editReset').click();
    return { hidden0, shown, back: JSON.stringify(RP.score.events.map(e=>e.artic)) === auto0, hiddenAfter: document.querySelector('#editResetRow').classList.contains('hide'), sheetClosed: document.querySelector('#articSheet').classList.contains('hide') };
  })()`);
  // 4) 결과 → 새 악보로 연습
  out.resNew = await c.ev(`(async()=>{
    document.querySelector('nav.tabs [data-tab=settings]').click(); document.querySelector('#selfPerfect').click(); await new Promise(r=>setTimeout(r,3500));
    const seed0 = RPX.take.set.seed, meter0 = RPX.take.set.meter;
    document.querySelector('#resNew').click(); await new Promise(r=>setTimeout(r,300));
    return { practice: !document.querySelector('#tab-practice').classList.contains('hide'), newSeed: RP.set.seed !== seed0, sameMeter: RP.set.meter === meter0, drawn: RP.score.set.seed === RP.set.seed, takeUnchanged: RPX.take.set.seed === seed0 };
  })()`);
  // 5) 설정 처음 상태로 (두 번 눌러야)
  out.resetAll = await c.ev(`(async()=>{
    Object.assign(RP.set,{inst:'tuba',meter:'7/8',bars:16,bpm:150}); RP.rebuild();
    localStorage.setItem('rp.latency', JSON.stringify({ms:120,src:'manual'}));
    const n0 = (await RPX.DB.all()).length;
    document.querySelector('nav.tabs [data-tab=settings]').click();
    const b = document.querySelector('#resetAll'); b.click(); const armed = b.textContent; const afterOne = RP.set.meter;
    b.click(); await new Promise(r=>setTimeout(r,300));
    return { armed, afterOne, meter: RP.set.meter, bars: RP.set.bars, bpm: RP.set.bpm, inst: RP.set.inst, lat: document.querySelector('#latNow').textContent, theme: document.querySelector('#themeBtn').textContent, recordsKept: (await RPX.DB.all()).length === n0, label: b.textContent };
  })()`);
  console.log(JSON.stringify(out, null, 1));
};
