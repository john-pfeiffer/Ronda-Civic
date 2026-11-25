// Game over and victory screens, shown on top of the frozen level.
import Phaser from 'phaser';
import { H, W } from '../config/game';
import { PROMO } from '../config/promo';
import { PAL } from '../art/palette';
import { HEROES, type HeroId } from '../data/heroes';
import { audio } from '../systems/audio';
import { controls } from '../systems/input';
import { button, fitCamera, INK_N, label } from './ui';

export class GameOver extends Phaser.Scene {
  private info!: { hero: HeroId; checkpoint: number; score: number };
  private armed = 0;

  constructor() {
    super('GameOver');
  }

  init(data: { hero: HeroId; checkpoint: number; score: number }): void {
    this.info = data;
    this.armed = 0;
  }

  create(): void {
    fitCamera(this);
    this.add.rectangle(0, 0, W, H, INK_N, 0.8).setOrigin(0).setInteractive();
    const t = label(this, W / 2, 300, 'GAME OVER', 220, PAL.red, 26).setAngle(-3).setScale(0.3);
    this.tweens.add({ targets: t, scale: 1, duration: 380, ease: 'Back.easeOut' });
    this.add
      .text(W / 2, 450, 'Joanne is still in that cage.', { fontFamily: 'Permanent Marker', fontSize: '46px', color: PAL.paper, stroke: PAL.ink, strokeThickness: 8, padding: { x: 8, y: 8 } })
      .setOrigin(0.5);
    button(this, W / 2, 620, 'CONTINUE', () => this.retry(), 460);
    button(this, W / 2, 750, 'QUIT TO TITLE', () => this.quit(), 460, PAL.paper);
    controls.flush();
  }

  private retry(): void {
    audio.sfx('select');
    this.scene.stop('Level');
    this.scene.start('Level', this.info);
  }

  private quit(): void {
    this.scene.stop('Level');
    this.scene.start('Title');
  }

  update(_t: number, delta: number): void {
    controls.update();
    this.armed += delta;
    if (this.armed > 600 && (controls.consume('confirm') || controls.consume('attack'))) this.retry();
  }
}

export class Victory extends Phaser.Scene {
  private info!: { hero: HeroId; score: number; time: number };
  private dom: HTMLElement | null = null;
  private armed = 0;

  constructor() {
    super('Victory');
  }

  init(data: { hero: HeroId; score: number; time: number }): void {
    this.info = data;
    this.armed = 0;
  }

  create(): void {
    fitCamera(this);
    this.add.rectangle(0, 0, W, 470, INK_N, 0.72).setOrigin(0);
    const t = label(this, W / 2, 130, 'YOU SAVED JOANNE!', 150, PAL.yellow, 22).setAngle(-2).setScale(0.3);
    this.tweens.add({ targets: t, scale: 1, duration: 420, ease: 'Back.easeOut' });
    const secs = Math.round(this.info.time / 1000);
    const time = `${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, '0')}`;
    label(this, W / 2, 260, `${HEROES[this.info.hero].name}   ·   SCORE ${this.info.score}   ·   TIME ${time}`, 56, PAL.white, 12);
    this.add
      .text(W / 2, 340, `Thanks for playing. Now go listen to ${PROMO.band}.`, { fontFamily: 'Permanent Marker', fontSize: '42px', color: PAL.teal, stroke: PAL.ink, strokeThickness: 8, padding: { x: 8, y: 8 } })
      .setOrigin(0.5);
    button(this, W / 2, 428, 'PLAY AGAIN', () => this.again(), 420);

    // Real links, so they open reliably on phones and can be long-pressed or copied.
    const links = PROMO.links.filter((l) => l.url);
    if (links.length) {
      const dom = document.createElement('div');
      dom.className = 'promo-links';
      for (const l of links) {
        const a = document.createElement('a');
        a.href = l.url;
        a.target = '_blank';
        a.rel = 'noopener';
        a.textContent = l.label;
        dom.append(a);
      }
      document.getElementById('game')?.append(dom);
      this.dom = dom;
    }
    this.events.once('shutdown', () => this.dom?.remove());
    controls.flush();
  }

  private again(): void {
    audio.sfx('select');
    this.scene.stop('Level');
    this.scene.start('HeroSelect');
  }

  update(_t: number, delta: number): void {
    controls.update();
    this.armed += delta;
    if (this.armed > 1200 && controls.consume('confirm')) this.again();
  }
}
