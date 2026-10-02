// qa-g g2: 폭·글자 크기·테마별 모든 탭 + 여러 설정 조합에서 넘침·작은 버튼·NaN 글자 검사
module.exports = async (c) => {
  const B = 'http://127.0.0.1:8765/';
  const ERR = `window.__errs=window.__errs||[]; if(!window.__eh){window.__eh=1; addEventListener('error',e=>__errs.push(String(e.message))); addEventListener('unhandledrejection',e=>__errs.push('rej '+String(e.reason)));} 1`;
  const CHECK = `(()=>{ const vis=[...document.querySelectorAll('button,select,.btn,input[type=number],summary')].filter(e=>e.offsetParent&&getComputedStyle(e).display!=='none'&&!e.closest('.hide'));
    const small=vis.filter(e=>{const r=e.getBoundingClientRect(); return r.height<44 && r.width>0;}).map(e=>(e.id||e.dataset.a||e.textContent.trim().slice(0,14))+':'+Math.round(e.getBoundingClientRect().height));
    const over=[...document.querySelectorAll('main *')].filter(e=>e.offsetParent && e.getBoundingClientRect().right>innerWidth+1 && !e.closest('svg')).map(e=>(e.id||e.className||e.tagName)+':'+Math.round(e.getBoundingClientRect().right)).slice(0,8);
    const sw=[...document.querySelectorAll('main .card, main .paper')].filter(e=>e.offsetParent && e.scrollWidth>e.clientWidth+1).map(e=>(e.id||e.className)+':'+(e.scrollWidth-e.clientWidth)).slice(0,6);
    const txt=document.body.innerText; const bad=(txt.match(/[^\\n]{0,25}(NaN|undefined|null|\\[object|Infinity)[^\\n]{0,15}/g)||[]);
    return { ox: document.documentElement.scrollWidth-innerWidth, small: small.slice(0,15), over, sw, bad, errs: window.__errs }; })()`;
  const tabs = ['practice', 'result', 'library', 'settings'];
  const combos = [
    { w: 390, font: '2', theme: 'auto' }, { w: 390, font: '3', theme: 'dark' }, { w: 320, font: '3', theme: 'light' }, { w: 320, font: '1', theme: 'dark' },
  ];
  for (const cb of combos) {
    await c.size(cb.w, 760); await c.go(B);
    await c.ev(`localStorage.setItem('rp.font','${cb.font}'); localStorage.setItem('rp.theme', JSON.stringify('${cb.theme}')); localStorage.setItem('rp.set', JSON.stringify(Object.assign({}, RP.set, {mode:'melody', inst:'contrabass', bow:'mix', level:5, bars:8, meter:'7/8'}))); 1`);
    await c.go(B); await c.ev(ERR);
    // 가상 연주로 결과 화면 채우기
    await c.ev(`(async()=>{ document.querySelector('nav.tabs [data-tab=settings]').click(); document.querySelector('#selfSloppy').click(); await new Promise(r=>setTimeout(r,4000)); return 1; })()`);
    for (const t of tabs) {
      await c.ev(`(async()=>{ document.querySelector('nav.tabs [data-tab=${t}]').click(); const sb=document.querySelector('#setBox'); if(sb) sb.open=true; await new Promise(r=>setTimeout(r,500)); return 1; })()`);
      const r = await c.ev(CHECK);
      console.log(`${cb.w} f${cb.font} ${cb.theme} ${t}`, JSON.stringify(r));
      if (t === 'practice' || t === 'result' || t === 'settings') {
        await c.ev(`document.querySelector('nav.tabs').style.position='static'`);
        await c.shot(`qa-g/g2-${cb.w}-f${cb.font}-${cb.theme}-${t}.png`);
        await c.ev(`document.querySelector('nav.tabs').style.position=''`);
      }
    }
  }
  // 설정 조합 훑기 (390, 아주 크게)
  await c.size(390, 844); await c.ev(`localStorage.setItem('rp.font','3'); 1`); await c.go(B); await c.ev(ERR);
  const sets = [];
  const meters = ['2/4', '3/4', '4/4', '5/4', '6/8', '7/8', '9/8', '12/8', '2/2'];
  for (const m of meters) for (const lv of [1, 3, 5]) {
    sets.push({ mode: 'rhythm', meter: m, level: lv, drum: '', bars: 4 });
    sets.push({ mode: 'rhythm', meter: m, level: lv, drum: 'kit', bars: 4 });
    sets.push({ mode: 'melody', prac: '', meter: m, level: lv, inst: ['flute', 'tuba', 'horn', 'contrabass', 'alto_sax'][lv % 5], bars: 8 });
    sets.push({ mode: 'melody', prac: 'scale', meter: m, level: lv, inst: 'clarinet', key: ['Bb', 'F#', 'Cbm', 'Am'][lv % 4] });
  }
  const r = await c.ev(`(async()=>{ const out=[]; const keys=Object.keys(RP.set); for (const s of ${JSON.stringify(sets)}) { try { Object.assign(RP.set, {prac:'',drum:'',bow:''}, s); RP.syncForm(); RP.rebuild(); await new Promise(r=>setTimeout(r,60));
      const t=document.querySelector('#scoreInfo').textContent+' | '+document.querySelector('#setSum').textContent+' | '+document.querySelector('#levelHint').textContent+' | '+document.querySelector('#soundInfo').textContent+' | '+document.querySelector('#keyLbl').textContent;
      const p=document.querySelector('#score'); const ov=p.scrollWidth-p.clientWidth; const svg=p.querySelector('svg'); const sr=svg?Math.round(svg.getBoundingClientRect().right-p.getBoundingClientRect().right):'nosvg';
      if (/NaN|undefined|null/.test(t) || ov>1 || sr==='nosvg' || sr>2 || document.documentElement.scrollWidth>innerWidth) out.push({s, t:t.slice(0,200), ov, sr, ox:document.documentElement.scrollWidth-innerWidth});
    } catch(e) { out.push({s, err:String(e)}); } } return { n: ${sets.length}, bad: out, errs: window.__errs }; })()`);
  console.log('SWEEP', JSON.stringify(r));
  // 존재하지 않는 키: 마이너 조 이름 확인
  const keys = await c.ev(`(()=>{ RP.set.mode='melody'; RP.set.prac=''; RP.syncForm(); return [...document.querySelectorAll('#key option')].map(o=>o.value+'='+o.textContent).join(', '); })()`);
  console.log('KEYS', keys);
  const insts = await c.ev(`[...document.querySelectorAll('#inst option')].map(o=>o.value+'='+o.textContent).join(', ')`);
  console.log('INSTS', insts);
};
