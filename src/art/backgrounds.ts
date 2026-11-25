// Backdrops: sky, parallax skylines, the wall modules behind the street, and the ground.
// Placeholder art, same as the characters: any of these can be replaced from custom-art/.
import { INK, OL, OL_THIN, PAL } from './palette';
import { MODULE_W, WALL_H } from '../config/game';
import type { TexDef, TextOverlay } from './props';

const M = MODULE_W;
const HH = WALL_H;

/** Deterministic scatter so the art is identical on every load. */
function rng(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
}

const defs =
  `<defs>` +
  `<pattern id="brick" width="80" height="44" patternUnits="userSpaceOnUse"><path d="M0 0 H80 M0 22 H80 M20 0 V22 M60 22 V44" stroke="#000" stroke-opacity=".22" stroke-width="3" fill="none"/></pattern>` +
  `<pattern id="fence" width="36" height="36" patternUnits="userSpaceOnUse"><path d="M0 0 L36 36 M36 0 L0 36" stroke="#9a94ab" stroke-width="3" fill="none"/></pattern>` +
  `</defs>`;

const wall = (x: number, y: number, w: number, fill: string, brick = true) =>
  `<rect x="${x}" y="${y}" width="${w}" height="${HH - y + 4}" fill="${fill}" ${OL}/>` +
  (brick ? `<rect x="${x}" y="${y}" width="${w}" height="${HH - y}" fill="url(#brick)"/>` : '') +
  `<rect x="${x - 8}" y="${y - 14}" width="${w + 16}" height="22" fill="${INK}"/>`;

const win = (x: number, y: number, w: number, h: number, lit: boolean, bars = false) =>
  `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${lit ? '#ffcf6b' : '#241a38'}" ${OL}/>` +
  (lit ? `<rect x="${x + 6}" y="${y + 6}" width="${w * 0.4}" height="${h - 12}" fill="#fff0b8" opacity=".5"/>` : `<path d="M${x + 8} ${y + h - 10} L${x + w * 0.5} ${y + 8}" stroke="#4a3d68" stroke-width="6" stroke-linecap="round"/>`) +
  (bars ? Array.from({ length: 4 }, (_, i) => `<path d="M${x + ((i + 1) * w) / 5} ${y} V${y + h}" stroke="${INK}" stroke-width="5"/>`).join('') : `<path d="M${x + w / 2} ${y} V${y + h} M${x} ${y + h / 2} H${x + w}" stroke="${INK}" stroke-width="4"/>`) +
  `<rect x="${x - 8}" y="${y + h}" width="${w + 16}" height="12" fill="${INK}"/>`;

const POSTER_COLOURS = [PAL.yellow, PAL.teal, PAL.magenta, PAL.paper, PAL.orange];
/** Wheat-pasted gig poster; returns its drawing and its lettering. */
function poster(x: number, y: number, i: number, rot = 0): { svg: string; texts: TextOverlay[] } {
  const c = POSTER_COLOURS[i % POSTER_COLOURS.length];
  const cx = x + 55;
  const cy = y + 75;
  return {
    svg:
      `<g transform="rotate(${rot} ${cx} ${cy})"><rect x="${x}" y="${y}" width="110" height="150" fill="${c}" ${OL_THIN}/>` +
      `<circle cx="${cx}" cy="${y + 92}" r="30" fill="${INK}" opacity=".85"/><circle cx="${cx}" cy="${y + 92}" r="9" fill="${c}"/>` +
      `<path d="M${x + 14} ${y + 134} H${x + 96}" stroke="${INK}" stroke-width="5" stroke-dasharray="12 6"/></g>`,
    texts: [
      { text: 'RONDA', x: cx, y: y + 32, size: 30, fill: INK, align: 'center', rot },
      { text: 'CIVIC', x: cx, y: y + 58, size: 30, fill: INK, align: 'center', rot },
    ],
  };
}

function build(parts: (string | { svg: string; texts: TextOverlay[] })[], texts: TextOverlay[] = [], w = M): TexDef {
  let svg = defs;
  const all = [...texts];
  for (const p of parts) {
    if (typeof p === 'string') svg += p;
    else {
      svg += p.svg;
      all.push(...p.texts);
    }
  }
  return { w, h: HH, svg, texts: all };
}

