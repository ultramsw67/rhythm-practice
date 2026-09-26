// PC 파일 빌드(②) 종합 검사: file:// + 완전 오프라인, 녹음, 공유 링크, 다운로드, 백업, 사용법 링크
module.exports = async (c) => {
  await c.size(390, 844, true);
  await c.send('Network.enable');
  await c.send('Network.emulateNetworkConditions', { offline: true, latency: 0, downloadThroughput: -1, uploadThroughput: -1 });
  const f = 'file:///C:/Users/ultramsw67/Desktop/' + encodeURIComponent('리듬 연습 오프라인') + '/' + encodeURIComponent('리듬 연습 오프라인.html');
  await c.go(f);

  const basic = await c.ev(`(async()=>{
    await new Promise(r=>setTimeout(r,800));
    document.querySelector('#startClose') && document.querySelector('#startClose').click();
    const status = (document.querySelector('#offlineStatus')||{}).textContent;
    const verLine = [...document.querySelectorAll('#tab-settings p')].map(p=>p.textContent).find(t=>t.includes('버전'));
    const vex = !!(window.Vex && (Vex.Flow||Vex).Stave);
    const svg = !!document.querySelector('#score svg');
    return { secure: isSecureContext, status, verLine, vex, svg };
  })()`);
  console.log('FILE_BASIC', JSON.stringify(basic));

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

  const libState = await c.ev(`(async()=>{ const list = await RPX.DB.all(); return { count: list.length, note: RPX.DB.note }; })()`);
  console.log('LIB_STATE', JSON.stringify(libState));

  const share = await c.ev(`(async()=>{
    let clip = null;
    try { await navigator.permissions.query({name:'clipboard-write'}); } catch(e){}
    const origWrite = navigator.clipboard && navigator.clipboard.writeText;
    if (navigator.clipboard) navigator.clipboard.writeText = t => { clip = t; return Promise.resolve(); };
    document.querySelector('#shareBtn').click();
    await new Promise(r=>setTimeout(r,400));
    if (navigator.clipboard && origWrite) navigator.clipboard.writeText = origWrite;
    return { clip, hash: location.hash.slice(0,20), href: location.href.split('#')[0] };
  })()`);
  console.log('SHARE_LINK', JSON.stringify(share));

  const downloads = await c.ev(`(async()=>{
    document.querySelector('nav.tabs [data-tab=library]').click(); await new Promise(r=>setTimeout(r,400));
    const card = document.querySelector('.take'); if (!card) return {err:'no card'};
    const caps = [];
    const origCreate = URL.createObjectURL;
    URL.createObjectURL = function(blob){ caps.push(blob); return origCreate.call(URL, blob); };
    card.querySelector('[data-a=wav]').click(); await new Promise(r=>setTimeout(r,300));
    card.querySelector('[data-a=json]').click(); await new Promise(r=>setTimeout(r,300));
    URL.createObjectURL = origCreate;
    const out = [];
    for (const b of caps) out.push({ type: b.type, size: b.size });
    let jsonOk = null;
    if (caps[1]) { try { JSON.parse(await caps[1].text()); jsonOk = true; } catch(e) { jsonOk = false; } }
    return { blobs: out, jsonOk };
  })()`);
  console.log('DOWNLOADS', JSON.stringify(downloads));

  console.log('CONSOLE_ERR_COUNT_SO_FAR', c.logs.filter(l=>l.startsWith('EXC')||l.includes('error')).length);

  await c.ev(`document.querySelector('a[href="사용법.html"]').click()`);
  await c.sleep(1200);
  console.log('GUIDE_LINK', await c.ev(`location.href.split('/').pop() + ' title=' + document.title + ' h2=' + document.querySelectorAll('h2').length`));
  await c.ev(`document.querySelector('header a').click()`);
  await c.sleep(1200);
  console.log('BACK_TO_APP', await c.ev(`location.href.split('/').pop() + ' title=' + document.title`));
};
