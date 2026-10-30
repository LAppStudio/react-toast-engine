import { interpolateLinear, type InterpolationRange } from "./interpolate";
import type { SwipeDirection } from "./swipe-config";

const BLOCKED_DIRECTION_RESISTANCE = 0.2;
const SWIPE_EXIT_RATIO = 1.2;
const OPACITY_STOPS = [0, 0.4, 1, SWIPE_EXIT_RATIO];
const OPACITY_VALUES = [1, 0.7, 0.5, 0];

export type SwipeInterpolation = {
  translateX: InterpolationRange;
  opacity: InterpolationRange;
};

export type SwipeStyle = {
  translateX: number;
  opacity: number;
};

/**
 * Ranges that map the raw gesture offset to the rendered translation and opacity.
 * Shared by `Animated.Value#interpolate` and {@link getSwipeStyle}.
 * @see docs/adr/0006-direct-manipulation-physics.md
 */
export const getSwipeInterpolation = (
  width: number,
  direction: SwipeDirection,
): SwipeInterpolation => {
  "worklet";
  const size = Math.max(width, 1);
  const far = size * 100;
  const left = direction === "right" ? BLOCKED_DIRECTION_RESISTANCE : 1;
  const right = direction === "left" ? BLOCKED_DIRECTION_RESISTANCE : 1;
  const stops = OPACITY_STOPS.map((ratio) => ratio * size);
  return {
    translateX: {
      inputRange: [-far, 0, far],
      outputRange: [-far * left, 0, far * right],
    },
    opacity: {
      inputRange: [
        ...stops.map((stop) => -stop).reverse(),
        ...stops.slice(1),
      ],
      outputRange: [...[...OPACITY_VALUES].reverse(), ...OPACITY_VALUES.slice(1)],
    },
  };
};

export const getSwipeStyle = (
  x: number,
  width: number,
  direction: SwipeDirection,
): SwipeStyle => {
  "worklet";
  const ranges = getSwipeInterpolation(width, direction);
  return {
    translateX: interpolateLinear(x, ranges.translateX),
    opacity: interpolateLinear(x, ranges.opacity),
  };
};

/** Offset where a dismissed toast finishes leaving, on the side it was thrown to. */
export const getSwipeExitTarget = (
  x: number,
  velocityX: number,
  width: number,
) => {
  "worklet";
  const side = Math.sign(x || velocityX) || 1;
  return side * Math.max(width, 1) * SWIPE_EXIT_RATIO;
};
