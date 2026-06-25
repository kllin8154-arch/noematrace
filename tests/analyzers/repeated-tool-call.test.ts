import { describe, expect, it } from 'vitest'
import { detectRepeatedToolCall } from '../../src/core/analyzers/repeated-tool-call'
import { makeStep, makeTrace } from '../helpers'

describe('repeated-tool-call analyzer', () => {
  it('detects same tool+args called 3+ times', () => {
    const trace = makeTrace([
      makeStep('call-3', 3, { type: 'tool_call', tool: { name: 'read_file', arguments: { path: 'package.json' } } }),
      makeStep('call-1', 1, { type: 'tool_call', tool: { name: 'read_file', arguments: { path: 'package.json' } } }),
      makeStep('call-2', 2, { type: 'tool_call', tool: { name: 'read_file', arguments: { path: 'package.json' } } }),
      makeStep('other', 4, { type: 'tool_call', tool: { name: 'read_file', arguments: { path: 'README.md' } } }),
    ])

    const findings = detectRepeatedToolCall(trace)

    expect(findings).toHaveLength(1)
    expect(findings[0].severity).toBe('warning')
    expect(findings[0].stepIds).toEqual(['call-1', 'call-2', 'call-3'])
  })

  it('does not flag fewer than 3 calls', () => {
    const trace = makeTrace([
      makeStep('call-1', 1, { type: 'tool_call', tool: { name: 'shell', arguments: { command: 'npm test' } } }),
      makeStep('call-2', 2, { type: 'tool_call', tool: { name: 'shell', arguments: { command: 'npm test' } } }),
    ])

    expect(detectRepeatedToolCall(trace)).toEqual([])
  })
})
