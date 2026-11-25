// Cut-out puppet rigs. Pure maths and SVG strings only: no Phaser, no DOM,
// so this file is shared by the game, the character sheet and the unit tests.

export type Pose = Record<string, number>;

export interface PartDef {
  id: string;
  /** Parent part id, or null to hang off the rig root (feet centre on the ground). */
  parent: string | null;
  /** Inner SVG markup, drawn in the part's own 0..w / 0..h box, facing right. */
  svg: string;
  w: number;
  h: number;
  /** Joint position inside the part's own box. */
  pivot: [number, number];
  /** Where that joint sits, in the parent's box (or root space when parent is null). */
  attach: [number, number];
  /** Draw order, low numbers are drawn first (further back). */
  order: number;
  /** URL of a custom drawing that replaces `svg` (see custom-art/README.md). */
  image?: string;
}

export interface Anim {
  dur: number;
  loop?: boolean;
  keys: { t: number; p: Pose; ease?: Ease }[];
}
export type Ease = 'lin' | 'in' | 'out' | 'io' | 'back';

export interface RigDef {
  id: string;
  parts: PartDef[];
  /** Hip height above the ground in rig units; used by the `crouch` channel. */
  legLen: number;
  /** World pixels per rig unit. */
  scale: number;
  /** Standing height in rig units (for hit boxes, health bars, shadows). */
  height: number;
  /** Ground shadow width in rig units. */
  shadow: number;
  anims: Record<string, Anim>;
}

export interface PartXf {
  id: string;
  x: number;
  y: number;
  /** Degrees, clockwise on screen. */
  rot: number;
  sx: number;
  sy: number;
}

const DEG = Math.PI / 180;

const isScale = (k: string) => k === 'sx' || k === 'sy' || k.endsWith('_sx') || k.endsWith('_sy');
export const poseDefault = (k: string) => (isScale(k) ? 1 : 0);
const get = (p: Pose, k: string) => (k in p ? p[k] : poseDefault(k));

/**
 * Forward kinematics. Returns each part's joint position, rotation and scale in
 * root space (origin = feet on the ground, y up is negative), sorted for drawing.
 * Root squash (`sx`, `sy`) is not applied here; the caller scales the whole puppet.
 */
export function solve(rig: RigDef, pose: Pose): PartXf[] {
  const frames = new Map<string, PartXf & { def: PartDef | null }>();
  const crouch = get(pose, 'crouch');
  const drop = crouch * rig.legLen * 0.5;
  const root = { id: '', x: get(pose, 'x'), y: get(pose, 'y'), rot: get(pose, 'rot'), sx: 1, sy: 1, def: null };
  const out: PartXf[] = [];
  for (const part of rig.parts) {
    const parent = part.parent ? frames.get(part.parent) : root;
    if (!parent) throw new Error(`rig ${rig.id}: part ${part.id} declared before its parent ${part.parent}`);
    const pv = parent.def ? parent.def.pivot : [0, 0];
    let lx = part.attach[0] + get(pose, part.id + '_dx') - pv[0];
    let ly = part.attach[1] + get(pose, part.id + '_dy') - pv[1];
    let sy = get(pose, part.id + '_sy');
    if (!part.parent && crouch !== 0) {
      // Crouching lowers everything hung off the root and squashes the legs to match.
      if (part.id.startsWith('leg')) {
        ly += drop;
        sy *= (rig.legLen - drop) / rig.legLen;
      } else {
        ly += drop;
      }
    }
    lx *= parent.sx;
    ly *= parent.sy;
    const r = parent.rot * DEG;
    const c = Math.cos(r);
    const s = Math.sin(r);
    const f = {
      id: part.id,
      x: parent.x + lx * c - ly * s,
      y: parent.y + lx * s + ly * c,
      rot: parent.rot + get(pose, part.id),
      sx: get(pose, part.id + '_sx'),
      sy,
      def: part,
    };
    frames.set(part.id, f);
    out.push({ id: f.id, x: f.x, y: f.y, rot: f.rot, sx: f.sx, sy: f.sy });
  }
  // `<part>_z` nudges a part's draw order for one pose (e.g. a weapon slung behind the head).
  const order = new Map(rig.parts.map((p) => [p.id, p.order + get(pose, p.id + '_z')]));
  return out.sort((a, b) => order.get(a.id)! - order.get(b.id)!);
}

export function ease(kind: Ease | undefined, t: number): number {
  switch (kind) {
    case 'in':
      return t * t;
    case 'out':
      return 1 - (1 - t) * (1 - t);
    case 'back': {
      const c = 1.9;
      return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2);
    }
    case 'lin':
      return t;
    default:
      return t * t * (3 - 2 * t);
  }
}

export function lerpPose(a: Pose, b: Pose, t: number): Pose {
  const out: Pose = {};
  for (const k in a) out[k] = a[k] + (get(b, k) - a[k]) * t;
  for (const k in b) if (!(k in a)) out[k] = poseDefault(k) + (b[k] - poseDefault(k)) * t;
  return out;
}

/** Sample an animation at a time in milliseconds. Non-looping animations hold their last key. */
export function sample(anim: Anim, ms: number): Pose {
  const keys = anim.keys;
  let t = anim.dur <= 0 ? 1 : ms / anim.dur;
  t = anim.loop ? t - Math.floor(t) : Math.min(1, Math.max(0, t));
  if (t <= keys[0].t) return { ...keys[0].p };
  for (let i = 1; i < keys.length; i++) {
    const k1 = keys[i];
    if (t <= k1.t) {
      const k0 = keys[i - 1];
      const span = k1.t - k0.t;
      return lerpPose(k0.p, k1.p, span <= 0 ? 1 : ease(k1.ease, (t - k0.t) / span));
    }
  }
  return { ...keys[keys.length - 1].p };
}

const n = (v: number) => Math.round(v * 100) / 100;

/** Whole puppet as one SVG group, feet at (0,0). Used by the character sheet and UI portraits. */
export function rigToSvg(rig: RigDef, pose: Pose): string {
  const sx = get(pose, 'sx');
  const sy = get(pose, 'sy');
  const byId = new Map(rig.parts.map((p) => [p.id, p]));
  let g = `<g transform="scale(${n(rig.scale * sx)} ${n(rig.scale * sy)})">`;
  for (const f of solve(rig, pose)) {
    const d = byId.get(f.id)!;
    if (get(pose, f.id + '_hide') > 0.5) continue;
    g += `<g transform="translate(${n(f.x)} ${n(f.y)}) rotate(${n(f.rot)}) scale(${n(f.sx)} ${n(f.sy)}) translate(${-d.pivot[0]} ${-d.pivot[1]})">${partMarkup(d)}</g>`;
  }
  return g + '</g>';
}

export const partMarkup = (d: PartDef) =>
  d.image ? `<image href="${d.image}" width="${d.w}" height="${d.h}" preserveAspectRatio="none"/>` : d.svg;

/** A single part as a standalone SVG document, for rasterising into a texture. */
export function partToSvgDoc(part: PartDef, pxPerUnit: number): { svg: string; w: number; h: number } {
  const w = Math.ceil(part.w * pxPerUnit);
  const h = Math.ceil(part.h * pxPerUnit);
  return {
    w,
    h,
    svg: `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${part.w} ${part.h}">${part.svg}</svg>`,
  };
}
