module.exports = async (c) => {
  await c.size(320, 700); await c.go('http://127.0.0.1:8765/');
  await c.ev(`window.__errs=[]; addEventListener('error',e=>__errs.push(String(e.message))); addEventListener('unhandledrejection',e=>__errs.push('rej '+String(e.reason))); 1`);
  const tap = async (sel) => { const p = await c.ev(`(()=>{const e=document.querySelector(${JSON.stringify(sel)}); e.scrollIntoView({block:'center'}); const r=e.getBoundingClientRect(); return {x:r.left+r.width/2,y:r.top+r.height/2}})()`); for (const type of ['mousePressed', 'mouseReleased']) await c.send('Input.dispatchMouseEvent', { type, x: p.x, y: p.y, button: 'left', clickCount: 1 }); };
  const o = {};
  // 녹음 기록 하나 만들기 (가상 연주 저장)
  await c.ev(`(async()=>{ Object.assign(RP.set,{mode:'rhythm',drum:'',level:2,meter:'4/4',bars:4,bpm:100,seed:8}); RP.syncForm(); RP.rebuild(); document.querySelector('nav.tabs [data-tab=settings]').click(); document.querySelector('#selfSloppy').click(); await new Promise(r=>setTimeout(r,4000)); document.querySelector('#resSave').click(); await new Promise(r=>setTimeout(r,600)); return 1; })()`);
  await tap('#resPlay'); await c.sleep(600); o.resPlaying = await c.ev('!!RPX.playing + " " + document.querySelector("#resPlay").textContent');
  await tap('nav.tabs [data-tab=practice]'); await c.sleep(500); o.afterLeave = await c.ev('!!RPX.playing + " play=" + document.querySelector("#playBtn").textContent');
  await tap('nav.tabs [data-tab=result]'); await c.sleep(300); o.resBtnBack = await c.ev('document.querySelector("#resPlay").textContent');
  await tap('#resPlay'); await c.sleep(600); await tap('#resAgain'); await c.sleep(500); o.afterAgain = await c.ev('!!RPX.playing + " play=" + document.querySelector("#playBtn").textContent');
  await tap('#playBtn'); await c.sleep(600); o.practicePlay = await c.ev('!!RPX.playing + " " + document.querySelector("#playBtn").textContent');
  await tap('nav.tabs [data-tab=result]'); await c.sleep(300); await tap('#resPlay'); await c.sleep(600); o.both = await c.ev('!!RPX.playing + " res=" + document.querySelector("#resPlay").textContent + " prac=" + document.querySelector("#playBtn").textContent');
  await tap('#resPlay'); await c.sleep(300);
  // 보관함 듣기 → 다른 카드 결과 보기
  await tap('nav.tabs [data-tab=library]'); await c.sleep(500);
  await tap('#libList .take [data-a=play]'); await c.sleep(600); o.libPlay = await c.ev('document.querySelector("#libList .take [data-a=play]").textContent');
  await tap('#libList .take [data-a=result]'); await c.sleep(600); o.libToResult = await c.ev('!!RPX.playing + " res=" + document.querySelector("#resPlay").textContent');
  await tap('nav.tabs [data-tab=library]'); await c.sleep(400); o.libBtnBack = await c.ev('document.querySelector("#libList .take [data-a=play]").textContent');
  // 정렬
  o.sort = await c.ev(`(async()=>{ const s=document.querySelector('#libSort'); const r={}; for (const v of ['old','hi','lo','name','new']) { s.value=v; s.dispatchEvent(new Event('change',{bubbles:true})); await new Promise(r=>setTimeout(r,300)); r[v]=[...document.querySelectorAll('#libList .take .sc')].map(x=>x.textContent).join(','); } return r; })()`);
  // 320 난이도 단추 실제 누르기, 새 악보 두 번
  await tap('nav.tabs [data-tab=practice]'); await c.ev(`document.querySelector('#setBox').open=true`); await c.sleep(300);
  await tap('#levelSeg [data-v="4"]'); await c.sleep(300); o.lv = await c.ev('RP.set.level + " " + document.querySelector("#levelHint").textContent.slice(0,30)');
  const s0 = await c.ev('RP.set.seed'); await tap('#newBtn'); await tap('#newBtn'); await c.sleep(500); o.newDbl = await c.ev(`RP.set.seed !== ${s0} && RP.score.set.seed === RP.set.seed`);
  // 요약 줄 클릭으로 접기
  await tap('#setBox summary'); await c.sleep(200); o.setBoxOpen = await c.ev('document.querySelector("#setBox").open');
  await tap('#homeBtn'); await c.sleep(300); o.home = await c.ev('scrollY');
  console.log(JSON.stringify(o, null, 1));
  console.log('ERRS', JSON.stringify(await c.ev('window.__errs')));
};
