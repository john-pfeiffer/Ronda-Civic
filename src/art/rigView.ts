// A puppet on screen: one Phaser container holding an image per part,
// posed every frame from the rig's keyframe animations.
import Phaser from 'phaser';
import { ATLAS } from './textures';
import { RIGS, type RigId } from './rigs';
import { lerpPose, sample, solve, type Anim, type Pose, type RigDef } from './rig';

export class RigView {
  readonly rig: RigDef;
  readonly container: Phaser.GameObjects.Container;
  private images = new Map<string, Phaser.GameObjects.Image>();
  private orderSig = '';
  private animName = '';
  private anim!: Anim;
  private time = 0;
  private from: Pose | null = null;
  private blendLeft = 0;
  private blendDur = 0;
  private lastPose: Pose = {};
  private flashLeft = 0;
  private tintColour: number | null = null;
  speed = 1;
  facing: 1 | -1 = 1;
  /** Extra squash multipliers applied on top of the animation (landing, hit reactions). */
  squashX = 1;
  squashY = 1;

  constructor(scene: Phaser.Scene, rigId: RigId, anim = 'idle') {
    this.rig = RIGS[rigId];
    this.container = scene.add.container(0, 0);
    for (const part of this.rig.parts) {
      const img = new Phaser.GameObjects.Image(scene, 0, 0, ATLAS, `rig:${this.rig.id}:${part.id}`);
      img.setOrigin(part.pivot[0] / part.w, part.pivot[1] / part.h);
      this.images.set(part.id, img);
      this.container.add(img);
    }
    this.play(anim, { blend: 0 });
    this.update(0);
  }

  get current(): string {
    return this.animName;
  }

  /** True once a non-looping animation has reached its last frame. */
  get done(): boolean {
    return !this.anim.loop && this.time >= this.anim.dur;
  }

  has(name: string): boolean {
    return name in this.rig.anims;
  }

  play(name: string, opts: { restart?: boolean; blend?: number; speed?: number } = {}): void {
    const anim = this.rig.anims[name];
    if (!anim) throw new Error(`rig ${this.rig.id} has no animation "${name}"`);
    if (opts.speed !== undefined) this.speed = opts.speed;
    if (name === this.animName && !opts.restart) return;
    const blend = opts.blend ?? 70;
    if (blend > 0 && this.animName) {
      this.from = this.lastPose;
      this.blendDur = blend;
      this.blendLeft = blend;
    } else {
      this.from = null;
      this.blendLeft = 0;
    }
    this.animName = name;
    this.anim = anim;
    this.time = 0;
  }

  /** White flash for hits. */
  flash(ms = 90): void {
    this.flashLeft = ms;
  }

  setTint(colour: number | null): void {
    this.tintColour = colour;
  }

  update(dtMs: number): void {
    this.time += dtMs * this.speed;
    let pose = sample(this.anim, this.time);
    if (this.from && this.blendLeft > 0) {
      this.blendLeft -= dtMs;
      const t = 1 - Math.max(0, this.blendLeft) / this.blendDur;
      pose = lerpPose(this.from, pose, t);
      // discrete channels should not be blended
      for (const k in pose) if (k.endsWith('_hide') || k.endsWith('_z')) pose[k] = sample(this.anim, this.time)[k] ?? 0;
    }
    this.lastPose = pose;
    this.apply(pose);

    if (this.flashLeft > 0) {
      this.flashLeft -= dtMs;
      const on = this.flashLeft > 0;
      for (const img of this.images.values()) {
        if (on) img.setTint(0xffffff).setTintMode(Phaser.TintModes.FILL);
        else this.applyTint(img);
      }
    }
  }

  private applyTint(img: Phaser.GameObjects.Image) {
    img.setTintMode(Phaser.TintModes.MULTIPLY);
    if (this.tintColour === null) img.clearTint();
    else img.setTint(this.tintColour);
  }

  refreshTint(): void {
    if (this.flashLeft <= 0) for (const img of this.images.values()) this.applyTint(img);
  }

  private apply(pose: Pose): void {
    const s = this.rig.scale;
    const solved = solve(this.rig, pose);
    let sig = '';
    for (const f of solved) {
      const img = this.images.get(f.id)!;
      img.setPosition(f.x * s, f.y * s);
      img.setAngle(f.rot);
      img.setScale(f.sx, f.sy);
      img.setVisible(!((pose[f.id + '_hide'] ?? 0) > 0.5));
      sig += f.id + ',';
    }
    if (sig !== this.orderSig) {
      this.orderSig = sig;
      for (const f of solved) this.container.bringToTop(this.images.get(f.id)!);
    }
    const sx = (pose.sx ?? 1) * this.squashX;
    const sy = (pose.sy ?? 1) * this.squashY;
    this.container.setScale(this.facing * sx, sy);
  }

  destroy(): void {
    this.container.destroy();
  }
}
