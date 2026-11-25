// The level: builds the street, runs the fight, moves the camera, and decides
// when a wave is over, when the boss shows up and when the game is won or lost.
import Phaser from 'phaser';
import { fitCamera } from './ui';
import { ATLAS } from '../art/textures';
import { FLOOR_BOTTOM, FLOOR_TOP, H, LEVEL_W, MODULE_W, W, WALL_H } from '../config/game';
import { GROUND_ORDER, WALL_ORDER } from '../art/backgrounds';
import { PROPS } from '../art/props';
import { BOSS, type EnemyId } from '../data/enemies';
import type { HeroId } from '../data/heroes';
import { depthToY, LEVEL, type Encounter, type PickupKind, type Spawn } from '../data/level1';
import { hit, hitTest, radialTest, type Body, type HitDef, type Platform } from '../systems/combat';
import { controls } from '../systems/input';
import { audio } from '../systems/audio';
import { BigBoy } from '../entities/BigBoy';
import { Enemy } from '../entities/Enemy';
import type { Fighter } from '../entities/Fighter';
import { Fx } from '../entities/Fx';
import { Hero } from '../entities/Hero';
import { Crate, Doggy, Joanne, Pickup, Projectile, type ProjectileSpec } from '../entities/Things';

export interface LevelData {
  hero: HeroId;
  /** Index of the encounter to resume from (encounters.length = the boss). */
  checkpoint?: number;
  score?: number;
}

const KILL = hit({ dmg: 9999, x0: 0, x1: 0, kbx: 500, kbz: 700 });

export class Level extends Phaser.Scene {
  hero!: Hero;
  enemies: Fighter[] = [];
  pickups: Pickup[] = [];
  crates: Crate[] = [];
  projectiles: Projectile[] = [];
  platforms: Platform[] = [];
  bounds = { left: 40, right: W - 40 };
  tokens = new Set<Fighter>();
  maxTokens = 2;
  fx!: Fx;
  doggy: Doggy | null = null;
  joanne!: Joanne;
  boss: BigBoy | null = null;

  // read by the HUD
  score = 0;
  combo = 0;
  comboT = 0;
  elapsed = 0;
  goArrow = false;
  hint = '';
  victory = false;
  gameOver = false;
  checkpoint = 0;
  heroId: HeroId = 'cannon';

  private camX = 0;
  private furthest = 0;
  private encIdx = 0;
  private locked: Encounter | null = null;
  private bossLocked = false;
  private waveIdx = 0;
  private pending: { spawn: Spawn; at: number }[] = [];
  private waveGap = 0;
  private freeze = 0;
  private now = 0;
  private seed = 12345;
  private far!: Phaser.GameObjects.TileSprite;
  private mid!: Phaser.GameObjects.TileSprite;
  private lamps: Phaser.GameObjects.Image[] = [];

  constructor() {
    super('Level');
  }

  init(data: LevelData): void {
    this.heroId = data.hero ?? 'cannon';
    this.checkpoint = data.checkpoint ?? 0;
    this.score = data.score ?? 0;
    this.enemies = [];
    this.pickups = [];
    this.crates = [];
    this.projectiles = [];
    this.platforms = [];
    this.tokens = new Set();
    this.lamps = [];
    this.doggy = null;
    this.boss = null;
    this.combo = this.comboT = this.elapsed = 0;
    this.goArrow = false;
    this.hint = '';
    this.victory = this.gameOver = false;
    this.locked = null;
    this.bossLocked = false;
    this.pending = [];
    this.waveIdx = this.waveGap = this.freeze = this.now = 0;
  }

  create(): void {
    this.fx = new Fx(this);
    fitCamera(this);
    this.buildStreet();

    const encs = LEVEL.encounters;
    this.encIdx = Math.min(this.checkpoint, encs.length);
    const resumeAt = this.encIdx === 0 ? 0 : (this.encIdx < encs.length ? encs[this.encIdx].at : LEVEL.boss.at) - 520;
    this.camX = this.furthest = Math.max(0, resumeAt);
    const startX = this.encIdx === 0 ? LEVEL.start.x : this.camX + 360;

    for (const c of LEVEL.crates) if (c.x > this.camX + 200) this.crates.push(new Crate(this, c.x, depthToY(c.depth), c.drop));

    this.joanne = new Joanne(this, LEVEL.boss.joanne.x, LEVEL.boss.joanne.y);
    this.hero = new Hero(this, this.heroId, startX, LEVEL.start.y);

    const dogY = depthToY(LEVEL.doggy.depth);
    if (LEVEL.doggy.x > this.camX + 300) this.doggy = new Doggy(this, LEVEL.doggy.x, dogY);
    else {
      // already found before this checkpoint
      this.doggy = new Doggy(this, startX - 120, LEVEL.start.y + 30);
    }

    this.cameras.main.setScroll(this.camX, 0);
    this.scene.launch('Hud');
    audio.music('level');
    controls.flush();
    this.events.once('shutdown', () => this.scene.stop('Hud'));
  }

