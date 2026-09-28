#!/bin/sh
# 사용: sh run-rec.sh name 'SETJSON'
cd "C:/Users/ultramsw67/Desktop/리듬 연습/검사"
W="C:/Users/ULTRAM~1/AppData/Local/Temp/qa-g/$1.wav"
node gen-wav.js ../index.html "$2" "$W" 0.7
SET="$2" FAKE_WAV="$W" CDP_PORT=9601 node cdp.js qa-g/rec.js
