// GitHub Pages 처럼 max-age=600 인 상황에서 v1→v2 갱신이 "새 캐시 이름인데 내용은 옛날"로 오염되는지 확인
const { execSync } = require('child_process');
const path = require('path');
const QA = path.join(__dirname);
module.exports = async (c) => {
  await c.size(390, 844, true);
  const port = process.env.PORT || 8784;
  const url = `http://127.0.0.1:${port}/offline/`;

  await c.go(url);
  const v1 = await c.ev(`(async()=>{
    const r = await navigator.serviceWorker.ready; await new Promise(r=>setTimeout(r,1200));
    const keys = await caches.keys();
    const verLine = [...document.querySelectorAll('#tab-settings p')].map(p=>p.textContent).find(t=>t.includes('버전'));
    return { caches: keys, verLine };
  })()`);
  console.log('V1_INSTALLED(STALE-HTTP-CACHE-PRIMED)', JSON.stringify(v1));

  // 곧바로(HTTP 캐시 600초가 지나기 전에) v2 로 다시 빌드 — 실제 "고치고 바로 올리는" 흐름
  execSync(`node "${path.join(QA, 'build1.js')}" "${path.join(QA, 'site')}" "${path.join(QA, 'site', 'offline')}" v1.9.1 1`, { cwd: QA, stdio: 'inherit' });
  console.log('REBUILT_V2_IMMEDIATELY');

  for (let i = 1; i <= 4; i++) {
    await c.go(url);
    const r = await c.ev(`(async()=>{
      await new Promise(r=>setTimeout(r,1200));
      const keys = await caches.keys();
      const verLine = [...document.querySelectorAll('#tab-settings p')].map(p=>p.textContent).find(t=>t.includes('버전'));
      let vexText='(err)'; try { vexText = await (await fetch('vexflow.js')).text(); } catch(e){ vexText='ERR:'+e.message; }
      let cachedIndexHasMarkerVer = null;
      try { const c0 = await caches.open(keys[keys.length-1]); const resp = await c0.match('index.html'); const t = resp ? await resp.text() : null; cachedIndexHasMarkerVer = t ? (t.match(/버전 (v[\d.]+)/)||[])[1] : null; } catch(e) {}
      return { caches: keys, verLine, vexHasMarker: vexText.includes('QA-V2-MARKER'), cachedIndexVersion: cachedIndexHasMarkerVer };
    })()`);
    console.log('RELOAD_' + i, JSON.stringify(r));
    await c.sleep(400);
  }
};
