module.exports = async (c) => {
  await c.size(390, 844, true);
  const B = 'http://127.0.0.1:8773/';
  await c.go(B);
  const code = await c.ev(`(()=>{ const s = Object.assign({}, RP.set, {mode:'melody', meter:'6/8', bars:8, level:2, inst:'trombone', key:'F', bpm:100, pickup:'on', edits:{}}); return btoa(unescape(encodeURIComponent(Core.encodeSet(s)))); })()`);
  console.log('code len', code.length);
  const url = B + '#' + code;
  await c.go(url);
  await c.sleep(300);
  const r = await c.ev(`({toast: document.querySelector('#toast').textContent, hash: location.hash, mode: RP.set.mode, meter: RP.set.meter, bars: RP.set.bars, inst: RP.set.inst, key: RP.set.key, bpm: RP.set.bpm, scoreOk: !!RP.score, events: RP.score.events.length})`);
  console.log('share-open-existing-profile', JSON.stringify(r, null, 1));
  // 새로고침해도 유지되는지 (공유 설정이 저장됐는지)
  await c.go(B);
  const r2 = await c.ev(`({mode: RP.set.mode, meter: RP.set.meter, inst: RP.set.inst})`);
  console.log('after-plain-reload', JSON.stringify(r2));
  console.log('URL_FOR_FRESH_TEST=' + url);
};
