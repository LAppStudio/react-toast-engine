import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest";

vi.hoisted(() => {
  vi.useFakeTimers();
});

import { createToastsClient } from "../../core/create-toasts-client";
import type { ToastComponentProps } from "../../core/types/toast-component";
import type { ToastItemDriver } from "../../core/types/toast-item-driver";
import { MotionToastItem } from "../drivers/motion/motion-toast-item";
import { VanillaToastItem } from "../drivers/vanilla/vanilla-toast-item";
import { createWebPoolRenderer } from "../shell/create-web-pool-renderer";

const WIDTH = 300;
const FRAME_MS = 16;

const Toast = ({ toast }: ToastComponentProps) => (
  <div data-testid="toast">{toast.title}</div>
);

const setup = async (Item: ToastItemDriver) => {
  const actions = {
    onDismiss: vi.fn(),
    onAutoClose: vi.fn(),
    onPress: vi.fn(),
  };
  const client = createToastsClient({
    components: { info: Toast, error: Toast, success: Toast },
    PoolRenderer: createWebPoolRenderer(Item),
    defaults: { durationInMs: 4000, actions },
  });
  render(<client.renderer.Provider>app</client.renderer.Provider>);
  act(() => {
    client.utilities.helpers.stack({ infoType: "info", title: "hello" });
  });
  await wait(FRAME_MS);
  const surface = screen.getByTestId("toast").parentElement as HTMLElement;
  return { client, actions, surface };
};

const wait = (ms: number) =>
  act(async () => {
    await vi.advanceTimersByTimeAsync(ms);
  });

