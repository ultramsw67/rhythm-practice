// v3.9 실주소 확인: 휴대폰 폭에서 단계 단추 5개, 단계마다 악보가 다른지, 새 악보 10번 리듬이 모두 다른지, 악센트 0
module.exports = async (c) => {
  const U = process.env.URL0 || 'http://127.0.0.1:8765/';
  await c.size(390, 844, true); await c.go(U);
  await c.ev(`localStorage.clear(); localStorage.setItem('rp.startSeen','true')`); await c.go(U);
  const r = await c.ev(`(()=>{const fp=()=>RP.score.events.map(e=>(e.rest?'r':'')+e.base+'.'.repeat(e.dots)+(e.tup?'/'+e.tup.n:'')).join(' ');
    document.querySelector('#setBox').open=true; const bs=[...document.querySelectorAll('#levelSeg button')];
    const lv=[]; for(const b of bs){b.click(); lv.push(fp());}
    bs[2].click(); const nw=new Set(); for(let k=0;k<10;k++){document.querySelector('#newBtn')?.click(); nw.add(fp());}
    let acc=0; for(const e of RP.score.events) if(e.artic.includes('acc')) acc++;
    return JSON.stringify({ver:[...document.querySelectorAll('p')].map(p=>p.textContent).find(t=>/버전 v/.test(t)), buttons:bs.length, gen:RP.set.gen, levelsDistinct:new Set(lv).size, newBtnDistinct:nw.size, acc, hint:document.querySelector('#levelHint').textContent, ox:document.documentElement.scrollWidth-innerWidth})})()`);
  console.log(r);
  await c.shotEl('live-v39.png', '#score');
};
