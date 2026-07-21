---
name: liluo-phaser-map-event-integration
description: Integrate maps, spawn points, collisions, NPCs, teleports and events into the existing Vue3/Phaser/Pinia architecture. Use for 新增或接入地图、地图 NPC、传送点、碰撞、寻路、镜头或故事落地；not for outline-only writing or unrelated UI pages.
---

# Phaser Map Event Integration

Read `docs/系统说明/地图系统.md`, registry, representative map folders, BootScene, MapLoadingScene, WorldScene, map/character systems, event runner, player runtime and save schema. Read [map-integration-checklist.md](references/map-integration-checklist.md).

Confirm real map ID/assets and name collisions. Extend `src/game/data/maps/<world>/<mapId>/` and existing `src/game/data/registry.ts`; do not create a parallel registry. Load map resources through MapLoadingScene, keep WorldScene organizational, and place reusable runtime logic in systems. Verify spawn, collision, pathfinding, camera, teleport, NPC/events and save re-entry. Avoid generated `map.json` edits unless necessary and disclosed. Run relevant Node tests and build.
