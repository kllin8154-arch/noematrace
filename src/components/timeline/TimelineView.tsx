import { getCopy, getStatusLabel, getStepTypeLabel, localizeText } from '../../i18n'
import { useTraceStore } from '../../store/trace-store'
import type { TraceStep } from '../../types/schema'
import { formatCost, formatLatency, formatTokens, orderedSteps, stepCostTotal, stepTokenTotal, stepTypeTone } from '../trace-utils'

export function TimelineView() {
  const trace = useTraceStore((state) => state.trace)
  const selectedStepId = useTraceStore((state) => state.selectedStepId)
  const selectStep = useTraceStore((state) => state.selectStep)
  const language = useTraceStore((state) => state.language)
  const t = getCopy(language)
  const steps = orderedSteps(trace?.steps ?? [])
  const maxLatency = Math.max(1, ...steps.map((step) => step.latencyMs ?? 0))

  if (!trace) {
    return (
      <div className="workspace-surface flex h-full min-h-0 items-center justify-center overflow-auto p-6">
        <div className="border border-zinc-800 bg-[#07080c]/90 px-4 py-3 font-mono text-xs text-zinc-500">{t.timelineEmpty}</div>
      </div>
    )
  }

  return (
    <div className="workspace-surface scroll-panel h-full min-h-0 overflow-auto p-6">
      <div className="mb-5 flex items-center justify-between">
        <div className="font-mono text-[11px] uppercase tracking-normal text-zinc-600">{t.timeline}</div>
        <div className="font-mono text-[11px] text-zinc-600">
          {t.maxLatency} {formatLatency(maxLatency)}
        </div>
      </div>

      <div className="space-y-2">
        {steps.map((step) => (
          <TimelineRow
            key={step.id}
            maxLatency={maxLatency}
            onSelect={() => selectStep(step.id)}
            selected={selectedStepId === step.id}
            step={step}
          />
        ))}
      </div>
    </div>
  )
}

function TimelineRow({
  maxLatency,
  onSelect,
  selected,
  step,
}: {
  maxLatency: number
  onSelect: () => void
  selected: boolean
  step: TraceStep
}) {
  const language = useTraceStore((state) => state.language)
  const t = getCopy(language)
  const tone = step.status === 'error' ? stepTypeTone.error : stepTypeTone[step.type]
  const latency = step.latencyMs ?? 0
  const width = Math.max(2, (latency / maxLatency) * 100)
  const title = [
    localizeText(step.title, language),
    getStepTypeLabel(step.type, language),
    getStatusLabel(step.status, language),
    formatLatency(step.latencyMs),
    `${formatTokens(stepTokenTotal(step))} ${t.tokens}`,
    formatCost(stepCostTotal(step)),
  ].join(' · ')

  return (
    <button
      className={`grid w-full grid-cols-[3rem_13rem_minmax(0,1fr)_5rem] items-center gap-3 border px-3 py-2 text-left transition ${
        selected ? 'border-cyan-500/45 bg-cyan-500/[0.08]' : 'border-zinc-900 bg-[#0a0b10]/80 hover:border-zinc-700'
      }`}
      onClick={onSelect}
      title={title}
      type="button"
    >
      <div className="font-mono text-[11px] text-zinc-600">#{step.order}</div>
      <div className="min-w-0">
        <div className="truncate text-sm font-medium text-zinc-100">{localizeText(step.title, language)}</div>
        <div className={`mt-1 font-mono text-[10px] ${tone.text}`}>{getStepTypeLabel(step.type, language)}</div>
      </div>
      <div className="h-6 border border-zinc-800 bg-zinc-950">
        <div className="h-full" style={{ width: `${width}%`, backgroundColor: tone.hex, opacity: step.status === 'error' ? 0.82 : 0.38 }} />
      </div>
      <div className="text-right font-mono text-[11px] text-zinc-500">{formatLatency(step.latencyMs)}</div>
    </button>
  )
}
