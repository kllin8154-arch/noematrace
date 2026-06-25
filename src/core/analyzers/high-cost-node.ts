import type { AgentTrace, Finding, TraceStep } from '../../types/schema'

export function detectHighCostNode(trace: AgentTrace): Finding[] {
  const steps = orderedSteps(trace)
  const totalTokens = steps.reduce((sum, step) => sum + stepTokenTotal(step), 0)
  const totalCost = steps.reduce((sum, step) => sum + stepCostTotal(step), 0)
  const findings: Finding[] = []

  for (const step of steps) {
    const tokenTotal = stepTokenTotal(step)
    const tokenRatio = totalTokens > 0 ? tokenTotal / totalTokens : 0

    if (tokenRatio >= 0.3) {
      findings.push({
        id: `high-cost-node:tokens:${step.id}`,
        ruleId: 'high-cost-node',
        severity: tokenRatio > 0.5 ? 'critical' : 'warning',
        title: `High token node: ${step.title}`,
        description: `${step.title} consumed ${formatPercent(tokenRatio)} of trace tokens (${tokenTotal} / ${totalTokens}).`,
        stepIds: [step.id],
        recommendation: 'Split or compress this step and inspect whether its prompt, retrieved context, or output can be reduced.',
      })
    }

    const costTotal = stepCostTotal(step)
    const costRatio = totalCost > 0 ? costTotal / totalCost : 0

    if (costRatio >= 0.3) {
      findings.push({
        id: `high-cost-node:cost:${step.id}`,
        ruleId: 'high-cost-node',
        severity: costRatio > 0.5 ? 'critical' : 'warning',
        title: `High cost node: ${step.title}`,
        description: `${step.title} consumed ${formatPercent(costRatio)} of trace cost ($${costTotal.toFixed(6)} / $${totalCost.toFixed(6)}).`,
        stepIds: [step.id],
        recommendation: 'Review model choice, token volume, and retry behavior for this expensive step.',
      })
    }
  }

  return findings
}

function orderedSteps(trace: AgentTrace): TraceStep[] {
  return [...trace.steps].sort((left, right) => left.order - right.order)
}

function stepTokenTotal(step: TraceStep): number {
  if (step.tokens?.total !== undefined) {
    return step.tokens.total
  }

  return (step.tokens?.input ?? 0) + (step.tokens?.output ?? 0)
}

function stepCostTotal(step: TraceStep): number {
  if (step.costUsd?.total !== undefined) {
    return step.costUsd.total
  }

  return (step.costUsd?.input ?? 0) + (step.costUsd?.output ?? 0)
}

function formatPercent(value: number): string {
  return `${(value * 100).toFixed(1)}%`
}
