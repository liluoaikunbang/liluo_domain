import autoFootTicklerIconUrl from '../../../assets/game/bondage_items/自动挠脚器.png';
import { resolveCgContentWarnings } from './cgMetadata';
import { resolveCgVariantDisplayMode } from './cgVariantRules';
import sceneGallery from './sceneGallery.json';

const sceneImageModules = import.meta.glob('../../../assets/game/scenes/*.{png,jpg,jpeg,webp}', {
  eager: true,
  import: 'default'
});

const cgImageModules = import.meta.glob('../../../assets/game/cg/*.{png,jpg,jpeg,webp}', {
  eager: true,
  import: 'default'
});

function getAssetFileName(assetPath) {
  return assetPath.split('/').pop() ?? assetPath;
}

function getCgBaseName(fileName) {
  return fileName.replace(/\.[^.]+$/, '');
}

function parseCgAssetName(baseName) {
  const variantMatch = baseName.match(/^(.*?)[（(]([^（）()]+)[）)]$/);
  if (!variantMatch) {
    return {
      regularName: baseName,
      variantLabel: '基础',
      hasVariantLabel: false
    };
  }

  const regularName = variantMatch[1].trim();
  const variantLabel = variantMatch[2].trim();

  return {
    regularName: regularName || baseName,
    variantLabel: variantLabel || '差分',
    hasVariantLabel: Boolean(regularName && variantLabel)
  };
}

function resolveCgDescription(regularName) {
  const descriptions = {
    '黑帮卧底-自愿认罪':
      '璃落以太妹身份潜入黑帮，却在行动前夜被特别调查科误认为涉案人员。审讯室里的“自愿认罪书”已经摆在一旁，而她真正的身份仍无人知晓。',
    '峡流放逐': '璃落被村寨锁入小舟，投入峡谷激流。',
    '镜头营业-舞蹈教室-人体五角星':
      '最近网络上常见的人体五角星姿势看起来很有趣，于是璃落也复刻摆拍了一张。捆绑当然不能少，这次选用了扎带固定手脚。拍摄结束后璃落测试了一下，扎带很结实，是她自己逃不出来的水平。'
  };

  return descriptions[regularName] ?? `${regularName} 的 CG 回看。`;
}

function resolveCgWorldKey(regularName) {
  const worldKeyMap = {
    '抱石之刑': 'ancient',
    '玩偶笼车': 'apocalypse'
  };

  return worldKeyMap[regularName] ?? 'urban';
}

function createSceneLocations() {
  const sceneImagesByFileName = new Map(
    Object.entries(sceneImageModules).map(([assetPath, imageUrl]) => [getAssetFileName(assetPath), imageUrl])
  );

  return sceneGallery.locations
    .map((location) => {
      const scenes = location.scenes
        .map((scene) => ({
          ...scene,
          image: sceneImagesByFileName.get(scene.fileName) ?? ''
        }))
        .filter((scene) => scene.image);
      const defaultScene = scenes.find((scene) => scene.key === location.defaultScene) ?? scenes[0];

      return {
        key: `codex-scene-location-${location.key}`,
        title: location.title,
        summary: location.summary,
        description: location.description,
        defaultScene: defaultScene?.key ?? '',
        image: defaultScene?.image ?? '',
        scenes
      };
    })
    .filter((location) => location.image && location.scenes.length > 0);
}

function createCgSlotsFromAssets() {
  const cgEntriesByName = new Map();

  Object.entries(cgImageModules).forEach(([assetPath, imageUrl]) => {
    const fileName = getAssetFileName(assetPath);
    const baseName = getCgBaseName(fileName);
    const { regularName, variantLabel, hasVariantLabel } = parseCgAssetName(baseName);
    const entry = cgEntriesByName.get(regularName) ?? {
      key: `codex-cg-${regularName}`,
      title: regularName,
      summary: '已收录',
      description: resolveCgDescription(regularName),
      worldKey: resolveCgWorldKey(regularName),
      contentWarnings: resolveCgContentWarnings(regularName),
      image: '',
      variants: []
    };

    entry.variants.push({
      key: `codex-cg-${regularName}-${baseName}`,
      label: variantLabel,
      image: imageUrl,
      fileName,
      displayMode: resolveCgVariantDisplayMode(baseName),
      isDefault: !hasVariantLabel
    });

    cgEntriesByName.set(regularName, entry);
  });

  return Array.from(cgEntriesByName.values())
    .map((entry) => {
      entry.variants.sort((a, b) => {
        if (a.isDefault !== b.isDefault) {
          return a.isDefault ? -1 : 1;
        }

        return a.label.localeCompare(b.label, 'zh-Hans-CN');
      });
      entry.image = entry.variants[0]?.image ?? '';
      entry.variants = entry.variants.map((variant) => {
        if (variant.displayMode !== 'layer') {
          return variant;
        }

        return {
          ...variant,
          layerImages: [entry.image, variant.image]
        };
      });
      entry.summary = entry.variants.length > 1 ? `${entry.variants.length} 个差分` : '已收录';
      return entry;
    })
    .filter((entry) => entry.image)
    .sort((a, b) => a.title.localeCompare(b.title, 'zh-Hans-CN'));
}

