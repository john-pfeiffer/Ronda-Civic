// Heads-up display, on-screen touch controls and the pause menu. Runs on top of the level.
import Phaser from 'phaser';
import { ATLAS } from '../art/textures';
import { H, RES, W } from '../config/game';
import { PAL } from '../art/palette';
import { BOSS } from '../data/enemies';
import { FRENZY_MS } from '../systems/combat';
import { audio } from '../systems/audio';
import { controls } from '../systems/input';
import type { Level } from './Level';
import { button, hex, INK_N, label, fitCamera } from './ui';

const STICK = { r: 150 };
const BTN = {
  attack: { x: W - 230, y: H - 220, r: 125, text: 'HIT' },
  jump: { x: W - 500, y: H - 140, r: 100, text: 'JUMP' },
  special: { x: W - 190, y: H - 480, r: 92, text: 'SPECIAL' },
} as const;

export class Hud extends Phaser.Scene {
  private level!: Level;
  private g!: Phaser.GameObjects.Graphics;
  private touchG!: Phaser.GameObjects.Graphics;
  private touchLabels: Phaser.GameObjects.Text[] = [];
  private scoreText!: Phaser.GameObjects.Text;
  private comboText!: Phaser.GameObjects.Text;
  private hintText!: Phaser.GameObjects.Text;
  private toastText!: Phaser.GameObjects.Text;
  private bossText!: Phaser.GameObjects.Text;
  private specialText!: Phaser.GameObjects.Text;
  private musicText!: Phaser.GameObjects.Text;
  private go!: Phaser.GameObjects.Image;
  private picks: Phaser.GameObjects.Image[] = [];
  private pauseLayer!: Phaser.GameObjects.Container;
  private muteLabel!: Phaser.GameObjects.Text;
  private paused = false;
  private stickId = -1;
  private stickOrigin = { x: 0, y: 0 };
  private t = 0;

  constructor() {
    super('Hud');
  }

  create(): void {
    this.level = this.scene.get('Level') as Level;
    fitCamera(this);
    this.paused = false;
    this.stickId = -1;
    this.picks = [];
    this.touchLabels = [];
    const hero = this.level.hero;
    this.input.addPointer(3);

    this.g = this.add.graphics();
    // portrait
    this.add.circle(118, 118, 92, INK_N);
    this.add.circle(118, 118, 82, hero.def.colour);
    this.add.image(118, 132, ATLAS, `rig:${hero.def.rig}:head`).setScale(0.8);
    this.add.text(226, 22, hero.def.name, { fontFamily: 'Bangers', fontSize: '54px', color: PAL.white, stroke: PAL.ink, strokeThickness: 10, padding: { x: 6, y: 6 } });
    this.specialText = this.add.text(640, 142, '', { fontFamily: 'Bangers', fontSize: '34px', color: PAL.yellow, stroke: PAL.ink, strokeThickness: 8, padding: { x: 6, y: 6 } }).setOrigin(0, 0.5);
    for (let i = 0; i < 3; i++) this.picks.push(this.add.image(250 + i * 54, 204, ATLAS, 'prop:pick').setScale(0.8));

    this.scoreText = this.add.text(W - 190, 28, '0', { fontFamily: 'Bangers', fontSize: '60px', color: PAL.white, stroke: PAL.ink, strokeThickness: 10, padding: { x: 6, y: 6 } }).setOrigin(1, 0);
    this.comboText = label(this, W - 240, 300, '', 80, PAL.yellow, 14).setAngle(6);
    this.bossText = label(this, W / 2, H - 112, 'BIG BOY', 46, PAL.white, 10).setVisible(false);
    this.hintText = this.add
      .text(W / 2, H - 60, '', { fontFamily: 'Bangers', fontSize: '40px', color: PAL.white, stroke: PAL.ink, strokeThickness: 9, align: 'center', padding: { x: 8, y: 6 } })
      .setOrigin(0.5);
    this.toastText = label(this, W / 2, 330, '', 110, PAL.yellow, 18).setAlpha(0);
    this.musicText = this.add.text(30, H - 44, '', { fontFamily: 'Permanent Marker', fontSize: '26px', color: PAL.paper, stroke: PAL.ink, strokeThickness: 6, padding: { x: 6, y: 6 } });
    this.go = this.add.image(W - 250, 470, ATLAS, 'prop:go').setVisible(false);
    this.tweens.add({ targets: this.go, x: W - 210, duration: 320, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });

    // pause button (top right)
    const pb = this.add.graphics();
    pb.fillStyle(INK_N, 0.85).fillRoundedRect(W - 150, 24, 110, 96, 20);
    pb.fillStyle(hex(PAL.white), 1).fillRoundedRect(W - 118, 46, 18, 52, 5).fillRoundedRect(W - 88, 46, 18, 52, 5);
    this.add.zone(W - 95, 72, 130, 116).setInteractive({ useHandCursor: true }).on('pointerup', () => this.togglePause());

    // touch pad
    this.touchG = this.add.graphics();
    for (const b of Object.values(BTN)) this.touchLabels.push(label(this, b.x, b.y, b.text, b.r * 0.42, PAL.white, 8).setAlpha(0.8));

    this.buildPause();
    this.level.events.on('toast', this.showToast, this);
    this.events.once('shutdown', () => {
      this.level.events.off('toast', this.showToast, this);
      controls.touch = { x: 0, y: 0, attack: false, jump: false, special: false };
    });
  }

