// v3.8.4 악센트 → 마르카토: 실주소(URL0)에서 사용자 악보 2064148116 + 악보 200개에 악센트가 없는지, 기호 단추에 악센트가 없는지
module.exports = async (c) => {
  const U = process.env.URL0 || 'http://127.0.0.1:8765/';
  await c.size(390, 844, true); await c.go(U);
  await c.ev(`localStorage.setItem('rp.startSeen','true')`); await c.go(U);
  const ver = await c.ev(`[...document.querySelectorAll('p')].map(p=>p.textContent).find(t=>/버전 v/.test(t))`);
  const r = await c.ev(`(()=>{let acc=0,marc=0,n=0;
    for(const mode of ['rhythm','melody'])for(let s=0;s<100;s++){Object.assign(RP.set,{mode,drum:'',prac:'',level:1+s%7,meter:'4/4',artic:'auto',seed:5000+s,edits:{}});RP.rebuild();n++;
      for(const e of RP.score.events){if(e.artic.includes('acc'))acc++;if(e.artic.includes('marc'))marc++;}}
    Object.assign(RP.set,{mode:'rhythm',drum:'',prac:'',level:5,meter:'4/4',bars:4,pickup:'auto',artic:'auto',bpm:88,seed:2064148116,edits:{}});RP.rebuild();
    const ev=RP.score.events.find(e=>!e.rest); RP.openSheet(ev.id);
    const chips=[...document.querySelectorAll('#articSheet .chip')].map(b=>b.textContent);
    return JSON.stringify({n,acc,marc,svgAccent:[...document.querySelectorAll('#score text')].filter(t=>t.textContent==='\uE4A0'||t.textContent==='\uE4A1').length,chips,info:document.querySelector('#scoreInfo').textContent})})()`);
  console.log(ver, r);
  await c.ev(`document.querySelector('#articSheet .chip') && (window.closeSheet ? closeSheet() : document.querySelector('#articSheet').classList.add('hide'))`);
  await c.shotEl('marc-user.png', '#score');
};
