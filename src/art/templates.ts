// Artist templates: each puppet part as its own file, with its canvas size and joint marked.
// Pure string building, shared by the export script and the character sheet.
import type { PartDef, RigDef } from './rig';

const GUIDE = '#ff2bd6';
const CHILD = '#00c2ff';

/** Guide overlay for one part: canvas edge, this part's joint, and where other parts attach to it. */
export function partGuides(rig: RigDef, part: PartDef): string {
  const kids = rig.parts.filter((p) => p.parent === part.id);
  const [px, py] = part.pivot;
  const u = Math.max(part.w, part.h) / 100; // keep guide marks readable on small parts
  let g =
    `<rect x="0.5" y="0.5" width="${part.w - 1}" height="${part.h - 1}" fill="none" stroke="${GUIDE}" stroke-width="${u}" stroke-dasharray="${4 * u} ${3 * u}"/>` +
    `<circle cx="${px}" cy="${py}" r="${4.5 * u}" fill="none" stroke="${GUIDE}" stroke-width="${1.4 * u}"/>` +
    `<path d="M${px - 8 * u} ${py} H${px + 8 * u} M${px} ${py - 8 * u} V${py + 8 * u}" stroke="${GUIDE}" stroke-width="${1.4 * u}"/>`;
  for (const k of kids) {
    const [ax, ay] = k.attach;
    g +=
      `<circle cx="${ax}" cy="${ay}" r="${3 * u}" fill="${CHILD}"/>` +
      `<text x="${ax + 5 * u}" y="${ay + 3 * u}" font-family="sans-serif" font-size="${7 * u}" fill="${CHILD}">${k.id}</text>`;
  }
  return g;
}

/** One part as a standalone SVG file. `zoom` sets the pixel size relative to rig units. */
export function partTemplateSvg(rig: RigDef, part: PartDef, opts: { guides: boolean; art?: boolean; zoom?: number }): string {
  const zoom = opts.zoom ?? 4;
  const layer = (id: string, body: string) => `<g id="${id}" inkscape:groupmode="layer" inkscape:label="${id}">${body}</g>`;
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" xmlns:inkscape="http://www.inkscape.org/namespaces/inkscape" width="${part.w * zoom}" height="${part.h * zoom}" viewBox="0 0 ${part.w} ${part.h}">` +
    (opts.art === false ? '' : layer('placeholder-art', part.svg)) +
    (opts.guides ? layer('guides-delete-before-export', partGuides(rig, part)) : '') +
    `</svg>`
  );
}

/** Overview of every part of one character, laid out side by side with names and sizes. */
export function rigSheetSvg(rig: RigDef): string {
  const pad = 30;
  const label = 46;
  let x = pad;
  const rowH = Math.max(...rig.parts.map((p) => p.h));
  let body = '';
  for (const part of [...rig.parts].sort((a, b) => b.h - a.h)) {
    const y = pad + label + (rowH - part.h);
    body +=
      `<g transform="translate(${x} ${y})"><rect width="${part.w}" height="${part.h}" fill="#ffffff"/>${part.svg}${partGuides(rig, part)}</g>` +
      `<text x="${x}" y="${pad + 16}" font-family="sans-serif" font-weight="700" font-size="18" fill="#ffffff">${part.id}</text>` +
      `<text x="${x}" y="${pad + 36}" font-family="sans-serif" font-size="13" fill="#d8d0e8">${part.w}×${part.h} · joint ${part.pivot[0]},${part.pivot[1]}</text>`;
    x += Math.max(part.w, 150) + pad;
  }
  const w = x;
  const h = pad * 2 + label + rowH + 34;
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="${w * 2}" height="${h * 2}" viewBox="0 0 ${w} ${h}"><rect width="${w}" height="${h}" fill="#2a1b4a"/>${body}` +
    `<text x="${pad}" y="${h - 14}" font-family="sans-serif" font-size="13" fill="#d8d0e8">${rig.id} · sizes in rig units (templates are exported at 4 px per unit) · ` +
    `<tspan fill="${GUIDE}">cross = this part's joint</tspan> · <tspan fill="${CHILD}">dot = where another part attaches</tspan> · draw facing right</text></svg>`
  );
}
