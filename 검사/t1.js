module.exports = async (c) => {
  await c.size(390, 844);
  await c.go('http://127.0.0.1:8765/');
  const cases = [
    ['r1', "RP.set.mode='rhythm';RP.set.level=1;RP.set.meter='4/4';RP.set.seed=11"],
    ['r3', "RP.set.mode='rhythm';RP.set.level=3;RP.set.meter='4/4';RP.set.bars=4;RP.set.pickup='on';RP.set.seed=42"],
    ['m2', "RP.set.mode='melody';RP.set.level=2;RP.set.meter='6/8';RP.set.inst='clarinet';RP.set.key='Eb';RP.set.pickup='off';RP.set.seed=7"],
    ['m3', "RP.set.mode='melody';RP.set.level=3;RP.set.meter='7/8';RP.set.inst='trombone';RP.set.key='Fm';RP.set.pickup='on';RP.set.seed=99"],
  ];
  for (const [name, js] of cases) {
    const info = await c.ev(`(()=>{${js};RP.set.edits={};RP.rebuild();return document.querySelector('#scoreInfo').textContent+' | '+(document.querySelector('#score .placeholder')?.textContent||'ok')})()`);
    console.log(name, info);
    await c.shotEl(name + '.png', '#score');
  }
};
