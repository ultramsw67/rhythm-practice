// 가상 연주로 채점기 시험
const fs = require('fs');
const html = fs.readFileSync(process.argv[2], 'utf8');
new Function(/<script id="core">([\s\S]*?)<\/script>/.exec(html)[1])();
const C = globalThis.Core;
const SR = 48000;
const variants = {
  perfect: {},
  lat80: { lat: 0.08, latKnown: 0.08 },
  jitter25: { jitter: 25 },
  jitter60: { jitter: 60 },
  fast10: { tempo: 1.1 },
  detune40: { detune: 40 },
  wrong20: { wrong: 0.2 },
  drop20: { drop: 0.2 },
  legatoAll: { lenScale: 1.6 },
  flatAccent: { flatAccent: true },
  clicksSpk: { clicks: true, speaker: true },
};
const cases = [];
const meters = ['2/4', '3/4', '4/4', '6/8', '7/8', '12/8', '2/2', '5/4', '9/8'];
const insts = ['clarinet', 'flute', 'alto_sax', 'trumpet', 'trombone', 'tuba', 'horn'];
for (let i = 0; i < 18; i++) cases.push({ mode: i % 2 ? 'melody' : 'rhythm', meter: meters[i % meters.length], gen: 2, level: 1 + (i % 7), bars: 4, key: C.KEYS[(i * 7) % 30].name, inst: insts[i % insts.length], bpm: 60 + (i * 13) % 90, pickup: 'auto', artic: 'auto', seed: 1000 + i, edits: {} });
const agg = {};
const t0 = Date.now();
for (const set of cases) {
  const sc = C.generate(set), tl = C.timeline(sc, 1);
  const line = [];
  for (const [name, o] of Object.entries(variants)) {
    const pcm = C.synth(sc, tl, SR, { seed: 7, ...o });
    const res = C.analyze(pcm, SR, sc, tl, o.latKnown != null ? o.latKnown : 0, { speaker: !!o.speaker });
    (agg[name] = agg[name] || []).push(res.total);
    line.push(`${name}:${res.total}`);
    if (name === 'perfect' && res.total < 100) {
      const p = res.parts; console.log('  LOW perfect', JSON.stringify(set), JSON.stringify(Object.fromEntries(Object.entries(p).map(([k, v]) => [k, +v.toFixed(2)]))), 'matched', res.matched, '/', res.count, 'onsets', res.onsets, 'extras', res.extras);
      res.notes.filter(n => n.grade !== 'ok').slice(0, 6).forEach(n => console.log('    note', n.ev, n.grade, n.matched ? `dev ${(n.dev * 1000).toFixed(0)} ratio ${n.ratio?.toFixed(2)} cents ${n.cents?.toFixed(0)} checks ${JSON.stringify(n.checks)}` : 'MISS', n.artic));
    }
  }
  console.log(`${set.mode[0]} ${set.meter} L${set.level} ${set.bpm}bpm ${set.inst} | ${line.join(' ')}`);
}
console.log('\n평균:');
for (const [k, v] of Object.entries(agg)) console.log(k.padEnd(11), (v.reduce((a, b) => a + b, 0) / v.length).toFixed(1), 'min', Math.min(...v), 'max', Math.max(...v));
console.log('time', Date.now() - t0, 'ms');
