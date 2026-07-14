export interface MapPanelAction {
  actionId: string;
  label: string;
  description?: string;
  resultNotification?: {
    text: string;
    type?: string;
  };
  choices?: MapPanelActionChoice[];
}

export interface MapPanelActionChoice {
  id: string;
  label: string;
  playerPortraitKey?: string;
  appendPlayerStatus?: string[];
  resultNotification?: {
    text: string;
    type?: string;
  };
}

const mapPanelActionsByMapId: Record<string, MapPanelAction[]> = {
  liluo_room: [
    {
      actionId: 'self_bind_liluo_room',
      label: '自缚',
      description: '在自己的房间里，整理拘束用具，准备进入只属于璃落的小练习。',
      choices: [
        {
          id: 'japanese_binding',
          label: '日式捆绑',
          playerPortraitKey: 'portrait_liluo_japanese_binding',
          appendPlayerStatus: ['hands_bound'],
          resultNotification: {
            text: '璃落完成了日式捆绑，双手已经被牢牢束住。',
            type: 'gain'
          }
        }
      ]
    }
  ]
};

export function resolveMapPanelActions(mapId: string): MapPanelAction[] {
  return mapPanelActionsByMapId[mapId] ?? [];
}
