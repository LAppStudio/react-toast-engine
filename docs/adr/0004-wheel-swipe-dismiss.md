# 0004 — Horizontal wheel and trackpad dismissal

- **Status:** Accepted
- **Date:** 2026-10-30

## Context

On the web, toasts must also follow horizontal scrolling (two-finger trackpad swipe, Shift + mouse wheel). Wheel input differs from a pointer drag in three ways:

- There is no "release" event, only a stream of `wheel` events that eventually stops.
- After the fingers lift, macOS keeps sending decaying events (momentum). A fling therefore ends with near-zero velocity, just like a slow stop.
- An unhandled horizontal swipe on macOS can trigger the browser's back navigation.

The release rule from [0003](0003-swipe-release-intent.md) cannot be applied as-is: at the end of the stream, velocity is always about 0.

## Decision

`useWheelSwipe` (`src/web/shared/use-wheel-swipe.ts`) handles the stream as follows:

1. It only acts when `|deltaX| > |deltaY|`, so vertical scrolling passes through. It normalizes `deltaMode` to pixels, and treats Shift + vertical wheel as horizontal.
2. It calls `preventDefault()` on handled events, through a listener registered with `{ passive: false }`. React's `onWheel` is passive and cannot do this. This is what prevents back navigation; `overscroll-behavior` does not apply, because the toast is not a scroll container.
3. It moves the toast 1:1 with the scroll, including momentum events.
4. On every event, `resolveWheelSwipe` dismisses **mid-gesture** when the offset reaches `wheelDistanceRatio` (40%) while moving outwards at `minVelocity` or faster. The toast leaves with the current velocity.
5. After `wheelIdleMs` (120ms) without events, the gesture counts as released and the toast springs back with zero velocity.

## Consequences

- A fling with momentum dismisses naturally. Slow scrolling, stopping before 40% or scrolling back cancel the dismissal.
- A fast and long wheel gesture dismisses as soon as it crosses 40%, with no chance to stop at the end. This is inherent to wheel input and was accepted explicitly; pointer and touch gestures keep the full release-time rule.
- The toast captures horizontal wheel events while hovered, which is expected since toasts have no horizontal scrolling.
