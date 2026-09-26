const BASE = 'http://127.0.0.1:8771/';
module.exports = async (c) => {
  await c.size(320, 900, true);
  await c.go(BASE);
  const out = await c.ev(`(()=>{
    const cases = [
      {mode:'melody',level:3,meter:'12/8',bars:12,inst:'tuba',key:'Cb',bpm:208,artic:'auto',pickup:'on'},
      {mode:'melody',level:3,meter:'5/4',bars:2,inst:'c_treble',key:'C#',bpm:40,artic:'auto',pickup:'off'},
      {mode:'rhythm',level:3,meter:'9/8',bars:16,bpm:208,artic:'auto',pickup:'auto'},
    ];
    const out=[];
    for (const s of cases){
      Object.assign(RP.set, s, {seed: Math.floor(Math.random()*1e9), edits:{}});
      RP.rebuild();
      const svg = document.querySelector('#score svg');
      const vb = svg.getAttribute('viewBox').split(' ').map(Number);
      const bb = svg.getBBox();
      out.push({s, vb, bb:{x:bb.x,y:bb.y,w:bb.width,h:bb.height}, overRight:(bb.x+bb.width)-vb[2], overBottom:(bb.y+bb.height)-vb[3]});
    }
    return out;
  })()`);
  console.log(JSON.stringify(out, null, 1));
};
