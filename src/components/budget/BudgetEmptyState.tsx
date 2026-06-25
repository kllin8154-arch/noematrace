import { getCopy } from '../../i18n'
import { useTraceStore } from '../../store/trace-store'

export function BudgetEmptyState() {
  const language = useTraceStore((state) => state.language)
  const t = getCopy(language)

  return (
    <div className="max-w-2xl border border-dashed border-zinc-800 bg-[#07080c]/90 p-6">
      <h3 className="text-base font-semibold text-zinc-100">{t.contextRequired}</h3>
      <p className="mt-3 text-sm leading-6 text-zinc-500">{t.contextRequiredBody}</p>
      <code className="mt-5 block border border-zinc-900 bg-zinc-950 p-3 font-mono text-[11px] leading-5 text-cyan-200">
        llm_call.contextWindow.blocks[]
      </code>
    </div>
  )
}
