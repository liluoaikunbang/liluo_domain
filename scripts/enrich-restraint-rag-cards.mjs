import fs from 'node:fs';
import path from 'node:path';

const cardRoot = 'external-knowledge/cards/restraint';
const segmentRoot = 'external-knowledge/index/segments';

const parentByCardId = new Map(Object.entries({
  'rag.restraint.detail.挠痒-山药汁': 'rag.restraint.effect.tickling',
  'rag.restraint.detail.挠痒-蚊子': 'rag.restraint.effect.tickling',
  'rag.restraint.detail.感官刺激-芥末辣椒等': 'rag.restraint.effect.sensory-stimulation',
  'rag.restraint.detail.眼耳口鼻': 'rag.restraint.effect.sensory-stimulation',
  'rag.restraint.detail.性刺激-三点刺激': 'rag.restraint.effect.sexual-stimulation',
  'rag.restraint.detail.气味系-踩踩': 'rag.restraint.effect.odor-stimulation',
  'rag.restraint.detail.无鞋': 'rag.restraint.effect.public-humiliation',
  'rag.restraint.detail.语言羞辱': 'rag.restraint.effect.public-humiliation',
  'rag.restraint.detail.寒冷': 'rag.restraint.effect.pain',
  'rag.restraint.detail.虐足-小鞋': 'rag.restraint.effect.pain',
  'rag.restraint.detail.冤罪': 'rag.restraint.state.confinement',
  'rag.restraint.detail.小笼子': 'rag.restraint.state.confinement',
  'rag.restraint.detail.小黑屋': 'rag.restraint.state.confinement',
  'rag.restraint.detail.水牢': 'rag.restraint.state.confinement',
  'rag.restraint.context.open-air-dungeon': 'rag.restraint.state.confinement',
  'rag.restraint.pose.leg-press-shackles': 'rag.restraint.tool.shackles',
  'rag.restraint.tool.handcuffs': 'rag.restraint.tool.shackles',
  'rag.restraint.tool.leg-irons': 'rag.restraint.tool.shackles',
  'rag.restraint.detail.石膏-石膏包手': 'rag.restraint.structure.full-body-wrapping',
  'rag.restraint.duration.permanent-restraint': 'rag.restraint.context.restrained-life',
  'rag.restraint.detail.特殊-拘捕网': 'rag.restraint.material.spider-silk'
}));

