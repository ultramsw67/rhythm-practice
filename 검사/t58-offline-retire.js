// 2026-10-08 "오프라인 앱은 내리고": 예전 오프라인 앱(v4.0.4 배포본)을 설치해 둔 기기가 운영 종료판(offline/index.html·sw.js)을 받으면
// ① 다시 열 때 운영 종료 안내가 나오고 ② 저장본 관리자(서비스워커)·저장해 둔 앱 파일(rp-offline- 캐시)이 지워지고
// ③ 녹음(IndexedDB)은 그대로 ④ 「녹음 백업 받기」가 앱의 백업 형식({app:'rhythm-practice', v:1, takes:[…audio64]})으로 내려받아지는지 본다.
// 크로뮴(안드로이드·PC)·웹킷(아이폰) — 시험 브라우저가 서비스워커를 못 쓰면 그 브라우저는 건너뜀.
// 실행: PW=<playwright 경로> node t58-offline-retire.js   (자기 서버를 8766 에 띄움)   통과: bad [] 0
const pw = require(process.env.PW || 'playwright');
const fs = require('fs'), path = require('path'), http = require('http'), os = require('os');
const OLD = process.env.OLD_OFFLINE || 'C:/Users/ultramsw67/Desktop/수드 리듬 연습/보관/오프라인 앱 (웹판, v4.0.4 배포본)/offline';
const NEW = path.join(__dirname, '..', 'offline');
const ROOT = fs.mkdtempSync(path.join(os.tmpdir(), 't58-'));
const cp = (a, b) => { fs.mkdirSync(b, { recursive: true }); for (const f of fs.readdirSync(a)) { const s = path.join(a, f), d = path.join(b, f); fs.statSync(s).isDirectory() ? cp(s, d) : fs.copyFileSync(s, d); } };
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.json': 'application/json', '.webmanifest': 'application/manifest+json', '.png': 'image/png', '.jpg': 'image/jpeg', '.txt': 'text/plain; charset=utf-8' };
const srv = http.createServer((q, r) => {
  let p = decodeURIComponent(q.url.split('?')[0]); if (p.endsWith('/')) p += 'index.html';
  fs.readFile(path.join(ROOT, p), (e, d) => { if (e) { r.writeHead(404); r.end('nf'); return; } r.writeHead(200, { 'Content-Type': TYPES[path.extname(p)] || 'application/octet-stream', 'Cache-Control': 'no-store' }); r.end(d); });
}).listen(8766, '127.0.0.1');
(async () => {
  const bad = [];
  for (const [name, bt] of [['android', pw.chromium], ['iphone', pw.webkit]]) {
    fs.rmSync(path.join(ROOT, 'offline'), { recursive: true, force: true }); cp(OLD, path.join(ROOT, 'offline'));
    const b = await bt.launch(); const ctx = await b.newContext({ acceptDownloads: true, viewport: { width: 390, height: 800 } });
    const page = await ctx.newPage(); const errs = [];
    page.on('pageerror', e => errs.push(String(e).slice(0, 160)));
    const URL0 = 'http://127.0.0.1:8766/offline/';
    await page.goto(URL0); await page.waitForTimeout(1500);
    const sw0 = await page.evaluate(async () => { if (!('serviceWorker' in navigator)) return null; try { await Promise.race([navigator.serviceWorker.ready, new Promise((_, j) => setTimeout(() => j('t'), 15000))]); } catch (e) { return null; } return (await caches.keys()).filter(k => k.startsWith('rp-offline-')).length; }).catch(() => null);
    if (!sw0) { console.log(name, 'service worker not available in this test browser — skipped'); await b.close(); continue; }
    // 오프라인 앱에 녹음 하나가 있다고 치고 넣어 둠
    const put = await page.evaluate(() => new Promise((res, rej) => { const rq = indexedDB.open('rhythm-practice', 1); rq.onupgradeneeded = () => rq.result.createObjectStore('takes', { keyPath: 'id' }); rq.onsuccess = () => { const db = rq.result; const t = db.transaction('takes', 'readwrite'); t.objectStore('takes').put({ id: 't58', name: '시험 녹음', at: Date.now(), audio: new Blob([new Uint8Array([82, 73, 70, 70, 1, 2, 3])], { type: 'audio/wav' }) }); t.oncomplete = () => { db.close(); res(true); }; t.onerror = () => rej(String(t.error)); }; rq.onerror = () => rej(String(rq.error)); })).catch(e => 'ERR ' + e);
    if (put !== true) { console.log(name, 'IndexedDB not usable in this test browser (' + put + ') — skipped'); await b.close(); continue; }
    await page.reload(); await page.waitForTimeout(2000);
    const before = await page.evaluate(() => /버전 v4\.0\.4/.test(document.body.textContent));
    if (!before) bad.push({ name, err: 'old offline app not served from install' });
    // 운영 종료판을 올림 → 다시 열기 (휴대폰에서 인터넷이 될 때 다시 여는 것과 같음)
    fs.rmSync(path.join(ROOT, 'offline'), { recursive: true, force: true }); cp(NEW, path.join(ROOT, 'offline'));
    let shown = false;
    for (let k = 0; k < 12 && !shown; k++) {
      await page.goto(URL0 + '?r=' + k).catch(() => { }); await page.waitForTimeout(2500);
      shown = await page.evaluate(() => /운영을 마쳤습니다/.test(document.body.textContent)).catch(() => false);
    }
    if (!shown) bad.push({ name, err: 'farewell page not shown after update' });
    await page.waitForTimeout(2500);
    const st = await page.evaluate(async () => ({ regs: (await navigator.serviceWorker.getRegistrations()).length, caches: (await caches.keys()).filter(k => k.startsWith('rp-offline-')).length, ctrl: !!navigator.serviceWorker.controller }));
    if (st.regs || st.caches) bad.push({ name, err: 'service worker / cache left', st });
    // 다시 열어도 안내 화면 (예전 앱이 다시 안 나옴)
    await page.goto(URL0); await page.waitForTimeout(1500);
    if (!(await page.evaluate(() => /운영을 마쳤습니다/.test(document.body.textContent)))) bad.push({ name, err: 'old app came back' });
    // 백업
    const [dl] = await Promise.all([page.waitForEvent('download', { timeout: 15000 }).catch(() => null), page.click('#bak')]);
    if (!dl) bad.push({ name, err: 'no backup download', msg: await page.textContent('#msg') });
    else {
      const j = JSON.parse(fs.readFileSync(await dl.path(), 'utf8'));
      const t = (j.takes || [])[0] || {};
      if (j.app !== 'rhythm-practice' || j.v !== 1 || j.takes.length !== 1 || t.id !== 't58' || t.audio64 !== Buffer.from([82, 73, 70, 70, 1, 2, 3]).toString('base64') || 'audio' in t) bad.push({ name, err: 'backup format', j: JSON.stringify(j).slice(0, 200) });
    }
    console.log(name, 'old', before, 'farewell', shown, JSON.stringify(st), 'msg', await page.textContent('#msg'));
    if (errs.length) bad.push({ name, errs });
    await b.close();
  }
  srv.close(); fs.rmSync(ROOT, { recursive: true, force: true });
  console.log('bad', JSON.stringify(bad), bad.length);
})();
