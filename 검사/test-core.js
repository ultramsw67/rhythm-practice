// 리듬 연습.html 의 core 스크립트만 꺼내 node 에서 시험
const fs = require('fs');
const html = fs.readFileSync(process.argv[2], 'utf8');
const m = /<script id="core">([\s\S]*?)<\/script>/.exec(html);
new Function(m[1])();
const C = globalThis.Core;
let fail = 0, n = 0;
const stats = { byLv: {}, tup: 0, tie: 0, pickup: 0, dd: 0, t32: 0, artic: 0, slur: 0, acc: 0 };
function bad(msg, set) { fail++; if (fail < 15) console.log('FAIL', msg, JSON.stringify(set)); }

// 조각 길이 확인
for (const k of Object.keys(C.CELLDB)) for (const c of C.CELLDB[k]) {
  if (!Number.isInteger(c.span)) bad('cell span ' + c.p, {});
  for (const it of c.items) if (!Number.isInteger(it.dur)) bad('cell dur ' + c.p, {});
}
const meters = Object.keys(C.METERS), insts = Object.keys(C.INSTS);
for (let i = 0; i < 6000; i++) {
  const r = C.mulberry(i + 7);
  const set = {
    mode: r() < 0.5 ? 'rhythm' : 'melody', meter: meters[Math.floor(r() * meters.length)], level: 1 + Math.floor(r() * 7),
    bars: [2, 4, 8, 12, 16][Math.floor(r() * 5)], key: C.KEYS[Math.floor(r() * 30)].name, inst: insts[Math.floor(r() * insts.length)],
    bpm: 40 + Math.floor(r() * 169), pickup: ['auto', 'on', 'off'][Math.floor(r() * 3)], artic: ['auto', 'manual', 'none'][Math.floor(r() * 3)],
    seed: Math.floor(r() * 1e9), edits: {}, gen: 2,
  };
  if (i % 5 === 0) { set.gen = 0; set.level = 1 + (set.level % 3); }       // 옛 3단계 악보(저장된 녹음)도 계속 시험
  const LP = C.levelProfile(set);
  let sc;
  try { sc = C.generate(set); } catch (e) { bad('throw ' + e.stack, set); continue; }
  n++;
  // 결정적인지
  const sc2 = C.generate(set);
  if (JSON.stringify(sc2.events) !== JSON.stringify(sc.events)) bad('not deterministic', set);
  // 마디 길이
  for (const ms of sc.measures) {
    const evs = sc.events.filter(e => e.mi === ms.mi);
    const tot = evs.reduce((s, e) => s + e.dur, 0);
    if (Math.abs(tot - ms.len) > 1e-9) bad(`measure ${ms.no} len ${tot} != ${ms.len}`, set);
    if (!evs.length) bad('empty measure', set);
    // 잇단은 마디 안에서 완결
    const g = {};
    for (const e of evs) if (e.tup) g[e.tup.g] = (g[e.tup.g] || 0) + 1;
    for (const k in g) { const gs = evs.filter(e => e.tup && e.tup.g == k), ev = gs[0], tot = gs.reduce((x, e) => x + e.dur, 0); if (!Object.values(C.BASE).includes(tot / ev.tup.occ) || (g[k] !== ev.tup.n && !gs.some(e => e.base !== ev.base))) bad('tuplet count', set); }   // 셔플 [3 q 8] 처럼 음 개수가 달라도 묶음 길이가 맞으면 된다
  }
  const full = sc.measures.filter(x => !x.pickup && !x.last);
  if (full.some(x => x.len !== sc.measLen)) bad('full len', set);
  if (sc.pickLen) { stats.pickup++; const lastM = sc.measures[sc.measures.length - 1]; if (lastM.len + sc.pickLen !== sc.measLen) bad('pickup complement', set); }
  // 시작 시각 연속
  let t = sc.events[0].start;
  for (const e of sc.events) { if (e.start !== t) bad('gap', set); t += e.dur; if (!Number.isInteger(e.dur) || !Number.isInteger(e.start)) bad('non-int', set); }
  const last = sc.events[sc.events.length - 1];
  if (last.rest) bad('ends with rest', set);
  for (let k = 0; k < sc.events.length; k++) {
    const e = sc.events[k];
    if (e.tie) { stats.tie++; const nx = sc.events[k + 1]; if (!nx || nx.rest || e.rest) bad('tie target', set); if (sc.melody && nx && nx.midi !== e.midi) bad('tie pitch', set); }
    if (e.tup) stats.tup++;
    if (e.dots === 2) stats.dd++;
    if (e.base === '32') stats.t32++;
    if (e.artic.length) stats.artic++;
    if (e.dur * sc.spt < LP.minSec - 1e-9 && !(LP.lv <= 2 && (e.base === 'q' || e.base === 'h' || e.base === 'w'))) bad('too fast note ' + e.base, set);
    // 새 7단계: 그 단계보다 어려운 리듬이 나오지 않는지
    if (!LP.legacy) {
      if (LP.lv <= 6 && (e.base === '32' || e.dots === 2 || (e.tup && e.tup.n >= 4))) bad('lv' + LP.lv + ' has lv7 rhythm', set);
      if (LP.lv <= 5 && e.tup) bad('lv' + LP.lv + ' has tuplet', set);
      if (LP.lv <= 2 && (e.base === '16' || e.dots && e.base === '8')) bad('lv' + LP.lv + ' has 16th', set);
      if (LP.lv === 1 && e.base === '8' && !(sc.M.den === 8)) bad('lv1 has 8th', set);
      if (LP.lv <= 2 && e.tie) bad('lv' + LP.lv + ' has tie', set);
      (stats.byLv[LP.lv] = stats.byLv[LP.lv] || {})[e.base + '.'.repeat(e.dots) + (e.tup ? '/' + e.tup.n : '')] = 1;
    }
    if (sc.melody && !e.rest) {
      const [lo, hi] = sc.inst.r[2];                         // 낼 수 있는 전체 음역(반드시)
      if (e.midi < lo - 1 || e.midi > hi + 1) bad(`range ${e.midi} not in ${lo}-${hi}`, set);
      const [clo, chi] = sc.inst.r[LP.tier];           // 편한 음역(조금 넘는 것은 허용)
      const over = Math.max(0, clo - e.midi, e.midi - chi);
      stats.comfortOver = Math.max(stats.comfortOver || 0, over);
      if (over > 0) stats.overNotes = (stats.overNotes || 0) + 1;
      if (typeof C.vfKey(e.pitch) !== 'string') bad('vfkey', set);
      if (e.pitch.alt) stats.acc++;
    }
  }
  stats.slur += sc.slurs.length;
  if (set.artic !== 'auto' && (sc.slurs.length || sc.events.some(e => e.artic.length))) bad('artic when not auto', set);
  // 시간표
  const tl = C.timeline(sc, 1 + (i % 2));
  if (!(tl.total > 0) || tl.notes.some(x => !(x.dur > 0) || !(x.t >= 0))) bad('timeline', set);
  if (sc.melody && sc.writtenKey == null) bad('written key', set);
}
// 드럼 세트 (v3.3): 두 성부 마디 길이·이어짐, 시간표가 모든 음을 한 번씩, 너무 빠른 음 없음, 결정적
{ let kn = 0, kb = 0; const kbad = (m, s) => { kb++; bad('kit ' + m, s); };
  for (let i = 0; i < 3000; i++) { const r = C.mulberry(50000 + i);
    const set = { gen: 2, drum: 'kit', mode: 'rhythm', meter: meters[i % meters.length], level: 1 + (i % 7), bars: [1, 2, 4, 8, 16][Math.floor(r() * 5)], key: 'C', inst: 'clarinet', bpm: 40 + Math.floor(r() * 169), pickup: ['auto', 'on', 'off'][i % 3], artic: 'auto', seed: Math.floor(r() * 1e9), edits: {} };
    let sc; try { sc = C.generate(set); } catch (e) { kbad('throw ' + e.message, set); continue; } kn++;
    if (!sc.kit || sc.pickLen) kbad('not kit / pickup', set);
    if (JSON.stringify(C.generate(set).events) !== JSON.stringify(sc.events)) kbad('not deterministic', set);
    for (const ms of sc.measures) for (const v of ['u', 'd']) { const ev = sc.events.filter(e => e.mi === ms.mi && e.voice === v); let t = ms.start; for (const e of ev) { if (e.start !== t) kbad('gap', set); t += e.dur; } if (t - ms.start !== ms.len) kbad('len ' + v, set); }
    const tl = C.timeline(sc, 1); const ids = tl.notes.flatMap(x => x.ids).sort((a, b) => a - b), nr = sc.events.filter(e => !e.rest).map(e => e.id);
    if (JSON.stringify(ids) !== JSON.stringify(nr)) kbad('timeline ids', set);
    if (sc.events.some(e => !e.rest && !e.tup && e.dur * sc.spt < Math.max(0.07, C.levelProfile(set).minSec) - 1e-9)) kbad('too fast', set);
    if (sc.events.some(e => e.flam) && set.level < 5) kbad('flam below 5', set);
    if (sc.events.some(e => !e.rest && e.keys.some(k => !C.KIT_KEYS[k]))) kbad('bad key', set);
  }
  console.log('kit runs', kn, 'fail', kb); }
