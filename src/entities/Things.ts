// Everything on the street that is not a fighter: pickups, crates, projectiles, Doggy, Joanne.
import type Phaser from 'phaser';
import { ATLAS } from '../art/textures';
import { RigView } from '../art/rigView';
import { hit, hitTest, type HitDef } from '../systems/combat';
import { GRAVITY } from '../config/game';
import type { PickupKind } from '../data/level1';
import type { Fighter, Team } from './Fighter';
import type { Level } from '../scenes/Level';

// ------------------------------------------------------------------ pickups

export class Pickup {
  z: number;
  vz = 520;
  taken = false;
  /** Doggy is carrying it. */
  carried = false;
  private age = 0;
  readonly sprite: Phaser.GameObjects.Image;
  private shadow: Phaser.GameObjects.Image;

  constructor(private world: Level, readonly kind: PickupKind, public x: number, public y: number, z = 40) {
    this.z = z;
    this.sprite = world.add.image(x, y, ATLAS, `prop:${kind}`).setScale(kind === 'tweaker' ? 0.95 : 0.9);
    this.shadow = world.add.image(x, y, ATLAS, 'prop:shadow').setScale(0.4);
  }

  update(dt: number): void {
    this.age += dt;
    if (!this.carried) {
      if (this.z > 0 || this.vz > 0) {
        this.vz -= GRAVITY * 0.7 * (dt / 1000);
        this.z = Math.max(0, this.z + this.vz * (dt / 1000));
        if (this.z === 0) this.vz = 0;
      }
      const hero = this.world.hero;
      if (this.age > 250 && hero.alive && Math.abs(hero.x - this.x) < 80 && Math.abs(hero.y - this.y) < 50 && hero.z < 90) this.collect();
    }
    const bob = this.z === 0 && !this.carried ? Math.sin(this.age / 220) * 8 + 26 : 20;
    this.sprite.setPosition(this.x, this.y - this.z - bob - 30).setDepth(this.y + 0.2);
    if (this.kind === 'tweaker') this.sprite.setAngle(Math.sin(this.age / 160) * 8);
    this.shadow.setPosition(this.x, this.y).setDepth(this.y - 0.6).setVisible(!this.carried);
  }

  collect(): void {
    if (this.taken) return;
    this.taken = true;
    this.world.onPickup(this);
    this.destroy();
  }

  destroy(): void {
    this.sprite.destroy();
    this.shadow.destroy();
  }
}

// ------------------------------------------------------------------- crates

export class Crate {
  hp = 2;
  broken = false;
  readonly radius = 66;
  readonly height = 130;
  readonly z = 0;
  readonly facing = 1 as const;
  private sprite: Phaser.GameObjects.Image;

  constructor(private world: Level, public x: number, public y: number, private drop: PickupKind) {
    this.sprite = world.add.image(x, y, ATLAS, 'prop:crate').setOrigin(0.5, 0.95).setDepth(y);
  }

  smash(dmg: number): void {
    if (this.broken) return;
    this.hp -= dmg >= 14 ? 2 : 1;
    this.world.tweens.add({ targets: this.sprite, scaleX: 1.12, scaleY: 0.9, duration: 60, yoyo: true });
    if (this.hp > 0) return;
    this.broken = true;
    this.world.fx.debris(this.x, this.y);
    this.world.sfx('crash');
    this.world.spawnPickup(this.drop, this.x, this.y);
    this.sprite.destroy();
  }
}

// -------------------------------------------------------------- projectiles

export interface ProjectileSpec {
  key: string;
  x: number;
  y: number;
  z: number;
  vx: number;
  team: Team;
  hit: HitDef;
  range: number;
  spin: number;
  /** Keeps going after hitting someone. */
  pierce: boolean;
}

export class Projectile {
  dead = false;
  private travelled = 0;
  private struck = new Set<Fighter>();
  private sprite: Phaser.GameObjects.Image;
  private shadow: Phaser.GameObjects.Image;

  constructor(private world: Level, private s: ProjectileSpec) {
    this.sprite = world.add.image(s.x, s.y - s.z, ATLAS, s.key);
    this.shadow = world.add.image(s.x, s.y, ATLAS, 'prop:shadow').setScale(0.3);
  }

