import type { AgentTrace, Finding, TraceStep } from '../../types/schema'

type ToolCallGroup = {
  toolName: string
  argumentsText: string
  steps: TraceStep[]
}

export function detectRepeatedToolCall(trace: AgentTrace): Finding[] {
  const groups = new Map<string, ToolCallGroup>()

  for (const step of orderedSteps(trace)) {
    if (step.type !== 'tool_call' || !step.tool) {
      continue
    }

    const argumentsText = JSON.stringify(step.tool.arguments ?? null)
    const key = `${step.tool.name}\n${argumentsText}`
    const group = groups.get(key)

    if (group) {
      group.steps.push(step)
    } else {
      groups.set(key, {
        toolName: step.tool.name,
        argumentsText,
        steps: [step],
      })
    }
  }

  return [...groups.values()]
    .filter((group) => group.steps.length >= 3)
    .map((group, index) => {
      const count = group.steps.length
      const severity = count >= 5 ? 'critical' : 'warning'

      return {
        id: `repeated-tool-call:${index + 1}`,
        ruleId: 'repeated-tool-call',
        severity,
        title: `Repeated tool call: ${group.toolName}`,
        description: `${group.toolName} was called ${count} times with identical arguments (${group.argumentsText}).`,
        stepIds: group.steps.map((step) => step.id),
        recommendation: 'Inspect the retry or planning logic and stop repeating a tool call after the result is already known.',
      }
    })
}

function orderedSteps(trace: AgentTrace): TraceStep[] {
  return [...trace.steps].sort((left, right) => left.order - right.order)
}
