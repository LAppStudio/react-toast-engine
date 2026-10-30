import type { DefaultToastType, Toast } from "./toast";

export type ToastComponentActions = {
  /** Dismisses the toast as if the user swiped it away, calling `onDismiss`. */
  dismiss: () => void;
};

export type ToastComponentProps<
  TType extends string = DefaultToastType,
  TData = unknown,
> = {
  toast: Toast<TType, TData>;
  actions: ToastComponentActions;
};
