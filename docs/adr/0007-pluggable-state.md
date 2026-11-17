# 0007 — Pluggable state

- **Status:** Accepted
- **Date:** 2026-10-30

## Context

The store was built with Zustand, so every app had to install it, even apps that already manage state with Jotai, Redux or nothing at all. The engine used only a small part of Zustand: read the state, replace it, subscribe to changes and select a slice from a component.

## Decision

- **Contract.** `ToastsStateAdapter<TValue>` (`src/core/types/toasts-state.ts`) has three functions: `getState`, `setState(next)` and `subscribe(listener)`. `setState` receives the whole new value, so adapters for libraries that update through actions, such as Redux, only need to dispatch it.
- **Built-in default.** `createMemoryState` keeps the value in a closure with a listener set. With no `state` option the engine has no state dependency.
- **Components** read through `useToastsSelector`, built on React's `useSyncExternalStore`, which works the same with every adapter and on React Native.
- **Only the pool is pluggable.** The list of mounted providers is internal bookkeeping and always stays in memory, so it never shows up in the app's store or devtools.
- **Adapters by entry point**, as with the animation drivers ([0001](0001-animation-drivers-by-entry-point.md)): `/zustand`, `/jotai` and `/redux`. Each library is an optional peer dependency, imported only by its entry. `/redux` imports nothing and accepts any store with `getState`, `dispatch` and `subscribe`, so it works with plain Redux and Redux Toolkit.
- **React Context alone is not an option** for the pool. `helpers.stack()` must work outside components, and a context value changing on every toast would re-render the whole tree under the Provider. The Provider still uses context, but only to hand the store to the drivers.

## Consequences

- `zustand` is no longer required. Apps that want toasts in their own store pass `storeSettings.state`.
- `client.store` is no longer a Zustand hook. Actions are called directly (`store.stack(…)`), and the pool is read with `store.pool.getState()` or `utilities.hooks.useToastsPool()`. This is a breaking change from `0.1.0`.
- Toasts hold callbacks in `actions`, which are not serializable. Redux Toolkit's serializable check must ignore `SET_TOASTS_POOL` and the slice path.
- With custom toast types, adapters take the type as a generic (`createJotaiState<AppToast>()`), because TypeScript does not infer it from the client.
- Any other library can be used by implementing the three functions.
