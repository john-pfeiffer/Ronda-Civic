// Shared body for everything that fights: position on the street, jumping,
// getting hit, getting knocked down and getting back up.
import type Phaser from 'phaser';
import { ATLAS } from '../art/textures';
import { FLOOR_BOTTOM, FLOOR_TOP, GRAVITY } from '../config/game';
import { RigView } from '../art/rigView';
import type { RigId } from '../art/rigs';
import { groundAt, pushOut, type Body, type HitDef } from '../systems/combat';
import type { Level } from '../scenes/Level';

export type Team = 'hero' | 'enemy';

export abstract class Fighter implements Body {
  x: number;
  y: number;
  z = 0;
  vx = 0;
  vy = 0;
  vz = 0;
  facing: 1 | -1 = 1;
  radius = 44;
  height = 210;
  hp: number;
  maxHp: number;
  state = 'idle';
  stateT = 0;
  airborne = false;
  invuln = 0;
  dead = false;
  /** Set once the death blink has finished and the fighter can be dropped from the world. */
  removed = false;
  /** Kept inside the current screen bounds. Enemies walking in from off-screen start unconfined. */
  confined = true;
  throwable = false;
  gravityScale = 1;
  /** Speed multiplier for this fighter's own clock (attack timelines and animation). */
  rate = 1;
  damageTaken = 1;
  downTime = 700;
  readonly view: RigView;
  protected shadow: Phaser.GameObjects.Image;
  protected stun = 0;
  protected squash = 0;
  private thrownHit: HitDef | null = null;
  private thrownSelfDmg = 0;
  private thrownStruck = new Set<Fighter>();

  constructor(readonly world: Level, rigId: RigId, x: number, y: number, readonly team: Team, hp: number) {
    this.x = x;
    this.y = y;
    this.hp = this.maxHp = hp;
    this.shadow = world.add.image(x, y, ATLAS, 'prop:shadow').setDepth(-5);
    this.view = new RigView(world, rigId);
    this.shadow.setScale((this.view.rig.shadow * this.view.rig.scale) / 200);
    this.height = this.view.rig.height * this.view.rig.scale * 0.92;
  }

  setState(state: string, anim?: string, restart = true): void {
    this.state = state;
    this.stateT = 0;
    if (anim) this.view.play(anim, { restart });
  }

  /** Per-state behaviour: read input or think, set velocities, start moves. */
  protected abstract tick(dt: number): void;
  protected onLand(_speed: number): void {}
  protected onHurt(_dmg: number, _from?: Fighter): void {}
  protected onDeath(): void {}
  /** True when this hit should hurt but not interrupt (armour). */
  protected shrugs(_h: HitDef): boolean {
    return false;
  }

  get alive(): boolean {
    return !this.dead && this.hp > 0;
  }

  /** Can something be done to this fighter right now (targeted, bitten, grabbed)? */
  get hittable(): boolean {
    return !this.dead && this.invuln <= 0 && this.state !== 'down' && this.state !== 'getup' && this.state !== 'grabbed';
  }

  /** Apply a hit coming from direction `dir`. Returns the damage dealt (0 if it was ignored). */
  takeHit(h: HitDef, dir: 1 | -1, from?: Fighter): number {
    if (!this.hittable) return 0;
    const dmg = Math.max(1, Math.round(h.dmg * this.damageTaken));
    this.hp -= dmg;
    this.view.flash();
    this.onHurt(dmg, from);
    const lethal = this.hp <= 0;
    if (!lethal && this.shrugs(h)) return dmg;
    this.facing = dir === 1 ? -1 : 1;
    if (h.kbz > 0 || lethal || this.airborne) {
      this.vx = dir * Math.max(h.kbx, 240);
      this.vz = Math.max(h.kbz, lethal ? 520 : 400);
      this.vy = 0;
      this.airborne = true;
      this.gravityScale = 1;
      this.setState('knocked', 'knock');
    } else {
      this.stun = h.stun;
      this.vx = dir * h.kbx;
      this.vy = 0;
      this.setState('hurt', 'hurt');
    }
    return dmg;
  }

  /** Finish this fighter off no matter what state it is in (used when the boss falls). */
  kill(dir: 1 | -1): void {
    if (this.dead) return;
    this.hp = 0;
    this.invuln = 0;
    if (this.state === 'down' || this.state === 'knocked' || this.state === 'thrown') return;
    this.facing = dir === 1 ? -1 : 1;
    this.vx = dir * 420;
    this.vy = 0;
    this.vz = 620;
    this.airborne = true;
    this.gravityScale = 1;
    this.view.flash();
    this.setState('knocked', 'knock');
  }

  /** Cannon's throw: this fighter becomes a projectile that bowls over its friends. */
  launchThrown(dir: 1 | -1, speed: number, lift: number, hit: HitDef, selfDmg: number): void {
    this.facing = dir === 1 ? -1 : 1;
    this.vx = dir * speed;
    this.vz = lift;
    this.vy = 0;
    this.airborne = true;
    this.thrownHit = hit;
    this.thrownSelfDmg = selfDmg;
    this.thrownStruck.clear();
    this.setState('thrown', 'knock');
  }

