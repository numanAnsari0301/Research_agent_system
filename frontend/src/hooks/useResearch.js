import { useCallback, useEffect, useRef, useState } from "react";
import { STEPS } from "../constants";
import { demoScript } from "../demo";
import { API_BASE } from "../config";

const blankSteps = () =>
  Object.fromEntries(
    STEPS.map((s) => [s.id, { status: "idle", output: "", startedAt: null, endedAt: null }])
  );

/**
 * Runs one research job and exposes its live state.
 *
 * phase: "idle" | "running" | "done" | "error"
 * steps: { search|reader|writer|critic: { status, output, startedAt, endedAt } }
 *        status is "idle" | "running" | "done" | "error"
 */
export function useResearch() {
  const [phase, setPhase] = useState("idle");
  const [topic, setTopic] = useState("");
  const [steps, setSteps] = useState(blankSteps);
  const [error, setError] = useState(null);
  const [runTimes, setRunTimes] = useState({ start: null, end: null });

  const sourceRef = useRef(null);
  const timersRef = useRef([]);
  const finishedRef = useRef(true);

  const cleanup = useCallback(() => {
    sourceRef.current?.close();
    sourceRef.current = null;
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];
  }, []);

  useEffect(() => cleanup, [cleanup]);

  const handleEvent = useCallback(
    (evt) => {
      const now = Date.now();
      switch (evt.type) {
        case "step_start":
          setSteps((s) => ({
            ...s,
            [evt.step]: { ...s[evt.step], status: "running", startedAt: now },
          }));
          break;

        case "step_done":
          setSteps((s) => ({
            ...s,
            [evt.step]: { ...s[evt.step], status: "done", output: evt.output ?? "", endedAt: now },
          }));
          break;

        case "error":
          finishedRef.current = true;
          cleanup();
          setSteps((s) =>
            evt.step && s[evt.step]
              ? { ...s, [evt.step]: { ...s[evt.step], status: "error", endedAt: now } }
              : s
          );
          setError({ step: evt.step ?? null, message: evt.message || "Something went wrong." });
          setRunTimes((t) => ({ ...t, end: now }));
          setPhase("error");
          break;

        case "done":
          finishedRef.current = true;
          cleanup();
          setRunTimes((t) => ({ ...t, end: now }));
          setPhase("done");
          break;

        default:
          break;
      }
    },
    [cleanup]
  );

  const start = useCallback(
    (rawTopic, { demo = false } = {}) => {
      const query = rawTopic.trim();
      if (query.length < 2) return;

      cleanup();
      finishedRef.current = false;
      setTopic(query);
      setSteps(blankSteps());
      setError(null);
      setRunTimes({ start: Date.now(), end: null });
      setPhase("running");

      if (demo) {
        let elapsed = 0;
        demoScript(query).forEach(({ wait, evt }) => {
          elapsed += wait;
          timersRef.current.push(setTimeout(() => handleEvent(evt), elapsed));
        });
        return;
      }

      const source = new EventSource(`${API_BASE}/api/research/stream?topic=${encodeURIComponent(query)}`);
      sourceRef.current = source;

      source.onmessage = (e) => {
        try {
          handleEvent(JSON.parse(e.data));
        } catch {
          /* ignore malformed events */
        }
      };

      // EventSource fires onerror when the connection drops. Normal completion
      // closes the source first (see "done"), so reaching here means a real failure.
      source.onerror = () => {
        if (finishedRef.current) return;
        finishedRef.current = true;
        cleanup();
        const now = Date.now();
        setSteps((s) =>
          Object.fromEntries(
            Object.entries(s).map(([id, v]) =>
              v.status === "running" ? [id, { ...v, status: "error", endedAt: now }] : [id, v]
            )
          )
        );
        setError({
          step: null,
          message:
            "Lost the connection to the backend. Make sure server.py is running on port 8000.",
        });
        setRunTimes((t) => ({ ...t, end: now }));
        setPhase("error");
      };
    },
    [cleanup, handleEvent]
  );

  const reset = useCallback(() => {
    cleanup();
    finishedRef.current = true;
    setPhase("idle");
    setSteps(blankSteps());
    setError(null);
    setRunTimes({ start: null, end: null });
  }, [cleanup]);

  return { phase, topic, steps, error, runTimes, start, reset };
}
