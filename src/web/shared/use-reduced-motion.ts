import { useEffect, useState } from "react";

const QUERY = "(prefers-reduced-motion: reduce)";

const getMediaQuery = () =>
  typeof window !== "undefined" && typeof window.matchMedia === "function"
    ? window.matchMedia(QUERY)
    : undefined;

export const useReducedMotion = () => {
  const [reducedMotion, setReducedMotion] = useState(
    () => getMediaQuery()?.matches ?? false,
  );

  useEffect(() => {
    const query = getMediaQuery();
    if (!query) return;
    const onChange = () => setReducedMotion(query.matches);
    query.addEventListener("change", onChange);
    return () => query.removeEventListener("change", onChange);
  }, []);

  return reducedMotion;
};
