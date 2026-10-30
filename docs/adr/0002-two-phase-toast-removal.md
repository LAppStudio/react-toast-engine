# 0002 — Two-phase toast removal

- **Status:** Accepted
- **Date:** 2026-10-30

## Context

Reanimated has `exiting` layout animations and Motion has `AnimatePresence`, but `Animated` and plain DOM have no way to keep an element mounted after it leaves the React tree. If a toast left the pool as soon as it closed, half of the drivers could not animate its exit.

The callbacks also need a single place to fire. Otherwise each driver would decide when `onDismiss` or `onAutoClose` runs.

## Decision

A toast has a `status`: `"open"` or `"closing"`.

1. `close(id, reason)` marks the toast as `closing`, records the `closeReason` and fires the callback for the reason:
   - `"dismiss"` fires `onDismiss` (swipe, wheel, Escape or `actions.dismiss()`);
   - `"auto"` fires `onAutoClose` (the duration elapsed);
   - `"programmatic"` fires nothing (`helpers.close`, `pop`, `clear`, `poolLimit`).
2. The driver animates the exit and then calls `onExited`, which runs `finalize(id)` and removes the toast.

Safeguards:

- With no provider mounted, nothing can animate, so `close` removes the toast immediately.
- When the last provider unmounts, closing toasts are dropped.
- `remove(id)` still removes a toast immediately, without exit animation.
- Closing toasts keep their last stack index, so they leave from where they were.

## Consequences

- All four drivers animate exits the same way, and callbacks fire at the same moment in all of them, before the exit animation.
- `poolLimit` counts open toasts only. Going over the limit closes the oldest with an exit animation, instead of cutting the list.
- A driver that never calls `onExited` leaks closing toasts. The contract documents this, and the conformance suite checks that the pool empties.
