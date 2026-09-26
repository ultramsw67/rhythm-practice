// 가짜 마이크용 WAV: 가상 연주 앞에 무음을 붙임
const fs = require('fs');
const html = fs.readFileSync(process.argv[2], 'utf8');
new Function(/<script id="core">([\s\S]*?)<\/script>/.exec(html)[1])();
const C = globalThis.Core;
const set = JSON.parse(process.argv[3]);
const lead = +process.argv[5] || 0;
const sc = C.generate(set), tl = C.timeline(sc, 1);
const sr = 48000;
const body = C.synth(sc, tl, sr, { seed: 3 });
const x = new Float32Array(Math.round(lead * sr) + body.length + sr * 3);
x.set(body, Math.round(lead * sr));
const buf = Buffer.alloc(44 + x.length * 2);
buf.write('RIFF', 0); buf.writeUInt32LE(36 + x.length * 2, 4); buf.write('WAVE', 8); buf.write('fmt ', 12);
buf.writeUInt32LE(16, 16); buf.writeUInt16LE(1, 20); buf.writeUInt16LE(1, 22); buf.writeUInt32LE(sr, 24); buf.writeUInt32LE(sr * 2, 28); buf.writeUInt16LE(2, 32); buf.writeUInt16LE(16, 34);
buf.write('data', 36); buf.writeUInt32LE(x.length * 2, 40);
for (let i = 0; i < x.length; i++) buf.writeInt16LE(Math.max(-32768, Math.min(32767, Math.round(x[i] * 32767))), 44 + i * 2);
fs.writeFileSync(process.argv[4], buf);
console.log('wav', (x.length / sr).toFixed(2), 's, notes', tl.notes.length);
