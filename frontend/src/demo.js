// Scripted events that mimic what server.py streams.
// Turn on "Demo data" in the header to preview the UI without running Python.
// Tip: include the word "fail" in the topic to preview the error state.

const searchText = (topic) => `**Demo mode: this is sample text, not real research.**

Sources the search agent would return for *${topic}*:

- **Overview of ${topic}**: a broad introduction with recent context. [example.com/overview](https://example.com/overview)
- **Recent developments**: news and analysis from the past few months. [example.com/news](https://example.com/news)
- **Technical deep dive**: methods, data and open questions. [example.com/deep-dive](https://example.com/deep-dive)
- **Expert commentary**: differing views from practitioners. [example.com/commentary](https://example.com/commentary)
`;

const scrapedText = (topic) => `Demo mode: sample page content.

Title: Technical deep dive into ${topic}
URL: https://example.com/deep-dive

The reader agent scrapes the most relevant page from the search results and
returns its text here. The writer then combines this page with the search
results to draft the report.

Section 1. Background
Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor
incididunt ut labore et dolore magna aliqua.

Section 2. Current state
Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut
aliquip ex ea commodo consequat.

Section 3. Open questions
Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore.
`;

const reportText = (topic) => `> Demo mode: this report is sample text, not real research.

# ${topic}

## Summary

This is where the writer agent's summary appears. It condenses the search results and the scraped page into a few clear paragraphs, so you can decide quickly whether the topic is worth a deeper look.

## Key findings

1. **Finding one.** A short explanation of the most important point, with the evidence behind it.
2. **Finding two.** A second point that adds nuance or contradicts a common assumption.
3. **Finding three.** A practical implication for someone acting on this information.

## How the sources compare

| Source | Angle | Confidence |
| --- | --- | --- |
| Overview | Broad introduction | High |
| Recent developments | News and timing | Medium |
| Technical deep dive | Methods and data | High |

## Open questions

- What would change the conclusions above?
- Which claims still lack independent confirmation?

## Sources

- [Overview](https://example.com/overview)
- [Recent developments](https://example.com/news)
- [Technical deep dive](https://example.com/deep-dive)
`;

const critiqueText = () => `**Score: 8/10**

## Strengths

- Clear structure, and the summary stands on its own.
- Findings are specific and tied to sources.

## Improvements

- Add dates to the "Recent developments" claims.
- Explain why the two overview sources differ.
- The open questions section could name who is best placed to answer each one.

## Verdict

Solid draft. Fix the dating issue before sharing it.
`;

export function demoScript(topic) {
  const shouldFail = /fail/i.test(topic);

  const script = [
    { wait: 700, evt: { type: "step_start", step: "search" } },
    { wait: 2600, evt: { type: "step_done", step: "search", output: searchText(topic) } },
    { wait: 300, evt: { type: "step_start", step: "reader" } },
  ];

  if (shouldFail) {
    script.push({
      wait: 2200,
      evt: {
        type: "error",
        step: "reader",
        message: "ValueError: Could not scrape https://example.com/deep-dive (demo error).",
      },
    });
    return script;
  }

  return script.concat([
    { wait: 2800, evt: { type: "step_done", step: "reader", output: scrapedText(topic) } },
    { wait: 300, evt: { type: "step_start", step: "writer" } },
    { wait: 3200, evt: { type: "step_done", step: "writer", output: reportText(topic) } },
    { wait: 300, evt: { type: "step_start", step: "critic" } },
    { wait: 2200, evt: { type: "step_done", step: "critic", output: critiqueText() } },
    { wait: 300, evt: { type: "done" } },
  ]);
}
