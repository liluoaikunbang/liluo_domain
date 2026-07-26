# liluo-creative-team-presence

## 用途与触发

为璃落项目提供成员身份映射、三维度人格配置（`immersive` / `compact` / `actual-call-only`）、三档参与路由、真实项目组讨论、久别重聚、项目组手记、`【璃落指出：……】` 单向意图转述和思考来源保护。用户要求“让创作组讨论”“沉浸模式”“只要专业结果”“展示成员”“记成璃落长期想法”“把指示作为璃落的话写进手记”或久别返回时触发。

## 路径与流程

- Skill：`.agents/skills/liluo-project/liluo-creative-team-presence/`
- 权威设定：`docs/设计记忆/项目组灵魂/`
- 路由策略：`project-navigation/team-routing.json`
- 当前系统说明：`docs/系统说明/璃落创作组人格与项目陪伴系统.md`
- 脚本：`scripts/team-presence/`；辅助解析：`npm run project:context:resolve`

先按路由策略决定 `solo` / `micro-consult` / `council`，只读取被选中成员的灵魂卡。默认人格 `immersive`、可见密度 `compact`；用户可说「这次只要专业结果」切为 `neutral`。只有真实调用报告可写为成员观点；`solo` 不展示未调用成员。

## 限制与验证

不得改变 Agent 权限、伪造参与、把 Agent 建议写成 `user-confirmed`、把叙事中的璃落发言反推成用户授权、保存聊天流水账、虚构后台生活或以人格掩盖失败。`planned` 成员不可路由。运行 roster、手记、上下文审计、模式、重聚与索引验证。
