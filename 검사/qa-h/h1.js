// QA-h 1: 스타일 전수 + 시각 캡처 (390, 아주 크게, 어두운 화면)
module.exports = async (c) => {
  const W = +(process.env.W || 390), P = process.env.PFX || 'h1';
  await c.size(W, 844, true);
  await c.go('http://127.0.0.1:8765/');
  await c.ev(`localStorage.setItem('rp.startSeen','true'); localStorage.setItem('rp.font','3'); localStorage.setItem('rp.theme','"dark"')`);
  await c.go('http://127.0.0.1:8765/?q=' + Date.now());
  await c.ev(`(()=>{window.__e=[];window.addEventListener('error',e=>__e.push('ERR '+e.message));window.addEventListener('unhandledrejection',e=>__e.push('REJ '+(e.reason&&e.reason.message||e.reason)));const oe=console.error;console.error=(...a)=>{__e.push(a.map(String).join(' '));oe(...a)};document.getElementById('setBox').open=true;return 1})()`);
  // 리듬 모드
  await c.ev(`document.querySelector('#modeSeg button[data-v="rhythm"]').click()`);
  const styles = await c.ev(`[...document.getElementById('style').options].map(o=>o.value+'|'+o.textContent)`);
  console.log('options', styles.length, JSON.stringify(styles));
  const probe = `(()=>{const svg=document.querySelector('#score svg'); if(!svg) return {nosvg:1, ph:(document.querySelector('#score')||{}).textContent};
    const txt=document.body.innerText; const bad=/NaN|undefined/.test(txt)?txt.match(/.{0,30}(NaN|undefined).{0,30}/)[0]:'';
    const host=document.getElementById('score').getBoundingClientRect(); const sr=svg.getBoundingClientRect();
    const texts=[...svg.querySelectorAll('text')].map(t=>({s:t.textContent,r:t.getBoundingClientRect()}));
    const heads=[...svg.querySelectorAll('.vf-notehead, .vf-stavenote')].map(n=>n.getBoundingClientRect());
    const tempo=texts.filter(t=>/[A-Za-z]{3,}/.test(t.s));
    const coll=[]; for(const t of tempo) for(const h of heads){ if(h.width&&t.r.right>h.left+1&&t.r.left<h.right-1&&t.r.bottom>h.top+1&&t.r.top<h.bottom-1){coll.push(t.s);break;} }
    return {meter:document.getElementById('meter').value,bpm:document.getElementById('bpmNum').value,style:document.getElementById('style').value,
      hint:document.getElementById('levelHint').textContent, info:document.getElementById('scoreInfo').textContent, sum:document.getElementById('setSum').textContent,
      texts:texts.map(t=>t.s).filter(s=>s.trim()).join(' ').slice(0,120), coll, bad, overX:document.documentElement.scrollWidth-innerWidth, svgOver:Math.round(sr.right-host.right)}})()`;
  const sel = (k) => c.ev(`(async()=>{const s=document.getElementById('style'); s.value='${k}'; s.dispatchEvent(new Event('change')); await new Promise(r=>setTimeout(r,150)); return 1})()`);
  const drum = (k) => c.ev(`(async()=>{const s=document.getElementById('drum'); s.value='${k}'; s.dispatchEvent(new Event('change')); await new Promise(r=>setTimeout(r,150)); return 1})()`);
  const lvl = (n) => c.ev(`(async()=>{document.querySelector('#levelSeg button[data-v="${n}"]').click(); await new Promise(r=>setTimeout(r,150)); return 1})()`);
  for (const o of styles.slice(1)) {
    const k = o.split('|')[0];
    for (const d of ['', 'kit']) {
      await drum(d); await sel(k);
      for (const L of [1, 2, 3, 4, 5]) {
        await lvl(L);
        const r = await c.ev(probe);
        if (r.coll && r.coll.length || r.bad || r.overX > 0 || r.svgOver > 2 || r.nosvg) console.log('!!', k, d, L, JSON.stringify(r));
        if (L === 1 && d === '') console.log(k, r.meter, r.bpm, '|', r.hint, '|', r.info, '|', r.sum);
        if (L === 3 || L === 5) await c.shotEl(`${P}-${k}${d ? '-kit' : ''}-L${L}.png`, '#score');
      }
      // 새 악보 여러 번
      for (let i = 0; i < 3; i++) { await c.ev(`document.getElementById('newBtn').click()`); await c.sleep(120); const r = await c.ev(probe); if (r.coll.length || r.bad || r.overX > 0 || r.svgOver > 2) console.log('!!new', k, d, JSON.stringify(r)); }
    }
  }
  console.log('errs', JSON.stringify(await c.ev('__e')));
};
