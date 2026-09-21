import { useEffect, useState } from "react";
import { API_BASE } from "../config";

/** Polls /api/health. Returns "checking" | "online" | "offline". */
export function useBackendStatus(enabled) {
  const [status, setStatus] = useState("checking");

  useEffect(() => {
    if (!enabled) return undefined;
    let alive = true;

    const check = async () => {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 2500);
      try {
        const res = await fetch(`${API_BASE}/api/health`, { signal: controller.signal });
        if (alive) setStatus(res.ok ? "online" : "offline");
      } catch {
        if (alive) setStatus("offline");
      } finally {
        clearTimeout(timer);
      }
    };

    check();
    const id = setInterval(check, 8000);
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, [enabled]);

  return status;
}
