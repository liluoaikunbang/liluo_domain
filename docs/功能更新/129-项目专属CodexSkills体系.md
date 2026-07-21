# 项目专属 Codex Skills 体系

创建时间：2026-07-20

## 更新时间记录

- 2026-07-20：首次建立 13 个项目专属 Skills，迁移并增强随机故事访谈流程，增加四个默认只读验证脚本、对应技能说明，并将 AGENTS.md 精简为核心约束与 Skill 路由。
- 2026-07-21：补充 GitHub 认证自动恢复规范；认证异常时先自动排除沙箱无法访问 Windows 凭据管理器造成的误报，确认失效后自动刷新或发起登录，仅把无法代替的浏览器授权或设备码确认交给用户。
- 2026-07-21：故事访谈与大纲撰写 Skill 在提出可能导致回写的问题前检索未使用情节；存在真实匹配项时，将条目名称和适配理由作为可选方案一并询问，未经确认不得自动采用。

## 实现思路

把原先长期堆积在 `AGENTS.md` 中的故事、地图事件、素材、行走图、存档、文档同步和审查细则拆成按任务触发的项目 Skill。Skill 主体保持精简，复杂检查表放入一层 references；仅对故事图、文档三方一致性、内容基础校验和素材扫描提供确定性只读脚本。跨任务都适用的 GitHub 认证恢复继续作为一条全局协作底线保留在 `AGENTS.md`。

## 相关路径

- `.agents/skills/liluo-project/`
- `docs/技能说明/`
- `AGENTS.md`
- `docs/功能更新目录.md`
- `src/game/data/global/updateRecords.js`

## 开发过程中遇到的问题

当前 Codex 会话启动时只发现了迁移前的顶层随机访谈 Skill，且 `.agents` 在普通文件沙箱中为只读；仓库也未安装 Playwright，不能伪造浏览器端到端自动化能力。

## 对应问题的解决方法

在获得限定权限后仅创建明确要求的 Skill 目录，文件内容继续使用可审查补丁维护；嵌套发现状态留待重启后通过 `/skills` 或 `$` 实际确认。浏览器回归 Skill 明确采用现有构建、Node 测试和人工清单，不安装新依赖。

后续排查确认 GitHub CLI 在普通沙箱中可能因无法访问 Windows Credential Manager 而误报 keyring token 无效，但在具备系统凭据访问权限的环境中认证仍然有效。因此认证失败必须先自动进行权限环境对照；只有两边均确认失效时才自动刷新或重新登录，避免反复要求用户手工执行命令。

## 验证

- 当前环境没有可用 Python，运行 `node scripts/tests/validate-project-skills.mjs` 完成等价的项目 Skill 结构验证
- 运行四个新增脚本的帮助、正常只读和错误路径
- `node --test` 运行相关故事、文档、存档与事件测试
- `npm run docs:check-encoding`
- `npm run build:web`
- `git diff --check`
