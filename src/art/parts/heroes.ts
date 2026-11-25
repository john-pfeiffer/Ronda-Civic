// Cannon, Lieu and Jordan. Caricatured from the band photo: a few loud traits each.
import { INK, OL, OL_THIN, PAL } from '../palette';
import { arm, blob, chain, head, humanParts, leg, torso, type Held } from './human';
import type { PartDef } from '../rig';

// ------------------------------------------------------------------ CANNON
// Shaggy ginger mop, freckles, navy tee with a white hammer print, gold chain, forearm tattoos.

const cannonHead = head({
  skin: PAL.skinPale,
  shade: PAL.skinPaleShade,
  eyes: 'wide',
  behind:
    // mullet strands down the back of the neck
    `<path d="M46 60 L30 84 L36 100 L24 122 L36 132 L30 154 L46 146 L50 162 L62 144 L66 110 Z" fill="${PAL.gingerShade}" ${OL}/>`,
  cheeks:
    [[70, 110], [76, 117], [64, 118], [128, 113], [134, 119], [122, 119]]
      .map(([x, y]) => `<circle cx="${x}" cy="${y}" r="2.2" fill="${PAL.gingerShade}" opacity=".75"/>`)
      .join(''),
  brows:
    `<path d="M80 71 L106 80" stroke="${PAL.gingerShade}" stroke-width="7" stroke-linecap="round"/>` +
    `<path d="M114 80 L136 72" stroke="${PAL.gingerShade}" stroke-width="7" stroke-linecap="round"/>`,
  mouth:
    // wide open yell-grin
    `<path d="M92 119 Q110 114 130 118 Q129 137 111 138 Q95 137 92 119Z" fill="#7a2434" ${OL_THIN}/>` +
    `<path d="M95 120 Q110 116.5 127.5 119.5 L127 124.5 Q110 122 96 125 Z" fill="${PAL.white}"/>` +
    `<path d="M101 134 Q111 128 122 133 Q117 137 111 137 Q105 137 101 134Z" fill="#e8707e"/>`,
  front:
    // the shag: spiky crown plus a fringe hanging into the eyes
    `<path d="M36 96 L26 74 L38 60 L32 42 L52 42 L56 22 L74 32 L88 14 L102 30 L120 18 L126 36 L146 36 L142 54 L156 68 L146 84 L140 68 L134 86 L124 66 L116 84 L106 64 L96 82 L86 62 L76 86 L66 66 L58 96 L50 80 L46 106 Z" fill="${PAL.ginger}" ${OL}/>` +
    `<path d="M40 62 L36 46 L52 46 L57 28 L72 37 L60 48 L52 62 L46 60 Z" fill="${PAL.gingerShade}" opacity=".8"/>` +
    `<path d="M92 26 L98 44 M118 30 L116 48 M70 44 L74 58" fill="none" stroke="${PAL.gingerShade}" stroke-width="3.5" stroke-linecap="round"/>`,
});

const hammerPrint =
  `<path d="M34 44 Q50 33 67 43" fill="none" stroke="${PAL.white}" stroke-width="3.2" stroke-dasharray="3.5 3" stroke-linecap="round"/>` +
  `<path d="M33 54 h11 v15 h-11 z M44 58.5 h25 v6 h-25 z" fill="${PAL.white}"/>` +
  `<path d="M38 77 H64" fill="none" stroke="${PAL.white}" stroke-width="2.6" stroke-dasharray="4 3" stroke-linecap="round"/>`;

const cannonTattoo =
  `<path d="M13 37 q7 3 1 8 q-5 5 4 8" fill="none" stroke="#4d5a7c" stroke-width="2.6" stroke-linecap="round"/>` +
  `<circle cx="22" cy="40" r="2.4" fill="#4d5a7c"/>`;

