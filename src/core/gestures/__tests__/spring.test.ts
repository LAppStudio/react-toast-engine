import { describe, expect, it, vi } from "vitest";

import {
  createSpring,
  type FrameScheduler,
  isSpringAtRest,
  stepSpring,
  SWIPE_SPRING,
} from "../spring";

const createManualScheduler = () => {
  const callbacks = new Map<number, (time: number) => void>();
  let next = 0;
  let time = 0;
  const scheduler: FrameScheduler = {
    request: (callback) => {
      callbacks.set(++next, callback);
      return next;
    },
    cancel: (handle) => callbacks.delete(handle),
  };
  const frame = () => {
    time += 16;
    const pending = [...callbacks.values()];
    callbacks.clear();
    pending.forEach((callback) => callback(time));
  };
  return { scheduler, frame, pending: () => callbacks.size };
};

describe("stepSpring", () => {
  it("converges to the target", () => {
    let state = { position: 100, velocity: 0 };
    for (let index = 0; index < 120; index++) {
      state = stepSpring(state, 0, 1 / 60, SWIPE_SPRING);
    }
    expect(isSpringAtRest(state, 0)).toBe(true);
  });

  it("carries the initial velocity", () => {
    const resting = stepSpring({ position: 0, velocity: 0 }, 0, 1 / 60, SWIPE_SPRING);
    const thrown = stepSpring({ position: 0, velocity: 2000 }, 0, 1 / 60, SWIPE_SPRING);
    expect(resting.position).toBe(0);
    expect(thrown.position).toBeGreaterThan(20);
  });
});

describe("createSpring", () => {
  it("updates every frame and completes at the target", () => {
    const { scheduler, frame, pending } = createManualScheduler();
    const onUpdate = vi.fn();
    const onComplete = vi.fn();
    createSpring({ from: 100, to: 0, onUpdate, onComplete, scheduler });
    while (pending() > 0) frame();
    expect(onUpdate).toHaveBeenLastCalledWith(0);
    expect(onComplete).toHaveBeenCalledOnce();
  });

  it("stops where it is when cancelled", () => {
    const { scheduler, frame, pending } = createManualScheduler();
    const onComplete = vi.fn();
    const spring = createSpring({
      from: 100,
      to: 0,
      onUpdate: () => undefined,
      onComplete,
      scheduler,
    });
    frame();
    frame();
    const position = spring.cancel();
    expect(position).toBeGreaterThan(0);
    expect(position).toBeLessThan(100);
    expect(pending()).toBe(0);
    expect(onComplete).not.toHaveBeenCalled();
  });
});
