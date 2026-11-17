import { createStore, type StoreApi } from "zustand/vanilla";

import type { DefaultToastType } from "../core/types/toast";
import type { ToastsPool, ToastsPoolState } from "../core/types/toasts-state";

export type ZustandSliceOptions<TState, TType extends string, TData> = {
  store: StoreApi<TState>;
  select: (state: TState) => ToastsPool<TType, TData>;
  /** Returns the partial state that stores `pool`, merged by `setState`. */
  update: (pool: ToastsPool<TType, TData>) => Partial<TState>;
};

export type ZustandToastsState<
  TType extends string = DefaultToastType,
  TData = unknown,
> = ToastsPoolState<TType, TData> & {
  store: StoreApi<ToastsPool<TType, TData>>;
};

const createOwnState = <TType extends string, TData>(): ZustandToastsState<
  TType,
  TData
> => {
  const store = createStore<ToastsPool<TType, TData>>()(() => []);
  return {
    store,
    getState: store.getState,
    setState: (next) => store.setState(next, true),
    subscribe: (listener) => store.subscribe(listener),
  };
};

/** Keeps the pool in a new Zustand store, exposed as `store`. */
export function createZustandState<
  TType extends string = DefaultToastType,
  TData = unknown,
>(): ZustandToastsState<TType, TData>;
/** Keeps the pool in a slice of an existing Zustand store. */
export function createZustandState<
  TState,
  TType extends string = DefaultToastType,
  TData = unknown,
>(options: ZustandSliceOptions<TState, TType, TData>): ToastsPoolState<TType, TData>;
export function createZustandState<TState, TType extends string, TData>(
  options?: ZustandSliceOptions<TState, TType, TData>,
): ToastsPoolState<TType, TData> {
  if (!options) return createOwnState<TType, TData>();
  const { store, select, update } = options;
  return {
    getState: () => select(store.getState()),
    setState: (next) => store.setState(update(next)),
    subscribe: (listener) => store.subscribe(listener),
  };
}
