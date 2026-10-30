import { describe, expect, it } from "vitest";

import { createVelocityTracker } from "../velocity-tracker";

describe("createVelocityTracker", () => {
  it("measures velocity in px/s over the recent window", () => {
    const tracker = createVelocityTracker(100);
    tracker.add(0, 0);
    tracker.add(10, 10);
    tracker.add(20, 20);
    expect(tracker.velocity()).toBeCloseTo(1000);
  });

  it("forgets samples older than the window", () => {
    const tracker = createVelocityTracker(100);
    tracker.add(0, 0);
    tracker.add(500, 50);
    tracker.add(500, 200);
    expect(tracker.velocity()).toBe(0);
  });

  it("reports time since the last real movement", () => {
    const tracker = createVelocityTracker();
    tracker.add(0, 0);
    tracker.add(50, 20);
    tracker.add(50.2, 60);
    expect(tracker.idleMs(100)).toBe(80);
  });

  it("measures only the latest direction after a reversal", () => {
    const tracker = createVelocityTracker();
    tracker.add(0, 0);
    tracker.add(80, 10);
    tracker.add(160, 20);
    tracker.add(120, 30);
    tracker.add(80, 40);
    expect(tracker.velocity()).toBeCloseTo(-4000);
  });

  it("reads zero when the pointer is held past the window", () => {
    const tracker = createVelocityTracker(100);
    tracker.add(0, 0);
    tracker.add(100, 10);
    expect(tracker.velocity(50)).toBeCloseTo(10_000);
    expect(tracker.velocity(200)).toBe(0);
  });

  it("starts over after reset", () => {
    const tracker = createVelocityTracker();
    tracker.add(0, 0);
    tracker.add(100, 10);
    tracker.reset();
    expect(tracker.velocity()).toBe(0);
    expect(tracker.idleMs(1000)).toBe(0);
  });
});
