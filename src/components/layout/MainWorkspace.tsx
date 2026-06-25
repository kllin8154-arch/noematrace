import { getCopy } from '../../i18n'
import { ContextBudgetView } from '../budget/ContextBudgetView'
import { FailuresView } from '../failures/FailuresView'
import { TraceGraph } from '../graph/TraceGraph'
import { ReportView } from '../report/ReportView'
import { TimelineView } from '../timeline/TimelineView'
import { useTraceStore, type ViewTab } from '../../store/trace-store'

const tabs: ViewTab[] = [
  'graph',
  'timeline',
  'failures',
  'budget',
  'report',
]

export function MainWorkspace() {
  const activeTab = useTraceStore((state) => state.activeTab)
  const language = useTraceStore((state) => state.language)
  const setActiveTab = useTraceStore((state) => state.setActiveTab)
  const t = getCopy(language)

  return (
    <main className="flex min-h-0 min-w-0 flex-1 flex-col bg-[#08090d]">
      <nav className="workspace-tabs flex h-10 shrink-0 items-center overflow-x-auto border-b border-zinc-800 bg-[#0b0d12] px-3">
        {tabs.map((tab) => (
          <button
            className={`h-10 shrink-0 whitespace-nowrap border-b-2 px-4 font-mono text-[12px] transition ${
              activeTab === tab
                ? 'border-cyan-400 text-cyan-200'
                : 'border-transparent text-zinc-500 hover:text-zinc-200'
            }`}
            key={tab}
            onClick={() => setActiveTab(tab)}
            type="button"
          >
            {t[tab]}
          </button>
        ))}
      </nav>
      <section className="min-h-0 flex-1 overflow-hidden">
        {activeTab === 'graph' && <TraceGraph />}
        {activeTab === 'timeline' && <TimelineView />}
        {activeTab === 'failures' && <FailuresView />}
        {activeTab === 'budget' && <ContextBudgetView />}
        {activeTab === 'report' && <ReportView />}
      </section>
    </main>
  )
}
