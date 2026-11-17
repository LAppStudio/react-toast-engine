import { createToastsClient } from "@lapp-studio/react-toast-engine";
import { createPoolRenderer } from "@lapp-studio/react-toast-engine/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import type { Scenario } from "../playground";
import { components } from "../toast";

export const animated: Scenario = {
  id: "animated",
  label: "Animated driver",
  client: createToastsClient({
    components,
    PoolRenderer: createPoolRenderer({ useInsets: useSafeAreaInsets }),
    storeSettings: { poolLimit: 5 },
  }),
};
