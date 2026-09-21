import { useEffect, useState } from "react";
import { formatDuration } from "../utils";

function useNow(active, interval = 250) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!active) return undefined;
    const id = setInterval(() => setNow(Date.now()), interval);
    return () => clearInterval(id);
  }, [active, interval]);
  return now;
}

/** Shows a running timer, or the final duration once `end` is set. */
export default function Elapsed({ start, end }) {
  const now = useNow(start != null && end == null);
  if (start == null) return null;
  return <span className="tnum">{formatDuration((end ?? now) - start)}</span>;
}
