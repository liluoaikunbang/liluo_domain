import type { DirectionPadGameDefinition } from '../../core/directionPadGame';

const liyinDirectionPadBackground = new URL(
  '../../../assets/game/backgrounds/Liluo_bed.png',
  import.meta.url
).href;

export const directionPadGameRegistry: Record<string, DirectionPadGameDefinition> = {
  liyin_direction_pad_test: {
    id: 'liyin_direction_pad_test',
    title: '庭院节拍',
    subtitle: '璃音的方向键测试',
    description: '跟着亮起的方向依次按下按键，确认这个小游戏模式可以从地图事件里启动。',
    backgroundSrc: liyinDirectionPadBackground,
    targetSequence: ['up', 'left', 'down', 'right', 'up', 'right']
  },
  liyin_direction_pad_rhythm_test: {
    id: 'liyin_direction_pad_rhythm_test',
    title: '庭院节拍・进阶',
    subtitle: '璃音的节奏方向键测试',
    description: '看准中间滚动的方向提示，在它靠近判定线时按下对应方向。',
    backgroundSrc: liyinDirectionPadBackground,
    mode: 'rhythm',
    rhythm: {
      leadInMs: 1200,
      noteSpacingMs: 760,
      hitWindowMs: 180,
      hitLinePercent: 68,
      travelMs: 2600
    },
    countdownDurationMs: 3000,
    targetSequence: ['up', 'left', 'down', 'right', 'up', 'right', 'left', 'down']
  }
};
