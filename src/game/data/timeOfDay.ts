export type TimeOfDayId = 'day' | 'dusk' | 'night';
export type WeatherId = 'clear' | 'rain' | 'fog';

export interface TimeOfDayOverlayLayerConfig {
  color: number;
  alpha: number;
}

export interface TimeOfDayVisualConfig {
  id: TimeOfDayId;
  label: string;
  overlayLayers: TimeOfDayOverlayLayerConfig[];
  transitionDuration: number;
}

export interface WeatherVisualConfig {
  id: WeatherId;
  label: string;
  overlayLayers: TimeOfDayOverlayLayerConfig[];
  transitionDuration: number;
}

export const timeOfDayRegistry: Record<TimeOfDayId, TimeOfDayVisualConfig> = {
  day: {
    id: 'day',
    label: '白天',
    overlayLayers: [],
    transitionDuration: 300
  },
  dusk: {
    id: 'dusk',
    label: '黄昏',
    overlayLayers: [
      {
        color: 0xffa1b5,
        alpha: 0.2
      }
    ],
    transitionDuration: 700
  },
  night: {
    id: 'night',
    label: '夜晚',
    overlayLayers: [
      {
        color: 0x4a4f96,
        alpha: 0.33
      }
    ],
    transitionDuration: 800
  }
};

export const weatherRegistry: Record<WeatherId, WeatherVisualConfig> = {
  clear: {
    id: 'clear',
    label: '晴朗',
    overlayLayers: [],
    transitionDuration: 300
  },
  rain: {
    id: 'rain',
    label: '雨天',
    overlayLayers: [
      {
        color: 0x7a889d,
        alpha: 0.16
      },
      {
        color: 0x9db4cf,
        alpha: 0.08
      }
    ],
    transitionDuration: 750
  },
  fog: {
    id: 'fog',
    label: '雾天',
    overlayLayers: [
      {
        color: 0xb8bec7,
        alpha: 0.14
      },
      {
        color: 0xe4e7eb,
        alpha: 0.18
      }
    ],
    transitionDuration: 700
  }
};

const maxTimeOfDayOverlayLayerCount = Math.max(
  0,
  ...Object.values(timeOfDayRegistry).map((config) => config.overlayLayers.length)
);

const maxWeatherOverlayLayerCount = Math.max(
  0,
  ...Object.values(weatherRegistry).map((config) => config.overlayLayers.length)
);

export const MAX_ENVIRONMENT_OVERLAY_LAYER_COUNT = maxTimeOfDayOverlayLayerCount + maxWeatherOverlayLayerCount;

export function isTimeOfDayId(value: string): value is TimeOfDayId {
  return value in timeOfDayRegistry;
}

export function isWeatherId(value: string): value is WeatherId {
  return value in weatherRegistry;
}

export function resolveTimeOfDayVisualConfig(timeOfDayId: string | null | undefined): TimeOfDayVisualConfig | null {
  if (!timeOfDayId || !isTimeOfDayId(timeOfDayId)) {
    return null;
  }

  return timeOfDayRegistry[timeOfDayId];
}

export function resolveWeatherVisualConfig(weatherId: string | null | undefined): WeatherVisualConfig | null {
  if (!weatherId || !isWeatherId(weatherId)) {
    return null;
  }

  return weatherRegistry[weatherId];
}