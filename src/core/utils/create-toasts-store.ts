import { createMemoryState } from "../state/create-memory-state";
import type { DefaultToastType, Toast, ToastCloseReason } from "../types/toast";
import type { ToastsPool } from "../types/toasts-state";
import type {
  ToastsProvider,
  ToastsStore,
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
  state = createMemoryState<ToastsPool<TType, TData>>([]),
}: ToastsStoreSettings<TType, TData> = {}): ToastsStore<TType, TData> => {
  const limit = Math.max(1, poolLimit);
  const providers = createMemoryState<ToastsProvider[]>([]);

  const setPool = (
    change: (pool: ToastsPool<TType, TData>) => ToastsPool<TType, TData>,
  ) => state.setState(change(state.getState()));

  const close = (toastId: string, reason: ToastCloseReason = "programmatic") => {
    const toast = state
      .getState()
      .find(({ id, status }) => id === toastId && status === "open");
    if (!toast) return;
    const closing: Toast<TType, TData> = {
      ...toast,
      status: "closing",
      closeReason: reason,
    };
    setPool((pool) =>
      providers.getState().length === 0
        ? pool.filter(({ id }) => id !== toastId)
        : pool.map((item) => (item.id === toastId ? closing : item)),
    );
    notifyClose(closing, reason);
  };

  return {
    pool: state,
    providers,

    stack: (toast) => {
      const id = createToastId();
      const open = state.getState().filter(({ status }) => status === "open");
      open
        .slice(0, Math.max(0, open.length - limit + 1))
        .forEach((item) => close(item.id));
      setPool((pool) => [
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
      ]);
      return id;
    },

    update: (toastId, patch) =>
      setPool((pool) =>
        pool.map((toast) =>
          toast.id === toastId && toast.status === "open"
            ? {
                ...toast,
                ...patch,
                actions: { ...toast.actions, ...patch.actions },
                version: toast.version + 1,
              }
            : toast,
        ),
      ),

    close,

    finalize: (toastId) =>
      setPool((pool) =>
        pool.filter(({ id, status }) => id !== toastId || status !== "closing"),
      ),

    remove: (toastId) =>
      setPool((pool) => pool.filter(({ id }) => id !== toastId)),

    pop: () => {
      const oldest = state.getState().find(({ status }) => status === "open");
      if (oldest) close(oldest.id);
    },

    clear: () =>
      state
        .getState()
        .filter(({ status }) => status === "open")
        .forEach(({ id }) => close(id)),

    addProvider: (provider) =>
      providers.setState([
        ...providers.getState().filter(({ id }) => id !== provider.id),
        provider,
      ]),

    removeProvider: (providerId) => {
      const remaining = providers
        .getState()
        .filter(({ id }) => id !== providerId);
      providers.setState(remaining);
      if (remaining.length === 0) {
        setPool((pool) => pool.filter(({ status }) => status === "open"));
      }
    },
  };
};
