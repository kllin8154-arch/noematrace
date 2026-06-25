import { useEffect, useMemo, useState } from 'react'
import {
  Background,
  BackgroundVariant,
  Controls,
  Handle,
  MiniMap,
  Position,
  ReactFlow,
  useReactFlow,
  type NodeMouseHandler,
  type NodeProps,
} from '@xyflow/react'
import { buildFlowGraph, type FlowEdge, type FlowGraph, type FlowNode } from '../../core/tree-builder'
import { getCopy, getStatusLabel, getStepTypeLabel, localizeText } from '../../i18n'
import { useTraceStore } from '../../store/trace-store'
import { formatCost, formatLatency, formatTokens, stepCostTotal, stepTokenTotal, stepTypeTone } from '../trace-utils'

const nodeTypes = {
  user_input: TraceStepNode,
  system_prompt: TraceStepNode,
  llm_call: TraceStepNode,
  agent_event: TraceStepNode,
  tool_call: TraceStepNode,
  tool_result: TraceStepNode,
  retrieval: TraceStepNode,
  final_answer: TraceStepNode,
  error: TraceStepNode,
}

export function TraceGraph() {
  const [graph, setGraph] = useState<FlowGraph | null>(null)
  const [layoutError, setLayoutError] = useState<string | null>(null)
  const [layouting, setLayouting] = useState(false)
  const trace = useTraceStore((state) => state.trace)
  const selectedStepId = useTraceStore((state) => state.selectedStepId)
  const selectStep = useTraceStore((state) => state.selectStep)
  const language = useTraceStore((state) => state.language)
  const t = getCopy(language)

  useEffect(() => {
    let cancelled = false

    async function buildGraph() {
      if (!trace) {
        setGraph(null)
        setLayouting(false)
        return
      }

      setLayoutError(null)
      setGraph(null)
      setLayouting(true)
      try {
        const nextGraph = await buildFlowGraph(trace)

        if (!cancelled) {
          setGraph(nextGraph)
          setLayouting(false)
        }
      } catch (error) {
        if (!cancelled) {
          const message = error instanceof Error ? error.message : String(error)
          setLayoutError(message)
          setLayouting(false)
        }
      }
    }

    void buildGraph()

    return () => {
      cancelled = true
    }
  }, [trace])

  const nodes = useMemo<FlowNode[]>(
    () =>
      graph?.nodes.map((node) => ({
        ...node,
        selected: node.id === selectedStepId,
      })) ?? [],
    [graph, selectedStepId],
  )

  const edges = useMemo<FlowEdge[]>(
    () =>
      graph?.edges.map((edge) => {
        const active = edge.source === selectedStepId || edge.target === selectedStepId

        return {
          ...edge,
          animated: active,
          style: { stroke: active ? '#22d3ee' : '#3f3f46', strokeWidth: active ? 2 : 1 },
        }
      }) ?? [],
    [graph, selectedStepId],
  )

  const handleNodeClick: NodeMouseHandler<FlowNode> = (_, node) => {
    selectStep(node.id)
  }

  if (!trace) {
    return (
      <div className="workspace-surface flex items-center justify-center">
        <div className="border border-zinc-800 bg-[#07080c]/90 px-4 py-3 font-mono text-xs text-zinc-500">{t.graphEmpty}</div>
      </div>
    )
  }

  if (layoutError) {
    return (
      <div className="workspace-surface p-6">
        <div className="border border-red-500/40 bg-red-500/10 p-4 font-mono text-xs text-red-100">{layoutError}</div>
      </div>
    )
  }

  if (layouting || !graph) {
    return (
      <div className="workspace-surface flex items-center justify-center">
        <div className="border border-zinc-800 bg-[#07080c]/90 px-4 py-3 font-mono text-xs text-zinc-400">{t.graphLayoutLoading}</div>
      </div>
    )
  }

  return (
    <div className="workspace-surface h-full min-h-0 w-full">
      <div className="absolute left-6 top-5 z-10 font-mono text-[11px] uppercase tracking-normal text-zinc-600">{t.graph}</div>
      <ReactFlow<FlowNode, FlowEdge>
        colorMode="dark"
        edges={edges}
        fitView
        fitViewOptions={{ padding: 0.22 }}
        maxZoom={1.5}
        minZoom={0.25}
        nodeTypes={nodeTypes}
        nodes={nodes}
        nodesConnectable={false}
        nodesDraggable={false}
        onNodeClick={handleNodeClick}
        onlyRenderVisibleElements
        panOnScroll
        proOptions={{ hideAttribution: true }}
        style={{ height: '100%', width: '100%' }}
      >
        <SelectionViewportSync nodes={nodes} selectedStepId={selectedStepId} />
        <Background color="#27272a" gap={32} variant={BackgroundVariant.Lines} />
        <Controls position="bottom-left" showInteractive={false} />
        <MiniMap<FlowNode>
          bgColor="#09090b"
          maskColor="rgba(8, 9, 13, 0.74)"
          nodeColor={(node) => stepTypeTone[node.data.step.type].hex}
          nodeStrokeColor={(node) => (node.data.step.status === 'error' ? '#ef4444' : '#18181b')}
          pannable
          position="bottom-right"
          zoomable
        />
      </ReactFlow>
    </div>
  )
}

