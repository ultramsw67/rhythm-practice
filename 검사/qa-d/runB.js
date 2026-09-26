// Perfect recording end-to-end: score, result screen, library card actions, downloads, rename+reload persistence
const fs = require('fs'), path = require('path');
const OUT = __dirname;
const SET = { mode: 'rhythm', level: 1, meter: '4/4', bars: 2, key: 'C', inst: 'c_treble', bpm: 100, pickup: 'off', artic: 'auto', seed: 3, edits: {} };
module.exports = async (c) => {
  await c.size(390, 844, true);
  await c.go(process.env.URL0 || 'http://127.0.0.1:' + (process.env.PORT || 8781) + '/');
  await c.ev(`document.querySelector('#startClose').click()`);
  await c.send('Browser.setDownloadBehavior', { behavior: 'allow', downloadPath: OUT });
  const out = {};
  await c.ev(`(()=>{ Object.assign(RP.set, ${JSON.stringify(SET)}); RP.rebuild(); document.querySelector('#countIn').value='1'; })()`);
  await c.ev(`document.querySelector('#recBtn').click()`);
  let st = '';
  for (let i = 0; i < 60; i++) { await c.sleep(1000); st = await c.ev(`document.querySelector('#recStatus').textContent`); if (/점 —|오류|못|않|멈췄/.test(st)) break; }
  out.recStatus = st;
  await c.sleep(600);
  out.onResultTab = await c.ev(`document.querySelector('[data-tab=result]').getAttribute('aria-selected')`);
  out.hasSaveVirtualBtn = await c.ev(`!!document.querySelector('#resSave') && !document.querySelector('#resSave').classList.contains('hide')`);
  await c.shot ? null : null;
  const rc = await c.ev(`(()=>{const r=document.querySelector('#tab-result').getBoundingClientRect(); return {x:0,y:Math.max(0,r.top+scrollY),width:390,height:Math.min(r.height,1400),scale:1}})()`);
  const shot1 = await c.send('Page.captureScreenshot', { format: 'png', clip: rc });
  fs.writeFileSync(path.join(OUT, 'result-perfect.png'), Buffer.from(shot1.result.data, 'base64'));

  out.notePS = await c.ev(`(()=>{ const n = document.querySelector('#score [id^=vf-ev]'); if(!n) return null; n.dispatchEvent(new MouseEvent('click',{bubbles:true})); return document.querySelector('#noteInfo, .note-tip, #resTip')?.textContent || 'no-tip-el'; })()`);

  await c.ev(`document.querySelector('[data-tab=library]').click()`);
  await c.sleep(300);
  out.libCount = await c.ev(`document.querySelectorAll('.take').length`);
  const rc2 = await c.ev(`(()=>{const r=document.querySelector('.take').getBoundingClientRect(); return {x:0,y:Math.max(0,r.top+scrollY),width:390,height:r.height,scale:1}})()`);
  const shot2 = await c.send('Page.captureScreenshot', { format: 'png', clip: rc2 });
  fs.writeFileSync(path.join(OUT, 'lib-card.png'), Buffer.from(shot2.result.data, 'base64'));

  // rename + save, then reload, check persists
  out.rename = await c.ev(`(async()=>{
    const card = document.querySelector('.take');
    const renameBtn = [...card.querySelectorAll('button')].find(b=>b.textContent.includes('이름'));
    renameBtn.click(); await new Promise(r=>setTimeout(r,150));
    const inp = card.querySelector('input[type=text], input:not([type])');
    if (!inp) return { ok:false, reason:'no-input' };
    inp.value = 'QA-테스트-이름';
    const saveBtn = [...card.querySelectorAll('button')].find(b=>b.textContent.includes('저장'));
    saveBtn.click(); await new Promise(r=>setTimeout(r,150));
    return { ok:true, name: card.querySelector('.take-name, h3, .name')?.textContent || card.textContent.slice(0,40) };
  })()`);

  // download wav + json
  await c.ev(`(()=>{ const card = document.querySelector('.take'); const wav = [...card.querySelectorAll('button')].find(b=>b.dataset.a==='wav'); wav && wav.click(); })()`);
  await c.sleep(800);
  await c.ev(`(()=>{ const card = document.querySelector('.take'); const j = [...card.querySelectorAll('button')].find(b=>b.dataset.a==='json'); j && j.click(); })()`);
  await c.sleep(800);

  await c.go(process.env.URL0 || 'http://127.0.0.1:' + (process.env.PORT || 8781) + '/');
  await c.ev(`document.querySelector('[data-tab=library]').click()`);
  await c.sleep(400);
  out.afterReloadName = await c.ev(`document.querySelector('.take')?.textContent.slice(0,60)`);
  out.afterReloadCount = await c.ev(`document.querySelectorAll('.take').length`);

  console.log(JSON.stringify(out, null, 1));
  console.log('downloads dir:', fs.readdirSync(OUT).filter(f => /\.(wav|json)$/.test(f) && f !== 'perfect.wav' && f !== 'sloppy.wav'));
};
