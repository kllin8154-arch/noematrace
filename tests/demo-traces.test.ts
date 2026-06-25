import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { runAnalyzers } from '../src/core/analyzers'
import { analyzeContextBudget } from '../src/core/context-budget'
import { calculateContextWasteScore } from '../src/core/context-waste-score'
import { validateTrace } from '../src/core/validator'
import type { AgentTrace, ContextBlock, Finding, TraceStep } from '../src/types/schema'

const examplesDir = join(process.cwd(), 'public', 'examples')

describe('built-in demo traces', () => {
  it.each([
    'successful-coding-agent.json',
    'failed-tool-loop.json',
    'error-cascade.json',
    'context-waste-run.json',
  ])('%s passes schema validation', (filename) => {
    expect(() => loadExampleTrace(filename)).not.toThrow()
  })

  it('successful coding agent is a clean 9-step run with balanced context budget data', () => {
    const trace = loadExampleTrace('successful-coding-agent.json')
    const findings = runAnalyzers(trace)
    const budget = analyzeContextBudget(trace)
    const wasteScore = calculateContextWasteScore(trace)

    expect(trace.steps).toHaveLength(9)
    expect(errorSteps(trace.steps)).toHaveLength(0)
    expect(totalTokens(trace.steps)).toBeGreaterThanOrEqual(18_000)
    expect(totalTokens(trace.steps)).toBeLessThanOrEqual(22_000)
    expect(findings).toEqual([])
    expect(budget?.totalTokens).toBe(4_650)
    expect(budget?.categories.filter((item) => item.tokenCount > 0)).toHaveLength(8)
    expect(wasteScore.available).toBe(true)
    expect(wasteScore.score).toBeGreaterThanOrEqual(0)
    expect(wasteScore.score).toBeLessThanOrEqual(30)
  })

  it('failed tool loop triggers repeated-tool-call and high-cost-node findings', () => {
    const trace = loadExampleTrace('failed-tool-loop.json')
    const findings = runAnalyzers(trace)
    const repeated = byRule(findings, 'repeated-tool-call')
    const highCost = byRule(findings, 'high-cost-node')
    const wasteScore = calculateContextWasteScore(trace)

    expect(trace.steps.length).toBeGreaterThanOrEqual(12)
    expect(trace.steps.length).toBeLessThanOrEqual(15)
    expect(totalTokens(trace.steps)).toBeGreaterThanOrEqual(42_000)
    expect(totalTokens(trace.steps)).toBeLessThanOrEqual(49_000)
    expect(repeated).toHaveLength(1)
    expect(repeated[0].severity).toBe('critical')
    expect(repeated[0].stepIds).toHaveLength(5)
    expect(highCost.length).toBeGreaterThanOrEqual(1)
    expect(wasteScore.available).toBe(true)
    expect(wasteScore.score).toBeGreaterThanOrEqual(40)
    expect(wasteScore.score).toBeLessThanOrEqual(65)
  })

  it('error cascade triggers a critical cascade finding from four consecutive errors', () => {
    const trace = loadExampleTrace('error-cascade.json')
    const findings = runAnalyzers(trace)
    const cascades = byRule(findings, 'error-cascade')
    const wasteScore = calculateContextWasteScore(trace)

    expect(trace.steps.length).toBeGreaterThanOrEqual(10)
    expect(trace.steps.length).toBeLessThanOrEqual(14)
    expect(totalTokens(trace.steps)).toBeGreaterThanOrEqual(23_000)
    expect(totalTokens(trace.steps)).toBeLessThanOrEqual(27_000)
    expect(errorSteps(trace.steps)).toHaveLength(4)
    expect(cascades).toHaveLength(1)
    expect(cascades[0].severity).toBe('critical')
    expect(cascades[0].stepIds).toEqual([
      'e5-vitest-missing-setup',
      'e6-retry-run-all',
      'e7-run-build',
      'e8-cascade-marker',
    ])
    expect(byRule(findings, 'high-cost-node')).toHaveLength(0)
    expect(wasteScore.available).toBe(true)
    expect(wasteScore.score).toBeGreaterThanOrEqual(30)
    expect(wasteScore.score).toBeLessThanOrEqual(60)
  })

  it('context waste run triggers unused-context and full budget recommendations', () => {
    const trace = loadExampleTrace('context-waste-run.json')
    const findings = runAnalyzers(trace)
    const budget = analyzeContextBudget(trace)
    const wasteScore = calculateContextWasteScore(trace)

    expect(trace.steps).toHaveLength(10)
    expect(totalTokens(trace.steps)).toBeGreaterThanOrEqual(62_000)
    expect(totalTokens(trace.steps)).toBeLessThanOrEqual(68_000)
    expect(byRule(findings, 'unused-context').length).toBeGreaterThanOrEqual(1)
    expect(byRule(findings, 'high-cost-node')).toHaveLength(0)
    expect(budget).not.toBeNull()
    expect(budget?.totalTokens).toBe(45_300)
    expect(categoryPercentage(trace, 'tool_description')).toBeGreaterThanOrEqual(0.3)
    expect((budget?.unusedTokens ?? 0) / (budget?.totalTokens ?? 1)).toBeGreaterThanOrEqual(0.35)
    expect((budget?.duplicatedTokens ?? 0) / (budget?.totalTokens ?? 1)).toBeGreaterThanOrEqual(0.1)
    expect(wasteScore.available).toBe(true)
    expect(wasteScore.score).toBeGreaterThanOrEqual(75)
    expect(budget?.recommendations.map((item) => item.id)).toEqual(
      expect.arrayContaining([
        'context-budget:tool-description-heavy',
        'context-budget:history-heavy',
        'context-budget:unused-heavy',
        'context-budget:duplicated-context',
      ]),
    )
  })
})

function loadExampleTrace(filename: string): AgentTrace {
  const result = validateTrace(readFileSync(join(examplesDir, filename), 'utf8'))

  if (!result.valid) {
    throw new Error(`${filename} is invalid:\n${result.errors.join('\n')}`)
  }

  return result.data
}

function byRule(findings: Finding[], ruleId: Finding['ruleId']): Finding[] {
  return findings.filter((finding) => finding.ruleId === ruleId)
}

function totalTokens(steps: TraceStep[]): number {
  return steps.reduce((sum, step) => sum + (step.tokens?.total ?? (step.tokens?.input ?? 0) + (step.tokens?.output ?? 0)), 0)
}

function errorSteps(steps: TraceStep[]): TraceStep[] {
  return steps.filter((step) => step.status === 'error')
}

function categoryPercentage(trace: AgentTrace, category: ContextBlock['category']): number {
  const blocks = trace.steps.flatMap((step) => step.contextWindow?.blocks ?? [])
  const total = blocks.reduce((sum, block) => sum + block.tokenCount, 0)
  const categoryTotal = blocks
    .filter((block) => block.category === category)
    .reduce((sum, block) => sum + block.tokenCount, 0)

  return total > 0 ? categoryTotal / total : 0
}
