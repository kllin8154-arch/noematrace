import { describe, expect, it } from 'vitest'
import { detectHighCostNode } from '../../src/core/analyzers/high-cost-node'
import { makeStep, makeTrace } from '../helpers'

describe('high-cost-node analyzer', () => {
  it('detects a single step consuming 30%+ of total tokens', () => {
    const trace = makeTrace([
      makeStep('small', 1, { tokens: { total: 10 } }),
      makeStep('large', 2, { title: 'Large prompt', tokens: { total: 90 } }),
    ])

    const findings = detectHighCostNode(trace)

    expect(findings).toHaveLength(1)
    expect(findings[0].id).toBe('high-cost-node:tokens:large')
    expect(findings[0].severity).toBe('critical')
  })

  it('detects a single step consuming 30%+ of total cost', () => {
    const trace = makeTrace([
      makeStep('cheap', 1, { costUsd: { total: 0.01 } }),
      makeStep('expensive', 2, { title: 'Expensive model call', costUsd: { total: 0.09 } }),
    ])

    const findings = detectHighCostNode(trace)

    expect(findings).toHaveLength(1)
    expect(findings[0].id).toBe('high-cost-node:cost:expensive')
    expect(findings[0].severity).toBe('critical')
  })
})
