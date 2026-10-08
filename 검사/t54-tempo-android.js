// v4.0.1 (2026-10-07 "안드로이드 폰에서 빠르기말 고르기가 안 눌림" → 사용자 결정 "빠르기말 삭제, 막대로만 조정"):
// 안드로이드 크롬 흉내(UA·터치) + 실제 손가락 끌기(Input.dispatchTouchEvent)로 빠르기 막대를 움직여
// 빠르기·숫자 칸·빠르기 줄·요약 줄·저장값·악보가 바뀌는지, 막대 터치 높이 44px 이상, 녹음 중 잠금을 본다.
// v4.0.2: 빠르기말 목록 창(#tempoMenu)을 손가락으로 열고 골라 ✓·빠르기가 바뀌는지, 바깥을 누르면 닫히는지도 본다.
// 폭 320·360·393·412 × 글자 크기 3단계 × 밝은/어두운 화면. 통과: bad [] 0, errs []
const UA = 'Mozilla/5.0 (Linux; Android 14; SM-S918N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Mobile Safari/537.36';
module.exports = async (c) => {
  const bad = [];
  await c.send('Emulation.setUserAgentOverride', { userAgent: UA, platform: 'Android' });
  await c.send('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 5 });
  const tp = (type, x, y) => c.send('Input.dispatchTouchEvent', { type, touchPoints: type === 'touchEnd' ? [] : [{ x, y, radiusX: 11, radiusY: 11 }] });
  const tap = async (x, y) => { await tp('touchStart', x, y); await c.sleep(50); await tp('touchEnd'); await c.sleep(150); };
  // 막대 위 비율 f(0~1) 자리로 손가락을 대고 끌어 놓기
  const drag = async (f0, f1) => {
    const r = JSON.parse(await c.ev(`(()=>{const e=document.querySelector('#bpmRange'); e.scrollIntoView({block:'center'}); const b=e.getBoundingClientRect(); return JSON.stringify([b.left,b.width,b.top+b.height/2,b.height])})()`));
    const [L, W, Y] = r, pad = 10, X = f => L + pad + (W - 2 * pad) * f;
    await tp('touchStart', X(f0), Y); await c.sleep(60);
    for (let k = 1; k <= 8; k++) { await tp('touchMove', X(f0 + (f1 - f0) * k / 8), Y); await c.sleep(30); }
    await tp('touchEnd'); await c.sleep(450);                     // 250ms 뒤 악보 새로 만듦
    return r[3];
  };
  const state = () => c.ev(`JSON.stringify({bpm:RP.set.bpm, num:+document.querySelector('#bpmNum').value, range:+document.querySelector('#bpmRange').value,
    beat:document.querySelector('#beatLabel').textContent, sum:document.querySelector('#setSum').textContent, info:document.querySelector('#scoreInfo').textContent,
    saved:JSON.parse(localStorage.getItem('rp.set')||'{}').bpm, fp:JSON.stringify(RP.score.events.map(e=>[e.base,e.dots,e.rest])), scoreBpm:RP.score.set.bpm})`).then(JSON.parse);
  let first = true;
  for (const dark of [false, true]) for (const font of [1, 2, 3]) for (const w of [320, 360, 393, 412]) {
    await c.send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-color-scheme', value: dark ? 'dark' : 'light' }] });
    await c.size(w, 800, true);
    await c.go('http://127.0.0.1:8765/?t54=' + Date.now());
    await c.ev(`localStorage.clear(); localStorage.setItem('rp.startSeen','true'); localStorage.setItem('rp.font','${font}')`);
    await c.go('http://127.0.0.1:8765/?t54b=' + Date.now());
    const tag = `${dark ? 'dark' : 'light'} font${font} ${w}`;
    if (!(await c.ev(`document.querySelector('#setBox').open`))) {
      const p = JSON.parse(await c.ev(`(()=>{const e=document.querySelector('#setBox summary'); e.scrollIntoView({block:'center'}); const b=e.getBoundingClientRect(); return JSON.stringify([b.left+b.width/2,b.top+b.height/2])})()`));
      await tap(p[0], p[1]);
    }
    if (!(await c.ev(`document.querySelector('#setBox').open`))) { bad.push({ tag, err: 'setBox not opened' }); continue; }
    const s0 = await state();
    const h = await drag(0.29, 0.9);                               // 오른쪽으로 끌기 → 빨라짐
    const s1 = await state();
    if (h < 44) bad.push({ tag, err: 'range touch height', h });
    const ok1 = s => s.bpm === s.num && s.bpm === s.range && s.beat.includes('= ' + s.bpm + ',') && s.sum.includes('BPM ' + s.bpm) && s.saved === s.bpm && s.scoreBpm === s.bpm && s.info.includes('BPM') !== undefined;
    if (!(s1.bpm > s0.bpm + 60) || !ok1(s1)) bad.push({ tag, err: 'drag right', s0: s0.bpm, s1 });
    const s2 = await (async () => { await drag(0.9, 0.1); return state(); })();   // 왼쪽으로 → 느려짐
    if (!(s2.bpm < s1.bpm - 80) || !ok1(s2)) bad.push({ tag, err: 'drag left', s1: s1.bpm, s2 });
    // 막대를 한 번 톡 누르면 그 자리 빠르기로
    const r = JSON.parse(await c.ev(`(()=>{const e=document.querySelector('#bpmRange'); const b=e.getBoundingClientRect(); return JSON.stringify([b.left,b.width,b.top+b.height/2])})()`));
    await tap(r[0] + 10 + (r[1] - 20) * 0.5, r[2]); await c.sleep(400);
    const s3 = await state();
    if (Math.abs(s3.bpm - 124) > 6 || !ok1(s3)) bad.push({ tag, err: 'tap middle', s3: s3.bpm });
    // v4.0.2 빠르기말 목록 창: 손가락으로 열고 → 줄 크기·글자·화면 안 → Allegro 누르면 138·✓ 이동·닫힘 → 바깥 누르면 그대로 닫힘
    const ctr = sel => c.ev(`(()=>{const e=document.querySelector('${sel}'); e.scrollIntoView({block:'center'}); const b=e.getBoundingClientRect(); return JSON.stringify([b.left+b.width/2,b.top+b.height/2])})()`).then(JSON.parse);
    const menu = () => c.ev(`JSON.stringify({open:!document.querySelector('#tempoMenu').classList.contains('hide'), txt:document.querySelector('#tempoPickTxt').textContent,
      ck:[...document.querySelectorAll('#tempoMenu button')].filter(b=>b.getAttribute('aria-selected')==='true').map(b=>b.textContent.trim()),
      rows:[...document.querySelectorAll('#tempoMenu button')].map(b=>{const r=b.getBoundingClientRect(); return [Math.round(r.height), parseFloat(getComputedStyle(b).fontSize)]}),
      box:(()=>{const r=document.querySelector('#tempoMenu').getBoundingClientRect(); return [r.left,r.top,r.right,r.bottom,innerWidth,innerHeight]})(), bpm:RP.set.bpm})`).then(JSON.parse);
    { const p = await ctr('#tempoPick'); await tap(p[0], p[1]); await c.sleep(400); }
    const m0 = await menu();
    if (!m0.open) bad.push({ tag, err: 'tempo menu not opened by touch' });
    else {
      if (m0.rows.length !== 13) bad.push({ tag, err: 'tempo menu rows', n: m0.rows.length });
      if (m0.rows.some(([h, fs]) => h < 44 || fs < 16)) bad.push({ tag, err: 'tempo menu row small', rows: m0.rows });
      const [L, T, R, B, W, H] = m0.box; if (L < 0 || T < 0 || R > W || B > H) bad.push({ tag, err: 'tempo menu off screen', box: m0.box });
      if (m0.ck.length !== 1) bad.push({ tag, err: 'tempo menu check count', ck: m0.ck });
      const q = await c.ev(`(()=>{const e=[...document.querySelectorAll('#tempoMenu button')].find(b=>b.dataset.bpm==='138'); e.scrollIntoView({block:'nearest'}); const b=e.getBoundingClientRect(); return JSON.stringify([b.left+b.width/2,b.top+b.height/2, document.elementFromPoint(b.left+b.width/2,b.top+b.height/2)===e||e.contains(document.elementFromPoint(b.left+b.width/2,b.top+b.height/2))])})()`).then(JSON.parse);
      if (!q[2]) bad.push({ tag, err: 'Allegro row covered' });
      await tap(q[0], q[1]); await c.sleep(450);
      const m1 = await menu(), sA = await state();
      if (m1.open || m1.bpm !== 138 || m1.ck.join() !== '✓Allegro (138)' || m1.txt !== 'Allegro (138)' || !ok1(sA)) bad.push({ tag, err: 'tempo menu pick', m1: { open: m1.open, bpm: m1.bpm, ck: m1.ck, txt: m1.txt } });
      { const p = await ctr('#tempoPick'); await tap(p[0], p[1]); await c.sleep(400); }
      const m2 = await menu();
      if (!m2.open || m2.ck.join() !== '✓Allegro (138)') bad.push({ tag, err: 'tempo menu reopen check', ck: m2.ck });
      if (w === 360) await c.shot(`t54-menu-${dark ? 'dark' : 'light'}-f${font}.png`).catch(() => { });
      await tap(8, 12); await c.sleep(250);                      // 바깥(어두운 바탕) 누르기 → 닫힘, 빠르기 그대로
      const m3 = await menu();
      if (m3.open || m3.bpm !== 138) bad.push({ tag, err: 'tempo menu backdrop close', m3: { open: m3.open, bpm: m3.bpm } });
    }
    const ox = await c.ev('document.documentElement.scrollWidth-innerWidth');
    if (ox > 0) bad.push({ tag, overflowX: ox });
    if (first) {
      await c.ev(`document.body.classList.add('recording')`);
      const b0 = await c.ev('RP.set.bpm');
      await drag(0.5, 0.95);
      if ((await c.ev('RP.set.bpm')) !== b0) bad.push({ tag, err: 'changed while recording' });
      await c.ev(`document.body.classList.remove('recording')`);
      first = false;
    }
    if (w === 360) await c.shotEl(`t54-${dark ? 'dark' : 'light'}-f${font}-${w}.png`, '.tempo');
    console.log(tag, 'drag', s0.bpm, '→', s1.bpm, '→', s2.bpm, 'tap', s3.bpm, 'h', h);
  }
  const errs = c.logs.filter(l => /EXC|error/i.test(l));
  console.log('bad', JSON.stringify(bad.slice(0, 8)), bad.length);
  console.log('errs', JSON.stringify(errs.slice(0, 5)));
};
