// Shared construction for the human puppets (the three heroes and Joanne).
// Everything is drawn facing right; the game flips the whole puppet to face left.
import { INK, OL, OL_THIN, PAL } from '../palette';
import type { PartDef } from '../rig';

export const LEG_LEN = 52;

export interface Held {
  svg: string;
  w: number;
  h: number;
  pivot: [number, number];
}

export interface HumanSpec {
  head: string;
  torso: string;
  armF: string;
  armB: string;
  legF: string;
  legB: string;
  weapon?: Held;
  weaponB?: Held;
  /** Extra piece hung off the torso and drawn behind everything (cape, hair, skirt back). */
  back?: Held & { attach: [number, number] };
}

export interface Layout {
  legLen: number;
  torso: { w: number; h: number; pivot: [number, number]; lift: number };
  head: { w: number; h: number; pivot: [number, number]; attach: [number, number] };
  arm: { w: number; h: number; pivot: [number, number]; hand: [number, number]; attachF: [number, number]; attachB: [number, number] };
  leg: { w: number; h: number; pivot: [number, number]; xF: number; xB: number };
}

export const HUMAN: Layout = {
  legLen: LEG_LEN,
  torso: { w: 100, h: 100, pivot: [50, 90], lift: 8 },
  head: { w: 180, h: 180, pivot: [84, 146], attach: [52, 22] },
  arm: { w: 40, h: 80, pivot: [20, 14], hand: [20, 61], attachF: [38, 36], attachB: [66, 34] },
  leg: { w: 56, h: 70, pivot: [22, 10], xF: -10, xB: 11 },
};

/** Standard biped: torso on the root, head and arms on the torso, legs on the root. */
export function humanParts(s: HumanSpec, L: Layout = HUMAN): PartDef[] {
  const parts: PartDef[] = [
    { id: 'torso', parent: null, svg: s.torso, w: L.torso.w, h: L.torso.h, pivot: L.torso.pivot, attach: [0, -L.legLen + L.torso.lift], order: 5 },
    { id: 'head', parent: 'torso', svg: s.head, w: L.head.w, h: L.head.h, pivot: L.head.pivot, attach: L.head.attach, order: 6 },
    { id: 'armB', parent: 'torso', svg: s.armB, w: L.arm.w, h: L.arm.h, pivot: L.arm.pivot, attach: L.arm.attachB, order: 1 },
    { id: 'armF', parent: 'torso', svg: s.armF, w: L.arm.w, h: L.arm.h, pivot: L.arm.pivot, attach: L.arm.attachF, order: 8 },
    { id: 'legB', parent: null, svg: s.legB, w: L.leg.w, h: L.leg.h, pivot: L.leg.pivot, attach: [L.leg.xB, -L.legLen], order: 2 },
    { id: 'legF', parent: null, svg: s.legF, w: L.leg.w, h: L.leg.h, pivot: L.leg.pivot, attach: [L.leg.xF, -L.legLen], order: 3 },
  ];
  if (s.back) parts.push({ id: 'back', parent: 'torso', ...pick(s.back), attach: s.back.attach, order: -1 });
  if (s.weaponB) parts.push({ id: 'weaponB', parent: 'armB', ...pick(s.weaponB), attach: L.arm.hand, order: 0 });
  if (s.weapon) parts.push({ id: 'weapon', parent: 'armF', ...pick(s.weapon), attach: L.arm.hand, order: 7 });
  return parts;
}
const pick = (h: Held) => ({ svg: h.svg, w: h.w, h: h.h, pivot: h.pivot });

// ---------------------------------------------------------------- body pieces

export function arm(skin: string, shade: string, sleeve?: { fill: string; shade: string; len?: number }, marks = ''): string {
  const len = sleeve?.len ?? 30;
  return (
    `<path d="M9 15 Q9 4 20 4 Q31 4 31 15 V54 H9 Z" fill="${skin}" ${OL}/>` +
    `<path d="M24 16 V52 H29 V15 Z" fill="${shade}" opacity=".55"/>` +
    marks +
    (sleeve
      ? `<path d="M7 15 Q7 2.5 20 2.5 Q33 2.5 33 15 V${len} H7 Z" fill="${sleeve.fill}" ${OL}/>` +
        `<path d="M25 8 Q30 10 30.5 16 V${len - 2.5} H25 Z" fill="${sleeve.shade}"/>`
      : '') +
    `<circle cx="20" cy="61" r="13" fill="${skin}" ${OL}/>` +
    `<path d="M14 66 q6 4 12 0" fill="none" ${OL_THIN} opacity=".5"/>`
  );
}

export function leg(pants: string, pantsShade: string, shoe: string, shoeTrim: string, wide = 0): string {
  const l = 9 - wide;
  const r = 37 + wide;
  return (
    `<path d="M${l} 9 Q${l} 4 ${l + 5} 4 H${r - 5} Q${r} 4 ${r} 9 V50 H${l} Z" fill="${pants}" ${OL}/>` +
    `<path d="M${r - 8} 8 H${r - 2.5} V48 H${r - 8} Z" fill="${pantsShade}"/>` +
    `<path d="M6 48 H38 Q51 49 51 59 V63 H6 Z" fill="${shoe}" ${OL}/>` +
    `<path d="M6 58.5 H51" fill="none" stroke="${shoeTrim}" stroke-width="4"/>` +
    `<path d="M6 48 H38 Q51 49 51 59 V63 H6 Z" fill="none" ${OL}/>`
  );
}

