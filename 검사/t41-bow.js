// v3.5 더블베이스 주법(활·튕기기·섞기): 주법 칸은 더블베이스만, 악보 pizz./arco 글자, 기호 창, 링크 왕복, 튕기는 소리, 가상 연주 100
module.exports = async (c) => {
  await c.size(390, 900, true);
  await c.go('http://127.0.0.1:' + (process.env.PORT || 8765) + '/');
  await c.ev(`localStorage.setItem('rp.startSeen','true')`);
  const base = `{gen:2,drum:'',mode:'melody',level:3,meter:'4/4',bars:4,key:'Bb',pickup:'off',artic:'auto',bpm:90,seed:5,edits:{}}`;
  for (const [inst, bow] of [['clarinet', 'pizz'], ['contrabass', ''], ['contrabass', 'pizz'], ['contrabass', 'mix']]) {
    const r = await c.ev(`(async()=>{Object.assign(RP.set,${base},{inst:'${inst}',bow:'${bow}'});RP.syncForm&&RP.syncForm();RP.rebuild();
      await new Promise(r=>setTimeout(r,800));
      const txt=[...document.querySelectorAll('#score text')].map(t=>t.textContent).filter(t=>t==='pizz.'||t==='arco');
      const ev=RP.score.events.filter(e=>!e.rest);
      const bad=ev.filter(e=>e.pizz&&e.artic.some(a=>['stac','stacc','ten'].includes(a))).length;
      const slurPizz=RP.score.slurs.filter(([a,b])=>RP.score.events.slice(a,b+1).some(e=>e.pizz)).length;
      const link=Core.decodeSet(Core.encodeSet(RP.set),{inst:'${inst}'});
      const st=null;
      return JSON.stringify({bowShown:!document.querySelector('.bowf').classList.contains('hide'), info:document.querySelector('#scoreInfo').textContent, marks:txt.join(','), pizzN:ev.filter(e=>e.pizz).length, notes:ev.length, bad, slurPizz, linkBow:link.bow, self: st && (st.total ?? st)})})()`);
    console.log(inst, bow || 'arco', r);
    if (inst === 'contrabass' && bow) await c.shotEl('bow-' + bow + '.png', '#score');
    console.log('  self', await c.ev(`(async()=>{await RPX.selfTest(false); const t=RPX.take; document.querySelector('nav.tabs button')?.click(); await new Promise(r=>setTimeout(r,300)); return t && t.result && t.result.total})()`));
  }
  // 튕기는 음 기호 창: 길이 기호·슬러 없음
  const chips = await c.ev(`(()=>{Object.assign(RP.set,${base},{inst:'contrabass',bow:'pizz',artic:'manual'});RP.rebuild(); const id=RP.score.events.find(e=>!e.rest).id; RP.openSheet? RP.openSheet(id) : document.querySelector('#vf-ev'+id)?.dispatchEvent(new MouseEvent('click',{bubbles:true})); return [...document.querySelectorAll('#sheetChips button')].map(b=>b.textContent).join(',')})()`);
  console.log('pizz chips', chips);
  // 튕기는 소리 불러오기·재생 버튼
  const snd = await c.ev(`(async()=>{Object.assign(RP.set,${base},{inst:'contrabass',bow:'mix'});RP.rebuild(); await RPX.loadSound('contrabass'); for(let i=0;i<40&&!RPX.pizzFor('contrabass');i++) await new Promise(r=>setTimeout(r,100));
    document.querySelector('#playBtn').click(); await new Promise(r=>setTimeout(r,1500)); const b=document.querySelector('#playBtn').textContent; document.querySelector('#playBtn').click();
    return JSON.stringify({pizz:!!RPX.pizzFor('contrabass'), info:document.querySelector('#soundInfo').textContent, playBtn:b})})()`);
  console.log('sound', snd);
};
