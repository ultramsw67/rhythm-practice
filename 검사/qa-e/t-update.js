// 업데이트 흐름 시험: v1 설치 상태에서 서버 내용을 v2 로 바꾸고(온라인 그대로) 여러 번 새로고침하며 관찰
const { execSync } = require('child_process');
const path = require('path');
const QA = path.join(__dirname); // .../검사/qa-e
module.exports = async (c) => {
  await c.size(390, 844, true);
  const port = process.env.PORT || 8783;
  const url = `http://127.0.0.1:${port}/offline/`;

  await c.go(url);
  const v1 = await c.ev(`(async()=>{
    const r = await navigator.serviceWorker.ready; await new Promise(r=>setTimeout(r,1200));
    const keys = await caches.keys();
    const verLine = [...document.querySelectorAll('#tab-settings p')].map(p=>p.textContent).find(t=>t.includes('버전'));
    const vexText = await (await fetch('vexflow.js')).text();
    return { caches: keys, verLine, vexHasMarker: vexText.includes('QA-V2-MARKER'), controller: !!navigator.serviceWorker.controller };
  })()`);
  console.log('V1_INSTALLED', JSON.stringify(v1));

  execSync(`node "${path.join(QA, 'build1.js')}" "${path.join(QA, 'site')}" "${path.join(QA, 'site', 'offline')}" v1.9.1 1`, { cwd: QA, stdio: 'inherit' });
  console.log('REBUILT_V2');

  for (let i = 1; i <= 3; i++) {
    await c.go(url);
    const r = await c.ev(`(async()=>{
      await new Promise(r=>setTimeout(r,1200));
      const keys = await caches.keys();
      const verLine = [...document.querySelectorAll('#tab-settings p')].map(p=>p.textContent).find(t=>t.includes('버전'));
      let vexText = '(fetch err)';
      try { vexText = await (await fetch('vexflow.js')).text(); } catch(e) { vexText = 'ERR:'+e.message; }
      const status = (document.querySelector('#offlineStatus')||{}).textContent;
      const reg = await navigator.serviceWorker.getRegistration();
      return { caches: keys, verLine, vexHasMarker: vexText.includes('QA-V2-MARKER'), status, waiting: !!(reg && reg.waiting), installing: !!(reg && reg.installing), controllerScriptURL: navigator.serviceWorker.controller && navigator.serviceWorker.controller.scriptURL };
    })()`);
    console.log('RELOAD_' + i, JSON.stringify(r));
    await c.sleep(500);
  }
};
