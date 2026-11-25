// World units are canvas pixels at the 1920x1080 design size.
export const W = 1920;
export const H = 1080;
/** The walkable band of the street: feet may stand between these two screen rows. */
export const FLOOR_TOP = 770;
export const FLOOR_BOTTOM = 1045;
export const GRAVITY = 3300;
export const MODULE_W = 960;
export const WALL_H = 650;
export const LEVEL_W = MODULE_W * 12;

/**
 * Render scale. The game is laid out at 1920x1080; screens with fewer physical pixels
 * render a smaller canvas (same layout, less work for the GPU). `?res=0.5` overrides it.
 */
export const RES = (() => {
  if (typeof window === 'undefined') return 1;
  const forced = Number(new URLSearchParams(location.search).get('res'));
  if (forced > 0) return Math.min(1, Math.max(0.25, forced));
  const px = Math.max(screen.width, screen.height) * (window.devicePixelRatio || 1);
  return px >= 1700 ? 1 : px >= 1300 ? 0.75 : 0.6;
})();
