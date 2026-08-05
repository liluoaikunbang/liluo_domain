# Batch 00 基准候选生成记录（2026-08-05）

- 生成方式：`Image 2`（内置 `image_gen`）
- 生成性质：`candidate`
- 不覆盖旧图：是
- 输出文件：`docs/assets/readme/generated/liluo-master-character-portrait-b00-candidate-2026-08-05.png`
- 当前状态：待用户确认，不写入 `art-manifest.json`，不替换现有公开基准图

## 参考图

- `src/assets/game/standee/LiLuo.png`
- `docs/assets/readme/liluo-character-portrait.png`
- `docs/assets/readme/generated/liluo-master-character-portrait-v2.png`

## 本轮 prompt

```text
Create one new public-safe Batch 00 baseline candidate portrait for the original character Liluo from Liluo Universe. Use the attached images only as identity anchors for recognizability, hairstyle direction, eye shape, and overall character continuity. If any attached reference still suggests an older, taller, or slimmer version, ignore that and follow the updated Batch 00 authority instead.

Liluo must be clearly an 18-year-old adult woman, never childlike, never mature in a 20s-heavy way. She is approximately 150 cm tall in character impression: petite overall scale, not tall, not long-legged, not fashion-model proportion. Her body should have soft natural curves with a slight gentle fullness, not paper-thin, not overly sexy, not exaggerated. Her face must be a soft rounded oval face, with smooth jawline and no sharp chin, no pointed face, no guazi-lian look. Expression and temperament: gentle, slightly timid, young and cute but unmistakably adult, soft caution, quiet resilience.

Hair and eyes: everyday-lighting crimson-leaning red-brown hair, clear red eyes. Keep her stable identity. Outfit: a light everyday travel outfit suitable for the public entrance of Liluo Universe, mainly ivory white, deep charcoal, and muted wine-red accents, with subtle sock detail visible and practical ankle boots, plus a small travel satchel. Prioritize full-body showcase so hair, outfit, socks, shoes, and silhouette are all readable. Natural slightly reserved standing pose, one hand lightly near chest.

Background: bright, airy, unobtrusive six-realm gateway motif with faint red-thread star paths and pale atmospheric light, elegant but low-interference so the character silhouette stays clean. Japanese anime indie game concept art, refined, luminous, clean, public-facing, no text, no watermark, no logo, no UI, no fake screenshot styling, no sexualization. Do not crop to half body. Do not make her look tall, sharp-faced, or overly mature.
```

## 说明

- 这张图的目的不是直接成为正式公开基准，而是验证新的 `Batch 00` authority 是否已经能稳定压过 2026-07-31 的旧人物口径。
- 如果后续用户确认方向正确，再决定是否：
  - 替换 `liluo-master-character-portrait-v2.png`
  - 回写新的正式 prompt 记录
  - 清理旧 prompt 文档中的 `22 years old / petite and slender` 遗留口径