/** T-shirt or vest body. `print` is drawn on the chest, `neck` on top of everything. */
export function torso(fill: string, shade: string, skin: string, print = '', neck = ''): string {
  return (
    `<path d="M41 4 H61 V24 H41 Z" fill="${skin}" ${OL}/>` +
    `<path d="M24 32 Q24 17 40 15 H62 Q78 17 78 32 L80 84 Q80 93 70 93 H30 Q20 93 20 84 Z" fill="${fill}" ${OL}/>` +
    `<path d="M67 18 Q76 21 76 32 L77.5 84 Q77 90 70 90.5 H62 Q68 60 67 18 Z" fill="${shade}"/>` +
    print +
    neck
  );
}

export const chain = (colour: string, drop = 16) =>
  `<path d="M40 17 Q51 ${17 + drop * 2} 62 17" fill="none" stroke="${INK}" stroke-width="5.5" stroke-linecap="round"/>` +
  `<path d="M40 17 Q51 ${17 + drop * 2} 62 17" fill="none" stroke="${colour}" stroke-width="2.6" stroke-linecap="round"/>`;

// ----------------------------------------------------------------------- head

export interface FaceOpts {
  skin: string;
  shade: string;
  /** Drawn before the head shape (hair that falls behind the neck). */
  behind?: string;
  /** Drawn after the face (fringe, glasses, facial hair). */
  front?: string;
  eyes?: 'wide' | 'lidded' | 'sharp';
  brows?: string;
  mouth?: string;
  cheeks?: string;
}

export function head(o: FaceOpts): string {
  const eyeRy = o.eyes === 'lidded' ? 13 : o.eyes === 'sharp' ? 12.5 : 15;
  let eyes =
    `<ellipse cx="94" cy="94" rx="12" ry="${eyeRy}" fill="${PAL.white}" ${OL_THIN}/>` +
    `<ellipse cx="124" cy="93" rx="10" ry="${eyeRy - 1}" fill="${PAL.white}" ${OL_THIN}/>` +
    `<ellipse cx="98.5" cy="96" rx="5.5" ry="7.5" fill="${INK}"/>` +
    `<ellipse cx="127.5" cy="95" rx="4.8" ry="7" fill="${INK}"/>` +
    `<circle cx="100.5" cy="92.5" r="1.9" fill="${PAL.white}"/>` +
    `<circle cx="129" cy="91.5" r="1.7" fill="${PAL.white}"/>`;
  if (o.eyes === 'lidded') {
    eyes +=
      `<path d="M80 92 Q94 74 107.5 92 Z" fill="${o.skin}"/><path d="M81 92 H107" ${OL_THIN} fill="none"/>` +
      `<path d="M112.5 91 Q124 74 135.5 91 Z" fill="${o.skin}"/><path d="M113 91 H135" ${OL_THIN} fill="none"/>`;
  }
  if (o.eyes === 'sharp') {
    eyes +=
      `<path d="M80 86 Q94 76 108 89 L108 80 L80 78 Z" fill="${o.skin}"/><path d="M82 85 L106 89" ${OL_THIN} fill="none"/>` +
      `<path d="M112 88 Q124 77 136 85 L136 78 L112 80 Z" fill="${o.skin}"/><path d="M114 88 L134 85" ${OL_THIN} fill="none"/>`;
  }
  return (
    (o.behind ?? '') +
    `<ellipse cx="44" cy="100" rx="11" ry="14" fill="${o.skin}" ${OL}/>` +
    `<path d="M41 100 q5 -4 7 3" fill="none" ${OL_THIN} opacity=".6"/>` +
    `<path d="M38 92 C38 54 62 40 90 40 C120 40 142 58 142 94 C142 126 121 144 91 144 C60 144 38 126 38 92Z" fill="${o.skin}" ${OL}/>` +
    `<path d="M43 112 C50 132 68 141.5 91 141.5 C113 141.5 131 131 138.5 112 C129 124 113 133 91 133 C70 133 54 127 43 112Z" fill="${o.shade}" opacity=".8"/>` +
    (o.cheeks ?? '') +
    eyes +
    (o.brows ?? `<path d="M80 73 L106 79" stroke="${INK}" stroke-width="7" stroke-linecap="round"/><path d="M114 79 L135 73" stroke="${INK}" stroke-width="7" stroke-linecap="round"/>`) +
    `<path d="M110 102 q7 5 1 11" fill="none" ${OL_THIN}/>` +
    (o.mouth ?? `<path d="M98 126 q12 5 24 -1" fill="none" ${OL_THIN}/>`) +
    (o.front ?? '')
  );
}

/** Scalloped blob: circles outlined, then refilled so only the outer edge keeps its outline. */
export function blob(circles: [number, number, number][], fill: string): string {
  return (
    circles.map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${fill}" ${OL}/>`).join('') +
    circles.map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r - 1.5}" fill="${fill}"/>`).join('')
  );
}
