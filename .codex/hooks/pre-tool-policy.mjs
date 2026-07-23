#!/usr/bin/env node
import { evaluateToolRequest } from './lib/project-path-policy.mjs'
import { readHookInput } from './lib/read-hook-input.mjs'
import { writeHookOutput } from './lib/write-hook-output.mjs'

const input = await readHookInput()
if (!input.ok) {
  writeHookOutput({
    hookSpecificOutput: {
      hookEventName: 'PreToolUse',
      permissionDecision: 'deny',
      permissionDecisionReason: `策略 Hook 无法检查输入：${input.error}`,
    },
  })
} else {
  const result = evaluateToolRequest(input.value)
  writeHookOutput({
    hookSpecificOutput: {
      hookEventName: 'PreToolUse',
      permissionDecision: result.allowed ? 'allow' : 'deny',
      ...(result.allowed ? {} : { permissionDecisionReason: result.reason }),
    },
  })
}
