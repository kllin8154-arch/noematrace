import { useRef, useState, type ChangeEvent, type DragEvent } from 'react'
import { runAnalyzers } from '../../core/analyzers'
import { validateTrace } from '../../core/validator'
import { getCopy, localizeErrorMessage, localizeText } from '../../i18n'
import { useTraceStore } from '../../store/trace-store'
import { orderedSteps } from '../trace-utils'

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
  const [dragging, setDragging] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const language = useTraceStore((state) => state.language)
  const error = useTraceStore((state) => state.error)
  const loadTrace = useTraceStore((state) => state.loadTrace)
  const setFindings = useTraceStore((state) => state.setFindings)
  const selectStep = useTraceStore((state) => state.selectStep)
  const setActiveTab = useTraceStore((state) => state.setActiveTab)
  const setError = useTraceStore((state) => state.setError)
  const t = getCopy(language)

  async function loadText(text: string): Promise<void> {
    const result = validateTrace(text)

    if (!result.valid) {
      setError(result.errors.map((message) => localizeErrorMessage(message, language)).join('\n'))
      return
    }

    const steps = orderedSteps(result.data.steps)
    loadTrace(result.data)
    setFindings(runAnalyzers(result.data))
    selectStep(steps[0]?.id ?? null)
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

      await loadText(await response.text())
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
      await loadText(await file.text())
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

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault()
    setDragging(false)
    const file = event.dataTransfer.files[0]

    if (file) {
      void loadFile(file)
    }
  }

  return (
    <div
      className={`flex items-center gap-2 border px-2 py-1 ${
        dragging ? 'border-cyan-400 bg-cyan-500/10' : 'border-zinc-800 bg-[#090b10]'
      }`}
      onDragLeave={() => setDragging(false)}
      onDragOver={(event) => {
        event.preventDefault()
        setDragging(true)
      }}
      onDrop={handleDrop}
      title={t.dropTrace}
    >
      <select
        className="h-7 max-w-52 border border-zinc-700 bg-zinc-950 px-2 font-mono text-[11px] text-zinc-300 outline-none hover:border-cyan-500/60 focus:border-cyan-400"
        disabled={loading}
        onChange={handleExampleChange}
        value=""
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
        <div className="fixed right-4 top-14 z-50 max-w-lg whitespace-pre-wrap border border-red-500/45 bg-red-950/95 px-3 py-2 font-mono text-[11px] leading-5 text-red-100 shadow-xl">
          {error}
        </div>
      )}
    </div>
  )
}
