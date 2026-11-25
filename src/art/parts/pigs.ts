// Pigmen (three variants off one construction) and Big Boy, the hog king.
import { INK, OL, OL_THIN, PAL } from '../palette';
import { humanParts, type Held, type Layout } from './human';
import type { PartDef } from '../rig';

export const PIG: Layout = {
  legLen: 42,
  torso: { w: 124, h: 116, pivot: [62, 104], lift: 10 },
  head: { w: 196, h: 176, pivot: [88, 150], attach: [62, 26] },
  arm: { w: 48, h: 86, pivot: [24, 15], hand: [24, 66], attachF: [42, 44], attachB: [84, 42] },
  leg: { w: 64, h: 60, pivot: [26, 9], xF: -14, xB: 14 },
};

interface PigLook {
  skin: string;
  shade: string;
  vest: string;
  vestShade: string;
  hat?: string;
  eyeGlow?: boolean;
}

function pigHead(k: PigLook): string {
  return (
    // ears
    `<path d="M58 60 L38 18 L84 40 Z" fill="${k.shade}" ${OL}/>` +
    `<path d="M92 46 L106 8 L130 44 Z" fill="${k.skin}" ${OL}/>` +
    `<path d="M100 40 L107 22 L120 40 Z" fill="${k.shade}"/>` +
    // skull
    `<path d="M34 96 C34 58 60 40 92 40 C126 40 148 60 148 96 C148 130 126 152 92 152 C58 152 34 132 34 96Z" fill="${k.skin}" ${OL}/>` +
    `<path d="M40 116 C48 138 68 149.5 92 149.5 C116 149.5 136 138 144 116 C134 130 116 140 92 140 C70 140 52 132 40 116Z" fill="${k.shade}" opacity=".85"/>` +
    // tiny mean eyes under a heavy brow
    `<ellipse cx="92" cy="86" rx="9" ry="10" fill="${k.eyeGlow ? PAL.yellow : PAL.white}" ${OL_THIN}/>` +
    `<ellipse cx="118" cy="84" rx="8" ry="9" fill="${k.eyeGlow ? PAL.yellow : PAL.white}" ${OL_THIN}/>` +
    `<circle cx="95" cy="88" r="4.2" fill="${INK}"/><circle cx="120.5" cy="86" r="3.8" fill="${INK}"/>` +
    `<path d="M76 68 L104 80" stroke="${INK}" stroke-width="8" stroke-linecap="round"/>` +
    `<path d="M110 80 L132 68" stroke="${INK}" stroke-width="8" stroke-linecap="round"/>` +
    // mouth and tusks sit under the snout
    `<path d="M104 134 Q124 126 146 134" fill="none" ${OL}/>` +
    `<path d="M108 133 l4 -13 l6 11 z M134 131 l5 -13 l5 12 z" fill="${PAL.white}" ${OL_THIN}/>` +
    // snout
    `<ellipse cx="140" cy="108" rx="27" ry="21" fill="${PAL.snout}" ${OL}/>` +
    `<ellipse cx="133" cy="108" rx="4.5" ry="7" fill="${k.shade}" ${OL_THIN}/><ellipse cx="149" cy="107" rx="4.5" ry="7" fill="${k.shade}" ${OL_THIN}/>` +
    (k.hat ?? '')
  );
}

function pigTorso(k: PigLook, extra = ''): string {
  return (
    `<path d="M24 44 Q24 16 54 14 H72 Q102 16 102 46 L106 88 Q106 110 80 110 H42 Q16 110 20 88 Z" fill="${k.vest}" ${OL}/>` +
    `<path d="M88 22 Q100 28 100 46 L103.5 88 Q103 104 88 107 Q94 70 88 22Z" fill="${k.vestShade}"/>` +
    // open vest showing the belly
    `<path d="M50 16 Q40 60 44 108 H82 Q90 62 76 16 Z" fill="${k.skin}" ${OL}/>` +
    `<path d="M70 20 Q82 62 78 105 H82 Q89 62 76 18 Z" fill="${k.shade}" opacity=".8"/>` +
    `<path d="M58 84 q5 4 10 0" fill="none" ${OL_THIN}/>` +
    `<path d="M26 60 h14 M26 68 h10" stroke="${k.vestShade}" stroke-width="3" stroke-linecap="round"/>` +
    extra
  );
}

