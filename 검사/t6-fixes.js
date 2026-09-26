// 이번 점검에서 고친 버그를 실제 브라우저에서 확인
const BASE = process.env.URL0 || 'http://127.0.0.1:8765/';
module.exports = async (c) => {
  await c.size(390, 844);
  await c.go(BASE);
  await c.ev(`(async()=>{ indexedDB.deleteDatabase('rhythm-practice'); localStorage.clear(); })()`);
  await c.go(BASE);
  const out = {};
  // 1) 빔 음표의 아티큘레이션이 머리 쪽에 붙는지 (VexFlow 그린 뒤 위치 비교)
  out.artSide = await c.ev(`(()=>{ let bad=0,tot=0;
    for (let s=1;s<=25;s++){ Object.assign(RP.set,{mode:'melody',level:3,meter:'4/4',bars:4,inst:'clarinet',key:'Bb',artic:'auto',seed:s,edits:{}}); RP.rebuild();
      for (const e of RP.score.events){ if(!e.artic.some(a=>['stac','stacc','ten','acc'].includes(a))) continue;
        const g=document.getElementById('vf-ev'+e.id); if(!g) continue;
        const head=g.querySelector('.vf-notehead')||g; const hb=head.getBBox();
        const arts=[...document.querySelectorAll('.vf-articulation')].filter(a=>{const b=a.getBBox(); return Math.abs((b.x+b.width/2)-(hb.x+hb.width/2))<8;});
        const stem=g.querySelector('.vf-stem'); if(!stem||!arts.length) continue; const sb=stem.getBBox();
        const stemUp = sb.y < hb.y - 2;
        for(const a of arts){ const ab=a.getBBox(); tot++; const above = ab.y+ab.height/2 < hb.y+hb.height/2; if (above===stemUp) bad++; }
      } }
    return {bad,tot}; })()`);
  // 2) 공유 링크: 열고 나면 주소에서 사라지고, 바꾼 설정이 새로고침 뒤에도 남는지
  const code = await c.ev(`btoa(unescape(encodeURIComponent(Core.encodeSet({mode:'rhythm',meter:'3/4',level:2,bars:8,key:'C',inst:'flute',bpm:100,pickup:'off',artic:'auto',seed:123,edits:{}}))))`);
  await c.go(BASE + '#' + code);
  out.shareOpen = await c.ev(`({hash:location.hash, bars:RP.set.bars, seed:RP.set.seed, pickup:RP.set.pickup})`);
  await c.ev(`(()=>{ const s=document.querySelector('#bars'); s.value='2'; s.dispatchEvent(new Event('change')); })()`);
  await c.go(BASE);
  out.afterReload = await c.ev(`({bars:RP.set.bars, seed:RP.set.seed})`);
  // 3) 열린 탭에서 두 번째 링크
  const code2 = await c.ev(`btoa(unescape(encodeURIComponent(Core.encodeSet({mode:'rhythm',meter:'6/8',level:1,bars:4,key:'C',inst:'flute',bpm:90,pickup:'auto',artic:'auto',seed:777,edits:{}}))))`);
  await c.ev(`location.hash = ${JSON.stringify(code2)}`); await c.sleep(600);
  out.secondLink = await c.ev(`({meter:RP.set.meter, seed:RP.set.seed, drawn: RP.score.set.seed})`);
  // 4) 망가진 링크
  await c.ev(`location.hash = ${JSON.stringify(Buffer.from(JSON.stringify({ m: 'm', t: '4/4', l: 2, b: '4', e: { a: { 0: 5 }, s: [5] } })).toString('base64'))}`); await c.sleep(600);
  out.badLink = await c.ev(`({svg: !!document.querySelector('#score svg'), err: document.querySelector('#score .placeholder')?.textContent||'', bars: RP.set.bars})`);
  // 5) 가상 연주 채점(Worker) + 다시 연습이 기록을 바꾸지 않는지
  out.self = await c.ev(`(async()=>{ Object.assign(RP.set,{mode:'melody',level:2,meter:'4/4',bars:4,inst:'tuba',key:'F',artic:'auto',seed:42,edits:{}}); RP.rebuild();
    document.querySelector('#selfPerfect').click(); await new Promise(r=>setTimeout(r,4000));
    const total=document.querySelector('#resTotal').textContent; const before=JSON.stringify(RPX.take.set.edits);
    document.querySelector('#resAgain').click(); await new Promise(r=>setTimeout(r,300));
    RP.set.artic='manual'; RP.set.edits={a:{2:['acc']}};
    return {total, same: JSON.stringify(RPX.take.set.edits)===before, worker: typeof Worker } })()`);
  // 6) 저장소: 없는 id → null
  out.dbMissing = await c.ev(`(async()=>{ await new Promise(r=>setTimeout(r,300)); const v = await RPX.DB.get('없는-id'); return v===undefined||v===null ? 'ok' : String(v) })()`);
  // 7) 페르마타는 마지막 음에만, 슬러 눌러 지우기
  out.sheet = await c.ev(`(()=>{ document.querySelector('nav.tabs [data-tab=practice]').click();
    Object.assign(RP.set,{mode:'melody',level:1,meter:'4/4',bars:2,inst:'flute',key:'C',artic:'manual',seed:9,edits:{}}); RP.rebuild();
    const host=document.querySelector('#score'); const s=host._scale; const rc=host.getBoundingClientRect();
    const tap=id=>{const h=host._hits.find(x=>x.id===id); host.dispatchEvent(new MouseEvent('click',{bubbles:true,clientX:rc.left+h.x*s,clientY:rc.top+6+((h.y0+h.y1)/2)*s}));};
    const first = RP.score.events.find(e=>!e.rest).id; tap(first);
    const fermFirst = !!document.querySelector('#sheetChips [data-k=ferm]');
    document.querySelector('#sheetChips [data-k=slur]').click(); const s1=JSON.stringify(RP.score.slurs);
    const endId = RP.score.slurs[0] && RP.score.slurs[0][1]; tap(endId); document.querySelector('#sheetChips [data-k=slur]').click(); const s2=JSON.stringify(RP.score.slurs);
    const last = RP.score.events.length-1; tap(last); const fermLast = !!document.querySelector('#sheetChips [data-k=ferm]');
    const sheetBottom = getComputedStyle(document.querySelector('#articSheet')).bottom;
    return {fermFirst, fermLast, s1, s2, sheetBottom}; })()`);
  // 8) 녹음 중 설정 바꾸기 막힘
  out.lock = await c.ev(`(async()=>{ document.querySelector('#articSheet .btn').click(); Object.assign(RP.set,{artic:'auto',edits:{}}); RP.rebuild();
    const seed0 = RP.score.set.seed; document.querySelector('#recBtn').click(); await new Promise(r=>setTimeout(r,1500));
    document.querySelector('#newBtn').click(); const m=document.querySelector('#meter'); m.value='3/4'; m.dispatchEvent(new Event('change'));
    const r = { seedSame: RP.score.set.seed===seed0, meter: RP.set.meter, status: document.querySelector('#recStatus').textContent };
    document.querySelector('#recBtn').click(); await new Promise(r=>setTimeout(r,300)); r.after=document.querySelector('#recStatus').textContent; return r; })()`);
  console.log(JSON.stringify(out, null, 1));
  await c.shot('fix-final.png');
};
