// Big Boy, the hog king. Three attacks, two calls for backup, and he never flinches
// unless he has just run head-first into the edge of his own stage.
import { Fighter } from './Fighter';
import { BOSS } from '../data/enemies';
import type { HitDef } from '../systems/combat';
import type { Level } from '../scenes/Level';

export class BigBoy extends Fighter {
  private phase = 1;
  private think = 1400;
  private fired = false;
  private struck = new Set<Fighter>();
  private targetX = 0;
  private targetY = 0;
  private last = '';
  private roars = 0;

  constructor(world: Level, x: number, y: number) {
    super(world, 'bigboy', x, y, 'enemy', BOSS.hp);
    this.radius = 100;
    this.confined = false;
    this.downTime = 1200;
  }

  get vulnerable(): boolean {
    return this.state === 'dizzy' || this.state === 'prone';
  }

  /** Big Boy takes the damage but only falls over when he is finished. */
  protected shrugs(_h: HitDef): boolean {
    return true;
  }

  takeHit(h: HitDef, dir: 1 | -1, from?: Fighter): number {
    if (this.state === 'intro' || this.state === 'drop') return 0;
    this.damageTaken = this.vulnerable ? BOSS.vulnerable : 1;
    const wasAir = this.airborne;
    // he cannot be juggled out of his own jump
    this.airborne = false;
    const dmg = super.takeHit(h, dir, from);
    if (this.alive) this.airborne = wasAir;
    return dmg;
  }

  protected onHurt(): void {
    this.world.onBossHurt();
  }

  protected onDeath(): void {
    this.world.onBossDead();
  }

  /** Entrance: he lands on the stage from above. */
  dropIn(): void {
    this.airborne = true;
    this.z = 900;
    this.confined = true;
    this.setState('drop', 'slamFall');
  }

  intro(): void {
    this.setState('intro', 'roar');
    this.world.sfx('roar');
    this.world.shake(10, 600);
  }

  private speedMul(): number {
    return this.phase === 3 ? 1.3 : this.phase === 2 ? 1.12 : 1;
  }

