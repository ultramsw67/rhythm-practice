#!/bin/bash
# 전체 회귀 검사 (v3.2): 시험마다 크롬 프로필을 새로 만들어 앞 시험의 저장값이 섞이지 않게 한다
# wav 만들기: node gen-wav.js ../index.html '<SET>' <폴더>/fake.wav 0.7 — fake=선율 seed777(t22 SET), drum=스네어 5단계 seed91, l7=리듬 7단계 seed1234, kit=드럼 세트 5단계 seed7, contrabass=더블베이스 선율 3단계 B♭ seed5, scale=음계 7단계 4/4 알토 색소폰 seed3 (v3.8.2), lv68=리듬 6/8 4단계 seed4242 기호 없음 (v3.8.3). v3.8.3 부터 SET 에 "rv":2 (새 난이도 규칙), v3.9 부터 "gen":3 (5단계: 스네어·드럼 세트 4단계, 리듬·음계 5단계, lv68 은 6/8 3단계) (아래 t4 SET 과 같게)
# v3.9.2: swing.wav = 리듬 스타일 스윙 3단계 seed321 BPM 120 (아래 t4 SET 과 같게). style-scan 은 OLDIDX=<옛 index.html> 이면 스타일 없는 악보 비교
# 사용: bash run-all.sh <영문 경로 폴더: fake.wav(seed777 선율)·drum.wav·l7.wav 가 있는 곳>  (서버 127.0.0.1:8765 켜 둘 것)
W="$1"; cd "$(dirname "$0")"; LOG=run-all.log; : > $LOG
# 검사용 서버(127.0.0.1:8765)가 꺼져 있으면 시작하지 않는다 (v3.9.4)
if ! curl -s -o /dev/null --max-time 5 http://127.0.0.1:8765/index.html; then echo "서버가 꺼져 있습니다: node serve.js .. 를 먼저 켜세요" | tee -a $LOG; exit 2; fi
# 크롬이 늦게 떠서 실패하면(앞 시험의 크롬이 덜 닫힘) 크롬을 정리하고 한 번 더 (v3.9.1)
run() { local name="$1"; shift; sleep 2; rm -rf chrome-prof; echo "=== $name" >> $LOG; local out; out=$(env "$@" timeout 300 node cdp.js $name 2>&1); local rc=$?
  if [ $rc -ne 0 ] && echo "$out" | grep -q "크롬이 뜨지 않았습니다"; then echo "(크롬 다시 띄움)" >> $LOG; powershell -NoProfile -Command "Get-CimInstance Win32_Process -Filter \"name='chrome.exe'\" | Where-Object { \$_.CommandLine -like '*remote-debugging-port=9333*' } | ForEach-Object { Stop-Process -Id \$_.ProcessId -Force }" >/dev/null 2>&1; sleep 5; rm -rf chrome-prof; out=$(env "$@" timeout 300 node cdp.js $name 2>&1); rc=$?; fi
  if [ $rc -eq 0 ] && echo "$out" | grep -q "SCRIPT ERR"; then rc=9; fi
  if [ $rc -eq 0 ] && { [ "$name" = t4.js ] || [ "$name" = t3.js ] || [ "$name" = t21-offline.js ]; } && ! echo "$out" | grep -q "100점"; then rc=8; fi   # 녹음 시험은 100점이어야 통과 (v3.9.6: 점수가 낮아도 exit 0 으로 지나가던 것)   # 시험 스크립트 오류도 실패로 (v3.9.4: 서버가 꺼져 페이지를 못 열었는데 exit 0 으로 지나감)
  echo "$out" >> $LOG; echo "exit $rc" >> $LOG; }
