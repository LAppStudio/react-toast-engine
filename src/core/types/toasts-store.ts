import type {
  DefaultToastType,
  NewToast,
  ToastCloseReason,
  ToastDefaults,
  ToastPatch,
} from "./toast";
import type { ToastsPoolState, ToastsStateAdapter } from "./toasts-state";

export type ToastsProvider = {
  id: string;
  depth: number;
};

export type ToastsStore<
  TType extends string = DefaultToastType,
  TData = unknown,
> = {
  /** The toasts, in the adapter given as `state`. */
  pool: ToastsPoolState<TType, TData>;
  /** Mounted Providers. Internal bookkeeping, always kept in memory. */
  providers: ToastsStateAdapter<ToastsProvider[]>;

  /** Adds a toast and returns its id. Closes the oldest open toasts beyond `poolLimit`. */
  stack: (toast: NewToast<TType, TData>) => string;
  /** Changes an open toast and restarts its timer. */
  update: (toastId: string, patch: ToastPatch<TType, TData>) => void;
  /** Starts the exit of an open toast. It leaves the pool on `finalize`. */
  close: (toastId: string, reason?: ToastCloseReason) => void;
  /** Removes a closing toast once its exit animation ends. */
  finalize: (toastId: string) => void;
  /** Removes a toast immediately, without exit animation. */
  remove: (toastId: string) => void;
  /** Closes the oldest open toast. */
  pop: () => void;
  /** Closes every open toast. */
  clear: () => void;

  addProvider: (provider: ToastsProvider) => void;
  removeProvider: (providerId: string) => void;
};

export type ToastsStoreSettings<
  TType extends string = DefaultToastType,
  TData = unknown,
> = {
  /**
   * Maximum number of open toasts.
   * @default 10
   */
  poolLimit?: number;
  defaults?: ToastDefaults<TType, TData>;
  /**
   * Where the pool lives: an adapter from `/zustand`, `/jotai`, `/redux`, or your own.
   * @default createMemoryState([])
   */
  state?: ToastsPoolState<TType, TData>;
};
