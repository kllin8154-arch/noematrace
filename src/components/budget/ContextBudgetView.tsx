import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'
import { analyzeContextBudget } from '../../core/context-budget'
import { calculateContextWasteScore } from '../../core/context-waste-score'
import {
  getBudgetCategoryLabel,
  getContextRecommendationDescription,
  getContextRecommendationTitle,
  getContextWasteLevelLabel,
  getCopy,
  localizeContextWasteText,
  localizeText,
} from '../../i18n'
import { useTraceStore } from '../../store/trace-store'
import type { ContextBlock, ContextWasteLevel, ContextWasteScore } from '../../types/schema'
import { formatPercent, formatTokens } from '../trace-utils'
import { BudgetEmptyState } from './BudgetEmptyState'

const categoryColors: Record<ContextBlock['category'], string> = {
  system_prompt: '#94a3b8',
  tool_description: '#f97316',
  conversation_history: '#818cf8',
  retrieved_context: '#06b6d4',
  user_input: '#3b82f6',
  model_output: '#f4f4f5',
  agent_scratchpad: '#a855f7',
  unknown: '#71717a',
}

const scoreTone: Record<ContextWasteLevel, { border: string; text: string; bg: string }> = {
  good: { border: 'border-green-500/40', text: 'text-green-200', bg: 'bg-green-500/10' },
  moderate: { border: 'border-yellow-500/40', text: 'text-yellow-200', bg: 'bg-yellow-500/10' },
  wasteful: { border: 'border-orange-500/45', text: 'text-orange-200', bg: 'bg-orange-500/10' },
  severe: { border: 'border-red-500/50', text: 'text-red-200', bg: 'bg-red-500/10' },
  unavailable: { border: 'border-slate-600/45', text: 'text-slate-300', bg: 'bg-slate-500/10' },
}

