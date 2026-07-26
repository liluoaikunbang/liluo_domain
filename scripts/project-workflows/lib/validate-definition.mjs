import { readFile } from 'node:fs/promises'
import Ajv2020 from 'ajv/dist/2020.js'
import addFormats from 'ajv-formats'
import { DEFINITION_SCHEMA, RUN_SCHEMA } from './paths.mjs'
import { loadResourceCatalog, resolveResourceRef } from './resource-catalog.mjs'

let definitionValidator
let runValidator

async function getValidators() {
  if (!definitionValidator) {
    const ajv = new Ajv2020({ allErrors: true, strict: false })
    addFormats(ajv)
    definitionValidator = ajv.compile(JSON.parse(await readFile(DEFINITION_SCHEMA, 'utf8')))
    runValidator = ajv.compile(JSON.parse(await readFile(RUN_SCHEMA, 'utf8')))
  }
  return { definitionValidator, runValidator }
}

export function structuralIssues(definition) {
  const issues = []
  const nodeIds = new Set()
  for (const node of definition.nodes ?? []) {
    if (nodeIds.has(node.id)) issues.push(`重复节点 ID：${node.id}`)
    nodeIds.add(node.id)
  }
  if (!nodeIds.has(definition.entryNodeId)) {
    issues.push(`入口节点不存在：${definition.entryNodeId}`)
  }
  for (const requiredId of definition.completionGate?.requiredNodeIds ?? []) {
    if (!nodeIds.has(requiredId)) issues.push(`完成门禁引用不存在节点：${requiredId}`)
  }
  const edgeIds = new Set()
  let hasSuccessPathFromEntry = false
  for (const edge of definition.edges ?? []) {
    if (edgeIds.has(edge.id)) issues.push(`重复边 ID：${edge.id}`)
    edgeIds.add(edge.id)
    if (!nodeIds.has(edge.from)) issues.push(`边 ${edge.id} 的 from 不存在：${edge.from}`)
    if (!nodeIds.has(edge.to)) issues.push(`边 ${edge.id} 的 to 不存在：${edge.to}`)
    if (edge.when === 'condition' && !edge.condition?.expression) {
      issues.push(`条件边 ${edge.id} 缺少可判断 condition.expression`)
    }
    if (edge.from === definition.entryNodeId && edge.when === 'success') hasSuccessPathFromEntry = true
  }
  if ((definition.edges ?? []).length > 0 && !hasSuccessPathFromEntry) {
    issues.push('入口节点缺少 success 后继边')
  }

  for (const node of definition.nodes ?? []) {
    for (const resource of node.resources ?? []) {
      if (resource.requirement === 'required' && !resource.onFailure) {
        issues.push(`节点 ${node.id} 的必需资源 ${resource.ref} 缺少失败策略`)
      }
      if (resource.requirement === 'conditional' && !resource.condition) {
        issues.push(`节点 ${node.id} 的条件资源 ${resource.ref} 缺少 condition`)
      }
      if (resource.fatal && resource.waiverAllowed) {
        issues.push(`节点 ${node.id} 的 fatal 资源 ${resource.ref} 不得允许豁免`)
      }
      if (resource.onFailure === 'repair' && resource.repairNodeId && !nodeIds.has(resource.repairNodeId)) {
        issues.push(`资源 ${resource.ref} 的 repairNodeId 不存在：${resource.repairNodeId}`)
      }
      if (resource.onFailure === 'fallback' && !resource.fallbackRef) {
        issues.push(`资源 ${resource.ref} 选择 fallback 但缺少 fallbackRef`)
      }
    }
    if (node.failure?.strategy === 'repair' && node.failure.repairNodeId && !nodeIds.has(node.failure.repairNodeId)) {
      issues.push(`节点 ${node.id} 的 repairNodeId 不存在：${node.failure.repairNodeId}`)
    }
  }

  const reachable = new Set()
  const queue = [definition.entryNodeId]
  while (queue.length) {
    const current = queue.shift()
    if (!current || reachable.has(current)) continue
    reachable.add(current)
    for (const edge of definition.edges ?? []) {
      if (edge.from === current) queue.push(edge.to)
    }
  }
  for (const id of nodeIds) {
    if (!reachable.has(id)) issues.push(`节点不可达：${id}`)
  }

  return issues
}

export async function validateDefinition(definition, options = {}) {
  const { definitionValidator: validate } = await getValidators()
  const schemaOk = validate(definition)
  const issues = []
  if (!schemaOk) {
    for (const error of validate.errors ?? []) {
      issues.push(`Schema: ${error.instancePath || '/'} ${error.message}`)
    }
  }
  issues.push(...structuralIssues(definition))

  if (options.checkResources !== false) {
    const catalog = options.catalog ?? await loadResourceCatalog(options.root)
    for (const node of definition.nodes ?? []) {
      for (const resource of node.resources ?? []) {
        if (resource.requirement === 'forbidden') continue
        const resolved = await resolveResourceRef(catalog, resource.kind, resource.ref)
        if (!resolved) {
          issues.push(`节点 ${node.id} 引用不存在的资源：${resource.kind}:${resource.ref}`)
        }
      }
    }
  }

  return {
    ok: issues.length === 0,
    issues,
  }
}

export async function validateRunRecord(run) {
  const { runValidator: validate } = await getValidators()
  const schemaOk = validate(run)
  const issues = []
  if (!schemaOk) {
    for (const error of validate.errors ?? []) {
      issues.push(`Schema: ${error.instancePath || '/'} ${error.message}`)
    }
  }
  return { ok: issues.length === 0, issues }
}
