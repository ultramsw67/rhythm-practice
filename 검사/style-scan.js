// v3.9.2 리듬 스타일 전수 검사: 스타일 × 박자표 × 1~5단계 × 빠르기 × 악기(박자 소리·스네어·드럼 세트) × 악보 번호
// ① 조각 길이가 그 스타일 박자표의 한 마디와 맞는지 ② 악보가 만들어지는지·마디 길이 ③ 이웃 단계가 같은 악보인지(느린 빠르기)
// ④ 스윙 시간표가 앞뒤 순서를 지키는지 ⑤ 가상 연주 채점 100 ⑥ 링크 왕복 ⑦ 스타일 없는 악보는 예전과 같은지(OLD=<옛 index.html>)
// 사용: node style-scan.js ../index.html   (SEEDS=8 로 범위)
const fs = require('fs');
function load(file) {
  const html = fs.readFileSync(file, 'utf8');
  const core = html.match(/<script id="core">([\s\S]*?)<\/script>/)[1];
  const root = {}; new Function('root', 'self', 'window', core)(root, root, root);
  return root.Core || root;
}
const C = load(process.argv[2]);
const SEEDS = +process.env.SEEDS || 8;
const bad = [];
const base = { gen: 3, sv: 2, rv: 2, drum: '', bow: '', kref: '', prac: '', minor: 'h', mode: 'rhythm', meter: '4/4', level: 1, bars: 8, key: 'C', inst: 'clarinet', bpm: 88, pickup: 'auto', artic: 'auto', seed: 1, edits: {} };
// ① 조각 길이
for (const [k, S] of Object.entries(C.STYLES)) {
  const lens = S.meters.map(m => { const M = C.METERS[m]; return [...M.units].reduce((s, u) => s + (u === 'c' ? 1260 : 840), 0); });
  C.STYLEDB[k].forEach((arr, i) => arr.forEach(c => { if (!lens.includes(c.tot)) bad.push(['len', k, i + 1, c.p, c.tot]); }));
  for (const m of S.meters) for (let l = 1; l <= 5; l++) {
    const M = C.METERS[m], len = [...M.units].reduce((s, u) => s + (u === 'c' ? 1260 : 840), 0);
    if (!C.STYLEDB[k][l - 1].some(c => c.tot === len)) bad.push(['noPattern', k, m, l]);
  }
  const K = S.kit;
  for (const m of S.meters) { const G = K[m] || K[Object.keys(K)[0]]; for (const g of [G.a, G.b, G.a && G.a.u2 ? { u: G.a.u2, d: G.a.d2 || G.a.d } : null].filter(Boolean)) { const n = g.u.split(' ').length, B = C.METERS[m].units.length; if (n !== g.d.split(' ').length || n % B) bad.push(['kitGrid', k, m, n, B]); } }
}
// ⑧ 스타일끼리 구분 (v3.9.3 "확실히 구분되게"): 같은 박자표 스타일끼리 ① 드럼 세트 그루브(a·b)가 같으면 안 됨 ② 단계마다 같은 리듬 조각 수
const share = {};
{
  const ks = Object.keys(C.STYLES), mlen = m => [...C.METERS[m].units].reduce((s, u) => s + (u === "c" ? 1260 : 840), 0);
  for (const a of ks) for (const b of ks) if (a < b) for (const m of C.STYLES[a].meters) if (C.STYLES[b].meters.includes(m)) {
    const ka = C.STYLES[a].kit[m], kb = C.STYLES[b].kit[m];
    if (ka && kb) for (const ga of [ka.a, ka.b].filter(Boolean)) for (const gb of [kb.a, kb.b].filter(Boolean)) if (ga.u === gb.u && ga.d === gb.d) bad.push(["sameKit", a, b, m]);
    for (let i = 0; i < 5; i++) {
      const A = new Set(C.STYLEDB[a][i].filter(c => c.tot === mlen(m)).map(c => c.p)), Bs = C.STYLEDB[b][i].filter(c => c.tot === mlen(m)).map(c => c.p);
      const n = Bs.filter(p => A.has(p)).length; if (n) share["L" + (i + 1)] = (share["L" + (i + 1)] || []).concat(a + "/" + b + "(" + m + "):" + n);
    }
  }
  // 1단계 대표 리듬은 겹치면 안 됨
  if (share.L1) bad.push(["sameL1", share.L1]);
}
// ②③④⑤⑥
let n = 0, same = 0, selfN = 0, selfBad = [], rlvLow = 0;
const kinds = ['', 'snare', 'kit'];
for (const [k, S] of Object.entries(C.STYLES)) for (const m of S.meters) for (const drum of kinds) for (const bpm of [60, S.bpm, 160]) for (let sd = 1; sd <= SEEDS; sd++) {
  const prev = [];
  for (let l = 1; l <= 5; l++) {
    const set = Object.assign({}, base, { style: k, meter: m, level: l, drum, bpm, seed: sd * 7919 });
    let sc;
    try { sc = C.generate(set); } catch (e) { bad.push(['throw', k, m, drum, bpm, l, String(e.message)]); continue; }
    n++;
    if (!sc.style && !(drum === 'kit' && sc.kit && sc.style === k)) { if (sc.style !== k) bad.push(['notStyled', k, m, drum, l]); }
    const lens = sc.measures.map(x => x.len), sum = sc.events.filter(e => true).reduce((s, e) => s + e.dur, 0);
    const expect = sc.kit ? sum / 2 : sum;                              // 드럼 세트는 두 성부
    if (Math.abs(expect - lens.reduce((a, b) => a + b, 0)) > 1e-6) bad.push(['measLen', k, m, drum, bpm, l, sd, expect, lens]);
    if (sc.events.some(e => !Number.isFinite(e.start) || !Number.isFinite(e.dur) || e.dur <= 0)) bad.push(['nan', k, m, l]);
    const sig = sc.events.map(e => (e.rest ? 'r' : '') + e.dur + (e.keys ? e.keys.join('+') : '')).join(' ');
    if (bpm <= 88 && l > 1 && prev[l - 2] === sig) { same++; if (process.env.SHOW) console.log("same", k, m, drum, bpm, l, sd); }
    prev.push(sig);
    if (sc.rlv != null && sc.rlv < l && bpm <= 88 && !sc.kit) rlvLow++;
    const tl = C.timeline(sc, 1);
    for (let i = 1; i < tl.notes.length; i++) if (!(tl.notes[i].t > tl.notes[i - 1].t)) { bad.push(['tlOrder', k, m, drum, l]); break; }
    if (tl.notes.some(x => !Number.isFinite(x.t) || !Number.isFinite(x.dur) || x.dur <= 0)) bad.push(['tlNaN', k, m, drum, l]);
    // 스윙: 엇박 8분은 박의 2/3 자리
    if (S.swing && !sc.kit) { const e = sc.events.find(e => !e.rest && e.start % 840 === 420); if (e) { const x = tl.notes.find(q => q.ev === e.id); if (x) { const want = (tl.lead / sc.spt + Math.floor(e.start / 840) * 840 + 560) * sc.spt; if (Math.abs(x.t - want) > 1e-6) bad.push(['swingPos', k, l, x.t, want]); } } }
    // 스윙에서도 잇단음표는 고르게 (v3.9.2 코드 검토)
    if (S.swing && !sc.kit) for (const e of sc.events.filter(e => e.tup && !e.rest)) { const x = tl.notes.find(q => q.ev === e.id); if (x && Math.abs(x.written - e.dur * sc.spt) > 1e-6) { bad.push(['tupSwing', k, l, sd, x.written, e.dur * sc.spt]); break; } }
    // 링크 왕복
    const back = C.decodeSet(C.encodeSet(set), Object.assign({}, base));
    if (back.style !== k || back.meter !== m) bad.push(['link', k, m, back.style, back.meter]);
    // 가상 연주 (일부만 — 느림)
    if (sd === 1 && bpm === S.bpm && (l === 1 || l === 5)) {
      const pcm = C.synth(sc, tl, 22050, { seed: 3 });
      const res = C.analyze(pcm, 22050, sc, tl, 0, {});
      selfN++; if (res.total < 100) selfBad.push([k, m, drum, l, res.total, JSON.stringify(res.parts)]);
    }
  }
}
// ⑦ 스타일 없는 악보·옛 링크는 그대로
let legacyDiff = 0;
if (process.env.OLD) {
  const O = load(process.env.OLD);
  for (const mode of ['rhythm', 'melody']) for (const drum of ['', 'snare', 'kit']) for (const m of Object.keys(C.METERS)) for (let l = 1; l <= 5; l++) for (let sd = 1; sd <= 3; sd++) {
    if (mode === 'melody' && drum) continue;
    const set = Object.assign({}, base, { mode, drum, meter: m, level: l, seed: sd * 31 });
    const a = JSON.stringify(C.generate(Object.assign({}, set, { style: '' })).events), b = JSON.stringify(O.generate(set).events);
    if (a !== b) legacyDiff++;
  }
}
// 멜로디 모드에서는 스타일을 무시
const mel = C.generate(Object.assign({}, base, { mode: 'melody', style: 'swing' }));
if (mel.style) bad.push(['melodyStyled']);
console.log('share', JSON.stringify(share));
console.log('styles', Object.keys(C.STYLES).length, 'scores', n, 'sameNeighbor(≤88)', same, 'rlvLow(≤88)', rlvLow, 'self', selfN, 'selfBad', selfBad.length, OLD_STR());
function OLD_STR() { return process.env.OLD ? 'legacyDiff ' + legacyDiff : ''; }
if (selfBad.length) console.log('selfBad', JSON.stringify(selfBad.slice(0, 10)));
console.log('bad', bad.length, JSON.stringify(bad.slice(0, 15)));