  private buildPause(): void {
    const dim = this.add.rectangle(0, 0, W, H, INK_N, 0.78).setOrigin(0).setInteractive();
    const title = label(this, W / 2, 250, 'PAUSED', 150, PAL.yellow, 20);
    const resume = button(this, W / 2, 470, 'RESUME', () => this.togglePause());
    const mute = button(this, W / 2, 600, '', () => {
      audio.setMuted(!audio.muted);
      this.muteLabel.setText(audio.muted ? 'SOUND: OFF' : 'SOUND: ON');
    });
    this.muteLabel = mute.list[1] as Phaser.GameObjects.Text;
    this.muteLabel.setText(audio.muted ? 'SOUND: OFF' : 'SOUND: ON');
    const quit = button(this, W / 2, 730, 'QUIT TO TITLE', () => {
      this.scene.stop('Level');
      this.scene.start('Title');
    }, 480, PAL.paper);
    const keys = this.add
      .text(W / 2, 900, 'MOVE: WASD / ARROWS     HIT: J     JUMP: K     SPECIAL: L     PAUSE: ESC', { fontFamily: 'Bangers', fontSize: '36px', color: PAL.paper, padding: { x: 6, y: 6 } })
      .setOrigin(0.5);
    this.pauseLayer = this.add.container(0, 0, [dim, title, resume, mute, quit, keys]).setDepth(100).setVisible(false);
  }

  private togglePause(): void {
    if (this.level.victory || this.level.gameOver) return;
    this.paused = !this.paused;
    this.pauseLayer.setVisible(this.paused);
    audio.sfx('ui');
    if (this.paused) this.scene.pause('Level');
    else {
      controls.flush();
      this.scene.resume('Level');
    }
  }

  private showToast(text: string): void {
    this.toastText.setText(text).setAlpha(1).setScale(0.6);
    this.tweens.killTweensOf(this.toastText);
    this.tweens.add({ targets: this.toastText, scale: 1, duration: 220, ease: 'Back.easeOut' });
    this.tweens.add({ targets: this.toastText, alpha: 0, delay: 1500, duration: 500 });
  }

