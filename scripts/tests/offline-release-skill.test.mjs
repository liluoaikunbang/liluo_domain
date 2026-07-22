import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const root = new URL('../../', import.meta.url);

async function read(relativePath) {
  return readFile(new URL(relativePath, root), 'utf8');
}

test('offline release Skill defines the complete automatic workflow and upload boundary', async () => {
  const skill = await read('.agents/skills/liluo-project/liluo-offline-release-pipeline/SKILL.md');

  assert.match(skill, /^name: liluo-offline-release-pipeline$/m);
  assert.match(skill, /npm run package:offline/);
  assert.match(skill, /npm run release:offline -- --tag <tag>/);
  assert.match(skill, /明确.*发布|明确.*上传/);
  assert.match(skill, /失败.*停止|停止.*失败/);
  assert.match(skill, /liluo-browser-game-regression/);
  assert.match(skill, /liluo-project-documentation-sync/);
  assert.match(skill, /project:index:changed/);
  assert.match(skill, /启动游戏\.bat/);
  assert.match(skill, /127\.0\.0\.1/);
  assert.doesNotMatch(skill, /verify the extracted `file:\/\//);
});

test('project routing and user documentation expose the offline release Skill', async () => {
  const agents = await read('AGENTS.md');
  const userCommands = await read('docs/用户命令目录.md');
  const skillDocs = await read('docs/技能说明/liluo-offline-release-pipeline.md');

  assert.match(agents, /liluo-offline-release-pipeline/);
  assert.match(userCommands, /liluo-offline-release-pipeline/);
  assert.match(skillDocs, /npm run package:offline/);
  assert.match(skillDocs, /npm run release:offline/);
  assert.match(userCommands, /启动游戏\.bat/);
});

test('offline release Skill metadata keeps its UTF-8 label and invocation prompt', async () => {
  const metadata = await read('.agents/skills/liluo-project/liluo-offline-release-pipeline/agents/openai.yaml');

  assert.match(metadata, /display_name: "璃落离线发行流水线"/);
  assert.match(metadata, /\$liluo-offline-release-pipeline/);
  assert.doesNotMatch(metadata, /�/);
});
