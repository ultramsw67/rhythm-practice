# 검사 도구

`index.html` 을 고친 뒤 올리기 전에 돌린다. 모두 node 만 쓴다(python 없음).

| 명령 (이 폴더에서) | 무엇을 보나 | 통과 기준 |
|---|---|---|
| `node test-core.js ../index.html` | 악보 생성 6,000회 (마디 길이·붙임줄·음역·공유 링크·악기 불변) | `fail 0`, `instrument invariance 2400 / 2400` |
| `node test-score.js ../index.html` | 가상 연주 18곡 × 11변형 채점 | `perfect` 평균 100, 흔들림·빠짐은 점수가 내려감 |
| `node serve.js "C:/Users/ultramsw67/Desktop/수드 리듬 연습/개발 원본"` | 로컬 서버 127.0.0.1:8765 (백그라운드로 켜 두고 아래 실행) | |
| `node cdp.js t1.js` | 악보 4종 캡처 (`r1.png` 등) | 오류 없음 |
| `node cdp.js t6-fixes.js` | v1.1 에서 고친 버그 재확인 | 모든 항목 기대값 |
| `node cdp.js t7-art.js` | 기호가 기둥 반대쪽에 붙는지 | `onStemSide 0` |
| `node cdp.js t8-guide.js` | 설명서 페이지 | 가로 넘침 없음 |
| `node gen-wav.js ../index.html '<SET json>' fake.wav 0.7` 후 `FAKE_WAV=<fake.wav 절대경로> node cdp.js t4.js` | 가짜 마이크로 녹음→채점→저장 | `100점` |
| `URL0=https://ultramsw67.github.io/rhythm-practice/ node cdp.js t5-live.js` | 배포된 실주소 | `secure true`, 가상 연주 100 |
| `node build-guide.js` | 볼트 설명서 md → `../guide.html` | |
| `node build-offline.js` | 오프라인 두 판(`../offline/`, 바탕화면 `리듬 연습 오프라인\`) 만들기 | 끝에 `offline built vX` |
| `MODE=web PORT=8771 KILL_CMD=... node cdp.js t21-offline.js` / `MODE=file FAKE_WAV=... node cdp.js t21-offline.js` | 오프라인 앱을 서버 끄고 다시 열기 / PC 파일판 녹음 | 채점 시험 100, 녹음 100 |
| `STALE=1 PORT=8791 node qa-e/serve2.js <root>` + `node cdp.js t25-offline-update.js` | 10분 캐시 서버에서 오프라인 업데이트 | 새로고침 1번에 새 버전 |
| `node cdp.js t23-clip.js` / `t24-tune.js` / `t20-melody-mobile.js` | 찢어짐·악센트 대비 / 소리 균형 / 휴대폰 스피커 크기 | 최대 < 0.99, 악센트 ≥ 3.5dB, 모든 악기 > -26dB |
| `FAKE_WAV=... node cdp.js t22-scriptproc.js` | 예비 녹음 방식(ScriptProcessor) | 100점 |
| `node cdp.js t26-live-offline.js` | 실주소 오프라인 앱 | 차단 후 다시 열어 100 |
| `node cdp.js t33-ui.js` | v2.9 화면: 320px·아주 크게·어두운 화면 캡처(ui-*.png), 가로 넘침·44px 미만 버튼, 글자 크기 단추 | overflowX 0, small [] |
| `node cdp.js t34-score-fit.js` | 글자 크기 3단계 × 폭 5가지 × 조표 ±7 에서 악보 오른쪽 잘림 | 모든 줄 n 0 |
| `node cdp.js t35-levels.js` | v3.0 난이도 1~7: 단계별 악보 캡처(lv1~7.png), 320·390·1024px 단계 단추·설명 줄 | 모두 ok, small 0, overflowX ≤ 0 |
| `node cdp.js t35b-legacy.js` | 옛 3단계 설정·옛 링크·옛 기록(gen 없음/0) | 옛 기록·링크는 이전 판 문구, v2.9 저장 설정은 쉬움 1·보통 4·어려움 7단계로 옮겨짐 |
| `node cdp.js t36-play-bars.js` (`SAMPLES=1` 이면 악기 소리) | 들어보기 마디별 소리 크기 (리듬·선율 × 1~7단계 × 박자표 × 못갖춘마디) | bad [] |
| `node cdp.js t37-chunked.js` | v3.1 나눠 예약 = 한꺼번 예약, 재생 중 예약 부품 수 | diff 1e-6 아래, 버튼 되돌아옴 |
| `node cdp.js t38-drums.js` | v3.2 타악기: 소리 크기·악센트 대비·마디별 소리·화면·기호 창·링크·가상 연주 | 악센트 +2.5dB↑, 휴대폰 흉내 -26dB↑, self 100 |
| `node cdp.js t39-kit.js` (`W=320` 폭) | v3.3 드럼 세트: 박자표·단계별 악보 캡처(kit-lv*.png), 오류·잘림, 들어보기, 가상 연주 | errs [] · over ≤ 0 · self 100 |
| `node cdp.js t40-newinst.js` | v3.4 소프라노 색소폰·더블베이스: 악기 목록, 악보(음자리표·이조 안내), 음역 | 오류 없음, 더블베이스 "한 옥타브 낮게" 안내 |
| **`bash run-all.sh <영문 폴더>`** | **전체 회귀 검사** (시험마다 크롬 프로필 새로). 폴더에 fake.wav(seed777 선율)·drum.wav·l7.wav — 만드는 법은 run-all.sh 머리말 | run-all.log 에 exit 1 없음, 녹음 100점 |

주의
- **가짜 마이크 파일(FAKE_WAV)은 영문 경로에 두세요.** 한글 경로(이 폴더)면 크롬이 못 읽어 "소리가 거의 녹음되지 않았습니다"가 나온다 (2026-09-28 확인, 원래 버전도 같음)
- 가짜 마이크 시험(t4)은 **녹음을 맨 먼저** 해야 정확하다. 앞에 다른 시험을 돌리면 크롬이 소리 파일을 미리 틀어 점수가 낮게 나온다
- `cdp.js` 는 크롬을 화면 없이 띄운다. 프로필은 `chrome-prof/`(저장소에 안 올라감)
- Aside 브라우저는 file:// 을 못 열고 캡처가 멈춘다 → 이 도구를 쓴다
