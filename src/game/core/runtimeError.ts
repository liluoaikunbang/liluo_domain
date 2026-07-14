import type * as Phaser from 'phaser';

export interface GameRuntimeError {
  id?: string;
  title: string;
  message: string;
  detail?: string;
  source?: string;
}

export type GameRuntimeErrorHandler = (error: GameRuntimeError) => void;

export function createLoaderErrorMessage(file: Phaser.Loader.File): string {
  const fileKey = String(file.key ?? 'unknown');
  const fileSource = Array.isArray(file.src) ? file.src.join(', ') : file.src;

  return fileSource ? `${fileKey} (${fileSource})` : fileKey;
}
