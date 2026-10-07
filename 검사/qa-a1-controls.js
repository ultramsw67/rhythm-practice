// QA-A: 연습 탭 컨트롤 전수 조사 (실제 DOM 이벤트로)
const BASE = 'http://127.0.0.1:8771/';
module.exports = async (c) => {
  await c.size(390, 844);
  await c.go(BASE);
  await c.ev(`(()=>{ indexedDB.deleteDatabase('rhythm-practice'); localStorage.clear(); })()`);
  await c.go(BASE);
  const out = {};

  // 1) 모드 버튼
  out.modeButtons = await c.ev(`(()=>{
    const btns = [...document.querySelectorAll('#modeSeg button')];
    const r = [];
    for (const b of btns) { b.click(); r.push({v:b.dataset.v, setMode:RP.set.mode, pressed:[...document.querySelectorAll('#modeSeg button')].map(x=>x.getAttribute('aria-pressed'))}); }
    return r;
  })()`);

  // 2) 박자표 전체 9개
  out.meters = await c.ev(`(async()=>{
    const sel = document.querySelector('#meter'); const opts=[...sel.options].map(o=>o.value); const r=[];
    for (const m of opts) { sel.value=m; sel.dispatchEvent(new Event('change')); await new Promise(res=>setTimeout(res,60));
      r.push({m, setMeter:RP.set.meter, info:document.querySelector('#scoreInfo').textContent, err: document.querySelector('#score .placeholder')?.textContent||'', beatLabel: document.querySelector('#beatLabel').textContent}); }
    return {opts, r};
  })()`);

  // 3) 마디 수 전체
  out.bars = await c.ev(`(async()=>{
    const sel = document.querySelector('#bars'); const opts=[...sel.options].map(o=>o.value); const r=[];
    for (const v of opts) { sel.value=v; sel.dispatchEvent(new Event('change')); await new Promise(res=>setTimeout(res,60));
      r.push({v, setBars:RP.set.bars, measures:RP.score?RP.score.measures.length:-1}); }
    return {opts, r};
  })()`);

  // 4) 못갖춘마디 3종
  out.pickup = await c.ev(`(async()=>{
    const sel = document.querySelector('#pickup'); const opts=[...sel.options].map(o=>o.value); const r=[];
    for (const v of opts) {
      for (let i=0;i<6;i++){ sel.value=v; sel.dispatchEvent(new Event('change')); await new Promise(res=>setTimeout(res,50));
        r.push({v, seed: RP.set.seed, setPickup:RP.set.pickup, pickLen: RP.score.pickLen, hasPickup: RP.score.pickLen>0}); RP.set.seed=Math.floor(Math.random()*99999); RP.rebuild(); }
    }
    return {opts, r};
  })()`);

  // 5) 아티큘레이션 auto/manual/none
  out.artic = await c.ev(`(async()=>{
    const sel = document.querySelector('#artic'); const opts=[...sel.options].map(o=>o.value); const r=[];
    for (const v of opts) { sel.value=v; sel.dispatchEvent(new Event('change')); await new Promise(res=>setTimeout(res,60));
      r.push({v, setArtic:RP.set.artic, editHint: document.querySelector('#editHint').textContent}); }
    return {opts, r};
  })()`);

  // 6) 악기 13종 전체 (선율 모드에서 전환 확인 + 조표 이조 표시)
  out.instruments = await c.ev(`(async()=>{
    RP.set.mode='melody'; RP.set.key='Bb'; RP.rebuild();
    const sel = document.querySelector('#inst'); const opts=[...sel.options].map(o=>o.value); const r=[];
    for (const v of opts) { sel.value=v; sel.dispatchEvent(new Event('change')); await new Promise(res=>setTimeout(res,60));
      r.push({v, setInst:RP.set.inst, info:document.querySelector('#scoreInfo').textContent, err: document.querySelector('#score .placeholder')?.textContent||''}); }
    return {opts, r};
  })()`);

  // 7) 조표 30종 전체
  out.keys = await c.ev(`(async()=>{
    const sel = document.querySelector('#key'); const opts=[...sel.options].map(o=>o.value); const r=[];
    for (const v of opts) { sel.value=v; sel.dispatchEvent(new Event('change')); await new Promise(res=>setTimeout(res,50));
      r.push({v, setKey:RP.set.key, info:document.querySelector('#scoreInfo').textContent, err: document.querySelector('#score .placeholder')?.textContent||''}); }
    return {opts, r};
  })()`);

  // 8) 난이도 3단계
  out.levels = await c.ev(`(async()=>{
    const btns = [...document.querySelectorAll('#levelSeg button')]; const r=[];
    for (const b of btns) { b.click(); await new Promise(res=>setTimeout(res,60)); r.push({v:b.dataset.v, setLevel:RP.set.level, info:document.querySelector('#scoreInfo').textContent}); }
    return r;
  })()`);

  // 9) BPM 슬라이더 / 숫자 입력(39, 209, 빈칸, abc) / 빠르기말
  out.bpm = await c.ev(`(async()=>{
    const range = document.querySelector('#bpmRange'), num = document.querySelector('#bpmNum');   // v4.0.1 빠르기말 삭제
    const r = {};
    range.value = 160; range.dispatchEvent(new Event('input')); await new Promise(res=>setTimeout(res,350));
    r.sliderTo160 = {bpm:RP.set.bpm, numVal:num.value, rangeVal:range.value};
    num.value='39'; num.dispatchEvent(new Event('change')); await new Promise(res=>setTimeout(res,350));
    r.typed39 = {bpm:RP.set.bpm, numVal:num.value, rangeVal:range.value};
    num.value='209'; num.dispatchEvent(new Event('change')); await new Promise(res=>setTimeout(res,350));
    r.typed209 = {bpm:RP.set.bpm, numVal:num.value, rangeVal:range.value};
    num.value=''; num.dispatchEvent(new Event('change')); await new Promise(res=>setTimeout(res,350));
    r.typedBlank = {bpm:RP.set.bpm, numVal:num.value, rangeVal:range.value};
    num.value='abc'; num.dispatchEvent(new Event('change')); await new Promise(res=>setTimeout(res,350));
    r.typedAbc = {bpm:RP.set.bpm, numVal:num.value, rangeVal:range.value};
    return r;
  })()`);

  // 10) 새 악보 (seed 바뀌는지, edits 초기화)
  out.newScore = await c.ev(`(async()=>{
    RP.set.artic='manual';RP.rebuild();
    const host=document.querySelector('#score'); const h=host._hits.find(x=>!x.rest); const rc=host.getBoundingClientRect(); const s=host._scale;
    host.dispatchEvent(new MouseEvent('click',{bubbles:true,clientX:rc.left+h.x*s,clientY:rc.top+6+((h.y0+h.y1)/2)*s}));
    document.querySelector('#sheetChips [data-k=stac]').click();
    const before = {seed: RP.set.seed, edits: JSON.stringify(RP.set.edits)};
    document.querySelector('#newBtn').click(); await new Promise(res=>setTimeout(res,100));
    const after = {seed: RP.set.seed, edits: JSON.stringify(RP.set.edits), sheetHidden: document.querySelector('#articSheet').classList.contains('hide')};
    return {before, after, changed: before.seed !== after.seed};
  })()`);

  // 11) 들어보기 / 멈추기: .now 나타남·사라짐, 도중 멈춤, 두 번 빠르게 누르기, 재생 중 설정 변경
  out.play = await c.ev(`(async()=>{
    Object.assign(RP.set,{mode:'rhythm',level:1,meter:'4/4',bars:2,bpm:100,artic:'none',edits:{}}); RP.rebuild();
    const r = {};
    document.querySelector('#playBtn').click();
    await new Promise(res=>setTimeout(res,400));
    r.duringPlay = {nowCount: document.querySelectorAll('#score .now').length, btnText: document.querySelector('#playBtn').textContent};
    await new Promise(res=>setTimeout(res,400));
    document.querySelector('#playBtn').click(); // 멈추기 도중에
    await new Promise(res=>setTimeout(res,50));
    r.afterStopMidway = {nowCount: document.querySelectorAll('#score .now').length, btnText: document.querySelector('#playBtn').textContent};
    // 두 번 빠르게 누르기 (재생->재생 클릭 두번 연속)
    document.querySelector('#playBtn').click(); await new Promise(res=>setTimeout(res,10));
    document.querySelector('#playBtn').click(); await new Promise(res=>setTimeout(res,10));
    r.doubleClick = {btnText: document.querySelector('#playBtn').textContent, nowCount: document.querySelectorAll('#score .now').length};
    // 재생 중 설정 바꾸기
    document.querySelector('#playBtn').click(); await new Promise(res=>setTimeout(res,300)); // 재생 시작
    const wasPlaying = document.querySelector('#playBtn').textContent;
    const meterSel = document.querySelector('#meter'); meterSel.value='3/4'; meterSel.dispatchEvent(new Event('change')); await new Promise(res=>setTimeout(res,300));
    r.changeWhilePlaying = {before: wasPlaying, after: document.querySelector('#playBtn').textContent, meter: RP.set.meter, nowCount: document.querySelectorAll('#score .now').length};
    // 끝까지 재생 완료시 자동으로 버튼 원복되는지 (짧은 4/4 2마디 100bpm 은 몇 초)
    RP.set.artic='none'; RP.set.edits={}; RP.set.meter='2/4'; RP.set.bars=1; RP.set.bpm=200; RP.rebuild();
    document.querySelector('#playBtn').click();
    for (let i=0;i<15;i++){ await new Promise(res=>setTimeout(res,300)); if (document.querySelector('#playBtn').textContent.includes('들어보기')) break; }
    r.autoStopAfterEnd = {btnText: document.querySelector('#playBtn').textContent, nowCount: document.querySelectorAll('#score .now').length};
    return r;
  })()`);

  // 12) 공유 링크 (headless 에서 clipboard 실패 가능성 → 대체 동작 확인)
  out.share = await c.ev(`(async()=>{
    Object.assign(RP.set,{mode:'melody',meter:'6/8',level:2,bars:3,inst:'trumpet',key:'F',bpm:90,artic:'auto',pickup:'off',edits:{}}); RP.rebuild();
    const before = location.hash;
    let clipOk = null, clipText=null;
    try { clipText = await navigator.clipboard.readText(); clipOk = true; } catch(e) { clipOk = false; }
    document.querySelector('#shareBtn').click();
    await new Promise(res=>setTimeout(res,400));
    const toastText = document.querySelector('#toast').textContent;
    const toastOn = document.querySelector('#toast').classList.contains('on');
    const after = location.hash;
    let clipText2=null, clipErr=null;
    try { clipText2 = await navigator.clipboard.readText(); } catch(e) { clipErr = e.message; }
    return {before, after, toastText, toastOn, clipOkBefore: clipOk, clipText2, clipErr};
  })()`);

  // 13) 폼-상태 동기화: 값 바꾼 뒤 새로고침(로컬 저장) 확인
  out.reloadSync = await c.ev(`(()=>{ Object.assign(RP.set,{mode:'melody',meter:'9/8',bars:6,pickup:'on',artic:'manual',inst:'horn',key:'G',level:3,bpm:150}); RP.rebuild(); return {seed:RP.set.seed}; })()`);
  await c.go(BASE);
  out.afterReload = await c.ev(`({
    mode:RP.set.mode, meter:RP.set.meter, bars:RP.set.bars, pickup:RP.set.pickup, artic:RP.set.artic, inst:RP.set.inst, key:RP.set.key, level:RP.set.level, bpm:RP.set.bpm,
    formMode: document.querySelector('#modeSeg [aria-pressed=true]')?.dataset.v,
    formMeter: document.querySelector('#meter').value,
    formBars: document.querySelector('#bars').value,
    formPickup: document.querySelector('#pickup').value,
    formArtic: document.querySelector('#artic').value,
    formInst: document.querySelector('#inst').value,
    formKey: document.querySelector('#key').value,
    formLevel: document.querySelector('#levelSeg [aria-pressed=true]')?.dataset.v,
    formBpmRange: document.querySelector('#bpmRange').value,
    formBpmNum: document.querySelector('#bpmNum').value,
  })`);

  console.log(JSON.stringify(out, null, 1));
  await c.shot('qa-a/a1-final.png');
};
