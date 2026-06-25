import { describe, expect, it } from 'vitest'
import { validateTrace } from '../src/core/validator'
import { makeStep, makeTrace } from './helpers'

describe('validator', () => {
  it('accepts a valid NoemaTrace v0.1 trace', () => {
    const trace = makeTrace([
      makeStep('root', 1, { type: 'user_input', title: 'User request' }),
      makeStep('llm', 2, {
        parentId: 'root',
        type: 'llm_call',
        title: 'Plan',
        model: 'gpt-4o',
        contextWindow: {
          totalTokens: 100,
          blocks: [{ id: 'ctx-1', category: 'user_input', tokenCount: 100, used: true }],
        },
      }),
    ])

    const result = validateTrace(trace)

    expect(result.valid).toBe(true)
    if (result.valid) {
      expect(result.data.traceId).toBe('trace-test')
    }
  })

  it('rejects invalid JSON with a readable message', () => {
    const result = validateTrace('{')

    expect(result.valid).toBe(false)
    if (!result.valid) {
      expect(result.errors[0]).toContain('非法 JSON')
    }
  })

  it('reports missing fields and type errors', () => {
    const result = validateTrace({
      schemaVersion: '0.1',
      traceId: 'missing-title',
      source: 'custom',
      steps: [{ id: 'root', order: '1', type: 'user_input', title: 'Root', status: 'success' }],
    })

    expect(result.valid).toBe(false)
    if (!result.valid) {
      expect(result.errors.some((message) => message.startsWith('title:'))).toBe(true)
      expect(result.errors.some((message) => message.startsWith('steps.0.order:'))).toBe(true)
    }
  })

  it('rejects duplicate step ids and missing parent references', () => {
    const result = validateTrace(
      makeTrace([
        makeStep('dup', 1),
        makeStep('dup', 2, { parentId: 'missing-parent' }),
      ]),
    )

    expect(result.valid).toBe(false)
    if (!result.valid) {
      expect(result.errors.some((message) => message.includes('duplicate step id'))).toBe(true)
      expect(result.errors.some((message) => message.includes('does not reference an existing step id'))).toBe(true)
    }
  })
})
