import { type GameAnimationBundle } from '../../animations';

export const liluoEstateAnimationBundle: GameAnimationBundle = [
  {
    key: 'portal_idle',
    textureKey: 'object_portal',
    frames: [
      'portal_frame_0',
      'portal_frame_1',
      'portal_frame_2',
      'portal_frame_3',
      'portal_frame_4',
      'portal_frame_5',
      'portal_frame_6',
      'portal_frame_7'
    ],
    frameRate: 8,
    repeat: -1,
    worldObject: {
      layerName: 'Portal',
      hideSourceLayer: true,
      depth: 8,
      originX: 0.5,
      originY: 0.5
    }
  }
];
