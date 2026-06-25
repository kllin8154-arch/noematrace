import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'
import { analyzeContextBudget } from '../../core/context-budget'
import {
  getBudgetCategoryLabel,
  getContextRecommendationDescription,
  getContextRecommendationTitle,
  getCopy,
} from '../../i18n'
import { useTraceStore } from '../../store/trace-store'
import type { ContextBlock } from '../../types/schema'
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

export function ContextBudgetView() {
  const trace = useTraceStore((state) => state.trace)
  const language = useTraceStore((state) => state.language)
  const t = getCopy(language)
  const analysis = trace ? analyzeContextBudget(trace) : null

  if (!analysis) {
    return (
      <div className="workspace-surface min-h-full p-6">
        <div className="mb-5 font-mono text-[11px] uppercase tracking-normal text-zinc-600">{t.budget}</div>
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
    <div className="workspace-surface min-h-full p-6">
      <div className="mb-5 flex items-center justify-between">
        <div className="font-mono text-[11px] uppercase tracking-normal text-zinc-600">{t.budget}</div>
        <div className="font-mono text-[11px] text-zinc-600">
          {t.llmCalls}: {analysis.llmCallCount}
        </div>
      </div>

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

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-r border-t border-zinc-900 px-3 py-2">
      <div className="font-mono text-[10px] uppercase tracking-normal text-zinc-600">{label}</div>
      <div className="mt-1 font-mono text-sm text-zinc-100">{value}</div>
    </div>
  )
}
