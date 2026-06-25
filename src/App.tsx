import { useEffect, useRef, useState, type DragEvent as ReactDragEvent } from 'react'
import { Header } from './components/layout/Header'
import { LeftSidebar } from './components/layout/LeftSidebar'
import { MainWorkspace } from './components/layout/MainWorkspace'
import { RightPanel } from './components/layout/RightPanel'
import { orderedSteps } from './components/trace-utils'
import { prepareTraceLoad } from './core/trace-loader'
import { getCopy } from './i18n'
import { useTraceStore, type ViewTab } from './store/trace-store'

const keyboardTabs: ViewTab[] = ['graph', 'timeline', 'failures', 'budget', 'report']

function App() {
  const [dragDepth, setDragDepth] = useState(0)
  const [dropLoading, setDropLoading] = useState(false)
  const defaultExampleLoadAttempted = useRef(false)
  const trace = useTraceStore((state) => state.trace)
  const loadTrace = useTraceStore((state) => state.loadTrace)
  const setFindings = useTraceStore((state) => state.setFindings)
  const selectedStepId = useTraceStore((state) => state.selectedStepId)
  const selectStep = useTraceStore((state) => state.selectStep)
  const setActiveTab = useTraceStore((state) => state.setActiveTab)
  const setError = useTraceStore((state) => state.setError)
  const language = useTraceStore((state) => state.language)
  const t = getCopy(language)

  useEffect(() => {
    if (trace !== null || defaultExampleLoadAttempted.current) {
      return
    }

    let cancelled = false

    async function loadDefaultExample() {
      try {
        const response = await fetch('/examples/successful-coding-agent.json')

        if (!response.ok) {
          throw new Error(`${t.defaultExampleLoadFailed}: ${response.status} ${response.statusText}`)
        }

        const result = prepareTraceLoad(await response.text(), language)

        if (!result.ok) {
          throw new Error(result.error)
        }

        if (cancelled) {
          return
        }

        defaultExampleLoadAttempted.current = true
        loadTrace(result.trace, 'successful-coding-agent.json')
        setFindings(result.findings)
        selectStep(result.firstStepId)
      } catch (error) {
        if (!cancelled) {
          defaultExampleLoadAttempted.current = true
          setError(error instanceof Error ? error.message : String(error))
        }
      }
    }

    void loadDefaultExample()

    return () => {
      cancelled = true
    }
  }, [language, loadTrace, selectStep, setError, setFindings, t.defaultExampleLoadFailed, trace])

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      const target = event.target

      if (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement || target instanceof HTMLSelectElement) {
        return
      }

      if (event.key === 'Escape') {
        setError(null)
        return
      }

      const tabIndex = Number(event.key) - 1
      if (tabIndex >= 0 && tabIndex < keyboardTabs.length) {
        event.preventDefault()
        setActiveTab(keyboardTabs[tabIndex])
        return
      }

      if (!trace || (event.key !== 'ArrowDown' && event.key !== 'ArrowUp')) {
        return
      }

      const steps = orderedSteps(trace.steps)
      const currentIndex = Math.max(0, steps.findIndex((step) => step.id === selectedStepId))
      const nextIndex =
        event.key === 'ArrowDown'
          ? Math.min(currentIndex + 1, steps.length - 1)
          : Math.max(currentIndex - 1, 0)

      event.preventDefault()
      selectStep(steps[nextIndex]?.id ?? null)
    }

    window.addEventListener('keydown', handleKeyDown)

    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [selectStep, selectedStepId, setActiveTab, setError, trace])

  async function loadDroppedFile(file: File) {
    setDropLoading(true)

    try {
      const result = prepareTraceLoad(await file.text(), language)

      if (!result.ok) {
        setError(result.error)
        return
      }

      loadTrace(result.trace, file.name)
      setFindings(result.findings)
      selectStep(result.firstStepId)
      setActiveTab('graph')
      setError(null)
    } catch (error) {
      setError(error instanceof Error ? error.message : String(error))
    } finally {
      setDropLoading(false)
    }
  }

  function handleDragEnter(event: ReactDragEvent<HTMLDivElement>) {
    if (!hasDraggedFiles(event)) {
      return
    }

    event.preventDefault()
    setDragDepth((depth) => depth + 1)
  }

  function handleDragOver(event: ReactDragEvent<HTMLDivElement>) {
    if (!hasDraggedFiles(event)) {
      return
    }

    event.preventDefault()
  }

  function handleDragLeave(event: ReactDragEvent<HTMLDivElement>) {
    if (!hasDraggedFiles(event)) {
      return
    }

    event.preventDefault()
    setDragDepth((depth) => Math.max(0, depth - 1))
  }

  function handleDrop(event: ReactDragEvent<HTMLDivElement>) {
    if (!hasDraggedFiles(event)) {
      return
    }

    event.preventDefault()
    setDragDepth(0)

    const file = event.dataTransfer.files[0]

    if (file) {
      void loadDroppedFile(file)
    }
  }

  return (
    <div
      className="relative flex h-screen min-h-0 flex-col overflow-hidden bg-[#08090d] text-zinc-100"
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      <Header />
      <div className="grid min-h-0 flex-1 grid-cols-[minmax(12rem,16rem)_minmax(0,1fr)_auto] 2xl:grid-cols-[19rem_minmax(0,1fr)_auto]">
        <LeftSidebar />
        <MainWorkspace />
        <RightPanel />
      </div>
      {(dragDepth > 0 || dropLoading) && (
        <div className="pointer-events-none absolute inset-3 z-40 grid place-items-center border border-cyan-400/70 bg-cyan-950/35 backdrop-blur-sm">
          <div className="border border-cyan-400/60 bg-[#07080c]/95 px-6 py-5 text-center shadow-2xl shadow-cyan-950/40">
            <div className="font-mono text-[11px] uppercase tracking-normal text-cyan-300">
              {dropLoading ? t.loadingTrace : t.dragOverlayTitle}
            </div>
            <div className="mt-2 text-sm text-zinc-300">{t.dragOverlayBody}</div>
          </div>
        </div>
      )}
    </div>
  )
}

function hasDraggedFiles(event: ReactDragEvent<HTMLElement>): boolean {
  return Array.from(event.dataTransfer.types).includes('Files')
}

export default App
