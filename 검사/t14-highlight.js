// 진행 표시 색 대비 확인: 재생 중간에 악보를 찍는다
module.exports = async (c) => {
  await c.size(390, 844);
  await c.go(process.env.URL0 || 'http://127.0.0.1:' + (process.env.PORT || 8765) + '/');
  const r = await c.ev(`(async()=>{
    Object.assign(RP.set,{mode:'melody',level:1,meter:'4/4',bars:4,inst:'flute',key:'C',bpm:100,artic:'auto',seed:12,edits:{}}); RP.rebuild();
    document.querySelector('#countIn').value='1';
    document.querySelector('#score').scrollIntoView();
    document.querySelector('#playBtn').click();
    await new Promise(r=>setTimeout(r, (2.4+0.12+3.2)*1000));
    const now = document.querySelectorAll('#score .now').length, done = document.querySelectorAll('#score .done').length;
    const el = document.querySelector('#score .now path'); const fill = el ? getComputedStyle(el).fill : null;
    return { now, done, fill };
  })()`);
  console.log(JSON.stringify(r));
  await c.shotEl('highlight.png', '#score');
  const s = await c.ev(`(async()=>{ document.querySelector('#playBtn').click(); await new Promise(r=>setTimeout(r,200)); return document.querySelectorAll('#score .now, #score .done').length })()`);
  console.log('after stop', s);
};
