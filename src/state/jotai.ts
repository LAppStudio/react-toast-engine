import { atom, getDefaultStore, type PrimitiveAtom } from "jotai/vanilla";

import type { DefaultToastType } from "../core/types/toast";
import type { ToastsPool, ToastsPoolState } from "../core/types/toasts-state";

type JotaiStore = ReturnType<typeof getDefaultStore>;

export type JotaiStateOptions<TType extends string, TData> = {
  /** @default atom([]) */
  atom?: PrimitiveAtom<ToastsPool<TType, TData>>;
  /**
   * Store the atom is read from. Pass the one given to your `<Provider store>`.
   * @default getDefaultStore()
   */
  store?: JotaiStore;
};

export type JotaiToastsState<
  TType extends string = DefaultToastType,
  TData = unknown,
> = ToastsPoolState<TType, TData> & {
  atom: PrimitiveAtom<ToastsPool<TType, TData>>;
};

/** Keeps the pool in a Jotai atom, exposed as `atom` for `useAtomValue`. */
export const createJotaiState = <
  TType extends string = DefaultToastType,
  TData = unknown,
>({
  atom: poolAtom = atom<ToastsPool<TType, TData>>([]),
  store = getDefaultStore(),
}: JotaiStateOptions<TType, TData> = {}): JotaiToastsState<TType, TData> => ({
  atom: poolAtom,
  getState: () => store.get(poolAtom),
  setState: (next) => store.set(poolAtom, next),
  subscribe: (listener) => store.sub(poolAtom, listener),
});
