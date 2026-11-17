import { type ElementType, useId, useMemo } from "react";

import { useToastsSelector } from "../hooks/use-toasts-selector";
import {
  RendererContextProvider,
  useProviderDepth,
} from "../providers/renderer-context";
import type {
  ToastsPoolRendererProps,
  ToastsProviderProps,
  ToastsRendererContextValue,
} from "../types/toasts-renderer";
import { selectActiveProviderId } from "./select-active-provider";
import { useIsomorphicLayoutEffect } from "./use-isomorphic-layout-effect";

type Parameters = Pick<ToastsRendererContextValue, "store" | "components"> & {
  PoolRenderer: ElementType<ToastsPoolRendererProps>;
};

export const createToastsRenderer = ({
  components,
  PoolRenderer,
  store,
}: Parameters) => {
  const Provider = ({ children }: ToastsProviderProps) => {
    const id = useId();
    const depth = useProviderDepth() + 1;
    const active = useToastsSelector(
      store.providers,
      (providers) => selectActiveProviderId(providers) === id,
    );

    useIsomorphicLayoutEffect(() => {
      store.addProvider({ id, depth });
      return () => store.removeProvider(id);
    }, [id, depth]);

    const value = useMemo(() => ({ store, components, depth }), [depth]);

    return (
      <RendererContextProvider value={value}>
        <PoolRenderer active={active}>{children}</PoolRenderer>
      </RendererContextProvider>
    );
  };

  return { Provider };
};
