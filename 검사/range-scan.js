// 선율·음계 악보가 악기 음역(inst.r[2] = 낼 수 있는 음역, 적힌 음)을 벗어나는지 전수 조사
const fs = require('fs');
const html = fs.readFileSync(process.argv[2] || '../index.html', 'utf8');
const core = html.match(/<script id="core">([\s\S]*?)<\/script>/)[1];
const root = {}; new Function('window', 'self', core)(root, root);
const C = root.Core;
const insts = Object.keys(C.INSTS), keys = C.KEYS.map(k => k.name), meters = Object.keys(C.METERS);
const out = {}; let total = 0, badScores = 0, n = 0;
for (const inst of insts) {
  const I = C.INSTS[inst], [lo, hi] = I.r[2];
  const o = out[inst] = { lo, hi, min: 999, max: -999, bad: 0, scores: 0, ex: null };
  for (const prac of (process.env.PRAC!=null ? [process.env.PRAC] : ["", "scale"])) for (const kref of ['', 'w']) for (const key of keys) for (let level = 1; level <= 7; level++) for (let s = 0; s < (prac ? 2 : 6); s++) {
    const set = { gen: 2, mode: 'melody', prac, minor: ['h', 'n', 'm'][s % 3], kref, meter: meters[(n++) % meters.length], level, bars: 8, key, inst, bpm: 60 + (s * 17) % 100, pickup: 'auto', artic: 'auto', seed: 1000 + s * 7 + level, edits: {} };
    const sc = C.generate(set); o.scores++;
    let b = 0;
    for (const e of sc.events) if (!e.rest) { o.min = Math.min(o.min, e.midi); o.max = Math.max(o.max, e.midi); if (e.midi < lo || e.midi > hi) b++; }
    if (b) { o.bad++; badScores++; if (!o.ex) o.ex = { prac, kref, key, level, seed: set.seed, n: b }; }
    total++;
  }
}
for (const [k, o] of Object.entries(out)) console.log(k.padEnd(12), 'range', o.lo, o.hi, '| seen', o.min, o.max, '| bad scores', o.bad, '/', o.scores, o.ex ? JSON.stringify(o.ex) : '');
console.log('total', total, 'badScores', badScores);
