// 실제 주소에서 확인: 악보·가상 연주 채점·녹음(가짜 마이크)
const URL0 = process.env.URL0 || 'https://ultramsw67.github.io/rhythm-practice/';
module.exports = async (c) => {
  await c.size(390, 844);
  await c.go(URL0);
  await c.sleep(1500);
  const a = await c.ev(`({ secure: isSecureContext, vex: !!(window.Vex && (Vex.Flow||Vex).Stave), svg: !!document.querySelector('#score svg'), info: document.querySelector('#scoreInfo').textContent })`);
  console.log('load', JSON.stringify(a));
  await c.shot('live-practice.png');
  const b = await c.ev(`(async()=>{ document.querySelector('#selfPerfect').click(); await new Promise(r=>setTimeout(r,3000)); return document.querySelector('#resTotal').textContent })()`);
  console.log('self perfect', b);
  if (process.env.SET) {
    await c.ev(`(()=>{ document.querySelector('nav.tabs [data-tab=practice]').click(); Object.assign(RP.set, ${process.env.SET}); RP.rebuild(); document.querySelector('#countIn').value='1'; document.querySelector('#recBtn').click(); })()`);
    let st = '';
    for (let i = 0; i < 60; i++) { await c.sleep(1000); st = await c.ev(`document.querySelector('#recStatus').textContent`); if (/점 —|오류|못|않|멈췄/.test(st)) break; }
    console.log('record', st);
  }
};
