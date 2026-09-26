module.exports = async (c) => {
  await c.size(390, 844, true);
  const B = 'http://127.0.0.1:8773/';
  await c.go(B);
  const r = await c.ev(`(async ()=>{
    RP.set.mode='melody'; RP.set.meter='12/8'; RP.set.bars=16; RP.set.level=3; RP.set.bpm=40; RP.set.pickup='auto'; RP.set.edits={};
    const t0 = performance.now();
    RP.rebuild();
    const t1 = performance.now();
    // 강제로 다시 그리기(레이아웃 재확인)
    RP.draw();
    const t2 = performance.now();
    return { rebuildMs: t1-t0, drawMs: t2-t1, events: RP.score.events.length, measures: RP.score.measures.length };
  })()`);
  console.log('render-perf', JSON.stringify(r));

  const t = await c.ev(`(async ()=>{
    const t0 = performance.now();
    document.querySelector('#selfPerfect').click();
    // selfTest 는 비동기라 결과 탭 전환까지 대기
    await new Promise(res=>{
      const iv = setInterval(()=>{ if(!document.querySelector('#tab-result').classList.contains('hide')){ clearInterval(iv); res(); } }, 20);
      setTimeout(()=>{clearInterval(iv); res();}, 20000);
    });
    const t1 = performance.now();
    return { selfTestMs: t1-t0, total: (window.RPX.take||{}).result && RPX.take.result.total, shown: !document.querySelector('#tab-result').classList.contains('hide') };
  })()`);
  console.log('selftest-perf', JSON.stringify(t));
  await c.shotEl('qa-c/perf-score.png', '#score');
};
