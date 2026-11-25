// Turns the SVG drawings (or custom images) into GPU textures at boot.
import type Phaser from 'phaser';
import { RIGS } from './rigs';
import { partToSvgDoc } from './rig';
import { PROPS, type TexDef, type TextOverlay } from './props';
import { BACKGROUNDS } from './backgrounds';
import { CUSTOM_BACKGROUNDS, CUSTOM_PROPS } from './custom';

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('could not load art: ' + src.slice(0, 80)));
    img.src = src;
  });
}

const svgUrl = (svg: string) => 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);

function drawTexts(ctx: CanvasRenderingContext2D, texts: TextOverlay[]) {
  for (const t of texts) {
    ctx.save();
    ctx.translate(t.x, t.y);
    if (t.rot) ctx.rotate((t.rot * Math.PI) / 180);
    ctx.font = `${t.size}px "${t.font ?? 'Bangers'}", sans-serif`;
    ctx.textAlign = t.align ?? 'left';
    ctx.globalAlpha = t.alpha ?? 1;
    ctx.lineJoin = 'round';
    if (t.stroke) {
      ctx.strokeStyle = t.stroke;
      ctx.lineWidth = t.strokeW ?? 6;
      ctx.strokeText(t.text, 0, 0);
    }
    ctx.fillStyle = t.fill;
    ctx.fillText(t.text, 0, 0);
    ctx.restore();
  }
}

async function raster(src: string, w: number, h: number, texts?: TextOverlay[]): Promise<HTMLCanvasElement> {
  const img = await loadImage(src);
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.ceil(w));
  canvas.height = Math.max(1, Math.ceil(h));
  const ctx = canvas.getContext('2d')!;
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  if (texts?.length) drawTexts(ctx, texts);
  return canvas;
}

const texDoc = (d: TexDef) => `<svg xmlns="http://www.w3.org/2000/svg" width="${d.w}" height="${d.h}" viewBox="0 0 ${d.w} ${d.h}">${d.svg}</svg>`;

/** Every character part, prop and effect lives in this one texture; frame names are `rig:<id>:<part>` and `prop:<name>`. */
export const ATLAS = 'atlas';
const ATLAS_W = 4096;
const PAD = 2;

/** Simple shelf packer: tallest first, left to right, new row when full. */
function pack(items: { key: string; canvas: HTMLCanvasElement }[]): { canvas: HTMLCanvasElement; frames: { key: string; x: number; y: number; w: number; h: number }[] } {
  const sorted = [...items].sort((a, b) => b.canvas.height - a.canvas.height);
  const frames: { key: string; x: number; y: number; w: number; h: number }[] = [];
  let x = PAD;
  let y = PAD;
  let row = 0;
  for (const it of sorted) {
    const w = it.canvas.width;
    const h = it.canvas.height;
    if (x + w + PAD > ATLAS_W) {
      x = PAD;
      y += row + PAD;
      row = 0;
    }
    frames.push({ key: it.key, x, y, w, h });
    x += w + PAD;
    row = Math.max(row, h);
  }
  const canvas = document.createElement('canvas');
  canvas.width = ATLAS_W;
  canvas.height = y + row + PAD;
  if (canvas.height > 4096) throw new Error(`art atlas is too tall (${canvas.height}px): shrink some custom art`);
  const ctx = canvas.getContext('2d')!;
  const byKey = new Map(items.map((i) => [i.key, i.canvas]));
  for (const f of frames) ctx.drawImage(byKey.get(f.key)!, f.x, f.y);
  return { canvas, frames };
}

export async function buildTextures(textures: Phaser.Textures.TextureManager, onProgress: (done: number, total: number) => void): Promise<void> {
  await Promise.all([document.fonts.load('40px "Bangers"'), document.fonts.load('40px "Permanent Marker"')]);

  const sprites: { key: string; make: () => Promise<HTMLCanvasElement> }[] = [];
  const backdrops: { key: string; make: () => Promise<HTMLCanvasElement> }[] = [];
  for (const rig of Object.values(RIGS)) {
    for (const part of rig.parts) {
      const doc = partToSvgDoc(part, rig.scale);
      sprites.push({ key: `rig:${rig.id}:${part.id}`, make: () => raster(part.image ?? svgUrl(doc.svg), doc.w, doc.h) });
    }
  }
  for (const [name, def] of Object.entries(PROPS)) {
    const custom = CUSTOM_PROPS[name];
    sprites.push({ key: `prop:${name}`, make: () => (custom ? raster(custom, def.w, def.h) : raster(svgUrl(texDoc(def)), def.w, def.h, def.texts)) });
  }
  for (const [name, def] of Object.entries(BACKGROUNDS)) {
    const custom = CUSTOM_BACKGROUNDS[name];
    backdrops.push({ key: `bg:${name}`, make: () => (custom ? raster(custom, def.w, def.h) : raster(svgUrl(texDoc(def)), def.w, def.h, def.texts)) });
  }

  const total = sprites.length + backdrops.length;
  let done = 0;
  const step = () => onProgress(++done, total);

  const drawn = await Promise.all(
    sprites.map(async (job) => {
      const canvas = await job.make();
      step();
      return { key: job.key, canvas };
    }),
  );
  const atlas = pack(drawn);
  if (textures.exists(ATLAS)) textures.remove(ATLAS);
  const tex = textures.addCanvas(ATLAS, atlas.canvas)!;
  for (const f of atlas.frames) tex.add(f.key, 0, f.x, f.y, f.w, f.h);

  await Promise.all(
    backdrops.map(async (job) => {
      const canvas = await job.make();
      if (textures.exists(job.key)) textures.remove(job.key);
      textures.addCanvas(job.key, canvas);
      step();
    }),
  );
}
