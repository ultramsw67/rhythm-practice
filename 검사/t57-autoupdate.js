// v4.0.4 (2026-10-08 "PC에서는 적용되었는데 핸드폰은 아직"): 앱을 열거나 다시 앞으로 가져올 때 새 버전이면 저절로 새로고침하는지
// 웹킷(아이폰)·크로뮴(안드로이드) 휴대폰 흉내. version.txt 를 가로채서 본다. 확인 간격(20초)에 흔들리지 않게 2초마다 "앞으로 옴"을 보내며 기다린다.
// ① 같은 버전 → 그대로 ② 결과 탭이면 기다림 ③ 앱이 바쁘면(녹음·채점 등) 기다림 + 저장 안 한 결과 단추가 보이면 바쁨 ④ 옛 버전 표 → 그대로
// ⑤ 연습 탭·한가함·새 버전 → 한 번 새로고침 + "새 버전…으로 바꾸는 중" 안내가 뜸 ⑥ 같은 새 버전으로 되풀이 안 함 ⑦ 들어보기 중이면 바쁨 ⑧ /offline/ 은 운영 종료 안내(10/8)
// 실행(서버 127.0.0.1:8765): PW=<playwright 경로> node t57-autoupdate.js   통과: bad [] 0
const pw = require(process.env.PW || 'playwright');
(async () => {
  const bad = [];
  for (const [name, bt] of [['iphone', pw.webkit], ['android', pw.chromium]]) {
    const b = await bt.launch();
    const ctx = await b.newContext({ viewport: { width: 390, height: 800 }, isMobile: name === 'android', hasTouch: true });
    // 안내 문구를 sessionStorage 에 적어 둔다 (새로고침 뒤에도 남음)
    await ctx.addInitScript(() => {
      document.addEventListener('DOMContentLoaded', () => {
        const t = document.getElementById('toast'); if (!t) return;
        new MutationObserver(() => { try { if (/새 버전/.test(t.textContent)) sessionStorage.setItem('t57toast', t.textContent); } catch (e) { } }).observe(t, { childList: true, characterData: true, subtree: true });
      });
    });
    const page = await ctx.newPage(); const errs = [];
    page.on('pageerror', e => errs.push(String(e).slice(0, 160)));
    let served = null, loads = 0;
    await page.route('**/version.txt*', r => served ? r.fulfill({ status: 200, contentType: 'text/plain', body: served + '\n' }) : r.continue());
    page.on('load', () => loads++);
    await page.goto((process.env.BASE || 'http://127.0.0.1:8765/') + '?t57=' + Date.now());
    await page.evaluate(() => { localStorage.setItem('rp.startSeen', 'true'); });
    await page.reload(); await page.waitForTimeout(4000);
    const cur = await page.evaluate(() => document.querySelector('#tab-settings').textContent.match(/버전 (v[\d.]+)/)[1]);
    const nudge = () => page.evaluate(() => window.dispatchEvent(new Event('focus'))).catch(() => { });
    // ms 동안 2초마다 앞으로 옴을 보내며, 새로고침이 일어나면 바로 true
    const watch = async (ms) => { const l0 = loads; const end = Date.now() + ms; while (Date.now() < end) { await nudge(); await page.waitForTimeout(2000); if (loads !== l0) { await page.waitForTimeout(2000); return true; } } return false; };
    const tab = t => page.evaluate(t => document.querySelector(`nav.tabs button[data-tab="${t}"]`).click(), t);
    // ① 같은 버전
    served = cur; if (await watch(25000)) bad.push({ name, err: 'reloaded on same version' });
    // ② 결과 탭이면 기다림
    served = 'v9.9.9'; await tab('result'); if (await watch(25000)) bad.push({ name, err: 'reloaded while on result tab' });
    await tab('practice');
    // ③ 바쁨
    if (!(await page.evaluate(() => { const b = document.querySelector('#resSave'); b.classList.remove('hide'); const r = window.rpBusyCore(); b.classList.add('hide'); return r && !window.rpBusyCore(); }))) bad.push({ name, err: 'rpBusyCore resSave' });
    await page.evaluate(() => { window.__b = window.rpBusyCore; window.rpBusyCore = () => true; });
    if (await watch(25000)) bad.push({ name, err: 'reloaded while busy' });
    await page.evaluate(() => { window.rpBusyCore = window.__b; });
    // ④ 옛 버전 표
    served = 'v1.0.0'; if (await watch(25000)) bad.push({ name, err: 'reloaded on older version.txt' });
    // ⑤ 새 버전 → 새로고침 + 안내
    served = 'v9.9.9';
    if (!(await watch(45000))) bad.push({ name, err: 'no reload on new version' });
    const tt = await page.evaluate(() => sessionStorage.getItem('t57toast'));
    if (!tt || !tt.includes('v9.9.9')) bad.push({ name, err: 'no update toast', tt });
    // ⑥ 같은 새 버전으로 되풀이 안 함 (5분 안)
    await page.waitForTimeout(4000);
    if (await watch(25000)) bad.push({ name, err: 'reload loop' });
    // ⑦ 들어보기 중이면 바쁨 (윈도의 웹킷 시험 브라우저에는 소리 장치가 없어 건너뜀)
    if (await page.evaluate(() => !!(window.AudioContext || window.webkitAudioContext))) {
      await page.evaluate(() => document.querySelector('#playBtn').click()); await page.waitForTimeout(1500);
      if (!(await page.evaluate(() => window.rpBusyCore()))) bad.push({ name, err: 'not busy while playing' });
      await page.evaluate(() => document.querySelector('#playBtn').click()); await page.waitForTimeout(500);
    }
    // ⑧ 오프라인 앱
    await page.goto((process.env.BASE || 'http://127.0.0.1:8765/') + 'offline/?t57=' + Date.now()); await page.waitForTimeout(4000); await nudge(); await page.waitForTimeout(1500);
    if (!(await page.evaluate(() => /운영을 마쳤습니다/.test(document.body.textContent)))) bad.push({ name, err: 'offline farewell page missing' });   // 2026-10-08 오프라인 앱 운영 종료
    if (errs.length) bad.push({ name, errs });
    console.log(name, 'cur', cur, 'loads', loads, 'toast', tt);
    await b.close();
  }
  console.log('bad', JSON.stringify(bad), bad.length);
})();
