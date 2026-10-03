module.exports = async (c) => {
  await c.size(320, 700, true);
  await c.go('http://127.0.0.1:8765/?q=' + Date.now());
  await c.sleep(300);
  console.log(await c.ev(`JSON.stringify({set:RP.set, txt:[...document.querySelectorAll('#score svg text')].map(t=>t.textContent+'@'+Math.round(t.getBoundingClientRect().left)+'-'+Math.round(t.getBoundingClientRect().right)).join(' | ')})`));
  await c.shotEl('h11-320-melody-score.png', '#score');
  // 스윙 스타일 320 템포 표시
  await c.ev(`(async()=>{document.querySelector('#modeSeg button[data-v="rhythm"]').click(); for (const k of ['ballad','bossa','latin']) {const s=document.getElementById('style'); s.value=k; s.dispatchEvent(new Event('change'));} await new Promise(r=>setTimeout(r,200));})()`);
  await c.shotEl('h11-320-latin.png', '#score');
};
