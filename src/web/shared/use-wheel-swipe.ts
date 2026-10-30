import { type RefObject, useEffect } from "react";

import type { ResolvedSwipeDismissConfig } from "../../core/gestures/swipe-config";
import { resolveWheelSwipe } from "../../core/gestures/swipe-release";
import { createVelocityTracker } from "../../core/gestures/velocity-tracker";
import { useLatest } from "../../core/utils/use-latest";

const LINE_HEIGHT = 16;
const PAGE_WIDTH = 800;

export type WheelSwipeOptions = {
  enabled: boolean;
  swipe: ResolvedSwipeDismissConfig;
  getWidth: () => number;
  getX: () => number;
  setX: (x: number) => void;
  /** Called on the first wheel event of a gesture, before any movement. */
  onStart: () => void;
  /** Called when the gesture dismisses mid-way, with its velocity in px/s. */
  onDismiss: (velocityX: number) => void;
  /** Called after `wheelIdleMs` without events, with the velocity in px/s. */
  onRelease: (velocityX: number) => void;
};

const toPixels = (delta: number, mode: number) => {
  if (mode === 1) return delta * LINE_HEIGHT;
  if (mode === 2) return delta * PAGE_WIDTH;
  return delta;
};

const getHorizontalDelta = (event: WheelEvent) => {
  if (event.shiftKey && event.deltaX === 0) {
    return { x: toPixels(event.deltaY, event.deltaMode), y: 0 };
  }
  return {
    x: toPixels(event.deltaX, event.deltaMode),
    y: toPixels(event.deltaY, event.deltaMode),
  };
};

/**
 * Lets horizontal wheel and trackpad scrolling move the toast 1:1 and dismiss it.
 * @see docs/adr/0004-wheel-swipe-dismiss.md
 */
export const useWheelSwipe = (
  ref: RefObject<HTMLElement | null>,
  options: WheelSwipeOptions,
) => {
  const latest = useLatest(options);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    const tracker = createVelocityTracker();
    let active = false;
    let idle: ReturnType<typeof setTimeout> | undefined;

    const release = () => {
      idle = undefined;
      active = false;
      latest.current.onRelease(0);
    };

    const onWheel = (event: WheelEvent) => {
      const delta = getHorizontalDelta(event);
      if (!active && Math.abs(delta.x) <= Math.abs(delta.y)) return;
      event.preventDefault();
      const current = latest.current;
      if (!current.enabled) return;
      if (!active) {
        active = true;
        tracker.reset();
        current.onStart();
        tracker.add(current.getX(), event.timeStamp);
      }
      const next = current.getX() - delta.x;
      current.setX(next);
      tracker.add(next, event.timeStamp);
      clearTimeout(idle);
      const result = resolveWheelSwipe(
        { x: next, velocityX: tracker.velocity(), width: current.getWidth() },
        current.swipe,
      );
      if (result === "dismiss") {
        active = false;
        idle = undefined;
        current.onDismiss(tracker.velocity());
        return;
      }
      idle = setTimeout(release, current.swipe.wheelIdleMs);
    };

    element.addEventListener("wheel", onWheel, { passive: false });
    return () => {
      element.removeEventListener("wheel", onWheel);
      clearTimeout(idle);
    };
  }, [ref, latest]);
};
