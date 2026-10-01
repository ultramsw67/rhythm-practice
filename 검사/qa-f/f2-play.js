// 2·3. 타악기 고르기 + 들어보기 나눠 예약: 시작·멈춤·진행, 연속 두 번, 재생 중 설정·녹음
module.exports = async (c) => {
  const B = 'http://127.0.0.1:' + (process.env.PORT || 8765) + '/';
  await c.size(390, 844, true);
  await c.go(B);
  await c.ev(`localStorage.clear(); localStorage.setItem('rp.startSeen','true')`);
  await c.go(B);
  const J = async (name, expr) => { try { const v = await c.ev(expr); console.log(name, JSON.stringify(v)); return v; } catch (e) { console.log(name, 'ERR', e.message); } };
  await c.ev(`window.__errs=[]; window.addEventListener('error',e=>__errs.push(String(e.message))); window.addEventListener('unhandledrejection',e=>__errs.push('rej '+String(e.reason)));
    window.__w=ms=>new Promise(r=>setTimeout(r,ms));
    window.__btn=()=>document.querySelector('#playBtn').textContent;
    window.__waitBtn=async(txt,ms)=>{const s=performance.now(); while(performance.now()-s<ms){ if(__btn()===txt) return Math.round(performance.now()-s); await __w(20);} return 'timeout:'+__btn();};
    window.__tap=(el)=>{const q=el.getBoundingClientRect(); document.querySelector('#score').dispatchEvent(new MouseEvent('click',{bubbles:true,clientX:q.x+q.width/2,clientY:q.y+q.height/2}));};
    document.querySelector('#setBox').open=true; 1`);
  // 드럼 고르기 + 들어보기 끝까지
  for (const d of ['snare', 'bass', 'cymbal', '']) {
    await J('drum ' + d, `(async()=>{ const s=document.querySelector('#drum'); s.value='${d}'; s.dispatchEvent(new Event('change'));
      Object.assign(RP.set,{mode:'rhythm',level:4,meter:'4/4',bars:2,bpm:160,artic:'auto',pickup:'off'}); RP.rebuild();
      document.querySelector('#playBtn').click(); const first=__btn();
      const st=await __waitBtn('■ 멈추기',4000);
      await __w(1500); const nowN=document.querySelectorAll('#score .now').length, doneN=document.querySelectorAll('#score .done').length;
      const pl=!!RPX.playing, ctx=RPX.actx&&RPX.actx.state;
      const end=await __waitBtn('▶ 들어보기',15000);
      return {set:RP.set.drum, info:document.querySelector('#scoreInfo').textContent, sound:document.querySelector('#soundInfo').textContent, first, startMs:st, nowN, doneN, pl, ctx, endMs:end, playingAfter:RPX.playing, leftover:document.querySelectorAll('#score .now,#score .done').length}; })()`);
  }
  // 기호 창
  await J('chips', `(async()=>{ const s=document.querySelector('#drum'); s.value='snare'; s.dispatchEvent(new Event('change'));
    const a=document.querySelector('#artic'); a.value='manual'; a.dispatchEvent(new Event('change'));
    __tap(document.getElementById('vf-ev'+RP.score.events.find(e=>!e.rest).id));
    await __w(200); const chips=[...document.querySelectorAll('#sheetChips .chip')].map(b=>b.textContent+(b.offsetParent?'':'(hidden)'));
    const vis=!document.querySelector('#articSheet').classList.contains('hide');
    document.querySelector('#sheetClose').click();
    document.querySelector('#modeSeg button[data-v="melody"]').click();
    const hidden=document.querySelector('#drum').closest('label').classList.contains('hide');
    __tap(document.getElementById('vf-ev'+RP.score.events.find(e=>!e.rest).id));
    await __w(200); const chipsM=[...document.querySelectorAll('#sheetChips .chip')].map(b=>b.textContent);
    document.querySelector('#sheetClose').click();
    const scoreDrumInMelody=RP.score.drum;
    document.querySelector('#modeSeg button[data-v="rhythm"]').click();
    const s2=document.querySelector('#drum'); s2.value=''; s2.dispatchEvent(new Event('change'));
    __tap(document.getElementById('vf-ev'+RP.score.events.find(e=>!e.rest).id));
    await __w(200); const chipsR=[...document.querySelectorAll('#sheetChips .chip')].map(b=>b.textContent);
    document.querySelector('#sheetClose').click();
    s2.value='snare'; s2.dispatchEvent(new Event('change'));
    return {vis, chips, hiddenInMelody:hidden, chipsMelody:chipsM, chipsRhythmDefault:chipsR, scoreDrumInMelody, backDrum:RP.set.drum}; })()`);
  // 타악기 악보에 붙는 기호 종류 (자동 배치)
  await J('drumArtic', `(()=>{ const out={}; for (const d of ['snare','']) for (let lv=1;lv<=7;lv+=2){ let s=new Set(); for(let seed=1;seed<=30;seed++){ const S=Object.assign({},RP.set,{drum:d,mode:'rhythm',level:lv,artic:'auto',seed,bars:8,edits:{}}); Core.generate(S).events.forEach(e=>(e.artic||[]).forEach(a=>s.add(a))); } out[(d||'click')+lv]=[...s].join(','); } return out; })()`);
  await J('artic-auto', `(()=>{const a=document.querySelector('#artic'); a.value='auto'; a.dispatchEvent(new Event('change')); return RP.set.artic})()`);
  // 준비 중에 두 번째 누름
  await J('double-fast', `(async()=>{ Object.assign(RP.set,{bars:4,bpm:120}); RP.rebuild(); const b=document.querySelector('#playBtn'); b.click(); b.click(); const t1=__btn();
    await __w(2500); const t2=__btn(), p=!!RPX.playing; document.querySelector('#playBtn').click(); await __w(100); return {t1,t2,p,after:__btn(),pl:RPX.playing}; })()`);
  // 재생 중 두 번 빠르게 (멈춤 → 다시 시작)
  await J('double-playing', `(async()=>{ const b=document.querySelector('#playBtn'); b.click(); await __waitBtn('■ 멈추기',4000); await __w(500);
    b.click(); b.click(); const t1=__btn(); const st=await __waitBtn('■ 멈추기',4000); await __w(800); const nowN=document.querySelectorAll('#score .now').length;
    b.click(); await __w(50); return {t1,restart:st,nowN,after:__btn(),pl:RPX.playing}; })()`);
  // 10번 연타
  await J('mash', `(async()=>{ const b=document.querySelector('#playBtn'); for(let i=0;i<10;i++){ b.click(); await __w(37);} await __w(3000); const t=__btn(), p=!!RPX.playing; if(p) b.click(); await __w(50); return {t,p,after:__btn(),pl:RPX.playing}; })()`);
  // 재생 중 설정 바꾸기
  const acts = [
    ['level', `document.querySelectorAll('#levelSeg button')[4].click()`],
    ['meter', `(()=>{const s=document.querySelector('#meter'); s.value='6/8'; s.dispatchEvent(new Event('change'));})()`],
    ['drum', `(()=>{const s=document.querySelector('#drum'); s.value='cymbal'; s.dispatchEvent(new Event('change'));})()`],
    ['bpm', `(()=>{const s=document.querySelector('#bpmRange'); s.value='150'; s.dispatchEvent(new Event('input'));})()`],
    ['mode', `document.querySelector('#modeSeg button[data-v="melody"]').click()`],
    ['newBtn', `document.querySelector('#newBtn').click()`],
    ['countIn', `(()=>{const s=document.querySelector('#countIn'); s.value='2'; s.dispatchEvent(new Event('change'));})()`],
    ['metro', `document.querySelector('#metroOn').click()`],
    ['tabResult', `document.querySelector('nav.tabs button:nth-child(2), nav.tabs a:nth-child(2)') && document.querySelector('nav.tabs button:nth-child(2), nav.tabs a:nth-child(2)').click()`],
  ];
  for (const [nm, act] of acts) {
    await J('change-while-playing ' + nm, `(async()=>{ document.querySelector('nav.tabs button, nav.tabs a') && document.querySelector('nav.tabs button, nav.tabs a').click(); document.querySelector('#modeSeg button[data-v="rhythm"]').click(); const b=document.querySelector('#playBtn'); b.click(); await __waitBtn('■ 멈추기',4000); await __w(700);
      ${act}; await __w(1500); const r={btn:__btn(), pl:!!RPX.playing, now:document.querySelectorAll('#score .now').length, done:document.querySelectorAll('#score .done').length, set:RP.set.meter+' '+RP.set.level+' '+RP.set.bpm+' '+RP.set.drum+' '+RP.set.mode};
      if (RPX.playing) { b.click(); await __w(50);} return r; })()`);
  }
  await J('reset', `(()=>{ document.querySelector('nav.tabs button, nav.tabs a') && document.querySelector('nav.tabs button, nav.tabs a').click(); const m=document.querySelector('#metroOn'); if(!m.checked) m.click(); Object.assign(RP.set,{mode:'rhythm',meter:'4/4',level:4,bars:4,bpm:120,drum:'snare'}); RP.rebuild(); return 1})()`);
  // 준비 중(깨움 대기)에 설정 바꾸기: 깨움을 60초 이상 쉬게 해서 준비 시간을 길게
  await J('change-while-starting', `(async()=>{ RPX.actx && RPX.actx.suspend && await RPX.actx.suspend(); const b=document.querySelector('#playBtn'); b.click(); const t1=__btn(); document.querySelectorAll('#levelSeg button')[2].click(); const lv=RP.set.level;
     const st=await __waitBtn('■ 멈추기',4000); await __w(600); const now=document.querySelectorAll('#score .now').length; b.click(); await __w(50); return {t1,lv,st,now,after:__btn()}; })()`);
  console.log('errs', await c.ev('JSON.stringify(__errs)'));
};
