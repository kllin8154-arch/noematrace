import type { AgentTrace, Finding } from '../../types/schema'
import { detectErrorCascade } from './error-cascade'
import { detectHighCostNode } from './high-cost-node'
import { detectRepeatedToolCall } from './repeated-tool-call'
import { detectRiskyToolCall } from './risky-tool-call'
import { detectUnusedContext } from './unused-context'

const severityRank: Record<Finding['severity'], number> = {
  critical: 0,
  warning: 1,
  info: 2,
}

export function runAnalyzers(trace: AgentTrace): Finding[] {
  return [
    ...detectRepeatedToolCall(trace),
    ...detectHighCostNode(trace),
    ...detectErrorCascade(trace),
    ...detectUnusedContext(trace),
    ...detectRiskyToolCall(trace),
  ].sort((left, right) => severityRank[left.severity] - severityRank[right.severity] || left.id.localeCompare(right.id))
}