const cgGallerySlots = createCgSlotsFromAssets();
const sceneGallerySlots = createSceneLocations();

export const codexWorldOptions = [
  { key: 'all', label: '全部' },
  { key: 'urban', label: '都市' },
  { key: 'apocalypse', label: '末日' },
  { key: 'ancient', label: '古风' },
  { key: 'munika', label: '慕妮卡' },
  { key: 'fantasy', label: '魔幻' }
];

export const menuTabs = [
  {
    key: 'character',
    label: '人物',
    title: '璃落',
    description: '查看当前人物详情、状态、资源与冒险中的身体表现。'
  },
  {
    key: 'map',
    label: '地图',
    title: '当前地图',
    description: '查看当前位置所在的地图层级与全图概览。'
  },
  {
    key: 'items',
    label: '物品',
    title: '物品栏正在准备中',
    description: '之后可用于查看普通物品、关键道具与探索收集内容。'
  },
  {
    key: 'skills',
    label: '技能',
    title: '技能栏正在准备中',
    description: '之后可在这里承接角色技能、被动效果与战斗外能力展示。'
  },
  {
    key: 'equipment',
    label: '装备',
    title: '装备栏正在准备中',
    description: '之后可用于查看武器、防具、饰品与冒险中获得的可装备物。'
  },
  {
    key: 'quests',
    label: '任务',
    title: '任务栏正在准备中',
    description: '之后可用于整理主线、支线、地点线索与当前推进目标。'
  },
  {
    key: 'story',
    label: '大纲',
    title: '故事与玩法大纲',
    description: '查看故事结构、玩法总表以及两者之间的关联。'
  },
  {
    key: 'codex',
    label: '图鉴',
    title: '旅途图鉴',
    description: '收纳 CG、职业/技能、物品与装备等冒险记录。'
  },
  {
    key: 'save',
    label: '存档',
    title: '保存当前进度',
    description: '把人物状态、地图与坐标暂存在浏览器本机。'
  },
  {
    key: 'load',
    label: '读档',
    title: '读取暂存进度',
    description: '从浏览器暂存或本地 JSON 恢复冒险进度。'
  },
  {
    key: 'settings',
    label: '设置',
    title: '设置栏正在准备中',
    description: '之后可继续扩展音量、按键、显示效果与辅助选项。'
  }
];

