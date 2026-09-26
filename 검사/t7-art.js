// 아티큘레이션이 기둥 반대쪽(머리 쪽)에 붙는지: VexFlow 객체 좌표로 직접 비교
module.exports = async (c) => {
  await c.size(390, 844);
  await c.go(process.env.URL0 || 'http://127.0.0.1:8765/');
  const r = await c.ev(`(()=>{
    const VF = Vex.Flow; const orig = VF.Articulation.prototype.draw; const rec = [];
    VF.Articulation.prototype.draw = function(){ const n=this.getNote(); rec.push({pos:this.getPosition(), stem:n.getStemDirection(), type:this.type}); return orig.apply(this, arguments); };
    for (let s=1;s<=30;s++){ Object.assign(RP.set,{mode:'melody',level:3,meter:'4/4',bars:4,inst:'clarinet',key:'Bb',artic:'auto',seed:s,edits:{}}); RP.rebuild(); }
    VF.Articulation.prototype.draw = orig;
    const ABOVE = VF.Modifier.Position.ABOVE;
    const side = rec.filter(x=>!['a@a','a^'].includes(x.type));
    const bad = side.filter(x => (x.pos===ABOVE) === (x.stem===1)).length;
    return { total: side.length, onStemSide: bad, sample: rec.slice(0,3) };
  })()`);
  console.log(JSON.stringify(r));
};
