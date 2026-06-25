import type { Finding, TraceStep } from './types/schema'

export type Language = 'en' | 'zh'

export const copy = {
  en: {
    appSubtitle: 'trace replay / context budget',
    schemaVersion: 'schema v0.1',
    loadExample: 'Load Example',
    upload: 'Upload',
    exportReport: 'Export Report',
    chooseExample: 'Example',
    chooseFile: 'Choose file',
    dropTrace: 'Drop JSON here',
    loadingTrace: 'Loading trace...',
    copyReport: 'Copy',
    downloadReport: 'Download .md',
    copied: 'Copied',
    copyFailed: 'Copy failed',
    downloaded: 'Downloaded',
    noReport: 'Load a trace to generate a report',
    noFindings: 'No findings',
    affectedSteps: 'Affected steps',
    recommendation: 'Recommendation',
    contextRequired: 'Context Budget analysis requires annotated data.',
    contextRequiredBody: 'This trace has no contextWindow blocks on llm_call steps. Add contextWindow data to enable category breakdowns.',
    recommendations: 'Recommendations',
    usedContext: 'Used',
    unusedContext: 'Unused',
    duplicatedContext: 'Duplicated',
    totalContext: 'Total context',
    llmCalls: 'LLM calls',
    graphEmpty: 'Load a trace to render the execution graph',
    timelineEmpty: 'Load a trace to render the timeline',
    failuresEmpty: 'Analyzer output will appear here after a trace is loaded',
    inputOutput: 'Input / Output',
    switchLanguage: '中文',
    traceSummary: 'Trace Summary',
    noTraceLoaded: 'No trace loaded',
    executionSteps: 'Execution Steps',
    selectedStep: 'Selected Step',
    collapse: 'Collapse',
    expandDetails: 'Expand details panel',
    selectStep: 'Select a step to view details',
    steps: 'Steps',
    tokens: 'Tokens',
    cost: 'Cost',
    errors: 'Errors',
    warnings: 'Warnings',
    findings: 'Findings',
    graph: 'Graph',
    timeline: 'Timeline',
    failures: 'Failures',
    budget: 'Budget',
    report: 'Report',
    reportTitle: 'Trace Report',
    model: 'Model',
    tool: 'Tool',
    latency: 'Latency',
    input: 'Input',
    output: 'Output',
    error: 'Error',
    metadata: 'Metadata',
    noData: 'No data',
    maxLatency: 'max',
    rule: 'Rule',
    severity: 'Severity',
    experimental: 'experimental',
    defaultExampleLoadFailed: 'Failed to load default example',
    exportDisabled: 'Load a trace before exporting a report',
    clearTrace: 'Clear',
    dismiss: 'Dismiss',
    dragOverlayTitle: 'Drop JSON to load trace',
    dragOverlayBody: 'Release the file anywhere in this window.',
    searchSteps: 'Search steps',
    noMatchingSteps: 'No matching steps',
    graphLayoutLoading: 'Computing graph layout...',
    copyBlock: 'Copy block',
    keyboardHint: 'Shortcuts: ↑↓ steps · 1-5 tabs · Esc dismisses alerts',
    all: 'All',
    contextWaste: 'Context Waste',
    contextWasteScore: 'Context Waste Score',
    higherMoreWaste: '(higher = more waste)',
    unavailable: 'Unavailable',
    needsAnnotatedContextWindow: 'Needs annotated contextWindow',
    analyzingLargestContextWindow: 'Analyzing largest context window',
    mainRecommendation: 'Main recommendation',
    efficientContext: 'Context usage looks efficient.',
  },
  zh: {
    appSubtitle: '执行回放 / 上下文预算',
    schemaVersion: 'schema v0.1',
    loadExample: '加载示例',
    upload: '上传',
    exportReport: '导出报告',
    chooseExample: '示例',
    chooseFile: '选择文件',
    dropTrace: '把 JSON 拖到这里',
    loadingTrace: '正在加载 trace...',
    copyReport: '复制',
    downloadReport: '下载 .md',
    copied: '已复制',
    copyFailed: '复制失败',
    downloaded: '已下载',
    noReport: '加载 trace 后生成报告',
    noFindings: '暂无发现项',
    affectedSteps: '影响步骤',
    recommendation: '建议',
    contextRequired: '上下文预算分析需要标注数据。',
    contextRequiredBody: '这个 trace 的 llm_call 步骤没有 contextWindow blocks。添加 contextWindow 后才能展示分类占比。',
    recommendations: '建议',
    usedContext: '已使用',
    unusedContext: '未使用',
    duplicatedContext: '重复',
    totalContext: '上下文总量',
    llmCalls: '模型调用',
    graphEmpty: '加载 trace 后渲染执行图',
    timelineEmpty: '加载 trace 后渲染时间线',
    failuresEmpty: '加载 trace 后显示分析发现项',
    inputOutput: '输入 / 输出',
    switchLanguage: 'EN',
    traceSummary: 'Trace 摘要',
    noTraceLoaded: '未加载 trace',
    executionSteps: '执行步骤',
    selectedStep: '选中步骤',
    collapse: '收起',
    expandDetails: '展开详情面板',
    selectStep: '选择一个步骤查看详情',
    steps: '步骤',
    tokens: 'Token',
    cost: '成本',
    errors: '错误',
    warnings: '警告',
    findings: '发现项',
    graph: '图谱',
    timeline: '时间线',
    failures: '失败分析',
    budget: '预算',
    report: '报告',
    reportTitle: 'Trace 报告',
    model: '模型',
    tool: '工具',
    latency: '延迟',
    input: '输入',
    output: '输出',
    error: '错误',
    metadata: '元数据',
    noData: '暂无数据',
    maxLatency: '最大',
    rule: '规则',
    severity: '严重级别',
    experimental: '实验性',
    defaultExampleLoadFailed: '默认示例加载失败',
    exportDisabled: '加载 trace 后才能导出报告',
    clearTrace: '清空',
    dismiss: '关闭',
    dragOverlayTitle: '松手以加载 trace JSON',
    dragOverlayBody: '可以把文件拖到窗口任意位置。',
    searchSteps: '搜索步骤',
    noMatchingSteps: '没有匹配步骤',
    graphLayoutLoading: '正在计算图谱布局...',
    copyBlock: '复制块',
    keyboardHint: '快捷键：↑↓ 切步骤 · 1-5 切视图 · Esc 关闭提示',
    all: '全部',
    contextWaste: '上下文浪费',
    contextWasteScore: '上下文浪费分',
    higherMoreWaste: '（分数越高表示浪费越严重）',
    unavailable: '不可用',
    needsAnnotatedContextWindow: '需要标注 contextWindow',
    analyzingLargestContextWindow: '正在分析最大的上下文窗口',
    mainRecommendation: '主要建议',
    efficientContext: '上下文使用看起来比较高效。',
  },
} as const

