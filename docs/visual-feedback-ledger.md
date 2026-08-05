# 项目图像反馈账本

## 权威来源

- 角色风格：liluoProfile.summary、liluoProfile.fixedTraits、liluoProfile.hairColorProfile、liluoProfile.stylePreferences、liluoProfile.publicSafety
- 世界风格：worlds[].palette、worlds[].materials、worlds[].atmosphere、worlds[].liluoLooks
- 归档规范：visualFeedbackArchiveRules[]
- 构图规则：characterShowcaseCompositionRules[]
- 反馈沉淀：visualFeedbackLedger[].abstractedTraits、visualFeedbackLedger[].promptEffects

## 归档绝对化规则

- 原始反馈允许记录“更弱气”“更浅一些”“少一点”这类相对表达，用来保留用户当下的比较语境。
- 进入视觉反馈账本的 abstractedTraits、promptEffects，以及角色/世界权威字段时，必须改写成绝对、可复用、可执行的目标描述。
- 归档文本不得保留缺少参照物的比较词，例如“更”“再”“少一点”“浅一些”；如果确实需要比较，必须同时写明基线对象。
- 所有图像生成链路都先按“事实身份 / 提示词组装 / 成图 QA”判层，再决定是否写进 authority、prompt 或 QA。

## 自动归入规则

1. 角色、世界、镜头、材质、色板、页面节奏等任何项目图像评价都先写入本账本。
2. 账本负责把单次评价抽象成可复用特征和 prompt 影响。
3. 每条反馈都先过“纠正什么 / 影响多大 / 持续多久 / 应该落在哪层”的判层问题，再决定是否写入 authority、prompt 或 QA。
4. 确认后的稳定特征再回写到 `liluoProfile`、`worlds[*]` 或其他权威源，后续批次与 Grok 探索图共用同一套规则。
5. 归档时不得直接保留“更浅一些”“少一点”这类相对说法，必须改写成绝对、可执行的目标描述。

## 判层问题

1. 这条反馈纠正的是事实身份、画面强调点、批次画像，还是成图后的质量问题？
2. 它影响的是全局角色、某个世界、某类资产、某个批次，还是只影响这一张图？
3. 它是长期有效、只在当前批次成立、只对这一次成立，还是还不能稳定表述？
4. 它最应该落在权威字段、提示词组装、成图 QA，还是先停留在待确认账本里？

## 默认收窄原则

- 能放单图就先别升成批次规则。
- 能放批次规则就先别升成全局规则。
- 能做 QA 的问题先别污染所有提示词。
- 还不能写成绝对描述的反馈，只能停留在待确认账本。

## 当前已吸收的评价

## 2026-08-02｜vf-2026-08-02-liluo-stature-face-calibration

- 作用范围：project-image-generation、liluo-character、batch-B00
- 判层卡：角色或主体身份 / 全局角色 / 长期规则 / 权威字段 + 提示词组装 + 成图复核
- 适用生成链路：gpt-image-2、grok
- 归入对象：角色 liluo；世界 all；集合 project-image-generation、batch-B00
- 归入维度：stature、body-proportion、face-shape
- 来源：user-feedback
- 归档规范：用户原始反馈里的“太高”“太尖”“较为丰满”只保留在 rawSummary；归档后的体态与脸型规则必须改写成绝对、可复用的角色锚点。
- 落点层：subject
- 回写目标：角色 liluoProfile.summary、liluoProfile.fixedTraits；世界 worlds[].liluoLooks；prompt buildLiluoIdentityPromptFragment()、buildLiluoBaselineEntries()、buildLiluoWorldEntries()
- 原始评价摘要：用户反馈当前人物太高、脸太尖；璃落应当是娇小的，身高约 150 左右，体态相对较为丰满但不要夸张，脸型应为鹅蛋脸而不是瓜子脸。
- 抽象出的长期特征：
  - 璃落的身高锚点固定为约 150cm 的娇小成年女性，不使用高挑长腿比例
  - 璃落的体态固定为娇小基础上的自然曲线与轻微丰润感，不过度夸张，不画成纸片瘦削或极端性感化身材
  - 璃落的脸型固定为柔和鹅蛋脸，面中到下颌的过渡圆润收束，不画成尖脸、尖下巴或瓜子脸
