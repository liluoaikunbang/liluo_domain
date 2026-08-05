# Batch 00 对齐审计（2026-08-05）

## 范围

- `Batch 00` 的人物基线 authority
- 运行时 `Batch 00` prompt 组装入口
- 2026-07-31 遗留 prompt 记录
- 现有公开基准人物图与本轮候选基准图

## 当前 authority

截至 2026-08-05，`Batch 00` 的人物基线应以以下权威源为准：

- `docs/功能更新/180-大型视觉海报官网升级与运行时视觉计划体系.md`
- `docs/liluo-identity-and-variation-bible.md`
- `docs/visual-feedback-ledger.md`
- `src/content/site/siteBlueprint.js`

当前正式基线要求：

- 璃落固定为 `18 岁刚成年的成年女性`
- 日常光线下为偏绯红的浅红棕发与红色瞳孔
- 身高锚点约 `150cm`
- 体态为娇小基础上的自然曲线与轻微丰润感
- 脸型为柔和鹅蛋脸，不画成尖下巴或瓜子脸
- 专门展示人物时默认全身优先

## 已对齐部分

### 1. 运行时 `Batch 00` prompt 已切到新 authority

`src/content/site/sitePlanRuntime.js` 的 `buildLiluoBaselineEntries()` 已通过：

- `buildLiluoIdentityPromptFragment()`
- `buildLiluoHairColorPromptFragment()`
- `buildCharacterShowcasePromptFragment()`

来装配新的角色基线 prompt，不再直接依赖 2026-07-31 的旧文字。

### 2. 站点运行时描述已切到新基线

- `src/content/site/siteBlueprint.js`
- `src/content/site/siteData.js`

都已经写成 `18 岁 / 150cm / 轻微丰润 / 鹅蛋脸 / 全身优先` 的口径。

### 3. 站点视觉计划状态完整

`npm run site:visual:status` 当前返回：

- `plannedVisuals: 1248`
- `promptReady: 1248`
- `publishedVisuals: 60`
- `screenshotPlan: 96`
- `screenshotCaptured: 7`

说明 `Batch 00` 所属的整套视觉计划并不是空白，而是“authority 已更新，公开素材还没全部追平”。

## 未对齐部分

### 1. 2026-07-31 的 prompt 记录仍保留旧口径

以下文件仍然把璃落写成 `22 years old`、`petite and slender`：

- `docs/assets/readme/prompts/2026-07-31-character-system-batch-a.md`
- `docs/assets/readme/prompts/2026-07-31-liluo-variants-batch-a.md`
- `docs/assets/readme/prompts/2026-07-31-overview-system-batch-b.md`
- `docs/assets/readme/prompts/2026-07-31-world-triptychs-batch-a.md`
- `docs/assets/readme/prompts/2026-07-31-world-triptychs-batch-b.md`

这些文件现在只能视为**历史记录**，不能再当作 `Batch 00` 的当前 prompt authority 复用。

### 2. 现有公开基准人物图仍带有旧批次气质

现有正式公开图：

- `docs/assets/readme/generated/liluo-master-character-portrait-v2.png`

虽然仍可作为“角色连续性参考图”，但它来自 2026-07-31 那轮 prompt 记录，视觉上仍明显保留：

- 偏旧的 `22 岁` 成熟感
- 更接近 `petite and slender` 的纤细体态
- 不足够明确的 `150cm / 轻微丰润 / 鹅蛋脸` 信号

因此它不应继续被当作“已经完全确认的新基线”，而应视为**旧公开基准 2.0**。

## 本轮动作

### 1. 新候选图

本轮生成了一个**待确认**的 `Batch 00` 候选基准图：

- `docs/assets/readme/generated/liluo-master-character-portrait-b00-candidate-2026-08-05.png`

它遵循当前 authority，且明确按“候选”保存，不覆盖 `v2`。

### 2. 候选 prompt 记录

对应 prompt 记录已单独保存：

- `docs/assets/readme/prompts/2026-08-05-batch-00-baseline-candidate.md`

## 当前结论

`Batch 00` 现在的核心矛盾不是“没有基线规则”，而是：

1. authority 已在 2026-08-02 更新
2. 旧 prompt 记录仍停留在 2026-07-31 的老口径
3. 旧公开基准图还没被新的、经过你确认的人物基准完全替换

所以后续正确动作应该是：

1. 先确认这轮候选人物基准是否接近你要的方向
2. 确认后再决定是否替换 `liluo-master-character-portrait-v2.png`
3. 再批量清理或标注 2026-07-31 的旧 prompt 记录，避免它们被误拿来继续生成
