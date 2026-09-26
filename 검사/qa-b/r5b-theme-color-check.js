// R5b: 결과 악보의 등급 색이 테마 전환 후에도 남아있는지 정확히 재확인 (채점 시험 사용, 마이크 불필요)
const SET = require('./sets.json').melody4;
module.exports = async (c) => {
  await c.size(390, 844);
  await c.go('http://127.0.0.1:8772/');
  await c.ev(`(()=>{ indexedDB.deleteDatabase('rhythm-practice'); localStorage.clear(); })()`);
  await c.go('http://127.0.0.1:8772/');
  await c.ev(`(()=>{ Object.assign(RP.set, ${JSON.stringify(SET)}); RP.rebuild(); })()`);
  await c.ev(`(async()=>{ document.querySelector('#selfSloppy').click(); await new Promise(r=>setTimeout(r,3000)); })()`);
  const out = {};
  out.grades = await c.ev(`RPX.take.result.notes.map(n=>({id:n.ids[0], grade:n.grade}))`);
  out.before = await c.ev(`(()=>{ const g=RPX.take.result.notes.find(n=>n.grade!=='miss'&&n.ids&&n.ids.length); const el=document.getElementById('vf-ev'+g.ids[0]); return { grade:g.grade, sampleId:g.ids[0], outerHTML: el?el.outerHTML.slice(0,400):null }; })()`);
  await c.shotEl('qa-b/r5b-score-before.png', '#resScore');
  const cssBefore = await c.ev(`getComputedStyle(document.documentElement).getPropertyValue('--ok').trim()+'|'+getComputedStyle(document.documentElement).getPropertyValue('--warn').trim()+'|'+getComputedStyle(document.documentElement).getPropertyValue('--bad').trim()`);
  await c.ev(`document.querySelector('#themeBtn').click()`); // -> light
  await c.sleep(150);
  await c.ev(`document.querySelector('#themeBtn').click()`); // -> dark
  await c.sleep(200);
  const cssAfter = await c.ev(`getComputedStyle(document.documentElement).getPropertyValue('--ok').trim()+'|'+getComputedStyle(document.documentElement).getPropertyValue('--warn').trim()+'|'+getComputedStyle(document.documentElement).getPropertyValue('--bad').trim()`);
  await c.shotEl('qa-b/r5b-score-afterthemenorerender.png', '#resScore');
  out.afterThemeNoRerenderHtml = await c.ev(`(()=>{ const el=document.getElementById('vf-ev'+${out.before.sampleId}); return el?el.outerHTML.slice(0,400):null; })()`);
  // 탭을 나갔다 재진입(재렌더 트리거)
  await c.ev(`document.querySelector('nav.tabs [data-tab=library]').click()`);
  await c.ev(`document.querySelector('nav.tabs [data-tab=result]').click()`);
  await c.sleep(300);
  await c.shotEl('qa-b/r5b-score-afterreenter.png', '#resScore');
  out.afterReenterHtml = await c.ev(`(()=>{ const el=document.getElementById('vf-ev'+${out.before.sampleId}); return el?el.outerHTML.slice(0,400):null; })()`);
  out.cssBefore = cssBefore; out.cssAfter = cssAfter;
  console.log(JSON.stringify(out, null, 1));
};
