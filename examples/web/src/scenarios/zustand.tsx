import { createToastsClient, type ToastsPool } from "@lapp-studio/react-toast-engine";
import { PoolRenderer } from "@lapp-studio/react-toast-engine/web";
import { createZustandState } from "@lapp-studio/react-toast-engine/zustand";
import { createStore, useStore } from "zustand";

import { Playground, PoolInspector } from "../playground";
import { components } from "../toast";

type AppState = { toasts: ToastsPool };

const appStore = createStore<AppState>()(() => ({ toasts: [] }));

const { renderer, utilities } = createToastsClient({
  components,
  PoolRenderer,
  storeSettings: {
    state: createZustandState({
      store: appStore,
      select: (app) => app.toasts,
      update: (toasts) => ({ toasts }),
    }),
  },
});

export const ZustandScenario = () => {
  const toasts = useStore(appStore, (app) => app.toasts);

  return (
    <renderer.Provider>
      <p>The toasts live in the `toasts` slice of an app-owned Zustand store.</p>
      <Playground utilities={utilities} />
      <PoolInspector label="appStore.toasts" pool={toasts} />
    </renderer.Provider>
  );
};
