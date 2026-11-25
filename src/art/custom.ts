// Drop-in art. Any file placed under custom-art/ replaces the built-in drawing
// with the same name: no code changes, just add the file and rebuild.
//   custom-art/characters/<character>/<part>.png   (or .svg / .webp)
//   custom-art/characters/<character>/rig.json     (optional: resize parts, move joints)
//   custom-art/props/<name>.png
//   custom-art/backgrounds/<name>.png
import type { RigDef } from './rig';

const files = import.meta.glob('/custom-art/**/*.{png,svg,webp,jpg,jpeg}', { eager: true, query: '?url', import: 'default' }) as Record<string, string>;
const tweaks = import.meta.glob('/custom-art/characters/*/rig.json', { eager: true, import: 'default' }) as Record<string, RigTweak>;

export interface RigTweak {
  /** World pixels per rig unit: makes the whole character bigger or smaller. */
  scale?: number;
  parts?: Record<string, { w?: number; h?: number; pivot?: [number, number]; attach?: [number, number]; order?: number }>;
}

const byName = (folder: string) => {
  const out: Record<string, string> = {};
  for (const [path, url] of Object.entries(files)) {
    const m = path.match(new RegExp(`^/custom-art/${folder}/([^/]+)\\.[a-z]+$`));
    if (m) out[m[1]] = url;
  }
  return out;
};

export const CUSTOM_PROPS = byName('props');
export const CUSTOM_BACKGROUNDS = byName('backgrounds');

/** Apply custom part images and rig.json tweaks to the built-in rigs, in place. */
export function applyCustomArt(rigs: Record<string, RigDef>): void {
  for (const rig of Object.values(rigs)) {
    const tweak = tweaks[`/custom-art/characters/${rig.id}/rig.json`];
    if (tweak?.scale) rig.scale = tweak.scale;
    for (const part of rig.parts) {
      const t = tweak?.parts?.[part.id];
      if (t) Object.assign(part, t);
    }
  }
  for (const [path, url] of Object.entries(files)) {
    const m = path.match(/^\/custom-art\/characters\/([^/]+)\/([^/]+)\.[a-z]+$/);
    if (!m) continue;
    const part = rigs[m[1]]?.parts.find((p) => p.id === m[2]);
    if (part) part.image = url;
    else console.warn(`custom-art: no part "${m[2]}" on character "${m[1]}" (${path})`);
  }
}
