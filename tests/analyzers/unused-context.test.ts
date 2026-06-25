import { describe, expect, it } from 'vitest'
import { detectUnusedContext } from '../../src/core/analyzers/unused-context'
import { makeStep, makeTrace } from '../helpers'

describe('unused-context analyzer', () => {
  it('detects unused context blocks above the threshold', () => {
    const trace = makeTrace([
      makeStep('llm', 1, {
        type: 'llm_call',
        contextWindow: {
          totalTokens: 100,
          blocks: [
            { id: 'used', category: 'user_input', tokenCount: 70, used: true },
            { id: 'unused', category: 'retrieved_context', tokenCount: 30, used: false },
          ],
        },
      }),
    ])

    const findings = detectUnusedContext(trace)

    expect(findings).toHaveLength(1)
    expect(findings[0].severity).toBe('warning')
    expect(findings[0].stepIds).toEqual(['llm'])
  })

  it('ignores llm_call steps without contextWindow and non-llm contextWindow data', () => {
    const trace = makeTrace([
      makeStep('llm-without-context', 1, { type: 'llm_call' }),
      makeStep('tool-with-context', 2, {
        type: 'tool_call',
        contextWindow: {
          totalTokens: 100,
          blocks: [{ id: 'unused', category: 'retrieved_context', tokenCount: 100, used: false }],
        },
      }),
    ])

    expect(detectUnusedContext(trace)).toEqual([])
  })
})
