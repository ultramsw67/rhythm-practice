const BASE = 'http://127.0.0.1:8771/';
module.exports = async (c) => {
  await c.go(BASE);
  await c.ev(`(()=>{ indexedDB.deleteDatabase('rhythm-practice'); localStorage.clear(); })()`);

  const groups = [
    { w: 320, mobile: true, cases: [
      ['s1-6_8-tuba', {mode:'melody',level:3,meter:'6/8',bars:4,inst:'tuba',key:'Cb',bpm:208,artic:'auto',pickup:'off',seed:11}],
      ['s2-7_8-rhythm', {mode:'rhythm',level:2,meter:'7/8',bars:4,artic:'auto',pickup:'off',seed:12}],
      ['s3-9_8-fm', {mode:'melody',level:1,meter:'9/8',bars:3,inst:'flute',key:'Fm',bpm:88,artic:'auto',pickup:'off',seed:13}],
      ['s4-12_8-dense', {mode:'melody',level:3,meter:'12/8',bars:2,inst:'clarinet',key:'Gb',bpm:60,artic:'auto',pickup:'off',seed:14}],
      ['s5-4_4-pickup-rhythm', {mode:'rhythm',level:1,meter:'4/4',bars:4,artic:'auto',pickup:'on',seed:15}],
      ['s10-5_4-cb', {mode:'melody',level:3,meter:'5/4',bars:2,inst:'c_bass',key:'Cb',bpm:40,artic:'auto',pickup:'off',seed:16}],
      ['s12-manual-artic', {mode:'melody',level:1,meter:'4/4',bars:2,inst:'flute',key:'C',artic:'manual',pickup:'off',seed:22}],
      ['s14-f_sharp_m', {mode:'melody',level:2,meter:'3/4',bars:4,inst:'trombone',key:'F#m',bpm:100,artic:'auto',pickup:'off',seed:17}],
      ['s15-7_8-altosax-dense', {mode:'melody',level:3,meter:'7/8',bars:2,inst:'alto_sax',key:'Bbm',bpm:150,artic:'auto',pickup:'off',seed:18}],
    ]},
    { w: 390, mobile: true, cases: [
      ['s11-2_2-horn', {mode:'melody',level:2,meter:'2/2',bars:4,inst:'horn',key:'Db',bpm:88,artic:'auto',pickup:'off',seed:19}],
    ]},
    { w: 768, mobile: false, cases: [
      ['s6-6_8-trumpet', {mode:'melody',level:2,meter:'6/8',bars:8,inst:'trumpet',key:'Eb',bpm:100,artic:'auto',pickup:'off',seed:20}],
      ['s7-9_8-rhythm-wide', {mode:'rhythm',level:3,meter:'9/8',bars:8,artic:'auto',pickup:'off',seed:21}],
      ['s16-12_8-euph', {mode:'melody',level:3,meter:'12/8',bars:6,inst:'euphonium',key:'Ebm',bpm:120,artic:'auto',pickup:'off',seed:23}],
    ]},
    { w: 1280, mobile: false, cases: [
      ['s8-4_4-16bars', {mode:'melody',level:1,meter:'4/4',bars:16,inst:'flute',key:'C',bpm:88,artic:'auto',pickup:'off',seed:24}],
      ['s9-12_8-12bars', {mode:'rhythm',level:2,meter:'12/8',bars:12,artic:'auto',pickup:'off',seed:25}],
    ]},
  ];

  const out = [];
  for (const g of groups) {
    await c.size(g.w, 950, g.mobile);
    for (const [name, s] of g.cases) {
      const r = await c.ev(`(()=>{ Object.assign(RP.set, ${JSON.stringify(s)}, {edits:{}}); RP.rebuild();
        return {info: document.querySelector('#scoreInfo').textContent, err: document.querySelector('#score .placeholder')?.textContent||''}; })()`);
      out.push({ name, w: g.w, ...r });
      await c.shotEl(`qa-a/${name}-w${g.w}.png`, '#score');
    }
  }
  console.log(JSON.stringify(out, null, 1));
};
