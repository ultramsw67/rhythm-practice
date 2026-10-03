module.exports = async (c) => {
  await c.go('http://127.0.0.1:8765/');
  const r = await c.ev(`(()=>{const VF=Vex.Flow; const out={}; for (const k of ['e/5/T2','e/5/t2','e/5/D2','e/5/X2','d/4/x2','e/5/x3','e/5/tu','e/5/T1']) { try { const div=document.createElement('div'); document.body.appendChild(div); const R=new VF.Renderer(div,VF.Renderer.Backends.SVG); R.resize(200,120); const ctx=R.getContext(); const st=new VF.Stave(0,0,180); st.setContext(ctx).draw(); const n=new VF.StaveNote({keys:[k],duration:'q',clef:'percussion'}); VF.Formatter.FormatAndDraw(ctx,st,[n]); out[k]=div.innerHTML.length; } catch(e) { out[k]='ERR '+e.message; } } return JSON.stringify(out)})()`);
  console.log(r);
};
