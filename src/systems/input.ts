// One set of controls fed by keyboard, gamepad and the on-screen touch pad.
export type Action = 'attack' | 'jump' | 'special' | 'pause' | 'confirm' | 'left' | 'right' | 'up' | 'down';
const ACTIONS: Action[] = ['attack', 'jump', 'special', 'pause', 'confirm', 'left', 'right', 'up', 'down'];

const KEYS: Record<string, Action[]> = {
  KeyJ: ['attack', 'confirm'],
  KeyZ: ['attack', 'confirm'],
  KeyK: ['jump'],
  KeyX: ['jump'],
  Space: ['jump', 'confirm'],
  KeyL: ['special'],
  KeyC: ['special'],
  Enter: ['confirm'],
  Escape: ['pause'],
  KeyP: ['pause'],
  ArrowLeft: ['left'],
  KeyA: ['left'],
  ArrowRight: ['right'],
  KeyD: ['right'],
  ArrowUp: ['up'],
  KeyW: ['up'],
  ArrowDown: ['down'],
  KeyS: ['down'],
};

export interface TouchState {
  x: number;
  y: number;
  attack: boolean;
  jump: boolean;
  special: boolean;
}

class Controls {
  /** Movement, each axis -1..1. */
  x = 0;
  y = 0;
  touch: TouchState = { x: 0, y: 0, attack: false, jump: false, special: false };
  /** True once a touch has been seen, so the on-screen pad can show itself. */
  touchSeen = false;
  /** Test hook: scripted movement that overrides every device. */
  script: { x: number; y: number } | null = null;
  private keys = new Set<string>();
  private pressedAt: Record<Action, number> = Object.fromEntries(ACTIONS.map((a) => [a, -1e9])) as Record<Action, number>;
  private prev: Partial<Record<Action, boolean>> = {};
  private now = 0;
  private prevNow = 0;
  private frame = -1;

  constructor() {
    if (typeof window === 'undefined') return;
    window.addEventListener('keydown', (e) => {
      const acts = KEYS[e.code];
      if (!acts) return;
      e.preventDefault();
      if (e.repeat) return;
      this.keys.add(e.code);
      for (const a of acts) this.pressedAt[a] = performance.now();
    });
    window.addEventListener('keyup', (e) => this.keys.delete(e.code));
    window.addEventListener('blur', () => this.keys.clear());
    window.addEventListener('touchstart', () => (this.touchSeen = true), { passive: true });
  }

  private key(...codes: string[]) {
    return codes.some((c) => this.keys.has(c));
  }

  /** Call once per frame. */
  update(frame: number): void {
    // Several scenes call this in the same frame; only the first call counts.
    if (frame === this.frame) return;
    this.frame = frame;
    this.prevNow = this.now;
    this.now = performance.now();
    let x = (this.key('ArrowRight', 'KeyD') ? 1 : 0) - (this.key('ArrowLeft', 'KeyA') ? 1 : 0);
    let y = (this.key('ArrowDown', 'KeyS') ? 1 : 0) - (this.key('ArrowUp', 'KeyW') ? 1 : 0);
    const held: Partial<Record<Action, boolean>> = { attack: this.touch.attack, jump: this.touch.jump, special: this.touch.special };

    const pads = typeof navigator !== 'undefined' && navigator.getGamepads ? navigator.getGamepads() : [];
    for (const pad of pads) {
      if (!pad) continue;
      const ax = pad.axes[0] ?? 0;
      const ay = pad.axes[1] ?? 0;
      if (Math.abs(ax) > 0.3) x = ax;
      if (Math.abs(ay) > 0.3) y = ay;
      const b = (i: number) => !!pad.buttons[i]?.pressed;
      if (b(14)) x = -1;
      if (b(15)) x = 1;
      if (b(12)) y = -1;
      if (b(13)) y = 1;
      held.attack ||= b(2) || b(0);
      held.jump ||= b(1) || b(3);
      held.special ||= b(5) || b(7) || b(4);
      held.pause ||= b(9);
      held.confirm ||= b(0) || b(9);
    }
    if (Math.abs(this.touch.x) > 0.01 || Math.abs(this.touch.y) > 0.01) {
      x = this.touch.x;
      y = this.touch.y;
    }
    if (this.script) {
      x = this.script.x;
      y = this.script.y;
    }
    const len = Math.hypot(x, y);
    if (len > 1) {
      x /= len;
      y /= len;
    }
    this.x = x;
    this.y = y;
    // Menu directions from the stick / touch pad.
    held.left ||= x < -0.6 && !this.key('ArrowLeft', 'KeyA');
    held.right ||= x > 0.6 && !this.key('ArrowRight', 'KeyD');
    held.up ||= y < -0.6 && !this.key('ArrowUp', 'KeyW');
    held.down ||= y > 0.6 && !this.key('ArrowDown', 'KeyS');
    for (const a of ACTIONS) {
      if (held[a] && !this.prev[a]) this.pressedAt[a] = this.now;
      this.prev[a] = !!held[a];
    }
  }

  /** True if the action was pressed within the buffer window; the press is used up. */
  consume(a: Action, bufferMs = 140): boolean {
    // A press made since the previous frame always counts, however slow the frame was.
    if (this.now - this.pressedAt[a] <= bufferMs || this.pressedAt[a] >= this.prevNow) {
      this.pressedAt[a] = -1e9;
      return true;
    }
    return false;
  }

  /** Forget buffered presses (when changing scene). */
  flush(): void {
    for (const a of ACTIONS) this.pressedAt[a] = -1e9;
  }

  /** Test hook: press an action as if a button was tapped. */
  tap(a: Action): void {
    this.pressedAt[a] = performance.now();
  }
}

export const controls = new Controls();
