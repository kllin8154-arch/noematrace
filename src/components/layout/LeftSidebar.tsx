import { getCopy, getStatusLabel, getStepTypeLabel, localizeText } from '../../i18n'
import { useTraceStore } from '../../store/trace-store'
import type { TraceStep } from '../../types/schema'
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

export function LeftSidebar() {
  const trace = useTraceStore((state) => state.trace)
  const findings = useTraceStore((state) => state.findings)
  const selectedStepId = useTraceStore((state) => state.selectedStepId)
  const language = useTraceStore((state) => state.language)
  const selectStep = useTraceStore((state) => state.selectStep)
  const t = getCopy(language)

  const steps = orderedSteps(trace?.steps ?? [])
  const totalTokens = steps.reduce((sum, step) => sum + stepTokenTotal(step), 0)
  const totalCost = steps.reduce((sum, step) => sum + stepCostTotal(step), 0)
  const errorCount = steps.filter((step) => step.status === 'error').length
  const warningCount = steps.filter((step) => step.status === 'warning').length

  return (
    <aside className="flex min-h-0 w-[19rem] shrink-0 flex-col border-r border-zinc-800 bg-[#0a0b10]">
      <section className="border-b border-zinc-800">
        <div className="border-b border-zinc-900 px-4 py-3">
          <p className="font-mono text-[11px] uppercase tracking-normal text-zinc-500">{t.traceSummary}</p>
          <h2 className="mt-1 truncate text-sm font-medium text-zinc-100">
            {trace ? localizeText(trace.title, language) : t.noTraceLoaded}
          </h2>
          <p className="mt-1 truncate font-mono text-[11px] text-zinc-600">{trace?.traceId ?? '-'}</p>
        </div>
        <div className="grid grid-cols-2 text-xs">
          <SummaryItem label={t.steps} value={trace ? steps.length.toString() : '-'} />
          <SummaryItem label={t.tokens} value={trace ? formatTokens(totalTokens) : '-'} />
          <SummaryItem label={t.cost} value={trace ? formatCost(totalCost) : '-'} />
          <SummaryItem label={t.errors} value={trace ? errorCount.toString() : '-'} />
          <SummaryItem label={t.warnings} value={trace ? warningCount.toString() : '-'} />
          <SummaryItem label={t.findings} value={trace ? findings.length.toString() : '-'} />
        </div>
      </section>

      <section className="flex min-h-0 flex-1 flex-col">
        <div className="flex h-9 items-center justify-between border-b border-zinc-800 px-4 font-mono text-[11px] uppercase tracking-normal text-zinc-500">
          <span>{t.executionSteps}</span>
          <span>{steps.length}</span>
        </div>
        {trace === null ? (
          <div className="p-4 text-sm text-zinc-500">{t.noTraceLoaded}</div>
        ) : (
          <div className="min-h-0 flex-1 overflow-y-auto">
            {steps.map((step) => (
              <button
                className={`grid w-full grid-cols-[2.25rem_minmax(0,1fr)] border-b text-left transition ${
                  selectedStepId === step.id
                    ? 'border-cyan-500/30 bg-cyan-500/[0.08]'
                    : 'border-zinc-900 bg-transparent hover:bg-zinc-900/70'
                }`}
                key={step.id}
                onClick={() => selectStep(step.id)}
                type="button"
              >
                <div className="flex items-center justify-center border-r border-zinc-900 font-mono text-[11px] text-zinc-600">
                  {step.order}
                </div>
                <div className="min-w-0 px-3 py-2">
                  <div className="truncate text-sm font-medium text-zinc-100">{localizeText(step.title, language)}</div>
                  <div className="mt-1 flex items-center gap-2">
                    <span className={`h-2 w-2 rounded-full ${dotColor[step.type]}`} />
                    <span className={`font-mono text-[11px] ${textColor[step.type]}`}>{getStepTypeLabel(step.type, language)}</span>
                    <span className="font-mono text-[11px] text-zinc-600">{getStatusLabel(step.status, language)}</span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </section>
    </aside>
  )
}

function SummaryItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-r border-t border-zinc-900 px-4 py-3">
      <div className="font-mono text-[10px] uppercase tracking-normal text-zinc-600">{label}</div>
      <div className="mt-1 font-mono text-sm text-zinc-100">{value}</div>
    </div>
  )
}
