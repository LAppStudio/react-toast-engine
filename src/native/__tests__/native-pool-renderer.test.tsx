import { act, cleanup, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const reduceMotion = vi.hoisted(() => ({ enabled: false }));

vi.mock("react-native", () => ({
  View: ({
    style,
    pointerEvents,
    children,
  }: {
    style?: object;
    pointerEvents?: string;
    children?: ReactNode;
  }) => (
    <div
      data-testid="view"
      data-style={JSON.stringify(style)}
      data-pointer-events={pointerEvents}
    >
      {children}
    </div>
  ),
  StyleSheet: {
    create: <T,>(styles: T) => styles,
    absoluteFill: { position: "absolute", left: 0, right: 0, top: 0, bottom: 0 },
  },
  AccessibilityInfo: {
    isReduceMotionEnabled: () => Promise.resolve(reduceMotion.enabled),
    addEventListener: () => ({ remove: () => undefined }),
  },
}));

import { createToastsClient } from "../../core/create-toasts-client";
import type { ToastComponentProps } from "../../core/types/toast-component";
import type { ToastItemDriverProps } from "../../core/types/toast-item-driver";
import {
  createNativePoolRenderer,
  type NativePoolRendererOptions,
} from "../shell/create-native-pool-renderer";

const Toast = ({ toast }: ToastComponentProps) => <span>{toast.title}</span>;

const FakeItem = ({ placement, reducedMotion, children }: ToastItemDriverProps) => (
  <div
    data-testid="item"
    data-placement={JSON.stringify(placement)}
    data-reduced-motion={reducedMotion}
  >
    {children}
  </div>
);

const setup = async (options?: NativePoolRendererOptions) => {
  const client = createToastsClient({
    components: { info: Toast, error: Toast, success: Toast },
    PoolRenderer: createNativePoolRenderer(FakeItem, options),
  });
  render(<client.renderer.Provider>app</client.renderer.Provider>);
  await act(async () => {
    client.utilities.helpers.stack({ infoType: "info", title: "hello" });
  });
  return client;
};

const readStyle = (element: HTMLElement) => JSON.parse(element.dataset.style ?? "null");

const readPlacement = () => JSON.parse(screen.getByTestId("item").dataset.placement ?? "null");

beforeEach(() => {
  reduceMotion.enabled = false;
});

afterEach(cleanup);

describe("createNativePoolRenderer", () => {
  it("renders only the children while the pool is empty", () => {
    const client = createToastsClient({
      components: { info: Toast, error: Toast, success: Toast },
      PoolRenderer: createNativePoolRenderer(FakeItem),
    });
    render(<client.renderer.Provider>app</client.renderer.Provider>);

    expect(screen.getByText("app")).toBeTruthy();
    expect(screen.getAllByTestId("view")).toHaveLength(1);
    expect(screen.queryByTestId("item")).toBeNull();
  });

  it("fills the container with a layer above the app that lets touches through", async () => {
    await setup();
    const [container, layer] = screen.getAllByTestId("view");

    expect(readStyle(container)).toEqual({ flex: 1 });
    expect(readStyle(layer)).toEqual({
      position: "absolute",
      left: 0,
      right: 0,
      top: 0,
      bottom: 0,
      zIndex: 1000,
      elevation: 1000,
    });
    expect(layer.dataset.pointerEvents).toBe("box-none");
    expect(screen.getByText("hello")).toBeTruthy();
  });

  it("places toasts at the top by default, with offsets added to the insets", async () => {
    await setup({ useInsets: () => ({ top: 44, left: 4, right: 6 }) });

    expect(readPlacement()).toEqual({ top: 52, left: 16, right: 18 });
  });

  it("places toasts at the bottom with custom offsets", async () => {
    await setup({
      position: "bottom",
      offset: 20,
      horizontalInset: 8,
      useInsets: () => ({ bottom: 34 }),
    });

    expect(readPlacement()).toEqual({ bottom: 54, left: 8, right: 8 });
  });

  it("passes the system reduced motion setting to the driver", async () => {
    reduceMotion.enabled = true;
    await setup();

    expect(screen.getByTestId("item").dataset.reducedMotion).toBe("true");
  });
});
