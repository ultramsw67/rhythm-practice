// v2.1 녹음 음질: ① 블루투스 마이크면 내장 마이크로 바꿔 여는지 ② 녹음 뒤 스피커 재생 모드 복귀 ③ 원음(48kHz) 저장·크기 맞춤 ④ 찌그러짐 알림
// FAKE_WAV 필요. BT=keep 이면 내장 마이크가 없는 경우(바꿀 수 없음 → 안내)
module.exports = async (c) => {
  const keep = process.env.BT === 'keep';
  await c.send('Page.addScriptToEvaluateOnNewDocument', { source: `
    window.__modes = [];
    try { Object.defineProperty(navigator, 'audioSession', { value: { set type(v) { window.__modes.push(v); }, get type() { return window.__modes[window.__modes.length-1] || 'auto'; } }, configurable: true }); } catch (e) {}
    const md = navigator.mediaDevices, og = md.getUserMedia.bind(md);
    md.getUserMedia = async (cons) => {
      const exact = cons && cons.audio && cons.audio.deviceId && cons.audio.deviceId.exact;
      const a = Object.assign({}, cons.audio); delete a.deviceId;
      const s = await og({ audio: a });
      const lab = exact ? '휴대폰 내장 마이크 (Built-in Microphone)' : 'AirPods Pro (Bluetooth Hands-Free)';
      s.getAudioTracks().forEach(t => Object.defineProperty(t, 'label', { value: lab }));
      window.__gum = (window.__gum || []).concat([lab]);
      return s;
    };
    md.enumerateDevices = async () => ${keep ? `[{ kind:'audioinput', deviceId:'bt1', label:'AirPods Pro (Bluetooth)' }]` : `[{ kind:'audioinput', deviceId:'default', label:'기본' }, { kind:'audioinput', deviceId:'bt1', label:'AirPods Pro (Bluetooth)' }, { kind:'audioinput', deviceId:'builtin', label:'휴대폰 내장 마이크 (Built-in Microphone)' }]`};
  ` });
  await c.size(390, 844);
  await c.go(process.env.URL0 || 'http://127.0.0.1:' + (process.env.PORT || 8765) + '/');
  const r = await c.ev(`(async()=>{
    const toasts = []; const tEl = document.querySelector('#toast'); new MutationObserver(() => { if (tEl.textContent) toasts.push(tEl.textContent); }).observe(tEl, { childList: true, characterData: true, subtree: true });
    Object.assign(RP.set,{mode:'melody',meter:'4/4',level:2,bars:4,key:'Bb',inst:'clarinet',bpm:96,pickup:'off',artic:'auto',seed:777,edits:{}}); RP.rebuild(); document.querySelector('#countIn').value='1';
    document.querySelector('#recBtn').click();
    let st = '';
    for (let i=0;i<40;i++){ await new Promise(r=>setTimeout(r,1000)); st=document.querySelector('#recStatus').textContent; if (/점 —|오류|못|않|멈췄/.test(st)) break; }
    const t = RPX.take; let wavRate = null, wavPeak = null;
    if (t && t.audio) { const ab = await (t.audio.arrayBuffer ? t.audio.arrayBuffer() : t.audio); const v = new DataView(ab); wavRate = v.getUint32(24, true); let pk = 0; for (let i = 44; i + 1 < ab.byteLength; i += 2) pk = Math.max(pk, Math.abs(v.getInt16(i, true))); wavPeak = +(pk / 32768).toFixed(3); }
    return { status: st, gum: window.__gum, mic: t && t.mic, clipSec: t && t.clipSec, modes: window.__modes, wavRate, wavPeak, toasts: [...new Set(toasts)], tips: [...document.querySelectorAll('#resTips li')].map(l => l.textContent) };
  })()`);
  console.log(JSON.stringify(r, null, 1));
};
