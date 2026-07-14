export interface DialoguePortraitData {
  key: string;
  src?: string;
  layers?: ReadonlyArray<DialoguePortraitLayerData>;
  backLayers?: ReadonlyArray<DialoguePortraitLayerData>;
  alt?: string;
  statusText?: string;
}

export interface DialoguePortraitLayerData {
  key: string;
  src: string;
  alt?: string;
  keywords?: string[];
  motionGroup?: PortraitMotionGroup;
  motionPreset?: PortraitMotionPreset;
  zIndex?: number;
}

export interface PortraitLayerSource {
  path: string;
  src: string;
}

export interface PortraitLayerSet {
  layers: DialoguePortraitLayerData[];
  backLayers: DialoguePortraitLayerData[];
}

export interface PortraitLayerOption extends DialoguePortraitLayerData {
  keywords: string[];
  hasBackLayer: boolean;
}

export interface PortraitPreset {
  id: string;
  portraitKey: string;
  characterId: string;
  layerKeys: string[];
}

export type PortraitMotionGroup =
  | 'base'
  | 'upperBody'
  | 'lowerBody'
  | 'feet'
  | 'head'
  | 'hair'
  | 'expression'
  | 'accessory'
  | 'upperClothing'
  | 'lowerClothing'
  | 'binding';

export type PortraitMotionPreset =
  | 'idle'
  | 'softStruggle'
  | 'tightStruggle'
  | 'hairSway'
  | 'fixed';
