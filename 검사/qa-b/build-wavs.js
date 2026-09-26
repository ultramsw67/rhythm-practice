const fs = require('fs');
const path = require('path');
const { C, writeWav, perfWav, silenceWav, tinyNoiseWav, clickTrain } = require('./mk');
const OUT = __dirname;

const SETS = {
  rhythm4: { mode: 'rhythm', meter: '4/4', level: 2, bars: 4, key: 'C', inst: 'clarinet', bpm: 90, pickup: 'off', artic: 'auto', seed: 11, edits: {} },
  melody4: { mode: 'melody', meter: '4/4', level: 2, bars: 4, key: 'Bb', inst: 'clarinet', bpm: 90, pickup: 'off', artic: 'auto', seed: 21, edits: {} },
  melodyLong16: { mode: 'melody', meter: '4/4', level: 2, bars: 16, key: 'C', inst: 'flute', bpm: 100, pickup: 'off', artic: 'auto', seed: 31, edits: {} },
  rhythmPickup: { mode: 'rhythm', meter: '4/4', level: 2, bars: 4, key: 'C', inst: 'clarinet', bpm: 90, pickup: 'on', artic: 'auto', seed: 41, edits: {} },
};

// 각 set 실제로 pickup 있는지 확인
for (const [k, s] of Object.entries(SETS)) {
  const sc = C.generate(s);
  console.log(k, 'pickLen=', sc.pickLen, 'events=', sc.events.length);
}

fs.writeFileSync(path.join(OUT, 'sets.json'), JSON.stringify(SETS, null, 1));

// 1) 리듬 완벽 연주 (ci=1)
{ const { x, sr } = perfWav(SETS.rhythm4, { seed: 3 }, 0.7, 48000, 1); writeWav(path.join(OUT, 'rhythm-perfect.wav'), x, sr); console.log('rhythm-perfect.wav', (x.length / sr).toFixed(2), 's'); }
// 2) 선율 완벽 연주 (ci=1)
{ const { x, sr } = perfWav(SETS.melody4, { seed: 3 }, 0.7, 48000, 1); writeWav(path.join(OUT, 'melody-perfect.wav'), x, sr); console.log('melody-perfect.wav', (x.length / sr).toFixed(2), 's'); }
// 3) 선율 흔들린 연주 (ci=1) - jitter/detune/wrong/drop/tempo/lenScale
{ const { x, sr } = perfWav(SETS.melody4, { seed: 777, jitter: 45, detune: 25, wrong: 0.15, drop: 0.08, tempo: 1.05, lenScale: 1.2 }, 0.7, 48000, 1); writeWav(path.join(OUT, 'melody-sloppy.wav'), x, sr); console.log('melody-sloppy.wav', (x.length / sr).toFixed(2), 's'); }
// 4) 16마디 긴 곡 (ci=2, 예비박 2마디로 테스트) - 중간에 멈출 것이므로 충분히 길면 됨
{ const { x, sr } = perfWav(SETS.melodyLong16, { seed: 3 }, 0.7, 48000, 2); writeWav(path.join(OUT, 'melody-long16.wav'), x, sr); console.log('melody-long16.wav', (x.length / sr).toFixed(2), 's'); }
// 5) 못갖춘마디 리듬 (ci=1)
{ const { x, sr } = perfWav(SETS.rhythmPickup, { seed: 3 }, 0.7, 48000, 1); writeWav(path.join(OUT, 'rhythm-pickup.wav'), x, sr); console.log('rhythm-pickup.wav', (x.length / sr).toFixed(2), 's'); }
// 6) 무음 (조용한 입력)
{ const x = silenceWav(6, 48000); writeWav(path.join(OUT, 'silence.wav'), x, 48000); console.log('silence.wav', 6, 's'); }
// 7) 아주 작은 잡음 (peak 임계값(0.003) 아래)
{ const x = tinyNoiseWav(6, 0.0008, 48000); writeWav(path.join(OUT, 'tiny-noise.wav'), x, 48000); console.log('tiny-noise.wav', 6, 's'); }
// 8) 지연 보정용 클릭 열차 (기준 A, B: B 는 A 보다 100ms 늦게)
{ const x = clickTrain(8, 0.6, 1.0, 0, 48000); writeWav(path.join(OUT, 'clicks-A.wav'), x, 48000); console.log('clicks-A.wav', (x.length / 48000).toFixed(2)); }
{ const x = clickTrain(8, 0.6, 1.0, 0.1, 48000); writeWav(path.join(OUT, 'clicks-B.wav'), x, 48000); console.log('clicks-B.wav (A+100ms)', (x.length / 48000).toFixed(2)); }
// 9) 클릭 없음(무음) - 지연 측정 실패 유도
{ const x = silenceWav(6.5, 48000); writeWav(path.join(OUT, 'clicks-none.wav'), x, 48000); console.log('clicks-none.wav', 6.5); }
