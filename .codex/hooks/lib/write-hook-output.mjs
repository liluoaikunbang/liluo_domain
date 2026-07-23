export function writeHookOutput(output, stream = process.stdout) {
  stream.write(`${JSON.stringify(output ?? {})}\n`)
}
