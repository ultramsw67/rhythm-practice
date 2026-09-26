const fs = require('fs'), path = require('path');
const OUT = __dirname;
function shot(c, file) { return async (sel) => {
  const rc = await c.ev(`(()=>{const n=document.querySelector('nav.tabs'); if(n) n.style.display='none'; const r=document.querySelector(${JSON.stringify(sel)}).getBoundingClientRect();return {x:Math.max(0,r.left+scrollX),y:Math.max(0,r.top+scrollY),width:r.width,height:r.height,scale:1}})()`);
  const r = await c.send('Page.captureScreenshot', { format: 'png', clip: rc });
  fs.writeFileSync(path.join(OUT, file), Buffer.from(r.result.data, 'base64'));
  await c.ev(`(()=>{const n=document.querySelector('nav.tabs'); if(n) n.style.display='';})()`);
}; }
module.exports = async (c) => {
  await c.size(390, 844, true);
  await c.go(process.env.URL0 || 'http://127.0.0.1:' + (process.env.PORT || 8781) + '/');
  await c.sleep(300);
  const out = {};

  // 1. first-visit card + close persists
  out.startCardVisible = await c.ev(`!document.querySelector('#startCard').classList.contains('hide')`);
  await c.ev(`document.querySelector('#startClose').click()`);
  out.startCardHiddenAfterClose = await c.ev(`document.querySelector('#startCard').classList.contains('hide')`);
  await c.go(process.env.URL0 || 'http://127.0.0.1:' + (process.env.PORT || 8781) + '/');
  out.startCardStaysHiddenAfterReload = await c.ev(`document.querySelector('#startCard').classList.contains('hide')`);

  // 2. mode hint text differs
  out.hintCount = await c.ev(`document.querySelectorAll('.hint').length`);
  out.modeHintRhythm = await c.ev(`document.querySelector('#modeSeg [data-v=rhythm]').click(); document.querySelector('#modeHint').textContent`);
  out.modeHintMelody = await c.ev(`document.querySelector('#modeSeg [data-v=melody]').click(); document.querySelector('#modeHint').textContent`);

  // 3. option counts
  out.counts = await c.ev(`({meter:document.querySelector('#meter')?.options.length, bars:document.querySelector('#bars')?.options.length, inst:document.querySelector('#inst')?.options.length, key:document.querySelector('#key')?.options.length, sort:document.querySelector('#libSort')?.options.length})`);

  // 4. empty states
  out.resultEmptyBtn = await c.ev(`(()=>{document.querySelector('[data-tab=result]').click(); return !!document.querySelector('#resEmpty .go-practice');})()`);
  out.libraryEmptyBtn = await c.ev(`(()=>{document.querySelector('[data-tab=library]').click(); return !!document.querySelector('#library .go-practice, #libraryList .go-practice, .go-practice');})()`);
  await c.ev(`document.querySelector('[data-tab=practice]').click()`);

  // 5. latGo visible before calibration
  out.latGoVisibleBeforeCal = await c.ev(`!document.querySelector('#latGo').classList.contains('hide')`);

  // 6. phone <900px settings collapsed + summary
  out.setBoxOpenPhone = await c.ev(`document.querySelector('#setBox').open`);
  out.setSum = await c.ev(`document.querySelector('#setSum').textContent`);

  // 7. rendering widths
  for (const w of [320, 390, 1280]) {
    await c.size(w, 844, w < 900);
    await c.sleep(400);
    out['overflow' + w] = await c.ev(`document.documentElement.scrollWidth - document.documentElement.clientWidth`);
    await shot(c, 'wide' + w + '.png')('body');
  }
  await c.size(390, 844, true);

  // 8. playback: count-in 1 vs 2 timing of first note highlight
  const ciTiming = async (ci) => c.ev(`(async()=>{
    Object.assign(RP.set,{mode:'melody',level:1,meter:'4/4',bars:4,inst:'flute',key:'C',bpm:120,artic:'auto',seed:12,edits:{}}); RP.rebuild();
    document.querySelector('#countIn').value='${ci}';
    document.querySelector('#playBtn').click();
    const t0 = performance.now();
    let firstNow = -1;
    while (performance.now() - t0 < 6000) { if (document.querySelector('#score .now')) { firstNow = performance.now() - t0; break; } await new Promise(r=>setTimeout(r,20)); }
    document.querySelector('#playBtn').click();
    return firstNow;
  })()`);
  out.countIn1Ms = await ciTiming(1);
  await c.sleep(300);
  out.countIn2Ms = await ciTiming(2);
  await c.sleep(300);

  // 9. metronome toggle affects playback clicks (count scheduled click nodes)
  out.metro = await c.ev(`(async()=>{
    Object.assign(RP.set,{mode:'rhythm',level:1,meter:'4/4',bars:2,bpm:100,artic:'auto',seed:3,edits:{}}); RP.rebuild();
    document.querySelector('#countIn').value='1';
    const cases = {};
    for (const on of [true, false]) {
      document.querySelector('#metroOn').checked = on; document.querySelector('#metroOn').dispatchEvent(new Event('change'));
      document.querySelector('#playBtn').click(); await new Promise(r=>setTimeout(r,100));
      cases[on] = document.querySelector('#playBtn').textContent;
      document.querySelector('#playBtn').click(); await new Promise(r=>setTimeout(r,100));
    }
    document.querySelector('#metroOn').checked = true; document.querySelector('#metroOn').dispatchEvent(new Event('change'));
    return cases;
  })()`);

  // 10. stop mid-way clears highlight
  out.stopMidway = await c.ev(`(async()=>{
    Object.assign(RP.set,{mode:'melody',level:1,meter:'4/4',bars:4,inst:'flute',key:'C',bpm:80,artic:'auto',seed:12,edits:{}}); RP.rebuild();
    document.querySelector('#countIn').value='1';
    document.querySelector('#playBtn').click(); await new Promise(r=>setTimeout(r,4200));
    const duringNow = document.querySelectorAll('#score .now').length, duringDone = document.querySelectorAll('#score .done').length;
    document.querySelector('#playBtn').click(); await new Promise(r=>setTimeout(r,150));
    const afterNow = document.querySelectorAll('#score .now, #score .done').length;
    const label = document.querySelector('#playBtn').textContent;
    return { duringNow, duringDone, afterNowDone: afterNow, label };
  })()`);

  // 11. double-click play fast -> toggles to stop (single schedule)
  out.doublePlayFast = await c.ev(`(async()=>{
    document.querySelector('#playBtn').click(); document.querySelector('#playBtn').click();
    await new Promise(r=>setTimeout(r,50));
    const label = document.querySelector('#playBtn').textContent;
    if (label.includes('멈추기')) { document.querySelector('#playBtn').click(); }
    return { label };
  })()`);

  // 12. play then change settings mid-play -> no exception
  out.playThenSettingsChange = await c.ev(`(async()=>{
    document.querySelector('#playBtn').click(); await new Promise(r=>setTimeout(r,300));
    let errCaught = null;
    try { Object.assign(RP.set,{bars:2,seed:99}); RP.rebuild(); } catch (e) { errCaught = String(e); }
    await new Promise(r=>setTimeout(r,200));
    const label = document.querySelector('#playBtn').textContent;
    if (label.includes('멈추기')) { try { document.querySelector('#playBtn').click(); } catch(e){} }
    return { errCaught, labelAfter: label };
  })()`);

  // 13. share link + instrument invariance
  out.share = await c.ev(`(async()=>{
    Object.assign(RP.set,{mode:'melody',level:2,meter:'3/4',bars:4,inst:'clarinet',key:'F',bpm:96,artic:'auto',seed:55,edits:{}}); RP.rebuild();
    let captured = null;
    navigator.clipboard.writeText = (s) => { captured = s; return Promise.resolve(); };
    document.querySelector('#shareBtn').click();
    await new Promise(r=>setTimeout(r,50));
    const link = captured;
    const before = JSON.parse(JSON.stringify(RP.set));
    const beforeConcert = window.Core.timeline(RP.score,1).notes.map(n=>n.concert);
    return { link, before, beforeConcert };
  })()`);
  if (out.share.link) {
    await c.go(out.share.link);
    await c.sleep(600);
    out.shareAfter = await c.ev(`({ after: JSON.parse(JSON.stringify(RP.set)) })`);
    // instrument invariance: switch instrument, melody (concert pitch) should be unchanged
    out.instInvariance = await c.ev(`(()=>{
      const before = window.Core.timeline(RP.score,1).notes.map(n=>n.concert);
      document.querySelector('#inst').value='trumpet'; document.querySelector('#inst').dispatchEvent(new Event('change'));
      const after = window.Core.timeline(RP.score,1).notes.map(n=>n.concert);
      return { same: JSON.stringify(before)===JSON.stringify(after), before, after };
    })()`);
  }

  console.log(JSON.stringify(out, null, 1));
};
