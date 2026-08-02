import fs from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'

function parseArgs(argv) {
  const args = { _: [] }
  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index]
    if (!token.startsWith('--')) {
      args._.push(token)
      continue
    }
    const key = token.slice(2)
    const next = argv[index + 1]
    if (!next || next.startsWith('--')) {
      args[key] = true
      continue
    }
    args[key] = next
    index += 1
  }
  return args
}

function printUsage() {
  console.log('Usage: node scripts/docs/read-utf8-slice.mjs <file> [--start 1] [--count 40] [--max-chars 240]')
}

function parsePositiveInt(value, fallback) {
  const parsed = Number(value)
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback
}

function truncateLine(line, maxChars) {
  if (line.length <= maxChars) return line
  return `${line.slice(0, Math.max(0, maxChars - 1))}…`
}

async function main() {
  const args = parseArgs(process.argv.slice(2))
  if (args.help || args._.length !== 1) {
    printUsage()
    process.exit(args.help ? 0 : 2)
  }

  const filePath = path.resolve(args._[0])
  const start = parsePositiveInt(args.start, 1)
  const count = parsePositiveInt(args.count, 40)
  const maxChars = parsePositiveInt(args['max-chars'], 240)
  const text = await fs.readFile(filePath, 'utf8')
  const lines = text.split(/\r?\n/u)
  const end = Math.min(lines.length, start + count - 1)

  for (let lineNumber = start; lineNumber <= end; lineNumber += 1) {
    console.log(`${lineNumber}:${truncateLine(lines[lineNumber - 1], maxChars)}`)
  }
}

await main()
