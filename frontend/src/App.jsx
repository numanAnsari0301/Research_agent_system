import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Moon, RotateCcw, Sun } from "lucide-react";
import { STEPS, SUGGESTIONS } from "./constants";
import { useResearch } from "./hooks/useResearch";
import { useBackendStatus } from "./hooks/useBackendStatus";
import { usePersistentState } from "./hooks/usePersistentState";
import Relay from "./components/Relay";
import ResultSheet from "./components/ResultSheet";
import TopicForm from "./components/TopicForm";
import Elapsed from "./components/Elapsed";

function Mark() {
  return (
    <svg width="36" height="16" viewBox="0 0 36 16" aria-hidden="true">
      <line x1="4" y1="8" x2="32" y2="8" stroke="currentColor" strokeOpacity=".3" strokeWidth="2" />
      <circle cx="4" cy="8" r="4" fill="var(--c-search)" />
      <circle cx="13.3" cy="8" r="4" fill="var(--c-reader)" />
      <circle cx="22.6" cy="8" r="4" fill="var(--c-writer)" />
      <circle cx="32" cy="8" r="4" fill="var(--c-critic)" />
    </svg>
  );
}

const prefersDark = () =>
  typeof window !== "undefined" && window.matchMedia?.("(prefers-color-scheme: dark)").matches;

export default function App() {
  const [theme, setTheme] = usePersistentState("rd:theme", () => (prefersDark() ? "dark" : "light"));
  const [demo, setDemo] = usePersistentState("rd:demo", false);
  const [recent, setRecent] = usePersistentState("rd:recent", []);
  const [draft, setDraft] = useState("");
  const [userTab, setUserTab] = useState(null);
  const inputRef = useRef(null);

  const { phase, topic, steps, error, runTimes, start, reset } = useResearch();
  const backend = useBackendStatus(!demo);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  const run = useCallback(
    (query) => {
      const clean = query.trim();
      if (clean.length < 2) return;
      setUserTab(null);
      setRecent((list) =>
        [clean, ...list.filter((x) => x.toLowerCase() !== clean.toLowerCase())].slice(0, 5)
      );
      start(clean, { demo });
    },
    [demo, start, setRecent]
  );

  const fillDraft = (text) => {
    setDraft(text);
    inputRef.current?.focus();
  };

  const editTopic = () => {
    setDraft(topic);
    reset();
  };

  const newResearch = () => {
    setDraft("");
    reset();
  };

  // Show the newest output automatically, unless the person picked a tab themselves.
  const autoTab = steps.writer.output
    ? "report"
    : steps.reader.output
    ? "scraped"
    : steps.search.output
    ? "search"
    : "report";
  const activeTab = userTab ?? autoTab;

  const runningStep = STEPS.find((s) => steps[s.id].status === "running");
  const announcement =
    phase === "running"
      ? `${runningStep?.agent ?? "Pipeline"} is working`
      : phase === "done"
      ? "Research finished"
      : phase === "error"
      ? "Research stopped with an error"
      : "";

  const statusPill = demo
    ? { dot: "dot--demo", label: "Demo data" }
    : backend === "online"
    ? { dot: "dot--ok", label: "Backend online" }
    : backend === "offline"
    ? { dot: "dot--bad", label: "Backend offline" }
    : { dot: "", label: "Checking backend" };

  return (
    <div className="app">
      <div className="shell">
        <header className="top">
          <div className="brand">
            <Mark />
            <span>Research Desk</span>
          </div>

          <div className="top-tools">
            <span className="pill" title={backend === "offline" && !demo ? "Start it with: uvicorn server:app --reload --port 8000" : undefined}>
              <span className={`dot ${statusPill.dot}`} aria-hidden="true" />
              {statusPill.label}
            </span>

            <button
              type="button"
              className="switch"
              role="switch"
              aria-checked={demo}
              onClick={() => setDemo((v) => !v)}
              disabled={phase === "running"}
            >
              <span className="switch-track">
                <span className="switch-thumb" />
              </span>
              Demo data
            </button>

            <button
              type="button"
              className="icon-btn"
              onClick={() => setTheme((t) => (t === "dark" ? "light" : "dark"))}
              aria-label={theme === "dark" ? "Switch to light theme" : "Switch to dark theme"}
            >
              {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
            </button>
          </div>
        </header>

        <main>
          <AnimatePresence mode="wait" initial={false}>
            {phase === "idle" ? (
              <motion.section
                key="hero"
                className="hero"
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8, transition: { duration: 0.18 } }}
                transition={{ duration: 0.5, ease: [0.2, 0.7, 0.2, 1] }}
              >
                <h1>
                  <span>Give a topic.</span>
                  <span>Get a reviewed report.</span>
                </h1>
                <p className="lede">
                  A search agent finds sources, a reader digs into the best page, a writer drafts
                  the report and a critic reviews it. You can watch every handoff happen.
                </p>

                <TopicForm value={draft} onChange={setDraft} onSubmit={run} inputRef={inputRef} />

                {!demo && backend === "offline" && (
                  <p className="hint">
                    The backend isn't running. Start it with{" "}
                    <code>uvicorn server:app --reload --port 8000</code>, or switch on demo data to
                    preview the interface.
                  </p>
                )}

                <div className="chips-row">
                  <span className="chips-label">Try</span>
                  {SUGGESTIONS.map((s) => (
                    <button key={s} type="button" className="chip" onClick={() => fillDraft(s)}>
                      {s}
                    </button>
                  ))}
                </div>

                {recent.length > 0 && (
                  <div className="chips-row">
                    <span className="chips-label">Recent</span>
                    {recent.map((s) => (
                      <button key={s} type="button" className="chip" onClick={() => fillDraft(s)}>
                        {s}
                      </button>
                    ))}
                    <button type="button" className="link-btn" onClick={() => setRecent([])}>
                      Clear
                    </button>
                  </div>
                )}
              </motion.section>
            ) : (
              <motion.section
                key="workspace"
                className="wshead"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, transition: { duration: 0.15 } }}
                transition={{ duration: 0.4, ease: [0.2, 0.7, 0.2, 1] }}
              >
                <div>
                  <p className="wsmeta">
                    {phase === "running" && "Working "}
                    {phase === "done" && "Finished in "}
                    {phase === "error" && "Stopped after "}
                    <Elapsed start={runTimes.start} end={runTimes.end} />
                    {demo && <span className="demo-tag">Demo data</span>}
                  </p>
                  <h2>{topic}</h2>
                </div>
                <button type="button" className="btn" onClick={newResearch}>
                  <RotateCcw size={16} />
                  New research
                </button>
              </motion.section>
            )}
          </AnimatePresence>

          <Relay steps={steps} phase={phase} activeTab={activeTab} onPick={setUserTab} />

          {phase !== "idle" && (
            <ResultSheet
              steps={steps}
              phase={phase}
              error={error}
              demo={demo}
              topic={topic}
              activeTab={activeTab}
              onTab={setUserTab}
              onRetry={() => run(topic)}
              onEdit={editTopic}
            />
          )}
        </main>

        <p className="sr-only" aria-live="polite">
          {announcement}
        </p>
      </div>
    </div>
  );
}
