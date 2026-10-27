"use client";
import { useCallback, useSyncExternalStore } from "react";
export function useReducedMotion() {
  const subscribe = useCallback((listener: () => void) => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    media.addEventListener("change", listener);
    return () => media.removeEventListener("change", listener);
  }, []);
  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    () => false,
  );
}
