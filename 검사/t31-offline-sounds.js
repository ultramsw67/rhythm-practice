// 오프라인 판에서 악기 소리를 인터넷 없이 불러오는지
// MODE=web : /offline/ 한 번 연 뒤 서버 끄고(KILL_CMD) 다시 열기 / MODE=file : 바탕화면 PC 파일판
const { execSync } = require('child_process');
module.exports = async (c) => {
  const mode = process.env.MODE || 'web';
  await c.size(390, 844, true);
  const check = async (label) => {
    console.log(label, JSON.stringify(await c.ev(`(async()=>{
      const out = {};
      for (const inst of ['trumpet', 'tuba', 'flute', 'c_treble']) { const e = await RPX.loadSound(inst); out[inst] = e ? e.notes.length + ' notes' : 'FAIL'; }
      document.querySelector('#startClose') && document.querySelector('#startClose').click();
      document.querySelector('#modeSeg [data-v=melody]').click(); await new Promise(r=>setTimeout(r,200));
      const s = document.querySelector('#inst'); s.value = 'alto_sax'; s.dispatchEvent(new Event('change')); await new Promise(r=>setTimeout(r,1500));
      out.info = document.querySelector('#soundInfo').textContent;
      document.querySelector('#playBtn').click(); await new Promise(r=>setTimeout(r,1000)); out.play = document.querySelector('#playBtn').textContent; document.querySelector('#playBtn').click();
      return out; })()`)));
  };
  await c.send('Network.enable');
  if (mode === 'web') {
    const url = 'http://127.0.0.1:' + process.env.PORT + '/offline/';
    await c.go(url);
    console.log('first', JSON.stringify(await c.ev(`(async()=>{ await navigator.serviceWorker.ready; await new Promise(r=>setTimeout(r,4000)); const k=await caches.keys(); return { caches: k, files: k.length ? (await (await caches.open(k[0])).keys()).length : 0 }; })()`)));
    if (process.env.KILL_CMD) { try { execSync(process.env.KILL_CMD, { stdio: 'ignore' }); } catch (e) { } }
    await c.send('Network.emulateNetworkConditions', { offline: true, latency: 0, downloadThroughput: -1, uploadThroughput: -1 });
    await c.go(url);
    await check('web OFFLINE');
  } else {
    await c.send('Network.emulateNetworkConditions', { offline: true, latency: 0, downloadThroughput: -1, uploadThroughput: -1 });
    await c.go('file:///C:/Users/ultramsw67/Desktop/' + encodeURIComponent('리듬 연습 오프라인') + '/' + encodeURIComponent('리듬 연습 오프라인.html'));
    await check('file OFFLINE');
  }
};
