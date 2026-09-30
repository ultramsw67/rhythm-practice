// v3.8.2: 음계 연습에서 이웃 단계끼리 같은 악보가 나오는지 — 악기 15 × 박자표 9 × 빠르기 5 × 조 4 × 1~7단계
// 통과 기준: slowSame 0 (BPM 88 이하에서 이웃 단계가 같은 악보 없음), unexplained 0 (같으면 반드시 윗단계 rlv < 단계 → 화면에 "이 박자·빠르기에서는 ○단계 리듬" 안내),
//            legacyDiff 0 (sv 없는 옛 기록·링크는 v3.8.1 과 같은 악보 — OLD=<옛 index.html> 을 주면 비교)
const fs = require('fs');
const load = f => { const html = fs.readFileSync(f, 'utf8'); const core = html.match(/<script id="core">([\s\S]*?)<\/script>/)[1]; const root = {}; new Function('window', 'self', core)(root, root); return root.Core; };
const C = load(process.argv[2] || '../index.html');
const OLD = process.env.OLD ? load(process.env.OLD) : null;
const insts = Object.keys(C.INSTS), meters = Object.keys(C.METERS);
const rhy = sc => sc.events.map(e => (e.rest ? 'r' : '') + e.base + '.'.repeat(e.dots) + (e.tup ? '/' + e.tup.n : '')).join(' ');
const full = sc => JSON.stringify(sc.events.map(e => [e.start, e.dur, e.base, e.dots, e.rest, e.midi, e.artic, e.tup && e.tup.n, e.unit])) + JSON.stringify(sc.slurs) + JSON.stringify(sc.measures.map(m => m.units.map(u => [u.start, u.len])));
const pairs = {}; let n = 0, maxPer = 0, maxPerAt = null, slowSame = [], unexplained = [], legacyDiff = 0, legacyN = 0, bad = 0;
for (const inst of insts) for (const meter of meters) for (const bpm of [60, 88, 120, 160, 208]) for (const key of ['C', 'Bb', 'Am', 'F#']) {
  const out = [], scs = [];
  for (let level = 1; level <= 7; level++) {
    const set = { gen: 2, mode: 'melody', prac: 'scale', sv: 2, minor: 'h', kref: '', meter, level, bars: 4, key, inst, bpm, pickup: 'auto', artic: 'auto', seed: 5 + level, edits: {}, bow: '' };
    const sc = C.generate(set); out.push(rhy(sc)); scs.push(sc);
    for (const m of sc.measures) {
      const k = sc.events.filter(e => e.mi === m.mi && !e.rest).length; if (k > maxPer) { maxPer = k; maxPerAt = { inst, meter, bpm, level }; }
      const t = sc.events.filter(e => e.mi === m.mi).reduce((a, e) => a + e.dur, 0); if (Math.abs(t - sc.measLen) > 1e-6 && bad++ < 5) console.log('BAD meas len', meter, level, bpm);
    }
    if (OLD) { const s0 = Object.assign({}, set); delete s0.sv; legacyN++; if (full(C.generate(s0)) !== full(OLD.generate(s0))) legacyDiff++; }
  }
  n++;
  for (let l = 1; l < 7; l++) if (out[l - 1] === out[l]) {
    const p = l + '-' + (l + 1); pairs[p] = (pairs[p] || 0) + 1;
    if (bpm <= 88) slowSame.push({ p, inst, meter, bpm, key });
    if (!(scs[l].scale.rlv < l + 1)) unexplained.push({ p, inst, meter, bpm, key });
  }
}
console.log('cases', n, 'maxPerMeasure', maxPer, JSON.stringify(maxPerAt), 'bad', bad);
console.log('same pairs (빠른 BPM 에서만)', JSON.stringify(pairs));
console.log('slowSame', slowSame.length, JSON.stringify(slowSame.slice(0, 5)));
console.log('unexplained', unexplained.length, JSON.stringify(unexplained.slice(0, 5)));
if (OLD) console.log('legacyDiff', legacyDiff, '/', legacyN);
