# Skill 来源目录

## 正式准入来源

| sourceId | 来源 | 分类 | LICENSE | commit | 保存模式 | 信任级别 | 已下载 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `agentskills-spec` | https://github.com/agentskills/agentskills | standards / agent-engineering | Apache-2.0，已核验 | `38a2ff82958afee88dadf4831509e6f7e9d8ef4e` | selected-files | authoritative-standard | 是 |
| `openai-skills` | https://github.com/openai/skills | standards / agent-engineering | 选中 skill-creator 为 Apache-2.0 | `49f948faa9258a0c61caceaf225e179651397431` | selected-files | official-primary | 是 |
| `haowjy-creative-writing-skills` | https://github.com/haowjy/creative-writing-skills | writing / fiction | Apache-2.0，已核验 | `f3a146baedbb407e9bddfcae83befae8d5cfe387` | selected-files | primary-writing-reference | 是 |
| `conorbronsdon-avoid-ai-writing` | https://github.com/conorbronsdon/avoid-ai-writing | writing / editing | MIT，已核验 | `660c95cfd5b67604ad5ed598a8bd1be92e0ee3d5` | selected-files | focused-writing-reference | 是 |
| `danjdewhurst-story-skills` | https://github.com/danjdewhurst/story-skills | writing / story | MIT，已核验 | `c482d48f4eb9b488f033a77a51f9fae55cc0d75f` | selected-files | primary-story-reference | 是 |

## 待准入候选

其余 20 个用户指定候选已通过 `git ls-remote` 核验 HEAD，但许可证和真实 Skill 路径尚未逐项完成审计，因此没有复制正文。完整 sourceId、链接、commit、分类、建议保存模式和信任级别位于 `external-knowledge/derived/skill/rejected-sources/initial-candidates.json`。

候选包括 Anthropic Skills、Vercel Skills CLI、Superpowers、四个聚合目录、Antfu/Vue/Vercel/Addy/Supabase 前端来源、四个游戏/素材来源、两个写作来源、研究写作与 Trail of Bits。`pending` 不等于拒绝，只表示尚未取得正式准入证据。
