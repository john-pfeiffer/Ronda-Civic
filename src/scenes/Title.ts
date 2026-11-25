import Phaser from 'phaser';
import { ATLAS } from '../art/textures';
import { H, W, FLOOR_TOP } from '../config/game';
import { PROMO } from '../config/promo';
import { PAL } from '../art/palette';
import { RigView } from '../art/rigView';
import type { RigId } from '../art/rigs';
import { audio } from '../systems/audio';
import { controls } from '../systems/input';
import { backdrop, label, fitCamera } from './ui';

export class Title extends Phaser.Scene {
  private rigs: RigView[] = [];
  private armed = 0;

  constructor() {
    super('Title');
  }

  create(): void {
    this.rigs = [];
    this.armed = 0;
    fitCamera(this);
    backdrop(this, 'venue', 0.25);

    const cast: [RigId, number, number, 1 | -1, string][] = [
      ['bigboy', 1500, FLOOR_TOP + 150, -1, 'idle'],
      ['pigman', 1220, FLOOR_TOP + 190, -1, 'taunt'],
      ['pigClub', 1760, FLOOR_TOP + 230, -1, 'idle'],
      ['lieu', 250, FLOOR_TOP + 170, 1, 'idle'],
      ['cannon', 480, FLOOR_TOP + 220, 1, 'idle'],
      ['jordan', 700, FLOOR_TOP + 180, 1, 'idle'],
    ];
    for (const [id, x, y, facing, anim] of cast) {
      this.add.image(x, y, ATLAS, 'prop:shadow').setScale(id === 'bigboy' ? 1.8 : 0.8);
      const v = new RigView(this, id, anim);
      v.facing = facing;
      v.container.setPosition(x, y);
      this.rigs.push(v);
    }

    const band = label(this, W / 2, 190, PROMO.band, 230, PAL.yellow, 26).setAngle(-3);
    label(this, W / 2, 350, PROMO.gameTitle, 120, PAL.white, 18).setAngle(-3);
    this.add
      .text(W / 2, 450, PROMO.tagline, { fontFamily: 'Permanent Marker', fontSize: '44px', color: PAL.teal, stroke: PAL.ink, strokeThickness: 8, padding: { x: 8, y: 8 } })
      .setOrigin(0.5)
      .setAngle(-3);
    this.tweens.add({ targets: band, scale: 1.04, duration: 700, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });

    const start = label(this, W / 2, H - 90, controls.touchSeen ? 'TAP TO START' : 'PRESS ENTER OR TAP TO START', 64, PAL.white, 12);
    this.tweens.add({ targets: start, alpha: 0.25, duration: 520, yoyo: true, repeat: -1 });

    this.input.once('pointerup', () => this.go());
    controls.flush();
    audio.music('title');
  }

  private go(): void {
    audio.unlock();
    audio.music('title');
    audio.sfx('select');
    this.scene.start('HeroSelect');
  }

  update(_t: number, delta: number): void {
    controls.update();
    this.armed += delta;
    for (const r of this.rigs) r.update(delta);
    if (this.armed > 300 && (controls.consume('confirm') || controls.consume('attack'))) this.go();
  }
}
