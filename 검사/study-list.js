// 수드 리듬 공부 단원별 리듬 목록 출력: node 검사/study-list.js
const fs = require('fs'), path = require('path');
const h = fs.readFileSync(path.join(__dirname, '../study/index.html'), 'utf8');
new Function(/<script id="core">([\s\S]*?)<\/script>/.exec(h)[1])();
for (const u of RS.buildUnits()) console.log(u.key, u.items.length, u.items.map(i => i.p + ' (' + i.name + ')').join(' | '));
