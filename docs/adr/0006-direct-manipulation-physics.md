# 0006 — Direct manipulation physics

- **Status:** Accepted
- **Date:** 2026-10-30

## Context

Interaction animations must follow the gesture. The toast should feel held by the finger, pointer or trackpad, and continue naturally when released. It should feel the same with all four drivers.

The previous native implementation wrapped the stack transform in `withSpring` inside `useAnimatedStyle`, which restarted the spring every frame of the pan and made the toast lag behind the finger.

## Decision

**During the gesture, movement is 1:1 with no animation**

- The raw offset `x` comes straight from the gesture: `translationX`, `dx`, pointer delta or wheel delta.
- The rendered style is derived from it by `getSwipeStyle` (`src/core/gestures/swipe-style.ts`), which is a pure worklet:
  - translation is identical to `x` in allowed directions, and has 0.2× elastic resistance towards a blocked direction;
  - opacity fades subtly (1 → 0.7 at 40% of the width, 0.5 at 100%), so a far drag does not look like it is already leaving, because releasing slowly cancels ([0003](0003-swipe-release-intent.md)); it reaches 0 at the exit target (120%).
- `getSwipeInterpolation` exposes the same ranges for `Animated.Value#interpolate`, so the native-driver path matches the worklet path.
- Web drivers write the transform directly (`transition: none`), without a React render per frame.

**On release, velocity is handed over**

- Both the dismissal and the spring back start with the gesture's velocity (zeroed after a stop, see [0003](0003-swipe-release-intent.md)).
- Every driver uses the same constants, `SWIPE_SPRING = { stiffness: 400, damping: 36, mass: 1 }` and `STACK_SPRING = { stiffness: 300, damping: 30, mass: 1 }`:
  - Reanimated's `withSpring`, `Animated.spring` and Motion's `animate` accept these parameters directly;
  - `velocity` is in px/s everywhere (`Animated` included, which integrates in seconds).
- The Web Animations API has no spring with initial velocity, so the vanilla driver uses `createSpring` (`src/core/gestures/spring.ts`), a small frame-driven integrator that can be cancelled.

**Animations can be interrupted**

- Grabbing a toast while it springs back stops the spring where it is (`cancelAnimation`, `stopAnimation`, `controls.stop()`, `spring.cancel()`), and the new gesture continues from that position.
- Each running spring-back holds one "interaction" (timer paused) and releases it on completion or interruption, so the timer stays balanced.

**Two layers per toast**

- The outer layer holds the stack position (depth → `translateY`, `scale`, `opacity` through `getStackLayout`), and handles entering from depth -1 and non-gesture exits back to -1.
- The inner layer holds the swipe. The two never fight over the same transform.

**Reduced motion** (`prefers-reduced-motion`, `AccessibilityInfo.isReduceMotionEnabled`)

- The toast still follows the finger; direct manipulation is not decorative motion.
- Entering, leaving and dismissal become short fades instead of springs and slides.

## Consequences

- The four drivers share the same rules and constants. The web drivers are verified by the same conformance suite: 1:1 tracking, velocity handoff, interruption without a jump.
- Changing the feel of the library means changing two constants in one file.
- In the vanilla driver, `createSpring` runs on `requestAnimationFrame` on the main thread. This is acceptable for a single short-lived element.
