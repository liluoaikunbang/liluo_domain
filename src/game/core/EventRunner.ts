import { dialogueRegistry, eventRegistry } from '../data/registry';
import type { DialoguePortraitData } from '../data/dialoguePortraits';
import {
  executeEventActions,
  type EventExecutionContext,
  type NotificationExecutionData,
  type EventExecutionResult
} from './eventExecution';
import {
  resolveDialogueChoice,
  type DialogueChoiceExecutionData
} from './dialogueExecution';

export interface EventData {
  eventId: string;
  triggerType: string;
  dialogueId?: string;
  defaultPlayerPortraitRequired?: EventDefaultPlayerPortraitRequiredData;
  mapTransition?: EventMapTransitionData;
  timeOfDayChange?: EventTimeOfDayChangeData;
  weatherChange?: EventWeatherChangeData;
  playerPortraitChange?: EventPlayerPortraitChangeData;
  playerAppearanceChange?: EventPlayerAppearanceChangeData;
  playerStatusChange?: EventPlayerStatusChangeData;
  mapSessionFlagRequired?: EventMapSessionFlagRequiredData;
  zone?: EventZoneData;
  zones?: EventZoneData[];
  tileMarker?: EventTileMarkerData;
  tileMarkers?: EventTileMarkerData[];
  panelActions?: EventPanelActionData[];
}

export interface EventZoneData {
  mapId: string;
  tileX: number;
  tileY: number;
}

export interface EventTileMarkerData {
  mapId: string;
  layerName: string;
}

export interface EventPanelActionData {
  actionId: string;
  label: string;
  description?: string;
}

export interface EventMapTransitionData {
  mapId: string;
  spawnId?: string;
  spawnMarker?: EventMapTransitionSpawnMarkerData;
}

export interface EventMapTransitionSpawnMarkerData {
  layerName: string;
  anchor?: 'first' | 'top-left' | 'bottom-left' | 'center';
}

export interface EventDefaultPlayerPortraitRequiredData {
  fallbackDialogueId: string;
}

export interface EventTimeOfDayChangeData {
  timeOfDayId: string;
}

export interface EventWeatherChangeData {
  weatherId: string;
}

export interface EventPlayerPortraitChangeData {
  portraitKey: string;
}

export interface EventPlayerAppearanceChangeData {
  appearanceId: string;
}

export interface EventPlayerStatusChangeData {
  status: string[];
  mode?: 'set' | 'append' | 'remove';
}

export interface EventMapSessionFlagRequiredData {
  flagId: string;
  expected: boolean;
  fallbackDialogueId: string;
}

export interface DialogueCutsceneData {
  type: 'fade_message';
  text: string;
  holdMs?: number;
  fadeInMs?: number;
  fadeOutMs?: number;
}

export interface DialogueChoiceData extends DialogueChoiceExecutionData {
  label: string;
}

export interface DialogueSceneImageData {
  assetKey: string;
}

export interface DialogueNodeData {
  id: string;
  speaker?: string;
  speakerSide?: 'left' | 'right';
  npcPortrait?: DialoguePortraitData;
  sceneImage?: DialogueSceneImageData;
  text: string;
  next?: string;
  choices?: DialogueChoiceData[];
}

export interface DialogueSingleData {
  id: string;
  speaker?: string;
  speakerSide?: 'left' | 'right';
  npcPortrait?: DialoguePortraitData;
  sceneImage?: DialogueSceneImageData;
  text: string;
}

export interface DialogueBranchData {
  id: string;
  startNodeId?: string;
  npcPortrait?: DialoguePortraitData;
  sceneImage?: DialogueSceneImageData;
  nodes: Record<string, DialogueNodeData>;
}

export type DialogueData = DialogueSingleData | DialogueBranchData;

export interface DialoguePayload {
  id: string;
  nodeId: string;
  speaker?: string;
  speakerSide?: 'left' | 'right';
  npcPortrait?: DialoguePortraitData;
  sceneImage?: DialogueSceneImageData;
  text: string;
  choices: DialogueChoiceData[];
  canAdvance: boolean;
  entryCutscene?: DialogueCutsceneData;
}

export type EventAction = 'show_dialogue';

export class EventRunner {
  private dialogues: Record<string, DialogueData>;
  private events: Record<string, EventData>;

  constructor() {
    this.dialogues = dialogueRegistry as Record<string, DialogueData>;
    this.events = eventRegistry as Record<string, EventData>;
  }

  /**
   * 执行指定的事件
   * @param eventId 事件ID
   * @returns 返回对话数据，如果事件执行失败则返回 null
   */
  runEvent(eventId: string, context: EventExecutionContext = {}): EventExecutionResult {
    const event = this.events[eventId];
    
    if (!event) {
      console.error(`未找到事件: ${eventId}`);
      return {
        dialogue: null,
        didExecute: false
      };
    }

    return executeEventActions(event, context, {
      resolveDialogue: (dialogueId) => this.startDialogue(dialogueId)
    });
  }

