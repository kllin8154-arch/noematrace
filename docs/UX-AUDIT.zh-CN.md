# NoemaTrace 交互体验检测报告（反用户行为 & 优化项）

> 检测日期：2026-06-25
> 检测范围：`src/` 交互层全部组件（Header / Sidebar / Workspace / RightPanel / Graph / Timeline / Failures / Budget / Report / Uploader）
> 检测方法：以 PRD 定义的目标用户角色为视角，逐组件审查代码与实际界面截图
> 检测依据：纯代码事实（已标注文件:行号），未凭印象

---

## 用户角色（来自 PRD）

| 角色 | 核心诉求 | 典型使用场景 |
|------|---------|------------|
| **主：AI 工程师** | 拖入一个 trace JSON，30 秒看懂执行路径、失败点、token 浪费 | 浏览器**分屏**（一半看代码、一半看工具）、键盘流、反复在 step 间跳转、复制某个 tool output 去比对 |
| 次：Tech Lead | 快速评审一次 agent 运行质量 | 扫一眼 findings 和报告，导出给团队 |
| 次：Prompt/Eval 工程师 | 分析 context 浪费 | 在 Budget / Failures 间切换，定位高成本节点 |

检测以"这个交互是否拖慢了上面这些人完成调试"为唯一判据。

---

## 结论速览

| 级别 | 数量 | 含义 |
|------|------|------|
| 🔴 P0 反用户行为 | 4 | 违反用户控制权 / 预期，或直接挡住核心卖点 |
| 🟠 P1 关键体验缺口 | 5 | 调试主流程被明显拖慢，真实大 trace 下不可用 |
| 🟡 P2 打磨项 | 6 | 可访问性与细节，影响专业感 |

总体判断：核心数据通路（校验→图→时间线→分析→报告）已经完整可用，**问题集中在"交互回路"和"可发现性"**——即用户产生意图后，界面是否顺畅回应。下面逐条列出。

---

## 🔴 P0 — 反用户行为

### P0-1　错误提示无法关闭、不会自动消失、Esc 无效
**位置：** `src/components/upload/TraceUploader.tsx:145-149`

错误以 `fixed right-4 top-14 z-50` 的红色浮层渲染，但：没有关闭按钮、没有 `setTimeout` 自动消失（全项目 `grep setTimeout` 为空）、没有 `Esc` 监听、点击别处也不消失。只有在**下一次成功加载** trace 时才被 `setError(null)` 清掉。

> 角色视角：工程师拖错一个文件，红框就永久焊在右上角，盖住「导出报告」按钮区。这是典型的"剥夺用户控制权"反模式（Nielsen 启发式 #3 User Control）。

**建议：** 加关闭按钮 + `Esc` 关闭 + 5–8 秒自动淡出；或改成可手动 dismiss 的内联告警。

---

### P0-2　无 trace 时点「导出报告」，把正常引导当错误弹红框
**位置：** `src/components/layout/Header.tsx:14-18`

```ts
function downloadReport() {
  if (!trace) { setError(t.noReport); return }  // ← "请先加载 trace" 走的是 error 红色 toast
```

Header 的「导出报告」按钮在无 trace 时**仍可点击**，点了之后用 P0-1 那个永久红框来表达"还没加载"。而同一件事，`ReportView.tsx:55,63` 里的按钮是正确地 `disabled` 掉的。两处行为不一致，且"还没准备好"是引导信息、不是错误。

**建议：** 与 ReportView 一致——无 trace 时直接 `disabled` 导出按钮（配 `title` 说明），不要制造一个错误。

---

### P0-3　核心卖点"拖入 JSON"的拖拽命中区极小，提示藏在 hover 里
**位置：** `src/components/upload/TraceUploader.tsx:108-120`

产品 tagline 是"**拖入 Agent trace JSON**"，但 `onDrop` 只绑定在 Header 里那一条 `select + 按钮` 的窄容器上（约 200px 宽、28px 高）。整块 workspace、整个窗口都不是放置目标。而"把 JSON 拖到这里"的文案放在 `title` 属性里——**必须把鼠标悬停在那条窄框上才看得到**。

> 角色视角：首次访问的工程师想试核心功能，自然会往大片空白的图区域拖文件 → 浏览器直接在新标签打开 JSON，交互失败。卖点最强的动作，可发现性最差。

**建议：** 把放置区扩大到整个 MainWorkspace（或全窗口 overlay），拖拽进入时显示明显的"松手以加载 trace"蒙层；空状态里给一句可见的拖拽提示，而非 `title`。

---

### P0-4　硬编码 `min-w-[72rem]`，分屏即整页横向滚动
**位置：** `src/App.tsx:65`

