const SET = require('./sets.json').melody4;
module.exports = async (c) => {
  await c.size(390, 844);
  await c.go('http://127.0.0.1:8772/');
  await c.ev(`(()=>{ indexedDB.deleteDatabase('rhythm-practice'); localStorage.clear(); })()`);
  await c.go('http://127.0.0.1:8772/');
  await c.ev(`(()=>{ Object.assign(RP.set, ${JSON.stringify(SET)}); RP.rebuild(); })()`);
  await c.ev(`(async()=>{ document.querySelector('#selfSloppy').click(); await new Promise(r=>setTimeout(r,3000)); })()`);
  const fillOf = () => c.ev(`(()=>{
    const el = document.querySelector('#resScore [id="vf-ev0"]');
    if (!el) return 'NOEL';
    const g = el.querySelector('.vf-notehead');
    return {
      stavenoteAttrs: [...el.attributes].map(a=>a.name+'='+a.value).join(' | '),
      noteheadGAttrs: g && [...g.attributes].map(a=>a.name+'='+a.value).join(' | '),
      pathAttrs: g && [...g.querySelectorAll('path')].map(p=>[...p.attributes].map(a=>a.name+'='+a.value.slice(0,15)).join(',')),
    };
  })()`);
  const out = {};
  out.before = await fillOf();
  await c.ev(`document.querySelector('#themeBtn').click()`); await c.sleep(150);
  await c.ev(`document.querySelector('#themeBtn').click()`); await c.sleep(250);
  out.afterThemeNoRerender = await fillOf();
  await c.ev(`document.querySelector('nav.tabs [data-tab=library]').click()`);
  await c.ev(`document.querySelector('nav.tabs [data-tab=result]').click()`);
  await c.sleep(300);
  out.afterReenter = await fillOf();
  console.log(JSON.stringify(out, null, 1));
};