const pigArm = (k: PigLook, back = false) =>
  `<path d="M9 17 Q9 4 24 4 Q39 4 39 17 V58 H9 Z" fill="${back ? k.shade : k.skin}" ${OL}/>` +
  (back ? '' : `<path d="M30 14 V56 H36 V16 Z" fill="${k.shade}" opacity=".7"/>`) +
  `<circle cx="24" cy="66" r="15" fill="${back ? PAL.pigDarkShade : PAL.pigDark}" ${OL}/>` +
  `<path d="M24 62 V80" fill="none" ${OL_THIN}/>`;

const pigLeg = (back = false) =>
  `<path d="M11 8 Q11 4 15 4 H41 Q45 4 45 8 V36 H11 Z" fill="${back ? PAL.jeansShade : PAL.jeans}" ${OL}/>` +
  `<path d="M7 34 H45 Q58 36 58 47 V52 H7 Z" fill="${back ? '#3b2a26' : '#58403a'}" ${OL}/>` +
  `<path d="M7 46 H58" stroke="${INK}" stroke-width="3" fill="none"/>`;

const club: Held = {
  w: 60,
  h: 150,
  pivot: [30, 24],
  svg:
    `<path d="M24 6 Q30 2 36 6 L42 104 Q48 132 30 142 Q12 132 18 104 Z" fill="${PAL.wood}" ${OL}/>` +
    `<path d="M36 40 L40 104 Q44 126 32 138 Q40 120 34 100 Z" fill="${PAL.woodShade}"/>` +
    `<path d="M22 20 H38 M21 30 H39" stroke="${INK}" stroke-width="3" fill="none"/>` +
    // nails
    `<path d="M17 96 L4 90 M17 116 L3 118 M43 92 L56 86 M43 114 L57 118 M30 138 L30 149" stroke="${PAL.silver}" stroke-width="5" stroke-linecap="round"/>` +
    `<path d="M17 96 L4 90 M17 116 L3 118 M43 92 L56 86 M43 114 L57 118" stroke="${INK}" stroke-width="1.6" stroke-linecap="round" fill="none" opacity=".5"/>`,
};

/** The thrower's ammo: a can of slop. Also used as the projectile sprite. */
export const SLOP_CAN =
  `<path d="M8 14 H40 V54 Q24 60 8 54 Z" fill="${PAL.silver}" ${OL}/>` +
  `<path d="M8 22 H40 V44 H8 Z" fill="${PAL.red}" ${OL_THIN}/>` +
  `<ellipse cx="24" cy="14" rx="16" ry="6" fill="#8fd16a" ${OL}/>` +
  `<path d="M14 8 q4 -8 8 0 q4 -6 8 1" fill="none" stroke="#8fd16a" stroke-width="4" stroke-linecap="round"/>` +
  `<path d="M32 24 V42" stroke="${PAL.redShade}" stroke-width="5"/>`;
const can: Held = { w: 48, h: 64, pivot: [24, 40], svg: SLOP_CAN };

const mohawk =
  `<path d="M52 50 L50 26 L64 38 L70 14 L82 34 L94 10 L102 34 L116 18 L116 46 Z" fill="${PAL.purple}" ${OL}/>`;
const bandana =
  `<path d="M36 78 C40 50 64 38 94 38 C124 38 144 54 147 74 C110 62 74 62 36 78Z" fill="${PAL.red}" ${OL}/>` +
  `<path d="M38 74 L14 66 L26 82 L10 92 L40 88 Z" fill="${PAL.redShade}" ${OL}/>` +
  `<circle cx="72" cy="54" r="3" fill="${PAL.white}"/><circle cx="100" cy="48" r="3" fill="${PAL.white}"/><circle cx="124" cy="56" r="3" fill="${PAL.white}"/>`;

