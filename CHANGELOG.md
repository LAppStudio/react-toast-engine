# Changelog

## Unreleased

### Breaking

- `/native` now uses React Native's `Animated`; the Reanimated driver moved to `/native/reanimated`.
- `react-native-safe-area-context` is no longer required; pass `useInsets` to `createPoolRenderer`.
- `PoolRenderer` receives `active` and must always render `children`.
- `pop()` closes the oldest open toast.
- `remove()` is immediate; the new `close()` animates the exit.
- `ToastInfoType` enum removed in favour of `createToastsClient<TType, TData>`.
- Toast components receive `actions.dismiss()`; callbacks moved to the toast's `actions`.

### Added

- Web drivers: `/web` (vanilla) and `/web/motion` (Motion).
- Horizontal wheel and trackpad dismissal on the web.
- Dismissal decided by intent at release: stopping, moving slowly or heading back cancels it.
- 1:1 gesture tracking with velocity handoff and interruptible springs, shared by every driver.
- `onAutoClose` callback, `update()`, `clear()` and `defaults`.
- `stack()` returns the toast id.
- Custom toast types and data through generics.
- Pause on hover, focus and touch; Escape to dismiss; `aria-live` region; reduced-motion support.
- `createPoolRenderer(options)` with position, offsets, stack and swipe settings.

### Fixed

- `poolLimit` dropped almost every toast once the limit was reached.
- `pop()` kept only the first toast.
- Mounting a second provider remounted the whole app subtree.
- `onPress` and `onDismiss` never fired.
- Swipe dismissal relied on a ref shared across worklets.
- The toast lagged behind the finger while dragging.
- Peer range `react ~19.0.0` conflicted with React Native 0.83.
- Peer range `ˆ5.6.0` used a non-ASCII caret.
- React Native packages were required peers in web projects.
