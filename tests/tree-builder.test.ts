import { describe, expect, it } from 'vitest'
import { buildFlowGraph } from '../src/core/tree-builder'
import { makeStep, makeTrace } from './helpers'

describe('tree-builder', () => {
  it('builds a flat tree', async () => {
    const graph = await buildFlowGraph(
      makeTrace([
        makeStep('b', 2, { title: 'Second root' }),
        makeStep('a', 1, { title: 'First root' }),
      ]),
    )

    expect(graph.nodes.map((node) => node.id)).toEqual(['a', 'b'])
    expect(graph.edges).toEqual([])
    expect(graph.nodes.every((node) => Number.isFinite(node.position.x) && Number.isFinite(node.position.y))).toBe(true)
  })

  it('builds a nested tree', async () => {
    const graph = await buildFlowGraph(
      makeTrace([
        makeStep('tool', 3, { parentId: 'llm', type: 'tool_call' }),
        makeStep('root', 1, { type: 'user_input' }),
        makeStep('llm', 2, { parentId: 'root', type: 'llm_call' }),
      ]),
    )

    expect(graph.edges.map((edge) => [edge.source, edge.target])).toEqual([
      ['root', 'llm'],
      ['llm', 'tool'],
    ])
    expect(graph.nodes.find((node) => node.id === 'llm')?.position.y).toBeGreaterThan(
      graph.nodes.find((node) => node.id === 'root')?.position.y ?? 0,
    )
    expect(graph.nodes.find((node) => node.id === 'tool')?.position.y).toBeGreaterThan(
      graph.nodes.find((node) => node.id === 'llm')?.position.y ?? 0,
    )
  })

  it('builds a multi-branch tree and ignores missing parents', async () => {
    const graph = await buildFlowGraph(
      makeTrace([
        makeStep('root', 1),
        makeStep('left', 2, { parentId: 'root' }),
        makeStep('right', 3, { parentId: 'root' }),
        makeStep('orphan', 4, { parentId: 'missing' }),
      ]),
    )

    expect(graph.nodes).toHaveLength(4)
    expect(graph.edges.map((edge) => edge.id)).toEqual(['root->left', 'root->right'])
    expect(graph.edges.every((edge) => edge.source === 'root')).toBe(true)
  })
})
