module.exports = async (c) => {
  const B = 'http://127.0.0.1:8765/';
  await c.size(390, 844); await c.go(B);
  await c.ev(`window.__errs=[]; addEventListener('error',e=>__errs.push(String(e.message))); addEventListener('unhandledrejection',e=>__errs.push('rej '+String(e.reason))); 1`);
  const sl = `const sl=ms=>new Promise(r=>setTimeout(r,ms)); const q=s=>document.querySelector(s); const tab=n=>q('nav.tabs [data-tab='+n+']').click(); const vis=s=>{const e=q(s); return !!e&&e.offsetParent!==null&&!e.classList.contains('hide');};`;
  const r = await c.ev(`(async()=>{ ${sl} const o={}; q('#modeSeg [data-v=melody]').click(); await sl(200); Object.assign(RP.set,{prac:'scale',key:'Am',inst:'clarinet',level:5,meter:'4/4'}); RP.syncForm(); RP.rebuild(); await sl(200);
    for (const v of ['208','160','120','60']) { const b=q('#bpmNum'); b.value=v; b.dispatchEvent(new Event('input',{bubbles:true})); b.dispatchEvent(new Event('change',{bubbles:true})); await sl(300); o['n'+v]={bpm:RP.set.bpm, range:q('#bpmRange').value, rlv: RP.score.rlv, info:q('#scoreInfo').textContent.slice(60), n:RP.score.events.length}; }
    for (const v of ['208']) { const b=q('#bpmRange'); b.value=v; b.dispatchEvent(new Event('input',{bubbles:true})); await sl(300); o['r'+v]={bpm:RP.set.bpm, num:q('#bpmNum').value, info:q('#scoreInfo').textContent.slice(60), beat:q('#beatLabel').textContent}; }
    // 잘못된 숫자 입력
    for (const v of ['', '5', '999', 'abc', '88.6']) { const b=q('#bpmNum'); b.value=v; b.dispatchEvent(new Event('input',{bubbles:true})); b.dispatchEvent(new Event('change',{bubbles:true})); b.dispatchEvent(new Event('blur')); await sl(250); o['bad_'+v]={bpm:RP.set.bpm, num:b.value, sum:q('#setSum').textContent.slice(-12), info: /NaN|undefined/.test(q('#scoreInfo').textContent+q('#setSum').textContent+q('#beatLabel').textContent)}; }
    // 빠르기말
    // 결과 탭 빈 상태 (새 프로필이 아니면 생략)
    return o; })()`);
  console.log('BPM', JSON.stringify(r, null, 1));
  // 측정 중 녹음 누르기
  const cal = await c.ev(`(async()=>{ ${sl} tab('settings'); await sl(200); q('#calSpk').click(); await sl(800); tab('practice'); await sl(200); q('#recBtn').click(); await sl(600); const a={ recSt:q('#recStatus').textContent, btn:q('#recBtn').textContent, toast:q('#toast').textContent, rec:!!RPX.rec };
    q('#playBtn').click(); await sl(500); a.play=q('#playBtn').textContent; a.playing=!!RPX.playing; if(RPX.playing) q('#playBtn').click(); if(RPX.rec) q('#recBtn').click(); tab('settings'); for(let i=0;i<30;i++){ await sl(500); if(!q('#calSpk').disabled) break; } a.msg=q('#calMsg').textContent; a.dis=q('#calSpk').disabled; return a; })()`);
  console.log('CAL+REC', JSON.stringify(cal));
  // 녹음 중 측정 누르기 (설정 탭은 잠겨야 함) 및 녹음 중 다른 악보 설정 시도
  const r2 = await c.ev(`(async()=>{ ${sl} tab('practice'); await sl(200); q('#recBtn').click(); await sl(1200); const s0=JSON.stringify(RP.set); const m=q('#meter'); m.value='3/4'; m.dispatchEvent(new Event('change',{bubbles:true})); await sl(200); const same=JSON.stringify(RP.set)===s0; const mv=m.value;
    q('#homeBtn').click(); await sl(200); const recAfterHome=!!RPX.rec; q('#themeBtn').click(); await sl(200); const recAfterTheme=!!RPX.rec;
    if (RPX.rec) q('#recBtn').click(); await sl(600); return { same, mv, recAfterHome, recAfterTheme, after: RP.set.meter, body: document.body.classList.contains('recording') }; })()`);
  console.log('RECLOCK', JSON.stringify(r2));
  console.log('ERRS', JSON.stringify(await c.ev('window.__errs')));
};
