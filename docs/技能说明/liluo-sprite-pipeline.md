# liluo-sprite-pipeline

## 用途与边界

生成、整理、检查、预览和接入 5×4、20 帧四方向角色行走图。无关图片不触发。

## 路径与输入输出

- Skill：`.agents/skills/liluo-project/liluo-sprite-pipeline/`
- reference：`sprite-quality-gate.md`
- 复用脚本：`scripts/assets/build-liluo-character-frames.ps1`
- 输入：Image A 版式、Image B 外观、母图/图层和运行时目标
- 输出：人工质量门结果、缓存构建与接入验证

## 流程、限制与验证

先读提示词模板，外观只取 Image B；逐帧核对方向、转身、基线、留白、比例、色板和细节，再运行已有构建流程。不复制脚本、不用运行时代码补偿错位、不擅自改原图/调用外部生成/安装依赖。素材清单审计交 `liluo-asset-registry-audit`。
