// The player. One class, three fighting styles switched on the hero definition.
import { Fighter } from './Fighter';
import { HEROES, TECH, type HeroDef, type HeroId, type MoveDef } from '../data/heroes';
import { applyFrenzy, FRENZY, FRENZY_MS, meterGain, type HitDef } from '../systems/combat';
import { controls } from '../systems/input';
import type { Level } from '../scenes/Level';

export class Hero extends Fighter {
  readonly def: HeroDef;
  lives = 3;
  meter = 40;
  /** Milliseconds of Tweaker frenzy left. */
  frenzy = 0;
  /** Cutscenes switch input off. */
  inputLocked = false;
  private comboIdx = 0;
  private move: MoveDef | null = null;
  private hitIdx = 0;
  private queued = false;
  private connected = false;
  private lastVictim: Fighter | null = null;
  private held: Fighter | null = null;
  private jumps = 0;
  private dashCd = 0;
  private struck = new Set<Fighter>();
  private diveZ = 0;
  private fired = false;
  private tickT = 0;
  private recover = 0;
  private trailT = 0;

  constructor(world: Level, id: HeroId, x: number, y: number) {
    super(world, HEROES[id].rig, x, y, 'hero', HEROES[id].hp);
    this.def = HEROES[id];
    this.downTime = 520;
  }

  get frenzied(): boolean {
    return this.frenzy > 0;
  }

  private fz(h: HitDef): HitDef {
    return applyFrenzy(h, this.frenzied);
  }

  startFrenzy(): void {
    this.frenzy = FRENZY_MS;
    this.view.setTint(0xfff3a0);
    this.view.refreshTint();
  }

  gainMeter(dealt: number, taken = 0): void {
    this.meter = meterGain(this.meter, dealt, taken);
  }

  heal(n: number): void {
    this.hp = Math.min(this.maxHp, this.hp + n);
  }

  revive(): void {
    this.dead = false;
    this.removed = false;
    this.hp = this.maxHp;
    this.view.container.setAlpha(1);
    this.invuln = 2200;
    this.setState('getup', 'getup');
  }

  protected shrugs(h: HitDef): boolean {
    return (this.def.armor && this.state === 'attack' && !h.heavy) || this.state === 'throw';
  }

  protected onHurt(dmg: number): void {
    this.gainMeter(0, dmg);
    this.dropHeld();
    this.gravityScale = 1;
    this.world.sfx('hurt');
    this.world.onHeroHurt(dmg);
  }

  protected onDeath(): void {
    this.world.onHeroDown();
  }

  private dropHeld(): void {
    if (this.held && this.held.state === 'grabbed') {
      this.held.airborne = true;
      this.held.vz = 200;
      this.held.setState('knocked', 'knock');
    }
    this.held = null;
  }

  protected onWalkOff(): void {
    if (this.state === 'idle' || this.state === 'walk') {
      this.jumps = 1;
      this.setState('jump', 'fall');
    }
  }

