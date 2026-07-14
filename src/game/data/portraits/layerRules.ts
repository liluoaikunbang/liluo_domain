import type {
  DialoguePortraitLayerData,
  PortraitMotionGroup,
  PortraitMotionPreset,
  PortraitLayerOption,
  PortraitLayerSet,
  PortraitLayerSource
} from './types';

export type DialoguePortraitLayerSource = PortraitLayerSource;
export type DialoguePortraitLayerSet = PortraitLayerSet;
export type DialoguePortraitLayerOption = PortraitLayerOption;

interface ParsedPortraitLayerSource extends PortraitLayerSource {
  fileName: string;
  layerOrder: number[];
}

const layerOrderPattern = /\((\d+(?:-\d+)*)\)(?=\.[^.]+$)/;
const fileExtensionPattern = /\.[^.]+$/;
const backLayerSuffix = '\u540e\u80cc';
const neckKeyword = '\u8116\u9888';
const ignoredBackLayerMatchKeywords = new Set([neckKeyword, 'upper']);

export const defaultPlayerPortraitLayerKeywords = [
  '\u7d20\u4f53-\u4e0b\u8eab-\u5e76\u817f',
  '\u7d20\u4f53-\u811a\u90e8-\u7ad9\u7acb',
  '\u7d20\u4f53-\u4e0a\u8eab',
  '\u901a\u7528-\u5934\u90e8-\u5934\u6a21',
  '\u8868\u60c5-\u57fa\u51c6\u8868\u60c5',
  '\u901a\u7528-\u5934\u90e8-\u9f50\u9888\u788e\u53d1\u77ed\u53d1'
] as const;

function getFileName(path: string): string {
  return path.split(/[\\/]/).pop() ?? path;
}

function getLayerAlt(fileName: string): string {
  return fileName.replace(layerOrderPattern, '').replace(fileExtensionPattern, '');
}

function isBackLayerFileName(fileName: string): boolean {
  return getLayerAlt(fileName).endsWith(`-${backLayerSuffix}`);
}

function getLayerKeywords(fileName: string): string[] {
  return getLayerAlt(fileName)
    .split('-')
    .map((keyword) => keyword.trim())
    .filter((keyword) => keyword && keyword !== backLayerSuffix && !ignoredBackLayerMatchKeywords.has(keyword));
}

function getBackLayerMatchKeywords(fileName: string): string[] {
  return getLayerKeywords(fileName)
    .map((keyword) => keyword.replace(new RegExp(`\\+${neckKeyword}$`), ''));
}

function getBackLayerMatchKey(fileName: string): string {
  return getBackLayerMatchKeywords(fileName).sort().join('|');
}

function hasExactKeywordSequence(fileName: string, keywordSequence: string): boolean {
  const candidateKeywords = getBackLayerMatchKeywords(fileName);
  const expectedKeywords = keywordSequence.split('-').filter(Boolean);

  if (expectedKeywords.length > candidateKeywords.length) {
    return false;
  }

  const isExactMatch = candidateKeywords.length === expectedKeywords.length
    && expectedKeywords.every((keyword, index) => candidateKeywords[index] === keyword);

  if (isExactMatch) {
    return true;
  }

  if (candidateKeywords[0] === expectedKeywords[0]) {
    return false;
  }

  const suffixStartIndex = candidateKeywords.length - expectedKeywords.length;
  return expectedKeywords.every((keyword, index) => candidateKeywords[suffixStartIndex + index] === keyword);
}

function parseLayerSource(source: PortraitLayerSource): ParsedPortraitLayerSource | null {
  const fileName = getFileName(source.path);
  const layerOrderMatch = fileName.match(layerOrderPattern);

  if (!layerOrderMatch) {
    return null;
  }

  return {
    ...source,
    fileName,
    layerOrder: layerOrderMatch[1].split('-').map((value) => Number(value))
  };
}

function compareLayerOrder(
  left: ParsedPortraitLayerSource,
  right: ParsedPortraitLayerSource
): number {
  const maxOrderLength = Math.max(left.layerOrder.length, right.layerOrder.length);

  for (let index = 0; index < maxOrderLength; index += 1) {
    const orderDiff = (left.layerOrder[index] ?? 0) - (right.layerOrder[index] ?? 0);

    if (orderDiff !== 0) {
      return orderDiff;
    }
  }

  return 0;
}

function hasEveryKeyword(fileName: string, keywords: ReadonlyArray<string>): boolean {
  return keywords.every((keyword) => fileName.includes(keyword));
}