  // ------------------------------------------------------------- the street

  private buildStreet(): void {
    this.add.image(0, 0, 'bg:sky').setOrigin(0).setDisplaySize(W, H).setScrollFactor(0).setDepth(-100);
    this.far = this.add.tileSprite(0, 250, W, 420, 'bg:far').setOrigin(0).setScrollFactor(0).setDepth(-90);
    this.mid = this.add.tileSprite(0, 215, W, 520, 'bg:mid').setOrigin(0).setScrollFactor(0).setDepth(-80);

    GROUND_ORDER.forEach((kind, i) => {
      this.add.image(i * MODULE_W, FLOOR_TOP - 24, kind === 'street' ? 'bg:groundStreet' : 'bg:groundAlley').setOrigin(0).setDisplaySize(MODULE_W + 2, H - FLOOR_TOP + 24).setDepth(-60);
    });
    let x = 0;
    for (const name of WALL_ORDER) {
      const img = this.add.image(x, FLOOR_TOP - WALL_H, `bg:${name}`).setOrigin(0).setDepth(-50);
      x += img.width;
    }

    for (const p of LEVEL.props) {
      const def = PROPS[p.prop];
      if (p.solid) {
        const y1 = FLOOR_TOP + p.solid.d;
        this.platforms.push({ x0: p.x - p.solid.w / 2, x1: p.x + p.solid.w / 2, y0: FLOOR_TOP - 60, y1, h: p.solid.h });
        this.add.image(p.x, y1 + 6, ATLAS, `prop:${p.prop}`).setOrigin(0.5, 1).setDepth(y1);
        this.add.image(p.x, y1 + 2, ATLAS, 'prop:shadow').setDisplaySize(def.w * 1.1, 70).setDepth(-6);
      } else {
        this.add.image(p.x, p.y ?? FLOOR_TOP, ATLAS, `prop:${p.prop}`).setOrigin(0.5, 0.96).setDepth(p.y ?? FLOOR_TOP);
      }
    }

    // street lamps passing in front of the camera
    for (let lx = 700; lx < LEVEL_W * 1.3; lx += 1700) {
      this.lamps.push(this.add.image(lx, H + 30, ATLAS, 'prop:lamp').setOrigin(0.5, 1).setScrollFactor(1.3, 1).setDepth(6000).setScale(1.1));
    }
  }

  // ------------------------------------------------------------ world API

  rnd(): number {
    this.seed = (this.seed * 1664525 + 1013904223) % 4294967296;
    return this.seed / 4294967296;
  }

  sfx(name: string): void {
    audio.sfx(name);
  }

  shake(px: number, ms = 220): void {
    this.cameras.main.shake(ms, px / 1000);
  }

  toast(text: string): void {
    this.events.emit('toast', text);
  }

  private feedback(h: HitDef): void {
    this.sfx(h.heavy ? 'heavy' : 'hit');
    this.freeze = Math.max(this.freeze, Math.min(150, h.hitstop ?? 30));
    if (h.shake) this.shake(h.shake);
  }

  private applyHit(h: HitDef, t: Fighter, dir: 1 | -1, byHero: boolean): boolean {
    const dmg = t.takeHit(h, dir);
    if (dmg <= 0) return false;
    this.fx.spark(t.x - dir * 24, t.y, t.z + t.height * 0.55, !!h.heavy);
    if (byHero) {
      this.hero.gainMeter(dmg);
      this.score += dmg * 5;
      this.combo++;
      this.comboT = 1800;
      if (t.team === 'enemy' && this.rnd() < 0.3) this.sfx('squeal');
    }
    return true;
  }