```tsx
<div className="... min-h-0 min-w-[72rem] ...">
```

根容器最小宽度写死 1152px，且 `grid-cols-[19rem_minmax(0,1fr)_auto]` 三栏无任何响应式降级。AI 工程师**最典型**的用法就是把浏览器拉到屏幕一半看，此时宽度常 <1152px → 整页出现横向滚动条，Header 操作区被推到视野外。

**建议：** 设更低的折断点；窄屏时让左侧栏/右侧详情可折叠或叠加（右侧已有 collapse，左侧没有），让中间工作区优先。至少把 `min-w` 降到合理值并允许侧栏在窄屏隐藏。

---

## 🟠 P1 — 关键体验缺口

### P1-1　选中步骤"单向同步"：跳转后图不居中、列表不滚动到选中项
**位置：** `TraceGraph.tsx:39-95`（仅初始 `fitView`，选中后无 `setCenter`）、`LeftSidebar.tsx:73-96`（无 `scrollIntoView`）、`FailuresView.tsx:44`

在 Failures 点一条 finding（`selectStep(finding.stepIds[0])`）或在长列表里选 step：右侧详情会更新 ✅，但——
- Graph 视图**不会平移/缩放到该节点**（React Flow 的 `setCenter/fitView` 未在 selection 上调用，全项目仅初始 `fitView`）；
- 左侧 Execution Steps 列表**不会 `scrollIntoView`** 到选中项；
- 点 graph 节点，左侧列表也不滚动跟随。

> 角色视角：trace 一旦有几十步，"从某个 finding 跳到它在图里的位置"是高频动作，现在每次都要人肉在画布里找那个节点。调试效率核心受损。

**建议：** selection 变化时 `reactFlowInstance.setCenter(node.x, node.y, { zoom })`；列表对选中项 `ref.scrollIntoView({ block: 'nearest' })`。

---

### P1-2　JSON 块没有"复制"按钮，且固定压在 `max-h-56` 小框里
**位置：** `src/components/detail/StepDetail.tsx:88-95`

调试时最高频的诉求之一是"**把这个 tool 的 output / arguments 复制出去比对**"。当前每个 JSON 块都是只读 `<pre>`，**没有单块复制按钮**；且高度被锁死 `max-h-56`（14rem），长 output 被挤在小滚动框里。截图里右侧面板同时堆叠了 input/output/error/contextWindow 多个块（多为「No data」），真正有内容的块反而空间局促。

**建议：** 每个 JSON 块右上角加「复制」图标按钮；自动隐藏值为空（`No data`）的块或折叠它们；允许点击展开到更大高度 / 全屏查看。

---

### P1-3　零键盘可达性，不符合开发者工具预期
**位置：** 全局（`grep onKeyDown / tabIndex / shortcut` 仅命中第三方 svg，业务代码为空）

没有任何快捷键：不能用 `j/k` 或 ↑↓ 在 steps 间走、不能数字键/`[`,`]` 切 tab、不能 `Esc` 关面板或错误。step/timeline 用的是原生 `<button>`（可 Tab 聚焦尚可），但没有自定义 focus 样式，也没有 roving tabindex。开发者工具用户高度依赖键盘流。

**建议：** 至少提供：↑↓ 切 step、`1–5` 切 tab、`Esc` 关错误/收面板、`/` 聚焦搜索（见 P1-5）。

---

### P1-4　Graph 异步布局期间无 loading 态，大 trace 闪空白
**位置：** `src/components/graph/TraceGraph.tsx:39-77`

`buildFlowGraph` 是 async（elkjs 布局），计算期间 `graph` 为 `null` → `nodes=[]`，界面渲染一个**空白的 ReactFlow**，既无 spinner 也无骨架。小 demo 看不出，几十上百节点时会明显闪一下空白，让人以为没加载成功。

**建议：** 布局进行中显示 loading 占位；`buildGraph` 失败已有 `layoutError` 兜底 ✅，补一个进行态即可。

---

### P1-5　无步骤搜索 / 过滤，真实大 trace 不可扩展
**位置：** `LeftSidebar.tsx:64-98`、`FailuresView.tsx`、`TimelineView.tsx`

左侧 Execution Steps 只是全量平铺，**没有搜索框、没有按 type/status 过滤**。Demo 仅十几步还行，但 PRD 目标是真实 agent run（可达上百步）。Failures 也无按规则/严重级过滤。届时"找到那个出错的 tool_call"只能滚动肉眼扫。

**建议：** 左侧栏顶部加搜索 + 按 step type / status 的 chips 过滤；Failures 加严重级过滤。这是从 demo 走向真实 trace 的关键可扩展性投资。

---

## 🟡 P2 — 可访问性与打磨

