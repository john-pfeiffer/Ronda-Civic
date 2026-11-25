// The one and only level, as data: where things stand and who jumps you where.
import { FLOOR_BOTTOM, FLOOR_TOP, LEVEL_W, MODULE_W, W } from '../config/game';
import type { EnemyId } from './enemies';

export interface Spawn {
  type: EnemyId;
  /** Which edge of the screen it walks in from. */
  side: 'L' | 'R';
  /** Delay after the wave starts, ms. */
  delay?: number;
  /** 0 = back of the street, 1 = front. */
  depth?: number;
}

export interface Encounter {
  id: string;
  /** Camera position (left edge) where the screen locks. */
  at: number;
  waves: Spawn[][];
  hint?: string;
}

export type PickupKind = 'food' | 'tweaker' | 'record';

export interface PropPlacement {
  prop: 'car' | 'dumpster' | 'amps' | 'hydrant' | 'bin' | 'cone';
  x: number;
  /** Solid props you can climb: footprint depth and standing height. */
  solid?: { w: number; d: number; h: number };
  /** Decorative props: which street row their base sits on. */
  y?: number;
}

const M = MODULE_W;
const p = (type: EnemyId, side: 'L' | 'R', delay = 0, depth = 0.5): Spawn => ({ type, side, delay, depth });

export const LEVEL = {
  width: LEVEL_W,
  start: { x: 320, y: (FLOOR_TOP + FLOOR_BOTTOM) / 2 },

  props: [
    { prop: 'hydrant', x: 1180, y: FLOOR_TOP + 6 },
    { prop: 'car', x: 2360, solid: { w: 440, d: 84, h: 150 } },
    { prop: 'bin', x: 3120, y: FLOOR_TOP + 4 },
    { prop: 'cone', x: 3560, y: FLOOR_TOP + 40 },
    { prop: 'dumpster', x: 5300, solid: { w: 340, d: 84, h: 172 } },
    { prop: 'bin', x: 6260, y: FLOOR_TOP + 4 },
    { prop: 'cone', x: 6900, y: FLOOR_TOP + 30 },
    { prop: 'car', x: 8500, solid: { w: 440, d: 84, h: 150 } },
    { prop: 'hydrant', x: 9240, y: FLOOR_TOP + 6 },
    { prop: 'amps', x: M * 10 + 330, solid: { w: 200, d: 80, h: 168 } },
    { prop: 'amps', x: M * 12 - 330, solid: { w: 200, d: 80, h: 168 } },
  ] as PropPlacement[],

  crates: [
    { x: 1560, depth: 0.2, drop: 'record' },
    { x: 3300, depth: 0.75, drop: 'food' },
    { x: 4560, depth: 0.25, drop: 'record' },
    { x: 5900, depth: 0.7, drop: 'food' },
    { x: 7350, depth: 0.3, drop: 'tweaker' },
    { x: 7480, depth: 0.55, drop: 'record' },
    { x: 9300, depth: 0.7, drop: 'food' },
    { x: 9440, depth: 0.3, drop: 'tweaker' },
  ] as { x: number; depth: number; drop: PickupKind }[],

  doggy: { x: 4140, depth: 0.12 },

  encounters: [
    { id: 'street1', at: 500, hint: 'MOVE: stick / WASD     ATTACK: J     JUMP: K', waves: [[p('pigman', 'R', 0, 0.4), p('pigman', 'R', 700, 0.7)]] },
    { id: 'street2', at: 1900, hint: 'Fill the meter by landing hits, then hit SPECIAL (L)', waves: [[p('pigman', 'R', 0, 0.3), p('pigman', 'L', 300, 0.6), p('pigman', 'R', 900, 0.8)], [p('pigman', 'L', 0, 0.4), p('pigClub', 'R', 400, 0.6)]] },
    { id: 'alley1', at: 4400, waves: [[p('pigClub', 'R', 0, 0.5), p('pigman', 'R', 500, 0.2), p('pigman', 'L', 800, 0.8)], [p('pigman', 'L', 0, 0.3), p('pigman', 'R', 200, 0.7), p('pigClub', 'L', 900, 0.5)]] },
    { id: 'market1', at: 6500, hint: 'Throwers keep their distance. Close in or jump the cans.', waves: [[p('pigThrower', 'R', 0, 0.25), p('pigThrower', 'R', 400, 0.8), p('pigman', 'L', 600, 0.5), p('pigman', 'R', 1200, 0.5)]] },
    {
      id: 'market2', at: 7900, waves: [
        [p('pigman', 'R', 0, 0.3), p('pigman', 'L', 200, 0.7), p('pigman', 'R', 600, 0.6), p('pigThrower', 'R', 900, 0.15)],
        [p('pigClub', 'L', 0, 0.4), p('pigClub', 'R', 300, 0.7), p('pigThrower', 'L', 700, 0.85), p('pigThrower', 'R', 900, 0.2)],
        [p('pigman', 'L', 0, 0.2), p('pigman', 'R', 150, 0.4), p('pigman', 'L', 500, 0.6), p('pigman', 'R', 650, 0.8)],
      ],
    },
  ] as Encounter[],

  boss: {
    /** Camera lock for the arena: the whole stage module. */
    at: LEVEL_W - W,
    spawnX: LEVEL_W - 520,
    joanne: { x: LEVEL_W - 960, y: FLOOR_TOP - 92 },
    adds: [
      [p('pigman', 'L', 0, 0.3), p('pigman', 'R', 300, 0.7), p('pigClub', 'L', 900, 0.5)],
      [p('pigThrower', 'L', 0, 0.2), p('pigThrower', 'R', 200, 0.8), p('pigman', 'R', 700, 0.5)],
    ] as Spawn[][],
  },
};

export const depthToY = (d: number) => FLOOR_TOP + 14 + d * (FLOOR_BOTTOM - FLOOR_TOP - 28);