  /** Box attack from a fighter against the other team. Returns everyone it hit. */
  strike(owner: Fighter, h: HitDef, exclude?: Set<Fighter>): Fighter[] {
    const byHero = owner.team === 'hero';
    const targets: Fighter[] = byHero ? this.enemies : [this.hero];
    const out: Fighter[] = [];
    for (const t of targets) {
      if (exclude?.has(t) || !hitTest(owner, h, t)) continue;
      if (this.applyHit(h, t, owner.facing, byHero)) {
        out.push(t);
        exclude?.add(t);
      }
    }
    let smashed = false;
    if (byHero) {
      for (const c of this.crates) {
        if (!c.broken && hitTest(owner, h, c)) {
          c.smash(h.dmg);
          smashed = true;
        }
      }
    }
    if (out.length || smashed) this.feedback(h);
    return out;
  }

  /** One attacker body against one target (projectiles, thrown pigs, Doggy). */
  strikeOne(body: Body, h: HitDef, target: Fighter, dir: 1 | -1, byHero = true): boolean {
    if (!hitTest(body, h, target)) return false;
    if (!this.applyHit(h, target, dir, byHero)) return false;
    this.feedback(h);
    return true;
  }

  /** Ground shockwave around a point. */
  radial(owner: Fighter, x: number, y: number, radius: number, h: HitDef, maxZ = Infinity): Fighter[] {
    const byHero = owner.team === 'hero';
    const targets: Fighter[] = byHero ? this.enemies : [this.hero];
    const out: Fighter[] = [];
    for (const t of targets) {
      if (t === owner || !radialTest(x, y, radius, t, maxZ)) continue;
      if (this.applyHit(h, t, t.x >= x ? 1 : -1, byHero)) out.push(t);
    }
    if (byHero) for (const c of this.crates) if (!c.broken && radialTest(x, y, radius, c)) c.smash(h.dmg);
    if (out.length) this.feedback(h);
    return out;
  }

  spawnProjectile(spec: ProjectileSpec): void {
    this.projectiles.push(new Projectile(this, spec));
  }

  spawnPickup(kind: PickupKind, x: number, y: number): void {
    this.pickups.push(new Pickup(this, kind, x, y));
  }

  onPickup(p: Pickup): void {
    const hero = this.hero;
    if (p.kind === 'food') {
      hero.heal(40);
      this.sfx('food');
      this.fx.text('+HEALTH', hero.x, hero.y - 300, '#8fd16a');
    } else if (p.kind === 'record') {
      this.score += 250;
      hero.gainMeter(25);
      this.sfx('pickup');
      this.fx.text('+250', hero.x, hero.y - 300);
    } else {
      hero.startFrenzy();
      this.sfx('power');
      this.shake(6);
      this.toast('TWEAKED!');
    }
  }

  onHeroHurt(_dmg: number): void {
    this.combo = 0;
  }

  onHeroDown(): void {
    const hero = this.hero;
    hero.lives--;
    if (hero.lives > 0) {
      hero.revive();
      this.toast(hero.lives === 1 ? 'LAST LIFE!' : `${hero.lives} LIVES LEFT`);
      return;
    }
    this.gameOver = true;
    audio.music(null);
    this.sfx('lose');
    this.time.delayedCall(900, () => this.scene.launch('GameOver', { hero: this.heroId, checkpoint: this.encIdx, score: Math.floor(this.score / 2) }));
  }

  onEnemyDead(e: Fighter): void {
    this.score += e instanceof Enemy ? e.def.score : 0;
    // the odd pig drops something
    const roll = this.rnd();
    if (roll < 0.1) this.spawnPickup('food', e.x, e.y);
    else if (roll < 0.26) this.spawnPickup('record', e.x, e.y);
    else if (roll < 0.3 && !this.hero.frenzied) this.spawnPickup('tweaker', e.x, e.y);
  }

  onBossHurt(): void {
    if (this.rnd() < 0.25) this.joanne.cheer(900);
  }

  onBossStunned(): void {
    this.joanne.cheer(1800);
    this.toast('HE IS SEEING STARS: HIT HIM!');
  }

  summonAdds(i: number): void {
    const wave = LEVEL.boss.adds[i];
    if (!wave) return;
    for (const s of wave) this.pending.push({ spawn: s, at: this.now + (s.delay ?? 0) });
  }

  onBossDead(): void {
    this.victory = true;
    this.score += BOSS.score;
    this.pending = [];
    for (const e of this.enemies) if (e !== this.boss && e.alive) e.takeHit(KILL, e.x >= this.hero.x ? 1 : -1);
    audio.music('victory');
    this.sfx('win');
    this.hero.inputLocked = true;
    this.goArrow = false;
    this.hint = '';
    this.time.delayedCall(700, () => {
      this.joanne.free(this.hero.x + 150, this.hero.y);
      this.joanne.cheer();
      this.doggy?.celebrate();
      this.hero.facing = 1;
    });
    this.time.delayedCall(3400, () => this.scene.launch('Victory', { hero: this.heroId, score: this.score, time: this.elapsed }));
  }

