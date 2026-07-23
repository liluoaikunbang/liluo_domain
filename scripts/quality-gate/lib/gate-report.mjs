import fs from 'node:fs'
import path from 'node:path'

function markdownList(values, empty = '无') {
  return values.length > 0 ? values.map((value) => `- ${value}`).join('\n') : `- ${empty}`
}

export function writeGateReport(root, report) {
  const directory = path.join(root, 'reports', 'quality-gate')
  fs.mkdirSync(directory, { recursive: true })
  fs.writeFileSync(path.join(directory, 'latest.json'), `${JSON.stringify(report, null, 2)}\n`, 'utf8')
  const markdown = `# 自动质量门禁报告

- 模式：${report.mode}
- Git 范围：${report.gitRange}
- 状态：${report.status}
- 耗时：${report.durationMs} ms

## 命中领域

${markdownList(report.domains)}

## 执行命令

${markdownList(report.executed.map((item) => `${item.ok ? 'PASS' : 'ERROR'} \`${item.command}\`（${item.durationMs} ms）`))}

## 跳过命令

${markdownList(report.skipped.map((item) => `\`${item.command}\`：${item.reason}`))}

## ERROR

${markdownList(report.errors.map((item) => `${item.command ?? 'quality-gate'}：${item.message}`))}

## WARNING

${markdownList(report.warnings)}
`
  fs.writeFileSync(path.join(directory, 'latest.md'), markdown, 'utf8')
}
