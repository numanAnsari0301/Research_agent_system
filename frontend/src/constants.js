import { BookOpen, PenLine, ScanEye, Search } from "lucide-react";

// The four agents, in the order the pipeline runs them.
// `id` matches the step names sent by server.py.
export const STEPS = [
  {
    id: "search",
    name: "Search",
    agent: "Search agent",
    blurb: "Finds recent, reliable sources",
    Icon: Search,
    tab: "search",
  },
  {
    id: "reader",
    name: "Read",
    agent: "Reader agent",
    blurb: "Scrapes the most relevant page",
    Icon: BookOpen,
    tab: "scraped",
  },
  {
    id: "writer",
    name: "Write",
    agent: "Writer",
    blurb: "Drafts the report",
    Icon: PenLine,
    tab: "report",
  },
  {
    id: "critic",
    name: "Critique",
    agent: "Critic",
    blurb: "Reviews the draft",
    Icon: ScanEye,
    tab: "critique",
  },
];

// Result tabs. Each one shows the output of one agent.
export const TABS = [
  {
    id: "report",
    label: "Report",
    step: "writer",
    pending: "The report appears here once the writer finishes.",
  },
  {
    id: "critique",
    label: "Critique",
    step: "critic",
    pending: "The critic reviews the report after it is written.",
  },
  {
    id: "search",
    label: "Search results",
    step: "search",
    pending: "Sources appear here as soon as the search agent finishes.",
  },
  {
    id: "scraped",
    label: "Page content",
    step: "reader",
    pending: "The page the reader chose appears here.",
  },
];

export const SUGGESTIONS = [
  "Solid-state battery progress",
  "How retrieval-augmented generation improves LLM accuracy",
  "State of quantum error correction",
  "Effects of GLP-1 drugs on healthcare costs",
];
