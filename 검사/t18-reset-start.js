// '설정 처음 상태로' 뒤에 처음 안내 카드가 다시 나오는지
module.exports = async (c) => {
  await c.size(390, 844);
  await c.go(process.env.URL0 || 'http://127.0.0.1:' + (process.env.PORT || 8765) + '/');
  const r = await c.ev(`(async()=>{
    document.querySelector('#startClose').click();
    const hidden1 = document.querySelector('#startCard').classList.contains('hide');
    document.querySelector('nav.tabs [data-tab=settings]').click();
    const b = document.querySelector('#resetAll'); b.click(); b.click(); await new Promise(r=>setTimeout(r,300));
    document.querySelector('#homeBtn').click(); await new Promise(r=>setTimeout(r,200));
    return { hiddenAfterClose: hidden1, shownAfterReset: !document.querySelector('#startCard').classList.contains('hide') };
  })()`);
  console.log(JSON.stringify(r));
};
