import { describe, expect, it, vi } from "vitest";

import type { NewToast } from "../../types/toast";
import { createToastsStore } from "../create-toasts-store";
import { selectActiveProviderId } from "../select-active-provider";

const toast = (title: string, extra: Partial<NewToast> = {}): NewToast => ({
  infoType: "info",
  title,
  ...extra,
});

const withProvider = (settings?: Parameters<typeof createToastsStore>[0]) => {
  const store = createToastsStore(settings);
  store.getState().addProvider({ id: "root", depth: 1 });
  return store;
};

const open = (store: ReturnType<typeof createToastsStore>) =>
  store
    .getState()
    .pool.filter(({ status }) => status === "open")
    .map(({ title }) => title);

describe("createToastsStore", () => {
  it("stacks toasts with defaults and returns their id", () => {
    const store = withProvider({ defaults: { durationInMs: 1000 } });
    const id = store.getState().stack(toast("a"));
    expect(store.getState().pool).toMatchObject([
      { id, title: "a", durationInMs: 1000, status: "open", version: 0 },
    ]);
  });

  it("closes only the oldest toasts beyond the pool limit", () => {
    const store = withProvider({ poolLimit: 3 });
    ["a", "b", "c", "d", "e"].forEach((title) =>
      store.getState().stack(toast(title)),
    );
    expect(open(store)).toEqual(["c", "d", "e"]);
  });

  it("closes in two phases and leaves the pool on finalize", () => {
    const store = withProvider();
    const id = store.getState().stack(toast("a"));
    store.getState().close(id);
    expect(store.getState().pool[0]).toMatchObject({
      status: "closing",
      closeReason: "programmatic",
    });
    store.getState().finalize(id);
    expect(store.getState().pool).toEqual([]);
  });

  it("removes immediately when no provider can animate the exit", () => {
    const store = createToastsStore();
    const id = store.getState().stack(toast("a"));
    store.getState().close(id);
    expect(store.getState().pool).toEqual([]);
  });

  it("calls onDismiss and onAutoClose only for their reasons", () => {
    const onDismiss = vi.fn();
    const onAutoClose = vi.fn();
    const store = withProvider();
    const actions = { onDismiss, onAutoClose };
    const dismissed = store.getState().stack(toast("a", { actions }));
    const elapsed = store.getState().stack(toast("b", { actions }));
    const closed = store.getState().stack(toast("c", { actions }));
    store.getState().close(dismissed, "dismiss");
    store.getState().close(elapsed, "auto");
    store.getState().close(closed);
    expect(onDismiss).toHaveBeenCalledOnce();
    expect(onDismiss).toHaveBeenCalledWith(
      expect.objectContaining({ id: dismissed }),
    );
    expect(onAutoClose).toHaveBeenCalledOnce();
    expect(onAutoClose).toHaveBeenCalledWith(
      expect.objectContaining({ id: elapsed }),
    );
  });

  it("pops the oldest open toast", () => {
    const store = withProvider();
    ["a", "b", "c"].forEach((title) => store.getState().stack(toast(title)));
    store.getState().pop();
    expect(open(store)).toEqual(["b", "c"]);
  });

  it("updates open toasts and bumps their version", () => {
    const store = withProvider();
    const id = store.getState().stack(toast("loading"));
    store.getState().update(id, { title: "done", infoType: "success" });
    expect(store.getState().pool[0]).toMatchObject({
      title: "done",
      infoType: "success",
      version: 1,
    });
  });

  it("drops closing toasts when the last provider leaves", () => {
    const store = withProvider();
    const id = store.getState().stack(toast("a"));
    store.getState().stack(toast("b"));
    store.getState().close(id);
    store.getState().removeProvider("root");
    expect(open(store)).toEqual(["b"]);
    expect(store.getState().pool).toHaveLength(1);
  });
});

describe("selectActiveProviderId", () => {
  it("prefers the deepest provider, then the last mounted", () => {
    expect(selectActiveProviderId([])).toBeUndefined();
    expect(
      selectActiveProviderId([
        { id: "modal", depth: 2 },
        { id: "root", depth: 1 },
      ]),
    ).toBe("modal");
    expect(
      selectActiveProviderId([
        { id: "first", depth: 2 },
        { id: "second", depth: 2 },
      ]),
    ).toBe("second");
  });
});
