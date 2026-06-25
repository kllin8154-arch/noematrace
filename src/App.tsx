import { useEffect } from 'react'
import { Header } from './components/layout/Header'
import { LeftSidebar } from './components/layout/LeftSidebar'
import { MainWorkspace } from './components/layout/MainWorkspace'
import { RightPanel } from './components/layout/RightPanel'
import { orderedSteps } from './components/trace-utils'
import { runAnalyzers } from './core/analyzers'
import { validateTrace } from './core/validator'
import { getCopy, localizeErrorMessage } from './i18n'
import { useTraceStore } from './store/trace-store'

function App() {
  const trace = useTraceStore((state) => state.trace)
  const loadTrace = useTraceStore((state) => state.loadTrace)
  const setFindings = useTraceStore((state) => state.setFindings)
  const selectStep = useTraceStore((state) => state.selectStep)
  const setError = useTraceStore((state) => state.setError)
  const language = useTraceStore((state) => state.language)
  const t = getCopy(language)

  useEffect(() => {
    if (trace !== null) {
      return
    }

    let cancelled = false

    async function loadDefaultExample() {
      try {
        const response = await fetch('/examples/successful-coding-agent.json')

        if (!response.ok) {
          throw new Error(`${t.defaultExampleLoadFailed}: ${response.status} ${response.statusText}`)
        }

        const result = validateTrace(await response.text())

        if (!result.valid) {
          throw new Error(result.errors.map((message) => localizeErrorMessage(message, language)).join('\n'))
        }

        if (cancelled) {
          return
        }

        const steps = orderedSteps(result.data.steps)
        loadTrace(result.data)
        setFindings(runAnalyzers(result.data))
        selectStep(steps[0]?.id ?? null)
      } catch (error) {
        if (!cancelled) {
          setError(error instanceof Error ? error.message : String(error))
        }
      }
    }

    void loadDefaultExample()

    return () => {
      cancelled = true
    }
  }, [language, loadTrace, selectStep, setError, setFindings, t.defaultExampleLoadFailed, trace])

  return (
    <div className="flex h-screen min-h-0 min-w-[72rem] flex-col overflow-hidden bg-[#08090d] text-zinc-100">
      <Header />
      <div className="grid min-h-0 flex-1 grid-cols-[19rem_minmax(0,1fr)_auto]">
        <LeftSidebar />
        <MainWorkspace />
        <RightPanel />
      </div>
    </div>
  )
}

export default App
