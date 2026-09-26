// R3: 선율 모드 완벽 연주 - 음정/센트, 노트 탭 상세, 듣기 토글, 다시 녹음, 저장 버튼 숨김 확인
const SET = require('./sets.json').melody4;
module.exports = async (c) => {
  await c.size(390, 844);
  await c.go('http://127.0.0.1:8772/');
  await c.ev(`(()=>{ indexedDB.deleteDatabase('rhythm-practice'); localStorage.clear(); })()`);
  await c.go('http://127.0.0.1:8772/');
  await c.ev(`(()=>{ Object.assign(RP.set, ${JSON.stringify(SET)}); RP.rebuild(); document.querySelector('#countIn').value='1'; document.querySelector('#metroOn').checked=true; document.querySelector('#listen').value='ear'; })()`);
  await c.ev(`document.querySelector('#recBtn').click()`);
  let st = '';
  for (let i = 0; i < 60; i++) { await c.sleep(1000); st = await c.ev(`document.querySelector('#recStatus').textContent`); if (/점 —|오류|못|않|멈췄/.test(st)) break; }
  const out = { status: st };
  out.result = await c.ev(`({ total: document.querySelector('#resTotal').textContent, parts: document.querySelector('#resParts').textContent.slice(0,120), saveHidden: document.querySelector('#resSave').classList.contains('hide'), cents: RPX.take.result.notes.map(n=>n.cents), grades: RPX.take.result.notes.map(n=>n.grade) })`);
  await c.shot('qa-b/r3-result.png');
  // 노트 탭 (첫 번째 히트 좌표 클릭)
  out.tap = await c.ev(`(()=>{ const host=document.querySelector('#resScore'); const hit=(host._hits||[])[0]; if(!hit) return 'no-hit'; const rc=host.getBoundingClientRect(); const s=host._scale||1;
    host.dispatchEvent(new MouseEvent('click',{bubbles:true,clientX:rc.left+hit.x*s, clientY: rc.top+6+((hit.y0+hit.y1)/2)*s})); return document.querySelector('#resNote').textContent; })()`);
  // ▶ 내 연주 듣기 토글
  out.playToggle1 = await c.ev(`(async()=>{ document.querySelector('#resPlay').click(); await new Promise(r=>setTimeout(r,300)); return document.querySelector('#resPlay').textContent; })()`);
  out.playToggle2 = await c.ev(`(async()=>{ document.querySelector('#resPlay').click(); await new Promise(r=>setTimeout(r,300)); return document.querySelector('#resPlay').textContent; })()`);
  // 다시 녹음
  out.again = await c.ev(`(()=>{ document.querySelector('#resAgain').click(); return { tab: !document.querySelector('#tab-practice').classList.contains('hide'), setBack: JSON.stringify(RP.set)===JSON.stringify(${JSON.stringify(SET)}) }; })()`);
  console.log(JSON.stringify(out, null, 1));
};
