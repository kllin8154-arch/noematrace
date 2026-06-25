import type { AgentTrace, Finding, TraceStep } from '../types/schema'
import {
  getBudgetCategoryLabel,
  getContextRecommendationDescription,
  getContextRecommendationTitle,
  getRuleLabel,
  getSeverityLabel,
  getStatusLabel,
  getStepTypeLabel,
  localizeFinding,
  localizeText,
  type Language,
} from '../i18n'
import { analyzeContextBudget } from './context-budget'

export function generateMarkdownReport(trace: AgentTrace, findings: Finding[], language: Language = 'en'): string {
  const steps = orderedSteps(trace)
  const contextBudget = analyzeContextBudget(trace)
  const labels = reportLabels[language]

  return [
    `# ${localizeText(trace.title, language)}`,
    '',
    `## ${labels.summary}`,
    ...summaryLines(trace, steps, findings, language),
    '',
    `## ${labels.findings}`,
    ...findingLines(findings, language),
    '',
    `## ${labels.contextBudget}`,
    ...contextBudgetLines(contextBudget, language),
    '',
    `## ${labels.stepsTable}`,
    stepsTable(steps, language),
    '',
  ].join('\n')
}

const reportLabels: Record<
  Language,
  {
    summary: string
    findings: string
    contextBudget: string
    stepsTable: string
    noFindings: string
    noContext: string
    recommendations: string
    traceId: string
    source: string
    steps: string
    duration: string
    tokens: string
    cost: string
    errorSteps: string
    findingCount: string
    unknown: string
  }
> = {
  en: {
    summary: 'Summary',
    findings: 'Findings',
    contextBudget: 'Context Budget',
    stepsTable: 'Steps Table',
    noFindings: 'No findings.',
    noContext: 'No contextWindow data was found on llm_call steps.',
    recommendations: 'Recommendations:',
    traceId: 'Trace ID',
    source: 'Source',
    steps: 'Steps',
    duration: 'Duration',
    tokens: 'Tokens',
    cost: 'Cost',
    errorSteps: 'Error steps',
    findingCount: 'Findings',
    unknown: 'unknown',
  },
  zh: {
    summary: '摘要',
    findings: '发现项',
    contextBudget: '上下文预算',
    stepsTable: '步骤表',
    noFindings: '暂无发现项。',
    noContext: '未在 llm_call 步骤中找到 contextWindow 数据。',
    recommendations: '建议：',
    traceId: 'Trace ID',
    source: '来源',
    steps: '步骤数',
    duration: '耗时',
    tokens: 'Token',
    cost: '成本',
    errorSteps: '错误步骤',
    findingCount: '发现项',
    unknown: '未知',
  },
}

function summaryLines(trace: AgentTrace, steps: TraceStep[], findings: Finding[], language: Language): string[] {
  const totalTokens = steps.reduce((sum, step) => sum + stepTokenTotal(step), 0)
  const totalCost = steps.reduce((sum, step) => sum + stepCostTotal(step), 0)
  const errorCount = steps.filter((step) => step.status === 'error').length
  const durationMs = traceDurationMs(trace, steps)
  const labels = reportLabels[language]

  return [
    `- ${labels.traceId}: ${trace.traceId}`,
    `- ${labels.source}: ${trace.source}`,
    `- ${labels.steps}: ${steps.length}`,
    `- ${labels.duration}: ${durationMs === null ? labels.unknown : formatMs(durationMs)}`,
    `- ${labels.tokens}: ${formatNumber(totalTokens, language)}`,
    `- ${labels.cost}: ${formatUsd(totalCost)}`,
    `- ${labels.errorSteps}: ${errorCount}`,
    `- ${labels.findingCount}: ${findings.length}`,
  ]
}

function findingLines(findings: Finding[], language: Language): string[] {
  const labels = reportLabels[language]

  if (findings.length === 0) {
    return [labels.noFindings]
  }

  return findings.flatMap((finding) => {
    const visibleFinding = localizeFinding(finding, language)

    return [
      `### ${visibleFinding.title}`,
      '',
      `- ${language === 'zh' ? '规则' : 'Rule'}: ${getRuleLabel(finding.ruleId, language)}${
        finding.experimental ? ` (${language === 'zh' ? '实验性' : 'experimental'})` : ''
      }`,
      `- ${language === 'zh' ? '严重级别' : 'Severity'}: ${getSeverityLabel(finding.severity, language)}`,
      `- ${language === 'zh' ? '步骤' : 'Steps'}: ${finding.stepIds.join(', ')}`,
      `- ${language === 'zh' ? '说明' : 'Description'}: ${visibleFinding.description}`,
      `- ${language === 'zh' ? '建议' : 'Recommendation'}: ${visibleFinding.recommendation}`,
      '',
    ]
  })
}

