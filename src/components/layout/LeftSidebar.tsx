import { useEffect, useMemo, useRef, useState } from 'react'
import { calculateContextWasteScore } from '../../core/context-waste-score'
import { getContextWasteLevelLabel, getCopy, getStatusLabel, getStepTypeLabel, localizeText } from '../../i18n'
import { useTraceStore } from '../../store/trace-store'
import type { ContextWasteLevel, TraceStep } from '../../types/schema'
import { formatCost, formatTokens, orderedSteps, stepCostTotal, stepTokenTotal } from '../trace-utils'

const dotColor: Record<TraceStep['type'], string> = {
  user_input: 'bg-blue-500',
  system_prompt: 'bg-slate-400',
  llm_call: 'bg-purple-500',
  agent_event: 'bg-indigo-400',
  tool_call: 'bg-orange-500',
  tool_result: 'bg-green-500',
  retrieval: 'bg-cyan-500',
  final_answer: 'bg-zinc-100',
  error: 'bg-red-500',
}

const textColor: Record<TraceStep['type'], string> = {
  user_input: 'text-blue-300',
  system_prompt: 'text-slate-300',
  llm_call: 'text-purple-300',
  agent_event: 'text-indigo-300',
  tool_call: 'text-orange-300',
  tool_result: 'text-green-300',
  retrieval: 'text-cyan-300',
  final_answer: 'text-zinc-100',
  error: 'text-red-300',
}

const wasteTone: Record<ContextWasteLevel, { border: string; text: string; bg: string }> = {
  good: { border: 'border-green-500/40', text: 'text-green-200', bg: 'bg-green-500/10' },
  moderate: { border: 'border-yellow-500/40', text: 'text-yellow-200', bg: 'bg-yellow-500/10' },
  wasteful: { border: 'border-orange-500/45', text: 'text-orange-200', bg: 'bg-orange-500/10' },
  severe: { border: 'border-red-500/50', text: 'text-red-200', bg: 'bg-red-500/10' },
  unavailable: { border: 'border-slate-600/45', text: 'text-slate-300', bg: 'bg-slate-500/10' },
}