/** Electric guitar swung by the neck. Grip is on the neck, the body is the business end. */
const guitar: Held = {
  w: 80,
  h: 176,
  pivot: [40, 34],
  svg:
    `<path d="M32 3 H50 L53 22 H29 Z" fill="${PAL.cream}" ${OL}/>` +
    `<circle cx="34" cy="9" r="2.2" fill="${INK}"/><circle cx="47" cy="9" r="2.2" fill="${INK}"/><circle cx="34" cy="16" r="2.2" fill="${INK}"/><circle cx="47" cy="16" r="2.2" fill="${INK}"/>` +
    `<path d="M35 20 H46 V98 H35 Z" fill="${PAL.woodShade}" ${OL}/>` +
    `<path d="M35 44 H46 M35 56 H46 M35 68 H46 M35 80 H46" stroke="${PAL.cream}" stroke-width="1.8" fill="none"/>` +
    `<path d="M40 88 C56 80 74 90 70 110 C68 120 76 130 74 146 C72 164 54 172 40 170 C24 172 8 164 6 146 C4 132 14 124 12 112 C8 92 24 82 40 88Z" fill="${PAL.red}" ${OL}/>` +
    `<path d="M62 100 C66 110 60 120 68 132 C70 142 68 156 56 164 C64 150 58 136 56 124 C54 112 58 104 62 100Z" fill="${PAL.redShade}"/>` +
    `<path d="M22 118 C30 108 44 112 50 122 C54 132 50 150 38 154 C26 156 18 144 18 132 Z" fill="${PAL.white}" ${OL_THIN}/>` +
    `<rect x="30" y="118" width="20" height="7" rx="2" fill="${INK}"/><rect x="30" y="134" width="20" height="7" rx="2" fill="${INK}"/>` +
    `<circle cx="58" cy="150" r="3.2" fill="${PAL.gold}" ${OL_THIN}/><circle cx="50" cy="158" r="3.2" fill="${PAL.gold}" ${OL_THIN}/>` +
    `<path d="M38 22 V150 M43 22 V150" stroke="${PAL.silver}" stroke-width="1" fill="none" opacity=".9"/>`,
};

export const cannonParts = (): PartDef[] =>
  humanParts({
    head: cannonHead,
    torso: torso(PAL.navy, PAL.navyShade, PAL.skinPale, hammerPrint, chain(PAL.gold, 9)),
    armF: arm(PAL.skinPale, PAL.skinPaleShade, { fill: PAL.navy, shade: PAL.navyShade }, cannonTattoo),
    armB: arm(PAL.skinPaleShade, PAL.skinPaleShade, { fill: PAL.navyShade, shade: PAL.navyShade }),
    legF: leg(PAL.jeans, PAL.jeansShade, PAL.white, PAL.red),
    legB: leg(PAL.jeansShade, PAL.jeansShade, PAL.paper, PAL.redShade),
    weapon: guitar,
  });

// -------------------------------------------------------------------- LIEU
// Big black curls, thick moustache, heavy-lidded stare, green tee with a yellow print, silver chain.

const CURL = '#463a52';
const lieuHead = head({
  skin: PAL.skinTan,
  shade: PAL.skinTanShade,
  eyes: 'lidded',
  behind: blob([[44, 84, 22], [38, 108, 16], [56, 60, 22]], PAL.blackShade),
  brows:
    `<path d="M79 76 Q93 70 107 77" fill="none" stroke="${PAL.black}" stroke-width="8" stroke-linecap="round"/>` +
    `<path d="M113 77 Q124 70 136 75" fill="none" stroke="${PAL.black}" stroke-width="8" stroke-linecap="round"/>`,
  mouth: `<path d="M104 130 q9 4 17 -1" fill="none" ${OL_THIN}/>`,
  front:
    `<path d="M90 121 Q94 108 111 111 Q128 107 136 119 Q138 124 135 127 Q124 118 112 121 Q100 118 91 128 Q88 125 90 121Z" fill="${PAL.black}" ${OL_THIN}/>` +
    blob(
      [[50, 70, 20], [64, 48, 22], [88, 38, 24], [114, 38, 23], [136, 52, 20], [146, 74, 14], [76, 62, 18], [102, 58, 18], [124, 64, 15], [42, 92, 14]],
      PAL.black,
    ) +
    // curl highlights
    [[58, 50, 8], [86, 34, 9], [114, 34, 8], [136, 52, 7], [78, 60, 6], [104, 56, 6], [48, 76, 7]]
      .map(([x, y, r]) => `<path d="M${x - r} ${y} a${r} ${r} 0 0 1 ${r * 1.7} ${-r * 0.5}" fill="none" stroke="${CURL}" stroke-width="3.2" stroke-linecap="round"/>`)
      .join(''),
});

