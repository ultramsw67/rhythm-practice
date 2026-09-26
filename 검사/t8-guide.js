module.exports = async (c) => {
  const B = process.env.URL0 || 'http://127.0.0.1:8765/';
  await c.size(390, 844);
  await c.go(B + 'guide.html');
  console.log(JSON.stringify(await c.ev(`({h2: document.querySelectorAll('h2').length, h3: document.querySelectorAll('h3').length, tables: document.querySelectorAll('table').length, overflowX: document.documentElement.scrollWidth > innerWidth + 1, back: document.querySelector('header a').getAttribute('href')})`)));
  await c.shot('guide.png');
  await c.ev(`document.documentElement.setAttribute('data-theme','dark')`);
  await c.shot('guide-dark.png', false);
  await c.go(B);
  console.log(JSON.stringify(await c.ev(`({link: !!document.querySelector('header a[href="guide.html"]'), ver: [...document.querySelectorAll('#tab-settings p')].map(p=>p.textContent).find(t=>t.includes('버전'))})`)));
};
