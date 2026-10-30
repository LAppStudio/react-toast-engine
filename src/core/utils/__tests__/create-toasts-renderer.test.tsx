import { act, cleanup, render } from "@testing-library/react";
import { type ReactNode, useEffect, useState } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { createToastsClient } from "../../create-toasts-client";
import type { ToastsPoolRendererProps } from "../../types/toasts-renderer";

const Empty = () => null;

const createClient = () => {
  const actives: Record<string, boolean> = {};
  const PoolRenderer = ({ children, active }: ToastsPoolRendererProps) => (
    <div data-active={active}>{children}</div>
  );
  const client = createToastsClient({
    components: { info: Empty, error: Empty, success: Empty },
    PoolRenderer,
  });
  return { ...client, actives };
};

afterEach(cleanup);

describe("Provider", () => {
  it("does not remount children when another provider mounts", () => {
    const { renderer } = createClient();
    const { Provider } = renderer;
    const mounts = vi.fn();
    const Child = () => {
      useEffect(mounts, []);
      return null;
    };
    let showModal: (value: boolean) => void = () => undefined;
    const App = ({ children }: { children: ReactNode }) => {
      const [modal, setModal] = useState(false);
      showModal = setModal;
      return (
        <Provider>
          {children}
          {modal && <Provider>modal</Provider>}
        </Provider>
      );
    };

    render(
      <App>
        <Child />
      </App>,
    );
    act(() => showModal(true));
    act(() => showModal(false));

    expect(mounts).toHaveBeenCalledOnce();
  });

  it("renders the pool only in the deepest provider", () => {
    const { renderer } = createClient();
    const { Provider } = renderer;
    const { container } = render(
      <Provider>
        <Provider>inner</Provider>
      </Provider>,
    );
    const [outer, inner] = container.querySelectorAll("[data-active]");
    expect(outer.getAttribute("data-active")).toBe("false");
    expect(inner.getAttribute("data-active")).toBe("true");
  });
});