const lieuPrint =
  `<path d="M33 42 l5 7 l5 -7 l5 7 l5 -7 l5 7 l5 -7 l4 6" fill="none" stroke="${PAL.yellow}" stroke-width="3.4" stroke-linejoin="round" stroke-linecap="round"/>` +
  `<path d="M38 60 q-3 -8 4 -7 l4 4 l8 0 l4 -4 q7 -1 4 7 q3 10 -6 14 l-6 3 l-6 -3 q-9 -4 -6 -14z" fill="${PAL.paper}"/>` +
  `<circle cx="45" cy="64" r="2" fill="${PAL.green}"/><circle cx="57" cy="64" r="2" fill="${PAL.green}"/><path d="M48 72 h6 l-3 3z" fill="${PAL.green}"/>`;

/** Bass guitar: longer and heavier than Cannon's guitar. */
const bass: Held = {
  w: 90,
  h: 214,
  pivot: [45, 40],
  svg:
    `<path d="M36 3 H56 L60 28 H32 Z" fill="${PAL.woodShade}" ${OL}/>` +
    `<circle cx="29" cy="10" r="4" fill="${PAL.silver}" ${OL_THIN}/><circle cx="29" cy="22" r="4" fill="${PAL.silver}" ${OL_THIN}/><circle cx="62" cy="10" r="4" fill="${PAL.silver}" ${OL_THIN}/><circle cx="63" cy="22" r="4" fill="${PAL.silver}" ${OL_THIN}/>` +
    `<path d="M39 26 H52 V120 H39 Z" fill="${PAL.wood}" ${OL}/>` +
    `<path d="M39 48 H52 M39 64 H52 M39 80 H52 M39 96 H52" stroke="${PAL.woodShade}" stroke-width="2" fill="none"/>` +
    `<path d="M45 108 C66 98 84 110 80 134 C78 146 86 156 84 176 C82 198 62 208 45 206 C28 208 8 198 6 176 C4 158 14 148 12 134 C8 110 26 100 45 108Z" fill="${PAL.teal}" ${OL}/>` +
    `<path d="M72 122 C76 134 70 146 78 160 C80 174 78 190 64 200 C72 184 66 168 64 154 C62 140 66 130 72 122Z" fill="${PAL.tealShade}"/>` +
    `<path d="M24 140 C34 128 52 132 58 146 C62 160 58 184 42 188 C28 190 20 174 20 158 Z" fill="${INK}"/>` +
    `<rect x="32" y="146" width="26" height="9" rx="2" fill="${PAL.silver}" ${OL_THIN}/><rect x="32" y="166" width="26" height="9" rx="2" fill="${PAL.silver}" ${OL_THIN}/>` +
    `<circle cx="68" cy="184" r="3.6" fill="${PAL.silver}" ${OL_THIN}/><circle cx="59" cy="194" r="3.6" fill="${PAL.silver}" ${OL_THIN}/>` +
    `<path d="M42 28 V180 M45.5 28 V180 M49 28 V180" stroke="${PAL.paper}" stroke-width="1.3" fill="none" opacity=".9"/>`,
};

export const lieuParts = (): PartDef[] =>
  humanParts({
    head: lieuHead,
    torso: torso(PAL.green, PAL.greenShade, PAL.skinTan, lieuPrint, chain(PAL.silver, 14)),
    armF: arm(PAL.skinTan, PAL.skinTanShade, { fill: PAL.green, shade: PAL.greenShade }),
    armB: arm(PAL.skinTanShade, PAL.skinTanShade, { fill: PAL.greenShade, shade: PAL.greenShade }),
    legF: leg(PAL.khaki, PAL.khakiShade, PAL.black, PAL.paper, 3),
    legB: leg(PAL.khakiShade, PAL.khakiShade, PAL.blackShade, PAL.creamShade, 3),
    weapon: bass,
  });

// ------------------------------------------------------------------ JORDAN
// Round wire glasses, short hair, goatee, brown sleeveless knit vest, thin chain, a stick in each hand.