export const placeholderItemDetailParagraphs = [
  '这里是物品详情的占位段落。之后可以记录它的获得地点、相关角色、第一次发现它时的场景，以及它为什么会留在背包里。',
  '第二段预留给具体效果。等真实物品系统接入后，可以写恢复、解锁、调查、交付、消耗次数等信息，也可以写成更偏叙事的说明。',
  '第三段预留给探索线索。比如它指向哪扇门、哪条小路、哪段对话，或者玩家在某个地图里再次看到它时会产生什么联想。',
  '第四段用来撑开详情框，测试滚动条是否只出现在详情区域内部，而不会把整个菜单面板一起挤高。'
];
export const placeholderSkillDetailParagraphs = [
  '这里是技能详情的占位段落。之后可以记录学习条件、技能表现、触发方式，以及它如何帮助角色在地图中继续冒险。',
  '第二段预留给规则描述。真实技能接入后，可以写冷却、消耗、范围、持续时间，也可以写它对调查、移动、交互或事件选择的影响。',
  '第三段预留给叙事说明。比如技能来自哪段经历、和哪个角色有关，或者它怎样体现璃落当前阶段的成长。',
  '第四段用来撑开详情框，测试滚动条是否只在详情区域内部滚动，避免长文本压缩上方的条目列表。'
];
export const placeholderEquipmentDetailParagraphs = [
  '这里是装备详情的占位段落。之后可以记录装备来源、适用角色、基础属性，以及它第一次出现时对应的地点或事件。',
  '第二段预留给穿戴效果。真实装备系统接入后，可以写攻击、防御、移动、探索、事件判定等影响。',
  '第三段预留给外观与记忆点。比如装备会怎样改变角色外观、和哪段剧情有关，或它为什么会留在旅途中。',
  '第四段用来测试详情栏滚动，让长说明停留在右下区域内部，不挤压上方的装备列表。'
];
export const placeholderRestraintDetailParagraphs = [
  '这里是拘束详情的占位段落。之后可以记录拘束来源、适用角色、基础状态，以及它第一次出现时对应的地点或事件。',
  '第二段预留给穿戴效果。真实拘束系统接入后，可以写行动限制、探索影响、事件判定与解除条件等内容。',
  '第三段预留给外观与记忆点。比如拘束会怎样改变立绘预览、和哪段剧情有关，或它为什么会留在旅途中。',
  '第四段用来测试详情栏滚动，让长说明停留在右下区域内部，不挤压上方的拘束列表。'
];
export const placeholderQuestDetailParagraphs = [
  '这里是任务详情的占位段落。之后可以记录触发地点、相关角色、当前目标，以及下一步应该回到哪张地图继续探索。',
  '第二段预留给任务阶段。真实任务接入后，可以写已发现的线索、仍未确认的地点、可选分支和完成条件。',
  '第三段预留给剧情回忆。比如这件事第一次发生时的对话、场景氛围，或它为什么值得被放进旅途记录。'
];
export const placeholderCodexDetailParagraphs = [
  '这里是图鉴条目的占位段落。之后可以记录它的解锁地点、关联事件、出现条件，以及它在旅途里的意义。',
  '第二段预留给更具体的内容。真实图鉴接入后，可以写 CG 回看、职业成长、物品来源、装备来历或探索提示。',
  '第三段预留给记忆点。比如它第一次出现的地图氛围、相关角色反应，或玩家再次查看时应该得到的线索。'
];

function createPlaceholderSlot(key, title, summary) {
  return {
    key,
    title,
    summary,
    description: ''
  };
}

