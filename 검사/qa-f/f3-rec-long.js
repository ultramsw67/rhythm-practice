// 3. 재생 중 녹음, 준비 중 녹음, 16마디·BPM 208·7단계 끝까지 (리듬·타악기·선율)
module.exports = async (c) => {
  const B = 'http://127.0.0.1:' + (process.env.PORT || 8765) + '/';
  await c.size(390, 844, true);
  await c.go(B);
  await c.ev(`localStorage.clear(); localStorage.setItem('rp.startSeen','true')`);
  await c.go(B);
  const J = async (name, expr) => { try { const v = await c.ev(expr); console.log(name, JSON.stringify(v)); return v; } catch (e) { console.log(name, 'ERR', e.message); } };
  await c.ev(`window.__errs=[]; window.addEventListener('error',e=>__errs.push(String(e.message))); window.addEventListener('unhandledrejection',e=>__errs.push('rej '+String(e.reason)));
    window.__w=ms=>new Promise(r=>setTimeout(r,ms));
    window.__btn=()=>document.querySelector('#playBtn').textContent;
    window.__waitBtn=async(txt,ms)=>{const s=performance.now(); while(performance.now()-s<ms){ if(__btn()===txt) return Math.round(performance.now()-s); await __w(20);} return 'timeout:'+__btn();};
    Object.assign(RP.set,{mode:'rhythm',level:4,meter:'4/4',bars:4,bpm:120,drum:'snare',pickup:'off'}); RP.rebuild(); 1`);
  // 재생 중 녹음 누르기
  await J('rec-while-playing', `(async()=>{ const b=document.querySelector('#playBtn'); b.click(); await __waitBtn('■ 멈추기',4000); await __w(600);
    document.querySelector('#recBtn').click(); await __w(2500);
    const r={btn:__btn(), playing:!!RPX.playing, rec:!!RPX.rec, recBtn:document.querySelector('#recBtn').textContent, status:document.querySelector('#recStatus').textContent, bodyRec:document.body.classList.contains('recording'), playBtnVisible:!!document.querySelector('#playBtn').offsetParent};
    // 녹음 중 들어보기 누르기 (숨겨져 있어도 코드로)
    b.click(); await __w(300); r.playDuringRec=!!RPX.playing;
    if (RPX.rec) { document.querySelector('#recBtn').click(); await __w(500); }
    r.after={btn:__btn(), playing:!!RPX.playing, rec:!!RPX.rec, recBtn:document.querySelector('#recBtn').textContent}; return r; })()`);
  // 준비 중에 녹음 누르기 (소리 엔진을 멈춰 두어 준비 시간이 생기게)
  await J('rec-while-starting', `(async()=>{ await __w(300); try{ await RPX.actx.suspend(); }catch(e){}
    const b=document.querySelector('#playBtn'); b.click(); const t1=__btn(); document.querySelector('#recBtn').click();
    await __w(3000); const r={t1, btn:__btn(), playing:!!RPX.playing, rec:!!RPX.rec, recBtn:document.querySelector('#recBtn').textContent};
    if (RPX.playing) { r.both = !!RPX.rec; }
    if (RPX.rec) { document.querySelector('#recBtn').click(); await __w(500); }
    if (RPX.playing) { b.click(); await __w(100); }
    r.after={btn:__btn(), playing:!!RPX.playing, rec:!!RPX.rec}; return r; })()`);
  // 끝까지 재생
  for (const [nm, extra] of [['rhythm-click', `{mode:'rhythm',drum:''}`], ['snare', `{mode:'rhythm',drum:'snare'}`], ['cymbal', `{mode:'rhythm',drum:'cymbal'}`], ['melody-clarinet', `{mode:'melody',inst:'clarinet',key:'Bb'}`], ['melody-tuba', `{mode:'melody',inst:'tuba',key:'Eb'}`]]) {
    for (const meter of ['4/4', '12/8']) {
      await J('full ' + nm + ' ' + meter, `(async()=>{ Object.assign(RP.set,{level:7,meter:'${meter}',bars:16,bpm:208,pickup:'on',artic:'auto',seed:${nm.length * 7}},${extra}); RP.rebuild();
        const b=document.querySelector('#playBtn'); const T0=performance.now(); b.click(); const t1=__btn(); const st=await __waitBtn('■ 멈추기',5000);
        const total=RPX.playing && RPX.playing.tl.total; let maxNow=0, sawNow=0, lastWall=0, stuck=0, nodes=0; let prev=-1;
        const ids=new Set();
        while (RPX.playing && performance.now()-T0 < 90000) { const n=document.querySelectorAll('#score .now'); if(n.length) sawNow++; n.forEach(e=>ids.add(e.id)); nodes=RPX.playing? RPX.playing.nodes.length:nodes; await __w(100); }
        const dur=Math.round(performance.now()-T0)/1000;
        const evN=RP.score.events.filter(e=>!e.rest).length;
        return {t1, startMs:st, total:total&&+total.toFixed(2), wallSec:dur, nodes, highlighted:ids.size, evN, btn:__btn(), playing:RPX.playing, leftover:document.querySelectorAll('#score .now,#score .done').length, toast:(document.querySelector('.toast, #toast')||{}).textContent}; })()`);
    }
  }
  console.log('errs', await c.ev('JSON.stringify(__errs)'));
};
