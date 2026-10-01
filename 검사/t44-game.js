// v3.8 연습 기록 게임: 연속일·방패·오늘 목표·최고 기록·배지 계산, 가상 연주 제외, 보관함에서 연 녹음엔 보상 카드 없음,
// 기존 녹음으로 처음 한 번 기록 채우기, 오늘의 악보, 끄기, 화면(320·390·어두운 화면) 넘침
// 사용: FAKE_WAV=<영문 경로 fake.wav(seed777 선율)> node cdp.js t44-game.js
const SET = { gen: 3, rv: 2, mode: 'melody', meter: '4/4', level: 2, bars: 4, key: 'Bb', inst: 'clarinet', bpm: 96, pickup: 'off', artic: 'auto', seed: 777, edits: {} };
module.exports = async (c) => {
  const out = {}, bad = [];
  const ok = (name, cond, info) => { out[name] = cond ? 'ok' : ('FAIL ' + JSON.stringify(info)); if (!cond) bad.push(name); };
  await c.size(390, 844);
  await c.go(process.env.URL0 || 'http://127.0.0.1:8765/');
  await c.ev(`(async()=>{ localStorage.clear(); const l = await indexedDB.databases?.(); indexedDB.deleteDatabase('rhythm-practice'); })()`);
  await c.go(process.env.URL0 || 'http://127.0.0.1:8765/');
  await c.sleep(800);

  // 1) 계산만 따로 (가짜 녹음 기록)
  const calc = await c.ev(`(()=>{
    const G = window.__game, g = G.newGame(), D = G.dayNum(Date.now());
    const at = (d, h) => { const x = new Date(); x.setHours(h||20,0,0,0); return x.getTime() + (d - D) * 864e5; };
    const tk = (d, total, s) => ({ created: at(d), result: { total }, set: Object.assign({ gen:2, mode:'rhythm', meter:'4/4', level:2, bars:4, key:'C', inst:'clarinet', bpm:88, pickup:'auto', artic:'auto', seed: 5, edits:{} }, s||{}) });
    // 목요일을 기준으로 잡아 방패 주를 예측 가능하게
    let base = D - 30; while (((base + 3) % 7 + 7) % 7 !== 3) base--;       // 목요일
    const log = [];
    const add = (d, total, s) => { const r = G.gameAdd(g, tk(d, total, s)); log.push({ d: d - base, streak: g.streak, cnt: g.cnt, shield: !!r.shield, newBest: !!r.newBest, xp: r.xp, badges: r.badges.join(',') }); return r; };
    add(base, 40); add(base, 80); const r3 = add(base, 70);           // 같은 날 3번: 목표·새 기록(40→80)·역전(40→80 은 +40)
    add(base + 1, 90, { seed: 6 });                                    // 금: 2일
    const rs = add(base + 3, 100, { seed: 7 });                        // 일: 토요일 쉼 → 방패, 3일
    const rs2 = add(base + 5, 60, { seed: 8 });                        // 화: 월요일 쉼 → 새 주 방패, 4일
    const rs3 = add(base + 7, 60, { seed: 9 });                        // 목: 수요일 쉼 → 이번 주 방패 이미 씀 → 1일
    const rs4 = add(base + 7, 60, { seed: 9 });
    return { log, goal: !!r3.goal, shield1: rs.shield, st1: rs.streak, shield2: rs2.shield, st2: rs2.streak, st3: rs3.streak, same: rs4.prevBest, badges: Object.keys(g.badges).sort().join(','), n: g.n, xp: g.xp,
      cur0: G.curStreak({ last: D, streak: 5 }, D), cur1: G.curStreak({ last: D - 1, streak: 5 }, D), cur3: G.curStreak({ last: D - 3, streak: 5 }, D),
      t0: G.titleOf(0).name, t100: G.titleOf(100).name, t99: G.titleOf(99).next, tMax: G.titleOf(99999).next };
  })()`);
  out.calcLog = calc.log;
  ok('goal', calc.goal, calc);
  ok('shieldSat', calc.shield1 && calc.st1 === 3, calc);
  ok('shieldNewWeek', calc.shield2 && calc.st2 === 4, calc);
  ok('shieldUsedReset', calc.st3 === 1, calc);
  ok('sameScoreKey', calc.same === 60, calc.same);
  ok('badges', calc.badges === 'first,goal,p100,s3,up30', calc.badges);
  ok('curStreak', calc.cur0 === 5 && calc.cur1 === 5 && calc.cur3 === 0, calc);
  ok('titles', calc.t0 === '새내기' && calc.t100 === '보면대 지킴이' && calc.t99 === 100 && calc.tMax === null, calc);

  // 2) 빈 상태 화면
  const empty = await c.ev(`({ vis: !document.querySelector('#gameCard').classList.contains('hide'), streak: document.querySelector('#gStreak').textContent, today: document.querySelector('#gToday').textContent, hint: document.querySelector('#gHint').textContent, badge: document.querySelector('#badgeBtn').textContent, fireOff: !!document.querySelector('#gStreak .g-ic.off'), medalOff: !!document.querySelector('#badgeBtn .g-ic.off'), v: RP && JSON.parse(localStorage.getItem('rp.game')||'{}').v })`);
  ok('emptyCard', empty.vis && empty.streak === '🔥 0일' && empty.today === '○○○' && /0\/10/.test(empty.badge) && empty.v === 1, empty);
  ok('emptyIconsOff', empty.fireOff && empty.medalOff, empty);   // v3.8.2: 처음(0일·배지 0개)엔 불 꺼진 아이콘

  // 3) 가상 연주는 세지 않는다
  await c.ev(`document.querySelector('#selfPerfect').click()`);
  for (let i = 0; i < 30; i++) { await c.sleep(500); if (await c.ev(`!document.querySelector('#resBox').classList.contains('hide')`)) break; }
  const self = await c.ev(`({ n: window.__game.get().n, rw: document.querySelector('#resReward').classList.contains('hide'), total: document.querySelector('#resTotal').textContent })`);
  ok('selfExcluded', self.n === 0 && self.rw, self);

  // 4) 진짜 녹음(가짜 마이크) 두 번 → 보상 카드
  let rec = [];
  if (process.env.FAKE_WAV) {
    for (let k = 0; k < 2; k++) {
      await c.ev(`(()=>{ document.querySelector('nav.tabs button[data-tab=practice]').click(); Object.assign(RP.set, ${JSON.stringify(SET)}); RP.rebuild(); document.querySelector('#countIn').value='1'; })()`);
      await c.sleep(600);
      await c.ev(`document.querySelector('#recBtn').click()`);
      let st = '';
      for (let i = 0; i < 60; i++) { await c.sleep(1000); st = await c.ev(`document.querySelector('#recStatus').textContent`); if (/점 —|오류|못|않|멈췄/.test(st)) break; }
      await c.sleep(700);
      rec.push(await c.ev(`({ st: document.querySelector('#recStatus').textContent, rw: !document.querySelector('#resReward').classList.contains('hide'), txt: document.querySelector('#resReward').innerText, n: window.__game.get().n, conf: !!document.querySelector('#resReward .confetti') })`));
      if (k === 0) await c.shotEl('game-reward.png', '#resReward');
      await c.sleep(2700);
    }
    out.rec = rec;
    ok('rec1Reward', rec[0].rw && /첫 기록/.test(rec[0].txt) && /연속 연습 1일째/.test(rec[0].txt) && /1\/3/.test(rec[0].txt) && rec[0].n === 1 && rec[0].conf, rec[0]);
    ok('rec2Reward', rec[1].rw && /최고 기록|새 기록/.test(rec[1].txt) && /2\/3/.test(rec[1].txt) && rec[1].n === 2 && !/연속 연습/.test(rec[1].txt), rec[1]);
    // 테마를 바꿔 결과를 다시 그려도 카드는 남고 축하는 다시 안 나옴
    await c.ev(`document.querySelector('nav.tabs button[data-tab=result]').click()`); await c.sleep(400);
    const rr = await c.ev(`({ rw: !document.querySelector('#resReward').classList.contains('hide'), conf: !!document.querySelector('#resReward .confetti') })`);
    ok('rerenderNoConfetti', rr.rw && !rr.conf, rr);
    // 보관함에서 열면 카드 없음
    await c.ev(`document.querySelector('nav.tabs button[data-tab=library]').click()`); await c.sleep(1200);
    await c.ev(`(()=>{ const b=[...document.querySelectorAll('#libList button')].find(x=>/결과/.test(x.textContent)); b && b.click(); })()`); await c.sleep(1200);
    const lib = await c.ev(`({ tab: !document.querySelector('#tab-result').classList.contains('hide'), rw: document.querySelector('#resReward').classList.contains('hide') })`);
    ok('libraryNoReward', lib.tab && lib.rw, lib);
    // 연습 화면 카드
    await c.ev(`document.querySelector('nav.tabs button[data-tab=practice]').click()`); await c.sleep(500);
    const card = await c.ev(`({ streak: document.querySelector('#gStreak').textContent, today: document.querySelector('#gToday').textContent, hint: document.querySelector('#gHint').textContent, xp: document.querySelector('#gXp').textContent, fireOn: !!document.querySelector('#gStreak .g-ic:not(.off)'), medalOn: !!document.querySelector('#badgeBtn .g-ic:not(.off)') })`);
    ok('iconsOnAfterRec', card.fireOn && card.medalOn, card);
    ok('cardAfterRec', card.streak === '🔥 1일' && card.today === '●●○' && /1번 더/.test(card.hint), card);
    // 5) 기록을 지우고 다시 열면 보관함 녹음으로 채움 (가상 연주 저장분은 빼고)
    await c.ev(`localStorage.removeItem('rp.game')`);
    await c.go(process.env.URL0 || 'http://127.0.0.1:8765/'); await c.sleep(1500);
    const bf = await c.ev(`({ n: window.__game.get().n, v: window.__game.get().v, streak: document.querySelector('#gStreak').textContent })`);
    ok('backfill', bf.n === 2 && bf.v === 1 && bf.streak === '🔥 1일', bf);
  } else out.rec = 'FAKE_WAV 없음 — 녹음 시험 건너뜀';

  // 6) 오늘의 악보
  await c.ev(`document.querySelector('nav.tabs button[data-tab=practice]').click()`);
  await c.ev(`document.querySelector('#dailyBtn').click()`); await c.sleep(600);
  const daily = await c.ev(`({ bpm: RP.set.bpm, meter: RP.set.meter, bars: RP.set.bars, key: RP.set.key, seed: RP.set.seed, want: window.__game.daySeed(window.__game.dayNum(Date.now())), hint: document.querySelector('#dailyHint').textContent, info: document.querySelector('#scoreInfo') ? document.querySelector('#scoreInfo').textContent : '' })`);
  ok('daily', daily.seed === daily.want && daily.bpm === 88 && daily.meter === '4/4' && daily.bars === 4 && daily.key === 'Bb' && /지금 연습하는 악보가 오늘의 악보/.test(daily.hint), daily);
  await c.ev(`document.querySelector('#newBtn').click()`); await c.sleep(400);
  const nd = await c.ev(`document.querySelector('#dailyHint').textContent`);
  ok('dailyOff', !/지금 연습하는/.test(nd), nd);

  // 7) 배지 펼치기
  await c.ev(`document.querySelector('#badgeBtn').click()`);
  const bl = await c.ev(`({ open: !document.querySelector('#badgeList').classList.contains('hide'), n: document.querySelectorAll('#badgeList .badge').length, on: document.querySelectorAll('#badgeList .badge:not(.off)').length, aria: document.querySelector('#badgeBtn').getAttribute('aria-expanded') })`);
  ok('badgeList', bl.open && bl.n === 10 && bl.aria === 'true', bl);

  // 8) 화면: 폭 320·390 × 글자 아주 크게 × 어두운 화면 — 가로 넘침·작은 버튼
  for (const [w, font, theme] of [[320, 3, 'light'], [390, 2, 'dark'], [320, 2, 'dark']]) {
    await c.size(w, 800);
    const r = await c.ev(`(()=>{ document.querySelector('#fontSeg button[data-v="${font}"]').click(); document.documentElement.dataset.theme='${theme}'; document.querySelector('nav.tabs button[data-tab=practice]').click();
      const over = document.documentElement.scrollWidth - innerWidth;
      const small = [...document.querySelectorAll('#gameCard button')].filter(b => b.getBoundingClientRect().height < 44).length;
      const clip = [...document.querySelectorAll('.g-item b')].filter(b => b.scrollWidth > b.clientWidth + 1).map(b=>b.textContent);
      return { over, small, clip }; })()`);
    await c.sleep(300);
    await c.shotEl(`game-card-${w}-${theme}.png`, '#gameCard');
    ok(`screen${w}${theme}f${font}`, r.over <= 0 && r.small === 0 && r.clip.length === 0, r);
  }

  // 9) 끄기
  await c.ev(`(()=>{ document.querySelector('#gameOn').click(); })()`);
  const off = await c.ev(`({ hide: document.querySelector('#gameCard').classList.contains('hide'), saved: localStorage.getItem('rp.gameOn') })`);
  ok('toggleOff', off.hide && off.saved === 'false', off);
  await c.ev(`document.querySelector('#gameOn').click()`);

  console.log(JSON.stringify(out, null, 1));
  console.log('bad', JSON.stringify(bad));
};
