// Short-lived visual effects: hit sparks, dust, shockwave rings, floating text.
import type Phaser from 'phaser';
import { ATLAS } from '../art/textures';
import { PAL } from '../art/palette';

export class Fx {
  constructor(private scene: Phaser.Scene) {}

  spark(x: number, y: number, z: number, big = false): void {
    const img = this.scene.add.image(x, y - z, ATLAS, 'prop:spark').setDepth(y + 40);
    const s = big ? 1.25 : 0.7;
    img.setScale(s * 0.4).setAngle(Math.random() * 360);
    this.scene.tweens.add({ targets: img, scale: s, alpha: 0, angle: img.angle + 40, duration: big ? 260 : 170, ease: 'Cubic.easeOut', onComplete: () => img.destroy() });
  }

  puff(x: number, y: number, scale = 1): void {
    for (const dir of [-1, 1]) {
      const img = this.scene.add.image(x + dir * 20, y - 14, ATLAS, 'prop:puff').setDepth(y + 1).setScale(0.5 * scale).setAlpha(0.9).setFlipX(dir < 0);
      this.scene.tweens.add({ targets: img, x: x + dir * 90 * scale, y: y - 40, scale: scale, alpha: 0, duration: 380, ease: 'Cubic.easeOut', onComplete: () => img.destroy() });
    }
  }

  /** Ground shockwave expanding to `radius` world pixels. */
  ring(x: number, y: number, radius: number): void {
    const img = this.scene.add.image(x, y, ATLAS, 'prop:ring').setDepth(y - 1).setScale(0.1);
    this.scene.tweens.add({ targets: img, scale: radius / 240, alpha: 0, duration: 420, ease: 'Cubic.easeOut', onComplete: () => img.destroy() });
  }

  float(key: string, x: number, y: number, z: number, tint?: number): void {
    const img = this.scene.add.image(x, y - z, ATLAS, key).setDepth(y + 60).setScale(0.8);
    if (tint !== undefined) img.setTint(tint);
    this.scene.tweens.add({
      targets: img, y: y - z - 120 - Math.random() * 60, x: x + (Math.random() - 0.5) * 120, angle: (Math.random() - 0.5) * 60, alpha: 0, duration: 700, ease: 'Sine.easeOut', onComplete: () => img.destroy(),
    });
  }

  text(str: string, x: number, y: number, colour: string = PAL.yellow, size = 44): void {
    const t = this.scene.add
      .text(x, y, str, { fontFamily: 'Bangers', fontSize: `${size}px`, color: colour, stroke: PAL.ink, strokeThickness: 8 })
      .setOrigin(0.5)
      .setDepth(9000);
    this.scene.tweens.add({ targets: t, y: y - 90, alpha: 0, duration: 900, ease: 'Cubic.easeOut', onComplete: () => t.destroy() });
  }

  /** Bits flying off a smashed crate. */
  debris(x: number, y: number): void {
    for (let i = 0; i < 6; i++) {
      const img = this.scene.add.image(x, y - 60, ATLAS, 'prop:plank').setDepth(y + 2).setAngle(Math.random() * 360);
      const dx = (Math.random() - 0.5) * 380;
      this.scene.tweens.add({ targets: img, x: x + dx, angle: img.angle + dx, duration: 560, ease: 'Linear' });
      this.scene.tweens.add({ targets: img, y: y - 180 - Math.random() * 120, duration: 240, ease: 'Quad.easeOut', yoyo: false, onComplete: () => this.scene.tweens.add({ targets: img, y: y + Math.random() * 20, alpha: 0, duration: 320, ease: 'Quad.easeIn', onComplete: () => img.destroy() }) });
    }
  }
}
