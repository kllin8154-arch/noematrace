import type { AgentTrace, ContextBlock, ContextWasteLevel, ContextWasteScore, TraceStep } from '../types/schema'

const unavailableSummary = 'Context Waste Score requires annotated contextWindow blocks on llm_call steps.'

export function calculateContextWasteScore(trace: AgentTrace): ContextWasteScore {
  const analyzedStep = selectLargestContextWindowStep(trace)

  if (!analyzedStep?.contextWindow) {
    return {
      available: false,
      score: null,
      level: 'unavailable',
      summary: unavailableSummary,
      recommendations: [unavailableSummary],
      metrics: emptyMetrics(),
    }
  }

  const totalContextTokens = contextWindowTotal(analyzedStep)
  const metrics = calculateMetrics(trace, analyzedStep, totalContextTokens)
  const score = calculateScore(metrics)
  const level = scoreToLevel(score)
  const recommendations = buildRecommendations(metrics)

  return {
    available: true,
    score,
    level,
    analyzedStepId: analyzedStep.id,
    analyzedStepTitle: analyzedStep.title,
    analyzedContextTokens: totalContextTokens,
    summary: levelSummary(level),
    recommendations,
    metrics,
  }
}

function selectLargestContextWindowStep(trace: AgentTrace): TraceStep | null {
  const candidates = orderedSteps(trace.steps).filter(
    (step) => step.type === 'llm_call' && (step.contextWindow?.blocks.length ?? 0) > 0,
  )

  if (candidates.length === 0) {
    return null
  }

  return candidates.reduce((largest, step) => (contextWindowTotal(step) > contextWindowTotal(largest) ? step : largest))
}

function calculateMetrics(trace: AgentTrace, analyzedStep: TraceStep, totalContextTokens: number): ContextWasteScore['metrics'] {
  let unusedTokens = 0
  let duplicatedTokens = 0
  let toolDescriptionTokens = 0
  let conversationHistoryTokens = 0
  let retrievedContextTokens = 0

  for (const block of analyzedStep.contextWindow?.blocks ?? []) {
    if (block.used === false) {
      unusedTokens += block.tokenCount
    } else if (block.duplicated === true) {
      duplicatedTokens += block.tokenCount
    }

    if (block.category === 'tool_description') {
      toolDescriptionTokens += block.tokenCount
    }

    if (block.category === 'conversation_history') {
      conversationHistoryTokens += block.tokenCount
    }

    if (block.category === 'retrieved_context') {
      retrievedContextTokens += block.tokenCount
    }
  }

  return {
    totalContextTokens,
    unusedTokens,
    duplicatedTokens,
    toolDescriptionTokens,
    conversationHistoryTokens,
    retrievedContextTokens,
    unusedRatio: ratio(unusedTokens, totalContextTokens),
    duplicatedRatio: ratio(duplicatedTokens, totalContextTokens),
    toolDescriptionRatio: ratio(toolDescriptionTokens, totalContextTokens),
    historyRatio: ratio(conversationHistoryTokens, totalContextTokens),
    maxStepTokenRatio: maxStepTokenRatio(trace),
  }
}

function calculateScore(metrics: ContextWasteScore['metrics']): number {
  const unusedPenalty = Math.min(metrics.unusedRatio / 0.4, 1) * 35
  const duplicatedPenalty = Math.min(metrics.duplicatedRatio / 0.25, 1) * 20
  const toolDescriptionPenalty =
    metrics.toolDescriptionRatio <= 0.25 ? 0 : Math.min((metrics.toolDescriptionRatio - 0.25) / 0.25, 1) * 20
  const historyPenalty = metrics.historyRatio <= 0.3 ? 0 : Math.min((metrics.historyRatio - 0.3) / 0.3, 1) * 10
  const highCostPenalty =
    metrics.maxStepTokenRatio <= 0.3 ? 0 : Math.min((metrics.maxStepTokenRatio - 0.3) / 0.3, 1) * 15

  return Math.round(
    Math.min(100, unusedPenalty + duplicatedPenalty + toolDescriptionPenalty + historyPenalty + highCostPenalty),
  )
}

function buildRecommendations(metrics: ContextWasteScore['metrics']): string[] {
  const recommendations: string[] = []

  if (metrics.unusedRatio >= 0.25) {
    recommendations.push('Unused context is high. Reduce irrelevant retrieved chunks or avoid loading unused tool descriptions.')
  }

  if (metrics.duplicatedRatio >= 0.1) {
    recommendations.push('Duplicate context detected. Deduplicate retrieved chunks before injecting them into the context window.')
  }

  if (metrics.toolDescriptionRatio >= 0.25) {
    recommendations.push(
      'Tool descriptions consume a large portion of the context window. Consider lazy-loading tools based on task intent.',
    )
  }

  if (metrics.historyRatio >= 0.3) {
    recommendations.push('Conversation history is large. Consider summarizing older turns or keeping only task-relevant messages.')
  }

  if (metrics.maxStepTokenRatio >= 0.3) {
    recommendations.push('A single step consumed a large share of total tokens. Split the task or reduce context for that LLM call.')
  }

  return recommendations
}

function contextWindowTotal(step: TraceStep): number {
  return step.contextWindow?.totalTokens ?? blockTotal(step.contextWindow?.blocks ?? [])
}

function blockTotal(blocks: ContextBlock[]): number {
  return blocks.reduce((sum, block) => sum + block.tokenCount, 0)
}

function maxStepTokenRatio(trace: AgentTrace): number {
  const steps = orderedSteps(trace.steps)
  const totalTokens = steps.reduce((sum, step) => sum + stepTokenTotal(step), 0)
  const maxTokens = steps.reduce((max, step) => Math.max(max, stepTokenTotal(step)), 0)

  return ratio(maxTokens, totalTokens)
}

function stepTokenTotal(step: TraceStep): number {
  return step.tokens?.total ?? (step.tokens?.input ?? 0) + (step.tokens?.output ?? 0)
}

function orderedSteps(steps: TraceStep[]): TraceStep[] {
  return [...steps].sort((left, right) => left.order - right.order)
}

function ratio(value: number, total: number): number {
  return total > 0 ? value / total : 0
}

function scoreToLevel(score: number): Exclude<ContextWasteLevel, 'unavailable'> {
  if (score <= 20) {
    return 'good'
  }

  if (score <= 50) {
    return 'moderate'
  }

  if (score <= 75) {
    return 'wasteful'
  }

  return 'severe'
}

function levelSummary(level: Exclude<ContextWasteLevel, 'unavailable'>): string {
  if (level === 'good') {
    return 'Context usage looks efficient.'
  }

  if (level === 'moderate') {
    return 'Some context waste detected. Review unused or duplicated blocks.'
  }

  if (level === 'wasteful') {
    return 'Significant context waste. Optimize tool descriptions, retrieval, or history.'
  }

  return 'Severe context waste. This run likely suffers from poor context engineering.'
}

function emptyMetrics(): ContextWasteScore['metrics'] {
  return {
    totalContextTokens: 0,
    unusedTokens: 0,
    duplicatedTokens: 0,
    toolDescriptionTokens: 0,
    conversationHistoryTokens: 0,
    retrievedContextTokens: 0,
    unusedRatio: 0,
    duplicatedRatio: 0,
    toolDescriptionRatio: 0,
    historyRatio: 0,
    maxStepTokenRatio: 0,
  }
}