  // ------------------------------------------------------------- game loop

  private spawnEnemy(s: Spawn): void {
    const x = s.side === 'L' ? this.camX - 140 : this.camX + W + 140;
    this.enemies.push(new Enemy(this, s.type as EnemyId, x, depthToY(s.depth ?? 0.5)));
  }

  private startWave(waves: Spawn[][]): void {
    for (const s of waves[this.waveIdx]) this.pending.push({ spawn: s, at: this.now + (s.delay ?? 0) });
  }

  private runEncounters(dt: number): void {
    const encs = LEVEL.encounters;
    // release queued spawns
    for (let i = this.pending.length - 1; i >= 0; i--) {
      if (this.now >= this.pending[i].at) {
        this.spawnEnemy(this.pending[i].spawn);
        this.pending.splice(i, 1);
      }
    }
    if (this.victory || this.gameOver) return;

    if (this.locked) {
      if (this.pending.length === 0 && this.enemies.length === 0) {
        this.waveGap += dt;
        if (this.waveGap < 500) return;
        this.waveGap = 0;
        this.waveIdx++;
        if (this.waveIdx < this.locked.waves.length) this.startWave(this.locked.waves);
        else {
          this.locked = null;
          this.encIdx++;
          this.goArrow = true;
          this.hint = '';
          this.sfx('select');
        }
      }
      return;
    }
    if (this.bossLocked) return;

    const next = this.encIdx < encs.length ? encs[this.encIdx] : null;
    if (next && this.camX >= next.at - 3) {
      this.locked = next;
      this.waveIdx = 0;
      this.waveGap = 0;
      this.goArrow = false;
      this.hint = next.hint ?? '';
      this.startWave(next.waves);
    } else if (!next && this.camX >= LEVEL.boss.at - 3) {
      this.bossLocked = true;
      this.goArrow = false;
      this.hint = '';
      audio.music('boss');
      this.boss = new BigBoy(this, LEVEL.boss.spawnX, depthToY(0.5));
      this.boss.dropIn();
      this.enemies.push(this.boss);
      this.toast('BIG BOY');
    }
  }

  private moveCamera(dt: number): void {
    const encs = LEVEL.encounters;
    const stop = this.locked ? this.locked.at : this.bossLocked ? LEVEL.boss.at : this.encIdx < encs.length ? encs[this.encIdx].at : LEVEL.boss.at;
    const min = this.locked || this.bossLocked ? stop : Math.max(0, this.furthest - 500);
    const want = Phaser.Math.Clamp(this.hero.x - W * 0.42 + this.hero.facing * 60, min, Math.max(min, stop));
    this.camX += (want - this.camX) * Math.min(1, dt * 0.007);
    if (Math.abs(want - this.camX) < 0.5) this.camX = want;
    this.furthest = Math.max(this.furthest, this.camX);
    this.cameras.main.setScroll(Math.round(this.camX), 0);
    this.bounds.left = this.camX + 50;
    this.bounds.right = this.camX + W - 50;
    this.far.tilePositionX = this.camX * 0.12;
    this.mid.tilePositionX = this.camX * 0.3;
  }

  update(_time: number, delta: number): void {
    const dt = Math.min(delta, 40);
    controls.update();
    if (this.freeze > 0) {
      this.freeze -= dt;
      return;
    }
    this.now += dt;
    if (!this.victory && !this.gameOver) this.elapsed += dt;
    if (this.comboT > 0 && (this.comboT -= dt) <= 0) this.combo = 0;

    this.hero.update(dt);
    for (const e of this.enemies) e.update(dt);
    for (const p of this.projectiles) p.update(dt);
    for (const p of this.pickups) p.update(dt);
    this.doggy?.update(dt);
    this.joanne.update(dt);

    for (const e of this.enemies) if (e.removed) e.destroy();
    this.enemies = this.enemies.filter((e) => !e.removed);
    this.projectiles = this.projectiles.filter((p) => !p.dead);
    this.pickups = this.pickups.filter((p) => !p.taken);
    this.crates = this.crates.filter((c) => !c.broken);

    this.runEncounters(dt);
    this.moveCamera(dt);
  }
}

export { FLOOR_BOTTOM };
