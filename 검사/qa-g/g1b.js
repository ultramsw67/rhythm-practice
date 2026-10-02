// 깨끗한 상태(첫 사용자)에서 녹음만 — 점수 비교. MODE env: plain | shot | tap | sync
const SET = { gen: 3, mode: 'melody', prac: '', seed: 777, inst: 'clarinet', key: 'Bb', kref: '', meter: '4/4', level: 2, bars: 4, bpm: 96, artic: 'auto', pickup: 'auto', drum: '', bow: '', edits: {} };
module.exports = async (c) => {
  const B = 'http://127.0.0.1:8765/', M = process.env.MODE || 'plain';
  await c.size(390, 844); await c.go(B);
  if (process.env.CLEAR) { await c.ev(`(async()=>{ localStorage.clear(); for (const d of await indexedDB.databases()) indexedDB.deleteDatabase(d.name); return 1; })()`); await c.go(B); }
  await c.ev(`(()=>{ Object.assign(RP.set, ${JSON.stringify(SET)}); ${M === 'sync' ? 'RP.syncForm();' : ''} RP.rebuild(); document.querySelector('#countIn').value='1'; })()`);
  await c.ev(`document.querySelector('#recBtn').click()`);
  if (M === 'shot') { await c.sleep(1500); await c.shot('qa-g/g1b-rec.png', false); }
  if (M === 'tap') { await c.sleep(1500); const p = await c.ev(`(()=>{const r=document.querySelector('nav.tabs [data-tab=library]').getBoundingClientRect(); return {x:r.left+r.width/2,y:r.top+r.height/2}})()`); for (const type of ['mousePressed','mouseReleased']) await c.send('Input.dispatchMouseEvent',{type,x:p.x,y:p.y,button:'left',clickCount:1}); }
  let st = '';
  for (let i = 0; i < 60; i++) { await c.sleep(1000); st = await c.ev(`document.querySelector('#recStatus').textContent`); if (/점 —|오류|못|않|멈췄/.test(st)) break; }
  console.log(M, JSON.stringify(await c.ev(`({ st: document.querySelector('#recStatus').textContent, cap: RPX.lastCap, matched: RPX.take && RPX.take.result.matched, lat: localStorage.getItem('rp.latency') })`)));
};
