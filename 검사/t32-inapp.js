// 앱 안 브라우저(카카오톡 등)에서 열었을 때: 저절로 넘기기·안내 화면·단추가 맞게 동작하는지 (브라우저 이름을 흉내)
// URL0 : 열 주소 (기본 http://127.0.0.1:8765/)
const IOS = 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148';
const AND = 'Mozilla/5.0 (Linux; Android 14; SM-S918N Build/UP1A.231005.007; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/128.0.6613.127 Mobile Safari/537.36';
const CASES = [
  ['아이폰 카카오톡', IOS + ' KAKAOTALK 10.8.5'],
  ['안드로이드 카카오톡', AND + ';KAKAOTALK 2410850'],
  ['아이폰 라인', IOS + ' Safari Line/14.10.0'],
  ['아이폰 네이버 앱', IOS + ' NAVER(inapp; search; 2000; 12.10.3; 15PRO)'],
  ['안드로이드 네이버 앱', AND + ' NAVER(inapp; search; 2000; 12.10.3)'],
  ['아이폰 인스타그램', IOS + ' Instagram 350.0.0.0.0 (iPhone15,3; iOS 18_5; ko_KR; ko)'],
  ['안드로이드 인스타그램', AND + ' Instagram 350.0.0.0.0 Android'],
  ['아이폰 밴드', IOS + ' BAND/15.2.0'],
  ['아이폰 페이스북', IOS + ' [FBAN/FBIOS;FBAV/480.0]'],
  ['아이폰 사파리(정상)', 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Mobile/15E148 Safari/604.1'],
  ['안드로이드 크롬(정상)', 'Mozilla/5.0 (Linux; Android 14; SM-S918N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Mobile Safari/537.36'],
  ['안드로이드 삼성 인터넷(정상)', 'Mozilla/5.0 (Linux; Android 14; SM-S918N) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/26.0 Chrome/122.0.0.0 Mobile Safari/537.36'],
  ['아이폰 홈 화면 앱(정상)', 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148'],
];
module.exports = async (c) => {
  const base = process.env.URL0 || 'http://127.0.0.1:8765/';
  await c.size(390, 844, true);
  await c.send('Page.addScriptToEvaluateOnNewDocument', { source: 'window.__rpNav = []; try{ if (/[?](t|shot)=/.test(location.search)) sessionStorage.clear() }catch(e){}' });
  const out = [];
  for (const [label, ua] of CASES) {
    await c.send('Emulation.setUserAgentOverride', { userAgent: ua, platform: /Android/.test(ua) ? 'Linux armv8l' : 'iPhone' });
    await c.go(base + '?t=' + Date.now());
    const r = await c.ev(`(async()=>{ await new Promise(r=>setTimeout(r,300));
      const g = document.getElementById('inappGate'), nav0 = window.__rpNav.slice();
      const res = { app: window.RP_INAPP || '', auto: nav0, gate: !!g };
      if (g) {
        const rc = g.getBoundingClientRect(), go = document.getElementById('inappGo');
        res.cover = rc.width >= 380 && rc.height >= 800; res.title = g.querySelector('h2').textContent; res.btn = go.textContent;
        res.btnH = Math.round(go.getBoundingClientRect().height); res.btnTop = Math.round(go.getBoundingClientRect().top);
        go.click(); res.click = window.__rpNav.slice(nav0.length);
        res.appUnder = !!document.querySelector('#recBtn');
      }
      return res; })()`);
    out.push([label, r]);
  }
  for (const [l, r] of out) console.log(l.padEnd(18), JSON.stringify(r));
  // 되풀이 방지: 안드로이드 크롬이 없어 같은 앱 안으로 되돌아온 경우(1분 안) 다시 넘기지 않는지
  await c.send('Emulation.setUserAgentOverride', { userAgent: CASES[4][1] });
  await c.send('Page.addScriptToEvaluateOnNewDocument', { source: 'try{sessionStorage.setItem("rp-esc-at", String(Date.now()))}catch(e){}' });
  await c.go(base + '?again=1');
  console.log('되풀이 방지', JSON.stringify(await c.ev(`({ auto: window.__rpNav, gate: !!document.getElementById('inappGate') })`)));
  // 라인에서 openExternalBrowser=1 이 붙어 되돌아온 경우 다시 넘기지 않기
  await c.send('Emulation.setUserAgentOverride', { userAgent: CASES[2][1] });
  await c.go(base + '?openExternalBrowser=1');
  console.log('라인 되돌아옴', JSON.stringify(await c.ev(`({ auto: window.__rpNav, gate: !!document.getElementById('inappGate') })`)));
  // '그냥 둘러보기' 누르면 닫히고, 새로고침해도 다시 안 뜨는지
  await c.send('Emulation.setUserAgentOverride', { userAgent: CASES[3][1] });
  await c.go(base + '?skip=1');
  const s1 = await c.ev(`(()=>{ document.getElementById('inappSkip').click(); return !!document.getElementById('inappGate') })()`);
  await c.send('Page.reload'); await c.sleep(2500);
  console.log('둘러보기', JSON.stringify({ afterClick: s1, afterReload: await c.ev(`!!document.getElementById('inappGate')`), appWorks: await c.ev(`!!window.RP && !!document.querySelector('#score svg')`) }));
  // 화면 모습
  await c.send('Emulation.setUserAgentOverride', { userAgent: CASES[0][1] });
  await c.go(base + '?shot=1');
  await c.shot('inapp-kakao-ios.png', false);
  await c.send('Emulation.setUserAgentOverride', { userAgent: CASES[4][1] });
  await c.send('Page.addScriptToEvaluateOnNewDocument', { source: 'try{sessionStorage.removeItem("rp-esc-at")}catch(e){}' });
  await c.go(base + '?shot=2');
  await c.shot('inapp-naver-android.png', false);
};
