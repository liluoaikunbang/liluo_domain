---
name: liluo-asset-manager
description: Prepare, stage, and publish Liluo visual assets to Cloudflare R2 using a manifest-driven workflow with safe dry-run/live separation, WebP conversion, thumbnail generation, public URL write-back, and README/website asset routing. Use when the user wants to upload README images, game screenshots, gallery art, roadmap boards, or other public-facing visual assets, or when checking the local R2 asset configuration for this project. Not for canon story writing, map runtime assets, or unrelated third-party storage APIs.
---

# Liluo Asset Manager

Read `AGENTS.md` and [r2-asset-contract.md](references/r2-asset-contract.md).

## Hard gates

1. Treat the repository as the source of truth for manifest metadata, not as the long-term binary host.
2. Do not ask the user to paste R2 secrets into chat. Point them to `.env.assets.local`.
3. Use `status` or dry-run `upload` before any live publish when configuration is new or recently changed.
4. Only use live upload when the user actually wants assets pushed to the bucket.
5. Keep assets organized by usage path such as `website/hero/...` or `game/screenshots/...`, not by ad-hoc Chinese filenames.
6. Default staged WebP files belong in the system temp directory so routine conversions do not silently become tracked repo assets.
7. If the current sandbox blocks the Python conversion subprocess or outbound upload, use the permissioned path instead of repeatedly retrying the same blocked command.

## Workflow

1. Confirm the asset batch belongs in the public R2 pipeline rather than runtime game assets.
2. Check configuration with:

```powershell
npm run assets:r2:status
```

3. Prepare variants with:

```powershell
npm run assets:r2:prepare -- --asset <asset-id>
```

4. Preview the final object keys and URLs with dry-run upload:

```powershell
npm run assets:r2:upload -- --asset <asset-id>
```

5. Publish only when the user wants the real upload:

```powershell
npm run assets:r2:upload -- --asset <asset-id> --live
```

6. Reconcile bucket drift before or after batch renames/removals:

```powershell
npm run assets:r2:prune
npm run assets:r2:prune -- --live
```

## Deliverables

After a successful live upload, report:

1. Which manifest entries were published.
2. The public URL for each generated variant.
3. Any configuration gaps that still block README or site migration.
4. Whether stale R2 objects remain and need explicit cleanup.

## Boundaries

- Use `liluo-grok-image-generation` for draft image generation, then adopt assets here only as a separate step.
- Use `liluo-project-documentation-sync` before claiming a persistent workflow or user-facing capability change complete.
- Do not move README references to external URLs until the user has a working public base URL and the target assets are actually published.
