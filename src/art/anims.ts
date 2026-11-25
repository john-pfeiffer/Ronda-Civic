// Keyframe animations for the biped puppets.
// Angles are written "forward positive": a limb value of 90 points straight ahead,
// 180 straight up. `bp` converts that into the screen rotations the rig solver uses.
import type { Anim, Ease, Pose } from './rig';

export interface BP {
  lean?: number; // torso tips forward
  head?: number; // head nods forward
  aF?: number; // front arm swings forward/up
  aB?: number;
  lF?: number; // front leg swings forward
  lB?: number;
  wp?: number; // weapon angle relative to its arm, same direction sense
  wpB?: number;
  x?: number;
  y?: number;
  rot?: number;
  sx?: number;
  sy?: number;
  crouch?: number;
  raw?: Pose;
}

export function bp(o: BP): Pose {
  const p: Pose = { ...(o.raw ?? {}) };
  if (o.lean !== undefined) p.torso = o.lean;
  if (o.head !== undefined) p.head = o.head;
  if (o.aF !== undefined) p.armF = -o.aF;
  if (o.aB !== undefined) p.armB = -o.aB;
  if (o.lF !== undefined) p.legF = -o.lF;
  if (o.lB !== undefined) p.legB = -o.lB;
  if (o.wp !== undefined) p.weapon = -o.wp;
  if (o.wpB !== undefined) p.weaponB = -o.wpB;
  for (const k of ['x', 'y', 'rot', 'sx', 'sy', 'crouch'] as const) if (o[k] !== undefined) p[k] = o[k]!;
  return p;
}

type K = [t: number, pose: BP, ease?: Ease];
export const anim = (dur: number, keys: K[], loop = false): Anim => ({
  dur,
  loop,
  keys: keys.map(([t, p, e]) => ({ t, p: bp(p), ease: e })),
});

/** Walk cycle built around a carrying pose, so each character keeps its own arm attitude. */
export function walkCycle(dur: number, base: BP, stride = 30, armSwing = 16, bob = 5): Anim {
  const at = (ph: number, y: number): BP => ({
    ...base,
    lF: stride * ph,
    lB: -stride * ph,
    aF: (base.aF ?? 0) - armSwing * ph,
    aB: (base.aB ?? 0) + armSwing * ph,
    y: (base.y ?? 0) + y,
  });
  return anim(dur, [[0, at(1, 0)], [0.25, at(0, -bob)], [0.5, at(-1, 0)], [0.75, at(0, -bob)], [1, at(1, 0)]], true);
}

// ------------------------------------------------------------ shared reactions

export const COMMON: Record<string, Anim> = {
  jump: anim(180, [[0, { crouch: 0.35, sy: 0.9, sx: 1.08 }], [1, { lF: 45, lB: -15, aF: 150, aB: 140, lean: -4, sy: 1.06, sx: 0.96 }, 'out']]),
  fall: anim(220, [[0, { lF: 45, lB: -15, aF: 150, aB: 140 }], [1, { lF: 20, lB: -30, aF: 120, aB: 170, lean: 6 }]]),
  land: anim(140, [[0, { crouch: 0.5, sy: 0.86, sx: 1.12, aF: 30, aB: 20 }], [1, {}, 'out']]),
  hurt: anim(260, [
    [0, { lean: -8, head: -6 }],
    [0.3, { lean: -26, head: -20, aF: 70, aB: 60, x: -8, lF: 20, lB: -10, wp: 30 }, 'out'],
    [1, { lean: -12, head: -8, aF: 30, aB: 20, wp: 40 }],
  ]),
  knock: anim(300, [
    [0, { rot: -20, lean: -10, aF: 80, aB: 70 }],
    [1, { rot: -75, lean: -8, head: 18, aF: 130, aB: 110, lF: 50, lB: 25, wp: 40 }, 'out'],
  ]),
  down: anim(200, [
    [0, { rot: -80, y: -14, aF: 120, aB: 100, lF: 40, lB: 20, sy: 0.94 }],
    [0.5, { rot: -90, y: -26, aF: 150, aB: 60, lF: 30, lB: 10, head: 10, sy: 1.04 }, 'out'],
    [1, { rot: -90, y: -20, aF: 160, aB: 40, lF: 22, lB: 4, head: 6 }],
  ]),
  getup: anim(420, [
    [0, { rot: -90, y: -20, aF: 160, aB: 40, lF: 22, lB: 4 }],
    [0.45, { rot: -30, crouch: 0.6, lean: 30, aF: -20, aB: -30, lF: 40, lB: -20 }],
    [1, { crouch: 0.1, lean: 6 }, 'out'],
  ]),
  victory: anim(700, [
    [0, { crouch: 0.3, aF: 150, aB: 150, wp: 20 }],
    [0.4, { y: -46, aF: 185, aB: 190, lF: 30, lB: -30, wp: 10, sy: 1.05 }, 'out'],
    [0.8, { crouch: 0.3, aF: 150, aB: 150, wp: 20, sy: 0.94 }, 'in'],
    [1, { crouch: 0.3, aF: 150, aB: 150, wp: 20 }],
  ], true),
};