const textMap: Record<string, string> = {
  'Successful Coding Agent': '成功修复代码',
  'Failed Tool Loop': '工具调用循环',
  'Error Cascade': '错误级联',
  'Context Waste Run': '上下文浪费',
  'Fix a transparent dropdown menu in src/components/Dropdown.tsx without changing the public API.':
    '在不修改公开 API 的前提下，修复 src/components/Dropdown.tsx 中透明的下拉菜单。',
  'Find why DateRangePicker closes immediately after selecting the start date.':
    '找出 DateRangePicker 在选择开始日期后立即关闭的原因。',
  'Run the focused timeline tests after a refactor and diagnose why the command fails.':
    '重构后运行聚焦的时间线测试，并诊断命令失败原因。',
  'Explain why the search agent returns duplicate snippets and propose a minimal fix.':
    '解释搜索 Agent 为什么返回重复片段，并提出最小修复方案。',
  'User reports transparent dropdown': '用户报告下拉菜单透明',
  'Load project editing constraints': '加载项目编辑约束',
  'Triage dropdown rendering issue': '初步定位下拉菜单渲染问题',
  'Read Dropdown component': '读取 Dropdown 组件',
  'Dropdown source snapshot': 'Dropdown 源码快照',
  'Plan scoped style fix': '规划局部样式修复',
  'Patch Dropdown surface classes': '修补下拉面板样式类',
  'Review patch against constraints': '按约束复核补丁',
  'Summarize successful fix': '总结成功修复',
  'User reports date picker closes too early': '用户报告日期选择器过早关闭',
  'Load debugging constraints': '加载调试约束',
  'Plan date picker investigation': '规划日期选择器排查',
  'Read DateRangePicker source (1)': '读取 DateRangePicker 源码（1）',
  'DateRangePicker source snapshot (1)': 'DateRangePicker 源码快照（1）',
  'Read DateRangePicker source (2)': '读取 DateRangePicker 源码（2）',
  'DateRangePicker source snapshot (2)': 'DateRangePicker 源码快照（2）',
  'Read DateRangePicker source (3)': '读取 DateRangePicker 源码（3）',
  'DateRangePicker source snapshot (3)': 'DateRangePicker 源码快照（3）',
  'Read DateRangePicker source (4)': '读取 DateRangePicker 源码（4）',
  'DateRangePicker source snapshot (4)': 'DateRangePicker 源码快照（4）',
  'Read DateRangePicker source (5)': '读取 DateRangePicker 源码（5）',
  'DateRangePicker source snapshot (5)': 'DateRangePicker 源码快照（5）',
  'Large repeated-context reasoning pass': '携带重复上下文的大推理步骤',
  'Abort with inconclusive summary': '以不确定结论中止',
  'User asks to verify timeline refactor': '用户要求验证时间线重构',
  'Load test execution policy': '加载测试执行策略',
  'Plan focused test command': '规划聚焦测试命令',
  'Run focused Vitest command': '运行聚焦 Vitest 命令',
  'Vitest fails: setup file missing': 'Vitest 失败：setup 文件缺失',
  'Retry by running all tests': '改为运行全部测试',
  'Retry with production build': '改用生产构建重试',
  'Dependent verification blocked': '依赖验证被阻断',
  'Diagnose first failure instead of retrying': '停止重试并诊断首个失败',
  'Read Vitest config': '读取 Vitest 配置',
  'Config confirms stale setup path': '配置确认 setup 路径过期',
  'Prepare recovery plan': '准备恢复方案',
  'Report error cascade and root cause': '报告错误级联与根因',
  'User asks about duplicate search snippets': '用户询问重复搜索片段',
  'Load broad agent instructions': '加载宽泛 Agent 指令',
  'Select tools from oversized catalog': '从过大的工具目录中选择工具',
  'List search agent files': '列出搜索 Agent 文件',
  'Search agent directory snapshot': '搜索 Agent 目录快照',
  'Retrieve overlapping documentation chunks': '检索重叠文档片段',
  'Reason with broad history and duplicate chunks': '携带大量历史与重复片段推理',
  'Read retriever implementation': '读取检索器实现',
  'Retriever source snapshot': '检索器源码快照',
  'Generate context-heavy diagnosis': '生成高上下文诊断',
  'The dropdown in the settings toolbar is transparent on dark mode.':
    '设置工具栏里的下拉菜单在深色模式下是透明的。',
  'The dropdown in the settings toolbar is transparent on dark mode. Please fix it and keep the component API unchanged.':
    '设置工具栏里的下拉菜单在深色模式下是透明的。请修复它，并保持组件 API 不变。',
  'DateRangePicker closes after the start date. It should stay open until the end date is selected.':
    'DateRangePicker 选择开始日期后就关闭了。它应该等到结束日期也选中后再关闭。',
  'The search agent repeats the same paragraph in three snippets.':
    '搜索 Agent 在三个片段里重复了同一段文字。',
  'The search agent repeats the same paragraph from docs in three snippets. Explain the cause and suggest a minimal fix.':
    '搜索 Agent 在三个文档片段里重复了同一段文字。请解释原因并给出最小修复方案。',
}