function contextBudgetLines(contextBudget: ReturnType<typeof analyzeContextBudget>, language: Language): string[] {
  const labels = reportLabels[language]

  if (!contextBudget) {
    return [labels.noContext]
  }

  const lines = [
    `- ${language === 'zh' ? '包含上下文的模型调用' : 'LLM calls with context'}: ${contextBudget.llmCallCount}`,
    `- ${language === 'zh' ? '上下文 Token 总量' : 'Total context tokens'}: ${formatNumber(contextBudget.totalTokens, language)}`,
    `- ${language === 'zh' ? '已使用 Token' : 'Used tokens'}: ${formatNumber(contextBudget.usedTokens, language)}`,
    `- ${language === 'zh' ? '未使用 Token' : 'Unused tokens'}: ${formatNumber(contextBudget.unusedTokens, language)}`,
    `- ${language === 'zh' ? '重复 Token' : 'Duplicated tokens'}: ${formatNumber(contextBudget.duplicatedTokens, language)}`,
    '',
    language === 'zh' ? '| 类别 | Token | 占比 |' : '| Category | Tokens | Share |',
    '| --- | ---: | ---: |',
    ...contextBudget.categories
      .filter((category) => category.tokenCount > 0)
      .map(
        (category) =>
          `| ${getBudgetCategoryLabel(category.category, language)} | ${formatNumber(category.tokenCount, language)} | ${formatPercent(category.percentage)} |`,
      ),
  ]

  if (contextBudget.recommendations.length > 0) {
    lines.push('', labels.recommendations)
    lines.push(
      ...contextBudget.recommendations.map(
        (item) =>
          `- ${getContextRecommendationTitle(item.id, item.title, language)}: ${getContextRecommendationDescription(
            item.id,
            item.description,
            language,
          )}`,
      ),
    )
  }

  return lines
}

function stepsTable(steps: TraceStep[], language: Language): string {
  const rows = steps.map((step) =>
    [
      step.order.toString(),
      step.id,
      step.parentId ?? '',
      getStepTypeLabel(step.type, language),
      getStatusLabel(step.status, language),
      localizeText(step.title, language),
      step.model ?? '',
      step.tool?.name ?? '',
      stepTokenTotal(step).toString(),
      formatUsd(stepCostTotal(step)),
      step.latencyMs === undefined ? '' : formatMs(step.latencyMs),
    ]
      .map(escapeTableCell)
      .join(' | '),
  )

  return [
    language === 'zh'
      ? '| 顺序 | ID | 父步骤 | 类型 | 状态 | 标题 | 模型 | 工具 | Token | 成本 | 延迟 |'
      : '| Order | ID | Parent | Type | Status | Title | Model | Tool | Tokens | Cost | Latency |',
    '| ---: | --- | --- | --- | --- | --- | --- | --- | ---: | ---: | ---: |',
    ...rows.map((row) => `| ${row} |`),
  ].join('\n')
}

function orderedSteps(trace: AgentTrace): TraceStep[] {
  return [...trace.steps].sort((left, right) => left.order - right.order)
}

function stepTokenTotal(step: TraceStep): number {
  if (step.tokens?.total !== undefined) {
    return step.tokens.total
  }

  return (step.tokens?.input ?? 0) + (step.tokens?.output ?? 0)
}

function stepCostTotal(step: TraceStep): number {
  if (step.costUsd?.total !== undefined) {
    return step.costUsd.total
  }

  return (step.costUsd?.input ?? 0) + (step.costUsd?.output ?? 0)
}

function traceDurationMs(trace: AgentTrace, steps: TraceStep[]): number | null {
  if (trace.startedAt && trace.endedAt) {
    const startedAt = Date.parse(trace.startedAt)
    const endedAt = Date.parse(trace.endedAt)

    if (Number.isFinite(startedAt) && Number.isFinite(endedAt) && endedAt >= startedAt) {
      return endedAt - startedAt
    }
  }

  const latencySum = steps.reduce((sum, step) => sum + (step.latencyMs ?? 0), 0)
  return latencySum > 0 ? latencySum : null
}

function formatNumber(value: number, language: Language): string {
  return value.toLocaleString(language === 'zh' ? 'zh-CN' : 'en-US')
}

function formatUsd(value: number): string {
  return `$${value.toFixed(6)}`
}

function formatMs(value: number): string {
  if (value >= 1000) {
    return `${(value / 1000).toFixed(2)}s`
  }

  return `${value}ms`
}

function formatPercent(value: number): string {
  return `${(value * 100).toFixed(1)}%`
}

function escapeTableCell(value: string): string {
  return value.replaceAll('|', '\\|').replaceAll('\n', ' ')
}