const tag = (text: string, x: number, y: number, size: number, fill: string, rot = -6): TextOverlay => ({
  text, x, y, size, fill, rot, font: 'Permanent Marker', align: 'center', stroke: INK, strokeW: size * 0.16,
});
const sign = (text: string, x: number, y: number, size: number, fill: string = INK, rot = 0): TextOverlay => ({
  text, x, y, size, fill, rot, align: 'center',
});

const door = (x: number, w: number, h: number, fill: string) =>
  `<rect x="${x}" y="${HH - h}" width="${w}" height="${h + 4}" fill="${fill}" ${OL}/>` +
  `<rect x="${x + 14}" y="${HH - h + 16}" width="${w - 28}" height="${h * 0.36}" fill="#241a38" ${OL_THIN}/>` +
  `<circle cx="${x + w - 20}" cy="${HH - h * 0.42}" r="7" fill="${PAL.gold}" ${OL_THIN}/>`;

const awning = (x: number, y: number, w: number, a: string, b: string) => {
  let s = `<path d="M${x} ${y} H${x + w} L${x + w + 26} ${y + 70} H${x - 26} Z" fill="${a}" ${OL}/>`;
  const n = Math.round(w / 60);
  for (let i = 0; i < n; i += 2) {
    const x0 = x + (i * w) / n;
    const x1 = x + ((i + 1) * w) / n;
    const f0 = x - 26 + (i * (w + 52)) / n;
    const f1 = x - 26 + ((i + 1) * (w + 52)) / n;
    s += `<path d="M${x0} ${y} H${x1} L${f1} ${y + 70} H${f0} Z" fill="${b}"/>`;
  }
  return s + `<path d="M${x} ${y} H${x + w} L${x + w + 26} ${y + 70} H${x - 26} Z" fill="none" ${OL}/>`;
};

// ------------------------------------------------------------- wall modules

const venue = build(
  [
    wall(0, 30, M, PAL.brick),
    win(70, 90, 110, 130, true), win(780, 90, 110, 130, false),
    // marquee
    `<path d="M150 250 H810 L790 400 H170 Z" fill="${INK}"/>` +
    `<rect x="150" y="230" width="660" height="150" rx="8" fill="${PAL.cream}" ${OL}/>` +
    Array.from({ length: 22 }, (_, i) => `<circle cx="${165 + i * 30}" cy="238" r="6" fill="${i % 2 ? PAL.yellow : PAL.orange}"/><circle cx="${165 + i * 30}" cy="372" r="6" fill="${i % 2 ? PAL.orange : PAL.yellow}"/>`).join(''),
    door(350, 130, 220, '#1f6f6a'), door(482, 130, 220, '#1f6f6a'),
    `<rect x="120" y="440" width="150" height="180" fill="#241a38" ${OL}/>`, poster(140, 456, 0),
    `<rect x="690" y="440" width="150" height="180" fill="#241a38" ${OL}/>`, poster(710, 456, 2),
    // blade sign
    `<rect x="864" y="60" width="64" height="300" rx="8" fill="${PAL.magenta}" ${OL}/>`,
  ],
  [
    sign('RONDA CIVIC', 480, 318, 104, INK),
    sign('TONIGHT · ONE NIGHT ONLY · SOLD OUT', 480, 360, 34, PAL.red),
    ...'LIVE'.split('').map((ch, i) => sign(ch, 896, 122 + i * 70, 62, PAL.yellow)),
  ],
);

