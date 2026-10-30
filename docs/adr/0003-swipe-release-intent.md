# 0003 — Swipe dismissal decided by intent at release

- **Status:** Accepted
- **Date:** 2026-10-30

## Context

The user must be able to give up on a dismissal mid-gesture: by stopping, by moving slowly, or by heading back. A rule like "past 40% of the width dismisses" makes that impossible once the threshold is crossed.

Platform velocities are not reliable for detecting a stop. On iOS and Android, holding the finger still and then lifting it can still report the velocity of the last movement. PanResponder's `vx` only looks at the last two moves, and Motion's pan velocity is measured relative to the last point, not to the release time.

## Decision

Distance alone never dismisses. `resolveSwipeRelease` (`src/core/gestures/swipe-release.ts`) dismisses only when **all** of these hold at release:

1. The gesture is still moving. Time since the last real movement (`idleMs`, movement > 0.5px) is at most `stopMs` (80ms); otherwise velocity counts as 0.
2. It is moving **away** from the origin: the velocity has the same sign as the offset.
3. It is fast: `|velocity| ≥ minVelocity` (500 px/s).
4. It travelled at least `minDistanceRatio` of the width (10%), which filters out jittery taps.
5. The direction is allowed (`direction`).

`getReleaseVelocity` applies the same `stopMs` rule to the velocity handed to the release spring. A held pointer then springs back calmly instead of being thrown by stale velocity.

Velocity comes from `createVelocityTracker` (`src/core/gestures/velocity-tracker.ts`), used by the `Animated`, vanilla and Motion drivers. It works as follows:

- It averages over a 100ms window measured from the release time, so holding still reads as 0.
- It restarts the window when the direction reverses, so "went out and came back" reads as moving back, even when the reversal took only a couple of frames.

The Reanimated driver uses Gesture Handler's velocity plus its own `idleMs`, because the tracker would have to run on the UI thread.

## Consequences

| Gesture at release | Result |
|---|---|
| Fast fling outwards | dismiss |
| Dragged far, stopped, released | spring back |
| Dragged far slowly | spring back |
| Went out, came back, released | spring back |
| Tiny fast flick | spring back |

All values are configurable through `SwipeDismissConfig`. Wheel input has no release; see [0004](0004-wheel-swipe-dismiss.md).
