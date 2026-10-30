import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { getStackLayout, resolveStackConfig } from "../stack-layout";
import { createToastTimer } from "../toast-timer";

describe("createToastTimer", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("elapses after the duration once resumed", () => {
    const onElapse = vi.fn();
    const timer = createToastTimer(1000, onElapse);
    vi.advanceTimersByTime(5000);
    expect(onElapse).not.toHaveBeenCalled();
    timer.resume();
    vi.advanceTimersByTime(1000);
    expect(onElapse).toHaveBeenCalledOnce();
  });

  it("keeps the remaining time across pauses", () => {
    const onElapse = vi.fn();
    const timer = createToastTimer(1000, onElapse);
    timer.resume();
    vi.advanceTimersByTime(600);
    timer.pause();
    vi.advanceTimersByTime(5000);
    expect(timer.remaining()).toBe(400);
    timer.resume();
    vi.advanceTimersByTime(399);
    expect(onElapse).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);
    expect(onElapse).toHaveBeenCalledOnce();
  });

  it("never elapses with an infinite duration or after clear", () => {
    const onElapse = vi.fn();
    createToastTimer(Infinity, onElapse).resume();
    const cleared = createToastTimer(100, onElapse);
    cleared.resume();
    cleared.clear();
    cleared.resume();
    vi.advanceTimersByTime(10_000);
    expect(onElapse).not.toHaveBeenCalled();
  });
});

describe("getStackLayout", () => {
  const config = resolveStackConfig();

  it("keeps the front toast untouched", () => {
    expect(getStackLayout(0, "top", config)).toEqual({
      translateY: 0,
      scale: 1,
      opacity: 1,
    });
  });

  it("peeks toasts behind towards the inside of the screen", () => {
    expect(getStackLayout(1, "top", config).translateY).toBe(10);
    expect(getStackLayout(1, "bottom", config).translateY).toBe(-10);
    expect(getStackLayout(1, "top", config).scale).toBeCloseTo(0.95);
    expect(getStackLayout(config.visible, "top", config).opacity).toBe(0);
  });

  it("hides entering and leaving toasts outside the edge", () => {
    expect(getStackLayout(-1, "top", config)).toEqual({
      translateY: -24,
      scale: 1,
      opacity: 0,
    });
  });
});