const brickA = (() => {
  const p = [0, 1, 2, 3, 4].map((i) => poster(250 + i * 122, 440 + (i % 2) * 14, i + 1, (i % 3) - 1.5));
  return build(
    [
      wall(0, 150, M, '#6d4a6b'),
      win(90, 220, 120, 130, false, true), win(740, 220, 120, 130, true, true),
      `<path d="M690 150 V${HH}" stroke="${INK}" stroke-width="22"/><path d="M690 150 V${HH}" stroke="#8a8298" stroke-width="12"/>`,
      `<path d="M330 330 q40 -60 90 -10 q40 -50 90 0 q30 -30 60 6" fill="none" stroke="${PAL.teal}" stroke-width="12" stroke-linecap="round"/>`,
      ...p,
    ],
    [tag('RONDA CIVIC', 430, 300, 92, PAL.teal, -5), tag('rules ok', 600, 400, 44, PAL.yellow, 4), tag('NO PIGS', 130, 520, 54, PAL.magenta, -10)],
  );
})();

const shop = build(
  [
    wall(0, 80, M, '#4f5f8f'),
    win(120, 130, 110, 120, true), win(420, 130, 110, 120, true), win(720, 130, 110, 120, false),
    `<rect x="60" y="300" width="840" height="70" rx="6" fill="${PAL.yellow}" ${OL}/>`,
    `<rect x="90" y="440" width="500" height="210" fill="#241a38" ${OL}/>` +
    [0, 1, 2, 3].map((i) => `<rect x="${110 + i * 118}" y="${470 + (i % 2) * 16}" width="100" height="100" fill="${POSTER_COLOURS[i]}" ${OL_THIN}/><circle cx="${160 + i * 118}" cy="${520 + (i % 2) * 16}" r="34" fill="${INK}"/><circle cx="${160 + i * 118}" cy="${520 + (i % 2) * 16}" r="10" fill="${POSTER_COLOURS[(i + 2) % 5]}"/>`).join(''),
    awning(80, 372, 800, PAL.teal, PAL.cream),
    door(660, 180, 210, PAL.red),
  ],
  [sign('CIVIC RECORDS', 480, 356, 64, INK), sign('NEW + USED · LOUD ONLY', 340, 630, 30, PAL.cream)],
);

const brickB = build(
  [
    wall(0, 190, M, '#5b5570', false),
    // roller shutter
    `<rect x="120" y="290" width="460" height="${HH - 290 + 4}" fill="#8a8298" ${OL}/>` +
    Array.from({ length: 12 }, (_, i) => `<path d="M120 ${318 + i * 28} H580" stroke="#6b6478" stroke-width="5"/>`).join(''),
    win(700, 270, 150, 120, true, true),
    poster(690, 440, 3, -3), poster(806, 452, 0, 4),
    `<path d="M150 560 q60 -70 120 0 t120 0 t120 0" fill="none" stroke="${PAL.magenta}" stroke-width="14" stroke-linecap="round"/>`,
  ],
  [tag('HOG WILD', 350, 470, 118, PAL.yellow, -7), tag('big boy is a chump', 350, 540, 40, PAL.white, -4), tag('RC', 880, 250, 60, PAL.teal, 8)],
);

const alleyA = build(
  [
    // low wall with a fence and sky above it on the left
    `<rect x="0" y="250" width="420" height="${HH - 250}" fill="url(#fence)"/>` +
    `<path d="M0 250 H420 M30 250 V${HH} M210 250 V${HH} M400 250 V${HH}" stroke="${INK}" stroke-width="12"/>`,
    `<rect x="0" y="470" width="420" height="${HH - 470 + 4}" fill="${PAL.brickDark}" ${OL}/><rect x="0" y="470" width="420" height="${HH - 470}" fill="url(#brick)"/>`,
    wall(420, 40, 540, PAL.brickDark),
    // fire escape
    `<path d="M520 200 H860 M520 400 H860" stroke="${INK}" stroke-width="16"/><path d="M520 200 V150 H860 V200 M520 400 V350 H860 V400" fill="none" stroke="${INK}" stroke-width="8"/>` +
    `<path d="M560 200 L820 400 M580 200 L840 400" stroke="${INK}" stroke-width="7"/>` +
    Array.from({ length: 8 }, (_, i) => `<path d="M${530 + i * 44} 150 V200 M${530 + i * 44} 350 V400" stroke="${INK}" stroke-width="5"/>`).join(''),
    win(600, 230, 110, 110, true), win(760, 440, 110, 110, false, true),
    // bin bags
    `<path d="M440 ${HH} Q430 590 470 580 Q480 560 500 580 Q540 584 530 ${HH} Z" fill="#241a38" ${OL}/><path d="M510 ${HH} Q506 606 540 600 Q560 590 572 608 Q590 620 584 ${HH} Z" fill="#2f2447" ${OL}/>`,
  ],
  [tag('PIGS WERE HERE', 210, 560, 46, PAL.pig, -4), tag('oink', 300, 620, 34, PAL.white, 6)],
);

