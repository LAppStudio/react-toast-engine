import { createToastsClient } from "@lapp-studio/react-toast-engine";
import {
  createReduxState,
  SET_TOASTS_POOL,
  toastsReducer,
} from "@lapp-studio/react-toast-engine/redux";
import { PoolRenderer } from "@lapp-studio/react-toast-engine/web";
import { configureStore } from "@reduxjs/toolkit";
import { Provider, useSelector } from "react-redux";

import { Playground, PoolInspector } from "../playground";
import { components } from "../toast";

const appStore = configureStore({
  reducer: { toasts: toastsReducer },
  middleware: (getDefault) =>
    getDefault({
      serializableCheck: {
        ignoredActions: [SET_TOASTS_POOL],
        ignoredPaths: ["toasts"],
      },
    }),
});

type AppState = ReturnType<typeof appStore.getState>;

const { renderer, utilities } = createToastsClient({
  components,
  PoolRenderer,
  storeSettings: { state: createReduxState(appStore, (app: AppState) => app.toasts) },
});

const Inspector = () => {
  const toasts = useSelector((app: AppState) => app.toasts);
  return <PoolInspector label="useSelector((app) => app.toasts)" pool={toasts} />;
};

export const ReduxScenario = () => (
  <Provider store={appStore}>
    <renderer.Provider>
      <p>The toasts live in a Redux Toolkit store, under the `toasts` reducer.</p>
      <Playground utilities={utilities} />
      <Inspector />
    </renderer.Provider>
  </Provider>
);
