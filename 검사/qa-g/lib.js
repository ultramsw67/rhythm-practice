// qa-g: 보관함 — 목록·난이도 이름·옛 기록·결과 보기·이 악보로 연습·삭제·백업/복원
module.exports = async (c) => {
  await c.size(390, 844);
  await c.go('http://127.0.0.1:8765/');
  await c.ev(`window.__errs=[]; window.addEventListener('error',e=>__errs.push(String(e.message))); window.addEventListener('unhandledrejection',e=>__errs.push('rej '+String(e.reason)));
    window.__dl=[]; const oc=HTMLAnchorElement.prototype.click; HTMLAnchorElement.prototype.click=function(){ if(this.download){ __dl.push({name:this.download, href:this.href}); return; } return oc.call(this); }; 1`);
  const H = `const sl=ms=>new Promise(r=>setTimeout(r,ms)); const tab=n=>document.querySelector('nav.tabs [data-tab="'+n+'"], nav.tabs button[data-t="'+n+'"]');
    const cards=()=>[...document.querySelectorAll('#libList .take')].map(k=>({id:k.dataset.id, nm:k.querySelector('.nm').textContent, meta:k.querySelector('.muted').textContent, sc:k.querySelector('.sc').textContent}));
    const btn=(id,a)=>document.querySelector('#libList .take[data-id="'+id+'"] [data-a="'+a+'"]');`;
  // 옛 기록 만들기: gen 0 으로 가상 연주 → set.gen 지워 저장
  const mk = await c.ev(`(async()=>{ ${H}
    Object.assign(RP.set,{gen:0,drum:'',mode:'melody',level:2,meter:'3/4',bars:4,key:'F',inst:'clarinet',bpm:90,pickup:'auto',artic:'auto',seed:555,edits:{}}); RP.rebuild();
    const legacyEv = RP.score.events.length;
    await RPX.selfTest(false); await sl(3000);
    const t = Object.assign({}, RPX.take); t.set = JSON.parse(JSON.stringify(t.set)); delete t.set.gen; t.id='legacy-nogen'; t.name='옛 기록 gen없음'; t.created=Date.now()-86400000;
    const ok1 = await RPX.DB.put(t);
    const t2 = Object.assign({}, t, { id:'legacy-gen0', name:'옛 기록 gen0', set: Object.assign({}, t.set, {gen:0, level:3, mode:'rhythm'}) });
    const ok2 = await RPX.DB.put(t2);
    // 아주 옛 기록: level 없음·edits 없음
    const t3 = Object.assign({}, t, { id:'legacy-min', name:'옛 기록 최소', set: { mode:'rhythm', meter:'4/4', bars:4, bpm:80, seed:9 } });
    const ok3 = await RPX.DB.put(t3);
    return { legacyEv, total: t.result.total, ok1, ok2, ok3 }; })()`);
  console.log('MAKE', JSON.stringify(mk));
  await c.go('http://127.0.0.1:8765/');
  await c.ev(`window.__errs=[]; window.addEventListener('error',e=>__errs.push(String(e.message))); window.addEventListener('unhandledrejection',e=>__errs.push('rej '+String(e.reason)));
    window.__dl=[]; const oc=HTMLAnchorElement.prototype.click; HTMLAnchorElement.prototype.click=function(){ if(this.download){ __dl.push({name:this.download, href:this.href}); return; } return oc.call(this); }; 1`);
  const tabs = await c.ev(`[...document.querySelectorAll('nav.tabs button, nav.tabs a')].map(b=>b.outerHTML.slice(0,90))`);
  console.log('TABS', JSON.stringify(tabs));
  const L = await c.ev(`(async()=>{ ${H} await RPX.renderLibrary(); await sl(300); const cs=cards();
    return { status: document.querySelector('#libStatus').textContent, n: cs.length, metas: cs.map(k=>k.id.slice(0,12)+' | '+k.sc+' | '+k.meta.replace(/^.*?· /,'')) }; })()`);
  console.log('LIST', JSON.stringify(L, null, 1));
  // 옛 기록 결과 보기
  for (const id of ['legacy-nogen', 'legacy-gen0', 'legacy-min']) {
    const R = await c.ev(`(async()=>{ ${H} await RPX.renderLibrary(); await sl(200); btn('${id}','result').click(); await sl(900);
      const host=document.querySelector('#resScore');
      return { total: document.querySelector('#resTotal').textContent, title: document.querySelector('#resTitle').textContent, meta: document.querySelector('#resMeta').textContent, svg: host.querySelectorAll('svg').length, hits:(host._hits||[]).length, colored: host.querySelectorAll('[fill^="#"],[style*="fill"]').length, evs: host._sc && host._sc.events.length, tips: document.querySelector('#resTips').textContent.slice(0,120), errs: __errs.slice() }; })()`);
    console.log('RESULT', id, JSON.stringify(R));
  }
  // 옛 기록으로 연습
  const P = await c.ev(`(async()=>{ ${H} await RPX.renderLibrary(); await sl(200); btn('legacy-nogen','practice').click(); await sl(700);
    return { gen: RP.set.gen, level: RP.set.level, mode: RP.set.mode, meter: RP.set.meter, seed: RP.set.seed, hint: document.querySelector('#levelHint').textContent, evs: RP.score.events.length, sum: document.querySelector('#setSum').textContent, pressed: document.querySelectorAll('#levelSeg [aria-pressed=true]').length, practiceVis: document.querySelector('#tab-practice').offsetParent!==null }; })()`);
  console.log('PRACTICE legacy', JSON.stringify(P));
  const P2 = await c.ev(`(async()=>{ ${H} await RPX.renderLibrary(); const cs=cards(); const nw=cs.find(k=>!k.id.startsWith('legacy')); btn(nw.id,'practice').click(); await sl(700);
    return { id: nw.id, gen: RP.set.gen, level: RP.set.level, drum: RP.set.drum, hint: document.querySelector('#levelHint').textContent.slice(0,40), pressed: document.querySelectorAll('#levelSeg [aria-pressed=true]').length }; })()`);
  console.log('PRACTICE new', JSON.stringify(P2));
  // 이름 바꾸기
  const RN = await c.ev(`(async()=>{ ${H} await RPX.renderLibrary(); btn('legacy-min','rename').click(); await sl(100); const inp=document.querySelector('#libList .take[data-id="legacy-min"] .nm input'); inp.value='바꾼 이름 <b>x</b>'; document.querySelector('#libList .take[data-id="legacy-min"] [data-a=saveName]').click(); await sl(600); return cards().find(k=>k.id==='legacy-min').nm; })()`);
  console.log('RENAME', RN);
  // 백업 내보내기
  const BK = await c.ev(`(async()=>{ ${H} document.querySelector('#bakOut').click(); for(let i=0;i<40 && !__dl.length;i++) await sl(250); const d=__dl[__dl.length-1]; if(!d) return {none:true}; const txt=await (await fetch(d.href)).text(); window.__bak=txt; const j=JSON.parse(txt); return { name:d.name, n:j.takes.length, app:j.app, hasAudio: j.takes.every(t=>t.audio64 && t.audio64.length>100), kb: Math.round(txt.length/1024) }; })()`);
  console.log('BACKUP', JSON.stringify(BK));
  // 삭제 (두 번 눌러야)
  const DL = await c.ev(`(async()=>{ ${H} await RPX.renderLibrary(); const n0=cards().length; btn('legacy-gen0','del').click(); await sl(200); const txt1=btn('legacy-gen0','del').textContent; const n1=(await RPX.DB.all()).length;
    btn('legacy-gen0','del').click(); await sl(700); const n2=cards().length;
    // 3.5초 뒤 되돌아가는지
    btn('legacy-nogen','del').click(); await sl(3900); const back=btn('legacy-nogen','del').textContent;
    return { n0, txt1, afterFirstClickDb: n1, n2, back, status: document.querySelector('#libStatus').textContent }; })()`);
  console.log('DELETE', JSON.stringify(DL));
  // 복원
  const RS = await c.ev(`(async()=>{ ${H} const inp=document.querySelector('#bakIn'); const dt=new DataTransfer(); dt.items.add(new File([__bak],'b.json',{type:'application/json'})); inp.files=dt.files; inp.dispatchEvent(new Event('change')); await sl(2500);
    const toast=document.querySelector('#toast').textContent; const n=cards().length; const hasGen0=!!cards().find(k=>k.id==='legacy-gen0');
    const dt2=new DataTransfer(); dt2.items.add(new File(['{bad'],'x.json')); inp.files=dt2.files; inp.dispatchEvent(new Event('change')); await sl(800); const toast2=document.querySelector('#toast').textContent;
    const dt3=new DataTransfer(); const j=JSON.parse(__bak); j.takes=[j.takes[0], {id:5}, Object.assign({}, j.takes[0], {id:'broken-audio', audio64:'@@@'})]; dt3.items.add(new File([JSON.stringify(j)],'y.json')); inp.files=dt3.files; inp.dispatchEvent(new Event('change')); await sl(1500); const toast3=document.querySelector('#toast').textContent;
    return { toast, n, hasGen0, toast2, toast3, n3: cards().length }; })()`);
  console.log('RESTORE', JSON.stringify(RS));
  // 복원된 기록의 소리 재생
  const PL = await c.ev(`(async()=>{ ${H} await RPX.renderLibrary(); const b=btn('legacy-gen0','play'); b.click(); await sl(800); const t=b.textContent; b.click(); await sl(200); return { playing:t, after:b.textContent }; })()`);
  console.log('PLAY', JSON.stringify(PL));
  // 빈 보관함 화면은 건드리지 않음. wav/json 받기
  const WJ = await c.ev(`(async()=>{ ${H} __dl=[]; btn('legacy-gen0','wav').click(); btn('legacy-gen0','json').click(); await sl(300); return __dl.map(d=>d.name); })()`);
  console.log('FILES', JSON.stringify(WJ));
  console.log('ERRS', JSON.stringify(await c.ev('__errs')));
  await c.shotEl('qa-g/lib.png', '#tab-library');
};