const alleyB = (() => {
  const missing = { x: 560, y: 380 };
  return build(
    [
      wall(0, 60, M, '#4a2f45'),
      // stage door with a lamp over it
      `<circle cx="250" cy="330" r="120" fill="${PAL.yellow}" opacity=".16"/>` +
      door(160, 180, 280, '#7b3f4a') +
      `<rect x="170" y="318" width="160" height="44" rx="4" fill="${PAL.cream}" ${OL}/>` +
      `<path d="M250 290 l-26 22 h52 z" fill="${PAL.yellow}" ${OL}/>`,
      // "missing" flyer
      `<rect x="${missing.x}" y="${missing.y}" width="170" height="220" fill="${PAL.paper}" ${OL} transform="rotate(3 ${missing.x + 85} ${missing.y + 110})"/>` +
      `<g transform="rotate(3 ${missing.x + 85} ${missing.y + 110})"><circle cx="${missing.x + 85}" cy="${missing.y + 118}" r="40" fill="${PAL.skinPale}" ${OL_THIN}/>` +
      `<path d="M${missing.x + 55} ${missing.y + 84} l8 -26 l12 16 l10 -22 l10 22 l12 -16 l8 26 z" fill="${PAL.gold}" ${OL_THIN}/>` +
      `<circle cx="${missing.x + 72}" cy="${missing.y + 116}" r="5" fill="${INK}"/><circle cx="${missing.x + 98}" cy="${missing.y + 116}" r="5" fill="${INK}"/></g>`,
      // kegs
      [0, 1, 2].map((i) => `<rect x="${760 + (i % 2) * 90 - (i === 2 ? 45 : 0)}" y="${i === 2 ? 440 : 540}" width="84" height="104" rx="14" fill="${PAL.silver}" ${OL}/><path d="M${760 + (i % 2) * 90 - (i === 2 ? 45 : 0)} ${i === 2 ? 470 : 570} h84 m-84 44 h84" stroke="#8a8298" stroke-width="6"/>`).join(''),
      `<path d="M470 60 V${HH}" stroke="${INK}" stroke-width="20"/><path d="M470 60 V${HH}" stroke="#6b6478" stroke-width="10"/>`,
    ],
    [
      sign('STAGE DOOR', 250, 353, 34, INK),
      sign('MISSING', missing.x + 90, missing.y + 44, 40, PAL.red, 3),
      sign('JOANNE', missing.x + 80, missing.y + 196, 34, INK, 3),
      tag('BIG BOY  →', 700, 300, 64, PAL.yellow, -3),
    ],
  );
})();

const marketA = (() => {
  const r = rng(7);
  const veg = (x: number, c: string) =>
    Array.from({ length: 9 }, (_, i) => `<circle cx="${x + 20 + (i % 5) * 38 + r() * 8}" cy="${540 - Math.floor(i / 5) * 26}" r="20" fill="${c}" ${OL_THIN}/>`).join('');
  return build(
    [
      wall(0, 120, M, '#6a5a4f'),
      win(140, 170, 100, 110, true), win(430, 170, 100, 110, false), win(720, 170, 100, 110, true),
      // string lights
      `<path d="M0 330 Q240 400 480 330 T960 330" fill="none" stroke="${INK}" stroke-width="4"/>` +
      Array.from({ length: 16 }, (_, i) => {
        const x = 30 + i * 60;
        const y = 330 + Math.sin(((x % 480) / 480) * Math.PI) * 34;
        return `<circle cx="${x}" cy="${y + 10}" r="10" fill="${POSTER_COLOURS[i % 5]}" ${OL_THIN}/>`;
      }).join(''),
      // two stalls
      `<rect x="70" y="552" width="360" height="${HH - 552 + 4}" fill="${PAL.wood}" ${OL}/>` + veg(90, '#8fd16a') + veg(250, PAL.red) + awning(60, 400, 380, PAL.red, PAL.cream) +
      `<path d="M70 470 V556 M430 470 V556" stroke="${INK}" stroke-width="10"/>`,
      `<rect x="540" y="552" width="360" height="${HH - 552 + 4}" fill="${PAL.woodShade}" ${OL}/>` + veg(560, PAL.orange) + veg(720, PAL.yellow) + awning(530, 400, 380, PAL.teal, PAL.cream) +
      `<path d="M540 470 V556 M900 470 V556" stroke="${INK}" stroke-width="10"/>`,
    ],
    [sign('FRESH', 250, 622, 44, PAL.cream), sign('CHEAP', 720, 622, 44, PAL.cream)],
  );
})();

