const BASE = 'http://127.0.0.1:8771/';
module.exports = async (c) => {
  await c.size(390, 844);
  await c.go(BASE);
  await c.ev(`(()=>{ indexedDB.deleteDatabase('rhythm-practice'); localStorage.clear(); })()`);
  await c.go(BASE);
  const out = {};
  const tapFn = `const tap=id=>{const host=document.querySelector('#score'); const h=host._hits.find(x=>x.id===id); const rc=host.getBoundingClientRect(); const s=host._scale;
    host.dispatchEvent(new MouseEvent('click',{bubbles:true,clientX:rc.left+h.x*s,clientY:rc.top+6+((h.y0+h.y1)/2)*s}));};`;

  // A) 재생 하이라이트: AudioContext 상태·now 클래스 직접 추적
  out.playHighlight = await c.ev(`(async()=>{
    Object.assign(RP.set,{mode:'rhythm',level:1,meter:'4/4',bars:2,bpm:80,artic:'none',edits:{}}); RP.rebuild();
    document.querySelector('#playBtn').click();
    const samples = [];
    for (let i=0;i<20;i++){ await new Promise(r=>setTimeout(r,200));
      samples.push({t:i*200, now: document.querySelectorAll('#score .now').length, btn: document.querySelector('#playBtn').textContent, actxState: (window.RPX&&RPX.actx)?RPX.actx.state:'?'}); }
    const maxNow = Math.max(...samples.map(s=>s.now));
    return { maxNow, samples: samples.slice(0,10), rpxKeys: window.RPX?Object.keys(RPX):[] };
  })()`);

  // B) 쉼표를 눌렀을 때 (level 1 rhythm 은 쉼표가 흔함)
  out.restTap = await c.ev(`(()=>{
    ${tapFn}
    document.querySelector('#sheetClose')?.click();
    Object.assign(RP.set,{mode:'rhythm',level:1,meter:'4/4',bars:4,artic:'manual',seed:5,edits:{}}); RP.rebuild();
    const restEv = RP.score.events.find(e=>e.rest);
    if (!restEv) return {found:false};
    tap(restEv.id);
    const chipKeys = [...document.querySelectorAll('#sheetChips .chip')].map(b=>b.dataset.k);
    const title = document.querySelector('#sheetTitle').textContent;
    const isLast = restEv.id===RP.score.events.length-1;
    return { found:true, id: restEv.id, isLast, chipKeys, title };
  })()`);
  // rhythm 안되면 melody 로 재시도, 여러 seed 시도
  if (!out.restTap.found) {
    out.restTapRetry = await c.ev(`(()=>{
      ${tapFn}
      document.querySelector('#sheetClose')?.click();
      let restEv=null, seed=0;
      for (seed=1; seed<40 && !restEv; seed++){ Object.assign(RP.set,{mode:'rhythm',level:1,meter:'3/4',bars:4,artic:'manual',seed,edits:{}}); RP.rebuild(); restEv = RP.score.events.find(e=>e.rest); }
      if (!restEv) return {found:false};
      tap(restEv.id);
      const chipKeys = [...document.querySelectorAll('#sheetChips .chip')].map(b=>b.dataset.k);
      return { found:true, seed:seed-1, id: restEv.id, isLast: restEv.id===RP.score.events.length-1, chipKeys, title: document.querySelector('#sheetTitle').textContent };
    })()`);
  }

  // C) 슬러 "늘리기" 제대로: 슬러 [a,b] 뒤 음(b+1)을 누르면 늘어나야 함
  out.slurExtendCorrect = await c.ev(`(()=>{
    ${tapFn}
    document.querySelector('#sheetClose')?.click();
    Object.assign(RP.set,{mode:'melody',level:1,meter:'4/4',bars:4,inst:'flute',key:'C',artic:'manual',seed:20,edits:{}}); RP.rebuild();
    const notes = RP.score.events.filter(e=>!e.rest);
    tap(notes[0].id); document.querySelector('#sheetChips [data-k="slur"]').click();
    const afterCreate = JSON.stringify(RP.score.slurs);
    const b = RP.score.slurs[0][1];
    const afterNoteId = b+1 <= RP.score.events.length-1 ? b+1 : null;
    let afterExtend = null, afterExtendNoteExists=null;
    if (afterNoteId != null && !RP.score.events[afterNoteId].rest) {
      document.querySelector('#sheetClose').click(); tap(afterNoteId);
      afterExtendNoteExists = true;
      document.querySelector('#sheetChips [data-k="slur"]').click();
      afterExtend = JSON.stringify(RP.score.slurs);
    }
    return { afterCreate, b, afterNoteId, afterExtendNoteExists, afterExtend };
  })()`);

  // D) 같은 높이 음끼리 수동으로 슬러를 만들 수 있는지 (자동 모드는 막지만 수동은?)
  out.samePitchManualSlur = await c.ev(`(()=>{
    ${tapFn}
    document.querySelector('#sheetClose')?.click();
    let found=null;
    for (let seed=1; seed<60 && !found; seed++){
      Object.assign(RP.set,{mode:'melody',level:1,meter:'4/4',bars:4,inst:'flute',key:'C',artic:'manual',seed,edits:{}}); RP.rebuild();
      const notes = RP.score.events.filter(e=>!e.rest && !e.tie);
      for (let i=0;i<notes.length-1;i++){
        if (notes[i+1].id===notes[i].id+1 && notes[i].pitch && notes[i+1].pitch && notes[i].pitch.d===notes[i+1].pitch.d && notes[i].pitch.alt===notes[i+1].pitch.alt) { found={seed, a:notes[i].id, b:notes[i+1].id}; break; }
      }
    }
    if (!found) return {found:false};
    tap(found.a);
    document.querySelector('#sheetChips [data-k="slur"]').click();
    const slurs = JSON.stringify(RP.score.slurs);
    const created = RP.score.slurs.some(([x,y])=>x===found.a && y===found.b);
    return { found, slurs, created };
  })()`);

  console.log(JSON.stringify(out, null, 1));
  await c.shot('qa-a/a3-playhighlight.png');
};
