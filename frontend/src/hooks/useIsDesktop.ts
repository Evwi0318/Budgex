import { useSyncExternalStore } from "react";

const query = window.matchMedia("(min-width: 1024px)");

const subscribe = (notify: () => void) => {
  query.addEventListener("change", notify);
  return () => query.removeEventListener("change", notify);
};

export const useIsDesktop = () =>
  useSyncExternalStore(subscribe, () => query.matches);
