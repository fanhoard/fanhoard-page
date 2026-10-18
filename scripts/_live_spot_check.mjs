import { chromium } from 'playwright';
const b = await chromium.launch();
const errs = {};
for (const [name, url, checkSel] of [
  ['home','https://develop.fanhoard.pages.dev/home/','.bottom-nav'],
  ['discover','https://develop.fanhoard.pages.dev/data/verse/discover/','#nav-list .main-button'],
  ['setting','https://develop.fanhoard.pages.dev/setting/','.c-list-row, .setting']
]) {
  const pg = await b.newPage({viewport:{width:390,height:844}});
  const pageErrs = [];
  pg.on('pageerror', e => pageErrs.push(e.message));
  await pg.goto(url, {waitUntil:'networkidle', timeout:45000});
  const found = await pg.locator(checkSel).first().count().catch(()=>0);
  const bg = await pg.evaluate(()=>getComputedStyle(document.body).backgroundColor);
  const ver = await pg.evaluate(()=>window.__FH_VERSION || (window.FH_BOOT&&window.FH_BOOT.version) || document.querySelector('meta[name="version"]')?.content || null);
  errs[name] = {pageErrors: pageErrs.length, capsuleOrNavFound: found>0, bodyBg: bg, version: ver};
  await pg.close();
}
console.log(JSON.stringify(errs, null, 1));
await b.close();
