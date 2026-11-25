// Small helpers shared by the menu and HUD scenes.
import Phaser from 'phaser';
import { W, H, FLOOR_TOP, WALL_H, RES } from '../config/game';
import { PAL } from '../art/palette';

export const INK_N = 0x1d1626;

/** Every scene draws in 1920x1080 units; the camera scales that to the real canvas. */
export function fitCamera(scene: Phaser.Scene): void {
  scene.cameras.main.setOrigin(0, 0).setZoom(RES);
}

export const hex = (c: string) => parseInt(c.slice(1), 16);

export function label(scene: Phaser.Scene, x: number, y: number, text: string, size: number, colour: string = PAL.white, stroke = 10): Phaser.GameObjects.Text {
  return scene.add
    .text(x, y, text, { fontFamily: 'Bangers', fontSize: `${size}px`, color: colour, stroke: PAL.ink, strokeThickness: stroke, padding: { x: 8, y: 6 } })
    .setOrigin(0.5);
}

/** Dusk street backdrop used behind the menus. */
export function backdrop(scene: Phaser.Scene, wall = 'venue', dim = 0): void {
  scene.add.image(0, 0, 'bg:sky').setOrigin(0).setDisplaySize(W, H);
  scene.add.tileSprite(0, 250, W, 420, 'bg:far').setOrigin(0);
  scene.add.tileSprite(0, 215, W, 520, 'bg:mid').setOrigin(0);
  scene.add.image(0, FLOOR_TOP - 24, 'bg:groundStreet').setOrigin(0).setDisplaySize(W / 2 + 2, H - FLOOR_TOP + 24);
  scene.add.image(W / 2, FLOOR_TOP - 24, 'bg:groundStreet').setOrigin(0).setDisplaySize(W / 2 + 2, H - FLOOR_TOP + 24);
  scene.add.image(0, FLOOR_TOP - WALL_H, 'bg:brickA').setOrigin(0);
  scene.add.image(W / 2, FLOOR_TOP - WALL_H, `bg:${wall}`).setOrigin(0);
  if (dim > 0) scene.add.rectangle(0, 0, W, H, INK_N, dim).setOrigin(0);
}

/** A chunky button. Calls `onTap` on click or touch. */
export function button(scene: Phaser.Scene, x: number, y: number, text: string, onTap: () => void, w = 420, fill: string = PAL.yellow): Phaser.GameObjects.Container {
  const g = scene.add.graphics();
  const draw = (c: string, dy: number) => {
    g.clear();
    g.fillStyle(INK_N, 1).fillRoundedRect(-w / 2 - 6, -44, w + 12, 104, 22);
    g.fillStyle(hex(c), 1).fillRoundedRect(-w / 2, -40 + dy, w, 84, 18);
  };
  draw(fill, 0);
  const t = scene.add.text(0, 2, text, { fontFamily: 'Bangers', fontSize: '54px', color: PAL.ink, padding: { x: 8, y: 6 } }).setOrigin(0.5);
  const c = scene.add.container(x, y, [g, t]);
  c.setSize(w + 12, 104).setInteractive({ useHandCursor: true });
  c.on('pointerdown', () => {
    draw(PAL.orange, 6);
    t.y = 8;
  });
  c.on('pointerout', () => {
    draw(fill, 0);
    t.y = 2;
  });
  c.on('pointerup', () => {
    draw(fill, 0);
    t.y = 2;
    onTap();
  });
  return c;
}
