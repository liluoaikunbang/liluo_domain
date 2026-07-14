# 048-asylum 互动小说流程补全与结局状态

## 实现思路

本次在已有互动小说副本底座上，把 `asylum_for_lunatic` 从早期占位剧本补全为可完整游玩的副本流程。

内容来源借用旧页面 `src/components/Domain/ChamberShop/Chamber1.vue` 中的互动流程，但运行入口不再依赖旧 Vue 模板，而是沉淀到 `src/game/data/interactive_fictions/asylum_for_lunatic/scenario.json`。这样后续副本内容可以继续作为游戏数据维护，而不是散落在页面组件里。

主要处理了四件事：

1. 将旧 `Chamber1.vue` 中 23 个步骤补入 `scenario.json`，保留原步骤 id 作为节点 id，降低迁移风险。
2. 移除 JSON 内置“重新开始”选项，统一使用右侧面板固定的“重新开始副本”按钮，避免从剧情节点直接跳回 start 带来状态混乱。
3. 给最终结局和坏结局补充明确文案标识，并新增结局状态 flag。
4. 修复互动小说切换节点后中间剧情栏滚动位置不重置的问题。

## 相关代码路径

- `src/game/data/interactive_fictions/asylum_for_lunatic/scenario.json`
  - 补全 `asylum_for_lunatic` 副本节点、分支、成功/失败结局文案与 `setFlags`。
- `src/game/core/interactiveFiction.ts`
  - 为互动小说运行状态新增 `flags`。
  - 支持节点级 `setFlags`，进入结局节点时写入状态。
- `src/game/views/components/base/GameScrollArea.vue`
  - 暴露 `scrollToTop()`，供具体模式在内容切换后主动复位滚动条。
- `src/game/views/modes/interactive-fiction/GameInteractiveFictionView.vue`
  - 监听互动小说节点变化，切换节点后重置中间剧情栏滚动位置。
  - 给剧情滚动容器加节点级 `key`，避免浏览器沿用上一节点的滚动位置。
- `scripts/tests/event-runner.test.mjs`
  - 更新互动小说测试入口为 `asylum_for_lunatic`。
  - 增加完整流程图检查、结局 flag 检查、坏结局不允许内置重开选项检查。

## 开发过程中遇到的问题

### 1. 旧页面流程长，手动补 JSON 容易漏节点

旧 `Chamber1.vue` 里有 23 个 `DomainLayout` 步骤，且每个步骤通过按钮修改 `step.main.step` 跳转。直接手抄很容易漏掉分支或写错目标节点。

解决方法：

- 先用测试锁定完整节点列表。
- 按旧步骤 id 迁移为 scenario 节点 id。
- 在 `event-runner.test.mjs` 中增加流程图完整性检查，确保所有 `choice.next` 都指向存在节点。

### 2. JSON 内置“重新开始”会绕过右侧固定重开逻辑

坏结局原本保留了从旧页面迁来的“重新开始”按钮。放在新互动小说系统里，这会让剧情节点直接跳回 `start`，但任务、线索、flags 等状态可能仍然残留，后续容易引入奇怪 bug。

解决方法：

- 删除坏结局节点里的内置重开选项。
- 统一使用右侧面板固定的“重新开始副本”按钮触发 runner 的 restart。
- 在测试中明确禁止 `choice.next === 'start'`。

### 3. 结局只靠文案不够，后续无法参与分支

单纯写“逃生成功/失败”只能让玩家看到结果，后续系统无法根据结局影响地图、对话或其它副本。

解决方法：

- 在 `InteractiveFictionState` 中新增 `flags`。
- 在节点数据里支持 `setFlags`。
- 成功结局 `continue_8` 写入：

```json
{
  "escapeResult": "success",
  "scenarioCompleted": true
}
```

- 坏结局 `end_constraint`、`end_couple`、`end_statuary`、`end_dean` 写入：

```json
{
  "escapeResult": "failure",
  "scenarioCompleted": true
}
```

### 4. 切换选项后中间剧情栏滚动条没有回到顶部

互动小说正文很长时，玩家在上一节点滚到底部后进入下一节点，滚动条可能仍停在底部，导致新节点开头看不到。

解决方法：

- `GameScrollArea` 暴露 `scrollToTop()`。
- `GameInteractiveFictionView` 监听 `payload.state.nodeId`。
- 节点变化后使用 `nextTick` 和 `requestAnimationFrame` 复位滚动。
- 同时给中间剧情滚动容器加 `:key="payload.state.nodeId"`，确保节点变化时滚动容器重建。
- 点击选项时主动 `blur()` 当前按钮，避免浏览器焦点把新页面滚回底部。

## 验证结果

已执行：

```powershell
node --test scripts\tests\event-runner.test.mjs
npm run build:web
```

结果：

- `event-runner.test.mjs` 通过，`40/40`。
- `npm run build:web` 通过。
- 用户实测确认：
  - 互动小说流程可继续推进。
  - 中间剧情栏换节点后滚动复位正常。
  - JSON 内置重开选项移除后不再引入异常。
  - 成功/失败结局文案与状态设计符合预期。

## 后续维护建议

1. 后续其它互动小说副本也优先使用 `setFlags` 记录关键结果，不要只依赖文本。
2. 需要让结局影响地图或其它对话时，可以从互动小说 `state.flags.escapeResult` 扩展桥接逻辑。
3. JSON 内不要再添加“重新开始”分支；统一使用右侧固定按钮。
4. 新增长文本节点时，继续复用 `GameScrollArea`，避免每个模式各自实现滚动行为。
