// 볼트의 사용 설명서(md) → 앱 안 guide.html
// 사용: node build-guide.js
const fs = require('fs'), path = require('path');
const SRC = 'C:/Obsidian/tomwiki/40_프로젝트/리듬 연습 앱/리듬 연습 앱 사용 설명서.md';
const OUT = path.join(__dirname, '..', 'guide.html');
let md = fs.readFileSync(SRC, 'utf8').replace(/^---[\s\S]*?---\s*/, '');
const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const inline = s => esc(s)
  .replace(/\*\*(https?:\/\/[^*]+)\*\*/g, '<a href="$1"><b>$1</b></a>')
  .replace(/\*\*([^*]+)\*\*/g, '<b>$1</b>')
  .replace(/\((\d-\d)\)/g, '(<a href="#s$1">$1</a>)')
  .replace(/\((\d)장/g, '(<a href="#s$1">$1장</a>');
const lines = md.split(/\r?\n/);
let html = '', para = [], toc = [], inTable = false, rows = [];
const flush = () => { if (para.length) { html += '<p>' + para.map(inline).join('<br>') + '</p>\n'; para = []; } };
const flushTable = () => {
  if (!rows.length) return;
  const cells = r => r.replace(/^\||\|$/g, '').split('|').map(c => c.trim());
  const head = cells(rows[0]);
  html += '<div class="tbl"><table><thead><tr>' + head.map(c => `<th>${inline(c)}</th>`).join('') + '</tr></thead><tbody>' +
    rows.slice(2).map(r => '<tr>' + cells(r).map(c => `<td>${inline(c)}</td>`).join('') + '</tr>').join('') + '</tbody></table></div>\n';
  rows = [];
};
let title = '';
for (const ln of lines) {
  if (/^\|/.test(ln)) { flush(); rows.push(ln); continue; } else flushTable();
  if (/^# /.test(ln)) { title = ln.slice(2).trim(); continue; }
  if (/^---\s*$/.test(ln)) { flush(); html += '<hr>\n'; continue; }
  let m;
  if ((m = /^## (\d+)\. (.*)/.exec(ln))) { flush(); toc.push([m[1], m[2]]); html += `<h2 id="s${m[1]}">${m[1]}. ${inline(m[2])}</h2>\n`; continue; }
  if ((m = /^## (.*)/.exec(ln))) { flush(); html += `<h2>${inline(m[1])}</h2>\n`; continue; }
  if ((m = /^### (\d+-\d+)\. (.*)/.exec(ln))) { flush(); html += `<h3 id="s${m[1]}">${m[1]}. ${inline(m[2])}</h3>\n`; continue; }
  if ((m = /^### (.*)/.exec(ln))) { flush(); html += `<h3>${inline(m[1])}</h3>\n`; continue; }
  if (!ln.trim()) { flush(); continue; }
  para.push(ln.trim());
}
flush(); flushTable();
const tocHtml = '<nav class="toc"><b>차례</b><ol>' + toc.map(([n, t]) => `<li><a href="#s${n}">${inline(t)}</a></li>`).join('') + '</ol></nav>';
const page = `<!doctype html>
<html lang="ko">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>리듬 연습 사용법</title>
<link rel="icon" href="img/sood-192.jpg">
<style>
:root{--bg:#f4f5f7;--card:#fff;--ink:#1b1f27;--sub:#5b6472;--line:#dde1e7;--accent:#1f5fbf;--soft:#e8eefa}
@media (prefers-color-scheme: dark){:root:not([data-theme="light"]){--bg:#12151b;--card:#1b2029;--ink:#e7eaf0;--sub:#9aa3b2;--line:#2d3441;--accent:#6ea2ff;--soft:#223049}}
:root[data-theme="dark"]{--bg:#12151b;--card:#1b2029;--ink:#e7eaf0;--sub:#9aa3b2;--line:#2d3441;--accent:#6ea2ff;--soft:#223049}
*{box-sizing:border-box}
body{margin:0;background:var(--bg);color:var(--ink);font:16px/1.7 -apple-system,BlinkMacSystemFont,"Apple SD Gothic Neo","Malgun Gothic","Noto Sans KR",sans-serif}
header{position:sticky;top:0;background:var(--bg);border-bottom:1px solid var(--line);padding:10px 16px;display:flex;align-items:center;gap:10px;z-index:2}
header h1{font-size:17px;margin:0;flex:1}
header a{color:var(--accent);text-decoration:none;font-weight:600;border:1px solid var(--line);border-radius:8px;padding:6px 12px;background:var(--card)}
main{max-width:760px;margin:0 auto;padding:14px 16px 60px}
.doc{background:var(--card);border:1px solid var(--line);border-radius:12px;padding:6px 18px 18px}
h2{font-size:20px;margin:28px 0 8px;padding-top:8px;scroll-margin-top:64px}
h3{font-size:16.5px;margin:20px 0 6px;color:var(--accent);scroll-margin-top:64px}
p{margin:8px 0}
a{color:var(--accent)}
hr{border:0;border-top:1px solid var(--line);margin:22px 0}
.tbl{overflow-x:auto;margin:10px 0}
table{border-collapse:collapse;width:100%;font-size:14.5px;min-width:420px}
th,td{border:1px solid var(--line);padding:7px 9px;text-align:left;vertical-align:top}
th{background:var(--soft)}
.toc{background:var(--soft);border-radius:10px;padding:10px 14px;margin:14px 0}
.toc ol{margin:6px 0 0;padding-left:22px}
.toc a{text-decoration:none}
</style>
</head>
<body>
<header><img src="img/sood-192.jpg" alt="" width="34" height="34" style="border-radius:50%"><h1>${esc(title)}</h1><a href="./">앱으로</a></header>
<main><div class="doc">
${html.replace('<hr>\n', tocHtml + '\n<hr>\n')}
</div></main>
</body>
</html>
`;
fs.writeFileSync(OUT, page, 'utf8');
console.log('guide.html', page.length, 'bytes,', toc.length, 'sections');