export function LeftSidebar() {
  const trace = useTraceStore((state) => state.trace)
  const findings = useTraceStore((state) => state.findings)
  const selectedStepId = useTraceStore((state) => state.selectedStepId)
  const sourceName = useTraceStore((state) => state.sourceName)
  const language = useTraceStore((state) => state.language)
  const selectStep = useTraceStore((state) => state.selectStep)
  const [query, setQuery] = useState('')
  const stepRefs = useRef(new Map<string, HTMLButtonElement>())
  const t = getCopy(language)

  const steps = orderedSteps(trace?.steps ?? [])
  const visibleSteps = useMemo(
    () =>
      steps.filter((step) => {
        const keyword = query.trim().toLowerCase()

        if (!keyword) {
          return true
        }

        return [
          step.id,
          step.title,
          localizeText(step.title, language),
          step.type,
          getStepTypeLabel(step.type, language),
          step.status,
          getStatusLabel(step.status, language),
          step.tool?.name ?? '',
          step.model ?? '',
        ]
          .join('\n')
          .toLowerCase()
          .includes(keyword)
      }),
    [language, query, steps],
  )
  const totalTokens = steps.reduce((sum, step) => sum + stepTokenTotal(step), 0)
  const totalCost = steps.reduce((sum, step) => sum + stepCostTotal(step), 0)
  const errorCount = steps.filter((step) => step.status === 'error').length
  const warningCount = steps.filter((step) => step.status === 'warning').length
  const contextWasteScore = trace ? calculateContextWasteScore(trace) : null

  useEffect(() => {
    if (!selectedStepId) {
      return
    }

    stepRefs.current.get(selectedStepId)?.scrollIntoView({ block: 'nearest' })
  }, [selectedStepId, visibleSteps])

  return (
    <aside className="flex min-h-0 w-full shrink-0 flex-col border-r border-zinc-800 bg-[#0a0b10]">
      <section className="border-b border-zinc-800">
        <div className="border-b border-zinc-900 px-4 py-3">
          <p className="font-mono text-[11px] uppercase tracking-normal text-zinc-400">{t.traceSummary}</p>
          <h2 className="mt-1 truncate text-sm font-medium text-zinc-100" title={trace ? localizeText(trace.title, language) : t.noTraceLoaded}>
            {trace ? localizeText(trace.title, language) : t.noTraceLoaded}
          </h2>
          <p className="mt-1 truncate font-mono text-[11px] text-zinc-500" title={sourceName ?? trace?.traceId ?? '-'}>
            {sourceName ?? trace?.traceId ?? '-'}
          </p>
        </div>
        <div className="grid grid-cols-2 text-xs">
          <SummaryItem label={t.steps} value={trace ? steps.length.toString() : '-'} />
          <SummaryItem label={t.tokens} value={trace ? formatTokens(totalTokens) : '-'} />
          <SummaryItem label={t.cost} value={trace ? formatCost(totalCost) : '-'} />
          <SummaryItem label={t.errors} value={trace ? errorCount.toString() : '-'} />
          <SummaryItem label={t.warnings} value={trace ? warningCount.toString() : '-'} />
          <SummaryItem label={t.findings} value={trace ? findings.length.toString() : '-'} />
        </div>
        {contextWasteScore && (
          <div className="border-t border-zinc-900 p-3">
            <div className={`border ${wasteTone[contextWasteScore.level].border} ${wasteTone[contextWasteScore.level].bg} p-3`}>
              <div className="font-mono text-[10px] uppercase tracking-normal text-zinc-500">{t.contextWaste}</div>
              {contextWasteScore.available ? (
                <>
                  <div className={`mt-1 font-mono text-lg font-semibold ${wasteTone[contextWasteScore.level].text}`}>
                    {contextWasteScore.score} / 100
                  </div>
                  <div className="mt-0.5 text-xs text-zinc-300">
                    {getContextWasteLevelLabel(contextWasteScore.level, language)}
                  </div>
                  <div className="mt-1 font-mono text-[10px] text-zinc-500">{t.higherMoreWaste}</div>
                </>
              ) : (
                <>
                  <div className={`mt-1 font-mono text-sm font-semibold ${wasteTone.unavailable.text}`}>{t.unavailable}</div>
                  <div className="mt-1 text-xs text-zinc-500">{t.needsAnnotatedContextWindow}</div>
                </>
              )}
            </div>
          </div>
        )}
      </section>

      <section className="flex min-h-0 flex-1 flex-col">
        <div className="flex h-9 items-center justify-between border-b border-zinc-800 px-4 font-mono text-[11px] uppercase tracking-normal text-zinc-500">
          <span>{t.executionSteps}</span>
          <span>{visibleSteps.length}/{steps.length}</span>
        </div>
        {trace === null ? (
          <div className="p-4 text-sm text-zinc-500">{t.noTraceLoaded}</div>
        ) : (
          <>
            <div className="border-b border-zinc-900 p-3">
              <input
                className="h-8 w-full border border-zinc-800 bg-zinc-950 px-2 font-mono text-[11px] text-zinc-200 outline-none placeholder:text-zinc-600 focus:border-cyan-400"
                onChange={(event) => setQuery(event.currentTarget.value)}
                placeholder={t.searchSteps}
                type="search"
                value={query}
              />
              <div className="mt-2 font-mono text-[10px] text-zinc-500">{t.keyboardHint}</div>
            </div>
            <div className="scroll-panel min-h-0 flex-1 overflow-y-auto">
              {visibleSteps.length === 0 && <div className="p-4 text-sm text-zinc-500">{t.noMatchingSteps}</div>}
              {visibleSteps.map((step) => (
              <button
                className={`grid w-full grid-cols-[2.25rem_minmax(0,1fr)] border-b text-left transition ${
                  selectedStepId === step.id
                    ? 'border-cyan-500/30 bg-cyan-500/[0.08]'
                    : 'border-zinc-900 bg-transparent hover:bg-zinc-900/70'
                }`}
                key={step.id}
                onClick={() => selectStep(step.id)}
                ref={(element) => {
                  if (element) {
                    stepRefs.current.set(step.id, element)
                  } else {
                    stepRefs.current.delete(step.id)
                  }
                }}
                title={localizeText(step.title, language)}
                type="button"
              >
                <div className="flex items-center justify-center border-r border-zinc-900 font-mono text-[11px] text-zinc-500">
                  {step.order}
                </div>
                <div className="min-w-0 px-3 py-2">
                  <div className="truncate text-sm font-medium text-zinc-100">{localizeText(step.title, language)}</div>
                  <div className="mt-1 flex items-center gap-2">
                    <span className={`h-2 w-2 rounded-full ${dotColor[step.type]}`} />
                    <span className={`font-mono text-[11px] ${textColor[step.type]}`}>{getStepTypeLabel(step.type, language)}</span>
                    <span className="font-mono text-[11px] text-zinc-500">{getStatusLabel(step.status, language)}</span>
                  </div>
                </div>
              </button>
              ))}
            </div>
          </>
        )}
      </section>
    </aside>
  )
}

function SummaryItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-r border-t border-zinc-900 px-4 py-3">
      <div className="font-mono text-[10px] uppercase tracking-normal text-zinc-500">{label}</div>
      <div className="mt-1 font-mono text-sm text-zinc-100">{value}</div>
    </div>
  )
}
