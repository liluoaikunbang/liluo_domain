import assert from 'node:assert/strict';
import test from 'node:test';
import { readFile } from 'node:fs/promises';

const hospitalPath = new URL(
  '../../src/game/data/story_outline/1-modern/1.0.1-%E7%97%85%E6%88%BF%E8%8B%8F%E9%86%92.md',
  import.meta.url,
);
const dancePath = new URL(
  '../../src/game/data/story_outline/1-modern/1.3-%E8%88%9E%E8%B9%88%E6%95%99%E5%AE%A4.md',
  import.meta.url,
);
const campusPath = new URL(
  '../../src/game/data/story_outline/1-modern/1.1-%E9%87%8D%E8%BF%94%E6%A0%A1%E5%9B%AD.md',
  import.meta.url,
);
const sourcePath = new URL(
  '../../src/game/data/story_outline/sources/1-modern.json',
  import.meta.url,
);
const worldOptionsPath = new URL(
  '../../docs/%E7%B3%BB%E7%BB%9F%E8%AF%B4%E6%98%8E/%E6%95%85%E4%BA%8B%E5%A4%A7%E7%BA%B2%E4%B8%96%E7%95%8C%E9%80%89%E9%A1%B9/1-modern.md',
  import.meta.url,
);

test('都市线将顾棠的核心角色功能合并到沈芷', async () => {
  const [hospital, dance, campus, source, worldOptions] = await Promise.all([
    readFile(hospitalPath, 'utf8'),
    readFile(dancePath, 'utf8'),
    readFile(campusPath, 'utf8'),
    readFile(sourcePath, 'utf8'),
    readFile(worldOptionsPath, 'utf8'),
  ]);

  for (const [label, content] of [
    ['病房苏醒', hospital],
    ['舞蹈教室', dance],
    ['重返校园', campus],
    ['都市线来源数据', source],
    ['都市世界选项', worldOptions],
  ]) {
    assert.doesNotMatch(content, /顾棠/u, `${label}仍保留顾棠的核心角色引用`);
  }
});

test('病房苏醒记录沈芷已确认的荆锁会背景与隐瞒动机', async () => {
  const hospital = await readFile(hospitalPath, 'utf8');

  assert.match(hospital, /沈芷曾是荆锁会会长/u);
  assert.match(hospital, /怕.*阻碍璃落恢复记忆/u);
  assert.match(hospital, /气质.*像.*当年.*救助.*女生/u);
});
