// 수드 리듬 공부(study/) 점검: node 검사/t60-study.js  — 계산 검사 + 화면(390·1280·어두운 화면) 캡처
const path = require('path'), fs = require('fs'), http = require('http');
const ROOT = path.join(__dirname, '..');
const PW = process.env.PW || 'C:/Users/ultramsw67/Desktop/homepage/node_modules/playwright';
const OUT = path.join(__dirname, 'study-shots'); fs.mkdirSync(OUT, { recursive: true });
let fail = 0; const ok = (c, m) => { console.log((c ? 'ok   ' : 'FAIL ') + m); if (!c) fail++; };

// 1) core 계산
const html = fs.readFileSync(path.join(ROOT, 'study/index.html'), 'utf8');
const core = /<script id="core">([\s\S]*?)<\/script>/.exec(html)[1];
new Function(core)();
const RS = globalThis.RS;
ok(RS.beatShapes().length === 34, '한 박 모양 34개');
const c = RS.countBar(16);
ok(c.written === 432741480 && c.sounding === 3524578, '경우의 수 ' + c.written + ' / ' + c.sounding);
const U = RS.buildUnits();
const all = U.flatMap(u => u.items);
ok(U.filter(u => u.key[0] === 'b').reduce((s, u) => s + u.items.length, 0) === 34, '한 박 단원 합 34');
for (const it of RS.beatShapes()) { const p = RS.shapeToTokens(it); ok(RS.slots(RS.parse(p)).join('') === it, `모양 ${it} → ${p}`); }
const tie = U.find(u => u.key === 't').items;
for (let i = 0; i < tie.length; i += 2) ok(tie[i].slots.join('') === tie[i + 1].slots.join(''), `붙임줄 짝 같은 소리 ${tie[i].p} = ${tie[i + 1].p}`);
const s = RS.scoreTaps([0, 0.5, 1], [0.01, 0.56, 1.3, 1.6], 0.12);
ok(s.res[0].g === 'ok' && s.res[1].g === 'late' && s.res[2].g === 'miss' && s.extra.length === 2, '채점 짝짓기');
ok(RS.scoreTaps([0, 1], [0, 1], 0.1).score === 100, '채점 만점');
console.log('리듬 수 ' + all.length);