  private readTouch(): void {
    const touch = { x: 0, y: 0, attack: false, jump: false, special: false };
    let stickSeen = false;
    for (const p of this.input.manager.pointers) {
      if (!p.isDown || !p.wasTouch) continue;
      // pointer positions are in canvas pixels; the layout is in 1920x1080 units
      const px = p.x / RES;
      const py = p.y / RES;
      const downX = p.downX / RES;
      const downY = p.downY / RES;
      if (downX < W * 0.45 && downY > 150) {
        if (this.stickId !== p.id) {
          this.stickId = p.id;
          this.stickOrigin = { x: downX, y: downY };
        }
        stickSeen = true;
        const dx = px - this.stickOrigin.x;
        const dy = py - this.stickOrigin.y;
        const len = Math.hypot(dx, dy);
        const dead = 18;
        if (len > dead) {
          const k = Math.min(1, (len - dead) / (STICK.r - dead)) / len;
          touch.x = dx * k;
          touch.y = dy * k;
        }
        // drag the base along if the thumb runs off the edge of it
        if (len > STICK.r) {
          this.stickOrigin.x += (dx / len) * (len - STICK.r);
          this.stickOrigin.y += (dy / len) * (len - STICK.r);
        }
        continue;
      }
      for (const [name, b] of Object.entries(BTN)) if (Math.hypot(px - b.x, py - b.y) < b.r * 1.2) touch[name as 'attack' | 'jump' | 'special'] = true;
    }
    if (!stickSeen) this.stickId = -1;
    controls.touch = touch;

    const g = this.touchG.clear();
    const show = controls.touchSeen && !this.paused && !this.level.victory && !this.level.gameOver;
    for (const l of this.touchLabels) l.setVisible(show);
    if (!show) return;
    const full = this.level.hero.meter >= 100;
    for (const [name, b] of Object.entries(BTN)) {
      const down = touch[name as 'attack' | 'jump' | 'special'];
      const colour = name === 'special' ? (full ? hex(PAL.yellow) : 0x6b6478) : name === 'jump' ? hex(PAL.teal) : hex(PAL.red);
      g.fillStyle(INK_N, 0.45).fillCircle(b.x, b.y, b.r + 8);
      g.fillStyle(colour, down ? 0.85 : 0.5).fillCircle(b.x, b.y, b.r * (down ? 0.94 : 1));
    }
    const ox = this.stickId >= 0 ? this.stickOrigin.x : 270;
    const oy = this.stickId >= 0 ? this.stickOrigin.y : H - 250;
    g.fillStyle(INK_N, 0.35).fillCircle(ox, oy, STICK.r + 10);
    g.lineStyle(6, 0xffffff, 0.35).strokeCircle(ox, oy, STICK.r);
    g.fillStyle(0xffffff, 0.6).fillCircle(ox + touch.x * STICK.r * 0.8, oy + touch.y * STICK.r * 0.8, 62);
  }

  private bar(x: number, y: number, w: number, h: number, ratio: number, colour: number, back = 0x4a4058): void {
    const g = this.g;
    g.fillStyle(INK_N, 1).fillRoundedRect(x - 6, y - 6, w + 12, h + 12, 12);
    g.fillStyle(back, 1).fillRoundedRect(x, y, w, h, 8);
    const fw = Math.max(0, Math.min(1, ratio)) * w;
    if (fw > 4) g.fillStyle(colour, 1).fillRoundedRect(x, y, fw, h, 8);
    g.fillStyle(0xffffff, 0.22).fillRoundedRect(x + 4, y + 3, Math.max(0, fw - 8), h * 0.3, 4);
  }

  update(_t: number, delta: number): void {
    controls.update(this.game.loop.frame);
    this.t += delta;
    if (controls.consume('pause')) this.togglePause();
    const lv = this.level;
    const hero = lv.hero;
    this.readTouch();

    this.g.clear();
    const low = hero.hp / hero.maxHp < 0.3;
    this.bar(232, 96, 560, 34, hero.hp / hero.maxHp, low && Math.floor(this.t / 160) % 2 ? hex(PAL.white) : hex(low ? PAL.red : '#8fd16a'));
    const full = hero.meter >= 100;
    this.bar(232, 148, 390, 20, hero.meter / 100, full && Math.floor(this.t / 140) % 2 ? hex(PAL.white) : hex(PAL.yellow));
    this.specialText.setText(full ? hero.def.specialName + ' READY!' : '');
    this.picks.forEach((p, i) => p.setVisible(i < hero.lives));
    if (hero.frenzied) {
      this.bar(W / 2 - 300, 150, 600, 26, hero.frenzy / FRENZY_MS, hex('#9be23c'));
    }
    this.scoreText.setText(String(lv.score).padStart(6, '0'));
    this.comboText.setText(lv.combo >= 3 ? `${lv.combo} HITS!` : '');
    this.hintText.setText(lv.hint);
    this.go.setVisible(lv.goArrow && !lv.victory);
    this.musicText.setText(audio.nowPlaying ? `♪ ${audio.nowPlaying}` : '');

    const boss = lv.boss;
    const showBoss = !!boss && !lv.victory;
    this.bossText.setVisible(showBoss);
    if (boss && showBoss) this.bar(W / 2 - 520, H - 86, 1040, 34, boss.hp / BOSS.hp, hex(boss.vulnerable ? PAL.yellow : PAL.magenta));
  }
}
