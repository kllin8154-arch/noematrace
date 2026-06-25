import { z } from 'zod'
import type { AgentTrace } from '../types/schema'

export type ValidationResult =
  | { valid: true; data: AgentTrace }
  | { valid: false; errors: string[] }

const contextBlockSchema = z.object({
  id: z.string().min(1),
  category: z.enum([
    'system_prompt',
    'tool_description',
    'conversation_history',
    'retrieved_context',
    'user_input',
    'model_output',
    'agent_scratchpad',
    'unknown',
  ]),
  tokenCount: z.number().int().nonnegative(),
  used: z.boolean().optional(),
  duplicated: z.boolean().optional(),
  source: z.string().optional(),
  contentPreview: z.string().optional(),
})

const contextWindowSchema = z.object({
  totalTokens: z.number().int().nonnegative().optional(),
  blocks: z.array(contextBlockSchema),
})

const traceStepSchema = z.object({
  id: z.string().min(1),
  parentId: z.string().min(1).optional(),
  order: z.number().int().nonnegative(),
  type: z.enum([
    'user_input',
    'system_prompt',
    'llm_call',
    'agent_event',
    'tool_call',
    'tool_result',
    'retrieval',
    'final_answer',
    'error',
  ]),
  title: z.string().min(1),
  status: z.enum(['success', 'warning', 'error']),
  startedAt: z.string().optional(),
  endedAt: z.string().optional(),
  latencyMs: z.number().nonnegative().optional(),
  model: z.string().optional(),
  tool: z
    .object({
      name: z.string().min(1),
      arguments: z.unknown().optional(),
    })
    .optional(),
  input: z.unknown().optional(),
  output: z.unknown().optional(),
  error: z
    .object({
      message: z.string().min(1),
      code: z.string().optional(),
      stack: z.string().optional(),
    })
    .optional(),
  tokens: z
    .object({
      input: z.number().int().nonnegative().optional(),
      output: z.number().int().nonnegative().optional(),
      total: z.number().int().nonnegative().optional(),
    })
    .optional(),
  costUsd: z
    .object({
      input: z.number().nonnegative().optional(),
      output: z.number().nonnegative().optional(),
      total: z.number().nonnegative().optional(),
    })
    .optional(),
  contextWindow: contextWindowSchema.optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
})

const agentTraceSchema = z
  .object({
    schemaVersion: z.literal('0.1'),
    traceId: z.string().min(1),
    title: z.string().min(1),
    task: z.string().optional(),
    source: z.enum(['noematrace', 'langfuse', 'langsmith', 'openai-agents', 'custom']),
    startedAt: z.string().optional(),
    endedAt: z.string().optional(),
    metadata: z.record(z.string(), z.unknown()).optional(),
    steps: z.array(traceStepSchema),
  })
  .superRefine((trace, ctx) => {
    const seenStepIds = new Set<string>()

    trace.steps.forEach((step, index) => {
      if (seenStepIds.has(step.id)) {
        ctx.addIssue({
          code: 'custom',
          path: ['steps', index, 'id'],
          message: `duplicate step id "${step.id}"`,
        })
      }

      seenStepIds.add(step.id)
    })

    trace.steps.forEach((step, index) => {
      if (step.parentId && !seenStepIds.has(step.parentId)) {
        ctx.addIssue({
          code: 'custom',
          path: ['steps', index, 'parentId'],
          message: `parentId "${step.parentId}" does not reference an existing step id`,
        })
      }
    })
  })

export function validateTrace(input: unknown): ValidationResult {
  const parsedInput = parseMaybeJson(input)

  if (!parsedInput.valid) {
    return parsedInput
  }

  const result = agentTraceSchema.safeParse(parsedInput.data)

  if (!result.success) {
    return {
      valid: false,
      errors: result.error.issues.map(formatIssue),
    }
  }

  return { valid: true, data: result.data }
}

function parseMaybeJson(input: unknown): { valid: true; data: unknown } | { valid: false; errors: string[] } {
  if (typeof input !== 'string') {
    return { valid: true, data: input }
  }

  try {
    return { valid: true, data: JSON.parse(input) as unknown }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'unknown parse error'
    return { valid: false, errors: [`非法 JSON：${message}`] }
  }
}

function formatIssue(issue: z.core.$ZodIssue): string {
  const path = issue.path.length > 0 ? issue.path.join('.') : 'root'
  return `${path}: ${issue.message}`
}
