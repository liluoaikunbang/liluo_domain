export interface FogLobe {
  offsetX: number;
  offsetY: number;
  scaleX: number;
  scaleY: number;
  alpha: number;
}

export interface FogPuff {
  x: number;
  y: number;
  radiusX: number;
  radiusY: number;
  speedX: number;
  speedY: number;
  alpha: number;
  lobes: FogLobe[];
}

export interface FogDriftState {
  seed: number;
  puffs: FogPuff[];
}

export interface FogDriftUpdateOptions {
  delta: number;
  viewportWidth: number;
  viewportHeight: number;
}

const FOG_PUFF_COUNT_MIN = 4;
const FOG_PUFF_COUNT_MAX = 16;
const FOG_PUFF_DENSITY = 1 / 85000;
const FOG_RESPAWN_VERTICAL_MARGIN = 24;
const FOG_LOBE_COUNT = 6;

function nextSeed(seed: number): number {
  return (seed * 1664525 + 1013904223) >>> 0;
}

function normalizeRandom(seed: number): number {
  return seed / 0xffffffff;
}

function randomBetween(seed: number, min: number, max: number): { seed: number; value: number } {
  const next = nextSeed(seed);

  return {
    seed: next,
    value: min + (max - min) * normalizeRandom(next)
  };
}

function createFogLobes(seed: number): { seed: number; lobes: FogLobe[] } {
  let next = seed;
  const lobes: FogLobe[] = [];

  for (let index = 0; index < FOG_LOBE_COUNT; index += 1) {
    const offsetXRandom = randomBetween(next, -0.78, 0.78);
    next = offsetXRandom.seed;
    const offsetYRandom = randomBetween(next, -0.16, 0.16);
    next = offsetYRandom.seed;
    const scaleXRandom = randomBetween(next, index < 4 ? 0.92 : 0.72, index < 4 ? 1.42 : 1.12);
    next = scaleXRandom.seed;
    const scaleYRandom = randomBetween(next, index < 4 ? 0.2 : 0.24, index < 4 ? 0.46 : 0.56);
    next = scaleYRandom.seed;
    const alphaRandom = randomBetween(next, 0.14, 0.34);
    next = alphaRandom.seed;

    lobes.push({
      offsetX: offsetXRandom.value,
      offsetY: offsetYRandom.value,
      scaleX: scaleXRandom.value,
      scaleY: scaleYRandom.value,
      alpha: alphaRandom.value
    });
  }

  return { seed: next, lobes };
}