const evidenceByCardId = new Map(Object.entries({
  'rag.restraint.detail.寒冷': {
    summary: '寒冷作为持续环境压力，会放大受限状态中的僵硬、行动困难与时间感。',
    definition: '用于描述低温环境与受限姿态共同作用的感受和情节压力；重点是环境持续影响行动，而不是把寒冷当作独立器具。',
    segmentIds: ['fb-src-000005-seg-00019', 'fb-src-000007-seg-00019']
  },
  'rag.restraint.detail.小黑屋': {
    summary: '狭小、缺光的封闭空间会压缩姿态选择，并让等待本身成为压力。',
    definition: '以黑暗或微光、空间局促和信息隔绝为主要特征的监禁场景。',
    segmentIds: ['fb-src-000099-seg-00047']
  },
  'rag.restraint.detail.水牢': {
    summary: '水牢把监禁与水位、低温、站立困难等环境变化绑定在一起。',
    definition: '角色被限制在有积水或可改变水位的封闭设施中；水体既是环境，也是持续改变行动条件的压力源。',
    segmentIds: ['fb-src-000061-seg-00378', 'fb-src-000203-seg-00126']
  },
  'rag.restraint.duration.permanent-restraint': {
    summary: '受限状态跨越日常起居和长期时间跨度，人物需要面对持续依赖与生活结构变化。',
    definition: '不是一次场景中的短暂固定，而是被故事明确设定为长期、无明确解除期或近似永久的拘束状态。',
    segmentIds: ['fb-src-000213-seg-00016']
  },
  'rag.restraint.effect.tickling': {
    summary: '挠痒通过持续触碰造成不由自主的躲闪、紧绷和注意力转移。',
    definition: '以痒感和身体反射为核心的刺激效果；在受限场景中，角色往往无法避开刺激位置。',
    segmentIds: ['fb-src-000064-seg-00113']
  },
  'rag.restraint.material.glue': {
    summary: '胶水在虚构场景中可用于封合或固定，使原本可分开的部位暂时失去独立活动。',
    definition: '以黏合效果限制开合或相对移动的材料概念；具体安全性与解除方式必须由采用它的故事另行说明。',
    segmentIds: ['fb-src-000063-seg-00004']
  },
  'rag.restraint.material.spider-silk': {
    summary: '蛛丝常表现为可喷射、可铺展并能把人物固定到环境表面的黏性材料。',
    definition: '由蜘蛛或类蛛生物产生的丝状材料，在虚构场景中承担缠绕、结网和环境固定功能。',
    segmentIds: ['fb-src-000033-seg-00223']
  },
  'rag.restraint.material.tentacle': {
    summary: '触手兼具主动移动与缠绕能力，可随人物动作改变固定位置和受限范围。',
    definition: '由生物或拟生装置形成的可动条状结构；与普通绳索的区别在于它能主动追随、收紧或重新分配固定点。',
    segmentIds: ['fb-src-000006-seg-00006', 'fb-src-000012-seg-00069']
  },
  'rag.restraint.state.confinement': {
    summary: '监禁限制人物离开特定空间，并把时间、看守和出入口控制纳入持续状态。',
    definition: '人物被阻止离开指定房间、设施或区域的状态；它可以与器具拘束并存，但核心是退出权被控制。',
    segmentIds: ['fb-src-000097-seg-00002', 'fb-src-000150-seg-00015']
  },
  'rag.restraint.tool.cable-tie': {
    summary: '扎带是轻便的条状固定件，常用于快速形成不可直接回退的收紧状态。',
    definition: '通过单向锁止结构保持收紧的固定件；知识卡只记录其叙事功能，不提供操作步骤。',
    segmentIds: ['fb-src-000107-seg-00008']
  },
  'rag.restraint.tool.chain': {
    summary: '锁链既能连接人物与固定点，也能通过长度直接限定可移动范围。',
    definition: '由连续金属环节构成的连接材料；在场景中常承担牵引、环境固定或多部位联结。',
    segmentIds: ['fb-src-000017-seg-00051', 'fb-src-000022-seg-00004']
  },
  'rag.restraint.tool.handcuffs': {
    summary: '手铐以腕部铐环和中间连接限制双手相对位置，也可分别连接环境固定点。',
    definition: '作用于手腕的成对铐具；它描述器具类别，不等同于某一种具体姿态。',
    segmentIds: ['fb-src-000001-seg-00003', 'fb-src-000007-seg-00004']
  },
  'rag.restraint.tool.leg-irons': {
    summary: '脚镣通过踝部铐环和连接长度限制步幅，并产生清晰的移动反馈。',
    definition: '作用于脚踝的成对铐具；主要改变行走范围和节奏，不自动决定上身姿态。',
    segmentIds: ['fb-src-000007-seg-00004', 'fb-src-000013-seg-00014']
  },
  'rag.restraint.tool.shackles': {
    summary: '镣铐是手铐、脚镣及连体铐等金属铐具的上位类别。',
    definition: '以铐环和连接件限制肢体相对活动的金属器具总称；具体作用部位由下位条目说明。',
    segmentIds: ['fb-src-000001-seg-00044', 'fb-src-000025-seg-00063']
  },
  'rag.restraint.tool.straitjacket': {
    summary: '拘束衣以衣物结构包覆躯干和手臂，使四肢活动范围随整体闭合而缩小。',
    definition: '依靠衣物包覆和固定结构限制上身或全身动作的器具类别。',
    segmentIds: ['fb-src-000013-seg-00010', 'fb-src-000033-seg-00038']
  }
}));

const segmentById = new Map(
  fs.readdirSync(segmentRoot)
    .filter((file) => file.endsWith('.json'))
    .flatMap((file) => JSON.parse(fs.readFileSync(path.join(segmentRoot, file), 'utf8')))
    .map((segment) => [segment.segmentId, segment])
);

let changed = 0;
for (const file of fs.readdirSync(cardRoot).filter((name) => name.endsWith('.json'))) {
  const filePath = path.join(cardRoot, file);
  const card = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  const parentCardId = parentByCardId.get(card.cardId);
  card.ragLayer = parentCardId ? 'concept' : 'category';
  card.parentCardIds = parentCardId ? [parentCardId] : [];

  const evidence = evidenceByCardId.get(card.cardId);
  if (evidence) {
    card.summary = evidence.summary;
    card.definition = evidence.definition;
    if (card.cardType === 'term' && !Array.isArray(card.distinctions)) card.distinctions = [];
    card.sourceRefs = evidence.segmentIds.map((segmentId) => {
      const segment = segmentById.get(segmentId);
      if (!segment) throw new Error(`Missing segment ${segmentId} for ${card.cardId}`);
      return {
        sourceId: segment.sourceId,
        segmentId: segment.segmentId,
        sourcePath: segment.sourcePath,
        startLine: segment.startLine,
        endLine: segment.endLine
      };
    });
    card.evidenceStatus = card.sourceRefs.length >= 2 ? 'supported' : 'partial';
    card.contentStatus = 'complete';
    card.reviewStatus = 'candidate';
  }

  fs.writeFileSync(filePath, `${JSON.stringify(card, null, 2)}\n`, 'utf8');
  changed += 1;
}

console.log(JSON.stringify({
  changed,
  layeredConcepts: parentByCardId.size,
  enrichedFromSources: evidenceByCardId.size
}, null, 2));
