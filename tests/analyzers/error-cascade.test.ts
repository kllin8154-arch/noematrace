import { describe, expect, it } from 'vitest'
import { detectErrorCascade } from '../../src/core/analyzers/error-cascade'
import { makeStep, makeTrace } from '../helpers'

describe('error-cascade analyzer', () => {
  it('detects 3+ consecutive error steps', () => {
    const trace = makeTrace([
      makeStep('success-after', 4),
      makeStep('error-1', 1, { status: 'error' }),
      makeStep('error-3', 3, { status: 'error' }),
      makeStep('error-2', 2, { status: 'error' }),
    ])

    const findings = detectErrorCascade(trace)

    expect(findings).toHaveLength(1)
    expect(findings[0].severity).toBe('critical')
    expect(findings[0].stepIds).toEqual(['error-1', 'error-2', 'error-3'])
  })

  it('does not flag shorter error runs', () => {
    const trace = makeTrace([
      makeStep('error-1', 1, { status: 'error' }),
      makeStep('error-2', 2, { status: 'error' }),
      makeStep('success', 3),
      makeStep('error-3', 4, { status: 'error' }),
    ])

    expect(detectErrorCascade(trace)).toEqual([])
  })
})
