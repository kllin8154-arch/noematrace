import type { AgentTrace, TraceStep } from '../src/types/schema'

export function makeStep(
  id: string,
  order: number,
  overrides: Partial<Omit<TraceStep, 'id' | 'order'>> = {},
): TraceStep {
  return {
    id,
    order,
    type: 'agent_event',
    title: id,
    status: 'success',
    ...overrides,
  }
}

export function makeTrace(steps: TraceStep[], overrides: Partial<Omit<AgentTrace, 'steps'>> = {}): AgentTrace {
  return {
    schemaVersion: '0.1',
    traceId: 'trace-test',
    title: 'Test Trace',
    source: 'custom',
    steps,
    ...overrides,
  }
}
