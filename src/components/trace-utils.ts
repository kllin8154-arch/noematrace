import type { Finding, TraceStep } from '../types/schema'

export const stepTypeTone: Record<
  TraceStep['type'],
  { dot: string; text: string; border: string; bg: string; hex: string }
> = {
  user_input: { dot: 'bg-blue-500', text: 'text-blue-300', border: 'border-blue-500/45', bg: 'bg-blue-500/10', hex: '#3b82f6' },
  system_prompt: { dot: 'bg-slate-400', text: 'text-slate-300', border: 'border-slate-400/45', bg: 'bg-slate-400/10', hex: '#94a3b8' },
  llm_call: { dot: 'bg-purple-500', text: 'text-purple-300', border: 'border-purple-500/45', bg: 'bg-purple-500/10', hex: '#a855f7' },
  agent_event: { dot: 'bg-indigo-400', text: 'text-indigo-300', border: 'border-indigo-400/45', bg: 'bg-indigo-400/10', hex: '#818cf8' },
  tool_call: { dot: 'bg-orange-500', text: 'text-orange-300', border: 'border-orange-500/45', bg: 'bg-orange-500/10', hex: '#f97316' },
  tool_result: { dot: 'bg-green-500', text: 'text-green-300', border: 'border-green-500/45', bg: 'bg-green-500/10', hex: '#22c55e' },
  retrieval: { dot: 'bg-cyan-500', text: 'text-cyan-300', border: 'border-cyan-500/45', bg: 'bg-cyan-500/10', hex: '#06b6d4' },
  final_answer: { dot: 'bg-zinc-100', text: 'text-zinc-100', border: 'border-zinc-100/45', bg: 'bg-zinc-100/10', hex: '#f4f4f5' },
  error: { dot: 'bg-red-500', text: 'text-red-300', border: 'border-red-500/60', bg: 'bg-red-500/10', hex: '#ef4444' },
}

export const severityTone: Record<Finding['severity'], { label: string; text: string; border: string; bg: string }> = {
  critical: { label: 'critical', text: 'text-red-200', border: 'border-red-500/50', bg: 'bg-red-500/10' },
  warning: { label: 'warning', text: 'text-orange-200', border: 'border-orange-500/45', bg: 'bg-orange-500/10' },
  info: { label: 'info', text: 'text-cyan-200', border: 'border-cyan-500/45', bg: 'bg-cyan-500/10' },
}

export function orderedSteps(steps: TraceStep[]): TraceStep[] {
  return [...steps].sort((left, right) => left.order - right.order)
}

export function stepTokenTotal(step: TraceStep): number {
  return step.tokens?.total ?? (step.tokens?.input ?? 0) + (step.tokens?.output ?? 0)
}

export function stepCostTotal(step: TraceStep): number {
  return step.costUsd?.total ?? (step.costUsd?.input ?? 0) + (step.costUsd?.output ?? 0)
}

export function formatTokens(value: number): string {
  return value.toLocaleString('en-US')
}

export function formatCost(value: number): string {
  return `$${value.toFixed(value >= 1 ? 2 : 4)}`
}

export function formatLatency(value: number | undefined): string {
  if (value === undefined) {
    return '-'
  }

  if (value >= 1000) {
    return `${(value / 1000).toFixed(2)}s`
  }

  return `${value}ms`
}

export function formatPercent(value: number): string {
  return `${(value * 100).toFixed(1)}%`
}

export function stringifyForDisplay(value: unknown): string {
  if (value === undefined || value === null) {
    return ''
  }

  if (typeof value === 'string') {
    return value
  }

  return JSON.stringify(value, null, 2)
}
