import type { FocusEvent, KeyboardEvent } from "react";

import type { ToastItemDriverProps } from "../../core/types/toast-item-driver";

type Parameters = Pick<
  ToastItemDriverProps,
  "toast" | "index" | "onInteractionStart" | "onInteractionEnd" | "onDismiss"
>;

const ASSERTIVE_TYPES = new Set(["error"]);

/** Props that pause the toast on hover and focus, close it with Escape and announce it. */
export const getItemAccessibilityProps = ({
  toast,
  index,
  onInteractionStart,
  onInteractionEnd,
  onDismiss,
}: Parameters) => {
  const interactive = toast.status === "open" && index === 0;
  return {
    role: ASSERTIVE_TYPES.has(toast.infoType) ? "alert" : "status",
    "aria-hidden": interactive ? undefined : true,
    tabIndex: interactive ? 0 : -1,
    onPointerEnter: onInteractionStart,
    onPointerLeave: onInteractionEnd,
    onFocus: (event: FocusEvent<HTMLElement>) => {
      if (!event.currentTarget.contains(event.relatedTarget)) onInteractionStart();
    },
    onBlur: (event: FocusEvent<HTMLElement>) => {
      if (!event.currentTarget.contains(event.relatedTarget)) onInteractionEnd();
    },
    onKeyDown: (event: KeyboardEvent<HTMLElement>) => {
      if (event.key === "Escape" && interactive) onDismiss();
    },
  };
};
