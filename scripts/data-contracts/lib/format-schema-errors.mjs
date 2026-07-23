export function formatSchemaErrors(contractId, filePath, errors = []) {
  return errors.map((error) => ({
    contractId,
    file: filePath,
    pointer: error.instancePath || '/',
    keyword: error.keyword,
    reason: error.message ?? 'Schema validation failed',
    params: error.params
  }))
}

export function formatSchemaErrorLine(error) {
  return `${error.file} [${error.contractId}] ${error.pointer} ${error.keyword}: ${error.reason}`
}