echo "=== test-core" >> $LOG; node test-core.js ../index.html 2>&1 | tail -3 | cut -c1-300 >> $LOG
echo "=== scale-quick" >> $LOG; node scale-quick.js ../index.html >> $LOG 2>&1
echo "=== scale-levels" >> $LOG; node scale-levels.js ../index.html >> $LOG 2>&1
echo "=== lv-scan" >> $LOG; node lv-scan.js ../index.html | tail -5 >> $LOG 2>&1
echo "=== lv-scan gen2" >> $LOG; GEN=2 SEEDS=3 node lv-scan.js ../index.html | tail -4 >> $LOG 2>&1
echo "=== variety" >> $LOG; N=100 node variety.js ../index.html >> $LOG 2>&1
echo "=== range-scan" >> $LOG; node range-scan.js ../index.html | tail -1 >> $LOG 2>&1
echo "=== style-scan" >> $LOG; OLD="$OLDIDX" node style-scan.js ../index.html | tail -3 >> $LOG 2>&1
echo "=== test-score" >> $LOG; node test-score.js ../index.html 2>&1 | grep -E "LOW|^perfect|^jitter|^drop|^wrong|^fast" >> $LOG
run t4.js FAKE_WAV="$W/fake.wav" SET='{"gen":3,"rv":2,"mode":"melody","meter":"4/4","level":2,"bars":4,"key":"Bb","inst":"clarinet","bpm":96,"pickup":"off","artic":"auto","seed":777,"edits":{}}'
run t4.js FAKE_WAV="$W/drum.wav" SET='{"gen":3,"rv":2,"drum":"snare","mode":"rhythm","meter":"4/4","level":4,"bars":4,"key":"C","inst":"clarinet","bpm":100,"pickup":"off","artic":"auto","seed":91,"edits":{}}'
run t4.js FAKE_WAV="$W/l7.wav" SET='{"gen":3,"rv":2,"drum":"","mode":"rhythm","meter":"4/4","level":5,"bars":4,"key":"C","inst":"clarinet","bpm":90,"pickup":"auto","artic":"auto","seed":1234,"edits":{}}'
run t4.js FAKE_WAV="$W/kit.wav" SET='{"gen":3,"rv":2,"drum":"kit","mode":"rhythm","meter":"4/4","level":4,"bars":4,"key":"C","inst":"clarinet","bpm":90,"pickup":"off","artic":"auto","seed":7,"edits":{}}'
run t4.js FAKE_WAV="$W/contrabass.wav" SET='{"gen":3,"rv":2,"drum":"","mode":"melody","meter":"4/4","level":3,"bars":4,"key":"Bb","inst":"contrabass","bpm":90,"pickup":"off","artic":"auto","seed":5,"edits":{}}'
run t4.js FAKE_WAV="$W/scale.wav" SET='{"gen":3,"rv":2,"sv":2,"mode":"melody","prac":"scale","minor":"h","kref":"","meter":"4/4","level":5,"bars":4,"key":"Bb","inst":"alto_sax","bpm":88,"pickup":"auto","artic":"auto","seed":3,"edits":{}}'
run t22-scriptproc.js FAKE_WAV="$W/fake.wav"
run t27-recquality.js FAKE_WAV="$W/fake.wav"
run t27-recquality.js FAKE_WAV="$W/fake.wav" BT=keep
for t in t1.js t2.js t6-fixes.js t7-art.js t8-guide.js t9-brand.js t10-v12.js t11-color.js t12-artic-sound.js t13-play.js t14-highlight.js t16-screens.js t18-reset-start.js t19-install.js t20-melody-mobile.js t23-clip.js t24-tune.js t30-samples.js t32-inapp.js t33-ui.js t34-score-fit.js t35-levels.js t35b-legacy.js t36-play-bars.js t37-chunked.js t38-drums.js t39-kit.js t40-newinst.js t41-bow.js t42-piano.js t43-scale.js t43b-scale-fit.js; do run $t X=1; done
for t in t15-buttons.js t17-reclock.js t28-background.js t29-return-again.js; do run $t FAKE_WAV="$W/fake.wav"; done
run t53-rec-color.js FAKE_WAV="$W/fake.wav"
run t43-scale.js W=320
run t36-play-bars.js SAMPLES=1
run qa-f/f1b-clip.js X=1
run qa-f/f3b-slowmic.js X=1
run qa-f/f3c-micbusy-set.js X=1
run t3.js FAKE_WAV="$W/fake.wav" SET='{"gen":3,"rv":2,"mode":"melody","meter":"4/4","level":2,"bars":4,"key":"Bb","inst":"clarinet","bpm":96,"pickup":"off","artic":"auto","seed":777,"edits":{}}'
run t44-game.js FAKE_WAV="$W/fake.wav"
run t59-stat.js FAKE_WAV="$W/fake.wav"
run t45-curves.js
run t46-scale-levels.js
run t47-levels-mobile.js
run t4.js FAKE_WAV="$W/lv68.wav" SET='{"gen":3,"rv":2,"mode":"rhythm","meter":"6/8","level":3,"bars":4,"key":"C","inst":"clarinet","bpm":88,"pickup":"off","artic":"none","seed":4242,"edits":{}}'
run t43b-scale-fit.js BPM=120
run t50-v391.js X=1
run t51-styles.js X=1
run t51-styles.js W=320
run t52-accomp.js X=1
run t4.js FAKE_WAV="$W/swing.wav" SET='{"gen":3,"rv":2,"style":"swing","drum":"","mode":"rhythm","meter":"4/4","level":3,"bars":4,"key":"C","inst":"clarinet","bpm":120,"pickup":"off","artic":"auto","seed":321,"edits":{}}'
run qa-g/g7-overlap.js X=1
run t54-tempo-android.js X=1
run t55-android-all.js X=1
run t21-offline.js MODE=file FAKE_WAV="$W/fake.wav"
echo ALLDONE >> $LOG
