// 웹 오프라인 빌드(①) 종합 검사: 설치→완전 오프라인 전환→모든 화면·재생·채점 시험·녹음·보관함·백업·설정 되돌리기·테마
const { execSync } = require('child_process');
const PORT = process.env.PORT || 8782;
function killServer() {
  try {
    execSync(`powershell -NoProfile -Command "$p=(Get-NetTCPConnection -LocalPort ${PORT} -State Listen -ErrorAction SilentlyContinue).OwningProcess; if($p){Stop-Process -Id $p -Force}"`, { stdio: 'ignore' });
  } catch (e) { console.log('killServer err', e.message); }
}
module.exports = async (c) => {
  await c.size(390, 844, true);
  const url = `http://127.0.0.1:${PORT}/offline/`;

  await c.go(url);
  const sw = await c.ev(`(async()=>{ const r = await navigator.serviceWorker.ready; await new Promise(r=>setTimeout(r,1500)); const keys = await caches.keys(); const n = keys.length ? (await (await caches.open(keys[0])).keys()).length : 0; const files = keys.length ? (await (await caches.open(keys[0])).keys()).map(rq=>new URL(rq.url).pathname) : []; return { active: !!r.active, caches: keys, files: n, filelist: files }; })()`);
  console.log('ONLINE_INSTALL', JSON.stringify(sw));

  killServer();
  await c.send('Network.enable');
  await c.send('Network.emulateNetworkConditions', { offline: true, latency: 0, downloadThroughput: -1, uploadThroughput: -1 });
  const alive = await new Promise(res => require('http').get(url, r => res('reachable ' + r.statusCode)).on('error', () => res('unreachable(good)')));
  console.log('NET_CHECK', alive);

  await c.go(url);
  const basic = await c.ev(`(async()=>{
    await new Promise(r=>setTimeout(r,800));
    document.querySelector('#startClose') && document.querySelector('#startClose').click();
    const badge = !!document.querySelector('.off-badge');
    const status = (document.querySelector('#offlineStatus')||{}).textContent;
    const verLine = [...document.querySelectorAll('#tab-settings p')].map(p=>p.textContent).find(t=>t.includes('버전'));
    const vex = !!(window.Vex && (Vex.Flow||Vex).Stave);
    const tabErrs = [];
    for (const t of ['practice','result','library','settings']) { try { document.querySelector('nav.tabs [data-tab='+t+']').click(); await new Promise(r=>setTimeout(r,300)); } catch(e){ tabErrs.push(t+':'+e.message); } }
    document.querySelector('nav.tabs [data-tab=practice]').click(); await new Promise(r=>setTimeout(r,400));
    const svg = !!document.querySelector('#score svg');
    return { badge, status, verLine, vex, svg, tabErrs, online: navigator.onLine };
  })()`);
  console.log('OFFLINE_REOPEN', JSON.stringify(basic));

  const selfTest = await c.ev(`(async()=>{
    document.querySelector('nav.tabs [data-tab=settings]').click(); await new Promise(r=>setTimeout(r,200));
    document.querySelector('#selfPerfect').click();
    await new Promise(r=>setTimeout(r,5000));
    return document.querySelector('#resTotal').textContent;
  })()`);
  console.log('SELFTEST', selfTest);

  const rec = await c.ev(`(async()=>{
    Object.assign(RP.set,{mode:'melody',meter:'4/4',level:2,bars:4,key:'Bb',inst:'clarinet',bpm:96,pickup:'off',artic:'auto',seed:777,edits:{}}); RP.rebuild();
    document.querySelector('nav.tabs [data-tab=practice]').click(); await new Promise(r=>setTimeout(r,300));
    document.querySelector('#countIn').value='1';
    document.querySelector('#recBtn').click();
    for (let i=0;i<40;i++){ await new Promise(r=>setTimeout(r,1000)); const s=document.querySelector('#recStatus').textContent; if (/점 —|오류|못|않|멈췄/.test(s)) return { s, cap: RPX.lastCap }; }
    return { s:'timeout '+document.querySelector('#recStatus').textContent, cap: RPX.lastCap };
  })()`);
  console.log('RECORD', JSON.stringify(rec));

  const saveRes = await c.ev(`(async()=>{
    const sv = document.querySelector('#resSave');
    if (sv && !sv.classList.contains('hide')) sv.click();
    await new Promise(r=>setTimeout(r,500));
    const list = await RPX.DB.all();
    return { saved: list.length, note: RPX.DB.note };
  })()`);
  console.log('SAVE', JSON.stringify(saveRes));

  const libActs = await c.ev(`(async()=>{
    document.querySelector('nav.tabs [data-tab=library]').click(); await new Promise(r=>setTimeout(r,400));
    const card = document.querySelector('.take'); if (!card) return {err:'no card'};
    card.querySelector('[data-a=play]').click(); await new Promise(r=>setTimeout(r,600));
    card.querySelector('[data-a=rename]').click();
    await new Promise(r=>setTimeout(r,400));
    const inp = card.querySelector('.nm input'); if (!inp) return { err: 'no rename input appeared' };
    inp.value = 'QA 이름바꾸기 테스트';
    card.querySelector('[data-a=saveName]').click(); await new Promise(r=>setTimeout(r,400));
    const nameNow = document.querySelector('.take .nm').textContent;
    return { nameNow };
  })()`);
  console.log('LIB_ACTS', JSON.stringify(libActs));

  const backup = await c.ev(`(async()=>{
    let captured = null;
    const origCreate = URL.createObjectURL;
    URL.createObjectURL = function(blob){ captured = blob; return origCreate.call(URL, blob); };
    document.querySelector('#bakOut').click();
    await new Promise(r=>setTimeout(r,800));
    URL.createObjectURL = origCreate;
    if (!captured) return {err:'no blob captured'};
    const text = await captured.text();
    window.__qaBackupText = text;
    let parsed; try { parsed = JSON.parse(text); } catch(e){ return {err:'bad json', text: text.slice(0,200)}; }
    return { app: parsed.app, takeCount: (parsed.takes||[]).length, hasAudio64: !!(parsed.takes && parsed.takes[0] && parsed.takes[0].audio64), textLen: text.length };
  })()`);
  console.log('BACKUP_EXPORT', JSON.stringify(backup));

  const delFlow = await c.ev(`(async()=>{
    const delBtn = document.querySelector('.take [data-a=del]');
    if (!delBtn) return {err:'no del btn'};
    delBtn.click(); await new Promise(r=>setTimeout(r,100));
    const afterFirstClickText = delBtn.textContent;
    const stillThereAfterFirstClick = !!document.querySelector('.take');
    delBtn.click(); await new Promise(r=>setTimeout(r,300));
    return { afterFirstClickText, stillThereAfterFirstClick, remaining: (await RPX.DB.all()).length };
  })()`);
  console.log('DELETE_FLOW', JSON.stringify(delFlow));

  const restore = await c.ev(`(async()=>{
    const text = window.__qaBackupText;
    if (!text) return {err:'no backup text saved'};
    const f = new File([text], 'backup.json', { type: 'application/json' });
    const dt = new DataTransfer(); dt.items.add(f);
    const inp = document.querySelector('#bakIn'); inp.files = dt.files;
    inp.dispatchEvent(new Event('change'));
    await new Promise(r=>setTimeout(r,800));
    const list = await RPX.DB.all();
    return { restoredCount: list.length, name: list[0] && list[0].name };
  })()`);
  console.log('RESTORE_IMPORT', JSON.stringify(restore));

  const theme = await c.ev(`(async()=>{
    const before = document.querySelector('#themeBtn').textContent;
    document.querySelector('#themeBtn').click();
    const after1 = document.querySelector('#themeBtn').textContent;
    const stored = localStorage.getItem('rp.theme');
    return { before, after1, stored };
  })()`);
  console.log('THEME_TOGGLE', JSON.stringify(theme));

  // reload while still offline, confirm theme persisted
  await c.go(url);
  const themeAfterReload = await c.ev(`document.querySelector('#themeBtn').textContent + ' | dataTheme=' + document.documentElement.getAttribute('data-theme')`);
  console.log('THEME_AFTER_RELOAD', themeAfterReload);

  const resetFlow = await c.ev(`(async()=>{
    document.querySelector('nav.tabs [data-tab=settings]').click(); await new Promise(r=>setTimeout(r,200));
    const b = document.querySelector('#resetAll');
    b.click(); const afterFirst = b.textContent;
    b.click(); await new Promise(r=>setTimeout(r,300));
    const themeNow = document.querySelector('#themeBtn').textContent;
    const libCount = (await RPX.DB.all()).length;
    return { afterFirst, themeNow, libCount };
  })()`);
  console.log('RESET_ALL', JSON.stringify(resetFlow));

  await c.go(url + 'guide.html');
  const guide = await c.ev(`(async()=>{
    const secs = document.querySelectorAll('h2').length;
    const backLink = document.querySelector('header a');
    return { secs, backHref: backLink && backLink.getAttribute('href'), title: document.title };
  })()`);
  console.log('GUIDE_OFFLINE', JSON.stringify(guide));
  await c.ev(`document.querySelector('header a').click()`);
  await c.sleep(1000);
  console.log('GUIDE_BACKLINK_RESULT', await c.ev(`location.pathname + ' title=' + document.title`));
};
