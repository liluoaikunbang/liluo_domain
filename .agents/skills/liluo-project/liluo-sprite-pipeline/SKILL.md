---
name: liluo-sprite-pipeline
description: Generate, organize, inspect, preview, and integrate 璃落 5×4 twenty-frame character walk sprites using the existing build pipeline. Use for 角色行走图、20 帧、四方向、脚底基线、帧缓存或运行时接入；not for unrelated images or runtime compensation of a misaligned source sheet.
---

# Sprite Pipeline

Read `docs/系统说明/像素行走图生成提示词模板.md`, [sprite-quality-gate.md](references/sprite-quality-gate.md), current character docs and `scripts/assets/build-liluo-character-frames.ps1`. Do not duplicate the existing builder.

Require Image A layout reference and Image B appearance reference for generation; appearance comes only from Image B. Require 5×4, 20 frames, four true directions, idle plus four walk frames, and `#00FF00` background. Inspect direction order, turning, baseline, relative whitespace, proportion, palette and all appearance details before integration. Distinguish master, source layers, cache and runtime final. Do not modify originals, call external image generation, install dependencies or compensate source errors in runtime code unless the user explicitly authorizes the relevant action.
