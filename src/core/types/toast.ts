export type DefaultToastType = "info" | "error" | "success";

export type ToastStatus = "open" | "closing";

export type ToastCloseReason = "dismiss" | "auto" | "programmatic";

export type ToastAction<
  TType extends string = DefaultToastType,
  TData = unknown,
> = (toast: Toast<TType, TData>) => void;

export type ToastActions<
  TType extends string = DefaultToastType,
  TData = unknown,
> = {
  /** Called when the user dismisses the toast: swipe, Escape or `actions.dismiss()`. */
  onDismiss?: ToastAction<TType, TData>;
  /** Called when the toast closes because its duration elapsed. */
  onAutoClose?: ToastAction<TType, TData>;
  /** Called when the user taps or clicks the toast without swiping. */
  onPress?: ToastAction<TType, TData>;
};

export type Toast<TType extends string = DefaultToastType, TData = unknown> = {
  id: string;
  infoType: TType;
  title: string;
  description?: string;
  /** Time the toast stays open while in front, in ms. `Infinity` keeps it open. */
  durationInMs: number;
  data?: TData;
  actions?: ToastActions<TType, TData>;
  status: ToastStatus;
  closeReason?: ToastCloseReason;
  /** Incremented on every `update`, restarting the toast timer. */
  version: number;
};

export type NewToast<
  TType extends string = DefaultToastType,
  TData = unknown,
> = Pick<Toast<TType, TData>, "infoType" | "title"> &
  Partial<
    Pick<Toast<TType, TData>, "description" | "durationInMs" | "data" | "actions">
  >;

export type ToastPatch<
  TType extends string = DefaultToastType,
  TData = unknown,
> = Partial<NewToast<TType, TData>>;

export type ToastDefaults<
  TType extends string = DefaultToastType,
  TData = unknown,
> = Partial<
  Pick<NewToast<TType, TData>, "description" | "durationInMs" | "actions">
>;
