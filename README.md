# NoemaTrace

The only agent trace viewer that scores how much of your context window is wasted.

NoemaTrace is a zero-setup, browser-only debugger for AI agent runs. Drop a trace JSON file, then inspect the agent's decision path, tool calls, failures, token usage, context budget, and Context Waste Score in one local UI.

![screenshot](docs/screenshots/xxx.png)

## Why NoemaTrace

Most agent debugging tools ask you to run infrastructure, install a collector, wire in an SDK, or work from a CLI. NoemaTrace makes a narrower tradeoff: it reads one trace file and helps you understand one run quickly.

| Difference | What it means |
| --- | --- |
| Pure frontend, zero backend | No server, no database, no SQLite, no account. Open the app and drag in JSON. |
| Context Waste Score | Replay and diff tools show what happened. NoemaTrace also scores how much of the context window was wasted by unused, duplicated, or oversized blocks. |
| No SDK intrusion | NoemaTrace only reads trace files. You do not need to change your agent code, install a runtime SDK, or send data to a hosted service. |

## How It Differs

Tools like Langfuse and LangSmith are production platforms; local debuggers like agenttrace and agent-replay require a backend or CLI setup. NoemaTrace trades persistence and live capture for zero-setup inspection - drag a JSON, read it, done.

## Quick Start

```bash
git clone https://github.com/kllin8154-arch/noematrace.git
cd noematrace
npm install
npm run dev
```

Open `http://localhost:5173`, choose one of the built-in demo traces, or drag in your own NoemaTrace `schemaVersion: "0.1"` JSON file.

Verification commands:

```bash
npm run lint
npx vitest run
npm run build
```

The production build outputs to `dist`.

## Core Views

### Graph

See the agent run as an execution tree. Parent-child relationships are derived from `parentId`, then laid out automatically so you can follow planning, tool calls, tool results, retries, and final answers.

### Timeline

Read the run in execution order. Each step is colored by type and sized by latency, making slow model calls, repeated tools, and wasted retry loops easier to spot.

### Failures

Review rule-based findings for repeated tool calls, high-cost nodes, error cascades, unused context, and experimental risky tool calls. Findings link back to affected steps.

### Budget

Break down annotated `contextWindow` blocks by category: system prompt, tool descriptions, conversation history, retrieved context, user input, model output, scratchpad, and unknown.

### Waste Score

Context Waste Score turns context engineering problems into a single inspection signal. Higher scores mean more waste from unused context, duplicated blocks, heavy tool descriptions, large conversation history, or high-token steps.

## Built-In Demos

| Demo | Scenario | What to inspect |
| --- | --- | --- |
| `successful-coding-agent.json` | A coding agent fixes a transparent dropdown in a React component. | Graph, Timeline, details, report export, balanced context budget. |
| `failed-tool-loop.json` | The agent repeatedly reads the same file with identical arguments. | Repeated Tool Call and High Cost Node findings. |
| `error-cascade.json` | A failed command triggers several follow-up failures. | Error Cascade finding and wasted retry time. |
| `context-waste-run.json` | Tool descriptions and overlapping retrieval chunks inflate the prompt. | Unused Context, Context Budget recommendations, and Context Waste Score. |

## Not a Platform

NoemaTrace is intentionally not a production observability platform.

It does not provide:

- backend services
- user accounts
- databases or persistence
- live monitoring
- hosted trace ingestion
- trace collection SDKs
- LLM API calls

It is a local inspection tool for individual agent runs. If you need production tracing, dashboards, alerts, retention, or team workflows, use a platform built for that. If you have one trace JSON and want to understand what happened, use NoemaTrace.

## License

MIT
