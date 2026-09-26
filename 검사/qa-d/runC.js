// Recording lock: real click (Input.dispatchMouseEvent) on dimmed controls must NOT work. Keyboard activation probe too.
// Also: highlight during recording, ↺ 처음부터 state machine.
const fs = require('fs'), path = require('path');
const OUT = __dirname;
const SET = { mode: 'melody', level: 1, meter: '4/4', bars: 4, key: 'C', inst: 'flute', bpm: 90, pickup: 'off', artic: 'auto', seed: 12, edits: {} };
async function realClick(c, sel) {
  const r = await c.ev(`(()=>{const e=document.querySelector(${JSON.stringify(sel)}); if(!e) return null; const b=e.getBoundingClientRect(); return {x:b.left+b.width/2, y:b.top+b.height/2};})()`);
  if (!r) return 'NO_EL';
  await c.send('Input.dispatchMouseEvent', { type: 'mousePressed', x: r.x, y: r.y, button: 'left', clickCount: 1 });
  await c.send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: r.x, y: r.y, button: 'left', clickCount: 1 });
  return 'DISPATCHED';
}
module.exports = async (c) => {
  await c.size(390, 844, true);
  await c.go(process.env.URL0 || 'http://127.0.0.1:' + (process.env.PORT || 8781) + '/');
  await c.ev(`document.querySelector('#startClose').click()`);
  const out = {};
  await c.ev(`(()=>{ Object.assign(RP.set, ${JSON.stringify(SET)}); RP.rebuild(); document.querySelector('#countIn').value='1'; })()`);
  out.seedBefore = await c.ev(`RP.set.seed`);
  await c.ev(`document.querySelector('#recBtn').click()`);
  await c.sleep(1200); // still mid-recording (count-in + notes)

  out.highlightDuringRec = await c.ev(`({ now: document.querySelectorAll('#score .now').length, done: document.querySelectorAll('#score .done').length, recording: document.body.classList.contains('recording') })`);

  // real mouse clicks on dimmed controls
  await realClick(c, '#newBtn');
  await c.sleep(150);
  out.seedAfterNewBtnRealClick = await c.ev(`RP.set.seed`);

  await realClick(c, '#playBtn');
  await c.sleep(150);
  out.playLabelAfterPlayBtnRealClick = await c.ev(`document.querySelector('#playBtn').textContent`);

  const tabRes = await realClick(c, 'nav.tabs [data-tab=library]');
  await c.sleep(150);
  out.tabAfterLibraryRealClick = await c.ev(`document.querySelector('[data-tab=practice]').getAttribute('aria-selected')`);

  // keyboard activation probe: focus + Enter/Space on #newBtn
  out.kbd = await c.ev(`(()=>{ const b=document.querySelector('#newBtn'); b.focus(); return document.activeElement===b; })()`);
  await c.send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Enter', code: 'Enter' });
  await c.send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Enter', code: 'Enter' });
  await c.sleep(150);
  out.seedAfterEnterKey = await c.ev(`RP.set.seed`);

  // ↺ 처음부터 during recording
  out.restartVisible = await c.ev(`!document.querySelector('#recRestart').classList.contains('hide')`);
  await c.ev(`document.querySelector('#recRestart').click()`);
  await c.sleep(400);
  out.stillRecordingAfterRestart = await c.ev(`document.body.classList.contains('recording')`);
  out.recStatusAfterRestart = await c.ev(`document.querySelector('#recStatus').textContent`);

  // let it finish naturally or stop
  await c.ev(`document.querySelector('#recBtn').click()`).catch(()=>{});
  await c.sleep(600);
  out.finalRecordingFlag = await c.ev(`document.body.classList.contains('recording')`);
  out.libCountAfterStopNoSave = await c.ev(`(()=>{document.querySelector('[data-tab=library]').click(); return document.querySelectorAll('.take').length;})()`);

  console.log(JSON.stringify(out, null, 1));
};