// ------------------------------------------------------------------- CANNON
// Bat-ready stance, never still. Big committed swings.

const C_READY: BP = { lean: 8, aF: 58, wp: 78, aB: -18 };
export const CANNON: Record<string, Anim> = {
  ...COMMON,
  idle: anim(460, [[0, { ...C_READY, crouch: 0.04 }], [0.5, { ...C_READY, crouch: 0.2, aF: 66, wp: 70, head: 4 }], [1, { ...C_READY, crouch: 0.04 }]], true),
  walk: walkCycle(440, { ...C_READY, lean: 14 }, 34, 10, 7),
  atk1: anim(300, [
    [0, { lean: -8, aF: 150, wp: 50, aB: -30, lB: -14 }],
    [0.4, { lean: 20, aF: 58, wp: 34, aB: -50, lF: 22, lB: -18, x: 12 }, 'in'],
    [0.62, { lean: 26, aF: 8, wp: 22, aB: -55, lF: 24, lB: -18, x: 14 }, 'out'],
    [1, { ...C_READY, x: 6 }],
  ]),
  atk2: anim(300, [
    [0, { lean: 24, aF: 0, wp: 20, aB: -40, lF: 20, lB: -18 }],
    [0.4, { lean: 4, aF: 100, wp: 60, aB: -30, lF: 26, lB: -14, x: 12 }, 'in'],
    [0.62, { lean: -10, aF: 152, wp: 70, aB: -10, x: 14 }, 'out'],
    [1, { ...C_READY, x: 6 }],
  ]),
  atk3: anim(520, [
    [0, { lean: -14, aF: 190, wp: 30, aB: 160, crouch: 0.25 }],
    [0.32, { lean: -20, aF: 205, wp: 40, aB: 190, y: -38, lF: 30, lB: -10 }, 'out'],
    [0.52, { lean: 36, aF: 44, wp: 12, aB: 30, crouch: 0.45, x: 16, sy: 0.92, sx: 1.06 }, 'in'],
    [0.8, { lean: 34, aF: 40, wp: 10, aB: 30, crouch: 0.4, x: 16 }],
    [1, { ...C_READY, x: 8 }],
  ]),
  throw: anim(520, [
    [0, { lean: 20, aF: 85, aB: 85, wp: 150, crouch: 0.2 }],
    [0.35, { lean: -16, aF: 175, aB: 175, wp: 170, y: -6 }, 'out'],
    [0.6, { lean: 34, aF: 50, aB: 50, wp: 120, crouch: 0.2, x: 14 }, 'in'],
    [1, { ...C_READY }],
  ]),
  airatk: anim(240, [
    [0, { rot: 20, aF: 170, aB: 160, wp: 40 }],
    [1, { rot: 82, lean: -6, head: -30, aF: 175, aB: 182, lF: -8, lB: -30, wp: 30 }, 'out'],
  ]),
  special: anim(360, [
    [0, { rot: 70, aF: 190, aB: 150, lF: -10, lB: -34, head: -30, wp: 30, y: -6 }],
    [0.5, { rot: 96, aF: 150, aB: 205, lF: -30, lB: -6, head: -34, wp: 60, y: 6 }],
    [1, { rot: 70, aF: 190, aB: 150, lF: -10, lB: -34, head: -30, wp: 30, y: -6 }],
  ], true),
  specialStart: anim(260, [
    [0, { crouch: 0.5, lean: 20, aF: -30, aB: -40 }],
    [1, { rot: 60, y: -40, aF: 180, aB: 160, lF: -10, lB: -30, head: -24, wp: 30 }, 'out'],
  ]),
};