### P2-1　状态/类型几乎只靠颜色区分，色盲不友好；部分文字对比度偏低
**位置：** `trace-utils.ts:3-22`、`LeftSidebar.tsx:6-28`

9 种 step type 与 3 种 status 主要用色点+彩色文字传达（`dotColor`/`textColor`）。error 还有红框+glow ✅，但其余类型纯靠颜色，红绿色盲难分 tool_call(橙)/retrieval(青)/tool_result(绿)。另外 `text-zinc-600` 文字（order 号、subtitle）压在 `#08090d` 背景上对比度低于 WCAG AA。

**建议：** 类型徽章配短文字/图标而非纯色点（已有 `getStepTypeLabel`，可在更多处显式带上）；把次要文字提到 `zinc-400/500`。

### P2-2　复制/下载反馈状态永不消失
**位置：** `src/components/report/ReportView.tsx:7,25,45`

`setStatus('已复制')` 后没有定时清除（无 `setTimeout`），"已复制/已下载"文字一直挂着，直到下次操作。建议 2–3 秒后自动清空。

### P2-3　Graph 节点标题截断后无法看全文
**位置：** `TraceGraph.tsx:169`（`line-clamp-2`，节点无 `title`）、`LeftSidebar.tsx:88`（`truncate`，无 `title`）

长标题在图节点 2 行截断、在侧栏单行截断，但都没有 `title` 属性，**hover 也看不到完整标题**。Timeline 行有汇总 `title` ✅，图与侧栏没有。建议补 `title={fullTitle}`。

### P2-4　报告"预览"展示的是 raw Markdown 源码
**位置：** `src/components/report/ReportView.tsx:73-76`

预览区把 markdown 源码直接塞进 `<pre>`，看到的是 `#`、`|` 等原文而非渲染效果。对开发者可接受，但叫"预览"略名不副实。可选：提供"源码 / 渲染"切换。

### P2-5　无"清空/重置"入口，上传后不显示文件名
**位置：** `Header.tsx`、`store/trace-store.ts:40`（已有 `reset` 但 UI 未接）

加载某 trace 后无法回到初始态；store 里 `reset()` 已实现但**没有任何按钮调用它**。且上传文件后界面只显示 `trace.title`/`traceId`，不显示用户拖入的**文件名**，多文件比对时易混。建议：接一个"清空"按钮；在摘要区显示来源文件名。

### P2-6　语言 / 面板折叠状态不持久，刷新即丢
**位置：** `store/trace-store.ts:29`（`language: 'zh'` 硬编码）、`RightPanel.tsx:7`（`useState(false)`）

默认语言写死 `zh`，对开源项目的英文访客首屏全是中文；且语言选择与右侧面板折叠状态都不持久化，刷新回到默认。

> ⚠️ 取舍提醒：项目硬约束是「不用 localStorage 存 **trace 数据**」。UI 偏好（语言/折叠）不是 trace 数据，技术上可存。但这与项目整体 offline-first / 无持久化的气质相关，**属于需要人来拍板的产品取舍**，故仅列为建议，不擅自实现。可考虑：用浏览器语言探测决定首屏语言（无需存储）作为折中。

---

## 建议的修复优先级

1. **先修 P0**（4 项）：都是低成本、高感知收益——关闭错误浮层、禁用态替代错误、扩大拖拽区、放宽最小宽度。一天内可清。
2. **再补 P1 的双向同步（P1-1）与 JSON 复制按钮（P1-2）**：直接提升调试主流程效率，是 persona 最痛的两点。
3. **P1-5 搜索过滤**是"从 demo 工具变成真能用的工具"的分水岭，建议排进 v0.2。
4. P2 作为打磨，随手清理。

---

## 附：检测覆盖清单

| 组件 | 已审 | 主要发现 |
|------|:----:|---------|
| App.tsx | ✅ | P0-4 最小宽度 |
| Header / Uploader | ✅ | P0-1/P0-2/P0-3 |
| LeftSidebar | ✅ | P1-1/P1-5/P2-1/P2-3 |
| MainWorkspace | ✅ | tab 切换正常，无快捷键(P1-3) |
| RightPanel / StepDetail | ✅ | P1-2/P2-6 |
| TraceGraph | ✅ | P1-1/P1-4/P2-3 |
| TimelineView | ✅ | 基本健康，线性映射极端值偏小 |
| FailuresView | ✅ | P1-1/P1-5 |
| ContextBudgetView / EmptyState | ✅ | 健康；空状态引导清晰 ✅ |
| ReportView | ✅ | P2-2/P2-4 |
| store / i18n / css | ✅ | 无持久化(P2-6)、无键盘(P1-3) |
