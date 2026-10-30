# 0005 — Which provider renders the toasts

- **Status:** Accepted
- **Date:** 2026-10-30

## Context

Apps can mount more than one `Provider`, for example one at the root and one inside a modal, so toasts show above the modal. Exactly one of them must render the pool.

The previous implementation had three problems:

- It rendered `isActive ? <PoolRenderer>{children}</PoolRenderer> : children`. Whenever a provider became active or inactive, the element type above `children` changed, and React remounted the **whole app subtree**, losing its state.
- With an empty provider list, every provider considered itself active during the first render.
- The active provider depended on effect order, which runs children first.

## Decision

- **Fixed tree.** The provider always renders `<PoolRenderer active={…}>{children}</PoolRenderer>`. The renderer always renders `children` and only toggles the toast layer.
- **Selection.** The provider tracks its nesting depth through context. `selectActiveProviderId` (`src/core/utils/select-active-provider.ts`) picks the **deepest** provider and, among providers at the same depth, the **last mounted** one.
- **Registration** happens in a layout effect (`useIsomorphicLayoutEffect`), so the active provider is known before paint. There is no "empty list means everyone is active" fallback.

## Consequences

- Opening a modal that has its own provider moves the toasts into it without remounting anything. Closing it moves them back.
- Two sibling modals at the same depth: the one opened last wins.
- Custom `PoolRenderer` implementations must render `children` unconditionally and use `active` only for the toast layer. This is a breaking change from `0.0.x`.
