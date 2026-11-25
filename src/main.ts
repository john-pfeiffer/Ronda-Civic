import '@fontsource/bangers';
import '@fontsource/permanent-marker';
import Phaser from 'phaser';
import { H, RES, W } from './config/game';
import { Boot } from './scenes/Boot';
import { Title } from './scenes/Title';
import { HeroSelect } from './scenes/HeroSelect';
import { Level } from './scenes/Level';
import { Hud } from './scenes/Hud';
import { GameOver, Victory } from './scenes/Endings';
import { audio } from './systems/audio';
import { controls } from './systems/input';

const game = new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'game',
  width: Math.round(W * RES),
  height: Math.round(H * RES),
  backgroundColor: '#1d1626',
  scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
  input: { activePointers: 4 },
  render: { antialias: true, maxTextures: 1 },
  scene: [Boot, Title, HeroSelect, Level, Hud, GameOver, Victory],
});

// Browsers hold audio back until the first tap or key press.
for (const ev of ['pointerdown', 'keydown', 'touchstart']) window.addEventListener(ev, () => audio.unlock(), { passive: true });

// Test and debug hook: add ?debug to the URL.
if (new URLSearchParams(location.search).has('debug')) {
  Object.assign(window, { __game: { game, controls, audio, level: () => game.scene.getScene('Level') } });
}
