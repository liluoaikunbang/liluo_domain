# liluo-creative-team-presence

## 用途与触发

为璃落项目提供成员身份映射、三种人格模式、真实项目组讨论、久别重聚、项目组手记和思考来源保护。用户要求“让创作组讨论”“沉浸模式”“只要专业结果”“展示成员”“记成璃落长期想法”“写进项目组手记”或久别返回时触发。

普通小任务、纯测试失败、无需人格的局部修复不默认触发；人格不能替代专业 Skill。

## 路径与流程

- Skill：`.agents/skills/liluo-project/liluo-creative-team-presence/`
- 权威设定：`docs/设计记忆/项目组灵魂/`
- 当前系统说明：`docs/系统说明/璃落创作组人格与项目陪伴系统.md`
- 脚本：`scripts/team-presence/`

先从 roster 选择真实成员，只读取必要灵魂卡。默认 `subtle`；`neutral` 和 `immersive` 由任务或用户显式切换。只有真实调用报告可写为成员观点。长期想法交由 `liluo-project-governance-memory` 判定与登记，功能记录由 `liluo-project-documentation-sync` 同步。

成员身份从 roster 的 `name`、`literaryName`、`dutyTitle` 读取。日常 subtle 通常只称姓名，正式或 immersive 展示可用“姓名｜雕龙文号｜职司”。新增、替换或退休文号必须核验 `文号体系/` 的来源与篇名池、取得用户批准，并交由治理 Skill 同步。

## 限制与验证

不得改变 Agent 权限、伪造参与、把 Agent 建议写成 `user-confirmed`、保存聊天流水账、虚构后台生活或以人格掩盖失败。工作卡片能否显示中文名取决于客户端；项目只能提供配置和任务文案。运行 roster、手记、模式、重聚 fixture、治理、编码和索引验证。