const butcher = build(
  [
    wall(0, 70, M, '#7a3a44'),
    win(160, 120, 110, 120, false), win(690, 120, 110, 120, true),
    `<rect x="80" y="280" width="800" height="96" rx="8" fill="${PAL.cream}" ${OL}/>`,
    `<rect x="110" y="430" width="470" height="${HH - 430 + 4}" fill="#241a38" ${OL}/>` +
    Array.from({ length: 7 }, (_, i) => `<path d="M${150 + i * 62} 432 v40 q-16 40 0 80 q16 -40 0 -80" fill="${PAL.pigShade}" ${OL_THIN}/>`).join(''),
    door(660, 190, 220, '#3a3340'),
    `<rect x="640" y="388" width="230" height="40" fill="${PAL.yellow}" ${OL}/>`,
  ],
  [sign("BIG BOY'S SLOP SHOP", 480, 352, 78, PAL.red), sign('PIGMEN EAT FREE', 755, 420, 30, INK), tag('gross', 340, 620, 50, PAL.yellow, -8)],
);

const stage = (() => {
  const W2 = M * 2;
  const truss = (x0: number, y0: number, x1: number, y1: number) => {
    let s = `<path d="M${x0} ${y0} L${x1} ${y1}" stroke="${INK}" stroke-width="34"/><path d="M${x0} ${y0} L${x1} ${y1}" stroke="#8a8298" stroke-width="22"/>`;
    const n = Math.round(Math.hypot(x1 - x0, y1 - y0) / 44);
    for (let i = 0; i < n; i++) {
      const ax = x0 + ((x1 - x0) * i) / n;
      const ay = y0 + ((y1 - y0) * i) / n;
      const bx = x0 + ((x1 - x0) * (i + 1)) / n;
      const by = y0 + ((y1 - y0) * (i + 1)) / n;
      s += `<path d="M${ax} ${ay} L${bx} ${by}" stroke="${INK}" stroke-width="3"/><circle cx="${ax}" cy="${ay}" r="4" fill="${INK}"/>`;
    }
    return s;
  };
  const light = (x: number, c: string) =>
    `<path d="M${x - 20} 96 L${x - 150} ${HH - 70} H${x + 150} L${x + 20} 96 Z" fill="${c}" opacity=".13"/>` +
    `<path d="M${x - 26} 66 H${x + 26} L${x + 18} 104 H${x - 18} Z" fill="#2a2230" ${OL}/><ellipse cx="${x}" cy="104" rx="18" ry="6" fill="${c}"/>`;
  const stack = (x: number) =>
    [0, 1, 2].map((i) => `<rect x="${x}" y="${190 + i * 126}" width="150" height="124" rx="6" fill="#2a2230" ${OL}/><circle cx="${x + 75}" cy="${252 + i * 126}" r="44" fill="#4a4058" ${OL_THIN}/><circle cx="${x + 75}" cy="${252 + i * 126}" r="16" fill="#2a2230"/>`).join('');
  return build(
    [
      // back curtain and banner
      `<rect x="210" y="70" width="${W2 - 420}" height="${HH - 150}" fill="#3a1f4f" ${OL}/>` +
      Array.from({ length: 18 }, (_, i) => `<path d="M${250 + i * 84} 76 V${HH - 86}" stroke="#2c1640" stroke-width="14"/>`).join(''),
      `<path d="M560 150 H1360 V410 L1310 380 L1260 410 L1210 380 L1160 410 L1110 380 L1060 410 L1010 380 L960 410 L910 380 L860 410 L810 380 L760 410 L710 380 L660 410 L610 380 L560 410 Z" fill="${PAL.purple}" ${OL}/>` +
      `<path d="M870 150 l10 -70 l40 44 l40 -64 l40 64 l40 -44 l10 70 z" fill="${PAL.gold}" ${OL}/>`,
      light(520, PAL.magenta), light(820, PAL.yellow), light(1100, PAL.teal), light(1400, PAL.magenta),
      truss(200, 60, W2 - 200, 60), truss(210, 60, 210, HH - 80), truss(W2 - 210, 60, W2 - 210, HH - 80),
      stack(30), stack(W2 - 180),
      // stage riser
      `<rect x="0" y="${HH - 84}" width="${W2}" height="88" fill="#4a2f45" ${OL}/>` +
      `<rect x="0" y="${HH - 96}" width="${W2}" height="24" fill="${PAL.wood}" ${OL}/>` +
      Array.from({ length: 16 }, (_, i) => `<path d="M${60 + i * 120} ${HH - 70} V${HH}" stroke="#35203a" stroke-width="8"/>`).join(''),
    ],
    [
      { text: 'BIG BOY', x: 960, y: 300, size: 170, fill: PAL.yellow, align: 'center', stroke: INK, strokeW: 16 },
      { text: 'KING OF THE PIGMEN', x: 960, y: 354, size: 44, fill: PAL.white, align: 'center' },
    ],
    W2,
  );
})();

