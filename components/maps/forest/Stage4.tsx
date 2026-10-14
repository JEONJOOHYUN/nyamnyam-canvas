import { Sway } from "../Appear";
import { Canopy } from "./Canopy";
import { forest } from "./palette";
import { Trunk } from "./Trunk";

// Big tree. Flowers and fruit in later stages sit inside these blobs.
const BIG_CANOPY: [number, number, number][] = [
  [400, 215, 92],
  [318, 262, 68],
  [482, 262, 68],
  [356, 178, 58],
  [446, 172, 60],
  [400, 292, 66],
];

export function Stage4() {
  return (
    <Sway deg={1.2} duration={6}>
      <Trunk top={250} base={30} tip={17} />
      <path
        d="M392 330 Q 360 312 345 290"
        stroke={forest.wood}
        strokeWidth="12"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M410 310 Q 440 292 452 268"
        stroke={forest.wood}
        strokeWidth="10"
        strokeLinecap="round"
        fill="none"
      />
      <Canopy blobs={BIG_CANOPY} />
    </Sway>
  );
}
