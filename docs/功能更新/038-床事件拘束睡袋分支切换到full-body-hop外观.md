# 床事件拘束睡袋分支切换到 full body hop 外观

## 本次实现思路

这次调整是在已经接入 `full_body_bondage` 特殊四帧外观与 hop 移动表现的基础上，把 `liluo_room` 床事件里“体验下拘束睡袋休息”这条分支，正式切到新的外观定义上。

这次没有新增另一套剧情执行逻辑，也没有改单独的场景特判，而是继续沿用现有的：

- 对话选项声明 `playerAppearanceChange`
- 对话执行时调用 `setPlayerAppearance`
- 场内玩家精灵按当前 appearance 刷新纹理与动画表现

也就是说，本次重点不是重做事件系统，而是把床事件分支接到已经可用的 `full_body_bondage` 外观链路上，让这条剧情选择真正落到新的跳跃式行走表现。

---

## 相关代码路径

- `src/game/data/liluo_room/dialogues.json`
  - 将 `sleep_in_tie_bag` 选项里的：
    - `playerAppearanceChange.appearanceId`
  - 从旧的 `bondage` 改为新的 `full_body_bondage`

- `src/game/data/liluo_room/dialogues.ts`
  - 继续作为 `dialogues.json` 的运行时导出入口；
  - 本次无需改逻辑，但用于确保测试读取的是实际对话源数据。

- `scripts/tests/event-runner.test.mjs`
  - 更新“体验下拘束睡袋休息”分支的 appearance 期望；
  - 更新 live 对话源读取后的断言；
  - 顺手补齐主角外观资源清单断言，覆盖 `liluo_full_body_bondage`。

- `scripts/tests/player-spritesheet-normalization.test.mjs`
  - 保留并核对 `full_body_bondage` 的四帧 spritesheet 配置与 `hop` movement metadata；
  - 同时修正这里已经过期的默认外观断言，避免回归测试被旧预期干扰。

---

## 开发过程中遇到的问题

### 问题 1：测试改成新期望后，live 对话源仍然读到旧的 `bondage`

一开始我先按 TDD 把测试期望改成 `full_body_bondage`，结果只有“手写伪造 choice 数据”的测试通过了，而读取 `liluo_room` 实际对话源的测试仍然失败。

这说明问题不在执行器，而在真实数据源本身还没有切过去。

### 解决方法

回查 `src/game/data/liluo_room/dialogues.json` 后，确认 `sleep_in_tie_bag` 选项里的：

```json
"playerAppearanceChange": {
  "appearanceId": "bondage"
}
```

仍然是旧值。

因此本次直接把它替换为：

```json
"playerAppearanceChange": {
  "appearanceId": "full_body_bondage"
}
```

这样对话源数据、执行链路和场内玩家精灵刷新就能统一落到新的特殊四帧 hop 外观上。

---

### 问题 2：相关测试里还残留旧资源清单和旧默认外观断言

在回归过程中，除了床事件分支本身，还发现测试文件里保留着之前阶段留下的旧预期，例如：

- 资源 manifest 仍只断言两套 walk spritesheet；
- `player-spritesheet-normalization` 里仍有已经过期的默认外观断言。

这些内容虽然不直接影响床事件配置修改，但会影响这次回归验证的准确性。

### 解决方法

顺手把相关测试更新为当前真实状态：

1. `event-runner.test.mjs` 中的资源 manifest 断言补上 `liluo_full_body_bondage`；
2. `player-spritesheet-normalization.test.mjs` 中单独保留：
   - 默认外观当前状态断言；
   - `full_body_bondage` 的 `hop` 元数据断言。

这样这次测试既能覆盖床事件分支切换，也不会被无关但过期的旧断言误伤。

---

## 最终验证结果

你已经实机确认这条分支没问题。

本次代码侧的回归验证命令为：

```bash
node --test scripts/tests/event-runner.test.mjs scripts/tests/player-spritesheet-normalization.test.mjs
```

验证结果：

- `19 / 19` 测试通过；
- `liluo_room` 床事件里选择“体验下拘束睡袋休息”后，主角会切换到 `full_body_bondage`；
- 该外观会继续沿用已经接入的 hop / 跳跃式移动表现；
- 原有对话执行链路、主角外观切换链路和场内刷新链路保持可用。