- 对 prompt 的直接影响：
  - 角色身份 prompt 必须显式写入约 150cm 的娇小身高锚点、自然曲线与轻微丰润感
  - 角色 prompt 必须显式排除高挑比例、尖下巴和瓜子脸
  - 后续对体态与脸型的评价继续先进入账本，再决定是否回写长期字段
- 明确排除的错放方式：
  - 把璃落继续画成长腿高挑比例
  - 把脸型收成尖下巴、瓜子脸或过瘦脸
  - 只在 QA 口头提醒，不把规则沉到长期 authority
- 升级门槛：只有当这条反馈能稳定描述娇小体型、曲线边界和脸型边界时，才允许回写到长期角色 authority。

## 2026-08-02｜vf-2026-08-02-liluo-baseline-calibration

- 作用范围：project-image-generation、liluo-character、batch-B00
- 判层卡：角色或主体身份 / 全局角色 / 长期规则 / 权威字段 + 提示词组装 + 成图复核
- 适用生成链路：gpt-image-2、grok
- 归入对象：角色 liluo；世界 all；集合 project-image-generation、batch-B00
- 归入维度：age-anchor、temperament、hair-color、eye-color、daily-cool-outfit、sock-signature
- 来源：user-feedback
- 归档规范：用户原始反馈里的相对表达只保留在 rawSummary；归档后的 abstractedTraits 与 promptEffects 必须改写成绝对描述。
- 落点层：subject
- 回写目标：角色 liluoProfile.summary、liluoProfile.fixedTraits、liluoProfile.variableTraits、liluoProfile.stylePreferences、liluoProfile.feedbackIntakeRules；世界 worlds[].liluoLooks、worlds[].palette、worlds[].materials、worlds[].atmosphere；prompt buildLiluoIdentityPromptFragment()、buildLiluoLookPromptFragment()、buildLiluoSafetyPromptFragment()
- 原始评价摘要：用户要求璃落更弱气、更年轻可爱、刚刚成年，发色改为更浅的红棕色，保持红色瞳孔，穿着更清凉更日常，并把喜欢各种袜子作为长期可识别特征。
- 抽象出的长期特征：
  - 公开海报中的璃落改为 18 岁刚成年的成年女性，而不是更成熟的 22 岁感
  - 默认气质从稳定成熟收束到偏弱气、年轻可爱、带一点怯意，但严格保持成年与非幼态边界
  - 头发改为浅红棕色，瞳孔保持红色
  - 服装默认改为清凉、日常、轻层次，避免厚重成熟化
  - 袜子细节升级为长期视觉辨识点，可随世界切换不同袜型与材质
- 对 prompt 的直接影响：
  - 角色 prompt 必须显式写入年龄锚点、发色瞳色、弱气可爱气质与非幼态边界
  - 世界变体与身份基线 prompt 都应写入清凉日常穿搭和袜子辨识度
  - 后续用户评价应继续追加到账本，再回写到角色或世界权威源
- 明确排除的错放方式：
  - 把“更弱气”“更年轻”直接原样写进长期规范
  - 把璃落再次画成更成熟或发色漂移的另一套角色
  - 只在某个模型 prompt 里偷加，不回写 authority
- 升级门槛：只有当年龄、发色、瞳色、气质和穿搭偏好都能被写成绝对目标时，才允许升级成长期规则。

## 2026-08-02｜vf-2026-08-02-character-full-body-default

- 作用范围：project-image-generation、liluo-character、character-showcase
- 判层卡：构图与镜头 / 资产类型 / 长期规则 / 权威字段 + 提示词组装 + 成图复核
- 适用生成链路：gpt-image-2、grok
- 归入对象：角色 liluo；世界 all；集合 liluo-character、project-image-generation
- 归入维度：composition、framing、showcase-coverage
- 来源：user-feedback
- 归档规范：用户提出的“尽量全身、不要半身”属于长期构图规则，归档后必须写成稳定的构图约束，而不是只保留一次性的相对偏好。
- 落点层：composition
- 回写目标：角色 characterShowcaseCompositionRules[]；世界 未指定；prompt buildCharacterShowcasePromptFragment()、buildLiluoBaselineEntries()
- 原始评价摘要：用户要求专门展示人物的时候尽量全身都展示，不要半身，除非这张图需要展示背景。
- 抽象出的长期特征：
  - 人物专门展示图默认采用完整全身构图，让发型、服装、袜子与鞋履同时可读
  - 半身或中近景只在背景、空间关系或页面功能需要时使用
