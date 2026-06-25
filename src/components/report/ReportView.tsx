import { useEffect, useMemo, useState } from 'react'
import { generateMarkdownReport } from '../../core/report'
import { getCopy } from '../../i18n'
import { useTraceStore } from '../../store/trace-store'

export function ReportView() {
  const [status, setStatus] = useState<string | null>(null)
  const trace = useTraceStore((state) => state.trace)
  const findings = useTraceStore((state) => state.findings)
  const language = useTraceStore((state) => state.language)
  const t = getCopy(language)
  const markdown = useMemo(() => (trace ? generateMarkdownReport(trace, findings, language) : ''), [findings, language, trace])

  useEffect(() => {
    if (!status) {
      return
    }

    const timeoutId = window.setTimeout(() => setStatus(null), 2500)

    return () => window.clearTimeout(timeoutId)
  }, [status])

  async function copyReport() {
    if (!markdown) {
      return
    }

    try {
      await navigator.clipboard.writeText(markdown)
      setStatus(t.copied)
      return
    } catch {
      if (copyTextFallback(markdown)) {
        setStatus(t.copied)
        return
      }
    }

    setStatus(t.copyFailed)
  }

  function downloadReport() {
    if (!trace || !markdown) {
      return
    }

    const blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8' })
    const href = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = href
    link.download = `${trace.traceId || 'noematrace'}-report.md`
    link.click()
    URL.revokeObjectURL(href)
    setStatus(t.downloaded)
  }

  return (
    <div className="workspace-surface flex h-full min-h-0 flex-col overflow-hidden p-6">
      <div className="mb-5 flex shrink-0 items-center justify-between">
        <div className="font-mono text-[11px] uppercase tracking-normal text-zinc-600">{t.report}</div>
        <div className="flex items-center gap-2">
          {status && <span className="font-mono text-[11px] text-cyan-300">{status}</span>}
          <button
            className="h-7 border border-zinc-700 bg-zinc-900 px-3 font-mono text-[11px] text-zinc-300 hover:border-cyan-500/60 hover:text-cyan-200 disabled:cursor-not-allowed disabled:text-zinc-600"
            disabled={!markdown}
            onClick={() => void copyReport()}
            type="button"
          >
            {t.copyReport}
          </button>
          <button
            className="h-7 border border-cyan-500/50 bg-cyan-500/10 px-3 font-mono text-[11px] text-cyan-200 hover:bg-cyan-500/15 disabled:cursor-not-allowed disabled:border-zinc-800 disabled:bg-zinc-900 disabled:text-zinc-600"
            disabled={!markdown}
            onClick={downloadReport}
            type="button"
          >
            {t.downloadReport}
          </button>
        </div>
      </div>

      {markdown ? (
        <pre className="scroll-panel min-h-0 flex-1 overflow-auto whitespace-pre-wrap border border-zinc-900 bg-[#07080c]/95 p-4 font-mono text-xs leading-6 text-zinc-300">
          {markdown}
        </pre>
      ) : (
        <div className="max-w-2xl border border-zinc-800 bg-[#07080c]/90 p-4 text-sm text-zinc-500">{t.noReport}</div>
      )}
    </div>
  )
}

function copyTextFallback(text: string) {
  const textarea = document.createElement('textarea')
  textarea.value = text
  textarea.setAttribute('readonly', 'true')
  textarea.style.position = 'fixed'
  textarea.style.left = '-9999px'
  textarea.style.top = '0'

  document.body.appendChild(textarea)
  textarea.select()

  try {
    return document.execCommand('copy')
  } catch {
    return false
  } finally {
    document.body.removeChild(textarea)
  }
}
