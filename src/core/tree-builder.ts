import ELK, { type ElkExtendedEdge, type ElkNode } from 'elkjs/lib/elk-api'
import { Worker as ElkWorker } from 'elkjs/lib/elk-worker.min.js'
import { Position, type Edge, type Node } from '@xyflow/react'
import type { AgentTrace, TraceStep } from '../types/schema'

const nodeWidth = 280
const nodeHeight = 96

export type FlowNodeData = Record<string, unknown> & {
  step: TraceStep
  label: string
}

export type FlowEdgeData = Record<string, unknown> & {
  parentId: string
  childId: string
}

export type FlowNode = Node<FlowNodeData, TraceStep['type']>
export type FlowEdge = Edge<FlowEdgeData, 'smoothstep'>

export type FlowGraph = {
  nodes: FlowNode[]
  edges: FlowEdge[]
}

const elk = new ELK({
  workerFactory: (url) => new ElkWorker(url) as unknown as Worker,
})

export async function buildFlowGraph(trace: AgentTrace): Promise<FlowGraph> {
  const steps = orderedSteps(trace)
  const stepIds = new Set(steps.map((step) => step.id))
  const elkGraph: ElkNode = {
    id: trace.traceId,
    layoutOptions: {
      'elk.algorithm': 'layered',
      'elk.direction': 'DOWN',
      'elk.spacing.nodeNode': '48',
      'elk.layered.spacing.nodeNodeBetweenLayers': '72',
    },
    children: steps.map((step) => ({
      id: step.id,
      width: nodeWidth,
      height: nodeHeight,
    })),
    edges: buildElkEdges(steps, stepIds),
  }

  const layout = await elk.layout(elkGraph)
  const positions = new Map((layout.children ?? []).map((node) => [node.id, { x: node.x ?? 0, y: node.y ?? 0 }]))

  return {
    nodes: steps.map((step) => ({
      id: step.id,
      type: step.type,
      position: positions.get(step.id) ?? { x: 0, y: 0 },
      data: {
        step,
        label: step.title,
      },
      width: nodeWidth,
      height: nodeHeight,
      sourcePosition: Position.Bottom,
      targetPosition: Position.Top,
    })),
    edges: buildFlowEdges(steps, stepIds),
  }
}

function buildElkEdges(steps: TraceStep[], stepIds: Set<string>): ElkExtendedEdge[] {
  return steps
    .filter((step) => step.parentId !== undefined && stepIds.has(step.parentId))
    .map((step) => ({
      id: edgeId(step.parentId as string, step.id),
      sources: [step.parentId as string],
      targets: [step.id],
    }))
}

function buildFlowEdges(steps: TraceStep[], stepIds: Set<string>): FlowEdge[] {
  return steps
    .filter((step) => step.parentId !== undefined && stepIds.has(step.parentId))
    .map((step) => {
      const parentId = step.parentId as string

      return {
        id: edgeId(parentId, step.id),
        source: parentId,
        target: step.id,
        type: 'smoothstep',
        data: {
          parentId,
          childId: step.id,
        },
      }
    })
}

function edgeId(parentId: string, childId: string): string {
  return `${parentId}->${childId}`
}

function orderedSteps(trace: AgentTrace): TraceStep[] {
  return [...trace.steps].sort((left, right) => left.order - right.order)
}
