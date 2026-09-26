# 검사 도구

`index.html` 을 고친 뒤 올리기 전에 돌린다. 모두 node 만 쓴다(python 없음).

| 명령 (이 폴더에서) | 무엇을 보나 | 통과 기준 |
|---|---|---|
| `node test-core.js ../index.html` | 악보 생성 6,000회 (마디 길이·붙임줄·음역·공유 링크·악기 불변) | `fail 0`, `instrument invariance 2400 / 2400` |
| `node test-score.js ../index.html` | 가상 연주 18곡 × 11변형 채점 | `perfect` 평균 100, 흔들림·빠짐은 점수가 내려감 |
| `node serve.js "C:/Users/ultramsw67/Desktop/리듬 연습"` | 로컬 서버 127.0.0.1:8765 (백그라운드로 켜 두고 아래 실행) | |
| `node cdp.js t1.js` | 악보 4종 캡처 (`r1.png` 등) | 오류 없음 |
| `node cdp.js t6-fixes.js` | v1.1 에서 고친 버그 재확인 | 모든 항목 기대값 |
| `node cdp.js t7-art.js` | 기호가 기둥 반대쪽에 붙는지 | `onStemSide 0` |
| `node cdp.js t8-guide.js` | 설명서 페이지 | 가로 넘침 없음 |
| `node gen-wav.js ../index.html '<SET json>' fake.wav 0.7` 후 `FAKE_WAV=<fake.wav 절대경로> node cdp.js t4.js` | 가짜 마이크로 녹음→채점→저장 | `100점` |
| `URL0=https://ultramsw67.github.io/rhythm-practice/ node cdp.js t5-live.js` | 배포된 실주소 | `secure true`, 가상 연주 100 |
| `node build-guide.js` | 볼트 설명서 md → `../guide.html` | |

주의
- 가짜 마이크 시험(t4)은 **녹음을 맨 먼저** 해야 정확하다. 앞에 다른 시험을 돌리면 크롬이 소리 파일을 미리 틀어 점수가 낮게 나온다
- `cdp.js` 는 크롬을 화면 없이 띄운다. 프로필은 `chrome-prof/`(저장소에 안 올라감)
- Aside 브라우저는 file:// 을 못 열고 캡처가 멈춘다 → 이 도구를 쓴다