function pig(k: PigLook, weapon?: Held, torsoExtra = ''): PartDef[] {
  return humanParts(
    { head: pigHead(k), torso: pigTorso(k, torsoExtra), armF: pigArm(k), armB: pigArm(k, true), legF: pigLeg(), legB: pigLeg(true), weapon },
    PIG,
  );
}

export const pigmanParts = () => pig({ skin: PAL.pig, shade: PAL.pigShade, vest: PAL.denim, vestShade: PAL.denimShade });
export const pigClubParts = () =>
  pig(
    { skin: PAL.pigDark, shade: PAL.pigDarkShade, vest: '#3a3340', vestShade: '#26202c', hat: mohawk },
    club,
    `<path d="M28 34 l5 -9 l5 9 z M92 34 l4 -9 l5 9 z" fill="${PAL.silver}" ${OL_THIN}/>`,
  );
export const pigThrowerParts = () => pig({ skin: '#f6b08c', shade: '#d98a68', vest: '#5d7a3a', vestShade: '#435a28', hat: bandana }, can);

// ------------------------------------------------------------------ BIG BOY

export const BIGBOY: Layout = {
  legLen: 46,
  torso: { w: 230, h: 210, pivot: [112, 192], lift: 14 },
  head: { w: 230, h: 210, pivot: [104, 178], attach: [122, 46] },
  arm: { w: 84, h: 150, pivot: [42, 26], hand: [42, 116], attachF: [58, 78], attachB: [172, 74] },
  leg: { w: 96, h: 70, pivot: [40, 10], xF: -34, xB: 34 },
};

const bbSkin = PAL.hog;
const bbShade = PAL.hogShade;

const bigBoyHead =
  // ears
  `<path d="M60 76 L28 30 L96 52 Z" fill="${bbShade}" ${OL}/>` +
  `<path d="M112 58 L132 12 L160 56 Z" fill="${bbSkin}" ${OL}/>` +
  `<path d="M122 50 L132 28 L148 50 Z" fill="${bbShade}"/>` +
  // skull with heavy jowls
  `<path d="M34 112 C34 68 64 46 106 46 C150 46 178 70 178 112 C178 156 150 182 106 182 C62 182 34 156 34 112Z" fill="${bbSkin}" ${OL}/>` +
  `<path d="M42 138 C52 166 78 179 106 179 C136 179 162 166 172 138 C158 156 136 166 106 166 C80 166 58 158 42 138Z" fill="${bbShade}" opacity=".9"/>` +
  // scar over the near eye
  `<path d="M92 70 L112 122" stroke="${bbShade}" stroke-width="6" stroke-linecap="round"/>` +
  `<path d="M94 84 l12 -4 M98 98 l12 -4 M102 110 l11 -4" stroke="${bbShade}" stroke-width="4" stroke-linecap="round"/>` +
  `<ellipse cx="106" cy="100" rx="11" ry="11" fill="${PAL.yellow}" ${OL_THIN}/>` +
  `<ellipse cx="138" cy="98" rx="10" ry="10" fill="${PAL.yellow}" ${OL_THIN}/>` +
  `<circle cx="109" cy="102" r="4.6" fill="${INK}"/><circle cx="141" cy="100" r="4.2" fill="${INK}"/>` +
  `<path d="M86 78 L120 94" stroke="${INK}" stroke-width="10" stroke-linecap="round"/>` +
  `<path d="M128 94 L156 80" stroke="${INK}" stroke-width="10" stroke-linecap="round"/>` +
  // underbite and tusks
  `<path d="M120 160 Q146 148 174 160" fill="none" ${OL}/>` +
  `<path d="M124 160 l5 -24 l10 20 z M158 157 l7 -24 l8 22 z" fill="${PAL.white}" ${OL_THIN}/>` +
  // snout with a gold ring
  `<ellipse cx="166" cy="128" rx="34" ry="26" fill="${PAL.snout}" ${OL}/>` +
  `<ellipse cx="157" cy="128" rx="5.5" ry="9" fill="${bbShade}" ${OL_THIN}/><ellipse cx="177" cy="127" rx="5.5" ry="9" fill="${bbShade}" ${OL_THIN}/>` +
  `<path d="M158 146 a11 11 0 1 0 18 0" fill="none" stroke="${INK}" stroke-width="8" stroke-linecap="round"/>` +
  `<path d="M158 146 a11 11 0 1 0 18 0" fill="none" stroke="${PAL.gold}" stroke-width="4" stroke-linecap="round"/>` +
  // tiny tilted crown
  `<g transform="rotate(-14 96 40)"><path d="M70 50 L66 20 L80 34 L92 12 L104 34 L118 20 L114 50 Z" fill="${PAL.gold}" ${OL}/>` +
  `<path d="M70 50 H114 V42 H69 Z" fill="${PAL.goldShade}"/><circle cx="92" cy="30" r="4" fill="${PAL.red}" ${OL_THIN}/></g>`;