function normalizeFogLobes(lobes: FogLobe[] | undefined, seed: number): { seed: number; lobes: FogLobe[] } {
  if (Array.isArray(lobes) && lobes.length >= 5) {
    return { seed, lobes };
  }

  return createFogLobes(seed);
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function getVisibleFogPuffs(puffs: FogPuff[], viewportWidth: number): FogPuff[] {
  return puffs.filter((puff) => puff.x + puff.radiusX > 0 && puff.x - puff.radiusX < viewportWidth);
}

function getVisibleFogSectors(puffs: FogPuff[], viewportWidth: number): Set<number> {
  return new Set(
    getVisibleFogPuffs(puffs, viewportWidth)
      .map((puff) => Math.max(0, Math.min(3, Math.floor((puff.x / viewportWidth) * 4))))
  );
}

function ensureFogCoverage(
  puffs: FogPuff[],
  viewportWidth: number,
  viewportHeight: number,
  seed: number
): { puffs: FogPuff[]; seed: number } {
  if (puffs.length < 3) {
    return { puffs, seed };
  }

  const visiblePuffs = getVisibleFogPuffs(puffs, viewportWidth);
  const visibleSectors = getVisibleFogSectors(puffs, viewportWidth);

  if (visiblePuffs.length >= 3 && visibleSectors.size >= 2) {
    return { puffs, seed };
  }

  const desiredBands = [0.22, 0.52, 0.78];
  const nextPuffs = [...puffs];
  let nextSeed = seed;
  let fallbackIndex = 0;
  const candidateIndices = nextPuffs
    .map((puff, index) => ({ puff, index }))
    .filter(({ puff }) => puff.x + puff.radiusX <= 0 || puff.x - puff.radiusX >= viewportWidth)
    .map(({ index }) => index);

  desiredBands.forEach((centerRatioX) => {
    const targetSector = Math.max(0, Math.min(3, Math.floor(centerRatioX * 4)));
    const hasSectorCoverage = getVisibleFogSectors(nextPuffs, viewportWidth).has(targetSector);

    if (hasSectorCoverage && getVisibleFogPuffs(nextPuffs, viewportWidth).length >= 3) {
      return;
    }

    const candidateIndex = candidateIndices.shift() ?? fallbackIndex;
    fallbackIndex = (candidateIndex + 1) % Math.max(1, nextPuffs.length);
    const targetPuff = nextPuffs[candidateIndex];

    if (!targetPuff) {
      return;
    }

    const respawned = createFogPuff(nextSeed, viewportWidth, viewportHeight, {
      preserveShape: {
        radiusX: targetPuff.radiusX,
        radiusY: targetPuff.radiusY,
        speedX: targetPuff.speedX,
        speedY: targetPuff.speedY,
        alpha: targetPuff.alpha,
        lobes: targetPuff.lobes
      },
      visibleBand: {
        centerRatioX,
        spreadX: viewportWidth * 0.12
      }
    });
    nextSeed = respawned.seed;
    nextPuffs[candidateIndex] = respawned.puff;
  });

  return {
    puffs: nextPuffs,
    seed: nextSeed
  };
}

function createFogPuff(
  seed: number,
  viewportWidth: number,
  viewportHeight: number,
  options: {
    preserveShape?: Pick<FogPuff, 'radiusX' | 'radiusY' | 'speedX' | 'speedY' | 'alpha' | 'lobes'>;
    visibleBand?: { centerRatioX: number; spreadX?: number };
  } = {}
): { seed: number; puff: FogPuff } {
  const preserveShape = options.preserveShape;
  let next = seed;
  const xRandom = randomBetween(next, 0, 1);
  next = xRandom.seed;
  const yRandom = randomBetween(next, -FOG_RESPAWN_VERTICAL_MARGIN, viewportHeight + FOG_RESPAWN_VERTICAL_MARGIN);
  next = yRandom.seed;

  const radiusXRandom = randomBetween(next, 150, 250);
  next = radiusXRandom.seed;
  const radiusYRandom = randomBetween(next, 34, 62);
  next = radiusYRandom.seed;
  const speedXRandom = randomBetween(next, 8, 22);
  next = speedXRandom.seed;
  const speedYRandom = randomBetween(next, -3, 3);
  next = speedYRandom.seed;
  const alphaRandom = randomBetween(next, 0.12, 0.22);
  next = alphaRandom.seed;

  const radiusX = preserveShape?.radiusX ?? radiusXRandom.value;
  const radiusY = preserveShape?.radiusY ?? radiusYRandom.value;
  const speedX = preserveShape?.speedX ?? speedXRandom.value;
  const speedY = preserveShape?.speedY ?? speedYRandom.value;
  const alpha = preserveShape?.alpha ?? alphaRandom.value;
  const lobeState = normalizeFogLobes(preserveShape?.lobes, next);
  next = lobeState.seed;

  const x = options.visibleBand
    ? clamp(
        viewportWidth * options.visibleBand.centerRatioX
          + (xRandom.value - 0.5) * (options.visibleBand.spreadX ?? viewportWidth * 0.18),
        radiusX * 0.55,
        viewportWidth - radiusX * 0.55
      )
    : preserveShape
    ? -radiusX - 8 - xRandom.value * 40
    : -radiusX + xRandom.value * (viewportWidth + radiusX * 2);

  return {
    seed: next,
    puff: {
      x,
      y: yRandom.value,
      radiusX,
      radiusY,
      speedX,
      speedY,
      alpha,
      lobes: lobeState.lobes
    }
  };
}

export function getFogPuffCount(viewportWidth: number, viewportHeight: number): number {
  const estimatedCount = Math.round(viewportWidth * viewportHeight * FOG_PUFF_DENSITY);

  return Math.min(FOG_PUFF_COUNT_MAX, Math.max(FOG_PUFF_COUNT_MIN, estimatedCount));
}

export function createFogDriftState(
  viewportWidth: number,
  viewportHeight: number,
  seed: number = Date.now()
): FogDriftState {
  const puffCount = getFogPuffCount(viewportWidth, viewportHeight);
  const guaranteedVisibleCount = Math.min(3, puffCount);
  const visibleBandRatios = [0.2, 0.5, 0.8];
  let next = seed >>> 0;
  const puffs: FogPuff[] = [];

  for (let index = 0; index < puffCount; index += 1) {
    const created = createFogPuff(next, viewportWidth, viewportHeight, index < guaranteedVisibleCount
      ? {
          visibleBand: {
            centerRatioX: visibleBandRatios[index] ?? 0.5,
            spreadX: viewportWidth * 0.16
          }
        }
      : undefined);
    next = created.seed;
    puffs.push(created.puff);
  }

  return {
    seed: next,
    puffs
  };
}

export function updateFogDriftState(
  state: FogDriftState,
  options: FogDriftUpdateOptions
): FogDriftState {
  const { delta, viewportWidth, viewportHeight } = options;
  const deltaScale = Math.max(delta, 0) / 1000;
  let nextSeed = state.seed;

  const puffs = state.puffs.map((puff) => {
    const nextPuff = {
      ...puff,
      x: puff.x + puff.speedX * deltaScale,
      y: puff.y + puff.speedY * deltaScale
    };

    if (nextPuff.y < -FOG_RESPAWN_VERTICAL_MARGIN) {
      nextPuff.y = viewportHeight + FOG_RESPAWN_VERTICAL_MARGIN;
    } else if (nextPuff.y > viewportHeight + FOG_RESPAWN_VERTICAL_MARGIN) {
      nextPuff.y = -FOG_RESPAWN_VERTICAL_MARGIN;
    }

    if (nextPuff.x - nextPuff.radiusX <= viewportWidth + 48) {
      return nextPuff;
    }

    const respawned = createFogPuff(nextSeed, viewportWidth, viewportHeight, {
      preserveShape: {
        radiusX: puff.radiusX,
        radiusY: puff.radiusY,
        speedX: puff.speedX,
        speedY: puff.speedY,
        alpha: puff.alpha,
        lobes: puff.lobes
      }
    });
    nextSeed = respawned.seed;

    return respawned.puff;
  });

  const ensuredCoverage = ensureFogCoverage(puffs, viewportWidth, viewportHeight, nextSeed);

  return {
    seed: ensuredCoverage.seed,
    puffs: ensuredCoverage.puffs
  };
}