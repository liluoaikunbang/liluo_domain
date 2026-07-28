import { collectPlotStoryLinks, loadRestraintCards, loadStoryNodes } from './load.mjs'
import { slugify } from './io.mjs'

const LEGACY_OCCUPATION_RE =
  /由旧\s*specialGameplay\s*「职业-([^」]+)」迁移|具体(?:场景|内容|过程).{0,12}(?:见|以)关联故事正文/
const SEE_STORY_BODY_RE = /具体(?:场景|内容|过程|结果).{0,20}(?:见|以).{0,20}故事正文/
const EVENT_MARKERS_RE =
  /折返|被抓|失败|成功|误判|升级|逃脱|救援|审讯|拍摄|牌局|输掉|触发|导致|之后|随后|最终|被迫|再次/
const ROLE_SLOT_RE = /璃落|她|他|受困|女子|施害|人员|社员|成员|魔女|乘务|教师|模特|演员/
const NOUNISH_TITLE_RE =
  /^(?:火车乘务员|教师|美人鱼模特|模特|演员|手铐|水泥鞋|固定姿态|拘束衣|锁链|脚镣|丝袜拘束|蛛丝|胶水|活埋|监禁|永久拘束)$/u

function boolOrUncertain(value) {
  if (value === true) return true
  if (value === false) return false
  return 'uncertain'
}

function findExistingRagByTitle(title, cards) {
  const needle = String(title ?? '').trim()
  if (!needle) return null
  return (
    cards.find((card) => card.title === needle) ||
    cards.find((card) => (card.aliases ?? []).includes(needle)) ||
    null
  )
}

function occupationRagSeed(title) {
  const base = title.replace(/^职业-/, '').trim()
  return {
    newRagId: `rag.restraint.context.${slugify(base) || 'occupation'}`,
    title: `${base}职业场景`,
    cardType: 'context',
    knowledgeSeed: [
      `${base}是可跨故事复用的职业/角色场景条件，不绑定唯一人物、地点或单次结果。`,
      '知识分支应说明该职业场景通常带来的行动边界、可见规则与可复用限制条件。'
    ],
    expressionSeed: [
      '表达分支应说明该职业场景下受限状态、公开程度与身份反差的表现重点。',
      '避免把某次故事正文过程写进概念定义。'
    ]
  }
}

/**
 * Generate a LayerReviewProposal for one formal plot entry.
 * Never writes main data.
 */