  protected tick(dt: number): void {
    const frz = this.frenzied;
    if (frz) {
      this.frenzy -= dt;
      this.trailT -= dt;
      if (this.trailT <= 0) {
        this.trailT = 110;
        this.world.fx.float('prop:bolt', this.x - this.facing * 30, this.y, this.z + 60 + Math.random() * 140);
      }
      if (this.frenzy <= 0) {
        this.view.setTint(null);
        this.view.refreshTint();
      }
    }
    this.rate = frz ? 1.22 : 1;
    this.dashCd -= dt;
    // blink while invulnerable after getting up
    this.view.container.setAlpha(this.invuln > 0 && this.state !== 'special' && this.state !== 'dash' && !this.dead ? (Math.floor(this.invuln / 80) % 2 ? 0.45 : 1) : this.dead ? this.view.container.alpha : 1);
    if (this.reactions(dt)) return;

    const c = controls;
    const speed = this.def.speed * (frz ? FRENZY.speed : 1);
    const cx = this.inputLocked ? 0 : c.x;
    const cy = this.inputLocked ? 0 : c.y;

    switch (this.state) {
      case 'idle':
      case 'walk': {
        this.vx = cx * speed;
        this.vy = cy * speed * 0.62;
        if (cx > 0.15) this.facing = 1;
        else if (cx < -0.15) this.facing = -1;
        const mag = Math.hypot(cx, cy);
        const moving = mag > 0.15;
        this.state = moving ? 'walk' : 'idle';
        this.view.play(moving ? 'walk' : this.world.victory ? 'victory' : 'idle');
        this.view.speed = moving ? Math.max(0.55, mag) * (frz ? 1.25 : 1) : 1;
        if (this.inputLocked) return;
        if (this.meter >= 100 && c.consume('special')) return this.startSpecial();
        if (c.consume('jump')) return this.jump();
        if (c.consume('attack')) return this.startAttack(moving && Math.abs(cx) > 0.5);
        return;
      }
      case 'jump': {
        this.vx = cx * speed * 0.92;
        this.vy = cy * speed * 0.5;
        if (cx > 0.15) this.facing = 1;
        else if (cx < -0.15) this.facing = -1;
        if (this.view.current !== 'flip' || this.view.done) this.view.play(this.vz > 0 ? 'jump' : 'fall');
        if (c.consume('attack')) return this.startAir();
        if (this.def.doubleJump && this.jumps < 2 && c.consume('jump')) {
          this.jumps = 2;
          this.vz = this.def.jumpV * 0.92;
          this.view.play('flip', { restart: true, blend: 30 });
          this.world.sfx('jump');
          this.world.fx.puff(this.x, this.y - this.z, 0.6);
        }
        return;
      }
      case 'attack':
        return this.runMove();
      case 'recover':
        this.vx = this.vy = 0;
        if (this.stateT >= this.recover) this.setState('idle', 'idle');
        return;
      case 'throw':
        return this.runThrow();
      case 'dive': {
        const d = TECH.cannonDive;
        this.vx = this.facing * d.forward;
        this.vy = cy * 120;
        this.world.strike(this, this.fz(d.body), this.struck);
        return;
      }
      case 'airsmash': {
        this.vx = cx * speed * 0.5;
        this.vy = 0;
        if (!this.fired && this.stateT >= TECH.lieuAir.at) this.airSmashHit();
        return;
      }
      case 'airstrike': {
        const d = TECH.jordanAir;
        this.vx = this.facing * d.forward;
        this.vy = 0;
        if (this.world.strike(this, this.fz(d.hit), this.struck).length) {
          // pogo off whoever got hit
          this.vz = d.bounce;
          this.jumps = 1;
          this.struck.clear();
          this.setState('jump', 'flip');
        }
        return;
      }
      case 'dash': {
        const d = TECH.jordanDash;
        this.vy = 0;
        this.vx = this.stateT < d.until ? this.facing * d.speed : 0;
        if (this.stateT < d.until) this.world.strike(this, this.fz(d.hit), this.struck);
        if (c.consume('attack', 200)) this.queued = true;
        if (this.queued && this.stateT >= 200) {
          this.comboIdx = 1;
          return this.beginMove(this.def.combo[1]);
        }
        if (this.stateT >= d.dur) this.setState('idle', 'idle');
        return;
      }
      case 'special':
        return this.runSpecial(dt, cy);
      case 'specialEnd': {
        const d = TECH.jordanRoll;
        this.vx = this.vy = 0;
        if (!this.fired && this.stateT >= d.throwAt) {
          this.fired = true;
          this.world.sfx('throw');
          for (const z of [95, 150]) this.world.spawnProjectile({ key: 'rig:jordan:weapon', x: this.x + this.facing * 60, y: this.y, z: this.z + z, vx: this.facing * d.stickSpeed, team: 'hero', hit: this.fz(d.stick), range: d.stickRange, spin: 1400, pierce: true });
        }
        if (this.stateT >= d.endDur) this.setState('idle', 'idle');
        return;
      }
    }
  }

  // ------------------------------------------------------------ basic moves

  private jump(): void {
    this.airborne = true;
    this.vz = this.def.jumpV;
    this.jumps = 1;
    this.setState('jump', 'jump');
    this.world.sfx('jump');
  }

  private startAttack(moving: boolean): void {
    if (this.def.id === 'jordan' && moving && this.dashCd <= 0) return this.startDash();
    this.comboIdx = 0;
    this.beginMove(this.def.combo[0]);
  }

