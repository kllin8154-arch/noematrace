import hljs from 'highlight.js'
import { getCopy, getStatusLabel, getStepTypeLabel, localizeText, localizeValue } from '../../i18n'
import { useTraceStore } from '../../store/trace-store'
import type { TraceStep } from '../../types/schema'
import { formatCost, formatLatency, formatTokens, stepCostTotal, stepTokenTotal, stepTypeTone } from '../trace-utils'

const statusColor: Record<TraceStep['status'], string> = {
  success: 'border-green-500/40 bg-green-500/10 text-green-200',
  warning: 'border-orange-500/40 bg-orange-500/10 text-orange-200',
  error: 'border-red-500/40 bg-red-500/10 text-red-200',
}

export function StepDetail({ step }: { step: TraceStep }) {
  const language = useTraceStore((state) => state.language)
  const t = getCopy(language)
  const tone = step.status === 'error' ? stepTypeTone.error : stepTypeTone[step.type]

  return (
    <div>
      <div className="border-b border-zinc-800 px-4 py-4">
        <h3 className="text-base font-semibold text-zinc-100">{localizeText(step.title, language)}</h3>
        <div className="mt-3 flex flex-wrap gap-2">
          <span className={`border px-2 py-0.5 font-mono text-[11px] ${tone.border} ${tone.text}`}>
            {getStepTypeLabel(step.type, language)}
          </span>
          <span className={`border px-2 py-0.5 font-mono text-[11px] ${statusColor[step.status]}`}>
            {getStatusLabel(step.status, language)}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 border-b border-zinc-900 text-xs">
        <Metric label={t.model} value={step.model === undefined ? '-' : localizeText(step.model, language)} />
        <Metric label={t.tool} value={step.tool?.name ?? '-'} />
        <Metric label={t.latency} value={formatLatency(step.latencyMs)} />
        <Metric label={t.tokens} value={formatTokens(stepTokenTotal(step))} />
        <Metric label={t.cost} value={formatCost(stepCostTotal(step))} />
        <Metric label="ID" value={step.id} />
      </div>

      <div className="divide-y divide-zinc-900">
        {step.tool?.arguments !== undefined && (
          <JsonBlock
            label={language === 'zh' ? '工具参数' : 'tool.arguments'}
            noData={t.noData}
            value={localizeValue(step.tool.arguments, language)}
          />
        )}
        <JsonBlock label={t.input} noData={t.noData} value={localizeValue(step.input ?? null, language)} />
        <JsonBlock label={t.output} noData={t.noData} value={localizeValue(step.output ?? null, language)} />
        <JsonBlock label={t.error} noData={t.noData} value={localizeValue(step.error ?? null, language)} />
        <JsonBlock
          label={language === 'zh' ? '上下文窗口' : 'contextWindow'}
          noData={t.noData}
          value={localizeValue(step.contextWindow ?? null, language)}
        />
        <details className="px-4 py-3">
          <summary className="cursor-pointer font-mono text-[10px] uppercase tracking-normal text-zinc-600">{t.metadata}</summary>
          <div className="mt-2">
            <HighlightedCode code={toDisplayCode(localizeValue(step.metadata ?? null, language), t.noData)} />
          </div>
        </details>
      </div>
    </div>
  )
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-r border-t border-zinc-900 px-4 py-3">
      <div className="font-mono text-[10px] uppercase tracking-normal text-zinc-600">{label}</div>
      <div className="mt-1 min-w-0 break-words font-mono text-xs text-zinc-300">{value}</div>
    </div>
  )
}

function JsonBlock({ label, noData, value }: { label: string; noData: string; value: unknown }) {
  const code = toDisplayCode(value, noData)

  return (
    <div className="px-4 py-3">
      <div className="mb-2 font-mono text-[10px] uppercase tracking-normal text-zinc-600">{label}</div>
      <HighlightedCode code={code} />
    </div>
  )
}

function HighlightedCode({ code }: { code: string }) {
  const html = highlightJson(code)

  return (
    <pre className="max-h-56 overflow-auto whitespace-pre-wrap break-words border border-zinc-900 bg-[#07080c] p-3 font-mono text-[11px] leading-5 text-zinc-300">
      <code className="hljs language-json" dangerouslySetInnerHTML={{ __html: html }} />
    </pre>
  )
}

function toDisplayCode(value: unknown, noData: string): string {
  if (value === null || value === undefined) {
    return noData
  }

  return JSON.stringify(value, null, 2)
}

function highlightJson(code: string): string {
  try {
    return hljs.highlight(code, { language: 'json', ignoreIllegals: true }).value
  } catch {
    return escapeHtml(code)
  }
}

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;')
}