const jordanHead = head({
  skin: PAL.skinDeep,
  shade: PAL.skinDeepShade,
  eyes: 'sharp',
  brows:
    `<path d="M80 70 L106 76" stroke="${PAL.blackShade}" stroke-width="6.5" stroke-linecap="round"/>` +
    `<path d="M114 76 L135 70" stroke="${PAL.blackShade}" stroke-width="6.5" stroke-linecap="round"/>`,
  mouth: `<path d="M102 127 h17" fill="none" ${OL_THIN}/>`,
  front:
    // short hair, slightly squared on top
    `<path d="M38 96 C32 56 56 30 92 30 C124 30 144 46 144 78 C138 62 126 56 110 55 L72 57 C58 60 50 70 48 90 L46 100 Z" fill="${PAL.black}" ${OL}/>` +
    `<path d="M48 62 C58 44 76 36 96 36" fill="none" stroke="#463a52" stroke-width="3.5" stroke-linecap="round"/>` +
    // moustache and goatee
    `<path d="M96 119 Q110 112 126 119" fill="none" stroke="${PAL.blackShade}" stroke-width="5.5" stroke-linecap="round"/>` +
    `<path d="M95 133 Q110 127 125 133 Q128 147 110 152 Q93 148 95 133Z" fill="${PAL.blackShade}" ${OL_THIN}/>` +
    // round wire glasses
    `<path d="M77 92 L46 96" fill="none" stroke="${INK}" stroke-width="3.5" stroke-linecap="round"/>` +
    `<circle cx="94" cy="93" r="18" fill="#ffffff" fill-opacity=".16" stroke="${INK}" stroke-width="6.5"/>` +
    `<circle cx="126" cy="92" r="15.5" fill="#ffffff" fill-opacity=".16" stroke="${INK}" stroke-width="6.5"/>` +
    `<circle cx="94" cy="93" r="18" fill="none" stroke="${PAL.gold}" stroke-width="2.6"/>` +
    `<circle cx="126" cy="92" r="15.5" fill="none" stroke="${PAL.gold}" stroke-width="2.6"/>` +
    `<path d="M111 90 q2 -3 3 0" fill="none" stroke="${PAL.gold}" stroke-width="2.6" stroke-linecap="round"/>` +
    `<path d="M84 84 l6 -5 M118 84 l5 -4" stroke="#ffffff" stroke-width="2.4" stroke-linecap="round" opacity=".7"/>` +
    `<circle cx="42" cy="108" r="2.6" fill="${PAL.silver}" ${OL_THIN}/>`,
});

const knit =
  // V-neck showing chest, then ribbed knit lines
  `<path d="M40 15.5 L51 40 L62 15.5 Z" fill="${PAL.skinDeep}" ${OL}/>` +
  [30, 38, 46, 56, 64].map((x) => `<path d="M${x} ${x > 40 && x < 62 ? 46 : 24} V88" fill="none" stroke="${PAL.knitShade}" stroke-width="2.4" stroke-linecap="round"/>`).join('') +
  `<path d="M22 80 H78" fill="none" stroke="${PAL.knitShade}" stroke-width="3"/>`;

const stick: Held = {
  w: 20,
  h: 100,
  pivot: [10, 16],
  svg:
    `<path d="M6 4 Q10 1 14 4 L13 84 Q16 90 13 95 Q10 98 7 95 Q4 90 7 84 Z" fill="${PAL.cream}" ${OL}/>` +
    `<path d="M11.5 8 L11 84" stroke="${PAL.creamShade}" stroke-width="2.5" fill="none"/>`,
};

export const jordanParts = (): PartDef[] =>
  humanParts({
    head: jordanHead,
    torso: torso(PAL.knit, PAL.knitShade, PAL.skinDeep, knit, chain(PAL.silver, 7)),
    armF: arm(PAL.skinDeep, PAL.skinDeepShade),
    armB: arm(PAL.skinDeepShade, PAL.skinDeepShade),
    legF: leg(PAL.jeans, PAL.jeansShade, PAL.woodShade, PAL.cream),
    legB: leg(PAL.jeansShade, PAL.jeansShade, '#6f4829', PAL.creamShade),
    weapon: stick,
    weaponB: stick,
  });
