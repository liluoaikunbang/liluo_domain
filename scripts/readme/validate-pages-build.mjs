import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = fileURLToPath(new URL('../..', import.meta.url))
const distPages = join(ROOT, 'dist-pages')
const rootIndex = join(distPages, 'index.html')
const sourceNamedIndex = join(distPages, 'index.pages.html')

const errors = []

if (!existsSync(rootIndex)) {
  errors.push('dist-pages/index.html is missing; GitHub Pages will return 404 at the site root.')
}

if (existsSync(sourceNamedIndex)) {
  errors.push('dist-pages/index.pages.html should be renamed to index.html before upload.')
}

if (errors.length > 0) {
  process.stderr.write(`${errors.join('\n')}\n`)
  process.exit(1)
}

process.stdout.write('Pages build entry check passed.\n')
