import { useEffect, useRef, useState, type ChangeEvent } from 'react'
import { prepareTraceLoad } from '../../core/trace-loader'
import { getCopy, localizeText } from '../../i18n'
import { useTraceStore } from '../../store/trace-store'

type ExampleTrace = {
  path: string
  title: string
}

const examples: ExampleTrace[] = [
  { path: '/examples/successful-coding-agent.json', title: 'Successful Coding Agent' },
  { path: '/examples/failed-tool-loop.json', title: 'Failed Tool Loop' },
  { path: '/examples/error-cascade.json', title: 'Error Cascade' },
  { path: '/examples/context-waste-run.json', title: 'Context Waste Run' },
]

export function TraceUploader() {
  const [loading, setLoading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const language = useTraceStore((state) => state.language)
  const error = useTraceStore((state) => state.error)
  const sourceName = useTraceStore((state) => state.sourceName)
  const loadTrace = useTraceStore((state) => state.loadTrace)
  const setFindings = useTraceStore((state) => state.setFindings)
  const selectStep = useTraceStore((state) => state.selectStep)
  const setActiveTab = useTraceStore((state) => state.setActiveTab)
  const setError = useTraceStore((state) => state.setError)
  const t = getCopy(language)
  const selectedExamplePath = examples.find((example) => example.path.endsWith(`/${sourceName ?? ''}`))?.path ?? ''

  useEffect(() => {
    if (!error) {
      return
    }

    const timeoutId = window.setTimeout(() => setError(null), 7000)

    return () => window.clearTimeout(timeoutId)
  }, [error, setError])

  async function loadText(text: string, sourceName: string): Promise<void> {
    const result = prepareTraceLoad(text, language)

    if (!result.ok) {
      setError(result.error)
      return
    }

    loadTrace(result.trace, sourceName)
    setFindings(result.findings)
    selectStep(result.firstStepId)
    setActiveTab('graph')
    setError(null)
  }

  async function loadExample(path: string): Promise<void> {
    if (!path) {
      return
    }

    setLoading(true)
    try {
      const response = await fetch(path)

      if (!response.ok) {
        setError(`${t.loadExample}: ${response.status} ${response.statusText}`)
        return
      }

      await loadText(await response.text(), path.split('/').at(-1) ?? path)
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  async function loadFile(file: File): Promise<void> {
    setLoading(true)
    try {
      await loadText(await file.text(), file.name)
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  function handleExampleChange(event: ChangeEvent<HTMLSelectElement>) {
    void loadExample(event.currentTarget.value)
  }

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.currentTarget.files?.[0]

    if (file) {
      void loadFile(file)
    }

    event.currentTarget.value = ''
  }

  return (
    <div
      className="flex items-center gap-2 border border-zinc-800 bg-[#090b10] px-2 py-1"
      title={t.dropTrace}
    >
      <select
        className="h-7 max-w-52 border border-zinc-700 bg-zinc-950 px-2 font-mono text-[11px] text-zinc-300 outline-none hover:border-cyan-500/60 focus:border-cyan-400"
        disabled={loading}
        onChange={handleExampleChange}
        value={selectedExamplePath}
      >
        <option value="">{loading ? t.loadingTrace : t.chooseExample}</option>
        {examples.map((example) => (
          <option key={example.path} value={example.path}>
            {localizeText(example.title, language)}
          </option>
        ))}
      </select>

      <input accept="application/json,.json" className="hidden" onChange={handleFileChange} ref={inputRef} type="file" />
      <button
        className="h-7 border border-zinc-700 bg-zinc-900 px-3 font-mono text-[11px] text-zinc-300 hover:border-cyan-500/60 hover:text-cyan-200 disabled:cursor-wait disabled:text-zinc-600"
        disabled={loading}
        onClick={() => inputRef.current?.click()}
        type="button"
      >
        {t.chooseFile}
      </button>

      {error && (
        <div
          className="fixed right-4 top-14 z-50 max-w-lg whitespace-pre-wrap border border-red-500/45 bg-red-950/95 px-3 py-2 font-mono text-[11px] leading-5 text-red-100 shadow-xl"
          role="alert"
        >
          <div className="flex items-start gap-3">
            <span>{error}</span>
            <button
              className="shrink-0 border border-red-300/30 px-1.5 py-0.5 text-[10px] text-red-100 hover:border-red-200"
              onClick={() => setError(null)}
              type="button"
            >
              {t.dismiss}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