function getStableLayerRank(source: ParsedPortraitLayerSource): number {
  const fileName = source.fileName;

  if (fileName.includes('\u7d20\u4f53-\u7d20\u4f53')) return 10;
  if (hasEveryKeyword(fileName, ['\u7d20\u4f53', '\u4e0b\u8eab'])) return 100;
  if (hasEveryKeyword(fileName, ['\u7d20\u4f53', '\u811a\u90e8'])) return 110;
  if (hasEveryKeyword(fileName, ['\u7d20\u4f53', '\u4e0a\u8eab'])) return 120;
  if (hasEveryKeyword(fileName, ['\u901a\u7528', '\u811a\u90e8'])) return 140;
  if (hasEveryKeyword(fileName, ['\u901a\u7528', '\u4e0b\u8eab'])) return 150;
  if (hasEveryKeyword(fileName, ['\u901a\u7528', '\u4e0a\u8eab'])) return 160;
  if (hasEveryKeyword(fileName, ['\u6346\u7ed1', '\u811a\u90e8'])) return 200;
  if (hasEveryKeyword(fileName, ['\u6346\u7ed1', '\u4e0b\u8eab'])) return 210;
  if (hasEveryKeyword(fileName, ['\u6346\u7ed1', '\u8fde\u4f53\u8863'])) return 220;
  if (hasEveryKeyword(fileName, ['\u6346\u7ed1', '\u4e0a\u8eab'])) return 230;
  if (hasEveryKeyword(fileName, ['\u901a\u7528', '\u5934\u90e8', '\u5934\u6a21'])) return 300;
  if (hasEveryKeyword(fileName, ['\u901a\u7528', '\u5934\u90e8', '\u8868\u60c5'])) return 320;
  if (hasEveryKeyword(fileName, ['\u901a\u7528', '\u5934\u90e8', '\u88c5\u9970'])) return 330;
  if (hasEveryKeyword(fileName, ['\u901a\u7528', '\u5934\u90e8'])) return 310;

  return 999;
}

function compareStableLayerOrder(
  left: ParsedPortraitLayerSource,
  right: ParsedPortraitLayerSource
): number {
  const rankDiff = getStableLayerRank(left) - getStableLayerRank(right);

  if (rankDiff !== 0) {
    return rankDiff;
  }

  const nameDiff = getLayerAlt(left.fileName).localeCompare(getLayerAlt(right.fileName), 'zh-Hans');

  if (nameDiff !== 0) {
    return nameDiff;
  }

  return compareLayerOrder(left, right);
}

function resolveLayerMotionGroup(fileName: string): PortraitMotionGroup {
  if (fileName.includes('\u6346\u7ed1')) return 'binding';
  if (hasEveryKeyword(fileName, ['\u901a\u7528', '\u5934\u90e8', '\u8868\u60c5'])) return 'expression';
  if (hasEveryKeyword(fileName, ['\u901a\u7528', '\u5934\u90e8', '\u88c5\u9970'])) return 'accessory';
  if (hasEveryKeyword(fileName, ['\u901a\u7528', '\u5934\u90e8']) && !fileName.includes('\u5934\u6a21')) return 'hair';
  if (fileName.includes('\u5934\u90e8')) return 'head';
  if (hasEveryKeyword(fileName, ['\u901a\u7528', '\u4e0a\u8eab'])) return 'upperClothing';
  if (hasEveryKeyword(fileName, ['\u901a\u7528', '\u4e0b\u8eab'])) return 'lowerClothing';
  if (fileName.includes('\u4e0a\u8eab')) return 'upperBody';
  if (fileName.includes('\u4e0b\u8eab')) return 'lowerBody';
  if (fileName.includes('\u811a\u90e8')) return 'feet';

  return 'base';
}

function resolveLayerMotionPreset(fileName: string, motionGroup: PortraitMotionGroup): PortraitMotionPreset {
  if (motionGroup === 'binding') {
    return fileName.includes('\u62d8\u675f\u8863') ? 'tightStruggle' : 'softStruggle';
  }

  if (motionGroup === 'hair') {
    return 'hairSway';
  }

  if (motionGroup === 'feet' || motionGroup === 'accessory') {
    return 'fixed';
  }

  return 'idle';
}

function selectLayerForKeyword(
  keyword: typeof defaultPlayerPortraitLayerKeywords[number],
  sources: ReadonlyArray<ParsedPortraitLayerSource>
): ParsedPortraitLayerSource | null {
  const candidates = sources
    .filter((source) => hasExactKeywordSequence(source.fileName, keyword) && !isBackLayerFileName(source.fileName))
    .sort(compareStableLayerOrder);

  if (!candidates.length) {
    return null;
  }

  return candidates[0];
}

