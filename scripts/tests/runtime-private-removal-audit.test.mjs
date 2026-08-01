import assert from 'node:assert/strict'
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import test from 'node:test'
import { buildRuntimePrivateRemovalAudit } from '../assets/runtime-private-removal-audit.mjs'

test('runtime private removal audit distinguishes runtime blockers from metadata cleanup candidates', async () => {
  const dir = await mkdtemp(path.join(os.tmpdir(), 'runtime-private-removal-audit-'))

  await mkdir(path.join(dir, '.agents'), { recursive: true })
  await writeFile(path.join(dir, 'package.json'), '{"name":"fixture","type":"module"}', 'utf8')

  await mkdir(path.join(dir, 'src/assets/game/cg'), { recursive: true })
  await mkdir(path.join(dir, 'src/assets/game/mode'), { recursive: true })
  await mkdir(path.join(dir, 'src/game/data/global'), { recursive: true })
  await mkdir(path.join(dir, 'docs/assets/registry'), { recursive: true })
  await mkdir(path.join(dir, 'docs/功能更新'), { recursive: true })
  await mkdir(path.join(dir, 'docs'), { recursive: true })
  await mkdir(path.join(dir, 'scripts/tests'), { recursive: true })

  await writeFile(path.join(dir, 'src/assets/game/cg/example.png'), 'cg', 'utf8')
  await writeFile(path.join(dir, 'src/assets/game/mode/example.jpg'), 'mode', 'utf8')
  await writeFile(path.join(dir, 'src/game/data/global/gameMenuData.js'), "const mods = import.meta.glob('../../../assets/game/cg/*.{png,jpg}')\n", 'utf8')
  await writeFile(path.join(dir, 'docs/mode-note.md'), 'see src/assets/game/mode/example.jpg\n', 'utf8')
  await writeFile(path.join(dir, 'docs/assets/registry/runtime-asset-footprint.json'), '{"path":"src/assets/game/mode/example.jpg"}\n', 'utf8')
  await writeFile(path.join(dir, 'docs/功能更新/001-示例.md'), 'legacy src/assets/game/mode/example.jpg\n', 'utf8')
  await writeFile(path.join(dir, 'scripts/tests/example.test.mjs'), "const path = 'src/assets/game/mode/example.jpg'\n", 'utf8')

  await writeFile(path.join(dir, '.env.runtime-assets.local'), [
    'LILUO_RUNTIME_ASSET_PROVIDER=nutstore',
    `LILUO_RUNTIME_ASSET_SYNC_ROOT=${path.join(dir, 'private-sync')}`,
  ].join('\n'), 'utf8')

  await writeFile(path.join(dir, 'docs/assets/registry/runtime-private-asset-manifest.json'), JSON.stringify({
    schemaVersion: 1,
    mode: 'offline-first-private-sync',
    groups: [
      {
        id: 'runtime-cg-finals',
        title: 'CG Finals',
        repoRoots: ['src/assets/game/cg'],
        syncSubdir: 'game/visual/cg/finals',
        visibility: 'private-offline-only',
        publicR2Allowed: false,
      },
      {
        id: 'candidate-reference-boards',
        title: 'Mode Boards',
        repoRoots: ['src/assets/game/mode'],
        syncSubdir: 'game/reference/mode-boards',
        visibility: 'private-reference-only',
        publicR2Allowed: false,
      },
    ],
  }, null, 2), 'utf8')

  const report = buildRuntimePrivateRemovalAudit({ root: dir })
  const cgGroup = report.groups.find((group) => group.id === 'runtime-cg-finals')
  const modeGroup = report.groups.find((group) => group.id === 'candidate-reference-boards')

  assert.equal(cgGroup?.removalStatus, 'blocked-by-runtime-references')
  assert.ok((cgGroup?.runtimeCodeRefs.count ?? 0) >= 1)
  assert.equal(modeGroup?.removalStatus, 'ready-after-reference-cleanup')
  assert.equal(modeGroup?.docsRefs.count, 1)
  assert.equal(modeGroup?.scriptRefs.count, 0)

  await rm(dir, { recursive: true, force: true })
})
