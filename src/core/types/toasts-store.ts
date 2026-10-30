import type { StoreApi, UseBoundStore } from "zustand";

import type {
  DefaultToastType,
  NewToast,
  Toast,
  ToastCloseReason,
  ToastDefaults,
  ToastPatch,
} from "./toast";

export type ToastsProvider = {
  id: string;
  depth: number;
};

export type ToastsStore<
  TType extends string = DefaultToastType,
  TData = unknown,
> = {
  pool: Toast<TType, TData>[];
  providers: ToastsProvider[];

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
};

export type ToastsStoreHook<
  TType extends string = DefaultToastType,
  TData = unknown,
> = UseBoundStore<StoreApi<ToastsStore<TType, TData>>>;
