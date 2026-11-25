// Pigmen: walk in, crowd the hero, take turns attacking.
import { Fighter } from './Fighter';
import { ENEMIES, type EnemyDef, type EnemyId } from '../data/enemies';
import { FLOOR_BOTTOM, FLOOR_TOP } from '../config/game';
import type { HitDef } from '../systems/combat';
import type { Level } from '../scenes/Level';

export class Enemy extends Fighter {
  readonly def: EnemyDef;
  private cooldown: number;
  private hoverX = 0;
  private hoverY = 0;
  private hoverT = 0;
  private fired = false;
  hasToken = false;

  constructor(world: Level, id: EnemyId, x: number, y: number) {
    super(world, ENEMIES[id].rig, x, y, 'enemy', ENEMIES[id].hp);
    this.def = ENEMIES[id];
    this.throwable = true;
    this.confined = false;
    this.cooldown = 500 + world.rnd() * 900;
  }

  protected shrugs(h: HitDef): boolean {
    return this.def.heavy && this.state === 'wind' && !h.heavy;
  }

  protected onHurt(): void {
    this.dropToken();
  }

  protected onDeath(): void {
    this.dropToken();
    this.world.onEnemyDead(this);
  }

  private dropToken(): void {
    if (this.hasToken) {
      this.hasToken = false;
      this.world.tokens.delete(this);
    }
  }

  private rollCooldown(): void {
    const [a, b] = this.def.cooldown;
    this.cooldown = a + this.world.rnd() * (b - a);
  }

  protected tick(dt: number): void {
    if (this.reactions(dt)) return;
    const w = this.world;
    const hero = w.hero;
    // once on screen, stay on screen
    if (!this.confined && this.x > w.bounds.left + 10 && this.x < w.bounds.right - 10) this.confined = true;
    this.cooldown -= dt;

    if (this.state === 'wind') {
      this.vx = this.vy = 0;
      if (this.stateT >= this.def.wind) {
        this.fired = false;
        this.setState('attack', 'atk');
        w.sfx(this.def.standoff ? 'throw' : this.def.heavy ? 'heavySwing' : 'swing');
      }
      return;
    }
    if (this.state === 'attack') {
      this.vx = this.vy = 0;
      if (!this.fired && this.stateT >= this.def.hitAt) {
        this.fired = true;
        if (this.def.standoff) {
          w.spawnProjectile({ key: 'prop:can', x: this.x + this.facing * 70, y: this.y, z: 150, vx: this.facing * this.def.projectileSpeed!, team: 'enemy', hit: this.def.hit, range: 1500, spin: 500, pierce: false });
        } else w.strike(this, this.def.hit);
      }
      if (this.stateT >= this.def.atkDur) {
        this.rollCooldown();
        this.dropToken();
        this.setState('idle', 'idle');
      }
      return;
    }

    // ---- free movement
    const heroDown = !hero.alive || hero.state === 'down' || hero.state === 'getup';
    const side: 1 | -1 = this.x >= hero.x ? 1 : -1;
    const dx = Math.abs(this.x - hero.x);
    const dy = Math.abs(this.y - hero.y);
    let gx: number;
    let gy: number;
    let speed = this.def.speed;

    this.hoverT -= dt;
    if (this.hoverT <= 0) {
      this.hoverT = 900 + w.rnd() * 1100;
      this.hoverX = 280 + w.rnd() * 220;
      this.hoverY = (w.rnd() - 0.5) * 240;
    }

    if (this.def.standoff) {
      gx = hero.x + side * this.def.standoff;
      gy = hero.y + (dx < 420 ? this.hoverY * 0.5 : 0);
      if (dx < 300) speed *= 1.25;
      const onScreen = this.x > w.bounds.left - 20 && this.x < w.bounds.right + 20;
      if (!heroDown && onScreen && this.cooldown <= 0 && dy < 34 && dx > 320 && dx < this.def.range) return this.startWind(side);
    } else {
      if (!this.hasToken && !heroDown && this.cooldown <= 0 && w.tokens.size < w.maxTokens) {
        this.hasToken = true;
        w.tokens.add(this);
      }
      if (this.hasToken && !heroDown) {
        gx = hero.x + side * this.def.range * 0.72;
        gy = hero.y;
        if (dx <= this.def.range && dy < 30) return this.startWind(side);
      } else {
        gx = hero.x + side * (heroDown ? this.hoverX + 160 : this.hoverX);
        gy = hero.y + this.hoverY;
        speed *= 0.7;
      }
    }
    gy = Math.min(FLOOR_BOTTOM - 6, Math.max(FLOOR_TOP + 6, gy));
    gx = Math.min(w.bounds.right - 20, Math.max(w.bounds.left + 20, gx));

    const mx = gx - this.x;
    const my = gy - this.y;
    const dist = Math.hypot(mx, my);
    if (dist > 14) {
      this.vx = (mx / dist) * speed;
      this.vy = (my / dist) * speed * 0.7;
      this.view.play('walk');
      this.state = 'walk';
    } else {
      this.vx = this.vy = 0;
      this.view.play(heroDown ? 'taunt' : 'idle');
      this.state = 'idle';
    }
    // keep out of each other's pockets
    for (const o of w.enemies) {
      if (o === this || o.dead) continue;
      const ox = this.x - o.x;
      const oy = this.y - o.y;
      if (Math.abs(ox) < 96 && Math.abs(oy) < 42) {
        this.vx += (ox >= 0 ? 1 : -1) * 90;
        this.vy += (oy >= 0 ? 1 : -1) * 70;
      }
    }
    this.facing = hero.x >= this.x ? 1 : -1;
  }

  private startWind(side: 1 | -1): void {
    this.facing = side === 1 ? -1 : 1;
    this.setState('wind', 'wind');
  }
}
