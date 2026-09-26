// QA-A: 아티큘레이션 편집 시트 - 정밀 조사
const BASE = 'http://127.0.0.1:8771/';
module.exports = async (c) => {
  await c.size(390, 844);
  await c.go(BASE);
  await c.ev(`(()=>{ indexedDB.deleteDatabase('rhythm-practice'); localStorage.clear(); })()`);
  await c.go(BASE);
  const out = {};

  // helper to tap a hit id
  const tapFn = `const tap=id=>{const host=document.querySelector('#score'); const h=host._hits.find(x=>x.id===id); const rc=host.getBoundingClientRect(); const s=host._scale;
    host.dispatchEvent(new MouseEvent('click',{bubbles:true,clientX:rc.left+h.x*s,clientY:rc.top+6+((h.y0+h.y1)/2)*s}));};`;

  // 1) 새 악보를 시트 열린 채로 누르면? (더 긴 곡 -> 짧은 곡으로 줄이면서 selected id 가 범위 밖이 되는 경우까지)
  out.newWhileSheetOpen = await c.ev(`(()=>{
    ${tapFn}
    Object.assign(RP.set,{mode:'melody',level:1,meter:'4/4',bars:8,inst:'flute',key:'C',artic:'manual',seed:1,edits:{}}); RP.rebuild();
    const lastId = RP.score.events.length-1;
    tap(lastId);
    const before = { open: !document.querySelector('#articSheet').classList.contains('hide'), title: document.querySelector('#sheetTitle').textContent, chips: document.querySelector('#sheetChips').innerHTML.length };
    // 마디 수를 크게 줄여서(구조 변경) 새 악보를 누른다 -> events 개수가 확 줄어듦
    document.querySelector('#bars').value='2'; document.querySelector('#bars').dispatchEvent(new Event('change'));
    document.querySelector('#newBtn').click();
    const afterEventsLen = RP.score.events.length;
    const stillOpen = !document.querySelector('#articSheet').classList.contains('hide');
    let clickChipError = null;
    try { document.querySelector('#sheetChips button')?.click(); } catch(e) { clickChipError = String(e); }
    return { before, lastId, afterEventsLen, stillOpen, lastIdNowValid: lastId < afterEventsLen, clickChipError, chipsAfter: document.querySelector('#sheetChips').innerHTML.length };
  })()`);

  // 2) 구조 바꾸는 다른 컨트롤(박자표)도 시트 열어둔 채 바꾸면?
  out.meterChangeWhileSheetOpen = await c.ev(`(()=>{
    ${tapFn}
    document.querySelector('#articSheet').classList.contains('hide') || document.querySelector('#sheetClose').click();
    Object.assign(RP.set,{mode:'melody',level:1,meter:'4/4',bars:4,inst:'flute',key:'C',artic:'manual',seed:2,edits:{}}); RP.rebuild();
    const id0 = RP.score.events.findIndex(e=>!e.rest);
    tap(id0);
    const openBefore = !document.querySelector('#articSheet').classList.contains('hide');
    const meterSel = document.querySelector('#meter'); meterSel.value='7/8'; meterSel.dispatchEvent(new Event('change'));
    return { openBefore, openAfter: !document.querySelector('#articSheet').classList.contains('hide'), newMeter: RP.set.meter, chipsHTML: document.querySelector('#sheetChips').innerHTML.slice(0,60) };
  })()`);

  // 3) 모든 칩 클릭 (스타카토/스타카티시모/테누토/악센트/마르카토/페르마타(마지막 음만)/슬러/모두지우기), 상호배타 그룹 확인
  out.allChips = await c.ev(`(()=>{
    ${tapFn}
    document.querySelector('#sheetClose').click();
    Object.assign(RP.set,{mode:'melody',level:1,meter:'4/4',bars:2,inst:'flute',key:'C',artic:'manual',seed:3,edits:{}}); RP.rebuild();
    const firstNote = RP.score.events.find(e=>!e.rest);
    tap(firstNote.id);
    const chipKeys = [...document.querySelectorAll('#sheetChips .chip')].map(b=>b.dataset.k);
    const seq = [];
    for (const k of ['stac','stacc','ten','acc','marc']) {
      document.querySelector(\`#sheetChips [data-k="\${k}"]\`).click();
      seq.push({k, artic: RP.score.events[firstNote.id].artic.slice(), pressed: document.querySelector(\`#sheetChips [data-k="\${k}"]\`).getAttribute('aria-pressed')});
    }
    // 페르마타 칩 존재 여부(첫 음이라 없어야 함), 마지막 음에서는 있어야 함
    const fermOnFirst = !!document.querySelector('#sheetChips [data-k="ferm"]');
    document.querySelector('#sheetClose').click();
    const lastEv = RP.score.events[RP.score.events.length-1];
    tap(lastEv.id);
    const fermOnLast = !!document.querySelector('#sheetChips [data-k="ferm"]');
    document.querySelector('#sheetChips [data-k="ferm"]').click();
    const fermState = RP.score.events[lastEv.id].artic.slice();
    document.querySelector('#sheetChips [data-k="clear"]').click();
    const clearedState = RP.score.events[lastEv.id].artic.slice();
    return { chipKeys, seq, fermOnFirst, fermOnLast, fermState, clearedState };
  })()`);

  // 4) 쉼표를 눌렀을 때: 페르마타만 나와야 함 (쉼표에 stac 등 안 됨)
  out.restTap = await c.ev(`(()=>{
    ${tapFn}
    document.querySelector('#sheetClose').click();
    Object.assign(RP.set,{mode:'melody',level:2,meter:'4/4',bars:2,inst:'flute',key:'C',artic:'manual',seed:10,edits:{}}); RP.rebuild();
    const restEv = RP.score.events.find(e=>e.rest);
    if (!restEv) return {found:false};
    tap(restEv.id);
    const chipKeys = [...document.querySelectorAll('#sheetChips .chip')].map(b=>b.dataset.k);
    const title = document.querySelector('#sheetTitle').textContent;
    return { found:true, id: restEv.id, isLast: restEv.id===RP.score.events.length-1, chipKeys, title };
  })()`);

  // 5) 슬러: 생성 -> 늘리기(바로 뒤 음에서 누름) -> 안의 음을 눌러 지우기, 같은 음끼리는 슬러 안 만들어지는지, 쉼표 뒤에서 안내 토스트
  out.slur = await c.ev(`(()=>{
    ${tapFn}
    document.querySelector('#sheetClose').click();
    Object.assign(RP.set,{mode:'melody',level:1,meter:'4/4',bars:4,inst:'flute',key:'C',artic:'manual',seed:20,edits:{}}); RP.rebuild();
    const notes = RP.score.events.filter(e=>!e.rest);
    const a = notes[0].id;
    tap(a);
    document.querySelector('#sheetChips [data-k="slur"]').click();
    const afterCreate = JSON.stringify(RP.score.slurs);
    // 슬러 바로 뒤 음에서 눌러 늘리기 (다음 음이 notes[1] 이라 가정, 슬러 끝이 notes[1] 일 것)
    const endId = RP.score.slurs[0] ? RP.score.slurs[0][1] : null;
    let afterExtend = null;
    if (endId != null) { document.querySelector('#sheetClose').click(); tap(endId); document.querySelector('#sheetChips [data-k="slur"]').click(); afterExtend = JSON.stringify(RP.score.slurs); }
    // 슬러 안의 음(시작음)을 눌러 지우기
    document.querySelector('#sheetClose').click(); tap(a);
    const inSlurChipPressed = document.querySelector('#sheetChips [data-k="slur"]').getAttribute('aria-pressed');
    document.querySelector('#sheetChips [data-k="slur"]').click();
    const afterRemove = JSON.stringify(RP.score.slurs);
    return { afterCreate, endId, afterExtend, inSlurChipPressed, afterRemove };
  })()`);

  // 6) 모두 지우기: 아티큘레이션+슬러 둘 다 지워지는지 (음이 슬러에 속했을 때)
  out.clearAll = await c.ev(`(()=>{
    ${tapFn}
    document.querySelector('#sheetClose').click();
    Object.assign(RP.set,{mode:'melody',level:1,meter:'4/4',bars:4,inst:'flute',key:'C',artic:'manual',seed:21,edits:{}}); RP.rebuild();
    const notes = RP.score.events.filter(e=>!e.rest);
    tap(notes[0].id); document.querySelector('#sheetChips [data-k="stac"]').click(); document.querySelector('#sheetChips [data-k="slur"]').click();
    const before = { artic: RP.score.events[notes[0].id].artic.slice(), slurs: JSON.stringify(RP.score.slurs) };
    document.querySelector('#sheetClose').click(); tap(notes[0].id);
    document.querySelector('#sheetChips [data-k="clear"]').click();
    const after = { artic: RP.score.events[notes[0].id].artic.slice(), slurs: JSON.stringify(RP.score.slurs) };
    return { before, after };
  })()`);

  // 7) 닫기 버튼, Escape, 바깥(악보 밖) 탭
  out.closing = await c.ev(`(()=>{
    ${tapFn}
    Object.assign(RP.set,{mode:'melody',level:1,meter:'4/4',bars:2,inst:'flute',key:'C',artic:'manual',seed:22,edits:{}}); RP.rebuild();
    const id0 = RP.score.events.find(e=>!e.rest).id; tap(id0);
    const openAfterTap = !document.querySelector('#articSheet').classList.contains('hide');
    document.querySelector('#sheetClose').click();
    const afterCloseBtn = !document.querySelector('#articSheet').classList.contains('hide');
    tap(id0);
    window.dispatchEvent(new KeyboardEvent('keydown', {key:'Escape'}));
    const afterEscape = !document.querySelector('#articSheet').classList.contains('hide');
    tap(id0);
    const openBeforeOutsideTap = !document.querySelector('#articSheet').classList.contains('hide');
    // 악보 바깥(설정 카드) 탭 - 실제 다른 요소 클릭
    document.querySelector('#setBox summary, #setBox h2, #setBox').dispatchEvent(new MouseEvent('click',{bubbles:true}));
    const afterOutsideTapOnCard = !document.querySelector('#articSheet').classList.contains('hide');
    // 악보 안이지만 음표 아닌 빈 공간 탭 (좌표를 아주 멀리)
    const host=document.querySelector('#score'); const rc=host.getBoundingClientRect();
    host.dispatchEvent(new MouseEvent('click',{bubbles:true,clientX:rc.left+2,clientY:rc.top+2}));
    const afterEmptyScoreTap = !document.querySelector('#articSheet').classList.contains('hide');
    return { openAfterTap, afterCloseBtn, afterEscape, openBeforeOutsideTap, afterOutsideTapOnCard, afterEmptyScoreTap };
  })()`);

  // 8) 자동(auto) 모드에서 음표를 눌러도 편집 시트가 안 열려야 하는지? artic='none'/'auto' 클릭 동작
  out.autoModeTap = await c.ev(`(()=>{
    ${tapFn}
    document.querySelector('#sheetClose').click();
    Object.assign(RP.set,{mode:'melody',level:2,meter:'4/4',bars:2,inst:'flute',key:'C',artic:'auto',edits:{},seed:30}); RP.rebuild();
    const id0 = RP.score.events.find(e=>!e.rest).id;
    tap(id0);
    const openInAuto = !document.querySelector('#articSheet').classList.contains('hide');
    const editsBefore = JSON.stringify(RP.set.edits);
    document.querySelector('#sheetChips [data-k="stac"]')?.click();
    const editsAfter = JSON.stringify(RP.set.edits);
    const articModeAfterEdit = RP.set.artic;
    return { openInAuto, editsBefore, editsAfter, articModeAfterEdit };
  })()`);

  console.log(JSON.stringify(out, null, 1));
  await c.shot('qa-a/a2-final.png');
};
