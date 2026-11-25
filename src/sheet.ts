// Character sheet: every puppet in every animation, for art review.
import '@fontsource/bangers';
import '@fontsource/permanent-marker';
import { RIGS } from './art/rigs';
import { rigToSvg, sample, type RigDef } from './art/rig';
import { PAL } from './art/palette';

const NOTES: Record<string, string> = {
  cannon: 'Cannon · vocals + guitar · the brawler',
  lieu: 'Lieu · bass · slow and heavy',
  jordan: 'Jordan · drums · fast ninja',
  pigman: 'Pigman · grunt',
  pigClub: 'Pigman · bruiser',
  pigThrower: 'Pigman · thrower',
  bigboy: 'Big Boy · final boss',
  joanne: 'Joanne · the princess',
  doggy: 'Doggy · sidekick',
};

const params = new URLSearchParams(location.search);
const only = params.get('rig');
const frozen = params.get('t');
const big = params.has('big');

const style = document.createElement('style');
style.textContent = `
  body { margin: 0; background: ${PAL.dusk1}; color: ${PAL.paper}; font-family: 'Bangers', sans-serif; }
  h1 { font-size: 44px; margin: 18px 24px 4px; letter-spacing: 2px; color: ${PAL.yellow}; }
  h2 { font-size: 30px; margin: 22px 24px 6px; letter-spacing: 1.5px; }
  .row { display: flex; flex-wrap: wrap; gap: 10px; padding: 0 24px; }
  .cell { background: linear-gradient(${PAL.dusk2}, ${PAL.dusk3} 68%, ${PAL.asphalt} 68%); border: 4px solid ${PAL.ink}; border-radius: 10px; }
  .cell span { display: block; text-align: center; font-size: 18px; letter-spacing: 1px; padding: 2px 0 5px; background: ${PAL.ink}; }
  svg { display: block; }
`;
document.head.append(style);

const app = document.getElementById('app')!;
app.innerHTML = `<h1>RONDA CIVIC · CHARACTER SHEET</h1>`;

// ?close=rig:anim:t,... renders a few chosen poses large (used while drawing).
const close = params.get('close');
if (close) {
  const row = document.createElement('div');
  row.className = 'row';
  app.append(row);
  for (const spec of close.split(',')) {
    const [rigId, animName, t] = spec.split(':');
    const rig = RIGS[rigId];
    const a = rig.anims[animName];
    const H = rig.height * rig.scale;
    const w = H * 1.5;
    const zoom = Number(params.get('z') ?? 2.4);
    const cell = document.createElement('div');
    cell.className = 'cell';
    cell.innerHTML =
      `<svg width="${w * zoom}" height="${w * zoom}" viewBox="${-w / 2} ${-w * 0.86} ${w} ${w}">` +
      `<ellipse cx="0" cy="0" rx="${(rig.shadow * rig.scale) / 2}" ry="${rig.shadow * rig.scale * 0.11}" fill="#000" opacity=".28"/>` +
      rigToSvg(rig, sample(a, Number(t ?? 0) * a.dur)) +
      `</svg><span>${rigId} ${animName}</span>`;
    row.append(cell);
  }
}

interface Cell {
  rig: RigDef;
  anim: string;
  g: SVGGElement;
}
const cells: Cell[] = [];

for (const rig of Object.values(RIGS)) {
  if (close || (only && rig.id !== only)) continue;
  const h2 = document.createElement('h2');
  h2.textContent = NOTES[rig.id] ?? rig.id;
  app.append(h2);
  const row = document.createElement('div');
  row.className = 'row';
  app.append(row);
  const H = rig.height * rig.scale;
  const w = Math.round(H * (big ? 1.7 : 1.5));
  const h = Math.round(H * (big ? 1.7 : 1.5));
  const z = big ? 2 : 1;
  for (const name of Object.keys(rig.anims)) {
    const cell = document.createElement('div');
    cell.className = 'cell';
    cell.innerHTML =
      `<svg width="${w * z}" height="${h * z}" viewBox="${-w / 2} ${-h * 0.86} ${w} ${h}">` +
      `<ellipse cx="0" cy="0" rx="${(rig.shadow * rig.scale) / 2}" ry="${rig.shadow * rig.scale * 0.11}" fill="#000" opacity=".28"/>` +
      `<g class="p"></g></svg><span>${name}</span>`;
    row.append(cell);
    cells.push({ rig, anim: name, g: cell.querySelector('.p') as SVGGElement });
  }
}

const t0 = performance.now();
function frame(now: number) {
  for (const c of cells) {
    const a = c.rig.anims[c.anim];
    const ms = frozen !== null ? Number(frozen) * a.dur : a.loop ? now - t0 : (now - t0) % (a.dur + 500);
    c.g.innerHTML = rigToSvg(c.rig, sample(a, ms));
  }
  if (frozen === null) requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
(window as unknown as { __sheetReady: boolean }).__sheetReady = true;
