import { create } from 'zustand'
import type { Language } from '../i18n'
import type { AgentTrace, Finding } from '../types/schema'

export type ViewTab = 'graph' | 'timeline' | 'failures' | 'budget' | 'report'

interface TraceState {
  trace: AgentTrace | null
  findings: Finding[]
  selectedStepId: string | null
  sourceName: string | null
  activeTab: ViewTab
  language: Language
  error: string | null

  loadTrace: (trace: AgentTrace, sourceName?: string) => void
  setFindings: (findings: Finding[]) => void
  selectStep: (stepId: string | null) => void
  setActiveTab: (tab: ViewTab) => void
  setLanguage: (language: Language) => void
  toggleLanguage: () => void
  setError: (error: string | null) => void
  reset: () => void
}

export const useTraceStore = create<TraceState>((set) => ({
  trace: null,
  findings: [],
  selectedStepId: null,
  sourceName: null,
  activeTab: 'graph',
  language: 'zh',
  error: null,

  loadTrace: (trace, sourceName) => set({ trace, sourceName: sourceName ?? null, error: null, selectedStepId: null }),
  setFindings: (findings) => set({ findings }),
  selectStep: (stepId) => set({ selectedStepId: stepId }),
  setActiveTab: (tab) => set({ activeTab: tab }),
  setLanguage: (language) => set({ language }),
  toggleLanguage: () => set((state) => ({ language: state.language === 'en' ? 'zh' : 'en' })),
  setError: (error) => set({ error }),
  reset: () => set({ trace: null, findings: [], selectedStepId: null, sourceName: null, activeTab: 'graph', error: null }),
}))