// --------------------------------------------------------------------- LIEU
// Bass parked on the shoulder, leaning back, nodding along. Slow wind-ups.

// weapon_z drops the bass behind his head while it rests on the shoulder
const L_REST: BP = { lean: -9, aF: 80, wp: 146, aB: -6, head: 4, raw: { weapon_z: -6.5 } };
export const LIEU: Record<string, Anim> = {
  ...COMMON,
  idle: anim(1100, [[0, { ...L_REST }], [0.5, { ...L_REST, head: 12, crouch: 0.07, wp: 108 }], [1, { ...L_REST }]], true),
  walk: walkCycle(780, { ...L_REST, lean: -12 }, 26, 14, 4),
  atk1: anim(540, [
    [0, { lean: -18, aF: 200, wp: 70, aB: -20, lB: -16, crouch: 0.1 }],
    [0.3, { lean: -22, aF: 215, wp: 80, aB: -24, lB: -18, crouch: 0.14 }],
    [0.5, { lean: 22, aF: 62, wp: 30, aB: -50, lF: 24, lB: -20, x: 14 }, 'in'],
    [0.7, { lean: 28, aF: -6, wp: 16, aB: -60, lF: 26, lB: -20, x: 16 }, 'out'],
    [1, { ...L_REST, x: 8 }],
  ]),
  atk2: anim(540, [
    [0, { lean: 28, aF: -6, wp: 16, aB: -60, lF: 26, lB: -20 }],
    [0.3, { lean: 32, aF: -30, wp: 0, aB: -62, lF: 26, lB: -20 }],
    [0.5, { lean: 4, aF: 96, wp: 50, aB: -30, lF: 26, lB: -16, x: 14 }, 'in'],
    [0.7, { lean: -16, aF: 178, wp: 80, aB: -10, x: 16 }, 'out'],
    [1, { ...L_REST, x: 8 }],
  ]),
  atk3: anim(680, [
    [0, { lean: 16, aF: -40, wp: -20, aB: 30, crouch: 0.3, lF: 20, lB: -20 }],
    [0.36, { lean: 26, aF: -74, wp: -30, aB: 40, crouch: 0.42, lF: 22, lB: -22 }],
    [0.54, { lean: -14, aF: 120, wp: 44, aB: -30, y: -14, x: 14 }, 'in'],
    [0.74, { lean: -24, aF: 196, wp: 70, aB: -40, y: -4, x: 14 }, 'out'],
    [1, { ...L_REST, x: 8 }],
  ]),
  airatk: anim(300, [
    [0, { aF: 200, wp: 50, aB: 190, lF: 40, lB: 10, lean: -16 }],
    [1, { aF: 40, wp: 10, aB: 30, lF: 30, lB: -30, lean: 30 }, 'in'],
  ]),
  special: anim(1000, [
    [0, { crouch: 0.4, lean: 14, aF: 60, aB: 60, wp: 60 }],
    [0.38, { y: -70, lean: -22, aF: 200, aB: 200, wp: 36, lF: 40, lB: -10, sy: 1.06 }, 'out'],
    [0.52, { y: 0, lean: 40, aF: 36, aB: 30, wp: 4, crouch: 0.6, sy: 0.86, sx: 1.12, x: 10 }, 'in'],
    [0.82, { lean: 38, aF: 34, aB: 30, wp: 4, crouch: 0.5, x: 10 }],
    [1, { ...L_REST }],
  ]),
};

// ------------------------------------------------------------------- JORDAN
// Low stance, one stick always twirling. Everything is quick.

