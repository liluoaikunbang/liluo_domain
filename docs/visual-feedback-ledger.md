# 海报视觉反馈账本

## 权威来源

- 角色风格：liluoProfile.summary、liluoProfile.fixedTraits、liluoProfile.stylePreferences、liluoProfile.publicSafety
- 世界风格：worlds[].palette、worlds[].materials、worlds[].atmosphere、worlds[].liluoLooks
- 归档规范：visualFeedbackArchiveRules[]
- 反馈沉淀：visualFeedbackLedger[].abstractedTraits、visualFeedbackLedger[].promptEffects

## 归档绝对化规则

- 原始反馈允许记录“更弱气”“更浅一些”“少一点”这类相对表达，用来保留用户当下的比较语境。
- 进入视觉反馈账本的 abstractedTraits、promptEffects，以及角色/世界权威字段时，必须改写成绝对、可复用、可执行的目标描述。
- 归档文本不得保留缺少参照物的比较词，例如“更”“再”“少一点”“浅一些”；如果确实需要比较，必须同时写明基线对象。

## 自动归入规则

1. 角色、世界、镜头、材质、色板、页面节奏等任何海报评价都先写入本账本。
2. 账本负责把单次评价抽象成可复用特征和 prompt 影响。
3. 确认后的稳定特征再回写到 `liluoProfile`、`worlds[*]` 或其他权威源，后续批次自动继承。
4. 归档时不得直接保留“更浅一些”“少一点”这类相对说法，必须改写成绝对、可执行的目标描述。

## 当前已吸收的评价

## 2026-08-02｜vf-2026-08-02-liluo-stature-face-calibration

- 作用范围：liluo-character、site-posters、batch-B00
- 归入对象：角色 liluo；世界 all；集合 site-posters、batch-B00
- 归入维度：stature、body-proportion、face-shape
- 来源：user-feedback
- 归档规范：用户原始反馈里的“太高”“太尖”“较为丰满”只保留在 rawSummary；归档后的体态与脸型规则必须改写成绝对、可复用的角色锚点。
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

## 2026-08-02｜vf-2026-08-02-liluo-baseline-calibration

- 作用范围：liluo-character、site-posters、batch-B00
- 归入对象：角色 liluo；世界 all；集合 site-posters、batch-B00
- 归入维度：age-anchor、temperament、hair-color、eye-color、daily-cool-outfit、sock-signature
- 来源：user-feedback
- 归档规范：用户原始反馈里的相对表达只保留在 rawSummary；归档后的 abstractedTraits 与 promptEffects 必须改写成绝对描述。
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
