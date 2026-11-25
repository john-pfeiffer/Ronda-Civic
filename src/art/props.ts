// Stand-alone sprites: pickups, crates, platforms, effects and UI bits.
import { INK, OL, OL_THIN, PAL } from './palette';
import { SLOP_CAN } from './parts/pigs';

export interface TextOverlay {
  text: string;
  x: number;
  y: number;
  size: number;
  font?: 'Bangers' | 'Permanent Marker';
  fill: string;
  stroke?: string;
  strokeW?: number;
  rot?: number;
  align?: CanvasTextAlign;
  alpha?: number;
}

export interface TexDef {
  w: number;
  h: number;
  svg: string;
  /** Lettering drawn on top with the real web fonts (SVG images cannot load them). */
  texts?: TextOverlay[];
}

const star = (cx: number, cy: number, r1: number, r2: number, n: number) => {
  let d = '';
  for (let i = 0; i < n * 2; i++) {
    const r = i % 2 ? r2 : r1;
    const a = (Math.PI * i) / n - Math.PI / 2;
    d += `${i ? 'L' : 'M'}${(cx + Math.cos(a) * r).toFixed(1)} ${(cy + Math.sin(a) * r).toFixed(1)}`;
  }
  return d + 'Z';
};

const plank = (x: number, y: number, w: number, h: number, c: string = PAL.wood) =>
  `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="3" fill="${c}" ${OL}/>`;