const keyMap: Record<string, string> = {
  input: '输入',
  output: '输出',
  total: '总计',
  title: '标题',
  task: '任务',
  message: '消息',
  code: '代码',
  stack: '堆栈',
  category: '类别',
  tokenCount: 'Token 数',
  used: '是否使用',
  duplicated: '是否重复',
  source: '来源',
  contentPreview: '内容预览',
  totalTokens: '总 Token',
  blocks: '上下文块',
}

const stepTypeLabels: Record<Language, Record<TraceStep['type'], string>> = {
  en: {
    user_input: 'user_input',
    system_prompt: 'system_prompt',
    llm_call: 'llm_call',
    agent_event: 'agent_event',
    tool_call: 'tool_call',
    tool_result: 'tool_result',
    retrieval: 'retrieval',
    final_answer: 'final_answer',
    error: 'error',
  },
  zh: {
    user_input: '用户输入',
    system_prompt: '系统提示',
    llm_call: '模型调用',
    agent_event: 'Agent 事件',
    tool_call: '工具调用',
    tool_result: '工具结果',
    retrieval: '检索',
    final_answer: '最终回答',
    error: '错误',
  },
}

const statusLabels: Record<Language, Record<TraceStep['status'], string>> = {
  en: {
    success: 'success',
    warning: 'warning',
    error: 'error',
  },
  zh: {
    success: '成功',
    warning: '警告',
    error: '错误',
  },
}

