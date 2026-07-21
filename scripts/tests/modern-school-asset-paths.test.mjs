import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';

const projectRoot = path.resolve(import.meta.dirname, '../..');
const assetSourcePath = path.join(
  projectRoot,
  'src/game/data/maps/modern/city_Jingjiang_school/assets.ts'
);
const studentAssetPath = path.join(
  projectRoot,
  'src/assets/game/sucai/Modern/school/NPCs/student_1.png'
);

test('modern school student tileset uses the existing underscored asset filename', () => {
  const assetSource = fs.readFileSync(assetSourcePath, 'utf8');

  assert.equal(fs.existsSync(studentAssetPath), true);
  assert.match(assetSource, /NPCs\/student_1\.png/);
  assert.doesNotMatch(assetSource, /NPCs\/student1\.png/);
});
