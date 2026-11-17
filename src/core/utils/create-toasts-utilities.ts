import { useToastsSelector } from "../hooks/use-toasts-selector";
import type { DefaultToastType, NewToast, ToastPatch } from "../types/toast";
import type { ToastsStore } from "../types/toasts-store";

type Parameters<TType extends string, TData> = {
  store: ToastsStore<TType, TData>;
};

const getHelpers = <TType extends string, TData>(
  store: ToastsStore<TType, TData>,
) => ({
  stack: (toast: NewToast<TType, TData>) => store.stack(toast),
  update: (toastId: string, patch: ToastPatch<TType, TData>) =>
    store.update(toastId, patch),
  close: (toastId: string) => store.close(toastId),
  remove: (toastId: string) => store.remove(toastId),
  pop: () => store.pop(),
  clear: () => store.clear(),
});

export const createToastsUtilities = <
  TType extends string = DefaultToastType,
  TData = unknown,
>({
  store,
}: Parameters<TType, TData>) => {
  const helpers = getHelpers(store);

  const hooks = {
    useStackToast: () => helpers.stack,
    useUpdateToast: () => helpers.update,
    useCloseToast: () => helpers.close,
    useRemoveToast: () => helpers.remove,
    useToastsPool: () => useToastsSelector(store.pool, (pool) => pool),
  };

  return { hooks, helpers };
};