const J_READY: BP = { lean: 14, crouch: 0.22, aF: 64, aB: 34, wpB: 84 };
export const JORDAN: Record<string, Anim> = {
  ...COMMON,
  idle: anim(640, [[0, { ...J_READY, wp: 70 }], [0.5, { ...J_READY, wp: 250, crouch: 0.28 }, 'lin'], [1, { ...J_READY, wp: 430 }, 'lin']], true),
  // ninja run: body pitched forward, arms trailing behind
  walk: walkCycle(330, { lean: 30, head: -22, aF: -62, aB: -74, wp: -20, wpB: -20, crouch: 0.14 }, 42, 5, 6),
  atk1: anim(150, [[0, { ...J_READY, aF: 130, wp: 60 }], [0.45, { ...J_READY, lean: 22, aF: 74, wp: 96, x: 8 }, 'in'], [1, { ...J_READY, wp: 70, x: 6 }]]),
  atk2: anim(150, [[0, { ...J_READY, aB: 130, wpB: 60 }], [0.45, { ...J_READY, lean: 24, aB: 80, wpB: 96, aF: 20, wp: 70, x: 8 }, 'in'], [1, { ...J_READY, wp: 70, x: 6 }]]),
  atk3: anim(150, [[0, { ...J_READY, aF: 20, wp: 20 }], [0.45, { ...J_READY, lean: 10, aF: 118, wp: 70, x: 8 }, 'in'], [1, { ...J_READY, wp: 70, x: 6 }]]),
  atk4: anim(150, [[0, { ...J_READY, aB: 20, wpB: 20, aF: 110, wp: 60 }], [0.45, { ...J_READY, lean: 12, aB: 120, wpB: 70, aF: 30, x: 8 }, 'in'], [1, { ...J_READY, wp: 70, x: 6 }]]),
  atk5: anim(340, [
    [0, { lean: -12, aF: 190, aB: 185, wp: 30, wpB: 30, y: -30, lF: 40, lB: 10 }],
    [0.45, { lean: 34, aF: 52, aB: 44, wp: 60, wpB: 60, crouch: 0.5, x: 14, sy: 0.9, sx: 1.08 }, 'in'],
    [0.75, { lean: 32, aF: 50, aB: 42, wp: 60, wpB: 60, crouch: 0.45, x: 14 }],
    [1, { ...J_READY, wp: 70, x: 6 }],
  ]),
  dash: anim(260, [
    [0, { lean: 40, head: -28, aF: 96, wp: 84, aB: -70, wpB: -10, lF: 56, lB: -56, crouch: 0.3 }],
    [0.7, { lean: 44, head: -30, aF: 100, wp: 88, aB: -80, wpB: -10, lF: 62, lB: -62, crouch: 0.34 }],
    [1, { ...J_READY, wp: 70 }],
  ]),
  flip: anim(380, [[0, { rot: 0, crouch: 0.6, aF: 60, aB: 60 }], [1, { rot: 360, crouch: 0.6, aF: 60, aB: 60 }, 'lin']]),
  airatk: anim(200, [
    [0, { rot: 10, aF: 190, aB: 180, wp: 20, wpB: 20 }],
    [1, { rot: 38, lean: 10, head: -20, aF: 62, aB: 50, wp: 40, wpB: 44, lF: -20, lB: -50 }, 'in'],
  ]),
  special: anim(110, [
    [0, { lean: 30, head: -20, crouch: 0.3, aF: 110, wp: 70, aB: 36, wpB: 90, lF: 50, lB: -50 }],
    [0.5, { lean: 32, head: -20, crouch: 0.3, aF: 40, wp: 90, aB: 112, wpB: 70, lF: 54, lB: -54 }, 'lin'],
    [1, { lean: 30, head: -20, crouch: 0.3, aF: 110, wp: 70, aB: 36, wpB: 90, lF: 50, lB: -50 }, 'lin'],
  ], true),
  specialEnd: anim(380, [
    [0, { lean: -10, aF: 170, aB: 160, wp: 40, wpB: 40 }],
    [0.4, { lean: 36, aF: 70, aB: 60, x: 12, lF: 30, lB: -30, raw: { weapon_hide: 1, weaponB_hide: 1 } }, 'in'],
    [1, { lean: 20, aF: 60, aB: 40, raw: { weapon_hide: 1, weaponB_hide: 1 } }],
  ]),
};

