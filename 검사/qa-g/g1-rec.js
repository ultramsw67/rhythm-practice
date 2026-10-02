// qa-g g1: 첫 사용자 → 가짜 마이크 녹음 → 결과 → 보관함 (FAKE_WAV 필요, 녹음이 맨 처음)
const SET = { gen: 3, mode: 'melody', prac: '', seed: 777, inst: 'clarinet', key: 'Bb', kref: '', meter: '4/4', level: 2, bars: 4, bpm: 96, artic: 'auto', pickup: 'auto', drum: '', bow: '', edits: {} };
module.exports = async (c) => {
  const B = 'http://127.0.0.1:8765/';
  await c.size(390, 844);
  await c.go(B);
  await c.ev(`(async()=>{ localStorage.clear(); const dbs = indexedDB.databases ? await indexedDB.databases() : []; for (const d of dbs) indexedDB.deleteDatabase(d.name); return 1; })()`);
  await c.go(B);
  const ERR = `window.__errs=[]; addEventListener('error',e=>__errs.push(String(e.message))); addEventListener('unhandledrejection',e=>__errs.push('rej '+String(e.reason)));
    window.__dl=[]; const oc=HTMLAnchorElement.prototype.click; HTMLAnchorElement.prototype.click=function(){ if(this.download){ __dl.push({name:this.download, size:0}); return; } return oc.call(this); }; 1`;
  await c.ev(ERR);
  const first = await c.ev(`({ startCard: !document.querySelector('#startCard').classList.contains('hide'), font: document.documentElement.dataset.font, setSum: document.querySelector('#setSum').textContent, modeHint: document.querySelector('#modeHint').textContent, scoreInfo: document.querySelector('#scoreInfo').textContent, latInfo: document.querySelector('#latInfo').textContent, latGo: !document.querySelector('#latGo').classList.contains('hide'), overflow: document.documentElement.scrollWidth - innerWidth, gHint: document.querySelector('#gHint').textContent })`);
  console.log('FIRST', JSON.stringify(first));
  await c.shot('qa-g/g1-first.png');
  await c.ev(`(()=>{ Object.assign(RP.set, ${JSON.stringify(SET)}); RP.syncForm && RP.syncForm(); RP.rebuild(); document.querySelector('#countIn').value='1'; })()`);
  await c.ev(`document.querySelector('#recBtn').click()`);
  // 녹음 중 잠금 확인
  await c.sleep(1500);
  const lock = await c.ev(`(()=>{ const q=s=>document.querySelector(s); const st=e=>({dis:e.disabled, pe:getComputedStyle(e).pointerEvents, op:getComputedStyle(e).opacity});
    const before = RP.set.seed; const afterNew = RP.set.seed; const libVis = null; const tabSt = st(q('nav.tabs [data-tab=library]'));
    return { recBtn: q('#recBtn').textContent, restart: !q('#recRestart').classList.contains('hide'), newBtn: st(q('#newBtn')), playBtn: st(q('#playBtn')), tab: tabSt, setBox: st(q('#setBox')), seedChanged: before!==afterNew, libVisDuringRec: libVis, count: q('#countBig').textContent, status: q('#recStatus').textContent }; })()`);
  console.log('LOCK', JSON.stringify(lock));
  const tap = async (sel) => { const p = await c.ev(`(()=>{const e=document.querySelector(${JSON.stringify(sel)}); const r=e.getBoundingClientRect(); return {x:r.left+r.width/2,y:r.top+r.height/2}})()`); for (const type of ['mousePressed','mouseReleased']) await c.send('Input.dispatchMouseEvent',{type,x:p.x,y:p.y,button:'left',clickCount:1}); };
  const s0 = await c.ev('RP.set.seed'); await tap('nav.tabs [data-tab=library]'); await tap('#newBtn');
  console.log('REALTAP', JSON.stringify(await c.ev(`({ libVis: !document.querySelector('#tab-library').classList.contains('hide'), seedChanged: RP.set.seed !== ${s0}, rec: !!RPX.rec })`)));
  await c.shot('qa-g/g1-recording.png', false);
  let st = '';
  for (let i = 0; i < 60; i++) { await c.sleep(1000); st = await c.ev(`document.querySelector('#recStatus').textContent`); if (/점 —|오류|못|않|멈췄/.test(st)) break; }
  await c.sleep(1500);
  const res = await c.ev(`(()=>{ const q=s=>document.querySelector(s); const R=RPX.take&&RPX.take.result; return { st, resultVis: !q('#tab-result').classList.contains('hide'), total: q('#resTotal').textContent, title: q('#resTitle').textContent, meta: q('#resMeta').textContent, parts: q('#resParts').innerText, reward: q('#resReward').innerText, rewardHidden: q('#resReward').classList.contains('hide'), tips: q('#resTips').innerText, saveHidden: q('#resSave').classList.contains('hide'), matched: R&&R.matched, count: R&&R.count, recBtn: q('#recBtn').textContent, recDis: q('#recBtn').disabled, overflow: document.documentElement.scrollWidth-innerWidth, game: q('#gameCard').innerText.replace(/\\s+/g,' ') }; })()`.replace('{ st,', '{ st: ' + JSON.stringify(st) + ','));
  console.log('RESULT', JSON.stringify(res));
  await c.shot('qa-g/g1-result.png');
  const notes = await c.ev(`(async()=>{ const host=document.querySelector('#resScore'); host.scrollIntoView(); await new Promise(r=>setTimeout(r,300)); const out=[]; const rect=host.getBoundingClientRect(), s=host._scale||1;
    for (const h of (host._hits||[]).slice(0,6)) { const cx=rect.left+h.x*s, cy=rect.top+6+((h.y0+h.y1)/2)*s; const el=document.elementFromPoint(cx,cy); (el||host).dispatchEvent(new MouseEvent('click',{bubbles:true,clientX:cx,clientY:cy})); out.push(document.querySelector('#resNote').textContent); }
    return { n: (host._hits||[]).length, out }; })()`);
  console.log('NOTES', JSON.stringify(notes));
  const play = await c.ev(`(async()=>{ const b=document.querySelector('#resPlay'); const t0=b.textContent; b.click(); await new Promise(r=>setTimeout(r,800)); const t1=b.textContent; b.click(); await new Promise(r=>setTimeout(r,500)); const t2=b.textContent; b.click(); b.click(); await new Promise(r=>setTimeout(r,500)); const t3=b.textContent; return {t0,t1,t2,t3}; })()`);
  console.log('RESPLAY', JSON.stringify(play));
  // 결과 → 같은 악보 다시
  const again = await c.ev(`(async()=>{ const q=s=>document.querySelector(s); q('#resAgain').click(); await new Promise(r=>setTimeout(r,500)); return { practice: !q('#tab-practice').classList.contains('hide'), seed: RP.set.seed, playingRes: q('#resPlay').textContent, y: scrollY, recBtnDis: q('#recBtn').disabled }; })()`);
  console.log('AGAIN', JSON.stringify(again));
  // 보관함
  const lib = await c.ev(`(async()=>{ const q=s=>document.querySelector(s); const sl=ms=>new Promise(r=>setTimeout(r,ms)); q('nav.tabs [data-tab=library]').click(); await sl(600);
    const cards=[...document.querySelectorAll('#libList .take')]; const k=cards[0]; if(!k) return {none:true, html:q('#libList').innerHTML.slice(0,300)};
    const btns=[...k.querySelectorAll('button')].map(b=>({t:b.textContent.trim(), a:b.dataset.a, h:Math.round(b.getBoundingClientRect().height)}));
    return { n: cards.length, status: q('#libStatus').textContent, text: k.innerText.replace(/\\s+/g,' '), btns }; })()`);
  console.log('LIB', JSON.stringify(lib));
  await c.shot('qa-g/g1-lib.png');
  // 듣기 버튼
  const lp = await c.ev(`(async()=>{ const sl=ms=>new Promise(r=>setTimeout(r,ms)); const b=document.querySelector('#libList .take [data-a=play]'); if(!b) return 'nobtn'; const t0=b.textContent; b.click(); await sl(700); const t1=b.textContent; const b2=document.querySelector('#libList .take [data-a=play]'); const t1b=b2.textContent; b2.click(); await sl(400); return {t0,t1,t1b,t2:document.querySelector('#libList .take [data-a=play]').textContent}; })()`);
  console.log('LIBPLAY', JSON.stringify(lp));
  // 이름 바꾸기
  const rn = await c.ev(`(async()=>{ const sl=ms=>new Promise(r=>setTimeout(r,ms)); const k=()=>document.querySelector('#libList .take'); const b=k().querySelector('[data-a=rename]'); if(!b) return 'nobtn'; b.click(); await sl(300);
    const inp=k().querySelector('input'); if(!inp) return {noinput:true, html:k().innerHTML.slice(0,400)}; inp.value='  '; const save=[...k().querySelectorAll('button')].find(x=>/저장/.test(x.textContent)); save && save.click(); await sl(400); const nmEmpty=k().querySelector('.nm')&&k().querySelector('.nm').textContent;
    const b3=k().querySelector('[data-a=rename]'); b3&&b3.click(); await sl(300); const inp2=k().querySelector('input'); if(inp2){ inp2.value='<b>내 연주</b> 첫번째 아주아주아주아주아주아주 긴 이름입니다아아아아아아아아아아아아아'; const s2=[...k().querySelectorAll('button')].find(x=>/저장/.test(x.textContent)); s2&&s2.click(); } await sl(400);
    return { nmEmpty, nm: k().querySelector('.nm').textContent, over: document.documentElement.scrollWidth-innerWidth, cardOver: k().scrollWidth-k().clientWidth }; })()`);
  console.log('RENAME', JSON.stringify(rn));
  // 결과 보기 / 이 악보로 연습
  const vw = await c.ev(`(async()=>{ const sl=ms=>new Promise(r=>setTimeout(r,ms)); const q=s=>document.querySelector(s); const b=q('#libList .take [data-a=view]')||[...q('#libList .take').querySelectorAll('button')].find(x=>/결과/.test(x.textContent)); b.click(); await sl(800);
    const o={ resVis: !q('#tab-result').classList.contains('hide'), total:q('#resTotal').textContent, rewardHidden:q('#resReward').classList.contains('hide'), title:q('#resTitle').textContent };
    q('nav.tabs [data-tab=library]').click(); await sl(500); const b2=[...q('#libList .take').querySelectorAll('button')].find(x=>/이 악보로/.test(x.textContent)); b2.click(); await sl(800); o.prac=!q('#tab-practice').classList.contains('hide'); o.seed=RP.set.seed; o.inst=RP.set.inst; return o; })()`);
  console.log('VIEW', JSON.stringify(vw));
  // 백업 내보내기 → 불러오기
  const bk = await c.ev(`(async()=>{ const sl=ms=>new Promise(r=>setTimeout(r,ms)); const q=s=>document.querySelector(s); q('nav.tabs [data-tab=library]').click(); await sl(300);
    let blobText=null; const oURL=URL.createObjectURL; URL.createObjectURL=function(b){ if(b instanceof Blob && /json/.test(b.type||'json')) b.text().then(t=>blobText=t); return oURL.call(URL,b); };
    q('#bakOut').click(); await sl(1500); const dl=__dl.slice(); const len=blobText&&blobText.length;
    // 같은 백업 다시 불러오기 (중복 생기는지)
    const n0=document.querySelectorAll('#libList .take').length;
    if (blobText) { const f=new File([blobText],'b.json',{type:'application/json'}); const dt=new DataTransfer(); dt.items.add(f); const inp=q('#bakIn'); inp.files=dt.files; inp.dispatchEvent(new Event('change',{bubbles:true})); await sl(1500); }
    const n1=document.querySelectorAll('#libList .take').length; const st1=q('#libStatus').textContent; const toast=q('#toast').textContent;
    // 잘못된 파일
    const f2=new File(['not json'],'x.json',{type:'application/json'}); const dt2=new DataTransfer(); dt2.items.add(f2); q('#bakIn').files=dt2.files; q('#bakIn').dispatchEvent(new Event('change',{bubbles:true})); await sl(800);
    return { dl, len, n0, n1, st1, toast, st2:q('#libStatus').textContent, toast2:q('#toast').textContent }; })()`);
  console.log('BACKUP', JSON.stringify(bk));
  // 소리·기록 파일 받기
  const fl = await c.ev(`(async()=>{ const sl=ms=>new Promise(r=>setTimeout(r,ms)); __dl.length=0; const k=document.querySelector('#libList .take'); const bs=[...k.querySelectorAll('button')].filter(x=>/받기/.test(x.textContent)); for(const b of bs){ b.click(); await sl(800);} return { btns: bs.map(b=>b.textContent.trim()), dl: __dl.slice() }; })()`);
  console.log('FILES', JSON.stringify(fl));
  // 삭제 (두 번)
  const del = await c.ev(`(async()=>{ const sl=ms=>new Promise(r=>setTimeout(r,ms)); const k=()=>[...document.querySelectorAll('#libList .take')]; const n0=k().length; const b=k()[0].querySelector('[data-a=del]')||[...k()[0].querySelectorAll('button')].find(x=>/삭제/.test(x.textContent)); b.click(); await sl(200); const t1=b.textContent; const n1=k().length;
    await sl(4000); const t1late=b.isConnected? b.textContent : 'gone'; b.click(); await sl(200); const t2=b.isConnected?b.textContent:'gone'; b.click(); await sl(800); return { n0, t1, n1, t1late, t2, n2:k().length, st:document.querySelector('#libStatus').textContent }; })()`);
  console.log('DEL', JSON.stringify(del));
  await c.shot('qa-g/g1-lib-after.png');
  console.log('ERRS', JSON.stringify(await c.ev(`window.__errs`)));
};
