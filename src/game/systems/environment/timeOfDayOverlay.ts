import * as Phaser from 'phaser';
import {
  MAX_ENVIRONMENT_OVERLAY_LAYER_COUNT,
  resolveTimeOfDayVisualConfig,
  resolveWeatherVisualConfig,
  type TimeOfDayOverlayLayerConfig,
  type TimeOfDayId,
  type WeatherId
} from '../../data/timeOfDay';
import {
  buildEnvironmentOverlayLayers,
  resolveEnvironmentStateChange,
  resolveEnvironmentTransitionDuration,
  resolveInitialEnvironmentState,
  type EnvironmentState
} from './environmentOverlayState';
import {
  createFogDriftState,
  updateFogDriftState,
  type FogDriftState
} from './fogLayer';

const TIME_OF_DAY_OVERLAY_DEPTH = 900;
const FOG_LAYER_DEPTH = TIME_OF_DAY_OVERLAY_DEPTH + MAX_ENVIRONMENT_OVERLAY_LAYER_COUNT + 0.5;
const RAIN_PARTICLE_DEPTH = TIME_OF_DAY_OVERLAY_DEPTH + MAX_ENVIRONMENT_OVERLAY_LAYER_COUNT + 1;
const RAIN_PARTICLE_COLOR = 0xdde9f7;
const RAIN_PARTICLE_COUNT_MIN = 40;
const RAIN_PARTICLE_COUNT_MAX = 140;
const RAIN_PARTICLE_DENSITY = 1 / 9000;
const FOG_PUFF_COLOR = 0xf6f8fb;

interface RainParticle {
  x: number;
  y: number;
  length: number;
  speed: number;
  drift: number;
  thickness: number;
  alpha: number;
}

interface OverlayLayerVisualState {
  color: number;
  alpha: number;
}

interface RainParticleVisualState {
  alpha: number;
}

interface FogVisualState {
  alpha: number;
}

export interface TimeOfDayOverlayController {
  getActiveEnvironmentState: () => EnvironmentState;
  getActiveTimeOfDayId: () => TimeOfDayId;
  getActiveWeatherId: () => WeatherId;
  setTimeOfDay: (timeOfDayId: string, options?: { duration?: number }) => boolean;
  setWeather: (weatherId: string, options?: { duration?: number }) => boolean;
  update: (delta: number) => void;
  syncToCameraViewport: () => void;
  destroy: () => void;
}

