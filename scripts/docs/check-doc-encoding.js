import fs from 'node:fs';
import path from 'node:path';

const docsRoot = path.resolve('docs');
const suspiciousFragments = [
  '\u9354\u71bb\u5158',
  '\u93c7\u5b58\u67ca',
  '\u9429\ue1bc\u7d8d',
  '\u9420\u51ae\u7176',
  '\u7035\u7845',
  '\u7eef\u8364\u7cba',
  '\u951b?',
  '\u9286?',
  '\u9239',
  '\u922b',
  '\u9236'
];

function collectMarkdownFiles(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  return entries.flatMap((entry) => {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      return collectMarkdownFiles(fullPath);
    }

    return entry.isFile() && entry.name.endsWith('.md') ? [fullPath] : [];
  });
}

function findEncodingIssues(filePath) {
  const text = fs.readFileSync(filePath, 'utf8');
  const issues = [];

  text.split(/\r?\n/).forEach((line, index) => {
    const hasReplacementChar = line.includes('\uFFFD');
    const hasPrivateUseChar = /[\uE000-\uF8FF]/u.test(line);
    const matchedFragment = suspiciousFragments.find((fragment) =>
      line.includes(fragment)
    );

    if (hasReplacementChar || hasPrivateUseChar || matchedFragment) {
      issues.push({
        line: index + 1,
        reason: hasReplacementChar
          ? 'contains Unicode replacement character'
          : hasPrivateUseChar
            ? 'contains private-use character'
            : `suspicious mojibake fragment: ${matchedFragment}`,
        preview: line.slice(0, 120)
      });
    }
  });

  return issues;
}

const results = collectMarkdownFiles(docsRoot)
  .map((filePath) => ({
    filePath,
    issues: findEncodingIssues(filePath)
  }))
  .filter((result) => result.issues.length > 0);

if (results.length === 0) {
  console.log('docs encoding check passed');
  process.exit(0);
}

for (const result of results) {
  console.error(path.relative(process.cwd(), result.filePath));
  for (const issue of result.issues.slice(0, 8)) {
    console.error(`  line ${issue.line}: ${issue.reason}`);
    console.error(`    ${issue.preview}`);
  }
  if (result.issues.length > 8) {
    console.error(`  ...and ${result.issues.length - 8} more issue(s)`);
  }
}

process.exit(1);
