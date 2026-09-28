// v3.3 드럼 세트: 단계별 악보 캡처(kit-lv*.png), 오류·가로 넘침·잘림, 들어보기, 가상 연주 100
module.exports = async (c) => {
  await c.size(+(process.env.W || 390), 900, true);
  await c.go('http://127.0.0.1:' + (process.env.PORT || 8765) + '/');
  await c.ev(`localStorage.setItem('rp.startSeen','true')`);
  const errs = await c.ev(`(()=>{window.__e=[];window.addEventListener('error',e=>__e.push(e.message));const oe=console.error;console.error=(...a)=>{__e.push(a.map(String).join(' '));oe(...a)};return 1})()`);
  for (const [lv, meter, seed] of [[1,'4/4',7],[2,'4/4',7],[3,'4/4',7],[5,'4/4',7],[6,'4/4',7],[7,'4/4',8],[4,'6/8',3],[4,'3/4',3],[2,'2/2',3],[5,'7/8',3],[5,'5/4',3],[7,'12/8',3]]) {
    const r = await c.ev(`(()=>{Object.assign(RP.set,{gen:2,drum:'kit',mode:'rhythm',level:${lv},meter:'${meter}',bars:4,pickup:'off',artic:'auto',bpm:90,seed:${seed},edits:{}});RP.rebuild();
      const svg=document.querySelector('#score svg'); const ph=document.querySelector('#score .placeholder');
      const W=svg?+svg.getAttribute('width'):0, bb=svg?svg.getBBox():null, k=svg&&svg.viewBox.baseVal&&svg.viewBox.baseVal.width?W/svg.viewBox.baseVal.width:1;
      return JSON.stringify({info:document.querySelector('#scoreInfo').textContent, ph: ph&&ph.textContent, over: bb?Math.round((bb.x+bb.width)*k-W):null, errs: __e.slice()})})()`);
    console.log('lv' + lv, meter, r);
    await c.shotEl(`kit-lv${lv}-${meter.replace('/','_')}.png`, '#score');
  }
  const p = await c.ev(`(async()=>{document.querySelector('#playBtn').click(); await new Promise(r=>setTimeout(r,3500)); const now=document.querySelectorAll('#score .now').length, btn=document.querySelector('#playBtn').textContent; document.querySelector('#playBtn').click(); return JSON.stringify({now,btn,errs:__e.slice()})})()`);
  console.log('play', p);
  const s = await c.ev(`(async()=>{await RPX.selfTest(); await new Promise(r=>setTimeout(r,2500)); return document.querySelector('#resTotal').textContent + ' ' + JSON.stringify(__e)})()`);
  console.log('self', s);
};
