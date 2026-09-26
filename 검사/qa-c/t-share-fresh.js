module.exports = async (c) => {
  await c.size(390, 844, true);
  const url = process.env.SHARE_URL;
  await c.go(url);
  await c.sleep(300);
  const r = await c.ev(`({toast: document.querySelector('#toast').textContent, hash: location.hash, mode: RP.set.mode, meter: RP.set.meter, bars: RP.set.bars, inst: RP.set.inst, key: RP.set.key, bpm: RP.set.bpm, scoreOk: !!RP.score, events: RP.score.events.length})`);
  console.log('share-open-FRESH-profile', JSON.stringify(r, null, 1));
};
