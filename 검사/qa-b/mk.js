// 공용 WAV 생성 도우미 (qa-b 전용)
const fs = require('fs');
const path = require('path');
const HTML = fs.readFileSync(path.join(__dirname, '..', '..', 'index.html'), 'utf8');
new Function(/<script id="core">([\s\S]*?)<\/script>/.exec(HTML)[1])();
const C = globalThis.Core;

function writeWav(file, x, sr) {
  const buf = Buffer.alloc(44 + x.length * 2);
  buf.write('RIFF', 0); buf.writeUInt32LE(36 + x.length * 2, 4); buf.write('WAVE', 8); buf.write('fmt ', 12);
  buf.writeUInt32LE(16, 16); buf.writeUInt16LE(1, 20); buf.writeUInt16LE(1, 22); buf.writeUInt32LE(sr, 24); buf.writeUInt32LE(sr * 2, 28); buf.writeUInt16LE(2, 32); buf.writeUInt16LE(16, 34);
  buf.write('data', 36); buf.writeUInt32LE(x.length * 2, 40);
  for (let i = 0; i < x.length; i++) buf.writeInt16LE(Math.max(-32768, Math.min(32767, Math.round(x[i] * 32767))), 44 + i * 2);
  fs.writeFileSync(file, buf);
}

// 가상 연주 성능 WAV (lead 무음 + synth 결과 + tail 무음)
function perfWav(set, opt, lead, sr, ci) {
  sr = sr || 48000; lead = lead == null ? 0.7 : lead; ci = ci || 1;
  const sc = C.generate(set), tl = C.timeline(sc, ci); // ci 는 앱의 #countIn 값과 반드시 맞춰야 한다
  const body = C.synth(sc, tl, sr, opt || { seed: 3 });
  const x = new Float32Array(Math.round(lead * sr) + body.length + sr * 3);
  x.set(body, Math.round(lead * sr));
  return { x, sr, sc, tl };
}

// 순수 무음 (초 단위)
function silenceWav(sec, sr) {
  sr = sr || 48000;
  return new Float32Array(Math.round(sec * sr));
}

// 아주 작은 잡음(피크 매우 낮음) - "소리가 거의 녹음되지 않았습니다" 유도
function tinyNoiseWav(sec, amp, sr) {
  sr = sr || 48000;
  const n = Math.round(sec * sr);
  const x = new Float32Array(n);
  for (let i = 0; i < n; i++) x[i] = (Math.random() - 0.5) * 2 * amp;
  return x;
}

// 지연 보정용 클릭 버스트 열차: lead 뒤 gap 간격 N 개, 각 burst 는 1500Hz 감쇠음(0.03s), extraShift 로 전체를 미세하게 미룸
function clickTrain(N, gap, lead, extraShift, sr) {
  sr = sr || 48000;
  lead = lead == null ? 1.0 : lead; extraShift = extraShift || 0;
  const totalSec = lead + extraShift + N * gap + 1.0;
  const x = new Float32Array(Math.round(totalSec * sr));
  for (let k = 0; k < N; k++) {
    const t0 = lead + extraShift + k * gap;
    const s0 = Math.round(t0 * sr);
    for (let i = 0; i < 0.03 * sr && s0 + i < x.length; i++) {
      x[s0 + i] += 0.6 * Math.exp(-i / (0.006 * sr)) * (Math.sin(2 * Math.PI * 1500 * i / sr) > 0 ? 1 : -1);
    }
  }
  return x;
}

module.exports = { C, writeWav, perfWav, silenceWav, tinyNoiseWav, clickTrain };
