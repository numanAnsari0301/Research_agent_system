import { useEffect, useState } from "react";

/** Like useState, but remembers the value in localStorage. */
export function usePersistentState(key, initial) {
  const [value, setValue] = useState(() => {
    const fallback = typeof initial === "function" ? initial() : initial;
    try {
      const raw = localStorage.getItem(key);
      return raw !== null ? JSON.parse(raw) : fallback;
    } catch {
      return fallback;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      /* storage can be unavailable (private mode); the app still works */
    }
  }, [key, value]);

  return [value, setValue];
}