- 对 prompt 的直接影响：
  - 角色基线与角色展示 prompt 必须优先要求完整全身展示，不能默认落到半身特写
  - 如果一张图以背景说明为主，prompt 需要显式声明这是允许收成中近景的例外情形
- 明确排除的错放方式：
  - 专门展示角色时仍默认使用半身特写
  - 为了省事把构图规则只留在口头说明里
  - 把背景说明例外扩成所有角色图的默认镜头
- 升级门槛：只有当“人物展示图”和“背景说明图”的边界明确后，才把全身优先升级为长期构图规则。

## 2026-08-02｜vf-2026-08-02-hair-color-parameterization

- 作用范围：project-image-generation、liluo-character、color-calibration
- 判层卡：角色或主体身份 / 全局角色 / 长期规则 / 权威字段 + 提示词组装 + 成图复核
- 适用生成链路：gpt-image-2、grok
- 归入对象：角色 liluo；世界 all；集合 liluo-character、project-image-generation
- 归入维度：hair-color、lighting-variation、color-parameters
- 来源：user-feedback-with-reference-image
- 归档规范：参考图只用于提炼日常光线下的发色色系参数；归档时必须写成稳定的颜色锚点和光线调整规则，不能只保留“像这张图一样红”的模糊描述。
- 落点层：subject
- 回写目标：角色 liluoProfile.summary、liluoProfile.fixedTraits、liluoProfile.hairColorProfile；世界 未指定；prompt buildLiluoHairColorPromptFragment()、buildLiluoIdentityPromptFragment()
- 原始评价摘要：用户提供一张参考图，要求璃落发色以这张图的红色系为日常光线下的默认发色参数，并允许根据光线亮暗做适度调整。
- 抽象出的长期特征：
  - 璃落日常光线下的发色锚点改为偏绯红的红系红棕，而不是泛橙或偏紫的红发
  - 发色规则需要显式给出基础色、阴影色和高光色参数，并允许在同色系内做亮暗调整
- 对 prompt 的直接影响：
  - 角色 prompt 必须写明日常光线下的发色锚点和允许的明暗调整范围
  - 不同世界与时间段可以调亮或压暗发色，但不能把璃落画成橙金、棕灰或紫黑头发
- 明确排除的错放方式：
  - 只写“像参考图那样红”而不写稳定锚点
  - 允许不同模型把头发漂成橙金、棕灰或紫黑
  - 只靠成图后挑图，不回写发色 authority
- 升级门槛：只有当参考图已经被抽象成稳定的发色锚点与同色系明暗规则后，才允许升级为长期 authority。

## 2026-08-05｜vf-2026-08-05-batch00-baseline-clarity

- 作用范围：project-image-generation、liluo-character、batch-B00、character-baseline
- 判层卡：构图与镜头 + 角色穿搭 / 资产类型 / 长期规则 / 权威字段 + 提示词组装 + 成图复核
- 适用生成链路：gpt-image-2、grok
- 归入对象：角色 liluo；世界 all；集合 batch-B00、character-baseline、project-image-generation
- 归入维度：baseline-background、outfit-complexity、identity-clarity
- 来源：user-feedback
- 归档规范：这条反馈只针对“基准图/身份锚点图”的信息组织，不强行扩成所有世界图的背景规则；归档后必须写成稳定的基准图约束，而不是保留“背景简单一点”“衣服别太复杂”这种相对说法。
- 落点层：composition
- 回写目标：角色 liluoProfile.stylePreferences、characterShowcaseCompositionRules[]；世界 未指定；prompt buildLiluoLookPromptFragment()、buildCharacterShowcasePromptFragment()、buildLiluoIdentityPromptFragment()
- 原始评价摘要：用户指出当前基准图背景太复杂、服装太复杂，会误导后续基准；璃落不喜欢繁琐复杂服装，可以不朴素，但必须简单又不失设计。
- 抽象出的长期特征：
  - 基准图与身份锚点图的背景固定为低干扰、低叙事、低复杂度，不用重场景信息抢走角色校准重点
  - 璃落的默认服装允许有设计感，但结构必须简洁清楚，避免繁琐叠穿、重装饰、复杂披挂和过多挂件
  - 基准图的首要职责是校准人物身份，而不是提前定义完整世界场景或华丽服装系统
