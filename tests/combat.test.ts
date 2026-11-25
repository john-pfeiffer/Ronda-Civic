import { describe, expect, it } from 'vitest';
import { applyFrenzy, FRENZY, groundAt, hit, hitTest, meterGain, pushOut, radialTest, type Body, type Platform } from '../src/systems/combat';

const body = (over: Partial<Body> = {}): Body => ({ x: 0, y: 900, z: 0, facing: 1, radius: 40, height: 200, ...over });
const jab = hit({ dmg: 10, x0: 0, x1: 150, kbx: 200 });

describe('hitTest', () => {
  it('hits a target standing in front, within reach', () => {
    expect(hitTest(body(), jab, body({ x: 120 }))).toBe(true);
  });
  it('misses a target behind the attacker', () => {
    expect(hitTest(body(), jab, body({ x: -120 }))).toBe(false);
  });
  it('respects facing', () => {
    expect(hitTest(body({ facing: -1 }), jab, body({ x: -120 }))).toBe(true);
  });
  it('counts the target radius at the far edge of the reach', () => {
    expect(hitTest(body(), jab, body({ x: 185 }))).toBe(true);
    expect(hitTest(body(), jab, body({ x: 195 }))).toBe(false);
  });
  it('misses a target on a different street row', () => {
    expect(hitTest(body(), jab, body({ x: 100, y: 900 + jab.yTol + 1 }))).toBe(false);
  });
  it('misses a target that has jumped clear of the height band', () => {
    const low = hit({ dmg: 10, x0: 0, x1: 150, kbx: 0, z0: 0, z1: 100 });
    expect(hitTest(body(), low, body({ x: 100, z: 99 }))).toBe(true);
    expect(hitTest(body(), low, body({ x: 100, z: 101 }))).toBe(false);
  });
});

describe('radialTest', () => {
  it('reaches further along the street than across it', () => {
    expect(radialTest(0, 900, 400, body({ x: 380 }))).toBe(true);
    expect(radialTest(0, 900, 400, body({ y: 900 + 280 }))).toBe(false);
  });
  it('can be jumped', () => {
    expect(radialTest(0, 900, 400, body({ x: 100, z: 60 }), 36)).toBe(false);
    expect(radialTest(0, 900, 400, body({ x: 100, z: 0 }), 36)).toBe(true);
  });
});

describe('frenzy and meter', () => {
  it('doubles damage and boosts knock-back only while active', () => {
    expect(applyFrenzy(jab, false)).toBe(jab);
    const f = applyFrenzy(jab, true);
    expect(f.dmg).toBe(jab.dmg * FRENZY.damage);
    expect(f.kbx).toBeCloseTo(jab.kbx * FRENZY.knock);
  });
  it('caps the special meter at 100', () => {
    expect(meterGain(40, 20)).toBe(55);
    expect(meterGain(95, 100, 100)).toBe(100);
  });
});

describe('platforms', () => {
  const car: Platform = { x0: 100, x1: 500, y0: 700, y1: 850, h: 150 };
  it('is solid ground only for a body high enough to stand on it', () => {
    expect(groundAt([car], 300, 800, 0)).toBe(0);
    expect(groundAt([car], 300, 800, 150)).toBe(150);
    expect(groundAt([car], 300, 900, 150)).toBe(0);
  });
  it('pushes a walking body back out the side it came from', () => {
    expect(pushOut([car], 120, 800, 0, 90, 800)).toEqual({ x: 100, y: 800 });
    expect(pushOut([car], 300, 840, 0, 300, 860)).toEqual({ x: 300, y: 850 });
  });
  it('leaves a body alone when it is on top', () => {
    expect(pushOut([car], 300, 800, 150, 300, 800)).toEqual({ x: 300, y: 800 });
  });
});
