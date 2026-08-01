import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..', '..');

const requiredFiles = [
  'README.md',
  'docs/readme/世界图册.md',
  'docs/readme/生产体系.md',
  'docs/readme/可玩证据.md',
  'docs/assets/readme/art-manifest.json',
  'docs/assets/readme/generated/project-stats.json',
  'docs/assets/readme/generated/project-scale-dashboard.svg',
  'docs/assets/readme/generated/story-production-pipeline.svg',
  'docs/assets/readme/generated/readme-evidence-boundary.svg',
  'docs/assets/readme/screenshots/screenshot-inventory.md',
];

const requiredHeadings = ['# 璃落宇宙', '## 六大叙事域图册', '## 三十秒证明它真的存在', '## 协作入口'];

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function readFile(relativePath) {
  return fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');
}

function collectReadmeImagePaths(readme) {
  const paths = [];
  const markdownPattern = /!\[[^\]]*\]\((?!https?:\/\/|data:)([^)\s]+(?:\s[^)]*)?)\)/g;
  const htmlPattern = /<img\b[^>]*\bsrc="([^"]+)"[^>]*>/gi;

  for (const match of readme.matchAll(markdownPattern)) {
    paths.push(match[1]);
  }
  for (const match of readme.matchAll(htmlPattern)) {
    paths.push(match[1]);
  }

  return paths.map((value) => value.trim());
}

function main() {
  for (const relativePath of requiredFiles) {
    assert(fs.existsSync(path.join(repoRoot, relativePath)), `Missing required file: ${relativePath}`);
  }

  const readme = readFile('README.md');
  for (const heading of requiredHeadings) {
    assert(readme.includes(heading), `README is missing heading: ${heading}`);
  }
  const markdownImageCount = (readme.match(/!\[[^\]]*\]\((?!https?:\/\/|data:)[^)]+\)/g) ?? []).length;
  const htmlImageCount = (readme.match(/<img\s/gi) ?? []).length;
  const readmeVisualUnitCount = markdownImageCount + htmlImageCount;
  assert(readmeVisualUnitCount >= 28 && readmeVisualUnitCount <= 36, `README visual unit count out of range: ${readmeVisualUnitCount}`);

  const missingReadmeImages = collectReadmeImagePaths(readme).filter((assetPath) => !fs.existsSync(path.join(repoRoot, assetPath)));
  assert(missingReadmeImages.length === 0, `README referenced missing image assets: ${missingReadmeImages.join(', ')}`);

  const manifest = JSON.parse(readFile('docs/assets/readme/art-manifest.json'));
  assert(manifest.schemaVersion === 3, 'art-manifest.json must be schemaVersion 3');
  assert(Array.isArray(manifest.assets) && manifest.assets.length > 0, 'art-manifest.json must contain assets');

  const missingAssets = manifest.assets
    .map((asset) => asset.path)
    .filter((assetPath) => !fs.existsSync(path.join(repoRoot, assetPath)));
  assert(missingAssets.length === 0, `Manifest referenced missing assets: ${missingAssets.join(', ')}`);

  const stats = JSON.parse(readFile('docs/assets/readme/generated/project-stats.json'));
  assert(stats.buildEvidence?.verified === true, 'project-stats.json must record a verified build');
  assert(stats.counts?.publicWorldCount === 6, 'project-stats.json must confirm six public worlds');
  assert(stats.runtimeEvidence?.existingScreenshots?.length >= 2, 'project-stats.json must record at least two verified screenshots');
  assert(
    stats.readmeVisualSummary?.inTargetRange === true,
    'project-stats.json must record README visual units within the target range',
  );

  const result = {
    ok: true,
    checkedAt: new Date().toISOString(),
    manifestAssetCount: manifest.assets.length,
    readmeWorldCount: stats.counts.publicWorldCount,
    readmeVisualUnitCount,
    readmeMarkdownImageCount: markdownImageCount,
    readmeHtmlImageCount: htmlImageCount,
    verifiedScreenshotCount: stats.counts.verifiedScreenshotCount,
  };

  console.log(JSON.stringify(result, null, 2));
}

main();
