const BASE = 'http://127.0.0.1:8771/';
module.exports = async (c) => {
  await c.size(320, 900, true);
  await c.go(BASE);
  const out = await c.ev(`(()=>{
    Object.assign(RP.set,{mode:'melody',level:3,meter:'7/8',bars:3,inst:'clarinet',key:'Fm',bpm:160,artic:'auto',pickup:'off',seed:55,edits:{}});
    RP.rebuild();
    const svg = document.querySelector('#score svg');
    const all = {};
    svg.querySelectorAll('[class]').forEach(el => { const cl = el.getAttribute('class'); all[cl]=(all[cl]||0)+1; });
    // 텍스트 요소들 (빠르기말, 잇단음표 숫자)
    const texts = [...svg.querySelectorAll('text')].map(t => ({txt:t.textContent, cls: t.getAttribute('class'), parentCls: t.parentElement && t.parentElement.getAttribute('class')}));
    return { all, texts };
  })()`);
  console.log(JSON.stringify(out, null, 1));
};