// ----------------------------------------------------------- sky and ground

const sky: TexDef = {
  w: 960,
  h: 540,
  svg:
    `<defs><linearGradient id="sk" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${PAL.dusk1}"/><stop offset=".42" stop-color="${PAL.dusk2}"/><stop offset=".72" stop-color="${PAL.dusk3}"/><stop offset="1" stop-color="${PAL.dusk4}"/></linearGradient></defs>` +
    `<rect width="960" height="540" fill="url(#sk)"/>` +
    `<circle cx="700" cy="330" r="92" fill="#ffd07a" opacity=".9"/><circle cx="700" cy="330" r="128" fill="#ffd07a" opacity=".16"/>` +
    [[120, 90, 170], [420, 150, 230], [760, 70, 150], [600, 250, 280], [60, 260, 200]].map(([x, y, w]) => `<rect x="${x}" y="${y}" width="${w}" height="12" rx="6" fill="#fff" opacity=".12"/><rect x="${x + 30}" y="${y + 18}" width="${w * 0.6}" height="8" rx="4" fill="#fff" opacity=".08"/>`).join('') +
    Array.from({ length: 26 }, (_, i) => { const r = rng(i + 3); return `<circle cx="${r() * 960}" cy="${r() * 200}" r="${1 + r() * 1.6}" fill="#fff" opacity="${0.3 + r() * 0.5}"/>`; }).join(''),
};

function skyline(seed: number, fill: string, lit: string, hMin: number, hMax: number, H2: number): TexDef {
  const r = rng(seed);
  let s = '';
  let x = 0;
  while (x < 1920) {
    const w = 90 + Math.floor(r() * 150);
    const h = hMin + Math.floor(r() * (hMax - hMin));
    const top = H2 - h;
    s += `<rect x="${x}" y="${top}" width="${w + 2}" height="${h}" fill="${fill}"/>`;
    if (r() > 0.6) s += `<rect x="${x + w * 0.3}" y="${top - 46}" width="8" height="46" fill="${fill}"/>`;
    if (r() > 0.7) s += `<path d="M${x + w * 0.5} ${top - 30} h44 v30 h-44 z M${x + w * 0.5 + 8} ${top} v-56 M${x + w * 0.5 + 36} ${top} v-56" fill="${fill}" stroke="${fill}" stroke-width="5"/>`;
    for (let wy = top + 24; wy < H2 - 20; wy += 40) for (let wx = x + 16; wx < x + w - 22; wx += 34) if (r() > 0.62) s += `<rect x="${wx}" y="${wy}" width="14" height="20" fill="${lit}" opacity="${0.5 + r() * 0.5}"/>`;
    x += w;
  }
  return { w: 1920, h: H2, svg: s };
}