// 같은 설정이면 악기가 달라도 선율(음정 간격)·리듬·기호가 같아야 한다
let inv = 0, invBad = 0;
for (let i = 0; i < 400; i++) {
  const r = C.mulberry(9000 + i);
  const base = { mode: 'melody', meter: meters[Math.floor(r() * meters.length)], level: 1 + Math.floor(r() * 7), gen: i % 4 ? 2 : 0, bars: [2, 4, 8][Math.floor(r() * 3)], key: C.KEYS[Math.floor(r() * 30)].name, bpm: 60 + Math.floor(r() * 100), pickup: 'auto', artic: 'auto', seed: Math.floor(r() * 1e9), edits: {} };
  const sig = inst => {
    const sc = C.generate({ ...base, inst });
    const ns = sc.events.filter(e => !e.rest);
    return JSON.stringify({ rh: sc.events.map(e => [e.start, e.dur, e.rest, e.tie, e.artic]), sl: sc.slurs, iv: ns.slice(1).map((e, k) => (e.midi - ns[k].midi + 120) % 12) });
  };
  const ref = sig('c_treble');
  for (const inst of ['clarinet', 'alto_sax', 'horn', 'trombone', 'tuba', 'flute', 'soprano_sax', 'contrabass']) { inv++; if (sig(inst) !== ref) invBad++; }
}
console.log('instrument invariance', inv - invBad, '/', inv);
if (invBad > inv * 0.02) bad('invariance ' + invBad, {});
// 망가진 공유 링크
const bads = [{ e: { a: { 0: 5 } } }, { e: { s: 5 } }, { e: { s: [5] } }, { e: { a: { 1: 'stac' } } }, { b: '4', p: 'o' }, { b: 2.5 }, { e: [1, 2] }, { v: 'x' }, { e: { a: { 0: ['ferm', 'zzz'] } } }];
for (const o of bads) {
  try {
    const s = C.decodeSet(JSON.stringify(Object.assign({ m: 'm', t: '4/4', l: 2, b: 4, k: 'C', p: 'a', a: 'a', s: 5, v: 90 }, o)), { mode: 'rhythm', meter: '4/4', level: 1, bars: 4, key: 'C', inst: 'clarinet', bpm: 88, pickup: 'auto', artic: 'auto', seed: 1, edits: {} });
    const sc = C.generate(s); C.timeline(sc, 1);
    if (!Number.isInteger(s.bars)) bad('bars not int', s);
    if (sc.events.some(e => e.artic.some(a => !C.ARTIC[a]))) bad('bad artic survived', s);
    if (sc.events.some((e, k) => e.artic.includes('ferm') && k !== sc.events.length - 1)) bad('ferm not last', s);
  } catch (err) { bad('bad link crash ' + JSON.stringify(o) + ' ' + err.message, {}); }
}
// 못갖춘마디 '빼기' 왕복
{ const s = C.decodeSet(C.encodeSet({ mode: 'rhythm', meter: '4/4', level: 3, bars: 4, key: 'C', inst: 'flute', bpm: 90, pickup: 'off', artic: 'auto', seed: 3, edits: {} }), { inst: 'flute' }); if (s.pickup !== 'off') bad('pickup off lost', s); }
// 공유 링크 왕복
{ const k = C.decodeSet(C.encodeSet({ gen: 2, drum: 'kit', mode: 'rhythm', meter: '4/4', level: 5, bars: 4, key: 'C', inst: 'flute', bpm: 90, pickup: 'off', artic: 'auto', seed: 3, edits: {} }), {}); if (k.drum !== 'kit') bad('kit link', k); }
const s0 = { gen: 2, mode: 'melody', meter: '7/8', level: 6, bars: 8, key: 'F#m', inst: 'horn', bpm: 132, pickup: 'on', artic: 'manual', seed: 123456789, edits: { a: { 3: ['acc'] }, s: [[1, 3]] } };
const s1 = C.decodeSet(C.encodeSet(s0), { inst: 'horn' });
for (const k of Object.keys(s0)) if (JSON.stringify(s0[k]) !== JSON.stringify(s1[k])) bad('share ' + k, s1);
// 옛 링크(g 없음)는 옛 3단계 그대로, 새 링크는 7단계
{ const a = C.decodeSet(JSON.stringify({ m: 'r', t: '4/4', l: 3, b: 4, k: 'C', s: 9, v: 90 }), { gen: 2, level: 5 }); if (a.gen !== 0 || a.level !== 3 || !C.levelProfile(a).legacy) bad('old link', a);
  const b = C.decodeSet(JSON.stringify({ m: 'r', t: '4/4', l: 7, g: 2, b: 4, k: 'C', s: 9, v: 90 }), { gen: 0, level: 1 }); if (b.gen !== 2 || b.level !== 7) bad('new link', b);
  const u = C.upgradeSet({ level: 2 }); if (u.level !== 4 || u.gen !== 2) bad('upgrade', u); }
// 이조 조표
const wk = (k, i) => C.writtenKey(k, C.INSTS[i]).name;
const checks = [['Bb', 'clarinet', 'C'], ['Eb', 'alto_sax', 'C'], ['F', 'horn', 'C'], ['Bb', 'horn', 'F'], ['E', 'clarinet', 'F#'], ['Cm', 'clarinet', 'Dm'], ['Ab', 'alto_sax', 'F'], ['E', 'alto_sax', 'Db'], ['C', 'trumpet', 'D']];
for (const [k, i, w] of checks) if (wk(k, i) !== w) bad(`written ${k} ${i} -> ${wk(k, i)} (want ${w})`, {});
console.log('runs', n, 'fail', fail, JSON.stringify(stats));
