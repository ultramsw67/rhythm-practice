// v3.9 새 악보 다양성: 같은 설정에서 새 악보(악보 번호만 바꿈)를 300번 눌렀을 때 리듬이 얼마나 다양한가 — 5단계 판(gen 3) vs 7단계 판(gen 2, 같은 안쪽 단계)
// 한 악보 안 서로 다른 박 리듬 수 · 앞 마디와 똑같은 마디 비율 · 300개 동안 나온 서로 다른 한 마디 리듬 수
const fs = require('fs');
const html = fs.readFileSync(process.argv[2] || '../index.html', 'utf8');
const core = html.match(/<script id="core">([\s\S]*?)<\/script>/)[1]; const root = {}; new Function('window', 'self', core)(root, root); const C = root.Core;
const N = +(process.env.N || 300);
const measStr = (sc, m) => sc.events.filter(e => e.mi === m.mi).map(e => (e.rest ? 'r' : '') + e.base + '.'.repeat(e.dots) + (e.tup ? '/' + e.tup.n : '') + (e.tie ? '~' : '')).join(' ');
const beatStr = sc => { const out = new Set(); for (const m of sc.measures) for (const u of m.units) out.add(sc.events.filter(e => e.unit === u.id).map(e => (e.rest ? 'r' : '') + e.base + '.'.repeat(e.dots) + (e.tup ? '/' + e.tup.n : '')).join(' ')); return out; };
const res = [];
for (const meter of ['4/4', '3/4', '6/8', '2/2']) for (let ui = 1; ui <= 5; ui++) {
  const row = { meter, ui };
  for (const gen of [2, 3]) {
    let beats = 0, dupM = 0, nM = 0; const allM = new Set();
    for (let s = 0; s < N; s++) {
      const level = gen === 3 ? ui : [2, 3, 4, 5, 6][ui - 1];
      const sc = C.generate({ gen, sv: 2, rv: 2, mode: 'rhythm', prac: '', drum: '', bow: '', meter, level, bars: 8, key: 'Bb', inst: 'clarinet', bpm: 88, pickup: 'off', artic: 'none', seed: 777 + s * 104729, edits: {} });
      beats += beatStr(sc).size;
      const ms = sc.measures.filter(m => !m.last).map(m => measStr(sc, m)); ms.forEach((x, i) => { allM.add(x); if (i && x === ms[i - 1]) dupM++; }); nM += ms.length - 1;
    }
    row[gen] = { beatKinds: +(beats / N).toFixed(1), dupMeas: Math.round(dupM / nM * 1000) / 10 + '%', measKinds: allM.size };
  }
  res.push(row);
}
for (const r of res) console.log(r.meter.padEnd(4), r.ui + '단계', ' 7단계판:', JSON.stringify(r[2]), ' → 5단계판:', JSON.stringify(r[3]));
