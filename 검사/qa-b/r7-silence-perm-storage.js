// R7: (1) 무음 녹음 -> "소리가 거의 녹음되지 않았습니다" (2) 마이크 권한 거부 -> 오류 메시지, UI 안 멈춤 (3) 저장소 불가 -> 메모리 대체
const SET = require('./sets.json').rhythm4;
module.exports = async (c) => {
  await c.size(390, 844);
  await c.go('http://127.0.0.1:8772/');
  await c.ev(`(()=>{ indexedDB.deleteDatabase('rhythm-practice'); localStorage.clear(); })()`);
  await c.go('http://127.0.0.1:8772/');
  await c.ev(`(()=>{ Object.assign(RP.set, ${JSON.stringify(SET)}); RP.rebuild(); document.querySelector('#countIn').value='1'; document.querySelector('#metroOn').checked=true; document.querySelector('#listen').value='ear'; })()`);
  const out = {};
  out.dbBefore = await c.ev(`(async()=>(await RPX.DB.all()).length)()`);
  // 1) 무음 녹음 (실제 페이크 마이크, 첫 사용)
  await c.ev(`document.querySelector('#recBtn').click()`);
  let st = '';
  for (let i = 0; i < 40; i++) { await c.sleep(1000); st = await c.ev(`document.querySelector('#recStatus').textContent`); if (/점 —|오류|못|않|멈췄|거의/.test(st)) break; }
  out.silenceStatus = st;
  out.dbAfterSilence = await c.ev(`(async()=>(await RPX.DB.all()).length)()`);
  out.recBtnAfterSilence = await c.ev(`document.querySelector('#recBtn').textContent`);
  out.canRecordAgain = await c.ev(`document.querySelector('#recBtn').disabled`);
  // 2) 마이크 권한 거부 (getUserMedia 를 직접 흉내)
  await c.ev(`(()=>{ navigator.mediaDevices.getUserMedia = () => Promise.reject(Object.assign(new Error('denied'), { name: 'NotAllowedError' })); })()`);
  await c.ev(`document.querySelector('#recBtn').click()`);
  await c.sleep(500);
  out.permDeniedStatus = await c.ev(`document.querySelector('#recStatus').textContent`);
  out.recBtnAfterDenied = await c.ev(`document.querySelector('#recBtn').textContent`);
  out.recBtnDisabledAfterDenied = await c.ev(`document.querySelector('#recBtn').disabled`);
  // 원상 복구 확인: 다시 정상적으로 시도 가능한 상태인지 (버튼이 잠기지 않았는지)
  out.dbAfterDenied = await c.ev(`(async()=>(await RPX.DB.all()).length)()`);
  console.log(JSON.stringify(out, null, 1));
};
