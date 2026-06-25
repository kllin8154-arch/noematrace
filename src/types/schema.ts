export type AgentTrace = {
  schemaVersion: '0.1'
  traceId: string
  title: string
  task?: string
  source: 'noematrace' | 'langfuse' | 'langsmith' | 'openai-agents' | 'custom'
  startedAt?: string   // ISO 8601
  endedAt?: string     // ISO 8601
  metadata?: Record<string, unknown>

  /**
   * Steps MUST be sorted by execution order.
   * The `order` field is the canonical execution sequence.
   */
  steps: TraceStep[]
}

export type TraceStep = {
  id: string
  parentId?: string    // Builds the execution tree
  order: number        // Canonical execution sequence, smaller = earlier

  type:
    | 'user_input'
    | 'system_prompt'
    | 'llm_call'
    | 'agent_event'    // Planning, retry decisions, state changes
    | 'tool_call'
    | 'tool_result'
    | 'retrieval'
    | 'final_answer'
    | 'error'

  title: string
  status: 'success' | 'warning' | 'error'

  startedAt?: string
  endedAt?: string
  latencyMs?: number

  model?: string       // e.g. 'gpt-4o', 'claude-sonnet-4-20250514'

  tool?: {
    name: string
    arguments?: unknown
  }

  input?: unknown
  output?: unknown

  error?: {
    message: string
    code?: string
    stack?: string
  }

  tokens?: {
    input?: number
    output?: number
    total?: number
  }

  /** USD only in v0.1 */
  costUsd?: {
    input?: number
    output?: number
    total?: number
  }

  /**
   * Only valid when type === 'llm_call'.
   * If absent, Context Budget View shows an informative empty state.
   */
  contextWindow?: ContextWindow

  metadata?: Record<string, unknown>
}

export type ContextWindow = {
  totalTokens?: number
  blocks: ContextBlock[]
}

export type ContextBlock = {
  id: string
  category:
    | 'system_prompt'
    | 'tool_description'
    | 'conversation_history'
    | 'retrieved_context'
    | 'user_input'
    | 'model_output'
    | 'agent_scratchpad'
    | 'unknown'

  tokenCount: number
  used?: boolean          // false = this block was in context but not referenced
  duplicated?: boolean    // true = content overlaps with another block
  source?: string         // e.g. file name, tool name
  contentPreview?: string // First ~200 chars for display
}

export type Finding = {
  id: string
  ruleId: 'repeated-tool-call' | 'high-cost-node' | 'error-cascade' | 'unused-context' | 'risky-tool-call'
  severity: 'info' | 'warning' | 'critical'
  experimental?: boolean
  title: string
  description: string
  stepIds: string[]         // Which steps triggered this finding
  recommendation: string
}

export type ContextWasteLevel =
  | 'good'
  | 'moderate'
  | 'wasteful'
  | 'severe'
  | 'unavailable'

export type ContextWasteScore = {
  available: boolean
  score: number | null
  level: ContextWasteLevel
  analyzedStepId?: string
  analyzedStepTitle?: string
  analyzedContextTokens?: number
  summary: string
  recommendations: string[]
  metrics: {
    totalContextTokens: number
    unusedTokens: number
    duplicatedTokens: number
    toolDescriptionTokens: number
    conversationHistoryTokens: number
    retrievedContextTokens: number
    unusedRatio: number
    duplicatedRatio: number
    toolDescriptionRatio: number
    historyRatio: number
    maxStepTokenRatio: number
  }
}
