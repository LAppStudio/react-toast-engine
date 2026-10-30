import type { ElementType } from "react";

import type { DefaultToastType, ToastDefaults } from "./types/toast";
import type {
  ToastsComponentsByInfoType,
  ToastsPoolRendererProps,
  ToastsRendererContextValue,
} from "./types/toasts-renderer";
import type { ToastsStoreSettings } from "./types/toasts-store";
import { createToastsRenderer } from "./utils/create-toasts-renderer";
import { createToastsStore } from "./utils/create-toasts-store";
import { createToastsUtilities } from "./utils/create-toasts-utilities";

type Parameters<TType extends string, TData> = {
  components: ToastsComponentsByInfoType<TType, TData>;
  PoolRenderer: ElementType<ToastsPoolRendererProps>;
  storeSettings?: Omit<ToastsStoreSettings<TType, TData>, "defaults">;
  defaults?: ToastDefaults<TType, TData>;
};

export const createToastsClient = <
  TType extends string = DefaultToastType,
  TData = unknown,
>({
  components,
  PoolRenderer,
  storeSettings,
  defaults,
}: Parameters<TType, TData>) => {
  const store = createToastsStore<TType, TData>({ ...storeSettings, defaults });
  const utilities = createToastsUtilities({ store });
  const renderer = createToastsRenderer({
    components: components as unknown as ToastsRendererContextValue["components"],
    PoolRenderer,
    store: store as unknown as ToastsRendererContextValue["store"],
  });

  return { store, utilities, renderer };
};
