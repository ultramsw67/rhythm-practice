// v3.7 음계 연습·조표 기준(내 악보): 설정 칸 보이기/숨기기, 조 옮김, 악보 그리기(390·320px), 잘림·오류, 가상 연주 100, 들어보기
module.exports = async (c) => {
  const W = +(process.env.W || 390);
  await c.size(W, 900, true);
  await c.go('http://127.0.0.1:' + (process.env.PORT || 8765) + '/');
  await c.ev(`localStorage.setItem('rp.startSeen','true'); window.__errs=[]; window.addEventListener('error',e=>__errs.push(String(e.message)));`);
  const base = `{gen:2,drum:'',bow:'',kref:'',prac:'scale',minor:'h',mode:'melody',level:1,meter:'4/4',bars:4,key:'Bb',inst:'clarinet',pickup:'auto',artic:'auto',bpm:90,seed:5,edits:{}}`;
  // 1) 설정 칸
  const ui = await c.ev(`(async()=>{
    const vis = s => !document.querySelector(s).closest('label').classList.contains('hide');
    document.querySelector('#modeSeg [data-v=melody]').click(); await new Promise(r=>setTimeout(r,200));
    const a = { prac: vis('#prac'), bars: vis('#bars'), kref: vis('#kref'), minor: vis('#minor') };
    const p = document.querySelector('#prac'); p.value='scale'; p.dispatchEvent(new Event('change')); await new Promise(r=>setTimeout(r,300));
    const b = { bars: vis('#bars'), pickup: vis('#pickup'), minor: vis('#minor'), sum: document.querySelector('#setSum').textContent, info: document.querySelector('#scoreInfo').textContent };
    const k = document.querySelector('#key'); k.value='Cm'; k.dispatchEvent(new Event('change')); await new Promise(r=>setTimeout(r,300));
    const cm = { minor: vis('#minor'), info: document.querySelector('#scoreInfo').textContent };
    const i = document.querySelector('#inst'); i.value='clarinet'; i.dispatchEvent(new Event('change'));
    k.value='Bb'; k.dispatchEvent(new Event('change')); await new Promise(r=>setTimeout(r,300));
    const kr = document.querySelector('#kref'); kr.value='w'; kr.dispatchEvent(new Event('change')); await new Promise(r=>setTimeout(r,300));
    const w = { key: RP.set.key, lbl: document.querySelector('#keyLbl').textContent, info: document.querySelector('#scoreInfo').textContent, hint: document.querySelector('#keyHint').textContent.slice(0,60), link: Core.encodeSet(RP.set) };
    kr.value=''; kr.dispatchEvent(new Event('change')); await new Promise(r=>setTimeout(r,300));
    const back = { key: RP.set.key, lbl: document.querySelector('#keyLbl').textContent };
    i.value='flute'; i.dispatchEvent(new Event('change')); await new Promise(r=>setTimeout(r,300));
    const fl = { kref: vis('#kref') };
    p.value=''; p.dispatchEvent(new Event('change')); await new Promise(r=>setTimeout(r,300));
    const mel = { bars: vis('#bars'), info: document.querySelector('#scoreInfo').textContent };
    return JSON.stringify({ a, b, cm, w, back, fl, mel });
  })()`);
  console.log('ui', ui);
  // 2) 여러 설정으로 그리기 + 잘림 + 가상 연주
  const cases = [
    ['clarinet', 1, '4/4', 'Bb', 'h', ''], ['clarinet', 4, '4/4', 'Bb', 'h', ''], ['alto_sax', 6, '6/8', 'Eb', 'h', ''], ['flute', 7, '4/4', 'F', 'h', ''],
    ['trumpet', 5, '3/4', 'Gm', 'm', ''], ['horn', 3, '7/8', 'Cm', 'n', 'w'], ['tuba', 2, '2/2', 'Bb', 'h', ''], ['trombone', 7, '12/8', 'Ab', 'h', ''],
    ['contrabass', 3, '4/4', 'F', 'h', ''], ['clarinet', 7, '5/4', 'F#m', 'm', 'w'], ['tenor_sax', 6, '9/8', 'Db', 'h', ''], ['c_treble', 4, '2/4', 'E', 'h', ''],
  ];
  const out = [];
  for (const [inst, level, meter, key, minor, kref] of cases) {
    const r = await c.ev(`(async()=>{Object.assign(RP.set,${base},{inst:'${inst}',level:${level},meter:'${meter}',key:'${key}',minor:'${minor}',kref:'${kref}',bow:'${inst === 'contrabass' ? 'mix' : ''}'});RP.syncForm&&RP.syncForm();RP.rebuild();
      await new Promise(r=>setTimeout(r,500));
      const host=document.querySelector('#score'), svg=host.querySelector('svg'); const hr=host.getBoundingClientRect();
      let over=0; for (const el of host.querySelectorAll('svg *')) { const b=el.getBoundingClientRect(); if (b.width && b.right>hr.right+1) over=Math.max(over, Math.round(b.right-hr.right)); }
      const ev=RP.score.events.filter(e=>!e.rest);
      await RPX.selfTest(false); const t=RPX.take; document.querySelector('nav.tabs button')?.click(); await new Promise(r=>setTimeout(r,300));
      return JSON.stringify({svg:!!svg, over, notes:ev.length, bars:RP.score.measures.length, info:document.querySelector('#scoreInfo').textContent, self:t&&t.result&&t.result.total, pageX: document.scrollingElement.scrollWidth - innerWidth})})()`);
    out.push(r);
    console.log(inst, level, meter, key, minor, kref || '-', r);
    if ([1, 4, 7].includes(level) || kref) await c.shotEl(`scale-${W}-${inst}-${level}${kref ? '-w' : ''}.png`, '#score');
  }
  // 3) 들어보기 (악기 소리)
  const snd = await c.ev(`(async()=>{Object.assign(RP.set,${base},{inst:'trumpet',level:2});RP.rebuild(); await RPX.loadSound('trumpet');
    document.querySelector('#playBtn').click(); await new Promise(r=>setTimeout(r,1500)); const b=document.querySelector('#playBtn').textContent; document.querySelector('#playBtn').click();
    return JSON.stringify({info:document.querySelector('#soundInfo').textContent, playBtn:b})})()`);
  console.log('sound', snd);
  console.log('errs', await c.ev(`JSON.stringify(window.__errs)`));
  await c.shot(`scale-page-${W}.png`);
};
