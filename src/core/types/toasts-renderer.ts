import type { ElementType, ReactNode } from "react";

import type { DefaultToastType } from "./toast";
import type { ToastComponentProps } from "./toast-component";
import type { ToastsStoreHook } from "./toasts-store";

export type ToastsComponentsByInfoType<
  TType extends string = DefaultToastType,
  TData = unknown,
> = Record<TType, ElementType<ToastComponentProps<TType, TData>>>;

export type ToastsRendererContextValue = {
  store: ToastsStoreHook<string, unknown>;
  components: ToastsComponentsByInfoType<string, unknown>;
  depth: number;
};

export type ToastsPoolRendererProps = {
  children: ReactNode;
  /** Whether this provider is the one that renders the toasts. */
  active: boolean;
};

export type ToastsProviderProps = {
  children: ReactNode;
};