- 对 prompt 的直接影响：
  - Batch 00 基准图 prompt 必须显式要求中性、简洁、低干扰背景，不使用强叙事场景做身份底板
  - 璃落的基准服装 prompt 必须显式要求“简洁但有设计感”，并排除繁复服装结构
  - 后续世界变体可以继续增加材质和空间信息，但不能回头污染人物基准的低干扰原则
- 明确排除的错放方式：
  - 把复杂世界观场景直接塞进人物基准图背景
  - 把华丽层叠服装误当成璃落默认审美
  - 只在这一次 prompt 临时处理，不回写长期规则入口
- 升级门槛：只有当“人物基准图”和“世界展示图”的边界持续稳定后，这条规则才继续保持为长期资产类型规范。

## 2026-08-05｜vf-2026-08-05-liluo-adult-feature-proportion

- 作用范围：project-image-generation、liluo-character、batch-B00
- 判层卡：角色或主体身份 / 全局角色 / 长期规则 / 权威字段 + 提示词组装 + 成图复核
- 适用生成链路：gpt-image-2、grok
- 归入对象：角色 liluo；世界 all；集合 liluo-character、batch-B00、project-image-generation
- 归入维度：facial-feature-proportion、adult-coding、non-infantile-face
- 来源：user-feedback
- 归档规范：用户已明确说明问题不在脸形而在五官比例，因此归档后必须把“脸形正确、五官比例偏幼”拆开描述，不得再用“脸有点幼”这种混合说法。
- 落点层：subject
- 回写目标：角色 liluoProfile.summary、liluoProfile.fixedTraits；世界 worlds[].liluoLooks；prompt buildLiluoFacePromptFragment()、buildLiluoIdentityPromptFragment()
- 原始评价摘要：用户确认璃落当前脸形很完美，但五官比例偏幼态，需要在不改脸形的前提下，把眼鼻口比例调到年轻成年女性的阅读。
- 抽象出的长期特征：
  - 璃落的脸形继续固定为柔和鹅蛋脸，不因这条修正改动脸形锚点
  - 璃落的五官比例固定为年轻成年感，不使用过大的眼睛、过短中庭、过轻婴儿感或明显未成年化的五官配置
  - 璃落可以柔和、可爱、偏弱气，但五官结构必须首先读成成年女性
- 对 prompt 的直接影响：
  - 角色身份 prompt 必须把“脸形”和“五官比例”分开写，既保留鹅蛋脸，又显式排除幼态化五官比例
  - 成图 QA 需要优先检查眼睛大小、鼻口比例和整体成年感，而不是只看下巴与脸轮廓
  - 后续若模型再次出现幼态化趋势，应先按五官比例校正，不要误改脸形
- 明确排除的错放方式：
  - 因为五官幼态问题而把脸型重新改尖或改瘦
  - 继续使用“大眼幼态可爱”作为默认风格捷径
  - 只写“不幼态”而不补足成年感五官比例锚点
- 升级门槛：只有当多轮生成都能在保持鹅蛋脸的同时稳定呈现成年感五官比例，这条规则才算验证通过。

## 2026-08-05｜vf-2026-08-05-batch-variation-diversity

- 作用范围：project-image-generation、batch-B00、website-display-refinement
- 判层卡：批次画像 / 批次层 / 批次规则 / 提示词组装 + 成图复核
- 适用生成链路：gpt-image-2、grok
- 归入对象：角色 liluo；世界 all；集合 batch-B00、website-display-refinement、project-image-generation
- 归入维度：hairstyle-rotation、pose-rotation、head-angle-rotation、style-rotation、anti-repetition
- 来源：user-feedback
- 归档规范：这条反馈纠正的是一整批公开图之间的重复问题，不是璃落个人身份错误；归档后必须写成“批次去重规则”，而不是把某一种发型或动作升级成唯一正确答案。
- 落点层：world
- 回写目标：角色 未指定；世界 未指定；prompt buildLiluoBatchVariationPromptFragment()；QA 批次复核
- 原始评价摘要：用户确认浮光掠影方向基本成立，但指出当前网站候选图的主要共性问题是动作、发型、头部角度和风格太单一；后续精修不能继续批量使用同一种站姿、同一种发型、同一种头部朝向和同一种页面气质。
- 抽象出的批次特征：
  - 同一轮 Batch 00 或网站展示精修中，不得让多张图长期重复同一种默认站姿、同一种发型、同一种头部朝向和同一种服装风格重心
  - 发型、动作、头部角度和整体风格必须在“同一人”的边界内主动轮换，形成可读的世界差异与页面节奏
  - 批次多样性是公开展示层规则，不得通过破坏璃落身份一致性来换取表面差异