const severityLabels: Record<Language, Record<Finding['severity'], string>> = {
  en: {
    info: 'info',
    warning: 'warning',
    critical: 'critical',
  },
  zh: {
    info: '提示',
    warning: '警告',
    critical: '严重',
  },
}

const ruleLabels: Record<Language, Record<Finding['ruleId'], string>> = {
  en: {
    'repeated-tool-call': 'repeated-tool-call',
    'high-cost-node': 'high-cost-node',
    'error-cascade': 'error-cascade',
    'unused-context': 'unused-context',
    'risky-tool-call': 'risky-tool-call',
  },
  zh: {
    'repeated-tool-call': '重复工具调用',
    'high-cost-node': '高成本节点',
    'error-cascade': '错误级联',
    'unused-context': '未使用上下文',
    'risky-tool-call': '危险工具调用',
  },
}

const budgetCategoryLabels: Record<Language, Record<string, string>> = {
  en: {
    system_prompt: 'system_prompt',
    tool_description: 'tool_description',
    conversation_history: 'conversation_history',
    retrieved_context: 'retrieved_context',
    user_input: 'user_input',
    model_output: 'model_output',
    agent_scratchpad: 'agent_scratchpad',
    unknown: 'unknown',
  },
  zh: {
    system_prompt: '系统提示',
    tool_description: '工具描述',
    conversation_history: '对话历史',
    retrieved_context: '检索上下文',
    user_input: '用户输入',
    model_output: '模型输出',
    agent_scratchpad: 'Agent 草稿',
    unknown: '未知',
  },
}

const contextRecommendationMap: Record<string, { title: string; description: string }> = {
  'context-budget:empty-token-count': {
    title: '上下文块缺少 Token 计数',
    description: '给 contextWindow blocks 补充 tokenCount 后，预算视图才能计算可靠占比。',
  },
  'context-budget:tool-description-heavy': {
    title: '工具描述占用过高',
    description: '缩短工具描述，或只启用本次任务真正需要的工具集合。',
  },
  'context-budget:history-heavy': {
    title: '对话历史过大',
    description: '在下一次模型调用前压缩较早轮次，减少重复带入的历史上下文。',
  },
  'context-budget:retrieval-heavy': {
    title: '检索上下文过大',
    description: '收紧检索条件，只把更高信号的片段传入 prompt。',
  },
  'context-budget:unused-heavy': {
    title: '未使用上下文过高',
    description: '移除标记为未使用的上下文块，或让检索在模型调用前更有选择性。',
  },
  'context-budget:duplicated-context': {
    title: '检测到重复上下文',
    description: '组装 context window 前先去重重叠片段，避免同一信息重复消耗 token。',
  },
}

export function getCopy(language: Language) {
  return copy[language]
}

export function localizeText(text: string, language: Language): string {
  if (language === 'en') {
    return text
  }

  return textMap[text] ?? text
}