function SelectionViewportSync({ nodes, selectedStepId }: { nodes: FlowNode[]; selectedStepId: string | null }) {
  const reactFlow = useReactFlow<FlowNode, FlowEdge>()

  useEffect(() => {
    if (!selectedStepId || !reactFlow.viewportInitialized) {
      return
    }

    const node = nodes.find((item) => item.id === selectedStepId)

    if (!node) {
      return
    }

    void reactFlow.setCenter(node.position.x + 140, node.position.y + 48, {
      duration: 220,
      zoom: Math.max(0.65, Math.min(reactFlow.getZoom(), 1)),
    })
  }, [nodes, reactFlow, selectedStepId])

  return null
}

function TraceStepNode({ data, selected }: NodeProps<FlowNode>) {
  const language = useTraceStore((state) => state.language)
  const t = getCopy(language)
  const step = data.step
  const tone = step.status === 'error' ? stepTypeTone.error : stepTypeTone[step.type]
  const selectedClass = selected ? 'ring-2 ring-cyan-300/80' : ''
  const errorClass = step.status === 'error' ? 'shadow-[0_0_24px_rgba(239,68,68,0.38)]' : ''
  const subtitle = step.tool?.name ?? step.model ?? getStatusLabel(step.status, language)

  return (
    <div
      className={`relative w-[280px] border ${tone.border} ${tone.bg} ${selectedClass} ${errorClass} bg-[#0b0d12]/95 p-3 transition`}
      title={localizeText(step.title, language)}
    >
      <Handle className="!h-2 !w-2 !border-zinc-950 !bg-zinc-400" position={Position.Top} type="target" />
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className={`h-2 w-2 shrink-0 rounded-full ${tone.dot}`} />
            <span className={`font-mono text-[10px] uppercase ${tone.text}`}>{getStepTypeLabel(step.type, language)}</span>
          </div>
          <div className="mt-2 line-clamp-2 text-sm font-semibold leading-5 text-zinc-100">{localizeText(step.title, language)}</div>
        </div>
        <div className="shrink-0 border border-zinc-800 px-1.5 py-0.5 font-mono text-[10px] text-zinc-500">#{step.order}</div>
      </div>
      <div className="mt-3 truncate font-mono text-[11px] text-zinc-500">{subtitle}</div>
      <div className="mt-3 grid grid-cols-3 gap-1 border-t border-zinc-800 pt-2 font-mono text-[10px] text-zinc-500">
        <span>{formatLatency(step.latencyMs)}</span>
        <span>{formatTokens(stepTokenTotal(step))} {t.tokens}</span>
        <span>{formatCost(stepCostTotal(step))}</span>
      </div>
      <Handle className="!h-2 !w-2 !border-zinc-950 !bg-zinc-400" position={Position.Bottom} type="source" />
    </div>
  )
}
