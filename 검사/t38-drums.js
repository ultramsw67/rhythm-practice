// v3.2 타악기: 소리 크기(이어폰·휴대폰 스피커 흉내)·찢어짐·악센트 대비, 마디마다 소리, 화면(고르기·기호 창·악보 캡처), 가상 연주 100
module.exports = async (c) => {
  await c.size(390, 844, true);
  await c.go(process.env.URL0 || 'http://127.0.0.1:' + (process.env.PORT || 8765) + '/');
  await c.ev(`localStorage.setItem('rp.startSeen','true')`);
  const r = await c.ev(`(async()=>{
    const out = { level: {}, bars: [], errs: [] };
    window.addEventListener('error', e => out.errs.push(String(e.message)));
    const sr = 44100;
    const rms = (x, a, b) => { let s = 0; for (let i = a; i < b; i++) s += x[i]*x[i]; return 10*Math.log10(s/(b-a) + 1e-12); };
    for (const kind of ['snare','bass','cymbal','hat','tom_h','tom_m','tom_f']) {
      for (const phone of [false, true]) {
        const oc = new OfflineAudioContext(1, sr*3, sr); let dest = oc.destination;
        if (phone) { const h1=oc.createBiquadFilter(); h1.type='highpass'; h1.frequency.value=500; const h2=oc.createBiquadFilter(); h2.type='highpass'; h2.frequency.value=500; h1.connect(h2).connect(oc.destination); dest=h1; }
        const m = oc.createGain(); m.gain.value = 0.9; m.connect(dest); const o = RPX.outChain(oc, m);
        RPX.drumHit(oc, o, kind, 0.1, { peak: 1, len: 0.3 });
        RPX.drumHit(oc, o, kind, 1.1, { peak: 2, len: 0.3 });
        RPX.drumHit(oc, o, kind, 2.1, { peak: 2.4, len: 0.3 });
        const x = (await oc.startRendering()).getChannelData(0);
        let mx = 0; for (const v of x) mx = Math.max(mx, Math.abs(v));
        const L = [0.1, 1.1, 2.1].map(t => +rms(x, Math.round(t*sr), Math.round((t+0.1)*sr)).toFixed(1));
        out.level[kind + (phone ? ' phone' : ' ear')] = { first100ms: L, accDb: +(L[1]-L[0]).toFixed(1), marcDb: +(L[2]-L[0]).toFixed(1), peak: +mx.toFixed(2) };
      }
    }
    // 실제 악보를 마디마다 (모든 단계)
    for (const drum of ['snare','bass','cymbal','kit']) for (let lv = 1; lv <= 7; lv += 3) {
      const S = { gen:2, drum, mode:'rhythm', level:lv, meter:'4/4', bars:4, key:'C', inst:'clarinet', bpm:100, pickup:'off', artic:'auto', seed: 50+lv, edits:{} };
      const sc = Core.generate(S), tl = Core.timeline(sc, 1);
      const oc = new OfflineAudioContext(1, Math.ceil((tl.total+1.6)*22050), 22050); const m = oc.createGain(); m.connect(oc.destination);
      const st = { i: 0 }; for (let u = 0.5; ; u += 0.5) { if (RPX.schedulePlayback(oc, RPX.outChain(oc, m), 0, tl, false, null, { st, until: u, drum }).done) break; }
      const x = (await oc.startRendering()).getChannelData(0);
      const bars = sc.measures.map(ms => { const ns = tl.notes.filter(n => sc.events[n.ev].mi === ms.mi); /* kit 도 같은 방식 */ if (!ns.length) return 'rest'; let mx = 0; for (let i = Math.floor(ns[0].t*22050); i < Math.floor((ns[ns.length-1].t+0.08)*22050); i++) mx = Math.max(mx, Math.abs(x[i])); return Math.round(20*Math.log10(mx+1e-9)); }); let pk = 0; for (const v of x) pk = Math.max(pk, Math.abs(v)); if (drum === 'kit') out.kitPeak = Math.max(out.kitPeak || 0, +pk.toFixed(2));
      const artic = [...new Set(sc.events.flatMap(e => e.artic))];
      out.bars.push(drum + ' lv' + lv + ' ' + JSON.stringify(bars) + ' artic ' + artic.join(','));
    }
    // 화면: 리듬 모드에서 고르기
    Object.assign(RP.set, { gen:2, mode:'rhythm', level:5, meter:'4/4', bars:4, pickup:'off', artic:'manual', seed:77, edits:{} }); RP.rebuild();
    const d = document.querySelector('details'); if (d) d.open = true;
    const sel = document.querySelector('#drum'); sel.value = 'snare'; sel.dispatchEvent(new Event('change'));
    out.ui = { drum: RP.set.drum, info: document.querySelector('#scoreInfo').textContent, rhyHidden: sel.closest('label').classList.contains('hide') };
    // 기호 창: 악센트·마르카토만
    const ev = RP.score.events.find(e => !e.rest); const el = document.getElementById('vf-ev' + ev.id);
    if (el) { const q = el.getBoundingClientRect(); document.querySelector('#score').dispatchEvent(new MouseEvent('click', { bubbles: true, clientX: q.x + q.width/2, clientY: q.y + q.height/2 })); }
    out.ui.chips = [...document.querySelectorAll('#sheetChips .chip')].map(b => b.textContent).join('/');
    document.querySelector('#sheetClose').click();
    // 선율 모드에서는 숨김
    document.querySelector('#modeSeg button[data-v="melody"]').click();
    out.ui.hiddenInMelody = sel.closest('label').classList.contains('hide');
    document.querySelector('#modeSeg button[data-v="rhythm"]').click();
    out.ui.backDrum = RP.set.drum;
    // 공유 링크 왕복
    const s1 = Core.decodeSet(Core.encodeSet(RP.set), {}); out.ui.link = s1.drum;
    // 가상 연주 채점
    await RPX.selfTest(); await new Promise(r=>setTimeout(r,2500)); out.self = document.querySelector('#resTotal').textContent;
    return out;
  })()`);
  console.log(JSON.stringify(r, null, 1));
  await c.ev(`document.querySelector('nav.tabs [data-tab=practice]').click()`); await c.sleep(400);   // 가상 연주 뒤 결과 탭에 있으므로 연습 탭으로
  await c.shotEl('drum-score.png', '#score');
};