export function localizeValue(value: unknown, language: Language): unknown {
  if (language === 'en') {
    return value
  }

  if (typeof value === 'string') {
    return localizeText(value, language)
  }

  if (Array.isArray(value)) {
    return value.map((item) => localizeValue(item, language))
  }

  if (value !== null && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, item]) => [
        keyMap[key] ?? key,
        localizeValue(item, language),
      ]),
    )
  }

  return value
}

export function getStepTypeLabel(type: TraceStep['type'], language: Language): string {
  return stepTypeLabels[language][type]
}

export function getStatusLabel(status: TraceStep['status'], language: Language): string {
  return statusLabels[language][status]
}

export function getSeverityLabel(severity: Finding['severity'], language: Language): string {
  return severityLabels[language][severity]
}

export function getRuleLabel(ruleId: Finding['ruleId'], language: Language): string {
  return ruleLabels[language][ruleId]
}

export function getBudgetCategoryLabel(category: string, language: Language): string {
  return budgetCategoryLabels[language][category] ?? category
}

export function getContextRecommendationTitle(id: string, title: string, language: Language): string {
  if (language === 'en') {
    return title
  }

  return contextRecommendationMap[id]?.title ?? title
}

export function getContextRecommendationDescription(id: string, description: string, language: Language): string {
  if (language === 'en') {
    return description
  }

  return contextRecommendationMap[id]?.description ?? description
}

export function getContextWasteLevelLabel(level: string, language: Language): string {
  if (language === 'en') {
    return level
  }

  const labels: Record<string, string> = {
    good: '良好',
    moderate: '中等',
    wasteful: '浪费较高',
    severe: '严重浪费',
    unavailable: '不可用',
  }

  return labels[level] ?? level
}

export function localizeContextWasteText(text: string, language: Language): string {
  if (language === 'en') {
    return text
  }

  const textMap: Record<string, string> = {
    'Context usage looks efficient.': '上下文使用看起来比较高效。',
    'Some context waste detected. Review unused or duplicated blocks.':
      '检测到一些上下文浪费，请检查未使用或重复的上下文块。',
    'Significant context waste. Optimize tool descriptions, retrieval, or history.':
      '上下文浪费较明显，请优化工具描述、检索内容或对话历史。',
    'Severe context waste. This run likely suffers from poor context engineering.':
      '上下文浪费严重，这次运行很可能受到了较差上下文工程的影响。',
    'Context Waste Score requires annotated contextWindow blocks on llm_call steps.':
      '上下文浪费分需要 llm_call 步骤中带有已标注的 contextWindow blocks。',
    'Unused context is high. Reduce irrelevant retrieved chunks or avoid loading unused tool descriptions.':
      '未使用上下文偏高。请减少无关检索片段，或避免加载不会用到的工具描述。',
    'Duplicate context detected. Deduplicate retrieved chunks before injecting them into the context window.':
      '检测到重复上下文。请在注入上下文窗口前对检索片段去重。',
    'Tool descriptions consume a large portion of the context window. Consider lazy-loading tools based on task intent.':
      '工具描述占用了较大的上下文窗口。可以根据任务意图延迟加载工具。',
    'Conversation history is large. Consider summarizing older turns or keeping only task-relevant messages.':
      '对话历史偏大。可以总结较早轮次，或只保留与任务相关的消息。',
    'A single step consumed a large share of total tokens. Split the task or reduce context for that LLM call.':
      '单个步骤消耗了过高比例的 Token。请拆分任务，或减少该模型调用的上下文。',
  }

  return textMap[text] ?? text
}

export function localizeFinding(finding: Finding, language: Language): Finding {
  if (language === 'en') {
    return finding
  }

  return {
    ...finding,
    title: findingTitle(finding),
    description: findingDescription(finding),
    recommendation: findingRecommendation(finding),
  }
}

export function localizeErrorMessage(message: string, language: Language): string {
  if (language === 'en') {
    return message.replace(/^非法 JSON：/, 'Invalid JSON: ')
  }

  return message
    .replace(/^root:/, '根节点：')
    .replaceAll('Invalid input', '输入无效')
    .replaceAll('expected', '期望')
    .replaceAll('received', '实际收到')
}

