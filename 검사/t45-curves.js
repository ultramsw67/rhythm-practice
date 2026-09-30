// v3.8.1: 슬러·붙임줄이 너무 짧아 곡선 대신 세로줄처럼 보이는지 전수 검사 (음표가 바짝 붙은 빔 묶음·첫 마디)
// 통과 기준: short 0 (가로 폭 MIN px 미만 곡선 없음), errs []
module.exports = async (c) => {
  const W = +(process.env.W || 390), MIN = +(process.env.MIN || 9), N = +(process.env.N || 6);
  await c.size(W, 844);
  await c.go('http://127.0.0.1:8765/');
  const res = await c.ev(`(async()=>{
    const meters=['2/4','3/4','4/4','5/4','6/8','7/8','9/8','12/8','2/2'];
    const insts=['alto_sax','clarinet','flute','trumpet','tuba','c_bass'];
    const N_='[0-9.-]+', P_=N_+' '+N_;
    const RE=new RegExp('^M('+N_+') '+N_+'(?:C'+P_+','+P_+',('+N_+') '+N_+'C'+P_+','+P_+','+P_+'|Q'+P_+',('+N_+') '+N_+'Q'+P_+','+P_+')Z?$');
    let n=0,curves=0,short=[],errs=[],minW=1e9;
    for(const mode of ['melody','rhythm']) for(let level=1;level<=7;level++) for(const meter of meters) for(let k=0;k<${N};k++){
      const seed=1000+level*97+k*7919+meters.indexOf(meter)*31;
      const inst=insts[(k+level)%insts.length];
      Object.assign(RP.set,{mode,level,meter,bars:4,pickup:k%2?'on':'auto',gen:2,artic:'auto',kref:'',prac:k%5===4&&mode==='melody'?'scale':'',drum:'',bow:'',inst,key:['Bb','G','Eb','D','F','A'][k%6],bpm:88,seed});
      RP.set.edits={};
      try{RP.rebuild();}catch(e){errs.push(mode+level+meter+seed+':'+e.message);continue;}
      n++;
      for(const p of document.querySelectorAll('#score svg path')){
        if(p.closest('[id^=vf-ev]'))continue;
        const d=p.getAttribute('d')||'';const m=d.match(RE);if(!m)continue;
        const ex=+(m[2]||m[3]);
        const w=Math.abs(ex-(+m[1]));curves++;if(w<minW)minW=w;
        if(w<${MIN})short.push({mode,level,meter,seed,inst,prac:RP.set.prac,pickup:RP.set.pickup,w:+w.toFixed(1),kind:m[2]?'slur':'tie',x:Math.round(+m[1])});
      }
    }
    return {n,curves,minW:+minW.toFixed(1),nshort:short.length,short:short.slice(0,20),errs:errs.slice(0,5)};
  })()`);
  console.log('W', W, JSON.stringify(res));
};
