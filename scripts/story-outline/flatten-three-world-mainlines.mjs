import fs from 'node:fs'
import path from 'node:path'

const root = path.resolve(import.meta.dirname, '../..')
const sourceDir = path.join(root, 'src/game/data/story_outline/sources')
const snapshot = JSON.parse(fs.readFileSync(path.join(root, 'src/game/data/story_outline/mainline-restructure-preservation.json'), 'utf8'))
const originalKeys = new Set(snapshot.entries.map((entry) => entry.key))
const apply = process.argv.includes('--apply')

const plans = {
  '2-apocalypse.json': {
    main: ['world-2-silent-earth-dirge-zombie-apocalypse','world-2-silent-earth-dirge-red-line','world-2-silent-earth-dirge-omega','world-2-silent-earth-dirge-eerie-apocalypse','world-2-silent-earth-dirge-fog-city','world-2-silent-earth-dirge-disaster-anomaly','world-2-silent-earth-dirge-plague-ruined-city','world-2-silent-earth-dirge-ecology-devouring-city','world-2-silent-earth-dirge-beast-treading-land','world-2-silent-earth-dirge-insect-hive-border','world-2-silent-earth-dirge-mechanical-afterglow','world-2-silent-earth-dirge-ark-ghost-cage','world-2-silent-earth-dirge-wasteland-court','world-2-silent-earth-dirge-apocalypse-holy-judgment','world-2-silent-earth-dirge-rift-disaster','world-2-silent-earth-dirge-solo-smart-rv-trader'],
    sides: [['world-2-silent-earth-dirge-insect-hive-border',['world-2-silent-earth-dirge-deep-sea-drifting-land','world-2-silent-earth-dirge-eternal-winter-white-realm','world-2-silent-earth-dirge-lone-sand-sea','world-2-silent-earth-dirge-dream-city-slumber','world-2-silent-earth-dirge-looping-final-day','world-2-silent-earth-dirge-forgotten-river-gray-world']]]
  },
  '4-fantasy.json': {
    main: ['world-6-cursebound-echoes-dreambound-continent','world-6-cursebound-echoes-silver-crown-capital','world-6-cursebound-echoes-silent-rite-court','world-6-cursebound-echoes-secret-rune-academy','world-6-cursebound-echoes-secret-tower-long-song','world-6-cursebound-echoes-holy-seal-islands','world-6-cursebound-echoes-lone-tide-sea','world-6-cursebound-echoes-molten-glow-machine-city','world-6-cursebound-echoes-forest-oath-fey-realm','world-6-cursebound-echoes-darkmoon-castle','world-6-cursebound-echoes-bone-throne','world-6-cursebound-echoes-dragon-sleep-mountains','world-6-cursebound-echoes-locked-horn-wasteland','world-6-cursebound-echoes-dark-underground-city','world-6-cursebound-echoes-crystal-sand-court','world-6-cursebound-echoes-northern-frost-crown','world-6-cursebound-echoes-shadow-thief-city-state','world-6-cursebound-echoes-witch-swamp','world-6-cursebound-echoes-astral-rift-gate','world-6-cursebound-echoes-abyss-contract'],
    sides: [['world-6-cursebound-echoes-forest-oath-fey-realm',['world-6-cursebound-echoes-tiny-liluo-adventure']]]
  },
  '5-science.json': {
    main: ['world-5-star-weaving-dream-stargate-port','world-5-star-weaving-dream-ringlock-stars','world-5-star-weaving-dream-order-paradise','world-5-star-weaving-dream-restraint-school','world-5-star-weaving-dream-restraint-paradise-shop','world-5-star-weaving-dream-reverse-immigration-prison','world-5-star-weaving-dream-star-voyage','world-5-star-weaving-dream-bionic-maze','world-5-star-weaving-dream-mirror-domain','world-5-star-weaving-dream-sequence-gu-city','world-5-star-weaving-dream-cryosleep-ark','world-5-star-weaving-dream-orbital-garden','world-5-star-weaving-dream-molten-armor-warstar','world-5-star-weaving-dream-frontier-colony','world-5-star-weaving-dream-dome-hunt','world-5-star-weaving-dream-barren-mining-asteroid','world-5-star-weaving-dream-deep-blue-moon','world-5-star-weaving-dream-interstellar-black-market','world-5-star-weaving-dream-prison-planet','world-5-star-weaving-dream-clone-corridor','world-5-star-weaving-dream-hivemind-hive','world-5-star-weaving-dream-first-contact','world-5-star-weaving-dream-forerunner-ruins','world-5-star-weaving-dream-quantum-maze'],
    sides: []
  }
}

for (const [sourceName, plan] of Object.entries(plans)) {
  const file = path.join(sourceDir, sourceName); const source = JSON.parse(fs.readFileSync(file, 'utf8'))
  source.nodes = source.nodes.filter((node) => originalKeys.has(node.key))
  const byKey = new Map(source.nodes.map((node) => [node.key, node])); const rootNode = source.nodes.find((node) => !node.parentKey)
  if (!rootNode) throw new Error(`${sourceName}: missing world root`)
  for (const node of source.nodes) delete node.branchLayout
  for (let index = 0; index < plan.main.length; index += 1) {
    const node = byKey.get(plan.main[index]); if (!node) throw new Error(`${sourceName}: missing ${plan.main[index]}`)
    node.parentKey = index === 0 ? rootNode.key : plan.main[index - 1]; node.order = 10
  }
  for (const [parentKey, chain] of plan.sides) {
    for (let index = 0; index < chain.length; index += 1) {
      const node = byKey.get(chain[index]); if (!node) throw new Error(`${sourceName}: missing ${chain[index]}`)
      node.parentKey = index === 0 ? parentKey : chain[index - 1]; node.order = index === 0 ? 20 : 10
      if (index === 0) node.branchLayout = 'side'
    }
  }
  if (apply) fs.writeFileSync(file, `${JSON.stringify(source, null, 2)}\n`, 'utf8')
}

if (apply) for (const directory of ['2-apocalypse', '4-fantasy', '5-science']) for (const name of fs.readdirSync(path.join(root, 'src/game/data/story_outline', directory))) if (name.startsWith('900-') && name.endsWith('.md')) fs.rmSync(path.join(root, 'src/game/data/story_outline', directory, name))
console.log(JSON.stringify({ apply, oldNodeCount: snapshot.entries.length, generatedContainersRemoved: 24 }, null, 2))