// 2) 화면
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.png': 'image/png', '.jpg': 'image/jpeg', '.css': 'text/css' };
const srv = http.createServer((q, r) => {
  let p = decodeURIComponent(q.url.split('?')[0]); if (p.endsWith('/')) p += 'index.html';
  const f = path.join(ROOT, p);
  fs.readFile(f, (e, d) => { if (e) { r.writeHead(404); r.end(); return; } r.writeHead(200, { 'content-type': MIME[path.extname(f)] || 'application/octet-stream' }); r.end(d); });
}).listen(0, async () => {
  const port = srv.address().port, { chromium } = require(PW);
  const br = await chromium.launch();
  for (const [w, h, scheme] of [[390, 844, 'light'], [1280, 900, 'light'], [360, 740, 'dark']]) {
    const pg = await br.newPage({ viewport: { width: w, height: h }, colorScheme: scheme, hasTouch: w < 500 });
    const errs = []; pg.on('pageerror', e => errs.push(e.message)); pg.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
    await pg.goto(`http://127.0.0.1:${port}/study/`);
    await pg.waitForTimeout(400);
    // 모든 단원 펼치기
    await pg.evaluate(() => document.querySelectorAll('details.unit').forEach(d => d.open = true));
    await pg.waitForTimeout(600);
    const info = await pg.evaluate(() => ({
      svgs: document.querySelectorAll('#units .paper svg').length,
      cards: document.querySelectorAll('#units .card').length,
      over: document.documentElement.scrollWidth - innerWidth,
      small: [...document.querySelectorAll('button')].filter(b => { const r = b.getBoundingClientRect(); return r.width && r.height < 43.5; }).map(b => b.textContent.trim()).slice(0, 5),
      notesMismatch: [...document.querySelectorAll('#units .card')].filter(c => !c.querySelector('svg .vf-stavenote')).length,
    }));
    ok(info.cards === info.svgs && info.notesMismatch === 0, `${w}px 카드 ${info.cards}·악보 ${info.svgs}`);
    ok(info.over <= 0, `${w}px 가로 넘침 ${info.over}`);
    ok(info.small.length === 0, `${w}px 44px 미만 단추 ${info.small.join(',')}`);
    await pg.screenshot({ path: path.join(OUT, `list-${w}-${scheme}.png`), fullPage: true });
    // 연습판
    await pg.evaluate(() => window.__rs.openPanel(window.__rs.ALL.find(i => i.p === '8 q 8')));
    await pg.waitForTimeout(200);
    await pg.click('#pListen'); await pg.waitForTimeout(4200);
    const nowCnt = await pg.evaluate(() => document.querySelectorAll('#pGrid .now').length);
    ok(nowCnt === 1, `${w}px 들어보기 위치 표시`);
    const over2 = await pg.evaluate(() => document.querySelector('.panel').scrollWidth - document.querySelector('.panel').clientWidth);
    ok(over2 <= 0, `${w}px 연습판 가로 넘침 ${over2}`);
    await pg.screenshot({ path: path.join(OUT, `panel-${w}-${scheme}.png`) });
    // 따라 치기 — 기대 시각에 맞춰 두드림 흉내
    await pg.evaluate(() => { document.querySelector('#bpm').value = 120; document.querySelector('#bpm').oninput(); });
    await pg.click('#pTap');
    const res = await pg.evaluate(async () => {
      // 기대 시각마다 pointerdown 을 보낸다 (지연 보정 없는 헤드리스라 latency 는 0 에 가까움)
      const pad = document.querySelector('#pad'), T = window.__rs.tap(), AC = window.__rs.ac();
      const wait = ms => new Promise(r => setTimeout(r, ms));
      const lat = (AC.outputLatency || 0) + (AC.baseLatency || 0);
      for (const e of T.exp) {
        while (AC.currentTime - lat < e - 0.004) await wait(2);
        pad.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, cancelable: true }));
      }
      for (let i = 0; i < 400; i++) { await wait(10); if (document.querySelector('#pResult').textContent) break; }
      return document.querySelector('#pResult').textContent;
    });
    ok(/점/.test(res), `${w}px 따라 치기 결과 표시: ${res.slice(0, 40)}`);
    // 단원 이어서 따라 하기: 120 BPM 2단원(9개) — 첫 리듬 → 둘째 리듬으로 넘어가는지
    await pg.click('#pClose');
    await pg.click('details.unit[data-key="b2"] .chainbtn');
    const t1 = await pg.textContent('#pTitle');
    await pg.waitForTimeout(2000 * 3 + 600);   // 준비 마디 + 듣기 + 내 차례 (120 BPM 한 마디 2초)
    const t2 = await pg.textContent('#pTitle'), pr = await pg.textContent('#pResult');
    ok(t1 !== t2 && /2 \/ \d+/.test(pr), `${w}px 이어서 따라 하기 넘어감: ${t1} → ${t2} (${pr})`);
    await pg.screenshot({ path: path.join(OUT, `chain-${w}-${scheme}.png`) });
    await pg.click('#pClose');
    // 원리·맞히기 탭
    await pg.click('nav.tabs button[data-tab="why"]'); await pg.waitForTimeout(400);
    const fun = await pg.evaluate(() => document.querySelector('#funnel').textContent);
    ok(/432,741,480/.test(fun) && /3,524,578/.test(fun), `${w}px 원리 숫자`);
    await pg.screenshot({ path: path.join(OUT, `why-${w}-${scheme}.png`), fullPage: true });
    await pg.click('nav.tabs button[data-tab="quiz"]'); await pg.waitForTimeout(400);
    const ch = await pg.evaluate(() => document.querySelectorAll('#qChoices .choice svg').length);
    ok(ch === 4, `${w}px 맞히기 보기 4개`);
    await pg.click('#qChoices .choice');
    ok(await pg.evaluate(() => document.documentElement.scrollWidth - innerWidth) <= 0, `${w}px 맞히기 가로 넘침 없음`);
    await pg.screenshot({ path: path.join(OUT, `quiz-${w}-${scheme}.png`), fullPage: true });
    ok(errs.length === 0, `${w}px 오류 없음 ${errs.join(' | ')}`);
    await pg.close();
  }
  await br.close(); srv.close();
  console.log(fail ? `실패 ${fail}` : '모두 통과');
  process.exit(fail ? 1 : 0);
});