export function createTimeOfDayOverlayController(scene: Phaser.Scene): TimeOfDayOverlayController {
  const camera = scene.cameras.main;
  const overlays = Array.from({ length: MAX_ENVIRONMENT_OVERLAY_LAYER_COUNT }, (_, index) => {
    const rectangle = scene.add.rectangle(0, 0, 0, 0, 0xffffff, 1);

    rectangle.setScrollFactor(0);
    rectangle.setDepth(TIME_OF_DAY_OVERLAY_DEPTH + index);
    rectangle.setAlpha(0);

    return rectangle;
  });
  const rainParticleGraphics = scene.add.graphics();
  rainParticleGraphics.setScrollFactor(0);
  rainParticleGraphics.setDepth(RAIN_PARTICLE_DEPTH);
  const fogGraphics = scene.add.graphics();
  fogGraphics.setScrollFactor(0);
  fogGraphics.setDepth(FOG_LAYER_DEPTH);
  const overlayStates: OverlayLayerVisualState[] = overlays.map(() => ({
    color: 0xffffff,
    alpha: 0
  }));
  const rainParticleState: RainParticleVisualState = { alpha: 0 };
  const fogState: FogVisualState = { alpha: 0 };
  let rainParticles: RainParticle[] = [];
  let fogDriftState: FogDriftState = createFogDriftState(camera.width ?? scene.scale.width, camera.height ?? scene.scale.height);
  let activeEnvironmentState = resolveInitialEnvironmentState();
  let activeTweens: Phaser.Tweens.Tween[] = [];
  let activeCleanupTimer: Phaser.Time.TimerEvent | null = null;

  const getRainParticleCount = (viewportWidth: number, viewportHeight: number): number => {
    const estimatedCount = Math.round(viewportWidth * viewportHeight * RAIN_PARTICLE_DENSITY);

    return Phaser.Math.Clamp(estimatedCount, RAIN_PARTICLE_COUNT_MIN, RAIN_PARTICLE_COUNT_MAX);
  };

  const createRainParticle = (
    viewportWidth: number,
    viewportHeight: number,
    spawnFromTop: boolean
  ): RainParticle => {
    const spawnMargin = 48;

    return {
      x: Phaser.Math.Between(-spawnMargin, Math.max(spawnMargin, Math.ceil(viewportWidth + spawnMargin))),
      y: spawnFromTop
        ? Phaser.Math.Between(-Math.max(64, Math.ceil(viewportHeight)), 0)
        : Phaser.Math.Between(-spawnMargin, Math.max(spawnMargin, Math.ceil(viewportHeight))),
      length: Phaser.Math.Between(10, 18),
      speed: Phaser.Math.FloatBetween(460, 720),
      drift: Phaser.Math.FloatBetween(90, 160),
      thickness: Phaser.Math.FloatBetween(1, 1.8),
      alpha: Phaser.Math.FloatBetween(0.28, 0.62)
    };
  };

  const resetRainParticle = (
    particle: RainParticle,
    viewportWidth: number,
    viewportHeight: number
  ): void => {
    const spawnMargin = 48;

    particle.x = Phaser.Math.Between(-spawnMargin, Math.max(spawnMargin, Math.ceil(viewportWidth + spawnMargin)));
    particle.y = Phaser.Math.Between(-64, 0);
    particle.length = Phaser.Math.Between(10, 18);
    particle.speed = Phaser.Math.FloatBetween(460, 720);
    particle.drift = Phaser.Math.FloatBetween(90, 160);
    particle.thickness = Phaser.Math.FloatBetween(1, 1.8);
    particle.alpha = Phaser.Math.FloatBetween(0.28, 0.62);
  };

  const rebuildRainParticles = (viewportWidth: number, viewportHeight: number): void => {
    const nextParticleCount = getRainParticleCount(viewportWidth, viewportHeight);

    rainParticles = Array.from({ length: nextParticleCount }, () => createRainParticle(viewportWidth, viewportHeight, false));
  };

  const drawRainParticles = (): void => {
    rainParticleGraphics.clear();

    if (rainParticleState.alpha <= 0.01 || rainParticles.length === 0) {
      return;
    }

    rainParticles.forEach((particle) => {
      rainParticleGraphics.lineStyle(
        particle.thickness,
        RAIN_PARTICLE_COLOR,
        particle.alpha * rainParticleState.alpha
      );
      rainParticleGraphics.beginPath();
      rainParticleGraphics.moveTo(particle.x, particle.y);
      rainParticleGraphics.lineTo(particle.x + particle.drift * 0.045, particle.y + particle.length);
      rainParticleGraphics.strokePath();
    });
  };

  const drawFogLayer = (): void => {
    fogGraphics.clear();

    if (fogState.alpha <= 0.01 || fogDriftState.puffs.length === 0) {
      return;
    }

    fogDriftState.puffs.forEach((puff) => {
      fogGraphics.fillStyle(FOG_PUFF_COLOR, puff.alpha * fogState.alpha * 0.12);
      fogGraphics.fillEllipse(
        puff.x,
        puff.y,
        puff.radiusX * 4.2,
        puff.radiusY * 1.18
      );

      fogGraphics.fillStyle(FOG_PUFF_COLOR, puff.alpha * fogState.alpha * 0.1);
      fogGraphics.fillEllipse(
        puff.x - puff.radiusX * 0.18,
        puff.y + puff.radiusY * 0.02,
        puff.radiusX * 3.5,
        puff.radiusY * 0.88
      );

      fogGraphics.fillStyle(FOG_PUFF_COLOR, puff.alpha * fogState.alpha * 0.08);
      fogGraphics.fillEllipse(
        puff.x + puff.radiusX * 0.2,
        puff.y - puff.radiusY * 0.08,
        puff.radiusX * 3.1,
        puff.radiusY * 0.74
      );

      puff.lobes.forEach((lobe) => {
        fogGraphics.fillStyle(FOG_PUFF_COLOR, puff.alpha * fogState.alpha * lobe.alpha);
        fogGraphics.fillEllipse(
          puff.x + puff.radiusX * lobe.offsetX,
          puff.y + puff.radiusY * lobe.offsetY,
          puff.radiusX * 2 * lobe.scaleX,
          puff.radiusY * 2 * lobe.scaleY
        );
      });

      fogGraphics.fillStyle(FOG_PUFF_COLOR, puff.alpha * fogState.alpha * 0.08);
      fogGraphics.fillEllipse(
        puff.x + puff.radiusX * 0.06,
        puff.y + puff.radiusY * 0.1,
        puff.radiusX * 4.8,
        puff.radiusY * 0.68
      );
    });
  };

  const syncToCameraViewport = (): void => {
    const viewportX = camera.x ?? 0;
    const viewportY = camera.y ?? 0;
    const viewportWidth = camera.width ?? scene.scale.width;
    const viewportHeight = camera.height ?? scene.scale.height;

    overlays.forEach((overlay) => {
      overlay.setPosition(
        viewportX + viewportWidth / 2,
        viewportY + viewportHeight / 2
      );
      overlay.setSize(viewportWidth, viewportHeight);
      overlay.setDisplaySize(viewportWidth, viewportHeight);
    });

    fogGraphics.setPosition(viewportX, viewportY);
    rainParticleGraphics.setPosition(viewportX, viewportY);
    fogDriftState = createFogDriftState(viewportWidth, viewportHeight, fogDriftState.seed);
    drawFogLayer();
    rebuildRainParticles(viewportWidth, viewportHeight);
    drawRainParticles();
  };

  const stopActiveTweens = (): void => {
    if (activeCleanupTimer) {
      activeCleanupTimer.remove(false);
      activeCleanupTimer = null;
    }

    if (!activeTweens.length) {
      return;
    }

    overlays.forEach((overlay, index) => {
      overlayStates[index] = {
        color: typeof overlay.fillColor === 'number' ? overlay.fillColor : overlayStates[index].color,
        alpha: overlay.alpha
      };
    });
    activeTweens.forEach((tween) => tween.stop());
    activeTweens = [];
  };

  const normalizeLayerState = (layer: TimeOfDayOverlayLayerConfig | null): OverlayLayerVisualState => ({
    color: layer?.color ?? 0xffffff,
    alpha: layer?.alpha ?? 0
  });

  const applyEnvironmentStateChange = (
    change: { timeOfDayId?: string; weatherId?: string },
    options: { duration?: number } = {}
  ): boolean => {
    const nextEnvironmentState = resolveEnvironmentStateChange(activeEnvironmentState, change);
    const nextLayers = buildEnvironmentOverlayLayers(nextEnvironmentState)
      .slice(0, MAX_ENVIRONMENT_OVERLAY_LAYER_COUNT);
    const nextStates = overlays.map((_, index) => normalizeLayerState(nextLayers[index] ?? null));

    stopActiveTweens();

    const duration = options.duration
      ?? resolveEnvironmentTransitionDuration(activeEnvironmentState, nextEnvironmentState);
    const nextRainState: RainParticleVisualState = {
      alpha: nextEnvironmentState.weatherId === 'rain' ? 1 : 0
    };
    const nextFogState: FogVisualState = {
      alpha: nextEnvironmentState.weatherId === 'fog' ? 1 : 0
    };

    activeEnvironmentState = nextEnvironmentState;

    if (duration <= 0) {
      overlays.forEach((overlay, index) => {
        overlayStates[index] = nextStates[index];
        applyOverlayState(overlay, nextStates[index]);
      });

      rainParticleState.alpha = nextRainState.alpha;
      fogState.alpha = nextFogState.alpha;
      drawFogLayer();
      drawRainParticles();

      return true;
    }

    const overlayTweens = overlays.map((overlay, index) => {
      const currentState = { ...overlayStates[index] };
      const nextState = nextStates[index];

      return createOverlayTween(overlay, currentState, nextState, duration);
    });

    const rainTween = createRainTween(
      rainParticleState,
      { alpha: rainParticleState.alpha },
      nextRainState,
      duration
    );

    const fogTween = createFogTween(
      fogState,
      { alpha: fogState.alpha },
      nextFogState,
      duration
    );

    activeTweens = [...overlayTweens, rainTween, fogTween];

    activeCleanupTimer = scene.time.delayedCall(duration, () => {
      overlayStates.forEach((_, index) => {
        overlayStates[index] = nextStates[index];
      });
      rainParticleState.alpha = nextRainState.alpha;
      fogState.alpha = nextFogState.alpha;
      activeTweens = [];
      activeCleanupTimer = null;
    });

    return true;
  };

  const applyOverlayState = (
    overlay: Phaser.GameObjects.Rectangle,
    state: OverlayLayerVisualState,
    runtimeAlpha: number = state.alpha
  ): void => {
    overlay.setFillStyle(state.color, 1);
    overlay.setAlpha(runtimeAlpha);
  };

  const interpolateColor = (fromColor: number, toColor: number, progress: number): number => {
    const fromRed = (fromColor >> 16) & 0xff;
    const fromGreen = (fromColor >> 8) & 0xff;
    const fromBlue = fromColor & 0xff;
    const toRed = (toColor >> 16) & 0xff;
    const toGreen = (toColor >> 8) & 0xff;
    const toBlue = toColor & 0xff;

    const red = Math.round(fromRed + (toRed - fromRed) * progress);
    const green = Math.round(fromGreen + (toGreen - fromGreen) * progress);
    const blue = Math.round(fromBlue + (toBlue - fromBlue) * progress);

    return (red << 16) | (green << 8) | blue;
  };

  const createOverlayTween = (
    overlay: Phaser.GameObjects.Rectangle,
    currentState: OverlayLayerVisualState,
    nextState: OverlayLayerVisualState,
    duration: number
  ): Phaser.Tweens.Tween => {
    const tweenProgress = { value: 0 };

    return scene.tweens.add({
      targets: tweenProgress,
      value: 1,
      duration,
      ease: 'Sine.easeInOut',
      onUpdate: () => {
        const progress = tweenProgress.value;

        applyOverlayState(overlay, {
          color: interpolateColor(currentState.color, nextState.color, progress),
          alpha: currentState.alpha + (nextState.alpha - currentState.alpha) * progress
        });
      },
      onComplete: () => {
        applyOverlayState(overlay, nextState);
      }
    });
  };

  const createRainTween = (
    rainState: RainParticleVisualState,
    currentState: RainParticleVisualState,
    nextState: RainParticleVisualState,
    duration: number
  ): Phaser.Tweens.Tween => scene.tweens.add({
    targets: currentState,
    alpha: nextState.alpha,
    duration,
    ease: 'Sine.easeInOut',
    onUpdate: () => {
      rainState.alpha = currentState.alpha;
      drawRainParticles();
    },
    onComplete: () => {
      rainState.alpha = nextState.alpha;
      drawRainParticles();
    }
  });

  const createFogTween = (
    targetFogState: FogVisualState,
    currentState: FogVisualState,
    nextState: FogVisualState,
    duration: number
  ): Phaser.Tweens.Tween => scene.tweens.add({
    targets: currentState,
    alpha: nextState.alpha,
    duration,
    ease: 'Sine.easeInOut',
    onUpdate: () => {
      targetFogState.alpha = currentState.alpha;
      drawFogLayer();
    },
    onComplete: () => {
      targetFogState.alpha = nextState.alpha;
      drawFogLayer();
    }
  });

  const update = (delta: number): void => {
    if (fogState.alpha > 0.01 && fogDriftState.puffs.length > 0) {
      fogDriftState = updateFogDriftState(fogDriftState, {
        delta,
        viewportWidth: camera.width ?? scene.scale.width,
        viewportHeight: camera.height ?? scene.scale.height
      });
      drawFogLayer();
    }

    if (rainParticleState.alpha <= 0.01 || rainParticles.length === 0) {
      return;
    }

    const viewportWidth = camera.width ?? scene.scale.width;
    const viewportHeight = camera.height ?? scene.scale.height;
    const deltaScale = Math.max(delta, 0) / 1000;
    const horizontalMargin = 64;
    const verticalMargin = 32;

    rainParticles.forEach((particle) => {
      particle.x += particle.drift * deltaScale;
      particle.y += particle.speed * deltaScale;

      if (
        particle.y - particle.length > viewportHeight + verticalMargin
        || particle.x > viewportWidth + horizontalMargin
      ) {
        resetRainParticle(particle, viewportWidth, viewportHeight);
      }
    });

    drawRainParticles();
  };

  const setTimeOfDay = (timeOfDayId: string, options: { duration?: number } = {}): boolean => {
    const nextConfig = resolveTimeOfDayVisualConfig(timeOfDayId);

    if (!nextConfig) {
      console.error(`[TimeOfDayOverlay] 未找到时间配置: ${timeOfDayId}`);
      return false;
    }

    return applyEnvironmentStateChange({ timeOfDayId: nextConfig.id }, options);
  };

  const setWeather = (weatherId: string, options: { duration?: number } = {}): boolean => {
    const nextConfig = resolveWeatherVisualConfig(weatherId);

    if (!nextConfig) {
      console.error(`[TimeOfDayOverlay] 未找到天气配置: ${weatherId}`);
      return false;
    }

    return applyEnvironmentStateChange({ weatherId: nextConfig.id }, options);
  };

  syncToCameraViewport();

  return {
    getActiveEnvironmentState: () => ({ ...activeEnvironmentState }),
    getActiveTimeOfDayId: () => activeEnvironmentState.timeOfDayId,
    getActiveWeatherId: () => activeEnvironmentState.weatherId,
    setTimeOfDay,
    setWeather,
    update,
    syncToCameraViewport,
    destroy: () => {
      stopActiveTweens();
      fogGraphics.destroy();
      rainParticleGraphics.destroy();
      overlays.forEach((overlay) => overlay.destroy());
    }
  };
}