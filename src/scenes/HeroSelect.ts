import Phaser from 'phaser';
import { H, W } from '../config/game';
import { PAL } from '../art/palette';
import { RigView } from '../art/rigView';
import { HEROES, HERO_ORDER, type HeroId } from '../data/heroes';
import { audio } from '../systems/audio';
import { controls } from '../systems/input';
import { backdrop, button, hex, INK_N, label, fitCamera } from './ui';

const CARD_W = 520;
const CARD_H = 700;

export class HeroSelect extends Phaser.Scene {
  private index = 0;
  private rigs: RigView[] = [];
  private frames: Phaser.GameObjects.Graphics[] = [];
  private cards: Phaser.GameObjects.Container[] = [];
  private chosen = false;

  constructor() {
    super('HeroSelect');
  }

  create(): void {
    this.rigs = [];
    this.frames = [];
    this.cards = [];
    this.chosen = false;
    fitCamera(this);
    backdrop(this, 'shop', 0.55);
    label(this, W / 2, 86, 'PICK YOUR FIGHTER', 96, PAL.yellow, 16);

    HERO_ORDER.forEach((id, i) => {
      const def = HEROES[id];
      const cx = W / 2 + (i - 1) * (CARD_W + 50);
      const cy = 520;
      const frame = this.add.graphics();
      this.frames.push(frame);
      const card = this.add.container(cx, cy);
      const panel = this.add.graphics();
      panel.fillStyle(INK_N, 1).fillRoundedRect(-CARD_W / 2 - 8, -CARD_H / 2 - 8, CARD_W + 16, CARD_H + 16, 30);
      panel.fillStyle(hex(PAL.dusk2), 1).fillRoundedRect(-CARD_W / 2, -CARD_H / 2, CARD_W, CARD_H, 24);
      panel.fillStyle(def.colour, 1).fillRoundedRect(-CARD_W / 2, -CARD_H / 2, CARD_W, 330, { tl: 24, tr: 24, bl: 0, br: 0 });
      panel.fillStyle(INK_N, 0.25).fillEllipse(0, -50, 300, 50);
      card.add(panel);

      const rig = new RigView(this, def.rig, 'idle');
      rig.container.setPosition(0, -50);
      card.add(rig.container);
      this.rigs.push(rig);

      card.add(label(this, 0, 30, def.name, 96, PAL.white, 14));
      card.add(label(this, 0, 104, def.role, 40, PAL.yellow, 8));
      card.add(
        this.add
          .text(0, 176, def.blurb, { fontFamily: 'Permanent Marker', fontSize: '30px', color: PAL.paper, align: 'center', wordWrap: { width: CARD_W - 70 }, padding: { x: 6, y: 6 } })
          .setOrigin(0.5),
      );
      const stats: [string, number][] = [['POWER', def.stats.power], ['SPEED', def.stats.speed], ['HEALTH', def.stats.health]];
      stats.forEach(([name, n], row) => {
        const y = 246 + row * 34;
        card.add(this.add.text(-CARD_W / 2 + 44, y, name, { fontFamily: 'Bangers', fontSize: '30px', color: PAL.white, padding: { x: 4, y: 4 } }).setOrigin(0, 0.5));
        const pips = this.add.graphics();
        for (let k = 0; k < 5; k++) {
          pips.fillStyle(INK_N, 1).fillRoundedRect(-40 + k * 54 - 3, y - 13, 50, 26, 8);
          pips.fillStyle(k < n ? def.colour : 0x4a4058, 1).fillRoundedRect(-40 + k * 54, y - 10, 44, 20, 6);
        }
        card.add(pips);
      });

      card.setSize(CARD_W, CARD_H).setInteractive({ useHandCursor: true });
      card.on('pointerup', () => {
        if (this.index === i) this.pick();
        else this.select(i);
      });
      this.cards.push(card);
    });

    button(this, W / 2, H - 80, 'START', () => this.pick(), 380);
    this.select(0, true);
    controls.flush();
  }

  private select(i: number, silent = false): void {
    this.index = (i + HERO_ORDER.length) % HERO_ORDER.length;
    if (!silent) audio.sfx('ui');
    this.cards.forEach((card, k) => {
      const on = k === this.index;
      this.tweens.add({ targets: card, scale: on ? 1.04 : 0.92, y: on ? 505 : 530, alpha: on ? 1 : 0.7, duration: 140, ease: 'Sine.easeOut' });
      const f = this.frames[k].clear();
      if (on) f.lineStyle(12, hex(PAL.yellow), 1).strokeRoundedRect(card.x - CARD_W * 0.52 - 12, 505 - CARD_H * 0.52 - 12, CARD_W * 1.04 + 24, CARD_H * 1.04 + 24, 36);
      this.rigs[k].play(on ? 'walk' : 'idle');
    });
  }

  private pick(): void {
    if (this.chosen) return;
    this.chosen = true;
    audio.unlock();
    audio.sfx('select');
    const hero: HeroId = HERO_ORDER[this.index];
    this.rigs[this.index].play('victory');
    this.cameras.main.fadeOut(450, 29, 22, 38);
    this.time.delayedCall(480, () => this.scene.start('Level', { hero }));
  }

  update(_t: number, delta: number): void {
    controls.update();
    for (const r of this.rigs) r.update(delta);
    if (this.chosen) return;
    if (controls.consume('left')) this.select(this.index - 1);
    if (controls.consume('right')) this.select(this.index + 1);
    if (controls.consume('confirm') || controls.consume('attack')) this.pick();
  }
}
