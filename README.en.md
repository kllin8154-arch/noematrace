# NoemaTrace

[中文](README.md) · [Live Demo](https://noematrace.vercel.app/) · [GitHub Repo](https://github.com/kllin8154-arch/noematrace)

**Browser-only Agent Trace Replayer with Context Waste Score**

> Drop a trace JSON file and instantly inspect your agent's execution path, timeline, failures, token usage, and how much context was wasted.

![NoemaTrace Context Waste Score](docs/screenshots/context-waste-score.png)

No backend. No database. No SDK. No signup. Just drag, replay, inspect.

The key differentiator is **Context Waste Score**: a rule-based score that shows how much of the agent's context window was unused, duplicated, oversized, or dominated by tool descriptions.

## What It Solves

An agent run is rarely a single response. It can include user input, system prompts, model calls, tool calls, retrieved context, retries, errors, and a final answer.

Raw logs are hard to reason about. NoemaTrace turns one trace JSON into an interactive inspection view so you can answer:

1. What did the agent do at each step?
2. Why did it fail, loop, or repeat a tool call?
3. Which step consumed the most tokens, time, or cost?
4. Which parts of the context window were actually useful, and which were waste?
5. Should the next fix be in the prompt, tools, retrieval, retry logic, or execution policy?

## Where It Helps

- Debug a coding agent that repeatedly reads the same file.
- Review an error cascade after the first failed command.
- Find high-token, high-cost, or high-latency steps.
- Inspect unused, duplicated, or oversized blocks in a RAG / agent context window.
- Teach or document how agent traces, context budgets, and failure analysis work.
- Inspect one agent run without running a backend, uploading data, or changing application code.

## How It Differs

There are already strong tools for agent observability, replay, and production tracing.

NoemaTrace focuses on a narrower workflow:

**single-run, zero-setup, browser-only inspection of agent traces with context waste diagnostics.**

- **Production platforms** like Langfuse and LangSmith are built for continuous tracing, dashboards, datasets, and team workflows.
- **Local debuggers** may require a backend, database, SDK, CLI setup, or trace capture layer.
- **NoemaTrace** trades persistence and live capture for the lowest possible inspection path: drag in a trace JSON and inspect it in the browser.

What makes NoemaTrace different:

- **Pure frontend**: no backend, no database, no local service
- **No SDK required**: it reads trace files instead of collecting them
- **Context Waste Score**: quantifies unused, duplicated, oversized, and tool-heavy context
- **Offline-first**: all analysis runs locally in the browser
- **Rule-based analysis**: no LLM API, no API key, no hidden scoring

## Quick Start

```bash
git clone https://github.com/kllin8154-arch/noematrace.git
cd noematrace
npm install
npm run dev
```

Open `http://localhost:5173`, choose one of the built-in demo traces, or drag in your own NoemaTrace `schemaVersion: "0.1"` JSON file.

Useful checks:

```bash
npm run lint
npx vitest run
npm run build
```

The production build outputs to `dist`. There is currently no `test` script in `package.json`, so tests are run with `npx vitest run`.

## Feature Overview

### Graph View

Shows the parent-child execution tree derived from `parentId`, helping you understand the agent's decision flow across planning, tool calls, tool results, retries, and final answers.

### Timeline View

Shows latency by step in execution order, making slow LLM calls, tool calls, and retries easier to identify.

### Failure Analysis

Runs rule-based analyzers for:

- Repeated Tool Call
- Error Cascade
- High Cost Node
- Unused Context
- Risky Tool Call experimental

Each finding links back to affected steps and includes a recommendation.

### Context Budget

Shows annotated `contextWindow` composition: system prompt, tool descriptions, conversation history, retrieved context, user input, model output, agent scratchpad, and unknown.

NoemaTrace does not infer context composition from total token counts. If `contextWindow` is missing, the score is unavailable.

### Context Waste Score

Higher means more waste. The score is based on the largest annotated `llm_call` context window and uses rules for unused blocks, duplicated blocks, tool-description weight, conversation-history weight, and high-token steps.

It is rule-based, not LLM scoring. NoemaTrace never calls a model API to score your trace.

## Screenshots

### Context Waste Score

![Context Waste Score](docs/screenshots/context-waste-score.png)

### Moderate Waste Example

![Moderate Context Waste](docs/screenshots/context-waste-moderate.png)

### Graph View

![Graph View](docs/screenshots/graph-view.png)

### Timeline View

![Timeline View](docs/screenshots/timeline-view.png)

### Failure Analysis

![Failure Analysis](docs/screenshots/failure-analysis.png)

### Context Budget

![Context Budget](docs/screenshots/context-budget.png)

### Report Export

![Report Export](docs/screenshots/report-export.png)

## Demo Traces

| Demo | Scenario | Demonstrates |
| --- | --- | --- |
| `successful-coding-agent.json` | Successful UI bug fix | Low waste score, graph, timeline, report |
| `failed-tool-loop.json` | Repeated `read_file` loop | Repeated tool call, moderate waste |
| `error-cascade.json` | Shell failures and retries | Error cascade, retry overhead |
| `context-waste-run.json` | Tool-heavy context pollution | High Context Waste Score, unused context |

## Trace Format

NoemaTrace reads JSON with `schemaVersion: "0.1"`.

Key concepts:

- `AgentTrace`: one agent run.
- `TraceStep`: one execution step.
- `parentId`: tree relationship.
- `order`: execution order.
- `contextWindow`: context-budget data on `llm_call` steps.
- `Finding`: analyzer output with a recommendation.

The authoritative schema lives in `src/types/schema.ts`.

## Not a Platform

NoemaTrace is not:

- a Langfuse / LangSmith replacement
- a production monitoring system
- a trace collection SDK
- a backend service
- an eval platform

NoemaTrace is:

- a local-first single-run inspector
- a browser-only trace viewer
- a context waste diagnostic tool

If you need production tracing, dashboards, alerts, retention, or team workflows, use a platform built for that. If you have one trace JSON and want to understand what happened, use NoemaTrace.

## License

MIT
