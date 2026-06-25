import { describe, expect, it } from 'vitest'
import { runAnalyzers } from '../../src/core/analyzers'
import { makeStep, makeTrace } from '../helpers'

describe('analyzer index', () => {
  it('runs all analyzers and sorts critical findings first', () => {
    const trace = makeTrace([
      makeStep('tool-1', 1, { type: 'tool_call', tool: { name: 'shell', arguments: { command: 'npm test' } } }),
      makeStep('tool-2', 2, { type: 'tool_call', tool: { name: 'shell', arguments: { command: 'npm test' } } }),
      makeStep('tool-3', 3, { type: 'tool_call', tool: { name: 'shell', arguments: { command: 'npm test' } } }),
      makeStep('risky', 4, { type: 'tool_call', tool: { name: 'shell', arguments: { command: 'rm -rf dist' } } }),
      makeStep('big', 5, { tokens: { total: 1000 } }),
      makeStep('small', 6, { tokens: { total: 1 } }),
    ])

    const findings = runAnalyzers(trace)

    expect(findings.map((finding) => finding.ruleId)).toContain('repeated-tool-call')
    expect(findings.map((finding) => finding.ruleId)).toContain('risky-tool-call')
    expect(findings[0].severity).toBe('critical')
  })
})