function selectBackLayerForFrontLayer(
  frontLayer: ParsedPortraitLayerSource,
  sources: ReadonlyArray<ParsedPortraitLayerSource>
): ParsedPortraitLayerSource | null {
  const frontLayerBackMatchKey = getBackLayerMatchKey(frontLayer.fileName);

  return sources
    .filter((source) => {
      if (!isBackLayerFileName(source.fileName)) {
        return false;
      }

      return getBackLayerMatchKey(source.fileName) === frontLayerBackMatchKey;
    })
    .sort(compareStableLayerOrder)[0] ?? null;
}

function toPortraitLayerData(
  source: ParsedPortraitLayerSource,
  keyPrefix: string,
  index: number
): DialoguePortraitLayerData {
  const keywords = getBackLayerMatchKeywords(source.fileName);
  const motionGroup = resolveLayerMotionGroup(source.fileName);

  return {
    key: `${keyPrefix}_${index}`,
    src: source.src,
    alt: getLayerAlt(source.fileName),
    keywords,
    motionGroup,
    motionPreset: resolveLayerMotionPreset(source.fileName, motionGroup),
    zIndex: getStableLayerRank(source)
  };
}

export function resolveDefaultPlayerPortraitLayerSet(
  sources: ReadonlyArray<PortraitLayerSource>
): PortraitLayerSet {
  const parsedSources = sources.flatMap((source) => {
    const parsedSource = parseLayerSource(source);
    return parsedSource ? [parsedSource] : [];
  });

  const selectedSources = defaultPlayerPortraitLayerKeywords
    .map((keyword) => selectLayerForKeyword(keyword, parsedSources));

  if (selectedSources.some((source) => !source)) {
    return {
      layers: [],
      backLayers: []
    };
  }

  const frontSources = selectedSources
    .filter((source): source is ParsedPortraitLayerSource => Boolean(source))
    .sort(compareStableLayerOrder);
  const backSources = frontSources
    .flatMap((source) => {
      const backSource = selectBackLayerForFrontLayer(source, parsedSources);
      return backSource ? [backSource] : [];
    })
    .sort(compareStableLayerOrder);

  return {
    layers: frontSources.map((source, index) => toPortraitLayerData(
      source,
      'portrait_liluo_default_partial',
      index
    )),
    backLayers: backSources.map((source, index) => toPortraitLayerData(
      source,
      'portrait_liluo_default_back_partial',
      index
    ))
  };
}

export function resolveDefaultPlayerPortraitLayers(
  sources: ReadonlyArray<PortraitLayerSource>
): DialoguePortraitLayerData[] {
  return resolveDefaultPlayerPortraitLayerSet(sources).layers;
}

export function resolvePlayerPortraitLayerOptions(
  sources: ReadonlyArray<PortraitLayerSource>
): PortraitLayerOption[] {
  const parsedSources = sources.flatMap((source) => {
    const parsedSource = parseLayerSource(source);
    return parsedSource ? [parsedSource] : [];
  });

  return parsedSources
    .filter((source) => !isBackLayerFileName(source.fileName))
    .sort(compareStableLayerOrder)
    .map((source, index) => ({
      ...toPortraitLayerData(source, 'portrait_liluo_selectable_partial', index),
      keywords: getBackLayerMatchKeywords(source.fileName),
      hasBackLayer: Boolean(selectBackLayerForFrontLayer(source, parsedSources))
    }));
}

export function resolvePlayerPortraitBackLayersForLayers(
  sources: ReadonlyArray<PortraitLayerSource>,
  layers: ReadonlyArray<DialoguePortraitLayerData>
): DialoguePortraitLayerData[] {
  const selectedLayerAltSet = new Set(layers.map((layer) => layer.alt).filter(Boolean));
  const parsedSources = sources.flatMap((source) => {
    const parsedSource = parseLayerSource(source);
    return parsedSource ? [parsedSource] : [];
  });

  const frontSources = parsedSources
    .filter((source) => !isBackLayerFileName(source.fileName) && selectedLayerAltSet.has(getLayerAlt(source.fileName)))
    .sort(compareStableLayerOrder);
  const backSources = frontSources.flatMap((source) => {
    const backSource = selectBackLayerForFrontLayer(source, parsedSources);
    return backSource ? [backSource] : [];
  });
  const uniqueBackSources = Array.from(
    new Map(backSources.map((source) => [source.fileName, source])).values()
  ).sort(compareStableLayerOrder);

  return uniqueBackSources.map((source, index) => toPortraitLayerData(
    source,
    'portrait_liluo_selectable_back_partial',
    index
  ));
}