function findingTitle(finding: Finding): string {
  if (finding.ruleId === 'repeated-tool-call') {
    return `重复工具调用：${finding.title.replace('Repeated tool call: ', '')}`
  }

  if (finding.ruleId === 'high-cost-node') {
    const isToken = finding.id.includes(':tokens:')
    const title = finding.title.replace(/^High token node: /, '').replace(/^High cost node: /, '')
    return `${isToken ? '高 Token 节点' : '高成本节点'}：${localizeText(title, 'zh')}`
  }

  if (finding.ruleId === 'error-cascade') {
    return '检测到错误级联'
  }

  if (finding.ruleId === 'unused-context') {
    return `未使用上下文：${localizeText(finding.title.replace(/^Unused context in /, ''), 'zh')}`
  }

  if (finding.ruleId === 'risky-tool-call') {
    return `危险工具调用：${localizeText(finding.title.replace(/^Risky tool call: /, ''), 'zh')}`
  }

  return finding.title
}

function findingDescription(finding: Finding): string {
  if (finding.ruleId === 'repeated-tool-call') {
    const count = finding.description.match(/was called (\d+) times/)?.[1]
    const args = finding.description.match(/with identical arguments \((.*)\)\./)?.[1]
    return count && args
      ? `该工具使用完全相同的参数被调用了 ${count} 次。参数：${args}`
      : `该工具被重复调用。原始说明：${finding.description}`
  }

  if (finding.ruleId === 'high-cost-node') {
    const percent = finding.description.match(/consumed ([0-9.]+%)/)?.[1]
    const isToken = finding.id.includes(':tokens:')
    return percent
      ? `这个步骤消耗了本次 trace ${percent} 的${isToken ? ' Token' : '成本'}，需要检查是否有过长 prompt、重复上下文或不必要输出。`
      : `这个步骤占用了过高资源。原始说明：${finding.description}`
  }

  if (finding.ruleId === 'error-cascade') {
    const range = finding.description.match(/from order (\d+) to (\d+)/)
    return range
      ? `从第 ${range[1]} 步到第 ${range[2]} 步连续失败，共 ${finding.stepIds.length} 个步骤。`
      : `检测到 ${finding.stepIds.length} 个连续失败步骤。`
  }

  if (finding.ruleId === 'unused-context') {
    const match = finding.description.match(/(\d+) of (\d+) context tokens \(([^)]+)\)/)
    return match
      ? `${match[2]} 个上下文 Token 中有 ${match[1]} 个被标记为未使用，占比 ${match[3]}。`
      : `检测到未使用上下文。原始说明：${finding.description}`
  }

  if (finding.ruleId === 'risky-tool-call') {
    const patterns = finding.description.match(/Matched risky pattern\(s\): (.*)\./)?.[1]
    return patterns ? `命中了潜在危险模式：${patterns}。` : `检测到潜在危险工具调用。原始说明：${finding.description}`
  }

  return finding.description
}

function findingRecommendation(finding: Finding): string {
  if (finding.ruleId === 'repeated-tool-call') {
    return '检查重试或规划逻辑：当工具结果已经可用时，应停止用同一参数重复调用。'
  }

  if (finding.ruleId === 'high-cost-node') {
    return finding.id.includes(':tokens:')
      ? '拆分或压缩该步骤，重点检查 prompt、检索上下文和模型输出是否可以缩减。'
      : '检查模型选择、token 体量与重试行为，避免单个步骤承担过高成本。'
  }

  if (finding.ruleId === 'error-cascade') {
    return '连续失败后应停止依赖步骤，优先暴露第一个根因错误，再决定是否继续执行。'
  }

  if (finding.ruleId === 'unused-context') {
    return '在这次模型调用前减少检索或历史上下文，只保留会影响回答的上下文块。'
  }

  if (finding.ruleId === 'risky-tool-call') {
    return '执行破坏性命令或暴露密钥前，应加入人工确认或更严格的工具白名单。'
  }

  return finding.recommendation
}
