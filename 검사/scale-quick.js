// 음계·조표 기준 빠른 검사 (node): 마디 길이, 음 수, 음계 모양, 두 기준, 링크 왕복
const fs = require('fs');
const html = fs.readFileSync(process.argv[2] || '../index.html', 'utf8');
const core = html.match(/<script id="core">([\s\S]*?)<\/script>/)[1];
const root = {}; new Function('window', 'self', core)(root, root);
const C = root.Core;
let bad = 0; const B = (m, o) => { if (bad++ < 15) console.log('BAD', m, JSON.stringify(o).slice(0, 300)); };
let n = 0;
const insts = Object.keys(C.INSTS), meters = Object.keys(C.METERS);
for (const inst of insts) for (const key of C.KEYS.map(k => k.name)) for (let level = 1; level <= 7; level++) for (const minor of ['h', 'n', 'm']) {
  if (!key.endsWith('m') && minor !== 'h') continue;
  const meter = meters[(n * 7 + level) % meters.length], bpm = [60, 88, 120, 160, 208][n % 5];
  const set = { gen: level <= 5 && (n >> 1) % 2 ? 3 : 2, mode: 'melody', prac: 'scale', sv: n % 2 ? 2 : 0, minor, kref: n % 3 === 0 ? 'w' : '', meter, level, bars: 4, key, inst, bpm, pickup: 'auto', artic: 'auto', seed: n + 1, edits: {}, bow: inst === 'contrabass' ? ['', 'pizz', 'mix'][n % 3] : '' };
  n++;
  let sc; try { sc = C.generate(set); C.timeline(sc, 1); } catch (e) { B('crash ' + e.message, set); continue; }
  for (const m of sc.measures) { const t = sc.events.filter(e => e.mi === m.mi).reduce((a, e) => a + e.dur, 0); if (Math.abs(t - sc.measLen) > 1e-6) B('meas len ' + t + ' vs ' + sc.measLen, { set, mi: m.mi }); }
  const ns = sc.events.filter(e => !e.rest);
  const oct = sc.scale.oct, expect = 14 * oct + 1;
  if (ns.length !== expect) B('notes ' + ns.length + ' expect ' + expect, set);
  if (ns[0].rp !== 0 || ns[ns.length - 1].rp !== 0) B('not tonic start/end', set);
  // 한 칸씩 오르내림 (도 차이 1)
  for (let i = 1; i < ns.length; i++) if (Math.abs((ns[i].rp >> 2) - (ns[i - 1].rp >> 2)) !== 1) { B('step', { set, i }); break; }
  // 반음 수: 장음계 2212221, 화성단 2122131, 자연 2122122, 가락(올라감) 2122221
  const want = !sc.writtenKey.minor ? [2, 2, 1, 2, 2, 2, 1] : { h: [2, 1, 2, 2, 1, 3, 1], n: [2, 1, 2, 2, 1, 2, 2], m: [2, 1, 2, 2, 2, 2, 1] }[minor];
  const up = ns.slice(0, 8).map(e => e.midi); const got = up.slice(1).map((m, i) => m - up[i]);
  if (got.join() !== want.join()) B('intervals ' + got.join('') + ' want ' + want.join(''), set);
  if (sc.writtenKey.minor && minor === 'm') { const dn = ns.slice(7 * oct, 7 * oct + 8).map(e => e.midi); const g2 = dn.slice(1).map((m, i) => dn[i] - m); if (g2.join() !== [2, 2, 1, 2, 2, 1, 2].join()) B('melodic down ' + g2.join(''), set); }
  // 두 기준: 'w' 면 악보 조 = 고른 조, 아니면 실음 조 = 고른 조
  const I = C.INSTS[inst];
  if (set.kref === 'w' && C.krefUsable(I)) { if (sc.writtenKey.name !== key) B('kref w written', set); if (C.writtenKey(sc.concertKey.name, I).fifths % 12 !== C.KEY_BY[key].fifths % 12 && Math.abs(C.writtenKey(sc.concertKey.name, I).fifths - C.KEY_BY[key].fifths) !== 12) B('kref w concert', set); }
  else if (sc.concertKey.name !== key) B('kref concert', set);
  // 실음 = 적힌 음 + t, 소리 높이 확인
  const tl = C.timeline(sc, 1); if (tl.notes.some(x => x.concert !== x.midi + I.t)) B('concert midi', set);
  // 링크 왕복
  const s2 = C.decodeSet(C.encodeSet(set), { inst });
  for (const k of ['prac', 'minor', 'kref', 'sv']) if ((s2[k] || '') !== (k === 'minor' && !set.prac ? 'h' : set[k] || '')) B('link ' + k + ' ' + s2[k], set);
  if (JSON.stringify(C.generate(s2).events.map(e => [e.dur, e.midi])) !== JSON.stringify(sc.events.map(e => [e.dur, e.midi]))) B('link regen', set);
}
// 합주 실음 기준이면 악기가 달라도 음계(으뜸음 기준)가 같다
let inv = 0, invBad = 0;
for (const sv of [0, 2]) for (const meter of ['4/4', '6/8', '2/2']) for (const key of ['Bb', 'Eb', 'F', 'Cm', 'Gm']) for (let level = 1; level <= 7; level++) {
  const ref = C.generate({ gen: 2, mode: 'melody', prac: 'scale', sv, minor: 'h', meter, level, bars: 4, key, inst: 'clarinet', bpm: 90, pickup: 'auto', artic: 'auto', seed: 5, edits: {} });
  for (const inst of insts) { inv++; const sc = C.generate(Object.assign({}, ref.set, { inst })); const a = sc.events.filter(e => !e.rest).map(e => (e.midi + C.INSTS[inst].t) % 12).slice(0, 8).join(), b = ref.events.filter(e => !e.rest).map(e => (e.midi - 2) % 12).slice(0, 8).join(); if (a !== b) { invBad++; if (invBad < 4) console.log('inv', key, level, inst, a, b); } }
}
// 옛 링크·설정(필드 없음)은 음계가 아님
const old = C.decodeSet(JSON.stringify({ m: 'm', t: '4/4', l: 3, g: 2, b: 4, k: 'C', s: 9, v: 90 }), {});
if (old.prac || old.kref) B('old link got new fields', old);
const g0 = C.generate({ gen: 2, mode: 'melody', meter: '4/4', level: 3, bars: 4, key: 'Bb', inst: 'clarinet', bpm: 90, pickup: 'auto', artic: 'auto', seed: 42, edits: {} });
console.log('runs', n, 'bad', bad, 'invariance', inv - invBad, '/', inv, 'melody notes', g0.events.length);
