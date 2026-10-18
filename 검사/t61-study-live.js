// 수드 리듬 공부 실주소 확인: node 검사/t61-study-live.js
const PW = process.env.PW || 'C:/Users/ultramsw67/Desktop/homepage/node_modules/playwright';
(async () => {
  const { chromium } = require(PW);
  const br = await chromium.launch(), pg = await br.newPage({ viewport: { width: 390, height: 844 }, hasTouch: true });
  const errs = []; pg.on('pageerror', e => errs.push(e.message));
  await pg.goto('https://ultramsw67.github.io/rhythm-practice/study/?v=' + Date.now());
  await pg.evaluate(() => document.querySelectorAll('details.unit').forEach(d => d.open = true));
  await pg.waitForTimeout(800);
  const n = await pg.evaluate(() => document.querySelectorAll('#units .card svg .vf-stavenote').length > 0 && document.querySelectorAll('#units .card svg').length);
  console.log('실주소 악보 카드', n, '오류', errs.length ? errs : '없음');
  await br.close();
  process.exit(n === 68 && !errs.length ? 0 : 1);
})();
