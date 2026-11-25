// Hit maths. Pure functions so they can be unit-tested without a browser.

export interface HitDef {
  dmg: number;
  /** Reach in front of the attacker (negative = behind), in world pixels. */
  x0: number;
  x1: number;
  /** How far apart in depth (street rows) attacker and target may be. */
  yTol: number;
  /** Height band relative to the attacker's feet. */
  z0: number;
  z1: number;
  /** Horizontal knock-back speed. */
  kbx: number;
  /** Launch speed. Above zero knocks the target off its feet. */
  kbz: number;
  /** Hit-stun in ms when the target stays standing. */
  stun: number;
  hitstop?: number;
  shake?: number;
  heavy?: boolean;
}

export interface Body {
  x: number;
  y: number;
  z: number;
  facing: 1 | -1;
  radius: number;
  height: number;
}

export const HIT_DEFAULTS = { yTol: 46, z0: -20, z1: 200, kbz: 0, stun: 300 };
export const hit = (h: Partial<HitDef> & Pick<HitDef, 'dmg' | 'x0' | 'x1' | 'kbx'>): HitDef => ({ ...HIT_DEFAULTS, ...h });

/** Box test in front of the attacker. */
export function hitTest(a: Body, h: HitDef, t: Body): boolean {
  const dx = (t.x - a.x) * a.facing;
  if (dx < h.x0 - t.radius || dx > h.x1 + t.radius) return false;
  if (Math.abs(t.y - a.y) > h.yTol) return false;
  return t.z + t.height >= a.z + h.z0 && t.z <= a.z + h.z1;
}

/** Ground shockwave: an ellipse on the street (depth is foreshortened), only reaching up to `maxZ`. */
export function radialTest(cx: number, cy: number, radius: number, t: Body, maxZ = Infinity, depthScale = 0.5): boolean {
  if (t.z > maxZ) return false;
  const dx = (t.x - cx) / (radius + t.radius);
  const dy = (t.y - cy) / (radius * depthScale + 20);
  return dx * dx + dy * dy <= 1;
}

export interface Frenzy {
  speed: number;
  damage: number;
  knock: number;
}
export const FRENZY: Frenzy = { speed: 1.4, damage: 2, knock: 1.3 };
export const FRENZY_MS = 8000;

export function applyFrenzy(h: HitDef, on: boolean): HitDef {
  if (!on) return h;
  return { ...h, dmg: Math.round(h.dmg * FRENZY.damage), kbx: h.kbx * FRENZY.knock, kbz: h.kbz * FRENZY.knock };
}

/** Special meter (0..100). */
export const meterGain = (meter: number, dealt: number, taken = 0) => Math.min(100, meter + dealt * 0.75 + taken * 0.5);

/** Rectangular footprint of something you can stand on. */
export interface Platform {
  x0: number;
  x1: number;
  y0: number;
  y1: number;
  h: number;
}

const STEP = 26;

/** Height of the ground under a point, given how high the body currently is. */
export function groundAt(platforms: Platform[], x: number, y: number, z: number): number {
  let g = 0;
  for (const p of platforms) if (x > p.x0 && x < p.x1 && y > p.y0 && y < p.y1 && z >= p.h - STEP) g = Math.max(g, p.h);
  return g;
}

/** Push a grounded body out of any platform it is too low to stand on. Returns the corrected position. */
export function pushOut(platforms: Platform[], x: number, y: number, z: number, px: number, py: number): { x: number; y: number } {
  for (const p of platforms) {
    if (z >= p.h - STEP || x <= p.x0 || x >= p.x1 || y <= p.y0 || y >= p.y1) continue;
    // Prefer the side the body came from; fall back to the nearest edge.
    if (py >= p.y1) y = p.y1;
    else if (px <= p.x0) x = p.x0;
    else if (px >= p.x1) x = p.x1;
    else if (py <= p.y0) y = p.y0;
    else {
      const d = [x - p.x0, p.x1 - x, p.y1 - y];
      const m = Math.min(...d);
      if (m === d[2]) y = p.y1;
      else if (m === d[0]) x = p.x0;
      else x = p.x1;
    }
  }
  return { x, y };
}