  protected tick(dt: number): void {
    if (this.reactions(dt)) return;
    const w = this.world;
    const hero = w.hero;
    if (!this.confined && this.x > w.bounds.left + 10 && this.x < w.bounds.right - 10) this.confined = true;
    const side: 1 | -1 = this.x >= hero.x ? 1 : -1;
    const dx = Math.abs(this.x - hero.x);
    const dy = Math.abs(this.y - hero.y);

    switch (this.state) {
      case 'drop':
        return;
      case 'intro':
        this.vx = this.vy = 0;
        if (this.stateT >= 900) this.setState('idle', 'idle');
        return;

      case 'idle':
      case 'walk': {
        // phase changes interrupt whatever he was about to do
        const ratio = this.hp / this.maxHp;
        if ((ratio <= 0.6 && this.roars === 0) || (ratio <= 0.3 && this.roars === 1)) {
          this.roars++;
          this.phase = this.roars + 1;
          this.fired = false;
          this.setState('roar', 'roar');
          w.sfx('roar');
          return;
        }
        this.facing = hero.x >= this.x ? 1 : -1;
        const gx = hero.x + side * BOSS.punch.range * 0.7;
        const mx = gx - this.x;
        const my = hero.y - this.y;
        const dist = Math.hypot(mx, my);
        const speed = BOSS.speed * this.speedMul();
        if (dist > 20) {
          this.vx = (mx / dist) * speed;
          this.vy = (my / dist) * speed * 0.7;
          this.view.play('walk');
        } else {
          this.vx = this.vy = 0;
          this.view.play('idle');
        }
        this.think -= dt * this.speedMul();
        if (!hero.alive || hero.state === 'down') return;
        if (dx <= BOSS.punch.range && dy < 40 && this.think < 900) return this.begin('wind');
        if (this.think <= 0) {
          const options = this.phase >= 2 ? ['charge', 'slam', 'slam'] : ['charge'];
          let pick = options[Math.floor(w.rnd() * options.length)];
          if (pick === this.last && options.length > 1) pick = pick === 'charge' ? 'slam' : 'charge';
          if (pick === 'charge' && dy > 70) {
            // line up first
            this.think = 300;
            return;
          }
          this.begin(pick === 'charge' ? 'chargeWind' : 'slamUp');
        }
        return;
      }

      case 'wind':
        this.vx = this.vy = 0;
        if (this.stateT >= BOSS.punch.wind / this.speedMul()) {
          this.fired = false;
          this.setState('attack', 'atk');
          w.sfx('heavySwing');
        }
        return;
      case 'attack':
        this.vx = this.vy = 0;
        if (!this.fired && this.stateT >= BOSS.punch.hitAt) {
          this.fired = true;
          w.strike(this, BOSS.punch.hit);
        }
        if (this.stateT >= BOSS.punch.dur) this.rest(900);
        return;

      case 'chargeWind':
        this.vx = this.vy = 0;
        if (this.stateT >= BOSS.charge.wind / this.speedMul()) {
          this.struck.clear();
          this.setState('charge', 'charge');
          w.sfx('roar');
        }
        return;
      case 'charge': {
        this.vx = this.facing * BOSS.charge.speed * this.speedMul();
        this.vy = 0;
        w.strike(this, BOSS.charge.hit, this.struck);
        if (Math.floor(this.stateT / 120) !== Math.floor((this.stateT - dt) / 120)) w.fx.puff(this.x - this.facing * 60, this.y, 0.9);
        const b = w.bounds;
        if ((this.facing === 1 && this.x >= b.right - 4) || (this.facing === -1 && this.x <= b.left + 4)) {
          // ran into the edge of the stage: seeing stars
          this.vx = 0;
          w.shake(16, 400);
          w.sfx('slam');
          w.fx.spark(this.x + this.facing * 80, this.y, 220, true);
          w.onBossStunned();
          this.setState('dizzy', 'dizzy');
        }
        return;
      }
      case 'dizzy':
        this.vx = this.vy = 0;
        if (this.stateT >= BOSS.charge.dizzy) this.rest(700);
        return;

      case 'slamUp':
        this.vx = this.vy = 0;
        if (this.stateT >= BOSS.slam.up) {
          const air = BOSS.slam.air / 1000;
          this.targetX = hero.x;
          this.targetY = hero.y;
          this.airborne = true;
          // arc that lands on the hero's position in `air` seconds
          this.vz = (3300 * air) / 2;
          this.vx = (this.targetX - this.x) / air;
          this.vy = (this.targetY - this.y) / air;
          this.setState('slamAir', 'slamUp');
          w.sfx('jump');
        }
        return;
      case 'slamAir':
        if (this.vz < 0) this.view.play('slamFall');
        return;
      case 'prone':
        this.vx = this.vy = 0;
        if (this.stateT >= BOSS.slam.prone / this.speedMul()) this.rest(500);
        return;

      case 'roar':
        this.vx = this.vy = 0;
        if (!this.fired && this.stateT >= 300) {
          this.fired = true;
          w.shake(12, 500);
          w.summonAdds(this.roars - 1);
        }
        if (this.stateT >= 900) this.rest(600);
        return;
    }
  }

  private begin(state: string): void {
    this.last = state === 'chargeWind' ? 'charge' : state === 'slamUp' ? 'slam' : this.last;
    this.facing = this.world.hero.x >= this.x ? 1 : -1;
    this.vx = this.vy = 0;
    this.setState(state, state);
    if (state === 'slamUp') this.world.sfx('swing');
  }

  private rest(think: number): void {
    this.think = think + this.world.rnd() * 700;
    this.setState('idle', 'idle');
  }

  protected onLand(): void {
    const w = this.world;
    if (this.state === 'drop') {
      w.fx.ring(this.x, this.y, 380);
      w.fx.puff(this.x, this.y, 2);
      w.sfx('slam');
      this.facing = w.hero.x >= this.x ? 1 : -1;
      return this.intro();
    }
    if (this.state !== 'slamAir') return;
    this.vx = this.vy = 0;
    w.radial(this, this.x, this.y, BOSS.slam.radius, BOSS.slam.hit, 36);
    w.fx.ring(this.x, this.y, BOSS.slam.radius);
    w.fx.ring(this.x, this.y, BOSS.slam.radius * 0.55);
    w.fx.puff(this.x, this.y, 2);
    w.shake(BOSS.slam.hit.shake ?? 20, 450);
    w.sfx('slam');
    this.setState('prone', 'slamLand');
  }
}
