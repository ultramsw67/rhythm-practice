// v3.8.3 (2026-10-01 "모바일에서 4~7단계가 같은 악보, 못갖춘마디 빼기·아티큘레이션 없음에서 많이"):
// 휴대폰 폭(390px)에서 실제 칸·단추를 눌러 1→7단계로 올리며 악보가 단계마다 바뀌는지, 같으면 악보 정보 줄에 안내가 있는지.
// ① 업데이트 전 저장된 설정(rv 없음)으로 열면 보던 악보 그대로(rv 0) → 단계 단추를 누르면 새 규칙(rv 2)
// ② 모드 3(리듬·선율·드럼 세트) × 박자표 5 × 못갖춘마디 빼기·기호 없음 × BPM 88·160, 단추로 1~7
// 통과: bad [] (BPM 88 에서 이웃 단계 같은 악보 0, BPM 160 에서도 같으면 안내 있음), errs [], overflowX ≤ 0
module.exports = async (c) => {
  const bad = [];
  await c.size(390, 844, true);
  await c.go('http://127.0.0.1:8765/');
  // ① 옛 저장 설정
  await c.ev(`localStorage.clear(); localStorage.setItem('rp.startSeen','true'); localStorage.setItem('rp.set', JSON.stringify({gen:2,sv:2,mode:'rhythm',meter:'6/8',level:4,bars:4,key:'Bb',inst:'clarinet',bpm:88,pickup:'off',artic:'none',seed:4242,edits:{}}))`);
  await c.go('http://127.0.0.1:8765/');
  const before = await c.ev(`JSON.stringify({rv: RP.set.rv, level: RP.set.level, seed: RP.set.seed})`);
  console.log('saved set opened', before);
  if (JSON.parse(before).rv !== 0) bad.push('saved set should keep rv 0');
  const fp = `RP.score.events.map(e=>(e.rest?'r':'')+e.base+'.'.repeat(e.dots)+(e.tup?'/'+e.tup.n:'')+(e.tie?'~':'')+(e.keys?e.keys.join('+')+e.voice+(e.flam?'f':''):'')+(e.artic.length?'<'+e.artic.join():'')).join(' ')+'|'+RP.score.pickLen`;
  const tap = lv => c.ev(`(()=>{const d=document.querySelector('#setBox'); if(d) d.open=true; document.querySelectorAll('#levelSeg button')[${lv - 1}].click();
    return JSON.stringify({lv:RP.set.level, rv:RP.set.rv, seed:RP.set.seed, fp:${fp}, info:document.querySelector('#scoreInfo').textContent, ph:!!document.querySelector('#score .placeholder'), ox:document.documentElement.scrollWidth-innerWidth})})()`);
  const a = JSON.parse(await tap(5));
  console.log('after tap 5', a.rv, a.seed, a.info);
  if (a.rv !== 2 || a.seed !== 4242) bad.push('tap should switch to rv 2 keeping seed');
  // ② 조합
  const pick = (sel, v) => `(()=>{const el=document.querySelector('${sel}'); el.value='${v}'; el.dispatchEvent(new Event('change',{bubbles:true}));})()`;
  for (const mode of ['rhythm', 'melody', 'kit']) for (const meter of ['4/4', '2/4', '6/8', '12/8', '2/2']) for (const bpm of [88, 160]) {
    await c.ev(`(()=>{Object.assign(RP.set,{mode:'${mode === 'melody' ? 'melody' : 'rhythm'}',drum:'${mode === 'kit' ? 'kit' : ''}',prac:'',seed:${7000 + bpm}}); RP.syncForm(); RP.rebuild();})()`);
    await c.ev(pick('#meter', meter)); await c.ev(pick('#pickup', 'off')); await c.ev(pick('#artic', 'none'));
    await c.ev(`(()=>{const el=document.querySelector('#bpmNum'); el.value='${bpm}'; el.dispatchEvent(new Event('input',{bubbles:true})); el.dispatchEvent(new Event('change',{bubbles:true}));})()`);
    const rows = [];
    for (let lv = 1; lv <= 7; lv++) rows.push(JSON.parse(await tap(lv)));
    const same = [];
    for (let l = 1; l < 7; l++) if (rows[l].fp === rows[l - 1].fp) { same.push(l + '-' + (l + 1)); if (bpm <= 88 || !/빠르기를 낮추면/.test(rows[l].info)) bad.push({ mode, meter, bpm, pair: l + '-' + (l + 1), info: rows[l].info }); }
    for (const r of rows) { if (r.ph) bad.push({ mode, meter, bpm, lv: r.lv, err: 'placeholder' }); if (r.ox > 0) bad.push({ mode, meter, bpm, lv: r.lv, overflowX: r.ox }); if (r.rv !== 2) bad.push({ mode, meter, lv: r.lv, rv: r.rv }); }
    const hints = rows.filter(r => /빠르기를 낮추면/.test(r.info)).map(r => r.lv);
    console.log(mode.padEnd(6), meter.padEnd(5), 'bpm', bpm, 'same', JSON.stringify(same), 'hint at', JSON.stringify(hints), 'bpmSet', await c.ev('RP.set.bpm'));
    if (mode === 'rhythm' && meter === '6/8' && bpm === 88) for (const lv of [3, 4, 5, 6, 7]) { await tap(lv); await c.shotEl('lvm-68-' + lv + '.png', '#score'); }
    if (mode === 'rhythm' && meter === '2/2' && bpm === 88) for (const lv of [4, 7]) { await tap(lv); await c.shotEl('lvm-22-' + lv + '.png', '#score'); }
    if (mode === 'kit' && meter === '6/8' && bpm === 88) for (const lv of [5, 6]) { await tap(lv); await c.shotEl('lvm-kit68-' + lv + '.png', '#score'); }
  }
  const errs = c.logs.filter(l => /EXC|error/i.test(l));
  console.log('bad', JSON.stringify(bad.slice(0, 10)), bad.length);
  console.log('errs', JSON.stringify(errs.slice(0, 5)));
};
