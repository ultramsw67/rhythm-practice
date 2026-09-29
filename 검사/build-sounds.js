// 악기 소리 파일 만들기 — FluidR3 GM 사운드폰트(Frank Wen, MIT) / midi-js-soundfonts(gleitz, CC BY 3.0) 에서
// 각 악기가 실제로 내는 음역만, 3반음 간격으로 골라 ../sounds/<이름>.js 로 저장한다 (사이 음은 재생 속도로 맞춤)
//   node build-sounds.js
const fs = require('fs'), path = require('path'), https = require('https');
const ROOT = path.join(__dirname, '..');
const OUT = path.join(ROOT, 'sounds');
const CACHE = path.join(__dirname, '.soundcache');
const SRC = 'https://gleitz.github.io/midi-js-soundfonts/FluidR3_GM/';
const STEP = 3;
// 앱 악기 → 사운드폰트 악기 (유포니움은 GM 에 없어 튜바, C 악기는 피아노)
const MAP = { flute: 'flute', oboe: 'oboe', clarinet: 'clarinet', soprano_sax: 'soprano_sax', contrabass: 'contrabass', alto_sax: 'alto_sax', tenor_sax: 'tenor_sax', bari_sax: 'baritone_sax',
  trumpet: 'trumpet', horn: 'french_horn', trombone: 'trombone', euphonium: 'tuba', tuba: 'tuba', c_treble: 'acoustic_grand_piano', c_bass: 'acoustic_grand_piano' };
const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
new Function(/<script id="core">([\s\S]*?)<\/script>/.exec(html)[1])();
const INSTS = globalThis.Core.INSTS;
const NAMES = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];
const nameOf = m => NAMES[m % 12] + (Math.floor(m / 12) - 1);
const get = url => new Promise((res, rej) => https.get(url, r => { if (r.statusCode !== 200) { rej(new Error(url + ' ' + r.statusCode)); return; } let d = ''; r.setEncoding('utf8'); r.on('data', c => d += c); r.on('end', () => res(d)); }).on('error', rej));
(async () => {
  fs.mkdirSync(OUT, { recursive: true }); fs.mkdirSync(CACHE, { recursive: true });
  // 사운드폰트 악기마다 필요한 실음 범위(앱 악기 여러 개면 합침)
  const need = {};
  for (const [k, gm] of Object.entries(MAP)) {
    const inst = INSTS[k]; if (!inst) continue;
    const lo = inst.r[2][0] + inst.t - 2, hi = inst.r[2][1] + inst.t + 2;
    need[gm] = need[gm] ? [Math.min(need[gm][0], lo), Math.max(need[gm][1], hi)] : [lo, hi];
  }
  const index = {};
  let total = 0;
  for (const [gm, [lo, hi]] of Object.entries(need)) {
    const cf = path.join(CACHE, gm + '-mp3.js');
    if (!fs.existsSync(cf)) fs.writeFileSync(cf, await get(SRC + gm + '-mp3.js'));
    const src = fs.readFileSync(cf, 'utf8');
    const all = {}; for (const m of src.matchAll(/"([A-G]b?-?\d)": "(data:audio\/mp3;base64,[^"]+)"/g)) all[m[1]] = m[2];
    const picked = {};
    for (let m = lo; m <= hi + STEP; m += STEP) { const n = nameOf(m); if (all[n]) picked[m] = all[n]; }
    const body = `// 자동 생성 (검사/build-sounds.js). 악기 소리: FluidR3 GM (Frank Wen, MIT) · midi-js-soundfonts (CC BY 3.0)\n(window.RP_SOUNDS = window.RP_SOUNDS || {})[${JSON.stringify(gm)}] = ${JSON.stringify(picked)};\n`;
    fs.writeFileSync(path.join(OUT, gm + '.js'), body);
    index[gm] = { lo, hi, notes: Object.keys(picked).map(Number), kb: Math.round(body.length / 1024) };
    total += body.length;
    console.log(gm.padEnd(22), 'midi', lo + '~' + hi, 'notes', Object.keys(picked).length, Math.round(body.length / 1024) + 'KB');
  }
  fs.writeFileSync(path.join(OUT, 'LICENSE.txt'), [
    'Instrument sounds in this folder are excerpts of the FluidR3 GM SoundFont.',
    'FluidR3 GM: Copyright (c) 2000-2002, 2008 Frank Wen. Released under the MIT License.',
    'Converted to MP3/JS by midi-js-soundfonts (https://github.com/gleitz/midi-js-soundfonts), Creative Commons Attribution 3.0.',
    '',
    'Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:',
    'The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.',
    'THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED.',
  ].join('\n') + '\n');
  fs.writeFileSync(path.join(OUT, 'index.json'), JSON.stringify({ step: STEP, map: MAP, sounds: index }, null, 1));
  console.log('total', Math.round(total / 1024) + 'KB');
})().catch(e => { console.error(e); process.exit(1); });
