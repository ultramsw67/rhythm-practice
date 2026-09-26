// 예비 녹음 방식(ScriptProcessor)이 제대로 녹음하는지 — AudioWorklet 을 없앤 채로 녹음 (FAKE_WAV 필요)
module.exports = async (c) => {
  await c.send('Page.addScriptToEvaluateOnNewDocument', { source: 'try{ delete window.AudioWorkletNode; Object.defineProperty(BaseAudioContext.prototype, "audioWorklet", { get(){ return undefined; } }); }catch(e){}' });
  await c.size(390, 844);
  await c.go(process.env.URL0 || 'http://127.0.0.1:' + (process.env.PORT || 8765) + '/');
  const r = await c.ev(`(async()=>{ Object.assign(RP.set,{mode:'melody',meter:'4/4',level:2,bars:4,key:'Bb',inst:'clarinet',bpm:96,pickup:'off',artic:'auto',seed:777,edits:{}}); RP.rebuild(); document.querySelector('#countIn').value='1';
    document.querySelector('#recBtn').click();
    for (let i=0;i<40;i++){ await new Promise(r=>setTimeout(r,1000)); const s=document.querySelector('#recStatus').textContent; if (/점 —|오류|못|않|멈췄/.test(s)) return { s, cap: RPX.lastCap }; }
    return { s: 'timeout ' + document.querySelector('#recStatus').textContent, cap: RPX.lastCap }; })()`);
  console.log(JSON.stringify(r));
};
