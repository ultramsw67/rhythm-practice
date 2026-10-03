module.exports = async (c) => {
  await c.size(320, 700, true);
  await c.go('http://127.0.0.1:8765/');
  await c.ev(`localStorage.setItem('rp.startSeen','true'); localStorage.setItem('rp.font','3'); localStorage.setItem('rp.theme','"dark"')`);
  await c.go('http://127.0.0.1:8765/?q=' + Date.now());
  await c.ev(`document.getElementById('setBox').open=true; document.querySelector('#modeSeg button[data-v="melody"]').click()`);
  const insts = await c.ev(`[...document.getElementById('inst').options].map(o=>o.value)`);
  for (const i of insts) {
    const r = await c.ev(`(async()=>{const s=document.getElementById('inst'); s.value='${i}'; s.dispatchEvent(new Event('change')); await new Promise(r=>setTimeout(r,100)); const k=document.getElementById('kref'); const l=k.closest('label'); const kr=k.getBoundingClientRect();
      return {name:s.options[s.selectedIndex].text, shown:!l.classList.contains('hide')&&l.offsetParent!==null, dis:k.disabled, txt:k.options[k.selectedIndex]&&k.options[k.selectedIndex].text, kW:Math.round(kr.right), sw:k.scrollWidth>k.clientWidth+2, overX:document.documentElement.scrollWidth-innerWidth}})()`);
    console.log(i, JSON.stringify(r));
  }
  await c.ev(`(()=>{const s=document.getElementById('inst'); s.value='flute'; s.dispatchEvent(new Event('change'))})()`);
  await c.ev(`document.querySelector('nav.tabs').style.display='none'`);
  await c.shot('h9-320-melody-flute.png', true);
  await c.ev(`(async()=>{document.querySelector('#modeSeg button[data-v="rhythm"]').click(); const s=document.getElementById('style'); s.value='ballad'; s.dispatchEvent(new Event('change')); await new Promise(r=>setTimeout(r,200));})()`);
  console.log('rhythm', JSON.stringify(await c.ev(`(()=>{const s=document.getElementById('style'); return {sw:s.scrollWidth, cw:s.clientWidth, right:Math.round(s.getBoundingClientRect().right), overX:document.documentElement.scrollWidth-innerWidth, kref:!document.getElementById('kref').closest('label').classList.contains('hide')}})()`)));
  await c.shot('h9-320-rhythm-ballad.png', true);
};
