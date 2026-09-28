// 1. 난이도 1~7 × 박자표 × 마디 × 못갖춘마디 × 기호 × 모드: 악보가 그려지는지, 잘림·넘침, 오류
module.exports = async (c) => {
  const B = 'http://127.0.0.1:' + (process.env.PORT || 8765) + '/';
  for (const w of [320, 390, 1024]) {
    await c.size(w, 900, w < 900); await c.go(B);
    await c.ev(`localStorage.clear(); localStorage.setItem('rp.startSeen','true')`);
    await c.go(B);
    const r = await c.ev(`(async()=>{
      const errs=[]; window.addEventListener('error',e=>errs.push(String(e.message)));
      const meters=[...document.querySelectorAll('#meter option')].map(o=>o.value);
      const d=document.querySelector('#setBox'); d.open=true;
      const setSel=(id,v)=>{const s=document.querySelector(id); s.value=v; s.dispatchEvent(new Event('change',{bubbles:true})); s.dispatchEvent(new Event('input',{bubbles:true}));};
      const bad=[], ex=[]; let n=0, worst=-1e9, pageOver=0;
      for (const mode of ['rhythm','melody']) {
        document.querySelector('#modeSeg button[data-v="'+mode+'"]').click();
        for (let lv=1; lv<=7; lv++) {
          document.querySelectorAll('#levelSeg button')[lv-1].click();
          for (const m of meters) for (const bars of ['2','16']) for (const pk of ['auto','on','off']) for (const ar of ['auto','manual','none']) {
            try {
              setSel('#meter',m); setSel('#bars',bars); setSel('#pickup',pk); setSel('#artic',ar);
              n++;
              const svg=document.querySelector('#score svg'); const ph=document.querySelector('#score .placeholder');
              if(!svg||ph){bad.push([mode,lv,m,bars,pk,ar,'nosvg',ph&&ph.textContent]);continue;}
              const W=+svg.getAttribute('width'); const vb=svg.viewBox.baseVal; const k=vb&&vb.width?W/vb.width:1; const bb=svg.getBBox();
              const over=(bb.x+bb.width)*k-W; worst=Math.max(worst,over); if(over>1) bad.push([mode,lv,m,bars,pk,ar,'clipR',Math.round(over)]);
              if (bb.x*k < -1) bad.push([mode,lv,m,bars,pk,ar,'clipL',Math.round(bb.x*k)]);
              const sr=svg.getBoundingClientRect(), pr=document.querySelector('#score').getBoundingClientRect();
              if (sr.right>pr.right+1) bad.push([mode,lv,m,bars,pk,ar,'paperOver',Math.round(sr.right-pr.right)]);
              pageOver=Math.max(pageOver,document.documentElement.scrollWidth-innerWidth);
              // 설정이 실제로 반영됐는지
              const S=RP.set; if(S.meter!==m||String(S.bars)!==bars||S.level!==lv||S.pickup!==pk||S.artic!==ar) bad.push([mode,lv,m,bars,pk,ar,'setMismatch',JSON.stringify({m:S.meter,b:S.bars,l:S.level,p:S.pickup,a:S.artic})]);
              if (ar==='none' && RP.score.events.some(e=>e.artic&&e.artic.length)) bad.push([mode,lv,m,bars,pk,ar,'articWhenNone']);
              const hp=RP.score.measures.some(x=>x.pickup); if (pk==='on' && !hp) bad.push([mode,lv,m,bars,pk,ar,'noPickupWhenOn']); if (pk==='off' && hp) bad.push([mode,lv,m,bars,pk,ar,'pickupWhenOff']);
              const ms=RP.score.measures.length; if (ms < +bars) bad.push([mode,lv,m,bars,pk,ar,'bars',ms]);
            } catch(e){ ex.push([mode,lv,m,bars,pk,ar,String(e)]); }
          }
        }
      }
      return {meters, n, worst:Math.round(worst), pageOver, nbad:bad.length, bad:bad.slice(0,15), ex:ex.slice(0,5), errs:errs.slice(0,5), hint:document.querySelector('#levelHint').textContent, sum:document.querySelector('#setSum').textContent};
    })()`);
    console.log(w, JSON.stringify(r, null, 0));
  }
};
