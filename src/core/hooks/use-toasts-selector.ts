import { useSyncExternalStore } from "react";

import type { ToastsStateAdapter } from "../types/toasts-state";

/**
 * Subscribes a component to a slice of an adapter's state.
 * `selector` must return a stable value for unchanged state, such as a stored reference or a primitive.
 */
export const useToastsSelector = <TValue, TSelected>(
  state: ToastsStateAdapter<TValue>,
  selector: (value: TValue) => TSelected,
) => {
  const getSnapshot = () => selector(state.getState());
  return useSyncExternalStore(state.subscribe, getSnapshot, getSnapshot);
};
