// QA-A: 렌더링 스윕 - 무작위 설정 x 4 너비, 오류·SVG 경계 초과 탐지 (viewBox 기준 getBBox)
const BASE = 'http://127.0.0.1:8771/';
module.exports = async (c) => {
  await c.go(BASE);
  await c.ev(`(()=>{ indexedDB.deleteDatabase('rhythm-practice'); localStorage.clear(); })()`);

  const widths = [320, 390, 768, 1280];
  const N = 90; // x4 widths = 360 renders
  const script = `(()=>{
    const CoreObj = window.Core;
    const insts = Object.keys(CoreObj.INSTS);
    const keys = CoreObj.KEYS.map(k=>k.name);
    const meters = Object.keys(CoreObj.METERS);
    const results = [];
    function rnd(arr){ return arr[Math.floor(Math.random()*arr.length)]; }
    for (let i=0;i<${N};i++){
      const s = {
        mode: rnd(['rhythm','melody','melody']),
        level: rnd([1,2,3]),
        meter: rnd(meters),
        bars: rnd([2,4,8,12]),
        pickup: rnd(['auto','on','off']),
        artic: rnd(['auto','manual','none']),
        inst: rnd(insts),
        key: rnd(keys),
        bpm: rnd([40,60,88,120,160,208]),
        seed: Math.floor(Math.random()*4294967295),
        edits: {}
      };
      let err = null, anomalies = [];
      let geom = null;
      try {
        Object.assign(RP.set, s);
        RP.rebuild();
        const host = document.querySelector('#score');
        const svg = host.querySelector('svg');
        if (!svg) { anomalies.push('no-svg-or-placeholder: ' + (host.querySelector('.placeholder')?.textContent||'')); }
        else {
          const vb = svg.getAttribute('viewBox').split(' ').map(Number);
          const VBW = vb[2], VBH = vb[3];
          const bb = svg.getBBox();
          const overflowRight = (bb.x + bb.width) - VBW;
          const overflowBottom = (bb.y + bb.height) - VBH;
          const overflowLeft = -bb.x;
          const overflowTop = -bb.y;
          geom = { VBW, VBH, bb: {x:bb.x,y:bb.y,w:bb.width,h:bb.height} };
          if (overflowRight > 3) anomalies.push('overflow-right:'+overflowRight.toFixed(1));
          if (overflowBottom > 6) anomalies.push('overflow-bottom:'+overflowBottom.toFixed(1));
          if (overflowLeft > 3) anomalies.push('overflow-left:'+overflowLeft.toFixed(1));
          if (overflowTop > 12) anomalies.push('overflow-top:'+overflowTop.toFixed(1));
        }
      } catch(e) { err = String(e && e.stack || e); }
      if (err || anomalies.length) results.push({i, set: s, err, anomalies, geom});
    }
    return { total: ${N}, flagged: results.length, results };
  })()`;

  const out = {};
  for (const w of widths) {
    await c.size(w, 900, w < 500);
    await c.go(BASE);
    await c.ev(`(()=>{ indexedDB.deleteDatabase('rhythm-practice'); localStorage.clear(); })()`);
    await c.go(BASE);
    const r = await c.ev(script);
    out['w' + w] = r;
    console.log('width', w, 'flagged', r.flagged, '/', r.total);
  }
  require('fs').writeFileSync(require('path').join(__dirname, 'qa-a', 'sweep-result.json'), JSON.stringify(out, null, 1));
  console.log('done, see qa-a/sweep-result.json');
};
