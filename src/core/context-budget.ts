import type { AgentTrace, ContextBlock, TraceStep } from '../types/schema'

const categories: ContextBlock['category'][] = [
  'system_prompt',
  'tool_description',
  'conversation_history',
  'retrieved_context',
  'user_input',
  'model_output',
  'agent_scratchpad',
  'unknown',
]

export type ContextBudgetCategory = {
  category: ContextBlock['category']
  tokenCount: number
  percentage: number
}

export type ContextBudgetRecommendation = {
  id: string
  title: string
  description: string
}

export type ContextBudgetAnalysis = {
  totalTokens: number
  usedTokens: number
  unusedTokens: number
  duplicatedTokens: number
  llmCallCount: number
  categories: ContextBudgetCategory[]
  recommendations: ContextBudgetRecommendation[]
}

export function analyzeContextBudget(trace: AgentTrace): ContextBudgetAnalysis | null {
  const llmSteps = orderedSteps(trace).filter((step) => step.type === 'llm_call' && step.contextWindow)

  if (llmSteps.length === 0) {
    return null
  }

  const categoryTotals = createCategoryTotals()
  let totalTokens = 0
  let usedTokens = 0
  let unusedTokens = 0
  let duplicatedTokens = 0

  for (const step of llmSteps) {
    for (const block of step.contextWindow?.blocks ?? []) {
      categoryTotals.set(block.category, (categoryTotals.get(block.category) ?? 0) + block.tokenCount)
      totalTokens += block.tokenCount

      if (block.used === false) {
        unusedTokens += block.tokenCount
      } else {
        usedTokens += block.tokenCount
      }

      if (block.duplicated === true) {
        duplicatedTokens += block.tokenCount
      }
    }
  }

  const categoryBreakdown = categories.map((category) => {
    const tokenCount = categoryTotals.get(category) ?? 0

    return {
      category,
      tokenCount,
      percentage: totalTokens > 0 ? tokenCount / totalTokens : 0,
    }
  })

  return {
    totalTokens,
    usedTokens,
    unusedTokens,
    duplicatedTokens,
    llmCallCount: llmSteps.length,
    categories: categoryBreakdown,
    recommendations: buildRecommendations(categoryBreakdown, totalTokens, unusedTokens, duplicatedTokens),
  }
}

function buildRecommendations(
  categoryBreakdown: ContextBudgetCategory[],
  totalTokens: number,
  unusedTokens: number,
  duplicatedTokens: number,
): ContextBudgetRecommendation[] {
  if (totalTokens === 0) {
    return [
      {
        id: 'context-budget:empty-token-count',
        title: 'Context blocks have no token count',
        description: 'Add token counts to contextWindow blocks so the budget view can produce useful ratios.',
      },
    ]
  }

  const recommendations: ContextBudgetRecommendation[] = []
  const toolDescription = categoryBreakdown.find((item) => item.category === 'tool_description')
  const history = categoryBreakdown.find((item) => item.category === 'conversation_history')
  const retrievedContext = categoryBreakdown.find((item) => item.category === 'retrieved_context')

  if ((toolDescription?.percentage ?? 0) >= 0.25) {
    recommendations.push({
      id: 'context-budget:tool-description-heavy',
      title: 'Tool descriptions dominate the context',
      description: 'Consider shorter tool descriptions or a narrower active tool set for this run.',
    })
  }

  if ((history?.percentage ?? 0) >= 0.3) {
    recommendations.push({
      id: 'context-budget:history-heavy',
      title: 'Conversation history is large',
      description: 'Summarize older turns before the next LLM call to reduce repeated context.',
    })
  }

  if ((retrievedContext?.percentage ?? 0) >= 0.35) {
    recommendations.push({
      id: 'context-budget:retrieval-heavy',
      title: 'Retrieved context is large',
      description: 'Tighten retrieval filters and pass fewer, higher-signal chunks into the prompt.',
    })
  }

  if (unusedTokens / totalTokens >= 0.25) {
    recommendations.push({
      id: 'context-budget:unused-heavy',
      title: 'Unused context is high',
      description: 'Remove blocks marked unused or make retrieval more selective before model calls.',
    })
  }

  if (duplicatedTokens / totalTokens >= 0.1) {
    recommendations.push({
      id: 'context-budget:duplicated-context',
      title: 'Duplicated context detected',
      description: 'Deduplicate overlapping blocks before assembling the context window.',
    })
  }

  return recommendations
}

function createCategoryTotals(): Map<ContextBlock['category'], number> {
  return new Map(categories.map((category) => [category, 0]))
}

function orderedSteps(trace: AgentTrace): TraceStep[] {
  return [...trace.steps].sort((left, right) => left.order - right.order)
}
