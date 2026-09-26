// R14: 보관함 전체(카드 동작·정렬·이름 바꾸기·다운로드·백업 내보내기/불러오기/손상 파일) - 마이크 불필요, 채점 시험만 사용
const path = require('path');
const DL_DIR = path.resolve(__dirname); // 다운로드 저장 폴더
module.exports = async (c) => {
  await c.size(390, 844);
  await c.send('Page.setDownloadBehavior', { behavior: 'allow', downloadPath: DL_DIR });
  await c.go('http://127.0.0.1:8772/');
  await c.ev(`(()=>{ indexedDB.deleteDatabase('rhythm-practice'); localStorage.clear(); })()`);
  await c.go('http://127.0.0.1:8772/');
  const out = {};

  // 1) 채점 시험으로 22개 생성 (설정을 바꿔가며 다양하게) + 저장
  out.genCount = await c.ev(`(async()=>{
    const variants = [
      {mode:'rhythm', meter:'4/4', bars:4, level:1, inst:'clarinet', key:'C'},
      {mode:'melody', meter:'3/4', bars:4, level:2, inst:'flute', key:'Bb'},
      {mode:'melody', meter:'6/8', bars:8, level:3, inst:'tuba', key:'F'},
      {mode:'rhythm', meter:'2/4', bars:6, level:2, inst:'clarinet', key:'C'},
    ];
    let n = 0;
    for (let i = 0; i < 22; i++) {
      const v = variants[i % variants.length];
      Object.assign(RP.set, v, { seed: 1000 + i, edits: {} });
      RP.rebuild();
      await RPX.selfTest(i % 3 === 0);
      document.querySelector('#resSave').click();
      await new Promise(r => setTimeout(r, 120));
      n++;
    }
    return n;
  })()`);
  out.dbCount = await c.ev(`(async()=>(await RPX.DB.all()).length)()`);

  // 2) 정렬 5종 확인 (독립 계산과 비교)
  out.sorts = await c.ev(`(async()=>{
    const all = (await RPX.DB.all());
    const cmp = { new:(a,b)=>b.created-a.created, old:(a,b)=>a.created-b.created, hi:(a,b)=>b.result.total-a.result.total||b.created-a.created, lo:(a,b)=>a.result.total-b.result.total||b.created-a.created, name:(a,b)=>a.name.localeCompare(b.name,'ko') };
    const out = {};
    for (const s of Object.keys(cmp)) {
      document.querySelector('#libSort').value = s; document.querySelector('#libSort').dispatchEvent(new Event('change'));
      await new Promise(r=>setTimeout(r,300));
      const shown = [...document.querySelectorAll('#libList .take .sc')].map(x=>+x.textContent);
      const expect = [...all].sort(cmp[s]).map(t=>t.result.total);
      out[s] = { match: JSON.stringify(shown)===JSON.stringify(expect), shownLen: shown.length };
    }
    return out;
  })()`);

  // 3) 재생 토글: 카드 A 재생 -> 카드 B 재생 -> A 는 되돌아가는지
  out.playToggle = await c.ev(`(async()=>{
    const cards = document.querySelectorAll('#libList .take');
    const a = cards[0].querySelector('[data-a=play]'), b = cards[1].querySelector('[data-a=play]');
    a.click(); await new Promise(r=>setTimeout(r,200));
    const aTextDuring = a.textContent;
    b.click(); await new Promise(r=>setTimeout(r,200));
    return { aTextDuring, aTextAfterBPlay: a.textContent, bTextDuring: b.textContent };
  })()`);

  // 4) 결과 / 이 악보로 연습
  out.resultBtn = await c.ev(`(()=>{ document.querySelector('#libList .take [data-a=result]').click(); return !document.querySelector('#tab-result').classList.contains('hide'); })()`);
  await c.ev(`document.querySelector('nav.tabs [data-tab=library]').click()`);
  out.practiceBtn = await c.ev(`(()=>{ document.querySelector('#libList .take [data-a=practice]').click(); return !document.querySelector('#tab-practice').classList.contains('hide'); })()`);
  await c.ev(`document.querySelector('nav.tabs [data-tab=library]').click()`);

  // 5) 이름 바꾸기: Enter 로 저장, 빈 문자열, 아주 긴 이름, HTML 비슷한 이름
  out.renameEnter = await c.ev(`(async()=>{
    const card = document.querySelector('#libList .take');
    card.querySelector('[data-a=rename]').click(); await new Promise(r=>setTimeout(r,50));
    const inp = card.querySelector('.nm input'); inp.value='엔터로 저장 테스트';
    inp.dispatchEvent(new KeyboardEvent('keydown', {key:'Enter'}));
    await new Promise(r=>setTimeout(r,400));
    return card.querySelector('.nm').textContent.trim();
  })()`);
  out.renameEmpty = await c.ev(`(async()=>{
    const card = document.querySelector('#libList .take'); const before = card.querySelector('.nm').textContent.trim();
    card.querySelector('[data-a=rename]').click(); await new Promise(r=>setTimeout(r,50));
    const inp = card.querySelector('.nm input'); inp.value=''; document.querySelector('[data-a=saveName]').click();
    await new Promise(r=>setTimeout(r,400));
    return { before, after: card.querySelector('.nm').textContent.trim() };
  })()`);
  out.renameLong = await c.ev(`(async()=>{
    const card = document.querySelector('#libList .take'); const long = '가'.repeat(300);
    card.querySelector('[data-a=rename]').click(); await new Promise(r=>setTimeout(r,50));
    const inp = card.querySelector('.nm input'); inp.value=long; document.querySelector('[data-a=saveName]').click();
    await new Promise(r=>setTimeout(r,400));
    const id = card.dataset.id; const t = await RPX.DB.get(id);
    return { shownLen: card.querySelector('.nm').textContent.trim().length, storedLen: t.name.length };
  })()`);
  out.renameHtml = await c.ev(`(async()=>{
    const card = document.querySelector('#libList .take');
    card.querySelector('[data-a=rename]').click(); await new Promise(r=>setTimeout(r,50));
    const inp = card.querySelector('.nm input'); inp.value='<b>x</b><img src=x onerror=alert(1)>'; document.querySelector('[data-a=saveName]').click();
    await new Promise(r=>setTimeout(r,400));
    const nmDiv = card.querySelector('.nm');
    return { hasRealTag: !!nmDiv.querySelector('b,img'), text: nmDiv.textContent.trim() };
  })()`);

  // 6) 다운로드: 소리 파일(wav), 기록 파일(json)
  const before = require('fs').readdirSync(DL_DIR);
  await c.ev(`document.querySelector('#libList .take [data-a=wav]').click()`);
  await c.sleep(600);
  await c.ev(`document.querySelector('#libList .take [data-a=json]').click()`);
  await c.sleep(600);
  const after = require('fs').readdirSync(DL_DIR);
  const newFiles = after.filter(f => !before.includes(f));
  out.downloadedFiles = newFiles;
  for (const f of newFiles) {
    const fp = path.join(DL_DIR, f);
    if (f.toLowerCase().endsWith('.wav')) {
      const buf = require('fs').readFileSync(fp);
      out['wavHeader_' + f] = buf.slice(0, 4).toString('ascii') + '/' + buf.slice(8, 12).toString('ascii');
    } else if (f.toLowerCase().endsWith('.json')) {
      const j = JSON.parse(require('fs').readFileSync(fp, 'utf8'));
      out['jsonKeys_' + f] = Object.keys(j);
    }
  }

  // 7) 삭제 두 번 누르기 (확인) + 한 번만 누르고 대기하면 되돌아가는지
  out.delFlow = await c.ev(`(async()=>{
    const n0 = document.querySelectorAll('#libList .take').length;
    const card = document.querySelectorAll('#libList .take')[document.querySelectorAll('#libList .take').length-1];
    const btn = card.querySelector('[data-a=del]');
    btn.click(); const textAfter1 = btn.textContent; const dangerAfter1 = btn.classList.contains('danger');
    btn.click(); await new Promise(r=>setTimeout(r,300));
    const n1 = document.querySelectorAll('#libList .take').length;
    return { n0, textAfter1, dangerAfter1, n1 };
  })()`);
  out.delRevert = await c.ev(`(async()=>{
    const card = document.querySelector('#libList .take'); const btn = card.querySelector('[data-a=del]');
    btn.click(); const textArmed = btn.textContent;
    await new Promise(r=>setTimeout(r,3800));
    return { textArmed, textAfterTimeout: btn.textContent, sureAttr: btn.dataset.sure };
  })()`);
  out.dbCountAfterDel = await c.ev(`(async()=>(await RPX.DB.all()).length)()`);

  await c.shot('qa-b/r14-library.png');
  console.log(JSON.stringify(out, null, 1));
};
