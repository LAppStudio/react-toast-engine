import { createContext, useContext } from "react";

import type { ToastsRendererContextValue } from "../types/toasts-renderer";

const RendererContext = createContext<ToastsRendererContextValue | null>(null);

export const RendererContextProvider = RendererContext.Provider;

export const useRendererContext = () => {
  const value = useContext(RendererContext);
  if (!value) {
    throw new Error("useRendererContext must be used inside a toasts Provider");
  }
  return value;
};

export const useProviderDepth = () => useContext(RendererContext)?.depth ?? 0;
