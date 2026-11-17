import { createToastsClient } from "@lapp-studio/react-toast-engine";
import { createPoolRenderer } from "@lapp-studio/react-toast-engine/native";
import { createZustandState } from "@lapp-studio/react-toast-engine/zustand";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useStore } from "zustand";

import { PoolInspector, type Scenario } from "../playground";
import { components } from "../toast";

const state = createZustandState();

export const zustand: Scenario = {
  id: "zustand",
  label: "Zustand state",
  client: createToastsClient({
    components,
    PoolRenderer: createPoolRenderer({ useInsets: useSafeAreaInsets }),
    storeSettings: { state },
  }),
  Inspector: () => <PoolInspector label="useStore(state.store)" pool={useStore(state.store)} />,
};