export const inventoryCategories = [
  {
    key: 'consumables',
    label: '消耗品',
    slots: [
      {
        key: 'placeholder-potion',
        title: '占位药剂',
        summary: '暂未获得',
        description: '这里预留物品详情段落。之后可以写恢复效果、获得地点、相关事件，或它在探索中的用途。'
      },
      {
        key: 'placeholder-food',
        title: '占位食物',
        summary: '暂未获得',
        description: '这里预留物品详情段落。之后可以写食物来源、恢复表现，以及和角色或地点相关的小记忆。'
      },
      {
        key: 'placeholder-tool',
        title: '占位探索道具',
        summary: '暂未获得',
        description: '这里预留物品详情段落。之后可以写它怎样帮助探索、触发互动，或打开新的地图路线。'
      },
      {
        key: 'placeholder-bottle',
        title: '占位瓶罐',
        summary: '暂未获得',
        description: '这里预留物品详情段落。之后可以写容器里装过什么、能保存什么，或它关联的场景线索。'
      },
      createPlaceholderSlot('placeholder-bandage', '占位绷带', '暂未获得'),
      createPlaceholderSlot('placeholder-candle', '占位烛火', '暂未获得'),
      createPlaceholderSlot('placeholder-map-piece', '占位地图碎片', '暂未获得'),
      createPlaceholderSlot('placeholder-sachet', '占位香囊', '暂未获得'),
      createPlaceholderSlot('placeholder-needle', '占位银针', '暂未获得'),
      createPlaceholderSlot('placeholder-ration', '占位干粮', '暂未获得')
    ]
  },
  {
    key: 'materials',
    label: '材料',
    slots: [
      {
        key: 'placeholder-herb',
        title: '占位草药',
        summary: '暂未获得',
        description: '这里预留材料详情段落。之后可以写采集地点、用途配方，以及它和地图环境的关系。'
      },
      {
        key: 'placeholder-thread',
        title: '占位丝线',
        summary: '暂未获得',
        description: '这里预留材料详情段落。之后可以写来源、加工方式，以及它能修补或制作的物品。'
      },
      {
        key: 'placeholder-ore',
        title: '占位矿石',
        summary: '暂未获得',
        description: '这里预留材料详情段落。之后可以写矿石产地、稀有度，以及对应的锻造或交换用途。'
      },
      {
        key: 'placeholder-wood',
        title: '占位木料',
        summary: '暂未获得',
        description: '这里预留材料详情段落。之后可以写采集方式、适用场景，以及它能开启的制作内容。'
      },
      createPlaceholderSlot('placeholder-cloth', '占位布料', '暂未获得'),
      createPlaceholderSlot('placeholder-powder', '占位粉末', '暂未获得'),
      createPlaceholderSlot('placeholder-crystal-dust', '占位晶尘', '暂未获得'),
      createPlaceholderSlot('placeholder-feather', '占位羽片', '暂未获得')
    ]
  },
  {
    key: 'valuables',
    label: '贵重物品',
    slots: [
      {
        key: 'placeholder-key',
        title: '占位钥匙',
        summary: '暂未获得',
        description: '这里预留物品详情段落。之后可以写钥匙对应的门、获得经过，以及它带来的探索方向。'
      },
      {
        key: 'placeholder-token',
        title: '占位信物',
        summary: '暂未获得',
        description: '这里预留物品详情段落。之后可以写它来自谁、象征什么，以及它在剧情中的分量。'
      },
      {
        key: 'placeholder-letter',
        title: '占位信件',
        summary: '暂未获得',
        description: '这里预留物品详情段落。之后可以写信件摘要、署名、地点线索，或可回看的正文片段。'
      },
      {
        key: 'placeholder-relic',
        title: '占位遗物',
        summary: '暂未获得',
        description: '这里预留物品详情段落。之后可以写它留下的痕迹、所属地点，以及背后的世界观信息。'
      },
      createPlaceholderSlot('placeholder-seal', '占位印章', '暂未获得'),
      createPlaceholderSlot('placeholder-broken-ring', '占位断戒', '暂未获得'),
      createPlaceholderSlot('placeholder-old-photo', '占位旧照片', '暂未获得'),
      createPlaceholderSlot('placeholder-door-tag', '占位门牌', '暂未获得'),
      createPlaceholderSlot('placeholder-ribbon', '占位丝带', '暂未获得'),
      createPlaceholderSlot('placeholder-archive', '占位档案', '暂未获得')
    ]
  },
  {
    key: 'restraints',
    label: '拘束',
    slots: [
      {
        key: 'codex-restraint-auto-foot-tickler',
        title: '自动挠脚器',
        summary: '拘束道具',
        iconUrl: autoFootTicklerIconUrl,
        description: '这里预留自动挠脚器详情段落。之后可以写获得地点、启动方式、解除条件，以及它在事件中的表现。'
      },
      {
        key: 'placeholder-restraint-rope',
        title: '占位绳索',
        summary: '暂未获得',
        description: '这里预留拘束道具详情段落。之后可以写材质、获得地点、对应事件，以及它在探索或剧情中的限制效果。'
      },
      {
        key: 'placeholder-restraint-cuffs',
        title: '占位手铐',
        summary: '暂未获得',
        description: '这里预留拘束道具详情段落。之后可以写开锁条件、触发来源、解除方式，以及它和角色状态的关系。'
      },
      {
        key: 'placeholder-restraint-shackles',
        title: '占位脚镣',
        summary: '暂未获得',
        description: '这里预留拘束道具详情段落。之后可以写移动影响、声音反馈、地图互动限制，或对应场景记忆。'
      },
      {
        key: 'placeholder-restraint-gag',
        title: '占位口枷',
        summary: '暂未获得',
        description: '这里预留拘束道具详情段落。之后可以写对话限制、解除条件、关联角色，或它在事件选择中的表现。'
      },
      createPlaceholderSlot('placeholder-restraint-blindfold', '占位眼罩', '暂未获得'),
      createPlaceholderSlot('placeholder-restraint-mittens', '占位束手套', '暂未获得'),
      createPlaceholderSlot('placeholder-restraint-leg-bag', '占位束脚套', '暂未获得'),
      createPlaceholderSlot('placeholder-restraint-suit', '占位拘束衣', '暂未获得')
    ]
  }
];

