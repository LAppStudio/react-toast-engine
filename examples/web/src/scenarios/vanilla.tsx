import { createToastsClient } from "@lapp-studio/react-toast-engine";
import { PoolRenderer } from "@lapp-studio/react-toast-engine/web";

import { Playground } from "../playground";
import { components } from "../toast";

const { renderer, utilities } = createToastsClient({
  components,
  PoolRenderer,
  storeSettings: { poolLimit: 5 },
});

export const VanillaScenario = () => (
  <renderer.Provider>
    <p>
      Default web driver: Pointer Events, CSS transitions and the built-in store. Drag a
      toast sideways or scroll horizontally over it to dismiss.
    </p>
    <Playground utilities={utilities} />
  </renderer.Provider>
);
