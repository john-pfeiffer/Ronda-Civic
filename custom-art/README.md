# Drawing your own art

Every character in the game is a puppet made of separate pieces (head, torso, two arms, two legs, a weapon). The game moves the pieces; it does not care what is drawn on them. To use your own drawing for a piece, save a file with the right name in this folder. No code changes.

The art that ships with the game is placeholder. Replace as much or as little of it as you like: pieces you have not drawn yet keep using the placeholder.

## Steps

1. Open the template for the piece in `art-templates/characters/<character>/`.
   - `head.svg` for vector tools (Illustrator, Affinity, Inkscape, Figma). It has two layers: the placeholder drawing and the guides.
   - `head.guide.png` for painting tools (Procreate, Photoshop, Krita). Put it on its own layer and trace over it.
   - `_all-parts.png` shows every piece of that character side by side.
2. Draw the character **facing right**. Keep the canvas size. Keep the joint where the pink cross is: that is the point the piece rotates around (the neck for a head, the shoulder for an arm, the hip for a leg, the grip for a weapon). Blue dots show where other pieces attach to this one.
3. Hide or delete the guide layer, then export with a transparent background as PNG (or SVG, or WebP).
4. Save it here using the same name:

   ```
   custom-art/characters/cannon/head.png
   custom-art/characters/cannon/torso.png
   custom-art/characters/cannon/armF.png      F = front (nearest the viewer), B = back
   custom-art/characters/cannon/armB.png
   custom-art/characters/cannon/legF.png
   custom-art/characters/cannon/legB.png
   custom-art/characters/cannon/weapon.png
   ```

5. Look at it. Run `npm run dev` and open `http://localhost:5173/sheet.html`: every character is shown in every animation, with your pieces in place. `sheet.html?rig=cannon` shows one character. The game itself picks the files up the same way.

Character folders: `cannon`, `lieu`, `jordan`, `joanne`, `bigboy`, `pigman`, `pigClub`, `pigThrower`, `doggy`. The full list of pieces and sizes is in `art-templates/PARTS.md`.

## Things worth knowing

- **Resolution.** Templates are 4 times the size the game needs, so there is room for detail. Any resolution works as long as the proportions of the canvas stay the same; the game scales the image to fit.
- **Overlap at the joints.** Pieces rotate, so let each one run a little past its joint (a neck stub on the torso, a rounded shoulder on the arm). Gaps show up when a limb swings.
- **Jordan has two weapons.** `weapon` is the stick in his front hand, `weaponB` the one in his back hand.
- **Joanne has a `back` piece**: the hair that hangs behind her.
- **Doggy is built differently**: `body`, `head`, `ear`, `tail` and four legs (`legFL`, `legFR`, `legBL`, `legBR`).

## Changing a piece's size or joint

If your drawing needs a bigger canvas or the joint in a different place, copy `art-templates/characters/<character>/rig.json` to `custom-art/characters/<character>/rig.json` and edit the numbers for that piece. Units are a quarter of the template pixels (a 720 px wide template is 180 units).

```json
{
  "scale": 1.08,
  "parts": {
    "head": { "w": 200, "h": 200, "pivot": [96, 168] }
  }
}
```

- `w`, `h`: canvas size of the piece.
- `pivot`: the joint, measured from the top-left of the piece.
- `attach`: where that joint sits on the parent piece (or, for the torso and legs, relative to the point on the ground between the feet).
- `order`: draw order; higher numbers are drawn in front.
- `scale`: makes the whole character bigger or smaller in the game.

You only need to list the pieces and values you are changing.

## Props and backdrops

Same idea, one file each:

```
custom-art/props/tweaker.png          pickups, crates, the car, effects...
custom-art/backgrounds/venue.png      wall sections, sky, ground
```

Templates with the right sizes are in `art-templates/props/` and `art-templates/backgrounds/`. Lettering on the placeholder signs is part of the placeholder: if you replace a backdrop, draw its lettering into your image.

## Regenerating the templates

`npm run art:templates` rebuilds everything in `art-templates/` from the current placeholder art.
