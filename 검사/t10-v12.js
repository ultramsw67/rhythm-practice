// v1.2 에서 고친 것 확인
module.exports = async (c) => {
  const B = process.env.URL0 || 'http://127.0.0.1:' + (process.env.PORT || 8765) + '/';
  const out = {};
  // 1) 320px: 악보가 칸 안에 들어가는지, 설정 칸이 접혀 악보·녹음 버튼이 보이는지
  await c.size(320, 700);
  await c.go(B);
  await c.ev(`(()=>{ localStorage.clear(); indexedDB.deleteDatabase('rhythm-practice'); })()`);
  await c.go(B);
  out.w320 = await c.ev(`(()=>{ let worst=0; for (let s=1;s<=30;s++){ Object.assign(RP.set,{mode:s%2?'melody':'rhythm',meter:['4/4','6/8','7/8','12/8','5/4'][s%5],level:1+s%3,bars:8,inst:'tuba',key:['Cb','C#','F#m','Ebm'][s%4],bpm:60+s*4,artic:'auto',seed:s,edits:{}}); RP.rebuild();
      const host=document.querySelector('#score'); const svg=host.querySelector('svg'); worst=Math.max(worst, svg.getBoundingClientRect().width - host.clientWidth); }
    const nav=document.querySelector('nav.tabs').getBoundingClientRect().top;
    return { overflowPx: Math.round(worst), setOpen: document.querySelector('#setBox').open, scoreTop: Math.round(document.querySelector('#score').getBoundingClientRect().top), navTop: Math.round(nav), sum: document.querySelector('#setSum').textContent }; })()`);
  await c.ev(`document.querySelector('nav.tabs').style.display='none'`);
  const im = await c.send('Page.captureScreenshot', { format: 'png', clip: { x: 0, y: 0, width: 320, height: 700, scale: 1 } });
  require('fs').writeFileSync(__dirname + '/v12-320.png', Buffer.from(im.result.data, 'base64'));
  await c.ev(`document.querySelector('nav.tabs').style.display=''`);
  // 2) 기호 창: 악보 바뀌면 닫힘 / 바깥 누르면 닫힘 / 같은 음 슬러 막힘 / 창 아래가 탭 막대 바로 위
  out.sheet = await c.ev(`(async()=>{
    Object.assign(RP.set,{mode:'melody',level:1,meter:'4/4',bars:8,inst:'flute',key:'C',artic:'manual',seed:2,edits:{}}); RP.rebuild();
    const host=document.querySelector('#score'); host.scrollIntoView();
    const tap=id=>{const s=host._scale, rc=host.getBoundingClientRect(); const h=host._hits.find(x=>x.id===id); host.dispatchEvent(new MouseEvent('click',{bubbles:true,clientX:rc.left+h.x*s,clientY:rc.top+6+((h.y0+h.y1)/2)*s}));};
    const open=()=>!document.querySelector('#articSheet').classList.contains('hide');
    const ev=RP.score.events; let pair=-1; for(let i=0;i<ev.length-1;i++) if(!ev[i].rest&&!ev[i+1].rest&&ev[i].midi===ev[i+1].midi){pair=i;break;}
    const r={};
    if (pair>=0){ tap(pair); document.querySelector('#sheetChips [data-k=slur]').click(); r.sameSlurBlocked = !RP.score.slurs.some(([a,b])=>a===pair); }
    tap(0); r.openedA=open(); const sb=document.querySelector('#articSheet').getBoundingClientRect().bottom, nt=document.querySelector('nav.tabs').getBoundingClientRect().top; r.sheetGap=Math.round(nt-sb);
    document.querySelector('#newBtn').click(); r.closedOnRebuild=!open();
    tap(0); r.openedB=open(); document.querySelector('#recCard').dispatchEvent(new MouseEvent('click',{bubbles:true})); r.closedOutside=!open();
    tap(0); document.querySelector('#sheetChips [data-k=stac]').click(); r.chipKeepsOpen=open(); r.stac=RP.score.events[0].artic.includes('stac');
    return r; })()`);
  // 3) 빠르기 칸 비우기·글자 → 그대로
  out.bpm = await c.ev(`(()=>{ const n=document.querySelector('#bpmNum'); const before=RP.set.bpm; n.value=''; n.dispatchEvent(new Event('change')); const a=RP.set.bpm; n.value='abc'; n.dispatchEvent(new Event('change')); const b=RP.set.bpm; n.value='300'; n.dispatchEvent(new Event('change')); return {before, blank:a, abc:b, big:RP.set.bpm, box:n.value}; })()`);
  // 4) 결과 화면에서 테마 바꾸면 음표 색도 바뀜
  out.theme = await c.ev(`(async()=>{ document.querySelector('nav.tabs [data-tab=settings]').click(); document.querySelector('#selfPerfect').click(); await new Promise(r=>setTimeout(r,3500));
    const col=()=>{const fs=[...document.querySelectorAll('#resScore [id^=vf-ev] [fill]')].map(x=>x.getAttribute('fill')).filter(f=>f&&f!=='none'); return fs[0];};
    document.documentElement.removeAttribute('data-theme'); localStorage.setItem('rp.theme','"auto"');
    const btn=document.querySelector('#themeBtn'); const c0=col(); btn.click(); const c1=col(); btn.click(); const c2=col(); return {c0,c1,c2,label:btn.textContent}; })()`);
  console.log(JSON.stringify(out, null, 1));
};
