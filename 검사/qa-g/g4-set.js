// qa-g g4: 설정 탭 · 채점 시험 · 처음 상태로 · 오늘의 악보 · 음계 · 드럼 세트 · 더블베이스 · 설명서·오프라인
module.exports = async (c) => {
  const B = 'http://127.0.0.1:8765/';
  await c.size(390, 844); await c.go(B);
  const ERR = `window.__errs=[]; addEventListener('error',e=>__errs.push(String(e.message))); addEventListener('unhandledrejection',e=>__errs.push('rej '+String(e.reason))); 1`;
  await c.ev(ERR);
  const sl = `const sl=ms=>new Promise(r=>setTimeout(r,ms)); const q=s=>document.querySelector(s); const tab=n=>q('nav.tabs [data-tab='+n+']').click(); const vis=s=>{const e=q(s); return !!e&&e.offsetParent!==null&&!e.classList.contains('hide');};`;
  // 채점 시험
  const st = await c.ev(`(async()=>{ ${sl} Object.assign(RP.set,{mode:'rhythm',drum:'',level:3,meter:'3/4',bars:4,bpm:100,seed:5,artic:'auto',edits:{}}); RP.syncForm(); RP.rebuild();
    const g0=q('#gameCard').innerText.replace(/\\s+/g,' '); const n0=(await RPX.DB.all()).length; tab('settings'); await sl(200);
    q('#selfPerfect').click(); await sl(300); const busy=q('#selfPerfect').disabled; q('#selfPerfect').click(); q('#selfSloppy').click(); await sl(5000);
    const o={ busy, resVis: vis('#tab-result'), total:q('#resTotal').textContent, title:q('#resTitle').textContent, saveVis: vis('#resSave'), reward: vis('#resReward'), parts:q('#resParts').innerText.replace(/\\n/g,' ') };
    tab('settings'); await sl(200); q('#selfPerfect').click(); await sl(5000); o.perfect=q('#resTotal').textContent; o.perfectTitle=q('#resTitle').textContent;
    q('#resSave').click(); await sl(600); o.saveAfter=vis('#resSave'); o.n=(await RPX.DB.all()).length-n0; q('#resSave').click(); await sl(400); o.n2=(await RPX.DB.all()).length-n0;
    tab('practice'); await sl(300); o.gameSame = q('#gameCard').innerText.replace(/\\s+/g,' ')===g0; o.g0=g0.slice(0,60); o.g1=q('#gameCard').innerText.replace(/\\s+/g,' ').slice(0,60);
    return o; })()`);
  console.log('SELFTEST', JSON.stringify(st));
  // 글자 크기, 연습 기록 끄기
  const fs = await c.ev(`(async()=>{ ${sl} tab('settings'); await sl(200); const o={};
    for (const v of ['1','3','2']) { q('#fontSeg [data-v="'+v+'"]').click(); await sl(200); o['f'+v]={ font: document.documentElement.dataset.font, fs: getComputedStyle(document.body).fontSize, pressed:[...document.querySelectorAll('#fontSeg button')].map(b=>b.getAttribute('aria-pressed')).join(','), ox: document.documentElement.scrollWidth-innerWidth }; }
    const g=q('#gameOn'); o.g0=g.checked; g.click(); await sl(200); tab('practice'); await sl(200); o.cardHidden=!vis('#gameCard'); tab('settings'); q('#gameOn').click(); await sl(200); tab('practice'); await sl(200); o.cardBack=vis('#gameCard'); return o; })()`);
  console.log('FONT/GAME', JSON.stringify(fs));
  // 지연 보정 직접 맞추기
  const lat = await c.ev(`(async()=>{ ${sl} tab('settings'); await sl(200); const r=q('#latRange'); r.value='-200'; r.dispatchEvent(new Event('input',{bubbles:true})); r.dispatchEvent(new Event('change',{bubbles:true})); await sl(200); const a=q('#latNow').textContent+' / '+q('#latSrc').textContent;
    r.value='500'; r.dispatchEvent(new Event('input',{bubbles:true})); r.dispatchEvent(new Event('change',{bubbles:true})); await sl(200); const b=q('#latNow').textContent; tab('practice'); await sl(200); return { a, b, latInfo:q('#latInfo').textContent, latGoVis: vis('#latGo'), saved: localStorage.getItem('rp.latency') }; })()`);
  console.log('LAT', JSON.stringify(lat));
  // 손뼉 측정 (가짜 장치) 시작 후 바로 탭 이동
  const clap = await c.ev(`(async()=>{ ${sl} tab('settings'); await sl(200); q('#calClap').click(); await sl(1500); const m1=q('#calMsg').textContent; const d1=[q('#calSpk').disabled,q('#calClap').disabled];
    tab('practice'); await sl(200); q('#playBtn').click(); await sl(500); const pl=q('#playBtn').textContent; q('#playBtn').click(); q('#recBtn').click(); await sl(800); const recSt=q('#recStatus').textContent; const recB=q('#recBtn').textContent; if(RPX.rec) q('#recBtn').click();
    tab('settings'); for(let i=0;i<30;i++){ await sl(500); if(!q('#calClap').disabled) break; } return { m1, d1, pl, recSt, recB, m2:q('#calMsg').textContent, d2:[q('#calSpk').disabled,q('#calClap').disabled], latNow:q('#latNow').textContent }; })()`);
  console.log('CLAP', JSON.stringify(clap));
  // 처음 상태로 (두 번)
  const rs = await c.ev(`(async()=>{ ${sl} Object.assign(RP.set,{mode:'melody',inst:'tuba',meter:'7/8',bars:16,bpm:150,level:5}); RP.syncForm(); RP.rebuild(); q('#listen').value='spk'; q('#listen').dispatchEvent(new Event('change',{bubbles:true})); q('#countIn').value='2'; q('#countIn').dispatchEvent(new Event('change',{bubbles:true}));
    tab('settings'); await sl(200); const b=q('#resetAll'); b.click(); const t1=b.textContent; await sl(5000); const t1late=b.textContent; const meterMid=RP.set.meter; b.click(); await sl(200); const t2=b.textContent; b.click(); await sl(500);
    return { t1, t1late, meterMid, t2, t3:b.textContent, meter:RP.set.meter, bars:RP.set.bars, bpm:RP.set.bpm, mode:RP.set.mode, inst:RP.set.inst, level:RP.set.level, listen:q('#listen').value, countIn:q('#countIn').value, font:document.documentElement.dataset.font, theme:q('#themeBtn').textContent, startCard: !q('#startCard').classList.contains('hide'), lat:q('#latNow').textContent, settingsVis: vis('#tab-settings') }; })()`);
  console.log('RESET', JSON.stringify(rs));
  // 오늘의 악보
  const dl = await c.ev(`(async()=>{ ${sl} tab('practice'); const o={}; for (const m of ['rhythm','melody']) { q('#modeSeg [data-v='+m+']').click(); await sl(300); Object.assign(RP.set,{bpm:150,bars:16,meter:'7/8',key:'D'}); RP.syncForm(); RP.rebuild(); q('#dailyBtn').click(); await sl(600);
    o[m]={ meter:RP.set.meter, bars:RP.set.bars, bpm:RP.set.bpm, key:RP.set.key, kref:RP.set.kref, seed:RP.set.seed, hint:q('#dailyHint').textContent, info:q('#scoreInfo').textContent, sum:q('#setSum').textContent }; q('#dailyBtn').click(); await sl(300); o[m].seed2=RP.set.seed; q('#newBtn').click(); await sl(300); o[m].afterNew={seed:RP.set.seed, hint:q('#dailyHint').textContent.slice(0,40)}; }
    q('#modeSeg [data-v=melody]').click(); RP.set.inst='flute'; RP.syncForm(); q('#dailyBtn').click(); await sl(300); o.flute={seed:RP.set.seed, notes: RP.score.events.filter(e=>!e.rest).map(e=>e.midi||e.pitch||'').slice(0,6).join(',')};
    RP.set.inst='clarinet'; RP.syncForm(); q('#dailyBtn').click(); await sl(300); o.clar={seed:RP.set.seed, notes: RP.score.events.filter(e=>!e.rest).map(e=>e.midi||e.pitch||'').slice(0,6).join(',')};
    return o; })()`);
  console.log('DAILY', JSON.stringify(dl));
  // 배지 펼치기
  const bd = await c.ev(`(async()=>{ ${sl} const b=q('#badgeBtn'); const e0=b.getAttribute('aria-expanded'); const v0=vis('#badgeList'); b.click(); await sl(200); const e1=b.getAttribute('aria-expanded'); const v1=vis('#badgeList'); const n=q('#badgeList').children.length; b.click(); await sl(200); return {e0,v0,e1,v1,n,v2:vis('#badgeList')}; })()`);
  console.log('BADGE', JSON.stringify(bd));
  // 음계
  const sc = await c.ev(`(async()=>{ ${sl} q('#modeSeg [data-v=melody]').click(); await sl(200); const p=q('#prac'); p.value='scale'; p.dispatchEvent(new Event('change',{bubbles:true})); await sl(400); const o={ barsVis: vis('#bars'), pickupVis: vis('#pickup'), minorVis: vis('#minor') };
    const k=q('#key'); k.value='Am'; k.dispatchEvent(new Event('change',{bubbles:true})); await sl(300); o.minorVisAm=vis('#minor'); const mi=q('#minor'); const lv={};
    for (const v of ['h','n','m']) { mi.value=v; mi.dispatchEvent(new Event('change',{bubbles:true})); await sl(200); lv[v]=q('#scoreInfo').textContent.slice(0,80); }
    o.minor=lv; for (const L of [1,3,5]) { q('#levelSeg [data-v="'+L+'"]').click(); await sl(200); o['lv'+L]=q('#scoreInfo').textContent+' | '+q('#levelHint').textContent.slice(0,60)+' | n='+RP.score.events.length; }
    q('#bpmNum').value='208'; q('#bpmNum').dispatchEvent(new Event('change',{bubbles:true})); q('#bpmNum').dispatchEvent(new Event('input',{bubbles:true})); await sl(300); o.fast=q('#scoreInfo').textContent;
    q('#newBtn').click(); await sl(300); o.newScale=q('#scoreInfo').textContent.slice(0,60); o.newBtnDis=q('#newBtn').disabled;
    p.value=''; p.dispatchEvent(new Event('change',{bubbles:true})); await sl(300); return o; })()`);
  console.log('SCALE', JSON.stringify(sc));
  await c.shot('qa-g/g4-scale.png');
  // 드럼 세트·더블베이스
  const kb = await c.ev(`(async()=>{ ${sl} const o={}; q('#modeSeg [data-v=rhythm]').click(); await sl(200); const d=q('#drum'); for (const v of ['kit','snare','bass','cymbal','']) { d.value=v; d.dispatchEvent(new Event('change',{bubbles:true})); await sl(500); o[v||'click']={ info:q('#scoreInfo').textContent.slice(0,70), sound:q('#soundInfo').textContent, artic: [...new Set(RP.score.events.flatMap(e=>e.artic||[]))].join(','), drumScore: !!RP.score.drum, articOpts: vis('#artic') }; }
    q('#modeSeg [data-v=melody]').click(); await sl(200); const i=q('#inst'); i.value='contrabass'; i.dispatchEvent(new Event('change',{bubbles:true})); await sl(1500); o.kref=vis('#kref'); o.bowVis=vis('#bow'); o.keyLbl=q('#keyLbl').textContent;
    const bw=q('#bow'); for (const v of ['','pizz','mix']) { bw.value=v; bw.dispatchEvent(new Event('change',{bubbles:true})); await sl(800); o['bow_'+(v||'arco')]={ sound:q('#soundInfo').textContent, text:[...q('#score').querySelectorAll('text')].map(t=>t.textContent).filter(t=>/pizz|arco/.test(t)).join(','), artic:[...new Set(RP.score.events.filter(e=>e.pizz).flatMap(e=>e.artic||[]))].join(',') }; }
    q('#playBtn').click(); await sl(1500); o.playBass=q('#playBtn').textContent; q('#playBtn').click();
    i.value='clarinet'; i.dispatchEvent(new Event('change',{bubbles:true})); await sl(300); o.bowAfterClar=vis('#bow'); o.krefClar=vis('#kref');
    i.value='flute'; i.dispatchEvent(new Event('change',{bubbles:true})); await sl(300); o.krefFlute=vis('#kref'); o.keyLblFlute=q('#keyLbl').textContent; return o; })()`);
  console.log('KIT/BASS', JSON.stringify(kb));
  console.log('ERRS', JSON.stringify(await c.ev('window.__errs')));
  // 설명서·오프라인
  await c.go(B + 'guide.html'); await c.ev(ERR);
  const gd = await c.ev(`(async()=>{ const links=[...document.querySelectorAll('a[href]')].map(a=>a.getAttribute('href')); const uniq=[...new Set(links)]; const out=[]; for (const h of uniq) { if (/^(mailto|tel|javascript)/.test(h)) continue; if (h.startsWith('#')) { const id=decodeURIComponent(h.slice(1)); if(!document.getElementById(id) && !document.getElementsByName(id).length) out.push('missing anchor '+h); continue; } if (/^https?:/.test(h) && !h.includes('127.0.0.1')) continue; try { const r=await fetch(new URL(h,location.href)); if(!r.ok) out.push(h+' '+r.status);} catch(e){ out.push(h+' '+e);} } return { n: uniq.length, ext: uniq.filter(h=>/^https?:/.test(h)), bad: out, ox: document.documentElement.scrollWidth-innerWidth, ver: (document.body.innerText.match(/v3\\.[0-9.]+/)||[''])[0] }; })()`);
  console.log('GUIDE', JSON.stringify(gd));
  await c.go(B + 'offline/'); await c.sleep(1500); await c.ev(ERR);
  const off = await c.ev(`({ title: document.title, h1: document.querySelector('h1') && document.querySelector('h1').innerText, ok: !!window.RP, svg: !!document.querySelector('#score svg'), ver: (document.body.innerText.match(/v3\\.[0-9.]+/)||[''])[0], ox: document.documentElement.scrollWidth-innerWidth, guide: [...document.querySelectorAll('a[href]')].map(a=>a.getAttribute('href')).filter(h=>/guide/.test(h)) })`);
  console.log('OFFLINE', JSON.stringify(off));
  const offs = await c.ev(`(async()=>{ document.querySelector('nav.tabs [data-tab=settings]').click(); await new Promise(r=>setTimeout(r,2500)); const t=document.querySelector('#tab-settings').innerText; return (t.match(/[^\\n]*(저장|오프라인)[^\\n]*/g)||[]).slice(0,6); })()`);
  console.log('OFFLINE-SET', JSON.stringify(offs));
  await c.ev(`(async()=>{ for (const h of [...document.querySelectorAll('a[href]')].map(a=>a.href)) { if(h.startsWith(location.origin)) { const r=await fetch(h); if(!r.ok) console.error('offline link bad', h, r.status); } } return 1; })()`);
};