export function proposePlotLayer(entry, {
  storyNodes = loadStoryNodes(),
  ragCards = loadRestraintCards(),
  groups = []
} = {}) {
  const linkedStories = collectPlotStoryLinks(entry.id, storyNodes)
  const summary = String(entry.summary ?? '')
  const title = String(entry.title ?? '')
  const notes = String(entry.notes ?? '')
  const developmentText = Object.values(entry.development ?? {}).join(' ')
  const blob = `${title}\n${summary}\n${notes}\n${developmentText}`

  const legacyOccupationMatch = summary.match(LEGACY_OCCUPATION_RE) || title.match(NOUNISH_TITLE_RE)
  const isLegacyOccupation =
    /由旧\s*specialGameplay\s*「职业-/.test(summary) || SEE_STORY_BODY_RE.test(summary)
  const occupationName =
    summary.match(/「职业-([^」]+)」/)?.[1] ||
    (NOUNISH_TITLE_RE.test(title) ? title : null)

  const hasActorOrRole = boolOrUncertain(
    ROLE_SLOT_RE.test(blob) || (entry.characters ?? []).length > 0
  )
  const hasTrigger = boolOrUncertain(
    /因|当|在|误|被|通过|进入|参加|调查/.test(blob)
  )
  const hasProcess = boolOrUncertain(
    EVENT_MARKERS_RE.test(blob) || Object.values(entry.development ?? {}).some((v) => String(v).length >= 8)
  )
  const hasChangeOrOutcome = boolOrUncertain(
    /导致|最终|此后|成为|失去|获得|改变|被迫|回收|留下/.test(blob)
  )
  const eventScore = [hasActorOrRole, hasTrigger, hasProcess, hasChangeOrOutcome].filter(
    (v) => v === true
  ).length

  const reusableAcrossStories = isLegacyOccupation
    ? true
    : NOUNISH_TITLE_RE.test(title) && eventScore <= 1
      ? true
      : eventScore >= 3
        ? false
        : 'uncertain'

  const placementTest = {
    hasFormalWorldPlacement: linkedStories.length > 0,
    linkedStoryIds: linkedStories.map((s) => s.key)
  }

  const questionsForUser = []
  let recommendation = 'keep-as-plot'
  let recommendedLayer = 'plot'
  let confidence = 0.72
  const rationale = []
  let proposedRagTarget
  let proposedPlotRemainder
  let proposedStoryTarget
  const edgeMigrationPlan = []

  if (isLegacyOccupation && occupationName) {
    recommendation = 'split-plot-and-rag'
    recommendedLayer = 'plot-and-rag'
    confidence = 0.88
    rationale.push('摘要标明由旧职业 specialGameplay 迁移，且把具体过程指向故事正文。')
    rationale.push('职业概念可复用，应进入「职业场景」上位下的具体职业 RAG。')
    rationale.push('若关联故事已有具体束缚/欺负过程，情节实例应保留，不整项迁走。')
    const existing = findExistingRagByTitle(occupationName, ragCards)
      || findExistingRagByTitle(`${occupationName}职业场景`, ragCards)
    const parentExisting = findExistingRagByTitle('职业场景', ragCards)
      || findExistingRagByTitle('职业', ragCards)
    proposedRagTarget = existing
      ? {
          existingRagId: existing.cardId,
          title: existing.title,
          cardType: existing.cardType || 'context',
          ragLayer: 'concept',
          parentCardIds: existing.parentCardIds?.length
            ? existing.parentCardIds
            : [parentExisting?.cardId || 'rag.restraint.context.occupation'],
          knowledgeSeed: [],
          expressionSeed: []
        }
      : {
          newRagId: `rag.restraint.context.${slugify(occupationName) || 'occupation-role'}`,
          title: occupationName,
          cardType: 'context',
          ragLayer: 'concept',
          parentCardIds: [parentExisting?.cardId || 'rag.restraint.context.occupation'],
          knowledgeSeed: [
            `${occupationName}是可跨故事复用的职业场景条件，会改变公开规则、可用道具与身份反差。`,
            '它描述职业切口，不等于某次故事里的具体过程。'
          ],
          expressionSeed: [
            '先写清该职业的公开规则与服务/工作姿态，再落到具体器具与受限动作。',
            '避免把单次客串或某次欺负过程写进概念定义。'
          ]
        }
    proposedPlotRemainder = {
      keepOriginalId: true,
      proposedTitle: `${occupationName}相关事件`,
      proposedSummary: '请从关联故事正文抽取一次具体发生后改写。'
    }
    for (const story of linkedStories) {
      edgeMigrationPlan.push({
        action: 'keep',
        fromId: story.key,
        relation: 'contains/plotRefs',
        toId: entry.id,
        reason: '故事继续包含该次具体情节'
      })
      edgeMigrationPlan.push({
        action: 'add',
        fromId: entry.id,
        relation: 'references/ragRefs',
        toId: proposedRagTarget.existingRagId || proposedRagTarget.newRagId,
        reason: '情节引用职业 RAG'
      })
      edgeMigrationPlan.push({
        action: 'add',
        fromId: story.key,
        relation: 'references/ragRefs',
        toId: proposedRagTarget.existingRagId || proposedRagTarget.newRagId,
        reason: '故事可直接引用该职业 RAG'
      })
    }
    questionsForUser.push(
      `是否确认拆分「${title}」：新建/并入职业 RAG，并保留情节实例？`
    )
    questionsForUser.push(
      '上位类别是否使用已有「职业场景」(rag.restraint.context.occupation)？'
    )
    questionsForUser.push(
      '关联故事中的具体事件标题与摘要是否按故事正文改写？请确认或给出你的命名。'
    )
  } else if (
    NOUNISH_TITLE_RE.test(title) &&
    eventScore >= 3 &&
    reusableAcrossStories !== false
  ) {
    recommendation = 'split-plot-and-rag'
    recommendedLayer = 'plot-and-rag'
    confidence = 0.7
    rationale.push('标题偏可复用概念，但正文已形成具体发生，建议拆分。')
    proposedRagTarget = occupationRagSeed(title)
    proposedPlotRemainder = {
      keepOriginalId: true,
      proposedTitle: `${title}相关事件`,
      proposedSummary: summary
    }
    edgeMigrationPlan.push({
      action: 'add',
      fromId: entry.id,
      relation: 'references/ragRefs',
      toId: proposedRagTarget.newRagId,
      reason: '保留情节实例并引用抽出的 RAG'
    })
    questionsForUser.push('拆分后 RAG 与情节标题是否采用建议名称？')
  } else if (
    !isLegacyOccupation &&
    eventScore <= 1 &&
    (NOUNISH_TITLE_RE.test(title) || summary.length < 40)
  ) {
    recommendation = 'uncertain'
    recommendedLayer = 'uncertain'
    confidence = 0.45
    rationale.push('事件性证据不足，且不像已确认的旧职业迁移壳，需用户裁决。')
    questionsForUser.push('该条目更像可复用概念、一次事件，还是应归档？')
  } else if (
    linkedStories.length === 0 &&
    /迷城|王国|绘本|童话城市|沙漠王城|魔女之夜/.test(title + summary) &&
    summary.length > 120 &&
    eventScore >= 2
  ) {
    recommendation = 'uncertain'
    recommendedLayer = 'uncertain'
    confidence = 0.5
    rationale.push('规模与世界观容器感偏强，可能是故事候选，也可能仍是未安置情节。')
    proposedStoryTarget = { newStoryCandidate: true }
    questionsForUser.push('是否应提升为正式故事容器，还是保留为未安置情节？')
  } else if (eventScore >= 3) {
    recommendation = 'keep-as-plot'
    recommendedLayer = 'plot'
    confidence = 0.82
    rationale.push('具备角色/条件/过程/变化中的多项事件证据。')
    rationale.push('应作为一次性叙事实例保留；若内部含可复用概念，可另抽 RAG，但不整项迁移。')
    if ((entry.ragRefs ?? []).length === 0 && /铐|绳|丝|拘束|捆绑|封|锁/.test(blob)) {
      questionsForUser.push('是否需要补充 ragRefs 指向已有紧缚 RAG？可暂缓。')
      confidence = 0.75
    }
  } else {
    recommendation = 'uncertain'
    recommendedLayer = 'uncertain'
    confidence = 0.4
    rationale.push('复用性与事件性边界不清，禁止自动迁移。')
    questionsForUser.push('请指定保留为情节、迁入 RAG、拆分或暂缓。')
  }

  if (legacyOccupationMatch && !isLegacyOccupation) {
    rationale.push('标题匹配常见概念名词，但摘要并非标准职业迁移壳，已降低自动置信。')
  }

  const group = groups.find((g) => g.id === entry.groupId)

  return {
    sourcePlotId: entry.id,
    title: entry.title,
    number: entry.number,
    groupId: entry.groupId,
    groupTitle: group?.title ?? null,
    plotKind: entry.plotKind,
    usageStatus: entry.usageStatus,
    recommendation,
    recommendedLayer,
    rationale,
    reuseTest: {
      reusableAcrossStories,
      explanation: isLegacyOccupation
        ? '职业/场景概念可跨故事复用；正文过程不在本条目内。'
        : reusableAcrossStories === false
          ? '摘要描述一次具体发生，换故事后通常不能原样复用。'
          : reusableAcrossStories === true
            ? '标题/摘要更接近可复用概念。'
            : '无法可靠判断是否可跨故事复用。'
    },
    eventTest: {
      hasActorOrRole,
      hasTrigger,
      hasProcess,
      hasChangeOrOutcome
    },
    placementTest,
    proposedRagTarget,
    proposedPlotRemainder,
    proposedStoryTarget,
    edgeMigrationPlan,
    affectedSourceFiles: [
      'src/game/data/plot_outline/catalog.json',
      ...linkedStories.map((s) => s.sourceFile)
    ],
    affectedStoryEntries: linkedStories.map((s) => s.key),
    linkedStories,
    confidence,
    questionsForUser,
    reviewStatus: 'proposed',
    generatedAt: new Date().toISOString()
  }
}

export function proposeAllPlotLayers(catalog, options = {}) {
  const storyNodes = options.storyNodes ?? loadStoryNodes()
  const ragCards = options.ragCards ?? loadRestraintCards()
  return (catalog.entries ?? []).map((entry) =>
    proposePlotLayer(entry, {
      storyNodes,
      ragCards,
      groups: catalog.groups ?? []
    })
  )
}
