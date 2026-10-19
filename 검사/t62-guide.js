// v4.1 수드 도우미(sood-guide.js + sood-guide-helps.js) 확인
// ① 단추가 보이고 아래 탭 막대·가로 넘침과 겹치지 않음(390·320·아주 크게) ② 단추를 누르면 그 화면 도움말 창(연습·결과(빈/점수)·보관함·설정)
// ③ 녹음 파일(mp3)이 없어도 오류 없이 기계 목소리로 넘어감, 그만 누르면 노란 줄 없음 ④ 가만히 있으면 말풍선(시험은 2초), 말풍선 누르면 창
// ⑤ 들어보기·녹음 중에는 말풍선 안 나옴·녹음 중 단추 잠금·녹음 시작 때 읽기 멈춤 ⑥ 설정에서 끄기(새로고침해도 끔, 말풍선도 안 나옴)·다시 켜기
// ⑦ 처음 안내 카드 「수드가 읽어 주기」 ⑧ 창 단추 44px·글자 16px, 오류(EXC) 없음
// 사용: node cdp.js t62-guide.js   (서버 127.0.0.1:8765)   통과: bad []
module.exports = async (c) => {
  const out = {}, bad = [];
  const ok = (name, cond, info) => { out[name] = cond ? 'ok' : ('FAIL ' + JSON.stringify(info)); if (!cond) bad.push(name); if (process.env.V) console.log(name, out[name]); };
  const BASE = process.env.URL0 || 'http://127.0.0.1:8765/';
  const H = (() => { const w = {}; require('vm').runInNewContext(require('fs').readFileSync(require('path').join(__dirname, '..', 'sood-guide-helps.js'), 'utf8'), { window: w }); return w.SOOD_HELPS; })();
  const click = async (sel) => {                     // 진짜 마우스 누르기(pointerdown→click) — 말풍선이 pointerdown 에 사라지는지까지 본다
    const r = await c.ev(`(()=>{const e=document.querySelector(${JSON.stringify(sel)}); if(!e) return null; e.scrollIntoView({block:'center'}); const b=e.getBoundingClientRect(); return {x:b.left+b.width/2,y:b.top+b.height/2};})()`);
    if (!r) return false;
    for (const type of ['mouseMoved', 'mousePressed', 'mouseReleased']) await c.send('Input.dispatchMouseEvent', { type, x: r.x, y: r.y, button: 'left', clickCount: 1 });
    await c.sleep(250); return true;
  };
  const panel = () => c.ev(`(()=>{const w=document.querySelector('.sg-wrap'); if(!w) return null; return {title: w.querySelector('.sg-title').firstChild.textContent, lines: w.querySelectorAll('.sg-line').length,
    btn: [...w.querySelectorAll('.sg-btns button')].map(b=>{const r=b.getBoundingClientRect(); return [Math.round(r.height), parseFloat(getComputedStyle(b).fontSize)];})};})()`);
  const closeP = () => c.ev(`(()=>{const b=document.querySelector('.sg-close'); if(b) b.click(); return !document.querySelector('.sg-wrap');})()`);
  const geom = () => c.ev(`(()=>{const f=document.querySelector('.sg-fab'), n=document.querySelector('nav.tabs'); const r=f.getBoundingClientRect(), nr=n.getBoundingClientRect(); const cs=getComputedStyle(f);
    return {shown: cs.display!=='none' && r.width>0, w: Math.round(r.width), h: Math.round(r.height), left: Math.round(r.left), gap: Math.round(nr.top - r.bottom), over: document.documentElement.scrollWidth - document.documentElement.clientWidth, op: cs.opacity, pe: cs.pointerEvents};})()`);
  const tab = async t => { await c.ev(`document.querySelector('nav.tabs button[data-tab=${t}]').click()`); await c.sleep(500); };

  await c.size(390, 844);
  await c.go(BASE);
  await c.ev(`(()=>{ localStorage.clear(); sessionStorage.clear(); indexedDB.deleteDatabase('rhythm-practice'); })()`);
  await c.go(BASE); await c.sleep(1200);

  // ① 단추
  ok('loaded', await c.ev(`!!(window.SoodGuide && window.SOOD_HELPS && SoodGuide.version)`), null);
  ok('helpKeys', await c.ev(`Object.keys(SOOD_HELPS).join()`) === 'practice,resultEmpty,result,library,settings', await c.ev(`Object.keys(SOOD_HELPS).join()`));
  const lineInfo = await c.ev(`Object.values(SOOD_HELPS).map(h=>[h.lines.length, Math.max(...h.lines.map(l=>l.length))])`);
  ok('lines3to5', lineInfo.every(([n, m]) => n >= 3 && n <= 5 && m <= 45), lineInfo);
  let g = await geom();
  ok('fab390', g.shown && g.w >= 44 && g.h >= 44 && g.gap >= 4 && g.gap <= 30 && g.left === 16 && g.over <= 0, g);
  await c.shot('t62-390.png', false);

  // ② 화면마다 도움말 + ⑧ 창 단추 크기
  for (const [t, key] of [['practice', 'practice'], ['result', 'resultEmpty'], ['library', 'library'], ['settings', 'settings']]) {
    await tab(t);
    await click('.sg-fab'); await c.sleep(300);
    const p = await panel();
    ok('open-' + key, p && p.title === H[key].title && p.lines === H[key].lines.length && p.btn.every(([h, f]) => h >= 44 && f >= 16), p);
    if (key === 'practice') await c.shot('t62-panel.png', false);
    // ③ mp3 없음 → 기계 목소리로 넘어가도 오류 없음 / 그만 → 노란 줄 없음
    if (key === 'practice') {
      await c.sleep(1500);
      await c.ev(`document.querySelector('.sg-stopb').click()`); await c.sleep(200);
      ok('stopClears', await c.ev(`!document.querySelector('.sg-on') && !SoodGuide.speaking`), null);
      const mp3 = await c.ev(`performance.getEntriesByType('resource').filter(e=>/sood-voice\\/[0-9a-f]{8}\\.mp3/.test(e.name)).length`);
      out.mp3Requests = mp3;
    }
    ok('close-' + key, await closeP(), null);
  }
  // 점수가 있는 결과 화면
  await c.ev(`document.querySelector('#selfPerfect').click()`);
  for (let i = 0; i < 40; i++) { await c.sleep(500); if (await c.ev(`!document.querySelector('#resBox').classList.contains('hide') && !document.querySelector('#tab-result').classList.contains('hide')`)) break; }
  await c.sleep(800);
  await click('.sg-fab'); await c.sleep(300);
  let p = await panel();
  ok('open-result', p && p.title === H.result.title, p);
  await closeP();

  // ⑦ 처음 안내 카드 단추
  await tab('practice');
  ok('startGuideBtn', await click('#startGuide'), null);
  p = await panel();
  ok('startGuideOpens', p && p.title === H.practice.title, p);
  // ⑤ 읽는 중에 녹음 시작 → 읽기 멈춤 (창 위에서 녹음 단추를 누를 수 없어 코드로 누름)
  await c.ev(`document.querySelector('.sg-play').click()`); await c.sleep(100);
  await c.ev(`document.querySelector('#recBtn').click()`); await c.sleep(1500);
  ok('recStopsSpeech', await c.ev(`!SoodGuide.speaking && !document.querySelector('.sg-on')`), null);
  await closeP();
  const recOn = await c.ev(`document.body.classList.contains('recording')`);
  g = await geom();
  ok('recLocked', recOn && g.op === '0.4' && g.pe === 'none', { recOn, g });
  ok('busyWhileRec', await c.ev(`rpGuideBusy()`) === true, null);
  if (recOn) { await c.ev(`document.querySelector('#recBtn').click()`); await c.sleep(800); }
  ok('busyAfterRec', await c.ev(`rpGuideBusy()`) === false, await c.ev(`document.body.className`));

  // ④ 가만히 있으면 말풍선 (시험은 2초) · 말풍선 누르면 창
  await c.send('Page.addScriptToEvaluateOnNewDocument', { source: 'window.__rpGuideIdle = 2;' });
  await c.go(BASE); await c.sleep(1000);
  await c.sleep(2600);
  ok('peekShown', await c.ev(`!!document.querySelector('.sg-peek')`), null);
  const pk = await c.ev(`(()=>{const e=document.querySelector('.sg-peek'); if(!e) return null; const r=e.getBoundingClientRect(), n=document.querySelector('nav.tabs').getBoundingClientRect(), f=document.querySelector('.sg-fab').getBoundingClientRect(); return {inView: r.top>=0 && r.right<=innerWidth, aboveFab: r.bottom<=f.top+2};})()`);
  ok('peekPlace', pk && pk.inView && pk.aboveFab, pk);
  await click('.sg-peek'); await c.sleep(300);
  p = await panel();
  ok('peekClickOpens', !!(p && p.title === H.practice.title), p);   // 모듈 v1.1.0 은 pointerdown 에 말풍선을 지움 → 앱이 말풍선 누름만 건너뛰게 함(index.html)
  await closeP();
  // 화면마다 한 번만: 같은 화면에서 또 가만히 있어도 안 나옴
  await c.sleep(2600);
  ok('peekOncePerScreen', await c.ev(`!document.querySelector('.sg-peek')`), null);
  // 손가락으로 말풍선 누르기(touchstart→touchend→click)도 창이 열림 (v4.1.1: 모듈 원본이 처리, 앱 쪽 우회 뺌)
  await c.send('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 5 });
  await c.go(BASE); await c.sleep(2800);
  const tp = await c.ev(`(()=>{const e=document.querySelector('.sg-peek'); if(!e) return null; const b=e.getBoundingClientRect(); return {x:b.left+b.width/2,y:b.top+b.height/2};})()`);
  if (tp) {
    await c.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: tp.x, y: tp.y }] });
    await c.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    await c.sleep(500);
  }
  p = await panel();
  ok('peekTapOpens', !!tp && !!(p && p.title === H.practice.title), { tp, p });
  await closeP();
  await c.send('Emulation.setTouchEmulationEnabled', { enabled: false });

  // ⑤ 들어보기 중엔 말풍선 안 나옴: 들어보기를 켜고 아직 말풍선이 안 나온 보관함 화면으로 가서 가만히 2.6초
  await c.go(BASE); await c.sleep(300);
  await c.ev(`document.querySelector('.sg-peek') && document.querySelector('.sg-peek').remove()`);
  await c.ev(`document.querySelector('#playBtn').click()`); await c.sleep(300);
  await tab('library');
  await click('#libStatus');                         // 진짜 누르기 → 가만히 시간 다시 셈
  await c.sleep(2600);
  const playBusy = await c.ev(`rpGuideBusy()`), playing = await c.ev(`RPX.playing`);
  ok('noPeekWhilePlaying', playBusy === true && !!playing && await c.ev(`!document.querySelector('.sg-peek')`), { playBusy, playing });
  await tab('practice'); await c.ev(`document.querySelector('#playBtn').click()`); await c.sleep(300);

  // 녹음 목소리: 도움말 문장마다 sood-voice/<SoodGuide.voiceName(문장)>.mp3 가 있다 (없으면 기계 목소리로 읽지만 배포본엔 모두 있어야 함)
  const names = await c.ev(`Object.values(SOOD_HELPS).flatMap(h => h.lines).map(l => SoodGuide.voiceName(l))`);
  const fs = require('fs'), path = require('path');
  const miss = names.filter(n => !fs.existsSync(path.join(__dirname, '..', 'sood-voice', n + '.mp3')));
  ok('voiceFiles', miss.length === 0 && names.length > 0, { total: names.length, miss });
  const served = await c.ev(`fetch('sood-voice/${names[0]}.mp3').then(r => r.ok && /audio|mpeg|octet/.test(r.headers.get('content-type') || 'audio'))`);
  ok('voiceServed', served === true, served);

  // ⑥ 설정에서 끄기
  await c.go(BASE); await c.sleep(600);
  await tab('settings');
  ok('toggleChecked', await c.ev(`document.querySelector('#guideOn').checked`) === true, null);
  const tg = await c.ev(`(()=>{const r=document.querySelector('#guideOn').closest('label').getBoundingClientRect(); return Math.round(r.height);})()`);
  ok('toggle44', tg >= 44, tg);
  await click('#guideOn'); await c.sleep(300);
  g = await geom();
  ok('offHidesFab', !g.shown && await c.ev(`document.body.classList.contains('guide-off') && localStorage.getItem('rp.guideOn')==='false'`), g);
  await c.go(BASE); await c.sleep(600);
  g = await geom();
  ok('offPersists', !g.shown && await c.ev(`document.querySelector('#startGuide').classList.contains('hide')`), g);
  await c.sleep(2600);
  ok('offNoPeek', await c.ev(`!document.querySelector('.sg-peek') || getComputedStyle(document.querySelector('.sg-peek')).display==='none'`), null);
  await tab('settings'); await click('#guideOn'); await c.sleep(300);
  g = await geom();
  ok('onAgain', g.shown && await c.ev(`!document.body.classList.contains('guide-off')`), g);

  // ① 320px · 아주 크게 · 어두운 화면
  await c.size(320, 640);
  await c.ev(`localStorage.setItem('rp.font','3'); localStorage.setItem('rp.theme','"dark"')`);
  await c.go(BASE); await c.sleep(900);
  g = await geom();
  ok('fab320big', g.shown && g.gap >= 4 && g.gap <= 30 && g.over <= 0, g);
  // 맨 아래까지 내렸을 때 마지막 내용이 단추에 가리지 않음
  const cover = await c.ev(`(()=>{ scrollTo(0, document.body.scrollHeight); const f=document.querySelector('.sg-fab').getBoundingClientRect();
    const last=[...document.querySelectorAll('#tab-practice .card')].filter(e=>e.offsetParent).pop().getBoundingClientRect(); return Math.round(f.top - last.bottom); })()`);
  ok('lastCardNotCovered', cover >= 0, cover);
  await c.shot('t62-320-dark.png', false);
  await click('.sg-fab'); await c.sleep(300);
  p = await panel();
  ok('panel320', p && p.btn.every(([h]) => h >= 44) && (await c.ev(`(()=>{const r=document.querySelector('.sg-panel').getBoundingClientRect(); return r.left>=0 && r.right<=innerWidth && r.top>=0;})()`)), p);
  await c.shot('t62-320-panel.png', false);
  await closeP();

  // 기호 창이 열리면 단추 숨김
  await c.size(390, 844); await c.go(BASE); await c.sleep(900);
  await c.ev(`localStorage.setItem('rp.font','2'); localStorage.setItem('rp.theme','"auto"')`);
  const sheetOk = await c.ev(`(async()=>{ const n=document.querySelector('#score [id^="vf-ev"]'); if(!n) return 'no-note'; n.dispatchEvent(new MouseEvent('click',{bubbles:true})); await new Promise(r=>setTimeout(r,300));
    if(!document.body.classList.contains('sheet-on')) return 'no-sheet'; return getComputedStyle(document.querySelector('.sg-fab')).display; })()`);
  out.sheet = sheetOk;
  if (sheetOk !== 'no-note' && sheetOk !== 'no-sheet') ok('sheetHidesFab', sheetOk === 'none', sheetOk);

  // 토스트가 단추에 가리지 않음 · 빠르기말 창이 열리면 단추 숨김 · 들어보기 중 단추를 누르면 들어보기 멈춤
  await c.go(BASE); await c.sleep(300);
  const ts = await c.ev(`(async()=>{ RPX && 0; const t=document.querySelector('#toast'); t.textContent='지연 보정을 재는 중입니다. 끝난 뒤에 누르세요'; t.classList.add('on');
    const a=t.getBoundingClientRect(), f=document.querySelector('.sg-fab').getBoundingClientRect(); t.classList.remove('on'); return Math.round(f.top - a.bottom) < 0 && a.left < f.right ? 'overlap' : 'ok'; })()`);
  ok('toastClear', ts === 'ok', ts);
  await c.ev(`(()=>{ const d=document.querySelector('#setBox'); d.open = true; document.querySelector('#tempoPick').click(); })()`); await c.sleep(700);
  g = await geom();
  ok('tempoMenuHidesFab', !g.shown && await c.ev(`!document.querySelector('#tempoMenu').classList.contains('hide')`), g);
  await c.ev(`document.querySelector('#tempoMenuBg').click()`); await c.sleep(300);
  g = await geom();
  ok('fabBackAfterMenu', g.shown, g);
  await c.ev(`document.querySelector('#playBtn').click()`); await c.sleep(1500);
  await click('.sg-fab'); await c.sleep(400);
  ok('fabStopsPlay', await c.ev(`!RPX.playing && !!document.querySelector('.sg-wrap')`), await c.ev(`({p: !!RPX.playing, w: !!document.querySelector('.sg-wrap')})`));
  await closeP();

  // 녹음 파일을 못 받을 때(404·끊김) → 오류 없이 기계 목소리로 다음 문장까지 넘어감
  // 녹음 파일이 있으면 그 파일로 읽고(기계 목소리 0번) 다음 문장으로 넘어감
  await c.go(BASE); await c.sleep(300);
  await c.ev(`(()=>{ window.__tts = 0; if (window.speechSynthesis) speechSynthesis.speak = u => { window.__tts++; setTimeout(() => u.onend && u.onend(), 50); }; })()`);
  await click('.sg-fab'); await c.sleep(200);
  await c.ev(`(()=>{ const seen = window.__seen2 = new Set(); new MutationObserver(()=>{ document.querySelectorAll('.sg-line').forEach((l,i)=>{ if(l.classList.contains('sg-on')) seen.add(i); }); }).observe(document.querySelector('.sg-body'), {subtree:true, attributes:true}); })()`);
  await c.sleep(7000);
  const vp = await c.ev(`({ seen: [...window.__seen2], tts: window.__tts, mp3: performance.getEntriesByType('resource').filter(e=>/sood-voice\\/[0-9a-f]{8}\\.mp3/.test(e.name)).length })`);
  ok('voicePlays', Math.max(-1, ...vp.seen) >= 1 && vp.tts === 0 && vp.mp3 >= 2, vp);
  await closeP();
  //   문장 글자를 바꾸면 해시 이름이 달라져 서버에 없는 파일(404)을 찾게 됨
  await c.go(BASE); await c.sleep(300);
  //   화면 없는 크롬은 기계 목소리가 끝났다는 신호를 안 줄 때가 있어, 기계 목소리는 0.05초 만에 끝난 것으로 흉내 내고 몇 번 불렸는지 셈
  await c.ev(`(()=>{ window.__tts = 0; if (window.speechSynthesis) speechSynthesis.speak = u => { window.__tts++; setTimeout(() => u.onend && u.onend(), 50); }; })()`);
  await c.ev(`(()=>{ window.__seen = new Set(); SoodGuide.open('practice', true); document.querySelectorAll('.sg-line').forEach((l,i)=>{ l.textContent = l.textContent + ' (시험' + i + ')'; }); })()`);
  await c.ev(`(()=>{ const seen = window.__seen; new MutationObserver(()=>{ document.querySelectorAll('.sg-line').forEach((l,i)=>{ if(l.classList.contains('sg-on')) seen.add(i); }); }).observe(document.querySelector('.sg-body'), {subtree:true, attributes:true}); document.querySelector('.sg-play').click(); })()`);
  await c.sleep(4000);
  const fb = await c.ev(`({ seen: [...window.__seen], speaking: SoodGuide.speaking, tts: window.__tts, n: document.querySelectorAll('.sg-line').length, has: !!window.speechSynthesis })`);
  // 문장마다 기계 목소리 한 번씩(두 번 읽지 않음) · 끝까지 읽고 멈춤
  ok('noVoiceFallback', !fb.has || (fb.seen.length === fb.n && fb.tts === fb.n && !fb.speaking), fb);
  await closeP();

  const exc = c.logs.filter(l => /^EXC|^error/.test(l));
  ok('noErrors', exc.length === 0, exc);
  console.log(JSON.stringify(out, null, 1));
  console.log('bad', JSON.stringify(bad), bad.length);
};
