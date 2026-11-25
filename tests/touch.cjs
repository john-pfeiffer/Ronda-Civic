// Phone check: touch controls move and attack, and portrait shows the rotate prompt.
//   node tests/touch.cjs [baseUrl] [--shots dir]
const { chromium } = require('playwright');
const base = process.argv[2] && !process.argv[2].startsWith('--') ? process.argv[2] : 'http://localhost:4173/';
const shotsAt = process.argv.indexOf('--shots');
const shots = shotsAt > 0 ? process.argv[shotsAt + 1] : null;

(async () => {
  const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const fails = [];
  const check = (name, ok, detail = '') => {
    console.log(`${ok ? 'ok  ' : 'FAIL'} ${name} ${detail}`);
    if (!ok) fails.push(name);
  };

  // landscape phone
  const ctx = await browser.newContext({ viewport: { width: 844, height: 390 }, deviceScaleFactor: 2, hasTouch: true, isMobile: true });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e.stack || e)));
  await page.goto(`${base}?debug&res=0.4`, { waitUntil: 'load' });
  await page.waitForFunction(() => !document.getElementById('loader'), null, { timeout: 30000 });
  await page.waitForTimeout(800);
  const cdp = await ctx.newCDPSession(page);
  const touch = (type, pts) => cdp.send('Input.dispatchTouchEvent', { type, touchPoints: pts });
  const scenes = () => page.evaluate(() => window.__game.game.scene.getScenes(true).map((s) => s.scene.key));

  // the canvas is letterboxed: find where a 1920x1080 layout point lands on the screen
  const at = (x, y) => page.evaluate(([x, y]) => {
    const r = document.querySelector('canvas').getBoundingClientRect();
    return { x: r.left + (x / 1920) * r.width, y: r.top + (y / 1080) * r.height };
  }, [x, y]);
  const tap = async (x, y) => {
    const p = await at(x, y);
    await page.touchscreen.tap(p.x, p.y);
  };

  await tap(960, 540); // title: tap anywhere
  await page.waitForTimeout(900);
  check('tap starts the game', (await scenes()).includes('HeroSelect'));
  await tap(1530, 520); // Jordan's card selects...
  await page.waitForTimeout(400);
  await tap(1530, 520); // ...and a second tap confirms
  await page.waitForTimeout(1800);
  check('tapping a hero card picks that hero', (await page.evaluate(() => window.__game.level()?.heroId)) === 'jordan');

  const x0 = await page.evaluate(() => window.__game.level().hero.x);
  const stick = await at(300, 800);
  await touch('touchStart', [{ x: stick.x, y: stick.y, id: 1 }]);
  await touch('touchMove', [{ x: stick.x + 70, y: stick.y, id: 1 }]);
  await page.waitForTimeout(900);
  if (shots) await page.screenshot({ path: `${shots}/touch-landscape.png` });
  // second finger on the attack button while the first holds the stick
  const hit = await at(1690, 860);
  await touch('touchStart', [{ x: stick.x + 70, y: stick.y, id: 1 }, { x: hit.x, y: hit.y, id: 2 }]);
  await page.waitForTimeout(120);
  const state = await page.evaluate(() => window.__game.level().hero.state);
  await touch('touchEnd', []);
  const x1 = await page.evaluate(() => window.__game.level().hero.x);
  check('stick moves the hero right', x1 > x0 + 100, `(${Math.round(x0)} -> ${Math.round(x1)})`);
  check('attack button attacks while moving', state === 'attack' || state === 'dash', `(state ${state})`);
  check('no script errors', errors.length === 0, errors.join(' | '));
  await ctx.close();

  // portrait phone
  const ctx2 = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, hasTouch: true, isMobile: true });
  const p2 = await ctx2.newPage();
  await p2.goto(`${base}?res=0.4`, { waitUntil: 'load' });
  await p2.waitForTimeout(600);
  check('portrait shows the rotate prompt', await p2.evaluate(() => getComputedStyle(document.getElementById('rotate')).display !== 'none'));
  if (shots) await p2.screenshot({ path: `${shots}/touch-portrait.png` });
  await ctx2.close();

  await browser.close();
  process.exit(fails.length ? 1 : 0);
})();
