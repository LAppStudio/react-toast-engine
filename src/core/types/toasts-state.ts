import type { DefaultToastType, Toast } from "./toast";

/**
 * Where a piece of toast state lives. The built-in store, Zustand, Jotai and Redux
 * each implement it; any other state library can too.
 * @see docs/adr/0007-pluggable-state.md
 */
export type ToastsStateAdapter<TValue> = {
  getState: () => TValue;
  /** Replaces the value. Called with a new reference on every change. */
  setState: (next: TValue) => void;
  /** Calls `listener` after every change and returns the unsubscribe function. */
  subscribe: (listener: () => void) => () => void;
};

export type ToastsPool<
  TType extends string = DefaultToastType,
  TData = unknown,
> = Toast<TType, TData>[];

export type ToastsPoolState<
  TType extends string = DefaultToastType,
  TData = unknown,
> = ToastsStateAdapter<ToastsPool<TType, TData>>;
