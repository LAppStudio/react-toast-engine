export type InterpolationRange = {
  inputRange: number[];
  outputRange: number[];
};

/**
 * Piecewise-linear interpolation clamped to the edges of the range.
 * Mirrors `Animated.Value#interpolate` with `extrapolate: "clamp"`.
 */
export const interpolateLinear = (
  value: number,
  { inputRange, outputRange }: InterpolationRange,
): number => {
  "worklet";
  const last = inputRange.length - 1;
  if (value <= inputRange[0]) return outputRange[0];
  if (value >= inputRange[last]) return outputRange[last];
  for (let index = 1; index <= last; index++) {
    const end = inputRange[index];
    if (value > end) continue;
    const start = inputRange[index - 1];
    const span = end - start;
    if (span === 0) return outputRange[index];
    const progress = (value - start) / span;
    const from = outputRange[index - 1];
    return from + (outputRange[index] - from) * progress;
  }
  return outputRange[last];
};
