// v3.8.3 난이도 1~7 전수 검사 (선율·리듬·타악기 3종·드럼 세트 × 박자표 9 × 빠르기 × 마디 수 × 못갖춘마디 3 × 기호 3 × 악보 번호)
// 같은 악보 번호로 단계만 바꿨을 때(앱에서 단계 단추를 누를 때와 같음) 이웃 단계가 같은 악보인지, 그 단계 리듬이 들어갔는지
// 통과 기준: slowSame 0 (BPM 88 이하 이웃 단계 같은 악보 없음) · slowNoNew 0 (BPM 88 이하 그 단계 리듬이 빠진 마디 없음)
//            unexplained 0 (같은 악보거나 그 단계 리듬이 없으면 반드시 rlv < 단계 → 화면 안내) · badLen 0 · legacyDiff 0 (OLD=<옛 index.html>)
const fs = require('fs');
const load = (f, hook) => { const html = fs.readFileSync(f, 'utf8'); let core = html.match(/<script id="core">([\s\S]*?)<\/script>/)[1];
  if (hook) core = core.replace('prevAllRest = cell.allRest;', 'prevAllRest = cell.allRest; if (globalThis.__cells) globalThis.__cells.push([cell, ui, pm.last && ui + cell.span >= pm.units.length, mi, !!pm.pickup]);');
  const root = {}; new Function('window', 'self', core)(root, root); return root.Core; };
const C = load(process.argv[2] || '../index.html', true);
const OLD = process.env.OLD ? load(process.env.OLD) : null;
const meters = Object.keys(C.METERS);
const fpOf = sc => sc.events.map(e => (e.rest ? 'r' : '') + e.base + '.'.repeat(e.dots) + (e.tup ? '/' + e.tup.n : '') + (e.tie ? '~' : '') + (e.keys ? e.keys.join('+') + e.voice + (e.flam ? 'f' : '') : '') + (e.artic && e.artic.length ? '<' + e.artic.join() : '')).join(' ') + '|' + sc.pickLen + JSON.stringify(sc.slurs);
const full = sc => JSON.stringify(sc.events.map(e => [e.start, e.dur, e.base, e.dots, e.rest, e.midi, e.artic, e.tup && e.tup.n, e.unit, e.tie, e.keys])) + JSON.stringify(sc.slurs);
const BPMS = (process.env.BPMS || '40,60,88,120,160,208').split(',').map(Number);
const SEEDS = +(process.env.SEEDS || 6);
const KINDS = (process.env.KINDS || 'rhythm,melody,snare,kit').split(',');
const RV = process.env.RV === '0' ? 0 : 2;
const stat = {}; let slowSame = [], slowNoNew = [], unexplained = [], badLen = 0, legacyDiff = 0, legacyN = 0, total = 0;
const bump = (k, f) => { const st = stat[k] || (stat[k] = { n: 0, same: [0, 0, 0, 0, 0, 0], noNew: [0, 0, 0, 0, 0, 0, 0] }); f(st); };
for (const kind of KINDS) for (const meter of meters) for (const bpm of BPMS) for (const bars of [2, 4, 8, 16]) for (const pickup of ['auto', 'on', 'off']) for (const artic of ['auto', 'none']) for (let s = 0; s < SEEDS; s++) {
  if (kind === 'kit' && pickup !== 'auto') continue;               // 드럼 세트는 못갖춘마디를 쓰지 않는다
  const seed = (1000 + s * 7919 + bars * 31) >>> 0;
  const mode = kind === 'melody' ? 'melody' : 'rhythm', drum = kind === 'rhythm' || kind === 'melody' ? '' : kind;
  const fp = [], scs = [], noNew = [];
  for (let level = 1; level <= 7; level++) {
    const set = { gen: 2, sv: 2, rv: RV, mode, prac: '', minor: 'h', kref: '', drum, bow: '', meter, level, bars, key: 'Bb', inst: 'clarinet', bpm, pickup, artic, seed, edits: {} };
    globalThis.__cells = [];
    const sc = C.generate(set); total++;
    const cells = globalThis.__cells; globalThis.__cells = null;
    fp.push(fpOf(sc)); scs.push(sc);
    // 마디 길이
    for (const m of sc.measures) { const t = sc.events.filter(e => e.mi === m.mi && (!e.voice || e.voice === 'u')).reduce((a, e) => a + e.dur, 0); if (Math.abs(t - m.len) > 1e-6 && badLen++ < 5) console.log('BAD len', kind, meter, level, bpm, bars, pickup); }
    // 그 단계 리듬이 빠진 마디 (선율·리듬·타악기: 못갖춘마디 빼고 마디마다)
    let miss = 0;
    if (kind !== 'kit' && level >= 2) for (const m of sc.measures) { if (m.pickup || (m.last && m.units.length <= 1 && m.len <= sc.measLen - 1)) continue; if (!cells.some(([c, ui, fin, mi]) => mi === m.mi && !fin && c.lv === level)) miss++; }
    noNew.push(kind === 'kit' ? (sc.rlv != null && sc.rlv < level) : miss > 0);
    if (miss && bpm <= 88) slowNoNew.push({ kind, meter, bpm, bars, pickup, level, miss, rlv: sc.rlv });
    const scoreNew = kind === 'kit' || level < 2 || cells.some(([c, ui, fin]) => !fin && c.lv === level);
    if (!scoreNew && !(sc.rlv < level)) unexplained.push({ why: 'noNew', kind, meter, bpm, bars, pickup, level, rlv: sc.rlv });
    if (OLD && level % 2) { const s0 = Object.assign({}, set); delete s0.rv; legacyN++; if (full(C.generate(s0)) !== full(OLD.generate(s0))) legacyDiff++; }
  }
  for (const k of [`${kind}|${meter}|${bpm}`, `${kind}|all|${bpm}`, `${kind}|p=${pickup}|a=${artic}`]) bump(k, st => {
    st.n++;
    for (let l = 1; l < 7; l++) if (fp[l - 1] === fp[l]) st.same[l - 1]++;
    for (let l = 0; l < 7; l++) if (noNew[l]) st.noNew[l]++;
  });
  for (let l = 1; l < 7; l++) if (fp[l - 1] === fp[l]) {
    if (bpm <= 88) slowSame.push({ p: l + '-' + (l + 1), kind, meter, bpm, bars, pickup, artic });
    if (!(scs[l].rlv < l + 1)) unexplained.push({ why: 'same', p: l + '-' + (l + 1), kind, meter, bpm, bars, pickup, artic });
  }
}
const pct = (a, n) => Math.round(a / n * 1000) / 10;
for (const [k, st] of Object.entries(stat)) if (process.env.ONLY ? k.includes(process.env.ONLY) : k.includes('|all|'))
  console.log(k.padEnd(24), 'n', String(st.n).padStart(5), ' 같은악보 1-2..6-7 %', st.same.map(x => pct(x, st.n)).join(' '), '  새리듬빠짐 1..7 %', st.noNew.map(x => pct(x, st.n)).join(' '));
console.log('scores', total, 'badLen', badLen);
console.log('slowSame', slowSame.length, JSON.stringify(slowSame.slice(0, 4)));
console.log('slowNoNew', slowNoNew.length, JSON.stringify(slowNoNew.slice(0, 4)));
console.log('unexplained', unexplained.length, JSON.stringify(unexplained.slice(0, 4)));
if (OLD) console.log('legacyDiff', legacyDiff, '/', legacyN);
