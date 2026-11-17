import { createToastsClient } from "@lapp-studio/react-toast-engine";
import { createPoolRenderer } from "@lapp-studio/react-toast-engine/web/motion";

import { Playground } from "../playground";
import { components } from "../toast";

const { renderer, utilities } = createToastsClient({
  components,
  PoolRenderer: createPoolRenderer({ position: "top" }),
});

export const MotionScenario = () => (
  <renderer.Provider>
    <p>Motion driver, rendered at the top of the screen.</p>
    <Playground utilities={utilities} />
  </renderer.Provider>
);