const bigBoyTorso =
  `<path d="M40 84 Q40 30 100 26 H130 Q192 30 192 88 L204 160 Q206 200 150 200 H76 Q20 200 24 160 Z" fill="${bbSkin}" ${OL}/>` +
  `<path d="M166 44 Q190 56 190 88 L201 160 Q202 190 168 197 Q186 130 166 44Z" fill="${bbShade}"/>` +
  // wrestling singlet
  `<path d="M70 28 Q84 96 62 120 Q40 150 34 198 L190 198 Q194 150 160 120 Q138 96 150 28 L132 27 Q124 76 110 78 Q96 76 90 27 Z" fill="${PAL.purple}" ${OL}/>` +
  `<path d="M160 122 Q190 150 187 196 L172 196 Q176 156 150 126 Z" fill="#4f3580"/>` +
  `<path d="M30 168 H196" stroke="${PAL.gold}" stroke-width="12"/><path d="M30 162 H196 M30 174 H196" stroke="${INK}" stroke-width="3" fill="none"/>` +
  `<rect x="94" y="154" width="38" height="28" rx="5" fill="${PAL.gold}" ${OL}/>` +
  `<text x="113" y="176" text-anchor="middle" font-family="Bangers, Impact, sans-serif" font-size="24" fill="${INK}">BB</text>` +
  `<path d="M96 128 q14 10 28 0" fill="none" ${OL_THIN}/>`;

const bigBoyArm = (back = false) =>
  `<path d="M12 30 Q12 6 42 6 Q72 6 72 30 V100 H12 Z" fill="${back ? bbShade : bbSkin}" ${OL}/>` +
  (back ? '' : `<path d="M56 24 V98 H68 V28 Z" fill="${bbShade}" opacity=".8"/>`) +
  // spiked wristband and fist
  `<path d="M8 90 H76 V106 H8 Z" fill="${INK}"/><path d="M14 90 l6 -12 l6 12 z M36 90 l6 -12 l6 12 z M58 90 l6 -12 l6 12 z" fill="${PAL.silver}" ${OL_THIN}/>` +
  `<circle cx="42" cy="120" r="26" fill="${back ? '#7d3340' : '#a04552'}" ${OL}/>` +
  `<path d="M42 112 V144 M28 118 V138 M56 118 V138" fill="none" ${OL_THIN}/>`;

const bigBoyLeg = (back = false) =>
  `<path d="M14 8 Q14 4 20 4 H62 Q68 4 68 8 V40 H14 Z" fill="${back ? '#4f3580' : PAL.purple}" ${OL}/>` +
  `<path d="M8 38 H68 Q88 40 88 54 V62 H8 Z" fill="${back ? '#2a2230' : '#3a3340'}" ${OL}/>` +
  `<path d="M8 54 H88" stroke="${PAL.gold}" stroke-width="4" fill="none"/>`;

export const bigBoyParts = (): PartDef[] =>
  humanParts(
    { head: bigBoyHead, torso: bigBoyTorso, armF: bigBoyArm(), armB: bigBoyArm(true), legF: bigBoyLeg(), legB: bigBoyLeg(true) },
    BIGBOY,
  );
