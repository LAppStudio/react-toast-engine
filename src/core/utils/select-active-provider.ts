import type { ToastsProvider } from "../types/toasts-store";

/**
 * Picks the provider that renders the toasts: the deepest one and, among equals, the last mounted.
 * @see docs/adr/0005-active-provider-selection.md
 */
export const selectActiveProviderId = (providers: ToastsProvider[]) =>
  providers.reduce<ToastsProvider | undefined>(
    (active, provider) =>
      !active || provider.depth >= active.depth ? provider : active,
    undefined,
  )?.id;