const readTranslateX = (element: HTMLElement) => {
  const inline = element.style.transform;
  const match =
    inline.match(/translate3d\((-?[\d.]+)px/) ??
    inline.match(/translateX\((-?[\d.]+)px\)/);
  return match ? Number(match[1]) : 0;
};

const createPointer = (surface: HTMLElement) => {
  const init = { pointerId: 1, isPrimary: true, pointerType: "mouse", button: 0 };
  return {
    down: async (clientX = 0) => {
      act(() => {
        fireEvent.pointerDown(surface, { ...init, clientX, clientY: 0 });
      });
      await wait(0);
    },
    move: async (clientX: number, afterMs = FRAME_MS) => {
      act(() => {
        fireEvent.pointerMove(surface, { ...init, clientX, clientY: 0, buttons: 1 });
      });
      await wait(afterMs);
    },
    up: async (clientX: number) => {
      act(() => {
        fireEvent.pointerUp(surface, { ...init, clientX, clientY: 0 });
      });
      await wait(FRAME_MS);
    },
  };
};

const wheel = async (
  surface: HTMLElement,
  deltas: number[],
  intervalMs = FRAME_MS,
) => {
  for (const deltaX of deltas) {
    act(() => {
      fireEvent.wheel(surface, { deltaX, deltaY: 0, deltaMode: 0 });
    });
    await wait(intervalMs);
  }
};

const pool = (client: Awaited<ReturnType<typeof setup>>["client"]) =>
  client.store.getState().pool;

const drivers: [string, ToastItemDriver][] = [
  ["vanilla", VanillaToastItem],
  ["motion", MotionToastItem],
];

beforeAll(() => {
  Object.defineProperty(HTMLElement.prototype, "offsetWidth", {
    configurable: true,
    get: () => WIDTH,
  });
});

afterAll(() => {
  Reflect.deleteProperty(HTMLElement.prototype, "offsetWidth");
});

afterEach(() => {
  cleanup();
  vi.runOnlyPendingTimers();
});

describe.each(drivers)("%s driver", (_, Item) => {
  it("follows the pointer 1:1 without transition", async () => {
    const { surface } = await setup(Item);
    const pointer = createPointer(surface);
    await pointer.down(0);
    await pointer.move(20);
    await pointer.move(50);
    expect(readTranslateX(surface)).toBeCloseTo(50, 0);
    expect(surface.style.transition).toBe("");
  });

  it("dismisses on a fast outward fling and leaves the pool after the exit", async () => {
    const { client, actions, surface } = await setup(Item);
    const pointer = createPointer(surface);
    await pointer.down(0);
    await pointer.move(30, 10);
    await pointer.move(60, 10);
    await pointer.move(90, 10);
    await pointer.up(90);
    expect(actions.onDismiss).toHaveBeenCalledOnce();
    await wait(2000);
    expect(pool(client)).toEqual([]);
  });

  it("cancels when the pointer stops before release", async () => {
    const { client, actions, surface } = await setup(Item);
    const pointer = createPointer(surface);
    await pointer.down(0);
    await pointer.move(100, 10);
    await pointer.move(200, 100);
    await pointer.up(200);
    await wait(2000);
    expect(actions.onDismiss).not.toHaveBeenCalled();
    expect(readTranslateX(surface)).toBeCloseTo(0, 0);
    expect(pool(client)).toHaveLength(1);
  });

  it("cancels a slow drag even when it goes far", async () => {
    const { actions, surface } = await setup(Item);
    const pointer = createPointer(surface);
    await pointer.down(0);
    for (let x = 10; x <= 200; x += 10) await pointer.move(x, 50);
    await pointer.up(200);
    await wait(2000);
    expect(actions.onDismiss).not.toHaveBeenCalled();
    expect(readTranslateX(surface)).toBeCloseTo(0, 0);
  });

  it("cancels when the gesture heads back before release", async () => {
    const { actions, surface } = await setup(Item);
    const pointer = createPointer(surface);
    await pointer.down(0);
    await pointer.move(80, 10);
    await pointer.move(160, 10);
    await pointer.move(120, 10);
    await pointer.move(80, 10);
    await pointer.up(80);
    await wait(2000);
    expect(actions.onDismiss).not.toHaveBeenCalled();
  });

  it("can be grabbed mid-spring without jumping", async () => {
    const { surface } = await setup(Item);
    const pointer = createPointer(surface);
    await pointer.down(0);
    await pointer.move(100, 10);
    await pointer.move(150, 200);
    await pointer.up(150);
    await wait(48);
    const midway = readTranslateX(surface);
    expect(midway).toBeGreaterThan(0);
    expect(midway).toBeLessThan(150);
    await pointer.down(500);
    await wait(200);
    const grabbed = readTranslateX(surface);
    expect(Math.abs(grabbed - midway)).toBeLessThan(5);
    await pointer.move(520);
    expect(readTranslateX(surface)).toBeCloseTo(grabbed + 20, 0);
  });

  it("springs back after a slow horizontal wheel", async () => {
    const { actions, surface } = await setup(Item);
    await wheel(surface, Array(30).fill(-5), 50);
    expect(readTranslateX(surface)).toBeGreaterThan(0);
    await wait(2000);
    expect(actions.onDismiss).not.toHaveBeenCalled();
    expect(readTranslateX(surface)).toBeCloseTo(0, 0);
  });

  it("dismisses during wheel inertia once it passes the distance", async () => {
    const { actions, surface } = await setup(Item);
    await wheel(surface, [-40, -35, -30, -25, -20, -15, -10, -5, -3, -1]);
    expect(actions.onDismiss).toHaveBeenCalledOnce();
  });

  it("ignores vertical wheel scrolling", async () => {
    const { surface } = await setup(Item);
    act(() => {
      fireEvent.wheel(surface, { deltaX: 2, deltaY: 40, deltaMode: 0 });
    });
    await wait(FRAME_MS);
    expect(readTranslateX(surface)).toBe(0);
  });

  it("auto closes after its duration and leaves the pool", async () => {
    const { client, actions } = await setup(Item);
    await wait(4000);
    expect(actions.onAutoClose).toHaveBeenCalledOnce();
    expect(actions.onDismiss).not.toHaveBeenCalled();
    await wait(2000);
    expect(pool(client)).toEqual([]);
  });

  it("pauses the timer while the pointer is down", async () => {
    const { actions, surface } = await setup(Item);
    const pointer = createPointer(surface);
    await pointer.down(0);
    await wait(10_000);
    expect(actions.onAutoClose).not.toHaveBeenCalled();
    await pointer.up(0);
    await wait(4000);
    expect(actions.onAutoClose).toHaveBeenCalledOnce();
  });

  it("presses on click and dismisses on Escape", async () => {
    const { actions, surface } = await setup(Item);
    act(() => {
      fireEvent.click(surface);
    });
    expect(actions.onPress).toHaveBeenCalledOnce();
    act(() => {
      fireEvent.keyDown(surface, { key: "Escape" });
    });
    expect(actions.onDismiss).toHaveBeenCalledOnce();
  });
});
