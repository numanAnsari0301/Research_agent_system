import { useState } from "react";
import { AlertTriangle, Check } from "lucide-react";
import { STEPS } from "../constants";
import Elapsed from "./Elapsed";

function StatusLabel({ step }) {
  switch (step.status) {
    case "running":
      return (
        <>
          Working <Elapsed start={step.startedAt} />
        </>
      );
    case "done":
      return (
        <>
          Done in <Elapsed start={step.startedAt} end={step.endedAt} />
        </>
      );
    case "error":
      return <>Failed</>;
    default:
      return <>Waiting</>;
  }
}

/**
 * Four agents on one track. A coloured baton travels to whichever agent is
 * working, so every handoff is visible. Once results exist, each node is a
 * button that jumps to that agent's output.
 */
export default function Relay({ steps, phase, activeTab, onPick }) {
  const [hover, setHover] = useState(null);
  const idle = phase === "idle";

  const statuses = STEPS.map((s) => steps[s.id].status);
  const running = statuses.indexOf("running");
  const failed = statuses.indexOf("error");
  const lastDone = statuses.lastIndexOf("done");

  let head = 0;
  if (idle) head = hover ?? 0;
  else if (running >= 0) head = running;
  else if (failed >= 0) head = failed;
  else head = Math.max(lastDone, 0);

  const lastIndex = STEPS.length - 1;
  const fill = idle ? (hover != null ? hover / lastIndex : 0) : head / lastIndex;
  const showBaton = !idle || hover != null;

  return (
    <div
      className="relay"
      style={{
        "--fill": fill,
        "--head": `${(head / lastIndex) * 100}%`,
        "--hue": `var(--c-${STEPS[head].id})`,
      }}
    >
      <div className="relay-track" aria-hidden="true">
        <div className="relay-rail" />
        <div className="relay-fill" />
        <div className="relay-baton" style={{ opacity: showBaton ? 1 : 0 }} />
      </div>

      <ol className="relay-list">
        {STEPS.map((s, i) => {
          const st = steps[s.id];
          const clickable = !idle && Boolean(st.output);
          const Tag = clickable ? "button" : "div";
          const tagProps = clickable
            ? {
                type: "button",
                onClick: () => onPick(s.tab),
                "aria-label": `Show the ${s.name.toLowerCase()} output`,
                "aria-current": s.tab === activeTab ? "true" : undefined,
              }
            : {};
          const { Icon } = s;

          return (
            <li
              key={s.id}
              onMouseEnter={() => idle && setHover(i)}
              onMouseLeave={() => idle && setHover(null)}
            >
              <Tag
                className={`node node--${idle ? "idle" : st.status} ${
                  idle && hover === i ? "is-hover" : ""
                }`}
                style={{ "--hue": `var(--c-${s.id})` }}
                {...tagProps}
              >
                <span className="node-disc">
                  {st.status === "done" && !idle ? (
                    <Check size={22} strokeWidth={2.6} />
                  ) : st.status === "error" ? (
                    <AlertTriangle size={22} />
                  ) : (
                    <Icon size={22} />
                  )}
                  {st.status === "running" && <span className="node-orbit" aria-hidden="true" />}
                </span>
                <span className="node-name">{s.name}</span>
                <span className="node-blurb">{s.blurb}</span>
                <span className="node-status">{idle ? "" : <StatusLabel step={st} />}</span>
              </Tag>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
