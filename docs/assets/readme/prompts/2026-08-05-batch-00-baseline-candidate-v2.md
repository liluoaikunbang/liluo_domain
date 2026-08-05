# Batch 00 基准候选生成记录 v2（2026-08-05）

- 生成方式：`Image 2`（内置 `image_gen`）
- 生成性质：`candidate`
- 不覆盖旧图：是
- 输出文件：`docs/assets/readme/generated/liluo-master-character-portrait-b00-candidate-2026-08-05-v2.png`
- 当前状态：待用户确认，不写入 `art-manifest.json`，不替换现有公开基准图

## 相对上一版的修正目标

- 背景从“带世界叙事的复杂门景”收紧到“基准图用的低干扰身份底板”
- 服装从“偏繁复的展示型设计”收紧到“简洁但有设计感的默认穿搭”
- 保留鹅蛋脸脸形，只调整五官比例，让阅读更接近“柔和的年轻成年女性”而不是幼态感

## 参考图

- `docs/assets/readme/generated/liluo-master-character-portrait-b00-candidate-2026-08-05.png`
- `src/assets/game/standee/LiLuo.png`
- `docs/assets/readme/liluo-character-portrait.png`

## 本轮 prompt

```text
Create a revised Batch 00 baseline candidate portrait for the original character Liluo from Liluo Universe. Use the attached images only as identity anchors for recognizability, hair direction, body silhouette, and face shape continuity. Keep the face shape beautiful and unchanged in spirit, but correct the facial feature proportions so she reads clearly as a young adult woman rather than childlike.

Hard identity anchors: Liluo is an 18-year-old adult woman, clearly adult, never childlike. She has crimson-leaning red-brown hair and clear red eyes. Character impression is around 150 cm tall: petite, not tall, not long-legged, not fashion-model proportion. Body has soft natural curves with slight gentle fullness, not thin, not exaggerated, not sexy-staged. Face shape is a soft rounded oval face with a smooth jawline, not sharp, not pointy.

Critical correction for this version: the problem is not face shape, it is feature proportion. Keep her gentle, weak-air, cute temperament, but make the eyes slightly less oversized, reduce baby-faced impression, keep a believable young-adult nose-mouth proportion, and avoid overly infantile spacing. She must read as soft and lovely but unmistakably adult.

Outfit correction: Liluo does not like fussy ornate clothing. Her baseline outfit should be simple but well-designed, clean-lined, lightweight, and public-facing. Not plain, but not complicated. Avoid layered ornate costume logic, heavy accessories, decorative overload, elaborate cape shapes, excessive ribbons, intricate embroidery, fantasy armor, or cluttered silhouette. Use a refined short jacket or fitted light outer layer, a simple skirt or dress base, visible sock detail, practical ankle boots, and one small understated bag. Palette: ivory, charcoal, muted wine red accents.

Background correction: this is a baseline reference image, not a world scene. The background must be minimal, low-interference, bright, airy, and neutral. Use only a very soft pale backdrop or faint abstract light gradient with perhaps the slightest subtle hint of six-realm identity, but no complex architecture, no busy gate, no detailed scenery, no narrative environment, no floating decorative clutter. The character must be the only clear focal point.

Composition: full-body character showcase, centered standing pose, clean silhouette, enough negative space around the figure, all hair/outfit/socks/shoes readable. Japanese anime indie game concept art, refined, luminous, clean, elegant, public-safe, no text, no logo, no watermark, no UI, no fake screenshot styling, no sexualization.
```

## 快速观察

- 背景已明显降到低干扰底板，不再抢人物身份校准信息
- 服装复杂度明显下降，改为简洁的轻日常方案
- 脸形保持稳定，五官比例比上一版更接近年轻成年感
- 仍待用户确认是否继续压低幼态感，或进一步缩短裙摆/减弱学院制服联想