  private beginMove(m: MoveDef): void {
    this.move = m;
    this.hitIdx = 0;
    this.queued = false;
    this.connected = false;
    this.setState('attack');
    this.view.play(m.anim, { restart: true, blend: 40, speed: 1 });
    if (m.sfx) this.world.sfx(m.sfx);
  }

  private runMove(): void {
    const m = this.move!;
    const t = this.stateT;
    const c = controls;
    this.vx = t < (m.lungeUntil ?? 0) ? this.facing * (m.lunge ?? 0) : 0;
    this.vy = 0;
    while (this.hitIdx < m.hits.length && t >= m.hits[this.hitIdx].at) {
      const victims = this.world.strike(this, this.fz(m.hits[this.hitIdx].hit));
      if (victims.length) {
        this.connected = true;
        this.lastVictim = victims[0];
      }
      this.hitIdx++;
    }
    if (this.inputLocked) {
      if (t >= m.dur) this.setState('idle', 'idle');
      return;
    }
    if (this.meter >= 100 && c.consume('special')) return this.startSpecial();
    if (c.consume('attack', 220)) this.queued = true;
    if (this.queued && t >= m.chainAt && this.comboIdx + 1 < this.def.combo.length) {
      this.comboIdx++;
      // let the player turn around between hits
      if (c.x > 0.3) this.facing = 1;
      else if (c.x < -0.3) this.facing = -1;
      const v = this.lastVictim;
      if (this.def.id === 'cannon' && this.comboIdx === 2 && this.connected && v && v.throwable && v.alive && v.state === 'hurt' && Math.abs(v.x - this.x) < 210 && Math.abs(v.y - this.y) < 60) {
        return this.startThrow(v);
      }
      return this.beginMove(this.def.combo[this.comboIdx]);
    }
    if (t >= m.dur) {
      this.comboIdx = 0;
      this.setState('idle', 'idle');
    }
  }

  private startAir(): void {
    this.struck.clear();
    this.fired = false;
    if (this.def.id === 'cannon') {
      const d = TECH.cannonDive;
      this.diveZ = this.z;
      this.vz = Math.max(this.vz, d.hop);
      this.gravityScale = d.gravity;
      this.setState('dive', 'airatk');
      this.world.sfx('heavySwing');
    } else if (this.def.id === 'lieu') {
      this.setState('airsmash', 'airatk');
      this.world.sfx('heavySwing');
    } else {
      const d = TECH.jordanAir;
      this.vz = -d.down;
      this.setState('airstrike', 'airatk');
      this.world.sfx('swing');
    }
  }

  private airSmashHit(): void {
    this.fired = true;
    this.world.strike(this, this.fz(TECH.lieuAir.hit));
  }

  protected onLand(speed: number): void {
    this.gravityScale = 1;
    switch (this.state) {
      case 'jump':
        this.setState('idle', 'idle');
        if (speed > 500) this.world.sfx('land');
        return;
      case 'dive': {
        const d = TECH.cannonDive;
        const bonus = Math.min(d.bonusMax, Math.max(0, this.diveZ) * d.bonusPerPx);
        this.world.radial(this, this.x + this.facing * 40, this.y, d.radius + bonus * 3, this.fz({ ...d.land, dmg: d.land.dmg + Math.round(bonus) }));
        this.world.fx.ring(this.x + this.facing * 40, this.y, d.radius + bonus * 3);
        this.world.fx.puff(this.x, this.y, 1.3);
        this.world.shake(8 + bonus * 0.4);
        this.world.sfx('slam');
        this.recover = 300;
        this.setState('recover', 'land');
        return;
      }
      case 'airsmash':
        if (!this.fired) this.airSmashHit();
        this.world.fx.puff(this.x, this.y);
        this.recover = 180;
        this.setState('recover', 'land');
        return;
      case 'airstrike':
        this.recover = 120;
        this.setState('recover', 'land');
        return;
      case 'special':
        // Cannon coming down from the crowd surf
        this.setState('idle', 'idle');
        return;
    }
  }

  // --------------------------------------------------------- hero-only tech

  private startDash(): void {
    const d = TECH.jordanDash;
    this.dashCd = d.cooldown;
    this.struck.clear();
    this.queued = false;
    this.invuln = Math.max(this.invuln, d.until);
    this.setState('dash', 'dash');
    this.world.sfx('swing');
    this.world.fx.puff(this.x, this.y, 0.8);
  }