function ground(kind: 'street' | 'alley'): TexDef {
  const r = rng(kind === 'street' ? 11 : 23);
  const h = 320;
  const base = kind === 'street' ? PAL.asphalt : '#2f2740';
  let s = `<rect width="${M}" height="${h}" fill="${base}"/>`;
  for (let i = 0; i < 150; i++) s += `<rect x="${r() * M}" y="${60 + r() * 250}" width="${4 + r() * 10}" height="3" fill="#fff" opacity="${0.03 + r() * 0.05}"/>`;
  if (kind === 'street') {
    s += `<rect width="${M}" height="46" fill="${PAL.pavement}"/>` + Array.from({ length: 8 }, (_, i) => `<path d="M${i * 120 + 20} 0 l-16 46" stroke="#564d68" stroke-width="4"/>`).join('');
    s += `<rect y="44" width="${M}" height="16" fill="${PAL.pavementLight}"/><rect y="60" width="${M}" height="8" fill="${INK}" opacity=".5"/>`;
    s += [40, 520].map((x) => `<path d="M${x} 196 h300 l-10 20 h-300 z" fill="${PAL.cream}" opacity=".55"/>`).join('');
    s += `<ellipse cx="760" cy="130" rx="60" ry="20" fill="#2a2230" stroke="${INK}" stroke-width="5"/><path d="M716 130 h88 M730 120 h60 M730 140 h60" stroke="#4a4058" stroke-width="4"/>`;
    s += `<path d="M300 300 l40 -40 l-14 -24 l50 -30" fill="none" stroke="#241a38" stroke-width="5" stroke-linecap="round"/>`;
    s += `<rect x="180" y="250" width="44" height="30" fill="${PAL.paper}" opacity=".7" transform="rotate(-18 200 264)"/>`;
  } else {
    s += `<rect width="${M}" height="18" fill="#241a38"/>`;
    for (let y = 30; y < h; y += 58) for (let x = (y / 58) % 2 ? 0 : 60; x < M; x += 120) s += `<rect x="${x}" y="${y}" width="112" height="50" rx="8" fill="#fff" opacity=".035"/>`;
    s += `<ellipse cx="300" cy="180" rx="150" ry="34" fill="#4d6f9a" opacity=".35"/><ellipse cx="270" cy="172" rx="60" ry="8" fill="#fff" opacity=".18"/>`;
    s += `<ellipse cx="760" cy="270" rx="100" ry="22" fill="#4d6f9a" opacity=".3"/>`;
    s += `<rect x="600" y="90" width="110" height="46" rx="6" fill="#1b1426" stroke="${INK}" stroke-width="5"/>` + Array.from({ length: 5 }, (_, i) => `<path d="M${616 + i * 20} 96 v34" stroke="#4a4058" stroke-width="6"/>`).join('');
  }
  return { w: M, h, svg: s };
}

export const BACKGROUNDS: Record<string, TexDef> = {
  sky,
  far: skyline(5, '#4a2a66', '#ffb36b', 120, 330, 420),
  mid: skyline(19, '#2b1a47', '#ffd07a', 160, 420, 520),
  groundStreet: ground('street'),
  groundAlley: ground('alley'),
  venue, brickA, shop, brickB, alleyA, alleyB, marketA, butcher, stage,
};

/** Which wall module sits behind each stretch of street, left to right. `stage` is two modules wide. */
export const WALL_ORDER = ['venue', 'brickA', 'shop', 'brickB', 'alleyA', 'alleyB', 'alleyA', 'marketA', 'butcher', 'marketA', 'stage'];
/** Ground type per module index. */
export const GROUND_ORDER = ['street', 'street', 'street', 'street', 'alley', 'alley', 'alley', 'street', 'street', 'street', 'alley', 'alley'] as const;
