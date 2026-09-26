// 결과 악보 음표 색이 테마를 따라 바뀌는지
module.exports = async (c) => {
  await c.size(390, 844);
  await c.go('http://127.0.0.1:' + (process.env.PORT || 8765) + '/');
  const r = await c.ev(`(async()=>{
    localStorage.setItem('rp.theme','"light"'); document.documentElement.setAttribute('data-theme','light');
    document.querySelector('nav.tabs [data-tab=settings]').click(); document.querySelector('#selfPerfect').click(); await new Promise(r=>setTimeout(r,3500));
    const el = document.querySelector('#resScore [id^=vf-ev]');
    const col = () => { const e = document.querySelector('#resScore [id^=vf-ev]'); return e ? e.getAttribute('fill') : 'none'; };
    const btn = document.querySelector('#themeBtn');
    const out = { start: btn.textContent, c0: col() };
    btn.click(); out.l1 = btn.textContent; out.c1 = col();
    btn.click(); out.l2 = btn.textContent; out.c2 = col();
    out.snippet = el ? el.outerHTML.slice(0, 300) : null;
    return out; })()`);
  console.log(JSON.stringify(r, null, 1));
};
