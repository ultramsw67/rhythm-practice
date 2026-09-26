const BASE = 'http://127.0.0.1:8771/';
module.exports = async (c) => {
  await c.size(320, 900, true);
  await c.go(BASE);
  const out = await c.ev(`(()=>{
    Object.assign(RP.set,{mode:'melody',level:3,meter:'5/4',bars:2,inst:'clarinet',key:'Cb',bpm:40,artic:'auto',pickup:'on',seed:777,edits:{}});
    RP.rebuild();
    const svg = document.querySelector('#score svg');
    const classCounts = {};
    svg.querySelectorAll('[class]').forEach(el => { const cl = el.getAttribute('class'); classCounts[cl] = (classCounts[cl]||0)+1; });
    const svgRect = svg.getBoundingClientRect();
    const groups = svg.querySelectorAll('.vf-stavenote, .vf-beam, .vf-tuplet, .vf-stavetie, .vf-curve, .vf-keysignature, .vf-accidental, .vf-stavetempo, .vf-timesignature');
    let maxRight=0;
    groups.forEach(g=>{ const b=g.getBoundingClientRect(); const r=b.right-svgRect.left; if (r>maxRight) maxRight=r; });
    return { classCounts, svgW: svgRect.width, svgH: svgRect.height, groupCount: groups.length, maxRight, overflow: maxRight-svgRect.width };
  })()`);
  console.log(JSON.stringify(out, null, 1));
  await c.shotEl('qa-a/diag-dense.png', '#score');
};
