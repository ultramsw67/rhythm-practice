const SET = {"gen":3,"rv":2,"style":"swing","drum":"","mode":"rhythm","meter":"4/4","level":3,"bars":4,"key":"C","inst":"clarinet","bpm":120,"pickup":"off","artic":"auto","seed":321,"edits":{}};
module.exports = async (c) => {
  await c.size(390, 844, true);
  await c.go('http://127.0.0.1:8765/');
  await c.ev(`localStorage.setItem('rp.startSeen','true'); localStorage.setItem('rp.font','3'); localStorage.setItem('rp.theme','"dark"')`);
  await c.go('http://127.0.0.1:8765/?r=' + Date.now());
  await c.ev(`(()=>{window.__e=[];window.addEventListener('error',e=>__e.push('ERR '+e.message));window.addEventListener('unhandledrejection',e=>__e.push('REJ '+(e.reason&&e.reason.message||e.reason)));return 1})()`);
  await c.ev(`(()=>{ Object.assign(RP.set, ${JSON.stringify(SET)}); RP.syncForm(); RP.rebuild(); document.querySelector('#countIn').value='1'; })()`);
  console.log('before', await c.ev(`document.getElementById('style').value + ' ' + document.getElementById('scoreInfo').textContent`));
  await c.ev(`document.querySelector('#recBtn').click()`);
  let st = '';
  for (let i = 0; i < 60; i++) { await c.sleep(1000); st = await c.ev(`document.querySelector('#recStatus').textContent`); if (/점 —|오류|못|않|멈췄/.test(st)) break; }
  await c.sleep(1500);
  const r = await c.ev(`({ st: document.querySelector('#recStatus').textContent, total: document.getElementById('resTotal').textContent, parts: document.getElementById('resParts').innerText, tab: [...document.querySelectorAll('section[id^=tab-]')].filter(s=>!s.classList.contains('hide')).map(s=>s.id).join(), raw: RPX.take && RPX.take.result.raw, bonus: RPX.take && RPX.take.result.bonus, tot: RPX.take && RPX.take.result.total, style: RPX.take && RPX.take.set.style })`);
  console.log(JSON.stringify(r));
  await c.ev(`document.querySelector('nav.tabs').style.position='static'`);
  await c.shot('h7-result.png', true);
  await c.ev(`document.querySelector('nav.tabs').style.position=''`);
  // 보관함
  await c.ev(`(async()=>{document.querySelector('nav.tabs [data-tab=library]').click(); await new Promise(r=>setTimeout(r,800)); return 1})()`);
  console.log('lib', await c.ev(`[...document.querySelectorAll('#libList .take')].slice(0,3).map(t=>t.innerText.replace(/\s+/g,' ').slice(0,120)).join(' || ')`));
  await c.shot('h7-library.png', false);
  // 다른 설정으로 바꾼 뒤 보관함에서 이 악보로 연습
  await c.ev(`(async()=>{document.querySelector('nav.tabs [data-tab=practice]').click(); const s=document.getElementById('style'); s.value='waltz'; s.dispatchEvent(new Event('change')); await new Promise(r=>setTimeout(r,200)); return 1})()`);
  await c.ev(`(async()=>{document.querySelector('nav.tabs [data-tab=library]').click(); await new Promise(r=>setTimeout(r,800)); document.querySelector('#libList .take [data-a=practice]').click(); await new Promise(r=>setTimeout(r,600)); return 1})()`);
  console.log('practice from lib', JSON.stringify(await c.ev(`({style:document.getElementById('style').value, set:RP.set.style, meter:RP.set.meter, bpm:RP.set.bpm, seed:RP.set.seed, info:document.getElementById('scoreInfo').textContent, dis:[...document.getElementById('meter').options].filter(o=>o.disabled).length})`)));
  // 결과 보기 → 다시 하기
  await c.ev(`(async()=>{document.querySelector('nav.tabs [data-tab=library]').click(); await new Promise(r=>setTimeout(r,800)); document.querySelector('#libList .take [data-a=result]').click(); await new Promise(r=>setTimeout(r,800)); return 1})()`);
  console.log('lib result', JSON.stringify(await c.ev(`({total:document.getElementById('resTotal').textContent, parts:document.getElementById('resParts').innerText.slice(-120)})`)));
  await c.shotEl('h7-lib-result-score.png', '#tab-result');
  console.log('errs', JSON.stringify(await c.ev('__e')));
};
