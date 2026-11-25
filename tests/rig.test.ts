import { describe, expect, it } from 'vitest';
import { lerpPose, rigToSvg, sample, solve, type Anim, type RigDef } from '../src/art/rig';
import { RIGS } from '../src/art/rigs';
import { HEROES } from '../src/data/heroes';
import { ENEMIES } from '../src/data/enemies';
import { LEVEL } from '../src/data/level1';

const stick: RigDef = {
  id: 'stick',
  legLen: 10,
  scale: 1,
  height: 30,
  shadow: 10,
  anims: {},
  parts: [
    { id: 'torso', parent: null, svg: '', w: 10, h: 20, pivot: [5, 20], attach: [0, -10], order: 1 },
    { id: 'head', parent: 'torso', svg: '', w: 10, h: 10, pivot: [5, 10], attach: [5, 0], order: 2 },
  ],
};

describe('rig solver', () => {
  it('stacks parts through their joints', () => {
    const [torso, head] = solve(stick, {});
    expect(torso).toMatchObject({ x: 0, y: -10, rot: 0 });
    expect(head.x).toBeCloseTo(0);
    expect(head.y).toBeCloseTo(-30);
  });
  it('carries a parent rotation down to its children', () => {
    const head = solve(stick, { torso: 90 }).find((p) => p.id === 'head')!;
    // torso tipped 90 degrees clockwise: the neck is now out to the right of the hips
    expect(head.x).toBeCloseTo(20);
    expect(head.y).toBeCloseTo(-10);
    expect(head.rot).toBe(90);
  });
  it('lets a pose reorder parts with a _z nudge', () => {
    expect(solve(stick, { head_z: -5 }).map((p) => p.id)).toEqual(['head', 'torso']);
  });
});

describe('animation sampling', () => {
  const a: Anim = { dur: 100, keys: [{ t: 0, p: { x: 0 } }, { t: 1, p: { x: 10, sx: 2 }, ease: 'lin' }] };
  it('interpolates, treating missing scale channels as 1', () => {
    const p = sample(a, 50);
    expect(p.x).toBeCloseTo(5);
    expect(p.sx).toBeCloseTo(1.5);
  });
  it('holds the last frame of a one-shot and wraps a loop', () => {
    expect(sample(a, 500).x).toBe(10);
    expect(sample({ ...a, loop: true }, 150).x).toBeCloseTo(5);
  });
  it('blends two poses', () => {
    expect(lerpPose({ a: 0 }, { a: 10, b: 4 }, 0.5)).toEqual({ a: 5, b: 2 });
  });
});

describe('game data is wired up', () => {
  it('every rig has the animations the code plays, and parents come before children', () => {
    const needs: Record<string, string[]> = {
      cannon: ['idle', 'walk', 'jump', 'fall', 'land', 'hurt', 'knock', 'down', 'getup', 'victory', 'atk1', 'atk2', 'atk3', 'throw', 'airatk', 'special', 'specialStart'],
      lieu: ['idle', 'walk', 'jump', 'fall', 'land', 'hurt', 'knock', 'down', 'getup', 'victory', 'atk1', 'atk2', 'atk3', 'airatk', 'special'],
      jordan: ['idle', 'walk', 'jump', 'fall', 'land', 'hurt', 'knock', 'down', 'getup', 'victory', 'atk1', 'atk2', 'atk3', 'atk4', 'atk5', 'dash', 'flip', 'airatk', 'special', 'specialEnd'],
      pigman: ['idle', 'walk', 'wind', 'atk', 'taunt', 'hurt', 'knock', 'down', 'getup'],
      pigClub: ['idle', 'walk', 'wind', 'atk', 'taunt', 'hurt', 'knock', 'down', 'getup'],
      pigThrower: ['idle', 'walk', 'wind', 'atk', 'taunt', 'hurt', 'knock', 'down', 'getup'],
      bigboy: ['idle', 'walk', 'wind', 'atk', 'chargeWind', 'charge', 'slamUp', 'slamFall', 'slamLand', 'roar', 'dizzy', 'hurt', 'knock', 'down'],
      joanne: ['caged', 'cheer', 'walk'],
      doggy: ['idle', 'sit', 'run', 'bite', 'happy'],
    };
    for (const [id, anims] of Object.entries(needs)) {
      const rig = RIGS[id];
      expect(rig, id).toBeDefined();
      for (const name of anims) expect(rig.anims[name], `${id}.${name}`).toBeDefined();
      expect(() => solve(rig, {})).not.toThrow();
      expect(rigToSvg(rig, sample(rig.anims.idle, 0))).toContain('<g');
    }
  });
  it('every combo move points at a real animation and lands its hit before it ends', () => {
    for (const hero of Object.values(HEROES)) {
      for (const m of hero.combo) {
        expect(RIGS[hero.rig].anims[m.anim], `${hero.id}.${m.anim}`).toBeDefined();
        for (const h of m.hits) expect(h.at).toBeLessThan(m.dur);
      }
    }
  });
  it('the level only spawns known enemies, in order along the street', () => {
    let last = -1;
    for (const enc of LEVEL.encounters) {
      expect(enc.at).toBeGreaterThan(last);
      last = enc.at;
      for (const wave of enc.waves) for (const s of wave) expect(ENEMIES[s.type]).toBeDefined();
    }
    expect(LEVEL.boss.at).toBeGreaterThan(last);
  });
});
