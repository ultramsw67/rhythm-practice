module.exports = async (c) => {
  const port = process.env.PORT || 8782;
  await c.go(`http://127.0.0.1:${port}/offline/`);
  await c.sleep(1500);
  const r = await c.send('Page.getInstallabilityErrors', {});
  console.log('INSTALLABILITY_OFFLINE_APP', JSON.stringify(r.result));
  await c.go(`http://127.0.0.1:${port}/`);
  await c.sleep(1000);
  const r2 = await c.send('Page.getInstallabilityErrors', {});
  console.log('INSTALLABILITY_ONLINE_APP', JSON.stringify(r2.result));
};
