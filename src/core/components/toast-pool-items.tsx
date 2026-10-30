import { useEffect, useMemo, useRef } from "react";

import {
  resolveSwipeConfig,
  type SwipeDismissConfig,
} from "../gestures/swipe-config";
import { useToastItem } from "../hooks/use-toast-item";
import {
  resolveStackConfig,
  type StackLayoutConfig,
  type ToastPosition,
} from "../lifecycle/stack-layout";
import { useRendererContext } from "../providers/renderer-context";
import type { Toast } from "../types/toast";
import type {
  ToastItemDriver,
  ToastItemDriverProps,
  ToastPlacement,
} from "../types/toast-item-driver";

export type ToastPoolItemsProps = {
  Item: ToastItemDriver;
  position: ToastPosition;
  placement: ToastPlacement;
  reducedMotion: boolean;
  swipe?: SwipeDismissConfig;
  stack?: StackLayoutConfig;
};

type ToastPoolItemProps = Omit<
  ToastItemDriverProps,
  keyof ReturnType<typeof useToastItem>["handlers"] | "children"
> & {
  Item: ToastItemDriver;
};

const ToastPoolItem = ({ Item, toast, index, ...shared }: ToastPoolItemProps) => {
  const { components } = useRendererContext();
  const lastOpenIndex = useRef(index);
  const stableIndex = index >= 0 ? index : lastOpenIndex.current;
  const { handlers, actions } = useToastItem(toast, stableIndex);
  const Component = components[toast.infoType];

  useEffect(() => {
    if (index >= 0) lastOpenIndex.current = index;
  }, [index]);

  return (
    <Item {...shared} {...handlers} toast={toast} index={stableIndex}>
      <Component toast={toast} actions={actions} />
    </Item>
  );
};

/** Renders the pool through a driver. Shells use it inside their own layer. */
export const ToastPoolItems = ({
  Item,
  swipe,
  stack,
  ...shared
}: ToastPoolItemsProps) => {
  const { store } = useRendererContext();
  const pool = store((state) => state.pool);
  const resolvedSwipe = useMemo(() => resolveSwipeConfig(swipe), [swipe]);
  const resolvedStack = useMemo(() => resolveStackConfig(stack), [stack]);
  const openIds = pool
    .filter(({ status }) => status === "open")
    .map(({ id }) => id)
    .reverse();

  return pool.map((toast: Toast<string, unknown>) => (
    <ToastPoolItem
      {...shared}
      key={toast.id}
      Item={Item}
      toast={toast}
      index={openIds.indexOf(toast.id)}
      swipe={resolvedSwipe}
      stack={resolvedStack}
    />
  ));
};
