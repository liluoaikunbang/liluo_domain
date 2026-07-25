import fs from 'node:fs'
import path from 'node:path'
import { createHash } from 'node:crypto'

const root = path.resolve(import.meta.dirname, '../..')
const sourceDir = path.join(root, 'src/game/data/story_outline/sources')
const markdownRoot = path.join(root, 'src/game/data/story_outline')
const snapshotFile = path.join(root, 'src/game/data/story_outline/mainline-restructure-preservation.json')
const apply = process.argv.includes('--apply')
const hash = (value) => createHash('sha256').update(typeof value === 'string' ? value : JSON.stringify(value)).digest('hex')
const stable = (value) => JSON.stringify(value, Object.keys(value).sort())

const worlds = [
  {
    source: '2-apocalypse.json', directory: '2-apocalypse', root: 'world-2-silent-earth-dirge',
    containers: [
      ['world-2-silent-earth-dirge-history', '寂土正史末日时间线', '寂土挽歌的连续正史主线；阶段之间只表达宏观时间推进。', 'world-2-silent-earth-dirge', 10, '正史主线'],
      ['world-2-silent-earth-dirge-phase-outbreak', '灾变爆发与永久状态开端', '灾变起点、早期危机与璃落长期生存状态的分界。', 'world-2-silent-earth-dirge-history', 10, '正史阶段'],
      ['world-2-silent-earth-dirge-phase-city-collapse', '城市沦陷与灾变扩张', '城市、感染、基础设施与生态层面的灾变扩张。', 'world-2-silent-earth-dirge-history', 20, '正史阶段'],
      ['world-2-silent-earth-dirge-phase-wilderness', '荒野扩张与人类迁徙', '荒野、交通网、迁徙路线与边境聚居地。', 'world-2-silent-earth-dirge-history', 30, '正史阶段'],
      ['world-2-silent-earth-dirge-phase-refuge', '残存文明与封闭避难体系', '自动化文明与封闭避难设施并存的阶段。', 'world-2-silent-earth-dirge-history', 40, '正史阶段'],
      ['world-2-silent-earth-dirge-phase-new-order', '废土新秩序', '围绕新世界定义权的现实与宗教秩序冲突。', 'world-2-silent-earth-dirge-history', 50, '正史阶段'],
      ['world-2-silent-earth-dirge-phase-rift', '裂界终局', '正史末日的最终危机容器。', 'world-2-silent-earth-dirge-history', 60, '正史阶段'],
      ['world-2-silent-earth-dirge-phase-epilogue', '灾后重建与独行旅途', '终局后的长期后日谈与可持续扩展入口。', 'world-2-silent-earth-dirge-history', 70, '正史阶段'],
      ['world-2-silent-earth-dirge-anomaly-domains', '异常灾域支线', '可与正史发生联系、但开放时点与正史关系仍待确认的规则灾域。', 'world-2-silent-earth-dirge', 20, '支线容器'],
      ['world-2-silent-earth-dirge-apocalypse-loops', '末日轮回', '互斥末日条件的独立体验入口；入口、结算和正史关系尚未定稿。', 'world-2-silent-earth-dirge', 30, '支线容器']
    ],
    mapping: {
      'world-2-silent-earth-dirge-zombie-apocalypse': ['world-2-silent-earth-dirge-phase-outbreak', '主线锚点'],
      'world-2-silent-earth-dirge-red-line': ['world-2-silent-earth-dirge-phase-outbreak', '早期区域线'],
      'world-2-silent-earth-dirge-omega': ['world-2-silent-earth-dirge-phase-outbreak', '状态分界'],
      'world-2-silent-earth-dirge-disaster-anomaly': ['world-2-silent-earth-dirge-phase-city-collapse', '阶段区域线'],
      'world-2-silent-earth-dirge-plague-ruined-city': ['world-2-silent-earth-dirge-phase-city-collapse', '阶段区域线'],
      'world-2-silent-earth-dirge-ecology-devouring-city': ['world-2-silent-earth-dirge-phase-city-collapse', '阶段区域线'],
      'world-2-silent-earth-dirge-beast-treading-land': ['world-2-silent-earth-dirge-phase-wilderness', '阶段区域线'],
      'world-2-silent-earth-dirge-insect-hive-border': ['world-2-silent-earth-dirge-phase-wilderness', '阶段区域线'],
      'world-2-silent-earth-dirge-mechanical-afterglow': ['world-2-silent-earth-dirge-phase-refuge', '阶段区域线'],
      'world-2-silent-earth-dirge-ark-ghost-cage': ['world-2-silent-earth-dirge-phase-refuge', '阶段区域线'],
      'world-2-silent-earth-dirge-wasteland-court': ['world-2-silent-earth-dirge-phase-new-order', '阶段区域线'],
      'world-2-silent-earth-dirge-apocalypse-holy-judgment': ['world-2-silent-earth-dirge-phase-new-order', '阶段区域线'],
      'world-2-silent-earth-dirge-rift-disaster': ['world-2-silent-earth-dirge-phase-rift', '主线锚点'],
      'world-2-silent-earth-dirge-solo-smart-rv-trader': ['world-2-silent-earth-dirge-phase-epilogue', '长期后日谈'],
      'world-2-silent-earth-dirge-eerie-apocalypse': ['world-2-silent-earth-dirge-anomaly-domains', '异常灾域支线'],
      'world-2-silent-earth-dirge-fog-city': ['world-2-silent-earth-dirge-anomaly-domains', '异常灾域支线'],
      'world-2-silent-earth-dirge-deep-sea-drifting-land': ['world-2-silent-earth-dirge-apocalypse-loops', '末日轮回'],
      'world-2-silent-earth-dirge-eternal-winter-white-realm': ['world-2-silent-earth-dirge-apocalypse-loops', '末日轮回'],
      'world-2-silent-earth-dirge-lone-sand-sea': ['world-2-silent-earth-dirge-apocalypse-loops', '末日轮回'],
      'world-2-silent-earth-dirge-dream-city-slumber': ['world-2-silent-earth-dirge-apocalypse-loops', '末日轮回'],
      'world-2-silent-earth-dirge-looping-final-day': ['world-2-silent-earth-dirge-apocalypse-loops', '末日轮回'],
      'world-2-silent-earth-dirge-forgotten-river-gray-world': ['world-2-silent-earth-dirge-apocalypse-loops', '末日轮回']
    }
  },
  {
    source: '4-fantasy.json', directory: '4-fantasy', root: 'world-6-cursebound-echoes',
    containers: [
      ['world-6-cursebound-echoes-curse-mainline', '咒缚进展主线', '以璃落从高天赋登顶到夺回咒缚主权的变化为绝对主线。', 'world-6-cursebound-echoes', 10, '咒缚主线'],
      ['world-6-cursebound-echoes-phase-ascension', '天赋显现与快速登顶', '在中咒前让玩家看见璃落的力量与行动自由。', 'world-6-cursebound-echoes-curse-mainline', 10, '咒缚阶段'],
      ['world-6-cursebound-echoes-phase-trigger', '古代诅咒降临', '高阶秘塔冒险触发古代封印；具体机关和施咒者仍待确认。', 'world-6-cursebound-echoes-curse-mainline', 20, '咒缚阶段'],
      ['world-6-cursebound-echoes-phase-diagnosis', '初次发作与正规解咒失败', '教会、圣骑士与神迹只能帮助理解部分规则。', 'world-6-cursebound-echoes-curse-mainline', 30, '咒缚阶段'],
      ['world-6-cursebound-echoes-phase-journey', '带咒远行', '地区卷构成可选的大型区域冒险池，不强制固定顺序。', 'world-6-cursebound-echoes-curse-mainline', 40, '咒缚阶段'],
      ['world-6-cursebound-echoes-phase-false-cure', '错误治疗与咒缚反转', '中期转折的候选容器；承担节点必须先由用户确认。', 'world-6-cursebound-echoes-curse-mainline', 50, '咒缚阶段'],
      ['world-6-cursebound-echoes-phase-astral', '星界真相', '咒缚、位面与契约法则的后期真相锚点。', 'world-6-cursebound-echoes-curse-mainline', 60, '咒缚阶段'],
      ['world-6-cursebound-echoes-phase-sovereignty', '深渊契约与咒缚主权', '高潮阶段：保留印记但夺回契约主权是正史候选方向。', 'world-6-cursebound-echoes-curse-mainline', 70, '咒缚阶段']
    ],
    mapping: {
      'world-6-cursebound-echoes-dreambound-continent': ['world-6-cursebound-echoes-phase-ascension', '主线锚点'],
      'world-6-cursebound-echoes-silver-crown-capital': ['world-6-cursebound-echoes-phase-ascension', '主线锚点'],
      'world-6-cursebound-echoes-secret-rune-academy': ['world-6-cursebound-echoes-phase-ascension', '主线锚点'],
      'world-6-cursebound-echoes-silent-rite-court': ['world-6-cursebound-echoes-phase-ascension', '王都区域支线'],
      'world-6-cursebound-echoes-secret-tower-long-song': ['world-6-cursebound-echoes-phase-trigger', '主线锚点'],
      'world-6-cursebound-echoes-holy-seal-islands': ['world-6-cursebound-echoes-phase-diagnosis', '主线锚点'],
      'world-6-cursebound-echoes-lone-tide-sea': ['world-6-cursebound-echoes-phase-journey', '地区卷'],
      'world-6-cursebound-echoes-molten-glow-machine-city': ['world-6-cursebound-echoes-phase-journey', '地区卷'],
      'world-6-cursebound-echoes-forest-oath-fey-realm': ['world-6-cursebound-echoes-phase-journey', '地区卷'],
      'world-6-cursebound-echoes-tiny-liluo-adventure': ['world-6-cursebound-echoes-phase-journey', '森誓妖境相关支线'],
      'world-6-cursebound-echoes-darkmoon-castle': ['world-6-cursebound-echoes-phase-journey', '地区卷'],
      'world-6-cursebound-echoes-bone-throne': ['world-6-cursebound-echoes-phase-journey', '地区卷'],
      'world-6-cursebound-echoes-dragon-sleep-mountains': ['world-6-cursebound-echoes-phase-journey', '地区卷'],
      'world-6-cursebound-echoes-locked-horn-wasteland': ['world-6-cursebound-echoes-phase-journey', '地区卷'],
      'world-6-cursebound-echoes-dark-underground-city': ['world-6-cursebound-echoes-phase-journey', '地区卷'],
      'world-6-cursebound-echoes-crystal-sand-court': ['world-6-cursebound-echoes-phase-journey', '地区卷'],
      'world-6-cursebound-echoes-northern-frost-crown': ['world-6-cursebound-echoes-phase-journey', '地区卷'],
      'world-6-cursebound-echoes-shadow-thief-city-state': ['world-6-cursebound-echoes-phase-journey', '地区卷'],
      'world-6-cursebound-echoes-witch-swamp': ['world-6-cursebound-echoes-phase-journey', '地区卷'],
      'world-6-cursebound-echoes-astral-rift-gate': ['world-6-cursebound-echoes-phase-astral', '主线锚点'],
      'world-6-cursebound-echoes-abyss-contract': ['world-6-cursebound-echoes-phase-sovereignty', '主线锚点']
    }
  },
  {
    source: '5-science.json', directory: '5-science', root: 'world-5-star-weaving-dream',
    containers: [
      ['world-5-star-weaving-dream-voyage-mainline', '航程弱主线', '以身份、航路、移动据点和自主选择下一站的长期变化组织星际旅行。', 'world-5-star-weaving-dream', 10, '航程主线'],
      ['world-5-star-weaving-dream-voyage-unregistered', '第一航程：无籍外来者', '抵达星际社会、面对身份分类并完成第一段制度文明经历。', 'world-5-star-weaving-dream-voyage-mainline', 10, '航程阶段'],
      ['world-5-star-weaving-dream-voyage-long-range', '第二航程：获得长期远航能力', '建立长期跨星区行动方式与返回据点的航程锚点。', 'world-5-star-weaving-dream-voyage-mainline', 20, '航程阶段'],
      ['world-5-star-weaving-dream-known-worlds', '已知星域独立篇章', '独立星球、城市、方舟和轨道设施的故事池。', 'world-5-star-weaving-dream-voyage-mainline', 30, '星域篇章'],
      ['world-5-star-weaving-dream-frontier-voyage', '边境星域', '战争、殖民、矿业、黑市和监管薄弱区域的高风险航程。', 'world-5-star-weaving-dream-voyage-mainline', 40, '星域篇章'],
      ['world-5-star-weaving-dream-deep-space', '深空与未知文明', '复制身份、群体意识、非人类智慧、遗迹与量子异常的后期空间。', 'world-5-star-weaving-dream-voyage-mainline', 50, '星域篇章']
    ],
    mapping: {
      'world-5-star-weaving-dream-stargate-port': ['world-5-star-weaving-dream-voyage-unregistered', '航程锚点'],
      'world-5-star-weaving-dream-ringlock-stars': ['world-5-star-weaving-dream-voyage-unregistered', '航程锚点'],
      'world-5-star-weaving-dream-order-paradise': ['world-5-star-weaving-dream-voyage-unregistered', '完整制度文明篇'],
      'world-5-star-weaving-dream-restraint-school': ['world-5-star-weaving-dream-voyage-unregistered', '律序乐园内部篇'],
      'world-5-star-weaving-dream-restraint-paradise-shop': ['world-5-star-weaving-dream-voyage-unregistered', '律序乐园内部篇'],
      'world-5-star-weaving-dream-reverse-immigration-prison': ['world-5-star-weaving-dream-voyage-unregistered', '律序乐园内部篇'],
      'world-5-star-weaving-dream-star-voyage': ['world-5-star-weaving-dream-voyage-long-range', '航程锚点'],
      'world-5-star-weaving-dream-bionic-maze': ['world-5-star-weaving-dream-known-worlds', '独立篇章'],
      'world-5-star-weaving-dream-mirror-domain': ['world-5-star-weaving-dream-known-worlds', '独立篇章'],
      'world-5-star-weaving-dream-sequence-gu-city': ['world-5-star-weaving-dream-known-worlds', '独立篇章'],
      'world-5-star-weaving-dream-cryosleep-ark': ['world-5-star-weaving-dream-known-worlds', '飞船或方舟篇'],
      'world-5-star-weaving-dream-orbital-garden': ['world-5-star-weaving-dream-known-worlds', '轨道设施篇'],
      'world-5-star-weaving-dream-molten-armor-warstar': ['world-5-star-weaving-dream-frontier-voyage', '边境候选锚点'],
      'world-5-star-weaving-dream-frontier-colony': ['world-5-star-weaving-dream-frontier-voyage', '边境候选锚点'],
      'world-5-star-weaving-dream-dome-hunt': ['world-5-star-weaving-dream-frontier-voyage', '边境殖民星相关篇'],
      'world-5-star-weaving-dream-barren-mining-asteroid': ['world-5-star-weaving-dream-frontier-voyage', '边境篇'],
      'world-5-star-weaving-dream-deep-blue-moon': ['world-5-star-weaving-dream-frontier-voyage', '边境篇'],
      'world-5-star-weaving-dream-interstellar-black-market': ['world-5-star-weaving-dream-frontier-voyage', '边境篇'],
      'world-5-star-weaving-dream-prison-planet': ['world-5-star-weaving-dream-frontier-voyage', '边境篇'],
      'world-5-star-weaving-dream-clone-corridor': ['world-5-star-weaving-dream-deep-space', '深空篇'],
      'world-5-star-weaving-dream-hivemind-hive': ['world-5-star-weaving-dream-deep-space', '深空篇'],
      'world-5-star-weaving-dream-first-contact': ['world-5-star-weaving-dream-deep-space', '航程锚点'],
      'world-5-star-weaving-dream-forerunner-ruins': ['world-5-star-weaving-dream-deep-space', '航程锚点'],
      'world-5-star-weaving-dream-quantum-maze': ['world-5-star-weaving-dream-deep-space', '阶段性高潮']
    }
  }
]

