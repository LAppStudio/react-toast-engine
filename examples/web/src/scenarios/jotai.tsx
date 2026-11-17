import { createToastsClient } from "@lapp-studio/react-toast-engine";
import { createJotaiState } from "@lapp-studio/react-toast-engine/jotai";
import { PoolRenderer } from "@lapp-studio/react-toast-engine/web";
import { useAtomValue } from "jotai";

import { Playground, PoolInspector } from "../playground";
import { components } from "../toast";

const state = createJotaiState();

const { renderer, utilities } = createToastsClient({
  components,
  PoolRenderer,
  storeSettings: { state },
});

export const JotaiScenario = () => {
  const toasts = useAtomValue(state.atom);

  return (
    <renderer.Provider>
      <p>The toasts live in a Jotai atom, read here with `useAtomValue`.</p>
      <Playground utilities={utilities} />
      <PoolInspector label="useAtomValue(state.atom)" pool={toasts} />
    </renderer.Provider>
  );
};
