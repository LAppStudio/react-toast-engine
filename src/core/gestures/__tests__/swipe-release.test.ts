import { describe, expect, it } from "vitest";

import { resolveSwipeConfig } from "../swipe-config";
import { resolveSwipeRelease, resolveWheelSwipe } from "../swipe-release";

const config = resolveSwipeConfig();
const width = 300;

describe("resolveSwipeRelease", () => {
  it.each([
    ["fast outward fling to the right", { x: 80, velocityX: 900, idleMs: 10 }, "dismiss"],
    ["fast outward fling to the left", { x: -80, velocityX: -900, idleMs: 10 }, "dismiss"],
    ["dragged far then stopped", { x: 250, velocityX: 900, idleMs: 120 }, "cancel"],
    ["dragged far slowly", { x: 250, velocityX: 200, idleMs: 10 }, "cancel"],
    ["went out and came back", { x: 120, velocityX: -900, idleMs: 10 }, "cancel"],
    ["tiny jittery fling", { x: 10, velocityX: 2000, idleMs: 10 }, "cancel"],
    ["released at origin", { x: 0, velocityX: 900, idleMs: 10 }, "cancel"],
  ] as const)("%s → %s", (_, input, expected) => {
    expect(resolveSwipeRelease({ ...input, width }, config)).toBe(expected);
  });

  it("treats a stop just past stopMs as zero velocity", () => {
    const input = { x: 100, velocityX: 900, width };
    expect(resolveSwipeRelease({ ...input, idleMs: config.stopMs }, config)).toBe(
      "dismiss",
    );
    expect(
      resolveSwipeRelease({ ...input, idleMs: config.stopMs + 1 }, config),
    ).toBe("cancel");
  });

  it("ignores flings towards a blocked direction", () => {
    const leftOnly = resolveSwipeConfig({ direction: "left" });
    const fling = { velocityX: 900, idleMs: 0, width };
    expect(resolveSwipeRelease({ ...fling, x: 100 }, leftOnly)).toBe("cancel");
    expect(
      resolveSwipeRelease({ ...fling, x: -100, velocityX: -900 }, leftOnly),
    ).toBe("dismiss");
  });
});

describe("resolveWheelSwipe", () => {
  it("dismisses once a fast outward gesture passes the wheel distance", () => {
    expect(resolveWheelSwipe({ x: 119, velocityX: 900, width }, config)).toBe(
      "track",
    );
    expect(resolveWheelSwipe({ x: 120, velocityX: 900, width }, config)).toBe(
      "dismiss",
    );
  });

  it("keeps tracking slow or returning gestures", () => {
    expect(resolveWheelSwipe({ x: 250, velocityX: 100, width }, config)).toBe(
      "track",
    );
    expect(resolveWheelSwipe({ x: 250, velocityX: -900, width }, config)).toBe(
      "track",
    );
  });
});
