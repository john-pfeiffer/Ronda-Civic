// One shared palette so every character, prop and backdrop reads as the same world.
export const INK = '#1d1626'; // outline colour (warm near-black, never pure black)
export const OUTLINE = 5; // outline width in rig units

export const PAL = {
  ink: INK,
  white: '#fff8ec',
  paper: '#f3e7cf',
  // skin tones
  skinPale: '#f8d6bd',
  skinPaleShade: '#e4b092',
  skinTan: '#c98d62',
  skinTanShade: '#a66c47',
  skinDeep: '#77492c',
  skinDeepShade: '#5a341f',
  // hair
  ginger: '#f0893a',
  gingerShade: '#c9641f',
  black: '#2a2230',
  blackShade: '#18121d',
  // clothes
  navy: '#2b3a67',
  navyShade: '#1e2848',
  green: '#2f6644',
  greenShade: '#214a31',
  knit: '#7a543b',
  knitShade: '#5c3d2a',
  denim: '#4b6ea8',
  denimShade: '#35517f',
  jeans: '#30303c',
  jeansShade: '#20202a',
  khaki: '#8a8468',
  khakiShade: '#69644d',
  gold: '#f6c445',
  goldShade: '#c9932a',
  silver: '#cfd6dc',
  // pigs
  pig: '#f29bb0',
  pigShade: '#d4728d',
  pigDark: '#c75f7d',
  pigDarkShade: '#a04663',
  hog: '#b9525f',
  hogShade: '#8f3a48',
  snout: '#f7b9c7',
  // accents
  red: '#e2463f',
  redShade: '#b02f2f',
  orange: '#f58a3c',
  yellow: '#ffd84a',
  teal: '#35c2b4',
  tealShade: '#23958a',
  magenta: '#e2478f',
  magentaShade: '#b43070',
  purple: '#6b4ba3',
  wood: '#b98452',
  woodShade: '#8f5f37',
  cream: '#f1e3c0',
  creamShade: '#d3bf92',
  // world
  dusk1: '#2a1b4a',
  dusk2: '#6a2d6b',
  dusk3: '#d9566a',
  dusk4: '#ffa259',
  brick: '#7b3f4a',
  brickShade: '#5d2d3a',
  brickDark: '#3f2233',
  asphalt: '#3a3148',
  asphaltLight: '#4a4059',
  pavement: '#6d6480',
  pavementLight: '#807694',
} as const;

/** Outline attributes shared by every drawn shape. */
export const OL = `stroke="${INK}" stroke-width="${OUTLINE}" stroke-linejoin="round" stroke-linecap="round"`;
/** Thinner inner line for details (mouths, creases, prints). */
export const OL_THIN = `stroke="${INK}" stroke-width="3" stroke-linejoin="round" stroke-linecap="round"`;
