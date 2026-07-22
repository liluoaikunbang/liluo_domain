---
name: liluo-offline-release-pipeline
description: Build, validate, package, browser-check, document, and optionally upload the 璃落 multi-file offline game release with its one-click Windows launcher. Use when the user asks 生成离线包、可双击版本、打包游戏、发布版本、上传 GitHub Release、部署离线游戏，or asks to finish a suitable version and distribute it; not for ordinary web preview, source-code push, or public server deployment.
---

# Offline Release Pipeline

Read `package.json` and `docs/系统说明/离线发行与GitHub-Release流程.md`. Reuse `scripts/release/offline-release.mjs`; do not create a parallel packager.

## Resolve the intent

- For build/package requests, create a local ZIP only. Never access GitHub.
- Only when the user 明确提出“发布” or “上传 Release”, execute the full upload path. Require an unambiguous target tag from the request or confirmed release context; do not guess from `0.0.0` or create a Git tag.
- If the user asks to release “the suitable/current version”, first verify that the scoped feature is implemented, relevant tests pass, and required docs are synchronized. Do not publish an untested or undocumented version.
- Treat source commit/push as a separate action. Do not commit or push unless the user also requests it.

## Execute automatically

1. Inspect `git status --short`, `package.json`, the offline release system doc, and task-relevant validation results. Preserve unrelated user changes.
2. When the release follows feature work, use `liluo-project-documentation-sync` to complete any required system explanation, feature record, catalog, update record, and user-command changes before packaging. Do not create a new feature number for an ordinary repeat release.
3. For local delivery, run `npm run package:offline`.
4. For release rehearsal, run `npm run release:offline -- --tag <tag> --dry-run`.
5. For an explicitly authorized upload, run `npm run release:offline -- --tag <tag>`. This may create the Release only when the remote tag already exists; it must not create or push tags.
6. 任一步骤失败都立即停止。Stop on any failed build, test, validation, archive, authentication, or upload step. Keep the local ZIP and report the exact failed stage; never upload a failed artifact.
7. Use `liluo-browser-game-regression` to verify the extracted `启动游戏.bat` flow when browser tooling supports the temporary `127.0.0.1` address. Keep the launcher window open during play and stop it afterward. Report browser scenarios not run.
8. After changing release code, contracts, Skill, or docs, run the focused tests, documentation/governance checks, `npm run project:index:changed`, and `npm run project:index:validate`.

## Required gates

- Root archive contains `启动游戏.bat`, `index.html`, `launcher/start-game.ps1`, and required relative assets.
- The launcher listens only on `127.0.0.1`, rejects paths outside the release root, requires no extra runtime installation, and stops when its window closes.
- Entry contains no absolute deployment path, missing reference, or required remote runtime resource.
- ZIP integrity check passes and the final filename/tag/size are reported.
- Upload requires `gh auth status` success and an explicit tag.
- Do not claim launcher gameplay verified unless a real browser opened its `http://127.0.0.1:<port>/` page and core navigation/resources were checked.

## Handoff

Report the local ZIP path, size, tag, whether GitHub was accessed, Release result, tests/builds run, browser coverage, documentation/index synchronization, and any unresolved blocker.
