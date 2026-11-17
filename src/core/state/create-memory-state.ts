import type { ToastsStateAdapter } from "../types/toasts-state";

/** Dependency-free state, used when no adapter is given. */
export const createMemoryState = <TValue>(
  initial: TValue,
): ToastsStateAdapter<TValue> => {
  let state = initial;
  const listeners = new Set<() => void>();

  return {
    getState: () => state,
    setState: (next) => {
      if (Object.is(next, state)) return;
      state = next;
      listeners.forEach((listener) => listener());
    },
    subscribe: (listener) => {
      listeners.add(listener);
      return () => void listeners.delete(listener);
    },
  };
};