  getEvent(eventId: string): EventData | null {
    return this.events[eventId] ?? null;
  }

  private getEventsForMapByTriggerType(mapId: string, triggerType: string): EventData[] {
    return Object.values(this.events).filter((event) => {
      if (event.triggerType !== triggerType) {
        return false;
      }

      const candidateZones = event.zones?.length ? event.zones : event.zone ? [event.zone] : [];
      const candidateTileMarkers = event.tileMarkers?.length
        ? event.tileMarkers
        : event.tileMarker
          ? [event.tileMarker]
          : [];

      return (
        candidateZones.some((zone) => zone.mapId === mapId) ||
        candidateTileMarkers.some((tileMarker) => tileMarker.mapId === mapId)
      );
    });
  }

  getManualEventsForMap(mapId: string): EventData[] {
    return this.getEventsForMapByTriggerType(mapId, 'manual');
  }

  /**
   * 进入对话的起始节点
   * @param dialogueId 对话ID
   * @returns 对话数据
   */
  startDialogue(dialogueId: string): DialoguePayload | null {
    return this.resolveDialogueNode(dialogueId);
  }

  advanceDialogue(dialogueId: string, nodeId: string): DialoguePayload | null {
    const node = this.getDialogueNode(dialogueId, nodeId);

    if (!node) {
      return null;
    }

    if (node.choices?.length) {
      console.warn(`对话节点 ${dialogueId}:${nodeId} 存在选项，不能直接继续。`);
      return null;
    }

    if (!node.next) {
      return null;
    }

    return this.resolveDialogueNode(dialogueId, node.next);
  }

  selectDialogueChoice(dialogueId: string, nodeId: string, choiceId: string): DialoguePayload | null {
    return this.selectDialogueChoiceWithContext(dialogueId, nodeId, choiceId);
  }

  selectDialogueChoiceWithContext(
    dialogueId: string,
    nodeId: string,
    choiceId: string,
    context: EventExecutionContext = {}
  ): DialoguePayload | null {
    const node = this.getDialogueNode(dialogueId, nodeId);

    if (!node) {
      return null;
    }

    const choice = resolveDialogueChoice(node, choiceId, context);

    if (!choice) {
      console.error(`未找到对话选项: ${dialogueId}:${nodeId}:${choiceId}`);
      return null;
    }

    if (!choice.next) {
      return null;
    }

    const nextDialogue = this.resolveDialogueNode(dialogueId, choice.next);

    if (!nextDialogue) {
      return null;
    }

    return {
      ...nextDialogue,
      entryCutscene: choice.cutscene
    };
  }

  private resolveDialogueNode(dialogueId: string, nodeId?: string): DialoguePayload | null {
    const dialogue = this.dialogues[dialogueId];
    const node = this.getDialogueNode(dialogueId, nodeId);

    if (!dialogue || !node) {
      return null;
    }

    const dialoguePortrait = 'nodes' in dialogue ? dialogue.npcPortrait : dialogue.npcPortrait;
    const dialogueSceneImage = 'nodes' in dialogue ? dialogue.sceneImage : dialogue.sceneImage;

    return {
      id: dialogueId,
      nodeId: node.id,
      speaker: node.speaker,
      speakerSide: node.speakerSide,
      npcPortrait: node.npcPortrait ?? dialoguePortrait,
      sceneImage: node.sceneImage ?? dialogueSceneImage,
      text: node.text,
      choices: node.choices ?? [],
      canAdvance: Boolean(node.next) && !(node.choices?.length)
    };
  }

  private getDialogueNode(dialogueId: string, nodeId?: string): DialogueNodeData | null {
    const dialogue = this.dialogues[dialogueId];

    if (!dialogue) {
      console.error(`未找到对话: ${dialogueId}`);
      return null;
    }

    if ('nodes' in dialogue) {
      const resolvedNodeId = nodeId ?? dialogue.startNodeId ?? Object.keys(dialogue.nodes)[0];
      const node = dialogue.nodes[resolvedNodeId];

      if (!node) {
        console.error(`未找到对话节点: ${dialogueId}:${resolvedNodeId}`);
        return null;
      }

      return node;
    }

    if (nodeId && nodeId !== 'start') {
      console.error(`单句对话 ${dialogueId} 不存在节点: ${nodeId}`);
      return null;
    }

    return {
      id: 'start',
      speaker: dialogue.speaker,
      speakerSide: dialogue.speakerSide,
      text: dialogue.text
    };
  }
}

// 创建单例实例
export const eventRunner = new EventRunner();