  private startThrow(v: Fighter): void {
    this.held = v;
    v.vx = v.vy = v.vz = 0;
    v.airborne = false;
    v.setState('grabbed', 'knock');
    this.fired = false;
    this.setState('throw', 'throw');
    this.world.sfx('heavySwing');
  }

  private runThrow(): void {
    const d = TECH.cannonThrow;
    this.vx = this.vy = 0;
    const v = this.held;
    if (v && !this.fired) {
      const k = Math.min(1, this.stateT / 200);
      v.x = this.x + this.facing * (60 - 50 * k);
      v.y = this.y + 1;
      v.z = this.z + 190 * k;
      v.facing = this.facing;
      if (this.stateT >= d.releaseAt) {
        this.fired = true;
        v.launchThrown(this.facing, d.speed, d.lift, this.fz(d.hit), d.dmgThrown * (this.frenzied ? 2 : 1));
        this.held = null;
        this.world.sfx('throw');
        this.world.sfx('squeal');
        this.gainMeter(8);
      }
    }
    if (this.stateT >= d.dur) {
      this.comboIdx = 0;
      this.setState('idle', 'idle');
    }
  }

  private startSpecial(): void {
    this.meter = 0;
    this.struck.clear();
    this.fired = false;
    this.tickT = 0;
    this.world.sfx('special');
    this.world.fx.text(this.def.specialName + '!', this.x, this.y - this.z - 300, '#ffffff', 64);
    if (this.def.id === 'cannon') {
      const d = TECH.cannonSurf;
      this.invuln = d.start + d.fly + 250;
      this.airborne = true;
      this.gravityScale = 0;
      this.vz = 0;
      this.setState('special', 'specialStart');
    } else if (this.def.id === 'lieu') {
      this.invuln = TECH.lieuDrop.dur + 100;
      this.setState('special', 'special');
    } else {
      this.invuln = TECH.jordanRoll.dur + TECH.jordanRoll.endDur;
      this.setState('special', 'special');
    }
  }

  private runSpecial(dt: number, cy: number): void {
    const t = this.stateT;
    if (this.def.id === 'cannon') {
      const d = TECH.cannonSurf;
      this.vy = cy * 160;
      if (t < d.start) {
        this.vx = this.facing * 240;
        this.z += (d.height - this.z) * Math.min(1, dt / 90);
        return;
      }
      this.view.play('special');
      this.z = d.height + Math.sin(t / 60) * 8;
      this.vx = this.facing * d.speed;
      this.world.strike(this, this.fz(d.hit), this.struck);
      this.tickT -= dt;
      if (this.tickT <= 0) {
        this.tickT = 70;
        this.world.fx.float('prop:note', this.x - this.facing * 80, this.y, this.z + 40);
      }
      const b = this.world.bounds;
      if (t >= d.start + d.fly || this.x <= b.left + 2 || this.x >= b.right - 2) {
        this.gravityScale = 1;
        this.vx *= 0.3;
        this.jumps = 2;
        this.setState('jump', 'fall');
      }
      return;
    }
    if (this.def.id === 'lieu') {
      const d = TECH.lieuDrop;
      this.vx = this.vy = 0;
      if (!this.fired && t >= d.at) {
        this.fired = true;
        this.world.radial(this, this.x + this.facing * 60, this.y, d.radius, this.fz(d.hit));
        this.world.fx.ring(this.x + this.facing * 60, this.y, d.radius);
        this.world.fx.ring(this.x + this.facing * 60, this.y, d.radius * 0.6);
        this.world.fx.puff(this.x + this.facing * 60, this.y, 1.6);
        this.world.shake(d.hit.shake ?? 16, 380);
        this.world.sfx('slam');
      }
      if (t >= d.dur) this.setState('idle', 'idle');
      return;
    }
    const d = TECH.jordanRoll;
    this.vx = this.facing * d.speed;
    this.vy = cy * 200;
    this.tickT -= dt * this.rate;
    if (this.tickT <= 0) {
      this.tickT = d.every;
      this.world.strike(this, this.fz(d.hit));
      this.world.sfx('tick');
    }
    if (t >= d.dur) {
      this.fired = false;
      this.setState('specialEnd', 'specialEnd');
    }
  }
}
