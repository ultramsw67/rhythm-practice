const BASE = 'http://127.0.0.1:8771/';
module.exports = async (c) => {
  await c.size(320, 900, true);
  await c.go(BASE);
  const out = await c.ev(`(()=>{
    Object.assign(RP.set,{mode:'melody',level:3,meter:'7/8',bars:3,inst:'clarinet',key:'Fm',bpm:160,artic:'auto',pickup:'off',seed:55,edits:{}});
    RP.rebuild();
    const svg = document.querySelector('#score svg');
    const topGs = [...svg.children].filter(e=>e.tagName==='g');
    const attrs = { width: svg.getAttribute('width'), height: svg.getAttribute('height'), viewBox: svg.getAttribute('viewBox'), style: svg.getAttribute('style') };
    const g0 = svg.querySelector('g');
    const g0transform = g0 ? g0.getAttribute('transform') : null;
    const bbox = g0 ? g0.getBBox() : null;
    const svgRect = svg.getBoundingClientRect();
    return { attrs, topGCount: topGs.length, g0transform, bbox, svgRect: {w:svgRect.width,h:svgRect.height} };
  })()`);
  console.log(JSON.stringify(out, null, 1));
};
