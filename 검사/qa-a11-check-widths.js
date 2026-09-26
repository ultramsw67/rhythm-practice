const BASE = 'http://127.0.0.1:8771/';
module.exports = async (c) => {
  const out = {};
  for (const w of [320, 360, 375, 390, 414, 430, 768, 1280]) {
    await c.size(w, 950, w < 500);
    await c.go(BASE);
    const r = await c.ev(`(()=>{
      Object.assign(RP.set,{mode:'melody',level:2,meter:'4/4',bars:4,inst:'flute',key:'C',bpm:100,artic:'auto',pickup:'off',seed:1,edits:{}});
      RP.rebuild();
      const host = document.querySelector('#score');
      return { hostClientWidth: host.clientWidth, svgWidth: +host.querySelector('svg').getAttribute('width'), forced: host.clientWidth < 280 };
    })()`);
    out[w] = r;
  }
  console.log(JSON.stringify(out, null, 1));
};
