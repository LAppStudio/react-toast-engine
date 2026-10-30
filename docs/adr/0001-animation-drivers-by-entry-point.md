# 0001 — Animation drivers chosen by entry point

- **Status:** Accepted
- **Date:** 2026-10-30

## Context

The engine must run in any React app, web or mobile, and animate with whatever the app already uses:

- React Native: the built-in `Animated` API, or `react-native-reanimated` + `react-native-gesture-handler` when installed.
- Web: plain DOM APIs, or `motion` (Framer Motion) when installed.

Detecting the installed library at runtime (`try { require("react-native-reanimated") } catch {}`) does not work reliably:

- Vite, webpack and Rollup resolve imports at build time and fail on a missing package, even inside `try`.
- Metro accepts optional `require`, but Reanimated only works once its Babel plugin is configured, so "installed" does not mean "usable".
- Every driver would end up in every bundle, which defeats tree-shaking.

## Decision

Each driver gets its own entry point, and the import path is the choice:

| Entry point | Driver | Extra dependencies |
|---|---|---|
| `@lapp-studio/react-toast-engine/native` | `Animated` + `PanResponder` | none |
| `@lapp-studio/react-toast-engine/native/reanimated` | Reanimated 4 + Gesture Handler | `react-native-reanimated`, `react-native-gesture-handler`, `react-native-worklets` |
| `@lapp-studio/react-toast-engine/web` | Pointer Events + Web Animations | `react-dom` |
| `@lapp-studio/react-toast-engine/web/motion` | `motion` | `react-dom`, `motion` |

All platform packages are optional peer dependencies.

Drivers only animate. They implement one contract, `ToastItemDriverProps` (`src/core/types/toast-item-driver.ts`), and get everything else from the core:

- the timer (`useToastItem`);
- the dismissal rules (`resolveSwipeRelease`, `resolveWheelSwipe`);
- the shared styles (`getSwipeStyle`, `getStackLayout`);
- the spring constants (`SWIPE_SPRING`, `STACK_SPRING`).

Each entry point exports `PoolRenderer` (defaults) and `createPoolRenderer(options)`.

## Consequences

- An app bundles only the driver it imports. A web build never touches `react-native`, and the default native driver needs nothing beyond `react-native`.
- Switching drivers is a one-line import change. The client, components, hooks and callbacks stay the same.
- Behaviour stays aligned across drivers because the decisions live in the core. The web drivers share one conformance test suite.
- Custom drivers are possible: implement `ToastItemDriver` and pass it to `createNativePoolRenderer` or `createWebPoolRenderer`.
- Only Reanimated 4 is supported; Reanimated 3 has no `react-native-worklets`.
