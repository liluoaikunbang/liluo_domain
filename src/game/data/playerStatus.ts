const barefootIconUrl = new URL('../../assets/game/states/barefoot.png', import.meta.url).href;
const blindfoldIconUrl = new URL('../../assets/game/states/blindfold.png', import.meta.url).href;
const cageIconUrl = new URL('../../assets/game/states/cage.png', import.meta.url).href;
const gagIconUrl = new URL('../../assets/game/states/gag.png', import.meta.url).href;
const noShoesIconUrl = new URL('../../assets/game/states/no_shoes.png', import.meta.url).href;
const tieArmIconUrl = new URL('../../assets/game/states/tie_arm.png', import.meta.url).href;
const tieLegIconUrl = new URL('../../assets/game/states/tie_leg.png', import.meta.url).href;

export interface PlayerStatusDefinition {
  id: string;
  label: string;
  description: string;
  functionInfo: string;
  iconUrl?: string;
}

export const defaultPlayerStatusLabel = '自由';

export const playerStatusDefinitions = [
  {
    id: 'no_shoes',
    label: '未穿鞋',
    description: '鞋子被剥走了，脚底只能直接踩在冷硬的地面上。粗糙的触感和隐隐的刺痛让步伐变得小心，行动也随之慢了下来。',
    functionInfo: '效果：移动速度降低 10%。',
    iconUrl: noShoesIconUrl
  },
  {
    id: 'barefoot',
    label: '赤脚',
    description: '连那点聊胜于无的袜子也没有了。赤裸的脚掌贴着地面，砂砾、木纹和冰冷石面都变得格外鲜明，行动也更加受限。',
    functionInfo: '效果：移动速度降低 5%。',
    iconUrl: barefootIconUrl
  },
  {
    id: 'hands_bound',
    label: '双手被缚',
    description: '双手被牢牢束住，许多动作都变得做不到了。奔跑和跳跃仍然勉强可行，只是少了手臂配合，身体总显得有些失衡。',
    functionInfo: '效果：移动速度降低 5%。',
    iconUrl: tieArmIconUrl
  },
  {
    id: 'legs_bound',
    label: '双腿被缚',
    description: '双腿被紧紧缚在一起，正常行走几乎已经不可能了。只剩下并腿跳动这种笨拙的移动方式，吃力，也很容易失去平衡。',
    functionInfo: '效果：移动速度降低 40%。',
    iconUrl: tieLegIconUrl
  },
  {
    id: 'muted',
    label: '禁言',
    description: '嘴被堵住后，清楚说话已经不可能了。声音被压在喉咙里，只剩下微弱含混的“呜呜”声。',
    functionInfo: '效果：待接入对话限制、呼救削弱与剧情分支。',
    iconUrl: gagIconUrl
  },
  {
    id: 'blind',
    label: '失明',
    description: '双眼被遮住后，前方的道路、危险和他人的动作都消失在黑暗里。方向只能依靠脚下触感、周围声音和一点记忆来判断。',
    functionInfo: '效果：视野范围缩小，自动寻路范围缩短至可见区域。',
    iconUrl: blindfoldIconUrl
  },
  {
    id: 'confined',
    label: '禁锢',
    description: '身体被固定在某处，连挪动位置都做不到。',
    functionInfo: '效果：无法移动，也无法自动寻路。',
    iconUrl: cageIconUrl
  }
] as const satisfies readonly PlayerStatusDefinition[];

const playerStatusDefinitionsById = new Map(
  playerStatusDefinitions.map((definition) => [definition.id, definition])
);

const playerStatusDefinitionsByLabel = new Map(
  playerStatusDefinitions.map((definition) => [definition.label, definition])
);

export function getPlayerStatusDefinition(statusId: string): PlayerStatusDefinition | null {
  return playerStatusDefinitionsById.get(statusId.trim()) ?? null;
}

export function normalizePlayerStatusList(statusList: ReadonlyArray<string>): string[] {
  const normalizedStatusIds: string[] = [];
  const seenStatusIds = new Set<string>();

  statusList.forEach((item) => {
    const statusText = item.trim();
    const definition = playerStatusDefinitionsById.get(statusText) ?? playerStatusDefinitionsByLabel.get(statusText);

    if (!definition || seenStatusIds.has(definition.id)) {
      return;
    }

    seenStatusIds.add(definition.id);
    normalizedStatusIds.push(definition.id);
  });

  return normalizedStatusIds;
}

export function resolvePlayerStatusLabel(statusId: string): string | null {
  return getPlayerStatusDefinition(statusId)?.label ?? null;
}

export function resolvePlayerStatusLabels(statusList: ReadonlyArray<string>): string[] {
  return normalizePlayerStatusList(statusList)
    .map((statusId) => resolvePlayerStatusLabel(statusId))
    .filter((label): label is string => Boolean(label));
}

export function resolvePlayerStatusDefinitions(statusList: ReadonlyArray<string>): PlayerStatusDefinition[] {
  return normalizePlayerStatusList(statusList)
    .map((statusId) => getPlayerStatusDefinition(statusId))
    .filter((definition): definition is PlayerStatusDefinition => Boolean(definition));
}
