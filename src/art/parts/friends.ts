// Joanne (the princess) and Doggy (the sidekick).
import { INK, OL, OL_THIN, PAL } from '../palette';
import { arm, head, humanParts, leg, HUMAN, type Layout } from './human';
import type { PartDef } from '../rig';

// ------------------------------------------------------------------ JOANNE
// First draft: punk princess. Tiara, long wavy hair, leather jacket over a pink dress, boots.

const HAIR = '#8a3b5c';
const HAIR_SHADE = '#642742';

const joanneHead = head({
  skin: PAL.skinPale,
  shade: PAL.skinPaleShade,
  eyes: 'wide',
  brows:
    `<path d="M82 74 Q94 68 106 74" fill="none" stroke="${HAIR_SHADE}" stroke-width="5" stroke-linecap="round"/>` +
    `<path d="M114 74 Q124 68 135 73" fill="none" stroke="${HAIR_SHADE}" stroke-width="5" stroke-linecap="round"/>`,
  cheeks: `<ellipse cx="76" cy="114" rx="9" ry="6" fill="${PAL.magenta}" opacity=".35"/><ellipse cx="134" cy="113" rx="7" ry="5" fill="${PAL.magenta}" opacity=".35"/>`,
  mouth: `<path d="M100 124 Q111 134 122 123 Q111 127 100 124Z" fill="${PAL.red}" ${OL_THIN}/>`,
  front:
    // lashes
    `<path d="M82 84 l-6 -5 M86 80 l-4 -6 M133 82 l6 -5" stroke="${INK}" stroke-width="3" stroke-linecap="round"/>` +
    // hair: swept fringe and a side lock
    `<path d="M34 104 C24 58 54 26 94 28 C128 26 150 50 146 84 C132 62 108 54 86 62 C70 68 60 82 56 104 L52 150 L36 140 Z" fill="${HAIR}" ${OL}/>` +
    `<path d="M40 100 C40 70 54 50 76 42 C60 58 52 76 50 100 L48 138 L40 132 Z" fill="${HAIR_SHADE}" opacity=".8"/>` +
    `<path d="M96 36 C112 36 128 44 136 58" fill="none" stroke="#b05a7d" stroke-width="4" stroke-linecap="round"/>` +
    // tiara
    `<path d="M66 44 L72 20 L84 34 L96 10 L108 34 L120 22 L124 44 Q95 34 66 44Z" fill="${PAL.gold}" ${OL}/>` +
    `<circle cx="96" cy="27" r="5" fill="${PAL.teal}" ${OL_THIN}/><circle cx="76" cy="34" r="3" fill="${PAL.magenta}"/><circle cx="116" cy="34" r="3" fill="${PAL.magenta}"/>`,
});

const JO: Layout = {
  ...HUMAN,
  torso: { w: 130, h: 130, pivot: [65, 90], lift: 8 },
  head: { ...HUMAN.head, attach: [67, 22] },
  arm: { ...HUMAN.arm, attachF: [53, 36], attachB: [81, 34] },
};

const joanneTorso =
  `<path d="M56 4 H76 V24 H56 Z" fill="${PAL.skinPale}" ${OL}/>` +
  // skirt flares out below the hips
  `<path d="M40 70 Q24 96 14 122 Q64 132 116 122 Q106 96 92 70 Z" fill="${PAL.magenta}" ${OL}/>` +
  `<path d="M84 72 Q98 98 106 121 L116 122 Q106 96 92 70 Z" fill="${PAL.magentaShade}"/>` +
  `<path d="M34 100 l6 12 M58 104 l2 14 M82 102 l6 14" stroke="${PAL.magentaShade}" stroke-width="3" stroke-linecap="round"/>` +
  // bodice and jacket
  `<path d="M42 30 Q42 16 56 15 H76 Q92 16 92 30 L94 76 H38 Z" fill="${PAL.magenta}" ${OL}/>` +
  `<path d="M42 30 Q42 16 56 15 L60 15 L54 44 L52 80 H36 Z" fill="${PAL.black}" ${OL}/>` +
  `<path d="M74 15 L76 15 Q92 16 92 30 L96 80 H80 L78 44 Z" fill="${PAL.blackShade}" ${OL}/>` +
  `<path d="M60 15 L54 44 L46 34 Z M74 15 L78 44 L86 34 Z" fill="${PAL.black}" ${OL_THIN}/>` +
  `<circle cx="46" cy="60" r="2.4" fill="${PAL.silver}"/><circle cx="46" cy="70" r="2.4" fill="${PAL.silver}"/>` +
  `<path d="M38 76 H94" stroke="${PAL.gold}" stroke-width="5"/>`;

const joanneBack = {
  w: 110,
  h: 150,
  pivot: [70, 20] as [number, number],
  attach: [50, -40] as [number, number],
  svg: `<path d="M40 10 C10 40 22 70 10 100 C18 120 30 136 46 140 C48 120 60 110 58 86 C70 60 84 40 80 14 Z" fill="${HAIR_SHADE}" ${OL}/>` +
    `<path d="M34 40 C26 66 34 84 26 108" fill="none" stroke="${HAIR}" stroke-width="5" stroke-linecap="round"/>`,
};

