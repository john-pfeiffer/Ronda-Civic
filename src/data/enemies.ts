import { hit, type HitDef } from '../systems/combat';
import type { RigId } from '../art/rigs';

export type EnemyId = 'pigman' | 'pigClub' | 'pigThrower';

export interface EnemyDef {
  id: EnemyId;
  rig: RigId;
  hp: number;
  speed: number;
  /** Telegraph before the attack, in ms. */
  wind: number;
  atkDur: number;
  hitAt: number;
  hit: HitDef;
  /** Distance at which it starts its attack. */
  range: number;
  /** Throwers keep this far away instead of closing in. */
  standoff?: number;
  projectileSpeed?: number;
  cooldown: [number, number];
  /** Shrugs off light hits while winding up. */
  heavy: boolean;
  score: number;
}

export const ENEMIES: Record<EnemyId, EnemyDef> = {
  pigman: {
    id: 'pigman', rig: 'pigman', hp: 34, speed: 215, wind: 400, atkDur: 300, hitAt: 105, range: 135, cooldown: [900, 1800], heavy: false, score: 100,
    hit: hit({ dmg: 8, x0: 0, x1: 150, kbx: 260, stun: 320 }),
  },
  pigClub: {
    id: 'pigClub', rig: 'pigClub', hp: 62, speed: 165, wind: 560, atkDur: 420, hitAt: 126, range: 170, cooldown: [1300, 2300], heavy: true, score: 200,
    hit: hit({ dmg: 16, x0: 0, x1: 200, kbx: 400, kbz: 560, heavy: true, hitstop: 80, shake: 8 }),
  },
  pigThrower: {
    id: 'pigThrower', rig: 'pigThrower', hp: 26, speed: 240, wind: 480, atkDur: 340, hitAt: 100, range: 760, standoff: 580, projectileSpeed: 820, cooldown: [1900, 3200], heavy: false, score: 150,
    hit: hit({ dmg: 9, x0: -36, x1: 36, kbx: 220, stun: 320, yTol: 40, z0: -110, z1: 110 }),
  },
};

export const BOSS = {
  hp: 560,
  speed: 190,
  punch: { wind: 520, dur: 420, hitAt: 134, range: 250, hit: hit({ dmg: 18, x0: 0, x1: 290, kbx: 520, kbz: 600, yTol: 64, z1: 300, heavy: true, hitstop: 90, shake: 10 }) },
  charge: { wind: 800, speed: 980, dizzy: 1800, hit: hit({ dmg: 20, x0: -40, x1: 170, kbx: 640, kbz: 620, yTol: 58, z1: 125, heavy: true, hitstop: 100, shake: 12 }) },
  slam: { up: 420, air: 900, peak: 560, radius: 460, prone: 1300, hit: hit({ dmg: 18, x0: 0, x1: 0, kbx: 420, kbz: 680, heavy: true, hitstop: 120, shake: 22 }) },
  /** Damage multiplier while he is dizzy or face-down. */
  vulnerable: 1.6,
  score: 5000,
};
