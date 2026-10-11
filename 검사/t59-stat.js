// v4.0.6 전체 사용 횟수 집계(GoatCounter): 무엇을 보내는지·안 보내는지
// ① 검사 서버(localhost)에서는 꺼짐(statOn(true) false·요청 0) ② 검사 모드: 기기마다 하루 한 번 열기(새로고침해도 1번, 다음 날 앞으로 오면 다시 1번), p·t·rnd 만
// ③ 가상 연주는 안 셈 ④ 녹음 1번 = 녹음·악기·단계 이벤트, 점수·소리·기록 번호는 주소에 없음 ⑤ 음계·타악기·옛 7단계·오늘의 악보 이름 매기기 ⑥ 안내 문구
// 사용: FAKE_WAV=<영문 경로 fake.wav(seed777 선율)> node cdp.js t59-stat.js
const SET = { gen: 3, rv: 2, mode: 'melody', meter: '4/4', level: 2, bars: 4, key: 'Bb', inst: 'clarinet', bpm: 96, pickup: 'off', artic: 'auto', seed: 777, edits: {} };
const HOST = 'https://sood-rhythm.goatcounter.com/count?';
module.exports = async (c) => {
  const out = {}, bad = [];
  const ok = (name, cond, info) => { out[name] = cond ? 'ok' : ('FAIL ' + JSON.stringify(info)); if (!cond) bad.push(name); };
  const BASE = process.env.URL0 || 'http://127.0.0.1:8765/';
  const hits = () => c.ev(`JSON.parse(sessionStorage.getItem('__gc') || '[]')`);
  const clear = () => c.ev(`sessionStorage.setItem('__gc', '[]')`);
  const parse = u => { const q = new URL(u).searchParams; return { p: q.get('p'), t: q.get('t'), e: q.get('e'), keys: [...q.keys()].join(',') }; };
  await c.size(390, 844);

  // ① 검사 서버: 꺼짐
  await c.go(BASE);
  await c.ev(`(async()=>{ localStorage.clear(); sessionStorage.clear(); indexedDB.deleteDatabase('rhythm-practice'); })()`);
  await c.go(BASE); await c.sleep(1500);
  const h0 = await c.ev(`performance.getEntriesByType('resource').filter(e => /goatcounter/.test(e.name)).length`);
  const on0 = await c.ev(`RPX.statOn(true)`);
  ok('noStatOnLocalhost', h0 === 0 && on0 === false, { h0, on0 });

  // ② 검사 모드: GoatCounter 로 가는 요청(sendBeacon·Image)은 가로채 기록만 하고 실제로는 보내지 않는다
  await c.send('Page.addScriptToEvaluateOnNewDocument', { source: `window.rpStatTest = true;
    (function(){
      function rec(v){ try { var a = JSON.parse(sessionStorage.getItem('__gc') || '[]'); a.push(String(v)); sessionStorage.setItem('__gc', JSON.stringify(a)); } catch (e) { } }
      var sb = navigator.sendBeacon ? navigator.sendBeacon.bind(navigator) : null;
      navigator.sendBeacon = function (u, d) { if (/goatcounter/.test(u)) { rec(u); return true; } return sb ? sb(u, d) : false; };
      var d = Object.getOwnPropertyDescriptor(HTMLImageElement.prototype, 'src');
      Object.defineProperty(HTMLImageElement.prototype, 'src', { set: function (v) { if (/goatcounter/.test(v)) { rec('IMG ' + v); return; } d.set.call(this, v); }, get: function () { return d.get.call(this); } });
    })();` });
  await c.go(BASE); await c.sleep(1500);
  await c.go(BASE); await c.sleep(1500);
  await c.ev(`document.dispatchEvent(new Event('visibilitychange'))`); await c.sleep(300);
  const opens = await hits();
  const q0 = opens[0] && !opens[0].startsWith('IMG') ? parse(opens[0]) : null;
  ok('openOncePerDay', opens.length === 1, opens);
  ok('openParams', q0 && q0.p === '/' && /앱 열기/.test(q0.t) && q0.keys === 'p,t,rnd', opens[0]);
  ok('openHost', opens[0] && opens[0].startsWith(HOST), opens[0]);
  // 다음 날 뒤로 보내 둔 앱을 다시 앞으로 → 1번 더
  await clear();
  await c.ev(`localStorage.setItem('rp.statDay', JSON.stringify('2000-1-1')); document.dispatchEvent(new Event('visibilitychange'))`); await c.sleep(300);
  const nextDay = await hits();
  ok('openNextDay', nextDay.length === 1 && parse(nextDay[0]).p === '/', nextDay);

  // ③ 가상 연주는 세지 않음
  await clear();
  await c.ev(`(()=>{ Object.assign(RP.set, ${JSON.stringify(SET)}); RP.rebuild(); })()`); await c.sleep(600);
  await c.ev(`document.querySelector('#selfPerfect').click()`);
  for (let i = 0; i < 30; i++) { await c.sleep(500); if (await c.ev(`!document.querySelector('#resBox').classList.contains('hide')`)) break; }
  await c.sleep(1500);
  const selfHits = await hits();
  ok('selfNotCounted', selfHits.length === 0, selfHits);

  // ④ 진짜 녹음(가짜 마이크) 1번 → 녹음·악기·단계 이벤트, 점수·소리 없음
  if (process.env.FAKE_WAV) {
    await clear();
    await c.ev(`(()=>{ document.querySelector('nav.tabs button[data-tab=practice]').click(); Object.assign(RP.set, ${JSON.stringify(SET)}); RP.rebuild(); document.querySelector('#countIn').value='1'; })()`);
    await c.sleep(600);
    await c.ev(`document.querySelector('#recBtn').click()`);
    let st = '';
    for (let i = 0; i < 60; i++) { await c.sleep(1000); st = await c.ev(`document.querySelector('#recStatus').textContent`); if (/점 —|오류|못|않|멈췄/.test(st)) break; }
    await c.sleep(2000);
    const rh = await hits();
    const ps = rh.map(parse).filter(x => x.p !== '녹음/오늘의 악보');
    out.recStatus = st; out.recHits = ps;
    ok('recScored', /점 —/.test(st), st);
    ok('recEvents', ps.length === 3 && ps[0].p === '녹음/선율' && ps[1].p === '악기/B♭ 클라리넷' && ps[2].p === '단계/2' && ps.every(x => x.e === 'true'), ps);
    ok('recNoScore', rh.every(u => u.startsWith(HOST) && parse(u).keys === 'p,t,e,rnd') && !rh.some(u => /\d+점|total|score|wav|blob/i.test(decodeURIComponent(u))), rh);
  } else out.rec = 'FAKE_WAV 없음 — 녹음 시험 건너뜀';

  // ⑤ 이름 매기기: 음계·드럼 세트·옛 7단계(단계 안 셈)·오늘의 악보
  await clear();
  await c.ev(`(()=>{ const b = ${JSON.stringify(SET)};
    RPX.stat('rec', { set: Object.assign({}, b, { prac: 'scale', inst: 'alto_sax', level: 4 }) }, null);
    setTimeout(() => RPX.stat('rec', { set: Object.assign({}, b, { mode: 'rhythm', drum: 'kit', level: 3 }) }, { daily: true }), 1500);
    setTimeout(() => RPX.stat('rec', { set: Object.assign({}, b, { gen: 2, mode: 'rhythm', drum: '', level: 7 }) }, null), 3000);
  })()`);
  await c.sleep(4500);
  const nm = (await hits()).map(u => parse(u).p);
  out.names = nm;
  const ALT = nm.find(p => /^악기\/.*알토/.test(p));
  ok('names', nm[0] === '녹음/음계' && !!ALT && nm[2] === '단계/4'
    && nm[3] === '녹음/리듬' && nm[4] === '악기/드럼 세트' && nm[5] === '단계/3' && nm[6] === '녹음/오늘의 악보'
    && nm[7] === '녹음/리듬' && /^악기\//.test(nm[8]) && nm.length === 9, nm);

  // ⑥ 안내 문구·버전
  const about = await c.ev(`document.querySelector('#tab-settings').textContent`);
  ok('aboutText', /이름 없이 전체 숫자로 셉니다/.test(about) && /오늘의 악보/.test(about) && /v4\.0\.6/.test(about), about.slice(0, 80));

  const errs = c.logs.filter(l => /^EXC|error/i.test(l));
  ok('noErrors', !errs.length, errs);
  out.bad = bad;
  console.log(JSON.stringify(out, null, 1));
  if (bad.length) { console.log('SCRIPT ERR t59 ' + bad.join(',')); }
};
