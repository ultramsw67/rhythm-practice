// R15: 카드 버튼 정확한 대기(경쟁 상태 방지) + 매우 긴 이름 카드 레이아웃 + 백업 내보내기/DB 비우기/불러오기 왕복 + 손상 파일 불러오기
const fs = require('fs');
const path = require('path');
const DL_DIR = path.resolve(__dirname);
module.exports = async (c) => {
  await c.size(390, 844);
  await c.send('Page.setDownloadBehavior', { behavior: 'allow', downloadPath: DL_DIR });
  await c.go('http://127.0.0.1:8772/');
  await c.ev(`(()=>{ indexedDB.deleteDatabase('rhythm-practice'); localStorage.clear(); })()`);
  await c.go('http://127.0.0.1:8772/');
  const out = {};

  // 몇 개 만들기 (채점 시험)
  await c.ev(`(async()=>{
    for (let i=0;i<4;i++){ Object.assign(RP.set,{mode:'melody',meter:'4/4',bars:4,level:2,inst:'flute',key:'C',seed:2000+i,edits:{}}); RP.rebuild();
      await RPX.selfTest(i%2===0); document.querySelector('#resSave').click(); await new Promise(r=>setTimeout(r,150)); }
    document.querySelector('nav.tabs [data-tab=library]').click(); await new Promise(r=>setTimeout(r,300));
  })()`);

  // 1) 결과/연습 버튼 - 제대로 기다린 뒤 확인
  out.resultNav = await c.ev(`(async()=>{
    document.querySelector('#libList .take [data-a=result]').click();
    await new Promise(r=>setTimeout(r,400));
    return !document.querySelector('#tab-result').classList.contains('hide');
  })()`);
  await c.ev(`document.querySelector('nav.tabs [data-tab=library]').click()`);
  await c.sleep(300);
  out.practiceNav = await c.ev(`(async()=>{
    document.querySelector('#libList .take [data-a=practice]').click();
    await new Promise(r=>setTimeout(r,400));
    return !document.querySelector('#tab-practice').classList.contains('hide');
  })()`);
  await c.ev(`document.querySelector('nav.tabs [data-tab=library]').click()`);
  await c.sleep(300);

  // 2) 매우 긴 이름으로 바꾸고 카드가 레이아웃 안 깨지는지
  out.longName = await c.ev(`(async()=>{
    const card = document.querySelector('#libList .take'); const id = card.dataset.id;
    card.querySelector('[data-a=rename]').click(); await new Promise(r=>setTimeout(r,50));
    card.querySelector('.nm input').value = '가'.repeat(200);
    document.querySelector('[data-a=saveName]').click();
    await new Promise(r=>setTimeout(r,400));
    const fresh = document.querySelector('#libList .take[data-id="'+id+'"]');
    const nmDiv = fresh.querySelector('.nm');
    const rect = nmDiv.getBoundingClientRect(), cardRect = fresh.getBoundingClientRect();
    return { storedLen: (await RPX.DB.get(id)).name.length, nmWidth: rect.width, cardWidth: cardRect.width, overflowsCard: rect.width > cardRect.width + 2, scrollWidthVsClient: nmDiv.scrollWidth - nmDiv.clientWidth };
  })()`);
  await c.shotEl('qa-b/r15-longname-card.png', '#libList');

  // 3) 백업 내보내기
  const beforeFiles = fs.readdirSync(DL_DIR);
  await c.ev(`document.querySelector('#bakOut').click()`);
  await c.sleep(700);
  const afterFiles = fs.readdirSync(DL_DIR);
  const bakFile = afterFiles.find(f => !beforeFiles.includes(f) && f.endsWith('.json'));
  out.bakFile = bakFile;
  out.dbBeforeWipe = await c.ev(`(async()=>(await RPX.DB.all()).length)()`);

  // 4) DB 비우기(반영구 삭제) 후 새로고침 -> 비어 있는지
  await c.ev(`(()=>{ indexedDB.deleteDatabase('rhythm-practice'); })()`);
  await c.go('http://127.0.0.1:8772/');
  await c.ev(`document.querySelector('nav.tabs [data-tab=library]').click()`);
  await c.sleep(300);
  out.dbAfterWipe = await c.ev(`(async()=>(await RPX.DB.all()).length)()`);
  out.libStatusAfterWipe = await c.ev(`document.querySelector('#libStatus').textContent`);

  // 5) 정상 백업 불러오기 (파일 선택창 없이 DataTransfer 로 주입)
  const bakContent = fs.readFileSync(path.join(DL_DIR, bakFile), 'utf8');
  out.importOk = await c.ev(`(async()=>{
    const dt = new DataTransfer();
    dt.items.add(new File([${JSON.stringify(bakContent)}], 'backup.json', { type: 'application/json' }));
    const inp = document.querySelector('#bakIn'); inp.files = dt.files;
    inp.dispatchEvent(new Event('change'));
    await new Promise(r=>setTimeout(r,700));
    return { toast: document.querySelector('#toast').textContent, count: (await RPX.DB.all()).length };
  })()`);
  // 오디오가 재생 가능한지 (RIFF 헤더인지)
  out.audioValidAfterImport = await c.ev(`(async()=>{ const all = await RPX.DB.all(); const t = all[0]; const buf = await t.audio.arrayBuffer(); const u8 = new Uint8Array(buf.slice(0,4)); return String.fromCharCode(...u8); })()`);

  // 6) 완전히 망가진(JSON 아님) 파일 불러오기
  out.badJsonImport = await c.ev(`(async()=>{
    const dt = new DataTransfer(); dt.items.add(new File(['이건 JSON 이 아님 {{{'], 'bad.json', {type:'application/json'}));
    document.querySelector('#bakIn').files = dt.files; document.querySelector('#bakIn').dispatchEvent(new Event('change'));
    await new Promise(r=>setTimeout(r,400));
    return { toast: document.querySelector('#toast').textContent, count: (await RPX.DB.all()).length };
  })()`);

  // 7) app 필드는 맞지만 takes 배열에 정상+비정상 항목 섞인 파일
  out.mixedImport = await c.ev(`(async()=>{
    const before = (await RPX.DB.all()).length;
    const mixed = { app:'rhythm-practice', v:1, takes: [
      { id:'ok-1', name:'정상항목', created: Date.now(), set:{mode:'rhythm',meter:'4/4',level:1,bars:4,key:'C',inst:'clarinet',bpm:90,pickup:'off',artic:'auto',seed:1,edits:{}}, result:{total:80}, dur:1, audio64: btoa('RIFF____WAVEfmt ') },
      { id:'bad-1', name:'깨진항목-미터없음', created: Date.now(), set:{mode:'rhythm', meter:'9/9', level:1, bars:4}, result:{total:80}, audio64:'' },
      { id:'bad-2', name:'깨진항목-total아님', created: Date.now(), set:{mode:'rhythm',meter:'4/4',level:1,bars:4,key:'C',inst:'clarinet',bpm:90,pickup:'off',artic:'auto',seed:1,edits:{}}, result:{total:'x'}, audio64:'' },
    ]};
    const dt = new DataTransfer(); dt.items.add(new File([JSON.stringify(mixed)], 'mixed.json', {type:'application/json'}));
    document.querySelector('#bakIn').files = dt.files; document.querySelector('#bakIn').dispatchEvent(new Event('change'));
    await new Promise(r=>setTimeout(r,500));
    return { toast: document.querySelector('#toast').textContent, before, after: (await RPX.DB.all()).length };
  })()`);

  console.log(JSON.stringify(out, null, 1));
};