  /** Handles the states every fighter shares. Returns true if one of them is active. */
  protected reactions(dt: number): boolean {
    switch (this.state) {
      case 'hurt':
        this.vx *= Math.pow(0.004, dt / 1000);
        if (this.stateT >= this.stun) this.setState('idle', 'idle');
        return true;
      case 'knocked':
        return true;
      case 'thrown': {
        if (this.thrownHit) {
          const mover = { ...this.body(), facing: (this.vx >= 0 ? 1 : -1) as 1 | -1 };
          for (const other of this.world.enemies) {
            if (other === this || this.thrownStruck.has(other)) continue;
            if (this.world.strikeOne(mover, this.thrownHit, other, mover.facing)) this.thrownStruck.add(other);
          }
        }
        return true;
      }
      case 'down':
        this.vx *= Math.pow(0.0005, dt / 1000);
        if (this.stateT >= this.downTime) {
          if (this.hp <= 0) this.die();
          else {
            this.setState('getup', 'getup');
            this.invuln = Math.max(this.invuln, 500);
          }
        }
        return true;
      case 'getup':
        this.vx = this.vy = 0;
        if (this.stateT >= 420) this.setState('idle', 'idle');
        return true;
      case 'grabbed':
        return true;
      case 'dead':
        this.vx = this.vy = 0;
        this.view.container.setAlpha(Math.floor(this.stateT / 70) % 2 ? 0.25 : 0.9);
        if (this.stateT >= 620) this.removed = true;
        return true;
    }
    return false;
  }

  protected die(): void {
    this.dead = true;
    this.setState('dead');
    this.onDeath();
  }

  body(): Body {
    return { x: this.x, y: this.y, z: this.z, facing: this.facing, radius: this.radius, height: this.height };
  }

  update(dt: number): void {
    const local = dt * this.rate;
    this.stateT += local;
    if (this.invuln > 0) this.invuln -= dt;
    this.tick(dt);

    const s = dt / 1000;
    const px = this.x;
    const py = this.y;
    const pz = this.z;
    this.x += this.vx * s;
    this.y += this.vy * s;
    this.y = Math.min(FLOOR_BOTTOM, Math.max(FLOOR_TOP, this.y));
    if (this.confined) {
      const b = this.world.bounds;
      this.x = Math.min(b.right, Math.max(b.left, this.x));
    }
    const plats = this.world.platforms;
    if (this.airborne) {
      this.vz -= GRAVITY * this.gravityScale * s;
      this.z += this.vz * s;
      const g = groundAt(plats, this.x, this.y, Math.max(pz, this.z));
      if (this.vz <= 0 && this.z <= g) {
        const v = -this.vz;
        this.z = g;
        this.vz = 0;
        this.airborne = false;
        this.land(v);
      } else {
        const fixed = pushOut(plats, this.x, this.y, this.z, px, py);
        this.x = fixed.x;
        this.y = fixed.y;
      }
    } else if (this.state !== 'grabbed') {
      const fixed = pushOut(plats, this.x, this.y, this.z, px, py);
      this.x = fixed.x;
      this.y = fixed.y;
      const g = groundAt(plats, this.x, this.y, this.z);
      if (g < this.z - 1) {
        this.airborne = true;
        this.vz = 0;
        this.onWalkOff();
      } else this.z = g;
    }

    // draw
    const ground = this.airborne ? groundAt(plats, this.x, this.y, this.z) : this.z;
    let depth = this.y;
    for (const p of plats) if (this.x > p.x0 && this.x < p.x1 && this.y > p.y0 && this.y <= p.y1) depth = Math.max(depth, p.y1 + 1);
    this.squash *= Math.pow(0.0001, dt / 1000);
    this.view.squashY = 1 - this.squash;
    this.view.squashX = 1 + this.squash * 0.6;
    this.view.facing = this.facing;
    this.view.container.setPosition(this.x, this.y - this.z).setDepth(depth);
    this.shadow.setPosition(this.x, this.y - ground).setDepth(depth - 0.5).setAlpha(Math.max(0.35, 1 - (this.z - ground) / 500));
    this.view.update(local);
  }

  protected onWalkOff(): void {}

  private land(speed: number): void {
    if (this.state === 'knocked' || this.state === 'thrown') {
      if (this.state === 'thrown') {
        this.hp -= this.thrownSelfDmg;
        this.thrownHit = null;
      }
      this.vx *= 0.35;
      this.world.fx.puff(this.x, this.y);
      this.world.sfx('land');
      this.setState('down', 'down');
      return;
    }
    if (speed > 300) this.squash = 0.16;
    this.onLand(speed);
  }

  destroy(): void {
    this.view.destroy();
    this.shadow.destroy();
  }
}
