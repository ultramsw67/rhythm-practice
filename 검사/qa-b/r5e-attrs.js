const SET = require('./sets.json').melody4;
module.exports = async (c) => {
  await c.size(390, 844);
  await c.go('http://127.0.0.1:8772/');
  await c.ev(`(()=>{ indexedDB.deleteDatabase('rhythm-practice'); localStorage.clear(); })()`);
  await c.go('http://127.0.0.1:8772/');
  await c.ev(`(()=>{ Object.assign(RP.set, ${JSON.stringify(SET)}); RP.rebuild(); })()`);
  await c.ev(`(async()=>{ document.querySelector('#selfSloppy').click(); await new Promise(r=>setTimeout(r,3000)); })()`);
  const sampleId = await c.ev(`RPX.take.result.notes.find(n=>n.grade!=='miss'&&n.ids&&n.ids.length).ids[0]`);
  const out = await c.ev(`(()=>{ const el=document.getElementById('vf-ev${sampleId}'); if(!el) return 'NOEL';
    const paths = [...el.querySelectorAll('path')].map(p=>({cls:p.getAttribute('class'), attrs: [...p.attributes].map(a=>a.name+'='+a.value).join(' | ')}));
    return { html: el.outerHTML.length, paths }; })()`);
  console.log('sampleId', sampleId, JSON.stringify(out, null, 1));
};
