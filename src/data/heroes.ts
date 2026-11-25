// The three playable band members. All balance numbers live here.
import { hit, type HitDef } from '../systems/combat';
import type { RigId } from '../art/rigs';

export interface MoveDef {
  anim: string;
  /** Total length in ms. */
  dur: number;
  /** Strikes on the timeline. */
  hits: { at: number; hit: HitDef }[];
  /** Earliest moment a queued attack press chains into the next move. */
  chainAt: number;
  /** Forward lunge speed, applied until `lungeUntil` ms. */
  lunge?: number;
  lungeUntil?: number;
  sfx?: string;
}

export type HeroId = 'cannon' | 'lieu' | 'jordan';

export interface HeroDef {
  id: HeroId;
  rig: RigId;
  name: string;
  role: string;
  blurb: string;
  /** 1-5, shown on the select screen. */
  stats: { power: number; speed: number; health: number };
  colour: number;
  hp: number;
  speed: number;
  jumpV: number;
  doubleJump: boolean;
  /** Light hits do not interrupt this hero's attacks. */
  armor: boolean;
  combo: MoveDef[];
  specialName: string;
}

const reach = { z0: -30, z1: 220 };

export const HEROES: Record<HeroId, HeroDef> = {
  // The brawler: committed guitar swings, throws people, dives off things.
  cannon: {
    id: 'cannon',
    rig: 'cannon',
    name: 'CANNON',
    role: 'VOCALS + GUITAR',
    blurb: 'Brawler. Throws pigs, dives off anything.',
    stats: { power: 4, speed: 3, health: 4 },
    colour: 0xf0893a,
    hp: 110,
    speed: 410,
    jumpV: 1180,
    doubleJump: false,
    armor: false,
    specialName: 'CROWD SURF',
    combo: [
      { anim: 'atk1', dur: 300, chainAt: 170, lunge: 260, lungeUntil: 130, sfx: 'swing', hits: [{ at: 115, hit: hit({ dmg: 9, x0: 10, x1: 200, kbx: 230, stun: 330, ...reach }) }] },
      { anim: 'atk2', dur: 300, chainAt: 170, lunge: 260, lungeUntil: 130, sfx: 'swing', hits: [{ at: 115, hit: hit({ dmg: 9, x0: 10, x1: 200, kbx: 230, stun: 380, ...reach }) }] },
      { anim: 'atk3', dur: 520, chainAt: 9999, lunge: 320, lungeUntil: 260, sfx: 'heavySwing', hits: [{ at: 265, hit: hit({ dmg: 19, x0: 0, x1: 220, kbx: 520, kbz: 640, hitstop: 90, shake: 8, heavy: true, ...reach }) }] },
    ],
  },
  // Slow and heavy: big wind-ups, biggest hits, shrugs off light blows mid-swing.
  lieu: {
    id: 'lieu',
    rig: 'lieu',
    name: 'LIEU',
    role: 'BASS',
    blurb: 'Slow, heavy, unbothered. Biggest hits in the band.',
    stats: { power: 5, speed: 2, health: 5 },
    colour: 0x35c2b4,
    hp: 135,
    speed: 310,
    jumpV: 1120,
    doubleJump: false,
    armor: true,
    specialName: 'LOW-END DROP',
    combo: [
      { anim: 'atk1', dur: 540, chainAt: 360, lunge: 200, lungeUntil: 280, sfx: 'heavySwing', hits: [{ at: 265, hit: hit({ dmg: 17, x0: 0, x1: 260, kbx: 430, stun: 460, hitstop: 70, shake: 5, heavy: true, yTol: 56, ...reach }) }] },
      { anim: 'atk2', dur: 540, chainAt: 360, lunge: 200, lungeUntil: 280, sfx: 'heavySwing', hits: [{ at: 265, hit: hit({ dmg: 17, x0: 0, x1: 260, kbx: 430, stun: 520, hitstop: 70, shake: 5, heavy: true, yTol: 56, ...reach }) }] },
      { anim: 'atk3', dur: 680, chainAt: 9999, lunge: 220, lungeUntil: 370, sfx: 'heavySwing', hits: [{ at: 365, hit: hit({ dmg: 28, x0: 0, x1: 270, kbx: 320, kbz: 940, hitstop: 120, shake: 12, heavy: true, yTol: 56, ...reach }) }] },
    ],
  },
  // The ninja: fastest, double jump, dash strike, long flurries of small hits. Fragile.
  jordan: {
    id: 'jordan',
    rig: 'jordan',
    name: 'JORDAN',
    role: 'DRUMS',
    blurb: 'Ninja. Double jump, dash strike, endless flurries.',
    stats: { power: 2, speed: 5, health: 2 },
    colour: 0xffd84a,
    hp: 85,
    speed: 540,
    jumpV: 1230,
    doubleJump: true,
    armor: false,
    specialName: 'DRUM ROLL',
    combo: [
      ...[1, 2, 3, 4].map((i) => ({
        anim: 'atk' + i,
        dur: 150,
        chainAt: 85,
        lunge: 220,
        lungeUntil: 70,
        sfx: 'tick',
        hits: [{ at: 60, hit: hit({ dmg: 5, x0: 0, x1: 165, kbx: 110, stun: 260, hitstop: 20, ...reach }) }],
      })),
      { anim: 'atk5', dur: 340, chainAt: 9999, lunge: 300, lungeUntil: 150, sfx: 'swing', hits: [{ at: 150, hit: hit({ dmg: 12, x0: 0, x1: 180, kbx: 400, kbz: 540, hitstop: 70, shake: 6, heavy: true, ...reach }) }] },
    ],
  },
};

