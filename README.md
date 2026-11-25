# Ronda Civic: Hog Wild

A one-level side-scrolling brawler made as a promo for Ronda Civic. Big Boy and his Pigmen have taken Joanne. Pick Cannon, Lieu or Jordan, fight down the street, find Doggy, grab the Tweaker, and get her back.

Runs in any modern browser, on desktop and phones. No install, no accounts.

## Play it locally

```bash
npm install
```

```bash
npm run dev
```

Then open `http://localhost:5173/`.

| | Keyboard | Gamepad | Touch |
|---|---|---|---|
| Move | WASD or arrows | stick or d-pad | left thumb anywhere on the left half |
| Hit | J or Z | X / A | HIT |
| Jump | K, X or Space | B / Y | JUMP |
| Special (when the yellow meter is full) | L or C | bumpers | SPECIAL |
| Pause | Esc or P | Start | pause button |

## The three fighters

| | Style | Signature moves |
|---|---|---|
| **Cannon** (vocals, guitar) | Brawler | Third hit of a combo grabs and throws a Pigman into his friends. Attack in the air is a stage dive that hits harder the higher he jumped from (climb the cars, the dumpster, the amps). Special: Crowd Surf. |
| **Lieu** (bass) | Slow and heavy | Biggest hits and longest reach. Light hits do not interrupt his swings. Third hit launches. Special: Low-End Drop, a shockwave that floors everything nearby. |
| **Jordan** (drums) | Fast ninja | Double jump. Attacking while running is a dash strike. Five-hit flurry. Air attack bounces off whoever it hits. Special: Drum Roll, ending in thrown sticks. |

## Putting it on Vercel

1. In Vercel choose **Add New > Project** and import this GitHub repository.
2. Leave the detected settings alone (framework: Vite, build: `npm run build`, output: `dist`). `vercel.json` already says the same.
3. Deploy. Every push to a branch gets its own preview link; the `main` branch is the public site.

## Making it yours

| What | Where |
|---|---|
| Your own character, prop and backdrop art | `custom-art/` (read `custom-art/README.md`; templates are in `art-templates/`) |
| The band's music | `public/audio/music/` and `src/config/music.ts` |
| Game title, tagline, links on the victory screen | `src/config/promo.ts` |
| Hero stats, combos, damage | `src/data/heroes.ts` |
| Enemy and boss stats | `src/data/enemies.ts` |
| Where enemies, crates and pickups appear | `src/data/level1.ts` |
| Animations (poses and timing) | `src/art/anims.ts` |

`/sheet.html` is the character sheet: every character, its pieces, and every animation.

## How the art works

Characters are cut-out puppets. Each one is a handful of pieces joined at fixed points, and the animations are lists of joint angles over time (`src/art/anims.ts`). That means new art for a piece works in every animation straight away, and a new animation works for every character that shares the skeleton. The placeholder pieces are drawn in code as SVG (`src/art/parts/`); files in `custom-art/` replace them.

## Checks

```bash
npm test
```

Unit tests for hit detection, the puppet maths and the game data.

```bash
npm run build
```

```bash
npm run preview
```

```bash
npm run smoke
```

With the preview running, `npm run smoke` has a bot play the whole level as each hero and fails on any script error or if the level cannot be finished. `node tests/touch.cjs` checks the touch controls at phone size. Both need Playwright (`npm i -D playwright`, then `npx playwright install chromium`).

Handy URLs while working: `?hero=jordan` skips the menus, `?hero=lieu&skip=boss` starts at the boss (also `skip=street2`, `alley1`, `market1`, `market2`), `?res=0.5` renders at half resolution.

## Built with

[Phaser 4](https://phaser.io), TypeScript and Vite. Fonts: Bangers and Permanent Marker (SIL Open Font License).
