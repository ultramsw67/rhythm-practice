// 오프라인 앱 업데이트: 10분 캐시 서버(serve2 STALE=1)에서 설치 → 바로 새 빌드 → 새로고침으로 새 버전이 되는지
const { execSync } = require('child_process');
const path = require('path');
module.exports = async (c) => {
  await c.size(390, 844, true);
  const url = 'http://127.0.0.1:' + process.env.PORT + '/offline/';
  const snap = async (label) => {
    const r = await c.ev(`(async()=>{ await new Promise(r=>setTimeout(r,1500));
      const keys = await caches.keys();
      const ver = [...document.querySelectorAll('#tab-settings p')].map(p=>p.textContent).find(t=>t.includes('버전 v'));
      let mark = '?'; try { const t = await (await fetch('vexflow.js')).text(); mark = t.includes('QA-V2-MARK') ? 'NEW' : 'OLD'; } catch (e) { mark = 'ERR'; }
      let cachedMark = '?'; try { const cc = await caches.open(keys[keys.length-1]); const rr = await cc.match('vexflow.js'); cachedMark = rr ? ((await rr.text()).includes('QA-V2-MARK') ? 'NEW' : 'OLD') : 'none'; } catch (e) {}
      return { caches: keys, ver, pageVex: mark, cachedVex: cachedMark, status: (document.querySelector('#offlineStatus')||{}).textContent }; })()`);
    console.log(label, JSON.stringify(r));
  };
  await c.go(url); await c.ev(`navigator.serviceWorker.ready`); await snap('v2.0 installed');
  execSync('node build-offline.js', { cwd: __dirname, env: Object.assign({}, process.env, { OFFLINE_OUT1: path.join(__dirname, 'qa-e', 'site3', 'offline'), SKIP_DESKTOP: '1', VER_OVERRIDE: 'v2.0.1', MARK: 'QA-V2-MARK' }), stdio: 'inherit' });
  for (let i = 1; i <= 3; i++) { await c.go(url); await c.sleep(2500); await snap('reload ' + i); }
};
