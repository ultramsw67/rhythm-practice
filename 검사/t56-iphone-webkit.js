// v4.0.1 (2026-10-07 "아이폰도 철저히 점검"): 사파리 엔진(웹킷, 플레이라이트)으로 아이폰 흉내 — 실제 터치(page.tap)
// ① 빠르기 막대 끌기·톡 누르기 + v4.0.2 빠르기말 목록 창(열기·고르기·✓·바깥 닫기) ② 네 탭의 보이는 모든 단추·칸이 손가락에 닿는지(덮임 없음)·작지 않은지,
//   선택·입력 칸은 탭으로 포커스가 가는지·글자 16px 이상(작으면 아이폰이 화면을 확대) ③ 악보 그림·가로 넘침·스크립트 오류 ④ 가상 연주 채점 100
// 폭 375(SE·미니)·390·430(프로 맥스) × 글자 3단계 × 밝음/어두움.
// 실행(서버 127.0.0.1:8765 켜 둠): PW=<플레이라이트 경로, 예: C:/Users/ultramsw67/Desktop/homepage/node_modules/playwright> node t56-iphone-webkit.js
// 통과: bad [] 0, errs [] 0
const { webkit } = require(process.env.PW || 'playwright');
const UA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Mobile/15E148 Safari/604.1';
(async () => {
  const browser = await webkit.launch();
  const bad = [], errs = []; let total = 0;
  const combos = [[375, 2, false], [390, 3, true], [430, 2, true], [375, 3, false], [390, 1, false]];
  for (const [w, font, dark] of combos) {
    const ctx = await browser.newContext({ viewport: { width: w, height: 760 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true, userAgent: UA, colorScheme: dark ? 'dark' : 'light' });
    const page = await ctx.newPage();
    page.on('pageerror', e => errs.push(String(e).slice(0, 200)));
    page.on('console', m => { if (m.type() === 'error') errs.push('console: ' + m.text().slice(0, 200)); });
    await page.goto('http://127.0.0.1:8765/?t56=' + Date.now());
    await page.evaluate(f => { localStorage.clear(); localStorage.setItem('rp.startSeen', 'true'); localStorage.setItem('rp.font', String(f)); }, font);
    await page.goto('http://127.0.0.1:8765/?t56b=' + Date.now()); await page.waitForTimeout(2500);
    const tag = `iphone ${w} font${font} ${dark ? 'dark' : 'light'}`;
    if (await page.$('#inappGate')) bad.push({ tag, err: 'inapp gate in Safari' });
    const svg = await page.evaluate(() => !!document.querySelector('#score svg') && !document.querySelector('#score .placeholder'));
    if (!svg) bad.push({ tag, err: 'score not drawn' });
    // ① 빠르기 막대: 끌기·톡 누르기로 빠르기가 바뀌고 숫자·빠르기 줄·악보가 따라오는지
    if (!(await page.evaluate(() => document.querySelector('#setBox').open))) await page.tap('#setBox summary');
    if (!(await page.evaluate(() => document.querySelector('#setBox').open))) bad.push({ tag, err: 'setBox not opened by tap' });
    const rst = () => page.evaluate(() => ({ bpm: RP.set.bpm, num: +document.querySelector('#bpmNum').value, range: +document.querySelector('#bpmRange').value, beat: document.querySelector('#beatLabel').textContent, scoreBpm: RP.score.set.bpm, svg: !!document.querySelector('#score svg') }));
    const okS = s => s.bpm === s.num && s.bpm === s.range && s.beat.includes('= ' + s.bpm + ',') && s.scoreBpm === s.bpm && s.svg;
    await page.locator('#bpmRange').scrollIntoViewIfNeeded();
    const rb = await page.locator('#bpmRange').boundingBox();
    if (rb.height < 44) bad.push({ tag, err: 'range touch height', h: rb.height });
    const X = f => rb.x + 10 + (rb.width - 20) * f, Y = rb.y + rb.height / 2;
    const s0 = await rst();
    await page.mouse.move(X(0.29), Y); await page.mouse.down();
    for (let k = 1; k <= 8; k++) await page.mouse.move(X(0.29 + 0.61 * k / 8), Y);
    await page.mouse.up(); await page.waitForTimeout(450);
    const s1 = await rst();
    if (!(s1.bpm > s0.bpm + 60) || !okS(s1)) bad.push({ tag, err: 'drag right', s0: s0.bpm, s1 });
    await page.touchscreen.tap(X(0.5), Y); await page.waitForTimeout(450);
    const s2 = await rst();
    if (Math.abs(s2.bpm - 124) > 6 || !okS(s2)) bad.push({ tag, err: 'tap middle', s2 });
    console.log(tag, 'range', s0.bpm, '→', s1.bpm, 'tap', s2.bpm, 'h', rb.height);
    // v4.0.2 빠르기말 목록 창: 손가락으로 열기 → 13줄·44px·16px·화면 안 → Andante 누르면 88·✓·닫힘 → 다시 열면 ✓ 그대로 → 바깥 누르면 닫힘
    const menu = () => page.evaluate(() => ({ open: !document.querySelector('#tempoMenu').classList.contains('hide'), txt: document.querySelector('#tempoPickTxt').textContent, bpm: RP.set.bpm,
      ck: [...document.querySelectorAll('#tempoMenu button')].filter(b => b.getAttribute('aria-selected') === 'true').map(b => b.textContent.trim()),
      rows: [...document.querySelectorAll('#tempoMenu button')].map(b => [Math.round(b.getBoundingClientRect().height), parseFloat(getComputedStyle(b).fontSize)]),
      box: (r => [r.left, r.top, r.right, r.bottom, innerWidth, innerHeight])(document.querySelector('#tempoMenu').getBoundingClientRect()) }));
    await page.locator('#tempoPick').scrollIntoViewIfNeeded(); await page.tap('#tempoPick'); await page.waitForTimeout(400);
    const m0 = await menu();
    if (!m0.open) bad.push({ tag, err: 'tempo menu not opened by tap' });
    else {
      if (m0.rows.length !== 13 || m0.rows.some(([h, fs]) => h < 44 || fs < 16)) bad.push({ tag, err: 'tempo menu rows', rows: m0.rows });
      const [L, T, R, B, W, H] = m0.box; if (L < 0 || T < 0 || R > W || B > H) bad.push({ tag, err: 'tempo menu off screen', box: m0.box });
      if (m0.ck.length !== 1) bad.push({ tag, err: 'tempo menu check count', ck: m0.ck });
      await page.screenshot({ path: `t56-menu-${w}-f${font}-${dark ? 'dark' : 'light'}.png` });
      await page.tap('#tempoMenu button[data-bpm="88"]'); await page.waitForTimeout(450);
      const m1 = await menu(), sA = await rst();
      if (m1.open || m1.bpm !== 88 || m1.ck.join() !== '✓Andante (88)' || m1.txt !== 'Andante (88)' || !okS(sA)) bad.push({ tag, err: 'tempo menu pick', m1 });
      await page.tap('#tempoPick'); await page.waitForTimeout(400);
      const m2 = await menu();
      if (!m2.open || m2.ck.join() !== '✓Andante (88)') bad.push({ tag, err: 'tempo menu reopen check', ck: m2.ck });
      await page.touchscreen.tap(6, 10); await page.waitForTimeout(250);
      const m3 = await menu();
      if (m3.open || m3.bpm !== 88) bad.push({ tag, err: 'tempo menu backdrop close', m3: { open: m3.open, bpm: m3.bpm } });
      // 두 번 빠르게 누름: 두 번째 눌림(바탕)이 창을 바로 닫지 않아야
      await page.tap('#tempoPick'); await page.touchscreen.tap(6, 10); await page.waitForTimeout(100);
      if (!(await menu()).open) bad.push({ tag, err: 'double tap closed menu at once' });
      await page.waitForTimeout(400); await page.touchscreen.tap(6, 10); await page.waitForTimeout(250);
      if ((await menu()).open) bad.push({ tag, err: 'menu not closed after double-tap check' });
      console.log(tag, 'menu ok', m1.bpm, m1.ck.join());
    }
    await page.locator('.tempo').scrollIntoViewIfNeeded();
    await page.screenshot({ path: `t56-${w}-f${font}-${dark ? 'dark' : 'light'}.png` });
    // ② 네 탭 모든 칸
    for (const tab of ['practice', 'result', 'library', 'settings']) {
      await page.tap(`nav.tabs button[data-tab="${tab}"]`); await page.waitForTimeout(300);
      if (await page.evaluate(t => document.querySelector('#tab-' + t).classList.contains('hide'), tab)) { bad.push({ tag, tab, err: 'tab not opened by tap' }); continue; }
      const n = await page.evaluate(t => {
        let i = 0;
        document.querySelectorAll('[data-t56]').forEach(e => delete e.dataset.t56);   // 앞 탭 이름표 지우기
        const els = [...document.querySelector('#tab-' + t).querySelectorAll('button,select,input,summary,a[href]')].filter(e => {
          const r = e.getBoundingClientRect();
          return r.width > 0 && r.height > 0 && getComputedStyle(e).visibility !== 'hidden' && !e.disabled && !e.closest('.hide') && !(e.closest('details:not([open])') && e.tagName !== 'SUMMARY');
        });
        els.forEach(e => e.dataset.t56 = 'k' + (i++));
        return i;
      }, tab);
      for (let i = 0; i < n; i++) {
        total++;
        const r = await page.evaluate(k => {
          const e = document.querySelector(`[data-t56="${k}"]`); e.scrollIntoView({ block: 'center' });
          const b = e.getBoundingClientRect(); const lab = e.closest('label'); const chk = e.type === 'checkbox' || e.type === 'radio';
          const pts = [[0.5, 0.5], [0.25, 0.5], [0.75, 0.5]].map(([fx, fy]) => document.elementFromPoint(b.left + b.width * fx, b.top + b.height * fy));
          const ok = pts.every(h => h && (h === e || e.contains(h) || (lab && lab.contains(h))));
          const small = chk ? (lab ? lab.getBoundingClientRect().height < 40 : b.height < 20) : (b.height < 40 || b.width < 40);
          return {
            d: (e.id || '') + ' ' + e.tagName + ' ' + (e.textContent || e.value || '').trim().slice(0, 14), ok, small, hit: pts.map(h => h ? (h.id || h.tagName) : null).join('/'),
            form: e.tagName === 'SELECT' || (e.tagName === 'INPUT' && /number|text/.test(e.type)), fs: parseFloat(getComputedStyle(e).fontSize),
          };
        }, 'k' + i);
        if (!r.ok) bad.push({ tag, tab, el: r.d, err: 'covered', hit: r.hit });
        if (r.small) bad.push({ tag, tab, el: r.d, err: 'small' });
        if (r.form && r.fs < 16) bad.push({ tag, tab, el: r.d, err: 'font<16 (iPhone zooms on focus)', fs: r.fs });
        if (r.form) {
          await page.tap(`[data-t56="k${i}"]`).catch(e => bad.push({ tag, tab, el: r.d, err: 'tap failed ' + e.message.slice(0, 80) }));
          const f = await page.evaluate(k => document.activeElement === document.querySelector(`[data-t56="${k}"]`), 'k' + i);
          if (!f) bad.push({ tag, tab, el: r.d, err: 'not focused by tap' });
          await page.evaluate(() => document.activeElement && document.activeElement.blur && document.activeElement.blur());
        }
      }
      const ox = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
      if (ox > 0) bad.push({ tag, tab, overflowX: ox });
      console.log(tag, tab, 'controls', n);
    }
    // ④ 가상 연주 채점
    await page.tap('nav.tabs button[data-tab="settings"]'); await page.waitForTimeout(300);
    const st = await page.evaluate(async () => {
      const b = document.querySelector('#selfPerfect'); if (!b) return 'no selfPerfect';
      b.click();
      for (let i = 0; i < 60; i++) {
        await new Promise(r => setTimeout(r, 500));
        const t = document.querySelector('#resTotal');
        if (t && /[0-9]/.test(t.textContent) && !document.querySelector('#tab-result').classList.contains('hide')) return t.textContent.trim();
      }
      return 'timeout';
    });
    console.log(tag, 'self test', st);
    if (!/100/.test(st)) bad.push({ tag, err: 'self test', st });
    await ctx.close();
  }
  await browser.close();
  console.log('total', total);
  console.log('bad', JSON.stringify(bad.slice(0, 15)), bad.length);
  console.log('errs', JSON.stringify(errs.slice(0, 8)), errs.length);
})();