export const PROPS: Record<string, TexDef> = {
  shadow: {
    w: 200,
    h: 60,
    svg: `<defs><radialGradient id="s"><stop offset=".55" stop-color="#0c0714" stop-opacity=".5"/><stop offset="1" stop-color="#0c0714" stop-opacity="0"/></radialGradient></defs><ellipse cx="100" cy="30" rx="100" ry="30" fill="url(#s)"/>`,
  },

  // The Tweaker: an effects pedal with the knob cranked all the way up.
  tweaker: {
    w: 110,
    h: 130,
    svg:
      `<path d="M14 26 Q14 12 28 12 H82 Q96 12 96 26 L102 108 Q102 122 88 122 H22 Q8 122 8 108 Z" fill="#9be23c" ${OL}/>` +
      `<path d="M84 14 Q94 16 94 26 L100 108 Q100 118 90 120 Q92 70 84 14Z" fill="#6fb022"/>` +
      `<circle cx="55" cy="46" r="20" fill="${INK}"/><circle cx="55" cy="44" r="16" fill="${PAL.silver}" ${OL_THIN}/>` +
      `<path d="M55 44 L66 32" stroke="${PAL.red}" stroke-width="5" stroke-linecap="round"/>` +
      `<path d="M30 30 a30 30 0 0 1 50 0" fill="none" stroke="${INK}" stroke-width="3" stroke-dasharray="2 6" stroke-linecap="round"/>` +
      `<rect x="26" y="88" width="58" height="22" rx="6" fill="${PAL.silver}" ${OL}/>` +
      `<circle cx="86" cy="24" r="5" fill="${PAL.red}" ${OL_THIN}/>` +
      `<path d="M20 60 l8 -12 l-2 9 l8 0 l-9 13 l2 -10 z" fill="${PAL.yellow}" ${OL_THIN}/>`,
    texts: [{ text: 'TWEAKER', x: 56, y: 82, size: 19, fill: INK, align: 'center' }],
  },

  food: {
    w: 90,
    h: 90,
    svg:
      `<path d="M10 22 Q45 4 80 22 L48 84 Q45 88 42 84 Z" fill="${PAL.yellow}" ${OL}/>` +
      `<path d="M10 22 Q45 4 80 22 L76 30 Q45 14 14 30 Z" fill="${PAL.wood}" ${OL}/>` +
      `<circle cx="36" cy="38" r="7" fill="${PAL.red}" ${OL_THIN}/><circle cx="56" cy="44" r="7" fill="${PAL.red}" ${OL_THIN}/><circle cx="45" cy="62" r="6" fill="${PAL.red}" ${OL_THIN}/>` +
      `<path d="M28 50 q3 6 0 10 M60 30 q3 4 0 8" stroke="${PAL.orange}" stroke-width="3" fill="none" stroke-linecap="round"/>`,
  },

  record: {
    w: 84,
    h: 84,
    svg:
      `<circle cx="42" cy="42" r="37" fill="${PAL.black}" ${OL}/>` +
      `<circle cx="42" cy="42" r="29" fill="none" stroke="#4a4058" stroke-width="2"/><circle cx="42" cy="42" r="23" fill="none" stroke="#4a4058" stroke-width="2"/>` +
      `<circle cx="42" cy="42" r="14" fill="${PAL.magenta}" ${OL_THIN}/><circle cx="42" cy="42" r="3" fill="${PAL.white}"/>` +
      `<path d="M18 26 A30 30 0 0 1 36 12" fill="none" stroke="${PAL.white}" stroke-width="4" stroke-linecap="round" opacity=".7"/>`,
  },

  crate: {
    w: 150,
    h: 140,
    svg:
      `<rect x="8" y="12" width="134" height="122" rx="5" fill="${PAL.wood}" ${OL}/>` +
      `<path d="M8 50 H142 M8 94 H142" stroke="${PAL.woodShade}" stroke-width="5" fill="none"/>` +
      `<path d="M112 14 H140 V132 H112 Z" fill="${PAL.woodShade}" opacity=".5"/>` +
      plank(4, 6, 142, 20, '#c99562') + plank(4, 116, 142, 20, '#c99562') +
      `<path d="M26 28 L124 114 M124 28 L26 114" stroke="${INK}" stroke-width="16" stroke-linecap="round"/>` +
      `<path d="M26 28 L124 114 M124 28 L26 114" stroke="#c99562" stroke-width="8" stroke-linecap="round"/>`,
  },
  plank: { w: 80, h: 28, svg: plank(4, 4, 72, 20) },

  can: { w: 48, h: 64, svg: SLOP_CAN },

  // Doggy's cardboard box, split so he can sit inside it.
  boxBack: {
    w: 200,
    h: 130,
    svg:
      `<path d="M30 40 L16 8 L60 20 Z M170 40 L186 8 L140 20 Z" fill="#b08d5c" ${OL}/>` +
      `<rect x="26" y="36" width="148" height="88" fill="#8f6f43" ${OL}/>`,
  },
  boxFront: {
    w: 200,
    h: 130,
    svg:
      `<path d="M22 58 H178 L172 124 H28 Z" fill="#c9a36c" ${OL}/>` +
      `<path d="M150 60 H176 L171 122 H152 Z" fill="#b08d5c"/>` +
      `<path d="M22 58 L4 84 L30 78 Z M178 58 L196 84 L170 78 Z" fill="#d9b680" ${OL}/>` +
      `<path d="M92 58 V124" stroke="${INK}" stroke-width="3" opacity=".4"/>`,
    texts: [{ text: 'FREE', x: 100, y: 108, size: 34, font: 'Permanent Marker', fill: INK, align: 'center', rot: -4 }],
  },

  cageBack: {
    w: 280,
    h: 380,
    svg:
      `<rect x="20" y="340" width="240" height="30" rx="6" fill="#3a3340" ${OL}/>` +
      [60, 110, 170, 220].map((x) => `<path d="M${x} 44 V344" stroke="${INK}" stroke-width="13"/><path d="M${x} 44 V344" stroke="#6b6478" stroke-width="6"/>`).join(''),
  },
  cageFront: {
    w: 280,
    h: 380,
    svg:
      [34, 86, 140, 194, 246].map((x) => `<path d="M${x} 44 V344" stroke="${INK}" stroke-width="15" stroke-linecap="round"/><path d="M${x} 44 V344" stroke="${PAL.silver}" stroke-width="7"/>`).join('') +
      `<path d="M20 60 Q140 -30 260 60 Z" fill="#6b6478" ${OL}/>` +
      `<rect x="16" y="52" width="248" height="22" rx="6" fill="${PAL.silver}" ${OL}/>` +
      `<rect x="16" y="330" width="248" height="22" rx="6" fill="${PAL.silver}" ${OL}/>` +
      `<circle cx="140" cy="16" r="12" fill="none" stroke="${INK}" stroke-width="12"/><circle cx="140" cy="16" r="12" fill="none" stroke="${PAL.silver}" stroke-width="5"/>` +
      `<rect x="120" y="186" width="40" height="46" rx="6" fill="${PAL.gold}" ${OL}/><circle cx="140" cy="204" r="6" fill="${INK}"/><path d="M140 204 V220" stroke="${INK}" stroke-width="5"/>`,
  },

  spark: {
    w: 140,
    h: 140,
    svg: `<path d="${star(70, 70, 66, 26, 7)}" fill="${PAL.yellow}" ${OL}/><path d="${star(70, 70, 40, 16, 7)}" fill="${PAL.white}"/>`,
  },
  puff: {
    w: 110,
    h: 80,
    svg: `<path d="M20 60 Q4 56 10 42 Q8 26 28 28 Q34 10 54 18 Q74 8 82 28 Q102 28 98 46 Q106 60 88 62 Q70 74 54 64 Q36 74 20 60Z" fill="${PAL.paper}" ${OL} opacity=".92"/>`,
  },
  ring: {
    w: 512,
    h: 180,
    svg: `<ellipse cx="256" cy="90" rx="240" ry="74" fill="none" stroke="${INK}" stroke-width="26"/><ellipse cx="256" cy="90" rx="240" ry="74" fill="none" stroke="${PAL.yellow}" stroke-width="14"/><ellipse cx="256" cy="90" rx="240" ry="74" fill="none" stroke="${PAL.white}" stroke-width="4"/>`,
  },
  note: {
    w: 60,
    h: 70,
    svg: `<path d="M22 12 L50 6 V44 Q50 56 38 56 Q28 56 28 48 Q28 40 40 40 V20 L28 23 V54 Q28 66 16 66 Q6 66 6 58 Q6 50 18 50 Z" fill="${PAL.teal}" ${OL}/>`,
  },
  bolt: { w: 60, h: 80, svg: `<path d="M34 4 L8 44 H26 L18 76 L52 30 H32 Z" fill="${PAL.yellow}" ${OL}/>` },
  go: {
    w: 330,
    h: 150,
    svg: `<path d="M12 44 H200 V10 L318 75 L200 140 V106 H12 Z" fill="${PAL.yellow}" ${OL}/><path d="M12 92 H200 V106 H12 Z M200 124 L296 75 L318 75 L200 140 Z" fill="${PAL.orange}"/>`,
    texts: [{ text: 'GO!', x: 112, y: 100, size: 70, fill: INK, align: 'center' }],
  },
  pick: {
    w: 56,
    h: 60,
    svg: `<path d="M8 12 Q28 0 48 12 Q54 24 44 40 Q34 54 28 56 Q22 54 12 40 Q2 24 8 12Z" fill="${PAL.red}" ${OL}/><path d="M16 16 Q28 10 40 16" fill="none" stroke="${PAL.white}" stroke-width="4" stroke-linecap="round" opacity=".7"/>`,
  },
  bubble: {
    w: 120,
    h: 110,
    svg: `<path d="M12 44 Q12 10 60 10 Q108 10 108 44 Q108 78 64 78 L46 102 L46 76 Q12 72 12 44Z" fill="${PAL.white}" ${OL}/>`,
    texts: [{ text: '!', x: 60, y: 66, size: 62, fill: PAL.red, align: 'center' }],
  },

  // ---- things you can climb on
  car: {
    w: 560,
    h: 250,
    svg:
      `<path d="M30 150 Q34 118 80 112 L150 108 Q190 44 250 40 H360 Q410 44 440 106 L510 118 Q540 126 540 160 V196 Q540 206 528 206 H40 Q28 206 28 196 Z" fill="${PAL.teal}" ${OL}/>` +
      `<path d="M40 176 H540 V196 Q540 206 528 206 H40 Q28 206 28 196 Z" fill="${PAL.tealShade}"/>` +
      `<path d="M176 108 Q204 60 252 56 H292 V108 Z M308 56 H356 Q394 60 416 108 H308 Z" fill="#2a2140" ${OL}/>` +
      `<path d="M196 100 L226 66 M330 100 L352 66" stroke="#6a5a8a" stroke-width="7" stroke-linecap="round"/>` +
      `<path d="M300 112 V198 M150 112 H440" stroke="${INK}" stroke-width="4" fill="none" opacity=".6"/>` +
      `<rect x="232" y="128" width="30" height="8" rx="4" fill="${INK}"/><rect x="350" y="128" width="30" height="8" rx="4" fill="${INK}"/>` +
      `<path d="M506 132 h30 v18 h-34 z" fill="${PAL.yellow}" ${OL_THIN}/><path d="M30 138 h22 v20 h-24 z" fill="${PAL.red}" ${OL_THIN}/>` +
      `<path d="M20 186 H548 V202 H20 Z" fill="#3a3340" ${OL}/>` +
      [130, 430].map((x) => `<circle cx="${x}" cy="204" r="42" fill="${INK}"/><circle cx="${x}" cy="204" r="34" fill="#2a2230" ${OL_THIN}/><circle cx="${x}" cy="204" r="16" fill="${PAL.silver}" ${OL_THIN}/>`).join('') +
      // dents, a sticker
      `<path d="M76 140 q14 10 30 2" fill="none" stroke="${PAL.tealShade}" stroke-width="5" stroke-linecap="round"/>` +
      `<rect x="452" y="146" width="40" height="22" rx="3" fill="${PAL.white}" ${OL_THIN} transform="rotate(-6 472 157)"/>`,
    texts: [{ text: 'RC', x: 472, y: 165, size: 20, fill: PAL.red, align: 'center', rot: -6 }],
  },
  dumpster: {
    w: 400,
    h: 250,
    svg:
      `<path d="M30 70 H370 L352 226 H48 Z" fill="#3f7a5a" ${OL}/>` +
      `<path d="M300 72 H370 L352 224 H312 Z" fill="#2c5a40"/>` +
      `<path d="M70 96 V204 M130 96 V204 M190 96 V204 M250 96 V204" stroke="#2c5a40" stroke-width="8" stroke-linecap="round"/>` +
      `<path d="M16 50 H384 Q392 50 390 60 L388 76 H12 L10 60 Q8 50 16 50Z" fill="#4f9670" ${OL}/>` +
      `<rect x="50" y="222" width="34" height="22" rx="6" fill="${INK}"/><rect x="316" y="222" width="34" height="22" rx="6" fill="${INK}"/>` +
      `<path d="M6 110 h24 v40 h-24 z M370 110 h24 v40 h-24 z" fill="#2c5a40" ${OL}/>`,
    texts: [{ text: 'PIGS OUT', x: 176, y: 172, size: 46, font: 'Permanent Marker', fill: PAL.yellow, align: 'center', rot: -5 }],
  },
  amps: {
    w: 250,
    h: 250,
    svg:
      `<rect x="14" y="80" width="222" height="164" rx="8" fill="#2a2230" ${OL}/>` +
      `<rect x="28" y="94" width="194" height="136" rx="4" fill="#4a4058" ${OL_THIN}/>` +
      [[76, 128], [174, 128], [76, 196], [174, 196]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="30" fill="#2a2230" ${OL_THIN}/><circle cx="${x}" cy="${y}" r="12" fill="#6b6478"/>`).join('') +
      `<rect x="26" y="20" width="198" height="64" rx="8" fill="#2a2230" ${OL}/>` +
      `<rect x="38" y="30" width="174" height="26" rx="3" fill="${PAL.gold}" ${OL_THIN}/>` +
      [56, 86, 116, 146, 176].map((x) => `<circle cx="${x}" cy="68" r="6" fill="${PAL.silver}" ${OL_THIN}/>`).join('') +
      `<circle cx="204" cy="68" r="5" fill="${PAL.red}"/>`,
    texts: [{ text: 'LOUD', x: 125, y: 52, size: 24, fill: INK, align: 'center' }],
  },

  // ---- street dressing (no collision)
  hydrant: {
    w: 80,
    h: 120,
    svg: `<path d="M22 112 V44 Q22 22 40 22 Q58 22 58 44 V112 Z" fill="${PAL.red}" ${OL}/><path d="M48 26 Q56 30 56 44 V110 H48 Z" fill="${PAL.redShade}"/><rect x="14" y="40" width="52" height="12" rx="4" fill="${PAL.red}" ${OL}/><circle cx="40" cy="72" r="10" fill="${PAL.redShade}" ${OL}/><rect x="10" y="62" width="14" height="20" rx="3" fill="${PAL.red}" ${OL}/><path d="M32 22 Q40 4 48 22 Z" fill="${PAL.red}" ${OL}/><rect x="14" y="106" width="52" height="10" rx="3" fill="${PAL.redShade}" ${OL}/>`,
  },
  bin: {
    w: 120,
    h: 170,
    svg: `<path d="M20 44 H100 L92 160 H28 Z" fill="#6b6478" ${OL}/><path d="M80 46 H100 L92 158 H78 Z" fill="#4a4058"/><path d="M36 60 L40 148 M52 60 L54 148 M68 60 L68 148" stroke="#4a4058" stroke-width="5" stroke-linecap="round"/><path d="M10 30 Q60 6 110 30 V46 H10 Z" fill="#8a8298" ${OL}/><rect x="50" y="10" width="20" height="12" rx="4" fill="#8a8298" ${OL}/>`,
  },
  cone: {
    w: 80,
    h: 100,
    svg: `<path d="M32 12 H48 L64 82 H16 Z" fill="${PAL.orange}" ${OL}/><path d="M27 36 H53 L57 54 H23 Z" fill="${PAL.white}"/><rect x="6" y="80" width="68" height="14" rx="4" fill="${PAL.orange}" ${OL}/>`,
  },
  lamp: {
    w: 220,
    h: 1000,
    svg:
      `<defs><radialGradient id="g"><stop offset="0" stop-color="${PAL.yellow}" stop-opacity=".55"/><stop offset="1" stop-color="${PAL.yellow}" stop-opacity="0"/></radialGradient></defs>` +
      `<circle cx="150" cy="96" r="70" fill="url(#g)"/>` +
      `<path d="M66 990 V120 Q66 60 126 60 H150" fill="none" stroke="#150f1f" stroke-width="22" stroke-linecap="round"/>` +
      `<path d="M120 60 H180 L170 96 H130 Z" fill="#150f1f"/><ellipse cx="150" cy="98" rx="22" ry="9" fill="${PAL.yellow}"/>` +
      `<rect x="44" y="930" width="44" height="66" rx="8" fill="#150f1f"/>`,
  },
};
