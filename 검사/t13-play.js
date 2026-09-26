// 들어보기 중 음표 표시가 계속 켜지는지 (예비박 뒤 여러 시점)
module.exports = async (c) => {
  await c.size(390, 844);
  await c.go(process.env.URL0 || 'http://127.0.0.1:' + (process.env.PORT || 8765) + '/');
  const r = await c.ev(`(async()=>{
    Object.assign(RP.set,{mode:'melody',level:2,meter:'4/4',bars:2,inst:'flute',key:'C',bpm:120,artic:'auto',seed:5,edits:{}}); RP.rebuild();
    document.querySelector('#countIn').value='1';
    document.querySelector('#playBtn').click();
    const lead = 2.0 + 0.12, marks = [];
    await new Promise(r=>setTimeout(r, lead*1000 + 100));
    for (let k=0;k<12;k++){ marks.push(document.querySelectorAll('#score .now').length); await new Promise(r=>setTimeout(r,150)); }
    const btn=document.querySelector('#playBtn').textContent; document.querySelector('#playBtn').click();
    return { marks, btn, after: document.querySelectorAll('#score .now').length };
  })()`);
  console.log(JSON.stringify(r));
};
