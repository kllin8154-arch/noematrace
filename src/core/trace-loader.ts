import { localizeErrorMessage, type Language } from '../i18n'
import type { AgentTrace, Finding } from '../types/schema'
import { runAnalyzers } from './analyzers'
import { validateTrace } from './validator'

export type PreparedTraceLoad =
  | {
      ok: true
      trace: AgentTrace
      findings: Finding[]
      firstStepId: string | null
    }
  | {
      ok: false
      error: string
    }

export function prepareTraceLoad(text: string, language: Language): PreparedTraceLoad {
  const result = validateTrace(text)

  if (!result.valid) {
    return {
      ok: false,
      error: result.errors.map((message) => localizeErrorMessage(message, language)).join('\n'),
    }
  }

  const steps = [...result.data.steps].sort((left, right) => left.order - right.order)

  return {
    ok: true,
    trace: result.data,
    findings: runAnalyzers(result.data),
    firstStepId: steps[0]?.id ?? null,
  }
}
