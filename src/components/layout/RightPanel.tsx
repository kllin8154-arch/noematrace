import { useState } from 'react'
import { StepDetail } from '../detail/StepDetail'
import { getCopy } from '../../i18n'
import { useTraceStore } from '../../store/trace-store'

export function RightPanel() {
  const [collapsed, setCollapsed] = useState(false)
  const trace = useTraceStore((state) => state.trace)
  const selectedStepId = useTraceStore((state) => state.selectedStepId)
  const language = useTraceStore((state) => state.language)
  const selectedStep = trace?.steps.find((step) => step.id === selectedStepId) ?? null
  const t = getCopy(language)

  if (collapsed) {
    return (
      <aside className="flex w-10 shrink-0 justify-center border-l border-zinc-800 bg-[#0a0b10] py-2">
        <button
          className="h-7 w-7 border border-zinc-700 font-mono text-xs text-zinc-300 hover:border-cyan-500/60 hover:text-cyan-200"
          onClick={() => setCollapsed(false)}
          title={t.expandDetails}
          type="button"
        >
          &lt;
        </button>
      </aside>
    )
  }

  return (
    <aside className="flex min-h-0 w-[18rem] shrink-0 flex-col border-l border-zinc-800 bg-[#0a0b10] lg:w-[20rem] 2xl:w-[24rem]">
      <div className="flex h-10 shrink-0 items-center justify-between border-b border-zinc-800 px-4">
        <h2 className="font-mono text-[12px] uppercase tracking-normal text-zinc-400">{t.selectedStep}</h2>
        <button
          className="h-7 border border-zinc-700 px-2 font-mono text-[11px] text-zinc-300 hover:border-cyan-500/60 hover:text-cyan-200"
          onClick={() => setCollapsed(true)}
          type="button"
        >
          {t.collapse}
        </button>
      </div>
      <div className="scroll-panel min-h-0 flex-1 overflow-auto">
        {selectedStep ? (
          <StepDetail step={selectedStep} />
        ) : (
          <div className="p-4 text-sm text-zinc-500">{t.selectStep}</div>
        )}
      </div>
    </aside>
  )
}
