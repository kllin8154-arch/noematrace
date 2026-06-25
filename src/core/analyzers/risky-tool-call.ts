import type { AgentTrace, Finding, TraceStep } from '../../types/schema'

const riskyPatterns = [
  'rm -rf',
  'DROP TABLE',
  'DELETE FROM',
  'format',
  'del /s',
  'curl http',
  'wget http',
  'api_key',
  'secret_key',
  'password',
] as const

export function detectRiskyToolCall(trace: AgentTrace): Finding[] {
  const findings: Finding[] = []

  for (const step of orderedSteps(trace)) {
    if (step.type !== 'tool_call') {
      continue
    }

    const haystack = [
      stringifyValue(step.tool?.arguments),
      stringifyValue(step.input),
      stringifyValue(step.output),
    ]
      .join('\n')
      .toLowerCase()
    const matches = riskyPatterns.filter((pattern) => haystack.includes(pattern.toLowerCase()))

    if (matches.length === 0) {
      continue
    }

    findings.push({
      id: `risky-tool-call:${step.id}`,
      ruleId: 'risky-tool-call',
      severity: 'warning',
      experimental: true,
      title: `Risky tool call: ${step.title}`,
      description: `Matched risky pattern(s): ${matches.join(', ')}.`,
      stepIds: [step.id],
      recommendation: 'Require human review or a stricter allowlist before executing destructive commands or exposing secrets.',
    })
  }

  return findings
}

function orderedSteps(trace: AgentTrace): TraceStep[] {
  return [...trace.steps].sort((left, right) => left.order - right.order)
}

function stringifyValue(value: unknown): string {
  if (value === undefined || value === null) {
    return ''
  }

  if (typeof value === 'string') {
    return value
  }

  try {
    return JSON.stringify(value) ?? ''
  } catch {
    return String(value)
  }
}
