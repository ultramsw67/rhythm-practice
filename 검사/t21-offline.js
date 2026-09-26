// 오프라인 버전 확인
// MODE=web  : http://127.0.0.1:PORT/offline/ 를 한 번 연 뒤 서버를 끄고(KILL_CMD) 인터넷 차단 상태로 다시 열기
// MODE=file : 바탕화면 파일을 file:// 로 열기 (FAKE_WAV 있으면 녹음까지)
const { execSync } = require('child_process');
module.exports = async (c) => {
  const mode = process.env.MODE || 'web';
  await c.size(390, 844, true);
  const check = async (label) => {
    const r = await c.ev(`(async()=>{
      await new Promise(r=>setTimeout(r,800));
      const o = { secure: isSecureContext, vex: !!(window.Vex && (Vex.Flow||Vex).Stave), svg: !!document.querySelector('#score svg'), badge: !!document.querySelector('.off-badge'), status: (document.querySelector('#offlineStatus')||{}).textContent, ver: [...document.querySelectorAll('#tab-settings p')].map(p=>p.textContent).find(t=>t.includes('버전')) };
      document.querySelector('#startClose') && document.querySelector('#startClose').click();
      document.querySelector('nav.tabs [data-tab=settings]').click(); document.querySelector('#selfPerfect').click(); await new Promise(r=>setTimeout(r,4000));
      o.selfTest = document.querySelector('#resTotal').textContent;
      document.querySelector('#resSave') && !document.querySelector('#resSave').classList.contains('hide') && document.querySelector('#resSave').click(); await new Promise(r=>setTimeout(r,500));
      o.saved = (await RPX.DB.all()).length; o.dbNote = RPX.DB.note || '';
      return o; })()`);
    console.log(label, JSON.stringify(r));
  };
  if (mode === 'web') {
    const url = 'http://127.0.0.1:' + (process.env.PORT || 8765) + '/offline/';
    await c.go(url);
    const sw = await c.ev(`(async()=>{ const r = await navigator.serviceWorker.ready; await new Promise(r=>setTimeout(r,1500)); const keys = await caches.keys(); const n = keys.length ? (await (await caches.open(keys[0])).keys()).length : 0; return { active: !!r.active, caches: keys, files: n }; })()`);
    console.log('first open (online)', JSON.stringify(sw));
    if (process.env.KILL_CMD) { try { execSync(process.env.KILL_CMD, { stdio: 'ignore' }); } catch (e) { } }
    await c.send('Network.enable');
    await c.send('Network.emulateNetworkConditions', { offline: true, latency: 0, downloadThroughput: -1, uploadThroughput: -1 });
    const alive = await new Promise(res => require('http').get(url, r => res('server reachable (bad test) ' + r.statusCode)).on('error', () => res('server unreachable (good)')));
    console.log('network check:', alive);
    await c.go(url);
    await check('reopen OFFLINE');
    await c.go(url + 'guide.html');
    console.log('guide offline:', await c.ev(`document.querySelectorAll('h2').length + ' sections'`));
  } else {
    await c.send('Network.enable');
    await c.send('Network.emulateNetworkConditions', { offline: true, latency: 0, downloadThroughput: -1, uploadThroughput: -1 });
    const f = 'file:///C:/Users/ultramsw67/Desktop/' + encodeURIComponent('리듬 연습 오프라인') + '/' + encodeURIComponent('리듬 연습 오프라인.html');
    await c.go(f);
    if (process.env.FAKE_WAV) {
      const r = await c.ev(`(async()=>{ Object.assign(RP.set,{mode:'melody',meter:'4/4',level:2,bars:4,key:'Bb',inst:'clarinet',bpm:96,pickup:'off',artic:'auto',seed:777,edits:{}}); RP.rebuild(); document.querySelector('#countIn').value='1';
        document.querySelector('#recBtn').click();
        for (let i=0;i<40;i++){ await new Promise(r=>setTimeout(r,1000)); const s=document.querySelector('#recStatus').textContent; if (/점 —|오류|못|않|멈췄/.test(s)) return s + ' | cap=' + JSON.stringify(RPX.lastCap); }
        return 'timeout ' + document.querySelector('#recStatus').textContent; })()`);
      console.log('file record:', r);
    }
    await check('file OFFLINE');
    await c.ev(`document.querySelector('a[href="사용법.html"]').click()`); await c.sleep(1200);
    console.log('guide link:', await c.ev(`location.href.split('/').pop() + ' ' + document.querySelectorAll('h2').length + ' sections, img ' + (document.querySelector('header img')||{}).naturalWidth`));
  }
};
