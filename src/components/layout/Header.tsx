import { getCopy } from '../../i18n'
import { useTraceStore } from '../../store/trace-store'
import { generateMarkdownReport } from '../../core/report'
import { TraceUploader } from '../upload/TraceUploader'

export function Header() {
  const trace = useTraceStore((state) => state.trace)
  const findings = useTraceStore((state) => state.findings)
  const language = useTraceStore((state) => state.language)
  const toggleLanguage = useTraceStore((state) => state.toggleLanguage)
  const setError = useTraceStore((state) => state.setError)
  const t = getCopy(language)

  function downloadReport() {
    if (!trace) {
      setError(t.noReport)
      return
    }

    const markdown = generateMarkdownReport(trace, findings, language)
    const blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8' })
    const href = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = href
    link.download = `${trace.traceId || 'noematrace'}-report.md`
    link.click()
    URL.revokeObjectURL(href)
  }

  return (
    <header className="flex h-12 shrink-0 items-center justify-between border-b border-zinc-800 bg-[#0b0d12] px-4">
      <div className="flex items-center gap-3">
        <img alt="" className="h-7 w-7 shrink-0" src="/favicon.svg" />
        <div>
          <h1 className="text-sm font-semibold tracking-normal text-zinc-100">NoemaTrace</h1>
          <p className="font-mono text-[11px] text-zinc-500">{t.appSubtitle}</p>
        </div>
        <div className="ml-3 hidden h-5 items-center border-l border-zinc-800 pl-3 font-mono text-[11px] text-zinc-500 md:flex">
          {t.schemaVersion}
        </div>
      </div>

      <div className="flex min-w-0 items-center gap-2">
        <button
          className="h-7 border border-zinc-700 bg-transparent px-3 font-mono text-[11px] text-zinc-400 hover:border-cyan-500/60 hover:text-cyan-200"
          onClick={toggleLanguage}
          type="button"
        >
          {t.switchLanguage}
        </button>
        <TraceUploader />
        <button
          className="h-7 border border-cyan-500/50 bg-cyan-500/10 px-3 font-mono text-[11px] text-cyan-200 hover:bg-cyan-500/15"
          onClick={downloadReport}
          type="button"
        >
          {t.exportReport}
        </button>
      </div>
    </header>
  )
}
