import type { DefaultToastType, NewToast, ToastPatch } from "../types/toast";
import type { ToastsStoreHook } from "../types/toasts-store";

type Parameters<TType extends string, TData> = {
  store: ToastsStoreHook<TType, TData>;
};

const getHelpers = <TType extends string, TData>(
  store: ToastsStoreHook<TType, TData>,
) => ({
  stack: (toast: NewToast<TType, TData>) => store.getState().stack(toast),
  update: (toastId: string, patch: ToastPatch<TType, TData>) =>
    store.getState().update(toastId, patch),
  close: (toastId: string) => store.getState().close(toastId),
  remove: (toastId: string) => store.getState().remove(toastId),
  pop: () => store.getState().pop(),
  clear: () => store.getState().clear(),
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
    useToastsPool: () => store((state) => state.pool),
  };

  return { hooks, helpers };
};