export const joanneParts = (): PartDef[] =>
  humanParts(
    {
      head: joanneHead,
      torso: joanneTorso,
      armF: arm(PAL.skinPale, PAL.skinPaleShade, { fill: PAL.black, shade: PAL.blackShade, len: 46 }),
      armB: arm(PAL.skinPaleShade, PAL.skinPaleShade, { fill: PAL.blackShade, shade: PAL.blackShade, len: 46 }),
      legF: leg(PAL.skinPale, PAL.skinPaleShade, PAL.black, PAL.magenta),
      legB: leg(PAL.skinPaleShade, PAL.skinPaleShade, PAL.blackShade, PAL.magentaShade),
      back: joanneBack,
    },
    JO,
  );

// ------------------------------------------------------------------- DOGGY
// Small scruffy mutt with ears too big for him and a red bandana.

const FUR = '#f1dcb4';
const FUR_SHADE = '#d6b987';
const PATCH = '#a8683c';

export const DOG_LEG = 30;

const dogLeg = (back: boolean) =>
  `<path d="M6 6 Q6 3 9 3 H21 Q24 3 24 6 V32 Q24 38 15 38 Q6 38 6 32 Z" fill="${back ? FUR_SHADE : FUR}" ${OL}/>` +
  `<path d="M6 30 H24" fill="none" ${OL_THIN} opacity=".5"/>`;

export const doggyParts = (): PartDef[] => [
  {
    id: 'body', parent: null, w: 130, h: 80, pivot: [62, 58], attach: [0, -DOG_LEG], order: 5,
    svg:
      `<path d="M14 40 Q14 16 40 16 H88 Q116 16 116 42 Q116 66 90 66 H40 Q14 66 14 40Z" fill="${FUR}" ${OL}/>` +
      `<path d="M22 54 Q40 64 64 64 H90 Q108 64 113 50 Q100 58 84 58 H44 Q30 58 22 54Z" fill="${FUR_SHADE}"/>` +
      `<path d="M30 18 Q50 12 62 24 Q56 40 38 38 Q26 32 30 18Z" fill="${PATCH}" ${OL_THIN}/>` +
      // scruff
      `<path d="M14 36 l-7 -3 l6 8 l-7 2 l8 5" fill="${FUR}" ${OL}/>`,
  },
  {
    id: 'tail', parent: 'body', w: 40, h: 60, pivot: [26, 50], attach: [20, 30], order: 1,
    svg: `<path d="M20 52 Q4 30 14 8 Q20 2 26 8 Q22 28 34 46 Z" fill="${FUR}" ${OL}/><path d="M14 8 Q20 2 26 8 Q24 16 25 22 Q16 20 13 14Z" fill="${PATCH}"/>`,
  },
  { id: 'legBL', parent: null, w: 30, h: 42, pivot: [15, 6], attach: [-30, -DOG_LEG], order: 2, svg: dogLeg(true) },
  { id: 'legFL', parent: null, w: 30, h: 42, pivot: [15, 6], attach: [30, -DOG_LEG], order: 2, svg: dogLeg(true) },
  { id: 'legBR', parent: null, w: 30, h: 42, pivot: [15, 6], attach: [-40, -DOG_LEG], order: 6, svg: dogLeg(false) },
  { id: 'legFR', parent: null, w: 30, h: 42, pivot: [15, 6], attach: [20, -DOG_LEG], order: 6, svg: dogLeg(false) },
  {
    id: 'head', parent: 'body', w: 130, h: 120, pivot: [44, 86], attach: [100, 34], order: 8,
    svg:
      `<path d="M22 62 C22 36 40 24 62 24 C84 24 98 36 98 58 C98 66 110 66 116 72 Q120 84 108 90 C96 96 72 98 54 96 C34 94 22 82 22 62Z" fill="${FUR}" ${OL}/>` +
      `<path d="M28 74 C36 90 54 94 72 94 C90 94 104 92 112 84 C100 88 84 88 70 86 C52 86 36 84 28 74Z" fill="${FUR_SHADE}"/>` +
      `<path d="M46 26 Q70 22 78 44 Q68 60 52 54 Q40 44 46 26Z" fill="${PATCH}"/>` +
      `<ellipse cx="66" cy="54" rx="8" ry="10" fill="${PAL.white}" ${OL_THIN}/><ellipse cx="88" cy="54" rx="7" ry="9" fill="${PAL.white}" ${OL_THIN}/>` +
      `<circle cx="68.5" cy="56" r="4.6" fill="${INK}"/><circle cx="90" cy="56" r="4.2" fill="${INK}"/>` +
      `<circle cx="70" cy="54" r="1.5" fill="${PAL.white}"/><circle cx="91.5" cy="54" r="1.4" fill="${PAL.white}"/>` +
      `<ellipse cx="113" cy="71" rx="8" ry="6.5" fill="${INK}"/>` +
      `<path d="M112 80 Q100 92 84 86" fill="none" ${OL_THIN}/>` +
      `<path d="M92 88 q4 12 12 4 l-2 -8" fill="${PAL.magenta}" ${OL_THIN}/>` +
      // bandana at the neck
      `<path d="M24 78 Q40 96 62 96 L52 112 L42 98 L30 104 Z" fill="${PAL.red}" ${OL}/>`,
  },
  {
    id: 'ear', parent: 'head', w: 60, h: 80, pivot: [38, 16], attach: [42, 34], order: 9,
    svg: `<path d="M30 8 Q50 6 50 24 Q46 50 26 70 Q8 60 12 36 Q16 12 30 8Z" fill="${PATCH}" ${OL}/><path d="M22 34 Q20 50 28 62" fill="none" stroke="#7d4a28" stroke-width="4" stroke-linecap="round"/>`,
  },
];
