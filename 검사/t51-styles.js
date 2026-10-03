// v3.9.2 리듬 스타일·조표 기준 칸·점수 보너스 화면 확인 (2026-10-03)
// 스타일마다 화면 칸으로 고르기 → 박자표·빠르기 맞춰지는지, 다른 박자표는 잠기는지, 악보가 잘리지 않는지(W 폭), 빠르기 표시 글자,
// 드럼 세트·스네어로도 그려지는지, 들어보기, 가상 연주 100, 링크 왕복, 리듬 모드에서만 보이는지
// + 조표 기준 칸: C 악기·더블베이스도 보이고 잠김 / 클라리넷은 고를 수 있음 + 결과의 연습 보너스 글자
module.exports = async (c) => {
  const W = +(process.env.W || 390);
  await c.size(W, 900, true);
  await c.go('http://127.0.0.1:' + (process.env.PORT || 8765) + '/');
  await c.ev(`localStorage.setItem('rp.startSeen','true')`);
  await c.go('http://127.0.0.1:' + (process.env.PORT || 8765) + '/?t=2');
  await c.ev(`(()=>{window.__e=[];window.addEventListener('error',e=>__e.push(e.message));const oe=console.error;console.error=(...a)=>{__e.push(a.map(String).join(' '));oe(...a)};return 1})()`);
  const bad = [];
  const styles = await c.ev(`Object.keys(Core.STYLES)`);
  await c.ev(`(()=>{Object.assign(RP.set,{mode:'rhythm',drum:'',level:3,bars:4,artic:'auto',seed:11,edits:{}});RP.syncForm();RP.rebuild();return 1})()`);
  const vis = await c.ev(`(()=>{const l=document.getElementById('style').closest('label');return !l.classList.contains('hide') && l.offsetParent!==null})()`);
  if (!vis) bad.push('styleHiddenInRhythm');
  for (const k of styles) for (const drum of ['', 'kit', 'snare']) {
    const r = await c.ev(`(async()=>{const sel=document.getElementById('style'); sel.value='${k}'; sel.dispatchEvent(new Event('change'));
      const dr=document.getElementById('drum'); dr.value='${drum}'; dr.dispatchEvent(new Event('change'));
      await new Promise(r=>setTimeout(r,120));
      const S=Core.STYLES['${k}'], svg=document.querySelector('#score svg'), ph=document.querySelector('#score .placeholder');
      const Wd=svg?+svg.getAttribute('width'):0, bb=svg?svg.getBBox():null, kk=svg&&svg.viewBox.baseVal&&svg.viewBox.baseVal.width?Wd/svg.viewBox.baseVal.width:1;
      const dis=[...document.getElementById('meter').options].filter(o=>o.disabled).map(o=>o.value);
      return {meter:RP.set.meter, bpm:RP.set.bpm, ok:S.meters.includes(RP.set.meter), dis, allowed:S.meters, styleNow:RP.score.style||'', svg:!!svg, ph:ph&&ph.textContent, over:bb?Math.round((bb.x+bb.width)*kk-Wd):null,
        tempo:[...document.querySelectorAll('#score text')].map(t=>t.textContent).join(' ').includes(S.mark), info:document.getElementById('scoreInfo').textContent, hint:document.getElementById('levelHint').textContent, overX:document.documentElement.scrollWidth-innerWidth}})()`);
    const ok = r.ok && r.svg && !r.ph && r.over <= 2 && r.styleNow === k && r.overX <= 0 && r.dis.length === 9 - r.allowed.length && r.hint.includes(await c.ev(`Core.STYLES['${k}'].name`));
    if (!ok) bad.push([k, drum, r]);
    if (drum === '') console.log(k, r.meter, r.bpm, 'tempoText', r.tempo, '| ' + r.info.slice(0, 90));
    // 다른 허용 박자표도
    for (const m of r.allowed.slice(1)) {
      const r2 = await c.ev(`(async()=>{const me=document.getElementById('meter'); me.value='${m}'; me.dispatchEvent(new Event('change')); await new Promise(r=>setTimeout(r,80));
        const svg=document.querySelector('#score svg'); const bb=svg?svg.getBBox():null, Wd=svg?+svg.getAttribute('width'):0, kk=svg&&svg.viewBox.baseVal&&svg.viewBox.baseVal.width?Wd/svg.viewBox.baseVal.width:1;
        return {style:RP.score.style||'', meter:RP.score.M.num+'/'+RP.score.M.den, over:bb?Math.round((bb.x+bb.width)*kk-Wd):null}})()`);
      if (r2.style !== k || r2.meter !== m || r2.over > 2) bad.push([k, drum, m, r2]);
      if (m === '2/2') { const bp = await c.ev(`RP.set.bpm`), want = await c.ev(`(Core.STYLES['${k}'].bpmBy||{})['2/2']||Core.STYLES['${k}'].bpm`); if (bp !== want) bad.push(['bpm22', k, bp, want]); const me = await c.ev(`(()=>{const s=document.getElementById('meter'); s.value=Core.STYLES['${k}'].meters[0]; s.dispatchEvent(new Event('change')); return RP.set.bpm})()`); if (me !== (await c.ev(`(Core.STYLES['${k}'].bpmBy||{})[Core.STYLES['${k}'].meters[0]]||Core.STYLES['${k}'].bpm`))) bad.push(['bpmBack', k, me]); }
    }
    if (drum === '' || drum === 'kit') await c.shotEl(`style-${k}${drum ? '-kit' : ''}.png`, '#score');
  }
  // 들어보기 (스윙 드럼 세트·보사노바)
  for (const [k, drum] of [['swing', 'kit'], ['bossa', ''], ['march', 'snare']]) {
    const p = await c.ev(`(async()=>{const sel=document.getElementById('style'); sel.value='${k}'; sel.dispatchEvent(new Event('change')); const dr=document.getElementById('drum'); dr.value='${drum}'; dr.dispatchEvent(new Event('change'));
      document.querySelector('#playBtn').click(); let now=0; for(let i=0;i<14&&!now;i++){await new Promise(r=>setTimeout(r,400)); now=document.querySelectorAll('#score .now, #score .done').length;} document.querySelector('#playBtn').click(); await new Promise(r=>setTimeout(r,300)); return {now, btn:document.querySelector('#playBtn').textContent}})()`);
    console.log('play', k, drum, JSON.stringify(p));
    if (!p.now || !/들어보기/.test(p.btn)) bad.push(['play', k, drum, p]);
  }
  // 가상 연주 100 (스윙·셔플·탱고·삼바, 박자 소리)
  for (const k of ['swing', 'shuffle', 'tango', 'samba', 'ballad']) {
    const s = await c.ev(`(async()=>{document.querySelector('nav.tabs [data-tab=practice]').click(); const sel=document.getElementById('style'); sel.value='${k}'; sel.dispatchEvent(new Event('change')); const dr=document.getElementById('drum'); dr.value=''; dr.dispatchEvent(new Event('change'));
      const L=document.querySelector('#levelSeg button[data-v="5"]'); L.click(); await new Promise(r=>setTimeout(r,100));
      document.querySelector('nav.tabs [data-tab=settings]').click(); document.getElementById('selfPerfect').click(); await new Promise(r=>setTimeout(r,6000));
      return {total:document.getElementById('resTotal').textContent, parts:document.getElementById('resParts').textContent.slice(-60)}})()`);
    console.log('self', k, JSON.stringify(s));
    if (s.total !== '100') bad.push(['self', k, s]);
  }
  // 선율 모드에서 박자표를 바꾸고 돌아오면 스타일 칸도 '없음' (v3.9.2 코드 검토)
  const mm = await c.ev(`(async()=>{document.querySelector('#modeSeg button[data-v="rhythm"]').click(); const sel=document.getElementById('style'); sel.value='swing'; sel.dispatchEvent(new Event('change')); document.querySelector('#modeSeg button[data-v="melody"]').click(); const me=document.getElementById('meter'); me.value='3/4'; me.dispatchEvent(new Event('change')); document.querySelector('#modeSeg button[data-v="rhythm"]').click(); await new Promise(r=>setTimeout(r,80)); return {sel:sel.value, style:RP.set.style, sc:RP.score.style||''}})()`);
  console.log('modeMeter', JSON.stringify(mm)); if (mm.sel !== '' || mm.style !== '' || mm.sc) bad.push(['modeMeter', mm]);
  // 링크 왕복 + 선율 모드에서는 숨김·무시
  const lk = await c.ev(`(()=>{Object.assign(RP.set,{mode:'rhythm',style:'waltz',meter:'3/4',drum:''}); RP.rebuild(); const code=Core.encodeSet(RP.set); const back=Core.decodeSet(code,{});
    document.querySelector('#modeSeg button[data-v="melody"]').click(); const hid=document.getElementById('style').closest('label').classList.contains('hide');
    return {z:JSON.parse(code).z, back:back.style, hid, melStyle:RP.score.style||''}})()`);
  console.log('link', JSON.stringify(lk));
  if (lk.z !== 'waltz' || lk.back !== 'waltz' || !lk.hid || lk.melStyle) bad.push(['link', lk]);
  // 조표 기준 칸 (v3.9.2): C 악기·더블베이스 보이고 잠김, 클라리넷은 고를 수 있음
  for (const [inst, locked] of [['c_treble', true], ['flute', true], ['contrabass', true], ['clarinet', false], ['alto_sax', false]]) {
    const r = await c.ev(`(async()=>{const s=document.getElementById('inst'); s.value='${inst}'; s.dispatchEvent(new Event('change')); await new Promise(r=>setTimeout(r,60)); const k=document.getElementById('kref'); const l=k.closest('label');
      return {shown:!l.classList.contains('hide'), disabled:k.disabled, val:k.value, text:k.options[k.selectedIndex].text, hint:document.getElementById('keyHint').textContent.slice(0,80)}})()`);
    console.log('kref', inst, JSON.stringify(r));
    if (!r.shown || r.disabled !== locked || (locked && r.val !== 'same')) bad.push(['kref', inst, r]);
  }
  await c.shot(`kref-c-instrument.png`, false);
  // 결과 보너스 글자: 흔들린 가상 연주
  const b = await c.ev(`(async()=>{document.querySelector('#modeSeg button[data-v="rhythm"]').click(); const sel=document.getElementById('style'); sel.value=''; sel.dispatchEvent(new Event('change'));
    document.querySelector('nav.tabs [data-tab=settings]').click(); document.getElementById('selfSloppy').click(); await new Promise(r=>setTimeout(r,6000)); return document.getElementById('resParts').textContent.slice(-80)})()`);
  console.log('bonus', b);
  if (!/연습 보너스|합계 100점/.test(b)) bad.push(['bonus', b]);
  const errs = await c.ev(`__e`);
  console.log('errs', JSON.stringify(errs));
  console.log('bad', JSON.stringify(bad).slice(0, 2500), bad.length);
};
