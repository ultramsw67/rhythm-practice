module.exports = async (c) => {
  await c.send('Page.addScriptToEvaluateOnNewDocument', { source: `window.__pl=[]; const op=HTMLMediaElement.prototype.play; HTMLMediaElement.prototype.play=function(){ if(!__pl.includes(this)) __pl.push(this); return op.call(this); };` });
  await c.size(390, 844); await c.go('http://127.0.0.1:8765/');
  const r = await c.ev(`(async()=>{ const sl=ms=>new Promise(r=>setTimeout(r,ms)); const q=s=>document.querySelector(s);
    Object.assign(RP.set,{mode:'rhythm',drum:'',level:2,meter:'4/4',bars:8,bpm:60,seed:81}); RP.syncForm(); RP.rebuild(); q('nav.tabs [data-tab=settings]').click(); q('#selfPerfect').click(); await sl(4500);
    q('#resPlay').click(); await sl(800); const p=__pl[0]; const o={ dur: p&&p.duration, playing0: p&&!p.paused };
    q('#resAgain').click(); await sl(400); o.afterAgain=!p.paused; o.prac=!q('#tab-practice').classList.contains('hide');
    q('#recBtn').click(); await sl(1500); o.recOn=!!RPX.rec; o.playerDuringRec=!p.paused; o.t=p.currentTime;
    if (RPX.rec) q('#recBtn').click(); await sl(300);
    q('#playBtn').click(); await sl(1200); o.bothPlaying = !!RPX.playing && !p.paused; if (RPX.playing) q('#playBtn').click();
    // 화면 숨김
    Object.defineProperty(document,'hidden',{value:true,configurable:true}); Object.defineProperty(document,'visibilityState',{value:'hidden',configurable:true}); document.dispatchEvent(new Event('visibilitychange')); await sl(300); o.playerAfterHidden=!p.paused;
    Object.defineProperty(document,'hidden',{value:false,configurable:true}); Object.defineProperty(document,'visibilityState',{value:'visible',configurable:true}); document.dispatchEvent(new Event('visibilitychange'));
    q('nav.tabs [data-tab=result]').click(); await sl(200); o.resBtn=q('#resPlay').textContent; p.pause(); return o; })()`);
  console.log(JSON.stringify(r));
};