// ------------------------------------------------------------------ PIGMEN

const P_IDLE: BP = { lean: 6, aF: 22, aB: -8 };
const pigBase: Record<string, Anim> = {
  ...COMMON,
  idle: anim(820, [[0, { ...P_IDLE }], [0.5, { ...P_IDLE, crouch: 0.12, aF: 30, aB: -2, head: 5 }], [1, { ...P_IDLE }]], true),
  walk: walkCycle(560, { lean: 10, aF: 20, aB: -4 }, 28, 22, 4),
  dizzy: anim(700, [[0, { lean: 8, head: -14, aF: 10, aB: 0 }], [0.5, { lean: 12, head: 14, aF: 4, aB: 8, crouch: 0.1 }], [1, { lean: 8, head: -14, aF: 10, aB: 0 }]], true),
  taunt: anim(420, [[0, { lean: -12, head: -10, aF: 60, aB: 50 }], [0.5, { lean: -16, head: -16, aF: 76, aB: 66, y: -8 }], [1, { lean: -12, head: -10, aF: 60, aB: 50 }]], true),
};

export const PIGMAN: Record<string, Anim> = {
  ...pigBase,
  wind: anim(380, [[0, { ...P_IDLE }], [1, { lean: -14, aF: -78, aB: 50, crouch: 0.16, lB: -10, head: -4 }, 'out']]),
  atk: anim(300, [
    [0, { lean: -14, aF: -78, aB: 50, crouch: 0.16 }],
    [0.35, { lean: 26, aF: 96, aB: -40, x: 16, lF: 22, lB: -18 }, 'in'],
    [0.6, { lean: 26, aF: 92, aB: -40, x: 16, lF: 22, lB: -18 }],
    [1, { ...P_IDLE, x: 8 }],
  ]),
};

const PC_IDLE: BP = { lean: 4, aF: 64, wp: 100, aB: -10 };
export const PIG_CLUB: Record<string, Anim> = {
  ...pigBase,
  idle: anim(900, [[0, { ...PC_IDLE }], [0.5, { ...PC_IDLE, crouch: 0.12, wp: 98 }], [1, { ...PC_IDLE }]], true),
  walk: walkCycle(640, { ...PC_IDLE, lean: 8 }, 26, 8, 5),
  wind: anim(520, [[0, { ...PC_IDLE }], [1, { lean: -18, aF: 196, wp: 40, aB: 40, crouch: 0.2, y: -4 }, 'out']]),
  atk: anim(420, [
    [0, { lean: -18, aF: 196, wp: 40, aB: 40, crouch: 0.2 }],
    [0.3, { lean: 34, aF: 40, wp: 14, aB: -30, crouch: 0.4, x: 18, sy: 0.93, sx: 1.05 }, 'in'],
    [0.7, { lean: 32, aF: 36, wp: 12, aB: -30, crouch: 0.36, x: 18 }],
    [1, { ...PC_IDLE, x: 8 }],
  ]),
};

const PT_IDLE: BP = { lean: 2, aF: 60, wp: -60, aB: -10 };
export const PIG_THROW: Record<string, Anim> = {
  ...pigBase,
  idle: anim(700, [[0, { ...PT_IDLE }], [0.5, { ...PT_IDLE, aF: 76, wp: -76, crouch: 0.1 }], [1, { ...PT_IDLE }]], true),
  walk: walkCycle(520, { ...PT_IDLE, lean: 8 }, 28, 6, 4),
  wind: anim(460, [[0, { ...PT_IDLE }], [1, { lean: -20, aF: 200, wp: -150, aB: 60, lB: -12 }, 'out']]),
  atk: anim(340, [
    [0, { lean: -20, aF: 200, wp: -150, aB: 60 }],
    [0.3, { lean: 28, aF: 70, wp: -70, aB: -40, x: 12, lF: 20, lB: -16, raw: { weapon_hide: 1 } }, 'in'],
    [0.99, { lean: 14, aF: 30, aB: -20, x: 6, raw: { weapon_hide: 1 } }],
    [1, { ...PT_IDLE }],
  ]),
};

