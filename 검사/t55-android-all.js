// v4.0.1 (2026-10-07 "안드로이드 폰 완벽해야 돼"): 안드로이드(크롬·삼성 인터넷) 흉내로 네 탭의 보이는 모든 단추·선택 칸·입력 칸을
// 실제 터치(Input.dispatchTouchEvent)로 눌러, 손가락이 그 칸에 닿는지(다른 것이 덮지 않는지)·44px 이상인지 본다.
// 단추는 touchstart 를 막아 실제로 실행되지 않게(녹음·삭제 등 안전), 선택 칸·입력 칸은 막지 않고 눌러 포커스가 가는지·페이지가 막지 않는지 본다.
// 폭 360·412 × 글자 보통·아주 크게 × 밝음/어두움 × 브라우저 2. 통과: bad [] 0, errs []
const UAS = {
  chrome: 'Mozilla/5.0 (Linux; Android 14; SM-S918N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Mobile Safari/537.36',
  samsung: 'Mozilla/5.0 (Linux; Android 14; SM-S918N) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/26.0 Chrome/122.0.0.0 Mobile Safari/537.36',
};
module.exports = async (c) => {
  const bad = []; let total = 0;
  await c.send('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 5 });
  const tap = async (x, y) => { await c.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y, radiusX: 11, radiusY: 11 }] }); await c.sleep(40); await c.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] }); await c.sleep(80); };
  const combos = [['chrome', 360, 2, false], ['chrome', 412, 3, true], ['samsung', 360, 3, false], ['samsung', 412, 2, true], ['chrome', 360, 3, true]];
  for (const [ua, w, font, dark] of combos) {
    await c.send('Emulation.setUserAgentOverride', { userAgent: UAS[ua], platform: 'Android' });
    await c.send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-color-scheme', value: dark ? 'dark' : 'light' }] });
    await c.size(w, 800, true);
    await c.go('http://127.0.0.1:8765/?t55=' + Date.now());
    await c.ev(`localStorage.clear(); localStorage.setItem('rp.startSeen','true'); localStorage.setItem('rp.font','${font}')`);
    await c.go('http://127.0.0.1:8765/?t55b=' + Date.now());
    const tag = `${ua} ${w} font${font} ${dark ? 'dark' : 'light'}`;
    if (await c.ev(`!!document.querySelector('#inappGate')`)) { bad.push({ tag, err: 'inapp gate shown in normal browser' }); continue; }
    for (const tab of ['practice', 'result', 'library', 'settings']) {
      // 탭도 실제 터치로
      const tp = JSON.parse(await c.ev(`(()=>{const b=document.querySelector('nav.tabs button[data-tab="${tab}"]'); const r=b.getBoundingClientRect(); return JSON.stringify([r.left+r.width/2,r.top+r.height/2])})()`));
      await tap(tp[0], tp[1]); await c.sleep(300);
      if (!(await c.ev(`!document.querySelector('#tab-${tab}').classList.contains('hide')`))) { bad.push({ tag, tab, err: 'tab did not open by touch' }); continue; }
      if (tab === 'practice') { await c.ev(`(()=>{const d=document.querySelector('#setBox'); d.open=true;})()`); await c.sleep(200); }
      const list = JSON.parse(await c.ev(`(()=>{document.querySelectorAll('[data-t55]').forEach(e=>delete e.dataset.t55); const root=document.querySelector('#tab-${tab}'); let i=0;
        const els=[...root.querySelectorAll('button,select,input,summary,a[href]')].filter(e=>{const r=e.getBoundingClientRect(); const cs=getComputedStyle(e);
          return r.width>0&&r.height>0&&cs.visibility!=='hidden'&&!e.disabled&&!e.closest('.hide')&&e.type!=='hidden'&&!(e.closest('details:not([open])')&&e.tagName!=='SUMMARY');});
        return JSON.stringify(els.map(e=>{const k='t55_'+(i++); e.dataset.t55=k; return {k, d:(e.id||'')+' '+e.tagName+' '+(e.textContent||e.value||'').trim().slice(0,14)+(e.type?' '+e.type:'')}}))})()`));
      for (const it of list) {
        total++;
        const info = JSON.parse(await c.ev(`(()=>{const e=document.querySelector('[data-t55="${it.k}"]'); e.scrollIntoView({block:'center'});
          const r=e.getBoundingClientRect(); const lab=e.closest('label'); const small=(e.type==='checkbox'||e.type==='radio')? (lab? lab.getBoundingClientRect().height<40 : r.height<20) : (r.height<40||r.width<40);
          return JSON.stringify({x:r.left+r.width/2,y:r.top+r.height/2,small,form:/SELECT|INPUT/.test(e.tagName)&&e.type!=='checkbox'&&e.type!=='radio'&&e.type!=='range'})})()`));
        // 단추·체크박스 등은 실행되지 않게 touchstart 를 막고, 손가락이 닿은 것만 기록
        await c.ev(`window.__hit=null; window.__pd=false; window.__h=(ev)=>{ window.__hit=ev.target; if(!${info.form}) ev.preventDefault(); }; window.addEventListener('touchstart', __h, {capture:true, passive:false});
          window.__m=(ev)=>{ window.__pd = window.__pd || ev.defaultPrevented; }; window.addEventListener('mousedown', __m, false); window.addEventListener('pointerdown', __m, false); document.activeElement && document.activeElement.blur && document.activeElement.blur();`);
        await tap(info.x, info.y);
        const res = JSON.parse(await c.ev(`(()=>{const e=document.querySelector('[data-t55="${it.k}"]'); const h=window.__hit; window.removeEventListener('touchstart', __h, {capture:true}); window.removeEventListener('mousedown', __m); window.removeEventListener('pointerdown', __m);
          const lab=e.closest('label'); const ok=!!h&&(h===e||e.contains(h)||(lab&&lab.contains(h)));
          return JSON.stringify({ok, hit:h?(h.id||h.tagName+'.'+h.className).slice(0,40):null, focus:document.activeElement===e, pd:window.__pd})})()`));
        if (!res.ok) bad.push({ tag, tab, el: it.d, err: 'covered', hit: res.hit });
        if (info.form && (!res.focus || res.pd)) bad.push({ tag, tab, el: it.d, err: 'form control not focused / prevented', res });
        if (info.small) bad.push({ tag, tab, el: it.d, err: 'small' });
        // 입력 칸 포커스 뒤 화면이 바뀌었으면 원래대로
        await c.ev(`document.activeElement && document.activeElement.blur && document.activeElement.blur()`);
      }
      console.log(tag, tab, 'controls', list.length);
    }
  }
  const errs = c.logs.filter(l => /EXC|error/i.test(l));
  console.log('total', total);
  console.log('bad', JSON.stringify(bad), bad.length);
  console.log('errs', JSON.stringify(errs.slice(0, 5)));
};