  update(dt: number): void {
    const s = this.s;
    const step = s.vx * (dt / 1000);
    s.x += step;
    this.travelled += Math.abs(step);
    this.sprite.setPosition(s.x, s.y - s.z).setDepth(s.y + 0.3).setAngle(this.sprite.angle + s.spin * (dt / 1000) * Math.sign(s.vx));
    this.shadow.setPosition(s.x, s.y).setDepth(s.y - 0.6);
    const body = { x: s.x, y: s.y, z: s.z, facing: (s.vx >= 0 ? 1 : -1) as 1 | -1, radius: 20, height: 40 };
    const targets: Fighter[] = s.team === 'hero' ? this.world.enemies : [this.world.hero];
    for (const t of targets) {
      if (this.struck.has(t) || !hitTest(body, s.hit, t)) continue;
      if (this.world.strikeOne(body, s.hit, t, body.facing, s.team === 'hero')) {
        this.struck.add(t);
        if (!s.pierce) return this.destroy();
      }
    }
    if (this.travelled >= s.range) this.destroy();
  }

  destroy(): void {
    if (this.dead) return;
    this.dead = true;
    this.world.fx.puff(this.s.x, this.s.y - this.s.z + 20, 0.5);
    this.sprite.destroy();
    this.shadow.destroy();
  }
}

// -------------------------------------------------------------------- Doggy

const BITE = hit({ dmg: 5, x0: -40, x1: 90, kbx: 60, stun: 650, yTol: 50 });

export class Doggy {
  found = false;
  private view: RigView;
  private shadow: Phaser.GameObjects.Image;
  private boxBack: Phaser.GameObjects.Image;
  private boxFront: Phaser.GameObjects.Image;
  private bubble: Phaser.GameObjects.Image;
  private mode: 'boxed' | 'follow' | 'attack' | 'fetch' | 'bite' = 'boxed';
  private biteCd = 2500;
  private t = 0;
  private target: Fighter | null = null;
  private fetching: Pickup | null = null;
  private facing: 1 | -1 = -1;