if (process.argv.includes('--fix-markdown-names')) {
  for (const config of worlds) {
    for (const container of config.containers) {
      const oldName = `mainline-${container[0].split('-').slice(-2).join('-')}-${container[1]}.md`
      const nextName = `900-${container[1]}.md`
      const oldPath = path.join(markdownRoot, config.directory, oldName)
      const nextPath = path.join(markdownRoot, config.directory, nextName)
      if (fs.existsSync(oldPath) && !fs.existsSync(nextPath)) fs.renameSync(oldPath, nextPath)
    }
  }
  console.log('Renamed generated mainline memos to title-addressable filenames.')
  process.exit(0)
}

if (process.argv.includes('--linearize')) {
  const plans = {
    '2-apocalypse.json': [
      ['world-2-silent-earth-dirge-history', 'world-2-silent-earth-dirge'], ['world-2-silent-earth-dirge-phase-outbreak', 'world-2-silent-earth-dirge-history'], ['world-2-silent-earth-dirge-zombie-apocalypse', 'world-2-silent-earth-dirge-phase-outbreak'], ['world-2-silent-earth-dirge-red-line', 'world-2-silent-earth-dirge-zombie-apocalypse'], ['world-2-silent-earth-dirge-omega', 'world-2-silent-earth-dirge-red-line'], ['world-2-silent-earth-dirge-phase-city-collapse', 'world-2-silent-earth-dirge-omega'], ['world-2-silent-earth-dirge-disaster-anomaly', 'world-2-silent-earth-dirge-phase-city-collapse'], ['world-2-silent-earth-dirge-plague-ruined-city', 'world-2-silent-earth-dirge-disaster-anomaly'], ['world-2-silent-earth-dirge-ecology-devouring-city', 'world-2-silent-earth-dirge-plague-ruined-city'], ['world-2-silent-earth-dirge-phase-wilderness', 'world-2-silent-earth-dirge-ecology-devouring-city'], ['world-2-silent-earth-dirge-beast-treading-land', 'world-2-silent-earth-dirge-phase-wilderness'], ['world-2-silent-earth-dirge-insect-hive-border', 'world-2-silent-earth-dirge-beast-treading-land'], ['world-2-silent-earth-dirge-phase-refuge', 'world-2-silent-earth-dirge-insect-hive-border'], ['world-2-silent-earth-dirge-mechanical-afterglow', 'world-2-silent-earth-dirge-phase-refuge'], ['world-2-silent-earth-dirge-ark-ghost-cage', 'world-2-silent-earth-dirge-mechanical-afterglow'], ['world-2-silent-earth-dirge-phase-new-order', 'world-2-silent-earth-dirge-ark-ghost-cage'], ['world-2-silent-earth-dirge-wasteland-court', 'world-2-silent-earth-dirge-phase-new-order'], ['world-2-silent-earth-dirge-apocalypse-holy-judgment', 'world-2-silent-earth-dirge-wasteland-court'], ['world-2-silent-earth-dirge-phase-rift', 'world-2-silent-earth-dirge-apocalypse-holy-judgment'], ['world-2-silent-earth-dirge-rift-disaster', 'world-2-silent-earth-dirge-phase-rift'], ['world-2-silent-earth-dirge-phase-epilogue', 'world-2-silent-earth-dirge-rift-disaster'], ['world-2-silent-earth-dirge-solo-smart-rv-trader', 'world-2-silent-earth-dirge-phase-epilogue'],
      ['world-2-silent-earth-dirge-anomaly-domains', 'world-2-silent-earth-dirge-phase-city-collapse', 'side'], ['world-2-silent-earth-dirge-eerie-apocalypse', 'world-2-silent-earth-dirge-anomaly-domains'], ['world-2-silent-earth-dirge-fog-city', 'world-2-silent-earth-dirge-eerie-apocalypse'],
      ['world-2-silent-earth-dirge-apocalypse-loops', 'world-2-silent-earth-dirge-phase-wilderness', 'side'], ['world-2-silent-earth-dirge-deep-sea-drifting-land', 'world-2-silent-earth-dirge-apocalypse-loops'], ['world-2-silent-earth-dirge-eternal-winter-white-realm', 'world-2-silent-earth-dirge-deep-sea-drifting-land'], ['world-2-silent-earth-dirge-lone-sand-sea', 'world-2-silent-earth-dirge-eternal-winter-white-realm'], ['world-2-silent-earth-dirge-dream-city-slumber', 'world-2-silent-earth-dirge-lone-sand-sea'], ['world-2-silent-earth-dirge-looping-final-day', 'world-2-silent-earth-dirge-dream-city-slumber'], ['world-2-silent-earth-dirge-forgotten-river-gray-world', 'world-2-silent-earth-dirge-looping-final-day']
    ],
    '4-fantasy.json': [
      ['world-6-cursebound-echoes-curse-mainline', 'world-6-cursebound-echoes'], ['world-6-cursebound-echoes-phase-ascension', 'world-6-cursebound-echoes-curse-mainline'], ['world-6-cursebound-echoes-dreambound-continent', 'world-6-cursebound-echoes-phase-ascension'], ['world-6-cursebound-echoes-silver-crown-capital', 'world-6-cursebound-echoes-dreambound-continent'], ['world-6-cursebound-echoes-secret-rune-academy', 'world-6-cursebound-echoes-silver-crown-capital'], ['world-6-cursebound-echoes-phase-trigger', 'world-6-cursebound-echoes-secret-rune-academy'], ['world-6-cursebound-echoes-secret-tower-long-song', 'world-6-cursebound-echoes-phase-trigger'], ['world-6-cursebound-echoes-phase-diagnosis', 'world-6-cursebound-echoes-secret-tower-long-song'], ['world-6-cursebound-echoes-holy-seal-islands', 'world-6-cursebound-echoes-phase-diagnosis'], ['world-6-cursebound-echoes-phase-journey', 'world-6-cursebound-echoes-holy-seal-islands'], ['world-6-cursebound-echoes-lone-tide-sea', 'world-6-cursebound-echoes-phase-journey'], ['world-6-cursebound-echoes-molten-glow-machine-city', 'world-6-cursebound-echoes-lone-tide-sea'], ['world-6-cursebound-echoes-forest-oath-fey-realm', 'world-6-cursebound-echoes-molten-glow-machine-city'], ['world-6-cursebound-echoes-darkmoon-castle', 'world-6-cursebound-echoes-forest-oath-fey-realm'], ['world-6-cursebound-echoes-bone-throne', 'world-6-cursebound-echoes-darkmoon-castle'], ['world-6-cursebound-echoes-dragon-sleep-mountains', 'world-6-cursebound-echoes-bone-throne'], ['world-6-cursebound-echoes-locked-horn-wasteland', 'world-6-cursebound-echoes-dragon-sleep-mountains'], ['world-6-cursebound-echoes-dark-underground-city', 'world-6-cursebound-echoes-locked-horn-wasteland'], ['world-6-cursebound-echoes-crystal-sand-court', 'world-6-cursebound-echoes-dark-underground-city'], ['world-6-cursebound-echoes-northern-frost-crown', 'world-6-cursebound-echoes-crystal-sand-court'], ['world-6-cursebound-echoes-shadow-thief-city-state', 'world-6-cursebound-echoes-northern-frost-crown'], ['world-6-cursebound-echoes-witch-swamp', 'world-6-cursebound-echoes-shadow-thief-city-state'], ['world-6-cursebound-echoes-phase-false-cure', 'world-6-cursebound-echoes-witch-swamp'], ['world-6-cursebound-echoes-phase-astral', 'world-6-cursebound-echoes-phase-false-cure'], ['world-6-cursebound-echoes-astral-rift-gate', 'world-6-cursebound-echoes-phase-astral'], ['world-6-cursebound-echoes-phase-sovereignty', 'world-6-cursebound-echoes-astral-rift-gate'], ['world-6-cursebound-echoes-abyss-contract', 'world-6-cursebound-echoes-phase-sovereignty'], ['world-6-cursebound-echoes-silent-rite-court', 'world-6-cursebound-echoes-silver-crown-capital', 'side'], ['world-6-cursebound-echoes-tiny-liluo-adventure', 'world-6-cursebound-echoes-forest-oath-fey-realm', 'side']
    ],
    '5-science.json': [
      ['world-5-star-weaving-dream-voyage-mainline', 'world-5-star-weaving-dream'], ['world-5-star-weaving-dream-voyage-unregistered', 'world-5-star-weaving-dream-voyage-mainline'], ['world-5-star-weaving-dream-stargate-port', 'world-5-star-weaving-dream-voyage-unregistered'], ['world-5-star-weaving-dream-ringlock-stars', 'world-5-star-weaving-dream-stargate-port'], ['world-5-star-weaving-dream-order-paradise', 'world-5-star-weaving-dream-ringlock-stars'], ['world-5-star-weaving-dream-restraint-school', 'world-5-star-weaving-dream-order-paradise'], ['world-5-star-weaving-dream-restraint-paradise-shop', 'world-5-star-weaving-dream-restraint-school'], ['world-5-star-weaving-dream-reverse-immigration-prison', 'world-5-star-weaving-dream-restraint-paradise-shop'], ['world-5-star-weaving-dream-voyage-long-range', 'world-5-star-weaving-dream-reverse-immigration-prison'], ['world-5-star-weaving-dream-star-voyage', 'world-5-star-weaving-dream-voyage-long-range'], ['world-5-star-weaving-dream-known-worlds', 'world-5-star-weaving-dream-star-voyage'], ['world-5-star-weaving-dream-bionic-maze', 'world-5-star-weaving-dream-known-worlds'], ['world-5-star-weaving-dream-mirror-domain', 'world-5-star-weaving-dream-bionic-maze'], ['world-5-star-weaving-dream-sequence-gu-city', 'world-5-star-weaving-dream-mirror-domain'], ['world-5-star-weaving-dream-cryosleep-ark', 'world-5-star-weaving-dream-sequence-gu-city'], ['world-5-star-weaving-dream-orbital-garden', 'world-5-star-weaving-dream-cryosleep-ark'], ['world-5-star-weaving-dream-frontier-voyage', 'world-5-star-weaving-dream-orbital-garden'], ['world-5-star-weaving-dream-molten-armor-warstar', 'world-5-star-weaving-dream-frontier-voyage'], ['world-5-star-weaving-dream-frontier-colony', 'world-5-star-weaving-dream-molten-armor-warstar'], ['world-5-star-weaving-dream-dome-hunt', 'world-5-star-weaving-dream-frontier-colony'], ['world-5-star-weaving-dream-barren-mining-asteroid', 'world-5-star-weaving-dream-dome-hunt'], ['world-5-star-weaving-dream-deep-blue-moon', 'world-5-star-weaving-dream-barren-mining-asteroid'], ['world-5-star-weaving-dream-interstellar-black-market', 'world-5-star-weaving-dream-deep-blue-moon'], ['world-5-star-weaving-dream-prison-planet', 'world-5-star-weaving-dream-interstellar-black-market'], ['world-5-star-weaving-dream-deep-space', 'world-5-star-weaving-dream-prison-planet'], ['world-5-star-weaving-dream-clone-corridor', 'world-5-star-weaving-dream-deep-space'], ['world-5-star-weaving-dream-hivemind-hive', 'world-5-star-weaving-dream-clone-corridor'], ['world-5-star-weaving-dream-first-contact', 'world-5-star-weaving-dream-hivemind-hive'], ['world-5-star-weaving-dream-forerunner-ruins', 'world-5-star-weaving-dream-first-contact'], ['world-5-star-weaving-dream-quantum-maze', 'world-5-star-weaving-dream-forerunner-ruins']
    ]
  }
  for (const [sourceName, rows] of Object.entries(plans)) {
    const file = path.join(sourceDir, sourceName); const source = JSON.parse(fs.readFileSync(file, 'utf8')); const byKey = new Map(source.nodes.map((node) => [node.key, node]))
    for (const [key, parentKey, layout] of rows) { const node = byKey.get(key); if (!node || !byKey.has(parentKey)) throw new Error(`${sourceName}: invalid linear plan ${key}`); node.parentKey = parentKey; if (layout === 'side') node.branchLayout = 'side'; else delete node.branchLayout }
    if (apply) fs.writeFileSync(file, `${JSON.stringify(source, null, 2)}\n`, 'utf8')
  }
  console.log(JSON.stringify({ apply, layout: 'single-mainline-with-single-side-entries', sources: Object.keys(plans) }, null, 2))
  process.exit(0)
}

