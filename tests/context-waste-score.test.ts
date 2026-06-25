import { describe, expect, it } from 'vitest'
import { calculateContextWasteScore } from '../src/core/context-waste-score'
import type { ContextBlock, TraceStep } from '../src/types/schema'
import { makeStep, makeTrace } from './helpers'

describe('calculateContextWasteScore', () => {
  it('returns unavailable when no llm_call has contextWindow blocks', () => {
    const score = calculateContextWasteScore(
      makeTrace([
        makeStep('user', 1, { type: 'user_input' }),
        llmStep('llm', 2, { contextWindow: { blocks: [] } }),
      ]),
    )

    expect(score.available).toBe(false)
    expect(score.score).toBeNull()
    expect(score.level).toBe('unavailable')
    expect(score.recommendations).toEqual([
      'Context Waste Score requires annotated contextWindow blocks on llm_call steps.',
    ])
  })

  it('selects only the largest contextWindow across multiple llm_call steps', () => {
    const score = calculateContextWasteScore(
      makeTrace([
        llmStep('small', 1, {
          title: 'Small context',
          contextWindow: {
            totalTokens: 1_000,
            blocks: [block('small-history', 'conversation_history', 1_000)],
          },
        }),
        llmStep('large', 2, {
          title: 'Large context',
          contextWindow: {
            totalTokens: 2_000,
            blocks: [block('large-tools', 'tool_description', 2_000, { used: false })],
          },
        }),
      ]),
    )

    expect(score.analyzedStepId).toBe('large')
    expect(score.analyzedStepTitle).toBe('Large context')
    expect(score.analyzedContextTokens).toBe(2_000)
    expect(score.metrics.toolDescriptionTokens).toBe(2_000)
    expect(score.metrics.conversationHistoryTokens).toBe(0)
  })

  it('counts unused + duplicated overlap as unused only', () => {
    const score = calculateContextWasteScore(
      makeTrace([
        llmStep('llm', 1, {
          contextWindow: {
            totalTokens: 1_000,
            blocks: [
              block('overlap', 'retrieved_context', 300, { used: false, duplicated: true }),
              block('duplicate', 'retrieved_context', 200, { duplicated: true }),
              block('used', 'user_input', 500),
            ],
          },
        }),
      ]),
    )

    expect(score.metrics.unusedTokens).toBe(300)
    expect(score.metrics.duplicatedTokens).toBe(200)
    expect(score.metrics.unusedRatio).toBe(0.3)
    expect(score.metrics.duplicatedRatio).toBe(0.2)
  })

  it('scores low waste traces at 20 or below', () => {
    const score = calculateContextWasteScore(
      makeTrace([
        llmStep('llm', 1, {
          tokens: { total: 100 },
          contextWindow: {
            totalTokens: 1_000,
            blocks: [
              block('system', 'system_prompt', 100),
              block('tools', 'tool_description', 150),
              block('history', 'conversation_history', 150),
              block('retrieved', 'retrieved_context', 200),
              block('unused', 'unknown', 50, { used: false }),
              block('input', 'user_input', 350),
            ],
          },
        }),
        makeStep('other', 2, { tokens: { total: 900 } }),
      ]),
    )

    expect(score.available).toBe(true)
    expect(score.score).toBeLessThanOrEqual(20)
    expect(score.level).toBe('good')
  })

  it('maxes unused penalty at 40 percent unused context', () => {
    const score = calculateContextWasteScore(
      makeTrace([
        llmStep('llm', 1, {
          tokens: { total: 250 },
          contextWindow: {
            totalTokens: 1_000,
            blocks: [
              block('unused', 'retrieved_context', 400, { used: false }),
              block('used', 'user_input', 600),
            ],
          },
        }),
        makeStep('other-a', 2, { tokens: { total: 250 } }),
        makeStep('other-b', 3, { tokens: { total: 250 } }),
        makeStep('other-c', 4, { tokens: { total: 250 } }),
      ]),
    )

    expect(score.metrics.unusedRatio).toBe(0.4)
    expect(score.score).toBe(35)
  })

  it('maxes duplicated penalty at 25 percent after excluding unused overlap', () => {
    const score = calculateContextWasteScore(
      makeTrace([
        llmStep('llm', 1, {
          tokens: { total: 250 },
          contextWindow: {
            totalTokens: 1_000,
            blocks: [
              block('overlap', 'retrieved_context', 200, { used: false, duplicated: true }),
              block('duplicate', 'retrieved_context', 250, { duplicated: true }),
              block('used', 'user_input', 550),
            ],
          },
        }),
        makeStep('other-a', 2, { tokens: { total: 250 } }),
        makeStep('other-b', 3, { tokens: { total: 250 } }),
        makeStep('other-c', 4, { tokens: { total: 250 } }),
      ]),
    )

    expect(score.metrics.unusedRatio).toBe(0.2)
    expect(score.metrics.duplicatedRatio).toBe(0.25)
    expect(score.score).toBe(38)
  })

  it('maxes tool description penalty at 50 percent tool descriptions', () => {
    const score = calculateContextWasteScore(
      makeTrace([
        llmStep('llm', 1, {
          tokens: { total: 250 },
          contextWindow: {
            totalTokens: 1_000,
            blocks: [
              block('tools', 'tool_description', 500),
              block('input', 'user_input', 500),
            ],
          },
        }),
        makeStep('other-a', 2, { tokens: { total: 250 } }),
        makeStep('other-b', 3, { tokens: { total: 250 } }),
        makeStep('other-c', 4, { tokens: { total: 250 } }),
      ]),
    )

    expect(score.metrics.toolDescriptionRatio).toBe(0.5)
    expect(score.score).toBe(20)
  })

  it('scores severe mixed waste at 75 or above', () => {
    const score = calculateContextWasteScore(
      makeTrace([
        llmStep('llm', 1, {
          tokens: { total: 450 },
          contextWindow: {
            totalTokens: 1_000,
            blocks: [
              block('unused-tools', 'tool_description', 400, { used: false }),
              block('duplicate-docs', 'retrieved_context', 180, { duplicated: true }),
              block('tools', 'tool_description', 100),
              block('history', 'conversation_history', 300),
              block('input', 'user_input', 20),
            ],
          },
        }),
        makeStep('small-a', 2, { tokens: { total: 300 } }),
        makeStep('small-b', 3, { tokens: { total: 250 } }),
      ]),
    )

    expect(score.score).toBeGreaterThanOrEqual(75)
    expect(score.level).toBe('severe')
  })

  it('applies high cost node token penalty at the same 30 percent threshold', () => {
    const below = calculateContextWasteScore(
      makeTrace([
        llmStep('llm', 1, {
          tokens: { total: 299 },
          contextWindow: { totalTokens: 1_000, blocks: [block('input', 'user_input', 1_000)] },
        }),
        makeStep('other-a', 2, { tokens: { total: 250 } }),
        makeStep('other-b', 3, { tokens: { total: 250 } }),
        makeStep('other-c', 4, { tokens: { total: 201 } }),
      ]),
    )
    const atThreshold = calculateContextWasteScore(
      makeTrace([
        llmStep('llm', 1, {
          tokens: { total: 300 },
          contextWindow: { totalTokens: 1_000, blocks: [block('input', 'user_input', 1_000)] },
        }),
        makeStep('other-a', 2, { tokens: { total: 250 } }),
        makeStep('other-b', 3, { tokens: { total: 250 } }),
        makeStep('other-c', 4, { tokens: { total: 200 } }),
      ]),
    )
    const above = calculateContextWasteScore(
      makeTrace([
        llmStep('llm', 1, {
          tokens: { total: 310 },
          contextWindow: { totalTokens: 1_000, blocks: [block('input', 'user_input', 1_000)] },
        }),
        makeStep('other-a', 2, { tokens: { total: 250 } }),
        makeStep('other-b', 3, { tokens: { total: 250 } }),
        makeStep('other-c', 4, { tokens: { total: 190 } }),
      ]),
    )

    expect(below.metrics.maxStepTokenRatio).toBeCloseTo(0.299)
    expect(atThreshold.metrics.maxStepTokenRatio).toBeCloseTo(0.3)
    expect(above.metrics.maxStepTokenRatio).toBeCloseTo(0.31)
    expect(below.score).toBe(0)
    expect(atThreshold.score).toBe(0)
    expect(above.score).toBe(1)
  })
})

function llmStep(id: string, order: number, overrides: Partial<Omit<TraceStep, 'id' | 'order'>> = {}): TraceStep {
  return makeStep(id, order, {
    type: 'llm_call',
    title: id,
    status: 'success',
    tokens: { total: 1_000 },
    ...overrides,
  })
}

function block(
  id: string,
  category: ContextBlock['category'],
  tokenCount: number,
  overrides: Partial<Omit<ContextBlock, 'id' | 'category' | 'tokenCount'>> = {},
): ContextBlock {
  return {
    id,
    category,
    tokenCount,
    ...overrides,
  }
}
