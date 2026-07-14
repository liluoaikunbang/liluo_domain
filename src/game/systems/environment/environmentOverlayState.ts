import {
  resolveTimeOfDayVisualConfig,
  resolveWeatherVisualConfig,
  type TimeOfDayId,
  type TimeOfDayOverlayLayerConfig,
  type WeatherId
} from '../../data/timeOfDay.ts';

export interface EnvironmentState {
  timeOfDayId: TimeOfDayId;
  weatherId: WeatherId;
}

export interface EnvironmentStateChange {
  timeOfDayId?: string;
  weatherId?: string;
}

const DEFAULT_ENVIRONMENT_STATE: EnvironmentState = {
  timeOfDayId: 'day',
  weatherId: 'clear'
};

export function resolveInitialEnvironmentState(
  initialState: Partial<EnvironmentState> = {}
): EnvironmentState {
  return {
    timeOfDayId: resolveTimeOfDayVisualConfig(initialState.timeOfDayId)?.id
      ?? DEFAULT_ENVIRONMENT_STATE.timeOfDayId,
    weatherId: resolveWeatherVisualConfig(initialState.weatherId)?.id
      ?? DEFAULT_ENVIRONMENT_STATE.weatherId
  };
}

export function resolveEnvironmentStateChange(
  currentState: EnvironmentState,
  change: EnvironmentStateChange
): EnvironmentState {
  return {
    timeOfDayId: resolveTimeOfDayVisualConfig(change.timeOfDayId)?.id ?? currentState.timeOfDayId,
    weatherId: resolveWeatherVisualConfig(change.weatherId)?.id ?? currentState.weatherId
  };
}

export function buildEnvironmentOverlayLayers(
  state: EnvironmentState
): TimeOfDayOverlayLayerConfig[] {
  const timeOfDayLayers = resolveTimeOfDayVisualConfig(state.timeOfDayId)?.overlayLayers ?? [];
  const weatherLayers = resolveWeatherVisualConfig(state.weatherId)?.overlayLayers ?? [];

  return [...timeOfDayLayers, ...weatherLayers].map((layer) => ({ ...layer }));
}

export function resolveEnvironmentTransitionDuration(
  currentState: EnvironmentState,
  nextState: EnvironmentState
): number {
  const durations = [
    resolveTimeOfDayVisualConfig(currentState.timeOfDayId)?.transitionDuration ?? 0,
    resolveTimeOfDayVisualConfig(nextState.timeOfDayId)?.transitionDuration ?? 0,
    resolveWeatherVisualConfig(currentState.weatherId)?.transitionDuration ?? 0,
    resolveWeatherVisualConfig(nextState.weatherId)?.transitionDuration ?? 0
  ];

  return Math.max(...durations);
}