function memo(container, world, mappings) {
  const [key, title, summary, , , label] = container
  const members = mappings.filter(([, value]) => value[0] === key).map(([memberKey, value]) => `- \`${memberKey}\`：${value[1]}。`).join('\n') || '- 当前没有旧节点直接挂载；它仅保留已确认的阶段功能与待定决策。'
  return `---\nkey: ${key}\nworld: ${world}\nstatus: 主线任务\nsummary: ${summary}\ndetailLabel: 主线备忘\n---\n\n# 主线定位\n\n${summary}\n\n# 已确认方向\n\n本备忘只记录本轮已获用户确认的结构职责，不替代任何下属节点的原始灵感或可玩设计。\n\n# 阶段挂载\n\n${members}\n\n# 新灵感挂载\n\n先判断新灵感是否属于本阶段；尚不能确定具体节点、精确顺序或因果时，只挂到本容器并保留待办，不强行拆写成深层章节。\n\n# 留待正式主线设计时确认\n\n- ${label}内各节点的精确因果、开放条件与完成顺序。\n- 未被现有原文确认的角色动机、规则来源、长期状态与结局细节。\n`
}

const records = []
for (const config of worlds) {
  const file = path.join(sourceDir, config.source)
  const source = JSON.parse(fs.readFileSync(file, 'utf8'))
  const existing = new Map(source.nodes.map((node) => [node.key, node]))
  const initial = source.nodes.map((node) => ({ ...node }))
  const expected = new Set(Object.keys(config.mapping))
  for (const key of expected) if (!existing.has(key)) throw new Error(`${config.source}: expected node missing: ${key}`)
  for (const node of initial) {
    const markdown = fs.readdirSync(path.join(markdownRoot, config.directory)).find((name) => name.endsWith(`-${node.title}.md`))
    const markdownPath = markdown ? path.join(markdownRoot, config.directory, markdown) : null
    records.push({ key: node.key, world: node.world, title: node.title, sourceFile: `src/game/data/story_outline/sources/${config.source}`, markdownPath: markdownPath ? path.relative(root, markdownPath).replaceAll('\\', '/') : null, sourceContentHash: hash(stable(Object.fromEntries(Object.entries(node).filter(([field]) => !['parentKey', 'order'].includes(field))))), markdownHash: markdownPath ? hash(fs.readFileSync(markdownPath, 'utf8')) : null, missingItems: node.missingItems ?? [], oldParentKey: node.parentKey ?? null, oldOrder: node.order ?? null, destination: node.key === config.root ? { container: null, type: '世界分类' } : config.mapping[node.key] ? { container: config.mapping[node.key][0], type: config.mapping[node.key][1] } : null })
  }
  for (const [key, title, summary, parentKey, order] of config.containers) {
    if (existing.has(key)) throw new Error(`${config.source}: container key already exists: ${key}`)
    source.nodes.push({ key, world: initial[0].world, title, summary, status: '主线任务', parentKey, order })
  }
  for (const [key, [parentKey]] of Object.entries(config.mapping)) {
    const node = existing.get(key)
    node.parentKey = parentKey
  }
  if (apply) {
    fs.writeFileSync(file, `${JSON.stringify(source, null, 2)}\n`, 'utf8')
    for (const container of config.containers) {
      const filename = `900-${container[1]}.md`
      fs.writeFileSync(path.join(markdownRoot, config.directory, filename), memo(container, initial[0].world, Object.entries(config.mapping)), 'utf8')
    }
  }
}

const snapshot = { schemaVersion: 1, purpose: '寂土挽歌、咒缚回响与星宇织梦主线重构的旧节点原文保全与迁移去向清单。哈希排除 parentKey 与 order，仅允许本轮调整结构位置。', entries: records }
if (apply) fs.writeFileSync(snapshotFile, `${JSON.stringify(snapshot, null, 2)}\n`, 'utf8')
console.log(JSON.stringify({ apply, oldNodeCount: records.length, mapped: records.filter((entry) => entry.destination).length, missingMarkdown: records.filter((entry) => !entry.markdownPath).length, sources: worlds.map((world) => world.source) }, null, 2))
