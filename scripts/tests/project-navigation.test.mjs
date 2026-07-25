import assert from 'node:assert/strict'
import test from 'node:test'
import { recommend } from '../project-navigation/project-navigation.mjs'

test('recommend only returns open gaps that satisfy domain and avoid filters', () => {
  const gaps = [{ id: 'story', title: '故事', domain: 'story', status: 'open', priority: 'high' }, { id: 'map', title: '地图', domain: 'map', status: 'blocked', priority: 'highest' }, { id: 'gameplay', title: '玩法', domain: 'gameplay', status: 'open', priority: 'medium' }]
  assert.deepEqual(recommend(gaps, { time: '20', avoid: 'gameplay' }).map((gap) => gap.id), ['story'])
  assert.deepEqual(recommend(gaps, { domain: 'map' }), [])
})
