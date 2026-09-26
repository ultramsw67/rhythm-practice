const fs = require('fs');
const html = fs.readFileSync(process.argv[2], 'utf8');
new Function(/<script id="core">([\s\S]*?)<\/script>/.exec(html)[1])();
const C = globalThis.Core;
const set = JSON.parse(process.argv[3]);
const sc = C.generate(set), tl = C.timeline(sc, 1);
const pcm = C.synth(sc, tl, 48000, { seed: 7 });
const res = C.analyze(pcm, 48000, sc, tl, 0, {});
console.log('slurs', JSON.stringify(sc.slurs));
res.notes.forEach((r, i) => {
  const n = tl.notes[i];
  console.log(i, 'ev', n.ev, 't', n.t.toFixed(3), 'midi', n.concert, n.legato ? 'LEG' : '', n.artic.join(','), r.matched ? `on ${r.onset.toFixed(3)} dev ${(r.dev*1000).toFixed(0)} c ${r.cents?.toFixed(0)}` : 'MISS', r.grade);
});