export const HERO_ORDER: HeroId[] = ['cannon', 'lieu', 'jordan'];

/** Moves that are not part of the ground combo. */
export const TECH = {
  cannonThrow: { dur: 520, releaseAt: 310, speed: 1250, lift: 380, dmgThrown: 16, hit: hit({ dmg: 14, x0: -60, x1: 60, kbx: 420, kbz: 520, yTol: 56, heavy: true, hitstop: 60, shake: 6 }) },
  cannonDive: {
    forward: 580,
    hop: 320,
    gravity: 1.7,
    body: hit({ dmg: 10, x0: -30, x1: 120, kbx: 300, kbz: 420, z0: -80, z1: 150, yTol: 56 }),
    radius: 210,
    land: hit({ dmg: 14, x0: 0, x1: 0, kbx: 420, kbz: 640, heavy: true, hitstop: 90, shake: 10 }),
    bonusPerPx: 0.11,
    bonusMax: 24,
  },
  cannonSurf: { start: 260, fly: 760, speed: 1380, height: 105, hit: hit({ dmg: 24, x0: -40, x1: 170, kbx: 720, kbz: 720, z0: -140, z1: 140, yTol: 70, heavy: true, hitstop: 50, shake: 7 }) },
  lieuAir: { at: 150, hit: hit({ dmg: 20, x0: -10, x1: 230, kbx: 300, kbz: 520, z0: -260, z1: 140, yTol: 56, heavy: true, hitstop: 80, shake: 7 }) },
  lieuDrop: { dur: 1000, at: 520, radius: 540, hit: hit({ dmg: 32, x0: 0, x1: 0, kbx: 520, kbz: 880, heavy: true, hitstop: 140, shake: 20 }) },
  jordanDash: { dur: 260, speed: 1300, until: 180, cooldown: 850, hit: hit({ dmg: 8, x0: -30, x1: 150, kbx: 260, stun: 380, yTol: 56, hitstop: 30 }) },
  jordanAir: { forward: 800, down: 1150, bounce: 820, hit: hit({ dmg: 12, x0: -20, x1: 130, kbx: 260, kbz: 460, z0: -110, z1: 120, yTol: 56, hitstop: 50, shake: 4 }) },
  jordanRoll: {
    dur: 880,
    speed: 640,
    every: 85,
    hit: hit({ dmg: 4, x0: -30, x1: 200, kbx: 70, stun: 320, yTol: 60, hitstop: 12 }),
    endDur: 380,
    throwAt: 150,
    stick: hit({ dmg: 14, x0: -40, x1: 40, kbx: 380, kbz: 460, yTol: 50, z0: -120, z1: 120, heavy: true }),
    stickSpeed: 1500,
    stickRange: 900,
  },
};
