// v4.0.1 (2026-10-07 "안드로이드 폰에서 빠르기말 고르기가 안 눌림" → 사용자 결정 "빠르기말 삭제, 막대로만 조정"):
// 안드로이드 크롬 흉내(UA·터치) + 실제 손가락 끌기(Input.dispatchTouchEvent)로 빠르기 막대를 움직여
// 빠르기·숫자 칸·빠르기 줄·요약 줄·저장값·악보가 바뀌는지, 막대 터치 높이 44px 이상, 빠르기말 칸이 없는지, 녹음 중 잠금을 본다.
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
    const gone = await c.ev(`!document.querySelector('#tempoName,#tempoSeg') && !/빠르기말 고르기/.test(document.body.innerText)`);
    if (!gone) bad.push({ tag, err: 'tempo-name control still there' });
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
