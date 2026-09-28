module.exports = async (c) => {
  await c.size(390, 844);
  await c.go('http://127.0.0.1:8765/');
  await c.ev(`localStorage.setItem('rp.set', JSON.stringify(Object.assign({}, RP.set, {gen:0, level:2})))`);
  await c.go('http://127.0.0.1:8765/');
  console.log('gen0', await c.ev(`RP.set.gen+' '+RP.set.level+' | '+document.querySelector('#levelHint').textContent+' | pressed '+document.querySelectorAll('#levelSeg [aria-pressed=true]').length`));
  const o = await c.ev(`(()=>{const s=JSON.parse(localStorage.getItem('rp.set'));delete s.gen;s.level=3;localStorage.setItem('rp.set',JSON.stringify(s));return 1})()`);
  await c.go('http://127.0.0.1:8765/');
  console.log('v2.9 saved', await c.ev(`RP.set.gen+' '+RP.set.level+' | '+document.querySelector('#levelHint').textContent`));
  await c.go('http://127.0.0.1:8765/#' + encodeURIComponent(JSON.stringify({ m: 'r', t: '4/4', l: 2, b: 4, k: 'C', s: 77, v: 90 })));
  console.log('old link', await c.ev(`RP.set.gen+' '+RP.set.level+' | '+document.querySelector('#levelHint').textContent`));
  await c.ev(`document.querySelectorAll('#levelSeg button')[6].click()`);
  console.log('after click', await c.ev(`RP.set.gen+' '+RP.set.level+' | '+document.querySelector('#setSum').textContent`));
};
