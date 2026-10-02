// v3.9.1 점검에서 고친 것 확인 (2026-10-02 공개 전 최종 점검)
// ① 안드로이드 앱 안 브라우저 → 크롬 넘김 때 받은 악보가 ?rp= 로 따라가는지 ② 라인 넘김 주소 ? 가 # 앞 ③ ?rp= 로 열기
// ④ 망가진 저장값(설정·지연 보정·연습 기록)에도 화면이 뜨는지 ⑤ 채점 시험 두 번 눌러도 한 번만 ⑥ 망가진 백업 기록은 걸러지는지
const AND = 'Mozilla/5.0 (Linux; Android 14; SM-S918N Build/UP1A.231005.007; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/128.0.6613.127 Mobile Safari/537.36';
const IOS = 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148';
const CHROME = 'Mozilla/5.0 (Linux; Android 14; SM-S918N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Mobile Safari/537.36';
module.exports = async (c) => {
  const base = process.env.URL0 || 'http://127.0.0.1:8765/';
  const bad = [], out = {};
  await c.size(390, 844, true);
  await c.send('Page.addScriptToEvaluateOnNewDocument', { source: 'window.__rpNav = []; try{ sessionStorage.clear() }catch(e){}' });
  await c.send('Emulation.setUserAgentOverride', { userAgent: CHROME, platform: 'Linux armv8l' });
  await c.go(base + '?t=1');
  await new Promise(r => setTimeout(r, 1500));
  const code = await c.ev(`btoa(unescape(encodeURIComponent(Core.encodeSet(Object.assign({}, RP.set, { gen: 3, rv: 2, meter: '3/4', level: 3, seed: 4242, mode: 'rhythm', drum: '' })))))`);
  // ③ ?rp= 로 열기
  await c.go(base + '?rp=' + encodeURIComponent(code));
  await new Promise(r => setTimeout(r, 1200));
  out.rpQuery = await c.ev(`({ seed: RP.set.seed, meter: RP.set.meter, level: RP.set.level, search: location.search, hash: location.hash })`);
  if (out.rpQuery.seed !== 4242 || out.rpQuery.meter !== '3/4' || out.rpQuery.search !== '') bad.push('rpQuery');
  // # 로 열기 (예전 방식) 그대로
  await c.go(base + '?t=2'); await c.ev(`localStorage.removeItem('rp.set')`);
  await c.go(base + '#' + code);
  await new Promise(r => setTimeout(r, 1200));
  out.hash = await c.ev(`({ seed: RP.set.seed, meter: RP.set.meter, hash: location.hash })`);
  if (out.hash.seed !== 4242 || out.hash.hash !== '') bad.push('hash');
  // ① 안드로이드 밴드 → 크롬
  await c.send('Emulation.setUserAgentOverride', { userAgent: AND + ' BAND/15.2.0', platform: 'Linux armv8l' });
  await c.go(base + '?t=a#' + code);
  await new Promise(r => setTimeout(r, 400));
  out.andNav = await c.ev(`window.__rpNav.slice()`);
  const intent = (out.andNav || [])[0] || '';
  if (!/^intent:\/\/127\.0\.0\.1:8765\/\?t=a&rp=/.test(intent) || !/S\.browser_fallback_url=/.test(intent)) bad.push('andIntent');
  const m = intent.match(/^intent:\/\/([^#]*)#Intent/);
  // 크롬이 받는 주소로 다시 열어 같은 악보인지
  await c.send('Emulation.setUserAgentOverride', { userAgent: CHROME, platform: 'Linux armv8l' });
  await c.go(base + '?t=3'); await c.ev(`localStorage.removeItem('rp.set')`);
  if (m) { await c.go('http://' + m[1]); await new Promise(r => setTimeout(r, 1200)); out.andOpen = await c.ev(`({ seed: RP.set.seed, meter: RP.set.meter, search: location.search })`); }
  if (!out.andOpen || out.andOpen.seed !== 4242 || out.andOpen.meter !== '3/4') bad.push('andOpen');
  // ② 라인 (아이폰)
  await c.send('Emulation.setUserAgentOverride', { userAgent: IOS + ' Safari Line/14.10.0', platform: 'iPhone' });
  await c.go(base + '#' + code);
  await new Promise(r => setTimeout(r, 400));
  out.lineNav = await c.ev(`window.__rpNav.slice()`);
  if ((out.lineNav || [])[0] !== base + '?openExternalBrowser=1#' + code) bad.push('line');
  // ④ 망가진 저장값
  await c.send('Emulation.setUserAgentOverride', { userAgent: CHROME, platform: 'Linux armv8l' });
  const corrupt = [
    ['meterKey', { set: '{"meter":"xx","key":"constructor","bpm":"abc","bars":3,"inst":"toString","edits":null}', latency: '"abc"', game: '{"v":1,"best":null,"badges":null,"xp":"x"}' }],
    ['array', { set: '[1,2]', latency: '{"ms":null}', game: '"oops"' }],
    ['nullSet', { set: 'null', latency: 'null', game: 'null' }],
  ];
  out.corrupt = {};
  for (const [name, v] of corrupt) {
    await c.go(base + '?t=c' + name);
    await c.ev(`(()=>{ localStorage.setItem('rp.set', ${JSON.stringify(v.set)}); localStorage.setItem('rp.latency', ${JSON.stringify(v.latency)}); localStorage.setItem('rp.game', ${JSON.stringify(v.game)}); localStorage.setItem('rp.mig39','true'); })()`);
    const before = c.logs.length;
    await c.go(base + '?t=d' + name);
    await new Promise(r => setTimeout(r, 1500));
    const r = await c.ev(`({ svg: !!document.querySelector('#score svg'), meter: RP.set.meter, bpm: RP.set.bpm, bars: RP.set.bars, game: !!document.querySelector('#gameCard') && document.querySelector('#gameCard').textContent.length > 10, nan: /NaN|undefined/.test(document.body.innerText) })`);
    const exc = c.logs.slice(before).filter(l => /^EXC|^error/.test(l));
    out.corrupt[name] = Object.assign(r, { exc });
    if (!r.svg || r.nan || exc.length || r.meter !== '4/4' && name === 'meterKey') bad.push('corrupt-' + name);
  }
  // ⑤ 채점 시험 두 번
  await c.go(base + '?t=s'); await c.ev(`localStorage.clear()`); await c.go(base + '?t=s2');
  await new Promise(r => setTimeout(r, 1200));
  const before = c.logs.length;
  await c.ev(`(()=>{ document.getElementById('selfPerfect').click(); document.getElementById('selfSloppy').click(); document.getElementById('selfPerfect').click(); })()`);
  await new Promise(r => setTimeout(r, 9000));
  out.self = await c.ev(`({ total: document.getElementById('resTotal').textContent, title: document.getElementById('resTitle').textContent })`);
  const exc2 = c.logs.slice(before).filter(l => /^EXC|^error/.test(l));
  if (!/100/.test(out.self.total) || !/정확한/.test(out.self.title) || exc2.length) bad.push('self');
  // ⑥ 망가진 백업 기록 거르기 (bpm 에 글자, notes 없음)
  out.valid = await c.ev(`(async()=>{
    const good = { app: 'rhythm-practice', v: 1, takes: [
      { id: 'x1', name: '<b>a</b>', created: Date.now(), result: { total: 90, raw: 88, notes: [], parts: { rhythm: 1 }, weights: { rhythm: 100 } }, set: { meter: '4/4', bpm: '<img src=x onerror=window.__pwn=1>', bars: 4 } },
      { id: 'x2', name: 'b', created: Date.now(), result: { total: 90 }, set: { meter: '4/4', bpm: 88, bars: 4 } },
      { id: 'x3', name: 'c', created: Date.now(), result: { total: 90, raw: 88, notes: [], parts: { rhythm: 1 }, weights: { rhythm: 100 } }, set: { meter: '4/4', bpm: 88, bars: 1000000 } } ] };
    const f = new File([JSON.stringify(good)], 'b.json'); const inp = document.getElementById('bakIn');
    const dt = new DataTransfer(); dt.items.add(f); inp.files = dt.files; inp.dispatchEvent(new Event('change'));
    await new Promise(r => setTimeout(r, 1500));
    document.querySelector('[data-tab="library"]') && document.querySelector('[data-tab="library"]').click();
    await new Promise(r => setTimeout(r, 800));
    return { pwn: !!window.__pwn, toast: (document.querySelector('#toast') || {}).textContent || '' };
  })()`);
  if (out.valid.pwn || !/0개를 불러왔습니다/.test(out.valid.toast)) bad.push('valid');
  console.log(JSON.stringify(out, null, 1).slice(0, 3000));
  console.log('bad', JSON.stringify(bad));
};
