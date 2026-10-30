import { create } from "zustand";

import type { DefaultToastType, Toast, ToastCloseReason } from "../types/toast";
import type {
  ToastsStore,
  ToastsStoreHook,
  ToastsStoreSettings,
} from "../types/toasts-store";
import { createToastId } from "./create-toast-id";

const DEFAULT_POOL_LIMIT = 10;
const DEFAULT_DURATION_IN_MS = 4000;

const notifyClose = <TType extends string, TData>(
  toast: Toast<TType, TData>,
  reason: ToastCloseReason,
) => {
  if (reason === "dismiss") toast.actions?.onDismiss?.(toast);
  if (reason === "auto") toast.actions?.onAutoClose?.(toast);
};

export const createToastsStore = <
  TType extends string = DefaultToastType,
  TData = unknown,
>({
  poolLimit = DEFAULT_POOL_LIMIT,
  defaults = {},
}: ToastsStoreSettings<TType, TData> = {}): ToastsStoreHook<TType, TData> =>
  create<ToastsStore<TType, TData>>((set, get) => {
    const limit = Math.max(1, poolLimit);

    const close = (toastId: string, reason: ToastCloseReason = "programmatic") => {
      const toast = get().pool.find(
        ({ id, status }) => id === toastId && status === "open",
      );
      if (!toast) return;
      const closing: Toast<TType, TData> = {
        ...toast,
        status: "closing",
        closeReason: reason,
      };
      set(({ pool, providers }) => ({
        pool:
          providers.length === 0
            ? pool.filter(({ id }) => id !== toastId)
            : pool.map((item) => (item.id === toastId ? closing : item)),
      }));
      notifyClose(closing, reason);
    };

    return {
      pool: [],
      providers: [],

      stack: (toast) => {
        const id = createToastId();
        const open = get().pool.filter(({ status }) => status === "open");
        open
          .slice(0, Math.max(0, open.length - limit + 1))
          .forEach((item) => close(item.id));
        set(({ pool }) => ({
          pool: [
            ...pool,
            {
              durationInMs: DEFAULT_DURATION_IN_MS,
              ...defaults,
              ...toast,
              actions: { ...defaults.actions, ...toast.actions },
              id,
              status: "open",
              version: 0,
            },
          ],
        }));
        return id;
      },

      update: (toastId, patch) =>
        set(({ pool }) => ({
          pool: pool.map((toast) =>
            toast.id === toastId && toast.status === "open"
              ? {
                  ...toast,
                  ...patch,
                  actions: { ...toast.actions, ...patch.actions },
                  version: toast.version + 1,
                }
              : toast,
          ),
        })),

      close,

      finalize: (toastId) =>
        set(({ pool }) => ({
          pool: pool.filter(
            ({ id, status }) => id !== toastId || status !== "closing",
          ),
        })),

      remove: (toastId) =>
        set(({ pool }) => ({ pool: pool.filter(({ id }) => id !== toastId) })),

      pop: () => {
        const oldest = get().pool.find(({ status }) => status === "open");
        if (oldest) close(oldest.id);
      },

      clear: () =>
        get()
          .pool.filter(({ status }) => status === "open")
          .forEach(({ id }) => close(id)),

      addProvider: (provider) =>
        set(({ providers }) => ({
          providers: [
            ...providers.filter(({ id }) => id !== provider.id),
            provider,
          ],
        })),

      removeProvider: (providerId) =>
        set(({ pool, providers }) => {
          const remaining = providers.filter(({ id }) => id !== providerId);
          return {
            providers: remaining,
            pool:
              remaining.length === 0
                ? pool.filter(({ status }) => status === "open")
                : pool,
          };
        }),
    };
  });
