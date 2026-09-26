module.exports = async (c) => {
  await c.size(390, 844, true);
  const B = 'http://127.0.0.1:8773/';
  await c.go(B);
  await c.ev(`(()=>{document.querySelector('#wave').closest('.card').scrollIntoView({block:'center'});})()`);
  await c.sleep(150);
  await c.ev(`(()=>{const b=document.querySelector('#countBig'); b.classList.remove('hide'); b.textContent='2';})()`);
  await c.sleep(100);
  await c.shot('qa-c/countin-shot2.png', false);
};
