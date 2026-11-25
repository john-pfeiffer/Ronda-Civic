// End-to-end smoke test: a simple bot plays the whole level as each hero.
// The simulation is stepped directly (no waiting on real time), so it runs in seconds.
//   node tests/smoke.cjs [baseUrl] [hero,hero,...] [--shots dir]
const { chromium } = require('playwright');

const base = process.argv[2] && !process.argv[2].startsWith('--') ? process.argv[2] : 'http://localhost:4173/';
const heroes = (process.argv[3] && !process.argv[3].startsWith('--') ? process.argv[3] : 'cannon,lieu,jordan').split(',');
const shotsAt = process.argv.indexOf('--shots');
const shots = shotsAt > 0 ? process.argv[shotsAt + 1] : null;

/** Runs inside the page. Plays up to `maxFrames` frames and reports what happened. */
function bot(maxFrames) {
  const { game, controls } = window.__game;
  const level = () => window.__game.level();
  game.loop.sleep();
  const dt = 1000 / 60;
  const log = { frames: 0, minHp: Infinity, tweaked: false, dog: false, maxCombo: 0, stuckAt: null };
  let lastX = -1;
  let stillFor = 0;
  for (let f = 0; f < maxFrames; f++) {
    const l = level();
    const hero = l.hero;
    if (l.victory || l.gameOver) break;
    let target = null;
    for (const e of l.enemies) {
      if (!e.alive) continue;
      if (!target || Math.abs(e.x - hero.x) < Math.abs(target.x - hero.x)) target = e;
    }
    let x = 1;
    let y = 0;
    if (target) {
      const dx = target.x - hero.x;
      const dy = target.y - hero.y;
      const reach = hero.def.id === 'lieu' ? 190 : 130;
      x = Math.abs(dx) > reach ? Math.sign(dx) : Math.sign(dx) * 0.2;
      y = Math.abs(dy) > 18 ? Math.sign(dy) : 0;
      if (Math.abs(dx) < reach + 70 && Math.abs(dy) < 44) {
        if (f % 5 === 0) controls.tap('attack');
        if (hero.meter >= 100) controls.tap('special');
      }
      // hop over the boss's shockwave and charge
      if (l.boss && (l.boss.state === 'slamAir' && l.boss.vz < -900 || l.boss.state === 'charge' && Math.abs(dx) < 420) && !hero.airborne) controls.tap('jump');
    } else {
      y = Math.sin(f / 90) * 0.4;
    }
    controls.script = { x, y };
    game.loop.frame++;
    game.scene.update(f * dt, dt);
    log.frames = f + 1;
    log.minHp = Math.min(log.minHp, hero.hp);
    log.maxCombo = Math.max(log.maxCombo, l.combo);
    if (hero.frenzied) log.tweaked = true;
    if (l.doggy && l.doggy.found) log.dog = true;
    // progress watchdog: no enemies and not moving for 8 seconds means something is stuck
    if (!target && Math.abs(hero.x - lastX) < 0.5) stillFor++;
    else stillFor = 0;
    lastX = hero.x;
    if (stillFor > 480) { log.stuckAt = Math.round(hero.x); break; }
  }
  const l = level();
  controls.script = null;
  game.loop.wake();
  return {
    ...log,
    seconds: Math.round(log.frames / 60),
    victory: l.victory,
    gameOver: l.gameOver,
    lives: l.hero.lives,
    hp: l.hero.hp,
    score: l.score,
    heroX: Math.round(l.hero.x),
    bossHp: l.boss ? l.boss.hp : null,
    enemiesLeft: l.enemies.length,
  };
}

(async () => {
  const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  let failed = false;
  for (const hero of heroes) {
    const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
    const errors = [];
    page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
    page.on('pageerror', (e) => errors.push(String(e.stack || e)));
    await page.goto(`${base}?debug&res=0.4&hero=${hero}`, { waitUntil: 'load' });
    await page.waitForFunction(() => window.__game && window.__game.level() && window.__game.level().hero, null, { timeout: 30000 });
    const result = await page.evaluate(bot, 60 * 60 * 12);
    await page.waitForTimeout(400);
    if (shots) await page.screenshot({ path: `${shots}/smoke-${hero}.png` });
    const ok = errors.length === 0 && result.stuckAt === null && result.dog && (result.victory || result.gameOver);
    console.log(`${ok ? 'ok  ' : 'FAIL'} ${hero}`, JSON.stringify(result));
    if (errors.length) console.log('  errors:\n   ' + [...new Set(errors)].slice(0, 8).join('\n   '));
    if (!ok) failed = true;
    await page.close();
  }
  await browser.close();
  process.exit(failed ? 1 : 0);
})();
