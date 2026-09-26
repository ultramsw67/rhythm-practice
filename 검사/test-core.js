// 리듬 연습.html 의 core 스크립트만 꺼내 node 에서 시험
const fs = require('fs');
const html = fs.readFileSync(process.argv[2], 'utf8');
const m = /<script id="core">([\s\S]*?)<\/script>/.exec(html);
new Function(m[1])();
const C = globalThis.Core;
let fail = 0, n = 0;
const stats = { tup: 0, tie: 0, pickup: 0, dd: 0, t32: 0, artic: 0, slur: 0, acc: 0 };
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
    mode: r() < 0.5 ? 'rhythm' : 'melody', meter: meters[Math.floor(r() * meters.length)], level: 1 + Math.floor(r() * 3),
    bars: [2, 4, 8, 12, 16][Math.floor(r() * 5)], key: C.KEYS[Math.floor(r() * 30)].name, inst: insts[Math.floor(r() * insts.length)],
    bpm: 40 + Math.floor(r() * 169), pickup: ['auto', 'on', 'off'][Math.floor(r() * 3)], artic: ['auto', 'manual', 'none'][Math.floor(r() * 3)],
    seed: Math.floor(r() * 1e9), edits: {},
  };
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
    for (const k in g) { const ev = evs.find(e => e.tup && e.tup.g == k); if (g[k] !== ev.tup.n) bad('tuplet count', set); }
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
    if (e.dur * sc.spt < [0.14, 0.1, 0.07][set.level - 1] - 1e-9 && !(set.level === 1 && e.base === 'q')) bad('too fast note ' + e.base, set);
    if (sc.melody && !e.rest) {
      const [lo, hi] = sc.inst.r[2];                         // 낼 수 있는 전체 음역(반드시)
      if (e.midi < lo - 1 || e.midi > hi + 1) bad(`range ${e.midi} not in ${lo}-${hi}`, set);
      const [clo, chi] = sc.inst.r[set.level - 1];           // 편한 음역(조금 넘는 것은 허용)
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
// 같은 설정이면 악기가 달라도 선율(음정 간격)·리듬·기호가 같아야 한다
let inv = 0, invBad = 0;
for (let i = 0; i < 400; i++) {
  const r = C.mulberry(9000 + i);
  const base = { mode: 'melody', meter: meters[Math.floor(r() * meters.length)], level: 1 + Math.floor(r() * 3), bars: [2, 4, 8][Math.floor(r() * 3)], key: C.KEYS[Math.floor(r() * 30)].name, bpm: 60 + Math.floor(r() * 100), pickup: 'auto', artic: 'auto', seed: Math.floor(r() * 1e9), edits: {} };
  const sig = inst => {
    const sc = C.generate({ ...base, inst });
    const ns = sc.events.filter(e => !e.rest);
    return JSON.stringify({ rh: sc.events.map(e => [e.start, e.dur, e.rest, e.tie, e.artic]), sl: sc.slurs, iv: ns.slice(1).map((e, k) => (e.midi - ns[k].midi + 120) % 12) });
  };
  const ref = sig('c_treble');
  for (const inst of ['clarinet', 'alto_sax', 'horn', 'trombone', 'tuba', 'flute']) { inv++; if (sig(inst) !== ref) invBad++; }
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
const s0 = { mode: 'melody', meter: '7/8', level: 3, bars: 8, key: 'F#m', inst: 'horn', bpm: 132, pickup: 'on', artic: 'manual', seed: 123456789, edits: { a: { 3: ['acc'] }, s: [[1, 3]] } };
const s1 = C.decodeSet(C.encodeSet(s0), { inst: 'horn' });
for (const k of Object.keys(s0)) if (JSON.stringify(s0[k]) !== JSON.stringify(s1[k])) bad('share ' + k, s1);
// 이조 조표
const wk = (k, i) => C.writtenKey(k, C.INSTS[i]).name;
const checks = [['Bb', 'clarinet', 'C'], ['Eb', 'alto_sax', 'C'], ['F', 'horn', 'C'], ['Bb', 'horn', 'F'], ['E', 'clarinet', 'F#'], ['Cm', 'clarinet', 'Dm'], ['Ab', 'alto_sax', 'F'], ['E', 'alto_sax', 'Db'], ['C', 'trumpet', 'D']];
for (const [k, i, w] of checks) if (wk(k, i) !== w) bad(`written ${k} ${i} -> ${wk(k, i)} (want ${w})`, {});
console.log('runs', n, 'fail', fail, JSON.stringify(stats));
