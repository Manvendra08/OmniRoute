if (typeof process !== "undefined" && process.stdout) {
  console.log = (...args: unknown[]) => process.stderr.write(args.map(a => typeof a === 'string' ? a : JSON.stringify(a)).join(' ') + '\n');
  console.info = (...args: unknown[]) => process.stderr.write(args.map(a => typeof a === 'string' ? a : JSON.stringify(a)).join(' ') + '\n');
  console.warn = (...args: unknown[]) => process.stderr.write(args.map(a => typeof a === 'string' ? a : JSON.stringify(a)).join(' ') + '\n');
  console.debug = (...args: unknown[]) => process.stderr.write(args.map(a => typeof a === 'string' ? a : JSON.stringify(a)).join(' ') + '\n');

  const origStdoutWrite = process.stdout.write.bind(process.stdout);
  process.stdout.write = function (chunk: any, encoding?: any, callback?: any) {
    const str = typeof chunk === "string" ? chunk : chunk?.toString?.("utf-8") || "";
    const trimmed = str.trim();
    if (trimmed.startsWith('{"jsonrpc"') || trimmed.startsWith('{"id"') || trimmed.startsWith('{"method"') || (trimmed.startsWith('{') && trimmed.endsWith('}'))) {
      return origStdoutWrite(chunk, encoding, callback);
    }
    return process.stderr.write(chunk, encoding, callback);
  } as typeof process.stdout.write;
}
