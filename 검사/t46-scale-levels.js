// v3.8.2: 음계 6·7단계 등 이웃 단계가 다른 악보인지 화면에서 확인 + 새 리듬 가상 연주 100 + 빠른 BPM 안내 문구
// 통과 기준: 각 줄 self 100, over 0, errs [] / 캡처 sl-*.png
module.exports = async (c) => {
  await c.size(390, 900, true);
  await c.go('http://127.0.0.1:' + (process.env.PORT || 8765) + '/');
  const cases = [['4/4',6,88],['4/4',7,88],['5/4',7,88],['2/2',3,88],['2/2',6,88],['2/2',7,88],['6/8',3,88],['6/8',4,88],['12/8',4,88],['4/4',7,208]];
  const errs = [];
  for (const [meter, level, bpm] of cases) {
    const r = await c.ev(`(async()=>{
      localStorage.setItem('rp.startSeen','true');
      window.__e = window.__e || []; if (!window.__h) { window.__h = 1; window.addEventListener('error', e => window.__e.push(String(e.message))); }
      Object.assign(RP.set,{gen:2,sv:2,drum:'',bow:'',mode:'melody',prac:'scale',minor:'h',kref:'',meter:${JSON.stringify(meter)},level:${level},bars:4,key:'Bb',inst:'alto_sax',pickup:'auto',artic:'auto',bpm:${bpm},seed:3,edits:{}});
      RP.rebuild(); await new Promise(r=>setTimeout(r,60));
      const host=document.querySelector('#score'), hr=host.getBoundingClientRect(); let over=0;
      for (const el of host.querySelectorAll('svg *')) { const q=el.getBoundingClientRect(); if (q.width && q.right>hr.right+1) over=Math.max(over, Math.round(q.right-hr.right)); }
      const rh = RP.score.events.slice(0,8).map(e=>(e.rest?'r':'')+e.base+'.'.repeat(e.dots)+(e.tup?'/'+e.tup.n:'')).join(' ');
      const info = document.querySelector('#scoreInfo').textContent;
      await RPX.selfTest(false); const t=RPX.take; document.querySelector('nav.tabs button')?.click(); await new Promise(r=>setTimeout(r,300));
      return JSON.stringify({rh, over, self:t&&t.result&&t.result.total, note: (info.match(/\(이 박자.*\)/)||[''])[0], errs: window.__e.slice(0,3)});
    })()`);
    console.log(meter, 'lv' + level, 'bpm' + bpm, r);
    await c.shotEl(`sl-${meter.replace('/', '_')}-lv${level}-${bpm}.png`, '#score');
  }
  // 옛 음계 기록(sv 없음): 결과·다시 연습은 옛 악보 그대로, "새 악보로 연습"을 누르면 새 방식
  const r2 = await c.ev(`(async()=>{
    const rh = () => RP.score.events.slice(0,6).map(e=>e.base+(e.tup?'/'+e.tup.n:'')).join(' ');
    Object.assign(RP.set,{gen:2,sv:2,prac:'scale',mode:'melody',meter:'4/4',level:7,bpm:88,inst:'alto_sax',key:'Bb',seed:3,edits:{}}); RP.rebuild();
    await RPX.selfTest(false); const t = RPX.take; delete t.set.sv;
    RPX.showResult(t, false); await new Promise(r=>setTimeout(r,200));
    document.querySelector('#resAgain').click(); await new Promise(r=>setTimeout(r,200));
    const again = { sv: RP.set.sv, rh: rh() };
    RPX.showResult(t, false); await new Promise(r=>setTimeout(r,200));
    document.querySelector('#resNew').click(); await new Promise(r=>setTimeout(r,200));
    const nw = { sv: RP.set.sv, rh: rh() };
    return JSON.stringify({ again, nw, ok: again.sv === 0 && /8\\/3/.test(again.rh) && nw.sv === 2 && /16\\/6/.test(nw.rh) });
  })()`);
  console.log('legacy take', r2);
};
