import type { AgentTrace, Finding, TraceStep } from '../../types/schema'

export function detectErrorCascade(trace: AgentTrace): Finding[] {
  const findings: Finding[] = []
  let run: TraceStep[] = []

  for (const step of orderedSteps(trace)) {
    if (step.status === 'error') {
      run.push(step)
      continue
    }

    appendFindingForRun(findings, run)
    run = []
  }

  appendFindingForRun(findings, run)

  return findings
}

function appendFindingForRun(findings: Finding[], run: TraceStep[]): void {
  if (run.length < 3) {
    return
  }

  const first = run[0]
  const last = run[run.length - 1]

  findings.push({
    id: `error-cascade:${first.id}:${last.id}`,
    ruleId: 'error-cascade',
    severity: 'critical',
    title: 'Error cascade detected',
    description: `${run.length} consecutive steps failed from order ${first.order} to ${last.order}.`,
    stepIds: run.map((step) => step.id),
    recommendation: 'Stop execution after repeated failures, surface the first root error, and avoid continuing dependent steps.',
  })
}

function orderedSteps(trace: AgentTrace): TraceStep[] {
  return [...trace.steps].sort((left, right) => left.order - right.order)
}
