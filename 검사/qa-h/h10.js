module.exports = async (c) => {
  await c.size(320, 700, true);
  await c.go('http://127.0.0.1:8765/?q=' + Date.now());
  await c.ev(`document.getElementById('setBox').open=true`);
  const r = await c.ev(`(()=>{const k=document.getElementById('keyHint'); const out={}; for (const m of ['rhythm','melody']) { document.querySelector('#modeSeg button[data-v="'+m+'"]').click(); out[m]={vis:k.offsetParent!==null, txt:k.textContent}; }
    const h=document.querySelector('header h1, header .title, #homeBtn'); out.title=h&&{txt:h.textContent, sw:h.scrollWidth, cw:h.clientWidth}; return out})()`);
  console.log(JSON.stringify(r));
  await c.shot('h10-320-top.png', false);
};