- 对 prompt 的直接影响：
  - 批量生成或连续精修 prompt 必须显式说明当前图相对于同批其他图要避开什么重复项
  - 网站展示图优先为每张图指定不同的发型、不同的动作重心、不同的头部朝向或不同的风格倾向，而不是默认沿用上一张图
  - 成图 QA 需要把“是否与同批图片过于相似”作为正式检查项，而不是只看单张完成度
- 明确排除的错放方式：
  - 因为上一张图成功，就让整批图都沿用同一发型、同一站姿和同一头部角度
  - 用破坏人物一致性的极端改造去强行制造差异
  - 只在审美点评里提一句“有点像”，不把去重要求写回批次规则
- 升级门槛：只有当连续几轮公开展示图都能稳定拉开发型、动作、头部朝向与风格差异，同时保持璃落身份一致，这条规则才算真正生效。

## 2026-08-05｜vf-2026-08-05-post-inclusion-freeze-priority

- 作用范围：project-image-generation、website-display-refinement、website-public-assets
- 判层卡：提示词组织 / 资产类型 / 长期规则 / 提示词组装 + 成图复核
- 适用生成链路：gpt-image-2、grok
- 归入对象：角色 liluo；世界 all；集合 website-display-refinement、website-public-assets、project-image-generation
- 归入维度：phase-gating、breadth-priority、refinement-stop-line
- 来源：user-feedback
- 归档规范：这条反馈纠正的是图像生产流程在已达收录线的展示图上停留过久的问题；归档后必须写成“收录后冻结并优先扩后续视觉元素”的流程规则，而不是一次性的催进度口头提醒。
- 落点层：composition
- 回写目标：角色 未指定；世界 未指定；prompt 任务层规划与批次 brief；QA 任务复盘
- 原始评价摘要：用户明确要求当前这批网站正式展示图不要再继续来回打磨，后面应继续推进更多视觉元素，不能总卡在同一批人物图上。
- 抽象出的长期特征：
  - 网站展示图一旦达到正式收录线并得到用户放行，默认冻结当前版本，转入后续视觉元素生产
  - 已正式收录的展示图不因“还可以再润一点”而自动重开；只有用户明确点名时，才进入二次精修
  - 图像生产优先级默认从“单张完美化”切换到“批次覆盖度与后续素材推进”，避免被少数展示图长期占用产能
- 对 prompt 的直接影响：
  - 后续批次规划或 prompt 任务层必须先说明当前是在做“新视觉元素生产”还是“已收录展示图返修”；未明确指定时默认视为新视觉元素生产
  - 当某张网站展示图已完成正式收录，后续 prompt 不再默认把它当作待精修对象，只把它作为风格参考或已完成样本
  - QA 与任务复盘需要检查是否在未获明确指令的情况下反复回到已收录展示图
- 明确排除的错放方式：
  - 因为某张图还能更好看，就继续在同几张人物图上循环
  - 未经用户明确要求，就把已正式收录的图再次当作当前主任务
  - 用局部打磨拖慢后续大批量视觉元素的推进节奏
- 升级门槛：只有当后续多个视觉批次都能在冻结已收录展示图的前提下继续稳定推进，而返修只在用户明确点名时发生，这条流程规则才算真正生效。

## 2026-08-05｜vf-2026-08-05-world-display-density-and-mainline-cues

