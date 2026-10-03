module.exports = async (c) => {
  const W = +(process.env.W || 390), P = 'h6-' + W;
  await c.size(W, 844, true);
  await c.go('http://127.0.0.1:8765/');
  await c.ev(`localStorage.setItem('rp.startSeen','true'); localStorage.setItem('rp.font','3'); localStorage.setItem('rp.theme','"dark"')`);
  await c.go('http://127.0.0.1:8765/?q=' + Date.now());
  await c.ev(`(()=>{window.__e=[];window.addEventListener('error',e=>__e.push('ERR '+e.message));window.addEventListener('unhandledrejection',e=>__e.push('REJ '+(e.reason&&e.reason.message||e.reason)));const oe=console.error;console.error=(...a)=>{__e.push(a.map(String).join(' '));oe(...a)};document.getElementById('setBox').open=true;return 1})()`);
  const S = `(()=>({style:document.getElementById('style').value, setStyle:RP.set.style, meter:document.getElementById('meter').value, bpm:RP.set.bpm, dis:[...document.getElementById('meter').options].filter(o=>o.disabled).map(o=>o.value).join(','), scStyle:RP.score&&RP.score.style, tempo:[...document.querySelectorAll('#score svg text')].map(t=>t.textContent).join('').slice(0,40), sum:document.getElementById('setSum').textContent, info:document.getElementById('scoreInfo').textContent.slice(0,140), hint:document.getElementById('levelHint').textContent.slice(0,60), drum:document.getElementById('drum').value, mode:RP.set.mode, toast:(document.querySelector('.toast')||{}).textContent}))()`;
  const ch = (id, v) => c.ev(`(async()=>{const s=document.getElementById('${id}'); s.value='${v}'; s.dispatchEvent(new Event('change')); await new Promise(r=>setTimeout(r,200)); return 1})()`);
  const click = (q, ms = 200) => c.ev(`(async()=>{document.querySelector('${q}').click(); await new Promise(r=>setTimeout(r,${ms})); return 1})()`);
  await click('#modeSeg button[data-v="rhythm"]');
  await ch('style', 'march'); console.log('march', JSON.stringify(await c.ev(S)));
  await ch('meter', '6/8'); console.log('march 6/8', JSON.stringify(await c.ev(S))); await c.shotEl(P + '-march68.png', '#score');
  await ch('meter', '2/2'); console.log('march 2/2', JSON.stringify(await c.ev(S))); await c.shotEl(P + '-march22.png', '#score');
  await ch('meter', '4/4'); console.log('march try disabled 4/4', JSON.stringify(await c.ev(S)));
  await ch('meter', '2/4'); console.log('march 2/4', JSON.stringify(await c.ev(S)));
  // bpm manual
  await c.ev(`(async()=>{const b=document.getElementById('bpmNum'); b.value='150'; b.dispatchEvent(new Event('change')); await new Promise(r=>setTimeout(r,500));})()`);
  console.log('march bpm150', JSON.stringify(await c.ev(S)));
  await ch('meter', '6/8'); console.log('march 6/8 after bpm150', JSON.stringify(await c.ev(S)));
  // drums + play
  for (const d of ['', 'kit', 'snare', 'bass', 'cymbal']) {
    await ch('drum', d);
    const p = await c.ev(`(async()=>{const b=document.getElementById('playBtn'); b.click(); await new Promise(r=>setTimeout(r,2500)); const t1=b.textContent, lit=document.querySelectorAll('#score .now, #score .done').length; b.click(); await new Promise(r=>setTimeout(r,400)); return {t1, lit, t2:b.textContent, now:document.querySelectorAll('#score .now').length}})()`);
    console.log('drum', d, JSON.stringify(p), JSON.stringify(await c.ev(S)).slice(0, 200));
    await c.shotEl(`${P}-march-drum-${d || 'click'}.png`, '#score');
  }
  await ch('drum', '');
  // bossa 2/2
  await ch('style', 'bossa'); await ch('meter', '2/2'); console.log('bossa 2/2', JSON.stringify(await c.ev(S))); await c.shotEl(P + '-bossa22.png', '#score');
  await ch('drum', 'kit'); await c.shotEl(P + '-bossa22-kit.png', '#score'); await ch('drum', '');
  await ch('meter', '4/4'); console.log('bossa back 4/4', JSON.stringify(await c.ev(S)));
  // trot 4/4, tango 2/4
  await ch('style', 'trot'); await ch('meter', '4/4'); console.log('trot 4/4', JSON.stringify(await c.ev(S))); await c.shotEl(P + '-trot44.png', '#score');
  await ch('style', 'tango'); console.log('tango from trot44', JSON.stringify(await c.ev(S)));
  await ch('meter', '2/4'); await c.shotEl(P + '-tango24.png', '#score');
  // mode switch with style active
  await ch('style', 'swing');
  await click('#modeSeg button[data-v="melody"]'); console.log('-> melody', JSON.stringify(await c.ev(S)));
  await c.shot(P + '-melody-swing.png', false);
  await click('#modeSeg button[data-v="rhythm"]'); console.log('-> rhythm', JSON.stringify(await c.ev(S)));
  // daily while style
  await ch('style', 'waltz'); await click('#dailyBtn', 400); console.log('daily', JSON.stringify(await c.ev(S)));
  // reset with style
  await ch('style', 'shuffle');
  await click('nav.tabs [data-tab=settings]'); await click('#resetAll'); await click('#resetAll', 500);
  await click('nav.tabs [data-tab=practice]');
  console.log('reset', JSON.stringify(await c.ev(S)), await c.ev(`JSON.stringify({font:localStorage.getItem('rp.font'),theme:localStorage.getItem('rp.theme')})`));
  console.log('errs', JSON.stringify(await c.ev('__e')));
};
