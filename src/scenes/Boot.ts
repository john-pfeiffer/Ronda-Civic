import Phaser from 'phaser';
import { buildTextures } from '../art/textures';
import { HEROES, type HeroId } from '../data/heroes';
import { LEVEL } from '../data/level1';

/** Draws every texture, then hands over to the title (or straight into the level for debug links). */
export class Boot extends Phaser.Scene {
  constructor() {
    super('Boot');
  }

  create(): void {
    const bar = document.getElementById('loadbar');
    buildTextures(this.textures, (done, total) => {
      if (bar) bar.style.width = `${Math.round((done / total) * 100)}%`;
    })
      .then(() => {
        document.getElementById('loader')?.remove();
        const q = new URLSearchParams(location.search);
        const hero = q.get('hero') as HeroId | null;
        if (hero && HEROES[hero]) {
          const skip = q.get('skip');
          const names = LEVEL.encounters.map((e) => e.id);
          const checkpoint = skip === 'boss' ? names.length : skip ? Math.max(0, names.indexOf(skip)) : 0;
          this.scene.start('Level', { hero, checkpoint });
        } else this.scene.start('Title');
      })
      .catch((err) => {
        console.error(err);
        const el = document.getElementById('loadtext');
        if (el) el.textContent = 'Could not load the art. Check the console.';
      });
  }
}
