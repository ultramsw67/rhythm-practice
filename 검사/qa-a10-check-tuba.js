const BASE = 'http://127.0.0.1:8771/';
module.exports = async (c) => {
  await c.size(320, 950, true);
  await c.go(BASE);
  const out = await c.ev(`(()=>{
    Object.assign(RP.set,{mode:'melody',level:3,meter:'6/8',bars:4,inst:'tuba',key:'Cb',bpm:208,artic:'auto',pickup:'off',seed:11,edits:{}});
    RP.rebuild();
    const host = document.querySelector('#score');
    const svg = host.querySelector('svg');
    const vb = svg.getAttribute('viewBox').split(' ').map(Number);
    const bb = svg.getBBox();
    return {
      hostClientWidth: host.clientWidth,
      svgAttrWidth: svg.getAttribute('width'), svgAttrHeight: svg.getAttribute('height'),
      svgStyle: svg.getAttribute('style'),
      viewBox: vb, bbox: {x:bb.x,y:bb.y,w:bb.width,h:bb.height},
      overRight: (bb.x+bb.width)-vb[2],
      events: RP.score.events.map(e=>({id:e.id,base:e.base,dots:e.dots,rest:e.rest,dur:e.dur,tup:e.tup||null})),
    };
  })()`);
  console.log(JSON.stringify(out, null, 1));
};
