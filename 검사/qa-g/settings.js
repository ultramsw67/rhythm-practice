// qa-g: 설정 화면 — 가상 연주·지연 보정 화면·글자 크기·설정 처음 상태로·버전
module.exports = async (c) => {
  await c.size(390, 844);
  await c.go('http://127.0.0.1:8765/');
  await c.ev(`localStorage.removeItem('rp.latency'); localStorage.removeItem('rp.startSeen'); 1`);
  await c.go('http://127.0.0.1:8765/');
  const E = `window.__errs=[]; window.addEventListener('error',e=>__errs.push(String(e.message))); window.addEventListener('unhandledrejection',e=>__errs.push('rej '+String(e.reason))); 1`;
  await c.ev(E);
  const H = `const sl=ms=>new Promise(r=>setTimeout(r,ms)); const tab=n=>document.querySelector('nav.tabs [data-tab="'+n+'"]'); const vis=q=>{const e=document.querySelector(q); return !!e && e.offsetParent!==null && !e.classList.contains('hide');};`;
  // 지연 보정 화면 열기: 연습 탭 바로가기, 처음 안내 카드
  const L = await c.ev(`(async()=>{ ${H} const o={}; o.latGoVis=vis('#latGo'); o.startCard=vis('#startCard');
    document.querySelector('#latGo').click(); await sl(600); const r=document.querySelector('#latNow').getBoundingClientRect(); o.afterLatGo={ settings: vis('#tab-settings'), latNowInView: r.top>=0 && r.bottom<=innerHeight, top: Math.round(r.top) };
    tab('practice').click(); await sl(300); const sl2=document.querySelector('#startLat'); o.startLatVis=vis('#startLat'); if (sl2) { sl2.click(); await sl(600); o.afterStartLat={ settings: vis('#tab-settings'), startCardHidden: !vis('#startCard'), seen: localStorage.getItem('rp.startSeen') }; }
    const lr=document.querySelector('#latRange'); lr.value='120'; lr.dispatchEvent(new Event('input')); await sl(100); o.latNow=document.querySelector('#latNow').textContent; o.latSrc=document.querySelector('#latSrc').textContent; tab('practice').click(); await sl(200); o.latGoAfterSet=vis('#latGo');
    return o; })()`);
  console.log('LATENCY', JSON.stringify(L));
  // 스피커 자동 측정 (가짜 기본 장치: 삐 소리) — 오류 없이 끝나는지만
  const CAL = await c.ev(`(async()=>{ ${H} tab('settings').click(); await sl(200); document.querySelector('#calSpk').click(); const msgs=[]; for (let i=0;i<30;i++){ await sl(500); const m=document.querySelector('#calMsg').textContent; if(msgs[msgs.length-1]!==m) msgs.push(m); if(!document.querySelector('#calSpk').disabled && i>2) break; }
    return { msgs, latNow: document.querySelector('#latNow').textContent, disabled: document.querySelector('#calSpk').disabled }; })()`);
  console.log('CAL', JSON.stringify(CAL));
  // 가상 연주: 여러 설정
  const cases = [
    { gen:2, drum:'', mode:'rhythm', level:1, meter:'4/4', bars:4, bpm:88, seed:11 },
    { gen:2, drum:'', mode:'rhythm', level:7, meter:'6/8', bars:4, bpm:100, seed:12 },
    { gen:2, drum:'', mode:'melody', level:4, meter:'3/4', bars:8, key:'Eb', inst:'clarinet', bpm:96, seed:13 },
    { gen:2, drum:'', mode:'melody', level:7, meter:'4/4', bars:4, key:'D', inst:'clarinet', bpm:72, seed:14 },
    { gen:2, drum:'snare', mode:'rhythm', level:5, meter:'4/4', bars:4, bpm:110, seed:15 },
    { gen:2, drum:'bass', mode:'rhythm', level:3, meter:'2/4', bars:4, bpm:90, seed:16 },
    { gen:2, drum:'cymbal', mode:'rhythm', level:6, meter:'3/4', bars:4, bpm:80, seed:17 },
    { gen:0, drum:'', mode:'melody', level:3, meter:'4/4', bars:4, key:'F', inst:'clarinet', bpm:90, seed:18 },
  ];
  for (const s of cases) {
    const R = await c.ev(`(async()=>{ ${H} Object.assign(RP.set, {pickup:'auto', artic:'auto', edits:{}}, ${JSON.stringify(s)}); RP.rebuild(); tab('settings').click(); await sl(200);
      const out={};
      for (const [k,q] of [['perfect','#selfPerfect'],['sloppy','#selfSloppy']]) { const prev=RPX.take; document.querySelector(q).click(); for(let i=0;i<60 && RPX.take===prev;i++) await sl(200); await sl(500);
        out[k]={ total: document.querySelector('#resTotal').textContent, name: RPX.take && RPX.take.name, saveBtn: vis('#resSave'), resultTab: vis('#tab-result'), svg: document.querySelectorAll('#resScore svg').length, tip: document.querySelector('#resTips').textContent.slice(0,90) }; tab('settings').click(); await sl(200); }
      return out; })()`);
    console.log('SELF', JSON.stringify(s), JSON.stringify(R));
  }
  // 가상 연주 결과 저장 버튼
  const SV = await c.ev(`(async()=>{ ${H} const n0=(await RPX.DB.all()).length; RPX.showResult(RPX.take,true); await sl(300); document.querySelector('#resSave').click(); await sl(700); const n1=(await RPX.DB.all()).length; return { n0, n1, hidden: !vis('#resSave'), toast: document.querySelector('#toast').textContent }; })()`);
  console.log('SAVE self', JSON.stringify(SV));
  // 글자 크기
  const F = await c.ev(`(async()=>{ ${H} tab('settings').click(); await sl(200); const out=[]; for (const v of ['1','3','2']) { document.querySelector('#fontSeg button[data-v="'+v+'"]').click(); await sl(300);
      out.push({ v, html: document.documentElement.style.fontSize || getComputedStyle(document.documentElement).fontSize, cls: document.documentElement.className, attr: document.documentElement.dataset.font, pressed: [...document.querySelectorAll('#fontSeg button')].map(b=>b.getAttribute('aria-pressed')).join(','), stored: localStorage.getItem('rp.font'), overX: document.documentElement.scrollWidth - innerWidth }); }
    return out; })()`);
  console.log('FONT', JSON.stringify(F));
  // 새로고침 후 글자 크기 유지
  await c.ev(`document.querySelector('#fontSeg button[data-v="3"]').click(); 1`);
  await c.go('http://127.0.0.1:8765/'); await c.ev(E);
  console.log('FONT reload', await c.ev(`[...document.querySelectorAll('#fontSeg button')].map(b=>b.getAttribute('aria-pressed')).join(',') + ' ' + getComputedStyle(document.documentElement).fontSize`));
  // 설정 처음 상태로 (두 번)
  const RS = await c.ev(`(async()=>{ ${H} Object.assign(RP.set,{mode:'melody',level:6,bpm:132,meter:'6/8',drum:'',inst:'trumpet'}); localStorage.setItem('rp.set', JSON.stringify(RP.set)); RP.rebuild();
    document.querySelector('#countIn').value='2'; document.querySelector('#libSort').value='hi'; localStorage.setItem('rp.theme','"dark"');
    tab('settings').click(); await sl(200); const nDb0=(await RPX.DB.all()).length; const b=document.querySelector('#resetAll');
    b.click(); await sl(100); const t1=b.textContent, s1=RP.set.level;
    b.click(); await sl(600); const after={ text: b.textContent, mode: RP.set.mode, level: RP.set.level, bpm: RP.set.bpm, meter: RP.set.meter, inst: RP.set.inst, gen: RP.set.gen, drum: RP.set.drum, latNow: document.querySelector('#latNow').textContent, countIn: document.querySelector('#countIn').value, libSort: document.querySelector('#libSort').value, font: [...document.querySelectorAll('#fontSeg button')].map(b=>b.getAttribute('aria-pressed')).join(','), startCard: !document.querySelector('#startCard').classList.contains('hide'), toast: document.querySelector('#toast').textContent, nDb: (await RPX.DB.all()).length, nDb0, hint: document.querySelector('#levelHint').textContent.slice(0,30) };
    // 한 번만 누르고 기다리면 되돌아가는지
    b.click(); await sl(3900); const back={ text: b.textContent, sure: b.dataset.sure||'' };
    return { t1, levelAfter1: s1, after, back }; })()`);
  console.log('RESET', JSON.stringify(RS));
  // 버전
  console.log('VERSION', await c.ev(`[...document.querySelectorAll('#tab-settings p')].map(p=>p.textContent).filter(t=>/버전/.test(t)).join(' | ') + ' || title=' + document.title`));
  console.log('ERRS', JSON.stringify(await c.ev('__errs')));
  await c.ev(`document.querySelector('nav.tabs [data-tab="settings"]').click(); 1`); await c.sleep(300);
  await c.shot('qa-g/settings.png');
};
