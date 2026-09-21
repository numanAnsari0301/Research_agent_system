import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { AlertTriangle, Check, Copy, Download } from "lucide-react";
import { STEPS, TABS } from "../constants";
import { extractScore, readingTime, slugify, wordCount } from "../utils";

const markdownComponents = {
  a: (props) => <a {...props} target="_blank" rel="noreferrer noopener" />,
};

function ErrorNotice({ error, demo, onRetry, onEdit }) {
  const failed = STEPS.find((s) => s.id === error.step);
  return (
    <div className="alert" role="alert">
      <AlertTriangle size={20} aria-hidden="true" />
      <div className="alert-text">
        <h3>{failed ? `${failed.agent} stopped` : "Research stopped"}</h3>
        <p>{error.message}</p>
        {!demo && (
          <p className="alert-hint">
            Check the terminal running server.py for the full traceback.
          </p>
        )}
      </div>
      <div className="alert-actions">
        <button className="btn" type="button" onClick={onEdit}>
          Edit topic
        </button>
        <button className="btn btn-solid" type="button" onClick={onRetry}>
          Try again
        </button>
      </div>
    </div>
  );
}

function Waiting({ tab, steps, phase }) {
  const running = STEPS.find((s) => steps[s.id].status === "running");

  if (phase === "error") {
    return (
      <div className="wait">
        <p className="wait-msg">This step did not produce any output.</p>
      </div>
    );
  }

  return (
    <div className="wait" aria-busy="true">
      <p className="wait-msg">
        <span className="spin" aria-hidden="true" />
        {running ? `${running.agent} is working` : "Starting up"}
      </p>
      <p className="wait-note">{tab.pending}</p>
      <div className="skel" style={{ width: "92%" }} />
      <div className="skel" style={{ width: "78%" }} />
      <div className="skel" style={{ width: "86%" }} />
      <div className="skel" style={{ width: "54%" }} />
    </div>
  );
}

function Content({ tab, text, topic }) {
  const [copied, setCopied] = useState(false);
  const words = wordCount(text);
  const score = tab.id === "critique" ? extractScore(text) : null;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      /* clipboard can be blocked; nothing else to do */
    }
  };

  const download = () => {
    const blob = new Blob([text], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${slugify(topic)}-${tab.id}.md`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <div className="toolbar">
        <div className="toolbar-meta">
          <span>{words.toLocaleString()} words</span>
          <span>{readingTime(words)} min read</span>
          {score && <span className="score">Score {score}/10</span>}
        </div>
        <div className="toolbar-actions">
          <button className="btn" type="button" onClick={copy}>
            {copied ? <Check size={16} /> : <Copy size={16} />}
            {copied ? "Copied" : "Copy"}
          </button>
          <button className="btn" type="button" onClick={download}>
            <Download size={16} />
            Download
          </button>
        </div>
      </div>

      {tab.id === "scraped" ? (
        <pre className="raw">{text}</pre>
      ) : (
        <article className="prose">
          <Markdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
            {text}
          </Markdown>
        </article>
      )}
    </>
  );
}

export default function ResultSheet({
  steps,
  phase,
  error,
  demo,
  topic,
  activeTab,
  onTab,
  onRetry,
  onEdit,
}) {
  const tab = TABS.find((t) => t.id === activeTab) ?? TABS[0];
  const text = steps[tab.step].output;

  return (
    <motion.section
      className="sheet"
      aria-label="Results"
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.1 }}
    >
      {phase === "error" && error && (
        <ErrorNotice error={error} demo={demo} onRetry={onRetry} onEdit={onEdit} />
      )}

      <div className="tabs" role="tablist" aria-label="Agent outputs">
        {TABS.map((t) => {
          const has = Boolean(steps[t.step].output);
          const selected = t.id === tab.id;
          return (
            <button
              key={t.id}
              type="button"
              role="tab"
              id={`tab-${t.id}`}
              aria-selected={selected}
              aria-controls="result-panel"
              disabled={!has && !selected}
              className="tab"
              onClick={() => onTab(t.id)}
            >
              {has && <span className="tab-dot" style={{ "--hue": `var(--c-${t.step})` }} />}
              {t.label}
              {selected && <motion.span layoutId="tab-underline" className="tab-underline" />}
            </button>
          );
        })}
      </div>

      <div
        className="sheet-body"
        id="result-panel"
        role="tabpanel"
        aria-labelledby={`tab-${tab.id}`}
        style={{ "--tab-hue": `var(--c-${tab.step})` }}
      >
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={`${tab.id}-${text ? "ready" : "waiting"}`}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            {text ? (
              <Content tab={tab} text={text} topic={topic} />
            ) : (
              <Waiting tab={tab} steps={steps} phase={phase} />
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </motion.section>
  );
}
