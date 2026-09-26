const SET = require('./sets.json').melody4;
module.exports = async (c) => {
  await c.size(390, 844);
  await c.go('http://127.0.0.1:8772/');
  await c.ev(`(()=>{ indexedDB.deleteDatabase('rhythm-practice'); localStorage.clear(); })()`);
  await c.go('http://127.0.0.1:8772/');
  await c.ev(`(()=>{ Object.assign(RP.set, ${JSON.stringify(SET)}); RP.rebuild(); })()`);
  await c.ev(`(async()=>{ document.querySelector('#selfSloppy').click(); await new Promise(r=>setTimeout(r,3000)); })()`);
  const out = await c.ev(`(()=>{
    const all = [...document.querySelectorAll('[id="vf-ev0"]')];
    return all.map(el => ({ svgAncestorId: el.closest('svg') && el.closest('svg').id, inResScore: !!el.closest('#resScore'), inScore: !!el.closest('#score'),
      paths: [...el.querySelectorAll('path')].map(p=>({attrs:[...p.attributes].map(a=>a.name+'='+a.value.slice(0,20)).join(',')})) }));
  })()`);
  console.log(JSON.stringify(out, null, 1));
};
