import type { Finding } from '../../types/schema'
import { getCopy, getRuleLabel, getSeverityLabel, localizeFinding } from '../../i18n'
import { useTraceStore } from '../../store/trace-store'
import { severityTone } from '../trace-utils'

const severityRank: Record<Finding['severity'], number> = {
  critical: 0,
  warning: 1,
  info: 2,
}

export function FailuresView() {
  const findings = useTraceStore((state) => state.findings)
  const selectedStepId = useTraceStore((state) => state.selectedStepId)
  const selectStep = useTraceStore((state) => state.selectStep)
  const language = useTraceStore((state) => state.language)
  const t = getCopy(language)
  const sortedFindings = [...findings].sort(
    (left, right) => severityRank[left.severity] - severityRank[right.severity] || left.id.localeCompare(right.id),
  )

  return (
    <div className="workspace-surface min-h-full p-6">
      <div className="mb-5 flex items-center justify-between">
        <div className="font-mono text-[11px] uppercase tracking-normal text-zinc-600">{t.findings}</div>
        <div className="font-mono text-[11px] text-zinc-600">{sortedFindings.length}</div>
      </div>

      {sortedFindings.length === 0 ? (
        <div className="max-w-2xl border border-zinc-800 bg-[#07080c]/90 p-4 text-sm text-zinc-500">{t.noFindings}</div>
      ) : (
        <div className="grid max-w-4xl gap-3">
          {sortedFindings.map((finding) => {
            const tone = severityTone[finding.severity]
            const active = finding.stepIds.includes(selectedStepId ?? '')
            const visibleFinding = localizeFinding(finding, language)

            return (
              <button
                className={`border p-4 text-left transition ${
                  active ? 'border-cyan-500/50 bg-cyan-500/[0.07]' : `${tone.border} ${tone.bg} hover:border-cyan-500/45`
                }`}
                key={finding.id}
                onClick={() => selectStep(finding.stepIds[0] ?? null)}
                type="button"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`border px-2 py-0.5 font-mono text-[10px] uppercase ${tone.border} ${tone.text}`}>
                    {getSeverityLabel(finding.severity, language)}
                  </span>
                  <span className="border border-zinc-700 px-2 py-0.5 font-mono text-[10px] text-zinc-400">
                    {getRuleLabel(finding.ruleId, language)}
                  </span>
                  {finding.experimental && (
                    <span className="border border-purple-500/40 px-2 py-0.5 font-mono text-[10px] text-purple-200">
                      {t.experimental}
                    </span>
                  )}
                </div>
                <h3 className="mt-3 text-base font-semibold text-zinc-100">{visibleFinding.title}</h3>
                <p className="mt-2 text-sm leading-6 text-zinc-400">{visibleFinding.description}</p>
                <div className="mt-3 font-mono text-[11px] text-zinc-500">
                  {t.affectedSteps}: {finding.stepIds.join(', ')}
                </div>
                <p className="mt-3 border-t border-zinc-800 pt-3 text-sm leading-6 text-zinc-300">
                  <span className="font-mono text-[11px] uppercase text-zinc-600">{t.recommendation}: </span>
                  {visibleFinding.recommendation}
                </p>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
