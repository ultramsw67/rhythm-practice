// 파일 빌드 추가 검사: 정확한 버전 문구, 재실행 간 보관함 유지(IndexedDB), 백업 내보내기/불러오기, 설정 되돌리기
module.exports = async (c) => {
  await c.size(390, 844, true);
  await c.send('Network.enable');
  await c.send('Network.emulateNetworkConditions', { offline: true, latency: 0, downloadThroughput: -1, uploadThroughput: -1 });
  const f = 'file:///C:/Users/ultramsw67/Desktop/' + encodeURIComponent('리듬 연습 오프라인') + '/' + encodeURIComponent('리듬 연습 오프라인.html');
  await c.go(f);
  await c.ev(`document.querySelector('#startClose') && document.querySelector('#startClose').click()`).catch(()=>{});

  const persisted = await c.ev(`(async()=>{ const list = await RPX.DB.all(); return { countOnRelaunch: list.length, note: RPX.DB.note }; })()`);
  console.log('PERSIST_ACROSS_RELAUNCH', JSON.stringify(persisted));

  const verCheck = await c.ev(`(async()=>{
    document.querySelector('nav.tabs [data-tab=settings]').click(); await new Promise(r=>setTimeout(r,200));
    const ps = [...document.querySelectorAll('#tab-settings p')].map(p=>p.textContent);
    const realVer = ps.find(t => t.trim().startsWith('버전 v'));
    const offlineStatusEl = document.querySelector('#offlineStatus');
    return { realVer, offlineStatusText: offlineStatusEl && offlineStatusEl.textContent, allPs: ps.slice(0,6) };
  })()`);
  console.log('VERSION_TEXT', JSON.stringify(verCheck));

  const backup = await c.ev(`(async()=>{
    let captured = null;
    const origCreate = URL.createObjectURL;
    URL.createObjectURL = function(blob){ captured = blob; return origCreate.call(URL, blob); };
    document.querySelector('#bakOut').click();
    await new Promise(r=>setTimeout(r,800));
    URL.createObjectURL = origCreate;
    if (!captured) return {err:'no blob'};
    const text = await captured.text();
    window.__qaBak = text;
    const j = JSON.parse(text);
    return { takeCount: j.takes.length };
  })()`);
  console.log('BACKUP_EXPORT', JSON.stringify(backup));

  const delFlow = await c.ev(`(async()=>{
    document.querySelector('nav.tabs [data-tab=library]').click(); await new Promise(r=>setTimeout(r,400));
    const delBtn = document.querySelector('.take [data-a=del]');
    if (!delBtn) return {err:'no take'};
    delBtn.click(); await new Promise(r=>setTimeout(r,100));
    delBtn.click(); await new Promise(r=>setTimeout(r,300));
    return { remaining: (await RPX.DB.all()).length };
  })()`);
  console.log('DELETE_FLOW', JSON.stringify(delFlow));

  const restore = await c.ev(`(async()=>{
    const text = window.__qaBak; if (!text) return {err:'no backup'};
    const file = new File([text], 'b.json', {type:'application/json'});
    const dt = new DataTransfer(); dt.items.add(file);
    const inp = document.querySelector('#bakIn'); inp.files = dt.files;
    inp.dispatchEvent(new Event('change'));
    await new Promise(r=>setTimeout(r,800));
    return { restoredCount: (await RPX.DB.all()).length };
  })()`);
  console.log('RESTORE', JSON.stringify(restore));

  const resetFlow = await c.ev(`(async()=>{
    document.querySelector('nav.tabs [data-tab=settings]').click(); await new Promise(r=>setTimeout(r,200));
    const b = document.querySelector('#resetAll');
    b.click(); const afterFirst = b.textContent;
    b.click(); await new Promise(r=>setTimeout(r,300));
    return { afterFirst, libCountAfterReset: (await RPX.DB.all()).length, themeNow: document.querySelector('#themeBtn').textContent };
  })()`);
  console.log('RESET_ALL', JSON.stringify(resetFlow));
};
