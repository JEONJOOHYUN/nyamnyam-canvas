import { Sway } from "../Appear";
import { Canopy } from "./Canopy";
import { Trunk } from "./Trunk";

// Small tree.
export function Stage3() {
  return (
    <Sway deg={1.5} duration={5}>
      <Trunk top={360} base={16} tip={10} />
      <Canopy
        blobs={[
          [400, 330, 52],
          [362, 352, 36],
          [438, 354, 36],
        ]}
      />
    </Sway>
  );
}
