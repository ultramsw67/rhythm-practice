module.exports = async (c) => {
  await c.size(400, 200, false);
  await c.go('http://127.0.0.1:8765/');
  await c.ev(`(()=>{document.body.innerHTML='<div id=t style="background:#fff"></div>'; const VF=Vex.Flow; const div=document.getElementById('t'); const R=new VF.Renderer(div,VF.Renderer.Backends.SVG); R.resize(380,150); const ctx=R.getContext(); const st=new VF.Stave(10,20,360); st.setConfigForLines([0,1,2,3,4].map(i=>({visible:true}))); st.addClef('percussion'); st.setContext(ctx).draw(); const ns=['e/5/T1','e/5/D2','e/5/D1','f/5/x2','d/4/x2','c/5/x2','g/5/x2'].map(k=>new VF.StaveNote({keys:[k],duration:'q',clef:'percussion'})); const v=new VF.Voice({num_beats:7,beat_value:4}).addTickables(ns); new VF.Formatter().joinVoices([v]).format([v],300); v.draw(ctx,st); return 1})()`);
  await c.shot('noteheads.png', false);
};
