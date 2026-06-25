import type { AgentTrace, Finding, TraceStep } from '../../types/schema'

export function detectUnusedContext(trace: AgentTrace): Finding[] {
  const findings: Finding[] = []

  for (const step of orderedSteps(trace)) {
    if (step.type !== 'llm_call' || !step.contextWindow) {
      continue
    }

    const totalTokens = contextTotalTokens(step)
    const unusedTokens = step.contextWindow.blocks
      .filter((block) => block.used === false)
      .reduce((sum, block) => sum + block.tokenCount, 0)
    const unusedRatio = totalTokens > 0 ? unusedTokens / totalTokens : 0

    if (unusedRatio >= 0.25) {
      findings.push({
        id: `unused-context:${step.id}`,
        ruleId: 'unused-context',
        severity: unusedRatio > 0.4 ? 'critical' : 'warning',
        title: `Unused context in ${step.title}`,
        description: `${unusedTokens} of ${totalTokens} context tokens (${formatPercent(unusedRatio)}) were marked unused.`,
        stepIds: [step.id],
        recommendation: 'Reduce retrieved or historical context before this LLM call and keep only blocks that influence the answer.',
      })
    }
  }

  return findings
}

function orderedSteps(trace: AgentTrace): TraceStep[] {
  return [...trace.steps].sort((left, right) => left.order - right.order)
}

function contextTotalTokens(step: TraceStep): number {
  const blockTotal = step.contextWindow?.blocks.reduce((sum, block) => sum + block.tokenCount, 0) ?? 0
  return step.contextWindow?.totalTokens ?? blockTotal
}

function formatPercent(value: number): string {
  return `${(value * 100).toFixed(1)}%`
}