  constructor(private world: Level, public x: number, public y: number) {
    this.boxBack = world.add.image(x, y + 14, ATLAS, 'prop:boxBack').setOrigin(0.5, 1).setDepth(y - 2);
    this.shadow = world.add.image(x, y, ATLAS, 'prop:shadow').setScale(0.5).setVisible(false);
    this.view = new RigView(world, 'doggy', 'sit');
    this.boxFront = world.add.image(x, y + 14, ATLAS, 'prop:boxFront').setOrigin(0.5, 1).setDepth(y + 2);
    this.bubble = world.add.image(x + 40, y - 190, ATLAS, 'prop:bubble').setDepth(y + 3);
    world.tweens.add({ targets: this.bubble, y: y - 210, duration: 400, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
  }

  update(dt: number): void {
    const w = this.world;
    const hero = w.hero;
    this.t += dt;
    let speed = 0;
    let gx = this.x;
    let gy = this.y;

    switch (this.mode) {
      case 'boxed':
        this.view.play('sit');
        if (Math.abs(hero.x - this.x) < 230 && Math.abs(hero.y - this.y) < 190) {
          this.found = true;
          this.mode = 'follow';
          this.bubble.destroy();
          w.sfx('bark');
          w.toast('DOGGY JOINED THE BAND!');
          w.fx.puff(this.x, this.y);
          this.t = 0;
        }
        break;

      case 'follow': {
        this.biteCd -= dt;
        gx = hero.x - hero.facing * 130;
        gy = hero.y + 34;
        speed = Math.hypot(gx - this.x, gy - this.y) > 70 ? 640 : 0;
        if (this.t < 700) {
          speed = 0;
          this.view.play('happy');
          break;
        }
        // fetch anything lying out of the hero's reach
        const far = w.pickups.find((p) => !p.taken && !p.carried && Math.abs(p.x - hero.x) > 200 && Math.abs(p.x - this.x) < 1100 && p.x > w.bounds.left && p.x < w.bounds.right);
        if (far) {
          this.fetching = far;
          this.mode = 'fetch';
          break;
        }
        if (this.biteCd <= 0) {
          const prey = w.enemies.filter((e) => e.hittable && !e.airborne && e.throwable && Math.abs(e.x - this.x) < 620).sort((a, b) => Math.abs(a.x - this.x) - Math.abs(b.x - this.x))[0];
          if (prey) {
            this.target = prey;
            this.mode = 'attack';
            break;
          }
        }
        break;
      }

      case 'attack': {
        const e = this.target;
        if (!e || !e.hittable || e.airborne) {
          this.mode = 'follow';
          break;
        }
        const side = this.x <= e.x ? -1 : 1;
        gx = e.x + side * 70;
        gy = e.y + 4;
        speed = 780;
        if (Math.abs(gx - this.x) < 26 && Math.abs(gy - this.y) < 26) {
          this.facing = side === -1 ? 1 : -1;
          this.mode = 'bite';
          this.t = 0;
          this.view.play('bite', { restart: true });
          w.sfx('bark');
        }
        break;
      }

      case 'bite': {
        const e = this.target;
        if (e && this.t >= 110 && this.t - dt < 110) {
          w.strikeOne({ x: this.x, y: this.y, z: 0, facing: this.facing, radius: 30, height: 80 }, BITE, e, this.facing, true);
        }
        if (this.t >= 320) {
          this.biteCd = 2400 + w.rnd() * 1200;
          this.target = null;
          this.mode = 'follow';
          this.t = 1000;
        }
        break;
      }

      case 'fetch': {
        const p = this.fetching;
        if (!p || p.taken) {
          this.fetching = null;
          this.mode = 'follow';
          break;
        }
        speed = 760;
        if (!p.carried) {
          gx = p.x;
          gy = p.y;
          if (Math.abs(gx - this.x) < 30 && Math.abs(gy - this.y) < 30 && p.z < 40) p.carried = true;
        } else {
          gx = hero.x;
          gy = hero.y;
          p.x = this.x + this.facing * 50;
          p.y = this.y + 1;
          p.z = 44;
          if (Math.abs(gx - this.x) < 90 && Math.abs(gy - this.y) < 60) {
            p.collect();
            w.sfx('bark');
            this.fetching = null;
            this.mode = 'follow';
          }
        }
        break;
      }
    }

    if (speed > 0) {
      const dx = gx - this.x;
      const dy = gy - this.y;
      const d = Math.hypot(dx, dy) || 1;
      const step = Math.min(d, speed * (dt / 1000));
      this.x += (dx / d) * step;
      this.y += (dy / d) * step;
      if (Math.abs(dx) > 6) this.facing = dx > 0 ? 1 : -1;
      this.view.play('run');
    } else if (this.mode === 'follow' && this.t >= 700) {
      this.view.play('idle');
      this.facing = hero.x >= this.x ? 1 : -1;
    }

    this.view.facing = this.facing;
    const lift = this.mode === 'boxed' ? 6 : 0;
    this.view.container.setPosition(this.x, this.y - lift).setDepth(this.y);
    this.shadow.setPosition(this.x, this.y).setDepth(this.y - 0.5).setVisible(this.mode !== 'boxed');
    this.view.update(dt);
  }

  /** Jump for joy (victory). */
  celebrate(): void {
    this.mode = 'follow';
    this.t = 0;
  }
}

// ------------------------------------------------------------------- Joanne

export class Joanne {
  private view: RigView;
  private back: Phaser.GameObjects.Image;
  private front: Phaser.GameObjects.Image;
  private cheerT = 0;
  freed = false;

  constructor(private world: Level, public x: number, public y: number) {
    this.back = world.add.image(x, y + 6, ATLAS, 'prop:cageBack').setOrigin(0.5, 1).setDepth(-20);
    this.view = new RigView(world, 'joanne', 'caged');
    this.view.container.setPosition(x - 10, y - 26).setDepth(-19);
    this.front = world.add.image(x, y + 6, ATLAS, 'prop:cageFront').setOrigin(0.5, 1).setDepth(-18);
  }

  cheer(ms = 1400): void {
    this.cheerT = ms;
  }

  /** The cage bursts open and she runs to the hero. */
  free(toX: number, toY: number): void {
    this.freed = true;
    const w = this.world;
    w.fx.spark(this.x, this.y, 200, true);
    w.sfx('crash');
    for (const img of [this.back, this.front]) w.tweens.add({ targets: img, y: img.y - 900, angle: img === this.back ? -40 : 30, alpha: 0, duration: 700, ease: 'Cubic.easeIn' });
    this.view.play('walk');
    this.view.facing = toX >= this.x ? 1 : -1;
    this.view.container.setDepth(toY - 1);
    w.tweens.add({ targets: this, x: toX, y: toY, duration: 1500, delay: 300, ease: 'Sine.easeInOut', onComplete: () => this.view.play('cheer') });
  }

  update(dt: number): void {
    if (this.freed) this.view.container.setPosition(this.x, this.y);
    else {
      this.cheerT -= dt;
      this.view.play(this.cheerT > 0 ? 'cheer' : 'caged');
    }
    this.view.update(dt);
  }
}
