export type GameLoadingPhase = 'boot' | 'map';

export interface GameLoadingProgress {
  phase: GameLoadingPhase;
  label: string;
  progress: number;
  isLoading: boolean;
  mapId?: string;
}

export type GameLoadingProgressHandler = (progress: GameLoadingProgress) => void;

export const LOADING_PROGRESS_DETAILS_DELAY_MS = 1000;

export function clampLoadingProgress(progress: number): number {
  if (!Number.isFinite(progress)) {
    return 0;
  }

  return Math.min(1, Math.max(0, progress));
}

export function shouldShowDetailedLoadingProgress(
  isLoading: boolean,
  elapsedMs: number,
  thresholdMs = LOADING_PROGRESS_DETAILS_DELAY_MS
): boolean {
  return isLoading && elapsedMs >= thresholdMs;
}