export function ContextBudgetView() {
  const trace = useTraceStore((state) => state.trace)
  const language = useTraceStore((state) => state.language)
  const t = getCopy(language)
  const analysis = trace ? analyzeContextBudget(trace) : null
  const wasteScore = trace ? calculateContextWasteScore(trace) : null

  if (!analysis) {
    return (
      <div className="workspace-surface scroll-panel h-full min-h-0 overflow-auto p-6">
        <div className="mb-5 font-mono text-[11px] uppercase tracking-normal text-zinc-600">{t.budget}</div>
        {wasteScore && <ContextWasteScoreCard score={wasteScore} />}
        <BudgetEmptyState />
      </div>
    )
  }

  const chartData = analysis.categories
    .filter((category) => category.tokenCount > 0)
    .map((category) => ({
      ...category,
      label: getBudgetCategoryLabel(category.category, language),
      fill: categoryColors[category.category],
    }))

  return (
    <div className="workspace-surface scroll-panel h-full min-h-0 overflow-auto p-6">
      <div className="mb-5 flex items-center justify-between">
        <div className="font-mono text-[11px] uppercase tracking-normal text-zinc-600">{t.budget}</div>
        <div className="font-mono text-[11px] text-zinc-600">
          {t.llmCalls}: {analysis.llmCallCount}
        </div>
      </div>

      {wasteScore && <ContextWasteScoreCard score={wasteScore} />}

      <div className="grid max-w-6xl grid-cols-[24rem_minmax(0,1fr)] gap-6">
        <section className="border border-zinc-900 bg-[#07080c]/90 p-4">
          <div className="h-72">
            <ResponsiveContainer height="100%" width="100%">
              <PieChart>
                <Pie
                  cx="50%"
                  cy="50%"
                  data={chartData}
                  dataKey="tokenCount"
                  innerRadius={72}
                  isAnimationActive={false}
                  nameKey="label"
                  outerRadius={108}
                  paddingAngle={2}
                >
                  {chartData.map((entry) => (
                    <Cell fill={entry.fill} key={entry.category} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ background: '#09090b', border: '1px solid #27272a', color: '#e4e4e7' }}
                  itemStyle={{ color: '#e4e4e7' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-2 border-t border-zinc-900 pt-3">
            <Stat label={t.totalContext} value={formatTokens(analysis.totalTokens)} />
            <Stat label={t.usedContext} value={formatTokens(analysis.usedTokens)} />
            <Stat label={t.unusedContext} value={formatTokens(analysis.unusedTokens)} />
            <Stat label={t.duplicatedContext} value={formatTokens(analysis.duplicatedTokens)} />
          </div>
        </section>

        <section className="space-y-5">
          <div className="space-y-2">
            {chartData.map((category) => (
              <div className="grid grid-cols-[12rem_minmax(0,1fr)_5rem] items-center gap-3" key={category.category}>
                <div className="truncate font-mono text-[11px] text-zinc-500">{category.label}</div>
                <div className="h-5 border border-zinc-800 bg-zinc-950">
                  <div className="h-full" style={{ width: `${Math.max(1, category.percentage * 100)}%`, backgroundColor: category.fill, opacity: 0.5 }} />
                </div>
                <div className="text-right font-mono text-[11px] text-zinc-400">{formatPercent(category.percentage)}</div>
              </div>
            ))}
          </div>

          <div className="border border-zinc-900 bg-[#07080c]/90 p-4">
            <h3 className="font-mono text-[11px] uppercase tracking-normal text-zinc-500">{t.recommendations}</h3>
            {analysis.recommendations.length === 0 ? (
              <p className="mt-3 text-sm text-zinc-500">{t.noFindings}</p>
            ) : (
              <div className="mt-3 space-y-3">
                {analysis.recommendations.map((recommendation) => (
                  <div className="border-l-2 border-cyan-500/60 pl-3" key={recommendation.id}>
                    <div className="text-sm font-medium text-zinc-100">
                      {getContextRecommendationTitle(recommendation.id, recommendation.title, language)}
                    </div>
                    <div className="mt-1 text-sm leading-6 text-zinc-500">
                      {getContextRecommendationDescription(recommendation.id, recommendation.description, language)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  )
}

function ContextWasteScoreCard({ score }: { score: ContextWasteScore }) {
  const language = useTraceStore((state) => state.language)
  const t = getCopy(language)
  const recommendation = score.recommendations[0] ?? score.summary

  return (
    <section className={`mb-6 border ${scoreTone[score.level].border} ${scoreTone[score.level].bg} bg-[#07080c]/90 p-4`}>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="font-mono text-[11px] uppercase tracking-normal text-zinc-500">{t.contextWasteScore}</div>
          <div className={`mt-2 font-mono text-2xl font-semibold ${scoreTone[score.level].text}`}>
            {score.available ? `${score.score} / 100 · ${getContextWasteLevelLabel(score.level, language)}` : t.unavailable}
          </div>
          <div className="mt-1 font-mono text-[11px] text-zinc-500">{t.higherMoreWaste}</div>
        </div>
        <div className="max-w-xl text-sm leading-6 text-zinc-400">
          {score.available && (
            <div>
              <span className="text-zinc-500">{t.analyzingLargestContextWindow}: </span>
              <span className="text-zinc-200">
                llm_call: {localizeText(score.analyzedStepTitle ?? '-', language)} ·{' '}
                {formatTokens(score.analyzedContextTokens ?? 0)} tokens
              </span>
            </div>
          )}
          <div className="mt-2">
            <span className="text-zinc-500">{score.available ? `${t.mainRecommendation}: ` : ''}</span>
            <span className="text-zinc-300">{localizeContextWasteText(recommendation, language)}</span>
          </div>
        </div>
      </div>
    </section>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-r border-t border-zinc-900 px-3 py-2">
      <div className="font-mono text-[10px] uppercase tracking-normal text-zinc-600">{label}</div>
      <div className="mt-1 font-mono text-sm text-zinc-100">{value}</div>
    </div>
  )
}
