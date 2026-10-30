import { type CSSProperties, useEffect, useState } from "react";
import { createPortal } from "react-dom";

import { ToastPoolItems } from "../../core/components/toast-pool-items";
import type { SwipeDismissConfig } from "../../core/gestures/swipe-config";
import type {
  StackLayoutConfig,
  ToastPosition,
} from "../../core/lifecycle/stack-layout";
import type { ToastItemDriver } from "../../core/types/toast-item-driver";
import type { ToastsPoolRendererProps } from "../../core/types/toasts-renderer";
import { useReducedMotion } from "../shared/use-reduced-motion";

export type WebPoolRendererOptions = {
  /** @default "top" */
  position?: ToastPosition;
  /**
   * Distance from the viewport edge, in px.
   * @default 16
   */
  offset?: number;
  /**
   * Maximum toast width, in px.
   * @default 356
   */
  width?: number;
  /**
   * Minimum distance from the viewport sides, in px.
   * @default 16
   */
  horizontalInset?: number;
  /**
   * Element the toasts are portaled into.
   * @default () => document.body
   */
  getContainer?: () => HTMLElement;
  /** Accessible name of the toasts region. @default "Notifications" */
  label?: string;
  swipe?: SwipeDismissConfig;
  stack?: StackLayoutConfig;
};

const useIsClient = () => {
  const [isClient, setIsClient] = useState(false);
  useEffect(() => setIsClient(true), []);
  return isClient;
};

export const createWebPoolRenderer = (
  Item: ToastItemDriver,
  {
    position = "top",
    offset = 16,
    width = 356,
    horizontalInset = 16,
    getContainer = () => document.body,
    label = "Notifications",
    swipe,
    stack,
  }: WebPoolRendererOptions = {},
) => {
  const layerStyle: CSSProperties = {
    position: "fixed",
    inset: 0,
    pointerEvents: "none",
    zIndex: 2147483000,
  };

  const anchorStyle: CSSProperties = {
    position: "absolute",
    [position]: offset,
    left: 0,
    right: 0,
    height: 0,
    margin: "0 auto",
    width: `min(${width}px, calc(100% - ${horizontalInset * 2}px))`,
  };

  const placement = { [position]: 0, left: 0, right: 0 };

  const ToastsLayer = () => {
    const isClient = useIsClient();
    const reducedMotion = useReducedMotion();

    if (!isClient) return null;

    return createPortal(
      <section aria-label={label} aria-live="polite" style={layerStyle}>
        <div style={anchorStyle}>
          <ToastPoolItems
            Item={Item}
            position={position}
            placement={placement}
            reducedMotion={reducedMotion}
            swipe={swipe}
            stack={stack}
          />
        </div>
      </section>,
      getContainer(),
    );
  };

  const PoolRenderer = ({ children, active }: ToastsPoolRendererProps) => (
    <>
      {children}
      {active && <ToastsLayer />}
    </>
  );

  return PoolRenderer;
};
