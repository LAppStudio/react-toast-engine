import { interpolateLinear, type InterpolationRange } from "../gestures/interpolate";

export type ToastPosition = "top" | "bottom";

export type StackLayoutConfig = {
  /**
   * Distance between stacked toasts, in px.
   * @default 10
   */
  peek?: number;
  /**
   * Scale lost per stack level.
   * @default 0.05
   */
  scaleStep?: number;
  /**
   * Number of visible toasts, the front one included.
   * @default 3
   */
  visible?: number;
  /**
   * Distance travelled while entering and leaving, in px.
   * @default 24
   */
  enterOffset?: number;
};

export type ResolvedStackLayoutConfig = Required<StackLayoutConfig>;

export const DEFAULT_STACK_CONFIG: ResolvedStackLayoutConfig = {
  peek: 10,
  scaleStep: 0.05,
  visible: 3,
  enterOffset: 24,
};

export const resolveStackConfig = (
  config: StackLayoutConfig = {},
): ResolvedStackLayoutConfig => ({ ...DEFAULT_STACK_CONFIG, ...config });

export type StackInterpolation = {
  translateY: InterpolationRange;
  scale: InterpolationRange;
  opacity: InterpolationRange;
};

export type StackItemLayout = {
  translateY: number;
  scale: number;
  opacity: number;
};

/**
 * Ranges over the stack depth: 0 is the front toast and -1 is hidden, before entering or after leaving.
 * Shared by `Animated.Value#interpolate` and {@link getStackLayout}.
 */
export const getStackInterpolation = (
  position: ToastPosition,
  { peek, scaleStep, visible, enterOffset }: ResolvedStackLayoutConfig,
): StackInterpolation => {
  "worklet";
  const direction = position === "top" ? 1 : -1;
  const inputRange = [-1, 0, visible];
  return {
    translateY: {
      inputRange,
      outputRange: [-enterOffset * direction, 0, visible * peek * direction],
    },
    scale: {
      inputRange,
      outputRange: [1, 1, Math.max(0, 1 - visible * scaleStep)],
    },
    opacity: { inputRange, outputRange: [0, 1, 0] },
  };
};

export const getStackLayout = (
  depth: number,
  position: ToastPosition,
  config: ResolvedStackLayoutConfig,
): StackItemLayout => {
  "worklet";
  const ranges = getStackInterpolation(position, config);
  return {
    translateY: interpolateLinear(depth, ranges.translateY),
    scale: interpolateLinear(depth, ranges.scale),
    opacity: interpolateLinear(depth, ranges.opacity),
  };
};

/** Front toasts render above the ones behind them, and a leaving toast above the one replacing it. */
export const getStackZIndex = (index: number, closing = false) =>
  1000 - index * 2 + (closing ? 1 : 0);
