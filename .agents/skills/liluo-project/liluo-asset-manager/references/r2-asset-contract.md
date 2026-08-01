# R2 Asset Contract

## Scope

This workflow manages public-facing visual assets such as:

- README hero images
- website gallery or roadmap boards
- published game screenshots

It does not manage:

- runtime sprite sheets or map tiles
- canon story text
- private scratch images that should stay outside the repo and manifest

## Required local files

- `.env.assets.example`
- `.env.assets.local`
- `docs/assets/registry/website-r2-manifest.json`
- `scripts/assets/visual-asset-manager.mjs`

## Required env keys

- `LILUO_ASSET_R2_ACCOUNT_ID`
- `LILUO_ASSET_R2_ACCESS_KEY_ID`
- `LILUO_ASSET_R2_SECRET_ACCESS_KEY`
- `LILUO_ASSET_R2_BUCKET`
- `LILUO_ASSET_R2_REGION`
- `LILUO_ASSET_R2_ENDPOINT` (optional if derived from account id)
- `LILUO_ASSET_R2_PUBLIC_BASE_URL`

## Manifest rules

1. Every asset entry needs `id`, `title`, `sourcePath`, `remoteDir`, `slug`, `type`, `source`, and `status`.
2. `remoteDir` reflects usage, not the accidental original filename.
3. Published URLs are written back only after a successful live upload.
4. Default variants are `large`, `medium`, and `thumb`, all in WebP.
5. `managedRoots` defines which bucket prefixes belong to this manifest for stale-object reconciliation. If omitted, the defaults are `website`, `game`, `generated`, and `thumbnails`.

## Command contract

### Check configuration

```powershell
npm run assets:r2:status
```

### Stage WebP variants

```powershell
npm run assets:r2:prepare -- --asset readme-hero-v03
```

### Preview final object keys

```powershell
npm run assets:r2:upload -- --asset readme-hero-v03
```

### Publish to R2

```powershell
npm run assets:r2:upload -- --asset readme-hero-v03 --live
```

### Preview or delete stale R2 objects

```powershell
npm run assets:r2:prune
npm run assets:r2:prune -- --live
```
