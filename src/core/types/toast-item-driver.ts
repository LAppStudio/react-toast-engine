import type { ComponentType, ReactNode } from "react";

import type { ResolvedSwipeDismissConfig } from "../gestures/swipe-config";
import type {
  ResolvedStackLayoutConfig,
  ToastPosition,
} from "../lifecycle/stack-layout";
import type { Toast } from "./toast";

export type ToastPlacement = {
  top?: number;
  bottom?: number;
  left: number;
  right: number;
};

export type ToastItemHandlers = {
  /** Pauses the timer. Every call must be matched by one `onInteractionEnd`. */
  onInteractionStart: () => void;
  onInteractionEnd: () => void;
  /** Closes the toast as a user dismissal, calling `onDismiss`. */
  onDismiss: () => void;
  onPress: () => void;
  /** Removes the toast from the pool. Call it when the exit animation ends. */
  onExited: () => void;
};

/**
 * Props every animation driver receives for one toast.
 * The driver animates; timing, dismissal rules and store updates live in the core.
 * @see docs/adr/0001-animation-drivers-by-entry-point.md
 */
export type ToastItemDriverProps = ToastItemHandlers & {
  toast: Toast<string, unknown>;
  /** Stack depth among open toasts: 0 is the front one. Kept frozen while closing. */
  index: number;
  position: ToastPosition;
  /** Absolute offsets the driver applies to its outermost element. */
  placement: ToastPlacement;
  stack: ResolvedStackLayoutConfig;
  swipe: ResolvedSwipeDismissConfig;
  reducedMotion: boolean;
  children: ReactNode;
};

export type ToastItemDriver = ComponentType<ToastItemDriverProps>;
