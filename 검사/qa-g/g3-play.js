// qa-g g3: 들어보기·멈추기, 재생 중 탭 이동·설정 바꾸기·빠른 두 번 누르기, 기호 창, 기호 처음대로
module.exports = async (c) => {
  const B = 'http://127.0.0.1:8765/';
  await c.size(390, 844); await c.go(B);
  await c.ev(`window.__errs=[]; addEventListener('error',e=>__errs.push(String(e.message))); addEventListener('unhandledrejection',e=>__errs.push('rej '+String(e.reason))); 1`);
  const tap = async (sel) => { const p = await c.ev(`(()=>{const e=document.querySelector(${JSON.stringify(sel)}); e.scrollIntoView({block:'center'}); const r=e.getBoundingClientRect(); return {x:r.left+r.width/2,y:r.top+r.height/2}})()`); for (const type of ['mousePressed', 'mouseReleased']) await c.send('Input.dispatchMouseEvent', { type, x: p.x, y: p.y, button: 'left', clickCount: 1 }); };
  const S = () => c.ev(`({ play: document.querySelector('#playBtn').textContent, playing: !!RPX.playing, hl: document.querySelectorAll('#score .hl, #score [fill="#e8590c"], #score .now').length, rec: document.querySelector('#recBtn').textContent, recDis: document.querySelector('#recBtn').disabled, toast: document.querySelector('#toast').textContent })`);
  await c.ev(`(()=>{ Object.assign(RP.set,{mode:'melody',prac:'',inst:'trumpet',level:2,meter:'4/4',bars:4,bpm:120,seed:42,artic:'auto',edits:{}}); RP.syncForm(); RP.rebuild(); })()`);
  await c.sleep(1500);
  const o = {};
  await tap('#playBtn'); await c.sleep(800); o.p1 = await S();
  await tap('#playBtn'); await c.sleep(300); o.stop = await S();
  // 빠른 두 번
  await tap('#playBtn'); await tap('#playBtn'); await c.sleep(500); o.dbl = await S();
  await tap('#playBtn'); await tap('#playBtn'); await tap('#playBtn'); await c.sleep(500); o.triple = await S();
  await tap('#playBtn'); await c.sleep(300);
  // 재생 중 탭 이동
  await tap('#playBtn'); await c.sleep(1000);
  await tap('nav.tabs [data-tab=settings]'); await c.sleep(600); o.afterTab = await S();
  await tap('nav.tabs [data-tab=practice]'); await c.sleep(300); o.backTab = await S();
  if (o.backTab.playing) { await tap('#playBtn'); await c.sleep(300); }
  // 재생 중 새 악보
  await tap('#playBtn'); await c.sleep(1000); const seed0 = await c.ev('RP.set.seed');
  await tap('#newBtn'); await c.sleep(600); o.afterNew = Object.assign(await S(), { seedChanged: (await c.ev('RP.set.seed')) !== seed0 });
  if (o.afterNew.playing) { await tap('#playBtn'); await c.sleep(300); }
  // 재생 중 설정 바꾸기 (빠르기, 악기, 모드)
  await tap('#playBtn'); await c.sleep(1000);
  o.chg = await c.ev(`(async()=>{ const sl=ms=>new Promise(r=>setTimeout(r,ms)); const b=document.querySelector('#bpmNum'); b.value='60'; b.dispatchEvent(new Event('input',{bubbles:true})); b.dispatchEvent(new Event('change',{bubbles:true})); await sl(500);
    const a={ play: document.querySelector('#playBtn').textContent, playing: !!RPX.playing, bpm: RP.set.bpm };
    const i=document.querySelector('#inst'); i.value='tuba'; i.dispatchEvent(new Event('change',{bubbles:true})); await sl(500); a.play2=document.querySelector('#playBtn').textContent; a.playing2=!!RPX.playing;
    document.querySelector('#modeSeg [data-v=rhythm]').click(); await sl(500); a.play3=document.querySelector('#playBtn').textContent; a.playing3=!!RPX.playing; return a; })()`);
  if (await c.ev('!!RPX.playing')) { await tap('#playBtn'); await c.sleep(300); }
  // 재생 중 녹음 누르기
  await tap('#playBtn'); await c.sleep(800); await tap('#recBtn'); await c.sleep(1500); o.recDuringPlay = await S();
  await c.ev(`(()=>{ if (RPX.rec) document.querySelector('#recBtn').click(); return 1; })()`); await c.sleep(800); o.afterRecStop = Object.assign(await S(), { bodyRec: await c.ev(`document.body.classList.contains('recording')`), status: await c.ev(`document.querySelector('#recStatus').textContent`) });
  if (await c.ev('!!RPX.playing')) { await tap('#playBtn'); await c.sleep(300); }
  // 녹음 두 번 빠르게
  await tap('#recBtn'); await tap('#recBtn'); await c.sleep(1500); o.recDbl = Object.assign(await S(), { rec: await c.ev('!!RPX.rec'), body: await c.ev(`document.body.classList.contains('recording')`), status: await c.ev(`document.querySelector('#recStatus').textContent`) });
  if (await c.ev('!!RPX.rec')) { await c.ev(`document.querySelector('#recBtn').click()`); await c.sleep(800); }
  o.recDblAfter = { body: await c.ev(`document.body.classList.contains('recording')`), rec: await c.ev(`document.querySelector('#recBtn').textContent`), status: await c.ev(`document.querySelector('#recStatus').textContent`) };
  // 처음부터 → 그만하기
  await tap('#recBtn'); await c.sleep(1200); await tap('#recRestart'); await c.sleep(300); await tap('#recRestart'); await c.sleep(1500);
  o.restart2 = { rec: await c.ev('!!RPX.rec'), btn: await c.ev(`document.querySelector('#recBtn').textContent`), restartVis: await c.ev(`!document.querySelector('#recRestart').classList.contains('hide')`), status: await c.ev(`document.querySelector('#recStatus').textContent`) };
  await c.ev(`(()=>{ if (RPX.rec) document.querySelector('#recBtn').click(); return 1; })()`); await c.sleep(1000);
  o.restart2After = { body: await c.ev(`document.body.classList.contains('recording')`), btn: await c.ev(`document.querySelector('#recBtn').textContent`), restartVis: await c.ev(`!document.querySelector('#recRestart').classList.contains('hide')`), status: await c.ev(`document.querySelector('#recStatus').textContent`) };
  // 녹음 중 화면 숨김 (visibilitychange)
  await tap('#recBtn'); await c.sleep(1500);
  await c.ev(`(()=>{ Object.defineProperty(document,'visibilityState',{value:'hidden',configurable:true}); Object.defineProperty(document,'hidden',{value:true,configurable:true}); document.dispatchEvent(new Event('visibilitychange')); window.dispatchEvent(new Event('pagehide')); return 1; })()`);
  await c.sleep(800);
  await c.ev(`(()=>{ Object.defineProperty(document,'visibilityState',{value:'visible',configurable:true}); Object.defineProperty(document,'hidden',{value:false,configurable:true}); document.dispatchEvent(new Event('visibilitychange')); return 1; })()`);
  await c.sleep(500);
  o.hidden = { rec: await c.ev('!!RPX.rec'), body: await c.ev(`document.body.classList.contains('recording')`), btn: await c.ev(`document.querySelector('#recBtn').textContent`), status: await c.ev(`document.querySelector('#recStatus').textContent`), countBig: await c.ev(`document.querySelector('#countBig').className`) };
  console.log('PLAY', JSON.stringify(o, null, 1));
  await c.shot('qa-g/g3-after-hidden.png', false);
  // 기호 창
  await c.ev(`(()=>{ if (RPX.rec) document.querySelector('#recBtn').click(); Object.assign(RP.set,{mode:'melody',prac:'',inst:'flute',level:2,meter:'4/4',bars:4,bpm:88,seed:9,artic:'auto',edits:{}}); RP.syncForm(); RP.rebuild(); return 1; })()`);
  await c.sleep(800);
  const sh = await c.ev(`(async()=>{ const sl=ms=>new Promise(r=>setTimeout(r,ms)); const host=document.querySelector('#score'); host.scrollIntoView(); await sl(200); const s=host._scale, rc=host.getBoundingClientRect();
    const notes=host._hits.filter(x=>!x.rest); const click=h=>host.dispatchEvent(new MouseEvent('click',{bubbles:true,clientX:rc.left+h.x*s,clientY:rc.top+6+((h.y0+h.y1)/2)*s}));
    click(notes[0]); await sl(300); const chips=[...document.querySelectorAll('#sheetChips button')].map(b=>({k:b.dataset.k,t:b.textContent.trim(),on:b.getAttribute('aria-pressed')||b.className, h:Math.round(b.getBoundingClientRect().height)}));
    const sheetVis=!document.querySelector('#articSheet').classList.contains('hide'); const title=document.querySelector('#sheetTitle').textContent;
    const res={chips, sheetVis, title};
    for (const k of ['stac','marc','ten','slur']) { const b=document.querySelector('#sheetChips [data-k='+k+']'); if(b){ b.click(); await sl(150);} }
    res.after1 = JSON.stringify(RP.score.events.filter(e=>!e.rest)[0].artic); res.edits=JSON.stringify(RP.set.edits); res.resetVis=!document.querySelector('#editResetRow').classList.contains('hide');
    const fer=document.querySelector('#sheetChips [data-k=ferm]'); res.fermOnFirst = fer? {dis:fer.disabled, t:fer.textContent}:null;
    const clr=[...document.querySelectorAll('#sheetChips button')].find(b=>/모두 지우기/.test(b.textContent)); if(clr){clr.click(); await sl(150);} res.afterClear=JSON.stringify(RP.score.events.filter(e=>!e.rest)[0].artic);
    // 바깥 누르기로 닫기
    document.querySelector('header').dispatchEvent(new MouseEvent('click',{bubbles:true})); document.body.dispatchEvent(new MouseEvent('pointerdown',{bubbles:true})); await sl(300); res.closedOutside=document.querySelector('#articSheet').classList.contains('hide');
    // 마지막 음 페르마타
    click(notes[notes.length-1]); await sl(300); const f2=document.querySelector('#sheetChips [data-k=ferm]'); if(f2){ f2.click(); await sl(150);} res.lastArtic=JSON.stringify(RP.score.events.filter(e=>!e.rest).slice(-1)[0].artic);
    document.querySelector('#sheetClose').click(); await sl(200); res.closed=document.querySelector('#articSheet').classList.contains('hide');
    document.querySelector('#editReset').click(); await sl(300); res.resetHidden=document.querySelector('#editResetRow').classList.contains('hide'); res.editsAfterReset=JSON.stringify(RP.set.edits);
    return res; })()`);
  console.log('SHEET', JSON.stringify(sh));
  // 기호 창을 연 채로 탭 이동 / 새 악보
  const sh2 = await c.ev(`(async()=>{ const sl=ms=>new Promise(r=>setTimeout(r,ms)); const host=document.querySelector('#score'); host.scrollIntoView(); await sl(200); const s=host._scale, rc=host.getBoundingClientRect(); const h=host._hits.find(x=>!x.rest);
    host.dispatchEvent(new MouseEvent('click',{bubbles:true,clientX:rc.left+h.x*s,clientY:rc.top+6+((h.y0+h.y1)/2)*s})); await sl(200);
    document.querySelector('nav.tabs [data-tab=library]').click(); await sl(300); const a=!document.querySelector('#articSheet').classList.contains('hide');
    document.querySelector('nav.tabs [data-tab=practice]').click(); await sl(300); return { sheetOpenOnLibrary: a, sheetOpenBack: !document.querySelector('#articSheet').classList.contains('hide') }; })()`);
  console.log('SHEET2', JSON.stringify(sh2));
  await c.ev(`document.querySelector('#sheetClose').click()`);
  // artic manual / none
  const am = await c.ev(`(async()=>{ const sl=ms=>new Promise(r=>setTimeout(r,ms)); const a=document.querySelector('#artic'); const o={};
    for (const v of ['manual','none','auto']) { a.value=v; a.dispatchEvent(new Event('change',{bubbles:true})); await sl(300); o[v]={ n: RP.score.events.filter(e=>e.artic&&e.artic.length).length, hint: document.querySelector('#editHint').textContent.slice(0,80) }; } return o; })()`);
  console.log('ARTIC', JSON.stringify(am));
  // 홈 버튼, 테마 버튼 순환
  const th = await c.ev(`(async()=>{ const sl=ms=>new Promise(r=>setTimeout(r,ms)); const b=document.querySelector('#themeBtn'); const seq=[b.textContent]; for(let i=0;i<3;i++){ b.click(); await sl(100); seq.push(b.textContent+'/'+(document.documentElement.dataset.theme||'')); }
    document.querySelector('nav.tabs [data-tab=settings]').click(); scrollTo(0,800); document.querySelector('#homeBtn').click(); await sl(300); return { seq, practice: !document.querySelector('#tab-practice').classList.contains('hide'), y: scrollY }; })()`);
  console.log('THEME', JSON.stringify(th));
  console.log('ERRS', JSON.stringify(await c.ev('window.__errs')));
};