export const skillCategories = [
  {
    key: 'career',
    label: '职业技能',
    slots: [
      {
        key: 'placeholder-career-attack',
        title: '占位职业技一',
        summary: '暂未习得',
        description: '这里预留技能详情段落。之后可以写技能效果、发动条件、学习方式，以及它在冒险中的表现。'
      },
      {
        key: 'placeholder-career-growth',
        title: '占位职业技二',
        summary: '暂未习得',
        description: '这里预留技能详情段落。之后可以写成长变化、解锁节点，以及它怎样改变探索或事件选择。'
      },
      {
        key: 'placeholder-career-trait',
        title: '占位职业特性',
        summary: '暂未习得',
        description: '这里预留技能详情段落。之后可以写被动倾向、触发场景，以及它和角色成长的关系。'
      },
      {
        key: 'placeholder-career-ultimate',
        title: '占位高阶职业技',
        summary: '暂未习得',
        description: '这里预留技能详情段落。之后可以写高阶能力的来历、限制，以及关键剧情中的使用感。'
      },
      createPlaceholderSlot('placeholder-career-dodge', '占位闪避技', '暂未习得'),
      createPlaceholderSlot('placeholder-career-focus', '占位专注技', '暂未习得'),
      createPlaceholderSlot('placeholder-career-guard', '占位守势技', '暂未习得'),
      createPlaceholderSlot('placeholder-career-link', '占位连携技', '暂未习得'),
      createPlaceholderSlot('placeholder-career-mark', '占位标记技', '暂未习得'),
      createPlaceholderSlot('placeholder-career-echo', '占位回响技', '暂未习得')
    ]
  },
  {
    key: 'subCareer',
    label: '副职业技能',
    slots: [
      {
        key: 'placeholder-sub-craft',
        title: '占位制作技能',
        summary: '暂未习得',
        description: '这里预留技能详情段落。之后可以写制作内容、需要材料，以及它在地图互动中的用途。'
      },
      {
        key: 'placeholder-sub-gather',
        title: '占位采集技能',
        summary: '暂未习得',
        description: '这里预留技能详情段落。之后可以写可采集资源、适用地点，以及发现隐藏材料的方式。'
      },
      {
        key: 'placeholder-sub-support',
        title: '占位辅助技能',
        summary: '暂未习得',
        description: '这里预留技能详情段落。之后可以写辅助效果、持续方式，以及它怎样服务探索节奏。'
      },
      {
        key: 'placeholder-sub-special',
        title: '占位副职特技',
        summary: '暂未习得',
        description: '这里预留技能详情段落。之后可以写专属互动、触发事件，以及它带来的剧情分支。'
      },
      createPlaceholderSlot('placeholder-sub-repair', '占位修补技能', '暂未习得'),
      createPlaceholderSlot('placeholder-sub-cook', '占位料理技能', '暂未习得'),
      createPlaceholderSlot('placeholder-sub-light', '占位照明技能', '暂未习得'),
      createPlaceholderSlot('placeholder-sub-sense', '占位感知技能', '暂未习得'),
      createPlaceholderSlot('placeholder-sub-pack', '占位整理技能', '暂未习得'),
      createPlaceholderSlot('placeholder-sub-trace', '占位追踪技能', '暂未习得')
    ]
  },
  {
    key: 'general',
    label: '通用技能',
    slots: [
      {
        key: 'placeholder-general-move',
        title: '占位移动技能',
        summary: '暂未习得',
        description: '这里预留技能详情段落。之后可以写移动方式、可通过的地形，以及新区域如何被打开。'
      },
      {
        key: 'placeholder-general-search',
        title: '占位调查技能',
        summary: '暂未习得',
        description: '这里预留技能详情段落。之后可以写调查范围、能发现的线索，以及对应的事件反馈。'
      },
      {
        key: 'placeholder-general-talk',
        title: '占位交流技能',
        summary: '暂未习得',
        description: '这里预留技能详情段落。之后可以写对话影响、可触发角色，以及它改变选项的方式。'
      },
      {
        key: 'placeholder-general-survive',
        title: '占位生存技能',
        summary: '暂未习得',
        description: '这里预留技能详情段落。之后可以写环境适应、危险减免，以及长线探索中的作用。'
      },
      createPlaceholderSlot('placeholder-general-climb', '占位攀爬技能', '暂未习得'),
      createPlaceholderSlot('placeholder-general-listen', '占位聆听技能', '暂未习得'),
      createPlaceholderSlot('placeholder-general-hide', '占位隐匿技能', '暂未习得'),
      createPlaceholderSlot('placeholder-general-read', '占位解读技能', '暂未习得'),
      createPlaceholderSlot('placeholder-general-cross', '占位穿行技能', '暂未习得'),
      createPlaceholderSlot('placeholder-general-calm', '占位安抚技能', '暂未习得')
    ]
  }
];

