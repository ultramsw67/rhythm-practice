// reset-all double-press specifics + manifest/install + guide link check
const fs = require('fs');
module.exports = async (c) => {
  await c.size(390, 844, true);
  await c.go(process.env.URL0 || 'http://127.0.0.1:' + (process.env.PORT || 8781) + '/');
  await c.ev(`document.querySelector('#startClose').click()`);
  const out = {};

  // change several settings + instrument, add a fake library entry via localforage? skip; just check inst persists
  out.before = await c.ev(`(()=>{
    Object.assign(RP.set,{mode:'melody',level:2,meter:'3/4',bars:8,inst:'trombone',key:'F',bpm:160,artic:'manual',edits:{0:['stac']}}); RP.rebuild();
    document.querySelector('#metroOn').checked=false; document.querySelector('#metroOn').dispatchEvent(new Event('change'));
    document.querySelector('#countIn').value='2'; document.querySelector('#countIn').dispatchEvent(new Event('change'));
    document.querySelector('[data-tab=settings]').click();
    return { inst: RP.set.inst, bpm: RP.set.bpm, metro: document.querySelector('#metroOn').checked };
  })()`);

  out.resetAll = await c.ev(`(async()=>{
    const b = document.querySelector('#resetAll');
    b.click(); await new Promise(r=>setTimeout(r,50));
    const afterFirst = { inst: RP.set.inst, bpm: RP.set.bpm, btnText: b.textContent };
    b.click(); await new Promise(r=>setTimeout(r,300));
    const afterSecond = { inst: RP.set.inst, bpm: RP.set.bpm, metro: document.querySelector('#metroOn').checked, countIn: document.querySelector('#countIn').value };
    return { afterFirst, afterSecond };
  })()`);
  await c.ev(`document.querySelector('#homeBtn').click()`);
  await c.sleep(200);
  out.startCardBackAfterReset = await c.ev(`!document.querySelector('#startCard').classList.contains('hide')`);

  // manifest / installability
  const m = await c.send('Page.getAppManifest');
  out.manifestErrors = m.result && m.result.errors;
  const inst = await c.send('Page.getInstallabilityErrors');
  out.installabilityErrors = inst.result && inst.result.installabilityErrors;
  out.iconsAndMeta = await c.ev(`(async()=>{
    const r = await fetch(document.querySelector('link[rel=manifest]').href);
    const j = await r.json();
    const icons = await Promise.all(j.icons.map(async i => { const x = await fetch(new URL(i.src, r.url)); return i.src + ' ' + x.status; }));
    return { name: j.name, display: j.display, icons, apple: document.querySelector('link[rel=apple-touch-icon]')?.href, themeColor: document.querySelector('meta[name=theme-color]')?.content };
  })()`);

  // "이 앱에 대해" version display vs guide frontmatter (guide says v1.8 기준 but app note says v1.9)
  out.aboutVersionText = await c.ev(`(()=>{ const el=[...document.querySelectorAll('*')].find(e=>e.children.length===0 && /버전|v1\\./.test(e.textContent||'')); return el ? el.textContent.trim() : null; })()`);

  console.log(JSON.stringify(out, null, 1));
};
