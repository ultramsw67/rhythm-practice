// qa-g: 가짜 마이크 녹음 → 채점 → 결과 화면 → 다시 녹음/새 악보 (SET env, FAKE_WAV 필요)
const SET = JSON.parse(process.env.SET);
module.exports = async (c) => {
  await c.size(390, 844);
  await c.go('http://127.0.0.1:8765/');
  await c.ev(`window.__errs=[]; window.addEventListener('error',e=>__errs.push(String(e.message))); window.addEventListener('unhandledrejection',e=>__errs.push('rej '+String(e.reason)));`);
  await c.ev(`(()=>{ Object.assign(RP.set, ${JSON.stringify(SET)}); RP.rebuild(); document.querySelector('#countIn').value='1'; })()`);
  const seed0 = await c.ev(`RP.set.seed`);
  await c.ev(`document.querySelector('#recBtn').click()`);
  let st = '';
  for (let i = 0; i < 90; i++) { await c.sleep(1000); st = await c.ev(`document.querySelector('#recStatus').textContent`); if (/점 —|오류|못|않|멈췄/.test(st)) break; }
  await c.sleep(1200);
  const r = await c.ev(`(()=>{ const t=RPX.take; const R=t&&t.result; return { st: document.querySelector('#recStatus').textContent, tab: document.querySelector('#tab-result') && !document.querySelector('#tab-result').classList.contains('hide'),
    resTotal: document.querySelector('#resTotal').textContent, cap: RPX.lastCap, count: R&&R.count, matched: R&&R.matched, extras: R&&R.extras, played: R&&R.played, parts: R&&JSON.stringify(R.parts), meanDev: R&&R.meanDevMs,
    scoreDrum: RP.score.drum, lvlLabel: document.querySelector('#levelHint').textContent.slice(0,40), tips: document.querySelector('#resTips').textContent.slice(0,200),
    svg: document.querySelectorAll('#resScore svg').length, hits: (document.querySelector('#resScore')._hits||[]).length }; })()`);
  console.log('REC', JSON.stringify(r));
  // 음표 누르기 (처음 3개 음)
  const notes = await c.ev(`(async()=>{ const host=document.querySelector('#resScore'); host.scrollIntoView(); await new Promise(r=>setTimeout(r,300)); const out=[]; const rect=host.getBoundingClientRect(), s=host._scale||1;
    for (const h of (host._hits||[]).slice(0,4)) { const cx=rect.left+h.x*s, cy=rect.top+6+((h.y0+h.y1)/2)*s; host.dispatchEvent(new MouseEvent('click',{bubbles:true,clientX:cx,clientY:cy})); out.push(h.id+': '+document.querySelector('#resNote').textContent); }
    return out; })()`);
  console.log('NOTES', JSON.stringify(notes));
  // 같은 악보 다시 녹음
  const ag = await c.ev(`(async()=>{ const before=JSON.stringify(RPX.take.set); document.querySelector('#resAgain').click(); await new Promise(r=>setTimeout(r,500));
    const vis=id=>{const e=document.querySelector(id); return e && !e.classList.contains('hide') && e.offsetParent!==null;};
    return { practiceVis: vis('#tab-practice'), sameSeed: RP.set.seed===RPX.take.set.seed, sameSet: ['mode','level','meter','bars','key','inst','bpm','drum','gen'].every(k=>RP.set[k]===RPX.take.set[k]), recBtn: document.querySelector('#recBtn').disabled, setUnchanged: before===JSON.stringify(RPX.take.set) }; })()`);
  console.log('AGAIN', JSON.stringify(ag));
  // 새 악보로 연습 (결과 탭으로 돌아가 누름)
  const nw = await c.ev(`(async()=>{ RPX.showResult(RPX.take,false); await new Promise(r=>setTimeout(r,500)); const s0=RP.set.seed; document.querySelector('#resNew').click(); await new Promise(r=>setTimeout(r,600));
    const vis=id=>{const e=document.querySelector(id); return e && e.offsetParent!==null;};
    return { practiceVis: vis('#tab-practice'), seedChanged: RP.set.seed!==RPX.take.set.seed, s0, s1: RP.set.seed, sameOther: ['mode','level','meter','bars','drum','gen'].every(k=>RP.set[k]===RPX.take.set[k]), gen: RP.set.gen, drum: RP.set.drum }; })()`);
  console.log('NEW', JSON.stringify(nw));
  console.log('ERRS', JSON.stringify(await c.ev('__errs')));
};
