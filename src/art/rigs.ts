import type { RigDef } from './rig';
import { BIGBOY_ANIMS, CANNON, DOGGY, JOANNE, JORDAN, LIEU, PIGMAN, PIG_CLUB, PIG_THROW } from './anims';
import { LEG_LEN } from './parts/human';
import { cannonParts, jordanParts, lieuParts } from './parts/heroes';
import { BIGBOY, PIG, bigBoyParts, pigClubParts, pigThrowerParts, pigmanParts } from './parts/pigs';
import { DOG_LEG, doggyParts, joanneParts } from './parts/friends';
import { applyCustomArt } from './custom';

const human = (id: string, parts: RigDef['parts'], anims: RigDef['anims'], scale = 1.08): RigDef => ({
  id,
  parts,
  anims,
  legLen: LEG_LEN,
  scale,
  height: 218,
  shadow: 120,
});
const pig = (id: string, parts: RigDef['parts'], anims: RigDef['anims'], scale = 0.96): RigDef => ({
  id,
  parts,
  anims,
  legLen: PIG.legLen,
  scale,
  height: 226,
  shadow: 150,
});

export const RIGS: Record<string, RigDef> = {
  cannon: human('cannon', cannonParts(), CANNON),
  lieu: human('lieu', lieuParts(), LIEU, 1.12),
  jordan: human('jordan', jordanParts(), JORDAN, 1.04),
  pigman: pig('pigman', pigmanParts(), PIGMAN),
  pigClub: pig('pigClub', pigClubParts(), PIG_CLUB, 1.06),
  pigThrower: pig('pigThrower', pigThrowerParts(), PIG_THROW, 0.9),
  bigboy: { id: 'bigboy', parts: bigBoyParts(), anims: BIGBOY_ANIMS, legLen: BIGBOY.legLen, scale: 1.3, height: 330, shadow: 260 },
  joanne: human('joanne', joanneParts(), JOANNE, 1.0),
  doggy: { id: 'doggy', parts: doggyParts(), anims: DOGGY, legLen: DOG_LEG, scale: 0.82, height: 110, shadow: 120 },
};

applyCustomArt(RIGS);

export type RigId = 'cannon' | 'lieu' | 'jordan' | 'pigman' | 'pigClub' | 'pigThrower' | 'bigboy' | 'joanne' | 'doggy';
