// 녹음 → 채점 → 저장 → 보관함 전체 흐름
const SET = JSON.parse(process.env.SET);
module.exports = async (c) => {
  await c.size(390, 844);
  await c.go('http://127.0.0.1:8765/');
  await c.ev(`(()=>{ indexedDB.deleteDatabase('rhythm-practice'); localStorage.clear(); })()`);
  await c.go('http://127.0.0.1:8765/');
  await c.ev(`(()=>{ Object.assign(RP.set, ${JSON.stringify(SET)}); RP.rebuild(); document.querySelector('#countIn').value='1'; document.querySelector('#metroOn').checked=true; })()`);
  // 1) 가상 연주 채점
  const s1 = await c.ev(`(async()=>{ document.querySelector('#selfPerfect').click(); await new Promise(r=>setTimeout(r,2500)); return { tab: !document.querySelector('#tab-result').classList.contains('hide'), total: document.querySelector('#resTotal').textContent, tips: document.querySelector('#resTips').textContent, svg: !!document.querySelector('#resScore svg') } })()`);
  console.log('selfPerfect', JSON.stringify(s1));
  await c.shot('res-perfect.png');
  const s2 = await c.ev(`(async()=>{ document.querySelector('#selfSloppy').click(); await new Promise(r=>setTimeout(r,2500)); return { total: document.querySelector('#resTotal').textContent, tips: [...document.querySelectorAll('#resTips li')].map(l=>l.textContent) } })()`);
  console.log('selfSloppy', JSON.stringify(s2));
  await c.shot('res-sloppy.png');
  // 저장
  const s3 = await c.ev(`(async()=>{ document.querySelector('#resSave').click(); await new Promise(r=>setTimeout(r,500)); const all = await RPX.DB.all(); return all.length })()`);
  console.log('saved count', s3);
  // 2) 실제 녹음 (가짜 마이크)
  const dur = await c.ev(`(async()=>{ document.querySelector('nav.tabs [data-tab=practice]').click(); await new Promise(r=>setTimeout(r,300)); document.querySelector('#recBtn').click(); return RP.score ? 1 : 0 })()`);
  let st = '';
  for (let i = 0; i < 90; i++) {
    await c.sleep(1000);
    st = await c.ev(`document.querySelector('#recStatus').textContent`);
    if (i === 3) await c.shotEl('rec-live.png', '#recCard');
    if (/점 —|오류|못|않|멈췄/.test(st)) break;
  }
  console.log('rec status', st);
  const s4 = await c.ev(`({ total: document.querySelector('#resTotal').textContent, tips: [...document.querySelectorAll('#resTips li')].map(l=>l.textContent), parts: document.querySelector('#resParts').textContent, take: RPX.take && { matched: RPX.take.result.matched, count: RPX.take.result.count, dev: RPX.take.result.meanDevMs, fit: RPX.take.result.played } })`);
  console.log('recorded', JSON.stringify(s4));
  await c.shot('res-rec.png');
  // 3) 보관함: 목록·이름 바꾸기·삭제
  const s5 = await c.ev(`(async()=>{
    document.querySelector('nav.tabs [data-tab=library]').click(); await new Promise(r=>setTimeout(r,500));
    const n1 = document.querySelectorAll('#libList .take').length;
    document.querySelector('#libList .take [data-a=rename]').click(); await new Promise(r=>setTimeout(r,100));
    const inp = document.querySelector('#libList .take .nm input'); inp.value='테스트 이름'; document.querySelector('#libList [data-a=saveName]').click(); await new Promise(r=>setTimeout(r,500));
    const names = [...document.querySelectorAll('#libList .nm')].map(x=>x.textContent.trim());
    document.querySelector('#libSort').value='hi'; document.querySelector('#libSort').dispatchEvent(new Event('change')); await new Promise(r=>setTimeout(r,400));
    const sorted = [...document.querySelectorAll('#libList .sc')].map(x=>x.textContent);
    const del = document.querySelector('#libList .take:last-child [data-a=del]'); del.click(); const lbl = del.textContent; del.click(); await new Promise(r=>setTimeout(r,500));
    const n2 = document.querySelectorAll('#libList .take').length;
    return { n1, names, sorted, lbl, n2 };
  })()`);
  console.log('library', JSON.stringify(s5));
  await c.shot('lib.png');
};
