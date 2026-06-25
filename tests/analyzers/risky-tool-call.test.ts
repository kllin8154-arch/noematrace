import { describe, expect, it } from 'vitest'
import { detectRiskyToolCall } from '../../src/core/analyzers/risky-tool-call'
import { makeStep, makeTrace } from '../helpers'

describe('risky-tool-call analyzer', () => {
  it('detects risky command or secret patterns in tool calls', () => {
    const trace = makeTrace([
      makeStep('safe', 1, { type: 'tool_call', tool: { name: 'shell', arguments: { command: 'npm test' } } }),
      makeStep('risky', 2, {
        type: 'tool_call',
        tool: { name: 'shell', arguments: { command: 'rm -rf dist' } },
      }),
    ])

    const findings = detectRiskyToolCall(trace)

    expect(findings).toHaveLength(1)
    expect(findings[0]).toMatchObject({
      id: 'risky-tool-call:risky',
      severity: 'warning',
      experimental: true,
      stepIds: ['risky'],
    })
  })

  it('ignores risky text outside tool_call steps', () => {
    const trace = makeTrace([makeStep('llm', 1, { type: 'llm_call', output: 'please do not run rm -rf /' })])

    expect(detectRiskyToolCall(trace)).toEqual([])
  })
})
