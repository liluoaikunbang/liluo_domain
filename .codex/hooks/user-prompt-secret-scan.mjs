#!/usr/bin/env node
import { evaluatePromptSecrets } from './lib/project-path-policy.mjs'
import { readHookInput } from './lib/read-hook-input.mjs'
import { writeHookOutput } from './lib/write-hook-output.mjs'

const input = await readHookInput()
if (!input.ok) {
  writeHookOutput({ decision: 'block', reason: `密钥扫描 Hook 无法检查输入：${input.error}` })
} else {
  const prompt = input.value.prompt ?? input.value.user_prompt ?? ''
  const result = evaluatePromptSecrets(prompt)
  writeHookOutput(result.allowed ? {} : { decision: 'block', reason: result.reason })
}