export const codexCategories = [
  {
    key: 'cg',
    label: 'CG',
    slots: cgGallerySlots
  },
  {
    key: 'scenes',
    label: '场景',
    slots: sceneGallerySlots
  },
  {
    key: 'careerSkills',
    label: '职业/技能',
    description: '沉淀职业阶段、主动技能与被动能力。',
    slots: [
      {
        key: 'codex-career-adventurer',
        title: '冒险者',
        summary: '基础职业预留',
        description: '预留给璃落的基础冒险职业。之后可以记录职业定位、成长阶段与地图探索能力。'
      },
      {
        key: 'codex-skill-investigate',
        title: '调查',
        summary: '技能条目预留',
        description: '预留给调查类技能。之后可以记录它能发现的线索类型、触发范围与事件影响。'
      },
      createPlaceholderSlot('codex-skill-pathfinding', '寻路', '技能条目预留'),
      createPlaceholderSlot('codex-skill-focus', '专注', '技能条目预留')
    ]
  },
  {
    key: 'items',
    label: '物品',
    description: '整理旅途中发现、携带或具有线索价值的物品。',
    subcategories: inventoryCategories,
    slots: inventoryCategories[0]?.slots ?? []
  },
  {
    key: 'equipment',
    label: '装备',
    description: '记录武器、防具、饰品与可改变探索体验的装备。',
    slots: [
      {
        key: 'codex-equipment-wooden-sword',
        title: '木剑',
        summary: '装备条目预留',
        description: '预留给早期武器。之后可以记录基础属性、获得地点与首次使用事件。'
      },
      {
        key: 'codex-equipment-travel-coat',
        title: '旅人外套',
        summary: '装备条目预留',
        description: '预留给防具或外观装备。之后可以记录外观变化、穿戴效果与剧情关联。'
      },
      createPlaceholderSlot('codex-equipment-lantern', '提灯', '装备条目预留'),
      createPlaceholderSlot('codex-equipment-pendant', '吊坠', '装备条目预留')
    ]
  }
];

export const equipmentCategories = [
  {
    key: 'weapon',
    label: '武器',
    items: [
      createPlaceholderSlot('placeholder-wooden-sword', '占位木剑', '未装备'),
      createPlaceholderSlot('placeholder-rusty-blade', '占位旧刃', '暂未获得'),
      createPlaceholderSlot('placeholder-wand', '占位短杖', '暂未获得')
    ]
  },
  {
    key: 'offhand',
    label: '副手',
    items: [
      createPlaceholderSlot('placeholder-small-shield', '占位小盾', '未装备'),
      createPlaceholderSlot('placeholder-lantern', '占位提灯', '暂未获得'),
      createPlaceholderSlot('placeholder-notebook', '占位札记', '暂未获得')
    ]
  },
  {
    key: 'armor',
    label: '防具',
    items: [
      createPlaceholderSlot('placeholder-travel-coat', '占位旅人外套', '未装备'),
      createPlaceholderSlot('placeholder-soft-armor', '占位软甲', '暂未获得'),
      createPlaceholderSlot('placeholder-night-cloak', '占位夜色斗篷', '暂未获得'),
      createPlaceholderSlot('placeholder-guard-leggings', '占位护腿', '暂未获得')
    ]
  },
  {
    key: 'accessory',
    label: '饰品',
    items: [
      createPlaceholderSlot('placeholder-hairpin', '占位发饰', '未装备'),
      createPlaceholderSlot('placeholder-pendant', '占位吊坠', '暂未获得'),
      createPlaceholderSlot('placeholder-ring', '占位戒指', '暂未获得')
    ]
  }
];