- 作用范围：project-image-generation、website-public-assets、world-atlas、world-detail
- 判层卡：提示词组织 / 资产类型 / 长期规则 / 提示词组装 + 成图复核
- 适用生成链路：gpt-image-2、grok
- 归入对象：角色 liluo；世界 all；集合 website-public-assets、world-atlas、world-detail、project-image-generation
- 归入维度：composition-density、asset-role-boundary、world-specificity、mainline-cue-selection
- 来源：user-feedback
- 归档规范：这条反馈纠正的是“首页 hero 的留白策略被误扩散到世界展示图”和“世界图只剩氛围没有主线特征”的双重偏移；归档后必须写成稳定的资产类型边界与世界特征装配规则，而不是只在个别批次里临时提醒。
- 落点层：composition
- 回写目标：角色 未指定；世界 all；prompt 任务层规划、世界批次 brief、站点展示 seed；QA 构图审查
- 原始评价摘要：用户要求把单侧大留白收紧，明确只有特定首页类资产才允许明显文案安全区；同时世界展示图应该带有各自世界的主线部分特点，后续再逐个世界细化。
- 抽象出的长期特征：
  - 明显的单侧大留白默认只属于首页 hero、分享落地页或明确需要叠加文案/贡献者墙的资产，不自动外溢到世界展示图、分支预告图或一般展示板
  - 世界展示图不能只成立于“这个世界很好看”，还必须让观者看见这个世界正在长期运转的主线部分、空间层级或关系压力
  - 每张世界展示图默认至少装配 2–4 个该世界的公开主线特征锚点，优先从 zones、routines、branchSeeds 或长期公共叙事切口中挑，而不是只靠单一气氛和颜色命名世界
  - 当单张世界图需要承载较多主线切片时，默认先建立清楚的 4–6 个宏观分区，再在每个分区内部保留软过渡；不能把所有切片同权混成一团
  - 当世界天然存在 6 个主线大区时，不为追求简化而强行压缩；总图优先采用“人物锚点 + 6 个大区域”的一级结构
  - 六个大区域必须有一眼可分的主色系与光线家族，不能在总图里混成同一套灰蓝调；观者不看标题也要能快速区分不同块
  - 浮光掠影总图的六区默认都保留都市/建成环境底色：校园要像现代学校，正常都市要像真实当代都市，罪恶都市要像老旧密集夜巷，过去时间线要像历史都市而不是古风或魔幻
  - 说明性文字默认不直接烤进世界展示底图；如果需要标题或说明，优先交给网页外部排版或后续程序化叠加
- 对 prompt 的直接影响：
  - 后续任何 `world-detail`、`world atlas`、`share-world`、`world-day` 类 prompt，默认禁止大块单侧空白；如果确实需要留白，必须显式说明它服务的页面角色
  - 世界图 prompt 必须显式写出本张图选取了该世界哪些主线特征锚点，例如空间区块、日常流程、分支张力、制度接口或长期生活切片
  - 成图 QA 需要同时检查“构图是否因为错误套用首页安全区而偏空”和“这张图是否不用标题也能看出是哪个世界、在发生什么长期生活或主线压力”
  - 当一张世界图装配的切片数量较多时，prompt 必须先交代一级分区逻辑，再交代二级切片内容；QA 需要检查观者第一眼能不能先抓住 1 个总重点或 4–6 个大块，而不是直接陷入同权信息洪流
  - 对于总图级世界展示图，一级结构默认只写大区域，不在同一张图里继续要求每个大区域内部再拆子区域；子区域改为后续小图批次
  - 总图级 prompt 需要为每个大区域指定不同色调家族，至少区分冷暖、明暗或材质反射特征，避免“六区结构正确但一眼看过去全像同一块”
  - 浮光掠影总图 prompt 需要显式限制现代学校真实性、正常都市去科幻、金字塔转沙漠考古风、罪恶都市去大火奇观、过去时间线去古风/魔幻味，以及中心与分割线使用更偏都市广场/路网的材质语言
- 明确排除的错放方式：
  - 把 hero 的左侧 CTA 留白构图直接套到世界展示图上
  - 用大面积空天、空墙、空地去代替真正的世界内容组织
  - 只给出泛古风、泛校园、泛科幻氛围，却看不出该世界独有的主线空间、生活流程或公开分支张力
  - 因为想保留氛围，就让所有切片以相近权重挤在同一层，导致观者找不到重点
  - 明明世界天然有 6 个大区域，却为了图面整洁强行压缩成 4 块，反而丢掉原本清楚的主线组织
  - 六个区域虽然结构分开了，但色系和明暗关系几乎一样，导致观者第一眼还是分不清块与块
  - 把浮光掠影的学校画得像城市，把正常都市画成未来科幻城，把罪恶都市画成着火灾后废城，或把历史时间线做成泛古风/魔幻街景
  - 遇到难读的世界拼图，第一反应就是把说明文字直接烤进图里，而不是先修正分区层级
- 升级门槛：只有当多个世界批次都能在不依赖大块单侧留白的前提下，稳定做出“看图就能认出世界与主线特征”的展示图，这条规则才算真正生效。