// ------------------------------------------------------------------ BIG BOY

const B_IDLE: BP = { lean: 6, aF: 24, aB: -14 };
export const BIGBOY_ANIMS: Record<string, Anim> = {
  ...COMMON,
  idle: anim(1300, [[0, { ...B_IDLE }], [0.5, { ...B_IDLE, crouch: 0.16, aF: 32, aB: -6, head: 6 }], [1, { ...B_IDLE }]], true),
  walk: walkCycle(900, { lean: 8, aF: 18, aB: -10 }, 22, 18, 6),
  wind: anim(520, [[0, { ...B_IDLE }], [1, { lean: -16, aF: -80, aB: 60, crouch: 0.2, head: -6 }, 'out']]),
  atk: anim(420, [
    [0, { lean: -16, aF: -80, aB: 60, crouch: 0.2 }],
    [0.32, { lean: 30, aF: 100, aB: -50, x: 26, lF: 20, lB: -16 }, 'in'],
    [0.66, { lean: 30, aF: 96, aB: -50, x: 26, lF: 20, lB: -16 }],
    [1, { ...B_IDLE, x: 10 }],
  ]),
  chargeWind: anim(800, [
    [0, { ...B_IDLE }],
    [0.3, { lean: 30, head: 14, aF: -50, aB: -66, crouch: 0.4, lF: -30 }, 'out'],
    [0.5, { lean: 32, head: 16, aF: -56, aB: -70, crouch: 0.42, lF: 20 }],
    [0.7, { lean: 30, head: 14, aF: -50, aB: -66, crouch: 0.4, lF: -30 }],
    [1, { lean: 34, head: 16, aF: -56, aB: -70, crouch: 0.44, lF: 20 }],
  ]),
  charge: walkCycle(300, { lean: 38, head: 4, aF: -44, aB: -60, crouch: 0.24 }, 40, 6, 8),
  slamUp: anim(420, [[0, { crouch: 0.55, lean: 12, aF: -30, aB: -40, sy: 0.9, sx: 1.08 }], [1, { lean: -14, aF: 190, aB: 196, lF: 30, lB: -20, sy: 1.05 }, 'out']]),
  slamFall: anim(200, [[0, { lean: -14, aF: 190, aB: 196, lF: 30, lB: -20 }], [1, { rot: 50, lean: 10, aF: 110, aB: 130, lF: -10, lB: -40 }, 'in']]),
  slamLand: anim(700, [
    [0, { rot: 74, y: -30, aF: 150, aB: 170, lF: -20, lB: -40, sy: 0.82, sx: 1.14 }],
    [0.6, { rot: 78, y: -34, aF: 156, aB: 176, lF: -16, lB: -36 }],
    [1, { crouch: 0.4, lean: 20, aF: 10, aB: 0 }],
  ]),
  roar: anim(900, [
    [0, { crouch: 0.3, lean: 16, aF: 10, aB: 0 }],
    [0.25, { lean: -18, head: -26, aF: 150, aB: 156 }, 'out'],
    [0.45, { lean: -20, head: -30, aF: 162, aB: 144, y: -4 }],
    [0.65, { lean: -18, head: -26, aF: 146, aB: 160 }],
    [0.85, { lean: -20, head: -30, aF: 160, aB: 146, y: -4 }],
    [1, { ...B_IDLE }],
  ]),
  dizzy: anim(900, [[0, { lean: 14, head: -16, aF: 6, aB: 0, crouch: 0.2 }], [0.5, { lean: 20, head: 16, aF: 0, aB: 10, crouch: 0.3 }], [1, { lean: 14, head: -16, aF: 6, aB: 0, crouch: 0.2 }]], true),
};

// ------------------------------------------------------------------- JOANNE

