// 한 번도 연 적 없는 상태에서 처음부터 오프라인이면 무슨 일이 일어나는지 (친절한 안내가 있는지)
module.exports = async (c) => {
  await c.send('Network.enable');
  await c.send('Network.emulateNetworkConditions', { offline: true, latency: 0, downloadThroughput: -1, uploadThroughput: -1 });
  const port = process.env.PORT || 8782;
  await c.go(`http://127.0.0.1:${port}/offline/`);
  const r = await c.ev(`({ title: document.title, bodyLen: document.body ? document.body.innerText.length : -1, bodySnippet: document.body ? document.body.innerText.slice(0,200) : '(no body)' })`).catch(e => ({ evalError: e.message }));
  console.log('FIRST_EVER_OFFLINE', JSON.stringify(r));
};
