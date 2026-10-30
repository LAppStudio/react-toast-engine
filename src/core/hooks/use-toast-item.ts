import { useEffect, useMemo, useRef, useState } from "react";

import { createToastTimer, type ToastTimer } from "../lifecycle/toast-timer";
import { useRendererContext } from "../providers/renderer-context";
import type { Toast } from "../types/toast";
import type { ToastComponentActions } from "../types/toast-component";
import type { ToastItemHandlers } from "../types/toast-item-driver";

export type ToastItemControls = {
  handlers: ToastItemHandlers;
  actions: ToastComponentActions;
};

/**
 * Binds one toast to the store: runs its timer while it is in front and not interacted with,
 * and exposes the handlers a driver calls.
 * @see docs/adr/0002-two-phase-toast-removal.md
 */
export const useToastItem = (
  toast: Toast<string, unknown>,
  index: number,
): ToastItemControls => {
  const { store } = useRendererContext();
  const [interactions, setInteractions] = useState(0);
  const timer = useRef<ToastTimer | null>(null);
  const { id, version, durationInMs, status } = toast;
  const running = index === 0 && status === "open" && interactions === 0;

  useEffect(() => {
    const current = createToastTimer(durationInMs, () =>
      store.getState().close(id, "auto"),
    );
    timer.current = current;
    return () => current.clear();
  }, [store, id, version, durationInMs]);

  useEffect(() => {
    if (running) timer.current?.resume();
    else timer.current?.pause();
  }, [running, version]);

  return useMemo(() => {
    const dismiss = () => store.getState().close(id, "dismiss");
    return {
      handlers: {
        onInteractionStart: () => setInteractions((count) => count + 1),
        onInteractionEnd: () =>
          setInteractions((count) => Math.max(0, count - 1)),
        onDismiss: dismiss,
        onPress: () => {
          const current = store.getState().pool.find((item) => item.id === id);
          if (current) current.actions?.onPress?.(current);
        },
        onExited: () => store.getState().finalize(id),
      },
      actions: { dismiss },
    };
  }, [store, id]);
};
