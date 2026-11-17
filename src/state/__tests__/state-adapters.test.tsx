import { configureStore } from "@reduxjs/toolkit";
import { act, cleanup, render, screen } from "@testing-library/react";
import { atom, createStore as createJotaiStore } from "jotai/vanilla";
import { afterEach, describe, expect, it, vi } from "vitest";
import { createStore as createZustandStore } from "zustand/vanilla";

import { createToastsClient } from "../../core/create-toasts-client";
import { createMemoryState } from "../../core/state/create-memory-state";
import type { ToastComponentProps } from "../../core/types/toast-component";
import type { ToastsPoolRendererProps } from "../../core/types/toasts-renderer";
import type { ToastsPool, ToastsPoolState } from "../../core/types/toasts-state";
import { createJotaiState } from "../jotai";
import { createReduxState, SET_TOASTS_POOL, toastsReducer } from "../redux";
import { createZustandState } from "../zustand";

type AppType = "info" | "warning";

const Title = ({ toast }: ToastComponentProps<AppType>) => <p>{toast.title}</p>;

const createClient = (state: ToastsPoolState<AppType>) => {
  const Pool = () =>
    client.utilities.hooks
      .useToastsPool()
      .map((toast) => <p key={toast.id}>{toast.title}</p>);
  const PoolRenderer = ({ children, active }: ToastsPoolRendererProps) => (
    <>
      {children}
      {active && <Pool />}
    </>
  );
  const client = createToastsClient({
    components: { info: Title, warning: Title },
    PoolRenderer,
    storeSettings: { state },
  });
  return client;
};

const createReduxStore = () =>
  configureStore({
    reducer: { toasts: toastsReducer<AppType>, other: (value = 0) => value },
    middleware: (getDefault) =>
      getDefault({
        serializableCheck: {
          ignoredActions: [SET_TOASTS_POOL],
          ignoredPaths: ["toasts"],
        },
      }),
  });

const zustandSlice = () => {
  const store = createZustandStore<{ toasts: ToastsPool<AppType>; count: number }>()(
    () => ({ toasts: [], count: 1 }),
  );
  return {
    state: createZustandState({
      store,
      select: (value) => value.toasts,
      update: (toasts) => ({ toasts }),
    }),
    check: () => expect(store.getState().count).toBe(1),
  };
};

const adapters: [string, () => { state: ToastsPoolState<AppType>; check?: () => void }][] = [
  ["memory", () => ({ state: createMemoryState<ToastsPool<AppType>>([]) })],
  ["zustand", () => ({ state: createZustandState<AppType>() })],
  ["zustand slice", zustandSlice],
  ["jotai", () => ({ state: createJotaiState<AppType>({ store: createJotaiStore() }) })],
  [
    "redux",
    () => {
      const store = createReduxStore();
      return {
        state: createReduxState(store, (value) => value.toasts),
        check: () => expect(store.getState().other).toBe(0),
      };
    },
  ],
];

afterEach(cleanup);

describe.each(adapters)("%s state", (_, setup) => {
  it("stacks, updates and closes toasts through the adapter", () => {
    const { state, check } = setup();
    const { renderer, utilities } = createClient(state);
    const { Provider } = renderer;
    render(<Provider>app</Provider>);

    let id = "";
    act(() => {
      id = utilities.helpers.stack({ infoType: "warning", title: "saving" });
    });
    expect(screen.getByText("saving")).toBeTruthy();
    expect(state.getState()).toMatchObject([{ id, status: "open" }]);

    act(() => utilities.helpers.update(id, { title: "saved" }));
    expect(screen.getByText("saved")).toBeTruthy();

    act(() => utilities.helpers.remove(id));
    expect(screen.queryByText("saved")).toBeNull();
    expect(state.getState()).toEqual([]);
    check?.();
  });

  it("notifies subscribers once per change", () => {
    const { state } = setup();
    const { store } = createClient(state);
    const listener = vi.fn();
    const unsubscribe = state.subscribe(listener);
    store.stack({ infoType: "info", title: "a" });
    expect(listener).toHaveBeenCalledTimes(1);
    unsubscribe();
    store.stack({ infoType: "info", title: "b" });
    expect(listener).toHaveBeenCalledTimes(1);
  });
});

describe("createJotaiState", () => {
  it("exposes the atom it writes to", () => {
    const store = createJotaiStore();
    const poolAtom = atom<ToastsPool<AppType>>([]);
    const state = createJotaiState({ atom: poolAtom, store });
    createClient(state).store.stack({ infoType: "info", title: "a" });
    expect(state.atom).toBe(poolAtom);
    expect(store.get(poolAtom)).toHaveLength(1);
  });
});