export const restraintCategories = [
  {
    key: 'head',
    label: '头部',
    items: [
      createPlaceholderSlot('placeholder-blindfold', '占位眼罩', '未穿戴'),
      createPlaceholderSlot('placeholder-seal-ribbon', '占位封印发带', '暂未获得'),
      createPlaceholderSlot('placeholder-silent-veil', '占位静默面纱', '暂未获得')
    ]
  },
  {
    key: 'neck',
    label: '颈部',
    items: [
      createPlaceholderSlot('placeholder-collar', '占位项圈', '未穿戴'),
      createPlaceholderSlot('placeholder-neck-seal', '占位颈部咒印', '暂未获得'),
      createPlaceholderSlot('placeholder-lock-charm', '占位锁扣护符', '暂未获得')
    ]
  },
  {
    key: 'hands',
    label: '双手',
    items: [
      createPlaceholderSlot('placeholder-handcuffs', '占位手铐', '未穿戴'),
      createPlaceholderSlot('placeholder-wrist-ribbon', '占位腕缎', '暂未获得'),
      createPlaceholderSlot('placeholder-bound-gloves', '占位束缚手套', '暂未获得')
    ]
  },
  {
    key: 'body',
    label: '身体',
    items: [
      createPlaceholderSlot('placeholder-restraint-belt', '占位束带', '未穿戴'),
      createPlaceholderSlot('placeholder-sealed-dress', '占位封印衣', '暂未获得'),
      createPlaceholderSlot('placeholder-light-chain', '占位轻锁链', '暂未获得')
    ]
  },
  {
    key: 'legs',
    label: '双腿',
    items: [
      createPlaceholderSlot('placeholder-ankle-shackles', '占位脚镣', '未穿戴'),
      createPlaceholderSlot('placeholder-leg-rings', '占位腿环', '暂未获得'),
      createPlaceholderSlot('placeholder-binding-ribbon', '占位束缚缎带', '暂未获得')
    ]
  }
];

export const questSections = [
  {
    key: 'main',
    label: '主线任务',
    tasks: [
      {
        key: 'main-placeholder-journey',
        title: '占位主线任务',
        status: '进行中',
        categoryLabel: '主线任务',
        summary: '主线推进位预留，用于承接璃落当前必须面对的核心目标。',
        descriptionParagraphs: [
          '这里之后可以写主线任务的起点、当前阶段和下一个地图目标。',
          '当主线事件系统接入后，这里会显示更具体的线索、完成条件与剧情摘要。'
        ]
      }
    ]
  },
  {
    key: 'side',
    label: '支线任务',
    tasks: [
      {
        key: 'side-placeholder-trace',
        title: '占位支线任务',
        status: '未追踪',
        categoryLabel: '支线任务',
        summary: '支线任务位预留，用于记录地图探索时发现的小目标与地点线索。'
      }
    ]
  },
  {
    key: 'companions',
    label: '伙伴人物',
    tasks: [
      {
        key: 'companion-placeholder-bond',
        title: '占位伙伴任务',
        status: '待推进',
        categoryLabel: '伙伴人物',
        summary: '伙伴人物任务位预留，用于承接同伴关系、角色事件与个人剧情。'
      }
    ]
  },
  {
    key: 'completed',
    label: '已完成',
    groups: [
      {
        key: 'completed-main',
        label: '主线任务',
        tasks: [
          {
            key: 'completed-main-placeholder',
            title: '占位已完成主线',
            status: '已完成',
            categoryLabel: '已完成 / 主线任务',
            summary: '已完成主线任务位预留，用于回看完成后的关键剧情。'
          }
        ]
      },
      {
        key: 'completed-side',
        label: '支线任务',
        tasks: [
          {
            key: 'completed-side-placeholder',
            title: '占位已完成支线',
            status: '已完成',
            categoryLabel: '已完成 / 支线任务',
            summary: '已完成支线任务位预留，用于沉淀探索过程中的小事件。'
          }
        ]
      },
      {
        key: 'completed-companions',
        label: '伙伴人物',
        tasks: [
          {
            key: 'completed-companion-placeholder',
            title: '占位已完成伙伴事件',
            status: '已完成',
            categoryLabel: '已完成 / 伙伴人物',
            summary: '已完成伙伴任务位预留，用于回顾角色关系的阶段性结果。'
          }
        ]
      }
    ]
  }
];
