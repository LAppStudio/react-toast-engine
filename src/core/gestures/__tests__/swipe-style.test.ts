import { describe, expect, it } from "vitest";

import { interpolateLinear } from "../interpolate";
import { getSwipeExitTarget, getSwipeStyle } from "../swipe-style";

describe("interpolateLinear", () => {
  const range = { inputRange: [0, 10, 20], outputRange: [0, 100, 0] };

  it("interpolates inside segments and clamps outside", () => {
    expect(interpolateLinear(5, range)).toBe(50);
    expect(interpolateLinear(15, range)).toBe(50);
    expect(interpolateLinear(-5, range)).toBe(0);
    expect(interpolateLinear(25, range)).toBe(0);
  });

  it("handles zero-length segments", () => {
    expect(
      interpolateLinear(0, { inputRange: [0, 0, 1], outputRange: [1, 2, 3] }),
    ).toBe(1);
  });
});

describe("getSwipeStyle", () => {
  it("follows the gesture 1:1 in allowed directions", () => {
    expect(getSwipeStyle(42, 300, "both").translateX).toBeCloseTo(42);
    expect(getSwipeStyle(-42, 300, "both").translateX).toBeCloseTo(-42);
  });

  it("resists movement towards a blocked direction", () => {
    expect(getSwipeStyle(-100, 300, "right").translateX).toBeCloseTo(-20);
    expect(getSwipeStyle(100, 300, "right").translateX).toBeCloseTo(100);
  });

  it("fades subtly while dragging and fully at the exit target", () => {
    expect(getSwipeStyle(0, 300, "both").opacity).toBe(1);
    expect(getSwipeStyle(120, 300, "both").opacity).toBeCloseTo(0.7);
    expect(getSwipeStyle(-300, 300, "both").opacity).toBeCloseTo(0.5);
    expect(getSwipeStyle(getSwipeExitTarget(1, 0, 300), 300, "both").opacity).toBe(0);
  });

  it("exits on the side of the offset, falling back to the velocity", () => {
    expect(getSwipeExitTarget(10, -500, 300)).toBe(360);
    expect(getSwipeExitTarget(0, -500, 300)).toBe(-360);
  });
});
