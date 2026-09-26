module.exports = async (c) => {
  await c.size(390, 844, true);
  const B = 'http://127.0.0.1:8773/';
  await c.go(B);
  const out = {};

  // 1) 테마·설정 저장 후 새로고침해도 유지되는지
  await c.ev(`document.querySelector('#themeBtn').click()`); // auto -> light
  await c.ev(`document.querySelector('#themeBtn').click()`); // light -> dark
  await c.ev(`(()=>{RP.set.bpm=150; document.querySelector('#bpmNum').value=150; document.querySelector('#bpmNum').dispatchEvent(new Event('change'));})()`);
  await c.sleep(300);
  await c.ev(`document.querySelector('#metroOn').click()`); // 메트로놈 소리 끄기
  await c.ev(`(()=>{document.querySelector('#countIn').value='2'; document.querySelector('#countIn').dispatchEvent(new Event('change'));})()`);
  await c.ev(`(()=>{document.querySelector('#listen').value='spk'; document.querySelector('#listen').dispatchEvent(new Event('change'));})()`);
  await c.ev(`(()=>{document.querySelector('#latRange').value=120; document.querySelector('#latRange').dispatchEvent(new Event('input'));})()`);
  const before = await c.ev(`({theme: document.documentElement.getAttribute('data-theme'), themeBtn: document.querySelector('#themeBtn').textContent, bpm: RP.set.bpm, metro: document.querySelector('#metroOn').checked, countIn: document.querySelector('#countIn').value, listen: document.querySelector('#listen').value, latency: JSON.parse(localStorage.getItem('rp.latency'))})`);
  out.before = before;
  await c.go(B); // 새로고침
  const after = await c.ev(`({theme: document.documentElement.getAttribute('data-theme'), themeBtn: document.querySelector('#themeBtn').textContent, bpm: RP.set.bpm, metro: document.querySelector('#metroOn').checked, countIn: document.querySelector('#countIn').value, listen: document.querySelector('#listen').value, latNow: document.querySelector('#latNow').textContent})`);
  out.afterReload = after;

  // 2) 해시 쓰레기값
  await c.go(B + '#!!!not-a-valid-thing$$$');
  await c.sleep(200);
  out.garbageHash = await c.ev(`({toast: document.querySelector('#toast').textContent, hash: location.hash, appAlive: !!RP.score})`);

  // 3) 뒤로/앞으로 가기
  await c.go(B);
  await c.go(B + '#tab-result-nonsense');
  await c.send('Page.navigateToHistoryEntry', {}).catch(()=>{});
  // 대신 JS 로 back/forward 수행
  await c.ev(`history.back()`);
  await c.sleep(300);
  const backState = await c.ev(`({url: location.href, appAlive: !!RP.score, errCount: 0})`);
  await c.ev(`history.forward()`);
  await c.sleep(300);
  const fwdState = await c.ev(`({url: location.href, appAlive: !!RP.score})`);
  out.backForward = { backState, fwdState };

  console.log(JSON.stringify(out, null, 1));
  console.log('CONSOLE_LOGS_SNAPSHOT_MARK');
};