const hair = (a: number) => ({ back: a });
export const JOANNE: Record<string, Anim> = {
  ...COMMON,
  idle: anim(1000, [[0, { aF: 30, aB: 20, raw: hair(-3) }], [0.5, { aF: 36, aB: 26, crouch: 0.06, head: 4, raw: hair(4) }], [1, { aF: 30, aB: 20, raw: hair(-3) }]], true),
  caged: anim(900, [
    [0, { lean: 6, aF: 104, aB: 96, head: -8, raw: hair(-4) }],
    [0.5, { lean: 10, aF: 110, aB: 100, head: 6, x: 4, raw: hair(5) }],
    [1, { lean: 6, aF: 104, aB: 96, head: -8, raw: hair(-4) }],
  ], true),
  cheer: anim(460, [
    [0, { aF: 160, aB: 150, crouch: 0.2, raw: hair(0) }],
    [0.5, { aF: 186, aB: 178, y: -22, lF: 16, lB: -16, raw: hair(12) }, 'out'],
    [1, { aF: 160, aB: 150, crouch: 0.2, raw: hair(0) }, 'in'],
  ], true),
  walk: walkCycle(460, { lean: 8, aF: 10, aB: 0 }, 30, 26, 6),
};

// -------------------------------------------------------------------- DOGGY
// Raw screen rotations: for hanging legs, negative swings forward.

const dog = (dur: number, keys: [number, Pose, Ease?][], loop = true): Anim => ({ dur, loop, keys: keys.map(([t, p, e]) => ({ t, p, ease: e })) });
const WAG_L = { tail: -22 };
const WAG_R = { tail: 26 };
export const DOGGY: Record<string, Anim> = {
  idle: dog(360, [[0, { ...WAG_L, head: -4, ear: 4 }], [0.5, { ...WAG_R, head: 2, ear: -4 }], [1, { ...WAG_L, head: -4, ear: 4 }]]),
  sit: dog(520, [
    [0, { body: -26, body_dy: 10, legBL_sy: 0.4, legBR_sy: 0.4, legBL_dy: 16, legBR_dy: 16, legBL: 30, legBR: 30, head: 20, ...WAG_L, ear: 6 }],
    [0.5, { body: -26, body_dy: 10, legBL_sy: 0.4, legBR_sy: 0.4, legBL_dy: 16, legBR_dy: 16, legBL: 30, legBR: 30, head: 28, ...WAG_R, ear: -2 }],
    [1, { body: -26, body_dy: 10, legBL_sy: 0.4, legBR_sy: 0.4, legBL_dy: 16, legBR_dy: 16, legBL: 30, legBR: 30, head: 20, ...WAG_L, ear: 6 }],
  ]),
  run: dog(280, [
    [0, { legFL: -50, legFR: -40, legBL: 46, legBR: 36, body: -6, y: -8, tail: 50, ear: 40, head: -6 }],
    [0.5, { legFL: 40, legFR: 50, legBL: -36, legBR: -46, body: 6, y: 0, tail: 30, ear: 10, head: 4 }],
    [1, { legFL: -50, legFR: -40, legBL: 46, legBR: 36, body: -6, y: -8, tail: 50, ear: 40, head: -6 }],
  ]),
  bite: dog(300, [
    [0, { body: 10, head: -20, legFL: 30, legFR: 30, x: -8, ear: 30 }],
    [0.4, { body: -4, head: 16, legFL: -40, legFR: -40, legBL: 30, legBR: 30, x: 26, y: -10, ear: 50, tail: 40 }, 'in'],
    [1, { head: 0, x: 8 }],
  ], false),
  bark: dog(320, [[0, { head: -6 }], [0.3, { head: -26, y: -8, ear: 30, tail: 30, legFL: -14, legFR: -14 }, 'out'], [1, { head: -6 }]]),
  happy: dog(420, [
    [0, { ...WAG_L, legBL_sy: 0.8, legBR_sy: 0.8 }],
    [0.5, { ...WAG_R, y: -30, legFL: -40, legFR: -30, legBL: 30, legBR: 40, head: -16, ear: 44 }, 'out'],
    [1, { ...WAG_L, legBL_sy: 0.8, legBR_sy: 0.8 }, 'in'],
  ]),
};
