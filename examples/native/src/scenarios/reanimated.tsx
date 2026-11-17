import { createToastsClient } from "@lapp-studio/react-toast-engine";
import { createPoolRenderer } from "@lapp-studio/react-toast-engine/native/reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import type { Scenario } from "../playground";
import { components } from "../toast";

export const reanimated: Scenario = {
  id: "reanimated",
  label: "Reanimated driver",
  client: createToastsClient({
    components,
    PoolRenderer: createPoolRenderer({ position: "bottom", useInsets: useSafeAreaInsets }),
  }),
};
