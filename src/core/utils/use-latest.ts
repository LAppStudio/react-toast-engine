import { useRef } from "react";

import { useIsomorphicLayoutEffect } from "./use-isomorphic-layout-effect";

/** Ref that always holds the latest render's value, for long-lived event handlers. */
export const useLatest = <T>(value: T) => {
  const ref = useRef(value);
  useIsomorphicLayoutEffect(() => {
    ref.current = value;
  });
  return ref;
};
